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
      const checks = []; window.dsaChecks = checks;
      const check = (name, ok) => { if (!ok) throw Error(name); checks.push(name); };
      const choose = (control, value) => { control.value = value; control.dispatchEvent(new Event('change', {bubbles: true})); };
      const dsa = WATERMARK_SECTION_NAMES.indexOf('DSA eBay'), defaultTemplate = watermarkSections[dsa].templates[0];
      choose(listingAccount, String(dsa));
      check('Selecting DSA before uploading hides and disables material selection', listingMaterialField.hidden && listingMaterial.disabled && getComputedStyle(listingMaterialField).display === 'none');
      check('DSA does not prompt for material in the introductory or manager text', !listingIntroduction.textContent.includes('choose') && listingTemplateManagerSummary.textContent === 'Upload images to begin');
      const source = document.createElement('canvas'); source.width = source.height = 200;
      const c = source.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, 200, 200); c.fillStyle = '#900'; c.fillRect(60, 30, 80, 140);
      const blob = await new Promise(resolve => source.toBlob(resolve));
      addImages(['DT.png', 'PB.png', 'details.png', 'DOPTcv.png'].map(name => new File([blob], name, {type: 'image/png'})));
      await Promise.all(files.map(item => item.image.decode()));
      await new Promise(resolve => setTimeout(resolve, 50));
      renderListingPreview(); const plan = createListingPlan();
      check('Upload automatically opens DSA Listing with no material question', !listingPanel.hidden && listingMaterialField.hidden && listingMaterial.value === '');
      check('DSA enables Apply Workflow with a blank material', plan.ready && !plan.requiresMaterial && !listingApplyButton.disabled);
      check('Main, passenger, normal and generated unmain rows use the exact DSA template', plan.rows.length === 5 && plan.rows.every(row => row.template.id === defaultTemplate.id && !row.fallback));
      check('Local DSA integration plans do not invent a material', PhotoStudioIntegration.getPlan().material === null);
      listingTemplateManager.open = true; await renderListingTemplateManager();
      check('The template manager shows one DSA template without requiring material', listingTemplateManagerGrid.querySelectorAll('.listing-template-safe-card').length === 1 && listingTemplateManagerGrid.textContent.includes(defaultTemplate.name));
      for (const material of Object.keys(LISTING_MATERIAL_RULES)) {
        listingMaterial.value = material;
        check(`Stored ${material} has no effect on DSA matching`, createListingPlan().rows.every(row => row.template.id === defaultTemplate.id));
      }
      listingMaterial.value = ''; renderListingPreview();
      await applyListingWatermarks();
      check('Apply Workflow assigns the DSA watermark to every output with material still blank', files.length === 5 && files.every(item => item.watermarkSection === dsa && item.watermarkTemplateId === defaultTemplate.id && item.watermarkEnabled) && listingMaterial.value === '');
      const cv = files.find(item => item.file.name === 'DOPTcv.png');
      check('DSA retains Close View background and native-size protection', !cv.smartPrep && !cv.removeBg && cv.originalSize && cv.scale === 100);
      choose(listingAccount, '6');
      check('Switching away from DSA restores material selection and blocks an incomplete workflow', !listingMaterialField.hidden && !listingMaterial.disabled && !createListingPlan().ready && listingApplyButton.disabled);
      choose(listingMaterial, 'perforated');
      check('Other accounts keep their material-specific template mapping', createListingPlan().ready && createListingPlan().rows.find(row => row.item.file.name === 'DT.png').template.name === 'PI');
      choose(listingAccount, String(dsa));
      check('Returning to DSA skips material without overwriting the saved choice', listingMaterialField.hidden && listingMaterial.value === 'perforated' && createListingPlan().ready);
      undo(); check('Undo of the account change restores the visible material control', listingAccount.value === '6' && !listingMaterialField.hidden && listingMaterial.value === 'perforated');
      redo(); check('Redo of the account change restores the DSA skip state', listingAccount.value === String(dsa) && listingMaterialField.hidden && createListingPlan().ready);
      const payload = {account: 'DSA', material: 'Genuine Leather Solid', images: files.map(item => ({filename: item.file.name, imageId: item.id, variation: 'DT', subtype: 'unmain'}))};
      setCPISMetadata(payload);
      check('CPIS DSA imports keep their supplied material but do not show the material question', listingMaterialField.hidden && PhotoStudioIntegration.getMetadata().material === payload.material && createListingPlan().rows.every(row => row.template.id === defaultTemplate.id));
      payload.images[0].templateName = 'not-installed';
      let rejected = false; try { setCPISMetadata(payload); } catch (error) { rejected = error.message.includes('not available'); }
      check('Explicit CPIS template validation still rejects missing artwork', rejected);
      clearCPISMetadata(); closeListingPanel(); openListingPanel();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      check('Reopening DSA Listing focuses an available control rather than hidden material', document.activeElement === listingSmartPrep && listingMaterialField.hidden);
      return checks;
    });
    if (errors.length) throw Error(errors.join('; '));
    console.log(JSON.stringify({passed: checks.length, checks, errors}, null, 2));
  } catch (error) {
    console.error(error); console.error(await page.evaluate(() => window.dsaChecks || [])); process.exitCode = 1;
  } finally { await browser.close(); }
})();
