import assert from 'node:assert/strict';
import test from 'node:test';
import { W483_CEO_CITY_LAUNCH_AUDIT_CONTRACT, validateW483CeoCityLaunchAuditContract } from '../../config/w483-ceo-city-launch-audit-contract.mjs';
import { buildW483ExecutiveAuditPlan, inspectW483CeoCityLaunchAudit } from '../../scripts/w483-ceo-city-launch-audit-gate.mjs';

test('W483 contract preserves CEO launch domains and activation blocks', () => {
  assert.deepEqual(validateW483CeoCityLaunchAuditContract(), []);
  const domains = W483_CEO_CITY_LAUNCH_AUDIT_CONTRACT.domains.map((domain) => domain.id);
  for (const required of ['city-graphics', 'city-work-loop', 'creator-viral', 'vault-cash-trust', 'local-ai-media', 'iot-sync-devices', 'all-device-release']) {
    assert.ok(domains.includes(required));
  }
  assert.equal(W483_CEO_CITY_LAUNCH_AUDIT_CONTRACT.truth.iotDeviceControlActivationAllowedNow, false);
  assert.equal(W483_CEO_CITY_LAUNCH_AUDIT_CONTRACT.truth.paymentActivationAllowedNow, false);
  assert.equal(W483_CEO_CITY_LAUNCH_AUDIT_CONTRACT.truth.directSocialPostingActivationAllowedNow, false);
  assert.equal(W483_CEO_CITY_LAUNCH_AUDIT_CONTRACT.truth.localImageVideoAdapterActivationAllowedNow, false);
});

test('W483 executive plan gives the owner clear wave count and proof duties', () => {
  const plan = buildW483ExecutiveAuditPlan();
  assert.match(plan, /remaining work is \*\*3 waves\*\*/i);
  assert.match(plan, /EON City is the flagship/i);
  assert.match(plan, /capture-eoncity-desktop-balanced-cinematic-screenshots/i);
  assert.match(plan, /Payments, direct social OAuth posting, local image\/video adapters, and IoT\/device control stay OFF/i);
});

test('W483 source gate passes and returns Codex-only evidence remainder', () => {
  const report = inspectW483CeoCityLaunchAudit();
  assert.equal(report.status, 'pass');
  assert.equal(report.remainingWaveCountBeforeOwnerGo, 3);
  assert.ok(report.checkCount >= 12);
  assert.equal(report.activationBlocks.iotDeviceControl, true);
  assert.ok(report.codexOnlyRemainder.includes('capture-lighthouse-route-matrix'));
});
