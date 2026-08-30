import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_PREMIUM_CAPABILITIES,
  EON_PREMIUM_COMMERCIAL_STATUS,
  EON_PREMIUM_SOFTWARE_TIERS,
  getEonPremiumCapability,
  validateEonPremiumCapabilityRegistry
} from '../../assets/js/capabilities/eon-premium-capability-registry.js';
import {
  EON_PREMIUM_ACCESS_STATES,
  resolveEonPremiumAccessState,
  validateEonPremiumAccessStateResolver
} from '../../assets/js/capabilities/eon-premium-access-state.js';

test('RT92 premium capability registry records LIVE Dodo tiers while keeping grant authority server-side', () => {
  const report = validateEonPremiumCapabilityRegistry();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.ok(report.capabilityCount >= 10);
  assert.deepEqual(EON_PREMIUM_SOFTWARE_TIERS.map((tier) => tier.id), ['pro', 'ultra', 'ultimate']);
  for (const tier of EON_PREMIUM_SOFTWARE_TIERS) {
    assert.equal(tier.commercialStatus, EON_PREMIUM_COMMERCIAL_STATUS);
    assert.equal(tier.dodoProductCreated, true);
    assert.equal(tier.checkoutActive, true);
  }
});

test('RT92 registry keeps one canonical home and freezes nested capability metadata', () => {
  for (const capability of EON_PREMIUM_CAPABILITIES) {
    assert.ok(capability.canonicalSurface, capability.id);
    assert.ok(capability.canonicalRoutes.length > 0, capability.id);
    assert.equal(Object.isFrozen(capability), true, capability.id);
    assert.equal(Object.isFrozen(capability.canonicalRoutes), true, capability.id);
    assert.equal(Object.isFrozen(capability.dependencies), true, capability.id);
    assert.equal(Object.isFrozen(capability.capacityResources), true, capability.id);
  }
  assert.equal(getEonPremiumCapability('work-queue-overview').universal, true);
  assert.deepEqual(getEonPremiumCapability('local-ai-autopilot').canonicalRoutes, ['/local-ai']);
  assert.deepEqual(getEonPremiumCapability('forge-repository-intelligence').canonicalRoutes, ['/forge']);
});

test('RT92 capability surfaces keep checkout centralized in Billing', () => {
  const report = validateEonPremiumAccessStateResolver();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.deepEqual(EON_PREMIUM_ACCESS_STATES, ['INCLUDED', 'AVAILABLE', 'PREVIEW', 'PRO', 'ULTRA', 'ULTIMATE', 'LIMIT_REACHED']);

  for (const liveTier of ['free', 'plus', 'studio', 'power', 'max']) {
    const locked = resolveEonPremiumAccessState('local-ai-autopilot', { subscriptionTierId: liveTier, commercialAvailability: { pro: true, ultra: true, ultimate: true } });
    assert.equal(locked.state, 'PRO', liveTier);
    assert.equal(locked.softwareAccess, false, liveTier);
    assert.equal(locked.purchaseAvailable, true, liveTier);
    assert.equal(locked.dodoEntitlementGrantedByThisResolver, false, liveTier);
  }
});

test('RT92 Ultimate unlock is software capability, never hosted capacity', () => {
  const access = resolveEonPremiumAccessState('parallel-eonbot-work', {
    subscriptionTierId: 'free',
    perpetualLicenses: ['ultimate']
  });
  assert.equal(access.softwareAccess, true);
  assert.equal(access.accessSource, 'ultimate-perpetual-license');
  assert.equal(access.hostedCapacityIncludedByThisResolver, false);
  assert.equal(access.capacitySeparateFromCapability, true);
  assert.equal(access.subscriptionTierId, 'free');
});

test('RT92 capacity exhaustion does not revoke software capability', () => {
  const access = resolveEonPremiumAccessState('forge-parallel-development', {
    subscriptionTierId: 'ultra',
    currentUsage: 2,
    limit: 2
  });
  assert.equal(access.state, 'LIMIT_REACHED');
  assert.equal(access.softwareAccess, true);
  assert.equal(access.currentUsage, 2);
  assert.equal(access.limit, 2);
});

test('RT92 basic Work Queue visibility remains universal', () => {
  for (const tier of ['free', 'plus', 'studio', 'power', 'max', 'pro', 'ultra']) {
    const access = resolveEonPremiumAccessState('work-queue-overview', { subscriptionTierId: tier });
    assert.equal(access.state, 'INCLUDED', tier);
    assert.equal(access.softwareAccess, true, tier);
    assert.equal(access.accessSource, 'universal', tier);
  }
});
