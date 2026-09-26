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
    await require('./background-fixture.cjs').install(page);
    const checks = await page.evaluate(async () => {
      await historyReady;
      const checks = []; window.subjectChecks = checks;
      const check = (name, ok) => { if (!ok) throw Error(name); checks.push(name); };
      const make = () => { const c = document.createElement('canvas'); c.width = c.height = 160; return c; };
      const pixel = (c, x, y) => [...c.getContext('2d').getImageData(x, y, 1, 1).data];
      const plain = () => { const c = make(); const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 160, 160); return c; };
      const asFile = async (canvas, name) => new File([await new Promise(resolve => canvas.toBlob(resolve))], name, {type: 'image/png'});
      const panel = plain(), p = panel.getContext('2d');
      p.fillStyle = '#900'; p.fillRect(20, 20, 120, 120);
      p.fillStyle = '#fff'; p.fillRect(40, 40, 80, 80); // Same as background, inside the product.
      p.fillStyle = '#f8f8f8'; p.fillRect(55, 55, 50, 50);
      const removed = createBackgroundRemovedSource(panel);
      check('White product panels matching the background remain fully opaque', pixel(removed, 45, 45).join() === '255,255,255,255');
      check('Light-gray interior details are not faded by color similarity', pixel(removed, 65, 65).join() === pixel(panel, 65, 65).join());
      check('The connected exterior background is still removed', pixel(removed, 5, 5)[3] === 0 && pixel(removed, 150, 80)[3] === 0);
      const light = plain(), l = light.getContext('2d'); l.fillStyle = '#fafafa'; l.fillRect(30, 30, 100, 100);
      const lightRemoved = createBackgroundRemovedSource(light);
      check('Flood removal stops at a subtle but sharp product boundary', pixel(lightRemoved, 80, 80).join() === '250,250,250,255' && pixel(lightRemoved, 10, 10)[3] === 0);
      const corner = plain(), co = corner.getContext('2d'); co.fillStyle = '#900'; co.fillRect(0, 0, 60, 60); co.fillRect(40, 40, 80, 80);
      const cornerRemoved = createBackgroundRemovedSource(corner);
      check('A subject occupying the top-left corner is not used as the background color', pixel(cornerRemoved, 30, 30).join() === pixel(corner, 30, 30).join() && pixel(cornerRemoved, 140, 140)[3] === 0);
      check('The subject is not trimmed against the outside of the image canvas', pixel(cornerRemoved, 0, 0)[3] === 255 && pixel(cornerRemoved, 0, 30)[3] === 255);
      const thin = plain(), t = thin.getContext('2d'); t.fillStyle = '#900'; t.fillRect(40, 60, 80, 80);
      t.fillRect(70, 20, 1, 40); t.fillRect(100, 20, 2, 40); t.fillRect(15, 90, 25, 1);
      const thinRemoved = createBackgroundRemovedSource(thin);
      check('One-pixel straps survive edge cleanup', Array.from({length: 40}, (_, i) => pixel(thinRemoved, 70, 20 + i)[3]).every(alpha => alpha > 0));
      check('Two-pixel details survive edge cleanup', Array.from({length: 40}, (_, i) => pixel(thinRemoved, 100, 20 + i)[3]).every(alpha => alpha > 0));
      check('Horizontal thin features remain connected to the body', Array.from({length: 28}, (_, i) => pixel(thinRemoved, 15 + i, 90)[3]).every(alpha => alpha > 0));
      check('Broad edges still receive the one-pixel trim and inward feather', pixel(thinRemoved, 40, 110)[3] === 0 && pixel(thinRemoved, 41, 110)[3] > 0 && pixel(thinRemoved, 41, 110)[3] < 255);
      const alphaSource = make(), ac = alphaSource.getContext('2d'); ac.fillStyle = '#fff'; ac.fillRect(20, 20, 120, 120);
      ac.clearRect(45, 45, 70, 70); ac.fillStyle = 'rgba(0,0,0,.25)'; ac.fillRect(45, 45, 70, 70);
      const alphaRemoved = createBackgroundRemovedSource(alphaSource);
      check('Transparent uploads retain opaque white subject regions', pixel(alphaRemoved, 30, 30).join() === '255,255,255,255');
      check('Existing translucent subject regions keep their original alpha', pixel(alphaRemoved, 80, 80).join() === pixel(alphaSource, 80, 80).join());
      check('Translucency inside the subject does not erode adjacent opaque details', pixel(alphaRemoved, 44, 80).join() === pixel(alphaSource, 44, 80).join() && pixel(alphaRemoved, 45, 80).join() === pixel(alphaSource, 45, 80).join());
      const ambiguous = plain(), ambiguousResult = createBackgroundRemovedSource(ambiguous);
      check('No reliable subject leaves the image intact instead of blank', pixel(ambiguousResult, 80, 80).join() === '255,255,255,255');
      const gradient = make(), g = gradient.getContext('2d'), fill = g.createLinearGradient(0, 0, 160, 160);
      fill.addColorStop(0, '#fff'); fill.addColorStop(1, '#ddd'); g.fillStyle = fill; g.fillRect(0, 0, 160, 160);
      g.fillStyle = '#900'; g.fillRect(25, 25, 110, 110); g.fillStyle = '#eee'; g.fillRect(55, 55, 50, 50);
      const gradientRemoved = createBackgroundRemovedSource(gradient);
      check('Graded studio backgrounds are removed while interior matching colors survive', pixel(gradientRemoved, 5, 5)[3] === 0 && pixel(gradientRemoved, 150, 150)[3] === 0 && pixel(gradientRemoved, 80, 80).join() === '238,238,238,255');

      listingAutoPrompted = true;
      const [item] = addImages([await asFile(panel, 'subject.png')]); await item.image.decode(); selectImage(files.indexOf(item));
      item.originalSize = true; resizeWidth.value = resizeHeight.value = 360; backgroundMode = 'none'; exportFormat.value = 'png'; drawActive();
      await toggleSelectedLayerBackgrounds(); const firstCutout = getImageSource(item);
      check('The actual Remove BG button preserves subject details', item.removeBg && pixel(firstCutout, 45, 45)[3] === 255 && pixel(firstCutout, 5, 5)[3] === 0);
      const bounds = getBaseLayerRect(item); await toggleSelectedLayerBackgrounds(); await toggleSelectedLayerBackgrounds();
      check('Repeated background toggles do not cumulatively erode the subject', pixel(getImageSource(item), 41, 45).join() === pixel(firstCutout, 41, 45).join() && getBaseLayerRect(item).width === bounds.width);
      undo(); check('Undo restores the previous background state', !item.removeBg && getImageSource(item) === item.image);
      redo(); check('Redo restores the protected cutout', item.removeBg && pixel(getImageSource(item), 45, 45)[3] === 255);
      duplicateSelectedLayers(); const copy = item.layers.at(-1);
      check('Duplicate layers inherit preserved subject pixels', copy.removeBg && pixel(getAddedLayerSource(copy), 45, 45)[3] === 255);
      item.layers = []; item.layerOrder = ['base']; selectedLayerIds = new Set(['base']); drawActive();
      const bitmap = await createImageBitmap(await createExportBlob(item, 'png'));
      const output = document.createElement('canvas'); output.width = output.height = 360; output.getContext('2d').drawImage(bitmap, 0, 0); bitmap.close();
      check('PNG export keeps white subject panels opaque over a transparent background', pixel(output, 145, 145)[3] === 255 && pixel(output, 105, 105)[3] === 0);
      await addLayerImages([await asFile(light, 'light layer.png')]); await toggleSelectedLayerBackgrounds();
      check('Added layers use the same conservative manual removal', pixel(getAddedLayerSource(item.layers.at(-1)), 80, 80)[3] === 255 && pixel(getAddedLayerSource(item.layers.at(-1)), 5, 5)[3] === 0);
      const [close] = addImages([await asFile(panel, 'DOPTcv.png')]); await close.image.decode(); selectImage(files.indexOf(close));
      await removeAllLayerBackgrounds();
      check('Remove All BG protects subject details and skips Close Views', pixel(getImageSource(item), 45, 45)[3] === 255 && !close.removeBg && getImageSource(close) === close.image);
      return checks;
    });
    if (errors.length) throw Error(errors.join('; '));
    console.log(JSON.stringify({passed: checks.length, checks, errors}, null, 2));
  } catch (error) {
    console.error(error); console.error(await page.evaluate(() => window.subjectChecks || [])); process.exitCode = 1;
  } finally { await browser.close(); }
})();
