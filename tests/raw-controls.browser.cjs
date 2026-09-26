// Upload controls, cancellation, mixed failures, orientation and CPIS on plain HTTP.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
(async () => {
  const fixture = process.argv[2]; if (!fixture) throw Error('Pass a real CR2 fixture.');
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname), file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html'); fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({headless: true, ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {})});
  const page = await browser.newPage(), checks = [], errors = [];
  const check = async (name, test) => { if (!await page.evaluate(test)) throw Error(name); checks.push(name); };
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    let held, requested; const loading = new Promise(resolve => { requested = resolve; });
    await page.route('**/vendor/libraw/raw-runtime.js', route => { held = route; requested(); });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.evaluate(async () => { await historyReady; listingAutoPrompted = true; window.initialUndo = undoStack.length; });
    await page.locator('#image-input').setInputFiles({name: 'cancel.CR2', mimeType: '', buffer: Buffer.from('cancel before decoding')});
    await loading; await page.getByRole('button', {name: 'Cancel', exact: true}).click();
    await page.waitForFunction(() => !PhotoStudioImageInput.busy);
    await check('Cancel closes immediately while the decoder script is still loading', () => !files.length && undoStack.length === initialUndo && !document.querySelector('.raw-import-progress'));
    await page.unroute('**/vendor/libraw/raw-runtime.js'); await held.continue();
    await page.locator('#image-input').setInputFiles(fixture);
    await page.waitForFunction(() => !PhotoStudioImageInput.busy && files.length === 1 && files[0].image.naturalWidth, null, {timeout: 90000});
    await check('Real RAW decoding works on ordinary HTTP without isolation headers', () => !crossOriginIsolated && files[0].image.naturalWidth > 1000);
    await page.evaluate(() => {
      window.sourceRawFile = files[0].file; window.sourceWidth = files[0].image.naturalWidth; window.sourceHeight = files[0].image.naturalHeight;
      const data = new DataTransfer(); data.items.add(new File([sourceRawFile], 'dropped.cR2', {type: ''}));
      canvasWrap.dispatchEvent(new DragEvent('drop', {bubbles: true, cancelable: true, dataTransfer: data}));
    });
    await page.waitForFunction(() => !PhotoStudioImageInput.busy && files.length === 2 && files[1].image.naturalWidth, null, {timeout: 90000});
    await check('Canvas drag-and-drop accepts mixed-case RAW names with an empty MIME type', () => files[1].file.name === 'dropped.cR2' && files[1].image.naturalWidth === sourceWidth);
    await page.evaluate(() => {
      selectImage(0); const data = new DataTransfer(); data.items.add(new File([sourceRawFile], 'layer.CR2', {type: 'application/octet-stream'}));
      layerDropZone.dispatchEvent(new DragEvent('drop', {bubbles: true, cancelable: true, dataTransfer: data}));
    });
    await page.waitForFunction(() => !PhotoStudioImageInput.busy && files[0].layers.length === 1, null, {timeout: 90000});
    await check('Layers drag-and-drop decodes a new RAW file and retains 100% scale', () => files.length === 2 && files[0].layers[0].image.naturalWidth === sourceWidth && files[0].layers[0].scale === 100);
    await page.evaluate(async () => {
      const c = document.createElement('canvas'); c.width = c.height = 80; c.getContext('2d').fillRect(0, 0, 80, 80);
      const png = new File([await new Promise(resolve => c.toBlob(resolve))], 'valid.png', {type: 'image/png'});
      await importImages([new File(['broken'], 'damaged.CR3', {type: ''}), png, new File(['text'], 'note.txt', {type: 'text/plain'})]);
    });
    await check('A mixed batch imports good photos and identifies failed/unsupported files', () => files.length === 3 && files[2].file.name === 'valid.png' && document.querySelector('#editor-status').textContent.includes('damaged.CR3') && document.querySelector('#editor-status').textContent.includes('note.txt'));
    await page.evaluate(async () => {
      while (files.length) removeBatchImage(0);
      const payload = {account: 'US Auto Nation', material: 'Genuine Leather Solid', images: [{filename: 'bad.CR3', variation: 'DT', subtype: 'main'}]};
      try { await PhotoStudioIntegration.importImages(payload, [new File(['bad'], 'bad.CR3')]); } catch (error) { window.cpisRawError = error.message; }
    });
    await check('CPIS rejects failed RAW decoding without committing files or metadata', () => !files.length && !cpisListingContext && cpisRawError.includes('bad.CR3'));
    await page.evaluate(async () => {
      const file = new File([sourceRawFile], 'DT.CR2', {type: ''});
      await PhotoStudioIntegration.importImages({account: 'US Auto Nation', material: 'Genuine Leather Solid', images: [{filename: file.name, variation: 'PT', subtype: 'main'}]}, [file]);
      closeListingPanel();
    });
    await check('CPIS accepts RAW with no MIME, retains filename identity and honors resolved metadata', () => files.length === 1 && files[0].file.name === 'DT.CR2' && files[0].image.naturalWidth === sourceWidth && PhotoStudioIntegration.getPlan().images[0].variation === 'PT');
    const portrait = Buffer.from(fs.readFileSync(fixture));
    const little = portrait.toString('ascii', 0, 2) === 'II';
    const u16 = offset => little ? portrait.readUInt16LE(offset) : portrait.readUInt16BE(offset);
    const u32 = offset => little ? portrait.readUInt32LE(offset) : portrait.readUInt32BE(offset);
    const ifd = u32(4); let orientation;
    for (let i = 0; i < u16(ifd); i++) { const entry = ifd + 2 + i * 12; if (u16(entry) === 274 && u16(entry + 2) === 3 && u32(entry + 4) === 1) orientation = entry + 8; }
    if (!orientation) throw Error('This fixture needs an orientation tag for the portrait test.');
    if (little) portrait.writeUInt16LE(6, orientation); else portrait.writeUInt16BE(6, orientation);
    await page.locator('#image-input').setInputFiles({name: 'portrait.CR2', mimeType: '', buffer: portrait});
    await page.waitForFunction(() => !PhotoStudioImageInput.busy && files.length === 2 && files[1].image.naturalWidth, null, {timeout: 90000});
    await check('Camera portrait orientation is honored exactly once', () => files[1].image.naturalWidth === sourceHeight && files[1].image.naturalHeight === sourceWidth);
    if (errors.length) throw Error(errors.join('; ')); console.log(JSON.stringify({passed: checks.length, checks, errors}, null, 2));
  } catch (error) { console.error(error); console.error(checks); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
