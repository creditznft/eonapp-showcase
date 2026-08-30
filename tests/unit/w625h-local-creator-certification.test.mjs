import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLocalCreatorBenchmarkBoard,
  evaluateLocalCreatorCertification,
  getLocalCreatorCertificationTruth
} from '../../assets/js/local-ai/local-creator-certification.js';

const negative = Object.freeze({
  runtimeStoppedAndRecovered: 'pass',
  fourGbFallback: 'pass',
  missingModelAndRecovered: 'pass',
  invalidInputRejected: 'pass',
  unapprovedEndpointRejected: 'pass',
  corsDeniedAndRecovered: 'pass',
  cancelledAndRetried: 'pass',
  timeoutOrCrashRecovered: 'pass',
  lowDiskProtected: 'pass',
  refreshResumeTruth: 'pass',
  previewDecodeRecovery: 'pass'
});
const benchmark = Object.freeze({ quality: 'pass', latency: 'pass', memory: 'pass', failureRecovery: 'pass', privacy: 'pass', outputIntegrity: 'pass', updateCompatibility: 'pass' });

test('W625H source integration alone is a no-go', () => {
  const result = evaluateLocalCreatorCertification({});
  assert.equal(result.pass, false);
  assert.equal(result.verdict, 'no-go-real-evidence-pending');
  assert.ok(result.blockers.includes('real-local-video-proof-pending'));
});

test('W625H requires image, video, benchmark, reference device and owner 4 GB fallback', () => {
  const result = evaluateLocalCreatorCertification({
    imageReceipt: { realImageProofPass: true },
    videoReceipt: { realVideoProofPass: true, negativeLanes: negative },
    benchmark,
    referenceDeviceEvidence: 'pass',
    ownerFourGbFallbackEvidence: 'pending'
  });
  assert.equal(result.pass, false);
  assert.ok(result.blockers.includes('owner-four-gb-fallback-evidence-pending'));
});

test('W625H complete real evidence can certify supported profiles only', () => {
  const result = evaluateLocalCreatorCertification({
    imageReceipt: { realImageProofPass: true },
    videoReceipt: { realVideoProofPass: true, negativeLanes: negative },
    benchmark,
    referenceDeviceEvidence: 'pass',
    ownerFourGbFallbackEvidence: 'pass'
  });
  assert.equal(result.pass, true);
  assert.equal(result.verdict, 'certified-supported-profiles-only');
  assert.equal(result.publicAllDeviceClaimAllowed, false);
});

test('W625H benchmark board defaults to pending', () => {
  const board = buildLocalCreatorBenchmarkBoard({ quality: 'pass' });
  assert.equal(board.rows.quality, 'pass');
  assert.equal(board.rows.latency, 'pending');
  assert.equal(board.realMediaRequired, true);
});

test('W625H truth keeps local video uncertified until real proof', () => {
  const truth = getLocalCreatorCertificationTruth();
  assert.equal(truth.localVideoCurrentlyCertified, false);
  assert.equal(truth.sourceIntegrationAloneCanPass, false);
  assert.equal(truth.ownerFourGbFallbackRequired, true);
});
