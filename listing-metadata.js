// CPIS supplies classification and listing membership. This module only validates
// the contract and translates image roles into Photo Studio's template categories.
(function (root) {
  'use strict';
  const primary = Object.freeze({
    DT: {label: 'Driver Top', templateType: 'main'},
    DB: {label: 'Driver Bottom', templateType: 'main'},
    PT: {label: 'Passenger Top', templateType: 'passenger'},
    PB: {label: 'Passenger Bottom', templateType: 'passenger'},
    DPT: {label: 'Driver & Passenger Tops', templateType: 'main'},
    DPB: {label: 'Driver & Passenger Bottoms', templateType: 'main'},
    DTB: {label: 'Driver Top & Bottom', templateType: 'main'},
    PTB: {label: 'Passenger Top & Bottom', templateType: 'passenger'},
    DPTB: {label: 'Full Set', templateType: 'main'}
  });
  const shared = Object.freeze({DOPT: 'Driver OR Passenger Top', DOPB: 'Driver OR Passenger Bottom'});
  const subtypes = Object.freeze({main: 'Main', unmain: 'Composite component', cv: 'Close View · original size', io: 'Inside / Outside', numbered: 'Supporting'});
  const materials = Object.freeze({
    'genuine-leather-solid': 'genuine-leather-solid', 'genuine leather solid': 'genuine-leather-solid',
    'genuine-leather-perforated': 'genuine-leather-perforated', 'genuine leather perforated': 'genuine-leather-perforated',
    'genuine leather perf': 'genuine-leather-perforated',
    perforated: 'perforated', 'other-material': 'other-material', 'other material': 'other-material'
  });
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  function requiredText(value, field) {
    if (typeof value !== 'string' || !value.trim()) throw new Error(`CPIS: ${field} must be a non-empty string.`);
    return value.trim();
  }
  function normalizeImage(value, index = 0) {
    const field = `images[${index}]`;
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`CPIS: ${field} must be an image object.`);
    const filename = requiredText(value.filename, `${field}.filename`);
    const variation = requiredText(value.variation, `${field}.variation`).toUpperCase();
    const subtype = requiredText(value.subtype, `${field}.subtype`).toLowerCase();
    if (!own(primary, variation) && !own(shared, variation)) throw new Error(`CPIS: unsupported variation/shared component "${variation}" for ${filename}.`);
    if (!own(subtypes, subtype)) throw new Error(`CPIS: unsupported subtype "${subtype}" for ${filename}.`);
    const image = {filename, variation, subtype};
    for (const name of ['id', 'imageId', 'templateName']) {
      if (value[name] !== undefined) image[name] = requiredText(value[name], `${field}.${name}`);
    }
    return Object.freeze(image);
  }
  function normalizePayload(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('CPIS: expected a metadata object.');
    if (value.schemaVersion !== undefined && value.schemaVersion !== 1) throw new Error('CPIS: unsupported schemaVersion; expected 1.');
    const account = requiredText(value.account, 'account'), material = requiredText(value.material, 'material');
    const token = material.toLowerCase().replace(/\s+/g, ' ');
    if (!own(materials, token)) throw new Error(`CPIS: unsupported material "${material}". Send a supported material; it will not be guessed.`);
    if (!Array.isArray(value.images) || !value.images.length) throw new Error('CPIS: images must be a non-empty array.');
    const color = value.color === undefined || value.color === null ? null : requiredText(value.color, 'color');
    const images = value.images.map(normalizeImage);
    return Object.freeze({schemaVersion: 1, account, material, materialKey: materials[token], color, images: Object.freeze(images)});
  }
  function resolveImage(metadata, source = 'metadata') {
    const entry = normalizeImage(metadata);
    const sharedComponent = own(shared, entry.variation);
    const type = !sharedComponent && entry.subtype === 'main' ? primary[entry.variation].templateType : 'normal';
    const label = sharedComponent ? `Shared · ${shared[entry.variation]}` : primary[entry.variation].label;
    return {code: entry.variation, variation: entry.variation, subtype: entry.subtype,
      kind: sharedComponent ? 'shared' : 'variation', type, closeView: entry.subtype === 'cv',
      label: `${label} · ${subtypes[entry.subtype]}`, source};
  }
  // Local uploads still work without CPIS. Never call this for an image that
  // already has supplied metadata, even if that metadata is invalid.
  function detectFilename(filename) {
    const stem = String(filename || '').replace(/\.[^/.]+$/, '').toUpperCase();
    if (/(?:^|[^A-Z])CLOSE[\s_-]*VIEW(?=$|[^A-Z])/.test(stem)) {
      return {code: 'CLOSE VIEW', type: 'normal', label: 'Close View · original size', closeView: true, subtype: 'cv', source: 'filename'};
    }
    const match = stem.match(/(?:^|[^A-Z0-9])(DPTB|DOPT|DOPB|DPB|DPT|DTB|PTB|DT|DB|PT|PB)(?:[\s_-]*(UNMAIN|CV|IO)(?:\d+)?|[\s_-]*(\d+))?(?=$|[^A-Z0-9])/);
    if (!match) return {code: 'NORMAL', type: 'normal', label: 'Other / Normal', source: 'filename'};
    const trailingUnmain = /(?:^|[\s_-])UNMAIN(?:\s*\(\d+\))?$/.test(stem);
    return resolveImage({filename: String(filename), variation: match[1], subtype: match[2]?.toLowerCase() || (match[3] ? 'numbered' : trailingUnmain ? 'unmain' : 'main')}, 'filename');
  }
  root.PhotoStudioMetadata = Object.freeze({primary, shared, subtypes, normalizePayload, normalizeImage, resolveImage, detectFilename});
})(globalThis);
