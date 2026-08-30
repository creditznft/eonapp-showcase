import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

test('W149 exposes simple launch verification and Codex deploy prep scripts', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(read('scripts/w149-launch-verification.mjs'), /eonapp\.w149\.ceo-launch-verification\.v1/);
  assert.match(pkg.scripts['qa:w149-ceo-launch-verification'], /w149-launch-verification\.mjs/);
  assert.match(pkg.scripts['qa:w149-ceo-launch-verification:server'], /--server=1/);
  assert.match(pkg.scripts['qa:codex-deploy-prep'], /qa:w149-ceo-launch-verification/);
});

test('W149 keeps Cloudflare header and redirect source files synchronized', () => {
  assert.equal(read('_headers'), read('public/_headers'));
  assert.equal(read('_redirects'), read('public/_redirects'));
  const headers = read('_headers');
  assert.equal((headers.match(/^\/reward-access\.html$/gm) || []).length, 1);
  assert.match(headers, /\/telegram\r?\n[\s\S]*! X-Frame-Options[\s\S]*frame-ancestors[^\r\n]*web\.telegram\.org/);
  assert.match(headers, /\/reward-access\.html\r?\n[\s\S]*https:\/\/libtl\.com[\s\S]*frame-ancestors[^\r\n]*web\.telegram\.org/);
});

test('W149 keeps Telegram canonical URL and Monetag rewarded SDK call shape aligned', () => {
  assert.match(read('telegram.html'), /<link rel="canonical" href="https:\/\/eonapp\.ch\/telegram"/);
  assert.doesNotMatch(read('assets/js/utils/telegram-growth-rewards.js'), /telegram\.html/);
  assert.match(read('assets/js/ads/config.js'), /zoneId: '11111741'/);
  assert.match(read('assets/js/ads/config.js'), /sdkFunctionName: 'show_11111741'/);
  assert.match(read('assets/js/ads/monetag-rewarded.js'), /window\)\[cfg\.sdkFunctionName\]/);
  assert.match(read('assets/js/ads/monetag-rewarded.js'), /type: 'end'/);
  assert.match(read('assets/js/ads/monetag-rewarded.js'), /type: 'pop'/);
});
