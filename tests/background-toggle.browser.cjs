const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {}),
    args: ['--allow-file-access-from-files']});
  const page = await browser.newPage({viewport: {width: 1920, height: 1080}}), errors = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  const check = async (name, predicate) => { if (!await page.evaluate(predicate)) throw Error(name); checks.push(name); };
  try {
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.evaluate(async () => { await historyReady; listingAutoPrompted = true; });
    const inputPaths = process.argv.slice(2);
    if (inputPaths.length) await page.locator('#image-input').setInputFiles(inputPaths);
    else {
      const fixture = await page.evaluate(() => {
        const c = document.createElement('canvas'); c.width = c.height = 500; const ctx = c.getContext('2d');
        ctx.fillStyle = '#f8f8f8'; ctx.fillRect(0, 0, 500, 500); ctx.fillStyle = '#eee';
        for (let y = 10; y < 500; y += 20) ctx.fillRect(0, y, 500, 2);
        ctx.fillStyle = '#83715c'; ctx.beginPath(); ctx.ellipse(250, 245, 165, 175, -.2, 0, Math.PI * 2); ctx.fill();
        return c.toDataURL('image/jpeg', .9).split(',')[1];
      });
      await page.locator('#image-input').setInputFiles({name: 'subject.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(fixture, 'base64')});
    }
    await page.waitForFunction(() => files.length && files.every(item => item.image.complete && item.image.naturalWidth));
    const count = await page.evaluate(() => files.length);
    for (let index = 0; index < count; index++) {
      await page.evaluate(async index => {
        selectImage(index); const item = files[index]; item.originalSize = true; item.watermarkEnabled = false;
        resizeWidth.value = item.image.naturalWidth; resizeHeight.value = item.image.naturalHeight; backgroundMode = 'none'; exportFormat.value = 'png'; drawActive();
        window.toggleItem = item; window.toggleRect = getBaseLayerRect(item);
        window.pngHash = async () => zipCrc32(new Uint8Array(await (await createExportBlob(toggleItem, 'png')).arrayBuffer()));
        window.originalHash = await pngHash();
      }, index);
      await page.locator('#remove-bg').click();
      await check(`Image ${index + 1}: real Remove BG click stays enabled and pressed`, () => toggleItem.removeBg && !removeBgButton.disabled && removeBgButton.classList.contains('active') && removeBgButton.getAttribute('aria-pressed') === 'true' && removeBgButton.title.includes('Restore original'));
      await page.evaluate(() => { window.cachedCutout = toggleItem.processed; });
      await page.locator('.editor-sidebar-title').click();
      await check(`Image ${index + 1}: clearing handles keeps the sole layer's toggle available`, () => !selectedLayerIds.size && !removeBgButton.disabled && removeBgButton.getAttribute('aria-pressed') === 'true');
      await page.keyboard.press('Control+b');
      await check(`Image ${index + 1}: Ctrl+B restores a pixel-identical original PNG`, async () => !toggleItem.removeBg && removeBgButton.getAttribute('aria-pressed') === 'false' && await pngHash() === originalHash);
      await page.locator('#remove-bg').click();
      await check(`Image ${index + 1}: the next click reuses the cutout without accumulating cleanup`, () => toggleItem.removeBg && toggleItem.processed === cachedCutout);
      await page.locator('#remove-bg').click();
      await check(`Image ${index + 1}: clicking again restores the original at the exact same size and position`, async () => !toggleItem.removeBg && await pngHash() === originalHash && ['x', 'y', 'width', 'height'].every(k => getBaseLayerRect(toggleItem)[k] === toggleRect[k]));
      await page.locator('#image-scale-value').focus(); await page.keyboard.press('Control+b');
      await check(`Image ${index + 1}: Ctrl+B also toggles from a numeric image control`, () => toggleItem.removeBg && toggleItem.scale === 100);
      await page.keyboard.press('Control+z');
      await check(`Image ${index + 1}: Undo restores the original and its button state`, async () => !toggleItem.removeBg && removeBgButton.getAttribute('aria-pressed') === 'false' && await pngHash() === originalHash);
      await page.keyboard.press('Control+y');
      await check(`Image ${index + 1}: Redo restores the cutout and active button`, () => toggleItem.removeBg && removeBgButton.getAttribute('aria-pressed') === 'true');
    }
    await page.evaluate(async () => {
      selectImage(0); listingAccount.value = '7'; listingSmartPrep.checked = true; await applyListingWatermarks(); closeListingPanel();
      window.toggleItem = files[activeIndex]; toggleItem.watermarkEnabled = false; drawActive(); window.toggleRect = getBaseLayerRect(toggleItem);
    });
    await page.locator('#remove-bg').click(); await page.locator('#remove-bg').click();
    await check('Prepared restoration uses the actual original image and retains fitted geometry', () => {
      const sources = [], draw = ctx.drawImage; ctx.drawImage = function(source, ...args) { sources.push(source); return draw.call(this, source, ...args); };
      try { drawActive(); } finally { ctx.drawImage = draw; }
      return !toggleItem.removeBg && toggleItem.originalBackgroundRestored && sources.includes(toggleItem.image)
        && !sources.includes(toggleItem.smartPrep.foreground) && ['x', 'y', 'width', 'height'].every(k => getBaseLayerRect(toggleItem)[k] === toggleRect[k]);
    });
    await page.evaluate(() => { selectedLayerIds = new Set(['base']); duplicateSelectedLayers(); window.toggleCopy = toggleItem.layers.at(-1); window.copyRect = getAddedLayerRect(toggleCopy); });
    await check('A restored prepared duplicate starts with its original background', () => !toggleCopy.removeBg && getAddedLayerSource(toggleCopy) === toggleCopy.sourceSnapshot.original);
    await page.locator('#remove-bg').click();
    await check('A restored prepared duplicate can recover the saved cutout without re-keying its cropped source', () => toggleCopy.removeBg && Boolean(toggleCopy.sourceSnapshot.cutout) && getAddedLayerSource(toggleCopy) === toggleCopy.sourceSnapshot.cutout);
    await page.keyboard.press('Control+b');
    await check('Prepared duplicates toggle back to their saved original crop without a size change', () => !toggleCopy.removeBg && getAddedLayerSource(toggleCopy) === toggleCopy.sourceSnapshot.original && ['x', 'y', 'width', 'height'].every(k => getAddedLayerRect(toggleCopy)[k] === copyRect[k]));
    await page.evaluate(() => { selectedLayerIds = new Set(allLayerEntityIds(toggleItem)); syncSelectedLayerControls(); });
    await page.keyboard.press('Control+b');
    await check('Ctrl+B removes every selected layer background together', () => toggleItem.removeBg && toggleCopy.removeBg && removeBgButton.getAttribute('aria-pressed') === 'true');
    await page.keyboard.press('Control+b');
    await check('Ctrl+B restores every selected layer background together', () => !toggleItem.removeBg && !toggleCopy.removeBg && removeBgButton.getAttribute('aria-pressed') === 'false');
    await page.evaluate(() => clearLayerSelection());
    await check('A deselected multi-layer composition does not silently edit unrelated layers', () => removeBgButton.disabled);
    await page.evaluate(() => { selectedLayerIds = new Set(['base']); removeSelectedLayers(); clearLayerSelection(); });
    await page.locator('#remove-bg').click();
    await check('The last remaining added layer toggles even with its handles cleared', () => toggleItem.baseRemoved && toggleCopy.removeBg && !removeBgButton.disabled);
    await page.evaluate(async () => {
      const [item] = addImages([new File([toggleItem.file], 'DOPTcv.jpg', {type: toggleItem.file.type})]); await item.image.decode(); selectImage(files.indexOf(item));
    });
    await page.keyboard.press('Control+b');
    await check('Close Views retain their original backgrounds and cannot be toggled', () => !files[activeIndex].removeBg && removeBgButton.disabled);
    if (errors.length) throw Error(errors.join('; '));
    console.log(JSON.stringify({passed: checks.length, images: inputPaths.map(file => path.basename(file)), checks, errors}, null, 2));
  } catch (error) { console.error(error); console.error(checks); process.exitCode = 1; }
  finally { await browser.close(); }
})();
