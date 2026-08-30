/** W790A — normalized foreground browser and transition-soak evidence. */
const freeze = Object.freeze;
export const EON_EXPANSE_W790A_PERFORMANCE_EVIDENCE_SCHEMA = 'eon.expanse.performance-certification-evidence.w790a.v1';
const QUALITY = freeze(['lite', 'balanced', 'cinematic']);
const BROWSERS = freeze(['chrome-desktop', 'edge-desktop', 'mobile-landscape']);
const digest = (value = '') => /^[a-f0-9]{64}$/i.test(String(value || '')) ? String(value).toLowerCase() : '';
const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

export function sanitizeEonExpanseW790APerformanceEvidence(input = null) {
  if (!input || typeof input !== 'object') return null;
  const quality = QUALITY.includes(input.quality) ? input.quality : '';
  const buildDigest = digest(input.buildDigest);
  const browserProofId = BROWSERS.includes(input?.foregroundTelemetry?.browserProofId) ? input.foregroundTelemetry.browserProofId : '';
  const p50Fps = finite(input?.foregroundTelemetry?.p50Fps);
  const p95FrameMs = finite(input?.foregroundTelemetry?.p95FrameMs);
  const sustainedSingleDigitFrames = finite(input?.foregroundTelemetry?.sustainedSingleDigitFrames);
  const foregroundMeasuredAt = finite(input?.foregroundTelemetry?.measuredAt);
  const completedTransitions = finite(input?.transitionSoak?.completedTransitions);
  const memoryGrowthBytes = finite(input?.transitionSoak?.memoryGrowthBytes);
  const soakMeasuredAt = finite(input?.transitionSoak?.measuredAt);
  if (!quality || !buildDigest || !browserProofId) return null;
  if (input?.foregroundTelemetry?.foreground !== true || !(p50Fps > 0 && p50Fps <= 240) || !(p95FrameMs > 0 && p95FrameMs <= 1000) || !(sustainedSingleDigitFrames >= 0) || !(foregroundMeasuredAt > 0)) return null;
  if (input?.transitionSoak?.verified !== true || !(completedTransitions >= 0) || memoryGrowthBytes === null || !(soakMeasuredAt > 0)) return null;
  if (input?.oneCanonicalScene !== true || input?.ownsEngine === true || input?.ownsScene === true || input?.ownsRenderLoop === true || input?.privateContentStored === true || input?.backgroundThrottleReport === true) return null;
  return freeze({
    schema: EON_EXPANSE_W790A_PERFORMANCE_EVIDENCE_SCHEMA,
    quality,
    buildDigest,
    foregroundTelemetry: freeze({
      foreground: true,
      browserProofId,
      p50Fps,
      p95FrameMs,
      sustainedSingleDigitFrames: Math.floor(sustainedSingleDigitFrames),
      measuredAt: foregroundMeasuredAt
    }),
    transitionSoak: freeze({
      verified: true,
      completedTransitions: Math.floor(completedTransitions),
      memoryGrowthBytes,
      measuredAt: soakMeasuredAt
    }),
    oneCanonicalScene: true,
    ownsEngine: false,
    ownsScene: false,
    ownsRenderLoop: false,
    backgroundThrottleReportAccepted: false,
    status: 'foreground-performance-evidence-recorded-not-certified',
    automaticCertification: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW790APerformanceEvidence(evidence = null, { expectedQuality = '', expectedBuildDigest = '' } = {}) {
  const state = sanitizeEonExpanseW790APerformanceEvidence(evidence);
  const errors = [];
  if (!state) errors.push('performance-evidence-invalid');
  if (state && expectedQuality && state.quality !== expectedQuality) errors.push('quality-profile-mismatch');
  if (state && expectedBuildDigest && state.buildDigest !== digest(expectedBuildDigest)) errors.push('build-digest-mismatch');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), evidence: errors.length === 0 ? state : null });
}

export default freeze({ EON_EXPANSE_W790A_PERFORMANCE_EVIDENCE_SCHEMA, sanitizeEonExpanseW790APerformanceEvidence, validateEonExpanseW790APerformanceEvidence });
