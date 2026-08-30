import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_W752_MISSION_DEFINITIONS,
  EON_CITY_W752_SCHEMA,
  EON_CITY_W752_VIEW_EVENT,
  createEonCityW752MissionsProgression,
  getEonCityW752Mission,
  projectEonCityW752MissionsProgression,
  validateEonCityW752MissionsProgression
} from '../../assets/js/city/w752/eon-city-w752-missions-progression.js';
import { createEonCityW751ProductiveStations, projectEonCityW751ProductiveStations } from '../../assets/js/city/w751/eon-city-w751-productive-stations.js';
import { readEonCityW659gProgression, recordEonCityW659gVerifiedAction } from '../../assets/js/contracts/city/w659g/eon-city-w659g-progression-ledger.js';
import { createEonCityProductiveRpgController, getEonCityProductiveRpgPlan, recordEonCityProductiveRpgOutcome } from '../../assets/js/contracts/city/eon-city-productive-rpg-loop.js';
import { renderEonCityW752ProgressionPanel } from '../../assets/js/work-surface/eon-city-progression-panel.js';
import { EON_CORE_OUTCOME_POLICIES, recordEonCoreOutcome } from '../../assets/js/contracts/outcomes/eon-core-outcome-authority.js';
import { listVerifiedEonCityProgressReceipts, syncEonCoreOutcomesToCity } from '../../assets/js/contracts/city/eon-city-progress-bridge.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const memoryStorage = () => { const data = new Map(); return { getItem: (key) => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)), removeItem: (key) => data.delete(key), dump: () => data }; };
class FakeCustomEvent extends Event { constructor(type, options = {}) { super(type); this.detail = options.detail; } }
const environment = () => { const target = new EventTarget(); target.CustomEvent = FakeCustomEvent; return target; };

function baseStationView() {
  return projectEonCityW751ProductiveStations({ productivePlan: { missions: [] }, missionView: [], activity: { stations: {} } });
}

function withVerifiedStation(stationId, receiptId, kind = 'verified-work') {
  const base = baseStationView();
  return Object.freeze({
    ...base,
    verifiedCount: 1,
    stations: Object.freeze(base.stations.map((station) => station.stationId === stationId ? Object.freeze({
      ...station,
      state: 'verified',
      completionClaimed: true,
      verifiedOutcome: Object.freeze({ kind, receiptId, verifiedAt: 752000, privateContentStored: false })
    }) : station))
  });
}

test('W752 defines ten receipt-backed missions with fixed fair boundaries', () => {
  const view = projectEonCityW752MissionsProgression({ stationView: baseStationView(), progression: readEonCityW659gProgression({ storage: null }) });
  const validation = validateEonCityW752MissionsProgression(view);
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.equal(view.schema, EON_CITY_W752_SCHEMA);
  assert.equal(view.missionCount, 10);
  assert.equal(EON_CITY_W752_MISSION_DEFINITIONS.length, 10);
  assert.equal(new Set(view.missions.map((mission) => mission.stationId)).size, 10);
  assert.equal(new Set(view.missions.map((mission) => mission.title)).size, 10);
  for (const mission of view.missions) {
    assert.equal(mission.xpReward, 120);
    assert.equal(mission.revealProgressReward, 35);
    assert.equal(mission.explicitClaimRequired, true);
    assert.equal(mission.verifiedNativeReceiptRequired, true);
    assert.equal(mission.paidReward, false);
    assert.equal(mission.randomizedReward, false);
    assert.equal(mission.transferableReward, false);
    assert.equal(mission.streakRequired, false);
    assert.equal(mission.publicPostingRequired, false);
  }
  assert.equal(view.lootBox, false);
  assert.equal(view.chanceBased, false);
  assert.equal(view.fakeUrgency, false);
  assert.equal(view.clickFarming, false);
  const creator = getEonCityW752Mission(view, 'create-forge');
  assert.deepEqual(creator.actionChoices.map((choice) => choice.creatorMode), ['image', 'video', 'music']);
  assert.deepEqual(creator.actionChoices.map((choice) => choice.label), ['Make Image', 'Make Video', 'Make Music / Radio']);
  const creatorHtml = renderEonCityW752ProgressionPanel(view, 'create-forge');
  assert.match(creatorHtml, /data-eon-w752-creator-mode="image"/);
  assert.match(creatorHtml, /data-eon-w752-creator-mode="video"/);
  assert.match(creatorHtml, /data-eon-w752-creator-mode="music"/);
  assert.match(creatorHtml, /Opening a lane earns no XP and starts no generation or provider call/);
});

test('W752 all ten launch missions have a real receipt authority and the three formerly dead-end stations claim only after explicit proof', () => {
  const coreStations = new Set(EON_CORE_OUTCOME_POLICIES.map((entry) => entry.stationId));
  coreStations.add('eonbot-nexus'); // W624G orientation receipt remains the native non-Core authority.
  assert.deepEqual(
    EON_CITY_W752_MISSION_DEFINITIONS.map((entry) => entry.stationId).filter((stationId) => !coreStations.has(stationId)),
    []
  );

  const fixtures = [
    ['command-console', { kind: 'command-status-reviewed', route: '/eoncity', source: 'command-centre-local-review', receiptId: 'command-review:w752' }],
    ['my-realm-portal', { kind: 'realm-layout-saved', route: '/realm-studio', source: 'realm-studio-local-save', receiptId: 'realm-save:w752' }],
    ['plans-access', { kind: 'plans-access-reviewed', route: '/eoncity', source: 'city-server-access-review', receiptId: 'plans-review:w752' }]
  ];

  for (const [stationId, input] of fixtures) {
    const storage = memoryStorage();
    const env = environment();
    const saved = recordEonCoreOutcome({ ...input, verified: true }, { storage, environment: env, now: 752100 });
    assert.equal(saved.ok, true, `${stationId}: ${saved.reason}`);
    assert.equal(saved.outcome.stationId, stationId);
    assert.equal(saved.outcome.xpGranted, false);
    assert.equal(saved.outcome.rewardGranted, false);

    const stationController = createEonCityW751ProductiveStations({ storage, environment: env, now: () => 752110 });
    assert.equal(stationController.getStation(stationId).state, 'verified', `${stationId} should become receipt-verified`);
    const progression = createEonCityW752MissionsProgression({ stationController, storage, environment: env, now: () => 752120 });
    assert.equal(progression.getMission(stationId).state, 'verified-ready');
    assert.equal(progression.getView().xp, 0);
    assert.equal(progression.claimMission(stationId).reason, 'explicit-user-action-required');
    assert.equal(progression.getView().xp, 0);
    const claimed = progression.claimMission(stationId, { explicitUserAction: true });
    assert.equal(claimed.ok, true);
    assert.deepEqual(claimed.awarded, { xp: 120, reveal: 35 });
    assert.equal(progression.claimMission(stationId, { explicitUserAction: true }).reason, 'already-claimed');
    progression.dispose();
    stationController.dispose();
  }
});

test('W752 Plans mission rewards verified access review, never checkout or paid tier', () => {
  const source = read('assets/js/work-surface/adapters/eon-plans-panel.js');
  assert.match(source, /verified && accessVerified/);
  assert.match(source, /plans-access-reviewed/);
  assert.match(source, /does not start checkout, change a tier, or grant payment-linked XP/);
  const checkoutStart = source.indexOf("grid.querySelectorAll('[data-plan-checkout]')");
  assert.notEqual(checkoutStart, -1);
  const checkoutSource = source.slice(checkoutStart);
  assert.doesNotMatch(checkoutSource, /plans-access-reviewed|recordEonCoreOutcome/);
  assert.match(checkoutSource, /signed provider webhook updates the server ledger/);
});

test('W752 claims XP only from an explicit current Core-backed native receipt and remains idempotent', () => {
  const storage = memoryStorage();
  const env = environment();
  const outcome = recordEonCoreOutcome({ kind: 'project-shell', route: '/projects', source: 'projects-local', receiptId: 'project-shell:w752', verified: true }, { storage, environment: env, now: 751990 });
  assert.equal(outcome.ok, true);
  assert.equal(syncEonCoreOutcomesToCity({ storage, environment: env, now: 751995 }).ok, true);
  const stationView = projectEonCityW751ProductiveStations({ productivePlan: { missions: [] }, missionView: [], activity: { stations: {} }, progressReceipts: listVerifiedEonCityProgressReceipts({ storage }) });
  const stationController = { getView: () => stationView };
  const controller = createEonCityW752MissionsProgression({ stationController, storage, environment: env, now: () => 752000 });
  assert.equal(controller.claimMission('project-atlas').reason, 'explicit-user-action-required');
  const claimed = controller.claimMission('project-atlas', { explicitUserAction: true });
  assert.equal(claimed.ok, true);
  assert.equal(claimed.authority.authority, 'core-outcome-city-progress');
  assert.deepEqual(claimed.awarded, { xp: 120, reveal: 35 });
  assert.equal(controller.getMission('project-atlas').state, 'claimed');
  const duplicate = controller.claimMission('project-atlas', { explicitUserAction: true });
  assert.equal(duplicate.reason, 'already-claimed');
  assert.deepEqual(duplicate.awarded, { xp: 0, reveal: 0 });
  assert.equal(controller.getView().xp, 120);
  assert.equal(controller.getView().revealProgress, 35);
  controller.dispose();
});

test('W752 rejects forged station and legacy mission verification that cannot rejoin current Core proof', () => {
  const storage = memoryStorage();
  const env = environment();
  const forgedStation = { getView: () => withVerifiedStation('project-atlas', 'forged:project:receipt') };
  const forged = createEonCityW752MissionsProgression({ stationController: forgedStation, storage, environment: env, now: () => 752001 });
  const result = forged.claimMission('project-atlas', { explicitUserAction: true });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'verified-native-receipt-not-authoritative');
  assert.deepEqual(result.awarded, { xp: 0, reveal: 0 });
  assert.equal(forged.getView().xp, 0);
  forged.dispose();

  recordEonCityProductiveRpgOutcome({ kind: 'project-shell', route: '/projects', source: 'projects-local', receiptId: 'legacy:forged-project', verified: true }, { storage, now: 752002 });
  const view = projectEonCityW751ProductiveStations({ productivePlan: getEonCityProductiveRpgPlan({ storage }), missionView: [], activity: { stations: {} }, progressReceipts: listVerifiedEonCityProgressReceipts({ storage }) });
  assert.notEqual(view.stations.find((entry) => entry.stationId === 'project-atlas').state, 'verified');
});




test('W752 Nexus mission accepts only the separately reviewed bounded orientation receipt', () => {
  const storage = memoryStorage();
  const env = environment();
  const legacy = createEonCityProductiveRpgController({ storage, now: () => 752050 });
  assert.equal(legacy.review('orientation', { explicitUserAction: true }).ok, true);
  assert.equal(legacy.completeOrientation({ explicitUserAction: true, controlsReviewed: true }).ok, true);
  const stationController = createEonCityW751ProductiveStations({ storage, environment: env, now: () => 752060 });
  assert.equal(stationController.getStation('eonbot-nexus').state, 'verified');
  const progression = createEonCityW752MissionsProgression({ stationController, storage, environment: env, now: () => 752070 });
  const claim = progression.claimMission('eonbot-nexus', { explicitUserAction: true });
  assert.equal(claim.ok, true);
  assert.equal(claim.authority.authority, 'bounded-orientation-receipt');
  assert.deepEqual(claim.awarded, { xp: 120, reveal: 35 });
  progression.dispose();
  stationController.dispose();
  legacy.dispose();
});

test('W752 hosted Creator journey stays receipt-gated from real save through explicit XP claim', () => {
  const storage = memoryStorage();
  const env = environment();
  const saved = recordEonCoreOutcome({
    kind: 'creator-image-verified',
    route: '/create',
    source: 'eon-direct-byok-fal',
    receiptId: 'hosted-image:w752-e2e',
    verified: true
  }, { storage, environment: env, now: 752010 });
  assert.equal(saved.ok, true);
  const stationController = createEonCityW751ProductiveStations({ storage, environment: env, now: () => 752020 });
  const station = stationController.getStation('create-forge');
  assert.equal(station.state, 'verified');
  assert.equal(station.verifiedOutcome?.privateContentStored, false);
  assert.equal(station.verifiedOutcome?.xpGranted, false);
  assert.equal(station.verifiedOutcome?.explicitClaimRequired, true);

  const progression = createEonCityW752MissionsProgression({ stationController, storage, environment: env, now: () => 752030 });
  const ready = progression.getMission('create-forge');
  assert.equal(ready.state, 'verified-ready');
  assert.equal(ready.claimable, true);
  assert.equal(progression.getView().xp, 0);
  assert.equal(progression.claimMission('create-forge').reason, 'explicit-user-action-required');
  assert.equal(progression.getView().xp, 0);

  const claimed = progression.claimMission('create-forge', { explicitUserAction: true });
  assert.equal(claimed.ok, true);
  assert.deepEqual(claimed.awarded, { xp: 120, reveal: 35 });
  assert.equal(progression.getMission('create-forge').state, 'claimed');
  assert.equal(progression.claimMission('create-forge', { explicitUserAction: true }).reason, 'already-claimed');
  assert.equal(progression.getView().xp, 120);
  assert.equal(progression.getView().revealProgress, 35);
  assert.equal(progression.getView().pendingReveals, 0);
  progression.dispose();
  stationController.dispose();
});

test('W752 never treats review, open or return activity as mission completion', () => {
  const storage = memoryStorage();
  const base = baseStationView();
  const returned = Object.freeze({ ...base, stations: Object.freeze(base.stations.map((station) => station.stationId === 'create-forge' ? Object.freeze({ ...station, state: 'returned', completionClaimed: false, verifiedOutcome: null }) : station)) });
  const controller = createEonCityW752MissionsProgression({ stationController: { getView: () => returned }, storage, environment: environment() });
  const mission = controller.getMission('create-forge');
  assert.equal(mission.state, 'in-progress');
  assert.equal(mission.claimable, false);
  assert.equal(controller.claimMission('create-forge', { explicitUserAction: true }).reason, 'verified-native-receipt-required');
  assert.equal(controller.getView().xp, 0);
  controller.dispose();
});

test('W752 Vault Reveals are explicit, deterministic, cosmetic and duplicate-protected', () => {
  const storage = memoryStorage();
  for (const receiptId of ['r1', 'r2', 'r3']) {
    assert.equal(recordEonCityW659gVerifiedAction({ type: 'city.real-work-receipt', receiptId, verified: true }, { storage, now: 752000 }).ok, true);
  }
  const controller = createEonCityW752MissionsProgression({ stationController: { getView: baseStationView }, storage, environment: environment(), now: () => 752100 });
  assert.equal(controller.getView().pendingReveals, 1);
  assert.equal(controller.getView().nextReveal.id, 'signal-mist');
  assert.equal(controller.openVaultReveal().reason, 'explicit-user-action-required');
  const reveal = controller.openVaultReveal({ explicitUserAction: true });
  assert.equal(reveal.ok, true);
  assert.equal(reveal.outcome.kind, 'cosmetic');
  assert.equal(reveal.outcome.rewardId, 'signal-mist');
  assert.equal(reveal.outcome.duplicateProtected, true);
  assert.equal(reveal.deterministic, true);
  assert.equal(reveal.paid, false);
  assert.equal(reveal.chanceBased, false);
  assert.equal(controller.getView().nextReveal.id, 'forge-prism');
  controller.dispose();
  assert.equal(controller.openVaultReveal({ explicitUserAction: true }).reason, 'w752-disposed');
  assert.equal(controller.selectCosmetic('signal-mist', { explicitUserAction: true }).reason, 'w752-disposed');
});


test('W752 defers surplus reveal credits after the finite cosmetic catalog is complete', () => {
  const progression = {
    schema: 'eon.city.w659g.progression.v1', xp: 1000, revealProgress: 20, pendingReveals: 3, openedReveals: 6,
    receipts: {}, dailyCounts: {}, ownedCosmetics: ['signal-mist', 'forge-prism', 'creator-frame', 'transit-pulse', 'portal-echo', 'command-orbit-master'],
    selectedCosmetics: {}, revealHistory: []
  };
  const view = projectEonCityW752MissionsProgression({ stationView: baseStationView(), progression });
  assert.equal(view.revealCatalogComplete, true);
  assert.equal(view.pendingReveals, 0);
  assert.equal(view.deferredRevealCredits, 3);
  assert.equal(view.nextReveal, null);
});

test('W752 builds one bounded private My Realm reflection from claimed missions', () => {
  const storage = memoryStorage();
  recordEonCityW659gVerifiedAction({ type: 'city.real-work-receipt', receiptId: 'project-shell:w752', verified: true }, { storage, now: 752000 });
  const view = projectEonCityW752MissionsProgression({ stationView: withVerifiedStation('project-atlas', 'project-shell:w752'), progression: readEonCityW659gProgression({ storage, now: 752001 }) });
  assert.equal(view.myRealm.facetCount, 5);
  assert.equal(view.myRealm.claimedCount, 1);
  assert.equal(view.myRealm.title, 'Signals Forming');
  assert.equal(view.myRealm.privateReflection, true);
  assert.equal(view.myRealm.publicProfileChanged, false);
  assert.equal(view.myRealm.publicWorldCreated, false);
  assert.equal(view.myRealm.multiplayerEnabled, false);
  assert.equal(view.myRealm.privateContentStored, false);
  assert.doesNotMatch(JSON.stringify(view.myRealm), /prompt|credential|project title|wallet|payment/i);
});

test('W752 emits view changes, fails closed on denied storage and renders accessible truth', () => {
  const base = memoryStorage();
  const env = environment();
  const saved = recordEonCoreOutcome({ kind: 'local-ai-self-test', route: '/local-ai', source: 'local-ai-device', receiptId: 'local-self-test:w752', verified: true }, { storage: base, environment: env, now: 752500 });
  assert.equal(saved.ok, true);
  assert.equal(syncEonCoreOutcomesToCity({ storage: base, environment: env, now: 752501 }).ok, true);
  let denyWrites = false;
  const denied = {
    getItem(key) { return base.getItem(key); },
    setItem(key, value) { if (denyWrites) throw new Error('denied'); base.setItem(key, value); },
    removeItem(key) { base.removeItem(key); }
  };
  const events = [];
  env.addEventListener(EON_CITY_W752_VIEW_EVENT, (event) => events.push(event.detail));
  const stationView = projectEonCityW751ProductiveStations({ productivePlan: { missions: [] }, missionView: [], activity: { stations: {} }, progressReceipts: listVerifiedEonCityProgressReceipts({ storage: denied }) });
  const controller = createEonCityW752MissionsProgression({ stationController: { getView: () => stationView }, storage: denied, environment: env });
  denyWrites = true;
  const result = controller.claimMission('local-ai-lab', { explicitUserAction: true });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'storage-unavailable');
  assert.equal(controller.getView().xp, 0);
  assert.ok(events.length >= 1);
  const html = renderEonCityW752ProgressionPanel(controller.getView(), 'my-realm-portal');
  assert.match(html, /W752 · productive mission/);
  assert.match(html, /Private My Realm reflection/);
  assert.match(html, /No streaks, paid randomness, loot boxes/);
  assert.doesNotMatch(html, /api key|raw prompt|payment complete|cash reward/i);
  controller.dispose();
});

test('W752 runtime, shared host, CSS, release and production gates converge', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const host = read('assets/js/work-surface/eon-work-surface-host.js');
  const panel = read('assets/js/work-surface/eon-city-progression-panel.js');
  const css = read('assets/css/eon-work-surface.css');
  const sw = read('sw.js');
  const publicSw = read('public/sw.js');
  const build = read('scripts/build-production.mjs');
  assert.match(runtime, /createEonCityW752MissionsProgression/);
  assert.match(runtime, /claimProductiveMission/);
  assert.match(runtime, /openDeterministicVaultReveal/);
  assert.match(runtime, /getMissionsProgression/);
  assert.match(host, /mountEonCityW752ProgressionPanel/);
  assert.match(host, /data-eon-city-progression-slot/);
  assert.match(panel, /EON_CITY_W752_VIEW_EVENT/);
  assert.match(css, /\.eon-city-progression-panel/);
  assert.match(css, /\.eon-city-my-realm-reflection/);
  assert.match(sw, /RELEASE_ID = 'w765-2026-07-31-release-identity-source-template'/);
  assert.equal(publicSw, sw);
  assert.match(build, /eon\.city\.missions-progression\.w752\.v1/);
});
