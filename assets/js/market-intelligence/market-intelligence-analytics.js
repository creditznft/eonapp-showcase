/** Deterministic local historical review. It does not predict outcomes. */
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const pct = (change, base) => base > 0 ? Number(((change / base) * 100).toFixed(2)) : 0;

export function summarizeLocalSeries(points = []) {
  const series = [...(Array.isArray(points) ? points : [])]
    .filter((point) => finite(point?.value, NaN) > 0 && point?.time)
    .sort((left, right) => String(left.time).localeCompare(String(right.time)));
  if (!series.length) return { count: 0, start: null, end: null, changePct: 0, high: null, low: null, maxDrawdownPct: 0 };
  const values = series.map((point) => finite(point.value));
  let peak = values[0];
  let maxDrawdownPct = 0;
  for (const value of values) {
    peak = Math.max(peak, value);
    maxDrawdownPct = Math.max(maxDrawdownPct, pct(peak - value, peak));
  }
  const start = series[0];
  const end = series.at(-1);
  return {
    count: series.length,
    start,
    end,
    changePct: pct(end.value - start.value, start.value),
    high: Math.max(...values),
    low: Math.min(...values),
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(2))
  };
}

export function createHistoricalScenarioReview(points = [], { referenceValue = 1000, sourceLabel = 'User-provided local series' } = {}) {
  const summary = summarizeLocalSeries(points);
  const startValue = Math.max(1, finite(referenceValue, 1000));
  const endValue = summary.count ? Number((startValue * (1 + summary.changePct / 100)).toFixed(2)) : startValue;
  return {
    schema: 'eon.market-intelligence.historical-scenario-review.v1',
    sourceLabel: String(sourceLabel || 'User-provided local series').slice(0, 140),
    observations: summary.count,
    window: summary.start && summary.end ? { from: summary.start.time, to: summary.end.time } : null,
    referenceValue: startValue,
    hypotheticalEndValue: endValue,
    changePct: summary.changePct,
    maxObservedDrawdownPct: summary.maxDrawdownPct,
    externalSideEffects: false,
    liveMarketData: false,
    prediction: false,
    assumptions: [
      'Uses only the local series selected by the user.',
      'Shows a historical path review, not a forecast or recommendation.',
      'Does not model execution, liquidity, taxes, fees, spreads or personal circumstances.',
      'Does not create, transmit or simulate an external order.'
    ]
  };
}
