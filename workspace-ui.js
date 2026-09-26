// Both workspace views share the same batch, selection, renderer and edit history.
let workspaceReady = false, workspaceView = 'full', workspaceFrame = 0, previewFrame = 0;
const workspacePreviewCache = new Map(), workspaceCards = new Map(), pendingWorkspacePreviews = new Map();
const workspaceShell = document.querySelector('.editor-shell');
const workspace = document.querySelector('.editor-workspace');
const sidebarTools = document.querySelector('.editor-toolbar');
const sidebarSections = document.createElement('div'); sidebarSections.className = 'sidebar-sections';
function sidebarSection(id, title, open = false) {
  const section = document.createElement('details'); section.id = id; section.className = 'sidebar-section'; section.open = open;
  const summary = document.createElement('summary'); summary.textContent = title;
  const body = document.createElement('div'); body.className = 'sidebar-section-body';
  section.append(summary, body); sidebarSections.append(section); return {section, body};
}
const imageTools = sidebarSection('image-tools-section', 'Image Size', true);
const sizingControls = document.createElement('div'); sizingControls.className = 'sizing-controls';
resizeGroup.classList.remove('header-tool-group', 'header-resize-control'); resizeGroup.classList.add('canvas-resize-control');
resizeGroup.querySelector('.toolbar-label').textContent = 'Resize canvas (px)';
resizeWidth.setAttribute('aria-label', 'Canvas width in pixels'); resizeHeight.setAttribute('aria-label', 'Canvas height in pixels');
sizingControls.append(document.querySelector('.image-size-control'), resizeGroup);
imageTools.body.append(sizingControls);
const shadowTools = sidebarSection('shadow-tools-section', 'Shadow', true);
const shadowControls = document.querySelector('.shadow-control');
shadowControls.querySelector('.toolbar-label')?.remove(); shadowTools.body.append(shadowControls);
const savedWatermarks = sidebarSection('saved-watermarks-section', 'Saved Watermarks');
watermarkLibrary.querySelector(':scope > .toolbar-label')?.remove(); savedWatermarks.body.append(watermarkLibrary);
const textTools = sidebarSection('text-editor-section', 'Text Editor'); initializeTextEditor(textTools.section, textTools.body);
sidebarTools.replaceChildren(layerGroup, sidebarSections, fitSelect);

const viewSwitch = document.createElement('div'); viewSwitch.className = 'workspace-view-switch'; viewSwitch.setAttribute('role', 'group'); viewSwitch.setAttribute('aria-label', 'Workspace view');
const viewButtons = ['full', 'grid'].map(view => {
  const button = document.createElement('button'); button.type = 'button'; button.dataset.workspaceView = view;
  const label = view === 'full' ? 'Full Screen View' : 'Grid View';
  button.title = label; button.setAttribute('aria-label', label);
  button.innerHTML = `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${view === 'full' ? '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16m9-16v16"/>' : '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'}</svg>`;
  button.setAttribute('aria-pressed', String(view === 'full')); button.addEventListener('click', () => setWorkspaceView(view)); viewSwitch.append(button); return button;
});
// These are editor controls, not part of the image or its drag/scroll gestures.
viewSwitch.addEventListener('pointerdown', event => event.stopPropagation());
viewSwitch.addEventListener('wheel', event => event.stopPropagation());
canvasWrap.append(viewSwitch);
const siteHeader = document.querySelector('.site-header');
const exportActions = document.querySelector('.editor-actions'); exportActions.prepend(headerExportControl);
new ResizeObserver(() => document.documentElement.style.setProperty('--studio-header-height', `${siteHeader.offsetHeight}px`)).observe(siteHeader);

const batchGridView = document.createElement('section'); batchGridView.className = 'batch-grid-view'; batchGridView.hidden = true;
batchGridView.setAttribute('aria-label', 'Batch images');
batchGridView.innerHTML = '<div class="batch-grid-heading"><div><strong>Batch images</strong><span class="batch-grid-count"></span></div><button type="button" class="grid-upload-button">Upload images</button></div><div class="batch-grid" role="group" aria-label="Select batch images"></div><p class="grid-empty">Upload images to start your batch.</p>';
workspace.append(batchGridView);
const batchGrid = batchGridView.querySelector('.batch-grid'), batchGridCount = batchGridView.querySelector('.batch-grid-count');
batchGridView.querySelector('.grid-upload-button').addEventListener('click', () => input.click());
batchGridView.addEventListener('dragover', event => { if (!event.dataTransfer.types.includes('Files')) return; event.preventDefault(); batchGridView.classList.add('dragging'); });
batchGridView.addEventListener('dragleave', event => { if (!batchGridView.contains(event.relatedTarget)) batchGridView.classList.remove('dragging'); });
batchGridView.addEventListener('drop', event => { event.preventDefault(); batchGridView.classList.remove('dragging'); addImages(event.dataTransfer.files); });
function setWorkspaceView(view) {
  const focusedViewButton = viewSwitch.contains(document.activeElement) ? document.activeElement : null;
  workspaceView = view === 'grid' ? 'grid' : 'full'; workspaceShell.classList.toggle('is-grid', workspaceView === 'grid');
  stage.hidden = workspaceView === 'grid'; batchGridView.hidden = workspaceView !== 'grid';
  (workspaceView === 'grid' ? batchGridView : canvasWrap).append(viewSwitch);
  viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.workspaceView === workspaceView)));
  focusedViewButton?.focus({preventScroll: true});
  requestWorkspaceRefresh();
}
function visibleBatchImageButton(index) {
  return workspaceView === 'grid' ? workspaceCards.get(files[index]?.id)?.querySelector('.grid-select') : thumbList.querySelector(`[data-thumb-index="${index}"] .thumb-select`);
}
function makeGridCard(item) {
  const card = document.createElement('article'); card.className = 'batch-grid-card'; card.dataset.imageId = item.id;
  const select = document.createElement('button'); select.type = 'button'; select.className = 'grid-select';
  const preview = document.createElement('img'); preview.alt = ''; preview.draggable = false;
  const mark = document.createElement('span'); mark.className = 'grid-selection-mark'; mark.textContent = '✓'; mark.setAttribute('aria-hidden', 'true');
  select.append(preview, mark); select.addEventListener('click', event => handleThumbnailSelection(files.indexOf(item), event));
  select.addEventListener('dblclick', () => { selectImage(files.indexOf(item)); setWorkspaceView('full'); });
  const footer = document.createElement('div'); footer.className = 'grid-card-footer';
  const name = document.createElement('span'); name.className = 'grid-image-name'; footer.append(name);
  for (const [action, icon, label] of [['edit','pencil','Edit'], ['duplicate','duplicate','Duplicate'], ['remove','trash','Remove']]) {
    const button = document.createElement('button'); button.type = 'button'; button.className = `grid-${action}`; setIconControl(button, icon, label);
    button.addEventListener('click', async () => {
      const index = files.indexOf(item); if (index < 0) return;
      if (action === 'edit') { selectImage(index); setWorkspaceView('full'); }
      else if (action === 'duplicate') { button.disabled = true; await duplicateBatchImage(index); button.disabled = false; }
      else removeBatchImage(index);
    }); footer.append(button);
  }
  card.append(select, footer); return card;
}
function requestWorkspaceRefresh() {
  if (!workspaceReady || workspaceFrame) return;
  workspaceFrame = requestAnimationFrame(() => { workspaceFrame = 0; refreshWorkspace(); });
}
function invalidateWorkspacePreviews() { workspacePreviewCache.clear(); requestWorkspaceRefresh(); }
function compositionPreviewKey(item) {
  return historyKey({files: [item], settings: {width: resizeWidth.value, height: resizeHeight.value, backgroundMode, color: backgroundColor.value}});
}
function refreshWorkspace() {
  syncTextEditorControls();
  const present = new Set(files.map(item => item.id));
  for (const [id, card] of workspaceCards) if (!present.has(id)) { card.remove(); workspaceCards.delete(id); workspacePreviewCache.delete(id); pendingWorkspacePreviews.delete(id); }
  files.forEach((item, index) => {
    let card = workspaceCards.get(item.id);
    if (!card) { card = makeGridCard(item); workspaceCards.set(item.id, card); }
    if (batchGrid.children[index] !== card) batchGrid.insertBefore(card, batchGrid.children[index] || null);
    const name = item.displayName || item.file.name, select = card.querySelector('.grid-select');
    card.classList.toggle('selected', selectedBatchImageIds.has(item.id)); card.classList.toggle('current', index === activeIndex);
    select.setAttribute('aria-pressed', String(selectedBatchImageIds.has(item.id))); select.setAttribute('aria-label', `Select ${name}`);
    card.querySelector('.grid-image-name').textContent = name; card.querySelector('.grid-image-name').title = name;
    for (const action of ['edit', 'duplicate', 'remove']) card.querySelector(`.grid-${action}`).setAttribute('aria-label', `${action[0].toUpperCase() + action.slice(1)} ${name}`);
    const cached = workspacePreviewCache.get(item.id), preview = card.querySelector('img');
    const source = cached?.url || item.thumbnailDataUrl || item.url;
    if (preview.getAttribute('src') !== source) preview.src = source;
    if (item.image.complete && item.image.naturalWidth && typeof historyKey === 'function') {
      const key = compositionPreviewKey(item);
      if (cached?.key !== key) pendingWorkspacePreviews.set(item.id, item);
    }
  });
  batchGridCount.textContent = `${files.length} image${files.length === 1 ? '' : 's'} · ${selectedBatchImageIds.size} selected`;
  batchGridView.querySelector('.grid-empty').hidden = files.length > 0;
  scheduleWorkspacePreview();
}
function scheduleWorkspacePreview() {
  if (previewFrame || !pendingWorkspacePreviews.size) return;
  previewFrame = requestAnimationFrame(renderNextWorkspacePreview);
}
const workspacePreviewCanvas = document.createElement('canvas');
function renderNextWorkspacePreview() {
  previewFrame = 0;
  if (exporting || listingBusy || imageDrag) { scheduleWorkspacePreview(); return; }
  const activeId = files[activeIndex]?.id;
  const entry = pendingWorkspacePreviews.has(activeId) ? [activeId, pendingWorkspacePreviews.get(activeId)] : pendingWorkspacePreviews.entries().next().value;
  if (!entry) return;
  const [id, item] = entry; pendingWorkspacePreviews.delete(id);
  try {
    if (!files.includes(item) || !renderEditorComposition(item)) return;
    const ratio = 512 / Math.max(canvas.width, canvas.height);
    workspacePreviewCanvas.width = Math.max(1, Math.round(canvas.width * ratio)); workspacePreviewCanvas.height = Math.max(1, Math.round(canvas.height * ratio));
    const previewContext = workspacePreviewCanvas.getContext('2d'); previewContext.imageSmoothingEnabled = true; previewContext.imageSmoothingQuality = 'high';
    previewContext.drawImage(canvas, 0, 0, workspacePreviewCanvas.width, workspacePreviewCanvas.height);
    const url = workspacePreviewCanvas.toDataURL('image/webp', .94);
    workspacePreviewCache.set(id, {key: compositionPreviewKey(item), url});
    const card = workspaceCards.get(id); if (card) card.querySelector('img').src = url;
    item.thumbnailDataUrl = url;
    const thumb = thumbList.querySelector(`[data-thumb-index="${files.indexOf(item)}"] img`); if (thumb) thumb.src = url;
  } catch (error) { console.warn('Could not refresh the batch preview', error); }
  finally {
    const current = files[activeIndex];
    if (renderEditorComposition(current)) drawLayerSelection(current);
    scheduleWorkspacePreview();
  }
}
workspaceReady = true; requestWorkspaceRefresh();
