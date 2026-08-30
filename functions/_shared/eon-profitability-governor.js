const DAY_MS = 24 * 60 * 60 * 1000;
const MODES = new Set(['observe', 'enforce']);

function boundedNumber(value, fallback, min, max) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}
function clean(value = '', max = 80) {
  return String(value || '').trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max);
}

export function getVexrailProfitabilityGovernorConfig(env = {}) {
  const modeRaw = clean(env.EON_VEXRAIL_PROFIT_GOVERNOR_MODE || 'observe', 16).toLowerCase();
  return Object.freeze({
    mode: MODES.has(modeRaw) ? modeRaw : 'observe',
    targetRatio: boundedNumber(env.EON_VEXRAIL_AI_COVERAGE_TARGET, 1.25, 1, 10),
    minimumPrompts: Math.floor(boundedNumber(env.EON_VEXRAIL_PROFIT_MIN_PROMPTS, 200, 10, 100_000)),
    windowDays: Math.floor(boundedNumber(env.EON_VEXRAIL_PROFIT_WINDOW_DAYS, 7, 1, 30)),
    learningLossBudgetMicros: Math.floor(boundedNumber(env.EON_VEXRAIL_LEARNING_LOSS_BUDGET_MICROS, 0, 0, 1_000_000_000)),
    learningPromptBudget: Math.floor(boundedNumber(env.EON_VEXRAIL_LEARNING_PROMPT_BUDGET, 50, 1, 10_000))
  });
}

export function evaluateVexrailProfitabilitySnapshot(snapshot = {}, config = getVexrailProfitabilityGovernorConfig({})) {
  const observedPrompts = Math.max(0, Math.floor(Number(snapshot.observedPrompts) || 0));
  const revenueMicros = Math.max(0, Math.floor(Number(snapshot.revenueMicros) || 0));
  const costMicros = Math.max(0, Math.floor(Number(snapshot.costMicros) || 0));
  const revenueEvidenceRows = Math.max(0, Math.floor(Number(snapshot.revenueEvidenceRows) || 0));
  const costEvidenceRows = Math.max(0, Math.floor(Number(snapshot.costEvidenceRows) || 0));
  const reconciled = revenueEvidenceRows > 0 && costEvidenceRows > 0 && costMicros > 0;
  const ratio = reconciled ? revenueMicros / costMicros : null;
  const sufficientSample = observedPrompts >= config.minimumPrompts && reconciled;
  const learningLossMicros = Math.max(0, costMicros - revenueMicros);
  let state = 'YELLOW';
  let reason = reconciled ? 'learning_sample' : 'economics_unreconciled';
  if (sufficientSample && ratio >= config.targetRatio) {
    state = 'GREEN'; reason = 'coverage_target_met';
  } else if (sufficientSample) {
    state = 'RED'; reason = 'coverage_target_missed';
  } else if (!reconciled && observedPrompts >= config.learningPromptBudget) {
    state = 'RED'; reason = 'learning_reconciliation_required';
  } else if (reconciled && learningLossMicros > config.learningLossBudgetMicros) {
    state = 'RED'; reason = 'learning_loss_budget_exhausted';
  }
  const allowed = config.mode === 'observe' || state === 'GREEN' || (state === 'YELLOW' && learningLossMicros <= config.learningLossBudgetMicros);
  return Object.freeze({
    state, reason, allowed, mode: config.mode, targetRatio: config.targetRatio, ratio,
    observedPrompts, revenueMicros, costMicros, reconciled, sufficientSample,
    learningLossMicros, learningLossBudgetMicros: config.learningLossBudgetMicros,
    minimumPrompts: config.minimumPrompts, windowDays: config.windowDays, learningPromptBudget: config.learningPromptBudget
  });
}

export async function readVexrailProfitabilityGovernor(database, { country = '', requestClass = '', userCohort = '' } = {}, env = {}, now = Date.now()) {
  const config = getVexrailProfitabilityGovernorConfig(env);
  if (!database?.prepare) {
    return Object.freeze({ ...evaluateVexrailProfitabilitySnapshot({}, config), state: 'RED', reason: 'profitability_ledger_unavailable', allowed: config.mode === 'observe' });
  }
  const safeCountry = clean(country, 2).toUpperCase();
  const safeClass = clean(requestClass, 40);
  const safeCohort = clean(userCohort, 40);
  const since = Math.floor((Number(now) - config.windowDays * DAY_MS) / DAY_MS) * DAY_MS;
  try {
    const row = await database.prepare(`SELECT
      COALESCE(SUM(ai_prompt_count),0) AS observed_prompts,
      COALESCE(SUM(CASE WHEN revenue_reconciled=1 THEN vexrail_revenue_micros ELSE 0 END),0) AS revenue_micros,
      COALESCE(SUM(CASE WHEN vexrail_cost_reconciled=1 THEN vexrail_cost_micros ELSE 0 END),0) AS cost_micros,
      COALESCE(SUM(CASE WHEN revenue_reconciled=1 THEN 1 ELSE 0 END),0) AS revenue_evidence_rows,
      COALESCE(SUM(CASE WHEN vexrail_cost_reconciled=1 THEN 1 ELSE 0 END),0) AS cost_evidence_rows
      FROM eon_profitability_daily
      WHERE day_started_at>=? AND provider='vexrail' AND country=? AND (request_class=? OR request_class='')
        AND (?='' OR user_cohort=?)`).bind(since, safeCountry, safeClass, safeCohort, safeCohort).first();
    return evaluateVexrailProfitabilitySnapshot({
      observedPrompts: row?.observed_prompts,
      revenueMicros: row?.revenue_micros,
      costMicros: row?.cost_micros,
      revenueEvidenceRows: row?.revenue_evidence_rows,
      costEvidenceRows: row?.cost_evidence_rows
    }, config);
  } catch {
    return Object.freeze({ ...evaluateVexrailProfitabilitySnapshot({}, config), state: 'RED', reason: 'profitability_ledger_unavailable', allowed: config.mode === 'observe' });
  }
}
