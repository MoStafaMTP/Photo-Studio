// Real RAW fixtures stay outside the repository. Usage: node tests/raw-import.browser.cjs photo.CR2 photo.CR3
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path'), fs = require('node:fs'), os = require('node:os');
(async () => {
  const paths = process.argv.slice(2); if (paths.length !== 2) throw Error('Pass a real CR2 and CR3 photo.');
  const browser = await chromium.launch({headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {}), args: ['--allow-file-access-from-files']});
  const context = await browser.newContext(), page = await context.newPage({viewport: {width: 1600, height: 1000}}), checks = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const check = async (name, predicate) => { if (!await page.evaluate(predicate)) throw Error(name); checks.push(name); };
  try {
    // Decoding itself must work without an external service, even from file://.
    await context.route(/^https?:\/\//, route => route.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.evaluate(async () => { await historyReady; listingAutoPrompted = true; });
    const upload = paths.map((file, i) => ({name: i ? 'DB.CR3' : 'DT.CR2', mimeType: i ? 'application/octet-stream' : '', buffer: fs.readFileSync(file)}));
    await page.locator('#image-input').setInputFiles(upload);
    await page.waitForFunction(() => !PhotoStudioImageInput.busy && (document.querySelector('#editor-status').textContent.includes('Could not load') || (files.length === 2 && files.every(item => item.image.complete && item.image.naturalWidth))), null, {timeout: 180000});
    console.log('Decoded:', await page.evaluate(() => files.map(item => ({name: item.file.name, width: item.image.naturalWidth, height: item.image.naturalHeight, originalType: item.file.type, decodedType: PhotoStudioImageInput.source(item.file).type}))));
    await check('Picker accepts both Canon formats and empty/generic MIME types', () => input.accept.includes('.cr2') && input.accept.includes('.cr3') && layerImageInput.accept.includes('.cr3') && files.length === 2);
    await check('Both photos decode to real full-size PNG pixels, preserving the original files and names', () => files.every(item => PhotoStudioImageInput.source(item.file).type === 'image/png' && PhotoStudioImageInput.source(item.file) !== item.file && item.image.naturalWidth >= 1900 && item.image.naturalHeight >= 1200 && item.displayName === item.file.name));
    await check('RAW import preserves the background and original scale by default', () => files.every(item => !item.removeBg && item.scale === 100));
    const outputDir = path.join(os.tmpdir(), 'photo-studio-raw'); fs.mkdirSync(outputDir, {recursive: true});
    for (let i = 0; i < 2; i++) {
      const preview = await page.evaluate(index => {
        const source = files[index].image, c = document.createElement('canvas'); c.width = 1200; c.height = Math.round(source.naturalHeight / source.naturalWidth * 1200); c.getContext('2d').drawImage(source, 0, 0, c.width, c.height); return c.toDataURL().split(',')[1];
      }, i); fs.writeFileSync(path.join(outputDir, `decoded-${i + 1}.png`), Buffer.from(preview, 'base64'));
    }
    await check('RAW filenames export with the selected raster extension', () => exportFileName(files[0], 'jpg') === 'DT.jpg' && exportFileName(files[1], 'webp') === 'DB.webp');
    await page.evaluate(() => undo()); await check('One Undo removes the whole RAW import', () => files.length === 0);
    await page.evaluate(() => redo()); await check('Redo restores decoded pixels without re-decoding', () => files.length === 2 && files.every(item => item.image.naturalWidth > 0));
    await page.evaluate(async () => {
      selectImage(0); await duplicateBatchImage(0); window.batchCopy = files[1];
      selectImage(0); await addLayerImages([files[2].file]); window.rawLayer = files[0].layers[0];
      copySelectedLayers(); await pasteCopiedLayers(); window.pasted = files[0].layers.at(-1);
    });
    await check('Batch copies, added RAW layers and pasted layers reuse decoded assets', () => batchCopy.image.naturalWidth === files[0].image.naturalWidth && rawLayer.image.naturalWidth === files[2].image.naturalWidth && pasted.image.naturalHeight === rawLayer.image.naturalHeight && rawLayer.file === pasted.file);
    await page.evaluate(async () => {
      selectImage(2); listingAccount.value = '6'; listingMaterial.value = 'genuine-leather-solid'; listingSmartPrep.checked = false; await applyListingWatermarks(); closeListingPanel();
    });
    await check('Listing generates decoded DT/DB unmain copies with preserved RAW filenames', () => files.filter(item => item.generatedFromImageId).length >= 2 && files.filter(item => item.generatedFromImageId).every(item => / unmain(?: \(\d+\))?\.CR[23]$/i.test(item.file.name) && item.image.naturalWidth > 0));
    const formats = await page.evaluate(async () => {
      const item = files[0]; const sizes = [];
      for (const format of ['jpg', 'png', 'webp']) { const bitmap = await createImageBitmap(await createExportBlob(item, format)); sizes.push([bitmap.width, bitmap.height]); bitmap.close(); }
      return sizes;
    });
    if (!formats.every(([w, h]) => w === 1576 && h === 1576)) throw Error('RAW exports'); checks.push('RAW compositions export as JPG, PNG and WebP at the chosen canvas size');
    // The real AI smoke is separate; state tests inject a predictable mask.
    await require('./background-fixture.cjs').install(page);
    await page.evaluate(async () => { selectImage(0); selectedLayerIds = new Set(['base']); window.rect = getBaseLayerRect(files[0]); await toggleSelectedLayerBackgrounds(); });
    await check('Decoded RAW uses the shared Remove BG pipeline without resizing', () => files[0].removeBg && files[0].processedAI && files[0].processed.width === files[0].image.naturalWidth && JSON.stringify(rect) === JSON.stringify(getBaseLayerRect(files[0])));
    await page.keyboard.press('Control+b'); await check('Ctrl+B restores the developed RAW image at the same geometry', () => !files[0].removeBg && JSON.stringify(rect) === JSON.stringify(getBaseLayerRect(files[0])));
    await page.locator('#image-input').setInputFiles({name: 'damaged.CR3', mimeType: '', buffer: Buffer.from('not a RAW file')});
    await page.waitForFunction(() => !PhotoStudioImageInput.busy && document.querySelector('#editor-status').textContent.includes('damaged.CR3'), null, {timeout: 30000});
    await check('A damaged RAW file is reported and does not create a broken thumbnail', () => !files.some(item => item.file.name === 'damaged.CR3') && document.querySelector('#editor-status').textContent.includes('Could not load'));
    await page.screenshot({path: path.join(outputDir, 'raw-import-editor.png')});
    if (errors.length) throw Error(errors.join('; ')); console.log(JSON.stringify({passed: checks.length, checks, errors}, null, 2));
  } catch (error) { console.error(error); console.error(checks); console.error(await page.evaluate(() => document.querySelector('#editor-status')?.textContent).catch(() => 'Page unavailable')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
