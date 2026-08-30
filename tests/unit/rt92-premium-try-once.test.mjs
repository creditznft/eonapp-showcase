import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEonPremiumTryOnceHandoff, validateEonPremiumTryOnce } from '../../assets/js/capabilities/eon-premium-try-once.js';

test('RT92 TRY ONCE reuses existing canonical foundations without granting premium access', () => {
  const report = validateEonPremiumTryOnce();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.ok(report.handoffCount >= 6);
});

test('RT92 Business Brief TRY ONCE reuses the existing local-business-brief workflow', () => {
  const handoff = buildEonPremiumTryOnceHandoff('business-intelligence-briefs');
  assert.equal(handoff.ok, true);
  assert.equal(handoff.route, '/automations');
  assert.equal(handoff.existingFoundation, 'local-business-brief');
  assert.equal(handoff.entitlementGranted, false);
  assert.equal(handoff.recurringCapabilityGranted, false);
  assert.equal(handoff.executionStarted, false);
});

test('RT92 unsupported expensive parallel capability has no TRY ONCE shortcut', () => {
  const handoff = buildEonPremiumTryOnceHandoff('parallel-eonbot-work');
  assert.equal(handoff.ok, false);
  assert.equal(handoff.reason, 'try-once-not-available');
});
