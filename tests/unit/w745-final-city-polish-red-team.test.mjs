import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_W731_STATIONS,
  EON_CITY_W737_DISCOVERIES,
  validateEonCityW731CommandHubContract
} from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import {
  EON_CITY_W731_LAUNCH_ASSET_MANIFEST,
  EON_CITY_W747_RUNTIME_PROVENANCE,
  validateEonCityW731LaunchAssetManifest
} from '../../assets/js/city/w731/eon-city-w731-launch-asset-manifest.js';
import {
  EON_CITY_W744_STATION_BLUEPRINTS,
  validateEonCityW744StationCompletion
} from '../../assets/js/city/w731/eon-city-w744-station-completion-contract.js';
import {
  EON_CITY_W745_COMPANION_STATES,
  EON_CITY_W745_PLAYER_IDLE_STATES,
  EON_CITY_W745_PUBLIC_COMPANION_TARGETS,
  createEonCityW745HeroPresentationDirector,
  getEonCityW745HeroPresentationTruth
} from '../../assets/js/city/w731/eon-city-w745-hero-companion-polish.js';
import { EON_CITY_W649_WORLD_MANIFEST } from '../../assets/js/city/w649/eon-city-w649-world-manifest.js';
import { getEonWorkSurfaceDefinition } from '../../assets/js/work-surface/eon-work-surface-registry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const routeFile = (href) => {
  const pathname = String(href || '/').split(/[?#]/)[0];
  if (pathname === '/') return 'index.html';
  return `${pathname.replace(/^\//, '').replace(/\/$/, '')}.html`;
};

test('W745 gives EONBOT a complete bounded curiosity cycle instead of a stiff orbit', () => {
  let clock = 0;
  const director = createEonCityW745HeroPresentationDirector({ now: () => clock });
  const base = { playerPosition: { x: 0, z: 1 }, companionPosition: { x: 1, z: 1 }, nearestStationId: 'eonbot-nexus' };

  clock = 500;
  assert.equal(director.update({ ...base, moving: true }).companionState, 'formation-follow');
  clock = 3_500;
  assert.equal(director.update({ ...base, moving: false }).companionState, 'scout-structure');
  clock = 7_200;
  assert.equal(director.update({ ...base, moving: false }).companionState, 'inspect-terminal');
  clock = 8_900;
  assert.equal(director.update({ ...base, moving: false }).companionState, 'greet-host');
  clock = 11_000;
  assert.equal(director.update({ ...base, moving: false }).companionState, 'nexus-spiral');
  clock = 13_800;
  assert.equal(director.update({ ...base, moving: false }).companionState, 'circuit-scan');
  clock = 16_600;
  assert.equal(director.update({ ...base, moving: false }).companionState, 'playful-loop');
  clock = 19_000;
  assert.equal(director.update({ ...base, moving: false }).companionState, 'dock-check');
  clock = 21_200;
  assert.equal(director.update({ ...base, moving: false }).companionState, 'return-formation');

  const truth = getEonCityW745HeroPresentationTruth();
  assert.deepEqual(truth.companionModes, EON_CITY_W745_COMPANION_STATES);
  assert.equal(truth.nonStaticCompanionIdle, true);
  assert.equal(truth.boundedPublicScouting, true);
  assert.equal(truth.visualDockVisitOnly, true);
  assert.equal(truth.automaticStationActivation, false);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.autonomousAgent, false);
});

test('W745 uses Pathfinder Prime idle variants and gestures without walking in place', () => {
  let clock = 0;
  const director = createEonCityW745HeroPresentationDirector({ now: () => clock });
  const input = { moving: false, playerPosition: { x: 0, z: 1 }, companionPosition: { x: 1, z: 1 } };
  clock = 3_000;
  assert.equal(director.update(input).playerIdleState, 'idle-alt');
  clock = 7_000;
  assert.equal(director.update(input).playerIdleState, 'inspect');
  clock = 14_000;
  assert.equal(director.update(input).playerIdleState, 'pose');
  clock = 20_500;
  assert.equal(director.update(input).playerIdleState, 'wave');
  assert.deepEqual(getEonCityW745HeroPresentationTruth().playerIdleModes, EON_CITY_W745_PLAYER_IDLE_STATES);

  const pathfinder = EON_CITY_W731_LAUNCH_ASSET_MANIFEST.coreLazy.find((entry) => entry.alias === 'player-primary');
  assert.ok(pathfinder);
  assert.ok(pathfinder.animations.includes('Idle_02'));
  assert.ok(pathfinder.animations.includes('Idle_11'));
  assert.ok(pathfinder.animations.includes('Hand_on_Hip_Gesture'));
  assert.ok(pathfinder.animations.includes('Lower_Weapon_Look_Raise'));

  const loader = read('assets/js/city/w731/eon-city-w731-local-assets.js');
  assert.match(loader, /'idle-alt': \[\/\^idle_\?11\$\/i/);
  assert.match(loader, /inspect: \[\/lower\.\?weapon\.\?look\.\?raise\/i/);
  assert.match(loader, /pose: \[\/hand\.\?on\.\?hip\/i/);
  assert.match(loader, /const loop = \['idle', 'idle-alt', 'walk', 'run'\]/);
  assert.match(loader, /onAnimationGroupEndObservable\?\.addOnce/);
  assert.match(loader, /play\('idle', \{ restart: true, stationary: true \}\)/);
});

test('W745 runtime animates EONBOT scan effects, playful movement and live circuit pulses', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /w745-eonbot-scan-halo/);
  assert.match(runtime, /w745-eonbot-scan-beam/);
  assert.match(runtime, /w745-eonbot-spark-a/);
  assert.match(runtime, /w745-eonbot-spark-b/);
  assert.match(runtime, /maxScoutDistanceFromPlayer/);
  assert.match(runtime, /formationTarget/);
  assert.match(runtime, /state === 'nexus-spiral'/);
  assert.match(runtime, /state === 'circuit-scan'/);
  assert.match(runtime, /state === 'greet-host'/);
  assert.match(runtime, /state === 'playful-loop'/);
  assert.match(runtime, /state === 'dock-check'/);
  assert.match(runtime, /playStationary\?\.\(nextPresentation/);
  assert.match(runtime, /w745-circuit-data-pulse-/);
  assert.match(runtime, /animatedCircuitPulseCount/);
  assert.match(runtime, /playerNonStaticIdle/);
  assert.match(runtime, /eonbotAutomaticStationActivation: false/);
  assert.match(runtime, /eonbotAutonomousAgent: false/);
  assert.doesNotMatch(runtime, /automaticStationActivation: true|automaticNavigation: true|automaticDocking: true/);
  assert.match(runtime, /simpleOrbitRetired: true/);
  assert.match(runtime, /presentation: 'w745-curiosity-director'/);
});

test('W745 final CEO audit keeps every station meaningful, interactive and routed to a real surface', () => {
  assert.equal(validateEonCityW731CommandHubContract().ok, true);
  assert.equal(validateEonCityW731LaunchAssetManifest().ok, true);
  assert.equal(validateEonCityW744StationCompletion({ stations: EON_CITY_W731_STATIONS, launchManifest: EON_CITY_W731_LAUNCH_ASSET_MANIFEST }).ok, true);
  assert.equal(EON_CITY_W731_STATIONS.length, 10);
  assert.equal(EON_CITY_W744_STATION_BLUEPRINTS.length, 10);
  assert.equal(EON_CITY_W745_PUBLIC_COMPANION_TARGETS.length, 34);
  assert.equal(EON_CITY_W745_PUBLIC_COMPANION_TARGETS.filter((entry) => entry.kind === 'npc').length, 9);
  assert.equal(EON_CITY_W745_PUBLIC_COMPANION_TARGETS.filter((entry) => entry.kind === 'dock').length, 1);
  assert.equal(EON_CITY_W745_PUBLIC_COMPANION_TARGETS.filter((entry) => ['structure', 'terminal', 'npc'].includes(entry.kind)).every((entry) => entry.safeApproach === true), true);

  for (const station of EON_CITY_W731_STATIONS) {
    const blueprint = EON_CITY_W744_STATION_BLUEPRINTS.find((entry) => entry.id === station.id);
    assert.ok(blueprint, `${station.id} blueprint`);
    assert.deepEqual(blueprint.interactions, ['structure', 'terminal', 'npc']);
    assert.ok(station.description.length >= 20, `${station.id} purpose`);
    assert.ok(station.npc.name && station.npc.role && station.npc.greeting && station.npc.action, `${station.id} NPC contract`);
    const structureTarget = EON_CITY_W745_PUBLIC_COMPANION_TARGETS.find((entry) => entry.id === `${station.id}:structure`);
    assert.ok(structureTarget, `${station.id} structure scout target`);
    assert.ok(Math.hypot(structureTarget.position.x - station.position.x, structureTarget.position.z - station.position.z) >= 3, `${station.id} structure target avoids geometry origin`);
    const surface = getEonWorkSurfaceDefinition(station.surface);
    assert.equal(surface.id, station.surface);
    assert.equal(fs.existsSync(path.join(root, routeFile(surface.fallbackHref))), true, `${station.id} route`);
  }

  assert.equal(EON_CITY_W737_DISCOVERIES.length, 3);
  assert.equal(EON_CITY_W731_STATIONS.find((entry) => entry.id === 'command-console')?.npc.name, 'Orin Sentinel');
  assert.equal(EON_CITY_W731_STATIONS.find((entry) => entry.id === 'share-capture')?.label, 'Share Command Center');
  assert.equal(EON_CITY_W731_STATIONS.find((entry) => entry.id === 'plans-access')?.label, 'Plans & Access');
});

test('W745 final asset audit assigns every active ready world asset and excludes unsafe static candidates', () => {
  const assigned = new Set([
    ...EON_CITY_W731_LAUNCH_ASSET_MANIFEST.coreLazy,
    ...EON_CITY_W731_LAUNCH_ASSET_MANIFEST.coreWorld,
    ...EON_CITY_W731_LAUNCH_ASSET_MANIFEST.stationWorld,
    ...EON_CITY_W731_LAUNCH_ASSET_MANIFEST.stationProps,
    ...EON_CITY_W731_LAUNCH_ASSET_MANIFEST.discoveryWorld,
    ...EON_CITY_W731_LAUNCH_ASSET_MANIFEST.roleCharacters,
    ...EON_CITY_W731_LAUNCH_ASSET_MANIFEST.ambientAssets
  ].map((entry) => entry.sourceId));
  const readyWorld = EON_CITY_W649_WORLD_MANIFEST.entries
    .filter((entry) => entry.lifecycle === 'active' && String(entry.status || '').startsWith('READY'))
    .map((entry) => entry.id);
  const retiredReadyWorldIds = new Set(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.truth.retiredReadyWorldAssetIds || []);
  assert.deepEqual(readyWorld.filter((id) => !assigned.has(id) && !retiredReadyWorldIds.has(id)), []);
  assert.deepEqual([...retiredReadyWorldIds], ['eoncity-orientation-hall']);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.truth.inactiveStaticCandidatesExcluded, true);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.truth.eonbotSimpleOrbitRetired, true);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.truth.heroPresentationDirector, 'w745');
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.truth.eonbotStationHostGreetings, true);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.truth.eonbotVisualDockVisitOnly, true);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.truth.pathfinderNonStaticIdle, true);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.truth.pathfinderOneShotIdleRecovery, true);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.truth.animatedCircuitDataPulses, true);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.roleCharacters.some((entry) => entry.alias === 'architect'), false);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.ambientAssets.some((entry) => entry.sourceId === 'eoncity-street-lamp'), true);
});

test('W745 cache authority and deployment boundary are explicit for Codex', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const sw = read('sw.js');
  assert.equal(EON_CITY_W747_RUNTIME_PROVENANCE, 'eon-city-living-nexus-command-core-w757-1');
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.version, '757.0.0');
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.cacheVersion, EON_CITY_W747_RUNTIME_PROVENANCE);
  assert.match(sw, /RELEASE_ID = 'w765-2026-07-31-release-identity-source-template'/);
  assert.match(sw, /CITY_RUNTIME_PROVENANCE = 'eon-city-living-nexus-command-core-w757-1'/);
  assert.equal(sw, read('public/sw.js'));
  assert.match(runtime, /EON_CITY_W731_LAUNCH_ASSET_MANIFEST\.cacheVersion !== EON_CITY_W757_RUNTIME_PROVENANCE/);
  assert.doesNotMatch(runtime, /wrangler pages deploy|git push|automaticPosting: true|checkoutAutomatic: true/);
});
