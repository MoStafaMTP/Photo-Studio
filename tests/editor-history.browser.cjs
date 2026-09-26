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
      const checks = []; window.historyChecks = checks;
      const check = (name, ok) => { if (!ok) throw Error(name); checks.push(name); };
      const near = (a, b) => Math.abs(a - b) < .00001;
      const sameRect = (a, b) => ['x', 'y', 'width', 'height'].every(key => near(a[key], b[key]));
      const inputValue = (control, value, event = 'input') => { control.value = String(value); control.dispatchEvent(new Event(event, {bubbles: true})); };
      const source = document.createElement('canvas'); source.width = 500; source.height = 800;
      const c = source.getContext('2d'); c.fillStyle = '#ddeeff'; c.fillRect(0, 0, 500, 800); c.fillStyle = '#a00000'; c.fillRect(120, 60, 260, 650);
      const blob = await new Promise(resolve => source.toBlob(resolve));
      listingAutoPrompted = true;
      const [first, second] = addImages(['DT.png', 'PT.png'].map(name => new File([blob], name, {type: 'image/png'})));
      await Promise.all(files.map(item => item.image.decode()));
      const ids = files.map(item => item.id).join('|'); undo();
      check('Upload is undoable, including returning to an empty editor', !files.length && !redoButton.disabled);
      redo(); check('Redo upload restores all images and usable source URLs', files.map(item => item.id).join('|') === ids && files.every(item => item.image.naturalWidth === 500) && (await fetch(first.url)).ok);
      selectImage(0); selectedLayerIds = new Set(['base']); syncSelectedLayerControls();
      inputValue(imageScaleValue, 101); inputValue(imageScaleValue, 102); undo();
      check('Every one-percent numeric size adjustment has its own undo step', first.scale === 101 && imageScaleValue.value === '101');
      undo(); check('A second undo restores the earlier size', first.scale === 100);
      redo(); redo(); check('Redo replays both numeric steps', first.scale === 102);
      inputValue(imageScale, 103); undo(); check('Keyboard/input slider changes work without a pointerdown', first.scale === 102);
      const length = undoStack.length; inputValue(imageScale, 102); check('Unchanged values do not add empty undo steps or clear redo', undoStack.length === length && redoStack.length === 1);
      inputValue(imageScale, 104); check('A real new edit clears the redo branch', !redoStack.length && redoButton.disabled);
      inputValue(resizeWidth, 1600); undo(); check('Canvas width restores its previous value, not the post-input value', resizeWidth.value === '1576' && canvas.width === 1576); redo();
      inputValue(resizeHeight, 1700); undo(); check('Canvas height is independently undoable', resizeHeight.value === '1576'); redo();
      inputValue(backgroundColor, '#123456'); undo(); check('Background color edits are recorded without pointerdown', backgroundColor.value === '#ffffff'); redo();
      backgroundGroup.querySelector('[data-background="none"]').click(); undo(); check('Background mode is undoable', backgroundMode === 'color');
      check('Removed movement locks are absent from the UI and history settings', !document.querySelector('[aria-label="Movement lock"]') && !Object.hasOwn(readHistoryState().settings, 'movementLock'));
      inputValue(exportFormat, 'webp', 'change'); undo(); check('Export format settings are undoable', exportFormat.value === 'jpg');
      shadowToggle.click(); inputValue(shadowAngle, 91); inputValue(shadowAngle, 92); undo();
      check('One-degree shadow adjustments are individually undoable', first.shadowAngle === 91 && angleValue.textContent === '91°');
      inputValue(shadowDistance, 19); undo(); check('Shadow distance is undoable', first.shadowDistance === 18 && distanceValue.textContent === '18px');
      inputValue(shadowStrength, 79); undo(); check('Shadow opacity is undoable', first.shadowStrength === 80);
      rotate(15); selectImage(files.indexOf(second)); undo();
      check('Undo follows the edited image after selecting a different image', first.rotation === 0 && second.rotation === 0 && files[activeIndex] === first); redo();
      horizontalFlipButton.click(); verticalFlipButton.click(); undo(); check('Flip actions remain separate', first.mirror && !first.flipY); redo();
      const start = first.offsetX;
      for (let i = 0; i < 65; i++) document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', code: 'ArrowRight', bubbles: true, repeat: i > 0}));
      check('Repeated one-pixel key movements are all recorded past the old 50-step limit', near(first.offsetX, start + 65) && undoStack.length > 50);
      for (let i = 0; i < 65; i++) undo();
      check('All 65 small key movements can be undone without losing earlier edits', near(first.offsetX, start) && first.rotation === 15);
      for (let i = 0; i < 65; i++) redo();
      check('All 65 movements can be redone', near(first.offsetX, start + 65));
      const wheelStart = first.scale;
      canvasWrap.dispatchEvent(new WheelEvent('wheel', {deltaY: -10, bubbles: true, cancelable: true}));
      canvasWrap.dispatchEvent(new WheelEvent('wheel', {deltaY: -10, bubbles: true, cancelable: true})); undo();
      check('Consecutive wheel changes each retain an undo step', first.scale === wheelStart + 1);
      await addLayerImages([new File([blob], 'extra.png', {type: 'image/png'})]); const layerId = first.layers[0].id; undo();
      check('Adding a layer is undoable', !first.layers.length); redo(); check('Redo restores added layer identity and image', first.layers[0].id === layerId && first.layers[0].image.naturalWidth === 500);
      selectedLayerIds = new Set(['base']); duplicateSelectedLayers(); const duplicateId = first.layers.at(-1).id; undo();
      check('Layer duplication is recorded even through the direct action', !first.layers.some(layer => layer.id === duplicateId)); redo();
      selectedLayerIds = new Set([duplicateId]); removeSelectedLayers(); undo(); check('Deleted layers can be restored', first.layers.some(layer => layer.id === duplicateId));
      const priorOrder = [...first.layerOrder]; first.layerOrder.reverse(); drawActive(); undo(); check('Layer stacking changes restore the exact previous order', first.layerOrder.join('|') === priorOrder.join('|'));
      await duplicateBatchImage(files.indexOf(first)); const batchCopy = files[activeIndex]; undo(); check('Batch duplication does not erase previous history', !files.includes(batchCopy) && undoStack.length > 50); redo();
      removeBatchImage(files.indexOf(batchCopy)); undo(); check('Deleted batch images restore their layers and working source URLs', files.includes(batchCopy) && (await fetch(batchCopy.url)).ok && batchCopy.layers.length === first.layers.length);
      redo();

      // A fresh single-layer workflow must retain its placement when BG changes.
      selectImage(files.indexOf(second)); selectedLayerIds = new Set(['base']);
      inputValue(resizeWidth, 1576); inputValue(resizeHeight, 1576); inputValue(backgroundColor, '#ffffff');
      inputValue(listingAccount, 6, 'change'); inputValue(listingMaterial, 'genuine-leather-solid', 'change');
      const beforeWorkflow = files.length, historyBeforeWorkflow = undoStack.length; await applyListingWatermarks();
      check('Apply Workflow is one complete history action', undoStack.length === historyBeforeWorkflow + 1 && files.length > beforeWorkflow);
      undo(); check('Undo workflow restores originals and removes its generated unmain images', files.length === beforeWorkflow && !second.smartPrep && !second.watermarkImage);
      redo(); check('Redo workflow restores prepared images, watermarks and generated outputs', files.length > beforeWorkflow && second.smartPrep && second.watermarkImage);
      const reused = createSmartPreparation(second.image, second.smartPrep.safeArea, 'test-cache');
      check('Repeated preparation shares immutable pixels while keeping placement settings independent', reused.foreground === second.smartPrep.foreground && reused.background === second.smartPrep.background
        && reused !== second.smartPrep && reused.safeArea !== second.smartPrep.safeArea && reused.bounds !== second.smartPrep.bounds);
      selectImage(files.indexOf(second)); selectedLayerIds = new Set(['base']);
      const prepared = second.smartPrep, rect = getBaseLayerRect(second); removeBgButton.click();
      check('Remove BG retains the exact smart-fitted size, center and preparation', second.removeBg && second.smartPrep === prepared && sameRect(rect, getBaseLayerRect(second)));
      const renderPixel = async item => {
        const bitmap = await createImageBitmap(await createExportBlob(item, 'png')), work = document.createElement('canvas'); work.width = bitmap.width; work.height = bitmap.height;
        const context = work.getContext('2d'); context.drawImage(bitmap, 0, 0); bitmap.close();
        return [...context.getImageData(100, 500, 1, 1).data];
      };
      second.watermarkEnabled = false; drawActive(); const removedPixel = await renderPixel(second); removeBgButton.click(); const restoredPixel = await renderPixel(second);
      check('Background pixels change while the product geometry remains fixed', removedPixel.slice(0, 3).every(value => value === 255) && restoredPixel[0] < 255 && sameRect(rect, getBaseLayerRect(second)));
      undo(); check('Undo background restoration restores removal without resizing', second.removeBg && sameRect(rect, getBaseLayerRect(second))); redo();
      duplicateSelectedLayers(); const cutout = second.layers.at(-1), cutoutRect = getAddedLayerRect(cutout); selectedLayerIds = new Set([cutout.id]); removeBgButton.click();
      check('Prepared duplicate background removal keeps its exact size and position', cutout.removeBg && sameRect(cutoutRect, getAddedLayerRect(cutout))); removeBgButton.click();
      check('Prepared duplicate background restoration also keeps its exact size and position', !cutout.removeBg && sameRect(cutoutRect, getAddedLayerRect(cutout)));
      const backgrounds = files.map(item => item.removeBg); removeAllBgButton.click(); undo();
      check('Remove All BG restores the entire batch in one undo', files.every((item, index) => item.removeBg === backgrounds[index])); redo();
      selectedBatchImageIds = new Set([first.id, second.id]); checkpointHistory();
      const oldWatermarks = [first, second].map(item => item.watermarkTemplateId); await selectWatermarkTemplate(3, findListingTemplate(3, 'Normal').template.id); undo();
      check('Multi-image watermark changes undo for all selected images', [first, second].every((item, index) => item.watermarkTemplateId === oldWatermarks[index])); redo();
      inputValue(opacityInput, 99); inputValue(opacityInput, 98); undo(); check('One-percent watermark opacity edits restore all selected images', first.watermarkOpacity === 99 && second.watermarkOpacity === 99); redo();
      watermarkToggleButton.click(); undo(); check('Watermark enable/disable is undoable across the selection', first.watermarkEnabled && second.watermarkEnabled);
      const resetState = historyKey(readHistoryState()); document.querySelector('#reset-editor').click(); undo(); check('Reset is one undoable action covering all reset fields', historyKey(readHistoryState()) === resetState);

      const count = watermarkSections[6].templates.length; await addWatermarkTemplates(6, [new File([blob], 'Personal.png', {type: 'image/png'})]);
      const personalId = watermarkSections[6].templates.at(-1).id; undo(); await historyPersistence;
      check('Personal watermark upload and application undo together', watermarkSections[6].templates.length === count && !(await assetStore('readonly', store => store.get(watermarkSectionKey(6)))).some(template => template.id === personalId));
      redo(); await historyPersistence; const prompt = window.prompt; window.prompt = () => 'Renamed';
      try { await renameWatermarkTemplate(6, personalId); } finally { window.prompt = prompt; }
      undo(); await historyPersistence; check('Watermark renaming is undoable and saved to storage', findWatermarkTemplate(6, personalId).name === 'Personal' && (await assetStore('readonly', store => store.get(watermarkSectionKey(6)))).find(template => template.id === personalId).name === 'Personal');
      await deleteWatermarkTemplate(6, personalId); undo(); await historyPersistence; check('Watermark deletion restores the template and its image assignments', findWatermarkTemplate(6, personalId) && [first, second].every(item => item.watermarkTemplateId === personalId));
      const template = findListingTemplate(6, 'Normal').template, image = await loadListingTemplateImage(6, template), area = await getWatermarkSafeArea(6, template, image);
      await saveWatermarkSafeArea(6, template, {...area, topMargin: area.topMargin + 1, source: 'custom'}); undo(); await historyPersistence;
      check('One-pixel template-margin edits can be undone without shallow-copy leaks', (await getWatermarkSafeArea(6, findWatermarkTemplate(6, template.id), image)).topMargin === area.topMargin);
      redo(); await historyPersistence; check('Template margins redo and persist', (await assetStore('readonly', store => store.get(watermarkSafeAreaStorageKey(6, template.id)))).topMargin === area.topMargin + 1);
      const historyBeforeExport = undoStack.length; await createExportBlob(second, 'png'); check('Rendering and export do not create phantom history entries', undoStack.length === historyBeforeExport);
      const payload = {account: 'Elite', material: 'Genuine Leather Solid', images: files.map(item => ({filename: item.file.name, imageId: item.id, variation: 'DT', subtype: 'unmain'}))};
      setCPISMetadata(payload); undo(); check('Explicit CPIS metadata imports can be undone as their own action', cpisListingContext === null); redo();
      rotate(15); undo(); check('Undoing a visual edit preserves the active CPIS metadata', cpisListingContext && files.every(item => item.listingMetadata.subtype === 'unmain'));
      clearCPISMetadata(); undo(); check('Switching to filename mode is reversible', cpisListingContext && files.every(item => item.listingMetadata)); redo();
      closeListingPanel(); selectedLayerIds = new Set(['base']); rotate(15); const rotated = files[activeIndex].rotation;
      document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ظ', code: 'KeyZ', ctrlKey: true, bubbles: true}));
      check('Ctrl+Z works with a non-Latin keyboard layout', files[activeIndex].rotation === (rotated + 345) % 360);
      document.dispatchEvent(new KeyboardEvent('keydown', {key: 'z', code: 'KeyZ', ctrlKey: true, shiftKey: true, bubbles: true}));
      check('Ctrl+Shift+Z redoes the edit', files[activeIndex].rotation === rotated);
      return checks;
    });
    // Exercise actual pointer events and visible history controls, not only helpers.
    await page.evaluate(async () => {
      listingAutoPrompted = true;
      const [item] = addImages([new File([files[0].file], 'drag.png', {type: 'image/png'})]); await item.image.decode(); selectImage(files.indexOf(item));
      window.dragHistoryItem = item; window.dragHistoryStart = getBaseLayerRect(item);
    });
    const bounds = await page.locator('#editor-canvas').boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2); await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width / 2 + 10, bounds.y + bounds.height / 2 + 5);
    const intermediate = await page.evaluate(() => getBaseLayerRect(window.dragHistoryItem));
    await page.mouse.move(bounds.x + bounds.width / 2 + 20, bounds.y + bounds.height / 2 + 10); await page.mouse.up();
    await page.evaluate(() => undoButton.click());
    if (!await page.evaluate(expected => ['x', 'y'].every(key => Math.abs(getBaseLayerRect(window.dragHistoryItem)[key] - expected[key]) < .001), intermediate)) throw Error('Pointer movement undo');
    checks.push('Real mouse-drag increments can be undone with the Undo button');
    await page.evaluate(() => undoButton.click());
    if (!await page.evaluate(() => ['x', 'y'].every(key => Math.abs(getBaseLayerRect(window.dragHistoryItem)[key] - window.dragHistoryStart[key]) < .001))) throw Error('Second pointer movement undo');
    checks.push('The next Undo returns a dragged layer to its exact starting position');
    await page.evaluate(() => redoButton.click());
    if (!await page.evaluate(expected => ['x', 'y'].every(key => Math.abs(getBaseLayerRect(window.dragHistoryItem)[key] - expected[key]) < .001), intermediate)) throw Error('Pointer movement redo');
    checks.push('The Redo button restores the precise mouse movement');
    await page.locator('#image-scale-value').fill('137'); await page.keyboard.press('Control+z');
    if (!await page.evaluate(() => window.dragHistoryItem.scale === 100)) throw Error('Focused numeric Ctrl+Z');
    await page.keyboard.press('Control+y');
    if (!await page.evaluate(() => window.dragHistoryItem.scale === 137)) throw Error('Focused numeric Ctrl+Y');
    checks.push('Ctrl+Z and Ctrl+Y work while a numeric editing field has focus');
    if (errors.length) throw Error(errors.join('; '));
    console.log(JSON.stringify({passed: checks.length, checks, errors}, null, 2));
  } catch (error) {
    console.error(error); console.error(await page.evaluate(() => ({passed: window.historyChecks || [], undo: undoStack.length, redo: redoStack.length, status: status.textContent}))); process.exitCode = 1;
  } finally { await browser.close(); }
})();
