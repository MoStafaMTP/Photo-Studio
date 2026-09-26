// Text stays structured and editable; all previews and exports share this renderer.
const TEXT_FONT_FAMILIES = ['Arial', 'Verdana', 'Tahoma', 'Georgia', 'Times New Roman', 'Courier New', 'DM Sans', 'Space Grotesk'];
const textMeasureContext = document.createElement('canvas').getContext('2d');
let textEditorFields = null, lastTextSelection = '';
function isTextLayer(layer) { return layer?.type === 'text'; }
function textFont(layer) { return `${layer.fontStyle || 'normal'} ${layer.fontWeight || 400} ${layer.fontSize || 72}px "${layer.fontFamily || 'Arial'}", sans-serif`; }
function configureTextContext(context, layer) {
  context.font = textFont(layer); context.textBaseline = 'alphabetic';
  context.letterSpacing = `${Number(layer.letterSpacing) || 0}px`;
}
function measureTextLayer(layer) {
  configureTextContext(textMeasureContext, layer);
  const lines = String(layer.text ?? '').split('\n'), size = Number(layer.fontSize) || 72;
  const metrics = lines.map(line => textMeasureContext.measureText(line || ' '));
  const padding = Math.max(2, size * .12) + Number(layer.strokeWidth || 0);
  const lineHeight = size * (Number(layer.lineHeight) || 1.2);
  const ascent = Math.max(size * .8, ...metrics.map(m => m.actualBoundingBoxAscent || 0));
  const descent = Math.max(size * .22, ...metrics.map(m => m.actualBoundingBoxDescent || 0));
  return {lines, metrics, padding, ascent, lineHeight,
    width: Math.max(1, ...metrics.map(m => Math.max(m.width, (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || 0)))) + padding * 2,
    height: ascent + descent + Math.max(0, lines.length - 1) * lineHeight + padding * 2};
}
function getTextLayerDrawRect(layer) {
  const size = measureTextLayer(layer), scale = (layer.scale ?? 100) / 100;
  return {x: layer.x ?? canvas.width / 2, y: layer.y ?? canvas.height / 2, width: size.width * scale, height: size.height * scale};
}
function drawTextLayer(layer) {
  const box = measureTextLayer(layer), rect = getTextLayerDrawRect(layer), scale = (layer.scale ?? 100) / 100;
  ctx.save(); ctx.translate(rect.x, rect.y); ctx.rotate((layer.rotation || 0) * Math.PI / 180);
  ctx.scale(scale * (layer.mirror ? -1 : 1), scale * (layer.flipY ? -1 : 1));
  configureTextContext(ctx, layer); ctx.globalAlpha = (layer.opacity ?? 100) / 100;
  ctx.fillStyle = layer.color || '#1c1c1e'; ctx.strokeStyle = layer.strokeColor || '#ffffff';
  ctx.lineWidth = Number(layer.strokeWidth || 0) * 2; ctx.lineJoin = 'round';
  if (layer.shadow) {
    const angle = (layer.shadowAngle ?? 90) * Math.PI / 180, distance = layer.shadowDistance ?? 18;
    ctx.shadowColor = `rgba(0,0,0,${(layer.shadowStrength ?? 80) / 100})`; ctx.shadowBlur = 26;
    ctx.shadowOffsetX = Math.cos(angle) * distance; ctx.shadowOffsetY = Math.sin(angle) * distance;
  }
  ctx.textAlign = layer.align || 'center';
  const anchor = ctx.textAlign === 'left' ? -box.width / 2 + box.padding : ctx.textAlign === 'right' ? box.width / 2 - box.padding : 0;
  box.lines.forEach((line, index) => {
    const baseline = -box.height / 2 + box.padding + box.ascent + index * box.lineHeight;
    if (layer.strokeWidth) ctx.strokeText(line, anchor, baseline);
    ctx.fillText(line, anchor, baseline);
    const width = box.metrics[index].width, left = ctx.textAlign === 'left' ? anchor : ctx.textAlign === 'right' ? anchor - width : -width / 2;
    ctx.strokeStyle = layer.color || '#1c1c1e'; ctx.lineWidth = Math.max(1, layer.fontSize / 20);
    for (const y of [layer.underline ? baseline + layer.fontSize * .1 : null, layer.strikethrough ? baseline - layer.fontSize * .3 : null]) {
      if (y == null) continue; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(left + width, y); ctx.stroke();
    }
    ctx.strokeStyle = layer.strokeColor || '#ffffff'; ctx.lineWidth = Number(layer.strokeWidth || 0) * 2;
  });
  ctx.restore();
}
async function ensureTextLayerFonts(items) {
  if (!document.fonts) return;
  const fonts = new Map();
  items.forEach(item => (item.layers || []).filter(isTextLayer).forEach(layer => fonts.set(textFont(layer), layer.text || 'Text')));
  // An unavailable optional web font must not block downloads. Canvas uses the
  // same system fallback in previews and exports after the load has settled.
  const results = await Promise.allSettled([...fonts].map(([font, text]) => document.fonts.load(font, text)));
  return results.every(result => result.status === 'fulfilled');
}
function selectedTextLayers() {
  const item = files[activeIndex];
  return item ? getSelectedLayerEntities(item).map(entity => entity.data).filter(isTextLayer) : [];
}
function addTextLayer() {
  const item = files[activeIndex]; if (!item) { setStatus('Upload an image before adding text.'); return; }
  withHistoryActionSync(() => {
    const layer = {type: 'text', id: createLayerId(), name: 'Your text', text: 'Your text',
      fontFamily: 'Arial', fontSize: Math.max(24, Math.round(canvas.width * .055)), fontWeight: 400, fontStyle: 'normal',
      color: '#1c1c1e', opacity: 100, align: 'center', lineHeight: 1.2, letterSpacing: 0,
      underline: false, strikethrough: false, strokeWidth: 0, strokeColor: '#ffffff',
      x: canvas.width / 2, y: canvas.height / 2, scale: 100, rotation: 0, mirror: false, flipY: false,
      shadow: false, shadowStrength: 80, shadowAngle: 90, shadowDistance: 18};
    item.layers.push(layer); normalizeLayerOrder(item); selectedLayerIds = new Set([layer.id]);
    renderLayerList(); syncSelectedLayerControls(); drawActive();
  });
  textEditorFields?.content.focus(); textEditorFields?.content.select(); setStatus('Text layer added.');
}
function updateTextLayers(property, value) {
  const layers = selectedTextLayers(); if (!layers.length) return;
  saveHistory();
  layers.forEach(layer => {
    layer[property] = value;
    if (property === 'text') layer.name = value.replace(/\s+/g, ' ').trim().slice(0, 60) || 'Empty text';
  });
  renderLayerList(); syncTextEditorControls(); drawActive();
  if (['fontFamily', 'fontWeight', 'fontStyle'].includes(property)) {
    ensureTextLayerFonts([files[activeIndex]]).then(loaded => {
      if (typeof invalidateWorkspacePreviews === 'function') invalidateWorkspacePreviews();
      drawActive();
      if (!loaded) setStatus('That font is unavailable; a fallback font is being used.');
    }).catch(() => setStatus('That font is unavailable; a fallback font is being used.'));
  }
}
function syncTextEditorControls() {
  if (!textEditorFields) return;
  const layers = selectedTextLayers(), layer = layers[0], fields = textEditorFields;
  fields.add.disabled = !files[activeIndex]; fields.settings.disabled = !layer;
  fields.hint.hidden = Boolean(layer); fields.content.disabled = layers.length !== 1;
  fields.selection.textContent = layers.length > 1 ? `${layers.length} text layers selected · styling applies to all` : '';
  if (!layer) { lastTextSelection = ''; return; }
  const selection = layers.map(entry => entry.id).join(',');
  if (selection !== lastTextSelection) { fields.section.open = true; lastTextSelection = selection; }
  Object.entries(fields.controls).forEach(([property, control]) => {
    const value = layer[property];
    if (control.value !== String(value ?? '')) control.value = value ?? '';
    const mixed = layers.some(other => other[property] !== value);
    control.title = mixed ? 'Mixed values — changing this applies to selected text layers' : '';
  });
  fields.buttons.forEach(({button, property, on}) => {
    const enabled = layers.every(entry => entry[property] === on);
    button.setAttribute('aria-pressed', String(enabled));
    if (property === 'shadow') button.textContent = enabled ? 'Shadow on' : 'Add shadow';
  });
}
function initializeTextEditor(section, body) {
  body.innerHTML = `<button type="button" class="add-text-button" id="add-text-layer"><span aria-hidden="true">T+</span> Add text layer</button>
    <p class="text-editor-hint">Add text or select a text layer to edit it.</p><p class="text-selection-info" aria-live="polite"></p>
    <fieldset class="text-settings" disabled><legend class="sr-only">Text formatting</legend>
    <label class="text-wide">Text<textarea id="text-content" rows="3" placeholder="Your text" spellcheck="false"></textarea></label>
    <label class="text-wide">Font family<select id="text-font-family"></select></label>
    <div class="text-style-buttons"><button type="button" data-text-style="bold" aria-label="Bold"><b>B</b></button><button type="button" data-text-style="italic" aria-label="Italic"><i>I</i></button><button type="button" data-text-style="underline" aria-label="Underline"><u>U</u></button><button type="button" data-text-style="strike" aria-label="Strikethrough"><s>S</s></button></div>
    <label>Font size (px)<input id="text-font-size" type="number" min="8" max="1000" step="1"></label>
    <label>Color<input id="text-color" type="color"></label>
    <label>Alignment<select id="text-align"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
    <label>Opacity (%)<input id="text-opacity" type="number" min="0" max="100" step="1"></label>
    <label>Line height<input id="text-line-height" type="number" min="0.8" max="3" step="0.1"></label>
    <label>Letter spacing (px)<input id="text-letter-spacing" type="number" min="-5" max="30" step="0.5"></label>
    <label>Outline (px)<input id="text-stroke-width" type="number" min="0" max="20" step="0.5"></label>
    <label>Outline color<input id="text-stroke-color" type="color"></label>
    <button type="button" class="text-shadow-toggle text-wide" id="text-shadow-toggle">Add shadow</button>
    <p class="text-settings-note text-wide">Move and resize text with the layer controls. Shadow details are in the Shadow section.</p></fieldset>`;
  const controls = Object.fromEntries(Object.entries({text:'content', fontFamily:'font-family', fontSize:'font-size', color:'color', align:'align', opacity:'opacity', lineHeight:'line-height', letterSpacing:'letter-spacing', strokeWidth:'stroke-width', strokeColor:'stroke-color'}).map(([key, id]) => [key, body.querySelector(`#text-${id}`)]));
  TEXT_FONT_FAMILIES.forEach(family => { const option = document.createElement('option'); option.value = option.textContent = family; controls.fontFamily.append(option); });
  const buttons = [['bold','fontWeight',700,400], ['italic','fontStyle','italic','normal'], ['underline','underline',true,false], ['strike','strikethrough',true,false]].map(([name, property, on, off]) => {
    const button = body.querySelector(`[data-text-style="${name}"]`);
    button.addEventListener('click', () => updateTextLayers(property, selectedTextLayers().every(layer => layer[property] === on) ? off : on));
    return {button, property, on};
  });
  Object.entries(controls).forEach(([property, control]) => control.addEventListener('input', () => {
    let value = control.value;
    if (control.type === 'number') { if (value === '' || !control.validity.valid) return; value = Number(value); }
    updateTextLayers(property, value);
  }));
  const shadow = body.querySelector('#text-shadow-toggle');
  shadow.addEventListener('click', () => {
    const layers = selectedTextLayers(), enabled = !layers.every(layer => layer.shadow);
    saveHistory(); layers.forEach(layer => { layer.shadow = enabled; if (enabled) layer.shadowStrength = 80; });
    syncSelectedLayerControls(); drawActive();
  });
  buttons.push({button: shadow, property: 'shadow', on: true});
  textEditorFields = {section, controls, buttons, content: controls.text, add: body.querySelector('#add-text-layer'), settings: body.querySelector('fieldset'), hint: body.querySelector('.text-editor-hint'), selection: body.querySelector('.text-selection-info')};
  textEditorFields.add.addEventListener('click', addTextLayer); syncTextEditorControls();
}
