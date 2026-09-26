// Requires Playwright for testing only. PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE
// can point to existing installations; the website itself has no dependencies.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {}),
    args: ['--allow-file-access-from-files']});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    const results = await page.evaluate(async () => {
      const checks = []; window.preparationChecks = checks;
      const assert = (name, condition) => { if (!condition) throw Error(name); checks.push(name); };
      const near = (a, b) => Math.abs(a - b) < .001;
      async function fixture(name, width, height) {
        const source = document.createElement('canvas'); source.width = width; source.height = height;
        const context = source.getContext('2d');
        context.fillStyle = '#bedaf0'; context.fillRect(0, 0, width, height);
        context.fillStyle = '#b2cee4'; context.fillRect(0, Math.floor(height * .28), width, Math.ceil(height * .04));
        context.fillStyle = '#a00000'; context.fillRect(width * .25, height * .1, width * .5, height * .8);
        return new File([await new Promise(resolve => source.toBlob(resolve))], name, {type: 'image/png'});
      }
      listingAutoPrompted = true;
      const sources = [await fixture('DT.png', 400, 600), await fixture('details.png', 800, 400),
        await fixture('DOPTcv.png', 400, 300), await fixture('unrelated.png', 500, 600),
        await fixture('DTcv.png', 400, 600)];
      addImages(sources); await Promise.all(files.map(item => item.image.decode()));
      // Test both directions of metadata precedence over filename classification.
      files[3].listingMetadata = {filename: 'unrelated.png', variation: 'DOPB', subtype: 'cv'};
      files[4].listingMetadata = {filename: 'DTcv.png', variation: 'DT', subtype: 'unmain'};
      listingAccount.value = '6'; listingMaterial.value = 'genuine-leather-perforated'; listingSmartPrep.checked = true;
      let removals = 0, separations = 0;
      const removeSource = createBackgroundRemovedSource, prepareSource = createSmartPreparation;
      createBackgroundRemovedSource = (...args) => { removals++; return removeSource(...args); };
      createSmartPreparation = (...args) => { separations++; return prepareSource(...args); };
      await applyListingWatermarks();
      assert('Only non-Close View images and the new DT unmain copy enter automatic background separation', separations === 4 && removals === 0);
      assert('Metadata determines Close View handling before filename fallback', !files[3].smartPrep && files[3].originalSize && files[4].smartPrep && !files[4].originalSize);
      assert('Apply Workflow keeps original backgrounds for prepared images and generated unmain copies', files.filter(item=>item.smartPrep).every(item=>!item.removeBg && item.originalBackgroundRestored)
        && files.some(item=>/unmain/i.test(item.displayName) && item.originalBackgroundRestored));

      // Normal templates can use the clear upper center; all other templates keep
      // the full-width top inset. Every layout retains bottom/side clearance.
      let placements = 0;
      for (const [sectionIndex, section] of watermarkSections.entries()) {
        for (const template of section.templates) {
          const image = await loadListingTemplateImage(sectionIndex, template);
          const safeArea = await getWatermarkSafeArea(sectionIndex, template, image);
          for (const [width, height] of [[1576, 1576], [2000, 2000], [1200, 1600], [1600, 1200]]) {
            canvas.width = width; canvas.height = height;
            const cover = Math.max(width / 1500, height / 1500), offsetY = (height - 1500 * cover) / 2;
            const top = Math.max(0, offsetY + safeArea.topMargin * cover);
            const bottom = Math.min(height, offsetY + (1500 - safeArea.bottomMargin) * cover);
            for (const base of [files[0], files[1]]) for (const rotation of [0, 15, 90]) {
              const item = {...base, rotation, watermarkSection: sectionIndex, watermarkTemplateId: template.id, watermarkImage: image,
                smartPrep: {...base.smartPrep, safeArea}};
              const rect = smartProductGeometry(item);
              const previousGeometry = smartProductGeometry({...item, originalBackgroundRestored: false});
              if (!['x','y','width','height','drawWidth','drawHeight'].every(key=>near(rect[key],previousGeometry[key]))) throw Error('Preserving the original background changed the existing fit');
              const normal = template.name === 'Normal';
              const landscape = base.image.naturalWidth > base.image.naturalHeight || rect.width > rect.height;
              if (!rect || !near(rect.x, width / 2) || ((!normal || landscape) && !near(rect.y, (top + bottom) / 2))
                || rect.y - rect.height / 2 < (normal ? 50 : top + 50) - .001 || rect.y + rect.height / 2 > bottom - 50 + .001
                || rect.x - rect.width / 2 < 50 - .001 || rect.x + rect.width / 2 > width - 50 + .001) {
                throw Error(`Gap/center failure: ${section.name}/${template.name}, ${width}x${height}, rotation ${rotation}`);
              }
              placements++;
            }
          }
        }
      }
      assert('All 57 templates preserve side/bottom clearance and horizontal centering, with adaptive Normal headers, across four output sizes and three rotations', placements === 1368);
      assert('Keeping original backgrounds preserves the prior sizing and positioning in all 1368 placement cases', placements === 1368);
      canvas.width = canvas.height = 1576;
      const legacy = smartSafeRect({safeArea: {canvasWidth: 1500, canvasHeight: 1500, topMargin: 200, bottomMargin: 120, clearance: 0, source: 'custom'}});
      assert('Legacy zero-clearance and custom margins cannot remove the 50px inset', near(legacy.y, 200 / 1500 * 1576 + 50) && near(legacy.height, 1180 / 1500 * 1576 - 100));

      selectImage(0);
      const backgroundItem=files[0], originalWatermark=backgroundItem.watermarkEnabled;
      backgroundItem.watermarkEnabled=false; drawActive();
      const backgroundGeometry=smartProductGeometry(backgroundItem), backgroundRect=getBaseLayerRect(backgroundItem);
      const sourcePoint={x:40,y:180};
      const point={x:Math.round(backgroundGeometry.x+(sourcePoint.x-backgroundGeometry.bounds.x-backgroundGeometry.bounds.width/2)*backgroundGeometry.drawWidth/backgroundGeometry.bounds.width),
        y:Math.round(backgroundGeometry.y+(sourcePoint.y-backgroundGeometry.bounds.y-backgroundGeometry.bounds.height/2)*backgroundGeometry.drawHeight/backgroundGeometry.bounds.height)};
      const sampleBackground=async()=>{
        const bitmap=await createImageBitmap(await createExportBlob(backgroundItem,'png'));
        const output=document.createElement('canvas');output.width=bitmap.width;output.height=bitmap.height;
        const c=output.getContext('2d');c.drawImage(bitmap,0,0);bitmap.close();return [...c.getImageData(point.x,point.y,1,1).data];
      };
      const defaultPixel=await sampleBackground();
      assert('Default export retains original background detail at the fitted source position',defaultPixel.every((value,i)=>Math.abs(value-[178,206,228,255][i])<=1));
      assert('Remove BG is available but inactive after automatic fitting',!removeBgButton.disabled && removeBgButton.getAttribute('aria-pressed')==='false');
      removeBgButton.click();
      assert('Manual Remove BG still removes the background without changing fitted geometry',backgroundItem.removeBg
        && ['x','y','width','height'].every(key=>near(getBaseLayerRect(backgroundItem)[key],backgroundRect[key])) && (await sampleBackground()).slice(0,3).every(value=>value===255));
      removeBgButton.click();
      assert('Restoring the background returns the same default pixels and fitted geometry',!backgroundItem.removeBg
        && (await sampleBackground()).every((value,i)=>value===defaultPixel[i]) && ['x','y','width','height'].every(key=>near(getBaseLayerRect(backgroundItem)[key],backgroundRect[key])));
      backgroundItem.watermarkEnabled=originalWatermark;drawActive();

      for (const format of ['png', 'jpg', 'webp']) {
        const output = await createImageBitmap(await createExportBlob(files[0], format));
        const scan = document.createElement('canvas'); scan.width = output.width; scan.height = output.height;
        const context = scan.getContext('2d'); context.drawImage(output, 0, 0); output.close();
        const pixels = context.getImageData(0, 0, scan.width, scan.height).data;
        let top = scan.height, bottom = -1, left = scan.width, right = -1;
        for (let y = 0; y < scan.height; y++) for (let x = 0; x < scan.width; x++) {
          const offset = (y * scan.width + x) * 4;
          if (pixels[offset] > 70 && pixels[offset + 1] < 25 && pixels[offset + 2] < 25) {
            top = Math.min(top, y); bottom = Math.max(bottom, y); left = Math.min(left, x); right = Math.max(right, x);
          }
        }
        const area = files[0].smartPrep.safeArea, geometry = smartProductGeometry(files[0]);
        // A one-pixel allowance covers antialiasing and lossy JPG/WebP edges.
        assert(`${format.toUpperCase()} export retains the fitted gap and centered product pixels`, bottom > top
          && top >= Math.floor(area.topMargin / 1500 * 1576 + 50) - 1
          && bottom <= Math.ceil(1576 - area.bottomMargin / 1500 * 1576 - 50)
          && Math.abs((left + right + 1) / 2 - geometry.x) <= 1
          && Math.abs((top + bottom + 1) / 2 - geometry.y) <= 1);
      }

      selectImage(0);
      const before = getBaseLayerRect(files[0]);
      moveSelectedLayerEntities(30, -20); moveSelectedLayerEntities(-30, 20);
      let rect = getBaseLayerRect(files[0]);
      assert('Prepared layer movement has no cumulative vertical drift', near(rect.x, before.x) && near(rect.y, before.y));
      centerSelectedLayerEntities(); rect = getBaseLayerRect(files[0]);
      assert('Center action reaches the exact canvas center for prepared layers', near(rect.x, 788) && near(rect.y, 788));
      const centered = rect; scaleSelectedLayerEntities(.9); rect = getBaseLayerRect(files[0]);
      assert('Scaling a prepared layer preserves its center', near(rect.x, centered.x) && near(rect.y, centered.y));

      selectImage(2);
      const close = files[2], previousRemovals = removals;
      assert('Remove BG is disabled on a Close View layer', removeBgButton.disabled);
      toggleSelectedLayerBackgrounds();
      document.dispatchEvent(new KeyboardEvent('keydown', {key: 'b', code: 'KeyB', ctrlKey: true, bubbles: true}));
      assert('Selected action and Ctrl+B never remove a Close View background', !close.removeBg && removals === previousRemovals);
      applyImageScale(20);
      canvasWrap.dispatchEvent(new WheelEvent('wheel', {deltaY: 100, bubbles: true, cancelable: true}));
      scaleSelectedLayerEntities(.5);
      assert('Scale input, wheel and group resizing cannot shrink Close View below native size', close.scale === 100 && getBaseLayerRect(close).width === 400 && imageScaleValue.value === '100');
      close.scale = 10; scaleSelectedLayerEntities(1.1);
      assert('Resizing stale Close View state starts from its actual native size', near(close.scale, 110) && near(getBaseLayerRect(close).width, 440));
      applyImageScale(100);

      duplicateSelectedLayers();
      const copy = close.layers.at(-1);
      assert('Duplicated Close View layer keeps native dimensions and background protection', isCloseViewImage(copy) && !copy.removeBg && getAddedLayerDrawRect(copy).width === 400);
      copySelectedLayers(); await pasteCopiedLayers();
      assert('Pasted Close View layer keeps native dimensions and background protection', isCloseViewImage(close.layers.at(-1)) && getAddedLayerDrawRect(close.layers.at(-1)).width === 400);
      const other = files[0];
      close.layers.push({...copy, id: createLayerId(), file: sources[0], image: other.image, closeView: false, removeBg: false});
      normalizeLayerOrder(close); selectedLayerIds = new Set(close.layers.map(layer => layer.id));
      const ordinary = close.layers.at(-1);
      toggleSelectedLayerBackgrounds();
      assert('Mixed selection removes only eligible layer backgrounds', ordinary.removeBg && close.layers.filter(isCloseViewImage).every(layer => !layer.removeBg));
      toggleSelectedLayerBackgrounds();
      assert('Second mixed-selection toggle restores eligible backgrounds', !ordinary.removeBg);
      close.layers = []; close.layerOrder = ['base']; selectedLayerIds = new Set(['base']);
      const stalePreparation = other.smartPrep;
      removeAllBgButton.click();
      assert('Remove All BG skips filename and metadata Close Views but processes ordinary images', !files[2].removeBg && !files[3].removeBg && files[0].removeBg && files[1].removeBg && files[4].removeBg);
      // Even stale edit state must never send Close Views through removal on export.
      const erased = document.createElement('canvas'); erased.width = 400; erased.height = 300;
      close.removeBg = true; close.processed = erased; close.smartPrep = stalePreparation; close.scale = 10;
      const countBeforeExport = removals;
      const bitmap = await createImageBitmap(await createExportBlob(close, 'png'));
      const actual = document.createElement('canvas'); actual.width = actual.height = 1576;
      const actualContext = actual.getContext('2d'); actualContext.drawImage(bitmap, 0, 0); bitmap.close();
      const expected = document.createElement('canvas'); expected.width = expected.height = 1576;
      const expectedContext = expected.getContext('2d'); expectedContext.fillStyle = '#fff'; expectedContext.fillRect(0, 0, 1576, 1576);
      expectedContext.imageSmoothingQuality = 'high'; // Match the renderer's watermark resampling; the Close View remains native.
      expectedContext.drawImage(close.image, 588, 638); expectedContext.drawImage(close.watermarkImage, 0, 0, 1576, 1576);
      const actualPixels = actualContext.getImageData(0, 0, 1576, 1576).data, expectedPixels = expectedContext.getImageData(0, 0, 1576, 1576).data;
      assert('Close View PNG is pixel-identical to the original centered image plus template, even with stale removal/scale state', actualPixels.every((value, index) => value === expectedPixels[index]) && removals === countBeforeExport);
      close.removeBg = false; close.processed = null; close.smartPrep = null; close.scale = 100;
      await duplicateBatchImage(2);
      assert('Batch duplicate retains Close View protection and native size', isCloseViewImage(files[3]) && getBaseLayerRect(files[3]).width === 400);
      listingSmartPrep.checked = false; await applyListingWatermarks();
      assert('Smart preparation off still preserves all Close View sources', files.filter(isCloseViewImage).every(item => !item.removeBg && !item.smartPrep && item.scale === 100));
      const [largeClose] = addImages([await fixture('Close View large.png', 2000, 1900)]); await largeClose.image.decode();
      await applyListingWatermarks();
      const largeRect = getBaseLayerRect(largeClose);
      assert('Close View larger than the output is centered without automatic shrinking', largeRect.width === 2000 && largeRect.height === 1900 && largeRect.x === 788 && largeRect.y === 788 && !largeClose.removeBg);
      listingSmartPrep.checked = true; await applyListingWatermarks(); selectImage(0);
      const originalArea = files[0].smartPrep.safeArea;
      const template = findWatermarkTemplate(files[0].watermarkSection, files[0].watermarkTemplateId);
      await saveWatermarkSafeArea(files[0].watermarkSection, template, {...originalArea, topMargin: 1400, bottomMargin: 20, source: 'custom'});
      resizeWidth.value = resizeHeight.value = 360;
      let rejected = false;
      try { await applyListingWatermarks(); } catch (error) { rejected = error.message.includes('50px gap'); }
      assert('Impossible custom margins produce an explicit error instead of discarding the gap', rejected);
      return checks;
    });
    if (errors.length) throw Error(errors.join('; '));
    console.log(JSON.stringify({passed: results.length, checks: results, errors}, null, 2));
  } catch (error) {
    console.error(error);
    console.error(await page.evaluate(() => window.preparationChecks || []));
    process.exitCode = 1;
  } finally { await browser.close(); }
})();
