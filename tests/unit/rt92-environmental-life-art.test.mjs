import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const shared = read('assets/js/city/rt92/eon-city-rt92-environmental-life-art.js');
const hub = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
const signal = read('assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js');
const storm = read('assets/js/city/w792/eon-expanse-w792c-storm-sector-presenter.js');
const frontier = read('assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js');

test('RT92 Wave 7 declares service life for every canonical EONCITY world', () => {
  for (const worldId of ['command-hub', 'signal-frontier', 'storm-sector', 'my-frontier']) {
    assert.match(shared, new RegExp(`'${worldId}'\\s*:\\s*freeze\\(\\[`));
  }
  assert.match(shared, /QUALITY_LIMITS\s*=\s*freeze\(\{\s*lite:\s*2,\s*balanced:\s*4,\s*cinematic:\s*6\s*\}\)/);
});

test('RT92 environmental life adds designed robots and never procedural human bodies', () => {
  for (const type of ['spider', 'drone', 'cart', 'scanner', 'service']) assert.match(shared, new RegExp(`type: '${type}'`));
  assert.match(shared, /authoredHumanNpc:\s*false/);
  assert.match(shared, /proceduralHumanNpcCount:\s*0/);
  assert.match(shared, /authoredHumanNpcCount:\s*0/);
  assert.doesNotMatch(shared, /type:\s*['"]human['"]/i);
  assert.doesNotMatch(shared, /type:\s*['"]citizen['"]/i);
});

test('RT92 service life is cosmetic and owns no collision, navigation, progression, scene, engine or loop', () => {
  assert.match(shared, /mesh\.isPickable\s*=\s*false/);
  assert.match(shared, /mesh\.checkCollisions\s*=\s*false/);
  for (const claim of ['ownsEngine: false', 'ownsScene: false', 'ownsRenderLoop: false', 'ownsNavigation: false', 'ownsCollision: false', 'writesProgression: false']) {
    assert.ok(shared.includes(claim), `missing safety claim ${claim}`);
  }
  assert.match(shared, /firstFrameNewBinaryBytes:\s*0/);
  assert.match(shared, /externalTextures:\s*0/);
  assert.doesNotMatch(shared, /runRenderLoop|new Engine|new Scene|fetch\(|localStorage|sessionStorage/);
});

test('Command Hub integrates RT92 environmental life under its canonical runtime', () => {
  assert.match(hub, /mountEonCityRt92EnvironmentalLifeArt/);
  assert.match(hub, /worldId:\s*'command-hub'/);
  assert.match(hub, /world\.rt92EnvironmentalLife\?\.update/);
  assert.match(hub, /world\.rt92EnvironmentalLife\?\.dispose/);
  // Preserve the existing authored-character layer; Wave 7 is additive service life, not a replacement population.
  assert.match(hub, /ambientCitizens/);
  assert.match(hub, /ambientActors/);
});

test('Signal service life is deferred until explicit Signal world mount', () => {
  const deferredStart = signal.indexOf('const mountDeferredSignalWorld');
  const mount = signal.indexOf("worldId: 'signal-frontier'");
  assert.ok(deferredStart >= 0 && mount > deferredStart, 'Signal environmental life must stay behind deferred Signal mount');
  assert.match(signal, /rt92EnvironmentalLife\?\.applyState\?\.\(\{ active: true/);
  assert.match(signal, /rt92EnvironmentalLife\?\.setActive\?\.\(false\)/);
  assert.match(signal, /rt92EnvironmentalLife\?\.update\?\.\(seconds\)/);
  assert.match(signal, /rt92EnvironmentalLife\?\.dispose/);
});

test('Storm service life shares W792C activation and suspension lifecycle', () => {
  assert.match(storm, /worldId:\s*'storm-sector'/);
  assert.match(storm, /rt92EnvironmentalLife\.applyState\?\.\(\{ active: true/);
  assert.match(storm, /hazardSeverity:\s*2/);
  assert.match(storm, /rt92EnvironmentalLife\?\.setActive\?\.\(false\)/);
  assert.match(storm, /rt92EnvironmentalLife\?\.update\?\.\(seconds\)/);
  assert.match(storm, /rt92EnvironmentalLife\?\.dispose/);
});

test('My Frontier service life follows unlock state and real operational district activity', () => {
  assert.match(frontier, /worldId:\s*'my-frontier'/);
  assert.match(frontier, /activityLevel:\s*Math\.min\(4, operationalCount\)/);
  assert.match(frontier, /rt92EnvironmentalLife\?\.setActive\?\.\(active && unlocked\)/);
  assert.match(frontier, /rt92EnvironmentalLife\?\.setActive\?\.\(false\)/);
  assert.match(frontier, /rt92EnvironmentalLife\?\.update/);
  assert.match(frontier, /rt92EnvironmentalLife\?\.dispose/);
});
