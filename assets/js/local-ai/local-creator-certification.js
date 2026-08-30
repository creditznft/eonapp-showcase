/** W625H — evidence-gated local creator certification board. */
import { getLocalVideoProofTruth } from './local-video-proof.js';
import { getLocalImageProofTruth } from './local-image-proof.js';

export const LOCAL_CREATOR_CERTIFICATION_SCHEMA = 'eon.local-ai.creator-certification.w625h.v1';

const REQUIRED_VIDEO_LANES = Object.freeze([
  'runtimeStoppedAndRecovered',
  'fourGbFallback',
  'missingModelAndRecovered',
  'invalidInputRejected',
  'unapprovedEndpointRejected',
  'corsDeniedAndRecovered',
  'cancelledAndRetried',
  'timeoutOrCrashRecovered',
  'lowDiskProtected',
  'refreshResumeTruth',
  'previewDecodeRecovery'
]);

export function evaluateLocalCreatorCertification(input = {}) {
  const imageReceipt = input.imageReceipt || {};
  const videoReceipt = input.videoReceipt || {};
  const imagePass = imageReceipt.realImageProofPass === true;
  const videoNegative = videoReceipt.negativeLanes || {};
  const videoNegativePass = REQUIRED_VIDEO_LANES.every((key) => videoNegative[key] === 'pass');
  const videoPass = videoReceipt.realVideoProofPass === true && videoNegativePass;
  const benchmark = input.benchmark || {};
  const benchmarkPass = ['quality', 'latency', 'memory', 'failureRecovery', 'privacy', 'outputIntegrity', 'updateCompatibility']
    .every((key) => benchmark[key] === 'pass');
  const blockers = [];
  if (!imagePass) blockers.push('real-local-image-proof-pending');
  if (!videoPass) blockers.push('real-local-video-proof-pending');
  if (!videoNegativePass) blockers.push('video-recovery-matrix-incomplete');
  if (!benchmarkPass) blockers.push('fixed-benchmark-board-incomplete');
  if (input.referenceDeviceEvidence !== 'pass') blockers.push('supported-reference-device-evidence-pending');
  if (input.ownerFourGbFallbackEvidence !== 'pass') blockers.push('owner-four-gb-fallback-evidence-pending');
  const pass = blockers.length === 0;
  return Object.freeze({
    schema: LOCAL_CREATOR_CERTIFICATION_SCHEMA,
    pass,
    verdict: pass ? 'certified-supported-profiles-only' : 'no-go-real-evidence-pending',
    imagePass,
    videoPass,
    videoNegativePass,
    benchmarkPass,
    blockers: Object.freeze(blockers),
    supportedProfilesOnly: true,
    sourceIntegrationAloneCanPass: false,
    publicAllDeviceClaimAllowed: false
  });
}

export function buildLocalCreatorBenchmarkBoard(input = {}) {
  const fields = ['quality', 'latency', 'memory', 'failureRecovery', 'privacy', 'outputIntegrity', 'updateCompatibility'];
  const rows = Object.fromEntries(fields.map((key) => [key, ['pass', 'fail', 'pending'].includes(input[key]) ? input[key] : 'pending']));
  return Object.freeze({
    schema: 'eon.local-ai.creator-benchmark-board.w625h.v1',
    prompts: Object.freeze({ image: 'fixed-safe-image-prompt-v1', video: 'fixed-safe-i2v-input-and-motion-brief-v1' }),
    rows: Object.freeze(rows),
    fixedInputsRequired: true,
    realMediaRequired: true,
    updateCompatibilityRequiresRerun: true
  });
}

export function getLocalCreatorCertificationTruth() {
  return Object.freeze({
    schema: LOCAL_CREATOR_CERTIFICATION_SCHEMA,
    imageTruth: getLocalImageProofTruth(),
    videoTruth: getLocalVideoProofTruth(),
    realImageEvidenceRequired: true,
    realVideoEvidenceRequired: true,
    ownerFourGbFallbackRequired: true,
    supportedReferenceDeviceRequired: true,
    sourceIntegrationAloneCanPass: false,
    localVideoCurrentlyCertified: false
  });
}
