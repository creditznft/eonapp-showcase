const DAY_MS = 24 * 60 * 60 * 1000;
function integer(value) { return Math.max(0, Math.floor(Number(value) || 0)); }
function signedInteger(value) { const n = Number(value); return Number.isFinite(n) ? Math.trunc(n) : 0; }
function ratio(numerator, denominator) { return denominator > 0 ? Number((numerator / denominator).toFixed(6)) : null; }
function perThousand(value, prompts) { return prompts > 0 ? Math.round((value * 1000) / prompts) : null; }
function rows(result) { return Array.isArray(result?.results) ? result.results : (Array.isArray(result) ? result : []); }

export function summarizeProfitabilityTotals(row = {}, landingViews = 0) {
  const ppcSpend = integer(row.ppc_spend_micros);
  const exoclick = integer(row.exoclick_revenue_micros);
  const adsense = integer(row.adsense_revenue_micros);
  const vexrailRevenue = integer(row.vexrail_revenue_micros);
  const vexrailCost = integer(row.vexrail_cost_micros);
  const vast = integer(row.vast_revenue_micros);
  const subscription = integer(row.subscription_contribution_micros);
  const refunds = integer(row.payment_refund_cost_micros);
  const infrastructure = integer(row.infrastructure_cost_micros);
  const firstPrompts = integer(row.first_prompt_count);
  const signups = integer(row.signup_count);
  const d7Returns = integer(row.d7_return_count);
  const trialStarts = integer(row.trial_start_count);
  const paidSubscriptions = integer(row.paid_subscription_count);
  const qualifiedFreeUsers = integer(row.qualified_free_user_count);
  const aiPrompts = integer(row.ai_prompt_count);
  const totalRevenue = exoclick + adsense + vexrailRevenue + vast + subscription;
  const contribution = totalRevenue - ppcSpend - vexrailCost - refunds - infrastructure;
  const spendEvidenceRows = integer(row.spend_evidence_rows);
  const revenueEvidenceRows = integer(row.revenue_evidence_rows);
  const vexrailRevenueEvidenceRows = integer(row.vexrail_revenue_evidence_rows);
  const vexrailCostEvidenceRows = integer(row.vexrail_cost_evidence_rows);
  const revenueKnown = revenueEvidenceRows > 0;
  const contributionPerVisitor = revenueKnown && landingViews > 0 ? Math.round(contribution / landingViews) : null;
  return Object.freeze({
    landingViews: integer(landingViews), firstPrompts, signups, d7Returns, trialStarts, paidSubscriptions, qualifiedFreeUsers, aiPrompts,
    ppcSpendMicros: ppcSpend, exoclickRevenueMicros: exoclick, adsenseRevenueMicros: adsense, vexrailRevenueMicros: vexrailRevenue,
    vexrailCostMicros: vexrailCost, vastRevenueMicros: vast, subscriptionContributionMicros: subscription,
    paymentRefundCostMicros: refunds, infrastructureCostMicros: infrastructure, totalRevenueMicros: totalRevenue,
    contributionMarginMicros: revenueKnown ? signedInteger(contribution) : null,
    revenueStatus: revenueKnown ? 'observed_reconciled' : 'unknown_revenue',
    profitabilityStatus: revenueKnown ? 'measurable' : 'insufficient_revenue_data',
    telemetryTrust: Object.freeze({ aiCost: 'server_trusted', revenue: revenueKnown ? 'provider_reconciled' : 'unknown_revenue', clientUi: 'not_used_for_revenue' }),
    revenuePerVisitorMicros: revenueKnown && landingViews ? Math.round(totalRevenue / landingViews) : null,
    aiCostPerVisitorMicros: landingViews ? Math.round(vexrailCost / landingViews) : null,
    contributionPerVisitorMicros: contributionPerVisitor,
    revenuePer1kVisitorsMicros: revenueKnown && landingViews ? Math.round((totalRevenue * 1000) / landingViews) : null,
    aiCostPer1kVisitorsMicros: landingViews ? Math.round((vexrailCost * 1000) / landingViews) : null,
    contributionPer1kVisitorsMicros: contributionPerVisitor === null ? null : contributionPerVisitor * 1000,
    breakEvenCpcMicros: contributionPerVisitor,
    breakEvenCpmMicros: contributionPerVisitor === null ? null : contributionPerVisitor * 1000,
    costPerFirstPromptMicros: firstPrompts ? Math.round(ppcSpend / firstPrompts) : null,
    signupCacMicros: signups ? Math.round(ppcSpend / signups) : null,
    d7RetainedUserCacMicros: d7Returns ? Math.round(ppcSpend / d7Returns) : null,
    subscriberCacMicros: paidSubscriptions ? Math.round(ppcSpend / paidSubscriptions) : null,
    exoclickRevenuePerVisitorMicros: landingViews ? Math.round(exoclick / landingViews) : null,
    adsenseRevenuePerVisitorMicros: landingViews ? Math.round(adsense / landingViews) : null,
    vexrailRevenuePerPromptMicros: aiPrompts ? Math.round(vexrailRevenue / aiPrompts) : null,
    vexrailCostPerPromptMicros: aiPrompts ? Math.round(vexrailCost / aiPrompts) : null,
    vexrailRevenuePer1kPromptsMicros: perThousand(vexrailRevenue, aiPrompts),
    vexrailCostPer1kPromptsMicros: perThousand(vexrailCost, aiPrompts),
    aiCoverageRatio: ratio(vexrailRevenue, vexrailCost),
    totalRoas: ratio(totalRevenue, ppcSpend),
    reconciliation: Object.freeze({
      spendEvidenceRows, revenueEvidenceRows, vexrailRevenueEvidenceRows, vexrailCostEvidenceRows,
      spendReconciled: spendEvidenceRows > 0,
      revenueReconciled: revenueEvidenceRows > 0,
      vexrailRevenueReconciled: vexrailRevenueEvidenceRows > 0,
      vexrailCostReconciled: vexrailCostEvidenceRows > 0
    }),
    freeUserD7LtvMicros: null,
    freeUserD30LtvMicros: null,
    subscriberLtvMicros: null,
    ltvStatus: 'not_yet_measurable_from_reconciled_cohort_revenue',
    subscriberLtvStatus: 'not_yet_measurable_from_reconciled_subscription_cohort_revenue'
  });
}

export async function readProfitabilityReport(database, { windowDays = 30, limit = 80, now = Date.now() } = {}) {
  if (!database?.prepare) return Object.freeze({ ok: false, reason: 'profitability_database_unavailable' });
  const days = Math.min(90, Math.max(1, Math.floor(Number(windowDays) || 30)));
  const rowLimit = Math.min(200, Math.max(1, Math.floor(Number(limit) || 80)));
  const since = Math.floor((Number(now) - (days - 1) * DAY_MS) / DAY_MS) * DAY_MS;
  try {
    const totals = await database.prepare(`SELECT
      COALESCE(SUM(ppc_spend_micros),0) ppc_spend_micros,
      COALESCE(SUM(exoclick_revenue_micros),0) exoclick_revenue_micros,
      COALESCE(SUM(adsense_revenue_micros),0) adsense_revenue_micros,
      COALESCE(SUM(vexrail_revenue_micros),0) vexrail_revenue_micros,
      COALESCE(SUM(vexrail_cost_micros),0) vexrail_cost_micros,
      COALESCE(SUM(vast_revenue_micros),0) vast_revenue_micros,
      COALESCE(SUM(subscription_contribution_micros),0) subscription_contribution_micros,
      COALESCE(SUM(payment_refund_cost_micros),0) payment_refund_cost_micros,
      COALESCE(SUM(infrastructure_cost_micros),0) infrastructure_cost_micros,
      COALESCE(SUM(first_prompt_count),0) first_prompt_count,
      COALESCE(SUM(signup_count),0) signup_count,
      COALESCE(SUM(d7_return_count),0) d7_return_count,
      COALESCE(SUM(trial_start_count),0) trial_start_count,
      COALESCE(SUM(paid_subscription_count),0) paid_subscription_count,
      COALESCE(SUM(qualified_free_user_count),0) qualified_free_user_count,
      COALESCE(SUM(ai_prompt_count),0) ai_prompt_count,
      COALESCE(SUM(CASE WHEN spend_reconciled=1 THEN 1 ELSE 0 END),0) spend_evidence_rows,
      COALESCE(SUM(CASE WHEN revenue_reconciled=1 THEN 1 ELSE 0 END),0) revenue_evidence_rows,
      COALESCE(SUM(CASE WHEN provider='vexrail' AND revenue_reconciled=1 THEN 1 ELSE 0 END),0) vexrail_revenue_evidence_rows,
      COALESCE(SUM(CASE WHEN provider='vexrail' AND vexrail_cost_reconciled=1 THEN 1 ELSE 0 END),0) vexrail_cost_evidence_rows
      FROM eon_profitability_daily WHERE day_started_at>=?`).bind(since).first();
    const landing = await database.prepare(`SELECT COALESCE(SUM(event_count),0) AS landing_views FROM eon_growth_event_daily WHERE day_started_at>=? AND event_name='landing_view'`).bind(since).first();
    const cohortResult = await database.prepare(`SELECT
      provider,country,source,medium,campaign,creative,placement,device_class,os_family,browser_family,user_cohort,model_id,request_class,
      SUM(ppc_spend_micros) ppc_spend_micros,SUM(exoclick_revenue_micros) exoclick_revenue_micros,SUM(adsense_revenue_micros) adsense_revenue_micros,
      SUM(vexrail_revenue_micros) vexrail_revenue_micros,SUM(vexrail_cost_micros) vexrail_cost_micros,
      SUM(vast_revenue_micros) vast_revenue_micros,SUM(subscription_contribution_micros) subscription_contribution_micros,
      SUM(payment_refund_cost_micros) payment_refund_cost_micros,SUM(infrastructure_cost_micros) infrastructure_cost_micros,
      SUM(first_prompt_count) first_prompt_count,SUM(signup_count) signup_count,SUM(d7_return_count) d7_return_count,
      SUM(trial_start_count) trial_start_count,SUM(paid_subscription_count) paid_subscription_count,SUM(qualified_free_user_count) qualified_free_user_count,SUM(ai_prompt_count) ai_prompt_count,
      SUM(CASE WHEN spend_reconciled=1 THEN 1 ELSE 0 END) spend_evidence_rows,
      SUM(CASE WHEN revenue_reconciled=1 THEN 1 ELSE 0 END) revenue_evidence_rows,
      SUM(CASE WHEN provider='vexrail' AND revenue_reconciled=1 THEN 1 ELSE 0 END) vexrail_revenue_evidence_rows,
      SUM(CASE WHEN provider='vexrail' AND vexrail_cost_reconciled=1 THEN 1 ELSE 0 END) vexrail_cost_evidence_rows
      FROM eon_profitability_daily WHERE day_started_at>=?
      GROUP BY provider,country,source,medium,campaign,creative,placement,device_class,os_family,browser_family,user_cohort,model_id,request_class
      ORDER BY (SUM(exoclick_revenue_micros)+SUM(adsense_revenue_micros)+SUM(vexrail_revenue_micros)+SUM(vast_revenue_micros)+SUM(subscription_contribution_micros)-SUM(ppc_spend_micros)-SUM(vexrail_cost_micros)-SUM(payment_refund_cost_micros)-SUM(infrastructure_cost_micros)) DESC
      LIMIT ?`).bind(since, rowLimit).all();
    const modelResult = await database.prepare(`SELECT country,model_id,request_class,
      SUM(success_count) success_count,SUM(failure_count) failure_count,SUM(prompt_tokens) prompt_tokens,
      SUM(completion_tokens) completion_tokens,SUM(total_tokens) total_tokens,SUM(latency_ms_total) latency_ms_total
      FROM eon_vexrail_model_daily WHERE day_started_at>=?
      GROUP BY country,model_id,request_class ORDER BY SUM(success_count)+SUM(failure_count) DESC LIMIT ?`).bind(since, rowLimit).all();
    const summary = summarizeProfitabilityTotals(totals || {}, Number(landing?.landing_views || 0));
    const cohorts = rows(cohortResult).map((row) => Object.freeze({
      dimensions: Object.freeze({ provider: row.provider || '', country: row.country || '', source: row.source || '', medium: row.medium || '', campaign: row.campaign || '', creative: row.creative || '', placement: row.placement || '', deviceClass: row.device_class || '', osFamily: row.os_family || '', browserFamily: row.browser_family || '', userCohort: row.user_cohort || '', modelId: row.model_id || '', requestClass: row.request_class || '' }),
      metrics: summarizeProfitabilityTotals(row, 0)
    }));
    const modelTelemetry = rows(modelResult).map((row) => {
      const attempts = integer(row.success_count) + integer(row.failure_count);
      return Object.freeze({ country: row.country || '', modelId: row.model_id || '', requestClass: row.request_class || '', successCount: integer(row.success_count), failureCount: integer(row.failure_count), totalTokens: integer(row.total_tokens), averageLatencyMs: attempts ? Math.round(integer(row.latency_ms_total) / attempts) : null });
    });
    const scaleReady = Boolean(
      summary.reconciliation.spendReconciled
      && summary.reconciliation.revenueReconciled
      && summary.reconciliation.vexrailRevenueReconciled
      && summary.reconciliation.vexrailCostReconciled
      && summary.firstPrompts > 0
      && summary.d7Returns > 0
      && summary.aiCoverageRatio !== null
      && summary.aiCoverageRatio >= 1.25
      && summary.contributionMarginMicros > 0
      && summary.ltvStatus === 'measurable'
      && summary.freeUserD7LtvMicros !== null
      && summary.freeUserD30LtvMicros !== null
    );
    return Object.freeze({ ok: true, windowDays: days, since, generatedAt: Number(now), scaleReady, summary, cohorts: Object.freeze(cohorts), modelTelemetry: Object.freeze(modelTelemetry) });
  } catch {
    return Object.freeze({ ok: false, reason: 'profitability_report_unavailable' });
  }
}
