import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('RT96 user-facing work surfaces do not mount ordinary display advertising', () => {
  for (const page of ['apps.html', 'create.html', 'projects.html', 'eoncity.html']) {
    const html = read(page);
    assert.doesNotMatch(html, /data-eon-sponsored-slot/);
    assert.doesNotMatch(html, /assets\/js\/monetization\/eon-display-slot\.js/);
  }
});

test('RT96 production keeps Sponsor Terminal separate from ordinary display inventory', () => {
  const wrangler = JSON.parse(read('wrangler.jsonc'));
  const env = wrangler.env.production.vars;
  assert.equal(env.EON_DISPLAY_ADS_ENABLED, 'false');
  assert.equal(env.EON_EXOCLICK_ENABLED, 'false');
  assert.equal(env.EON_EXOCLICK_NATIVE_ENABLED, 'false');
  assert.equal(env.EON_EXOCLICK_MULTIFORMAT_ENABLED, 'false');
  assert.equal(env.EON_EXOCLICK_OUTSTREAM_ENABLED, 'false');
  assert.equal(env.EON_SPONSOR_VIDEO_ENABLED, 'true');
  assert.equal(env.EON_REWARDED_ADS_ENABLED, 'true');
});

test('RT96 rewards disclosure states the no-banner boundary', () => {
  const html = read('rewards.html');
  assert.match(html, /Ordinary display ads are disabled in EONAPP/);
  assert.match(html, /voluntarily open the Sponsor Terminal for rewarded video/);
});
