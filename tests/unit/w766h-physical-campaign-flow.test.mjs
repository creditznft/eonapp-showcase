import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_EXPANSE_W766G_SIGNAL_VANGUARD_REWARD,
  createEonExpanseW766EMissionRuntime
} from '../../assets/js/city/w766/eon-expanse-w766e-mission-runtime.js';

const signal = (runtime, id, receipt = `physical:${id}`) => runtime.recordSignal(id, { receiptId: receipt });

test('physical Signal Frontier interaction order completes all seven missions without developer APIs', () => {
  const runtime = createEonExpanseW766EMissionRuntime({ now: () => 7777 });
  for (const id of ['expanse-reviewed', 'expanse-entered', 'companion-signal-detected', 'dormant-eonbot-scanned', 'companion-signal-core-recovered', 'companion-link-restored', 'pathfinder-met', 'map-opened', 'zone:gateway-overlook']) assert.equal(signal(runtime, id).ok, true, id);
  for (const id of ['zone:beacon-fields', 'beacon-one-scanned', 'signal-components-recovered', 'beacon-one-repaired', 'beacon-fields-revealed']) assert.equal(signal(runtime, id).ok, true, id);
  for (const id of ['zone:archive-ruins', 'navigator-met', 'archive-records-recovered', 'archive-routing-solved', 'beacon-two-repaired']) assert.equal(signal(runtime, id).ok, true, id);
  for (const id of ['zone:transit-scar', 'maintainer-met', 'relay-nodes-activated', 'transit-relay-stabilized', 'regional-transit-restored']) assert.equal(signal(runtime, id).ok, true, id);
  for (const id of ['zone:horizon-vault', 'three-signals-verified', 'regional-core-synchronized', 'horizon-transit-unlocked', 'vault-route-opened']) assert.equal(signal(runtime, id).ok, true, id);
  assert.equal(signal(runtime, 'vault-chamber-entered').ok, true);
  assert.equal(runtime.claimSignalVanguard({ explicitUserAction: true, receiptId: 'physical:reward:signal-vanguard' }).ok, true);
  assert.equal(signal(runtime, 'signal-vanguard-claimed').ok, true);
  assert.equal(runtime.selectCosmetic(EON_EXPANSE_W766G_SIGNAL_VANGUARD_REWARD.cosmeticId, { explicitUserAction: true }).ok, true);
  assert.equal(signal(runtime, 'signal-vanguard-activated').ok, true);
  assert.equal(signal(runtime, 'command-hub-returned').ok, true);
  assert.equal(runtime.confirmCampaignReceipt({ explicitUserAction: true }).ok, true);
  const state = runtime.getState();
  assert.equal(state.completedMissions.length, 7);
  assert.equal(state.totalXp, 2040);
  assert.equal(state.currentLevel, 8);
});

test('an early physical zone signal is not consumed and can succeed when its mission becomes active', () => {
  const runtime = createEonExpanseW766EMissionRuntime();
  const receiptId = 'zone-entry:beacon-fields';
  assert.equal(runtime.recordSignal('zone:beacon-fields', { receiptId }).reason, 'mission-locked');
  for (const id of ['expanse-reviewed', 'expanse-entered', 'companion-signal-detected', 'dormant-eonbot-scanned', 'companion-signal-core-recovered', 'companion-link-restored', 'pathfinder-met', 'map-opened', 'zone:gateway-overlook']) assert.equal(signal(runtime, id).ok, true, id);
  assert.equal(runtime.recordSignal('zone:beacon-fields', { receiptId }).ok, true);
});
