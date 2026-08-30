import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_CORE_OUTCOME_MAX_RECORDS,
  EON_CORE_OUTCOME_POLICIES,
  EON_CORE_OUTCOME_STORAGE_KEY,
  getEonCoreOutcomeTruth,
  listEonCoreOutcomes,
  recordEonCoreOutcome,
  validateEonCoreOutcome
} from '../../assets/js/contracts/outcomes/eon-core-outcome-authority.js';
import {
  EON_CITY_PROGRESS_STORAGE_KEY,
  getEonCityProgressTruth,
  listEonCityProgressReceipts,
  listVerifiedEonCityProgressReceipts,
  syncEonCoreOutcomesToCity,
  validateEonCityProgressReceipt
} from '../../assets/js/contracts/city/eon-city-progress-bridge.js';
import { projectEonCityW751ProductiveStations } from '../../assets/js/city/w751/eon-city-w751-productive-stations.js';
import { createEonCityW752MissionsProgression } from '../../assets/js/city/w752/eon-city-w752-missions-progression.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    dump: () => new Map(values)
  };
};
const environment = () => {
  const listeners = new Map();
  class CustomEvent {
    constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
  }
  return {
    CustomEvent,
    addEventListener(type, listener) { const bucket = listeners.get(type) || new Set(); bucket.add(listener); listeners.set(type, bucket); },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    dispatchEvent(event) { for (const listener of listeners.get(event.type) || []) listener(event); return true; }
  };
};

const examples = [
  ['creator-guide-artifact', '/create', 'create-local-guide', 'create-forge'],
  ['forge-source-applied', '/forge', 'forge-local-apply', 'create-forge'],
  ['project-shell', '/projects', 'projects-local', 'project-atlas'],
  ['library-item-reused', '/library', 'library-local-use', 'library-vault'],
  ['local-ai-self-test', '/local-ai', 'local-ai-device', 'local-ai-lab'],
  ['automation-proposal', '/automations', 'automations-local', 'automation-theatre'],
  ['reviewed-signed-handoff', '/', 'share-center-local', 'share-capture'],
  ['command-status-reviewed', '/eoncity', 'command-centre-local-review', 'command-console'],
  ['realm-layout-saved', '/realm-studio', 'realm-studio-local-save', 'my-realm-portal'],
  ['plans-access-reviewed', '/eoncity', 'city-server-access-review', 'plans-access']
];

test('C05 defines one neutral policy for every launch Core outcome family', () => {
  assert.equal(EON_CORE_OUTCOME_POLICIES.length, 19);
  assert.deepEqual([...new Set(EON_CORE_OUTCOME_POLICIES.map((entry) => entry.stationId))].sort(), ['automation-theatre', 'command-console', 'create-forge', 'library-vault', 'local-ai-lab', 'my-realm-portal', 'plans-access', 'project-atlas', 'share-capture']);
  const truth = getEonCoreOutcomeTruth();
  assert.equal(truth.nativeProofRequired, true);
  assert.equal(truth.privateContentStored, false);
  assert.equal(truth.routeOpeningGrantsOutcome, false);
  assert.equal(truth.cityReturnReceiptGrantsOutcome, false);
  assert.equal(truth.xpGranted, false);
});

test('C05 accepts verified native proofs across all Core-backed launch station families', () => {
  const storage = memoryStorage();
  for (const [kind, route, source] of examples) {
    const result = recordEonCoreOutcome({ kind, route, source, receiptId: `${kind}:proof`, verified: true }, { storage, environment: environment(), now: 5000 });
    assert.equal(result.ok, true, `${kind}: ${result.reason}`);
    assert.equal(validateEonCoreOutcome(result.outcome).ok, true);
  }
  const outcomes = listEonCoreOutcomes({ storage });
  assert.equal(outcomes.length, examples.length);
  assert.equal(outcomes.every((entry) => !entry.containsPrivateContent && !entry.xpGranted && entry.cityMaySubscribe), true);
});

test('C05 rejects wrong routes, wrong sources, unverified claims, private payload claims and navigation receipts', () => {
  const storage = memoryStorage();
  assert.equal(recordEonCoreOutcome({ kind: 'project-shell', route: '/projects', source: 'wrong', receiptId: 'x', verified: true }, { storage }).reason, 'native-authority-mismatch');
  assert.equal(recordEonCoreOutcome({ kind: 'project-shell', route: '/library', source: 'projects-local', receiptId: 'x', verified: true }, { storage }).reason, 'native-authority-mismatch');
  assert.equal(recordEonCoreOutcome({ kind: 'project-shell', route: '/projects', source: 'projects-local', receiptId: 'x', verified: false }, { storage }).reason, 'verified-native-proof-required');
  assert.equal(recordEonCoreOutcome({ kind: 'project-shell', route: '/projects', source: 'projects-local', receiptId: 'x', verified: true, containsPrivateContent: true }, { storage }).reason, 'private-content-forbidden');
  assert.equal(recordEonCoreOutcome({ kind: 'city-work-handoff-opened', route: '/projects', source: 'city', receiptId: 'x', verified: true }, { storage }).reason, 'outcome-policy-not-found');
  assert.equal(recordEonCoreOutcome({ kind: 'city-return-receipt', route: '/eoncity', source: 'city', receiptId: 'x', verified: true }, { storage }).reason, 'outcome-policy-not-found');
  assert.equal(listEonCoreOutcomes({ storage }).length, 0);
});

test('C05 is idempotent and blocks at capacity without evicting a prior outcome', () => {
  const storage = memoryStorage();
  for (let index = 0; index < EON_CORE_OUTCOME_MAX_RECORDS; index += 1) {
    const result = recordEonCoreOutcome({ kind: 'project-shell', route: '/projects', source: 'projects-local', receiptId: `project:${index}`, verified: true }, { storage, now: index + 1 });
    assert.equal(result.ok, true);
  }
  const before = storage.getItem(EON_CORE_OUTCOME_STORAGE_KEY);
  const duplicate = recordEonCoreOutcome({ kind: 'project-shell', route: '/projects', source: 'projects-local', receiptId: 'project:0', verified: true }, { storage, now: 9000 });
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.duplicate, true);
  const blocked = recordEonCoreOutcome({ kind: 'project-shell', route: '/projects', source: 'projects-local', receiptId: 'project:overflow', verified: true }, { storage, now: 9001 });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'outcome-capacity-reached');
  assert.equal(storage.getItem(EON_CORE_OUTCOME_STORAGE_KEY), before);
});

test('C05 creates one bounded City progress receipt per Core outcome and repeat sync is a no-op', () => {
  const storage = memoryStorage();
  for (const [kind, route, source] of examples) recordEonCoreOutcome({ kind, route, source, receiptId: `${kind}:sync`, verified: true }, { storage, now: 7000 });
  const first = syncEonCoreOutcomesToCity({ storage, environment: environment(), now: 7100 });
  assert.equal(first.ok, true);
  assert.equal(first.created.length, examples.length);
  assert.equal(first.created.every((entry) => validateEonCityProgressReceipt(entry).ok), true);
  assert.equal(first.created.every((entry) => !entry.xpGranted && !entry.rewardGranted && entry.explicitClaimRequired), true);
  const second = syncEonCoreOutcomesToCity({ storage, environment: environment(), now: 7200 });
  assert.equal(second.ok, true);
  assert.equal(second.created.length, 0);
  assert.equal(listEonCityProgressReceipts({ storage }).length, examples.length);
});


test('C05 ignores and prunes forged City progress receipts that cannot rejoin a valid Core outcome', () => {
  const storage = memoryStorage();
  const forged = {
    schema: 'eon.city-progress-receipt.a15.v1',
    revision: 1,
    updatedAt: 1,
    receipts: [{
      schema: 'eon.city-progress-receipt.a15.v1',
      receiptId: 'city-progress:forged',
      coreOutcomeId: 'project-shell:forged',
      evidenceReceiptId: 'forged',
      kind: 'project-shell',
      stationId: 'project-atlas',
      missionId: 'project',
      verified: true,
      verifiedAt: 1,
      acceptedAt: 1
    }]
  };
  storage.setItem(EON_CITY_PROGRESS_STORAGE_KEY, JSON.stringify(forged));
  assert.equal(listEonCityProgressReceipts({ storage }).length, 1);
  assert.equal(listVerifiedEonCityProgressReceipts({ storage }).length, 0);
  const repair = syncEonCoreOutcomesToCity({ storage, now: 2 });
  assert.equal(repair.ok, true);
  assert.equal(repair.reason, 'invalid-progress-receipts-pruned');
  assert.equal(listEonCityProgressReceipts({ storage }).length, 0);
});

test('C05 projects neutral progress into W751 verified station state without granting XP', () => {
  const storage = memoryStorage();
  recordEonCoreOutcome({ kind: 'forge-source-applied', route: '/forge', source: 'forge-local-apply', receiptId: 'forge:applied:1', verified: true }, { storage, now: 8000 });
  syncEonCoreOutcomesToCity({ storage, now: 8100 });
  const receipts = listEonCityProgressReceipts({ storage });
  const view = projectEonCityW751ProductiveStations({ productivePlan: { missions: [] }, missionView: [], activity: { stations: {} }, shareReceipt: null, progressReceipts: receipts });
  const forge = view.stations.find((entry) => entry.stationId === 'create-forge');
  assert.equal(forge.state, 'verified');
  assert.match(forge.verifiedOutcome.receiptId, /^city-progress:/);
  assert.equal(forge.verifiedOutcome.coreOutcomeId !== '', true);
  assert.equal(forge.verifiedOutcome.xpGranted, false);
  assert.equal(view.rewardIssued, false);
});

test('C05 leaves XP behind W752 explicit claim and never rewards local review/open/return activity', () => {
  const storage = memoryStorage();
  recordEonCoreOutcome({ kind: 'project-shell', route: '/projects', source: 'projects-local', receiptId: 'project:claim:1', verified: true }, { storage, now: 9000 });
  syncEonCoreOutcomesToCity({ storage, now: 9100 });
  const stationView = projectEonCityW751ProductiveStations({ productivePlan: { missions: [] }, missionView: [], activity: { stations: {} }, shareReceipt: null, progressReceipts: listEonCityProgressReceipts({ storage }) });
  const stationController = { getView: () => stationView };
  const controller = createEonCityW752MissionsProgression({ stationController, storage, environment: environment(), now: () => 9200 });
  const ready = controller.getMission('project-atlas');
  assert.equal(ready.state, 'verified-ready');
  assert.equal(controller.claimMission('project-atlas').reason, 'explicit-user-action-required');
  const claimed = controller.claimMission('project-atlas', { explicitUserAction: true });
  assert.equal(claimed.ok, true);
  assert.equal(claimed.mission.state, 'claimed');
  const duplicate = controller.claimMission('project-atlas', { explicitUserAction: true });
  assert.equal(duplicate.reason, 'already-claimed');
  controller.dispose();

  const noProofView = projectEonCityW751ProductiveStations({ productivePlan: { missions: [] }, missionView: [], activity: { stations: { 'project-atlas': { reviewedAt: 1, openedAt: 2, returnedAt: 3 } } }, shareReceipt: null, progressReceipts: [] });
  const noProofController = createEonCityW752MissionsProgression({ stationController: { getView: () => noProofView }, storage: memoryStorage(), environment: environment(), now: () => 9300 });
  assert.equal(noProofController.getMission('project-atlas').claimable, false);
  assert.equal(noProofController.claimMission('project-atlas', { explicitUserAction: true }).reason, 'verified-native-receipt-required');
  noProofController.dispose();
});

test('C05 source wiring records only after real native actions and removes direct Core-to-City writes', () => {
  const files = [
    'assets/js/create/eon-create-hub.js',
    'assets/js/forge/eon-forge-quick-build.js',
    'assets/js/projects/eon-projects-page.js',
    'assets/js/eon-workspace-pages.js',
    'assets/js/local-ai/local-ai-page.js',
    'assets/js/eon-automations-page.js',
    'assets/js/local-first/eon-workspace-capsule-page.js',
    'assets/js/vault/eon-vault-page.js',
    'assets/js/work-surface/adapters/eon-command-centre-panel.js',
    'assets/js/realm-studio-page.js',
    'assets/js/work-surface/adapters/eon-plans-panel.js'
  ];
  for (const file of files) {
    const source = read(file);
    assert.match(source, /recordEonCoreOutcome/);
    assert.doesNotMatch(source, /recordEonCityProductiveRpgOutcome/);
  }
  assert.match(read('assets/js/forge/eon-forge-quick-build.js'), /forge-source-applied/);
  assert.match(read('assets/js/eon-workspace-pages.js'), /library-item-reused/);
  assert.match(read('assets/js/contracts/share/eon-share-w753-reviewed-handoff-receipt.js'), /recordEonCoreOutcome/);
  assert.match(read('assets/js/work-surface/adapters/eon-command-centre-panel.js'), /command-status-reviewed/);
  assert.match(read('assets/js/realm-studio-page.js'), /realm-layout-saved/);
  assert.match(read('assets/js/work-surface/adapters/eon-plans-panel.js'), /plans-access-reviewed/);
});

test('C05 truth states that City progress is proof projection, never completion authority', () => {
  const truth = getEonCityProgressTruth();
  assert.equal(truth.consumesOnlyPolicyApprovedCoreOutcomes, true);
  assert.equal(truth.claimReadsRevalidateAgainstCoreOutcome, true);
  assert.equal(truth.forgedProgressReceiptsIgnored, true);
  assert.equal(truth.oneReceiptPerCoreOutcome, true);
  assert.equal(truth.privateContentStored, false);
  assert.equal(truth.routeOpeningGrantsXp, false);
  assert.equal(truth.cityReturnReceiptGrantsXp, false);
  assert.equal(truth.localReviewGrantsXp, false);
  assert.equal(truth.xpGranted, false);
  assert.equal(truth.rewardGranted, false);
  assert.equal(truth.explicitMissionClaimRequired, true);
});
