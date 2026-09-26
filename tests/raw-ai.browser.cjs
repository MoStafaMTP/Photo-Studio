// End-to-end: real Canon sensor decoding -> real IS-Net -> export/restore.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path'), fs = require('node:fs'), http = require('node:http'), os = require('node:os');
(async () => {
  const inputs = process.argv.slice(2); if (!inputs.length) throw Error('Pass real .CR2/.CR3 files.');
  const server = http.createServer((req, res) => { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Content-Length', fs.statSync(process.env.AI_MODEL_PATH).size); fs.createReadStream(process.env.AI_MODEL_PATH).pipe(res); });
  if (process.env.AI_MODEL_PATH) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {}), args: ['--allow-file-access-from-files']});
  const context = await browser.newContext(), page = await context.newPage(), checks = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await context.route('https://fonts.googleapis.com/**', route => route.abort());
    if (process.env.AI_MODEL_PATH) await context.route('https://huggingface.co/skillsafe-ai/isnet-general-use/resolve/**', route => route.fulfill({status: 307, headers: {location: `http://127.0.0.1:${server.address().port}/model.onnx`, 'access-control-allow-origin': '*'}}));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.evaluate(async () => { await historyReady; listingAutoPrompted = true; });
    await page.locator('#image-input').setInputFiles(inputs);
    await page.waitForFunction(count => !PhotoStudioImageInput.busy && files.length === count && files.every(item => item.image.naturalWidth), inputs.length, {timeout: 180000});
    for (let i = 0; i < inputs.length; i++) {
      await page.evaluate(index => { selectImage(index); selectedLayerIds = new Set(['base']); backgroundMode = 'none'; window.beforeRect = getBaseLayerRect(files[index]); }, i);
      const start = Date.now(); await page.locator('#remove-bg').click(); await page.waitForFunction(() => !backgroundRemovalBusy, null, {timeout: 180000});
      const result = await page.evaluate(async () => {
        const item = files[activeIndex]; if (!item.removeBg || !item.processedAI) throw Error(document.querySelector('#editor-status').textContent);
        const pixels = item.processed.getContext('2d').getImageData(0, 0, item.processed.width, item.processed.height).data;
        let opaque = 0, transparent = 0, fractional = 0;
        for (let i = 3; i < pixels.length; i += 4) { if (pixels[i] === 0) transparent++; else if (pixels[i] === 255) opaque++; else fractional++; }
        const blob = await createExportBlob(item, 'png'), buffer = new Uint8Array(await blob.arrayBuffer());
        let binary = ''; for (let offset = 0; offset < buffer.length; offset += 16384) binary += String.fromCharCode(...buffer.subarray(offset, offset + 16384));
        return {width: item.processed.width, height: item.processed.height, opaque, transparent, fractional,
          sizePreserved: item.processed.width === item.image.naturalWidth && item.processed.height === item.image.naturalHeight,
          geometryPreserved: JSON.stringify(beforeRect) === JSON.stringify(getBaseLayerRect(item)), png: btoa(binary)};
      });
      if (!result.sizePreserved || !result.geometryPreserved || result.opaque < 1000 || result.transparent < 1000 || result.fractional < 500) throw Error('RAW AI cutout dimensions or matte are invalid');
      checks.push(`${path.extname(inputs[i])}: actual AI creates a full-resolution soft-alpha cutout without changing geometry`);
      const dir = path.join(os.tmpdir(), 'photo-studio-raw'); fs.mkdirSync(dir, {recursive: true}); fs.writeFileSync(path.join(dir, `raw-ai-${i + 1}.png`), Buffer.from(result.png, 'base64')); delete result.png;
      console.log({format: path.extname(inputs[i]), milliseconds: Date.now() - start, ...result});
      await page.keyboard.press('Control+b');
      if (!await page.evaluate(() => !files[activeIndex].removeBg && getImageSource(files[activeIndex]) === files[activeIndex].image && JSON.stringify(beforeRect) === JSON.stringify(getBaseLayerRect(files[activeIndex])))) throw Error('Restore failed');
      checks.push(`${path.extname(inputs[i])}: Ctrl+B restores the decoded original`);
    }
    if (errors.length) throw Error(errors.join('; ')); console.log(JSON.stringify({passed: checks.length, checks, errors}, null, 2));
  } catch (error) { console.error(error); console.error(checks); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
