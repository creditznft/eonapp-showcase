/** W782A — static performance-budget readiness without claiming foreground certification. */
const freeze = Object.freeze;
export const EON_EXPANSE_W782A_PERFORMANCE_READINESS_SCHEMA = 'eon.expanse.performance-readiness.w782a.v1';

const metric = (estimate, budget, key) => {
  const used = Math.max(0, Number(estimate?.[key] || 0));
  const limit = Math.max(0, Number(budget?.[key] || 0));
  const ratio = limit > 0 ? used / limit : Number.POSITIVE_INFINITY;
  return freeze({ key, used, limit, ratio: Number.isFinite(ratio) ? ratio : null, withinBudget: limit > 0 && used <= limit });
};

export function deriveEonExpanseW782APerformanceReadiness({
  openWorldSummary = null,
  foregroundTelemetry = null,
  transitionSoak = null
} = {}) {
  const estimate = openWorldSummary?.performanceEstimate || null;
  const budget = openWorldSummary?.performanceBudget || null;
  const metrics = freeze([
    metric(estimate, budget, 'triangles'),
    metric(estimate, budget, 'drawCalls'),
    metric(estimate, budget, 'lights'),
    metric(estimate, budget, 'particles')
  ]);
  const staticBudgetAvailable = Boolean(estimate && budget);
  const staticBudgetPass = staticBudgetAvailable && metrics.every((entry) => entry.withinBudget);
  const foregroundMeasured = foregroundTelemetry?.foreground === true
    && Number.isFinite(Number(foregroundTelemetry?.p50Fps))
    && Number.isFinite(Number(foregroundTelemetry?.p95FrameMs));
  const foregroundPass = foregroundMeasured
    && Number(foregroundTelemetry.p50Fps) >= 30
    && Number(foregroundTelemetry.p95FrameMs) <= 50
    && Number(foregroundTelemetry.sustainedSingleDigitFrames || 0) === 0;
  const soakVerified = transitionSoak?.verified === true
    && Number(transitionSoak?.completedTransitions || 0) >= 10
    && Number(transitionSoak?.memoryGrowthBytes || 0) <= 0;
  const certificationReady = staticBudgetPass && foregroundPass && soakVerified;
  const status = !staticBudgetAvailable ? 'static-budget-data-required'
    : !staticBudgetPass ? 'static-budget-exceeded'
      : !foregroundMeasured ? 'foreground-browser-measurement-required'
        : !foregroundPass ? 'foreground-performance-repair-required'
          : !soakVerified ? 'hub-expanse-transition-soak-required'
            : 'performance-certification-ready';
  return freeze({
    schema: EON_EXPANSE_W782A_PERFORMANCE_READINESS_SCHEMA,
    quality: String(openWorldSummary?.quality || 'unknown'),
    staticBudgetAvailable,
    staticBudgetPass,
    metrics,
    foregroundMeasured,
    foregroundPass,
    soakVerified,
    certificationReady,
    status,
    telemetryAuthority: foregroundMeasured ? 'foreground-browser' : 'none',
    backgroundThrottleReportAcceptedAsCertification: false,
    automaticCertification: false,
    grantsXp: false,
    mutatesRuntime: false,
    privateContentStored: false
  });
}

export default freeze({ EON_EXPANSE_W782A_PERFORMANCE_READINESS_SCHEMA, deriveEonExpanseW782APerformanceReadiness });
