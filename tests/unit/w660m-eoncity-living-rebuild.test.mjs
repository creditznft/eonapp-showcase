import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createEonCityW660mExperienceDirector,
  getEonCityW660mExperienceTruth,
  resolveEonCityW660mNpcDirective,
  resolveEonCityW660mPlayerAnimation
} from '../../assets/js/city/w660m/eon-city-w660m-experience-director.js';
import {
  EON_CITY_COMPANION_MODES,
  createEonCityCompanionDirector
} from '../../assets/js/city/eon-city-companion-director.js';
import {
  getEonCityW649AnimationProfile,
  resolveEonCityW649Clip
} from '../../assets/js/city/w649/eon-city-w649-animation-manifest.js';

const source = async (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('W660M truth keeps the living presentation local and review-first', () => {
  const truth = getEonCityW660mExperienceTruth();
  assert.equal(truth.playerIdleChoreography, true);
  assert.equal(truth.reactiveNpcRoutines, true);
  assert.equal(truth.curiousCompanion, true);
  assert.equal(truth.creatorDockSupported, true);
  assert.equal(truth.cityNexusInterestSupported, true);
  assert.equal(truth.oneBabylonOwner, true);
  assert.equal(truth.ownsRenderLoop, false);
  assert.equal(truth.autonomousAgent, false);
  assert.equal(truth.startsAiWork, false);
  assert.equal(truth.startsVoiceCapture, false);
  assert.equal(truth.opensRoutes, false);
  assert.equal(truth.readsPrivateData, false);
});

test('Pathfinder movement and standing choreography use real available clips', () => {
  assert.equal(resolveEonCityW660mPlayerAnimation({ moving: true, speed: 5 }), 'walk');
  assert.equal(resolveEonCityW660mPlayerAnimation({ moving: true, speed: 6 }), 'run');
  assert.equal(resolveEonCityW660mPlayerAnimation({ idleMs: 7_200, nearbyKind: 'terminal' }), 'interact');
  assert.equal(resolveEonCityW660mPlayerAnimation({ idleMs: 7_200, nearbyKind: 'nexus' }), 'wave');
  assert.equal(resolveEonCityW660mPlayerAnimation({ idleMs: 4_100, panelOpen: true }), 'idle-alt');

  const prime = getEonCityW649AnimationProfile('eoncity-pathfinder-prime-11clips');
  for (const state of ['idle', 'idle-alt', 'walk', 'run', 'wave', 'interact']) {
    assert.ok(prime.aliases[state], `Pathfinder Prime should expose ${state}`);
    assert.ok(resolveEonCityW649Clip(prime.characterId, state));
  }
});

test('NPC directives patrol locally and react to Pathfinder without autonomous work', () => {
  const patrol = resolveEonCityW660mNpcDirective({
    assetId: 'eon-x1-worker-9clips',
    elapsedMs: 3_900,
    playerDistance: 12
  });
  assert.ok(['walk', 'idle', 'interact'].includes(patrol.state));
  assert.equal(Number.isFinite(patrol.offsetX), true);
  assert.equal(Number.isFinite(patrol.offsetZ), true);
  assert.match(patrol.activity, /Forge workbench/);
  assert.equal(patrol.reactive, false);

  const greeting = resolveEonCityW660mNpcDirective({
    assetId: 'eoncity-eon-architect-12clips',
    elapsedMs: 8_000,
    playerDistance: 1.8,
    playerBearing: 1.2
  });
  assert.equal(greeting.state, 'wave');
  assert.equal(greeting.activity, 'acknowledging Pathfinder');
  assert.equal(greeting.reactive, true);
  assert.equal(greeting.headingOffset, 1.2);
});

test('EONBOT follows, scans physical Nexus stations and can return to its dock', () => {
  const director = createEonCityW660mExperienceDirector({ quality: 'balanced' });
  let snapshot = director.update({
    deltaSeconds: 0.016,
    moving: true,
    speed: 5,
    playerPosition: { x: 0, y: 0, z: 7 },
    playerHeading: 0
  });
  assert.equal(snapshot.playerAnimationState, 'walk');
  assert.equal(snapshot.companionMode, 'follow');

  snapshot = director.update({
    deltaSeconds: 0.016,
    moving: false,
    playerPosition: { x: 0, y: 0, z: 7 },
    playerHeading: 0,
    nearby: { type: 'nexus', id: 'orientation-nexus', position: { x: 1, y: 0, z: 7 } }
  });
  assert.equal(snapshot.companionMode, 'scan');
  assert.equal(snapshot.nearbyKind, 'nexus');

  director.setCompanionIntent('dock');
  snapshot = director.update({
    deltaSeconds: 0.05,
    moving: false,
    playerPosition: { x: -9, y: 0, z: -4.5 },
    playerHeading: 0,
    currentDistrictId: 'creator-atrium'
  });
  assert.equal(snapshot.companionMode, 'dock');
  assert.deepEqual(snapshot.companion.target, { x: -10.38, y: 0.82, z: -5.22 });
  assert.equal(snapshot.localOnly, true);
  assert.equal(snapshot.startsAiWork, false);
});

test('companion director includes dock mode and stays camera-safe/local-only', () => {
  assert.ok(EON_CITY_COMPANION_MODES.includes('dock'));
  const companion = createEonCityCompanionDirector();
  const snapshot = companion.update({
    operatorPosition: { x: 0, y: 0, z: 0 },
    dockPosition: { x: 3, y: 0.9, z: -2 },
    intent: 'dock',
    cameraPosition: { x: 8, y: 3, z: 8 },
    deltaMs: 80
  });
  assert.equal(snapshot.mode, 'dock');
  assert.deepEqual(snapshot.target, { x: 3, y: 0.9, z: -2 });
  assert.equal(snapshot.localOnly, true);
  assert.equal(snapshot.autonomousAgent, false);
  assert.equal(snapshot.microphoneRequested, false);
  assert.equal(snapshot.remoteNetwork, false);
});

test('one W660M director is wired into the maintained Babylon owner and Productive City', async () => {
  const [core, product, district, css] = await Promise.all([
    source('assets/js/city/eon-city-play-core.js'),
    source('assets/js/city/w659n/eon-city-w659n-product-layer.js'),
    source('assets/js/city/w649/eon-city-w649-district-runtime.js'),
    source('assets/css/eon-city-product-layer.css')
  ]);

  assert.match(core, /import\('\.\/w660m\/eon-city-w660m-experience-director\.js'\)/);
  assert.match(core, /experienceDirector\.update\(/);
  assert.match(core, /getExperienceSummary\(\)/);
  assert.match(core, /getW649LivingSummary\(\)/);
  assert.match(core, /experienceDirector\?\.setCompanionIntent/);
  assert.doesNotMatch(core, /setCompanionIntent\(mode[^}]+productLayer\?\.setCompanionIntent/s);

  assert.match(product, /getLivingContext/);
  assert.match(product, /data-eon-w660m-living-status/);
  assert.match(product, /requestW649NpcState/);
  assert.match(product, /createEonCityW660NexusHologram/);
  assert.match(district, /updateLivingActors/);
  assert.match(district, /resolveEonCityW660mNpcDirective/);
  assert.match(district, /getEonCityW649AnimationProfile/);
  assert.match(css, /W660M — readable living-world status/);
});
