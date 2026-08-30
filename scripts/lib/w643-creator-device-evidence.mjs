import {
  W643_FALLBACK_RECEIPT_SCHEMA,
  W643_IMAGE_RECEIPT_SCHEMA,
  W643_VIDEO_RECEIPT_SCHEMA
} from '../../config/w643-creator-device-closure-contract.mjs';
const freeze = (value) => Object.freeze(value);
const HEX = /^[a-f0-9]{64}$/;
const LOOPBACK = /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d{2,5})?$/;
const iso = (value) => Number.isFinite(Date.parse(String(value || '')));
const noPath = (value) => !/(?:^[A-Za-z]:[\\/]|^\/|\\Users\\|\/home\/|\.\.[\\/])/.test(String(value || ''));
function common(value, schema) {
  const issues = [];
  if (value?.schema !== schema) issues.push('schema-invalid');
  if (value?.status !== 'pass') issues.push('status-not-pass');
  if (!iso(value?.occurredAt)) issues.push('occurred-at-invalid');
  if (value?.ownerReviewed !== true) issues.push('owner-review-required');
  if (value?.redactionReviewed !== true || value?.secretsIncluded !== false || value?.absolutePathsIncluded !== false) issues.push('redaction-boundary-invalid');
  if (!noPath(value?.artifactLabel)) issues.push('artifact-label-path-like');
  return issues;
}
export function validateW643ImageReceipt(value = {}) {
  const issues = common(value, W643_IMAGE_RECEIPT_SCHEMA);
  if (!HEX.test(String(value.outputSha256 || ''))) issues.push('output-digest-invalid');
  if (!Number.isInteger(value.outputBytes) || value.outputBytes < 1024) issues.push('output-bytes-invalid');
  if (!['png','jpeg','webp'].includes(value.outputKind)) issues.push('output-kind-invalid');
  if (Number(value.width) < 512 || Number(value.height) < 512 || Number(value.batch) !== 1) issues.push('image-baseline-invalid');
  if (!LOOPBACK.test(String(value.runtimeOrigin || ''))) issues.push('runtime-origin-not-loopback');
  for (const field of ['runtimeReached','gpuVisible','saved','reopened','librarySaved','projectContinuation','invalidInputRejected','runtimeRecoveryPassed']) if (value[field] !== true) issues.push(`${field}-required`);
  return freeze({ ok: issues.length === 0, issues: freeze([...new Set(issues)]) });
}
export function validateW643FourGbFallbackReceipt(value = {}) {
  const issues = common(value, W643_FALLBACK_RECEIPT_SCHEMA);
  const vram = Number(value.measuredUsableVramGb);
  if (!(vram >= 3 && vram < 6)) issues.push('owner-vram-class-invalid');
  if (value.runtimeReached !== true || value.capabilityVerdict !== 'unsupported') issues.push('fallback-capability-invalid');
  if (value.videoSubmissionAllowed !== false || value.queueAttempted !== false || value.modelDownloadStarted !== false || value.cloudFallbackStarted !== false) issues.push('fallback-side-effect-boundary-invalid');
  if (value.storyboardFallbackVisible !== true || value.supportedDeviceGuidanceVisible !== true || value.publicVideoGateClosed !== true) issues.push('fallback-ui-proof-required');
  return freeze({ ok: issues.length === 0, issues: freeze([...new Set(issues)]) });
}
export function validateW643ReferenceVideoReceipt(value = {}) {
  const issues = common(value, W643_VIDEO_RECEIPT_SCHEMA);
  if (Number(value.measuredUsableVramGb) < 8 || Number(value.systemRamGb) < 16 || Number(value.freeStorageGb) < 35) issues.push('reference-device-below-minimum');
  if (!HEX.test(String(value.outputSha256 || '')) || !Number.isInteger(value.outputBytes) || value.outputBytes < 4096) issues.push('video-output-invalid');
  for (const field of ['runtimeReached','reviewedWorkflowMatched','modelsReady','firstFrameValidated','saved','reopened','played','cancelledAndRetried','failureRecoveryPassed','librarySaved','projectContinuation']) if (value[field] !== true) issues.push(`${field}-required`);
  return freeze({ ok: issues.length === 0, issues: freeze([...new Set(issues)]) });
}
export function evaluateW643CreatorDeviceClosure(board = {}) {
  const image = validateW643ImageReceipt(board?.ownerImage?.receipt || {});
  const fallback = validateW643FourGbFallbackReceipt(board?.ownerFourGbVideoFallback?.receipt || {});
  const videoAttempted = board?.supportedReferenceVideo?.status === 'pass';
  const video = videoAttempted ? validateW643ReferenceVideoReceipt(board.supportedReferenceVideo.receipt || {}) : freeze({ ok: false, issues: freeze(['reference-video-not-run']) });
  const gate = board?.publicVideoGate?.status === 'closed' && board?.publicVideoGate?.copyTruthful === true && board?.publicVideoGate?.ownerReviewed === true;
  const launchScopePass = image.ok && fallback.ok && (video.ok || gate) && board?.ownerReviewed === true;
  return freeze({ schema: 'eonapp.creator-device-closure-result.w643.v1', wave: 'W643', launchScopePass, fullVideoCertified: video.ok, publicVideoEnabled: video.ok, publicVideoGateClosed: !video.ok && gate, image, fallback, video, productionVerdict: launchScopePass ? (video.ok ? 'pass-full' : 'pass-image-video-gated') : 'not-run-or-no-go' });
}
