import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const vfx = read('assets/js/city/rt92/eon-city-rt92-cinematic-vfx-art.js');
const hub = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
const signal = read('assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js');
const storm = read('assets/js/city/w792/eon-expanse-w792c-storm-sector-presenter.js');
const frontier = read('assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js');
const artDir = path.join(root, 'assets/city/art/rt92');
const manifest = JSON.parse(read('assets/city/art/rt92/manifest.json'));

test('RT92 Wave 8 ships lightweight original vector key art and glyphs inside budget', () => {
  assert.equal(manifest.schema, 'eon.city.rt92.vector-art.v1');
  assert.ok(manifest.fileCount >= 24);
  assert.ok(manifest.totalBytes > 20_000 && manifest.totalBytes < 300_000);
  for (const file of ['world-command-hub.svg', 'world-signal-frontier.svg', 'world-storm-sector.svg', 'world-my-frontier.svg']) {
    assert.ok(manifest.files.includes(file));
    const svg = fs.readFileSync(path.join(artDir, file), 'utf8');
    assert.match(svg, /viewBox="0 0 1200 675"/);
    assert.match(svg, /<title/);
    assert.doesNotMatch(svg, /\b(?:href|src)=[\"']https?:\/\//i);
  }
});

test('Command menu uses RT92 world key art without eager binary payload', () => {
  for (const file of ['world-signal-frontier.svg', 'world-storm-sector.svg', 'world-my-frontier.svg']) {
    assert.match(hub, new RegExp(`/assets/city/art/rt92/${file.replace('.', '\\.')}`));
  }
  assert.match(hub, /loading="lazy"/);
});

test('RT92 cinematic VFX is presentation-only, bounded by quality and owns no camera or loop', () => {
  for (const worldId of ['command-hub', 'signal-frontier', 'storm-sector', 'my-frontier']) assert.match(vfx, new RegExp(`'${worldId}'\\s*:`));
  assert.match(vfx, /lite:\s*freeze\(\{ rings: 1, motes: 4, fins: 2 \}\)/);
  assert.match(vfx, /balanced:\s*freeze\(\{ rings: 2, motes: 8, fins: 3 \}\)/);
  assert.match(vfx, /cinematic:\s*freeze\(\{ rings: 3, motes: 12, fins: 4 \}\)/);
  for (const claim of ['ownsCamera: false', 'ownsEngine: false', 'ownsScene: false', 'ownsRenderLoop: false', 'ownsNavigation: false', 'ownsCollision: false', 'writesProgression: false']) assert.ok(vfx.includes(claim), claim);
  assert.doesNotMatch(vfx, /runRenderLoop|new Engine|new Scene|localStorage|sessionStorage|fetch\(/);
  assert.match(vfx, /firstFrameNewBinaryBytes:\s*0/);
  assert.match(vfx, /externalTextures:\s*0/);
});

test('all four maintained world lifecycles mount, update, suspend and dispose Wave 8 VFX', () => {
  assert.match(hub, /mountEonCityRt92CinematicVfxArt/);
  assert.match(hub, /world\.rt92CinematicVfx\?\.update/);
  assert.match(hub, /world\.rt92CinematicVfx\?\.dispose/);
  assert.match(signal, /worldId:\s*'signal-frontier'/);
  assert.match(signal, /rt92CinematicVfx\?\.update/);
  assert.match(signal, /rt92CinematicVfx\?\.deactivate/);
  assert.match(signal, /rt92CinematicVfx\?\.dispose/);
  assert.match(storm, /worldId:\s*'storm-sector'/);
  assert.match(storm, /rt92CinematicVfx\?\.update/);
  assert.match(storm, /rt92CinematicVfx\?\.deactivate/);
  assert.match(storm, /rt92CinematicVfx\?\.dispose/);
  assert.match(frontier, /worldId:\s*'my-frontier'/);
  assert.match(frontier, /rt92CinematicVfx\?\.update/);
  assert.match(frontier, /rt92CinematicVfx\?\.deactivate/);
  assert.match(frontier, /rt92CinematicVfx\?\.dispose/);
});
