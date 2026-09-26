const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {}), args: ['--allow-file-access-from-files']});
  const page = await browser.newPage({viewport: {width: 1600, height: 1000}}), checks = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const check = async (name, test) => { if (!await page.evaluate(test)) throw Error(name); checks.push(name); };
  try {
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.evaluate(async () => {
      await historyReady; listingAutoPrompted = true;
      const c = document.createElement('canvas'); c.width = c.height = 160; const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 160, 160); ctx.fillStyle = '#254874'; ctx.fillRect(30, 30, 100, 100);
      const blob = await new Promise(resolve => c.toBlob(resolve));
      const items = addImages(['product.png', 'second.png', 'DOPTcv.png'].map(name => new File([blob], name, {type: 'image/png'})));
      await Promise.all(items.map(item => item.image.decode())); selectImage(0); checkpointHistory();
      window.baselineHistory = undoStack.length; window.inferenceCalls = 0; window.rejectAt = Infinity;
      window.installDeferredRemoval = () => {
        PhotoStudioBackground.remove = (source, {signal, onProgress}) => new Promise((resolve, reject) => {
          inferenceCalls++; onProgress('Test inference in progress');
          window.finishRemoval = () => inferenceCalls === rejectAt ? reject(new Error('Test model failure')) : resolve(createBackgroundRemovedSource(source));
          signal.addEventListener('abort', () => reject(new DOMException('Canceled', 'AbortError')), {once: true});
        });
      };
      installDeferredRemoval();
    });
    await page.locator('#remove-bg').click();
    await check('Shows a cancelable modal while preserving current image and Undo stack', () => backgroundRemovalBusy && document.querySelector('.background-progress').open && !files[0].removeBg && undoStack.length === baselineHistory);
    await page.keyboard.press('Control+b'); await page.keyboard.press('Delete'); await page.keyboard.press('Control+z');
    await check('Editing shortcuts cannot alter layers during inference', () => files.length === 3 && !files[0].removeBg && inferenceCalls === 1 && undoStack.length === baselineHistory);
    await page.getByRole('button', {name: 'Cancel', exact: true}).click(); await page.waitForFunction(() => !backgroundRemovalBusy);
    await check('Cancel leaves original pixels, flags and history untouched', () => !files[0].removeBg && !files[0].processed && undoStack.length === baselineHistory && !document.querySelector('.background-progress'));
    await page.locator('#remove-bg').click(); await page.evaluate(() => finishRemoval()); await page.waitForFunction(() => !backgroundRemovalBusy);
    await check('Success commits exactly one undoable change', () => files[0].removeBg && files[0].processedAI && undoStack.length === baselineHistory + 1 && removeBgButton.getAttribute('aria-pressed') === 'true');
    await page.evaluate(() => { window.cached = files[0].processed; });
    await page.keyboard.press('Control+z'); await check('Undo successful inference restores the original', () => !files[0].removeBg && getImageSource(files[0]) === files[0].image);
    await page.keyboard.press('Control+y'); await check('Redo restores the exact completed cutout without inference', () => files[0].removeBg && files[0].processed === cached && inferenceCalls === 2);
    await page.evaluate(async () => { await duplicateBatchImage(0); window.batchCopy = files[1]; selectImage(0); selectedLayerIds = new Set(['base']); copySelectedLayers(); await pasteCopiedLayers(); window.copy = files[0].layers.at(-1); });
    await check('Batch duplicate and clipboard paste keep the AI pixels', () => batchCopy.processed === cached && copy.processed === cached && getAddedLayerSource(copy) === cached);
    await page.locator('#remove-bg').click(); await page.locator('#remove-bg').click();
    await check('Copied-layer toggles reuse the cutout', () => copy.removeBg && copy.processed === cached && inferenceCalls === 2);
    await page.evaluate(() => { selectImage(2); window.beforeFailure = historyKey(readHistoryState()); rejectAt = inferenceCalls + 1; });
    await page.locator('#remove-bg').click(); await page.evaluate(() => finishRemoval()); await page.waitForFunction(() => !backgroundRemovalBusy);
    await check('Inference failure preserves state and gives a retryable error', () => historyKey(readHistoryState()) === beforeFailure && !files[2].removeBg && !removeBgButton.disabled && document.querySelector('#editor-status').textContent.includes('Test model failure'));
    await page.evaluate(() => {
      files.forEach(item => { item.removeBg = false; item.processed = null; item.processedAI = false; item.layers = []; item.layerOrder = ['base']; });
      drawActive(); window.batchBaseline = historyKey(readHistoryState()); window.batchUndo = undoStack.length; rejectAt = inferenceCalls + 2;
      window.batchPromise = removeAllLayerBackgrounds();
    });
    await page.evaluate(() => finishRemoval()); await page.waitForFunction(() => inferenceCalls === rejectAt);
    await check('Batch does not partially apply completed layers', () => files.every(item => !item.removeBg) && undoStack.length === batchUndo);
    await page.evaluate(() => finishRemoval()); await page.evaluate(() => batchPromise);
    await check('Failure on a later batch layer leaves the whole batch unchanged', () => historyKey(readHistoryState()) === batchBaseline && files.every(item => !item.removeBg));
    await page.evaluate(() => { rejectAt = Infinity; PhotoStudioBackground.remove = async source => { inferenceCalls++; return createBackgroundRemovedSource(source); }; window.beforeBatchCalls = inferenceCalls; });
    await page.evaluate(() => removeAllLayerBackgrounds());
    await check('Batch processes all eligible images, skips Close View, and commits once', () => files.slice(0, 3).every(item => item.removeBg && item.processedAI) && !files[3].removeBg && inferenceCalls === beforeBatchCalls + 3 && undoStack.length === batchUndo + 1);
    await page.keyboard.press('Control+z'); await check('One Undo restores the entire batch', () => historyKey(readHistoryState()) === batchBaseline);
    await page.keyboard.press('Control+y'); await check('One Redo restores all completed cutouts', () => files.slice(0, 3).every(item => item.removeBg) && !files[3].removeBg);
    await page.evaluate(() => { selectImage(3); }); await page.keyboard.press('Control+b');
    await check('Close View cannot start removal', () => !backgroundRemovalBusy && !files[3].removeBg && removeBgButton.disabled);
    await page.evaluate(async () => {
      selectImage(0); const item = files[0]; item.layers = []; item.layerOrder = ['base']; item.watermarkEnabled = false;
      item.smartPrep = createSmartPreparation(item.image, {canvasWidth: 1576, canvasHeight: 1576, topMargin: 100, bottomMargin: 100});
      // Simulate a sizing mask which missed a detail later recovered by AI.
      item.smartPrep = {...item.smartPrep, bounds: {x: 40, y: 40, width: 80, height: 80}};
      backgroundMode = 'none'; drawActive(); selectedLayerIds = new Set(['base']);
      const original = await createImageBitmap(await createExportBlob(item, 'png'));
      duplicateSelectedLayers(); const layer = item.layers[0]; layer.x -= 35; layer.y -= 35; item.baseRemoved = true; item.layerOrder = [layer.id];
      const duplicated = await createImageBitmap(await createExportBlob(item, 'png'));
      const work = document.createElement('canvas'); work.width = original.width; work.height = original.height; const ctx = work.getContext('2d');
      ctx.drawImage(original, 0, 0); const a = ctx.getImageData(0, 0, work.width, work.height).data;
      ctx.clearRect(0, 0, work.width, work.height); ctx.drawImage(duplicated, 0, 0); const b = ctx.getImageData(0, 0, work.width, work.height).data;
      window.copyPixelDifferences = a.reduce((count, value, i) => count + (Math.abs(value - b[i]) > 1 ? 1 : 0), 0);
      original.close(); duplicated.close();
    });
    await check('Prepared duplicates retain AI details outside the old sizing mask pixel-for-pixel', () => copyPixelDifferences === 0);
    if (errors.length) throw Error(errors.join('; ')); console.log(JSON.stringify({passed: checks.length, checks, errors}, null, 2));
  } catch (error) { console.error(error); console.error(checks); process.exitCode = 1; }
  finally { await browser.close(); }
})();
