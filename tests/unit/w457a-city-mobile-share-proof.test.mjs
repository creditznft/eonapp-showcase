import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCityMobileShareProofExport, createCityMobileShareProofPacket, getCityMobileShareProofTruth, validateCityMobileShareProofPacket } from '../../assets/js/city/eon-city-mobile-share-proof.js';
import { W457A_CITY_MOBILE_SHARE_PROOF_CONTRACT, validateW457ACityMobileShareProofContract } from '../../config/w457a-city-mobile-share-proof-contract.mjs';
import { inspectW457ACityMobileShareProof } from '../../scripts/w457a-city-mobile-share-proof-gate.mjs';

test('W457.1 creates an explicit Android/iOS/controls packet that stays pending', () => {
  const packet = createCityMobileShareProofPacket();
  assert.deepEqual(validateW457ACityMobileShareProofContract(), []);
  assert.equal(validateCityMobileShareProofPacket(packet).ok, true);
  assert.equal(packet.status, 'manual-evidence-pending');
  assert.deepEqual(packet.deviceCases.map((entry) => entry.id), W457A_CITY_MOBILE_SHARE_PROOF_CONTRACT.deviceCaseIds);
  assert.equal(packet.deviceCases.every((entry) => entry.status === 'not-run' && entry.manualOnly === true), true);
  assert.equal(packet.relatedManualEvidence.validationLabCases.some((entry) => entry.id === 'android-touch-safe-areas'), true);
  assert.equal(packet.relatedManualEvidence.performanceLabCases.some((entry) => entry.id === 'iphone-safari'), true);
});

test('W457.1 reuses local cinematic review views and transparent Share Pack boundaries', () => {
  const packet = createCityMobileShareProofPacket();
  assert.ok(packet.cinematicViews.length >= 6);
  assert.equal(packet.cinematicViews.every((view) => view.localOnly && view.opensRoute && view.capturesMedia && view.uploadsMedia && view.manualCaptureOnly), true);
  assert.deepEqual(packet.sharePrivacyCases.map((entry) => entry.id), W457A_CITY_MOBILE_SHARE_PROOF_CONTRACT.sharePrivacyCaseIds);
  assert.equal(packet.shareBoundaries.sharePack.directPublishingBlocked, true);
  assert.equal(packet.shareBoundaries.sharePack.oauthConnectionsBlocked, true);
  assert.equal(packet.shareBoundaries.sharePack.trackingBlocked, true);
  assert.equal(packet.shareBoundaries.remixCard.directPublishingBlocked, true);
  assert.equal(packet.shareBoundaries.remixCard.trackingBlocked, true);
});

test('W457.1 exports instructions only and cannot create a device or posting claim', () => {
  const packet = createCityMobileShareProofPacket();
  const exported = JSON.parse(buildCityMobileShareProofExport(packet, { now: Date.UTC(2026, 5, 30) }));
  const truth = getCityMobileShareProofTruth();
  assert.equal(exported.status, 'manual-evidence-pending');
  assert.equal(exported.proofBoundary.deviceCertification, false);
  assert.equal(exported.proofBoundary.autoPosting, false);
  assert.equal(truth.phoneProbeCreated, false);
  assert.equal(truth.remoteEvidenceUploadCreated, false);
  assert.equal(truth.releaseApproval, false);
});

test('W457.1 source gate remains honest about the real device and share review still required', () => {
  const report = inspectW457ACityMobileShareProof();
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  assert.ok(report.cinematicViewCount >= 6);
  assert.match(report.limitations.join(' '), /Android, iOS, Safari/i);
});
