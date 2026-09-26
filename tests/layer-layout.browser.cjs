// Browser regressions for exact layer copies and account changes on compositions.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {}),
    args: ['--allow-file-access-from-files']});
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  try {
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    const checks = await page.evaluate(async () => {
      const checks = []; window.layerLayoutChecks = checks;
      const check = (name, ok) => { if (!ok) throw Error(name); checks.push(name); };
      const near = (a, b) => Math.abs(a - b) < .00001;
      const equalRect = (a, b, offset = 0) => near(a.width, b.width) && near(a.height, b.height) && near(a.x + offset, b.x) && near(a.y + offset, b.y);
      const source = document.createElement('canvas'); source.width = 500; source.height = 800;
      const context = source.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0, 0, 500, 800);
      context.fillStyle = '#a00000'; context.beginPath(); context.moveTo(190, 40); context.lineTo(310, 40); context.lineTo(450, 760); context.lineTo(50, 760); context.closePath(); context.fill();
      const blob = await new Promise(resolve => source.toBlob(resolve));
      listingAutoPrompted = true;
      const [item] = addImages([new File([blob], 'DT.png', {type: 'image/png'})]); await item.image.decode(); selectImage(0);
      const clearLayers = () => { item.layers = []; item.layerOrder = ['base']; item.baseRemoved = false; selectedLayerIds = new Set(['base']); };
      for (const fit of ['contain', 'cover']) for (const rotation of [0, 15, 90]) {
        clearLayers(); Object.assign(item, {scale: 230, rotation, fit, mirror: true, flipY: true, removeBg: false});
        const before = getBaseLayerRect(item); duplicateSelectedLayers(); const copy = item.layers[0];
        check(`Ordinary ${fit} layer at ${rotation} degrees duplicates at exact size without a scale cap`, equalRect(before, getAddedLayerRect(copy), 35)
          && copy.scale === item.scale && copy.mirror && copy.flipY && !copy.removeBg);
      }
      clearLayers(); Object.assign(item, {scale: 70, rotation: 15, removeBg: true, fit: 'contain'});
      const removedSource = getImageSource(item), removedRect = getBaseLayerRect(item); duplicateSelectedLayers();
      check('Background-removed ordinary duplicate keeps source pixels and exact dimensions', item.layers[0].removeBg && getAddedLayerSource(item.layers[0]) === removedSource && equalRect(removedRect, getAddedLayerRect(item.layers[0]), 35));
      clearLayers(); listingAccount.value = '6'; listingMaterial.value = 'genuine-leather-solid'; await applyListingWatermarks();
      for (const rotation of [0, 15, 90]) {
        clearLayers(); Object.assign(item, {scale: 73, rotation, mirror: true, flipY: true, shadow: true, shadowAngle: 35, shadowDistance: 23, shadowStrength: 80});
        const before = getBaseLayerRect(item), geometry = smartProductGeometry(item); duplicateSelectedLayers();
        const copy = item.layers[0], draw = getAddedLayerDrawRect(copy);
        check(`Smart-prepared duplicate at ${rotation} degrees preserves the fitted product, transforms and shadow`, equalRect(before, getAddedLayerRect(copy), 35)
          && near(draw.width, geometry.drawWidth) && near(draw.height, geometry.drawHeight) && copy.sourceSnapshot && copy.removeBg
          && copy.scale === 73 && copy.rotation === rotation && copy.mirror && copy.flipY && copy.shadow && copy.shadowAngle === 35 && copy.shadowDistance === 23 && copy.shadowStrength === 80);
      }
      clearLayers(); Object.assign(item, {scale: 70, rotation: 0, mirror: false, flipY: false, shadow: false, watermarkEnabled: false});
      async function redBounds(target) {
        const bitmap = await createImageBitmap(await createExportBlob(target, 'png'));
        const work = document.createElement('canvas'); work.width = bitmap.width; work.height = bitmap.height;
        const c = work.getContext('2d'); c.drawImage(bitmap, 0, 0); bitmap.close();
        const pixels = c.getImageData(0, 0, work.width, work.height).data;
        let left = work.width, top = work.height, right = -1, bottom = -1, count = 0;
        for (let y = 0; y < work.height; y++) for (let x = 0; x < work.width; x++) {
          const offset = (y * work.width + x) * 4;
          if (pixels[offset] > 90 && pixels[offset + 1] < 30 && pixels[offset + 2] < 30) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); count++; }
        }
        return {left, top, right, bottom, count};
      }
      const originalPixels = await redBounds(item), originalRect = getBaseLayerRect(item);
      duplicateSelectedLayers(); const exactCopy = item.layers[0]; exactCopy.x = originalRect.x; exactCopy.y = originalRect.y; item.baseRemoved = true;
      const copiedPixels = await redBounds(item);
      check('PNG export of the duplicated fitted product has the same pixel bounds and silhouette', ['left', 'top', 'right', 'bottom'].every(key => originalPixels[key] === copiedPixels[key])
        && Math.abs(originalPixels.count - copiedPixels.count) < originalPixels.count * .002);
      item.baseRemoved = false; selectedLayerIds = new Set([exactCopy.id]);
      const snapshot = getAddedLayerSource(exactCopy); toggleSelectedLayerBackgrounds();
      check('Prepared duplicate can restore its original background without changing the crop', !exactCopy.removeBg && getAddedLayerSource(exactCopy) === exactCopy.sourceSnapshot.original);
      toggleSelectedLayerBackgrounds();
      check('Prepared duplicate can restore the exact cutout again', exactCopy.removeBg && getAddedLayerSource(exactCopy) === snapshot);
      selectedLayerIds = new Set(['base']); copySelectedLayers(); await pasteCopiedLayers();
      const pasted = item.layers.at(-1);
      check('Ctrl+C/Ctrl+V preserves prepared product size and crop with independent loaded assets', equalRect(originalRect, getAddedLayerRect(pasted), 35)
        && pasted.sourceSnapshot && pasted.url !== item.url && pasted.image !== item.image);
      selectedLayerIds = new Set([pasted.id]); const pastedRect = getAddedLayerRect(pasted); duplicateSelectedLayers();
      check('Duplicating an added prepared layer preserves its size and cutout', equalRect(pastedRect, getAddedLayerRect(item.layers.at(-1)), 35) && getAddedLayerSource(pasted) === getAddedLayerSource(item.layers.at(-1)));
      selectedLayerIds = new Set(['base', exactCopy.id]); const groupBefore = [...selectedLayerIds].map(id => getLayerEntityRect(item, id)); duplicateSelectedLayers();
      check('Multi-layer duplication preserves relative positions and exact dimensions', [...selectedLayerIds].every((id, index) => equalRect(groupBefore[index], getLayerEntityRect(item, id), 35)));

      // Arrange a prepared Main composition, then change account/material repeatedly.
      item.layers = [exactCopy]; item.layerOrder = [exactCopy.id, 'base']; selectedLayerIds = new Set(['base', exactCopy.id]);
      arrangeSelectedLayers(); moveSelectedLayerEntities(25, -32); scaleSelectedLayerEntities(.8);
      item.rotation = 15; item.mirror = true; exactCopy.rotation = 30; exactCopy.flipY = true;
      const state = target => allLayerEntityIds(target).map(id => ({id, rect: getLayerEntityRect(target, id),
        scale: getLayerEntity(target, id).data.scale, rotation: getLayerEntity(target, id).data.rotation,
        mirror: getLayerEntity(target, id).data.mirror, flipY: getLayerEntity(target, id).data.flipY,
        removeBg: getLayerEntity(target, id).data.removeBg}));
      const matches = (before, after) => before.length === after.length && before.every((layer, i) => equalRect(layer.rect, after[i].rect)
        && ['id', 'scale', 'rotation', 'mirror', 'flipY', 'removeBg'].every(key => layer[key] === after[i][key]));
      const layout = state(item), selection = [...selectedLayerIds].join('|');
      openListingPanel(); closeListingPanel();
      check('Opening Listing alone does not move or resize layers', matches(layout, state(item)));
      for (const account of [3, 0, 6]) {
        listingAccount.value = String(account); listingMaterial.value = 'genuine-leather-perforated'; await applyListingWatermarks();
        check(`Account ${account} changes the watermark while retaining every layer transform and order`, matches(layout, state(item))
          && item.watermarkSection === account && findWatermarkTemplate(account, item.watermarkTemplateId).name === 'GLS PI'
          && [...selectedLayerIds].join('|') === selection && files[activeIndex] === item);
      }
      listingSmartPrep.checked = false; await applyListingWatermarks();
      check('Turning smart preparation off does not dismantle an existing layered arrangement', matches(layout, state(item)) && item.smartPrep?.enabled);
      listingSmartPrep.checked = true;
      const normalCopy = files.find(entry => entry.generatedFromImageId === item.id);
      selectImage(files.indexOf(normalCopy)); selectedLayerIds = new Set(['base']); duplicateSelectedLayers();
      selectedLayerIds = new Set(allLayerEntityIds(normalCopy)); arrangeSelectedLayers(); moveSelectedLayerEntities(-30, 40);
      const normalLayout = state(normalCopy); await selectWatermarkTemplate(3, findListingTemplate(3, 'Normal').template.id);
      check('First manual template change freezes an existing Normal arrangement before artwork changes', matches(normalLayout, state(normalCopy)));
      listingAccount.value = '0'; await applyListingWatermarks();
      check('Normal-template compositions retain their upper-center fit when account artwork changes', matches(normalLayout, state(normalCopy)) && usesNormalTemplate(normalCopy));
      selectImage(files.indexOf(item)); const beforeManual = state(item); await selectWatermarkTemplate(0, findListingTemplate(0, 'Normal').template.id);
      check('Manual Saved Watermark changes also preserve the layered arrangement', matches(beforeManual, state(item)) && usesNormalTemplate(item));
      const beforeMove = getBaseLayerRect(item); selectedLayerIds = new Set(['base']); moveSelectedLayerEntities(20, -10); applyImageScale(item.scale * 1.1);
      const afterMove = getBaseLayerRect(item);
      check('Preserved compositions remain movable and resizable', near(afterMove.x, beforeMove.x + 20) && near(afterMove.y, beforeMove.y - 10) && afterMove.width > beforeMove.width);
      const previousArea = item.smartPrep.safeArea; item.smartPrep.safeArea = {...previousArea, topMargin: previousArea.canvasHeight, bottomMargin: 0};
      check('Later template-margin changes cannot hide a preserved composition', equalRect(afterMove, getBaseLayerRect(item)));
      item.smartPrep.safeArea = previousArea;
      selectedLayerIds = new Set(['base']); removeSelectedLayers(); const onlyAdded = state(item); await applyListingWatermarks();
      check('Reapplying Listing keeps a deleted original layer deleted and preserves remaining layers', item.baseRemoved && matches(onlyAdded, state(item)));
      // Recreate a missing unmain copy from an arranged source.
      removeBatchImage(files.indexOf(normalCopy)); selectImage(files.indexOf(item)); const arranged = state(item); await applyListingWatermarks();
      const regenerated = files.find(entry => entry.generatedFromImageId === item.id), generatedState = state(regenerated);
      check('New unmain outputs inherit a composed source without moving its layers', regenerated.baseRemoved && arranged.length === generatedState.length && arranged.every((entry, i) => equalRect(entry.rect, generatedState[i].rect)));

      const [close] = addImages([new File([blob], 'Close View.png', {type: 'image/png'})]); await close.image.decode(); selectImage(files.indexOf(close));
      close.scale = 140; close.rotation = 15; const closeRect = getBaseLayerRect(close); duplicateSelectedLayers();
      check('Close View duplication retains native-size rules, background and exact dimensions', equalRect(closeRect, getAddedLayerRect(close.layers[0]), 35) && !close.layers[0].removeBg && isCloseViewImage(close.layers[0]));
      const closeLayout = state(close); listingAccount.value = '6'; await applyListingWatermarks();
      check('Close View compositions keep their manual layout and background on account changes', matches(closeLayout, state(close)) && !close.removeBg);
      return checks;
    });
    if (errors.length) throw Error(errors.join('; '));
    console.log(JSON.stringify({passed: checks.length, checks, errors}, null, 2));
  } catch (error) {
    console.error(error); console.error(await page.evaluate(() => window.layerLayoutChecks || [])); process.exitCode = 1;
  } finally { await browser.close(); }
})();
