// Requires Playwright for testing only; optional paths reuse an installed runtime.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {}),
    args: ['--allow-file-access-from-files']});
  const page = await browser.newPage({acceptDownloads: true});
  const errors = [], results = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    results.push(...await page.evaluate(async () => {
      const checks = []; window.unmainChecks = checks;
      const check = (name, condition) => { if (!condition) throw Error(name); checks.push(name); };
      const source = document.createElement('canvas'); source.width = 800; source.height = 400;
      const context = source.getContext('2d'); context.fillStyle = '#eef3f6'; context.fillRect(0, 0, 800, 400);
      context.fillStyle = '#a00000'; context.fillRect(100, 125, 600, 150);
      window.unmainBlob = await new Promise(resolve => source.toBlob(resolve));
      listingAutoPrompted = true;
      const names = ['DOPTcv.png', 'DT.jpg', 'PT.png', 'Full Set.jpg', 'DTB.png', 'DB.png', 'DTcv.png', 'PT1.png', 'DTio.png', 'sedan DT black.png'];
      addImages(names.map(name => new File([window.unmainBlob], name, {type: 'image/png'})));
      await Promise.all(files.map(item => item.image.decode()));
      selectImage(1); await addLayerImages([new File([window.unmainBlob], 'layer.png', {type: 'image/png'})]);
      listingAccount.value = '6'; listingMaterial.value = 'genuine-leather-solid';
      for (let account = 0; account < watermarkSections.length; account++) for (const [material, rule] of Object.entries(LISTING_MATERIAL_RULES)) {
        listingAccount.value = String(account); listingMaterial.value = material;
        const row = createListingPlan().rows.find(row => row.item.file.name === 'Full Set.jpg');
        if (row.detection.variation !== 'DPTB' || row.template !== findListingTemplate(account, rule.templates.main).template) throw Error(`Wrong Full Set template for ${account}/${material}`);
      }
      check('Full Set filenames use DPTB Main rules across all accounts and materials', true);
      listingAccount.value = '6'; listingMaterial.value = 'genuine-leather-solid';
      const fullSetSource = files.find(item => item.file.name === 'Full Set.jpg');
      for (const subtype of ['cv', 'io', 'numbered', 'unmain']) {
        fullSetSource.listingMetadata = {filename: 'Full Set.jpg', variation: 'DPTB', subtype};
        if (createListingPlan().rows.find(row => row.item === fullSetSource).template.name !== 'Normal') throw Error(`Wrong Full Set supporting template: ${subtype}`);
      }
      check('Full Set Close View and other supporting subtypes still use Normal', true);
      fullSetSource.listingMetadata = {filename: 'Full Set.jpg', variation: 'DPTB', subtype: 'main', templateName: 'PS'};
      check('An explicit CPIS template choice retains precedence', createListingPlan().rows.find(row => row.item === fullSetSource).template.name === 'PS');
      delete fullSetSource.listingMetadata;
      const plan = createListingPlan(), pending = plan.rows.filter(row => row.pendingGeneration);
      check('Preview plans DT/DB main copies, never PT, without mutating the editor', files.length === 10 && plan.ready && pending.length === 3
        && pending.map(row => row.item.displayName).join('|') === 'DT unmain.jpg|DB unmain.png|sedan DT black unmain.png');
      check('Full Set is DPTB with its material Main template', plan.rows[3].detection.code === 'DPTB' && plan.rows[3].detection.label === 'Full Set · Main' && plan.rows[3].template.name === 'GLS');
      check('Unmain copies use Normal', pending.every(row => row.template.name === 'Normal' && row.detection.subtype === 'unmain'));
      const before = files.map(item => item.watermarkTemplateId).join('|'), load = loadDuplicateAsset;
      let calls = 0; loadDuplicateAsset = (...args) => ++calls === 3 ? Promise.reject(new Error('Simulated copy failure')) : load(...args);
      let failed = false;
      try { await applyListingWatermarks(); } catch { failed = true; } finally { loadDuplicateAsset = load; }
      check('A copy-loading failure leaves no partial copies or changed source templates', failed && files.length === 10 && files.map(item => item.watermarkTemplateId).join('|') === before);
      const normal = watermarkSections[6].templates.find(template => template.name === 'Normal');
      const index = watermarkSections[6].templates.indexOf(normal); watermarkSections[6].templates.splice(index, 1);
      check('Missing Normal template blocks the workflow before creating copies', !createListingPlan().ready && createListingPlan().rows.some(row => row.pendingGeneration && !row.template));
      let missingMessage = '';
      try { await applyListingWatermarks(); } catch (error) { missingMessage = error.message; }
      check('Missing artwork is reported with its account and template name', missingMessage.includes('Elite') && missingMessage.includes('Normal'));
      watermarkSections[6].templates.splice(index, 0, normal);
      selectImage(0); selectedBatchImageIds = new Set([files[0].id, files[1].id]);
      window.beforeWorkflowSelection = {active: files[activeIndex].id, batch: [...selectedBatchImageIds], order: files.map(item => item.id)};
      openListingPanel();
      check('Review shows the new copies before Apply Workflow', listingPlan.textContent.includes('DT unmain.jpg') && listingPlan.textContent.includes('New unmain copy'));
      return checks;
    }));
    await page.getByRole('button', {name: 'Apply Workflow', exact: true}).click();
    await page.waitForFunction(() => !listingBusy && listingPanel.hidden && files.length === 13);
    results.push('Apply Workflow button adds all three copies to the left-side editor');
    results.push(...await page.evaluate(async () => {
      const checks = [], check = (name, condition) => { if (!condition) throw Error(name); checks.push(name); };
      const copies = files.filter(item => item.generatedFromImageId), dt = files.find(item => item.file.name === 'DT.jpg'), dtCopy = copies[0];
      const db = files.find(item => item.file.name === 'DB.png'), pt = files.find(item => item.file.name === 'PT.png');
      check('Original templates remain and generated copies have independent assets and layers', findWatermarkTemplate(6, files[0].watermarkTemplateId).name === 'GLS'
        && findWatermarkTemplate(6, pt.watermarkTemplateId).name === 'PS GLS'
        && copies.every(item => findWatermarkTemplate(6, item.watermarkTemplateId).name === 'Normal')
        && dtCopy.url !== dt.url && dtCopy.image !== dt.image && dtCopy.file.name === 'DT unmain.jpg'
        && dtCopy.layers[0].id !== dt.layers[0].id && dtCopy.layers[0].url !== dt.layers[0].url);
      check('Close View and supporting images do not create unmain variants', copies.length === 3 && files.filter(isCloseViewImage).every(item => !item.smartPrep));
      const main = files.filter(item => !usesNormalTemplate(item)), normal = files.filter(usesNormalTemplate);
      check('Every Normal-template image is below every other template, including Close Views and supporting images', files.map(item => item.id).join('|') === [...main, ...normal].map(item => item.id).join('|')
        && document.querySelectorAll('.thumb-select span')[main.length].textContent === 'DOPTcv.png');
      check('Grouping preserves upload order inside each category', [main, normal].every(group => group.filter(item => !item.generatedFromImageId).map(item => item.id).join('|')
        === window.beforeWorkflowSelection.order.filter(id => group.some(item => item.id === id)).join('|')));
      check('Grouping preserves the active image and multi-image selection', files[activeIndex].id === window.beforeWorkflowSelection.active
        && [...selectedBatchImageIds].join('|') === window.beforeWorkflowSelection.batch.join('|') && document.querySelector('.thumb-item.active .thumb-select span').textContent === 'DOPTcv.png');
      const fullSet = files.find(item => item.file.name === 'Full Set.jpg');
      check('Apply Workflow assigns Main artwork to Full Set instead of Normal', fullSet.watermarkTemplateId === dt.watermarkTemplateId && fullSet.watermarkImage === dt.watermarkImage && !usesNormalTemplate(fullSet));
      for (const item of files.filter(item => item.smartPrep)) {
        const safe = smartSafeRect(item.smartPrep), geometry = smartProductGeometry(item);
        if (Math.abs(geometry.y - safe.y - safe.height / 2) > .001) throw Error(`Wide image moved upward: ${item.displayName}`);
      }
      check('Landscape uploads, including Normal copies, stay vertically centered', true);
      const ids = copies.map(item => item.id).join('|'); await applyListingWatermarks();
      check('Repeated Apply Workflow does not create more copies', files.length === 13 && files.filter(item => item.generatedFromImageId).map(item => item.id).join('|') === ids && !createListingPlan().rows.some(row => row.pendingGeneration));
      selectImage(files.indexOf(dtCopy)); selectedLayerIds = new Set(['base']); syncSelectedLayerControls(); applyImageScale(120);
      check('Generated images can be edited independently', dtCopy.scale === 120 && dt.scale === 100);
      const removed = files.indexOf(copies[1]); removeBatchImage(removed); await applyListingWatermarks();
      check('Deleting a DB unmain copy allows exactly one replacement on reapply', files.length === 13 && files.filter(item => item.generatedFromImageId === db.id).length === 1);
      for (const format of ['jpg', 'png', 'webp']) {
        if (exportFileName(dt, format) !== `DT.${format}` || exportFileName(dtCopy, format) !== `DT unmain.${format}`) throw Error('Export filename changed');
      }
      check('Every export format keeps source stems and the unmain suffix without Photo Studio branding', true);
      resizeWidth.value = resizeHeight.value = 500; exportFormat.value = 'png'; selectImage(0); closeListingPanel();
      return checks;
    }));
    const [single] = await Promise.all([page.waitForEvent('download'), page.locator('#export-one').click()]);
    assert.equal(single.suggestedFilename(), 'DT.png'); assert.ok(fs.readFileSync(await single.path()).includes(Buffer.from('PNG')));
    results.push('Actual individual download is named DT.png');
    const [batch] = await Promise.all([page.waitForEvent('download'), page.locator('#export-all').click()]);
    assert.equal(batch.suggestedFilename(), 'Elite.zip');
    const zip = fs.readFileSync(await batch.path()), names = []; let offset = 0;
    if (process.env.BATCH_ZIP_PREVIEW) fs.writeFileSync(process.env.BATCH_ZIP_PREVIEW, zip);
    while (zip.readUInt32LE(offset) === 0x04034b50) {
      const size = zip.readUInt32LE(offset + 18), length = zip.readUInt16LE(offset + 26), extra = zip.readUInt16LE(offset + 28);
      names.push(zip.subarray(offset + 30, offset + 30 + length).toString()); offset += 30 + length + extra + size;
    }
    assert.equal(names.length, 15);
    for (const name of ['Main/', 'unmain/', 'Main/DT.png', 'Main/PT.png', 'Main/DB.png', 'Main/Full Set.png', 'unmain/DT unmain.png', 'unmain/DB unmain.png', 'unmain/sedan DT black unmain.png', 'unmain/DOPTcv.png', 'unmain/PT1.png']) assert.ok(names.includes(name), name);
    assert.ok(!names.some(name => name.includes('PT unmain')));
    assert.ok(names.every(name => !name.includes('photo-studio')));
    results.push('Actual Elite ZIP puts all Normal outputs in unmain and all other templates in Main with clean filenames');
    await page.waitForFunction(() => !exportAll.disabled);
    results.push(...await page.evaluate(async () => {
      const checks = [], check = (name, condition) => { if (!condition) throw Error(name); checks.push(name); };
      while (files.length) removeBatchImage(files.length - 1);
      const payload = {account: 'Elite', material: 'Genuine Leather Solid', images: [
        {filename: 'camera-01.png', variation: 'DT', subtype: 'main'},
        {filename: 'DT.jpg', variation: 'DPTB', subtype: 'main'},
        {filename: 'Full Set.png', variation: 'DT', subtype: 'cv'},
        {filename: 'vehicle PT black.png', variation: 'DB', subtype: 'main'}]};
      await PhotoStudioIntegration.importImages(payload, payload.images.map(item => new File([window.unmainBlob], item.filename, {type: 'image/png'})));
      const plan = PhotoStudioIntegration.getPlan();
      check('CPIS resolved roles, not misleading filenames, decide which copies are created', plan.images.filter(row => row.pendingGeneration).map(row => row.filename).join('|') === 'camera-01 unmain.png|vehicle PT black unmain.png');
      await PhotoStudioIntegration.applyWorkflow();
      const generated = files.filter(item => item.generatedFromImageId);
      check('CPIS copies carry explicit DT/DB unmain metadata and source references', generated.length === 2 && generated.every(item => item.listingMetadata.subtype === 'unmain') && generated[0].listingMetadata.variation === 'DT' && generated[1].listingMetadata.variation === 'DB');
      check('CPIS DPTB metadata uses Main despite a DT filename, and overrides Full Set filename guessing', findWatermarkTemplate(6, files.find(item => item.file.name === 'DT.jpg').watermarkTemplateId).name === 'GLS'
        && usesNormalTemplate(files.find(item => item.file.name === 'Full Set.png')) && isCloseViewImage(files.find(item => item.file.name === 'Full Set.png')));
      PhotoStudioIntegration.setMetadata(payload); await PhotoStudioIntegration.applyWorkflow();
      check('CPIS can resend its original upload manifest without supplying local generated copies', files.length === 6 && PhotoStudioIntegration.getPlan().ready);
      const metadata = PhotoStudioIntegration.getMetadata(); PhotoStudioIntegration.setMetadata(metadata);
      check('CPIS metadata round trip includes generated files with their own names and IDs', metadata.images.length === 6 && metadata.images.some(item => item.filename === 'camera-01 unmain.png' && item.subtype === 'unmain'));
      PhotoStudioIntegration.clearMetadata();
      check('Filename mode still recognizes trailing unmain after descriptive text', createListingPlan().rows.find(row => row.item.displayName === 'vehicle PT black unmain.png').detection.subtype === 'unmain');
      while (files.length) removeBatchImage(files.length - 1);
      listingAutoPrompted = true; listingAccount.value = '6'; listingMaterial.value = 'genuine-leather-solid';
      addImages(['DT.jpg', 'DT unmain.png'].map(name => new File([window.unmainBlob], name, {type: 'image/png'})));
      await Promise.all(files.map(item => item.image.decode()));
      check('An uploaded matching unmain image is reused instead of creating a duplicate', createListingPlan().ready && !createListingPlan().rows.some(row => row.pendingGeneration));
      removeBatchImage(1);
      const [sameName] = addImages([new File([window.unmainBlob], 'DT unmain.png', {type: 'image/png'})]); await sameName.image.decode();
      sameName.listingMetadata = {filename: 'DT unmain.png', variation: 'PB', subtype: 'main'};
      check('A conflicting source filename produces a distinct unmain name', createListingPlan().rows.find(row => row.pendingGeneration).item.displayName === 'DT unmain (2).jpg');
      removeBatchImage(1);
      const [secondMain] = addImages([new File([window.unmainBlob], 'DT.jpg', {type: 'image/png'})]); await secondMain.image.decode();
      check('Two sources with the same filename each get a distinct planned copy', createListingPlan().rows.filter(row => row.pendingGeneration).map(row => row.item.displayName).join('|') === 'DT unmain.jpg|DT unmain (2).jpg');
      await applyListingWatermarks();
      check('Duplicate-filename sources stay idempotent on subsequent workflow plans', files.length === 4 && !createListingPlan().rows.some(row => row.pendingGeneration));
      const download = triggerDownload; let archive;
      triggerDownload = blob => { archive = blob; };
      try { await exportBatchArchive([...files], 'png'); } finally { triggerDownload = download; }
      const data = await archive.arrayBuffer(), view = new DataView(data), names = []; let offset = 0;
      while (view.getUint32(offset, true) === 0x04034b50) {
        const size = view.getUint32(offset + 18, true), length = view.getUint16(offset + 26, true), extra = view.getUint16(offset + 28, true);
        names.push(new TextDecoder().decode(new Uint8Array(data, offset + 30, length))); offset += 30 + length + extra + size;
      }
      check('ZIP filename collisions keep every image using numbered names within its folder', names.join('|') === 'Main/|unmain/|Main/DT.png|Main/DT (2).png|unmain/DT unmain.png|unmain/DT unmain (2).png');
      async function archiveNames(items) {
        const download = triggerDownload; let entries;
        triggerDownload = blob => { archive = blob; };
        try { entries = await exportBatchArchive(items, 'png'); } finally { triggerDownload = download; }
        if (entries !== items.length) throw Error('Export count included directories');
        const data = await archive.arrayBuffer(), view = new DataView(data), names = []; let offset = 0;
        while (view.getUint32(offset, true) === 0x04034b50) {
          const size = view.getUint32(offset + 18, true), length = view.getUint16(offset + 26, true), extra = view.getUint16(offset + 28, true);
          names.push(new TextDecoder().decode(new Uint8Array(data, offset + 30, length))); offset += 30 + length + extra + size;
        }
        return names;
      }
      const original = files[0], variant = files[2];
      original.displayName = 'same unmain.jpg'; variant.displayName = 'same unmain.jpg';
      check('Export routing follows actual templates, not filenames, and preserves equal names across folders', (await archiveNames([original, variant])).join('|') === 'Main/|unmain/|Main/same unmain.png|unmain/same unmain.png');
      check('Main-only batches retain an empty unmain folder', (await archiveNames([original])).join('|') === 'Main/|unmain/|Main/same unmain.png');
      listingMaterial.value = 'other-material'; await applyListingWatermarks();
      check('Other Material originals using Normal are grouped and exported as unmain too', files.every(usesNormalTemplate)
        && (await archiveNames([original])).join('|') === 'Main/|unmain/|unmain/same unmain.png');
      selectImage(files.indexOf(variant)); const gls = findListingTemplate(6, 'GLS').template; await selectWatermarkTemplate(6, gls.id);
      check('A manually changed template immediately changes the export folder', (await archiveNames([variant])).join('|') === 'Main/|unmain/|Main/same unmain.png');
      return checks;
    }));
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({passed: results.length, checks: results, errors}, null, 2));
  } catch (error) {
    console.error(error); console.error({passed: results, errors}); process.exitCode = 1;
  } finally { await browser.close(); }
})();
