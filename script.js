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
imageScale.value = 100;
imageScale.max = 300;
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
const undoStack = [];
const redoStack = [];
function cloneEditorItem(item) { return item ? {...item, layerOrder: [...(item.layerOrder || ['base', ...(item.layers || []).map((layer) => layer.id)])], layers: (item.layers || []).map((layer) => ({...layer}))} : null; }
function snapshot() { return { item: activeIndex >= 0 ? cloneEditorItem(files[activeIndex]) : null, fit: fitSelect.value, imageScale: imageScale.value, width: resizeWidth.value, height: resizeHeight.value, shadowAngle: shadowAngle.value, shadowDistance: shadowDistance.value, shadowStrength: shadowStrength.value, backgroundMode, backgroundColor: backgroundColor.value, movementLock: movementLock.value }; }
function updateHistoryButtons() { undoButton.disabled = !undoStack.length; redoButton.disabled = !redoStack.length; }
function saveHistory() { if (activeIndex < 0) return; undoStack.push(snapshot()); if (undoStack.length > 50) undoStack.shift(); redoStack.length = 0; updateHistoryButtons(); }
function restore(snapshotState) { if (!snapshotState?.item || activeIndex < 0) return; Object.assign(files[activeIndex], snapshotState.item); fitSelect.value = snapshotState.fit; imageScale.value = snapshotState.imageScale; resizeWidth.value = snapshotState.width; resizeHeight.value = snapshotState.height; shadowStrength.value = snapshotState.shadowStrength; shadowAngle.value = snapshotState.shadowAngle ?? 90; angleValue.textContent = shadowAngle.value + '°'; shadowDistance.value = snapshotState.shadowDistance ?? 18; distanceValue.textContent = shadowDistance.value + 'px'; backgroundMode = snapshotState.backgroundMode ?? 'color'; backgroundColor.value = snapshotState.backgroundColor ?? '#ffffff'; backgroundColor.disabled = backgroundMode !== 'color'; movementLock.value = snapshotState.movementLock ?? 'none'; backgroundGroup.querySelectorAll('[data-background]').forEach(button => button.classList.toggle('active', button.dataset.background === backgroundMode)); const validLayerIds = new Set(allLayerEntityIds(files[activeIndex])); selectedLayerIds = new Set([...selectedLayerIds].filter((id) => validLayerIds.has(id))); if (!selectedLayerIds.size && validLayerIds.size) selectedLayerIds.add([...validLayerIds].at(-1)); renderLayerList(); syncSelectedLayerControls(); drawActive(); updateHistoryButtons(); }
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); setStatus('Undo.'); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); setStatus('Redo.'); }
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
window.addEventListener('keydown', (event) => { if (!(event.ctrlKey || event.metaKey)) return; if (event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); } if (event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); } });
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

function addImages(fileList) {
  const accepted = [...fileList].filter((file) => file.type.startsWith('image/'));
  accepted.forEach((file) => {
    const item = { id: createBatchImageId(), file, displayName: file.name, url: URL.createObjectURL(file), image: new Image(), rotation: 0, mirror: false, flipY: false, offsetX: 0, offsetY: 0, scale: 100, fit: fitSelect.value, removeBg: false, processed: null, smartPrep: null, shadow: false, shadowAngle: 90, shadowDistance: 18, shadowStrength: 80, layers: [], layerOrder: ['base'], baseRemoved: false, watermarkImage: null, watermarkEnabled: false, watermarkOpacity: 100, watermarkSection: null, watermarkTemplateId: null };
    item.image.onload = () => { if (activeIndex === -1) selectImage(0); else if (files[activeIndex] === item) drawActive(); };
    item.image.src = item.url; files.push(item);
  });
  if (accepted.length) {
    if (activeIndex === -1) activeIndex = 0;
    renderThumbs(); selectImage(activeIndex); setStatus(`${files.length} image${files.length === 1 ? '' : 's'} ready to edit.`);
    if (!listingAutoPrompted) {
      listingAutoPrompted = true;
      window.setTimeout(() => openListingPanel(), 0);
    }
  }
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

window.addEventListener('keydown', async (event) => {
  if (!event.ctrlKey || !event.altKey || event.key.toLowerCase() !== 'a') return;
  event.preventDefault();
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
});

function renderThumbs() {
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
    undoStack.length = 0; redoStack.length = 0; updateHistoryButtons();
    selectImage(index + 1);
    setStatus(`${duplicate.displayName} added to the batch.`);
  } catch { setStatus('The image could not be duplicated.'); renderThumbs(); }
}
function updateRemoveBackgroundControls() {
  const item = files[activeIndex];
  const selected = item ? getSelectedLayerEntities(item) : [];
  removeBgButton.disabled = !selected.length;
  removeAllBgButton.disabled = !files.length;
  removeBgButton.classList.toggle('active', Boolean(selected.length) && selected.every((entity) => entity.data.removeBg));
  removeAllBgButton.classList.toggle('active', Boolean(files.length) && files.every((entry) => entry.removeBg && (entry.layers || []).every((layer) => layer.removeBg)));
}
function removeBatchImage(index) {
  const item = files[index]; if (!item) return;
  const wasActive = index === activeIndex;
  selectedBatchImageIds.delete(item.id);
  files.splice(index, 1);
  new Set([item.url, ...(item.layers || []).map((layer) => layer.url)]).forEach((url) => URL.revokeObjectURL(url));
  undoStack.length = 0; redoStack.length = 0; updateHistoryButtons();
  if (!files.length) {
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
  const work = document.createElement('canvas'); work.width = sourceWidth; work.height = sourceHeight; const workCtx = work.getContext('2d'); workCtx.drawImage(source, 0, 0); const pixels = workCtx.getImageData(0, 0, work.width, work.height); const sample = [pixels.data[0], pixels.data[1], pixels.data[2]];
  for (let i = 0; i < pixels.data.length; i += 4) { const distance = Math.abs(pixels.data[i] - sample[0]) + Math.abs(pixels.data[i + 1] - sample[1]) + Math.abs(pixels.data[i + 2] - sample[2]); if (distance < 95) pixels.data[i + 3] = 0; else if (distance < 150) pixels.data[i + 3] = Math.round(((distance - 95) / 55) * pixels.data[i + 3]); }
  workCtx.putImageData(pixels, 0, 0); return work;
}
function getImageSource(item) {
  if (!item.removeBg) return item.image;
  if (!item.processed) item.processed = createBackgroundRemovedSource(item.image);
  return item.processed;
}
function getAddedLayerSource(layer) {
  if (!layer.removeBg) return layer.image;
  if (!layer.processed) layer.processed = createBackgroundRemovedSource(layer.image);
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
function createSmartPreparation(source, safeArea, templateKey = '') {
  const sourceSize = imageSourceSize(source);
  if (!sourceSize.width || !sourceSize.height) throw new Error('The product image is not ready.');
  const analysisScale = Math.min(1, 1600 / Math.max(sourceSize.width, sourceSize.height));
  const width = Math.max(1, Math.round(sourceSize.width * analysisScale));
  const height = Math.max(1, Math.round(sourceSize.height * analysisScale));
  const work = document.createElement('canvas'); work.width = width; work.height = height;
  const workContext = work.getContext('2d', {willReadFrequently: true});
  workContext.drawImage(source, 0, 0, width, height);
  const original = workContext.getImageData(0, 0, width, height);
  const sampleSize = Math.max(2, Math.round(Math.min(width, height) * .035));
  const corners = [
    cornerAverage(original.data, width, height, 0, 0, sampleSize, sampleSize),
    cornerAverage(original.data, width, height, width - sampleSize, 0, sampleSize, sampleSize),
    cornerAverage(original.data, width, height, 0, height - sampleSize, sampleSize, sampleSize),
    cornerAverage(original.data, width, height, width - sampleSize, height - sampleSize, sampleSize, sampleSize)
  ];
  const colorDifference = (offset, expected) => Math.abs(original.data[offset] - expected[0]) + Math.abs(original.data[offset + 1] - expected[1]) + Math.abs(original.data[offset + 2] - expected[2]);
  const borderDifferences = [];
  const borderStep = Math.max(1, Math.round(Math.min(width, height) / 220));
  const collectBorderDifference = (x, y) => {
    const expected = interpolatedBackgroundColor(corners, width > 1 ? x / (width - 1) : 0, height > 1 ? y / (height - 1) : 0);
    borderDifferences.push(colorDifference((y * width + x) * 4, expected));
  };
  for (let x = 0; x < width; x += borderStep) { collectBorderDifference(x, 0); collectBorderDifference(x, height - 1); }
  for (let y = 0; y < height; y += borderStep) { collectBorderDifference(0, y); collectBorderDifference(width - 1, y); }
  borderDifferences.sort((a, b) => a - b);
  const borderPercentile = borderDifferences[Math.floor(borderDifferences.length * .78)] || 0;
  const threshold = clampNumber(borderPercentile + 30, 58, 135);
  const candidate = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    const yRatio = height > 1 ? y / (height - 1) : 0;
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x, offset = pixelIndex * 4;
      if (original.data[offset + 3] < 12) { candidate[pixelIndex] = 1; continue; }
      const expected = interpolatedBackgroundColor(corners, width > 1 ? x / (width - 1) : 0, yRatio);
      if (colorDifference(offset, expected) <= threshold) candidate[pixelIndex] = 1;
    }
  }
  const backgroundMask = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let queueStart = 0, queueEnd = 0;
  const enqueue = (index) => {
    if (index < 0 || index >= candidate.length || backgroundMask[index] || !candidate[index]) return;
    backgroundMask[index] = 1; queue[queueEnd] = index; queueEnd += 1;
  };
  for (let x = 0; x < width; x += 1) { enqueue(x); enqueue((height - 1) * width + x); }
  for (let y = 1; y < height - 1; y += 1) { enqueue(y * width); enqueue(y * width + width - 1); }
  while (queueStart < queueEnd) {
    const index = queue[queueStart]; queueStart += 1;
    const x = index % width;
    if (x > 0) enqueue(index - 1);
    if (x + 1 < width) enqueue(index + 1);
    if (index >= width) enqueue(index - width);
    if (index + width < candidate.length) enqueue(index + width);
  }
  let left = width, top = height, right = -1, bottom = -1, foregroundCount = 0, opaqueCount = 0;
  for (let index = 0; index < backgroundMask.length; index += 1) {
    const alpha = original.data[index * 4 + 3];
    if (alpha >= 12) opaqueCount += 1;
    if (backgroundMask[index] || alpha < 12) continue;
    foregroundCount += 1;
    const x = index % width, y = Math.floor(index / width);
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  const coverage = foregroundCount / Math.max(1, opaqueCount);
  const reliable = foregroundCount > 0 && coverage >= .01 && coverage <= .94 && right >= left && bottom >= top;
  const foreground = document.createElement('canvas'); foreground.width = width; foreground.height = height;
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
        foregroundPixels.data[offset] = original.data[offset]; foregroundPixels.data[offset + 1] = original.data[offset + 1]; foregroundPixels.data[offset + 2] = original.data[offset + 2]; foregroundPixels.data[offset + 3] = original.data[offset + 3];
      }
      const preserveOriginal = reliable && !isForeground;
      reconstructedPixels.data[offset] = preserveOriginal ? original.data[offset] : Math.round(expected[0]);
      reconstructedPixels.data[offset + 1] = preserveOriginal ? original.data[offset + 1] : Math.round(expected[1]);
      reconstructedPixels.data[offset + 2] = preserveOriginal ? original.data[offset + 2] : Math.round(expected[2]);
      reconstructedPixels.data[offset + 3] = preserveOriginal ? original.data[offset + 3] : Math.round(Math.max(expected[3], 255));
    }
  }
  if (reliable) {
    for (let y = Math.max(1, top); y <= Math.min(height - 2, bottom); y += 1) {
      for (let x = Math.max(1, left); x <= Math.min(width - 2, right); x += 1) {
        const index = y * width + x;
        if (backgroundMask[index]) continue;
        const touchesBackground = backgroundMask[index - 1] || backgroundMask[index + 1] || backgroundMask[index - width] || backgroundMask[index + width];
        if (touchesBackground) foregroundPixels.data[index * 4 + 3] = Math.min(foregroundPixels.data[index * 4 + 3], 205);
      }
    }
  } else { left = 0; top = 0; right = width - 1; bottom = height - 1; }
  foregroundContext.putImageData(foregroundPixels, 0, 0);
  reconstructedContext.putImageData(reconstructedPixels, 0, 0);
  return {
    enabled: true,
    foreground,
    background: reconstructed,
    bounds: {x: left, y: top, width: Math.max(1, right - left + 1), height: Math.max(1, bottom - top + 1)},
    safeArea: {...safeArea},
    templateKey,
    coverage,
    mode: reliable ? 'separated' : 'fallback',
    analysisSize: {width, height}
  };
}
function smartSafeRect(preparation) {
  const safeArea = preparation?.safeArea || {};
  const nativeHeight = Math.max(1, Number(safeArea.canvasHeight) || canvas.height);
  const topMargin = clampNumber(Number(safeArea.topMargin) || 0, 0, nativeHeight);
  const bottomMargin = clampNumber(Number(safeArea.bottomMargin) || 0, 0, nativeHeight - topMargin);
  let top = topMargin / nativeHeight * canvas.height;
  let bottom = canvas.height - bottomMargin / nativeHeight * canvas.height;
  if (bottom - top < canvas.height * .08) { top = 0; bottom = canvas.height; }
  let padding = Math.max(10, Math.round(Math.min(canvas.width, canvas.height) * .018));
  padding = Math.min(padding, Math.max(0, (bottom - top) / 4));
  return {x: padding, y: top + padding, width: Math.max(1, canvas.width - padding * 2), height: Math.max(1, bottom - top - padding * 2)};
}
function smartProductGeometry(item) {
  const preparation = item?.smartPrep;
  if (!preparation?.foreground || !preparation?.bounds) return null;
  const bounds = preparation.bounds, safeRect = smartSafeRect(preparation);
  const rotation = item.rotation || 0, radians = rotation * Math.PI / 180;
  const rotatedWidth = Math.abs(bounds.width * Math.cos(radians)) + Math.abs(bounds.height * Math.sin(radians));
  const rotatedHeight = Math.abs(bounds.width * Math.sin(radians)) + Math.abs(bounds.height * Math.cos(radians));
  const fit = Math.min(safeRect.width / Math.max(1, rotatedWidth), safeRect.height / Math.max(1, rotatedHeight)) * (item.scale ?? 100) / 100;
  return {
    x: safeRect.x + safeRect.width / 2 + (item.offsetX || 0),
    y: safeRect.y + safeRect.height / 2 + (item.offsetY || 0),
    drawWidth: bounds.width * fit,
    drawHeight: bounds.height * fit,
    width: rotatedWidth * fit,
    height: rotatedHeight * fit,
    bounds,
    safeRect
  };
}
function drawSmartPreparedBase(item) {
  const preparation = item.smartPrep, backgroundSize = imageSourceSize(preparation.background);
  if (backgroundSize.width && backgroundSize.height) {
    const backgroundScale = Math.max(canvas.width / backgroundSize.width, canvas.height / backgroundSize.height);
    const backgroundWidth = backgroundSize.width * backgroundScale, backgroundHeight = backgroundSize.height * backgroundScale;
    ctx.drawImage(preparation.background, (canvas.width - backgroundWidth) / 2, (canvas.height - backgroundHeight) / 2, backgroundWidth, backgroundHeight);
  }
  const geometry = smartProductGeometry(item); if (!geometry) return;
  const {bounds} = geometry;
  ctx.save();
  ctx.translate(geometry.x, geometry.y); ctx.rotate((item.rotation || 0) * Math.PI / 180); ctx.scale(item.mirror ? -1 : 1, item.flipY ? -1 : 1);
  if (item.shadow) { const distance = Number(item.shadowDistance ?? 18); const angle = Number(item.shadowAngle ?? 90); ctx.shadowColor = `rgba(36, 25, 20, ${Number(item.shadowStrength ?? 80) / 100})`; ctx.shadowBlur = 26; ctx.shadowOffsetX = Math.cos(angle * Math.PI / 180) * distance; ctx.shadowOffsetY = Math.sin(angle * Math.PI / 180) * distance; }
  ctx.drawImage(preparation.foreground, bounds.x, bounds.y, bounds.width, bounds.height, -geometry.drawWidth / 2, -geometry.drawHeight / 2, geometry.drawWidth, geometry.drawHeight);
  ctx.restore();
}
function drawImage(item) {
  if (item.smartPrep?.enabled) { drawSmartPreparedBase(item); return; }
  const image = getImageSource(item); const { rotation } = item; const quarterTurn = Math.abs(rotation % 180) > 0; const gap = Number(watermarkGap.value) || 0; const selectedScale = item.scale ?? 100; const maxW = Math.max(1, canvas.width - gap * 2) * selectedScale / 100; const maxH = Math.max(1, canvas.height - gap * 2) * selectedScale / 100; const fit = (item.fit || fitSelect.value) === 'cover' ? Math.max(maxW / (quarterTurn ? image.height : image.width), maxH / (quarterTurn ? image.width : image.height)) : Math.min(maxW / (quarterTurn ? image.height : image.width), maxH / (quarterTurn ? image.width : image.height)); const drawW = image.width * fit; const drawH = image.height * fit;
  ctx.save(); ctx.translate(canvas.width / 2 + (item.offsetX || 0), canvas.height / 2 + (item.offsetY || 0)); ctx.rotate(rotation * Math.PI / 180); ctx.scale(item.mirror ? -1 : 1, item.flipY ? -1 : 1); if (item.shadow) { const distance = Number(item.shadowDistance ?? 18); const angle = Number(item.shadowAngle ?? 90); ctx.shadowColor = `rgba(36, 25, 20, ${Number(item.shadowStrength ?? 80) / 100})`; ctx.shadowBlur = 26; ctx.shadowOffsetX = Math.cos(angle * Math.PI / 180) * distance; ctx.shadowOffsetY = Math.sin(angle * Math.PI / 180) * distance; } ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH); ctx.restore();
}
function getBaseLayerRect(item) {
  if (item.smartPrep?.enabled) {
    const geometry = smartProductGeometry(item);
    return geometry ? {x: geometry.x, y: geometry.y, width: geometry.width, height: geometry.height} : {x: canvas.width / 2, y: canvas.height / 2, width: 0, height: 0};
  }
  const image = getImageSource(item);
  const rotation = item.rotation || 0;
  const rotatedDimensions = Math.abs(rotation % 180) > 0;
  const gap = Number(watermarkGap.value) || 0;
  const selectedScale = item.scale ?? 100;
  const maxW = Math.max(1, canvas.width - gap * 2) * selectedScale / 100;
  const maxH = Math.max(1, canvas.height - gap * 2) * selectedScale / 100;
  const fit = (item.fit || fitSelect.value) === 'cover'
    ? Math.max(maxW / (rotatedDimensions ? image.height : image.width), maxH / (rotatedDimensions ? image.width : image.height))
    : Math.min(maxW / (rotatedDimensions ? image.height : image.width), maxH / (rotatedDimensions ? image.width : image.height));
  const drawW = image.width * fit, drawH = image.height * fit;
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
  const fitWidth = (canvas.width * .32) / sourceWidth, fitHeight = (canvas.height * .32) / sourceHeight;
  const baseScale = layer.fit === 'cover' ? Math.max(fitWidth, fitHeight) : Math.min(fitWidth, fitHeight);
  const scale = baseScale * (layer.scale ?? 100) / 100;
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
  if (primary) {
    imageScale.value = Math.round(primary.data.scale ?? 100);
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
  if (id === 'base') { item.offsetX = x - canvas.width / 2; item.offsetY = y - canvas.height / 2; return; }
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
    const rect = getLayerEntityRect(item, entity.id);
    setLayerEntityCenter(item, entity.id, bounds.x + (rect.x - bounds.x) * factor, bounds.y + (rect.y - bounds.y) * factor);
    if (entity.type === 'base') {
      item.scale = Math.max(10, Math.min(300, (item.scale ?? 100) * factor));
      imageScale.value = item.scale;
    } else {
      entity.data.scale = Math.max(10, Math.min(500, (entity.data.scale ?? 100) * factor));
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
    const rect = getBaseLayerRect(item);
    const copy = {id: createLayerId(), file: item.file, name: `${item.displayName || item.file.name} copy`.slice(0, 60), url: item.url, image: item.image, x: rect.x + 35, y: rect.y + 35, scale: 100, fit: item.fit || fitSelect.value, rotation: item.rotation || 0, mirror: Boolean(item.mirror), flipY: Boolean(item.flipY), removeBg: Boolean(item.removeBg), processed: null, shadow: Boolean(item.shadow), shadowAngle: item.shadowAngle ?? 90, shadowDistance: item.shadowDistance ?? 18, shadowStrength: item.shadowStrength ?? 80};
    const copyRect = getAddedLayerRect(copy);
    const matchingFactor = copyRect.width && copyRect.height ? Math.min(rect.width / copyRect.width, rect.height / copyRect.height) : 1;
    copy.scale = Math.max(10, Math.min(500, matchingFactor * 100));
    return copy;
  }).filter(Boolean);
  if (!copies.length) return;
  item.layers.push(...copies);
  normalizeLayerOrder(item);
  selectedLayerIds = new Set(copies.map((layer) => layer.id));
  renderLayerList(); syncSelectedLayerControls(); drawActive(); setStatus(`${copies.length} layer${copies.length === 1 ? '' : 's'} duplicated.`);
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
      if (entity.type === 'base') item.scale = Math.max(10, (item.scale ?? 100) * factor);
      else entity.data.scale = Math.max(10, (entity.data.scale ?? 100) * factor);
    });
    imageScale.value = item.scale;
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
imageScale.addEventListener('input', () => {
  const item = files[activeIndex], selected = item ? getSelectedLayerEntities(item) : []; if (!selected.length) return;
  const nextScale = Number(imageScale.value); selected.forEach((entity) => { entity.data.scale = nextScale; }); drawActive();
});
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
  item.layers.push(...validLayers);
  normalizeLayerOrder(item);
  if (files[activeIndex] === item) {
    selectedLayerIds = new Set(validLayers.map((layer) => layer.id));
    renderLayerList(); syncSelectedLayerControls(); drawActive();
  }
  setStatus(`${validLayers.length} image layer${validLayers.length === 1 ? '' : 's'} added.`);
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
layerClearButton.addEventListener('click', () => { selectedLayerIds.clear(); renderLayerList(); syncSelectedLayerControls(); drawActive(); setStatus('Layer selection cleared.'); });
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
  const item = files[activeIndex]; if (!item) return;
  const currentIds = allLayerEntityIds(item);
  const removableIds = new Set(currentIds.filter((id) => selectedLayerIds.has(id)));
  if (!removableIds.size) { setStatus('Select one or more layers first.'); return; }
  if (currentIds.length - removableIds.size < 1) { setStatus('At least one layer must remain in the image.'); return; }
  const removedBase = removableIds.has('base');
  saveHistory(); item.layers = item.layers.filter((layer) => !removableIds.has(layer.id));
  if (removedBase) item.baseRemoved = true;
  normalizeLayerOrder(item);
  const remainingIds = allLayerEntityIds(item);
  selectedLayerIds = new Set([remainingIds[remainingIds.length - 1]]);
  renderLayerList(); syncSelectedLayerControls(); drawActive(); setStatus(`${removableIds.size} layer${removableIds.size === 1 ? '' : 's'} removed.`);
});
renderLayerList(); updateRemoveBackgroundControls();
let imageDrag = null;
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
  if (activeIndex < 0 || canvas.hidden || event.ctrlKey || event.metaKey) return;
  event.preventDefault();
  if (!wheelHistoryActive) { saveHistory(); wheelHistoryActive = true; }
  clearTimeout(wheelHistoryTimer);
  wheelHistoryTimer = setTimeout(() => { wheelHistoryActive = false; }, 250);
  const resizeGroup = selectedLayerIds.size > 1 || (selectedLayerIds.size === 1 && !selectedLayerIds.has('base'));
  if (resizeGroup) {
    const step = event.shiftKey ? .05 : .01;
    scaleSelectedLayerEntities(event.deltaY < 0 ? 1 + step : 1 - step);
  } else {
    const current = files[activeIndex].scale ?? 100;
    const step = event.shiftKey ? 5 : 1;
    files[activeIndex].scale = Math.max(10, Math.min(300, current + (event.deltaY < 0 ? step : -step)));
    imageScale.value = files[activeIndex].scale;
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
  const item = files[activeIndex], selected = item ? getSelectedLayerEntities(item) : []; if (!selected.length) return;
  saveHistory(); const nextValue = !selected.every((entity) => entity.data.removeBg);
  selected.forEach((entity) => { entity.data.removeBg = nextValue; entity.data.processed = null; if (entity.type === 'base') entity.data.smartPrep = null; });
  syncSelectedLayerControls(); drawActive(); setStatus(nextValue ? 'Background removed from selected layers.' : 'Background restored for selected layers.');
});
removeAllBgButton.addEventListener('click', () => {
  if (!files.length) return;
  files.forEach((item) => {
    item.removeBg = true; item.processed = null; item.smartPrep = null;
    (item.layers || []).forEach((layer) => { layer.removeBg = true; layer.processed = null; });
  });
  syncSelectedLayerControls(); drawActive(); setStatus(`Background removal enabled for every layer in all ${files.length} images.`);
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
  {folder: 'Elite', files: []},
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
const LISTING_CODE_TYPES = {
  DB: 'main', PB: 'passenger', DPB: 'main', DT: 'main', PT: 'passenger',
  DPT: 'main', DTB: 'main', PTB: 'passenger', DPTB: 'main'
};
const LISTING_TYPE_LABELS = {main: 'Main', passenger: 'Main Passenger Side', normal: 'Other / Normal'};
const listingOpenButton = document.querySelector('#open-listing');
const listingPanel = document.querySelector('#listing-panel');
const listingDialog = listingPanel.querySelector('.listing-dialog');
const listingCloseButton = document.querySelector('#close-listing');
const listingAccount = document.querySelector('#listing-account');
const listingMaterial = document.querySelector('#listing-material');
const listingPlan = document.querySelector('#listing-plan');
const listingPlanSummary = document.querySelector('#listing-plan-summary');
const listingApplyButton = document.querySelector('#listing-apply');
const listingExportButton = document.querySelector('#listing-export');
const listingSmartPrep = document.querySelector('#listing-smart-prep');
const listingTemplateManager = document.querySelector('#listing-template-manager');
const listingTemplateManagerSummary = document.querySelector('#listing-template-manager-summary');
const listingTemplateManagerGrid = document.querySelector('#listing-template-manager-grid');
let listingBusy = false;
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
  const stem = String(fileName || '').replace(/\.[^/.]+$/, '').toUpperCase();
  const match = stem.match(/(?:^|[^A-Z])(DPTB|DPB|DPT|DTB|PTB|DB|PB|DT|PT)(?=$|[^A-Z])/);
  const code = match?.[1] || 'NORMAL';
  const type = LISTING_CODE_TYPES[code] || 'normal';
  return {code, type, label: LISTING_TYPE_LABELS[type]};
}
function normalizeListingTemplateName(name) {
  return String(name || '').replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function findListingTemplate(sectionIndex, requestedName) {
  const section = watermarkSections[sectionIndex];
  if (!section) return {template: null, fallback: false};
  const aliases = requestedName === 'GLS PI' ? ['GLS PI', 'PLS PI'] : [requestedName];
  const normalizedAliases = new Set(aliases.map(normalizeListingTemplateName));
  const matches = section.templates.filter((template) => normalizedAliases.has(normalizeListingTemplateName(template.name)));
  const exact = matches.find((template) => !template.builtIn) || matches[0];
  if (exact) return {template: exact, fallback: exact.name !== requestedName};
  if (section.templates.length === 1) return {template: section.templates[0], fallback: true};
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
  return {canvasWidth, canvasHeight, topMargin, bottomMargin, middleHeight: canvasHeight - topMargin - bottomMargin, source: value?.source === 'custom' ? 'custom' : 'automatic'};
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
  const key = listingTemplateKey(sectionIndex, template), normalized = normalizedWatermarkSafeArea(safeArea);
  watermarkSafeAreaCache.set(key, normalized); template.safeArea = normalized;
  try { await assetStore('readwrite', store => store.put(normalized, watermarkSafeAreaStorageKey(sectionIndex, template.id))); } catch {}
  files.forEach((item) => {
    if (item.watermarkSection === sectionIndex && item.watermarkTemplateId === template.id && item.smartPrep) item.smartPrep.safeArea = {...normalized};
  });
  drawActive();
  return normalized;
}
async function getWatermarkSafeArea(sectionIndex, template, image, forceAnalysis = false) {
  const key = listingTemplateKey(sectionIndex, template);
  if (!forceAnalysis && watermarkSafeAreaCache.has(key)) return watermarkSafeAreaCache.get(key);
  if (!forceAnalysis && template.safeArea) {
    const normalized = normalizedWatermarkSafeArea(template.safeArea, image); watermarkSafeAreaCache.set(key, normalized); return normalized;
  }
  if (!forceAnalysis) {
    try {
      const stored = await assetStore('readonly', store => store.get(watermarkSafeAreaStorageKey(sectionIndex, template.id)));
      if (stored) { const normalized = normalizedWatermarkSafeArea(stored, image); watermarkSafeAreaCache.set(key, normalized); template.safeArea = normalized; return normalized; }
    } catch {}
  }
  const analyzed = analyzeWatermarkSafeArea(image);
  await saveWatermarkSafeArea(sectionIndex, template, analyzed);
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
    emptyMessage.textContent = 'Choose an account and material to manage the templates used by this batch.';
    listingTemplateManagerGrid.append(emptyMessage);
    listingTemplateManagerSummary.textContent = 'Choose an account and material';
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
  const hasAccount = listingAccount.value !== '';
  const sectionIndex = hasAccount ? Number(listingAccount.value) : -1;
  const materialRule = LISTING_MATERIAL_RULES[listingMaterial.value] || null;
  const rows = files.map((item) => {
    const detection = detectListingImageType(listingSourceName(item));
    const requestedTemplate = materialRule?.templates[detection.type] || null;
    const match = hasAccount && requestedTemplate ? findListingTemplate(sectionIndex, requestedTemplate) : {template: null, fallback: false};
    return {item, detection, requestedTemplate, template: match.template, fallback: match.fallback};
  });
  const missingCount = rows.filter((row) => hasAccount && materialRule && !row.template).length;
  return {
    sectionIndex,
    section: hasAccount ? watermarkSections[sectionIndex] : null,
    materialRule,
    rows,
    missingCount,
    ready: Boolean(files.length && hasAccount && materialRule && !missingCount)
  };
}
function listingStatusForRow(plan, row) {
  if (!plan.section || !plan.materialRule) return {text: 'Waiting', className: ''};
  if (!row.template) return {text: 'Missing', className: 'missing'};
  const preparationMatches = row.item.smartPrep?.templateKey === listingTemplateKey(plan.sectionIndex, row.template);
  if (listingSmartPrep.checked && preparationMatches) {
    return row.item.smartPrep.mode === 'fallback' ? {text: 'Review fit', className: 'fallback'} : {text: 'Smart ready', className: ''};
  }
  if (row.fallback) return {text: 'Account default', className: 'fallback'};
  return {text: 'Ready', className: ''};
}
function renderListingPreview() {
  if (!listingPlan) return;
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
      const category = document.createElement('small'); category.textContent = row.detection.label; fileCell.append(category);
      const codeCell = document.createElement('div'); codeCell.className = 'listing-plan-type';
      const code = document.createElement('span'); code.className = `listing-plan-code ${row.detection.type === 'normal' ? 'normal' : ''}`; code.textContent = row.detection.code; codeCell.append(code);
      const templateCell = document.createElement('div'); templateCell.className = 'listing-plan-template';
      templateCell.textContent = row.template?.name || row.requestedTemplate || 'Choose settings';
      if (row.fallback && row.template && row.requestedTemplate !== row.template.name) templateCell.title = `Requested ${row.requestedTemplate}; using ${row.template.name}`;
      const statusData = listingStatusForRow(plan, row);
      const statusCell = document.createElement('span'); statusCell.className = `listing-plan-status ${statusData.className}`.trim(); statusCell.textContent = statusData.text;
      element.append(fileCell, codeCell, templateCell, statusCell); listingPlan.append(element);
    });
    if (!plan.section) listingPlanSummary.textContent = `${files.length} image${files.length === 1 ? '' : 's'} · choose an account`;
    else if (!plan.materialRule) listingPlanSummary.textContent = `${files.length} image${files.length === 1 ? '' : 's'} · choose a material`;
    else if (plan.missingCount) listingPlanSummary.textContent = `${plan.missingCount} missing template${plan.missingCount === 1 ? '' : 's'} in ${plan.section.name}`;
    else listingPlanSummary.textContent = `${files.length} image${files.length === 1 ? '' : 's'} ready · ${plan.section.name}`;
  }
  listingApplyButton.disabled = listingBusy || !plan.ready;
  listingExportButton.disabled = listingBusy || !plan.ready;
  renderListingTemplateManager();
}
refreshListingPreview = renderListingPreview;

function openListingPanel() {
  listingPanel.hidden = false;
  listingOpenButton.classList.add('active');
  listingOpenButton.setAttribute('aria-expanded', 'true');
  renderListingPreview();
  window.requestAnimationFrame(() => (listingAccount.value ? listingMaterial : listingAccount).focus());
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
  listingExportButton.textContent = busy ? action : 'Generate & Export';
  renderListingPreview();
}
async function applyListingWatermarks() {
  const plan = createListingPlan();
  if (!plan.ready) throw new Error(plan.missingCount ? 'Required watermark templates are missing.' : 'Choose an account and material first.');
  const useSmartPreparation = Boolean(listingSmartPrep.checked);
  const templateAssets = new Map();
  await Promise.all(uniqueListingTemplates(plan).map(async ({template}) => {
    const key = listingTemplateKey(plan.sectionIndex, template);
    const image = await loadListingTemplateImage(plan.sectionIndex, template);
    const safeArea = useSmartPreparation ? await getWatermarkSafeArea(plan.sectionIndex, template, image) : null;
    templateAssets.set(key, {image, safeArea});
  }));
  let fallbackCount = 0;
  for (let index = 0; index < plan.rows.length; index += 1) {
    const row = plan.rows[index], key = listingTemplateKey(plan.sectionIndex, row.template), asset = templateAssets.get(key);
    row.item.watermarkImage = asset.image;
    row.item.watermarkEnabled = true;
    row.item.watermarkOpacity = 100;
    row.item.watermarkSection = plan.sectionIndex;
    row.item.watermarkTemplateId = row.template.id;
    if (useSmartPreparation) {
      listingApplyButton.textContent = `Preparing ${index + 1}/${plan.rows.length}`;
      listingExportButton.textContent = `Preparing ${index + 1}/${plan.rows.length}`;
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      row.item.smartPrep = createSmartPreparation(row.item.image, asset.safeArea, key);
      if (row.item.smartPrep.mode === 'fallback') fallbackCount += 1;
      row.item.rotation = 0; row.item.mirror = false; row.item.flipY = false;
      row.item.offsetX = 0; row.item.offsetY = 0; row.item.scale = 100; row.item.fit = 'contain';
      row.item.removeBg = false; row.item.processed = null;
    } else row.item.smartPrep = null;
  }
  selectedWatermarkSection = plan.sectionIndex;
  activeWatermarkSection = plan.sectionIndex;
  activeWatermarkTemplateId = plan.rows[0]?.template.id || null;
  opacityInput.value = 100;
  syncWatermarkControls(); renderWatermarkLibrary(); renderThumbs(); drawActive();
  const preparationMessage = useSmartPreparation
    ? ` Smart preparation completed${fallbackCount ? ` with ${fallbackCount} full-image fallback${fallbackCount === 1 ? '' : 's'}` : ''}.`
    : '';
  setStatus(`Listing workflow applied to ${plan.rows.length} image${plan.rows.length === 1 ? '' : 's'} for ${plan.section.name}.${preparationMessage}`);
  return plan;
}
function listingArchiveName(plan) {
  const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug(plan.section.name)}-${slug(plan.materialRule.label)}-ebay-listing.zip`;
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
listingApplyButton.addEventListener('click', async () => {
  setListingBusy(true, 'Applying…');
  try {
    await applyListingWatermarks();
    listingPanel.hidden = true; listingOpenButton.classList.remove('active'); listingOpenButton.setAttribute('aria-expanded', 'false');
  }
  catch (error) { setStatus(error.message || 'Listing watermarks could not be applied.'); }
  finally { setListingBusy(false); }
});
listingExportButton.addEventListener('click', async () => {
  setListingBusy(true, 'Generating…');
  try {
    const plan = await applyListingWatermarks();
    const format = exportFormat.value;
    await exportBatchArchive([...files], format, listingArchiveName(plan), 'Preparing listing image');
    listingPanel.hidden = true; listingOpenButton.classList.remove('active'); listingOpenButton.setAttribute('aria-expanded', 'false');
    setStatus(`eBay listing images exported for ${plan.section.name}.`);
  } catch (error) { setStatus(error.message || 'Listing image generation failed.'); }
  finally { setListingBusy(false); }
});
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
async function saveWatermarkSection(index) {
  const personalTemplates = watermarkSections[index].templates.filter((template) => !template.builtIn && template.blob);
  await assetStore('readwrite', store => store.put(personalTemplates, watermarkSectionKey(index)));
}
function clearWatermarkPreviewUrls() {
  watermarkPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  watermarkPreviewUrls = [];
}
function renderWatermarkLibrary() {
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
    item.watermarkImage = image;
    item.watermarkEnabled = true;
    item.watermarkOpacity = opacity;
    item.watermarkSection = sectionIndex;
    item.watermarkTemplateId = templateId;
  });
  if (targets.some((item) => item.smartPrep)) {
    const safeArea = await getWatermarkSafeArea(sectionIndex, template, image);
    targets.forEach((item) => {
      if (!item.smartPrep) return;
      item.smartPrep.safeArea = {...safeArea};
      item.smartPrep.templateKey = listingTemplateKey(sectionIndex, template);
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
(async () => {
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
  return `${stem}-photo-studio.${format}`;
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
    centralParts.push(central); centralSize += central.length; localOffset += local.length + data.length;
  }
  const end = new Uint8Array(22), endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true); endView.setUint16(4, 0, true); endView.setUint16(6, 0, true); endView.setUint16(8, entries.length, true); endView.setUint16(10, entries.length, true); endView.setUint32(12, centralSize, true); endView.setUint32(16, localOffset, true); endView.setUint16(20, 0, true);
  return new Blob([...localParts, ...centralParts, end], {type: 'application/zip'});
}
async function exportBatchArchive(batchItems, format, archiveName = 'photo-studio-batch.zip', progressLabel = 'Exporting') {
  const entries = [];
  for (let index = 0; index < batchItems.length; index += 1) {
    setStatus(`${progressLabel} ${index + 1} of ${batchItems.length}…`);
    entries.push({name: exportFileName(batchItems[index], format), blob: await createExportBlob(batchItems[index], format)});
  }
  triggerDownload(await createZip(entries), archiveName);
  return entries.length;
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
document.querySelector('#reset-editor').addEventListener('click', () => { if (activeIndex < 0) return; files[activeIndex].rotation = 0; files[activeIndex].mirror = false; files[activeIndex].flipY = false; files[activeIndex].offsetX = 0; files[activeIndex].offsetY = 0; files[activeIndex].removeBg = false; files[activeIndex].processed = null; files[activeIndex].shadow = false; files[activeIndex].shadowAngle = 90; files[activeIndex].shadowDistance = 18; files[activeIndex].shadowStrength = 80; files[activeIndex].fit = 'contain'; fitSelect.value = 'contain'; imageScale.value = 100; resizeWidth.value = 1576; resizeHeight.value = 1576; watermarkImageInput.value = ''; watermarkSize.value = 0; watermarkGap.value = 0; shadowAngle.value = 90; angleValue.textContent = '90°'; shadowStrength.value = 80; shadowToggle.textContent = 'Add shadow'; shadowToggle.classList.remove('active'); watermark.style.background = ''; watermark.style.width = ''; watermark.style.height = ''; watermark.style.fontSize = ''; watermark.style.left = '50%'; watermark.style.top = '50%'; removeBgButton.classList.remove('active'); syncSelectedLayerControls(); drawActive(); setStatus('Current image reset.'); });
document.querySelector('#reset-editor').addEventListener('click', () => { if (activeIndex < 0) return; files[activeIndex].scale = 100; imageScale.value = 100; drawActive(); });
document.querySelector('#reset-editor').addEventListener('click', () => { shadowDistance.value = 18; distanceValue.textContent = '18px'; });
document.querySelector('#reset-editor').addEventListener('click', updateRemoveBackgroundControls);
document.querySelector('#reset-editor').addEventListener('click', () => { const item = files[activeIndex]; if (item) item.smartPrep = null; });
document.querySelector('#reset-editor').addEventListener('click', () => {
  const item = files[activeIndex]; if (!item) return;
  item.watermarkImage = null;
  item.watermarkEnabled = false;
  item.watermarkOpacity = 100;
  item.watermarkSection = null;
  item.watermarkTemplateId = null;
  opacityInput.value = 100;
  syncWatermarkControls();
  drawActive();
});

// Use the available grid cell, not the canvas's intrinsic 1576px dimensions, for preview sizing.
const stage = document.createElement('div');
stage.className = 'canvas-stage';
canvasWrap.before(stage); stage.append(canvasWrap);
new ResizeObserver(entries => {
  const {width, height} = entries[0].contentRect;
  const side = Math.max(1, Math.floor(Math.min(width, height) - 24));
  canvasWrap.style.width = side + 'px'; canvasWrap.style.height = side + 'px';
}).observe(stage);
