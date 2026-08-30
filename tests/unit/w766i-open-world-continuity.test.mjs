import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEonExpanseW766CSectorPlan,
  createEonExpanseW766CSectorStreamer,
  validateEonExpanseW766CSectorPlan
} from '../../assets/js/city/w766/eon-expanse-w766c-sector-streamer.js';
import {
  buildEonExpanseW766IFrontierContract,
  buildEonExpanseW766IOpenWorldContinuity,
  validateEonExpanseW766IOpenWorldContinuity
} from '../../assets/js/city/w766/eon-expanse-w766i-open-world-continuity.js';
import { createEonExpanseW766FLivingContent } from '../../assets/js/city/w766/eon-expanse-w766f-living-content.js';
import { createEonExpanseW766AInitialState, createEonExpanseW766APersistence } from '../../assets/js/city/w766/eon-expanse-w766a-foundation.js';

test('W766I sectors inherit the certified W667 world grammar deterministically', () => {
  const first = createEonExpanseW766CSectorPlan({ worldSeed: 765766, x: 4, z: -3 });
  const second = createEonExpanseW766CSectorPlan({ worldSeed: 765766, x: 4, z: -3 });
  const other = createEonExpanseW766CSectorPlan({ worldSeed: 765767, x: 4, z: -3 });
  assert.equal(validateEonExpanseW766CSectorPlan(first).ok, true);
  assert.equal(first.worldCellValid, true);
  assert.ok(first.worldCell.lotPlan.length >= 3);
  assert.ok(first.worldGrammar.regionArchetypeCount >= 10);
  assert.ok(first.worldGrammar.buildingFormCount >= 30);
  assert.equal(first.deterministicSignature, second.deterministicSignature);
  assert.notEqual(first.deterministicSignature, other.deterministicSignature);
  assert.equal(first.worldCell.privateDataRead, false);
  assert.equal(first.worldCell.networkRequestCreated, false);
});

test('W766I continuity composes macro regions, skyline, population and discoveries without a hard border', () => {
  const streamer = createEonExpanseW766CSectorStreamer({ worldSeed: 765766, quality: 'balanced' });
  const stream = streamer.update({ x: 176, z: -92 });
  assert.equal(stream.ok, true);
  const plan = buildEonExpanseW766IOpenWorldContinuity({
    worldSeed: 765766,
    position: { x: 176, z: -92 },
    quality: 'balanced',
    sectorRecords: streamer.getMountedRecords()
  });
  const validation = validateEonExpanseW766IOpenWorldContinuity(plan);
  assert.equal(validation.ok, true, validation.errors.join(','));
  assert.equal(plan.macroPlan.macroRegionCount, 9);
  assert.ok(plan.retentionMatrix.regionArchetypes >= 10);
  assert.ok(plan.retentionMatrix.buildingForms >= 30);
  assert.ok(plan.retentionMatrix.skylineNodes >= 27);
  assert.equal(plan.retentionMatrix.ambientActors, 30);
  assert.equal(plan.retentionMatrix.ambientDiscoveries, 12);
  assert.equal(plan.retentionMatrix.streetActivities, 16);
  assert.equal(plan.visibleHardBorder, false);
  assert.equal(plan.oneCanonicalScene, true);
  assert.equal(plan.ownsEngine, false);
  assert.equal(plan.ownsScene, false);
  assert.equal(plan.ownsRenderLoop, false);
});

test('frontier contracts and procedural discoveries are review-first, canonical-XP and idempotent', () => {
  const sector = createEonExpanseW766CSectorPlan({ worldSeed: 91, x: 7, z: 8 });
  const contract = buildEonExpanseW766IFrontierContract({ sectorPlan: sector, cycleKey: '2026-08-02' });
  const canonicalReceipts = new Set();
  let totalXp = 0;
  const content = createEonExpanseW766FLivingContent({
    worldSeed: 91,
    onAwardXp({ amount, receiptId }) {
      if (canonicalReceipts.has(receiptId)) return { ok: false, reason: 'duplicate-receipt' };
      canonicalReceipts.add(receiptId); totalXp += amount;
      return { ok: true, totalXp, level: 1 };
    }
  });
  assert.equal(contract.reviewFirst, true);
  assert.equal(contract.automaticCompletion, false);
  assert.equal(contract.steps.length, 3);
  const reviewed = content.interactFrontierContract(contract, { explicitUserAction: true });
  assert.equal(reviewed.status, 'reviewed');
  assert.equal(reviewed.nextStep.id, contract.steps[0].id);
  assert.equal(totalXp, 0);
  const inProgress = content.interactFrontierContract(contract, { explicitUserAction: true });
  assert.equal(inProgress.status, 'in-progress');
  assert.equal(content.progressFrontierContract(contract, contract.steps[1].id, { explicitUserAction: true }).reason, 'frontier-contract-step-out-of-order');
  const firstStep = content.progressFrontierContract(contract, contract.steps[0].id, { explicitUserAction: true });
  assert.equal(firstStep.status, 'progressed');
  assert.equal(firstStep.nextStep.id, contract.steps[1].id);
  const secondStep = content.progressFrontierContract(contract, contract.steps[1].id, { explicitUserAction: true });
  assert.equal(secondStep.status, 'progressed');
  assert.equal(secondStep.nextStep.id, contract.steps[2].id);
  const completed = content.progressFrontierContract(contract, contract.steps[2].id, { explicitUserAction: true });
  assert.equal(completed.status, 'completed');
  assert.equal(totalXp, contract.xp);
  assert.equal(content.interactFrontierContract(contract, { explicitUserAction: true }).reason, 'frontier-contract-already-completed');

  const continuity = buildEonExpanseW766IOpenWorldContinuity({ worldSeed: 91, quality: 'lite' });
  const discovery = continuity.population.discoveries[0];
  const discoveryResult = content.recordProceduralDiscovery(discovery, { explicitUserAction: true });
  assert.equal(discoveryResult.ok, true);
  assert.equal(content.recordProceduralDiscovery(discovery, { explicitUserAction: true }).reason, 'procedural-discovery-already-recorded');
  assert.equal(content.getSummary().completedFrontierContractCount, 1);
  assert.equal(content.getSummary().proceduralDiscoveryCount, 1);
});

test('W766I living-frontier state round-trips through the privacy whitelist only', () => {
  const memory = new Map();
  const storage = { getItem: (key) => memory.get(key) || null, setItem: (key, value) => memory.set(key, value), removeItem: (key) => memory.delete(key) };
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 1_659_398_400_000 });
  const base = createEonExpanseW766AInitialState({ now: 1_659_398_400_000 });
  const contractId = 'frontier:sector:2:-4:2026-08-02';
  const write = persistence.write({
    ...base,
    livingContent: {
      completedFrontierContracts: [contractId, 'bad-contract'],
      proceduralDiscoveries: ['w682-discovery-abc123', 'private-project-content'],
      activeFrontierContract: {
        id: contractId, sectorId: 'sector:2:-4', label: 'Signal Contract', objective: 'Complete three field actions.', purpose: 'frontier survey', family: 'survey', rarity: 'rare', xp: 65, landmarkId: 'landmark-1', cycleKey: '2026-08-02',
        steps: [{ id: 'scan-perimeter', label: 'Scan perimeter', action: 'scan', privatePrompt: 'strip' }, { id: 'inspect-landmark', label: 'Inspect landmark', action: 'inspect' }, { id: 'stabilize-signal', label: 'Stabilize signal', action: 'stabilize' }],
        completedStepIds: ['scan-perimeter', 'private-step'], privatePrompt: 'must-not-persist'
      },
      privateProjectText: 'must-not-persist'
    },
    arbitrarySecret: 'must-not-persist'
  });
  assert.equal(write.ok, true);
  const loaded = persistence.read(base);
  assert.deepEqual(loaded.livingContent.completedFrontierContracts, [contractId]);
  assert.deepEqual(loaded.livingContent.proceduralDiscoveries, ['w682-discovery-abc123']);
  assert.equal(loaded.livingContent.activeFrontierContract.id, contractId);
  assert.equal('privatePrompt' in loaded.livingContent.activeFrontierContract, false);
  assert.equal(loaded.livingContent.activeFrontierContract.steps.length, 3);
  assert.deepEqual(loaded.livingContent.activeFrontierContract.completedStepIds, ['scan-perimeter']);
  assert.equal('privatePrompt' in loaded.livingContent.activeFrontierContract.steps[0], false);
  assert.equal('privateProjectText' in loaded.livingContent, false);
  assert.equal('arbitrarySecret' in loaded, false);
});
