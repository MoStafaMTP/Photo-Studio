// Manual cutouts use semantic segmentation. Listing's sizing analysis stays separate.
// Inference and matting run locally in a worker; photos never leave the browser.
(() => {
  const config = {
    runtime: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.min.js',
    wasm: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/',
    model: 'https://huggingface.co/skillsafe-ai/isnet-general-use/resolve/63a3042f10276918a44e1a3f397440a7107ee398/isnet-general-use.onnx',
    sha256: '60920e99c45464f2ba57bee2ad08c919a52bbf852739e96947fbb4358c0d964a',
    bytes: 178648008
  };
  let worker, pending, serial = 0;
  const results = new WeakMap();
  function workerMain() {
    let session, settings;
    const report = text => postMessage({progress: text});
    async function modelBytes() {
      let db;
      try {
        db = await new Promise((resolve, reject) => {
          const request = indexedDB.open('photo-studio-ai', 1);
          request.onupgradeneeded = () => request.result.createObjectStore('models');
          request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
        });
        const cached = await new Promise((resolve, reject) => {
          const request = db.transaction('models').objectStore('models').get(settings.sha256);
          request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
        });
        if (cached?.byteLength === settings.bytes) { db.close(); return cached; }
      } catch { /* Storage may be disabled or full; this session can still work. */ }
      try {
        report('Downloading background-removal model (170 MB, saved for next time)…');
        const response = await fetch(settings.model, {credentials: 'omit', referrerPolicy: 'no-referrer'});
        if (!response.ok) throw new Error('The background-removal model could not be downloaded. Check your connection and try again.');
        const bytes = new Uint8Array(settings.bytes), reader = response.body.getReader(); let offset = 0, last = -1;
        for (;;) {
          const {done, value} = await reader.read(); if (done) break;
          if (offset + value.length > bytes.length) throw new Error('The downloaded model has an unexpected size.');
          bytes.set(value, offset); offset += value.length;
          const percent = Math.floor(offset / bytes.length * 100);
          if (percent !== last) { last = percent; report(`Downloading background-removal model… ${percent}% (170 MB)`); }
        }
        if (offset !== bytes.length) throw new Error('The model download was interrupted. Please try again.');
        if (!crypto.subtle) throw new Error('AI background removal needs HTTPS or a local web server (localhost).');
        const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2, '0')).join('');
        if (hash !== settings.sha256) throw new Error('The downloaded model failed its integrity check. Please try again.');
        if (db) try {
          await new Promise((resolve, reject) => {
            const tx = db.transaction('models', 'readwrite'); tx.objectStore('models').put(bytes.buffer, settings.sha256);
            tx.oncomplete = resolve; tx.onerror = tx.onabort = () => reject(tx.error);
          });
        } catch { /* Cache is optional. */ }
        return bytes.buffer;
      } finally { db?.close(); }
    }
    // Linear-time box means for the guided filter (not a blur of the product).
    function boxMean(values, w, h, radius) {
      const temp = new Float32Array(values.length), out = new Float32Array(values.length);
      for (let y = 0; y < h; y++) {
        let sum = 0; for (let x = 0; x <= Math.min(radius, w - 1); x++) sum += values[y * w + x];
        for (let x = 0; x < w; x++) {
          temp[y * w + x] = sum / (Math.min(w - 1, x + radius) - Math.max(0, x - radius) + 1);
          if (x - radius >= 0) sum -= values[y * w + x - radius];
          if (x + radius + 1 < w) sum += values[y * w + x + radius + 1];
        }
      }
      for (let x = 0; x < w; x++) {
        let sum = 0; for (let y = 0; y <= Math.min(radius, h - 1); y++) sum += temp[y * w + x];
        for (let y = 0; y < h; y++) {
          out[y * w + x] = sum / (Math.min(h - 1, y + radius) - Math.max(0, y - radius) + 1);
          if (y - radius >= 0) sum -= temp[(y - radius) * w + x];
          if (y + radius + 1 < h) sum += temp[(y + radius + 1) * w + x];
        }
      }
      return out;
    }
    function refineMatte(pixels, mask) {
      const {width: w, height: h, data} = pixels, n = w * h;
      const guide = new Float32Array(n), alpha = new Float32Array(n), square = new Float32Array(n), product = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        guide[i] = (.2126 * data[i * 4] + .7152 * data[i * 4 + 1] + .0722 * data[i * 4 + 2]) / 255;
        alpha[i] = mask[i * 4] / 255; square[i] = guide[i] ** 2; product[i] = guide[i] * alpha[i];
      }
      const radius = Math.max(2, Math.min(5, Math.round(Math.max(w, h) / 500)));
      const meanI = boxMean(guide, w, h, radius), meanP = boxMean(alpha, w, h, radius);
      const corrI = boxMean(square, w, h, radius), corrIP = boxMean(product, w, h, radius);
      for (let i = 0; i < n; i++) {
        square[i] = (corrIP[i] - meanI[i] * meanP[i]) / (Math.max(0, corrI[i] - meanI[i] ** 2) + .0001);
        product[i] = meanP[i] - square[i] * meanI[i];
      }
      const a = boxMean(square, w, h, radius), b = boxMean(product, w, h, radius);
      for (let i = 0; i < n; i++) {
        // Keep confident interiors and existing transparency. Never binarize the contour.
        const value = alpha[i] > .995 ? 1 : alpha[i] < .005 ? 0 : Math.max(0, Math.min(1, a[i] * guide[i] + b[i]));
        alpha[i] = Math.max(0, Math.min(1, (value - .01) / .98));
      }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, opacity = alpha[i];
        // Remove color spill only at uncertain contour pixels, using nearby known
        // background and foreground. Interior product colors are never keyed out.
        if (opacity > .03 && opacity < .97) {
          let fg = -1, bg = -1, fd = Infinity, bd = Infinity;
          for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
            const xx = x + dx, yy = y + dy, d = dx * dx + dy * dy;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            const j = yy * w + xx;
            if (alpha[j] > .99 && d < fd) { fd = d; fg = j * 4; }
            if (alpha[j] < .01 && d < bd) { bd = d; bg = j * 4; }
          }
          if (fg >= 0 && bg >= 0) for (let k = 0; k < 3; k++) {
            const recovered = (data[i * 4 + k] - (1 - opacity) * data[bg + k]) / opacity;
            data[i * 4 + k] = Math.max(data[fg + k] - 20, Math.min(data[fg + k] + 20, recovered));
          }
        }
      }
      for (let i = 0; i < n; i++) data[i * 4 + 3] = Math.round(data[i * 4 + 3] * alpha[i]);
      return pixels;
    }
    onmessage = async ({data: {id, bitmap, config}}) => {
      settings = config;
      try {
        const w = bitmap.width, h = bitmap.height, original = new OffscreenCanvas(w, h), context = original.getContext('2d', {willReadFrequently: true});
        context.drawImage(bitmap, 0, 0); bitmap.close();
        const pixels = context.getImageData(0, 0, w, h);
        let transparentBorder = 0, border = 0;
        for (let x = 0; x < w; x++) for (const y of [0, h - 1]) { border++; if (pixels.data[(y * w + x) * 4 + 3] < 8) transparentBorder++; }
        for (let y = 1; y < h - 1; y++) for (const x of [0, w - 1]) { border++; if (pixels.data[(y * w + x) * 4 + 3] < 8) transparentBorder++; }
        if (transparentBorder / border < .95) {
          if (!session) {
            report('Loading background-removal engine…');
            importScripts(settings.runtime);
            ort.env.wasm.wasmPaths = settings.wasm; ort.env.wasm.numThreads = 1;
            const bytes = await modelBytes(); report('Preparing background-removal engine…');
            session = await ort.InferenceSession.create(bytes, {executionProviders: ['wasm'], graphOptimizationLevel: 'all'});
          }
          report('Detecting the product and fine edges…');
          const size = 1024, n = size * size, small = new OffscreenCanvas(size, size), smallCtx = small.getContext('2d', {willReadFrequently: true});
          smallCtx.fillStyle = '#fff'; smallCtx.fillRect(0, 0, size, size); smallCtx.imageSmoothingQuality = 'high'; smallCtx.drawImage(original, 0, 0, size, size);
          const rgba = smallCtx.getImageData(0, 0, size, size).data, input = new Float32Array(n * 3); let max = 1;
          for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) max = Math.max(max, rgba[i * 4 + k]);
          for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) input[k * n + i] = rgba[i * 4 + k] / max - .5;
          const tensor = new ort.Tensor('float32', input, [1, 3, size, size]);
          let outputs;
          try {
            outputs = await session.run({[session.inputNames[0]]: tensor}, [session.outputNames[0]]);
            const mask = outputs[session.outputNames[0]].data; let lo = Infinity, hi = -Infinity;
            for (const v of mask) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
            if (!Number.isFinite(hi - lo) || hi - lo < .01) throw new Error('No clear product could be detected. The original image has been kept.');
            const matte = smallCtx.createImageData(size, size);
            for (let i = 0; i < n; i++) { matte.data[i * 4] = matte.data[i * 4 + 1] = matte.data[i * 4 + 2] = 255 * (mask[i] - lo) / (hi - lo); matte.data[i * 4 + 3] = 255; }
            smallCtx.putImageData(matte, 0, 0);
            report('Refining edges at original resolution…');
            context.imageSmoothingQuality = 'high'; context.drawImage(small, 0, 0, w, h);
            refineMatte(pixels, context.getImageData(0, 0, w, h).data);
          } finally { tensor.dispose(); if (outputs) Object.values(outputs).forEach(output => output.dispose()); }
        }
        postMessage({id, width: w, height: h, pixels: pixels.data.buffer}, [pixels.data.buffer]);
      } catch (error) { postMessage({id, error: error.message || 'Background removal failed. Try again after reloading the page.'}); }
    };
  }
  function stop(error = new DOMException('Background removal canceled.', 'AbortError')) {
    worker?.terminate(); worker = null;
    if (pending) { const task = pending; pending = null; task.reject(error); }
  }
  function getWorker() {
    if (worker) return worker;
    const url = URL.createObjectURL(new Blob([`(${workerMain.toString()})()`], {type: 'text/javascript'}));
    try { worker = new Worker(url); } finally { URL.revokeObjectURL(url); }
    worker.onmessage = ({data}) => {
      if (data.progress) { pending?.progress?.(data.progress); return; }
      if (!pending || pending.id !== data.id) return;
      const task = pending; pending = null;
      if (data.error) { worker.terminate(); worker = null; task.reject(new Error(data.error)); }
      else {
        try {
          const canvas = document.createElement('canvas'); canvas.width = data.width; canvas.height = data.height;
          canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data.pixels), data.width, data.height), 0, 0);
          task.resolve(canvas);
        } catch { task.reject(new Error('There is not enough memory to create the cutout. Try a smaller batch or reload the page.')); }
      }
    };
    worker.onerror = () => stop(new Error('The AI engine could not run. Check your connection and available memory, then try again.'));
    return worker;
  }
  globalThis.PhotoStudioBackground = {
    async remove(source, {signal, onProgress} = {}) {
      if (signal?.aborted) throw new DOMException('Background removal canceled.', 'AbortError');
      if (results.has(source)) return results.get(source);
      if (pending) throw new Error('Background removal is already running.');
      const bitmap = await createImageBitmap(source);
      if (signal?.aborted) { bitmap.close(); throw new DOMException('Background removal canceled.', 'AbortError'); }
      const cancel = () => stop(); signal?.addEventListener('abort', cancel, {once: true});
      try {
        const engine = getWorker(), id = ++serial;
        const result = await new Promise((resolve, reject) => { pending = {id, resolve, reject, progress: onProgress}; engine.postMessage({id, bitmap, config}, [bitmap]); });
        results.set(source, result); return result;
      } catch (error) { stop(error); throw error; }
      finally { signal?.removeEventListener('abort', cancel); bitmap.close(); }
    },
    dispose: stop
  };
})();
