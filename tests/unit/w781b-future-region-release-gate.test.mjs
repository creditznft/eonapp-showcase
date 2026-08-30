import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveEonExpanseW781BFutureRegionReleaseGate } from '../../assets/js/city/w781/eon-expanse-w781b-future-region-release-gate.js';

const programme = { visible: true, reviewAvailable: true, recommendedRegion: { id: 'storm-sector' } };

test('W781B blocks release before maintained post-campaign readiness', () => {
  const gate = deriveEonExpanseW781BFutureRegionReleaseGate({ programme: { visible: true, reviewAvailable: false }, artAudit: { releaseReady: true } });
  assert.equal(gate.releaseReady, false);
  assert.equal(gate.status, 'maintained-frontier-pillars-required');
});

test('W781B blocks release while deterministic development proxies remain', () => {
  const gate = deriveEonExpanseW781BFutureRegionReleaseGate({ programme, artAudit: { releaseReady: false, blockingProxyCount: 19, blockers: [{ id: 'interactive-building-proxies' }] } });
  assert.equal(gate.foundationReady, true);
  assert.equal(gate.proxyArtReady, false);
  assert.equal(gate.blockingProxyCount, 19);
  assert.equal(gate.status, 'development-proxy-replacement-required');
});

test('W781B still requires an exact authored package certification after proxy replacement', () => {
  const gate = deriveEonExpanseW781BFutureRegionReleaseGate({ programme, artAudit: { releaseReady: true }, authoredRegionPackageCertification: { ok: false } });
  assert.equal(gate.releaseReady, false);
  assert.equal(gate.status, 'authored-region-package-certification-required');
});

test('W781B accepts only a certification matching the recommended maintained region', () => {
  const mismatch = deriveEonExpanseW781BFutureRegionReleaseGate({ programme, artAudit: { releaseReady: true }, authoredRegionPackageCertification: { ok: true, regionId: 'glass-desert' } });
  const exact = deriveEonExpanseW781BFutureRegionReleaseGate({ programme, artAudit: { releaseReady: true }, authoredRegionPackageCertification: { ok: true, regionId: 'storm-sector' } });
  assert.equal(mismatch.releaseReady, false);
  assert.equal(exact.releaseReady, true);
  assert.equal(exact.status, 'future-region-release-ready');
});

test('W781B never activates a gateway or mutates progression itself', () => {
  const gate = deriveEonExpanseW781BFutureRegionReleaseGate({ programme, artAudit: { releaseReady: true }, authoredRegionPackageCertification: { ok: true, regionId: 'storm-sector' } });
  assert.equal(gate.gatewayActivated, false);
  assert.equal(gate.automaticUnlock, false);
  assert.equal(gate.createsRegion, false);
  assert.equal(gate.rendersRegion, false);
  assert.equal(gate.grantsXp, false);
  assert.equal(gate.mutatesProgression, false);
});
