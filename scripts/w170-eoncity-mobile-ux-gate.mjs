import fs from 'node:fs';
import assert from 'node:assert/strict';
const required = [
  'assets/js/realm3d/engine/EonCityMobileUxPerfectionRuntime.js',
  'assets/js/realm3d/w170-mobile-ux-entry.js',
  'assets/css/eoncity-mobile-ux.css',
  'realmworld.html'
];
required.forEach((file) => assert.equal(fs.existsSync(file), true, `${file} missing`));
const runtime = fs.readFileSync(required[0], 'utf8');
const css = fs.readFileSync(required[2], 'utf8');
const html = fs.readFileSync('realmworld.html', 'utf8');
assert.match(runtime, /allOverlaysCloseable:\s*true/);
assert.match(runtime, /closeAllButtonRequired:\s*true/);
assert.match(runtime, /sponsorBoostMayNotCoverGameplay:\s*true/);
assert.match(runtime, /eoncity-panel-collapsed/);
assert.match(css, /safe-area-inset-bottom/);
assert.match(css, /orientation:\s*landscape/);
assert.match(html, /eoncity-mobile-ux\.css/);
assert.match(html, /w170-mobile-ux-entry\.js/);
console.log('W170 EON City mobile UX perfection gate passed');
