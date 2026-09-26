// Regression coverage for shared views, inline account templates and editable text.
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const os = require('node:os');
(async () => {
  const browser = await chromium.launch({headless: true, ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {}), args: ['--allow-file-access-from-files']});
  const page = await browser.newPage({viewport: {width: 1600, height: 1000}}), checks = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const check = (name, ok) => { assert.ok(ok, name); checks.push(name); };
  try {
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.evaluate(() => historyReady);
    await page.evaluate(async () => {
      listingAutoPrompted = true;
      const source = document.createElement('canvas'); source.width = source.height = 800;
      const c = source.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0,0,800,800); c.fillStyle = '#a52835'; c.fillRect(230,180,340,480);
      const blob = await new Promise(resolve => source.toBlob(resolve));
      const items = addImages(['DT.png', 'DB.png', 'DOPTcv.png'].map(name => new File([blob], name, {type:'image/png'})));
      await Promise.all(items.map(item => item.image.decode())); selectImage(0);
    });
    check('Full Screen View remains the default', await page.getByRole('button', {name:'Full Screen View', exact:true}).getAttribute('aria-pressed') === 'true');
    check('Image Size, Resize, Shadow and Background share the first icon panel', await page.evaluate(() => {
      const size = document.querySelector('.image-size-control').getBoundingClientRect(), resize = resizeGroup.getBoundingClientRect();
      return resize.top > size.bottom && [resizeGroup,shadowToggle,backgroundGroup,removeBgButton,removeAllBgButton].every(control=>control.closest('[role="tabpanel"]').id === 'image-tools-section')
        && !headerActions.contains(resizeGroup) && !headerActions.contains(backgroundGroup);
    }));
    check('The right sidebar has three labelled icons and only one visible panel', await page.evaluate(() => sidebarNav.querySelectorAll('[role="tab"]').length===3 && !sidebarNav.textContent.trim()
      && document.querySelectorAll('.sidebar-section:not([hidden])').length===1 && sidebarNav.querySelector('[aria-selected="true"]').getAttribute('aria-label')==='Image Size & Shadow'));
    check('Tool sections sit directly beneath Layers without a separate card',await page.evaluate(()=>{
      const layers=layerGroup.getBoundingClientRect(),panel=imageTools.section.getBoundingClientRect(),style=getComputedStyle(imageTools.section);
      return Math.abs(panel.top-layers.bottom)<1 && Math.abs(panel.left-layers.left)<1 && style.borderTopWidth==='0px' && style.borderRadius==='0px' && getComputedStyle(sidebarSections).paddingTop==='0px';
    }));
    check('Relative layer alignment is disabled for a single selected layer',await page.getByRole('button',{name:'Align Vertically',exact:true}).isDisabled() && await page.getByRole('button',{name:'Align Horizontally',exact:true}).isDisabled());
    check('Center and alignment tooltips use the requested short labels',await page.evaluate(()=>[centerVertical,alignVertical,alignHorizontal].every((button,i)=>button.title===['Center Vertically','Align Vertically','Align Horizontally'][i] && button.getAttribute('aria-label')===button.title)));
    const beforeTabs=await page.evaluate(()=>({history:undoStack.length,selection:[...selectedLayerIds],y:files[0].offsetY}));
    await page.getByRole('tab',{name:'Image Size & Shadow',exact:true}).focus(); await page.keyboard.press('ArrowDown');
    check('Arrow navigation opens only Saved Watermarks without moving the image', await page.evaluate(before=>activeSidebarSection==='saved-watermarks-section' && files[0].offsetY===before.y && document.querySelectorAll('.sidebar-section:not([hidden])').length===1,beforeTabs));
    await page.keyboard.press('End');
    check('End opens Text Editor exclusively',await page.evaluate(()=>activeSidebarSection==='text-editor-section' && document.activeElement.id==='text-editor-section-tab' && imageTools.section.hidden && savedWatermarks.section.hidden));
    await page.keyboard.press('Home');
    check('Switching icon panels preserves selected layers and does not add Undo steps',await page.evaluate(before=>activeSidebarSection==='image-tools-section' && undoStack.length===before.history && JSON.stringify([...selectedLayerIds])===JSON.stringify(before.selection),beforeTabs));
    await page.locator('[data-background="none"]').click();
    await page.locator('[data-background="color"]').click();
    await page.getByLabel('Background color',{exact:true}).fill('#f3f3f3');
    await page.getByRole('tab',{name:'Saved Watermarks',exact:true}).click();
    await page.getByRole('tab',{name:'Image Size & Shadow',exact:true}).click();
    check('Relocated background controls retain edits when panels change',await page.evaluate(()=>backgroundMode==='color' && backgroundColor.value==='#f3f3f3'));
    await page.getByLabel('Background color',{exact:true}).fill('#ffffff');
    await page.screenshot({path:path.join(os.tmpdir(),'photo-studio-adjustments.png')});
    check('Header tools share a single line', await page.evaluate(() => {
      const header = siteHeader.getBoundingClientRect(), logo = siteHeader.querySelector('.logo').getBoundingClientRect(), tools = headerActions.getBoundingClientRect();
      return header.height === 68 && Math.abs(logo.top + logo.height/2 - tools.top - tools.height/2) < 2 && !siteHeader.contains(viewSwitch) && siteHeader.contains(exportOne) && siteHeader.contains(exportAll) && siteHeader.contains(exportFormat);
    }));
    check('Layers has five actions in one row without the removed tools or Movement lock', await page.evaluate(() => {
      const buttons=[...layerGroup.querySelectorAll('.layer-primary-actions button')], rects=buttons.map(button=>button.getBoundingClientRect());
      return buttons.length===5 && buttons[3].dataset.layerAction==='duplicate' && buttons[4].dataset.layerAction==='remove'
        && rects.every(rect=>rect.top===rects[0].top) && !layerGroup.querySelector('[data-layer-action="smaller"], [data-layer-action="larger"], [data-layer-action="arrange"]') && !positionGroup.querySelector('select');
    }));
    const beforeLayerActions=await page.evaluate(()=>undoStack.length);
    await page.getByRole('button',{name:'Duplicate selected layers',exact:true}).click();
    await page.getByRole('button',{name:'Duplicate selected layers',exact:true}).click();
    check('Relocated Duplicate button creates editable layers',await page.evaluate(()=>files[0].layers.length===2));
    const beforeVertical=await page.evaluate(()=>{
      withHistoryActionSync(()=>{
        const item=files[0]; item.scale=35; item.offsetX=-200; item.offsetY=-350;
        Object.assign(item.layers[0],{x:1080,y:510,scale:25});
        Object.assign(item.layers[1],{x:300,y:1200,scale:20});
        selectedLayerIds=new Set(['base',item.layers[0].id]); renderLayerList();syncSelectedLayerControls();drawActive();
      });
      return allLayerEntityIds(files[0]).map(id=>({id,...getLayerEntityRect(files[0],id)}));
    });
    const relativeCenter=await page.evaluate(()=>selectedLayerBounds(files[0]).y);
    await page.getByRole('button',{name:'Align Vertically',exact:true}).click();
    check('Relative alignment gives selected layers a shared vertical center without centering on the canvas',await page.evaluate(({before,target})=>{
      const item=files[0],near=(a,b)=>Math.abs(a-b)<.00001,after=before.map(rect=>getLayerEntityRect(item,rect.id));
      return !near(target,canvas.height/2) && near(after[0].y,target) && near(after[1].y,target) && near(after[2].y,before[2].y)
        && after.every((rect,i)=>near(rect.x,before[i].x)&&near(rect.width,before[i].width)&&near(rect.height,before[i].height));
    },{before:beforeVertical,target:relativeCenter}));
    const afterAlignHistory=await page.evaluate(()=>undoStack.length);
    await page.getByRole('button',{name:'Align Vertically',exact:true}).click();
    check('Repeating relative alignment is a no-op with no extra Undo step',await page.evaluate(depth=>undoStack.length===depth,afterAlignHistory));
    await page.keyboard.press('Control+z');
    check('Undo restores the individual positions before relative alignment',await page.evaluate(before=>before.every(rect=>Math.abs(getLayerEntityRect(files[0],rect.id).y-rect.y)<.00001),beforeVertical));
    await page.keyboard.press('Control+y');
    check('Redo restores the shared selection-relative center',await page.evaluate(target=>getSelectedLayerEntities(files[0]).every(entity=>Math.abs(getLayerEntityRect(files[0],entity.id).y-target)<.00001),relativeCenter));
    await page.keyboard.press('Control+z');
    const relativeX=await page.evaluate(()=>selectedLayerBounds(files[0]).x);
    await page.getByRole('button',{name:'Align Horizontally',exact:true}).click();
    check('Horizontal alignment shares the selection midpoint while preserving vertical positions and sizes',await page.evaluate(({before,target})=>{
      const item=files[0],near=(a,b)=>Math.abs(a-b)<.00001,after=before.map(rect=>getLayerEntityRect(item,rect.id));
      return !near(target,canvas.width/2) && near(after[0].x,target) && near(after[1].x,target) && near(after[2].x,before[2].x)
        && after.every((rect,i)=>near(rect.y,before[i].y)&&near(rect.width,before[i].width)&&near(rect.height,before[i].height));
    },{before:beforeVertical,target:relativeX}));
    const afterHorizontalHistory=await page.evaluate(()=>undoStack.length);
    await page.getByRole('button',{name:'Align Horizontally',exact:true}).click();
    check('Repeated horizontal alignment does not add empty Undo steps',await page.evaluate(depth=>undoStack.length===depth,afterHorizontalHistory));
    await page.keyboard.press('Control+z');
    check('Undo restores the separate horizontal layer positions',await page.evaluate(before=>before.every(rect=>Math.abs(getLayerEntityRect(files[0],rect.id).x-rect.x)<.00001),beforeVertical));
    await page.keyboard.press('Control+y');
    check('Redo reapplies horizontal alignment relative to the selection',await page.evaluate(target=>getSelectedLayerEntities(files[0]).every(entity=>Math.abs(getLayerEntityRect(files[0],entity.id).x-target)<.00001),relativeX));
    await page.keyboard.press('Control+z');
    await page.getByRole('button',{name:'Center Vertically',exact:true}).click();
    check('Vertical center moves the selection together without resizing or moving other layers',await page.evaluate(before=>{
      const item=files[0],near=(a,b)=>Math.abs(a-b)<.00001,after=before.map(rect=>getLayerEntityRect(item,rect.id)),dy=after[0].y-before[0].y;
      return near(selectedLayerBounds(item).y,canvas.height/2) && !near(dy,0)
        && after.every((rect,i)=>near(rect.x,before[i].x)&&near(rect.width,before[i].width)&&near(rect.height,before[i].height))
        && near(after[1].y-before[1].y,dy) && near(after[2].y,before[2].y);
    },beforeVertical));
    await page.keyboard.press('Control+z');
    check('Undo restores the positions before group vertical centering',await page.evaluate(before=>before.every(rect=>Math.abs(getLayerEntityRect(files[0],rect.id).y-rect.y)<.00001),beforeVertical));
    await page.keyboard.press('Control+y');
    check('Redo reapplies group vertical centering',await page.evaluate(()=>Math.abs(selectedLayerBounds(files[0]).y-canvas.height/2)<.00001));
    await page.getByRole('button',{name:'Delete selected layers',exact:true}).click();
    check('Relocated Delete button removes selected layers and preserves the remaining layer',await page.evaluate(()=>allLayerEntityIds(files[0]).length===1 && files[0].baseRemoved));
    await page.keyboard.press('Control+z');
    check('Deleting layers from the new action row remains undoable',await page.evaluate(()=>allLayerEntityIds(files[0]).length===3 && !files[0].baseRemoved));
    await page.evaluate(depth=>{while(undoStack.length>depth)undo();},beforeLayerActions);
    check('Accessible icon-only view controls sit inside the canvas bottom-right', await page.evaluate(() => {
      const image = canvasWrap.getBoundingClientRect(), controls = viewSwitch.getBoundingClientRect();
      return viewSwitch.parentElement === canvasWrap && !viewSwitch.textContent.trim() && image.right-controls.right >= 10 && image.right-controls.right < 15 && image.bottom-controls.bottom >= 10 && image.bottom-controls.bottom < 15;
    }));
    const beforeControlWheel = await page.evaluate(() => files[0].scale);
    await page.getByRole('button', {name:'Grid View', exact:true}).hover(); await page.mouse.wheel(0,-120);
    check('Scrolling over view controls does not resize the image', await page.evaluate(() => files[0].scale) === beforeControlWheel);
    check('Layers stays outside the switchable panels', await page.locator('.editor-toolbar > .layer-control').count() === 1);
    await page.getByRole('tab',{name:'Saved Watermarks',exact:true}).click();
    await page.locator('[data-watermark-section="0"]').hover();
    check('Hover does not open an account flyout', await page.locator('#account-template-panel').isHidden());
    await page.locator('[data-watermark-section="0"]').click();
    check('Watermark accounts occupy two columns in the requested order, with templates below', await page.evaluate(() => {
      const panel = watermarkTemplatePanel.getBoundingClientRect(), buttons=[...watermarkSectionList.querySelectorAll('button')], accounts = buttons.map(button => button.getBoundingClientRect());
      return panel.top >= Math.max(...accounts.map(rect => rect.bottom)) && watermarkSectionList.nextElementSibling === watermarkTemplatePanel
        && buttons.map(button=>button.textContent).join('|')==='US Auto Nation|DIY|US Auto Seat Cover|Master|US Auto Seat Factory|Premium|DSA eBay|Elite'
        && accounts.every((rect,i)=>i%2 ? Math.abs(rect.top-accounts[i-1].top)<1 && rect.left>accounts[i-1].right : !i || rect.top>=accounts[i-2].bottom);
    }));
    check('Account names have no dropdown arrows',await page.locator('.watermark-section-button').evaluateAll(buttons=>buttons.every(button=>getComputedStyle(button,'::after').content==='none' && !button.querySelector('svg'))));
    await page.screenshot({path:path.join(os.tmpdir(),'photo-studio-watermarks.png')});
    await page.locator('[data-watermark-section="0"]').click();
    check('Clicking the account again collapses templates', await page.locator('#account-template-panel').isHidden());
    await page.getByRole('tab',{name:'Text Editor',exact:true}).click();
    await page.locator('#add-text-layer').click();
    await page.locator('#text-content').fill('Premium leather\nMade for your seat');
    await page.locator('#text-font-size').fill('94');
    await page.locator('#text-font-family').selectOption('Georgia');
    await page.getByRole('button', {name:'Bold', exact:true}).click();
    await page.getByRole('button', {name:'Italic', exact:true}).click();
    await page.getByRole('button', {name:'Underline', exact:true}).click();
    await page.locator('#text-color').fill('#0055aa');
    await page.locator('#text-align').selectOption('left');
    await page.locator('#text-letter-spacing').fill('2');
    await page.locator('#text-line-height').fill('1.5');
    await page.locator('#text-stroke-width').fill('1');
    await page.locator('#text-opacity').fill('85');
    await page.locator('#text-shadow-toggle').click();
    check('Text remains editable with font, style, color, outline, spacing, opacity and shadow', await page.evaluate(() => {
      const t = selectedTextLayers()[0]; return t.text.includes('\n') && t.fontSize === 94 && t.fontFamily === 'Georgia' && t.fontWeight === 700 && t.fontStyle === 'italic' && t.underline && t.color === '#0055aa' && t.align === 'left' && t.letterSpacing === 2 && t.lineHeight === 1.5 && t.strokeWidth === 1 && t.opacity === 85 && t.shadowStrength === 80 && t.shadow;
    }));
    check('Remove BG is disabled when only text is selected', await page.locator('#remove-bg').isDisabled());
    check('Text layers have a visible layer-list icon', await page.locator('.layer-text-preview').count() === 1);
    await page.getByRole('tab',{name:'Image Size & Shadow',exact:true}).click();
    await page.locator('#shadow-toggle').click();
    check('Editing a text layer from the combined panel does not reopen Text Editor',await page.evaluate(()=>activeSidebarSection==='image-tools-section' && textTools.section.hidden && !selectedTextLayers()[0].shadow));
    await page.getByRole('tab',{name:'Text Editor',exact:true}).click();
    await page.locator('#text-content').fill('Undo this text');
    await page.keyboard.press('Control+z');
    check('Undo restores previous text and the textarea', await page.locator('#text-content').inputValue() === 'Premium leather\nMade for your seat');
    await page.keyboard.press('Control+y');
    check('Redo restores text edits', await page.locator('#text-content').inputValue() === 'Undo this text');
    await page.locator('#text-content').fill('Premium leather\nMade for your seat');
    await page.locator('#text-content').press('Control+a'); await page.locator('#text-content').press('Delete');
    check('Delete while typing edits text instead of deleting its layer', await page.evaluate(() => files[0].layers.length === 1 && files[0].layers[0].text === ''));
    await page.keyboard.press('Control+z');
    // Finish a clean composition for renderer and grid comparisons.
    await page.evaluate(() => { const t=selectedTextLayers()[0]; Object.assign(t,{x:788,y:180,fontSize:90,align:'center',shadow:false,opacity:100,strokeWidth:0,underline:false}); drawActive(); });
    const beforeView = await page.evaluate(() => ({key:historyKey(readHistoryState()),undo:undoStack.length,selected:[...selectedLayerIds]}));
    await page.getByRole('button', {name:'Grid View', exact:true}).click();
    await page.waitForFunction(() => workspacePreviewCache.size === 3 && !pendingWorkspacePreviews.size);
    check('Grid hides the sidebar while retaining header exports and corner view controls', await page.evaluate(() => {
      const side = document.querySelector('.editor-sidebar').getBoundingClientRect(), downloads = exportActions.getBoundingClientRect(), grid = batchGridView.getBoundingClientRect(), controls = viewSwitch.getBoundingClientRect();
      return side.width === 0 && exportActions.parentElement === siteHeader && downloads.width > 0 && downloads.bottom <= siteHeader.getBoundingClientRect().bottom && downloads.right <= innerWidth
        && viewSwitch.parentElement === batchGridView && grid.right-controls.right >= 10 && grid.right-controls.right < 15 && grid.bottom-controls.bottom >= 10 && grid.bottom-controls.bottom < 15 && imageDrag === null;
    }));
    check('Grid displays larger current compositions', await page.locator('.batch-grid-card').count() === 3 && (await page.locator('.grid-select').first().boundingBox()).width > 200);
    check('Switching views preserves all edits and history', await page.evaluate(before => historyKey(readHistoryState()) === before.key && undoStack.length === before.undo && JSON.stringify([...selectedLayerIds]) === JSON.stringify(before.selected), beforeView));
    check('Grid preview uses edited pixels, not the original upload', await page.evaluate(() => workspaceCards.get(files[0].id).querySelector('img').src === workspacePreviewCache.get(files[0].id).url && workspacePreviewCache.get(files[0].id).url !== files[0].url));
    await page.getByRole('button',{name:'Select DB.png',exact:true}).click({modifiers:['Control']});
    check('Ctrl-click shares batch selection between views', await page.evaluate(() => selectedBatchImageIds.size === 2 && document.querySelectorAll('.thumb-item.batch-selected').length === 2));
    await page.keyboard.press('Control+Alt+a');
    check('Ctrl+Alt+A selects all grid images', await page.evaluate(() => selectedBatchImageIds.size === 3));
    await page.getByRole('button',{name:'Select DT.png',exact:true}).click(); await page.keyboard.press('Tab');
    check('Tab advances to the next grid image and focuses it', await page.evaluate(() => activeIndex === 1 && document.activeElement === visibleBatchImageButton(1)));
    await page.keyboard.press('Shift+Tab');
    check('Shift+Tab goes back to the previous grid image', await page.evaluate(() => activeIndex === 0));
    await page.locator('#text-content').fill('Updated in Grid');
    await page.waitForFunction(() => workspacePreviewCache.get(files[0].id)?.key === compositionPreviewKey(files[0]));
    check('Text edits refresh the grid immediately', await page.evaluate(() => workspaceCards.get(files[0].id).querySelector('img').src === workspacePreviewCache.get(files[0].id).url));
    await page.screenshot({path:path.join(os.tmpdir(),'photo-studio-grid.png')});
    await page.getByRole('button',{name:'Edit DT.png',exact:true}).click();
    check('Edit opens the same image in Full Screen View', await page.evaluate(() => workspaceView === 'full' && activeIndex === 0 && files[0].layers[0].text === 'Updated in Grid'));
    const layerChecks = await page.evaluate(async () => {
      const results=[], check=(name,ok)=>{if(!ok)throw Error(name);results.push(name);};
      const item=files[0], original=item.layers[0]; selectedLayerIds=new Set([original.id]);
      const rect=getAddedLayerDrawRect(original); duplicateSelectedLayers(); const copy=item.layers.at(-1), copyRect=getAddedLayerDrawRect(copy);
      check('Text duplicate preserves exact dimensions and style',copy.type==='text' && copyRect.width===rect.width && copyRect.height===rect.height && copy.x===original.x+35 && copy.fontFamily===original.fontFamily);
      copySelectedLayers(); await pasteCopiedLayers(); const pasted=item.layers.at(-1);
      check('Text copy/paste works without an image file',pasted.type==='text' && pasted.text===copy.text && pasted.id!==copy.id && pasted.scale===copy.scale);
      selectedLayerIds=new Set([original.id,copy.id]); const xDistance=copy.x-original.x; scaleSelectedLayerEntities(.8);
      check('Group resize includes editable text geometry',Math.abs(copy.x-original.x-xDistance*.8)<.0001 && copy.scale===80 && original.scale===80);
      centerSelectedLayerEntities('both'); const bounds=selectedLayerBounds(item);
      check('Text group centers on both canvas axes',Math.abs(bounds.x-788)<.0001 && Math.abs(bounds.y-788)<.0001);
      selectedLayerIds=new Set(['base',original.id]); toggleSelectedLayerBackgrounds();
      check('Mixed background removal skips text layers',item.removeBg && !original.removeBg);
      removeAllBgButton.click(); check('Remove All BG skips text and Close View',!original.removeBg && !files[2].removeBg);
      await duplicateBatchImage(0); const duplicate=files[1];
      check('Batch duplicate retains editable text and independent identities',duplicate.layers.length===3 && duplicate.layers.every(isTextLayer) && duplicate.layers[0]!==original && duplicate.layers[0].id!==original.id && duplicate.layers[0].fontFamily===original.fontFamily);
      selectImage(0); selectedLayerIds=new Set(['base',copy.id,pasted.id]); removeSelectedLayers();
      check('Text can be the only remaining layer',item.baseRemoved && item.layers.length===1 && item.layers[0]===original);
      Object.assign(original,{text:'PHOTO STUDIO',x:788,y:788,fontSize:160,fontFamily:'Arial',fontWeight:700,fontStyle:'normal',scale:100,rotation:0,color:'#0000ff',opacity:100,shadow:false,underline:false,strokeWidth:0}); backgroundMode='color';backgroundColor.value='#ffffff';drawActive();
      for(const format of ['png','jpg','webp']) {
        const bitmap=await createImageBitmap(await createExportBlob(item,format)),work=document.createElement('canvas');work.width=bitmap.width;work.height=bitmap.height;const c=work.getContext('2d');c.drawImage(bitmap,0,0);bitmap.close();const pixels=c.getImageData(0,0,work.width,work.height).data;
        let blue=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i+2]>150&&pixels[i]<100&&pixels[i+1]<100)blue++;
        check(`${format.toUpperCase()} export renders text with correct dimensions`,work.width===1576 && work.height===1576 && blue>5000);
      }
      // A network font failure settles before export and uses the preview's fallback.
      const load=document.fonts.load.bind(document.fonts); document.fonts.load=()=>Promise.reject(new Error('offline'));
      try {check('Unavailable web fonts do not prevent export', (await createExportBlob(item,'png')).size>1000);}
      finally {document.fonts.load=load;}
      listingAccount.value='6';listingMaterial.value='genuine-leather-solid';
      const layout=JSON.stringify({x:original.x,y:original.y,scale:original.scale,font:original.fontFamily,text:original.text});
      await applyListingWatermarks();
      const unmain=files.find(entry=>entry.displayName==='DT unmain.png');
      check('Apply Workflow creates editable text in generated unmain compositions',unmain?.baseRemoved && unmain.layers[0].type==='text' && unmain.layers[0].id!==original.id && unmain.layers[0].text===original.text);
      check('Listing preserves the existing text layout',layout===JSON.stringify({x:original.x,y:original.y,scale:original.scale,font:original.fontFamily,text:original.text}));
      undo();check('Undo removes the complete workflow including its text copies',!files.some(entry=>entry.displayName==='DT unmain.png') && item.layers[0]===original);
      redo();check('Redo restores editable text copies',files.find(entry=>entry.displayName==='DT unmain.png')?.layers[0].type==='text');
      selectImage(files.indexOf(item));selectedLayerIds=new Set([original.id]);syncSelectedLayerControls();drawActive();return results;
    }); checks.push(...layerChecks);
    await page.getByRole('tab',{name:'Text Editor',exact:true}).click();
    await page.locator('#text-content').scrollIntoViewIfNeeded();
    const layerTop=await page.locator('.layer-control').evaluate(el=>el.getBoundingClientRect().top);
    await page.locator('.sidebar-sections').evaluate(el=>el.scrollTop=el.scrollHeight);
    check('Layers stays fixed while lower controls scroll', await page.locator('.layer-control').evaluate(el=>el.getBoundingClientRect().top) === layerTop);
    check('No body scrolling or canvas overflow on desktop', await page.evaluate(()=>document.documentElement.scrollHeight===innerHeight && canvasWrap.getBoundingClientRect().bottom<=innerHeight));
    await page.locator('#text-content').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(os.tmpdir(),'photo-studio-text.png')});
    // Inspect a real download: the ZIP entry contains the composited text pixels.
    await page.getByRole('button',{name:'Grid View',exact:true}).click();
    await page.locator('#export-format').selectOption('png');
    const downloadPromise=page.waitForEvent('download'); await page.locator('#export-all').click();
    const download=await downloadPromise;
    const bytes=require('node:fs').readFileSync(await download.path()), entries=new Map();
    for(let offset=0;bytes.readUInt32LE(offset)===0x04034b50;) {
      const size=bytes.readUInt32LE(offset+18),nameLength=bytes.readUInt16LE(offset+26),extra=bytes.readUInt16LE(offset+28);
      const name=bytes.subarray(offset+30,offset+30+nameLength).toString(),start=offset+30+nameLength+extra;
      entries.set(name,bytes.subarray(start,start+size)); offset=start+size;
    }
    check('Export Batch uses the template account name',download.suggestedFilename()==='Elite.zip');
    check('Export Batch includes text compositions in both folder types',entries.has('Main/DT.png') && entries.has('unmain/DT unmain.png'));
    check('Downloaded ZIP renders the editable text',await page.evaluate(async data=>{
      const bitmap=await createImageBitmap(new Blob([new Uint8Array(data)],{type:'image/png'})),c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;const x=c.getContext('2d');x.drawImage(bitmap,0,0);bitmap.close();const pixels=x.getImageData(0,0,c.width,c.height).data;let blue=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i+2]>180&&pixels[i]<30&&pixels[i+1]<30)blue++;return blue>5000;
    },[...entries.get('Main/DT.png')]));
    await page.evaluate(async()=>{
      const source=files[0].file,added=addImages(Array.from({length:28},(_,i)=>new File([source],`batch ${i}.png`,{type:source.type})));
      await Promise.all(added.map(item=>item.image.decode()));requestWorkspaceRefresh();
    });
    await page.getByRole('button',{name:'Grid View',exact:true}).click();
    await page.waitForFunction(()=>document.querySelectorAll('.batch-grid-card').length===files.length);
    const largeLayout=await page.evaluate(()=>({gridScroll:batchGrid.scrollHeight,gridHeight:batchGrid.clientHeight,body:document.documentElement.scrollHeight,viewport:innerHeight,gridRows:getComputedStyle(workspace).gridTemplateRows,gridView:batchGridView.getBoundingClientRect().toJSON()}));
    check('Large batches scroll inside the grid without growing the page',largeLayout.gridScroll>largeLayout.gridHeight && largeLayout.body===largeLayout.viewport);
    const gridDownloadBottom = await page.locator('.editor-actions').evaluate(el=>el.getBoundingClientRect().bottom);
    await page.locator('.batch-grid').evaluate(el=>el.scrollTop=el.scrollHeight);
    check('Scrolling the grid keeps both downloads and the format selector visible', await page.locator('.editor-actions').evaluate(el=>el.getBoundingClientRect().bottom) === gridDownloadBottom && await page.locator('#export-one').isVisible() && await page.locator('#export-all').isVisible() && await page.locator('#export-format').isVisible());
    await page.getByRole('button',{name:'Full Screen View',exact:true}).click();
    check('Full Screen View retains a separately scrolling image list',await page.evaluate(()=>thumbList.scrollHeight>thumbList.clientHeight && document.documentElement.scrollHeight===innerHeight));
    check('Image-list scrollbar is on the left while thumbnails and actions keep their reading order',await page.evaluate(()=>{
      const row=thumbList.querySelector('.thumb-item'),select=row.querySelector('.thumb-select'),copy=row.querySelector('.thumb-duplicate'),remove=row.querySelector('.thumb-remove');
      return getComputedStyle(thumbList).direction==='rtl' && thumbList.clientLeft>0 && getComputedStyle(row).direction==='ltr'
        && select.getBoundingClientRect().right<=copy.getBoundingClientRect().left && copy.getBoundingClientRect().right<=remove.getBoundingClientRect().left;
    }));
    const downloadBottom = await page.locator('.editor-actions').evaluate(el=>el.getBoundingClientRect().bottom);
    await page.locator('#thumb-list').evaluate(el=>el.scrollTop=el.scrollHeight);
    check('Scrolling the image list keeps both download buttons fixed and visible', await page.locator('.editor-actions').evaluate(el=>el.getBoundingClientRect().bottom) === downloadBottom && await page.locator('#export-one').isVisible() && await page.locator('#export-all').isVisible());
    await page.screenshot({path:path.join(os.tmpdir(),'photo-studio-left-scrollbar.png')});
    await page.setViewportSize({width:1280,height:720});
    check('Smaller desktop keeps layers and section controls reachable',await page.locator('.sidebar-sections').evaluate(el=>el.clientHeight>100));
    await page.setViewportSize({width:390,height:844});
    check('Mobile does not create horizontal document overflow', await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
    check('Narrow screens retain one header line and visible export controls', await page.evaluate(() => siteHeader.offsetHeight === 68 && [exportFormat,exportOne,exportAll].every(control=>{const r=control.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=68;})));
    await page.getByRole('button',{name:'Grid View',exact:true}).click();
    await page.locator('.editor-workspace').evaluate(el=>el.scrollTop=el.scrollHeight);
    check('Mobile Grid hides the sidebar but keeps exports on screen while tools scroll', await page.evaluate(() => {
      const bounds=exportActions.getBoundingClientRect();
      return document.querySelector('.editor-sidebar').getBoundingClientRect().width===0 && bounds.left>=0 && bounds.right<=innerWidth && bounds.top>0 && bounds.bottom<=innerHeight;
    }));
    await page.getByRole('tab',{name:'Saved Watermarks',exact:true}).click();
    check('Mobile watermark accounts retain two readable columns without overflowing',await page.locator('.watermark-sections').evaluate(el=>{
      const buttons=[...el.querySelectorAll('button')],a=buttons[0].getBoundingClientRect(),b=buttons[1].getBoundingClientRect();
      return Math.abs(a.top-b.top)<1 && b.left>a.right && el.scrollWidth===el.clientWidth && buttons.every(button=>button.scrollWidth===button.clientWidth);
    }));
    check('No uncaught browser errors',errors.length===0);
    console.log(JSON.stringify({passed:checks.length,checks,errors},null,2));
  } catch(error) { await page.screenshot({path:path.join(os.tmpdir(),'photo-studio-test-failure.png')}); console.error(JSON.stringify({passed:checks,errors})); throw error; }
  finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
