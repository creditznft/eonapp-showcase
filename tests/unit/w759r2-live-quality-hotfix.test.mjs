import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('R05 keeps Live Monitors available through Menu operations without permanent HUD clutter', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /makeLauncher\('Explore', 'eonCityExploreOpen'/);
  assert.match(runtime, /makeLauncher\('Menu', 'eonCityMenuOpen'/);
  assert.doesNotMatch(runtime, /makeLauncher\('Live Monitors', 'eonCityMonitorsOpen'/);
  assert.match(runtime, /data-eon-city-quick="monitors">Live Monitors/);
  assert.match(runtime, /if \(action === 'monitors'\) return onFocusMonitors\?\.\(trigger\)/);
  assert.match(runtime, /const focusCommandWall =/);
  assert.match(runtime, /applyCameraPose\(EON_CITY_W760_CAMERA_POSES\.commandWall/);
  assert.match(runtime, /commandCentre\.inspectWall\?\.\('work'\)/);
  assert.match(runtime, /actions\?\.prepend\(exploreLauncher, menuLauncher\)/);
});

test('W759R2 makes the obvious Operations Crescent controls explicitly interactive', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /commandTable\.isPickable = true; commandTable\.metadata = commandTableMetadata/);
  assert.match(runtime, /tableGlass\.isPickable = true; tableGlass\.metadata = commandTableMetadata/);
  assert.match(runtime, /alias === 'command-seat'[\s\S]{0,380}commandWallId: 'work'/);
  assert.match(runtime, /alias === 'district-hologram'[\s\S]{0,420}commandWallId: 'atlas-transit'/);
  assert.match(runtime, /alias === 'eonbot-dock'[\s\S]{0,420}enableLoadedInteraction/);
  assert.match(runtime, /dock\.isPickable = true/);
});

test('W765R4 removes procedural roaming citizens instead of presenting stick figures as finished NPCs', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const start = runtime.indexOf('function createExteriorAmbientCitizens');
  const end = runtime.indexOf('function createW744AmbientActors', start);
  const factory = runtime.slice(start, end);
  assert.match(runtime, /w759r2-procedural-skin/);
  assert.match(runtime, /const proceduralStyles = \[/);
  assert.match(runtime, /head\.material = materials\.skin/);
  assert.doesNotMatch(factory, /createProceduralPerson/);
  assert.match(factory, /authoredCharacterRequired: true/);
  assert.match(factory, /noProceduralFallback: true/);
  assert.match(runtime, /fallbackNpc\.root\.setEnabled\(false\)/);
  assert.doesNotMatch(runtime, /head\.material = accent \? materials\.accent2 : materials\.warm/);
});

test('W759R2 blends animation clips and synchronizes locomotion playback to measured displacement', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const loader = read('assets/js/city/w731/eon-city-w731-local-assets.js');
  assert.match(loader, /targeted\.animation\.enableBlending = true/);
  assert.match(loader, /targeted\.animation\.blendingSpeed = 0\.085/);
  assert.match(loader, /speedRatio = 1/);
  assert.match(loader, /active\.speedRatio = safeSpeedRatio/);
  assert.match(loader, /next\.start\?\.\(loop, safeSpeedRatio/);
  assert.match(runtime, /const locomotionAnimationSpeed = nextMotion === 'run'/);
  assert.match(runtime, /lastCharacterMotionSnapshot\.actualSpeed/);
  assert.match(runtime, /playerAsset\?\.animations\?\.play\?\.\(nextMotion, \{ speedRatio: locomotionAnimationSpeed \}\)/);
});
