/** W626G — user-owned spending, outage and moderation safety. */
const freeze = Object.freeze;
const RECOVERABLE_CODES = new Set(['rate-limited', 'quota-exhausted', 'provider-outage', 'result-expired', 'region-restricted', 'account-action-required']);
const SAFE_PROVIDER_MESSAGES = Object.freeze({
  'rate-limited': 'The provider rate-limited this request. Retry only when you choose.',
  'quota-exhausted': 'The provider reports a quota or billing limit. Review your provider account before retrying.',
  'provider-outage': 'The provider is temporarily unavailable. No automatic retry was started.',
  'result-expired': 'The provider result is unavailable or expired. Start a new job only if you choose.',
  'region-restricted': 'The provider reports that this request is unavailable in the current region.',
  'account-action-required': 'The provider requires an account, permission, or credential action before another request.',
  'provider-moderation-response': 'The provider rejected this request under its safety or moderation rules.',
  'provider-failure': 'The provider request failed. No automatic retry or provider fallback was started.'
});

export function evaluateDirectJobSpend({ estimate = null, budget = {}, explicitConfirmation = false } = {}) {
  const warning = Math.max(0, Number(budget.warningAmount || 0) || 0);
  const hardStop = Math.max(0, Number(budget.hardStopAmount || 0) || 0);
  const amount = estimate?.available === true && Number.isFinite(Number(estimate.amount)) ? Math.max(0, Number(estimate.amount)) : null;
  if (explicitConfirmation !== true) return freeze({ allowed: false, reason: 'per-job-confirmation-required', amount, automaticPaidRetry: false });
  if (amount !== null && hardStop > 0 && amount > hardStop) return freeze({ allowed: false, reason: 'hard-budget-stop', amount, automaticPaidRetry: false });
  if (amount !== null && warning > 0 && amount >= warning) return freeze({ allowed: true, reason: 'budget-warning-confirmed', warning: true, amount, automaticPaidRetry: false });
  return freeze({ allowed: true, reason: amount === null ? 'provider-estimate-unavailable-user-confirmed' : 'within-budget', warning: amount === null, amount, automaticPaidRetry: false });
}

export function classifyDirectProviderFailure(candidate = {}) {
  const status = Number(candidate.status || 0);
  const text = String(candidate.code || candidate.error || candidate.message || '').toLowerCase();
  let code = 'provider-failure';
  if (status === 429 || /rate.?limit/.test(text)) code = 'rate-limited';
  else if (status === 402 || /quota|credit|billing/.test(text)) code = 'quota-exhausted';
  else if ([502, 503, 504].includes(status) || /outage|unavailable/.test(text)) code = 'provider-outage';
  else if (status === 404 || /expired/.test(text)) code = 'result-expired';
  else if (status === 451 || /region|country/.test(text)) code = 'region-restricted';
  else if (status === 401 || status === 403 || /account|permission|auth/.test(text)) code = 'account-action-required';
  else if (/moderation|safety|policy/.test(text)) code = 'provider-moderation-response';
  return freeze({ code, recoverable: RECOVERABLE_CODES.has(code), retryRequiresUserAction: true, automaticPaidRetry: false, providerMessage: SAFE_PROVIDER_MESSAGES[code] || SAFE_PROVIDER_MESSAGES['provider-failure'], rawProviderMessageIncluded: false });
}

export function getDirectSpendingSafetyTruth() {
  return freeze({ perJobConfirmationRequired: true, userBudgetWarnings: true, hardStopSupported: true, automaticPaidRetry: false, quotaAndRateLimitHonest: true, moderationResponsesPreserved: true, outageRecoveryRequiresUserAction: true, rawProviderErrorTextExposed: false });
}
