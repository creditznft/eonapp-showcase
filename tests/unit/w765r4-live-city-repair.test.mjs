import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  EON_CITY_W731_LAUNCH_ASSET_MANIFEST,
  validateEonCityW731LaunchAssetManifest
} from '../../assets/js/city/w731/eon-city-w731-launch-asset-manifest.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('W765R4 restores correct left/right movement and always settles Pathfinder to idle', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /ArrowLeft: 'left'.*ArrowRight: 'right'/s);
  assert.match(runtime, /resolveEonCityCameraRelativeMovement/);
  assert.match(runtime, /inputRight:\s*input\.right/);
  assert.doesNotMatch(runtime, /const right = new Vector3\(-forward\.z, 0, forward\.x\)/);
  assert.match(runtime, /const forcePlayerIdle = \(reason = 'movement-stopped'\)/);
  assert.match(runtime, /forcePlayerIdle\(releaseReason \|\| 'movement-inactive'\)/);
  assert.match(runtime, /forcePlayerIdle\(reason\)/);
  assert.match(runtime, /playStationary\?\.\('idle', \{ restart: true \}\)/);
});

test('W765R4 permits only authored roaming citizens or an empty anchor', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const start = runtime.indexOf('function createExteriorAmbientCitizens');
  const end = runtime.indexOf('function createW744AmbientActors', start);
  const citizenFactory = runtime.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.doesNotMatch(citizenFactory, /createProceduralPerson/);
  assert.match(citizenFactory, /authoredCharacterRequired: true/);
  assert.match(citizenFactory, /noProceduralFallback: true/);
  assert.match(runtime, /fallbackNpc\.root\.setEnabled\(false\)/);
  assert.doesNotMatch(runtime, /animated\.push\(\{ node: npcAnchor, kind: 'npc-idle'/);
  assert.match(runtime, /proceduralExteriorAmbientCitizenVisible: false/);
  assert.match(runtime, /maintenanceWorkerVisible: isEonCityW759PresentationReady/);
  assert.match(runtime, /maintenanceFallback\.root\.setEnabled\(false\)/);
  assert.match(runtime, /if \(!isEonCityW759PresentationReady\(citizen\.loaded\)\) continue/);

  const aliases = EON_CITY_W731_LAUNCH_ASSET_MANIFEST.ambientAssets.map((entry) => entry.alias);
  assert.deepEqual(aliases.slice(-4), [
    'ambient-citizen-north',
    'ambient-citizen-east',
    'ambient-citizen-south',
    'ambient-citizen-west'
  ]);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.truth.proceduralAmbientCitizensVisible, false);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.truth.authoredAmbientCitizensOrNone, true);
  assert.equal(validateEonCityW731LaunchAssetManifest().ok, true);
});

test('W765R5 renders a readable slab-free five-screen wall and focuses it from the Live Monitors action', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const wall = read('assets/js/city/w750/eon-city-w750-command-centre.js');
  assert.match(runtime, /DynamicTexture/);
  assert.match(runtime, /commandWall: freeze\(/);
  assert.match(runtime, /target: freeze\(\{ x: -13\.5, y: 3\.37, z: -12\.6 \}\)/);
  assert.match(runtime, /onFocusMonitors: focusCommandWall/);
  assert.match(runtime, /commandCentre\.inspectWall\?\.\('work'\)/);
  assert.match(wall, /createSafeMonitorTexture/);
  assert.match(wall, /paintMonitor/);
  assert.match(wall, /width: 5\.55, height: 3\.2, central: true/);
  assert.match(wall, /width: 4\.05, height: 2\.45/);
  assert.match(wall, /frameRails/);
  assert.doesNotMatch(wall, /CreateBox\(`w750-wall-frame-\$\{id\}`/);
  assert.match(wall, /visibleBackingSlab: false/);
  assert.match(wall, /sideOrientation: 0/);
  assert.match(wall, /screen\.position\.z = faceSpec\.positionZ/);
  assert.match(wall, /screen\.rotation\.y = faceSpec\.rotationY/);
  assert.match(wall, /dualReadableFaces/);
  assert.match(wall, /independentTextures/);
  assert.match(wall, /sameWorkspaceInteraction/);
  assert.doesNotMatch(wall, /sideOrientation: 2/);
  assert.match(wall, /theatreStage\.position\.set\(0, 0\.04, 0\.11\)/);
  assert.match(wall, /▲ UPRIGHT/);
  assert.equal((wall.match(/id: '(?:work|review|systems|atlas-transit|agent-theatre)'/g) || []).length >= 5, true);
  assert.match(wall, /No verified activity to display/);
  assert.match(wall, /REVIEW FIRST/);
});

test('W765R4 hardens labels and menu buttons against white native-button CSS fallbacks', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const css = read('assets/css/eon-city-play.css');
  assert.match(runtime, /dataset\.distanceBand/);
  assert.match(runtime, /markButtonResponse/);
  assert.match(runtime, /button\.style\.setProperty\('appearance', 'none', 'important'\)/);
  assert.match(runtime, /linear-gradient\(145deg,rgba\(4,18,28,\.96\),rgba\(10,28,31,\.94\)\)/);
  assert.match(css, /W765R4 — live City interaction and label repair/);
  assert.match(css, /button\[data-eon-city-label-id\]/);
  assert.match(css, /appearance:none!important/);
  assert.match(css, /background:linear-gradient\(145deg,rgba\(4,18,28/);
  assert.match(css, /\[data-eon-city-action-state="responding"\]/);
  assert.match(css, /button:focus-visible/);
});
