const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {}),
    args: ['--allow-file-access-from-files']});
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    const result = await page.evaluate(async () => {
      await historyReady;
      const checks = []; window.smoothingChecks = checks;
      const check = (name, ok) => { if (!ok) throw Error(name); checks.push(name); };
      const make = (w = 256, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
      const pixel = (c, x, y) => [...c.getContext('2d').getImageData(x, y, 1, 1).data];
      const plain = (w = 256, h = w) => { const c = make(w, h); const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); return c; };
      const area = {canvasWidth: 1576, canvasHeight: 1576, topMargin: 100, bottomMargin: 100};
      const source = plain(), ctx = source.getContext('2d');
      ctx.fillStyle = '#183950'; ctx.fillRect(32, 32, 192, 192);
      for (const [label, output] of [['Manual', createBackgroundRemovedSource(source)], ['Workflow', createSmartPreparation(source, area).foreground]]) {
        const ramp = Array.from({length: 8}, (_, x) => pixel(output, x + 30, 128)[3]);
        check(`${label}: broad edges fade across multiple pixels without a hard opacity jump`,
          ramp.filter(alpha => alpha > 0 && alpha < 255).length >= 2 && Math.max(...ramp.slice(1).map((alpha, i) => alpha - ramp[i])) <= 150);
        check(`${label}: feathering stays inside the one-pixel trim`, ramp[2] === 0 && pixel(output, 31, 128)[3] === 0);
        check(`${label}: the interior stays sharp and fully opaque`, pixel(output, 38, 128).join() === pixel(source, 38, 128).join());
      }
      const curve = plain(), curvedContext = curve.getContext('2d');
      curvedContext.fillStyle = '#183950'; curvedContext.beginPath(); curvedContext.ellipse(128.3, 128.7, 95, 78.2, -.3, 0, 2 * Math.PI); curvedContext.fill();
      const curved = createBackgroundRemovedSource(curve), curvedData = curved.getContext('2d').getImageData(0, 0, 256, 256).data;
      const levels = new Set(); for (let i = 3; i < curvedData.length; i += 4) if (curvedData[i] && curvedData[i] < 255) levels.add(curvedData[i]);
      check('Curves use a rich range of fractional opacity instead of a few stepped levels', levels.size >= 20);
      check('Curved interior colors remain unchanged', pixel(curved, 128, 128).join() === pixel(curve, 128, 128).join());
      const diagonal = plain(), dc = diagonal.getContext('2d'); dc.fillStyle = '#183950';
      dc.beginPath(); dc.moveTo(32, 24); dc.lineTo(215, 24); dc.lineTo(215, 232); dc.lineTo(111, 232); dc.closePath(); dc.fill();
      const angled = createBackgroundRemovedSource(diagonal);
      let smoothRows = 0;
      for (let y = 50; y < 210; y++) {
        const row = angled.getContext('2d').getImageData(0, y, 150, 1).data;
        let transitions = 0, largestJump = 0;
        for (let x = 1; x < 150; x++) { const a = row[x * 4 + 3]; if (a > 0 && a < 255) transitions++; largestJump = Math.max(largestJump, a - row[(x - 1) * 4 + 3]); }
        if (transitions >= 2 && largestJump <= 160) smoothRows++;
      }
      check('Slanted edges receive a gradual transition along their whole length', smoothRows === 160);
      const thin = plain(), tc = thin.getContext('2d'); tc.fillStyle = '#183950'; tc.fillRect(24, 160, 208, 64);
      for (let width = 1; width <= 4; width++) tc.fillRect(30 + width * 36, 35, width, 130);
      const thinResult = createBackgroundRemovedSource(thin);
      for (let width = 1; width <= 4; width++) {
        check(`${width}px details stay visible and connected to the product`, Array.from({length: 128}, (_, y) => {
          let alpha = 0; for (let x = 0; x < width; x++) alpha += pixel(thinResult, 30 + width * 36 + x, 36 + y)[3]; return alpha >= 128;
        }).every(Boolean));
      }
      const transparent = make(), transparentContext = transparent.getContext('2d');
      transparentContext.fillStyle = '#183950'; transparentContext.fillRect(32, 32, 192, 192);
      transparentContext.clearRect(80, 80, 90, 90); transparentContext.fillStyle = 'rgba(230,240,250,.3)'; transparentContext.fillRect(80, 80, 90, 90);
      const translucent = createBackgroundRemovedSource(transparent);
      check('Internal translucent areas and their opaque neighbors retain exact source pixels', [[79, 120], [80, 120], [120, 120]].every(([x, y]) => pixel(translucent, x, y).join() === pixel(transparent, x, y).join()));
      const large = plain(2400, 2000), lc = large.getContext('2d'); lc.fillStyle = '#183950'; lc.fillRect(300, 250, 1800, 1500);
      const largePrep = createSmartPreparation(large, area), edge = Array.from({length: 10}, (_, x) => pixel(largePrep.foreground, 297 + x, 1000)[3]);
      check('Large workflow images retain native-resolution feathering and untouched interior pixels', largePrep.foreground.width === 2400 && edge.filter(a => a > 0 && a < 255).length >= 2 && pixel(largePrep.foreground, 1200, 1000).join() === pixel(large, 1200, 1000).join());

      listingAutoPrompted = true;
      const file = new File([await new Promise(resolve => source.toBlob(resolve))], 'smooth.png', {type: 'image/png'});
      const [item] = addImages([file]); await item.image.decode(); selectImage(files.indexOf(item));
      item.originalSize = true; item.watermarkEnabled = false; backgroundMode = 'none'; resizeWidth.value = resizeHeight.value = 500; drawActive();
      const rect = getBaseLayerRect(item); removeBgButton.click();
      check('Remove BG keeps the exact image size and position', ['x', 'y', 'width', 'height'].every(k => getBaseLayerRect(item)[k] === rect[k]));
      const firstRamp = Array.from({length: 8}, (_, x) => pixel(getImageSource(item), 30 + x, 128)[3]).join();
      removeBgButton.click(); removeBgButton.click();
      check('Repeated removal does not progressively soften or shrink the cutout', firstRamp === Array.from({length: 8}, (_, x) => pixel(getImageSource(item), 30 + x, 128)[3]).join());
      undo(); check('Undo restores the original background', !item.removeBg); redo();
      check('Redo restores the same softened edge', item.removeBg && firstRamp === Array.from({length: 8}, (_, x) => pixel(getImageSource(item), 30 + x, 128)[3]).join());
      for (const format of ['png', 'jpg', 'webp']) {
        exportFormat.value = format;
        const blob = await createExportBlob(item, format), bitmap = await createImageBitmap(blob), output = make(500); output.getContext('2d').drawImage(bitmap, 0, 0); bitmap.close();
        if (format === 'png') {
          check('PNG export preserves the same smooth alpha as the cutout', firstRamp === Array.from({length: 8}, (_, x) => pixel(output, 152 + x, 250)[3]).join());
        } else {
          const ramp = Array.from({length: 8}, (_, x) => pixel(output, 152 + x, 250));
          check(`${format.toUpperCase()} exports composite the gradual edge over white`, ramp[0][0] > 235 && ramp[7][0] < 45 && ramp.every(p => p[3] === 255) && ramp.filter(p => p[0] > 45 && p[0] < 230).length >= 2);
        }
      }

      // Optional visual QA sheet: actual cutouts over light/dark backgrounds,
      // with a magnified crop to inspect native pixels rather than CSS scaling.
      const preview = make(1024, 700), pc = preview.getContext('2d'); pc.fillStyle = '#eef1f5'; pc.fillRect(0, 0, 1024, 700);
      pc.font = '20px sans-serif'; pc.fillStyle = '#1a2634'; pc.fillText('Smooth cutout edges — generated regression fixtures', 24, 32);
      for (const [i, bg] of ['#fff', '#18202c'].entries()) {
        pc.fillStyle = bg; pc.fillRect(24 + i * 500, 52, 476, 620);
        pc.drawImage(curved, 32 + i * 500, 60); pc.drawImage(angled, 264 + i * 500, 60, 224, 256);
        pc.imageSmoothingEnabled = false; pc.drawImage(curved, 30, 78, 36, 54, 48 + i * 500, 344, 216, 324);
        pc.drawImage(angled, 55, 90, 36, 54, 280 + i * 500, 344, 216, 324); pc.imageSmoothingEnabled = true;
      }
      return {checks, preview: preview.toDataURL()};
    });
    if (errors.length) throw Error(errors.join('; '));
    if (process.env.CUTOUT_PREVIEW) fs.writeFileSync(process.env.CUTOUT_PREVIEW, Buffer.from(result.preview.split(',')[1], 'base64'));
    console.log(JSON.stringify({passed: result.checks.length, checks: result.checks, errors}, null, 2));
  } catch (error) {
    console.error(error); console.error(await page.evaluate(() => window.smoothingChecks || [])); process.exitCode = 1;
  } finally { await browser.close(); }
})();
