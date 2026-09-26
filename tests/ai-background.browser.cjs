// Real-model smoke/visual QA. Supply AI_MODEL_PATH to reuse the verified model
// locally, and pass private input photos as arguments (they are never committed).
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path'), fs = require('node:fs'), os = require('node:os'), http = require('node:http');
(async () => {
  const server = http.createServer((req, res) => { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Content-Length', fs.statSync(process.env.AI_MODEL_PATH).size); fs.createReadStream(process.env.AI_MODEL_PATH).pipe(res); });
  if (process.env.AI_MODEL_PATH) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {}), args: ['--allow-file-access-from-files']});
  const context = await browser.newContext(), page = await context.newPage({viewport: {width: 1920, height: 1080}}), checks = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const check = (name, ok) => { if (!ok) throw Error(name); checks.push(name); };
  try {
    await context.route('https://fonts.googleapis.com/**', route => route.abort());
    if (process.env.AI_MODEL_PATH) await context.route('https://huggingface.co/skillsafe-ai/isnet-general-use/resolve/**', route => route.fulfill({status: 307, headers: {location: `http://127.0.0.1:${server.address().port}/model.onnx`, 'access-control-allow-origin': '*'}}));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.evaluate(async () => { await historyReady; listingAutoPrompted = true; });
    const inputs = process.argv.slice(2); if (!inputs.length) throw Error('Pass at least one local product photo.');
    await page.locator('#image-input').setInputFiles(inputs);
    await page.waitForFunction(count => files.length === count && files.every(item => item.image.complete && item.image.naturalWidth), inputs.length);
    for (let index = 0; index < inputs.length; index++) {
      await page.evaluate(index => { selectImage(index); window.beforeRect = getBaseLayerRect(files[index]); }, index);
      const started = Date.now(); await page.locator('#remove-bg').click();
      await page.waitForFunction(() => !backgroundRemovalBusy, null, {timeout: 600000});
      const result = await page.evaluate(() => {
        const item = files[activeIndex], source = item.processed; if (!source) throw Error(document.querySelector('#editor-status').textContent);
        const p = source.getContext('2d').getImageData(0, 0, source.width, source.height).data; let opaque = 0, soft = 0, transparent = 0;
        for (let i = 3; i < p.length; i += 4) { if (p[i] === 255) opaque++; else if (p[i] === 0) transparent++; else soft++; }
        const dark = document.createElement('canvas'); dark.width = source.width; dark.height = source.height; const c = dark.getContext('2d'); c.fillStyle = '#20232a'; c.fillRect(0, 0, dark.width, dark.height); c.drawImage(source, 0, 0);
        return {removed: item.removeBg && item.processedAI, sameSize: source.width === item.image.naturalWidth && source.height === item.image.naturalHeight,
          sameGeometry: JSON.stringify(beforeRect) === JSON.stringify(getBaseLayerRect(item)), opaque, soft, transparent, png: source.toDataURL().split(',')[1], dark: dark.toDataURL().split(',')[1]};
      });
      check(`Image ${index + 1}: AI cutout keeps source resolution and editor geometry`, result.removed && result.sameSize && result.sameGeometry);
      check(`Image ${index + 1}: foreground, transparent background and fractional edge coverage`, result.opaque > 10000 && result.transparent > 10000 && result.soft > 1000);
      const output = path.join(os.tmpdir(), 'photo-studio-ai'); fs.mkdirSync(output, {recursive: true});
      for (const key of ['png', 'dark']) fs.writeFileSync(path.join(output, path.basename(inputs[index]) + '-refined-' + key + '.png'), Buffer.from(result[key], 'base64'));
      console.log(JSON.stringify({image: path.basename(inputs[index]), ms: Date.now() - started, opaque: result.opaque, soft: result.soft, transparent: result.transparent}));
      await page.evaluate(() => { window.cached = files[activeIndex].processed; });
      await page.keyboard.press('Control+b'); check('Restore uses the exact uploaded source', await page.evaluate(() => !files[activeIndex].removeBg && getImageSource(files[activeIndex]) === files[activeIndex].image));
      await page.keyboard.press('Control+b'); check('Repeated removal reuses the same cutout', await page.evaluate(() => files[activeIndex].removeBg && files[activeIndex].processed === cached));
      await page.keyboard.press('Control+z'); check('Undo restores original', await page.evaluate(() => !files[activeIndex].removeBg));
      await page.keyboard.press('Control+y'); check('Redo restores AI cutout', await page.evaluate(() => files[activeIndex].removeBg && files[activeIndex].processed === cached));
    }
    await page.evaluate(async () => { selectImage(0); listingAccount.value = '7'; listingSmartPrep.checked = true; await applyListingWatermarks(); closeListingPanel(); window.preparedRect = getBaseLayerRect(files[activeIndex]); });
    await page.locator('#remove-bg').click(); await page.waitForFunction(() => !backgroundRemovalBusy, null, {timeout: 120000});
    check('Prepared image uses AI cutout without changing its sizing', await page.evaluate(() => {
      const item = files[activeIndex], sources = [], draw = ctx.drawImage; ctx.drawImage = function(source, ...args) { sources.push(source); return draw.call(this, source, ...args); };
      try { drawActive(); } finally { ctx.drawImage = draw; }
      return item.processedAI && item.removeBg && sources.includes(item.processed) && !sources.includes(item.smartPrep.foreground) && JSON.stringify(preparedRect) === JSON.stringify(getBaseLayerRect(item));
    }));
    await page.evaluate(() => { selectedLayerIds = new Set(['base']); duplicateSelectedLayers(); window.duplicate = files[activeIndex].layers.at(-1); });
    check('Prepared duplicate inherits the AI cutout', await page.evaluate(() => duplicate.removeBg && duplicate.sourceSnapshot.aiCutout && getAddedLayerSource(duplicate) === duplicate.sourceSnapshot.cutout));
    await page.locator('#remove-bg').click(); await page.locator('#remove-bg').click();
    check('Prepared duplicate toggles with its saved AI cutout', await page.evaluate(() => duplicate.removeBg && duplicate.processed === duplicate.sourceSnapshot.cutout));
    check('No page errors', !errors.length); console.log(JSON.stringify({passed: checks.length, checks, errors}, null, 2));
  } catch (error) { console.error(error); console.error(checks); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
