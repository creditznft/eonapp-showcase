import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { EON_CITY_W731_STATIONS } from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import { EON_CITY_W731_LAUNCH_ASSET_MANIFEST } from '../../assets/js/city/w731/eon-city-w731-launch-asset-manifest.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('R05 keeps Share Command Center and Creator Capture in City Menu without permanent HUD clutter', () => {
  const contract = EON_CITY_W731_STATIONS.find((station) => station.id === 'share-capture');
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const share = read('assets/js/utils/eon-share-sheet.js');

  assert.equal(contract?.label, 'Share Command Center');
  assert.match(contract?.description || '', /Creator Capture/);
  assert.doesNotMatch(runtime, /makeLauncher\('Share', 'eonCityShareOpen'/);
  assert.match(runtime, /data-eon-city-quick="share">Share Command Center/);
  assert.match(runtime, /data-eon-city-quick="capture">Creator Capture/);
  assert.doesNotMatch(runtime, /data-eon-city-menu-open-share/);
  assert.doesNotMatch(runtime, /data-eon-city-menu-open-capture/);
  assert.match(runtime, /onOpenShare: \(trigger\) => openSurfaceForStation\('share-capture', trigger, 'share'\)/);
  assert.match(runtime, /onOpenCapture: \(trigger\) => openSurfaceForStation\('share-capture', trigger, 'creator-capture'\)/);
  assert.match(share, /dispatchEonWorkSurfaceOpen\(\{ id: 'creator-capture', source: 'share-command-center'/);
  assert.match(share, /context: \{ type: 'city', referralLink: true \}/);
});

test('R05 keeps Plans & Access explicit inside Menu operations and never auto-starts checkout', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const plans = read('assets/js/work-surface/adapters/eon-plans-panel.js');

  assert.match(runtime, /data-eon-city-quick="plans">Plans &amp; Access/);
  assert.match(runtime, /if \(action === 'plans'\) return onOpenStation\?\.\('plans-access', trigger, 'plans'\)/);
  assert.match(runtime, /\['nexus', 'share', 'capture', 'plans'\]\.includes\(action\)/);
  assert.match(plans, /contextual-not-advertising/);
  assert.match(plans, /explicitUserAction: true/);
  assert.match(plans, /environment\.confirm/);
});

test('W744 gives station NPCs bounded real micro-routes without walking in place', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const assets = read('assets/js/city/w731/eon-city-w731-local-assets.js');
  const completion = read('assets/js/city/w731/eon-city-w744-station-completion-contract.js');

  assert.match(runtime, /motionPolicy: blueprint\.npcRoute\.enabled \? 'bounded-station-route' : 'nexus-companion'/);
  assert.match(runtime, /locomotionAllowed: blueprint\.npcRoute\.enabled/);
  assert.match(runtime, /walkingInPlaceAllowed: false/);
  assert.match(runtime, /route\.actualDistanceTravelled \+= step/);
  assert.match(runtime, /if \(route\.moving\) setStationNpcAnimation\(record, 'walk'\)/);
  assert.match(runtime, /stationNpcBoundedMicroRoutes: true/);
  assert.match(runtime, /stationNpcWalkingInPlace: false/);
  assert.match(completion, /npcRoute: \{ enabled: true/);
  assert.match(runtime, /STATIONARY_NPC_GESTURES/);
  assert.match(runtime, /playStationary\?\.\(gesture/);
  assert.match(assets, /playStationary\(state = 'idle'/);
  assert.match(assets, /stationary: true/);
  assert.match(assets, /initialStationary: entry\.tier === 'role-lazy'/);
  assert.match(assets, /play\('idle', \{ stationary: initialStationary \}\)/);
  assert.match(assets, /\(\?:walk\|walking\|run\|running\)/);
  assert.ok(assets.indexOf("if (state !== 'idle')") < assets.indexOf('if (stationary)'));
});

test('W765R4 gives exterior citizens real authored walk/run paths with no visible procedural substitute', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const start = runtime.indexOf('function createExteriorAmbientCitizens');
  const end = runtime.indexOf('function createW744AmbientActors', start);
  const factory = runtime.slice(start, end);

  assert.match(runtime, /createExteriorAmbientCitizens/);
  assert.equal((factory.match(/motion: 'walk'/g) || []).length, 3);
  assert.equal((factory.match(/motion: 'run'/g) || []).length, 1);
  assert.match(factory, /kind: 'w765r4-authored-exterior-citizen-anchor'/);
  assert.match(factory, /zone: 'exterior'/);
  assert.match(factory, /locomotionAllowed: true/);
  assert.match(factory, /authoredCharacterRequired: true/);
  assert.match(factory, /noProceduralFallback: true/);
  assert.doesNotMatch(factory, /createProceduralPerson/);
  assert.match(runtime, /loaded\.animations\?\.play\?\.\(citizen\.motion/);
  assert.match(runtime, /if \(!isEonCityW759PresentationReady\(citizen\.loaded\)\) continue/);
  assert.match(runtime, /exteriorAmbientLocomotion: true/);
  assert.match(runtime, /exteriorAmbientCitizenCount/);
});

test('W742 cast replacement remains part of the maintained Command Hub provenance', () => {
  assert.match(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.version, /^(?:74[3-9]|75[0-9])\./);
  assert.match(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.cacheVersion, /^eon-city-(?:command-centre|living-nexus-command-core)-w(?:74[3-9]|75[0-9])-/);
});
