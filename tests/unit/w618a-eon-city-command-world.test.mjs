import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildEonCityCommandWorldPlan,
  decideNextEonCityWave,
  validateEonCityCommandWorldPlan
} from '../../assets/js/city/eon-city-command-world-plan.js';
import {
  EON_CITY_CONTROL_CONVENTION,
  resolveEonCityCameraRelativeMove,
  validateEonCityGameplayContract
} from '../../assets/js/city/eon-city-gameplay-contract.js';
import { inspectW618aEonCityCommandWorldGate } from '../../scripts/w618a-eon-city-command-world-gate.mjs';

test('W618A locks the approved three-layer EON City direction', () => {
  const plan = buildEonCityCommandWorldPlan();
  assert.equal(plan.schema, 'eon.city.command-world-plan.w618a.v1');
  assert.equal(plan.approvedDirection, 'command-room-plus-living-dashboard-plus-agent-theater');
  assert.equal(plan.keepExistingAssets, true);
  assert.equal(plan.keepExistingDistricts, true);
  assert.deepEqual(plan.layers.map((layer) => layer.id), ['command-room', 'living-dashboard', 'agent-theater']);
  assert.equal(plan.layers.find((layer) => layer.defaultMode)?.id, 'command-room');
  assert.equal(plan.topRightShareRequiredEverywhere, true);
  assert.equal(plan.noFakeAgentActivity, true);
  assert.equal(plan.serverCheckoutAuthorityRequired, true);
  assert.equal(plan.rewardedSponsorAuthorityRequired, true);
  assert.equal(plan.noBrowserEntitlementAuthority, true);
});

test('W618A roadmap preserves historical waves and marks RT92 live server authority as current', () => {
  const plan = buildEonCityCommandWorldPlan();
  assert.deepEqual(plan.roadmap.map((wave) => wave.id), ['w618a', 'w618b', 'w618c', 'w618d', 'w618e', 'w618f', 'w619', 'rt92-live']);
  assert.equal(plan.roadmap.find((wave) => wave.codingNow)?.id, 'rt92-live');
  assert.match(plan.roadmap.find((wave) => wave.id === 'w618b')?.deliverable || '', /Share Command Center/);
  assert.match(plan.roadmap.find((wave) => wave.id === 'w619')?.deliverable || '', /Historical design wave/);
  assert.match(plan.roadmap.find((wave) => wave.id === 'rt92-live')?.deliverable || '', /paid access, referral EONKEYS and voluntary Sponsor Keys/);
});

test('W618A fixes the default Babylon screen-right convention and enables direct City mouse travel', () => {
  const validation = validateEonCityGameplayContract();
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  const right = resolveEonCityCameraRelativeMove({ input: { strafe: 1 }, cameraForward: { x: 0, z: 1 } });
  assert.equal(right.x, 1);
  assert.equal(right.z, 0);
  assert.equal(EON_CITY_CONTROL_CONVENTION.leftRightInverted, false);
  assert.equal(EON_CITY_CONTROL_CONVENTION.clickToMoveDefaultForDirectCity, true);
  assert.equal(EON_CITY_CONTROL_CONVENTION.quickOpenStillRequiresVisibleReview, true);
});

test('W618A next-wave decision keeps live commercial rails independent from City acceptance', () => {
  const beforeProof = decideNextEonCityWave({});
  assert.equal(beforeProof.next, 'rt92-live');
  assert.equal(beforeProof.billingAllowed, true);
  assert.equal(beforeProof.browserMayGrantEntitlement, false);
  assert.equal(beforeProof.browserMayGrantReward, false);
  const afterProof = decideNextEonCityWave({ cityUsabilityPassed: true, globalSharePassed: true, commandRoomPassed: true, browserProofPassed: true });
  assert.equal(afterProof.next, 'rt92-live');
  assert.equal(afterProof.billingAllowed, true);
  assert.match(afterProof.reason, /live acceptance/);
});

test('W618A validation and standalone gate pass', () => {
  const validation = validateEonCityCommandWorldPlan(buildEonCityCommandWorldPlan());
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  const gate = inspectW618aEonCityCommandWorldGate();
  assert.equal(gate.ok, true, gate.errors.join('\n'));
  assert.equal(gate.planSummary.default, 'command-room');
});
