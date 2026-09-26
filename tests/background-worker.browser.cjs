const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {}), args: ['--allow-file-access-from-files']});
  const context = await browser.newContext(), page = await context.newPage(), checks = []; let requests = 0;
  try {
    await context.route('https://fonts.googleapis.com/**', route => route.abort());
    await context.route('https://cdn.jsdelivr.net/**', route => { requests++; return route.abort(); });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    const result = await page.evaluate(async () => {
      const checks = [], check = (name, ok) => { if (!ok) throw Error(name); checks.push(name); };
      const make = (transparent = true) => { const c = document.createElement('canvas'); c.width = 160; c.height = 120; const ctx = c.getContext('2d');
        if (!transparent) { ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 160, 120); }
        ctx.fillStyle = '#17345e'; ctx.fillRect(30, 30, 100, 60); ctx.fillStyle = '#ff000080'; ctx.fillRect(15, 35, 15, 40); return c; };
      const original = make(), output = await PhotoStudioBackground.remove(original);
      const before = original.getContext('2d').getImageData(0, 0, 160, 120).data, after = output.getContext('2d').getImageData(0, 0, 160, 120).data;
      check('Real worker preserves transparent uploads and fractional alpha byte-for-byte', before.every((value, i) => value === after[i]));
      check('Repeated source reuses the completed worker output', await PhotoStudioBackground.remove(original) === output);
      const aborted = new AbortController(); aborted.abort();
      try { await PhotoStudioBackground.remove(make(), {signal: aborted.signal}); throw Error('Expected cancellation'); } catch (error) { check('An already canceled request never processes', error.name === 'AbortError'); }
      const controller = new AbortController();
      const job = PhotoStudioBackground.remove(make(false), {signal: controller.signal, onProgress: () => controller.abort()});
      try { await job; throw Error('Expected cancellation'); } catch (error) { check('Cancel terminates an active worker and returns AbortError', error.name === 'AbortError'); }
      check('A new worker works immediately after cancellation', Boolean(await PhotoStudioBackground.remove(make())));
      try { await PhotoStudioBackground.remove(make(false)); throw Error('Expected failure'); } catch (error) { check('Runtime download failure is surfaced instead of returning a heuristic mask', error.name !== 'AbortError' && error.message !== 'Expected failure'); }
      check('Worker failure can be followed by a successful new request', Boolean(await PhotoStudioBackground.remove(make())));
      PhotoStudioBackground.dispose(); return checks;
    });
    checks.push(...result); if (!requests) throw Error('Expected blocked runtime request');
    console.log(JSON.stringify({passed: checks.length, checks}, null, 2));
  } catch (error) { console.error(error); console.error(checks); process.exitCode = 1; }
  finally { await browser.close(); }
})();
