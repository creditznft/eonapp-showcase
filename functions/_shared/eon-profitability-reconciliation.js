const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ROWS = 100;
const MAX_MICROS = 9_000_000_000_000_000;
const PROVIDERS = new Set(['ppcmate', 'exoclick', 'adsense', 'vexrail', 'vast', 'subscription', 'refund', 'infrastructure']);
const encoder = new TextEncoder();

function clean(value = '', max = 120) {
  return String(value ?? '').trim().replace(/[\u0000-\u001f\u007f]/g, '').replace(/[^A-Za-z0-9._:+@/-]/g, '-').slice(0, max);
}
function money(value, required = false) {
  if (value === null || value === undefined || value === '') return required ? null : 0;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > MAX_MICROS) return null;
  return parsed;
}
function day(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = Date.parse(`${value}T00:00:00Z`);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.floor(parsed / DAY_MS) * DAY_MS;
}
async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(String(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
function dimensions(input = {}, provider = '') {
  return Object.freeze({
    provider,
    country: clean(input.country, 2).toUpperCase(),
    source: clean(input.source || (provider === 'ppcmate' ? 'ppcmate' : ''), 120),
    medium: clean(input.medium, 120), campaign: clean(input.campaign, 120), creative: clean(input.creative, 120), placement: clean(input.placement, 120),
    deviceClass: clean(input.deviceClass || input.device_class || 'unknown', 40).toLowerCase() || 'unknown',
    osFamily: clean(input.osFamily || input.os_family || 'unknown', 40).toLowerCase() || 'unknown',
    browserFamily: clean(input.browserFamily || input.browser_family || 'unknown', 40).toLowerCase() || 'unknown',
    userCohort: clean(input.userCohort || input.user_cohort, 40), modelId: clean(input.modelId || input.model_id, 160), requestClass: clean(input.requestClass || input.request_class, 40)
  });
}
function normalizeAmounts(provider, input = {}) {
  const none = Object.freeze({ ppcSpendMicros: 0, exoclickRevenueMicros: 0, adsenseRevenueMicros: 0, vexrailRevenueMicros: 0, vexrailCostMicros: 0, vastRevenueMicros: 0, subscriptionContributionMicros: 0, paymentRefundCostMicros: 0, infrastructureCostMicros: 0 });
  const values = { ...none };
  if (provider === 'ppcmate') values.ppcSpendMicros = money(input.ppcSpendMicros ?? input.ppc_spend_micros, true);
  if (provider === 'exoclick') values.exoclickRevenueMicros = money(input.exoclickRevenueMicros ?? input.exoclick_revenue_micros, true);
  if (provider === 'adsense') values.adsenseRevenueMicros = money(input.adsenseRevenueMicros ?? input.adsense_revenue_micros, true);
  if (provider === 'vexrail') {
    values.vexrailRevenueMicros = money(input.vexrailRevenueMicros ?? input.vexrail_revenue_micros, true);
    values.vexrailCostMicros = money(input.vexrailCostMicros ?? input.vexrail_cost_micros, true);
  }
  if (provider === 'vast') values.vastRevenueMicros = money(input.vastRevenueMicros ?? input.vast_revenue_micros, true);
  if (provider === 'subscription') values.subscriptionContributionMicros = money(input.subscriptionContributionMicros ?? input.subscription_contribution_micros, true);
  if (provider === 'refund') values.paymentRefundCostMicros = money(input.paymentRefundCostMicros ?? input.payment_refund_cost_micros, true);
  if (provider === 'infrastructure') values.infrastructureCostMicros = money(input.infrastructureCostMicros ?? input.infrastructure_cost_micros, true);
  return Object.values(values).some((value) => value === null) ? null : Object.freeze(values);
}

export function normalizeProfitabilityEvidence(input = {}) {
  const provider = clean(input.provider, 40).toLowerCase();
  const evidenceRef = String(input.evidenceRef || input.evidence_ref || '').trim().slice(0, 240);
  const currency = clean(input.reportingCurrency || input.reporting_currency || 'USD', 3).toUpperCase();
  const sourceRows = Array.isArray(input.rows) ? input.rows : [];
  if (!PROVIDERS.has(provider)) return Object.freeze({ ok: false, reason: 'reconciliation_provider_invalid' });
  if (evidenceRef.length < 8) return Object.freeze({ ok: false, reason: 'reconciliation_evidence_ref_required' });
  if (currency !== 'USD') return Object.freeze({ ok: false, reason: 'reconciliation_currency_unsupported' });
  if (!sourceRows.length || sourceRows.length > MAX_ROWS) return Object.freeze({ ok: false, reason: 'reconciliation_rows_invalid' });
  const normalized = [];
  const keys = new Set();
  for (const source of sourceRows) {
    const dayStartedAt = day(source?.dayStartedAt ?? source?.day_started_at ?? source?.date);
    const amounts = normalizeAmounts(provider, source || {});
    if (dayStartedAt === null || !amounts) return Object.freeze({ ok: false, reason: 'reconciliation_row_invalid' });
    const dims = dimensions(source || {}, provider);
    if (dims.country && !/^[A-Z]{2}$/.test(dims.country)) return Object.freeze({ ok: false, reason: 'reconciliation_country_invalid' });
    const row = Object.freeze({ dayStartedAt, ...dims, ...amounts });
    const key = JSON.stringify([dayStartedAt, ...Object.values(dims)]);
    if (keys.has(key)) return Object.freeze({ ok: false, reason: 'reconciliation_duplicate_dimension_row' });
    keys.add(key);
    normalized.push(row);
  }
  normalized.sort((a, b) => a.dayStartedAt - b.dayStartedAt || JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return Object.freeze({ ok: true, provider, evidenceRef, reportingCurrency: currency, rows: Object.freeze(normalized) });
}

function ledgerStatement(database, row, now) {
  const spendReconciled = row.provider === 'ppcmate' ? 1 : 0;
  const revenueReconciled = ['exoclick', 'adsense', 'vexrail', 'vast', 'subscription'].includes(row.provider) ? 1 : 0;
  const vexrailCostReconciled = row.provider === 'vexrail' ? 1 : 0;
  return database.prepare(`INSERT INTO eon_profitability_daily(
    day_started_at,provider,country,source,medium,campaign,creative,placement,device_class,os_family,browser_family,user_cohort,model_id,request_class,
    ppc_spend_micros,exoclick_revenue_micros,adsense_revenue_micros,vexrail_revenue_micros,vexrail_cost_micros,vast_revenue_micros,subscription_contribution_micros,
    payment_refund_cost_micros,infrastructure_cost_micros,spend_reconciled,revenue_reconciled,vexrail_cost_reconciled,updated_at
  ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  ON CONFLICT(day_started_at,provider,country,source,medium,campaign,creative,placement,device_class,os_family,browser_family,user_cohort,model_id,request_class)
  DO UPDATE SET
    ppc_spend_micros=excluded.ppc_spend_micros,
    exoclick_revenue_micros=excluded.exoclick_revenue_micros,
    adsense_revenue_micros=excluded.adsense_revenue_micros,
    vexrail_revenue_micros=excluded.vexrail_revenue_micros,
    vexrail_cost_micros=excluded.vexrail_cost_micros,
    vast_revenue_micros=excluded.vast_revenue_micros,
    subscription_contribution_micros=excluded.subscription_contribution_micros,
    payment_refund_cost_micros=excluded.payment_refund_cost_micros,
    infrastructure_cost_micros=excluded.infrastructure_cost_micros,
    spend_reconciled=MAX(spend_reconciled,excluded.spend_reconciled),
    revenue_reconciled=MAX(revenue_reconciled,excluded.revenue_reconciled),
    vexrail_cost_reconciled=MAX(vexrail_cost_reconciled,excluded.vexrail_cost_reconciled),
    updated_at=excluded.updated_at`).bind(
      row.dayStartedAt,row.provider,row.country,row.source,row.medium,row.campaign,row.creative,row.placement,row.deviceClass,row.osFamily,row.browserFamily,row.userCohort,row.modelId,row.requestClass,
      row.ppcSpendMicros,row.exoclickRevenueMicros,row.adsenseRevenueMicros,row.vexrailRevenueMicros,row.vexrailCostMicros,row.vastRevenueMicros,row.subscriptionContributionMicros,row.paymentRefundCostMicros,row.infrastructureCostMicros,
      spendReconciled,revenueReconciled,vexrailCostReconciled,Number(now)
    );
}

export async function reconcileProfitabilityEvidence(database, input = {}, { now = Date.now() } = {}) {
  if (!database?.prepare || typeof database.batch !== 'function') return Object.freeze({ ok: false, reason: 'reconciliation_database_unavailable' });
  const normalized = normalizeProfitabilityEvidence(input);
  if (!normalized.ok) return normalized;
  const canonicalRows = normalized.rows.map((row) => ({ ...row }));
  const payloadDigest = await sha256(JSON.stringify({ provider: normalized.provider, reportingCurrency: normalized.reportingCurrency, rows: canonicalRows }));
  const receiptHash = await sha256(`${normalized.provider}:${normalized.evidenceRef}`);
  const existing = await database.prepare('SELECT payload_digest FROM eon_profitability_reconciliation_receipts WHERE receipt_hash=? LIMIT 1').bind(receiptHash).first();
  if (existing) {
    if (existing.payload_digest === payloadDigest) return Object.freeze({ ok: true, skipped: true, reason: 'reconciliation_already_imported', receiptHash, rowCount: normalized.rows.length });
    return Object.freeze({ ok: false, reason: 'reconciliation_evidence_conflict', receiptHash });
  }
  const periodStart = Math.min(...normalized.rows.map((row) => row.dayStartedAt));
  const periodEnd = Math.max(...normalized.rows.map((row) => row.dayStartedAt));
  const receipt = database.prepare(`INSERT INTO eon_profitability_reconciliation_receipts(
    receipt_hash,payload_digest,provider,reporting_currency,period_start,period_end,row_count,imported_at
  ) VALUES(?,?,?,?,?,?,?,?)`).bind(receiptHash,payloadDigest,normalized.provider,normalized.reportingCurrency,periodStart,periodEnd,normalized.rows.length,Number(now));
  try {
    await database.batch([receipt, ...normalized.rows.map((row) => ledgerStatement(database, row, now))]);
  } catch {
    return Object.freeze({ ok: false, reason: 'reconciliation_write_failed' });
  }
  return Object.freeze({ ok: true, skipped: false, receiptHash, provider: normalized.provider, reportingCurrency: normalized.reportingCurrency, rowCount: normalized.rows.length, periodStart, periodEnd });
}
