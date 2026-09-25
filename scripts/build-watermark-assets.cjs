// Run with node scripts/build-watermark-assets.cjs after updating bundled PNGs.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const folders = ['DIY', 'DSA eBay', 'Elite', 'Master', 'Premium', 'US Auto Seat Cover', 'US Auto Seat Factory', 'Us Auto Nation'];
const assets = {};
for (const folder of folders) {
  for (const file of fs.readdirSync(path.join(root, folder)).filter(name => /\.png$/i.test(name)).sort()) {
    assets[`${folder}/${file}`] = `data:image/png;base64,${fs.readFileSync(path.join(root, folder, file)).toString('base64')}`;
  }
}
fs.writeFileSync(path.join(root, 'watermark-assets.js'), `globalThis.DEFAULT_WATERMARK_ASSETS = Object.freeze(${JSON.stringify(assets)});\n`);
console.log(`Bundled ${Object.keys(assets).length} watermark templates.`);
