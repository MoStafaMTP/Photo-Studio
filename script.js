document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
document.querySelector('.menu-button')?.addEventListener('click', () => document.querySelector('.nav-links').classList.toggle('is-open'));

const UI_ICONS = {
  rotateLeft: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/>',
  rotateRight: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
  undo: '<path d="m9 7-5 5 5 5"/><path d="M4 12h9a7 7 0 0 1 7 7"/>',
  redo: '<path d="m15 7 5 5-5 5"/><path d="M20 12h-9a7 7 0 0 0-7 7"/>',
  centerHorizontal: '<path d="M12 3v18" stroke-dasharray="2 2"/><path d="m9 8-4 4 4 4m6-8 4 4-4 4"/>',
  centerVertical: '<path d="M3 12h18" stroke-dasharray="2 2"/><path d="m8 9 4-4 4 4m-8 6 4 4 4-4"/>',
  centerBoth: '<circle cx="12" cy="12" r="3"/><path d="M12 2v7m0 6v7M2 12h7m6 0h7"/>',
  sideBySide: '<rect x="3" y="5" width="7" height="14" rx="1.5"/><rect x="14" y="5" width="7" height="14" rx="1.5"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  duplicate: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6"/>',
  pencil: '<path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="m14 7 3 3"/>',
  upload: '<path d="M12 16V4m-5 5 5-5 5 5M5 20h14"/>',
  download: '<path d="M12 4v12m-5-5 5 5 5-5M5 20h14"/>',
  arrowUpRight: '<path d="M7 17 17 7M8 7h9v9"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
  eyeOff: '<path d="m3 3 18 18M10.6 6.2A11 11 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3 3.7M6.2 6.2C3.4 8 2 12 2 12s3.5 6 10 6a10 10 0 0 0 3-.4"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/>'
};
function setIconControl(control, iconName, label) {
  if (!control || !UI_ICONS[iconName]) return;
  control.innerHTML = `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${UI_ICONS[iconName]}</svg>`;
  control.title = label;
  control.setAttribute('aria-label', label);
  if (control instanceof HTMLButtonElement) control.type = 'button';
}
function setIconGraphic(container, iconName) {
  if (!container || !UI_ICONS[iconName]) return;
  container.innerHTML = `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${UI_ICONS[iconName]}</svg>`;
}

const input = document.querySelector('#image-input');
const canvas = document.querySelector('#editor-canvas');
const ctx = canvas.getContext('2d');
const empty = document.querySelector('#canvas-empty');
const watermark = document.querySelector('#canvas-watermark');
const thumbList = document.querySelector('#thumb-list');
const imageCount = document.querySelector('#image-count');
const status = document.querySelector('#editor-status');
const opacityInput = document.querySelector('#watermark-opacity');
const watermarkImageInput = document.querySelector('#watermark-image-input');
const watermarkSize = document.querySelector('#watermark-size');
const exportFormat = document.querySelector('#export-format');
const fitSelect = document.querySelector('#fit-select');
const resizeWidth = document.querySelector('#resize-width');
const resizeHeight = document.querySelector('#resize-height');
const imageScale = document.querySelector('#image-scale');
const imageScaleValue = document.querySelector('#image-scale-value');
const watermarkGap = document.querySelector('#watermark-gap');
const removeBgButton = document.querySelector('#remove-bg');
removeBgButton.textContent = 'Remove BG'; removeBgButton.title = 'Remove background';
const removeBgGroup = removeBgButton.closest('.toolbar-group');
const removeAllBgButton = document.createElement('button');
removeAllBgButton.type = 'button'; removeAllBgButton.className = 'tool-toggle'; removeAllBgButton.id = 'remove-all-bg'; removeAllBgButton.textContent = 'Remove All BG'; removeAllBgButton.title = 'Remove all backgrounds';
removeBgButton.after(removeAllBgButton);
const shadowToggle = document.querySelector('#shadow-toggle');
const shadowStrength = document.querySelector('#shadow-strength');
shadowStrength.value = 80;
const angleLabel = document.createElement('label');
angleLabel.textContent = 'Shadow angle';
const shadowAngle = document.createElement('input');
shadowAngle.type = 'range'; shadowAngle.min = 0; shadowAngle.max = 360; shadowAngle.value = 90;
shadowAngle.setAttribute('aria-label', 'Shadow angle');
const angleValue = document.createElement('output'); angleValue.textContent = '90°';
angleLabel.append(shadowAngle, angleValue);
document.querySelector('.shadow-control').append(angleLabel);
shadowAngle.addEventListener('pointerdown', () => saveHistory());
shadowAngle.addEventListener('input', () => { const value = Number(shadowAngle.value); angleValue.textContent = value + '°'; const item = files[activeIndex]; if (item) getSelectedLayerEntities(item).forEach((entity) => { entity.data.shadowAngle = value; }); drawActive(); });
const distanceLabel = document.createElement('label');
distanceLabel.textContent = 'Shadow distance';
const shadowDistance = document.createElement('input');
shadowDistance.type = 'range'; shadowDistance.min = 0; shadowDistance.max = 100; shadowDistance.value = 18;
shadowDistance.setAttribute('aria-label', 'Shadow distance');
const distanceValue = document.createElement('output'); distanceValue.textContent = '18px';
distanceLabel.append(shadowDistance, distanceValue);
document.querySelector('.shadow-control').append(distanceLabel);
shadowDistance.addEventListener('pointerdown', () => saveHistory());
shadowDistance.addEventListener('input', () => { const value = Number(shadowDistance.value); distanceValue.textContent = value + 'px'; const item = files[activeIndex]; if (item) getSelectedLayerEntities(item).forEach((entity) => { entity.data.shadowDistance = value; }); drawActive(); });
const centerImage = document.querySelector('#center-image');
const rotateGroup = centerImage.closest('.toolbar-group');
setIconControl(document.querySelector('#rotate-left'), 'rotateLeft', 'Rotate left 15 degrees');
setIconControl(document.querySelector('#rotate-right'), 'rotateRight', 'Rotate right 15 degrees');
const positionGroup = document.createElement('div');
positionGroup.className = 'toolbar-group position-control';
positionGroup.innerHTML = '<span class="toolbar-label">Position</span>';
const centerHorizontal = document.createElement('button'); centerHorizontal.className = 'tool-toggle position-icon-button'; setIconControl(centerHorizontal, 'centerHorizontal', 'Center horizontally');
const centerVertical = document.createElement('button'); centerVertical.className = 'tool-toggle position-icon-button'; setIconControl(centerVertical, 'centerVertical', 'Center vertically');
centerImage.classList.add('position-icon-button'); setIconControl(centerImage, 'centerBoth', 'Center horizontally and vertically');
const movementLock = document.createElement('select'); movementLock.setAttribute('aria-label', 'Movement lock');
movementLock.innerHTML = '<option value="none">Move freely</option><option value="x">Lock horizontal</option><option value="y">Lock vertical</option><option value="both">Lock both axes</option>';
centerImage.remove(); positionGroup.append(centerHorizontal, centerVertical, centerImage, movementLock); rotateGroup.after(positionGroup);

const backgroundGroup = document.createElement('div'); backgroundGroup.className = 'toolbar-group background-control';
backgroundGroup.innerHTML = '<span class="toolbar-label">BG</span><div class="background-modes"><button type="button" class="tool-toggle" data-background="none">None</button><button type="button" class="tool-toggle active" data-background="color">Color</button></div>';
const backgroundColor = document.createElement('input'); backgroundColor.type = 'color'; backgroundColor.value = '#ffffff'; backgroundColor.title = 'Background color'; backgroundColor.disabled = false;
backgroundGroup.append(backgroundColor, removeBgButton, removeAllBgButton); removeBgGroup.remove(); positionGroup.after(backgroundGroup);
const layerGroup = document.createElement('section');
layerGroup.className = 'toolbar-group layer-control';
layerGroup.innerHTML = `
  <span class="toolbar-label">Layers</span>
  <div class="layer-primary-actions">
    <button class="layer-add-button" type="button">Add images</button>
    <button class="layer-select-all" type="button">Select all</button>
    <button class="layer-clear-selection" type="button">Clear</button>
  </div>
  <div class="layer-drop-zone" role="button" tabindex="0"><span>↓</span><strong>Drop images here</strong></div>
  <input class="layer-image-input" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden>
  <div class="layer-list"></div>
  <div class="layer-group-actions">
    <button type="button" data-layer-action="arrange"></button>
    <button type="button" data-layer-action="smaller"></button>
    <button type="button" data-layer-action="larger"></button>
    <button type="button" data-layer-action="duplicate"></button>
    <button type="button" data-layer-action="remove"></button>
  </div>`;
backgroundGroup.after(layerGroup);
const layerImageInput = layerGroup.querySelector('.layer-image-input');
const layerList = layerGroup.querySelector('.layer-list');
const layerAddButton = layerGroup.querySelector('.layer-add-button');
const layerSelectAllButton = layerGroup.querySelector('.layer-select-all');
const layerClearButton = layerGroup.querySelector('.layer-clear-selection');
const layerDropZone = layerGroup.querySelector('.layer-drop-zone');
setIconGraphic(layerDropZone.querySelector('span'), 'upload');
[
  ['arrange', 'sideBySide', 'Arrange side by side'],
  ['smaller', 'minus', 'Make selected layers smaller'],
  ['larger', 'plus', 'Make selected layers larger'],
  ['duplicate', 'duplicate', 'Duplicate selected layers'],
  ['remove', 'trash', 'Remove selected layers']
].forEach(([action, icon, label]) => setIconControl(layerGroup.querySelector(`[data-layer-action="${action}"]`), icon, label));
let backgroundMode = 'color';
const exportOne = document.querySelector('#export-one');
const exportAll = document.querySelector('#export-all');
const canvasWrap = document.querySelector('#canvas-wrap');
setIconGraphic(document.querySelector('.upload-icon.small'), 'upload');
setIconGraphic(exportOne.querySelector('span'), 'download');
setIconGraphic(exportAll.querySelector('span'), 'download');
setIconGraphic(canvasWrap.querySelector('.canvas-empty label span'), 'arrowUpRight');
const files = [];
let selectedBatchImageIds = new Set();
let listingAutoPrompted = false;
let refreshListingPreview = () => {};
function createBatchImageId() { return globalThis.crypto?.randomUUID?.() || `image-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function watermarkTargetItems() {
  return files.filter((item) => selectedBatchImageIds.has(item.id));
}
resizeWidth.value = '1576';
resizeHeight.value = '1576';
fitSelect.value = 'contain';
imageScale.max = 300;
imageScale.step = imageScaleValue.step = '.01';
function setImageScaleInputs(value) {
  const minimum = Number(imageScale.min) || 10;
  const maximum = Number(imageScale.max) || 300;
  const parsed = Number(value);
  const normalized = Math.max(minimum, Math.min(maximum, Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 100));
  imageScale.value = String(normalized);
  imageScaleValue.value = String(normalized);
  return normalized;
}
setImageScaleInputs(100);
watermarkGap.value = 0;
watermarkSize.style.display = 'none';
watermarkGap.style.display = 'none';
document.querySelector('.watermark-control .toolbar-label').textContent = 'Watermark';
watermarkSize.min = 0;
watermarkSize.max = 500;
watermarkSize.value = 0;
watermarkSize.title = 'Watermark gap in pixels';
document.querySelector('.watermark-control .toolbar-label').textContent = 'Watermark';
const horizontalFlipButton = document.querySelector('#mirror-button');
const verticalFlipButton = document.querySelector('#vertical-flip');
let activeIndex = -1;
let dragOffset = { x: 0, y: 0 };
let exporting = false;
let selectedLayerIds = new Set(['base']);
let layerClipboard = [];
let layerClipboardPasteCount = 0;
const undoStack = [];
const redoStack = [];
let editorHistory = null;
let historyPersistence = Promise.resolve();
function updateHistoryButtons() {
  const busy = !editorHistory || editorHistory.depth > 0 || editorHistory.restoring;
  undoButton.disabled = busy || !undoStack.length; redoButton.disabled = busy || !redoStack.length;
}
function saveHistory() { editorHistory?.prepare(); }
function checkpointHistory() { editorHistory?.capture(); }
function undo() { editorHistory?.undo(); }
function redo() { editorHistory?.redo(); }
async function withHistoryAction(action) {
  const history = editorHistory; history?.begin();
  try { return await action(); }
  finally { history?.end(); }
}
function withHistoryActionSync(action) {
  const history = editorHistory; history?.begin();
  try { return action(); }
  finally { history?.end(); }
}
const headerActions = document.querySelector('.header-actions');
const headerExportControl = headerActions.querySelector('.header-export-control');
const resizeGroup = resizeWidth.closest('.toolbar-group');
rotateGroup.classList.add('header-tool-group', 'header-rotate-control');
positionGroup.classList.add('header-tool-group', 'header-position-control');
backgroundGroup.classList.add('header-tool-group', 'header-background-control');
resizeGroup.classList.add('header-tool-group', 'header-resize-control');
headerActions.insertBefore(rotateGroup, headerExportControl);
headerActions.insertBefore(positionGroup, headerExportControl);
headerActions.insertBefore(backgroundGroup, headerExportControl);
headerActions.insertBefore(resizeGroup, headerExportControl);
const undoButton = document.createElement('button'); undoButton.className = 'history-button'; setIconControl(undoButton, 'undo', 'Undo (Ctrl+Z)');
const redoButton = document.createElement('button'); redoButton.className = 'history-button'; setIconControl(redoButton, 'redo', 'Redo (Ctrl+Y)');
headerActions.prepend(redoButton); headerActions.prepend(undoButton);
undoButton.addEventListener('click', undo); redoButton.addEventListener('click', redo); updateHistoryButtons();
window.addEventListener('keydown', (event) => {
  if (!(event.ctrlKey || event.metaKey) || event.altKey || event.isComposing) return;
  const key = event.code || event.key.toLowerCase();
  if (key === 'KeyZ' || key === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
  else if (key === 'KeyY' || key === 'y') { event.preventDefault(); redo(); }
});
let keyboardMoveActive = false;
window.addEventListener('keydown', (event) => {
  if (activeIndex < 0 || event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
  const direction = {
    ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    ArrowUp: [0, -1], ArrowDown: [0, 1]
  }[event.key];
  if (!direction) return;
  event.preventDefault();
  if (!selectedLayerIds.size) { setStatus('Select one or more layers first.'); return; }
  const horizontalBlocked = direction[0] && (movementLock.value === 'x' || movementLock.value === 'both');
  const verticalBlocked = direction[1] && (movementLock.value === 'y' || movementLock.value === 'both');
  if (horizontalBlocked || verticalBlocked) { setStatus('Movement is locked on this axis.'); return; }
  if (!keyboardMoveActive) { saveHistory(); keyboardMoveActive = true; }
  const step = event.shiftKey ? 10 : 1;
  moveSelectedLayerEntities(direction[0] * step, direction[1] * step);
  drawActive();
  setStatus(`${selectedLayerIds.size > 1 ? 'Selected layers' : 'Layer'} moved ${event.shiftKey ? '10' : '1'} px.`);
});
window.addEventListener('keyup', (event) => { if (event.key.startsWith('Arrow')) keyboardMoveActive = false; });
const setStatus = (message) => { status.textContent = message; };

function addImages(fileList, {metadataByFile = null} = {}) {
  const accepted = [...fileList].filter((file) => file.type.startsWith('image/'));
  const added = [];
  accepted.forEach((file) => {
    const item = { id: createBatchImageId(), file, displayName: file.name, url: URL.createObjectURL(file), image: new Image(), rotation: 0, mirror: false, flipY: false, offsetX: 0, offsetY: 0, scale: 100, fit: fitSelect.value, removeBg: false, processed: null, smartPrep: null, shadow: false, shadowAngle: 90, shadowDistance: 18, shadowStrength: 80, layers: [], layerOrder: ['base'], baseRemoved: false, watermarkImage: null, watermarkEnabled: false, watermarkOpacity: 100, watermarkSection: null, watermarkTemplateId: null };
    if (metadataByFile?.has(file)) item.listingMetadata = metadataByFile.get(file);
    item.image.onload = () => { if (activeIndex === -1) selectImage(0); else if (files[activeIndex] === item) drawActive(); refreshListingPreview(); };
    item.image.onerror = () => { setStatus(`${file.name} could not be loaded.`); refreshListingPreview(); };
    item.image.src = item.url; files.push(item); added.push(item);
  });
  if (accepted.length) {
    if (activeIndex === -1) activeIndex = 0;
    renderThumbs(); selectImage(activeIndex); setStatus(`${files.length} image${files.length === 1 ? '' : 's'} ready to edit.`);
    if (!listingAutoPrompted) {
      listingAutoPrompted = true;
      window.setTimeout(() => openListingPanel(), 0);
    }
  }
  return added;
}
input.addEventListener('change', (event) => addImages(event.target.files));
canvasWrap.addEventListener('dragover', (event) => { event.preventDefault(); canvasWrap.classList.add('dragging'); });
canvasWrap.addEventListener('dragleave', () => canvasWrap.classList.remove('dragging'));
canvasWrap.addEventListener('drop', (event) => { event.preventDefault(); canvasWrap.classList.remove('dragging'); addImages(event.dataTransfer.files); });

const thumbnailCanvas = document.createElement('canvas');
const thumbnailContext = thumbnailCanvas.getContext('2d');
let thumbnailFrame = 0;
function scheduleThumbnailUpdate(item) {
  if (exporting || !item) return;
  if (files[activeIndex] !== item || canvas.hidden || !canvas.width || !canvas.height) return;
  const scale = 96 / Math.max(canvas.width, canvas.height);
  thumbnailCanvas.width = Math.max(1, Math.round(canvas.width * scale));
  thumbnailCanvas.height = Math.max(1, Math.round(canvas.height * scale));
  thumbnailContext.clearRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
  thumbnailContext.drawImage(canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
  window.cancelAnimationFrame(thumbnailFrame);
  thumbnailFrame = window.requestAnimationFrame(() => {
    if (files[activeIndex] !== item) return;
    try { item.thumbnailDataUrl = thumbnailCanvas.toDataURL('image/webp', .82); }
    catch { return; }
    const index = files.indexOf(item);
    const preview = thumbList.querySelector(`[data-thumb-index="${index}"] .thumb-select img`);
    if (preview) preview.src = item.thumbnailDataUrl;
  });
}
function handleThumbnailSelection(index, event) {
  const item = files[index]; if (!item) return;
  const additive = event.ctrlKey || event.metaKey;
  if (!additive) {
    selectedBatchImageIds = new Set([item.id]);
    selectImage(index, {preserveBatchSelection: true});
    setStatus(`Watermark changes will apply only to ${item.displayName || item.file.name}.`);
    return;
  }
  if (selectedBatchImageIds.has(item.id) && selectedBatchImageIds.size > 1) selectedBatchImageIds.delete(item.id);
  else selectedBatchImageIds.add(item.id);
  let nextIndex = index;
  if (!selectedBatchImageIds.has(item.id)) {
    const activeItem = files[activeIndex];
    nextIndex = activeItem && selectedBatchImageIds.has(activeItem.id) ? activeIndex : files.findIndex((entry) => selectedBatchImageIds.has(entry.id));
  }
  selectImage(Math.max(0, nextIndex), {preserveBatchSelection: true});
  const selectedItem = files.find((entry) => selectedBatchImageIds.has(entry.id));
  setStatus(selectedBatchImageIds.size >= 2
    ? `${selectedBatchImageIds.size} images selected for watermark changes.`
    : `Watermark changes will apply only to ${selectedItem?.displayName || selectedItem?.file?.name || 'the selected image'}.`);
}

async function selectAllBatchImagesAndApplyWatermark() {
  if (!files.length) {
    setStatus('Upload images before selecting the batch.');
    return;
  }

  selectedBatchImageIds = new Set(files.map((item) => item.id));
  renderThumbs();
  syncWatermarkControls();

  const activeTemplate = selectedWatermarkSection != null && activeWatermarkTemplateId
    ? findWatermarkTemplate(selectedWatermarkSection, activeWatermarkTemplateId)
    : null;
  if (!activeTemplate) {
    setStatus(`All ${files.length} images selected. Choose a watermark template to apply.`);
    return;
  }

  await selectWatermarkTemplate(selectedWatermarkSection, activeWatermarkTemplateId);
  setStatus(`${activeTemplate.name} applied to all ${files.length} selected images.`);
}
document.addEventListener('keydown', (event) => {
  const isAKey = event.code === 'KeyA' || (event.key || '').toLowerCase() === 'a';
  if (!event.ctrlKey || !event.altKey || !isAKey) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.repeat) return;
  selectAllBatchImagesAndApplyWatermark().catch(() => setStatus('All images were selected, but the active watermark could not be applied.'));
}, true);

function renderThumbs() {
  checkpointHistory();
  thumbList.innerHTML = '';
  files.forEach((item, index) => {
    const itemLabel = item.displayName || item.file.name;
    const row = document.createElement('div'); row.className = `thumb-item ${selectedBatchImageIds.has(item.id) ? 'batch-selected' : ''} ${index === activeIndex ? 'active' : ''}`; row.dataset.thumbIndex = index;
    const select = document.createElement('button'); select.type = 'button'; select.className = 'thumb-select';
    const preview = document.createElement('img'); preview.src = item.thumbnailDataUrl || item.url; preview.alt = '';
    const name = document.createElement('span'); name.textContent = itemLabel;
    const duplicate = document.createElement('button'); duplicate.className = 'thumb-duplicate'; setIconControl(duplicate, 'duplicate', `Duplicate ${itemLabel}`);
    const remove = document.createElement('button'); remove.className = 'thumb-remove'; setIconControl(remove, 'trash', `Remove ${itemLabel}`);
    select.append(preview, name); select.addEventListener('click', (event) => handleThumbnailSelection(index, event));
    duplicate.addEventListener('click', async () => { duplicate.disabled = true; await duplicateBatchImage(index); });
    remove.addEventListener('click', () => removeBatchImage(index));
    row.append(select, duplicate, remove); thumbList.appendChild(row);
  });
  imageCount.textContent = `${files.length} image${files.length === 1 ? '' : 's'}`; exportOne.disabled = exportAll.disabled = files.length === 0; updateRemoveBackgroundControls(); refreshListingPreview();
}
function duplicateDisplayName(name) {
  const match = name.match(/^(.*?)(\.[^.]*)?$/);
  return `${match?.[1] || name} copy${match?.[2] || ''}`;
}
function loadDuplicateAsset(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), image = new Image();
    image.onload = () => resolve({url, image});
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image copy failed')); };
    image.src = url;
  });
}
async function duplicateBatchImage(index) {
  const source = files[index]; if (!source) return;
  try {
    const baseAsset = await loadDuplicateAsset(source.file);
    const layerAssets = await Promise.all((source.layers || []).map((layer) => loadDuplicateAsset(layer.file)));
    const idMap = new Map();
    const layers = (source.layers || []).map((layer, layerIndex) => {
      const id = createLayerId(); idMap.set(layer.id, id);
      return {...layer, id, url: layerAssets[layerIndex].url, image: layerAssets[layerIndex].image, processed: null};
    });
    const duplicate = {
      ...source,
      id: createBatchImageId(),
      displayName: duplicateDisplayName(source.displayName || source.file.name),
      url: baseAsset.url,
      image: baseAsset.image,
      processed: null,
      thumbnailDataUrl: source.thumbnailDataUrl,
      layers,
      layerOrder: allLayerEntityIds(source).map((id) => id === 'base' ? 'base' : idMap.get(id)).filter(Boolean)
    };
    files.splice(index + 1, 0, duplicate);
    selectImage(index + 1);
    setStatus(`${duplicate.displayName} added to the batch.`);
  } catch { setStatus('The image could not be duplicated.'); renderThumbs(); }
}
function updateRemoveBackgroundControls() {
  const item = files[activeIndex];
  const selected = item ? getSelectedLayerEntities(item).filter((entity) => !isCloseViewImage(entity.data)) : [];
  const eligible = files.flatMap((entry) => [entry, ...(entry.layers || [])]).filter((entry) => !isCloseViewImage(entry));
  removeBgButton.disabled = !selected.length;
  removeAllBgButton.disabled = !eligible.length;
  removeBgButton.classList.toggle('active', Boolean(selected.length) && selected.every((entity) => entity.data.removeBg));
  removeAllBgButton.classList.toggle('active', Boolean(eligible.length) && eligible.every((entry) => entry.removeBg));
}
function removeBatchImage(index) {
  const item = files[index]; if (!item) return;
  const wasActive = index === activeIndex;
  selectedBatchImageIds.delete(item.id);
  files.splice(index, 1);
  // History retains image URLs so a deleted image can be restored until this tab closes.
  if (!files.length) {
    cpisListingContext = null;
    activeIndex = -1; selectedLayerIds.clear(); selectedBatchImageIds.clear(); listingAutoPrompted = false; renderThumbs(); renderLayerList();
    empty.hidden = false; canvas.hidden = true; watermark.hidden = true; ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStatus(`${item.displayName || item.file.name} removed. No images remain.`); return;
  }
  if (index < activeIndex) activeIndex -= 1;
  if (wasActive) activeIndex = Math.min(index, files.length - 1);
  if (!selectedBatchImageIds.size) selectedBatchImageIds.add(files[activeIndex].id);
  if (wasActive) selectImage(activeIndex, {preserveBatchSelection: true});
  else renderThumbs();
  setStatus(`${item.displayName || item.file.name} removed from the batch.`);
}
function selectImage(index, {preserveBatchSelection = false} = {}) {
  const item = files[index]; if (!item) return;
  activeIndex = index; item.layers ||= []; normalizeLayerOrder(item);
  if (!preserveBatchSelection) selectedBatchImageIds = new Set([item.id]);
  else if (!selectedBatchImageIds.size) selectedBatchImageIds.add(item.id);
  const layerIds = allLayerEntityIds(item);
  selectedLayerIds = new Set(layerIds.length ? [layerIds[layerIds.length - 1]] : []);
  renderThumbs(); renderLayerList(); syncSelectedLayerControls(); syncWatermarkControls();
  empty.hidden = true; canvas.hidden = false; watermark.hidden = false; drawActive();
}
function drawBackground() {
  // Canvas resizing resets context options; restore smooth resampling every render.
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const item = files[activeIndex];
  const needsWhiteExport = exporting && (exportFormat.value === 'jpg' || (exportFormat.value === 'webp' && item?.removeBg));
  if (backgroundMode === 'color' || needsWhiteExport) {
    ctx.fillStyle = backgroundMode === 'color' ? backgroundColor.value : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
function createBackgroundRemovedSource(source) {
  const sourceWidth = source.naturalWidth || source.width, sourceHeight = source.naturalHeight || source.height;
  const work = document.createElement('canvas'); work.width = sourceWidth; work.height = sourceHeight;
  const workCtx = work.getContext('2d'); workCtx.drawImage(source, 0, 0);
  const pixels = workCtx.getImageData(0, 0, work.width, work.height), analysis = analyzeProductBackground(pixels);
  // Never key out similar colors inside the product or erase an uncertain subject.
  if (analysis.reliable) {
    for (let i = 0; i < analysis.backgroundMask.length; i++) if (analysis.backgroundMask[i]) pixels.data[i * 4 + 3] = 0;
    refineCutoutEdges(pixels);
  }
  workCtx.putImageData(pixels, 0, 0); return work;
}
function refineCutoutEdges(pixels) {
  const {width, height, data} = pixels, inset = new Uint8Array(width * height), protectedDetail = new Uint8Array(width * height);
  // Trim against actual transparent background, not the outside of the canvas.
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const index = y * width + x;
    let alpha = data[index * 4 + 3];
    if (!alpha) continue;
    for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1); yy++) for (let xx = Math.max(0, x - 1); xx <= Math.min(width - 1, x + 1); xx++) if (!data[(yy * width + xx) * 4 + 3]) alpha = 0;
    inset[index] = alpha;
  }
  // A one/two-pixel strap, stitch or tip has no eroded core. Preserve it instead
  // of shrinking it to nothing, and keep its connection to the thicker product.
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const index = y * width + x;
    if (!data[index * 4 + 3] || inset[index]) continue;
    let hasCore = false;
    for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1); yy++) for (let xx = Math.max(0, x - 1); xx <= Math.min(width - 1, x + 1); xx++) if (inset[yy * width + xx]) hasCore = true;
    if (!hasCore) protectedDetail[index] = 1;
  }
  const edgeAlpha = inset.slice();
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const index = y * width + x;
    if (!data[index * 4 + 3]) continue;
    for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1); yy++) for (let xx = Math.max(0, x - 1); xx <= Math.min(width - 1, x + 1); xx++) {
      if (protectedDetail[yy * width + xx]) edgeAlpha[index] = data[index * 4 + 3];
    }
  }
  // Feather inward only: smoothing must never recreate the removed outer halo.
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const index = y * width + x, offset = index * 4;
    if (edgeAlpha[index] > inset[index]) continue;
    if (!edgeAlpha[index]) { data[offset + 3] = 0; continue; }
    let sum = 0, touchesBackground = false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const neighbor = Math.max(0, Math.min(height - 1, y + dy)) * width + Math.max(0, Math.min(width - 1, x + dx));
      sum += edgeAlpha[neighbor] * (dx === 0 ? 2 : 1) * (dy === 0 ? 2 : 1);
      if (!edgeAlpha[neighbor]) touchesBackground = true;
    }
    if (touchesBackground) data[offset + 3] = Math.min(edgeAlpha[index], Math.round(sum / 16));
  }
}
function isCloseViewImage(item) {
  if (!item) return false;
  // Resolved CPIS metadata takes priority, including a non-cv role on a cv filename.
  if (item.listingMetadata) {
    try { return Boolean(PhotoStudioMetadata.resolveImage(item.listingMetadata).closeView); }
    catch { return false; }
  }
  if (typeof item.closeView === 'boolean') return item.closeView;
  return Boolean(PhotoStudioMetadata.detectFilename(item.file?.name || item.name || '').closeView);
}
function minimumLayerScale(item) { return isCloseViewImage(item) ? 100 : 10; }
function getImageSource(item) {
  if (isCloseViewImage(item) || !item.removeBg) return item.image;
  if (!item.processed) item.processed = createBackgroundRemovedSource(item.image);
  return item.processed;
}
function getAddedLayerSource(layer) {
  if (!isCloseViewImage(layer) && layer.sourceSnapshot?.removeBg === Boolean(layer.removeBg)) return layer.sourceSnapshot.image;
  if (!isCloseViewImage(layer) && !layer.removeBg && layer.sourceSnapshot?.original) return layer.sourceSnapshot.original;
  if (isCloseViewImage(layer) || !layer.removeBg) return layer.image;
  if (!layer.processed) layer.processed = createBackgroundRemovedSource(layer.sourceSnapshot?.original || layer.image);
  return layer.processed;
}
function imageSourceSize(source) {
  return {width: source?.naturalWidth || source?.width || 0, height: source?.naturalHeight || source?.height || 0};
}
function clampNumber(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
function cornerAverage(pixels, width, height, fromX, fromY, sampleWidth, sampleHeight) {
  let red = 0, green = 0, blue = 0, alpha = 0, weight = 0;
  const endX = Math.min(width, fromX + sampleWidth), endY = Math.min(height, fromY + sampleHeight);
  for (let y = Math.max(0, fromY); y < endY; y += 1) {
    for (let x = Math.max(0, fromX); x < endX; x += 1) {
      const offset = (y * width + x) * 4, pixelWeight = pixels[offset + 3] / 255;
      red += pixels[offset] * pixelWeight; green += pixels[offset + 1] * pixelWeight; blue += pixels[offset + 2] * pixelWeight;
      alpha += pixels[offset + 3]; weight += pixelWeight;
    }
  }
  const count = Math.max(1, (endX - Math.max(0, fromX)) * (endY - Math.max(0, fromY)));
  return weight ? [red / weight, green / weight, blue / weight, alpha / count] : [255, 255, 255, 0];
}
function interpolatedBackgroundColor(corners, xRatio, yRatio) {
  const topWeight = 1 - yRatio, leftWeight = 1 - xRatio;
  return corners[0].map((value, channel) =>
    value * leftWeight * topWeight
    + corners[1][channel] * xRatio * topWeight
    + corners[2][channel] * leftWeight * yRatio
    + corners[3][channel] * xRatio * yRatio
  );
}
function analyzeProductBackground(original, {conservative = true} = {}) {
  const {width, height} = original;
  const sampleSize = Math.max(2, Math.round(Math.min(width, height) * .035));
  const corners = [
    cornerAverage(original.data, width, height, 0, 0, sampleSize, sampleSize),
    cornerAverage(original.data, width, height, width - sampleSize, 0, sampleSize, sampleSize),
    cornerAverage(original.data, width, height, 0, height - sampleSize, sampleSize, sampleSize),
    cornerAverage(original.data, width, height, width - sampleSize, height - sampleSize, sampleSize, sampleSize)
  ];
  if (conservative) {
    // If three corners agree, the fourth can be part of the product rather than
    // background. Do not use that corner to erase the same color everywhere.
    const colorDistance = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
    for (let index = 0; index < corners.length; index++) {
      const others = corners.filter((_, other) => other !== index);
      if (others.every(a => a[3] > 240 && others.every(b => colorDistance(a, b) <= 60))
          && others.every(a => colorDistance(a, corners[index]) > 120)) {
        corners[index] = [0, 1, 2, 3].map(channel => others.reduce((sum, corner) => sum + corner[channel], 0) / others.length);
      }
    }
  }
  const colorDifference = (offset, expected) => Math.abs(original.data[offset] - expected[0]) + Math.abs(original.data[offset + 1] - expected[1]) + Math.abs(original.data[offset + 2] - expected[2]);
  const borderDifferences = [];
  let transparentBorderSamples = 0;
  const borderStep = Math.max(1, Math.round(Math.min(width, height) / 220));
  const collectBorderDifference = (x, y) => {
    const expected = interpolatedBackgroundColor(corners, width > 1 ? x / (width - 1) : 0, height > 1 ? y / (height - 1) : 0);
    borderDifferences.push(colorDifference((y * width + x) * 4, expected));
    if (original.data[(y * width + x) * 4 + 3] === 0) transparentBorderSamples++;
  };
  for (let x = 0; x < width; x += borderStep) { collectBorderDifference(x, 0); collectBorderDifference(x, height - 1); }
  for (let y = 0; y < height; y += borderStep) { collectBorderDifference(0, y); collectBorderDifference(width - 1, y); }
  borderDifferences.sort((a, b) => a - b);
  const borderPercentile = borderDifferences[Math.floor(borderDifferences.length * .78)] || 0;
  const transparentBackground = conservative && transparentBorderSamples >= borderDifferences.length * .9;
  const threshold = conservative ? clampNumber(borderPercentile + 12, 18, 48) : clampNumber(borderPercentile + 30, 58, 135);
  const edgeThreshold = clampNumber(borderPercentile + 6, 10, 24);
  const minimumAlpha = conservative ? 1 : 12;
  const candidate = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    const yRatio = height > 1 ? y / (height - 1) : 0;
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x, offset = pixelIndex * 4;
      if (original.data[offset + 3] < minimumAlpha) { candidate[pixelIndex] = 1; continue; }
      if (transparentBackground) continue; // Respect an existing cutout's colors and alpha.
      const expected = interpolatedBackgroundColor(corners, width > 1 ? x / (width - 1) : 0, yRatio);
      if (colorDifference(offset, expected) <= threshold) candidate[pixelIndex] = 1;
    }
  }
  const backgroundMask = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let queueStart = 0, queueEnd = 0;
  const enqueue = (index, from = -1) => {
    if (index < 0 || index >= candidate.length || backgroundMask[index] || !candidate[index]) return;
    if (conservative && from >= 0 && original.data[index * 4 + 3] && original.data[from * 4 + 3]) {
      const a = index * 4, b = from * 4;
      if (Math.abs(original.data[a] - original.data[b]) + Math.abs(original.data[a + 1] - original.data[b + 1]) + Math.abs(original.data[a + 2] - original.data[b + 2]) > edgeThreshold) return;
    }
    backgroundMask[index] = 1; queue[queueEnd] = index; queueEnd += 1;
  };
  for (let x = 0; x < width; x += 1) { enqueue(x); enqueue((height - 1) * width + x); }
  for (let y = 1; y < height - 1; y += 1) { enqueue(y * width); enqueue(y * width + width - 1); }
  while (queueStart < queueEnd) {
    const index = queue[queueStart]; queueStart += 1;
    const x = index % width;
    if (x > 0) enqueue(index - 1, index);
    if (x + 1 < width) enqueue(index + 1, index);
    if (index >= width) enqueue(index - width, index);
    if (index + width < candidate.length) enqueue(index + width, index);
  }
  let left = width, top = height, right = -1, bottom = -1, foregroundCount = 0, opaqueCount = 0;
  for (let index = 0; index < backgroundMask.length; index += 1) {
    const alpha = original.data[index * 4 + 3];
    if (alpha >= minimumAlpha) opaqueCount += 1;
    if (backgroundMask[index] || alpha < minimumAlpha) continue;
    foregroundCount += 1;
    const x = index % width, y = Math.floor(index / width);
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  const coverage = foregroundCount / Math.max(1, opaqueCount);
  const reliable = foregroundCount > 0 && (transparentBackground || (coverage >= .01 && coverage <= .94)) && right >= left && bottom >= top;
  return {corners, backgroundMask, left, top, right, bottom, coverage, reliable};
}
const smartSourceCache = new WeakMap();
function createSmartPreparation(source, safeArea, templateKey = '') {
  const sourceSize = imageSourceSize(source);
  if (!sourceSize.width || !sourceSize.height) throw new Error('The product image is not ready.');
  const cacheKey = source instanceof HTMLImageElement ? `${source.currentSrc || source.src}:${sourceSize.width}:${sourceSize.height}` : null;
  const cached = cacheKey && smartSourceCache.get(source);
  if (cached?.key === cacheKey) return {...cached.preparation, bounds: {...cached.preparation.bounds}, safeArea: {...safeArea}, templateKey};
  const analysisScale = Math.min(1, 1600 / Math.max(sourceSize.width, sourceSize.height));
  const width = Math.max(1, Math.round(sourceSize.width * analysisScale));
  const height = Math.max(1, Math.round(sourceSize.height * analysisScale));
  const work = document.createElement('canvas'); work.width = width; work.height = height;
  const workContext = work.getContext('2d', {willReadFrequently: true});
  workContext.drawImage(source, 0, 0, width, height);
  const original = workContext.getImageData(0, 0, width, height);
  const analysis = analyzeProductBackground(original, {conservative: false});
  const {corners, backgroundMask, coverage, reliable} = analysis;
  let {left, top, right, bottom} = analysis;
  let foreground = document.createElement('canvas'); foreground.width = width; foreground.height = height;
  const foregroundContext = foreground.getContext('2d');
  const foregroundPixels = foregroundContext.createImageData(width, height);
  const reconstructed = document.createElement('canvas'); reconstructed.width = width; reconstructed.height = height;
  const reconstructedContext = reconstructed.getContext('2d');
  const reconstructedPixels = reconstructedContext.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    const yRatio = height > 1 ? y / (height - 1) : 0;
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x, offset = index * 4;
      const expected = interpolatedBackgroundColor(corners, width > 1 ? x / (width - 1) : 0, yRatio);
      const isForeground = reliable ? !backgroundMask[index] && original.data[offset + 3] >= 12 : true;
      if (isForeground) {
        foregroundPixels.data[offset] = original.data[offset]; foregroundPixels.data[offset + 1] = original.data[offset + 1]; foregroundPixels.data[offset + 2] = original.data[offset + 2]; foregroundPixels.data[offset + 3] = analysisScale < 1 ? 255 : original.data[offset + 3];
      }
      const preserveOriginal = reliable && !isForeground;
      reconstructedPixels.data[offset] = preserveOriginal ? original.data[offset] : Math.round(expected[0]);
      reconstructedPixels.data[offset + 1] = preserveOriginal ? original.data[offset + 1] : Math.round(expected[1]);
      reconstructedPixels.data[offset + 2] = preserveOriginal ? original.data[offset + 2] : Math.round(expected[2]);
      reconstructedPixels.data[offset + 3] = preserveOriginal ? original.data[offset + 3] : Math.round(Math.max(expected[3], 255));
    }
  }
  if (!reliable) { left = 0; top = 0; right = width - 1; bottom = height - 1; }
  if (reliable && analysisScale === 1) refineCutoutEdges(foregroundPixels);
  foregroundContext.putImageData(foregroundPixels, 0, 0);
  if (analysisScale < 1) {
    // Analyze a smaller image, but retain original-resolution product pixels.
    // Only the mask is enlarged; edge cleanup is always one native source pixel.
    const fullSize = document.createElement('canvas'); fullSize.width = sourceSize.width; fullSize.height = sourceSize.height;
    const fullContext = fullSize.getContext('2d');
    if (reliable) {
      fullContext.imageSmoothingEnabled = true; fullContext.imageSmoothingQuality = 'high';
      fullContext.drawImage(foreground, 0, 0, fullSize.width, fullSize.height);
      // Recover the contour before trimming: resampling can introduce a faint
      // outside mask edge. Source transparency is applied separately, once.
      const maskPixels = fullContext.getImageData(0, 0, fullSize.width, fullSize.height);
      for (let offset = 3; offset < maskPixels.data.length; offset += 4) maskPixels.data[offset] = maskPixels.data[offset] >= 128 ? 255 : 0;
      fullContext.putImageData(maskPixels, 0, 0);
      fullContext.globalCompositeOperation = 'source-in'; fullContext.drawImage(source, 0, 0);
      fullContext.globalCompositeOperation = 'source-over';
      const fullPixels = fullContext.getImageData(0, 0, fullSize.width, fullSize.height);
      refineCutoutEdges(fullPixels); fullContext.putImageData(fullPixels, 0, 0);
    } else fullContext.drawImage(source, 0, 0);
    foreground = fullSize;
  }
  reconstructedContext.putImageData(reconstructedPixels, 0, 0);
  const sourceScaleX = sourceSize.width / width, sourceScaleY = sourceSize.height / height;
  const boundsLeft = Math.floor(left * sourceScaleX), boundsTop = Math.floor(top * sourceScaleY);
  const preparation = {
    enabled: true,
    foreground,
    background: reconstructed,
    bounds: {x: boundsLeft, y: boundsTop, width: Math.max(1, Math.ceil((right + 1) * sourceScaleX) - boundsLeft), height: Math.max(1, Math.ceil((bottom + 1) * sourceScaleY) - boundsTop)},
    safeArea: {...safeArea},
    templateKey,
    coverage,
    mode: reliable ? 'separated' : 'fallback',
    analysisSize: {width, height}
  };
  if (cacheKey) smartSourceCache.set(source, {key: cacheKey, preparation: {...preparation, bounds: {...preparation.bounds}}});
  return preparation;
}
const SMART_WATERMARK_GAP = 50; // Output pixels, independent of template size or browser zoom.
function smartSafeRect(preparation, outputWidth = canvas.width, outputHeight = canvas.height) {
  const safeArea = preparation?.safeArea || {};
  const nativeWidth = Math.max(1, Number(safeArea.canvasWidth) || outputWidth);
  const nativeHeight = Math.max(1, Number(safeArea.canvasHeight) || outputHeight);
  const topMargin = clampNumber(Number(safeArea.topMargin) || 0, 0, nativeHeight);
  const bottomMargin = clampNumber(Number(safeArea.bottomMargin) || 0, 0, nativeHeight - topMargin);
  // Match paintWatermark's centered cover transform, including non-square exports.
  const scale = Math.max(outputWidth / nativeWidth, outputHeight / nativeHeight);
  const offsetY = (outputHeight - nativeHeight * scale) / 2;
  const top = Math.max(0, offsetY + topMargin * scale);
  const bottom = Math.min(outputHeight, offsetY + (nativeHeight - bottomMargin) * scale);
  return {x: SMART_WATERMARK_GAP, y: top + SMART_WATERMARK_GAP,
    width: Math.max(0, outputWidth - SMART_WATERMARK_GAP * 2),
    height: Math.max(0, bottom - top - SMART_WATERMARK_GAP * 2)};
}
const normalHeaderMasks = new WeakMap();
const normalProductFits = new WeakMap();
function normalHeaderMask(image, safeRect) {
  // The middle branding is an intentional overlay; only protect the header here.
  const headerHeight = Math.min(canvas.height, Math.ceil(Math.max(safeRect.y, canvas.height * .25)));
  const key = `${canvas.width}:${canvas.height}:${headerHeight}`;
  const cached = normalHeaderMasks.get(image);
  if (cached?.key === key) return cached;
  const analysisScale = Math.min(1, 400 / Math.max(canvas.width, canvas.height));
  const width = Math.ceil(canvas.width * analysisScale);
  const scale = width / canvas.width;
  const radius = Math.ceil(SMART_WATERMARK_GAP * scale) + 2;
  const height = Math.min(Math.ceil(canvas.height * scale), Math.ceil(headerHeight * scale) + radius);
  const work = document.createElement('canvas'); work.width = canvas.width; work.height = headerHeight;
  const context = work.getContext('2d', {willReadFrequently: true});
  const fit = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
  const drawWidth = image.naturalWidth * fit, drawHeight = image.naturalHeight * fit;
  context.drawImage(image, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
  const pixels = context.getImageData(0, 0, work.width, work.height).data;
  const occupied = new Uint8Array(width * height), mask = new Uint8Array(width * height);
  let artworkBottom = 0;
  // Pool native pixels so thin artwork cannot disappear when the mask is reduced.
  for (let y = 0; y < headerHeight; y += 1) for (let x = 0; x < canvas.width; x += 1) {
    if (pixels[(y * canvas.width + x) * 4 + 3] <= 16) continue;
    occupied[Math.floor(y * scale) * width + Math.floor(x * scale)] = 1;
    artworkBottom = y + 1;
  }
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    if (!occupied[y * width + x]) continue;
    for (let row = Math.max(0, y - radius); row <= Math.min(height - 1, y + radius); row += 1) {
      mask.fill(1, row * width + Math.max(0, x - radius), row * width + Math.min(width, x + radius + 1));
    }
  }
  const result = {key, width, height, scale, mask, artworkBottom, samplingGap: radius / scale};
  normalHeaderMasks.set(image, result);
  return result;
}
function fitNormalTemplateTop(item, geometry) {
  const preparation = item.smartPrep;
  const sourceSize = imageSourceSize(item.image);
  const landscape = sourceSize.width > sourceSize.height || geometry.width > geometry.height;
  const template = findWatermarkTemplate(item.watermarkSection, item.watermarkTemplateId);
  if (isCloseViewImage(item) || item.originalSize || preparation.mode !== 'separated'
      || preparation.safeArea.source === 'custom' || normalizeListingTemplateName(template?.name) !== 'normal'
      || !item.watermarkImage?.naturalWidth) return geometry;
  const key = [canvas.width, canvas.height, geometry.x, geometry.y, geometry.width, geometry.height, geometry.safeRect.y,
    item.rotation || 0, Boolean(item.mirror), Boolean(item.flipY)].join(':');
  const cached = normalProductFits.get(preparation);
  if (cached?.key === key && cached.image === item.watermarkImage) return {...geometry, ...cached.adjustment};
  let adjustment = {};
  try {
    const header = normalHeaderMask(item.watermarkImage, geometry.safeRect);
    const top = geometry.y - geometry.height / 2;
    const travel = landscape ? 0 : Math.max(0, Math.min(canvas.height * .08, top - SMART_WATERMARK_GAP));
    const growth = Math.max(0, Math.min(.08, geometry.safeRect.width / geometry.width - 1, travel / geometry.height));
    const lift = travel - geometry.height * growth;
    const candidate = (amount) => {
      const factor = 1 + growth * amount;
      return {y: geometry.y - (geometry.height * growth / 2 + lift) * amount,
        width: geometry.width * factor, height: geometry.height * factor,
        drawWidth: geometry.drawWidth * factor, drawHeight: geometry.drawHeight * factor};
    };
    const work = document.createElement('canvas'); work.width = header.width; work.height = header.height;
    const context = work.getContext('2d', {willReadFrequently: true});
    const fits = (next) => {
      const bounds = geometry.bounds;
      context.clearRect(0, 0, work.width, work.height); context.save();
      context.scale(header.scale, header.scale);
      context.translate(geometry.x, next.y); context.rotate((item.rotation || 0) * Math.PI / 180);
      context.scale(item.mirror ? -1 : 1, item.flipY ? -1 : 1);
      context.drawImage(preparation.foreground, bounds.x, bounds.y, bounds.width, bounds.height,
        -next.drawWidth / 2, -next.drawHeight / 2, next.drawWidth, next.drawHeight);
      context.restore();
      const pixels = context.getImageData(0, 0, work.width, work.height).data;
      return !header.mask.some((occupied, index) => occupied && pixels[index * 4 + 3] > 0);
    };
    if (fits(candidate(1))) adjustment = candidate(1);
    else if (fits(candidate(0))) {
      let low = 0, high = 1;
      for (let step = 0; step < 10; step += 1) {
        const middle = (low + high) / 2;
        if (fits(candidate(middle))) low = middle; else high = middle;
      }
      adjustment = candidate(low);
    } else {
      // If a wide product already crowds a corner logo, retain a safe full-band fit.
      const safeTop = Math.max(geometry.safeRect.y, header.artworkBottom + header.samplingGap + 1 / header.scale);
      const safeBottom = geometry.y + geometry.height / 2;
      const availableHeight = landscape ? 2 * (geometry.y - safeTop) : safeBottom - safeTop;
      if (availableHeight > 0) {
        const factor = Math.min(1, availableHeight / geometry.height);
        adjustment = {y: landscape ? geometry.y : (safeTop + safeBottom) / 2, width: geometry.width * factor, height: geometry.height * factor,
          drawWidth: geometry.drawWidth * factor, drawHeight: geometry.drawHeight * factor};
      }
    }
  } catch { /* Keep the ordinary safe fit when a custom image cannot be sampled. */ }
  normalProductFits.set(preparation, {key, image: item.watermarkImage, adjustment});
  return {...geometry, ...adjustment};
}
function smartProductGeometry(item) {
  const preparation = item?.smartPrep;
  if (isCloseViewImage(item) || !preparation?.foreground || !preparation?.bounds) return null;
  const bounds = preparation.bounds, safeRect = smartSafeRect(preparation);
  const rotation = item.rotation || 0, radians = rotation * Math.PI / 180;
  const rotatedWidth = Math.abs(bounds.width * Math.cos(radians)) + Math.abs(bounds.height * Math.sin(radians));
  const rotatedHeight = Math.abs(bounds.width * Math.sin(radians)) + Math.abs(bounds.height * Math.cos(radians));
  if (preparation.layout) {
    const layout = preparation.layout, unit = Math.min(canvas.width, canvas.height), scale = (item.scale ?? 100) / 100;
    const drawWidth = layout.width * unit * scale, drawHeight = layout.height * unit * scale;
    return {x: layout.x * canvas.width + (item.offsetX || 0), y: layout.y * canvas.height + (item.offsetY || 0),
      drawWidth, drawHeight, width: Math.abs(drawWidth * Math.cos(radians)) + Math.abs(drawHeight * Math.sin(radians)),
      height: Math.abs(drawWidth * Math.sin(radians)) + Math.abs(drawHeight * Math.cos(radians)), bounds, safeRect};
  }
  if (!safeRect.width || !safeRect.height) return null;
  const fit = Math.min(safeRect.width / Math.max(1, rotatedWidth), safeRect.height / Math.max(1, rotatedHeight));
  const geometry = fitNormalTemplateTop(item, {
    x: safeRect.x + safeRect.width / 2,
    y: safeRect.y + safeRect.height / 2,
    drawWidth: bounds.width * fit,
    drawHeight: bounds.height * fit,
    width: rotatedWidth * fit,
    height: rotatedHeight * fit,
    bounds,
    safeRect
  });
  const scale = (item.scale ?? 100) / 100;
  return {...geometry, x: geometry.x + (item.offsetX || 0), y: geometry.y + (item.offsetY || 0),
    drawWidth: geometry.drawWidth * scale, drawHeight: geometry.drawHeight * scale,
    width: geometry.width * scale, height: geometry.height * scale};
}
function hasLayerComposition(item) { return Boolean(item.baseRemoved || item.layers?.length); }
function preserveCompositionLayout(item) {
  if (!hasLayerComposition(item) || item.smartPrep?.layout) return;
  const geometry = smartProductGeometry(item);
  if (!geometry) return;
  const scale = (item.scale ?? 100) / 100, unit = Math.min(canvas.width, canvas.height);
  // Freeze the fitted product before changing the watermark that determined its fit.
  // Keep manual scale/offset/rotation independent of this initial placement.
  item.smartPrep = {...item.smartPrep, layout: {
    x: (geometry.x - (item.offsetX || 0)) / canvas.width,
    y: (geometry.y - (item.offsetY || 0)) / canvas.height,
    width: geometry.drawWidth / scale / unit, height: geometry.drawHeight / scale / unit
  }};
}
function drawSmartPreparedBase(item) {
  const preparation = item.smartPrep, backgroundSize = imageSourceSize(preparation.background);
  if (!item.removeBg && backgroundSize.width && backgroundSize.height) {
    const backgroundScale = Math.max(canvas.width / backgroundSize.width, canvas.height / backgroundSize.height);
    const backgroundWidth = backgroundSize.width * backgroundScale, backgroundHeight = backgroundSize.height * backgroundScale;
    ctx.drawImage(preparation.background, (canvas.width - backgroundWidth) / 2, (canvas.height - backgroundHeight) / 2, backgroundWidth, backgroundHeight);
  }
  const geometry = smartProductGeometry(item); if (!geometry) return;
  const {bounds} = geometry;
  ctx.save();
  ctx.translate(geometry.x, geometry.y); ctx.rotate((item.rotation || 0) * Math.PI / 180); ctx.scale(item.mirror ? -1 : 1, item.flipY ? -1 : 1);
  if (item.shadow) { const distance = Number(item.shadowDistance ?? 18); const angle = Number(item.shadowAngle ?? 90); ctx.shadowColor = `rgba(36, 25, 20, ${Number(item.shadowStrength ?? 80) / 100})`; ctx.shadowBlur = 26; ctx.shadowOffsetX = Math.cos(angle * Math.PI / 180) * distance; ctx.shadowOffsetY = Math.sin(angle * Math.PI / 180) * distance; }
  const foreground = item.removeBg && preparation.mode !== 'separated'
    ? (item.processed ||= createBackgroundRemovedSource(preparation.foreground)) : preparation.foreground;
  ctx.drawImage(foreground, bounds.x, bounds.y, bounds.width, bounds.height, -geometry.drawWidth / 2, -geometry.drawHeight / 2, geometry.drawWidth, geometry.drawHeight);
  ctx.restore();
}
function getBaseLayerDrawSize(item, image) {
  const selectedScale = (item.scale ?? 100) / 100;
  if (isCloseViewImage(item)) {
    const size = imageSourceSize(image), scale = Math.max(1, selectedScale);
    return {width: size.width * scale, height: size.height * scale};
  }
  if (item.originalSize) return {width: image.width * selectedScale, height: image.height * selectedScale};
  const quarterTurn = Math.abs((item.rotation || 0) % 180) > 0;
  const gap = Number(watermarkGap.value) || 0;
  const maxW = Math.max(1, canvas.width - gap * 2) * selectedScale;
  const maxH = Math.max(1, canvas.height - gap * 2) * selectedScale;
  const fit = (item.fit || fitSelect.value) === 'cover'
    ? Math.max(maxW / (quarterTurn ? image.height : image.width), maxH / (quarterTurn ? image.width : image.height))
    : Math.min(maxW / (quarterTurn ? image.height : image.width), maxH / (quarterTurn ? image.width : image.height));
  return {width: image.width * fit, height: image.height * fit};
}
function drawImage(item) {
  if (item.smartPrep?.enabled && !isCloseViewImage(item)) { drawSmartPreparedBase(item); return; }
  const image = getImageSource(item), {rotation} = item;
  const {width: drawW, height: drawH} = getBaseLayerDrawSize(item, image);
  ctx.save(); ctx.translate(canvas.width / 2 + (item.offsetX || 0), canvas.height / 2 + (item.offsetY || 0)); ctx.rotate(rotation * Math.PI / 180); ctx.scale(item.mirror ? -1 : 1, item.flipY ? -1 : 1); if (item.shadow) { const distance = Number(item.shadowDistance ?? 18); const angle = Number(item.shadowAngle ?? 90); ctx.shadowColor = `rgba(36, 25, 20, ${Number(item.shadowStrength ?? 80) / 100})`; ctx.shadowBlur = 26; ctx.shadowOffsetX = Math.cos(angle * Math.PI / 180) * distance; ctx.shadowOffsetY = Math.sin(angle * Math.PI / 180) * distance; } ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH); ctx.restore();
}
function getBaseLayerRect(item) {
  if (item.smartPrep?.enabled && !isCloseViewImage(item)) {
    const geometry = smartProductGeometry(item);
    return geometry ? {x: geometry.x, y: geometry.y, width: geometry.width, height: geometry.height} : {x: canvas.width / 2, y: canvas.height / 2, width: 0, height: 0};
  }
  const image = getImageSource(item);
  const rotation = item.rotation || 0;
  const {width: drawW, height: drawH} = getBaseLayerDrawSize(item, image);
  const radians = rotation * Math.PI / 180;
  return {
    x: canvas.width / 2 + (item.offsetX || 0),
    y: canvas.height / 2 + (item.offsetY || 0),
    width: Math.abs(drawW * Math.cos(radians)) + Math.abs(drawH * Math.sin(radians)),
    height: Math.abs(drawW * Math.sin(radians)) + Math.abs(drawH * Math.cos(radians))
  };
}
function getAddedLayerDrawRect(layer) {
  const source = layer ? getAddedLayerSource(layer) : null;
  const sourceWidth = source?.naturalWidth || source?.width;
  const sourceHeight = source?.naturalHeight || source?.height;
  if (!sourceWidth || !sourceHeight) return {x: layer?.x || canvas.width / 2, y: layer?.y || canvas.height / 2, width: 0, height: 0};
  if (isCloseViewImage(layer)) {
    const scale = Math.max(1, (layer.scale ?? 100) / 100);
    return {x: layer.x ?? canvas.width / 2, y: layer.y ?? canvas.height / 2, width: sourceWidth * scale, height: sourceHeight * scale};
  }
  // A newly added layer at 100% uses the full canvas fit, just like the original.
  const fitWidth = canvas.width / sourceWidth, fitHeight = canvas.height / sourceHeight;
  const baseScale = layer.fit === 'cover' ? Math.max(fitWidth, fitHeight) : Math.min(fitWidth, fitHeight);
  const scale = baseScale * (layer.sizeMultiplier ?? 1) * (layer.scale ?? 100) / 100;
  return {x: layer.x ?? canvas.width / 2, y: layer.y ?? canvas.height / 2, width: sourceWidth * scale, height: sourceHeight * scale};
}
function getAddedLayerRect(layer) {
  const drawRect = getAddedLayerDrawRect(layer);
  const radians = (layer?.rotation || 0) * Math.PI / 180;
  return {...drawRect, width: Math.abs(drawRect.width * Math.cos(radians)) + Math.abs(drawRect.height * Math.sin(radians)), height: Math.abs(drawRect.width * Math.sin(radians)) + Math.abs(drawRect.height * Math.cos(radians))};
}
function drawAddedLayer(layer) {
  const source = getAddedLayerSource(layer);
  const sourceWidth = source?.naturalWidth || source?.width;
  if (!sourceWidth || (source instanceof HTMLImageElement && !source.complete)) return;
  const rect = getAddedLayerDrawRect(layer);
  ctx.save(); ctx.translate(rect.x, rect.y); ctx.rotate((layer.rotation || 0) * Math.PI / 180); ctx.scale(layer.mirror ? -1 : 1, layer.flipY ? -1 : 1);
  if (layer.shadow) { const distance = Number(layer.shadowDistance ?? 18); const angle = Number(layer.shadowAngle ?? 90); ctx.shadowColor = `rgba(36, 25, 20, ${Number(layer.shadowStrength ?? 80) / 100})`; ctx.shadowBlur = 26; ctx.shadowOffsetX = Math.cos(angle * Math.PI / 180) * distance; ctx.shadowOffsetY = Math.sin(angle * Math.PI / 180) * distance; }
  ctx.drawImage(source, -rect.width / 2, -rect.height / 2, rect.width, rect.height); ctx.restore();
}
function normalizeLayerOrder(item) {
  if (!item) return [];
  const addedIds = (item.layers || []).map((layer) => layer.id);
  const hasBase = !item.baseRemoved;
  if (!Array.isArray(item.layerOrder)) item.layerOrder = [...(hasBase ? ['base'] : []), ...addedIds];
  const validIds = new Set([...(hasBase ? ['base'] : []), ...addedIds]);
  const seen = new Set();
  item.layerOrder = item.layerOrder.filter((id) => {
    if (!validIds.has(id) || seen.has(id)) return false;
    seen.add(id); return true;
  });
  if (hasBase && !seen.has('base')) { item.layerOrder.unshift('base'); seen.add('base'); }
  addedIds.forEach((id) => { if (!seen.has(id)) { item.layerOrder.push(id); seen.add(id); } });
  return item.layerOrder;
}
function allLayerEntityIds(item) { return [...normalizeLayerOrder(item)]; }
function drawLayerStack(item) {
  allLayerEntityIds(item).forEach((id) => {
    if (id === 'base') drawImage(item);
    else {
      const layer = (item.layers || []).find((entry) => entry.id === id);
      if (layer) drawAddedLayer(layer);
    }
  });
}
function getLayerEntity(item, id) { return id === 'base' ? {id: 'base', type: 'base', data: item} : {id, type: 'added', data: (item.layers || []).find((layer) => layer.id === id)}; }
function getLayerEntityRect(item, id) { return id === 'base' ? getBaseLayerRect(item) : getAddedLayerRect((item.layers || []).find((layer) => layer.id === id)); }
function getSelectedLayerEntities(item) {
  return [...selectedLayerIds].map((id) => getLayerEntity(item, id)).filter((entity) => entity.data);
}
function syncSelectedLayerControls() {
  const item = files[activeIndex];
  const selected = item ? getSelectedLayerEntities(item) : [];
  const primary = selected[0];
  const minimumScale = selected.some((entity) => isCloseViewImage(entity.data)) ? 100 : 10;
  imageScale.min = minimumScale; imageScaleValue.min = minimumScale;
  imageScale.max = imageScaleValue.max = selected.length && selected.every(entity => entity.type === 'added') ? 500 : 300;
  if (primary) {
    setImageScaleInputs(primary.data.scale ?? 100);
    fitSelect.value = primary.data.fit || 'contain';
    shadowAngle.value = primary.data.shadowAngle ?? 90;
    angleValue.textContent = shadowAngle.value + '°';
    shadowDistance.value = primary.data.shadowDistance ?? 18;
    distanceValue.textContent = shadowDistance.value + 'px';
    shadowStrength.value = primary.data.shadowStrength ?? 80;
  }
  const shadowEnabled = Boolean(selected.length) && selected.every((entity) => entity.data.shadow);
  const horizontallyFlipped = Boolean(selected.length) && selected.every((entity) => entity.data.mirror);
  const verticallyFlipped = Boolean(selected.length) && selected.every((entity) => entity.data.flipY);
  horizontalFlipButton.classList.toggle('active', horizontallyFlipped);
  horizontalFlipButton.setAttribute('aria-pressed', String(horizontallyFlipped));
  verticalFlipButton.classList.toggle('active', verticallyFlipped);
  verticalFlipButton.setAttribute('aria-pressed', String(verticallyFlipped));
  shadowToggle.classList.toggle('active', shadowEnabled);
  shadowToggle.textContent = shadowEnabled ? 'Shadow on' : 'Add shadow';
  updateRemoveBackgroundControls();
}
function setLayerEntityCenter(item, id, x, y) {
  if (id === 'base') {
    const current = getBaseLayerRect(item);
    item.offsetX = (item.offsetX || 0) + x - current.x;
    item.offsetY = (item.offsetY || 0) + y - current.y;
    return;
  }
  const layer = (item.layers || []).find((entry) => entry.id === id);
  if (layer) { layer.x = x; layer.y = y; }
}
function moveSelectedLayerEntities(dx, dy) {
  const item = files[activeIndex]; if (!item) return;
  if (movementLock.value === 'x' || movementLock.value === 'both') dx = 0;
  if (movementLock.value === 'y' || movementLock.value === 'both') dy = 0;
  getSelectedLayerEntities(item).forEach((entity) => {
    const rect = getLayerEntityRect(item, entity.id);
    setLayerEntityCenter(item, entity.id, rect.x + dx, rect.y + dy);
  });
}
function selectedLayerBounds(item) {
  const rects = [...selectedLayerIds].map((id) => getLayerEntityRect(item, id)).filter((rect) => rect.width && rect.height);
  if (!rects.length) return null;
  const left = Math.min(...rects.map((rect) => rect.x - rect.width / 2));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width / 2));
  const top = Math.min(...rects.map((rect) => rect.y - rect.height / 2));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height / 2));
  return {x: (left + right) / 2, y: (top + bottom) / 2, width: right - left, height: bottom - top};
}
function centerSelectedLayerEntities(axis = 'both') {
  const item = files[activeIndex]; if (!item || !selectedLayerIds.size) return;
  const bounds = selectedLayerBounds(item); if (!bounds) return;
  const dx = axis === 'y' ? 0 : canvas.width / 2 - bounds.x;
  const dy = axis === 'x' ? 0 : canvas.height / 2 - bounds.y;
  getSelectedLayerEntities(item).forEach((entity) => {
    const rect = getLayerEntityRect(item, entity.id);
    setLayerEntityCenter(item, entity.id, rect.x + dx, rect.y + dy);
  });
}
function scaleSelectedLayerEntities(factor) {
  const item = files[activeIndex]; if (!item || !selectedLayerIds.size) return;
  const bounds = selectedLayerBounds(item); if (!bounds) return;
  getSelectedLayerEntities(item).forEach((entity) => {
    if (isCloseViewImage(entity.data)) factor = Math.max(factor, 100 / Math.max(100, entity.data.scale ?? 100));
  });
  getSelectedLayerEntities(item).forEach((entity) => {
    const rect = getLayerEntityRect(item, entity.id);
    setLayerEntityCenter(item, entity.id, bounds.x + (rect.x - bounds.x) * factor, bounds.y + (rect.y - bounds.y) * factor);
    if (entity.type === 'base') {
      item.scale = Math.max(minimumLayerScale(item), Math.min(300, Math.max(minimumLayerScale(item), item.scale ?? 100) * factor));
      setImageScaleInputs(item.scale);
    } else {
      entity.data.scale = Math.max(minimumLayerScale(entity.data), Math.min(500, Math.max(minimumLayerScale(entity.data), entity.data.scale ?? 100) * factor));
    }
  });
}
function duplicateSelectedLayers() {
  const item = files[activeIndex]; if (!item || !selectedLayerIds.size) { setStatus('Select one or more layers first.'); return; }
  const copies = allLayerEntityIds(item).filter((id) => selectedLayerIds.has(id)).map((id) => {
    if (id !== 'base') {
      const source = item.layers.find((layer) => layer.id === id);
      return source ? {...source, id: createLayerId(), name: `${source.name} copy`.slice(0, 60), x: (source.x ?? canvas.width / 2) + 35, y: (source.y ?? canvas.height / 2) + 35} : null;
    }
    const descriptor = layerCopyDescriptor(item, 'base');
    return {...descriptor, id: createLayerId(), name: `${descriptor.name} copy`.slice(0, 60),
      url: item.url, image: item.image, x: descriptor.x + 35, y: descriptor.y + 35};
  }).filter(Boolean);
  if (!copies.length) return;
  item.layers.push(...copies);
  normalizeLayerOrder(item);
  selectedLayerIds = new Set(copies.map((layer) => layer.id));
  renderLayerList(); syncSelectedLayerControls(); drawActive(); setStatus(`${copies.length} layer${copies.length === 1 ? '' : 's'} duplicated.`);
}
function layerCopyDescriptor(item, id) {
  if (id !== 'base') {
    const source = item.layers.find((layer) => layer.id === id);
    return source ? {...source, id: null, url: null, image: null, processed: null} : null;
  }
  const rect = getBaseLayerRect(item);
  const geometry = item.smartPrep?.enabled ? smartProductGeometry(item) : null;
  let sourceSnapshot = null;
  if (geometry) {
    const {bounds} = geometry, image = document.createElement('canvas'); image.width = bounds.width; image.height = bounds.height;
    const foreground = item.removeBg && item.smartPrep.mode !== 'separated'
      ? (item.processed ||= createBackgroundRemovedSource(item.smartPrep.foreground)) : item.smartPrep.foreground;
    image.getContext('2d').drawImage(foreground, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, image.width, image.height);
    const original = document.createElement('canvas'); original.width = image.width; original.height = image.height;
    const sourceSize = imageSourceSize(item.image), analysisSize = imageSourceSize(item.smartPrep.foreground);
    original.getContext('2d').drawImage(item.image, bounds.x * sourceSize.width / analysisSize.width, bounds.y * sourceSize.height / analysisSize.height,
      bounds.width * sourceSize.width / analysisSize.width, bounds.height * sourceSize.height / analysisSize.height, 0, 0, original.width, original.height);
    sourceSnapshot = {image, original, removeBg: item.removeBg || item.smartPrep.mode === 'separated'};
  }
  const descriptor = {id: null, file: item.file, name: item.displayName || item.file.name, url: null, image: item.image, closeView: isCloseViewImage(item), x: rect.x, y: rect.y, scale: Math.max(minimumLayerScale(item), item.scale ?? 100), fit: item.fit || fitSelect.value, rotation: item.rotation || 0, mirror: Boolean(item.mirror), flipY: Boolean(item.flipY), removeBg: sourceSnapshot ? sourceSnapshot.removeBg : Boolean(item.removeBg), processed: item.processed, sourceSnapshot, shadow: Boolean(item.shadow), shadowAngle: item.shadowAngle ?? 90, shadowDistance: item.shadowDistance ?? 18, shadowStrength: item.shadowStrength ?? 80};
  const drawWidth = geometry?.drawWidth ?? getBaseLayerDrawSize(item, getImageSource(item)).width;
  const descriptorRect = getAddedLayerDrawRect(descriptor);
  // Keep the editable percentage; convert the base fit separately without a size cap.
  descriptor.sizeMultiplier = descriptorRect.width ? drawWidth / descriptorRect.width : 1;
  descriptor.image = null;
  return descriptor;
}
function copySelectedLayers() {
  const item = files[activeIndex];
  if (!item || !selectedLayerIds.size) { setStatus('Select one or more layers first.'); return false; }
  layerClipboard = allLayerEntityIds(item)
    .filter((id) => selectedLayerIds.has(id))
    .map((id) => layerCopyDescriptor(item, id))
    .filter(Boolean);
  layerClipboardPasteCount = 0;
  if (!layerClipboard.length) { setStatus('The selected layers could not be copied.'); return false; }
  setStatus(`${layerClipboard.length} layer${layerClipboard.length === 1 ? '' : 's'} copied. Press Ctrl+V to paste.`);
  return true;
}
async function pasteCopiedLayers() {
  const item = files[activeIndex];
  if (!item) { setStatus('Upload an image before pasting layers.'); return false; }
  if (!layerClipboard.length) { setStatus('Copy one or more layers before pasting.'); return false; }
  const assetResults = await Promise.allSettled(layerClipboard.map((entry) => loadDuplicateAsset(entry.file)));
  if (assetResults.some((result) => result.status === 'rejected')) {
    assetResults.forEach((result) => { if (result.status === 'fulfilled') URL.revokeObjectURL(result.value.url); });
    setStatus('The copied layers could not be pasted.');
    return false;
  }
  if (files[activeIndex] !== item || !files.includes(item)) {
    assetResults.forEach((result) => URL.revokeObjectURL(result.value.url));
    setStatus('Paste canceled because the active image changed.');
    return false;
  }
  saveHistory();
  layerClipboardPasteCount += 1;
  const offset = 35 * layerClipboardPasteCount;
  const copies = layerClipboard.map((entry, index) => ({
    ...entry,
    id: createLayerId(),
    name: `${entry.name || 'Layer'} copy`.slice(0, 60),
    url: assetResults[index].value.url,
    image: assetResults[index].value.image,
    processed: null,
    x: (entry.x ?? canvas.width / 2) + offset,
    y: (entry.y ?? canvas.height / 2) + offset
  }));
  item.layers.push(...copies);
  normalizeLayerOrder(item);
  selectedLayerIds = new Set(copies.map((layer) => layer.id));
  renderLayerList(); syncSelectedLayerControls(); drawActive();
  setStatus(`${copies.length} copied layer${copies.length === 1 ? '' : 's'} pasted.`);
  return true;
}
function removeSelectedLayers() {
  const item = files[activeIndex]; if (!item) return false;
  const currentIds = allLayerEntityIds(item);
  const removableIds = new Set(currentIds.filter((id) => selectedLayerIds.has(id)));
  if (!removableIds.size) { setStatus('Select one or more layers first.'); return false; }
  if (currentIds.length - removableIds.size < 1) { setStatus('At least one layer must remain in the image.'); return false; }
  const removedBase = removableIds.has('base');
  saveHistory(); item.layers = item.layers.filter((layer) => !removableIds.has(layer.id));
  if (removedBase) item.baseRemoved = true;
  normalizeLayerOrder(item);
  const remainingIds = allLayerEntityIds(item);
  selectedLayerIds = new Set([remainingIds[remainingIds.length - 1]]);
  renderLayerList(); syncSelectedLayerControls(); drawActive(); setStatus(`${removableIds.size} layer${removableIds.size === 1 ? '' : 's'} removed.`);
  return true;
}
function arrangeSelectedLayers() {
  const item = files[activeIndex]; if (!item || selectedLayerIds.size < 2) { setStatus('Select at least two layers to arrange.'); return; }
  const entities = getSelectedLayerEntities(item);
  const gap = Math.max(18, canvas.width * .025);
  let rects = entities.map((entity) => ({entity, rect: getLayerEntityRect(item, entity.id)}));
  const availableWidth = canvas.width * .9;
  const contentWidth = rects.reduce((sum, entry) => sum + entry.rect.width, 0) + gap * (rects.length - 1);
  if (contentWidth > availableWidth) {
    const factor = availableWidth / contentWidth;
    entities.forEach((entity) => {
      if (entity.type === 'base') item.scale = Math.max(minimumLayerScale(item), (item.scale ?? 100) * factor);
      else entity.data.scale = Math.max(minimumLayerScale(entity.data), (entity.data.scale ?? 100) * factor);
    });
    setImageScaleInputs(item.scale);
    rects = entities.map((entity) => ({entity, rect: getLayerEntityRect(item, entity.id)}));
  }
  const totalWidth = rects.reduce((sum, entry) => sum + entry.rect.width, 0) + gap * (rects.length - 1);
  let cursor = canvas.width / 2 - totalWidth / 2;
  rects.forEach(({entity, rect}) => {
    setLayerEntityCenter(item, entity.id, cursor + rect.width / 2, canvas.height / 2);
    cursor += rect.width + gap;
  });
  drawActive(); renderLayerList(); syncSelectedLayerControls(); setStatus(`${entities.length} layers arranged side by side.`);
}
function drawLayerSelection(item) {
  if (!selectedLayerIds.size) return;
  ctx.save();
  ctx.strokeStyle = '#007aff'; ctx.lineWidth = Math.max(3, canvas.width / 500); ctx.setLineDash([14, 9]);
  [...selectedLayerIds].forEach((id) => {
    const rect = getLayerEntityRect(item, id); if (!rect.width || !rect.height) return;
    ctx.strokeRect(rect.x - rect.width / 2, rect.y - rect.height / 2, rect.width, rect.height);
  });
  ctx.restore();
}
function findLayerAtPoint(item, x, y) {
  const ids = allLayerEntityIds(item);
  for (let index = ids.length - 1; index >= 0; index -= 1) {
    const rect = getLayerEntityRect(item, ids[index]);
    if (x >= rect.x - rect.width / 2 && x <= rect.x + rect.width / 2 && y >= rect.y - rect.height / 2 && y <= rect.y + rect.height / 2) return ids[index];
  }
  return null;
}
function paintWatermark(item) {
  const watermarkImage = item?.watermarkImage;
  if (!item?.watermarkEnabled || !watermarkImage?.naturalWidth) return;
  const scale = Math.max(canvas.width / watermarkImage.naturalWidth, canvas.height / watermarkImage.naturalHeight);
  const width = watermarkImage.naturalWidth * scale, height = watermarkImage.naturalHeight * scale;
  ctx.save();
  ctx.globalAlpha = Number(item.watermarkOpacity ?? 100) / 100;
  ctx.drawImage(watermarkImage, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  ctx.restore();
}
function drawWatermark() { drawActive(); }
function drawActive() {
  checkpointHistory();
  const item = files[activeIndex]; if (!item?.image.complete || !item.image.naturalWidth) return; const scale = Math.min(1, 900 / Math.max(item.image.naturalWidth, item.image.naturalHeight)); canvas.width = Math.max(360, Number(resizeWidth.value) || Math.round(item.image.naturalWidth * scale)); canvas.height = Math.max(360, Number(resizeHeight.value) || Math.round(item.image.naturalHeight * scale)); drawBackground(); drawLayerStack(item); paintWatermark(item); if (!exporting) { scheduleThumbnailUpdate(item); drawLayerSelection(item); }
}
function rotate(degrees) {
  const item = files[activeIndex], selected = item ? getSelectedLayerEntities(item) : [];
  if (!selected.length) { setStatus('Select one or more layers first.'); return; }
  saveHistory(); selected.forEach((entity) => { entity.data.rotation = ((entity.data.rotation || 0) + degrees + 360) % 360; });
  drawActive(); setStatus(`${selected.length > 1 ? 'Selected layers' : 'Layer'} rotated by ${degrees > 0 ? '+' : ''}${degrees}°.`);
}
document.querySelector('#rotate-left').addEventListener('click', () => rotate(-15));
document.querySelector('#rotate-right').addEventListener('click', () => rotate(15));
horizontalFlipButton.addEventListener('click', () => {
  const item = files[activeIndex], selected = item ? getSelectedLayerEntities(item) : []; if (!selected.length) return;
  saveHistory(); const nextValue = !selected.every((entity) => entity.data.mirror); selected.forEach((entity) => { entity.data.mirror = nextValue; }); syncSelectedLayerControls(); drawActive(); setStatus('Horizontal flip updated for selected layers.');
});
verticalFlipButton.addEventListener('click', () => {
  const item = files[activeIndex], selected = item ? getSelectedLayerEntities(item) : []; if (!selected.length) return;
  saveHistory(); const nextValue = !selected.every((entity) => entity.data.flipY); selected.forEach((entity) => { entity.data.flipY = nextValue; }); syncSelectedLayerControls(); drawActive(); setStatus('Vertical flip updated for selected layers.');
});
fitSelect.addEventListener('change', () => {
  const item = files[activeIndex], selected = item ? getSelectedLayerEntities(item) : []; if (!selected.length) return;
  saveHistory(); selected.forEach((entity) => { entity.data.fit = fitSelect.value; }); drawActive(); setStatus(`Fit mode applied to ${selected.length > 1 ? 'selected layers' : 'layer'}.`);
});
imageScale.addEventListener('pointerdown', () => { if (selectedLayerIds.size) saveHistory(); });
function applyImageScale(value) {
  const item = files[activeIndex], selected = item ? getSelectedLayerEntities(item) : []; if (!selected.length) return;
  const minimum = Math.max(...selected.map((entity) => minimumLayerScale(entity.data)));
  const nextScale = setImageScaleInputs(Math.max(minimum, Number(value) || 100)); selected.forEach((entity) => { entity.data.scale = nextScale; }); drawActive();
}
imageScale.addEventListener('input', () => applyImageScale(imageScale.value));
imageScaleValue.addEventListener('focus', () => { if (selectedLayerIds.size) saveHistory(); });
imageScaleValue.addEventListener('input', () => {
  const value = Number(imageScaleValue.value);
  if (Number.isFinite(value) && value >= Number(imageScale.min) && value <= Number(imageScale.max)) applyImageScale(value);
});
imageScaleValue.addEventListener('change', () => applyImageScale(imageScaleValue.value || imageScale.value));
resizeWidth.addEventListener('input', () => { saveHistory(); drawActive(); }); resizeHeight.addEventListener('input', () => { saveHistory(); drawActive(); }); watermarkGap.addEventListener('input', drawActive); shadowStrength.addEventListener('pointerdown', () => saveHistory()); shadowStrength.addEventListener('input', () => { const value = Number(shadowStrength.value); const item = files[activeIndex]; if (item) getSelectedLayerEntities(item).forEach((entity) => { entity.data.shadowStrength = value; }); drawActive(); }); watermarkSize.addEventListener('input', () => { watermarkGap.value = watermarkSize.value; drawActive(); }); opacityInput.addEventListener('input', () => { const value = Number(opacityInput.value); watermarkTargetItems().forEach((item) => { if (item.watermarkImage) item.watermarkOpacity = value; }); drawWatermark(); });
centerImage.addEventListener('click', () => { if (!selectedLayerIds.size) return; saveHistory(); centerSelectedLayerEntities('both'); drawActive(); setStatus('Selected layers centered horizontally and vertically.'); });
centerHorizontal.addEventListener('click', () => { if (!selectedLayerIds.size) return; saveHistory(); centerSelectedLayerEntities('x'); drawActive(); setStatus('Selected layers centered horizontally.'); });
centerVertical.addEventListener('click', () => { if (!selectedLayerIds.size) return; saveHistory(); centerSelectedLayerEntities('y'); drawActive(); setStatus('Selected layers centered vertically.'); });
movementLock.addEventListener('change', () => setStatus(movementLock.options[movementLock.selectedIndex].textContent));
backgroundGroup.querySelectorAll('[data-background]').forEach(button => button.addEventListener('click', () => {
  saveHistory(); backgroundMode = button.dataset.background; backgroundColor.disabled = backgroundMode !== 'color';
  backgroundGroup.querySelectorAll('[data-background]').forEach(option => option.classList.toggle('active', option === button));
  drawActive();
}));
backgroundColor.addEventListener('pointerdown', saveHistory);
backgroundColor.addEventListener('input', () => { backgroundMode = 'color'; backgroundColor.disabled = false; drawActive(); });
let draggedLayerId = null;
function clearLayerDropIndicators(includeDragging = true) {
  layerList.querySelectorAll('.drop-before,.drop-after').forEach((row) => row.classList.remove('drop-before', 'drop-after'));
  if (includeDragging) layerList.querySelectorAll('.dragging').forEach((row) => row.classList.remove('dragging'));
}
function renderLayerList() {
  const item = files[activeIndex];
  layerList.innerHTML = '';
  const entities = item ? allLayerEntityIds(item).slice().reverse().map((id) => {
    if (id === 'base') return {id, name: `Original · ${item.displayName || item.file.name}`, url: item.url};
    const layer = (item.layers || []).find((entry) => entry.id === id);
    return layer ? {id, name: layer.name, url: layer.url} : null;
  }).filter(Boolean) : [];
  layerSelectAllButton.disabled = !entities.length;
  layerClearButton.disabled = !item || !selectedLayerIds.size;
  if (!entities.length) {
    const message = document.createElement('p'); message.className = 'layer-empty'; message.textContent = 'Upload an image to start using layers.'; layerList.append(message); return;
  }
  entities.forEach((entity) => {
    const row = document.createElement('label'); row.className = 'layer-row'; row.dataset.layerId = entity.id; row.draggable = true; row.title = 'Drag to change stacking order'; row.classList.toggle('active', selectedLayerIds.has(entity.id));
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = selectedLayerIds.has(entity.id);
    const preview = document.createElement('img'); preview.src = entity.url; preview.alt = ''; preview.draggable = false;
    const name = document.createElement('span'); name.textContent = entity.name;
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selectedLayerIds.add(entity.id); else selectedLayerIds.delete(entity.id);
      renderLayerList(); syncSelectedLayerControls(); drawActive(); setStatus(`${selectedLayerIds.size} layer${selectedLayerIds.size === 1 ? '' : 's'} selected.`);
    });
    row.addEventListener('dragstart', (event) => {
      draggedLayerId = entity.id;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', entity.id);
      row.classList.add('dragging');
    });
    row.addEventListener('dragover', (event) => {
      if (!draggedLayerId || draggedLayerId === entity.id) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      clearLayerDropIndicators(false);
      const placeAfter = event.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2;
      row.classList.add(placeAfter ? 'drop-after' : 'drop-before');
    });
    row.addEventListener('drop', (event) => {
      event.preventDefault();
      if (!draggedLayerId || draggedLayerId === entity.id) { clearLayerDropIndicators(); return; }
      const displayOrder = allLayerEntityIds(item).slice().reverse();
      const reordered = displayOrder.filter((id) => id !== draggedLayerId);
      const targetIndex = reordered.indexOf(entity.id);
      if (targetIndex < 0) return;
      const placeAfter = event.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2;
      reordered.splice(targetIndex + (placeAfter ? 1 : 0), 0, draggedLayerId);
      saveHistory();
      item.layerOrder = reordered.reverse();
      draggedLayerId = null;
      clearLayerDropIndicators();
      renderLayerList(); drawActive(); setStatus('Layer stacking order updated.');
    });
    row.addEventListener('dragend', () => { draggedLayerId = null; clearLayerDropIndicators(); });
    row.append(checkbox, preview, name); layerList.append(row);
  });
}
function createLayerId() { return globalThis.crypto?.randomUUID?.() || `layer-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
async function addLayerImages(fileList) {
  const item = files[activeIndex]; if (!item) { setStatus('Upload a main image before adding layers.'); return; }
  const accepted = [...fileList].filter((file) => file.type.startsWith('image/'));
  if (!accepted.length) return;
  saveHistory();
  const loadedLayers = await Promise.all(accepted.map((file, index) => new Promise((resolve) => {
    const url = URL.createObjectURL(file), image = new Image();
    image.onload = () => resolve({id: createLayerId(), file, name: file.name, url, image, x: canvas.width / 2 + (index - (accepted.length - 1) / 2) * 45, y: canvas.height / 2 + index * 18, scale: 100, fit: 'contain', rotation: 0, mirror: false, flipY: false, removeBg: false, processed: null, shadow: false, shadowAngle: 90, shadowDistance: 18, shadowStrength: 80});
    image.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    image.src = url;
  })));
  const validLayers = loadedLayers.filter(Boolean);
  if (!files.includes(item)) {
    validLayers.forEach(layer => URL.revokeObjectURL(layer.url));
    return;
  }
  item.layers.push(...validLayers);
  normalizeLayerOrder(item);
  if (files[activeIndex] === item) {
    selectedLayerIds = new Set(validLayers.map((layer) => layer.id));
    renderLayerList(); syncSelectedLayerControls(); drawActive();
  }
  setStatus(`${validLayers.length} image layer${validLayers.length === 1 ? '' : 's'} added.`);
  checkpointHistory();
}
layerAddButton.addEventListener('click', () => {
  if (activeIndex < 0) { setStatus('Upload a main image before adding layers.'); return; }
  layerImageInput.click();
});
layerImageInput.addEventListener('change', async () => {
  await addLayerImages(layerImageInput.files);
  layerImageInput.value = '';
});
layerDropZone.addEventListener('click', () => layerAddButton.click());
layerDropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); layerAddButton.click(); }
});
layerDropZone.addEventListener('dragover', (event) => { event.preventDefault(); event.stopPropagation(); layerDropZone.classList.add('dragging'); });
layerDropZone.addEventListener('dragleave', () => layerDropZone.classList.remove('dragging'));
layerDropZone.addEventListener('drop', async (event) => {
  event.preventDefault(); event.stopPropagation(); layerDropZone.classList.remove('dragging');
  await addLayerImages(event.dataTransfer.files);
});
layerSelectAllButton.addEventListener('click', () => {
  const item = files[activeIndex]; if (!item) return;
  selectedLayerIds = new Set(allLayerEntityIds(item)); renderLayerList(); syncSelectedLayerControls(); drawActive(); setStatus('All layers selected.');
});
function clearLayerSelection() {
  if (!selectedLayerIds.size) return;
  selectedLayerIds.clear(); renderLayerList(); syncSelectedLayerControls(); drawActive(); setStatus('Layer selection cleared.');
}
layerClearButton.addEventListener('click', clearLayerSelection);
layerGroup.querySelector('[data-layer-action="arrange"]').addEventListener('click', () => {
  if (selectedLayerIds.size < 2) { setStatus('Select at least two layers to arrange.'); return; }
  saveHistory(); arrangeSelectedLayers();
});
layerGroup.querySelector('[data-layer-action="smaller"]').addEventListener('click', () => {
  if (!selectedLayerIds.size) { setStatus('Select one or more layers first.'); return; }
  saveHistory(); scaleSelectedLayerEntities(.9); renderLayerList(); syncSelectedLayerControls(); drawActive(); setStatus('Selected layers made smaller.');
});
layerGroup.querySelector('[data-layer-action="larger"]').addEventListener('click', () => {
  if (!selectedLayerIds.size) { setStatus('Select one or more layers first.'); return; }
  saveHistory(); scaleSelectedLayerEntities(1.1); renderLayerList(); syncSelectedLayerControls(); drawActive(); setStatus('Selected layers made larger.');
});
layerGroup.querySelector('[data-layer-action="duplicate"]').addEventListener('click', () => {
  if (!selectedLayerIds.size) { setStatus('Select one or more layers first.'); return; }
  saveHistory(); duplicateSelectedLayers();
});
layerGroup.querySelector('[data-layer-action="remove"]').addEventListener('click', () => {
  removeSelectedLayers();
});
renderLayerList(); updateRemoveBackgroundControls();
let imageDrag = null;
document.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || imageDrag || canvas.contains(event.target)) return;
  // Keep the current selection while operating tools or selecting images/layers.
  if (event.target.closest('button, input, select, textarea, label, a, [role="button"], [contenteditable="true"]')) return;
  clearLayerSelection();
});
canvasWrap.addEventListener('pointerdown', (event) => {
  const item = files[activeIndex]; if (!item || canvas.hidden) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
  const pointX = (event.clientX - rect.left) * scaleX, pointY = (event.clientY - rect.top) * scaleY;
  const hitId = findLayerAtPoint(item, pointX, pointY); if (!hitId) return;
  const additiveSelection = event.ctrlKey || event.metaKey;
  if (additiveSelection) {
    if (selectedLayerIds.has(hitId)) selectedLayerIds.delete(hitId); else selectedLayerIds.add(hitId);
    renderLayerList(); syncSelectedLayerControls(); drawActive(); return;
  }
  if (!selectedLayerIds.has(hitId)) selectedLayerIds = new Set([hitId]);
  renderLayerList(); syncSelectedLayerControls(); drawActive();
  if (movementLock.value === 'both') { setStatus('Layer movement is locked.'); return; }
  saveHistory();
  const positions = getSelectedLayerEntities(item).map((entity) => { const entityRect = getLayerEntityRect(item, entity.id); return {id: entity.id, x: entityRect.x, y: entityRect.y}; });
  imageDrag = {startX: event.clientX, startY: event.clientY, scaleX, scaleY, positions, shiftAxis: null};
  canvasWrap.setPointerCapture(event.pointerId);
});
canvasWrap.addEventListener('pointermove', (event) => {
  const item = files[activeIndex]; if (!imageDrag || !item) return;
  let dx = (event.clientX - imageDrag.startX) * imageDrag.scaleX;
  let dy = (event.clientY - imageDrag.startY) * imageDrag.scaleY;
  if (event.shiftKey) {
    if (!imageDrag.shiftAxis && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) imageDrag.shiftAxis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    if (imageDrag.shiftAxis === 'x') dy = 0;
    if (imageDrag.shiftAxis === 'y') dx = 0;
  } else imageDrag.shiftAxis = null;
  if (movementLock.value === 'x' || movementLock.value === 'both') dx = 0;
  if (movementLock.value === 'y' || movementLock.value === 'both') dy = 0;
  imageDrag.positions.forEach((position) => setLayerEntityCenter(item, position.id, position.x + dx, position.y + dy));
  drawActive();
});
canvasWrap.addEventListener('pointerup', () => { imageDrag = null; });
canvasWrap.addEventListener('pointercancel', () => { imageDrag = null; });
let wheelHistoryActive = false;
let wheelHistoryTimer;
canvasWrap.addEventListener('wheel', (event) => {
  if (activeIndex < 0 || canvas.hidden || !selectedLayerIds.size || event.ctrlKey || event.metaKey) return;
  event.preventDefault();
  if (!wheelHistoryActive) { saveHistory(); wheelHistoryActive = true; }
  clearTimeout(wheelHistoryTimer);
  wheelHistoryTimer = setTimeout(() => { wheelHistoryActive = false; }, 250);
  const resizeGroup = selectedLayerIds.size > 1 || (selectedLayerIds.size === 1 && !selectedLayerIds.has('base'));
  if (resizeGroup) {
    const step = event.shiftKey ? .05 : .01;
    scaleSelectedLayerEntities(event.deltaY < 0 ? 1 + step : 1 - step);
  } else {
    const current = Math.max(minimumLayerScale(files[activeIndex]), files[activeIndex].scale ?? 100);
    const step = event.shiftKey ? 5 : 1;
    files[activeIndex].scale = Math.max(minimumLayerScale(files[activeIndex]), Math.min(300, current + (event.deltaY < 0 ? step : -step)));
    setImageScaleInputs(files[activeIndex].scale);
  }
  syncSelectedLayerControls(); drawActive();
  setStatus(resizeGroup ? 'Selected layers resized together.' : `Image size: ${files[activeIndex].scale}%`);
}, {passive:false});
shadowToggle.addEventListener('click', () => {
  const item = files[activeIndex], selected = item ? getSelectedLayerEntities(item) : []; if (!selected.length) return;
  saveHistory(); const nextValue = !selected.every((entity) => entity.data.shadow); if (nextValue) shadowStrength.value = 80; selected.forEach((entity) => { entity.data.shadow = nextValue; if (nextValue) { entity.data.shadowStrength = 80; entity.data.shadowAngle ??= Number(shadowAngle.value); entity.data.shadowDistance ??= Number(shadowDistance.value); } });
  syncSelectedLayerControls(); drawActive(); setStatus(nextValue ? 'Shadow enabled for selected layers.' : 'Shadow removed from selected layers.');
});
removeBgButton.addEventListener('click', () => {
  toggleSelectedLayerBackgrounds();
});
function toggleSelectedLayerBackgrounds() {
  const item = files[activeIndex], selected = item ? getSelectedLayerEntities(item) : [];
  if (!selected.length) { setStatus('Select one or more layers first.'); return false; }
  const eligible = selected.filter((entity) => !isCloseViewImage(entity.data));
  if (!eligible.length) { setStatus('Close View images keep their original background.'); return false; }
  const nextValue = !eligible.every((entity) => entity.data.removeBg);
  saveHistory();
  eligible.forEach((entity) => { entity.data.removeBg = nextValue; entity.data.processed = null; });
  syncSelectedLayerControls(); drawActive(); setStatus((nextValue ? 'Background removed from selected layers.' : 'Background restored for selected layers.') + (eligible.length < selected.length ? ' Close View images were skipped.' : ''));
  return true;
}
function isLayerShortcutTypingTarget(target) {
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable) return true;
  return target instanceof HTMLInputElement && target.type !== 'checkbox';
}
document.addEventListener('keydown', (event) => {
  if ((event.key !== 'Tab' && event.code !== 'Tab') || event.defaultPrevented || event.isComposing
      || event.ctrlKey || event.metaKey || event.altKey || activeIndex < 0 || !files.length) return;
  // Keep normal field/dialog focus navigation and avoid switching during a drag.
  if (event.target instanceof HTMLInputElement || isLayerShortcutTypingTarget(event.target)
      || !listingPanel.hidden || listingBusy || exporting || imageDrag) return;
  event.preventDefault();
  const nextIndex = Math.max(0, Math.min(files.length - 1, activeIndex + (event.shiftKey ? -1 : 1)));
  if (nextIndex === activeIndex) return;
  selectImage(nextIndex);
  const thumbnail = thumbList.querySelector(`[data-thumb-index="${nextIndex}"] .thumb-select`);
  thumbnail?.focus({preventScroll: true});
  thumbnail?.scrollIntoView({block: 'nearest', inline: 'nearest'});
  setStatus(`Image ${nextIndex + 1} of ${files.length}: ${files[nextIndex].displayName || files[nextIndex].file.name}`);
}, true);
document.addEventListener('keydown', (event) => {
  if (activeIndex < 0 || event.repeat || isLayerShortcutTypingTarget(event.target)) return;
  const listingOverlay = document.querySelector('#listing-panel');
  if (listingOverlay && !listingOverlay.hidden) return;
  const commandKey = event.ctrlKey || event.metaKey;
  const physicalKey = event.code;
  let action = null;
  if (!commandKey && !event.altKey && event.key === 'Delete') action = 'delete';
  else if (commandKey && !event.altKey && physicalKey === 'KeyC') action = 'copy';
  else if (commandKey && !event.altKey && physicalKey === 'KeyV') action = 'paste';
  else if (commandKey && !event.altKey && (physicalKey === 'Enter' || event.key === 'Enter')) action = 'center';
  else if (commandKey && !event.altKey && physicalKey === 'KeyB') action = 'remove-background';
  if (!action) return;
  event.preventDefault();
  event.stopPropagation();
  if (action === 'delete') removeSelectedLayers();
  else if (action === 'copy') copySelectedLayers();
  else if (action === 'paste') pasteCopiedLayers().catch(() => setStatus('The copied layers could not be pasted.'));
  else if (action === 'center') {
    if (!selectedLayerIds.size) { setStatus('Select one or more layers first.'); return; }
    saveHistory(); centerSelectedLayerEntities('both'); drawActive(); setStatus('Selected layers centered horizontally and vertically.');
  } else toggleSelectedLayerBackgrounds();
}, true);
removeAllBgButton.addEventListener('click', () => {
  if (!files.length) return;
  let count = 0, skipped = 0;
  files.forEach((item) => {
    [item, ...(item.layers || [])].forEach((layer) => {
      if (isCloseViewImage(layer)) { skipped += 1; return; }
      layer.removeBg = true; layer.processed = null; count += 1;
    });
  });
  syncSelectedLayerControls(); drawActive(); setStatus(`Background removal enabled for ${count} layer${count === 1 ? '' : 's'}.${skipped ? ' Close View images were skipped.' : ''}`);
});
// Store named watermark template collections in IndexedDB.
const watermarkDB = new Promise((resolve, reject) => {
  const request = indexedDB.open('photo-studio-assets', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('assets');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
watermarkDB.catch(() => {});
async function assetStore(mode, action) {
  const db = await watermarkDB;
  return new Promise((resolve, reject) => {
    const tx = db.transaction('assets', mode), request = action(tx.objectStore('assets'));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
function watermarkSourceUrl(source) {
  return globalThis.DEFAULT_WATERMARK_ASSETS?.[source] || new URL(source, document.baseURI).href;
}
async function loadWatermark(source) {
  let asset = source;
  if (!(asset instanceof Blob)) {
    const assetUrl = watermarkSourceUrl(asset);
    try {
      const response = await fetch(assetUrl);
      if (response.ok) asset = await response.blob();
      else asset = assetUrl;
    } catch { asset = assetUrl; }
  }
  const isBlob = asset instanceof Blob;
  const url = isBlob ? URL.createObjectURL(asset) : asset;
  const image = new Image();
  try {
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
    return image;
  } finally { if (isBlob) URL.revokeObjectURL(url); }
}
const watermarkToggleButton = document.createElement('button');
watermarkToggleButton.type = 'button'; watermarkToggleButton.className = 'watermark-disable-button';
function syncWatermarkControls() {
  const targets = watermarkTargetItems();
  const targetsWithWatermark = targets.filter((item) => item.watermarkImage);
  const enabled = Boolean(targetsWithWatermark.length) && targetsWithWatermark.every((item) => item.watermarkEnabled);
  const scope = targets.length === 1 ? 'selected image' : 'selected images';
  watermarkToggleButton.disabled = !targetsWithWatermark.length;
  watermarkToggleButton.classList.toggle('is-disabled', !enabled);
  setIconControl(watermarkToggleButton, enabled ? 'eyeOff' : 'eye', `${enabled ? 'Disable' : 'Enable'} watermark for ${scope}`);
  const activeItem = files[activeIndex];
  opacityInput.value = activeItem?.watermarkOpacity ?? targetsWithWatermark[0]?.watermarkOpacity ?? 100;
}
function updateWatermarkToggleButton() { syncWatermarkControls(); }
watermarkToggleButton.addEventListener('click', () => {
  const targets = watermarkTargetItems().filter((item) => item.watermarkImage);
  if (!targets.length) return;
  const enabled = !targets.every((item) => item.watermarkEnabled);
  targets.forEach((item) => { item.watermarkEnabled = enabled; });
  updateWatermarkToggleButton(); drawActive();
  const scope = `${targets.length} selected image${targets.length === 1 ? '' : 's'}`;
  setStatus(`Watermark ${enabled ? 'enabled' : 'disabled'} for ${scope}.`);
});
document.querySelector('.watermark-control').append(watermarkToggleButton);
updateWatermarkToggleButton();
watermarkImageInput.multiple = true;
const watermarkUploadLabel = document.querySelector('label[for="watermark-image-input"]');
setIconControl(watermarkUploadLabel, 'plus', 'Add watermark templates');
const WATERMARK_SECTION_NAMES = [
  'US Auto Nation',
  'US Auto Seat Cover',
  'US Auto Seat Factory',
  'DIY',
  'Master',
  'Premium',
  'Elite',
  'DSA eBay'
];
const WATERMARK_SECTION_DISPLAY_ORDER = [0, 3, 1, 4, 2, 5, 7, 6];
const DEFAULT_WATERMARK_LIBRARY = [
  {folder: 'Us Auto Nation', files: ['PS.png', 'PS PI.png', 'PS GLS.png', 'PS GLS PI.png', 'PI.png', 'Normal.png', 'GLS.png', 'GLS PI.png']},
  {folder: 'US Auto Seat Cover', files: ['PS.png', 'PS PI.png', 'PS GLS.png', 'PS GLS PI.png', 'PI.png', 'Normal.png', 'GLS.png', 'GLS PI.png']},
  {folder: 'US Auto Seat Factory', files: ['PS.png', 'PS PI.png', 'PS GLS.png', 'PS GLS PI.png', 'PI.png', 'Normal.png', 'GLS.png', 'GLS PI.png']},
  {folder: 'DIY', files: ['PS.png', 'PS PI.png', 'PS GLS.png', 'PS GLS PI.png', 'PI.png', 'Normal.png', 'GLS.png', 'GLS PI.png']},
  {folder: 'Master', files: ['PS.png', 'PS PI.png', 'PS GLS.png', 'PS GLS PI.png', 'PLS PI.png', 'PI.png', 'Normal.png', 'GLS.png']},
  {folder: 'Premium', files: ['PS.png', 'PS PI.png', 'PS GLS.png', 'PS GLS PI.png', 'PI.png', 'Normal.png', 'GLS.png', 'GLS PI.png']},
  {folder: 'Elite', files: ['PS.png', 'PS PI.png', 'PS GLS.png', 'PS GLS PI.png', 'PI.png', 'Normal.png', 'GLS.png', 'GLS PI.png']},
  {folder: 'DSA eBay', files: ['DSA Seat Factory - eBay.png']}
];
const watermarkSections = WATERMARK_SECTION_NAMES.map((name, sectionIndex) => ({
  name,
  templates: DEFAULT_WATERMARK_LIBRARY[sectionIndex].files.map((file, fileIndex) => ({
    id: `default-${sectionIndex}-${fileIndex}`,
    name: file.replace(/\.[^/.]+$/, ''),
    src: `${DEFAULT_WATERMARK_LIBRARY[sectionIndex].folder}/${file}`,
    opacity: 100,
    builtIn: true
  }))
}));
let activeWatermarkSection = 0;
let activeWatermarkTemplateId = null;
let selectedWatermarkSection = null;
let watermarkPreviewUrls = [];

const LISTING_MATERIAL_RULES = {
  'genuine-leather-solid': {
    label: 'Genuine Leather Solid',
    templates: {main: 'GLS', passenger: 'PS GLS', normal: 'Normal'}
  },
  'genuine-leather-perforated': {
    label: 'Genuine Leather Perforated',
    templates: {main: 'GLS PI', passenger: 'PS GLS PI', normal: 'Normal'}
  },
  perforated: {
    label: 'Perforated',
    templates: {main: 'PI', passenger: 'PS PI', normal: 'Normal'}
  },
  'other-material': {
    label: 'Other Material',
    templates: {main: 'Normal', passenger: 'PS', normal: 'Normal'}
  }
};
const LISTING_CODE_TYPES = Object.fromEntries(Object.entries(PhotoStudioMetadata.primary).map(([code, info]) => [code, info.templateType]));
const LISTING_TYPE_LABELS = {main: 'Main', passenger: 'Main Passenger Side', normal: 'Other / Normal'};
const listingOpenButton = document.querySelector('#open-listing');
const listingPanel = document.querySelector('#listing-panel');
const listingDialog = listingPanel.querySelector('.listing-dialog');
const listingCloseButton = document.querySelector('#close-listing');
const listingAccount = document.querySelector('#listing-account');
const listingMaterial = document.querySelector('#listing-material');
const listingMaterialField = listingMaterial.closest('.listing-field');
const listingQuestions = document.querySelector('.listing-questions');
const listingIntroduction = listingDialog.querySelector('.listing-dialog-header p');
const defaultListingIntroduction = listingIntroduction.textContent;
const listingPlan = document.querySelector('#listing-plan');
const listingPlanSummary = document.querySelector('#listing-plan-summary');
const listingApplyButton = document.querySelector('#listing-apply');
const listingSmartPrep = document.querySelector('#listing-smart-prep');
const listingTemplateManager = document.querySelector('#listing-template-manager');
const listingTemplateManagerSummary = document.querySelector('#listing-template-manager-summary');
const listingTemplateManagerGrid = document.querySelector('#listing-template-manager-grid');
let listingBusy = false;
let cpisListingContext = null;
let listingTemplateManagerRenderId = 0;
const listingWatermarkImageCache = new Map();
const watermarkSafeAreaCache = new Map();

WATERMARK_SECTION_DISPLAY_ORDER.forEach((sectionIndex) => {
  const option = document.createElement('option');
  option.value = String(sectionIndex);
  option.textContent = watermarkSections[sectionIndex].name;
  listingAccount.append(option);
});

function listingSourceName(item) { return item?.displayName || item?.file?.name || 'Untitled image'; }
function detectListingImageType(fileName) {
  return PhotoStudioMetadata.detectFilename(fileName);
}
function normalizeListingTemplateName(name) {
  return String(name || '').replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function listingRequiresMaterial(sectionIndex) { return WATERMARK_SECTION_NAMES[sectionIndex] !== 'DSA eBay'; }
function findListingTemplate(sectionIndex, requestedName, {allowAccountDefault = true} = {}) {
  const section = watermarkSections[sectionIndex];
  if (!section) return {template: null, fallback: false};
  const aliases = requestedName === 'GLS PI' ? ['GLS PI', 'PLS PI'] : [requestedName];
  const normalizedAliases = new Set(aliases.map(normalizeListingTemplateName));
  const matches = section.templates.filter((template) => normalizedAliases.has(normalizeListingTemplateName(template.name)));
  const exact = matches.find((template) => !template.builtIn) || matches[0];
  if (exact) return {template: exact, fallback: exact.name !== requestedName};
  if (allowAccountDefault && section.templates.length === 1) return {template: section.templates[0], fallback: true};
  return {template: null, fallback: false};
}
function listingTemplateKey(sectionIndex, template) { return `${sectionIndex}:${template.id}`; }
function normalizedWatermarkSafeArea(value, image) {
  const canvasWidth = Math.max(1, Math.round(Number(value?.canvasWidth) || image?.naturalWidth || image?.width || 1));
  const canvasHeight = Math.max(1, Math.round(Number(value?.canvasHeight) || image?.naturalHeight || image?.height || 1));
  let topMargin = clampNumber(Math.round(Number(value?.topMargin) || 0), 0, Math.max(0, canvasHeight - 1));
  let bottomMargin = clampNumber(Math.round(Number(value?.bottomMargin) || 0), 0, Math.max(0, canvasHeight - topMargin - 1));
  if (canvasHeight - topMargin - bottomMargin < Math.max(1, Math.round(canvasHeight * .04))) {
    const minimumMiddle = Math.max(1, Math.round(canvasHeight * .04));
    bottomMargin = Math.max(0, canvasHeight - topMargin - minimumMiddle);
  }
  const source = ['custom', 'template', 'analyzed'].includes(value?.source) ? value.source : 'automatic';
  return {canvasWidth, canvasHeight, topMargin, bottomMargin, middleHeight: canvasHeight - topMargin - bottomMargin, source};
}
function defaultWatermarkSafeArea(sectionIndex, template) {
  if (!template.builtIn) return null;
  const defaults = globalThis.DEFAULT_WATERMARK_SAFE_AREAS;
  const account = defaults?.accounts[WATERMARK_SECTION_NAMES[sectionIndex]];
  if (!account) return null;
  const name = template.src.split('/').pop().replace(/\.[^/.]+$/, '').replace(/^PLS PI$/, 'GLS PI');
  return normalizedWatermarkSafeArea({
    canvasWidth: defaults.canvasWidth, canvasHeight: defaults.canvasHeight,
    topMargin: account.templates?.[name] ?? account.top, bottomMargin: account.bottom,
    source: 'template'
  });
}
function analyzeWatermarkSafeArea(image) {
  const nativeWidth = image?.naturalWidth || image?.width || 1, nativeHeight = image?.naturalHeight || image?.height || 1;
  const scale = Math.min(1, 1200 / Math.max(nativeWidth, nativeHeight));
  const width = Math.max(1, Math.round(nativeWidth * scale)), height = Math.max(1, Math.round(nativeHeight * scale));
  const analysisCanvas = document.createElement('canvas'); analysisCanvas.width = width; analysisCanvas.height = height;
  const analysisContext = analysisCanvas.getContext('2d', {willReadFrequently: true});
  analysisContext.drawImage(image, 0, 0, width, height);
  const pixels = analysisContext.getImageData(0, 0, width, height).data;
  const maximumActivePixels = Math.max(2, Math.round(width * .002));
  const clearRows = new Uint8Array(height);
  for (let y = 0; y < height; y += 1) {
    let activePixels = 0;
    for (let x = 0; x < width && activePixels <= maximumActivePixels; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] > 16) activePixels += 1;
    }
    clearRows[y] = activePixels <= maximumActivePixels ? 1 : 0;
  }
  let bestStart = 0, bestEnd = 0, runStart = -1;
  for (let y = 0; y <= height; y += 1) {
    if (y < height && clearRows[y]) { if (runStart < 0) runStart = y; continue; }
    if (runStart >= 0 && y - runStart > bestEnd - bestStart) { bestStart = runStart; bestEnd = y; }
    runStart = -1;
  }
  if (bestEnd - bestStart < height * .04) { bestStart = Math.round(height * .15); bestEnd = Math.round(height * .85); }
  return normalizedWatermarkSafeArea({
    canvasWidth: nativeWidth,
    canvasHeight: nativeHeight,
    topMargin: Math.round(bestStart / height * nativeHeight),
    bottomMargin: Math.round((height - bestEnd) / height * nativeHeight),
    source: 'automatic'
  }, image);
}
async function loadListingTemplateImage(sectionIndex, template) {
  const key = listingTemplateKey(sectionIndex, template);
  if (!listingWatermarkImageCache.has(key)) listingWatermarkImageCache.set(key, loadWatermark(template.blob || template.src));
  try { return await listingWatermarkImageCache.get(key); }
  catch (error) { listingWatermarkImageCache.delete(key); throw error; }
}
function watermarkSafeAreaStorageKey(sectionIndex, templateId) { return `watermark-safe-area-${sectionIndex}-${templateId}`; }
async function saveWatermarkSafeArea(sectionIndex, template, safeArea) {
  return withHistoryAction(() => saveWatermarkSafeAreaInternal(sectionIndex, template, safeArea));
}
async function saveWatermarkSafeAreaInternal(sectionIndex, template, safeArea) {
  const key = listingTemplateKey(sectionIndex, template), normalized = normalizedWatermarkSafeArea(safeArea);
  watermarkSafeAreaCache.set(key, normalized); template.safeArea = normalized;
  try { await assetStore('readwrite', store => store.put(normalized, watermarkSafeAreaStorageKey(sectionIndex, template.id))); } catch {}
  files.forEach((item) => {
    if (item.watermarkSection === sectionIndex && item.watermarkTemplateId === template.id && item.smartPrep) item.smartPrep = {...item.smartPrep, safeArea: {...normalized}};
  });
  drawActive();
  return normalized;
}
async function getWatermarkSafeArea(sectionIndex, template, image, forceAnalysis = false) {
  const key = listingTemplateKey(sectionIndex, template);
  if (!forceAnalysis && watermarkSafeAreaCache.has(key)) return watermarkSafeAreaCache.get(key);
  if (!forceAnalysis) {
    const defaults = defaultWatermarkSafeArea(sectionIndex, template);
    let stored = template.safeArea;
    if (!stored) {
      try { stored = await assetStore('readonly', store => store.get(watermarkSafeAreaStorageKey(sectionIndex, template.id))); } catch {}
    }
    // Replace older automatic measurements with the shared PDF defaults, retaining manual overrides.
    const value = stored && (stored.source === 'custom' || stored.source === 'analyzed' || !defaults) ? stored : defaults;
    if (value) {
      const normalized = normalizedWatermarkSafeArea(value, image);
      watermarkSafeAreaCache.set(key, normalized); template.safeArea = normalized; return normalized;
    }
  }
  const analyzed = analyzeWatermarkSafeArea(image);
  if (forceAnalysis) analyzed.source = 'analyzed';
  if (forceAnalysis) await saveWatermarkSafeArea(sectionIndex, template, analyzed);
  else await saveWatermarkSafeAreaInternal(sectionIndex, template, analyzed);
  return analyzed;
}
function uniqueListingTemplates(plan) {
  const unique = new Map();
  plan.rows.forEach((row) => {
    if (!row.template) return;
    const key = listingTemplateKey(plan.sectionIndex, row.template);
    if (!unique.has(key)) unique.set(key, {template: row.template, types: new Set()});
    unique.get(key).types.add(row.detection.label);
  });
  return [...unique.values()];
}
async function renderListingTemplateManager() {
  if (!listingTemplateManagerGrid) return;
  const renderId = ++listingTemplateManagerRenderId, plan = createListingPlan();
  listingTemplateManagerGrid.innerHTML = '';
  const templateEntries = plan.section && plan.materialRule ? uniqueListingTemplates(plan) : [];
  if (!templateEntries.length) {
    const emptyMessage = document.createElement('p'); emptyMessage.className = 'listing-template-manager-empty';
    const settingsReady = Boolean(plan.section && plan.materialRule);
    emptyMessage.textContent = settingsReady
      ? (files.length ? 'No matching templates are available for this batch.' : 'Upload images to review the templates used by this account.')
      : 'Choose an account and material to manage the templates used by this batch.';
    listingTemplateManagerGrid.append(emptyMessage);
    listingTemplateManagerSummary.textContent = settingsReady ? (files.length ? 'No templates available' : 'Upload images to begin') : 'Choose an account and material';
    return;
  }
  listingTemplateManagerSummary.textContent = `${templateEntries.length} template${templateEntries.length === 1 ? '' : 's'} · safe areas saved`;
  await Promise.all(templateEntries.map(async ({template, types}) => {
    const card = document.createElement('article'); card.className = 'listing-template-safe-card';
    card.innerHTML = `<div class="listing-template-safe-head"><strong></strong><span></span></div><span class="listing-safe-canvas">Analyzing…</span><div class="listing-safe-fields"><label>Top margin<input type="number" min="0" inputmode="numeric"></label><label>Bottom margin<input type="number" min="0" inputmode="numeric"></label></div><div class="listing-safe-foot"><span class="listing-safe-middle">Measuring safe area…</span><button class="listing-safe-analyze" type="button">Analyze</button></div>`;
    card.querySelector('strong').textContent = template.name;
    card.querySelector('.listing-template-safe-head span').textContent = [...types].join(' · ');
    listingTemplateManagerGrid.append(card);
    try {
      const image = await loadListingTemplateImage(plan.sectionIndex, template);
      let safeArea = await getWatermarkSafeArea(plan.sectionIndex, template, image);
      if (renderId !== listingTemplateManagerRenderId || !card.isConnected) return;
      const canvasLabel = card.querySelector('.listing-safe-canvas'), inputs = card.querySelectorAll('input');
      const topInput = inputs[0], bottomInput = inputs[1], middleLabel = card.querySelector('.listing-safe-middle'), analyzeButton = card.querySelector('.listing-safe-analyze');
      const syncCard = () => {
        canvasLabel.textContent = `${safeArea.canvasWidth} × ${safeArea.canvasHeight} canvas`;
        topInput.max = safeArea.canvasHeight - 1; bottomInput.max = safeArea.canvasHeight - 1;
        topInput.value = safeArea.topMargin; bottomInput.value = safeArea.bottomMargin;
        middleLabel.textContent = `${safeArea.middleHeight}px safe · ${safeArea.source}`;
      };
      const saveInputs = async () => {
        safeArea = await saveWatermarkSafeArea(plan.sectionIndex, template, {...safeArea, topMargin: topInput.value, bottomMargin: bottomInput.value, source: 'custom'});
        syncCard(); setStatus(`${template.name} safe area saved.`);
      };
      topInput.addEventListener('change', saveInputs); bottomInput.addEventListener('change', saveInputs);
      const defaults = defaultWatermarkSafeArea(plan.sectionIndex, template);
      if (defaults) {
        const resetButton = document.createElement('button'); resetButton.type = 'button'; resetButton.className = 'listing-safe-analyze'; resetButton.textContent = 'Use default';
        resetButton.addEventListener('click', async () => {
          safeArea = await saveWatermarkSafeArea(plan.sectionIndex, template, defaults);
          syncCard(); setStatus(`${template.name} default spacing restored.`);
        });
        analyzeButton.before(resetButton);
      }
      analyzeButton.addEventListener('click', async () => {
        analyzeButton.disabled = true; analyzeButton.textContent = 'Analyzing…';
        try { safeArea = await getWatermarkSafeArea(plan.sectionIndex, template, image, true); syncCard(); setStatus(`${template.name} safe area analyzed and saved.`); }
        finally { analyzeButton.disabled = false; analyzeButton.textContent = 'Analyze'; }
      });
      syncCard();
    } catch {
      card.querySelector('.listing-safe-canvas').textContent = 'Could not analyze template';
      card.querySelectorAll('input,button').forEach((control) => { control.disabled = true; });
    }
  }));
}
function createListingPlan() {
  const hasAccount = Boolean(cpisListingContext) || listingAccount.value !== '';
  const sectionIndex = cpisListingContext?.sectionIndex ?? (hasAccount ? Number(listingAccount.value) : -1);
  const requiresMaterial = listingRequiresMaterial(sectionIndex);
  const accountTemplate = requiresMaterial ? null : DEFAULT_WATERMARK_LIBRARY[sectionIndex].files[0].replace(/\.[^/.]+$/, '');
  const materialRule = requiresMaterial ? LISTING_MATERIAL_RULES[cpisListingContext?.materialKey || listingMaterial.value] || null
    : {label: 'All materials', templates: {main: accountTemplate, passenger: accountTemplate, normal: accountTemplate}};
  const rowForItem = (item) => {
    let detection, metadataError = null;
    try {
      if (Object.prototype.hasOwnProperty.call(item, 'listingMetadata')) detection = PhotoStudioMetadata.resolveImage(item.listingMetadata, item.generatedFromImageId ? 'generated' : 'metadata');
      else if (cpisListingContext) throw new Error(`CPIS metadata is missing for ${listingSourceName(item)}. Import updated metadata or choose Use filenames.`);
      else detection = detectListingImageType(listingSourceName(item));
    } catch (error) {
      metadataError = error.message; detection = {code: 'METADATA', type: 'normal', label: metadataError, source: 'metadata'};
    }
    const explicitTemplate = item.listingMetadata?.templateName;
    const requestedTemplate = metadataError ? null : explicitTemplate || materialRule?.templates[detection.type] || null;
    const match = hasAccount && requestedTemplate ? findListingTemplate(sectionIndex, requestedTemplate, {allowAccountDefault: !explicitTemplate}) : {template: null, fallback: false};
    const imageReady = Boolean(item.image.complete && item.image.naturalWidth);
    return {item, detection, metadataError, imageReady, requestedTemplate, template: match.template, fallback: match.fallback};
  };
  const rows = files.map(rowForItem);
  const stemOf = (name) => name.replace(/\.[^/.]+$/, '').trim().toLowerCase();
  const usedNames = new Set(rows.map(row => stemOf(listingSourceName(row.item))));
  for (const source of [...rows]) {
    if (source.metadataError || source.item.generatedFromImageId || source.detection.subtype !== 'main'
        || !['DT', 'DB'].includes(source.detection.variation)) continue;
    const sourceName = listingSourceName(source.item), stem = sourceName.replace(/\.[^/.]+$/, '');
    const unmainStem = `${stem} unmain`;
    if (rows.some(row => row.item.generatedFromImageId === source.item.id
        || (!row.item.generatedFromImageId && row.detection.subtype === 'unmain' && row.detection.variation === source.detection.variation
          && stemOf(listingSourceName(row.item)) === unmainStem.toLowerCase()))) continue;
    let uniqueStem = unmainStem, copyNumber = 2;
    while (usedNames.has(uniqueStem.toLowerCase())) uniqueStem = `${unmainStem} (${copyNumber++})`;
    usedNames.add(uniqueStem.toLowerCase());
    const filename = uniqueStem + (sourceName.match(/\.[^/.]+$/)?.[0] || '');
    const item = {...source.item, id: `unmain-${source.item.id}`, displayName: filename,
      generatedFromImageId: source.item.id,
      listingMetadata: PhotoStudioMetadata.normalizeImage({filename, variation: source.detection.variation, subtype: 'unmain'})};
    rows.push({...rowForItem(item), pendingGeneration: true, generatedFrom: source.item});
  }
  const missingCount = rows.filter((row) => hasAccount && materialRule && !row.metadataError && !row.template).length;
  const metadataErrorCount = rows.filter(row => row.metadataError).length;
  return {
    sectionIndex,
    section: hasAccount ? watermarkSections[sectionIndex] : null,
    requiresMaterial,
    materialRule,
    rows,
    missingCount,
    metadataErrorCount,
    ready: Boolean(files.length && hasAccount && materialRule && !missingCount && !metadataErrorCount && rows.every(row => row.imageReady))
  };
}
function listingStatusForRow(plan, row) {
  if (row.metadataError) return {text: 'Metadata required', className: 'missing'};
  if (!row.imageReady) return {text: row.item.image.complete ? 'Image failed' : 'Loading image', className: 'missing'};
  if (!plan.section || !plan.materialRule) return {text: 'Waiting', className: ''};
  if (!row.template) return {text: 'Missing', className: 'missing'};
  if (row.pendingGeneration) return {text: 'New unmain copy', className: ''};
  if (hasLayerComposition(row.item)) return {text: 'Keep layout', className: ''};
  if (row.detection.closeView) return {text: 'Original size', className: ''};
  const preparationMatches = row.item.smartPrep?.templateKey === listingTemplateKey(plan.sectionIndex, row.template);
  if (listingSmartPrep.checked && preparationMatches) {
    return row.item.smartPrep.mode === 'fallback' ? {text: 'Review fit', className: 'fallback'} : {text: 'Smart ready', className: ''};
  }
  if (row.fallback) return {text: 'Account default', className: 'fallback'};
  return {text: 'Ready', className: ''};
}
function renderListingPreview() {
  if (!listingPlan) return;
  syncCPISMetadataControls();
  const plan = createListingPlan();
  listingPlan.innerHTML = '';
  if (!files.length) {
    const emptyMessage = document.createElement('div'); emptyMessage.className = 'listing-plan-empty';
    emptyMessage.textContent = 'Upload one or more product images. Their filenames will appear here automatically.';
    listingPlan.append(emptyMessage);
    listingPlanSummary.textContent = 'Upload images to begin.';
  } else {
    const header = document.createElement('div'); header.className = 'listing-plan-row is-header';
    ['Image', 'Code', 'Watermark', 'Status'].forEach((label) => { const cell = document.createElement('span'); cell.textContent = label; header.append(cell); });
    listingPlan.append(header);
    plan.rows.forEach((row) => {
      const element = document.createElement('div'); element.className = 'listing-plan-row';
      const fileCell = document.createElement('div'); fileCell.className = 'listing-plan-file'; fileCell.textContent = listingSourceName(row.item);
      const category = document.createElement('small'); category.textContent = `${row.detection.source === 'metadata' ? 'CPIS · ' : ''}${row.detection.label}`; fileCell.append(category);
      const codeCell = document.createElement('div'); codeCell.className = 'listing-plan-type';
      const code = document.createElement('span'); code.className = `listing-plan-code ${row.detection.type === 'normal' ? 'normal' : ''}`; code.textContent = row.detection.code; codeCell.append(code);
      const templateCell = document.createElement('div'); templateCell.className = 'listing-plan-template';
      templateCell.textContent = row.template?.name || row.requestedTemplate || 'Choose settings';
      if (row.fallback && row.template && row.requestedTemplate !== row.template.name) templateCell.title = `Requested ${row.requestedTemplate}; using ${row.template.name}`;
      const statusData = listingStatusForRow(plan, row);
      const statusCell = document.createElement('span'); statusCell.className = `listing-plan-status ${statusData.className}`.trim(); statusCell.textContent = statusData.text; if (row.metadataError) statusCell.title = row.metadataError;
      element.append(fileCell, codeCell, templateCell, statusCell); listingPlan.append(element);
    });
    if (!plan.section) listingPlanSummary.textContent = `${files.length} image${files.length === 1 ? '' : 's'} · choose an account`;
    else if (!plan.materialRule) listingPlanSummary.textContent = `${files.length} image${files.length === 1 ? '' : 's'} · choose a material`;
    else if (plan.metadataErrorCount) listingPlanSummary.textContent = `${plan.metadataErrorCount} image${plan.metadataErrorCount === 1 ? '' : 's'} need valid CPIS metadata`;
    else if (plan.rows.some(row => !row.imageReady)) listingPlanSummary.textContent = 'Waiting for images to load';
    else if (plan.missingCount) listingPlanSummary.textContent = `${plan.missingCount} missing template${plan.missingCount === 1 ? '' : 's'} in ${plan.section.name}`;
    else listingPlanSummary.textContent = `${plan.rows.length} image${plan.rows.length === 1 ? '' : 's'} ready · ${plan.section.name}${plan.rows.some(row => row.pendingGeneration) ? ' · includes new unmain copies' : ''}`;
  }
  listingApplyButton.disabled = listingBusy || !plan.ready;
  renderListingTemplateManager();
}
refreshListingPreview = renderListingPreview;

function syncCPISMetadataControls() {
  const sectionIndex = cpisListingContext?.sectionIndex ?? (listingAccount.value === '' ? -1 : Number(listingAccount.value));
  const requiresMaterial = listingRequiresMaterial(sectionIndex);
  listingAccount.disabled = listingBusy || Boolean(cpisListingContext);
  listingMaterial.disabled = !requiresMaterial || listingBusy || Boolean(cpisListingContext);
  listingMaterialField.hidden = !requiresMaterial;
  listingQuestions.classList.toggle('single-question', !requiresMaterial);
  listingIntroduction.textContent = requiresMaterial ? defaultListingIntroduction : 'DSA eBay uses its single template for every material.';
  document.querySelector('#listing-import-metadata').disabled = listingBusy || !files.length;
  document.querySelector('#listing-clear-metadata').hidden = !cpisListingContext;
  const label = document.querySelector('#listing-metadata-status');
  label.textContent = cpisListingContext
    ? `CPIS · ${cpisListingContext.account} · ${cpisListingContext.material}${cpisListingContext.color ? ` · ${cpisListingContext.color}` : ''}`
    : 'Local uploads use filename detection.';
}
function prepareCPISMetadata(payload, items) {
  if (listingBusy) throw new Error('Wait for the current Listing workflow to finish.');
  const normalized = PhotoStudioMetadata.normalizePayload(payload);
  const account = normalized.account.toLowerCase();
  const sectionIndex = watermarkSections.findIndex((section, index) =>
    section.name.toLowerCase() === account || WATERMARK_SECTION_NAMES[index].toLowerCase() === account
    || (account === 'dsa' && WATERMARK_SECTION_NAMES[index] === 'DSA eBay'));
  if (sectionIndex < 0) throw new Error(`CPIS: unknown account "${normalized.account}".`);
  if (!items.length) throw new Error('Upload the product images before importing CPIS metadata.');
  const seen = new Set();
  const bindings = normalized.images.map(metadata => {
    const matches = items.filter(item => metadata.imageId ? item.id === metadata.imageId : item.file.name === metadata.filename);
    if (matches.length !== 1) throw new Error(matches.length ? `CPIS: ${metadata.filename} is ambiguous. Supply its Photo Studio imageId.` : `CPIS: no uploaded image matches ${metadata.filename}.`);
    const item = matches[0];
    if (item.file.name !== metadata.filename) throw new Error(`CPIS: imageId and filename disagree for ${metadata.filename}.`);
    if (seen.has(item)) throw new Error(`CPIS: metadata targets ${metadata.filename} more than once.`);
    if (metadata.templateName && !findListingTemplate(sectionIndex, metadata.templateName, {allowAccountDefault: false}).template) {
      throw new Error(`CPIS: template "${metadata.templateName}" is not available for ${normalized.account}.`);
    }
    seen.add(item); return {item, metadata};
  });
  if (items.some(item => !seen.has(item) && !item.generatedFromImageId)) throw new Error('CPIS: include metadata for every uploaded image in this batch.');
  // CPIS only needs to resend metadata for its uploads; local output copies inherit
  // the resolved variation and keep their explicit unmain role.
  for (const item of items.filter(item => !seen.has(item))) {
    const source = bindings.find(binding => binding.item.id === item.generatedFromImageId);
    const metadata = PhotoStudioMetadata.normalizeImage({filename: item.file.name,
      variation: source?.metadata.variation || item.listingMetadata?.variation, subtype: 'unmain'});
    bindings.push({item, metadata});
  }
  const context = Object.freeze({schemaVersion: 1, account: WATERMARK_SECTION_NAMES[sectionIndex], sectionIndex,
    material: normalized.material, materialKey: normalized.materialKey, color: normalized.color});
  return {context, bindings};
}
function commitCPISContext(context) {
  cpisListingContext = context;
  listingAccount.value = String(context.sectionIndex); listingMaterial.value = context.materialKey;
}
function setCPISMetadata(payload) {
  return withHistoryActionSync(() => setCPISMetadataInternal(payload));
}
function setCPISMetadataInternal(payload) {
  const {context, bindings} = prepareCPISMetadata(payload, files);
  commitCPISContext(context);
  bindings.forEach(({item, metadata}) => { item.listingMetadata = metadata; });
  openListingPanel(); setStatus(`CPIS metadata loaded for ${bindings.length} images.`);
  return getCPISMetadata();
}
async function importCPISImages(payload, imageFiles) {
  return withHistoryAction(() => importCPISImagesInternal(payload, imageFiles));
}
async function importCPISImagesInternal(payload, imageFiles) {
  if (files.length) throw new Error('CPIS: importImages needs an empty editor. Use setMetadata for images already uploaded.');
  const incoming = Array.from(imageFiles || []);
  if (!incoming.length || incoming.some(file => !file?.type?.startsWith('image/') || typeof file.arrayBuffer !== 'function')) {
    throw new Error('CPIS: supply the image File objects separately from the metadata.');
  }
  const candidates = incoming.map((file, index) => ({file, id: `incoming-${index}`}));
  const {context, bindings} = prepareCPISMetadata(payload, candidates);
  commitCPISContext(context);
  const metadataByFile = new Map(bindings.map(({item, metadata}) => [item.file, metadata]));
  const added = addImages(incoming, {metadataByFile});
  openListingPanel();
  try { await Promise.all(added.map(item => item.image.decode())); }
  catch { throw new Error('CPIS: one or more image files could not be decoded. Replace or remove the failed files before processing.'); }
  finally { renderListingPreview(); }
  return getCPISMetadata();
}
function clearCPISMetadata() {
  return withHistoryActionSync(clearCPISMetadataInternal);
}
function clearCPISMetadataInternal() {
  if (listingBusy) throw new Error('Wait for the current Listing workflow to finish.');
  cpisListingContext = null;
  files.forEach(item => { delete item.listingMetadata; });
  renderListingPreview(); setStatus('Filename detection enabled for this batch.');
}
function getCPISMetadata() {
  if (!cpisListingContext) return null;
  const {schemaVersion, account, material, color} = cpisListingContext;
  return {schemaVersion, account, material, color, images: files.map(item => ({...item.listingMetadata, filename: item.file.name, imageId: item.id}))};
}
function getCPISPlan() {
  const plan = createListingPlan();
  return {ready: plan.ready, account: plan.section?.name || null, material: cpisListingContext?.material || (plan.requiresMaterial ? plan.materialRule?.label : null) || null,
    color: cpisListingContext?.color || null,
    images: plan.rows.map(row => ({imageId: row.item.id, id: row.item.listingMetadata?.id || null,
      filename: row.pendingGeneration ? listingSourceName(row.item) : row.item.file.name,
      pendingGeneration: Boolean(row.pendingGeneration), generatedFromImageId: row.item.generatedFromImageId || null,
      variation: row.detection.variation || null, subtype: row.detection.subtype || null, kind: row.detection.kind || null,
      source: row.detection.source, templateName: row.template?.name || null, closeView: Boolean(row.detection.closeView),
      error: row.metadataError || (!row.imageReady ? 'Image is not ready.' : !row.template ? 'Template is not available.' : null)}))};
}
globalThis.PhotoStudioIntegration = Object.freeze({
  schemaVersion: 1, setMetadata: setCPISMetadata, importImages: importCPISImages,
  getMetadata: getCPISMetadata, getPlan: getCPISPlan, clearMetadata: clearCPISMetadata, applyWorkflow: runListingWorkflow
});
document.querySelector('#listing-import-metadata').addEventListener('click', () => document.querySelector('#listing-metadata-input').click());
document.querySelector('#listing-clear-metadata').addEventListener('click', clearCPISMetadata);
document.querySelector('#listing-metadata-input').addEventListener('change', async (event) => {
  const file = event.target.files[0]; if (!file) return;
  try { setCPISMetadata(JSON.parse(await file.text())); }
  catch (error) { setStatus(error.message); document.querySelector('#listing-metadata-status').textContent = error.message; }
  finally { event.target.value = ''; }
});

function openListingPanel() {
  listingPanel.hidden = false;
  listingOpenButton.classList.add('active');
  listingOpenButton.setAttribute('aria-expanded', 'true');
  renderListingPreview();
  window.requestAnimationFrame(() => (!listingAccount.value ? listingAccount : listingMaterial.disabled ? listingSmartPrep : listingMaterial).focus());
}
function closeListingPanel() {
  if (listingBusy) return;
  listingPanel.hidden = true;
  listingOpenButton.classList.remove('active');
  listingOpenButton.setAttribute('aria-expanded', 'false');
  listingOpenButton.focus();
}
function setListingBusy(busy, action = 'Working…') {
  listingBusy = busy;
  listingDialog.classList.toggle('is-busy', busy);
  listingApplyButton.textContent = busy ? action : 'Apply Workflow';
  renderListingPreview();
}
function releaseGeneratedImageAssets(item) {
  [item, ...(item.layers || [])].forEach(layer => URL.revokeObjectURL(layer.url));
}
async function materializeUnmainRow(row) {
  const source = row.generatedFrom;
  const file = new File([source.file], row.item.displayName, {type: source.file.type, lastModified: source.file.lastModified});
  const loaded = [];
  try {
    const baseAsset = await loadDuplicateAsset(file); loaded.push(baseAsset);
    const layers = [], idMap = new Map();
    for (const layer of source.layers || []) {
      const asset = await loadDuplicateAsset(layer.file); loaded.push(asset);
      const id = createLayerId(); idMap.set(layer.id, id);
      layers.push({...layer, ...asset, id, processed: null});
    }
    return {...row.item, ...baseAsset, file, processed: source.processed, smartPrep: source.smartPrep ? {...source.smartPrep} : null, thumbnailDataUrl: null, layers,
      layerOrder: allLayerEntityIds(source).map(id => id === 'base' ? 'base' : idMap.get(id)).filter(Boolean)};
  } catch (error) {
    loaded.forEach(asset => URL.revokeObjectURL(asset.url));
    throw error;
  }
}
async function applyListingWatermarks() {
  return withHistoryAction(applyListingWatermarksInternal);
}
async function applyListingWatermarksInternal() {
  const plan = createListingPlan();
  if (!plan.ready) {
    const missingNames = [...new Set(plan.rows.filter(row => !row.metadataError && !row.template && row.requestedTemplate).map(row => row.requestedTemplate))];
    throw new Error(plan.rows.find(row => row.metadataError)?.metadataError || (plan.missingCount ? `Required watermark templates are missing in ${plan.section.name}: ${missingNames.join(', ')}.` : plan.rows.some(row => !row.imageReady) ? 'Wait for all images to load successfully.' : 'Choose an account and material first.'));
  }
  const activeItem = files[activeIndex];
  const useSmartPreparation = Boolean(listingSmartPrep.checked);
  const templateAssets = new Map();
  await Promise.all(uniqueListingTemplates(plan).map(async ({template}) => {
    const key = listingTemplateKey(plan.sectionIndex, template);
    const image = await loadListingTemplateImage(plan.sectionIndex, template);
    const safeArea = useSmartPreparation ? await getWatermarkSafeArea(plan.sectionIndex, template, image) : null;
    templateAssets.set(key, {image, safeArea});
  }));
  if (useSmartPreparation) {
    const outputWidth = Math.max(360, Number(resizeWidth.value) || canvas.width);
    const outputHeight = Math.max(360, Number(resizeHeight.value) || canvas.height);
    for (const row of plan.rows) {
      if (row.detection.closeView || hasLayerComposition(row.item)) continue;
      const {safeArea} = templateAssets.get(listingTemplateKey(plan.sectionIndex, row.template));
      const safeRect = smartSafeRect({safeArea}, outputWidth, outputHeight);
      if (!safeRect.width || !safeRect.height) throw new Error(`${row.template.name}: the template margins leave no room for a 50px gap. Increase the output size or adjust the template margins.`);
    }
  }
  let fallbackCount = 0, preparedCount = 0, closeViewCount = 0, preservedCount = 0;
  const generatedItems = [];
  try {
    for (const row of plan.rows.filter(row => row.pendingGeneration)) {
      row.item = await materializeUnmainRow(row);
      generatedItems.push(row.item);
    }
    for (let index = 0; index < plan.rows.length; index += 1) {
      const row = plan.rows[index], key = listingTemplateKey(plan.sectionIndex, row.template), asset = templateAssets.get(key);
      const preserveLayout = hasLayerComposition(row.item);
      if (preserveLayout) preserveCompositionLayout(row.item);
      row.item.watermarkImage = asset.image;
      row.item.watermarkEnabled = true;
      row.item.watermarkOpacity = 100;
      row.item.watermarkSection = plan.sectionIndex;
      row.item.watermarkTemplateId = row.template.id;
      if (preserveLayout) {
        preservedCount += 1;
        continue;
      }
      row.item.originalSize = Boolean(row.detection.closeView);
      if (row.detection.closeView) {
        row.item.smartPrep = null; row.item.removeBg = false; row.item.processed = null;
        row.item.rotation = 0; row.item.mirror = false; row.item.flipY = false;
        row.item.offsetX = 0; row.item.offsetY = 0; row.item.scale = 100;
        closeViewCount += 1;
      } else if (useSmartPreparation) {
        listingApplyButton.textContent = `Preparing ${index + 1}/${plan.rows.length}`;
        await new Promise((resolve) => window.requestAnimationFrame(resolve));
        row.item.smartPrep = createSmartPreparation(row.item.image, asset.safeArea, key);
        preparedCount += 1;
        if (row.item.smartPrep.mode === 'fallback') fallbackCount += 1;
        row.item.rotation = 0; row.item.mirror = false; row.item.flipY = false;
        row.item.offsetX = 0; row.item.offsetY = 0; row.item.scale = 100; row.item.fit = 'contain';
        row.item.removeBg = false; row.item.processed = null;
      } else row.item.smartPrep = null;
    }
    files.push(...generatedItems);
  } catch (error) {
    generatedItems.forEach(releaseGeneratedImageAssets);
    throw error;
  }
  if (generatedItems.length) {
    plan.rows.forEach(row => { row.pendingGeneration = false; });
  }
  // Keep relative order within each group and preserve the active image by identity.
  files.sort((a, b) => Number(usesNormalTemplate(a)) - Number(usesNormalTemplate(b)));
  activeIndex = files.indexOf(activeItem);
  plan.rows.sort((a, b) => Number(usesNormalTemplate(a.item)) - Number(usesNormalTemplate(b.item)));
  selectedWatermarkSection = plan.sectionIndex;
  activeWatermarkSection = plan.sectionIndex;
  activeWatermarkTemplateId = plan.rows[0]?.template.id || null;
  opacityInput.value = 100;
  syncSelectedLayerControls(); syncWatermarkControls(); renderWatermarkLibrary(); renderThumbs(); drawActive();
  const preparationMessage = preparedCount
    ? ` Smart preparation completed${fallbackCount ? ` with ${fallbackCount} full-image fallback${fallbackCount === 1 ? '' : 's'}` : ''}.`
    : '';
  const closeViewMessage = closeViewCount ? ` ${closeViewCount} Close View image${closeViewCount === 1 ? '' : 's'} kept at original size with background intact.` : '';
  const generatedMessage = generatedItems.length ? ` Added ${generatedItems.length} Normal-template unmain cop${generatedItems.length === 1 ? 'y' : 'ies'} to the editor.` : '';
  const preservedMessage = preservedCount ? ` Kept the existing layout of ${preservedCount} layered image${preservedCount === 1 ? '' : 's'}.` : '';
  setStatus(`Listing workflow applied to ${plan.rows.length} image${plan.rows.length === 1 ? '' : 's'} for ${plan.section.name}.${preparationMessage}${closeViewMessage}${generatedMessage}${preservedMessage}`);
  return plan;
}
listingOpenButton.setAttribute('aria-controls', 'listing-panel');
listingOpenButton.setAttribute('aria-expanded', 'false');
listingOpenButton.addEventListener('click', openListingPanel);
listingCloseButton.addEventListener('click', closeListingPanel);
listingPanel.addEventListener('pointerdown', (event) => { if (event.target === listingPanel) closeListingPanel(); });
window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !listingPanel.hidden) closeListingPanel(); });
listingAccount.addEventListener('change', renderListingPreview);
listingMaterial.addEventListener('change', renderListingPreview);
listingSmartPrep.addEventListener('change', renderListingPreview);
async function runListingWorkflow() {
  if (listingBusy) throw new Error('The Listing workflow is already running.');
  setListingBusy(true, 'Applying…');
  try {
    await applyListingWatermarks();
    listingPanel.hidden = true; listingOpenButton.classList.remove('active'); listingOpenButton.setAttribute('aria-expanded', 'false');
    return getCPISPlan();
  }
  catch (error) { setStatus(error.message || 'Listing watermarks could not be applied.'); throw error; }
  finally { setListingBusy(false); }
}
listingApplyButton.addEventListener('click', () => { runListingWorkflow().catch(() => {}); });
renderListingPreview();

const watermarkLibrary = document.createElement('section');
watermarkLibrary.className = 'toolbar-group watermark-library';
watermarkLibrary.innerHTML = `
  <span class="toolbar-label">Saved Watermarks</span>
  <div class="watermark-sections" role="tablist" aria-label="Watermark sections"></div>
  <div class="watermark-template-panel">
    <div class="watermark-template-header">
      <strong></strong>
      <button class="watermark-add-template" type="button"></button>
    </div>
    <div class="watermark-template-grid"></div>
  </div>`;
document.querySelector('.editor-toolbar').append(watermarkLibrary);
const watermarkSectionList = watermarkLibrary.querySelector('.watermark-sections');
const watermarkControl = document.querySelector('.watermark-control');
watermarkControl.classList.remove('toolbar-group');
watermarkControl.classList.add('watermark-library-controls');
watermarkControl.querySelector('.toolbar-label')?.remove();
watermarkLibrary.insertBefore(watermarkControl, watermarkSectionList);
const watermarkTemplatePanel = watermarkLibrary.querySelector('.watermark-template-panel');
document.body.append(watermarkTemplatePanel);
const watermarkTemplateHeading = watermarkTemplatePanel.querySelector('strong');
const watermarkTemplateGrid = watermarkTemplatePanel.querySelector('.watermark-template-grid');
const addTemplateButton = watermarkTemplatePanel.querySelector('.watermark-add-template');
setIconControl(addTemplateButton, 'plus', 'Add watermark templates');
let watermarkFlyoutHideTimer = null;

function watermarkSectionButton(index) {
  return watermarkSectionList.querySelector(`[data-watermark-section="${index}"]`);
}
function positionWatermarkTemplateFlyout(anchor) {
  if (!anchor || !watermarkTemplatePanel.classList.contains('is-visible')) return;
  const anchorRect = anchor.getBoundingClientRect();
  const panelWidth = watermarkTemplatePanel.offsetWidth;
  const panelHeight = watermarkTemplatePanel.offsetHeight;
  const gap = 12;
  const leftSpace = anchorRect.left - panelWidth - gap;
  const left = leftSpace >= 12
    ? leftSpace
    : Math.min(window.innerWidth - panelWidth - 12, anchorRect.right + gap);
  const top = Math.min(Math.max(12, anchorRect.top), Math.max(12, window.innerHeight - panelHeight - 12));
  watermarkTemplatePanel.style.left = `${Math.max(12, left)}px`;
  watermarkTemplatePanel.style.top = `${top}px`;
}
function showWatermarkTemplateFlyout(index, anchor) {
  window.clearTimeout(watermarkFlyoutHideTimer);
  if (activeWatermarkSection !== index) {
    activeWatermarkSection = index;
    renderWatermarkLibrary();
    anchor = watermarkSectionButton(index);
  }
  watermarkTemplatePanel.classList.add('is-visible');
  positionWatermarkTemplateFlyout(anchor || watermarkSectionButton(index));
}
function scheduleWatermarkTemplateFlyoutClose() {
  window.clearTimeout(watermarkFlyoutHideTimer);
  watermarkFlyoutHideTimer = window.setTimeout(() => watermarkTemplatePanel.classList.remove('is-visible'), 180);
}
watermarkTemplatePanel.addEventListener('pointerenter', () => window.clearTimeout(watermarkFlyoutHideTimer));
watermarkTemplatePanel.addEventListener('pointerleave', scheduleWatermarkTemplateFlyoutClose);
window.addEventListener('resize', () => {
  if (watermarkTemplatePanel.classList.contains('is-visible')) positionWatermarkTemplateFlyout(watermarkSectionButton(activeWatermarkSection));
});
document.querySelector('.editor-toolbar').addEventListener('scroll', () => {
  if (watermarkTemplatePanel.classList.contains('is-visible')) positionWatermarkTemplateFlyout(watermarkSectionButton(activeWatermarkSection));
}, {passive: true});

function watermarkSectionKey(index) { return `watermark-section-${index}-templates`; }
function createWatermarkId() { return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function fileNameWithoutExtension(file) { return file.name.replace(/\.[^/.]+$/, '').trim().slice(0, 40) || 'Watermark template'; }
function findWatermarkTemplate(sectionIndex, templateId) {
  return watermarkSections[sectionIndex]?.templates.find((template) => template.id === templateId);
}
function usesNormalTemplate(item) {
  const template = findWatermarkTemplate(item.watermarkSection, item.watermarkTemplateId);
  return normalizeListingTemplateName(template?.name) === 'normal';
}
async function saveWatermarkSection(index) {
  const personalTemplates = watermarkSections[index].templates.filter((template) => !template.builtIn && template.blob);
  await assetStore('readwrite', store => store.put(personalTemplates, watermarkSectionKey(index)));
}
function clearWatermarkPreviewUrls() {
  watermarkPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  watermarkPreviewUrls = [];
}
function renderWatermarkLibrary() {
  checkpointHistory();
  refreshListingPreview();
  watermarkSectionList.innerHTML = '';
  WATERMARK_SECTION_DISPLAY_ORDER.forEach((index) => {
    const section = watermarkSections[index];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'watermark-section-button';
    button.dataset.watermarkSection = index;
    button.classList.toggle('active', index === activeWatermarkSection);
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(index === activeWatermarkSection));
    const name = document.createElement('span'); name.textContent = section.name;
    button.append(name);
    button.addEventListener('pointerenter', () => showWatermarkTemplateFlyout(index, button));
    button.addEventListener('pointerleave', scheduleWatermarkTemplateFlyoutClose);
    button.addEventListener('click', () => {
      showWatermarkTemplateFlyout(index, button);
      setStatus(`${section.name} templates displayed.`);
    });
    watermarkSectionList.append(button);
  });

  clearWatermarkPreviewUrls();
  const section = watermarkSections[activeWatermarkSection];
  watermarkTemplateHeading.textContent = section.name;
  watermarkTemplateGrid.innerHTML = '';
  if (!section.templates.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'watermark-template-empty';
    emptyMessage.textContent = 'No templates saved in this section.';
    watermarkTemplateGrid.append(emptyMessage);
    return;
  }
  section.templates.forEach((template) => {
    const card = document.createElement('div');
    card.className = 'watermark-template-card';
    card.classList.toggle('built-in', Boolean(template.builtIn));
    card.classList.toggle('active', activeWatermarkSection === selectedWatermarkSection && template.id === activeWatermarkTemplateId);
    const select = document.createElement('button'); select.type = 'button'; select.className = 'watermark-template-select';
    const preview = document.createElement('span'); preview.className = 'watermark-template-preview';
    const previewUrl = template.blob ? URL.createObjectURL(template.blob) : watermarkSourceUrl(template.src);
    if (template.blob) watermarkPreviewUrls.push(previewUrl);
    preview.style.backgroundImage = `url("${previewUrl}")`;
    const name = document.createElement('span'); name.className = 'watermark-template-name'; name.textContent = template.name;
    select.append(preview, name);
    select.addEventListener('click', async () => {
      try { await selectWatermarkTemplate(activeWatermarkSection, template.id); }
      catch { setStatus('Could not load this watermark template.'); }
    });
    card.append(select);
    if (!template.builtIn) {
      const rename = document.createElement('button'); rename.className = 'watermark-template-rename'; setIconControl(rename, 'pencil', 'Rename watermark');
      rename.addEventListener('click', async () => {
        try { await renameWatermarkTemplate(activeWatermarkSection, template.id); }
        catch { setStatus('Could not rename watermark template.'); }
      });
      const remove = document.createElement('button'); remove.className = 'watermark-template-delete'; setIconControl(remove, 'trash', 'Delete watermark');
      remove.addEventListener('click', async () => {
        try { await deleteWatermarkTemplate(activeWatermarkSection, template.id); }
        catch { setStatus('Could not delete watermark template.'); }
      });
      const actions = document.createElement('div'); actions.className = 'watermark-template-actions'; actions.append(rename, remove);
      card.append(actions);
    }
    watermarkTemplateGrid.append(card);
  });
}
async function selectWatermarkTemplate(sectionIndex, templateId) {
  return withHistoryAction(() => selectWatermarkTemplateInternal(sectionIndex, templateId));
}
async function selectWatermarkTemplateInternal(sectionIndex, templateId) {
  const template = findWatermarkTemplate(sectionIndex, templateId);
  if (!template?.blob && !template?.src) return;
  const targets = watermarkTargetItems();
  if (!targets.length) { setStatus('Select one or more images first.'); return; }
  const image = await loadWatermark(template.blob || template.src);
  const opacity = template.opacity ?? 100;
  activeWatermarkSection = sectionIndex;
  selectedWatermarkSection = sectionIndex;
  activeWatermarkTemplateId = templateId;
  targets.forEach((item) => {
    preserveCompositionLayout(item);
    item.watermarkImage = image;
    item.watermarkEnabled = true;
    item.watermarkOpacity = opacity;
    item.watermarkSection = sectionIndex;
    item.watermarkTemplateId = templateId;
  });
  if (targets.some((item) => item.smartPrep && !hasLayerComposition(item))) {
    const safeArea = await getWatermarkSafeArea(sectionIndex, template, image);
    targets.forEach((item) => {
      if (!item.smartPrep) return;
      if (hasLayerComposition(item)) return;
      item.smartPrep = {...item.smartPrep, safeArea: {...safeArea}, templateKey: listingTemplateKey(sectionIndex, template)};
    });
  }
  opacityInput.value = opacity;
  syncWatermarkControls();
  drawActive();
  renderWatermarkLibrary();
  const scope = `${targets.length} selected image${targets.length === 1 ? '' : 's'}`;
  setStatus(`${template.name} applied to ${scope}.`);
}
async function addWatermarkTemplates(sectionIndex, fileList) {
  return withHistoryAction(() => addWatermarkTemplatesInternal(sectionIndex, fileList));
}
async function addWatermarkTemplatesInternal(sectionIndex, fileList) {
  const imageFiles = [...fileList].filter((file) => file.type.startsWith('image/'));
  if (!imageFiles.length) return;
  const templates = imageFiles.map((file) => ({
    id: createWatermarkId(),
    blob: file,
    name: fileNameWithoutExtension(file),
    opacity: Number(opacityInput.value) || 100,
    builtIn: false
  }));
  watermarkSections[sectionIndex].templates.push(...templates);
  await saveWatermarkSection(sectionIndex);
  await selectWatermarkTemplate(sectionIndex, templates[0].id);
  setStatus(`${templates.length} template${templates.length === 1 ? '' : 's'} saved in ${watermarkSections[sectionIndex].name}.`);
}
async function renameWatermarkTemplate(sectionIndex, templateId) {
  return withHistoryAction(() => renameWatermarkTemplateInternal(sectionIndex, templateId));
}
async function renameWatermarkTemplateInternal(sectionIndex, templateId) {
  const template = findWatermarkTemplate(sectionIndex, templateId); if (!template) return;
  if (template.builtIn) { setStatus('Default watermarks are read-only.'); return; }
  const nextName = window.prompt('Rename saved watermark', template.name);
  if (!nextName?.trim()) return;
  template.name = nextName.trim().slice(0, 40);
  await saveWatermarkSection(sectionIndex);
  renderWatermarkLibrary();
  setStatus(`Renamed to ${template.name}.`);
}
async function deleteWatermarkTemplate(sectionIndex, templateId) {
  return withHistoryAction(() => deleteWatermarkTemplateInternal(sectionIndex, templateId));
}
async function deleteWatermarkTemplateInternal(sectionIndex, templateId) {
  const section = watermarkSections[sectionIndex];
  const templateIndex = section?.templates.findIndex((template) => template.id === templateId) ?? -1;
  if (templateIndex < 0) return;
  if (section.templates[templateIndex].builtIn) { setStatus('Default watermarks cannot be deleted.'); return; }
  const [deleted] = section.templates.splice(templateIndex, 1);
  await saveWatermarkSection(sectionIndex);
  files.forEach((item) => {
    if (item.watermarkSection !== sectionIndex || item.watermarkTemplateId !== templateId) return;
    item.watermarkImage = null;
    item.watermarkEnabled = false;
    item.watermarkOpacity = 100;
    item.watermarkSection = null;
    item.watermarkTemplateId = null;
  });
  if (selectedWatermarkSection === sectionIndex && activeWatermarkTemplateId === templateId) {
    selectedWatermarkSection = null; activeWatermarkTemplateId = null;
  }
  updateWatermarkToggleButton(); drawActive();
  renderWatermarkLibrary();
  setStatus(`${deleted.name} deleted from ${section.name}.`);
}
addTemplateButton.addEventListener('click', () => watermarkImageInput.click());
watermarkImageInput.addEventListener('change', async () => {
  if (!watermarkImageInput.files.length) return;
  try { await addWatermarkTemplates(activeWatermarkSection, watermarkImageInput.files); }
  catch { setStatus('Could not load or save watermark. Browser storage may be unavailable.'); }
  watermarkImageInput.value = '';
});
const watermarkLibraryReady = (async () => {
  try {
    for (let index = 0; index < watermarkSections.length; index += 1) {
      const savedTemplates = await assetStore('readonly', store => store.get(watermarkSectionKey(index)));
      if (Array.isArray(savedTemplates)) {
        const personalTemplates = savedTemplates.filter((template) => template?.blob).map((template) => ({...template, builtIn: false, id: template.id || createWatermarkId(), name: template.name || 'Watermark template'}));
        watermarkSections[index].templates.push(...personalTemplates);
        continue;
      }
      const oldSlot = await assetStore('readonly', store => store.get(`watermark-slot-${index}`));
      if (oldSlot?.blob) {
        watermarkSections[index].templates.push({...oldSlot, builtIn: false, id: createWatermarkId(), name: oldSlot.name || 'Watermark template'});
        await saveWatermarkSection(index);
      }
    }
    const legacy = await assetStore('readonly', store => store.get('watermark'));
    if (!watermarkSections[0].templates.some((template) => !template.builtIn) && legacy?.blob) {
      watermarkSections[0].templates.push({...legacy, builtIn: false, id: createWatermarkId(), name: legacy.name || 'Watermark template'});
      await saveWatermarkSection(0);
    }
  } catch { setStatus('Personal watermark storage is unavailable. Default watermarks are still available.'); }
  const firstSavedSection = watermarkSections.findIndex((section) => section.templates.length);
  activeWatermarkSection = firstSavedSection >= 0 ? firstSavedSection : 0;
  renderWatermarkLibrary();
  syncWatermarkControls();
})();
function canvasToBlob(canvasElement, mime, quality) {
  return new Promise((resolve, reject) => {
    try { canvasElement.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Canvas encoding failed')), mime, quality); }
    catch (error) { reject(error); }
  });
}
async function createExportBlob(item, format) {
  const originalIndex = activeIndex, originalExporting = exporting;
  const exportIndex = files.indexOf(item);
  if (exportIndex < 0) throw new Error('Image is no longer available');
  activeIndex = exportIndex; exporting = true; drawActive();
  const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
  try { return await canvasToBlob(canvas, mime, format === 'jpg' ? .92 : 1); }
  finally { exporting = originalExporting; activeIndex = originalIndex; if (activeIndex >= 0) drawActive(); }
}
function exportFileName(item, format) {
  const sourceName = item.displayName || item.file.name;
  const stem = sourceName.replace(/\.[^/.]+$/, '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').trim() || 'image';
  return `${stem}.${format}`;
}
function triggerDownload(blob, fileName) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob); link.download = fileName;
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
const ZIP_CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let value = n;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[n] = value >>> 0;
  }
  return table;
})();
function zipCrc32(bytes) {
  let crc = 0xffffffff;
  bytes.forEach((byte) => { crc = ZIP_CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8); });
  return (crc ^ 0xffffffff) >>> 0;
}
function zipDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  return {time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2), date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()};
}
async function createZip(entries) {
  const encoder = new TextEncoder(), localParts = [], centralParts = [];
  const stamp = zipDateTime();
  let localOffset = 0, centralSize = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name), data = new Uint8Array(await entry.blob.arrayBuffer());
    const crc = zipCrc32(data), local = new Uint8Array(30 + name.length), localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true); localView.setUint16(4, 20, true); localView.setUint16(6, 0x0800, true); localView.setUint16(8, 0, true); localView.setUint16(10, stamp.time, true); localView.setUint16(12, stamp.date, true); localView.setUint32(14, crc, true); localView.setUint32(18, data.length, true); localView.setUint32(22, data.length, true); localView.setUint16(26, name.length, true); localView.setUint16(28, 0, true); local.set(name, 30);
    localParts.push(local, data);
    const central = new Uint8Array(46 + name.length), centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true); centralView.setUint16(4, 20, true); centralView.setUint16(6, 20, true); centralView.setUint16(8, 0x0800, true); centralView.setUint16(10, 0, true); centralView.setUint16(12, stamp.time, true); centralView.setUint16(14, stamp.date, true); centralView.setUint32(16, crc, true); centralView.setUint32(20, data.length, true); centralView.setUint32(24, data.length, true); centralView.setUint16(28, name.length, true); centralView.setUint16(30, 0, true); centralView.setUint16(32, 0, true); centralView.setUint16(34, 0, true); centralView.setUint16(36, 0, true); centralView.setUint32(38, 0, true); centralView.setUint32(42, localOffset, true); central.set(name, 46);
    if (entry.name.endsWith('/')) centralView.setUint32(38, 0x10, true);
    centralParts.push(central); centralSize += central.length; localOffset += local.length + data.length;
  }
  const end = new Uint8Array(22), endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true); endView.setUint16(4, 0, true); endView.setUint16(6, 0, true); endView.setUint16(8, entries.length, true); endView.setUint16(10, entries.length, true); endView.setUint32(12, centralSize, true); endView.setUint32(16, localOffset, true); endView.setUint16(20, 0, true);
  return new Blob([...localParts, ...centralParts, end], {type: 'application/zip'});
}
function exportBatchFileName(batchItems) {
  const folderNames = [...new Set(batchItems.map((item) =>
    Number.isInteger(item.watermarkSection) ? watermarkSections[item.watermarkSection]?.name : null
  ).filter(Boolean))];
  const name = folderNames.length ? folderNames.join(' + ') : 'photo-studio-batch';
  return `${name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').trim()}.zip`;
}
async function exportBatchArchive(batchItems, format, archiveName = exportBatchFileName(batchItems), progressLabel = 'Exporting') {
  const entries = ['Main/', 'unmain/'].map(name => ({name, blob: new Blob([])})), usedNames = new Set();
  for (let index = 0; index < batchItems.length; index += 1) {
    setStatus(`${progressLabel} ${index + 1} of ${batchItems.length}…`);
    const folder = usesNormalTemplate(batchItems[index]) ? 'unmain' : 'Main';
    const requestedName = exportFileName(batchItems[index], format), stem = requestedName.slice(0, -(format.length + 1));
    let name = `${folder}/${requestedName}`, copyNumber = 2;
    while (usedNames.has(name.toLowerCase())) name = `${folder}/${stem} (${copyNumber++}).${format}`;
    usedNames.add(name.toLowerCase());
    entries.push({name, blob: await createExportBlob(batchItems[index], format)});
  }
  triggerDownload(await createZip(entries), archiveName);
  return batchItems.length;
}
exportOne.addEventListener('click', async () => {
  const item = files[activeIndex]; if (!item) return;
  const format = exportFormat.value; exportOne.disabled = true;
  try { const blob = await createExportBlob(item, format); triggerDownload(blob, exportFileName(item, format)); setStatus(`Current image exported as ${format.toUpperCase()}.`); }
  catch { setStatus('Export failed. Reload the project through its local web server and try again.'); }
  finally { exportOne.disabled = !files.length; }
});
exportAll.addEventListener('click', async () => {
  if (!files.length) return;
  const format = exportFormat.value, batchItems = [...files]; exportAll.disabled = true;
  try {
    await exportBatchArchive(batchItems, format);
    setStatus(`Export Batch complete — ${batchItems.length} ${format.toUpperCase()} files saved in one ZIP.`);
  } catch { setStatus('Batch export failed. Reload the project through its local web server and try again.'); }
  finally { exportAll.disabled = !files.length; }
});
document.querySelector('#reset-editor').addEventListener('click', () => withHistoryActionSync(() => {
  const item = files[activeIndex]; if (!item) return;
  Object.assign(item, {rotation: 0, mirror: false, flipY: false, offsetX: 0, offsetY: 0, scale: 100,
    removeBg: false, processed: null, smartPrep: null, shadow: false, shadowAngle: 90, shadowDistance: 18,
    shadowStrength: 80, fit: 'contain', watermarkImage: null, watermarkEnabled: false, watermarkOpacity: 100,
    watermarkSection: null, watermarkTemplateId: null});
  fitSelect.value = 'contain'; setImageScaleInputs(100); resizeWidth.value = resizeHeight.value = 1576;
  watermarkImageInput.value = ''; watermarkSize.value = watermarkGap.value = 0; opacityInput.value = 100;
  syncSelectedLayerControls(); syncWatermarkControls(); drawActive(); setStatus('Current image reset.');
}));

// Use the available grid cell, not the canvas's intrinsic 1576px dimensions, for preview sizing.
const stage = document.createElement('div');
stage.className = 'canvas-stage';
canvasWrap.before(stage); stage.append(canvasWrap);
new ResizeObserver(entries => {
  const {width, height} = entries[0].contentRect;
  const side = Math.max(1, Math.floor(Math.min(width, height) - 24));
  canvasWrap.style.width = side + 'px'; canvasWrap.style.height = side + 'px';
}).observe(stage);
