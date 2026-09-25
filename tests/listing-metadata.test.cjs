const {test} = require('node:test');
const assert = require('node:assert/strict');
require('../listing-metadata.js');
const metadata = globalThis.PhotoStudioMetadata;
const image = (variation, subtype, filename = 'arbitrary.jpg') => ({filename, variation, subtype});
const payload = images => ({account: 'US Auto Nation', material: 'Genuine Leather Perf', color: 'Ebony', images});

test('all nine primary variations support all five subtypes', () => {
  for (const [variation, type] of Object.entries({DT:'main',DB:'main',PT:'passenger',PB:'passenger',DPT:'main',DPB:'main',DTB:'main',PTB:'passenger',DPTB:'main'})) {
    for (const subtype of ['main', 'unmain', 'cv', 'io', 'numbered']) {
      const actual = metadata.resolveImage(image(variation, subtype));
      assert.equal(actual.type, subtype === 'main' ? type : 'normal');
      assert.equal(actual.kind, 'variation');
      assert.equal(actual.closeView, subtype === 'cv');
    }
  }
});
test('DOPT and DOPB remain shared components for every subtype', () => {
  for (const variation of ['DOPT', 'DOPB']) for (const subtype of Object.keys(metadata.subtypes)) {
    const actual = metadata.resolveImage(image(variation, subtype));
    assert.equal(actual.kind, 'shared');
    assert.equal(actual.type, 'normal');
    assert.equal(actual.variation, variation);
  }
});
test('metadata wins over conflicting filename text and suffixes', () => {
  assert.equal(metadata.resolveImage(image('PB', 'main', 'DTcv.jpg')).type, 'passenger');
  assert.equal(metadata.resolveImage(image('DT', 'main', 'Close View.png')).closeView, false);
  assert.equal(metadata.resolveImage(image('DOPT', 'cv', 'DT.jpg')).closeView, true);
  assert.equal(metadata.resolveImage(image('DT', 'unmain', 'DT.jpg')).type, 'normal');
});
test('normalizes known material alias and retains CPIS color and identity', () => {
  const result = metadata.normalizePayload(payload([{...image('dopt', 'CV'), id:'cpis-source-1', imageId:'editor-1', templateName:'Normal'}]));
  assert.equal(result.materialKey, 'genuine-leather-perforated');
  assert.equal(result.material, 'Genuine Leather Perf');
  assert.equal(result.color, 'Ebony');
  assert.equal(result.images[0].variation, 'DOPT');
  assert.equal(result.images[0].id, 'cpis-source-1');
  assert.equal(result.images[0].imageId, 'editor-1');
  assert.equal(result.images[0].templateName, 'Normal');
});
test('invalid supplied metadata is rejected instead of guessing from filenames', () => {
  for (const invalid of [image('UNKNOWN','main','DT.jpg'),image('DT','unknown','DT.jpg'),{filename:'DT.jpg',variation:'DT'},image('__proto__','main'),image('DT','constructor')]) {
    assert.throws(() => metadata.normalizePayload(payload([invalid])));
    assert.throws(() => metadata.resolveImage(invalid));
  }
  assert.throws(() => metadata.normalizePayload({...payload([image('DT','main')]),material:'mystery leather'}));
  assert.throws(() => metadata.normalizePayload({...payload([image('DT','main')]),schemaVersion:2}));
  assert.throws(() => metadata.normalizePayload(payload([])));
});
test('local fallback understands compact subtypes and shared filenames', () => {
  for (const [name, variation, subtype] of [
    ['DT.jpg','DT','main'],['DT1.jpg','DT','numbered'],['DTcv.jpg','DT','cv'],['DTio.jpg','DT','io'],['DT unmain.jpg','DT','unmain'],
    ['DOPTcv.png','DOPT','cv'],['DOPTio.jpg','DOPT','io'],['DOPT2.webp','DOPT','numbered'],
    ['DOPBcv.png','DOPB','cv'],['DOPBio.jpg','DOPB','io'],['DOPB12.png','DOPB','numbered'],['truck_DPTB.png','DPTB','main']
  ]) {
    const actual = metadata.detectFilename(name);
    assert.equal(actual.variation, variation, name);
    assert.equal(actual.subtype, subtype, name);
    assert.equal(actual.source, 'filename');
  }
});
test('fallback keeps long Close View names and does not match embedded words', () => {
  for (const name of ['Close View.png','truck_close_view_02.jpg','DT-Close-View.webp','seat-CloseView1.png']) assert.equal(metadata.detectFilename(name).closeView,true);
  for (const name of ['ADTop.png','notDOPT.jpg','myDPTB123word.png','details.png']) assert.equal(metadata.detectFilename(name).code,'NORMAL');
});
