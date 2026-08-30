/**
 * Scenario Studio is a private, non-monetary calibration journal.
 * It deliberately rejects stake, reward, payout, token and tradable-contract inputs.
 */
const ECONOMIC_FIELDS = Object.freeze(['stake', 'entryFee', 'prize', 'reward', 'payout', 'cashout', 'token', 'contractPrice', 'tradeable', 'tradable']);
const stripControls = (value) => [...String(value ?? '')].filter((character) => { const code = character.codePointAt(0) || 0; return code >= 32 && code !== 127; }).join('');
const cleanText = (value, max = 900) => stripControls(value).replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const finite = (value, fallback = 50) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export const FORECAST_ORACLE_POLICY = Object.freeze({
  schema: 'eon.market-intelligence.forecast-oracle-policy.v1',
  monetaryIncentives: false,
  transferableValue: false,
  publicMarket: false,
  automatedResolution: false,
  personalisedAdvice: false
});

export function sanitizeForecastDraft(input = {}) {
  const detectedEconomicFields = ECONOMIC_FIELDS.filter((field) => Object.prototype.hasOwnProperty.call(input, field));
  return {
    title: cleanText(input.title, 160),
    resolutionCriteria: cleanText(input.resolutionCriteria, 900),
    probability: Math.min(99, Math.max(1, Math.round(finite(input.probability, 50)))),
    domain: ['market', 'business', 'ecommerce', 'general'].includes(input.domain) ? input.domain : 'general',
    dueAt: cleanText(input.dueAt, 60),
    detectedEconomicFields
  };
}

export function createForecast(input = {}) {
  const draft = sanitizeForecastDraft(input);
  const errors = [];
  if (draft.detectedEconomicFields.length) errors.push('Scenario Studio does not accept stakes, rewards, payouts, tokens or tradable contracts.');
  if (draft.title.length < 8) errors.push('Describe a concrete question or event in at least eight characters.');
  if (draft.resolutionCriteria.length < 12) errors.push('Add a clear, checkable resolution criterion.');
  if (!draft.dueAt) errors.push('Choose a resolution date.');
  if (errors.length) return { ok: false, errors, forecast: null };
  return {
    ok: true,
    errors: [],
    forecast: {
      id: `forecast-${Date.now().toString(36)}`,
      title: draft.title,
      resolutionCriteria: draft.resolutionCriteria,
      probability: draft.probability,
      domain: draft.domain,
      dueAt: draft.dueAt,
      createdAt: new Date().toISOString(),
      outcome: null,
      resolvedAt: null,
      brierScore: null,
      policy: FORECAST_ORACLE_POLICY.schema
    }
  };
}

export function buildForecastCalibrationSummary(forecasts = []) {
  const resolved = (Array.isArray(forecasts) ? forecasts : []).filter((forecast) => ['yes', 'no'].includes(forecast?.outcome) && Number.isFinite(Number(forecast?.brierScore)));
  const meanBrier = resolved.length ? resolved.reduce((sum, forecast) => sum + Number(forecast.brierScore), 0) / resolved.length : null;
  const yesRate = resolved.length ? resolved.filter((forecast) => forecast.outcome === 'yes').length / resolved.length : null;
  return {
    resolvedCount: resolved.length,
    openCount: Math.max(0, (Array.isArray(forecasts) ? forecasts.length : 0) - resolved.length),
    meanBrierScore: meanBrier === null ? null : Number(meanBrier.toFixed(4)),
    observedYesRate: yesRate === null ? null : Number((yesRate * 100).toFixed(1)),
    policy: FORECAST_ORACLE_POLICY,
    note: 'Calibration measures how probabilities matched manually recorded outcomes. It is not a return, performance or advice score.'
  };
}
