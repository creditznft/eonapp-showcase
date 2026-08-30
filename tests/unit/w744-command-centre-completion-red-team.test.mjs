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
  EON_CITY_W744_CHARACTER_REPLACEMENTS,
  EON_CITY_W747_RUNTIME_PROVENANCE,
  validateEonCityW731LaunchAssetManifest
} from '../../assets/js/city/w731/eon-city-w731-launch-asset-manifest.js';
import {
  EON_CITY_W744_STATION_BLUEPRINTS,
  getEonCityW744StationBlueprint,
  validateEonCityW744StationCompletion
} from '../../assets/js/city/w731/eon-city-w744-station-completion-contract.js';
import { EON_CITY_W649_WORLD_MANIFEST } from '../../assets/js/city/w649/eon-city-w649-world-manifest.js';
import { getEonWorkSurfaceDefinition } from '../../assets/js/work-surface/eon-work-surface-registry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const routeFile = (href) => {
  const pathname = String(href || '/').split(/[?#]/)[0];
  if (pathname === '/') return 'index.html';
  return `${pathname.replace(/^\//, '').replace(/\/$/, '')}.html`;
};

test('W744 completes all ten stations as structure-terminal-NPC micro-locations', () => {
  assert.equal(validateEonCityW731CommandHubContract().ok, true);
  assert.equal(validateEonCityW731LaunchAssetManifest().ok, true);
  assert.deepEqual(
    validateEonCityW744StationCompletion({ stations: EON_CITY_W731_STATIONS, launchManifest: EON_CITY_W731_LAUNCH_ASSET_MANIFEST }),
    { ok: true, errors: [], stationCount: 10, blueprintCount: 10 }
  );
  assert.equal(EON_CITY_W744_STATION_BLUEPRINTS.length, 10);
  for (const blueprint of EON_CITY_W744_STATION_BLUEPRINTS) {
    assert.ok(blueprint.structureAssetId, `${blueprint.id} structure`);
    assert.ok(blueprint.terminalAssetId, `${blueprint.id} terminal`);
    assert.ok(blueprint.npcAlias, `${blueprint.id} NPC`);
    assert.deepEqual(blueprint.interactions, ['structure', 'terminal', 'npc']);
    const structureEntry = blueprint.id === 'eonbot-nexus'
      ? EON_CITY_W731_LAUNCH_ASSET_MANIFEST.coreWorld.find((entry) => entry.alias === 'living-nexus-core')
      : EON_CITY_W731_LAUNCH_ASSET_MANIFEST.stationWorld.find((entry) => entry.stationId === blueprint.id);
    const terminalEntry = EON_CITY_W731_LAUNCH_ASSET_MANIFEST.stationProps.find((entry) => entry.stationId === blueprint.id);
    assert.equal(EON_CITY_W731_STATIONS.find((station) => station.id === blueprint.id)?.assetId, blueprint.structureAssetId, `${blueprint.id} station structure authority`);
    assert.equal(structureEntry?.sourceId, blueprint.structureAssetId, `${blueprint.id} exact structure asset`);
    assert.equal(terminalEntry?.sourceId, blueprint.terminalAssetId, `${blueprint.id} exact terminal asset`);
    assert.ok(blueprint.lighting.beacons >= 2);
    if (blueprint.id !== 'eonbot-nexus') {
      assert.equal(blueprint.npcRoute.enabled, true);
      assert.ok(blueprint.npcRoute.radius > 0 && blueprint.npcRoute.radius <= 1.35);
      assert.ok(blueprint.npcRoute.speed > 0);
    }
  }
});

test('W744 corrects the Command Status station, route and rejected coat character', () => {
  const station = EON_CITY_W731_STATIONS.find((entry) => entry.id === 'command-console');
  const blueprint = getEonCityW744StationBlueprint('command-console');
  const panel = read('assets/js/work-surface/adapters/eon-productivity-panel.js');
  const statusSection = panel.slice(panel.indexOf('function renderCommandStatus'), panel.indexOf('function renderAutomations'));

  assert.equal(station?.label, 'Command Status');
  assert.equal(station?.surface, 'command-status');
  assert.equal(station?.assetId, 'eoncity-holo-interface-landmark');
  assert.equal(station?.npc.name, 'Orin Sentinel');
  assert.equal(blueprint?.npcAlias, 'security-sentinel');
  assert.deepEqual(EON_CITY_W744_CHARACTER_REPLACEMENTS, [{
    stationId: 'command-console',
    rejectedAlias: 'architect',
    replacementAlias: 'security-sentinel',
    reason: 'owner-observed coat deformation at the Command Status station',
    scope: 'launch-role-only'
  }]);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.roleCharacters.some((entry) => entry.alias === 'architect'), false);
  assert.equal(getEonWorkSurfaceDefinition('command-status').fallbackHref, '/projects');
  assert.doesNotMatch(statusSection, /\/workspace|advanced workspace/i);
  assert.match(statusSection, /href="\/projects"/);
  assert.match(statusSection, /href="\/automations"/);
});

test('W744 station and work-surface routing has no missing local page', () => {
  for (const station of EON_CITY_W731_STATIONS) {
    const definition = getEonWorkSurfaceDefinition(station.surface);
    assert.equal(definition.id, station.surface);
    const file = routeFile(definition.fallbackHref);
    assert.equal(fs.existsSync(path.join(root, file)), true, `${station.id} fallback ${file}`);
  }
  for (const id of ['creator-capture', 'share', 'plans']) {
    const file = routeFile(getEonWorkSurfaceDefinition(id).fallbackHref);
    assert.equal(fs.existsSync(path.join(root, file)), true, `${id} fallback ${file}`);
  }
});

test('W744 assigns content-hashed authored structures, terminals, role NPCs and ambient assets within budgets', () => {
  const manifest = EON_CITY_W731_LAUNCH_ASSET_MANIFEST;
  assert.equal(manifest.stationWorld.length, 9);
  assert.equal(manifest.stationProps.length, 10);
  assert.equal(manifest.roleCharacters.length, 9);
  assert.equal(manifest.ambientAssets.length, 7);
  assert.equal(manifest.ambientAssets.filter((entry) => entry.kind === 'character' && entry.noProceduralFallback === true).length, 4);
  assert.equal(manifest.truth.allStationsHaveStructureTerminalNpcTriad, true);
  assert.equal(manifest.truth.rejectedCommandStatusArchitectExcluded, true);
  const allEntries = [
    ...manifest.coreLazy, ...manifest.coreWorld, ...manifest.stationWorld, ...manifest.stationProps,
    ...manifest.discoveryWorld, ...manifest.roleCharacters, ...manifest.ambientAssets
  ];
  for (const entry of allEntries) {
    for (const variant of Object.values(entry.variants)) {
      assert.match(variant.path, /^\/assets\/city\/w649\/(?:primary|fallback)\/(?:characters|world)\/[^/]+\.[a-f0-9]{12}\.glb$/i);
    }
  }
  assert.ok(manifest.budgets.lite.maxResidentAssets >= 20);
  assert.ok(manifest.budgets.balanced.maxResidentAssets >= 42);
  assert.ok(manifest.budgets.cinematic.maxResidentAssets >= 42);
});



test('W744 outside Command Centre discoveries use exact authored assets and stay bounded', () => {
  assert.equal(EON_CITY_W737_DISCOVERIES.length, 3);
  const discoveryById = new Map(EON_CITY_W737_DISCOVERIES.map((entry) => [entry.id, entry]));
  for (const entry of EON_CITY_W731_LAUNCH_ASSET_MANIFEST.discoveryWorld) {
    const discovery = discoveryById.get(entry.alias.replace(/-world$/, ''));
    assert.ok(discovery, `${entry.alias} discovery contract`);
    assert.equal(entry.sourceId, discovery.assetId, `${entry.alias} exact authored asset`);
  }
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /loadDiscovery\(alias, record\?\.visualRoot \|\| record\?\.root, discovery\.id\)/);
  assert.match(runtime, /discoveryMetadata\(discovery, \{ part: 'authored-world' \}\)/);
  assert.match(runtime, /teleportedWithinBoundedMap: true/);
  assert.match(runtime, /expanseVisibleFromOverlook: true/);
  assert.match(runtime, /expanseActive: expanseWorldMode\.getState\(\)\.mode === 'EXPANSE_ACTIVE'/);
});

test('W744 role cast has real locomotion and stationary work gestures', () => {
  for (const role of EON_CITY_W731_LAUNCH_ASSET_MANIFEST.roleCharacters) {
    const clips = role.animations.map((name) => String(name).toLowerCase());
    assert.ok(clips.some((name) => /idle/.test(name)), `${role.alias} idle`);
    assert.ok(clips.some((name) => /walk/.test(name)), `${role.alias} walk`);
    assert.ok(clips.some((name) => /wave|talk|gesture|inspect|agree|push|weapon|checkout|door/.test(name)), `${role.alias} stationary work gesture`);
  }
  const assets = read('assets/js/city/w731/eon-city-w731-local-assets.js');
  assert.match(assets, /interact: \[\/checkout\/i, \/inspect\/i/);
  assert.match(assets, /playStationary\(state = 'idle'/);
  assert.match(assets, /const safeState = \['idle', 'idle-alt', 'talk', 'wave', 'open', 'interact', 'inspect', 'pose', 'victory'\]/);
});

test('W744 runtime builds the premium Command Centre, real 3D Nexus and bounded ambient life', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /w744-command-centre-circuit-floor/);
  assert.match(runtime, /microchipCircuitFloor: true/);
  assert.match(runtime, /new PointLight\(`w744-command-light-/);
  assert.match(runtime, /stationBeacons:/);
  assert.match(runtime, /w744-.*-terminal-body/);
  assert.match(runtime, /interactionRole: 'terminal'/);
  assert.match(runtime, /interactionRole: 'npc'/);
  assert.match(runtime, /interactionRole: 'structure'/);
  assert.match(runtime, /loadStationProp\(terminalAlias/);
  assert.match(runtime, /loadRole\(roleEntry\.stationId/);
  assert.match(runtime, /transit-capsule-ambient/);
  assert.match(runtime, /maintenance-worker-ambient/);
  assert.match(runtime, /street-lamp-ambient/);
  assert.match(runtime, /w744-authored-street-lamp-instance-/);
  assert.match(runtime, /Scene\.FOGMODE_EXP2/);
  assert.match(runtime, /imageProcessingConfiguration\.contrast/);
  assert.match(runtime, /centralGenesisCore: true/);
  assert.match(runtime, /commandSeat: true/);
  assert.match(runtime, /eonbotDock: true/);
  assert.match(runtime, /stationNpcBoundedMicroRoutes: true/);
  assert.match(runtime, /stationNpcWalkingInPlace: false/);
  assert.match(runtime, /route\.actualDistanceTravelled \+= step/);
  assert.match(runtime, /if \(route\.moving\) setStationNpcAnimation\(record, 'walk'\)/);
  assert.match(runtime, /oneEngine: true/);
  assert.match(runtime, /oneScene: true/);
  assert.match(runtime, /oneRenderLoop: true/);
  assert.match(runtime, /command-centre-core-and-hero-cast/);
  assert.match(runtime, /const heroCharacterLoad = Promise\.all/);
  assert.match(runtime, /await Promise\.all\(\[Promise\.all\(environmentLoads\), heroCharacterLoad\]\)/);
  assert.match(runtime, /visibleFrameGateComplete: true/);
  assert.match(runtime, /const interactionAnimation = interactionPart === 'terminal' \? 'interact' : 'talk'/);
  assert.match(runtime, /playStationary\?\.\(interactionAnimation/);
});


test('W744 assigns every active ready W649 world asset and stages the authored hero cast before reveal', () => {
  const manifest = EON_CITY_W731_LAUNCH_ASSET_MANIFEST;
  const allEntries = [
    ...manifest.coreLazy, ...manifest.coreWorld, ...manifest.stationWorld, ...manifest.stationProps,
    ...manifest.discoveryWorld, ...manifest.roleCharacters, ...manifest.ambientAssets
  ];
  const assignedSourceIds = new Set(allEntries.map((entry) => entry.sourceId));
  const readyWorldIds = EON_CITY_W649_WORLD_MANIFEST.entries
    .filter((entry) => entry.lifecycle === 'active' && String(entry.status || '').startsWith('READY'))
    .map((entry) => entry.id);

  const retiredReadyWorldIds = new Set(manifest.truth.retiredReadyWorldAssetIds || []);
  assert.deepEqual(readyWorldIds.filter((id) => !assignedSourceIds.has(id) && !retiredReadyWorldIds.has(id)), []);
  assert.deepEqual([...retiredReadyWorldIds], ['eoncity-orientation-hall']);
  assert.equal(manifest.truth.allReadyWorldAssetsAssigned, true);
  assert.equal(manifest.truth.visibleFrameIncludesCoreCharacters, true);
  assert.deepEqual(manifest.visibleFrame.coreCharacterAliases, ['player-primary', 'eonbot']);
  assert.equal(manifest.visibleFrame.requiredCoreCharacterCount, 2);
  assert.equal(manifest.visibleFrame.hardTimeoutMs, 12_000);
  assert.equal(manifest.ambientAssets.some((entry) => entry.sourceId === 'eoncity-street-lamp'), true);

  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const access = read('assets/js/city/eon-city-access-station.js');
  assert.match(runtime, /stage\('AUTHORED_VISIBLE_FRAME_LOADING', 'command-centre-core-and-hero-cast'\)/);
  assert.match(runtime, /localAssetRuntime\.loadCore\('player-primary', playerAnchor\)/);
  assert.match(runtime, /localAssetRuntime\.loadCore\('eonbot', eonbotAnchor\)/);
  assert.match(runtime, /authoredHeroCharactersRequired/);
  assert.match(runtime, /visibleFrameGate: freeze/);
  assert.match(access, /EON_CITY_AUTHORED_REVEAL_TIMEOUT_MS = 12_000/);
  assert.match(access, /EON_CITY_AUTHORED_REVEAL_TIMEOUT_MS\) \|\| null/);
});

test('W744 preserves review-first sharing, Creator Capture and non-ad subscription monetisation', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const share = read('assets/js/utils/eon-share-sheet.js');
  const plans = read('assets/js/work-surface/adapters/eon-plans-panel.js');

  assert.match(runtime, /data-eon-city-quick=\"share\">Share/);
  assert.match(runtime, /Creator Capture/);
  assert.match(runtime, /data-eon-city-quick=\"plans\">Plans &amp; Access/);
  assert.match(share, /referralLink: true/);
  assert.match(plans, /explicitUserAction: true/);
  assert.match(plans, /environment\.confirm/);
  assert.doesNotMatch(runtime, /automaticPosting: true|checkoutAutomatic: true/);
});

test('W744 red-team authority keeps cache, source and deploy boundaries explicit', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const sw = read('sw.js');
  assert.equal(EON_CITY_W747_RUNTIME_PROVENANCE, 'eon-city-living-nexus-command-core-w757-1');
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.cacheVersion, EON_CITY_W747_RUNTIME_PROVENANCE);
  assert.match(runtime, /EON_CITY_W731_LAUNCH_ASSET_MANIFEST\.cacheVersion !== EON_CITY_W757_RUNTIME_PROVENANCE/);
  assert.match(sw, /RELEASE_ID = 'w765-2026-07-31-release-identity-source-template'/);
  assert.match(sw, /CITY_RUNTIME_PROVENANCE = 'eon-city-living-nexus-command-core-w757-1'/);
  assert.equal(sw, read('public/sw.js'));
  assert.doesNotMatch(runtime, /wrangler\s+pages\s+deploy|git\s+push|child_process|spawnSync\(|execSync\(/);
});
