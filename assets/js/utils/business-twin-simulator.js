/**
 * business-twin-simulator.js
 * Scenario simulator for projected KPI impact before execution.
 */

function clamp(/** @type {any} */ value, /** @type {any} */ min, /** @type {any} */ max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function pct(/** @type {any} */ value) {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * @param {{
 *   baseline?: { traffic?: number, conversionRate?: number, avgOrderValue?: number, churnRate?: number },
 *   plan?: { trafficLift?: number, conversionLift?: number, aovLift?: number, churnDelta?: number, spendUsd?: number }
 * }} input
 */
export function simulateBusinessTwin(/** @type {any} */ input = {}) {
  const /** @type {any} */
baseline = {
    traffic: clamp(input?.baseline?.traffic ?? 10000, 1, 100000000),
    conversionRate: clamp(input?.baseline?.conversionRate ?? 0.02, 0.0001, 1),
    avgOrderValue: clamp(input?.baseline?.avgOrderValue ?? 49, 0.01, 1000000),
    churnRate: clamp(input?.baseline?.churnRate ?? 0.08, 0, 1)
  };

  const /** @type {any} */
plan = {
    trafficLift: clamp(input?.plan?.trafficLift ?? 0.08, -0.95, 4),
    conversionLift: clamp(input?.plan?.conversionLift ?? 0.04, -0.95, 4),
    aovLift: clamp(input?.plan?.aovLift ?? 0.03, -0.95, 4),
    churnDelta: clamp(input?.plan?.churnDelta ?? -0.01, -0.5, 0.5),
    spendUsd: clamp(input?.plan?.spendUsd ?? 0, 0, 100000000)
  };

  const projectedTraffic = baseline.traffic * (1 + plan.trafficLift);
  const projectedConversionRate = clamp(baseline.conversionRate * (1 + plan.conversionLift), 0.0001, 1);
  const projectedAov = baseline.avgOrderValue * (1 + plan.aovLift);
  const projectedChurn = clamp(baseline.churnRate + plan.churnDelta, 0, 1);

  const baselineRevenue = baseline.traffic * baseline.conversionRate * baseline.avgOrderValue;
  const projectedRevenue = projectedTraffic * projectedConversionRate * projectedAov;
  const deltaRevenue = projectedRevenue - baselineRevenue;
  const roi = plan.spendUsd > 0 ? (deltaRevenue - plan.spendUsd) / plan.spendUsd : null;

  const confidence = clamp(0.55 + (Math.min(Math.abs(plan.trafficLift) + Math.abs(plan.conversionLift), 1) * 0.2) - (Math.abs(plan.churnDelta) * 0.1), 0.3, 0.95);

  return {
    baseline,
    plan,
    projected: {
      traffic: Math.round(projectedTraffic),
      conversionRate: projectedConversionRate,
      avgOrderValue: Number(projectedAov.toFixed(2)),
      churnRate: projectedChurn,
      revenueUsd: Number(projectedRevenue.toFixed(2))
    },
    deltas: {
      revenueUsd: Number(deltaRevenue.toFixed(2)),
      revenuePct: baselineRevenue > 0 ? Number((deltaRevenue / baselineRevenue).toFixed(4)) : 0,
      churnPctPoints: Number((projectedChurn - baseline.churnRate).toFixed(4))
    },
    riskNotes: [
      projectedChurn > baseline.churnRate ? 'Churn risk increased in this scenario.' : 'Churn trend is neutral/improving.',
      plan.spendUsd > 0 && deltaRevenue < plan.spendUsd ? 'Projected incremental revenue does not fully cover spend.' : 'Projected incremental revenue covers spend under base assumptions.'
    ],
    confidence,
    // P2: roi_warning — flag negative ROI explicitly so callers can surface it in UI
    roi_warning: roi !== null && roi < 0,
    summary: {
      revenue: `${baselineRevenue.toFixed(2)} -> ${projectedRevenue.toFixed(2)} USD`,
      churn: `${pct(baseline.churnRate)} -> ${pct(projectedChurn)}`,
      conversion: `${pct(baseline.conversionRate)} -> ${pct(projectedConversionRate)}`
    },
    roi
  };
}
