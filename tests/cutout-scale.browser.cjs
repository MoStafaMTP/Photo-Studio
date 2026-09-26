const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {}),
    args: ['--allow-file-access-from-files']});
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    const checks = await page.evaluate(async () => {
      await historyReady;
      const checks = []; window.cutoutChecks = checks;
      const check = (name, condition) => { if (!condition) throw Error(name); checks.push(name); };
      const near = (a, b) => Math.abs(a - b) < .00001;
      const equalRect = (a, b) => ['x', 'y', 'width', 'height'].every(key => near(a[key], b[key]));
      const makeCanvas = (width, height) => { const c = document.createElement('canvas'); c.width = width; c.height = height; return c; };
      const pixel = (c, x, y) => [...c.getContext('2d').getImageData(x, y, 1, 1).data];
      const file = async (c, name) => new File([await new Promise(resolve => c.toBlob(resolve))], name, {type: 'image/png'});
      const source = makeCanvas(96, 96), c = source.getContext('2d');
      c.fillStyle = '#fff'; c.fillRect(0, 0, 96, 96);
      c.fillStyle = '#606060'; c.fillRect(16, 16, 64, 64); // One-pixel matte fringe.
      c.fillStyle = '#a00000'; c.fillRect(17, 17, 62, 62);
      const area = {canvasWidth: 1576, canvasHeight: 1576, topMargin: 100, bottomMargin: 100};
      const prepared = createSmartPreparation(source, area);
      for (const [name, cutout] of [['Manual', createBackgroundRemovedSource(source)], ['Workflow', prepared.foreground]]) {
        check(`${name}: all four one-pixel fringe edges are fully transparent`, [[16, 48], [79, 48], [48, 16], [48, 79]].every(([x, y]) => pixel(cutout, x, y)[3] === 0));
        check(`${name}: a gradual inner transition replaces the hard edge`, pixel(cutout, 17, 48)[3] > 0 && pixel(cutout, 17, 48)[3] < pixel(cutout, 18, 48)[3] && pixel(cutout, 18, 48)[3] < 255 && pixel(cutout, 19, 48)[3] === 255);
        check(`${name}: interior color and canvas dimensions are unchanged`, pixel(cutout, 48, 48).join() === '160,0,0,255' && cutout.width === 96 && cutout.height === 96);
        check(`${name}: feathering cannot spread back into the removed background`, pixel(cutout, 15, 48)[3] === 0 && pixel(cutout, 0, 0)[3] === 0);
      }
      check('Workflow retains the pre-trim placement bounds', prepared.bounds.x === 16 && prepared.bounds.y === 16 && prepared.bounds.width === 64 && prepared.bounds.height === 64);
      const transparent = makeCanvas(96, 96), t = transparent.getContext('2d');
      t.fillStyle = '#000'; t.fillRect(16, 16, 64, 64);
      const transparentResult = createBackgroundRemovedSource(transparent);
      check('Black products on transparent PNGs are preserved', pixel(transparentResult, 48, 48).join() === '0,0,0,255' && pixel(transparentResult, 16, 48)[3] === 0);
      const curved = makeCanvas(96, 96), cc = curved.getContext('2d');
      cc.fillStyle = '#fff'; cc.fillRect(0, 0, 96, 96); cc.fillStyle = '#a00000'; cc.beginPath(); cc.arc(48.3, 48.3, 31.7, 0, Math.PI * 2); cc.fill();
      const curvedPixels = createBackgroundRemovedSource(curved).getContext('2d').getImageData(0, 0, 96, 96).data;
      const alphaLevels = new Set(); for (let i = 3; i < curvedPixels.length; i += 4) if (curvedPixels[i] > 0 && curvedPixels[i] < 255) alphaLevels.add(curvedPixels[i]);
      // The connected mask preserves interior alpha instead of applying a global
      // color-key gradient; verify several fractional levels at the contour.
      check('Curved silhouettes have multiple antialiased alpha levels', alphaLevels.size >= 5);
      const full = makeCanvas(2000, 1800), fc = full.getContext('2d');
      fc.fillStyle = '#fff'; fc.fillRect(0, 0, 2000, 1800); fc.fillStyle = '#606060'; fc.fillRect(400, 300, 1200, 1200);
      fc.fillStyle = '#900'; fc.fillRect(401, 301, 1198, 1198);
      for (let x = 800; x < 900; x++) { fc.fillStyle = x % 2 ? '#123456' : '#789abc'; fc.fillRect(x, 800, 1, 100); }
      const native = createSmartPreparation(full, area);
      check('Large workflow cutouts retain full source resolution', native.foreground.width === 2000 && native.foreground.height === 1800 && native.analysisSize.width === 1600);
      check('One-pixel interior texture is preserved without downsampling', Array.from({length: 100}, (_, i) => 800 + i).every(x => pixel(native.foreground, x, 840).join() === pixel(full, x, 840).join()));
      check('High-resolution bounds map back to native coordinates', native.bounds.x === 400 && native.bounds.y === 300 && native.bounds.width === 1200 && native.bounds.height === 1200);
      check('Native-resolution edge cleanup also removes the one-pixel fringe on large images', [[400, 900], [1599, 900], [1000, 300], [1000, 1499]].every(([x, y]) => pixel(native.foreground, x, y)[3] === 0));
      const fallback = makeCanvas(1800, 1700); fallback.getContext('2d').fillRect(0, 0, 1800, 1700);
      const fallbackPrep = createSmartPreparation(fallback, area);
      check('Uncertain separation preserves the full-resolution fallback unchanged', fallbackPrep.mode === 'fallback' && fallbackPrep.foreground.width === 1800 && pixel(fallbackPrep.foreground, 0, 0)[3] === 255);

      listingAutoPrompted = true;
      const baseFile = await file(source, 'DT.png'), [item] = addImages([baseFile]); await item.image.decode(); selectImage(files.indexOf(item));
      const square = makeCanvas(1576, 1576); square.getContext('2d').fillRect(0, 0, 1576, 1576);
      const dropFile = await file(square, 'dropped.png'), transfer = new DataTransfer(); transfer.items.add(dropFile);
      window.expectedDropCount = item.layers.length + 1;
      layerDropZone.dispatchEvent(new DragEvent('drop', {bubbles: true, cancelable: true, dataTransfer: transfer}));
      await new Promise((resolve, reject) => {
        let attempts = 0; const poll = () => { if (item.layers.length === window.expectedDropCount) resolve(); else if (++attempts > 200) reject(Error('Layer drop did not finish')); else setTimeout(poll, 10); }; poll();
      });
      const dropped = item.layers.at(-1), rect = getAddedLayerDrawRect(dropped);
      check('Dropping a 1576px square at 100% fills the 1576px canvas', rect.width === 1576 && rect.height === 1576 && dropped.scale === 100 && imageScaleValue.value === '100');
      check('Drop stays in Layers and centers the imported image', files.length === 1 && rect.x === 788 && rect.y === 788 && selectedLayerIds.has(dropped.id));
      imageScaleValue.value = '50'; imageScaleValue.dispatchEvent(new Event('input', {bubbles: true}));
      check('50% in the numeric field renders exactly half of the canvas fit', getAddedLayerDrawRect(dropped).width === 788 && imageScale.value === '50');
      undo(); check('Undo restores imported layer scale and displayed value together', getAddedLayerDrawRect(dropped).width === 1576 && imageScaleValue.value === '100');
      redo(); check('Redo restores the half-size layer and displayed value together', getAddedLayerDrawRect(dropped).width === 788 && imageScaleValue.value === '50');
      applyImageScale(350); check('Added layers above 300% display their actual editable value', imageScaleValue.value === '350' && imageScale.value === '350' && getAddedLayerDrawRect(dropped).width === 1576 * 3.5);
      applyImageScale(100); canvasWrap.dispatchEvent(new WheelEvent('wheel', {deltaY: -10, bubbles: true, cancelable: true})); canvasWrap.dispatchEvent(new WheelEvent('wheel', {deltaY: -10, bubbles: true, cancelable: true}));
      check('Fractional wheel scales are visible instead of being rounded to whole percentages', imageScaleValue.value === '102.01' && near(getAddedLayerDrawRect(dropped).width, 1576 * 1.0201));
      const beforeFast = dropped.scale; canvasWrap.dispatchEvent(new WheelEvent('wheel', {deltaY: -10, shiftKey: true, bubbles: true, cancelable: true}));
      check('Shift+wheel still scales faster', near(dropped.scale, beforeFast * 1.05));
      const beforeCopy = getAddedLayerDrawRect(dropped); duplicateSelectedLayers();
      check('Imported-layer duplicates keep exact dimensions and percentage', near(getAddedLayerDrawRect(item.layers.at(-1)).width, beforeCopy.width) && item.layers.at(-1).scale === dropped.scale);
      const portrait = makeCanvas(400, 800); portrait.getContext('2d').fillRect(0, 0, 400, 800);
      await addLayerImages([await file(portrait, 'portrait.png')]); const p = item.layers.at(-1);
      check('Non-square layer imports fit proportionally at 100%', getAddedLayerDrawRect(p).height === 1576 && getAddedLayerDrawRect(p).width === 788 && imageScaleValue.value === '100');
      await addLayerImages([await file(source, 'DOPTcv.png')]); const cv = item.layers.at(-1);
      toggleSelectedLayerBackgrounds(); applyImageScale(50);
      check('Close View layers retain native dimensions and background protection', getAddedLayerDrawRect(cv).width === 96 && cv.scale === 100 && !cv.removeBg && getAddedLayerSource(cv) === cv.image);
      selectedLayerIds = new Set(['base']); item.layers = []; item.layerOrder = ['base'];
      item.smartPrep = createSmartPreparation(item.image, area); item.watermarkEnabled = false; item.originalSize = false; drawActive();
      const beforeRemove = getBaseLayerRect(item); toggleSelectedLayerBackgrounds();
      check('Trimmed workflow cutouts still preserve size and position on Remove BG', equalRect(beforeRemove, getBaseLayerRect(item)));
      toggleSelectedLayerBackgrounds(); check('Restoring the background preserves the same layout', equalRect(beforeRemove, getBaseLayerRect(item)));
      item.smartPrep = null; item.removeBg = true; item.processed = null; item.scale = 100; item.originalSize = true;
      resizeWidth.value = resizeHeight.value = 360; backgroundMode = 'none'; exportFormat.value = 'png'; drawActive();
      const output = await createImageBitmap(await createExportBlob(item, 'png')), exported = makeCanvas(360, 360); exported.getContext('2d').drawImage(output, 0, 0); output.close();
      check('PNG export retains the trimmed edge and gradual inner transition', pixel(exported, 148, 180)[3] === 0 && pixel(exported, 149, 180)[3] > 0 && pixel(exported, 149, 180)[3] < pixel(exported, 150, 180)[3] && pixel(exported, 150, 180)[3] < 255 && pixel(exported, 151, 180)[3] === 255);
      check('Preview and export enable high-quality image resampling', ctx.imageSmoothingEnabled && ctx.imageSmoothingQuality === 'high');
      return checks;
    });
    if (errors.length) throw Error(errors.join('; '));
    console.log(JSON.stringify({passed: checks.length, checks, errors}, null, 2));
  } catch (error) {
    console.error(error); console.error(await page.evaluate(() => window.cutoutChecks || [])); process.exitCode = 1;
  } finally { await browser.close(); }
})();
