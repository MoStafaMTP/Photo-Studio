// Session history stores immutable editor state while sharing read-only image assets.
// Pixel buffers are not copied for each small movement or slider adjustment.
function cloneHistoryValue(value) {
  if (Array.isArray(value)) return value.map(cloneHistoryValue);
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneHistoryValue(entry)]));
  }
  return value;
}
const historyModels = new Map();
function readHistoryState() {
  files.forEach(item => { historyModels.set(item.id, item); item.layers?.forEach(layer => historyModels.set(layer.id, layer)); });
  return {
    files: files.map(cloneHistoryValue), library: cloneHistoryValue(watermarkSections), metadata: cloneHistoryValue(cpisListingContext),
    settings: {width: resizeWidth.value, height: resizeHeight.value, backgroundMode, backgroundColor: backgroundColor.value,
      gap: watermarkGap.value, exportFormat: exportFormat.value,
      account: listingAccount.value, material: listingMaterial.value, smart: listingSmartPrep.checked},
    selection: {activeId: files[activeIndex]?.id || null, layers: [...selectedLayerIds], batch: [...selectedBatchImageIds],
      activeWatermarkSection, activeWatermarkTemplateId, selectedWatermarkSection}
  };
}
const historyAssetIds = new WeakMap();
let nextHistoryAssetId = 1;
function historyKey(state) {
  // Selection, previews and processing caches are not edits. Template measurements
  // loaded automatically are also excluded; explicit margin overrides are included.
  return JSON.stringify({files: state.files, library: state.library, metadata: state.metadata, settings: state.settings}, (key, value) => {
    if (key === 'thumbnailDataUrl' || key === 'processed') return undefined;
    if (key === 'safeArea' && value && !['custom', 'analyzed'].includes(value.source)) return undefined;
    if (value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) {
      if (!historyAssetIds.has(value)) historyAssetIds.set(value, nextHistoryAssetId++);
      return {asset: historyAssetIds.get(value)};
    }
    return value;
  });
}
function restoreHistoryModel(saved) {
  const model = historyModels.get(saved.id) || {};
  const state = cloneHistoryValue(saved);
  if (state.layers) state.layers = saved.layers.map(restoreHistoryModel);
  Object.keys(model).forEach(key => { if (!Object.hasOwn(state, key)) delete model[key]; });
  Object.assign(model, state); historyModels.set(model.id, model);
  return model;
}
function persistHistoryLibrary(previous, next) {
  const changes = [];
  next.forEach((section, index) => {
    const personal = templates => templates.filter(template => !template.builtIn && template.blob);
    const oldPersonal = personal(previous[index]?.templates || []), newPersonal = personal(section.templates);
    const keyForTemplates = templates => historyKey({library: templates});
    if (keyForTemplates(oldPersonal) !== keyForTemplates(newPersonal)) changes.push({key: watermarkSectionKey(index), value: cloneHistoryValue(newPersonal)});
    const before = new Map((previous[index]?.templates || []).map(template => [template.id, template]));
    const after = new Map(section.templates.map(template => [template.id, template]));
    for (const id of new Set([...before.keys(), ...after.keys()])) {
      const oldArea = before.get(id)?.safeArea, area = after.get(id)?.safeArea;
      if (JSON.stringify(oldArea) !== JSON.stringify(area)) changes.push({key: watermarkSafeAreaStorageKey(index, id), value: cloneHistoryValue(area)});
    }
  });
  if (!changes.length) return;
  // Queue one transaction immediately. IndexedDB serializes it with subsequent
  // edits, so a rapid Undo, Redo or rename cannot write an older library last.
  historyPersistence = assetStore('readwrite', store => {
    let request;
    for (const change of changes) request = change.value === undefined ? store.delete(change.key) : store.put(change.value, change.key);
    return request;
  }).catch(() => setStatus('The edit was restored, but saved watermark changes could not be written to browser storage.'));
}
function restoreHistoryState(state) {
  const previousLibrary = cloneHistoryValue(watermarkSections);
  files.splice(0, files.length, ...state.files.map(restoreHistoryModel));
  watermarkSections.splice(0, watermarkSections.length, ...cloneHistoryValue(state.library));
  cpisListingContext = cloneHistoryValue(state.metadata);
  const settings = state.settings, selection = state.selection;
  resizeWidth.value = settings.width; resizeHeight.value = settings.height;
  backgroundMode = settings.backgroundMode; backgroundColor.value = settings.backgroundColor;
  backgroundColor.disabled = backgroundMode !== 'color';
  backgroundGroup.querySelectorAll('[data-background]').forEach(button => button.classList.toggle('active', button.dataset.background === backgroundMode));
  watermarkGap.value = watermarkSize.value = settings.gap;
  exportFormat.value = settings.exportFormat; listingAccount.value = settings.account; listingMaterial.value = settings.material; listingSmartPrep.checked = settings.smart;
  activeIndex = files.findIndex(item => item.id === selection.activeId);
  if (activeIndex < 0 && files.length) activeIndex = 0;
  selectedBatchImageIds = new Set(selection.batch.filter(id => files.some(item => item.id === id)));
  if (!selectedBatchImageIds.size && activeIndex >= 0) selectedBatchImageIds.add(files[activeIndex].id);
  const layerIds = activeIndex >= 0 ? allLayerEntityIds(files[activeIndex]) : [];
  selectedLayerIds = new Set(selection.layers.filter(id => layerIds.includes(id)));
  activeWatermarkSection = selection.activeWatermarkSection;
  activeWatermarkTemplateId = selection.activeWatermarkTemplateId;
  selectedWatermarkSection = selection.selectedWatermarkSection;
  watermarkSafeAreaCache.clear();
  watermarkSections.forEach((section, index) => section.templates.forEach(template => {
    const area = template.safeArea || defaultWatermarkSafeArea(index, template);
    if (area) watermarkSafeAreaCache.set(listingTemplateKey(index, template), normalizedWatermarkSafeArea(area));
  }));
  persistHistoryLibrary(previousLibrary, watermarkSections);
  imageDrag = null; listingAutoPrompted = Boolean(files.length);
  empty.hidden = Boolean(files.length); canvas.hidden = watermark.hidden = !files.length;
  if (!files.length) ctx.clearRect(0, 0, canvas.width, canvas.height);
  renderThumbs(); renderLayerList(); syncSelectedLayerControls(); syncWatermarkControls(); renderWatermarkLibrary(); drawActive();
}

const historyReady = watermarkLibraryReady.then(async () => {
  // Read persisted margins before creating the initial baseline, so loading a
  // saved setting later is not mistaken for a new edit.
  await Promise.all(watermarkSections.flatMap((section, index) => section.templates.map(async template => {
    try {
      const stored = await assetStore('readonly', store => store.get(watermarkSafeAreaStorageKey(index, template.id)));
      if (stored && ['custom', 'analyzed'].includes(stored.source)) template.safeArea = stored;
    } catch { /* Session editing also works when storage is unavailable. */ }
  })));
  editorHistory = {
    depth: 0, restoring: false, baseline: readHistoryState(), key: '',
    prepare() {
      if (this.depth || this.restoring || exporting) return;
      const state = readHistoryState();
      if (historyKey(state) === this.key) this.baseline = state;
      else this.baseline = {...this.baseline, selection: state.selection};
    },
    capture() {
      if (this.depth || this.restoring || exporting) return;
      const state = readHistoryState(), key = historyKey(state);
      if (key !== this.key) {
        undoStack.push({before: this.baseline, after: state}); redoStack.length = 0;
      }
      this.baseline = state; this.key = key; updateHistoryButtons();
    },
    begin() { if (!this.depth) this.capture(); this.depth++; updateHistoryButtons(); },
    end() { this.depth--; if (!this.depth) this.capture(); updateHistoryButtons(); },
    apply(state) {
      this.restoring = true;
      try { restoreHistoryState(state); }
      finally { this.restoring = false; this.baseline = readHistoryState(); this.key = historyKey(this.baseline); updateHistoryButtons(); }
    },
    undo() {
      if (this.depth || this.restoring || listingBusy || exporting) return;
      this.capture(); const entry = undoStack.pop(); if (!entry) return;
      redoStack.push(entry); this.apply(entry.before); setStatus('Undo.');
    },
    redo() {
      if (this.depth || this.restoring || listingBusy || exporting) return;
      this.capture(); const entry = redoStack.pop(); if (!entry) return;
      undoStack.push(entry); this.apply(entry.after); setStatus('Redo.');
    }
  };
  editorHistory.key = historyKey(editorHistory.baseline);
  for (const name of ['input', 'change']) document.addEventListener(name, checkpointHistory);
  updateHistoryButtons();
});
