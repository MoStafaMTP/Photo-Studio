// Decode Canon RAW sources locally before handing them to the existing editor.
(() => {
  const base = new URL('.', document.currentScript.src);
  const decoded = new WeakMap();
  let runtimePromise, worker, job, sequence = 0, importing = false;
  const rawTypes = new Set(['image/x-canon-cr2', 'image/x-canon-cr3', 'image/cr2', 'image/cr3', 'image/x-cr2', 'image/x-cr3']);
  const isRaw = file => /\.cr[23]$/i.test(file?.name || '') || rawTypes.has(file?.type?.toLowerCase());
  const supports = file => Boolean(file && typeof file.arrayBuffer === 'function' && (isRaw(file) || file.type?.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name)));
  function abortable(promise, signal) {
    if (!signal) return promise;
    return new Promise((resolve, reject) => {
      const cancel = () => reject(new DOMException('RAW import canceled.', 'AbortError'));
      if (signal.aborted) { cancel(); return; }
      signal.addEventListener('abort', cancel, {once: true});
      promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', cancel));
    });
  }
  function loadRuntime() {
    if (globalThis.PhotoStudioRawRuntime) return Promise.resolve(PhotoStudioRawRuntime);
    if (!runtimePromise) runtimePromise = new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = new URL('vendor/libraw/raw-runtime.js', base).href;
      script.onload = () => globalThis.PhotoStudioRawRuntime ? resolve(PhotoStudioRawRuntime) : reject(new Error('The RAW decoder did not load.'));
      script.onerror = () => { script.remove(); reject(new Error('The RAW decoder could not load. Reload the application and try again.')); };
      document.head.append(script);
    }).catch(error => { runtimePromise = null; throw error; });
    return runtimePromise;
  }
  function rawWorkerMain(factory) {
    let module;
    const message = text => postMessage({progress: text});
    onmessage = async ({data: {id, bytes, wasm}}) => {
      let raw = 0, input = 0, errorPtr = 0, resultPtr = 0;
      const stringAt = ptr => { let end = ptr; while (module.HEAPU8[end]) end++; return new TextDecoder().decode(module.HEAPU8.subarray(ptr, end)); };
      const check = code => { if (code) throw new Error(stringAt(module._libraw_strerror(code))); };
      try {
        module ||= await factory({wasmBinary: new Uint8Array(wasm), locateFile: name => name, print: () => {}, printErr: () => {}});
        message('Reading RAW sensor data…');
        raw = module._libraw_init(0); input = module._malloc(bytes.byteLength);
        if (!raw || !input) throw new Error('Not enough memory to open this RAW image.');
        module.HEAPU8.set(new Uint8Array(bytes), input);
        check(module._libraw_open_buffer(raw, input, bytes.byteLength));
        module._libraw_set_use_camera_wb(raw, 1);
        module._libraw_set_output_color(raw, 1); // sRGB
        module._libraw_set_output_bps(raw, 8);
        module._libraw_set_half_size(raw, 0); // Keep full source resolution.
        module._libraw_set_gamma(raw, 0, 1 / 2.4); module._libraw_set_gamma(raw, 1, 12.92);
        module._libraw_set_demosaic(raw, 3);
        check(module._libraw_unpack(raw));
        message('Developing the photo at full resolution…');
        check(module._libraw_dcraw_process(raw));
        errorPtr = module._malloc(4); if (!errorPtr) throw new Error('Not enough memory to render this RAW image.');
        new DataView(module.HEAPU8.buffer).setInt32(errorPtr, 0, true);
        resultPtr = module._libraw_dcraw_make_mem_image(raw, errorPtr);
        if (!resultPtr) {
          check(new DataView(module.HEAPU8.buffer).getInt32(errorPtr, true));
          throw new Error('The RAW decoder did not return an image.');
        }
        // libraw_processed_image_t ABI from the pinned build (16-byte header).
        const view = new DataView(module.HEAPU8.buffer, resultPtr, 16);
        const type = view.getUint32(0, true), height = view.getUint16(4, true), width = view.getUint16(6, true);
        const colors = view.getUint16(8, true), bits = view.getUint16(10, true), length = view.getUint32(12, true);
        if (type !== 2 || bits !== 8 || ![1, 3, 4].includes(colors) || !width || !height || length !== width * height * colors) throw new Error('The RAW decoder returned an unsupported pixel layout.');
        const rgb = module.HEAPU8.subarray(resultPtr + 16, resultPtr + 16 + length), rgba = new Uint8ClampedArray(width * height * 4);
        for (let pixel = 0; pixel < width * height; pixel++) {
          const from = pixel * colors, to = pixel * 4;
          rgba[to] = rgb[from]; rgba[to + 1] = rgb[from + (colors === 1 ? 0 : 1)]; rgba[to + 2] = rgb[from + (colors === 1 ? 0 : 2)]; rgba[to + 3] = 255;
        }
        const version = stringAt(module._libraw_version());
        module._libraw_dcraw_clear_mem(resultPtr); resultPtr = 0;
        module._libraw_close(raw); raw = 0; module._free(input); input = 0;
        message('Preparing the image for editing…');
        const canvas = new OffscreenCanvas(width, height);
        canvas.getContext('2d').putImageData(new ImageData(rgba, width, height), 0, 0);
        const blob = await canvas.convertToBlob({type: 'image/png'});
        postMessage({id, blob, width, height, version});
      } catch (error) { postMessage({id, error: error.message || 'This RAW image could not be decoded.'}); }
      finally {
        if (resultPtr) module._libraw_dcraw_clear_mem(resultPtr);
        if (errorPtr) module._free(errorPtr);
        if (raw) module._libraw_close(raw);
        if (input) module._free(input);
      }
    };
  }
  function dispose(error = new DOMException('RAW import canceled.', 'AbortError')) {
    worker?.terminate(); worker = null;
    if (job) { const current = job; job = null; current.reject(error); }
  }
  async function decode(file, {signal, onProgress} = {}) {
    if (!isRaw(file)) return file;
    if (signal?.aborted) throw new DOMException('RAW import canceled.', 'AbortError');
    if (decoded.has(file)) return decoded.get(file);
    if (job) throw new Error('Wait for the current RAW image to finish loading.');
    onProgress?.('Loading RAW decoder…');
    const runtime = await abortable(loadRuntime(), signal), bytes = await abortable(file.arrayBuffer(), signal);
    if (signal?.aborted) throw new DOMException('RAW import canceled.', 'AbortError');
    const cancel = () => dispose(); signal?.addEventListener('abort', cancel, {once: true});
    try {
      let wasm;
      if (!worker) {
        const url = URL.createObjectURL(new Blob([`(${rawWorkerMain.toString()})(${runtime.factory.toString()})`], {type: 'text/javascript'}));
        try { worker = new Worker(url); } finally { URL.revokeObjectURL(url); }
        wasm = Uint8Array.from(atob(runtime.wasm), char => char.charCodeAt(0)).buffer;
        worker.onmessage = ({data}) => {
          if (data.progress) { job?.progress?.(data.progress); return; }
          if (!job || job.id !== data.id) return;
          const current = job; job = null;
          if (data.error) { dispose(); current.reject(new Error(data.error)); }
          else current.resolve(data.blob);
        };
        worker.onerror = event => { event.preventDefault(); dispose(new Error('The RAW decoder could not run. The file may be damaged or too large for available memory.')); };
      }
      const id = ++sequence;
      const blob = await new Promise((resolve, reject) => { job = {id, resolve, reject, progress: onProgress}; worker.postMessage({id, bytes, wasm}, wasm ? [bytes, wasm] : [bytes]); });
      decoded.set(file, blob); return blob;
    } catch (error) { dispose(error); throw error; }
    finally { signal?.removeEventListener('abort', cancel); }
  }
  async function prepare(fileList) {
    if (importing) throw new Error('Wait for the current RAW import to finish.');
    const candidates = [...fileList].filter(supports), rejected = [...fileList].filter(file => !supports(file));
    const errors = rejected.map(file => ({name: file.name, reason: 'Unsupported image format.'}));
    if (!candidates.some(isRaw)) return {files: candidates, errors, canceled: false};
    const dialog = document.createElement('dialog'); dialog.className = 'background-progress raw-import-progress';
    dialog.setAttribute('aria-labelledby', 'raw-import-title');
    dialog.innerHTML = '<h2 id="raw-import-title">Opening RAW images</h2><p class="raw-import-name"></p><p class="background-progress-detail" role="status" aria-live="polite"></p><p class="background-progress-count">Photos stay on this device</p><button type="button" autofocus>Cancel</button>';
    const controller = new AbortController(), name = dialog.querySelector('.raw-import-name'), detail = dialog.querySelector('.background-progress-detail');
    dialog.querySelector('button').onclick = () => controller.abort();
    dialog.addEventListener('cancel', event => { event.preventDefault(); controller.abort(); });
    const blockKeys = event => { if (!['Escape', 'Tab', 'Enter', ' '].includes(event.key)) event.preventDefault(); event.stopImmediatePropagation(); };
    const focused = document.activeElement; importing = true; window.addEventListener('keydown', blockKeys, true); document.body.append(dialog); dialog.showModal();
    try {
      const ready = [];
      for (let i = 0; i < candidates.length; i++) {
        const file = candidates[i]; name.textContent = `${i + 1} / ${candidates.length} · ${file.name}`;
        try { await decode(file, {signal: controller.signal, onProgress: text => { detail.textContent = text; }}); ready.push(file); }
        catch (error) {
          if (error.name === 'AbortError') return {files: [], errors: [], canceled: true};
          errors.push({name: file.name, reason: error.message});
        }
      }
      return controller.signal.aborted ? {files: [], errors: [], canceled: true} : {files: ready, errors, canceled: false};
    } finally {
      dispose(); importing = false; dialog.close(); dialog.remove(); window.removeEventListener('keydown', blockKeys, true);
      if (focused?.isConnected) focused.focus({preventScroll: true});
    }
  }
  globalThis.PhotoStudioImageInput = {
    isRaw, supports, decode, prepare, dispose,
    get busy() { return importing; },
    source: file => decoded.get(file) || file,
    inherit(source, target) { if (decoded.has(source)) decoded.set(target, decoded.get(source)); },
    accept: 'image/jpeg,image/png,image/webp,.cr2,.cr3,image/x-canon-cr2,image/x-canon-cr3'
  };
})();
