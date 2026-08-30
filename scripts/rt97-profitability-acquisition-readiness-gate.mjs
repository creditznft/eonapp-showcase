import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { summarizeProfitabilityTotals } from '../functions/_shared/eon-profitability-report.js';

export const RT97_PROFITABILITY_ACQUISITION_SCHEMA = 'eonapp.rt97.profitability-acquisition-readiness.v1';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const hasAll = (source, fragments) => fragments.every((fragment) => source.includes(fragment));
const check = (errors, condition, code) => { if (!condition) errors.push(code); };

export function runRt97ProfitabilityAcquisitionReadinessGate() {
  const errors = [];
  const growthServer = read('functions/_shared/eon-growth-attribution.js');
  const growthClient = read('assets/js/growth/eon-growth-attribution.js');
  const guideActions = read('assets/js/guides/eon-guide-actions.js');
  const chatPage = read('assets/js/chat-page.js');
  const vexrail = read('functions/api/ai/vexrail.js');
  const rewardedIndex = read('functions/api/monetization/rewarded/index.js');
  const rewardedEvent = read('functions/api/monetization/rewarded/event.js');
  const reconciliation = read('functions/_shared/eon-profitability-reconciliation.js');
  const report = read('functions/_shared/eon-profitability-report.js');
  const migration = read('migrations/trust/0004_growth_operational_events.sql');

  check(errors, hasAll(growthServer, [
    'source: clean(a.source)', 'campaign: clean(a.campaign)', 'placement: clean(a.placement)', "request?.cf?.country"
  ]), 'acquisition-dimensions');
  check(errors, hasAll(guideActions, ["emitEonGrowthEvent('guide_engaged'", "emitEonGrowthEvent('guide_tool_used'", "emitEonGrowthEvent('eonbot_cta_open'", 'guidePlacement()']), 'guide-funnel-events');
  check(errors, growthClient.includes("'first_prompt'") && chatPage.includes("emitEonGrowthEvent('first_prompt')"), 'eonbot-first-send-event');
  check(errors, hasAll(vexrail, [
    "'vexrail_eligible'", "'vexrail_request_started'", "'vexrail_response_success'", "'vexrail_provider_error'", 'recordVexrailProfitabilityPrompt'
  ]), 'vexrail-eligibility-cost-evidence');
  check(errors, hasAll(rewardedIndex, ["'rewarded_session_requested'", "'rewarded_session_started'", "'rewarded_provider_error'"]), 'rewarded-request-events');
  check(errors, hasAll(rewardedEvent, ["'rewarded_fill_observed'", "'rewarded_completion_verified'", "'rewarded_reward_granted'"]), 'rewarded-fill-completion-events');
  check(errors, reconciliation.includes("'adsense'") && reconciliation.includes('adsenseRevenueMicros') && migration.includes('ADD COLUMN adsense_revenue_micros'), 'adsense-provider-reconciliation');
  check(errors, reconciliation.includes("['exoclick', 'adsense', 'vexrail', 'vast', 'subscription']"), 'provider-revenue-evidence-only');
  check(errors, !rewardedEvent.includes('RevenueMicros') && !rewardedEvent.includes('revenue_micros'), 'rewarded-client-signal-cannot-create-revenue');
  check(errors, hasAll(report, ['contributionPerVisitorMicros', 'breakEvenCpcMicros', 'breakEvenCpmMicros', "revenue: revenueKnown ? 'provider_reconciled' : 'unknown_revenue'", "clientUi: 'not_used_for_revenue'"]), 'profitability-output-math');
  check(errors, hasAll(growthServer, ["'signup'", "'second_session'", "'7_day_return'", "'trial_start'", "'paid_subscription'"]), 'lifecycle-funnel-events');

  const unknown = summarizeProfitabilityTotals({ ppc_spend_micros: 150_000, vexrail_cost_micros: 25_000, revenue_evidence_rows: 0 }, 100);
  check(errors, unknown.revenueStatus === 'unknown_revenue' && unknown.contributionMarginMicros === null && unknown.breakEvenCpcMicros === null, 'unknown-revenue-fail-closed');

  const observed = summarizeProfitabilityTotals({
    ppc_spend_micros: 1_000_000,
    adsense_revenue_micros: 200_000,
    exoclick_revenue_micros: 300_000,
    vexrail_revenue_micros: 1_400_000,
    vexrail_cost_micros: 800_000,
    subscription_contribution_micros: 250_000,
    revenue_evidence_rows: 3,
    spend_evidence_rows: 1,
    vexrail_cost_evidence_rows: 1,
    first_prompt_count: 20,
    signup_count: 4,
    d7_return_count: 2,
    ai_prompt_count: 100
  }, 200);
  check(errors, observed.revenueStatus === 'observed_reconciled' && observed.totalRevenueMicros === 2_150_000 && observed.contributionMarginMicros === 350_000, 'reconciled-contribution-math');
  check(errors, observed.breakEvenCpcMicros === 1750 && observed.breakEvenCpmMicros === 1_750_000, 'break-even-math');
  check(errors, observed.adsenseRevenuePerVisitorMicros === 1000, 'adsense-per-visitor-math');
  check(errors, observed.ltvStatus === 'not_yet_measurable_from_reconciled_cohort_revenue', 'ltv-must-remain-unclaimed');

  const codeReady = errors.length === 0;
  const externalPending = Object.freeze([
    'import real PPCmate spend evidence',
    'import real ExoClick/VAST/AdSense finalized revenue evidence',
    'import reconciled Vexrail revenue and cost evidence for live model cohorts',
    'accumulate real D7/D30 cohort revenue before claiming LTV or scaling paid traffic'
  ]);
  return Object.freeze({
    schema: RT97_PROFITABILITY_ACQUISITION_SCHEMA,
    status: codeReady ? 'code-pass-provider-evidence-pending' : 'fail',
    codeReady,
    releaseReady: false,
    paidTrafficScaleReady: false,
    errors: Object.freeze(errors),
    telemetryTrust: observed.telemetryTrust,
    sampleBreakEvenCpcMicros: observed.breakEvenCpcMicros,
    sampleBreakEvenCpmMicros: observed.breakEvenCpmMicros,
    externalPending
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = runRt97ProfitabilityAcquisitionReadinessGate();
  console.log(JSON.stringify(result, null, 2));
  if (!result.codeReady) process.exitCode = 1;
}
