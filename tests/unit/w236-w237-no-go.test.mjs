import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateAccessMilestonePilotGate, requestAccessMilestonePilotActivation } from '../../config/access-milestone-pilot-gate.mjs';
import { SPONSORED_DISCOVERY_ACTIVE, SPONSORED_DISCOVERY_PROTECTED_SURFACES, canRenderSponsoredDiscovery, getSponsoredDiscoveryStatus } from '../../config/sponsored-discovery-policy.mjs';

test('W236 keeps the Access Milestone pilot at no-go until independent approval evidence exists', () => {
  const gate = evaluateAccessMilestonePilotGate();
  assert.equal(gate.go, false);
  assert.equal(gate.active, false);
  assert.ok(gate.missing.includes('legalAndConsumerReview'));
  assert.ok(gate.missing.includes('serverLedgerAndIdempotencyProof'));
  assert.equal(requestAccessMilestonePilotActivation().ok, false);
});

test('W237 has no sponsored discovery in Chat or protected app surfaces', () => {
  assert.equal(SPONSORED_DISCOVERY_ACTIVE, false);
  assert.equal(getSponsoredDiscoveryStatus().active, false);
  for (const route of ['/chat', '/eoncity', '/vault', '/realm-studio', '/market', '/local-ai']) {
    assert.ok(SPONSORED_DISCOVERY_PROTECTED_SURFACES.includes(route));
    assert.equal(canRenderSponsoredDiscovery(route).ok, false);
  }
});
