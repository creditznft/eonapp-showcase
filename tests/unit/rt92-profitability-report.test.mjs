import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { readProfitabilityReport, summarizeProfitabilityTotals } from '../../functions/_shared/eon-profitability-report.js';
import { onRequestGet as profitabilityHandler } from '../../functions/api/trust/profitability.js';

class Statement {
  constructor(db, sql, args = []) { this.db = db; this.sql = sql; this.args = args; }
  bind(...args) { return new Statement(this.db, this.sql, args); }
  run() { return this.db.prepare(this.sql).run(...this.args); }
  first() { return this.db.prepare(this.sql).get(...this.args) || null; }
  all() { return { results: this.db.prepare(this.sql).all(...this.args) }; }
}
function makeD1() {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of [
    '../../migrations/trust/0001_trust_support_incident_authority.sql',
    '../../migrations/trust/0002_vexrail_economic_aggregate.sql',
    '../../migrations/trust/0003_growth_profitability_authority.sql',
    '../../migrations/trust/0004_growth_operational_events.sql'
  ]) sqlite.exec(readFileSync(new URL(file, import.meta.url), 'utf8'));
  return { sqlite, prepare(sql) { return new Statement(sqlite, sql); } };
}

function seedEconomics(db, now) {
  const day = Math.floor(now / 86_400_000) * 86_400_000;
  db.sqlite.prepare(`INSERT INTO eon_growth_event_daily(
    day_started_at,event_name,source,medium,campaign,creative,placement,click_source,country,device_class,os_family,browser_family,event_count,signed_in_count,updated_at
  ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(day, 'landing_view', 'ppcmate', 'native', 'rt92-canada', 'creative-a', 'zone-1', 'ppcmate', 'CA', 'desktop', 'windows', 'chrome', 20, 0, now);
  db.sqlite.prepare(`INSERT INTO eon_profitability_daily(
    day_started_at,provider,country,source,medium,campaign,creative,placement,device_class,os_family,browser_family,user_cohort,model_id,request_class,
    ppc_spend_micros,exoclick_revenue_micros,vexrail_revenue_micros,vexrail_cost_micros,vast_revenue_micros,subscription_contribution_micros,
    payment_refund_cost_micros,infrastructure_cost_micros,first_prompt_count,signup_count,d7_return_count,ai_prompt_count,
    spend_reconciled,revenue_reconciled,vexrail_cost_reconciled,updated_at
  ) VALUES(?,'vexrail',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    day, 'CA', 'ppcmate', 'native', 'rt92-canada', 'creative-a', 'zone-1', 'desktop', 'windows', 'chrome', 'guest_free', 'model-a', 'simple_chat',
    1_000_000, 400_000, 1_500_000, 1_000_000, 0, 300_000,
    0, 0, 10, 4, 2, 100,
    1, 1, 1, now
  );
  db.sqlite.prepare(`INSERT INTO eon_vexrail_model_daily(
    day_started_at,country,model_id,request_class,success_count,failure_count,prompt_tokens,completion_tokens,total_tokens,latency_ms_total,updated_at
  ) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(day, 'CA', 'model-a', 'simple_chat', 95, 5, 12_000, 8_000, 20_000, 25_000, now);
}

test('RT92 profitability summary computes reconciled contribution metrics without inventing LTV', () => {
  const summary = summarizeProfitabilityTotals({
    ppc_spend_micros: 1_000_000,
    exoclick_revenue_micros: 400_000,
    adsense_revenue_micros: 100_000,
    vexrail_revenue_micros: 1_500_000,
    vexrail_cost_micros: 1_000_000,
    subscription_contribution_micros: 300_000,
    first_prompt_count: 10,
    signup_count: 4,
    d7_return_count: 2,
    ai_prompt_count: 100,
    spend_evidence_rows: 1,
    revenue_evidence_rows: 1,
    vexrail_cost_evidence_rows: 1
  }, 20);
  assert.equal(summary.totalRevenueMicros, 2_300_000);
  assert.equal(summary.contributionMarginMicros, 300_000);
  assert.equal(summary.costPerFirstPromptMicros, 100_000);
  assert.equal(summary.signupCacMicros, 250_000);
  assert.equal(summary.d7RetainedUserCacMicros, 500_000);
  assert.equal(summary.exoclickRevenuePerVisitorMicros, 20_000);
  assert.equal(summary.adsenseRevenuePerVisitorMicros, 5_000);
  assert.equal(summary.vexrailRevenuePer1kPromptsMicros, 15_000_000);
  assert.equal(summary.vexrailCostPer1kPromptsMicros, 10_000_000);
  assert.equal(summary.aiCoverageRatio, 1.5);
  assert.equal(summary.totalRoas, 2.3);
  assert.equal(summary.revenueStatus, 'observed_reconciled');
  assert.equal(summary.profitabilityStatus, 'measurable');
  assert.equal(summary.contributionPerVisitorMicros, 15_000);
  assert.equal(summary.breakEvenCpcMicros, 15_000);
  assert.equal(summary.breakEvenCpmMicros, 15_000_000);
  assert.deepEqual(summary.telemetryTrust, { aiCost: 'server_trusted', revenue: 'provider_reconciled', clientUi: 'not_used_for_revenue' });
  assert.equal(summary.freeUserD7LtvMicros, null);
  assert.equal(summary.freeUserD30LtvMicros, null);
  assert.equal(summary.ltvStatus, 'not_yet_measurable_from_reconciled_cohort_revenue');
});

test('RT95 profitability never invents a contribution or break-even value without reconciled revenue', () => {
  const summary = summarizeProfitabilityTotals({ ppc_spend_micros: 50_000, vexrail_cost_micros: 10_000, revenue_evidence_rows: 0 }, 10);
  assert.equal(summary.revenueStatus, 'unknown_revenue');
  assert.equal(summary.profitabilityStatus, 'insufficient_revenue_data');
  assert.equal(summary.contributionMarginMicros, null);
  assert.equal(summary.revenuePerVisitorMicros, null);
  assert.equal(summary.contributionPerVisitorMicros, null);
  assert.equal(summary.breakEvenCpcMicros, null);
  assert.equal(summary.breakEvenCpmMicros, null);
  assert.equal(summary.aiCostPerVisitorMicros, 1000);
  assert.deepEqual(summary.telemetryTrust, { aiCost: 'server_trusted', revenue: 'unknown_revenue', clientUi: 'not_used_for_revenue' });
});

test('RT92 profitability report returns aggregate cohorts/model telemetry and stays scale-closed without LTV', async () => {
  const db = makeD1();
  const now = Date.parse('2026-08-17T12:00:00Z');
  seedEconomics(db, now);
  const report = await readProfitabilityReport(db, { now, windowDays: 30 });
  assert.equal(report.ok, true);
  assert.equal(report.summary.aiCoverageRatio, 1.5);
  assert.equal(report.summary.contributionMarginMicros, 200_000);
  assert.equal(report.cohorts.length, 1);
  assert.equal(report.cohorts[0].dimensions.source, 'ppcmate');
  assert.equal(report.cohorts[0].dimensions.osFamily, 'windows');
  assert.equal(report.modelTelemetry[0].successCount, 95);
  assert.equal(report.modelTelemetry[0].failureCount, 5);
  assert.equal(report.modelTelemetry[0].averageLatencyMs, 250);
  assert.equal(report.scaleReady, false, 'D7/D30 LTV is not yet measurable, so scaling must remain closed');
  assert.doesNotMatch(JSON.stringify(report), /account_id|click_hash|subject_hash/i);
  db.sqlite.close();
});

test('RT92 profitability operator endpoint rejects unauthenticated access and returns only protected aggregates', async () => {
  const db = makeD1();
  const now = Date.now();
  seedEconomics(db, now);
  const token = 'operator-token-for-profitability-test-0123456789';
  const env = {
    EON_TRUST_DB: db,
    EON_TRUST_OPERATOR_TOKEN: token,
    EON_TRUST_RATE_LIMIT_SALT: 'profitability-rate-limit-salt-0123456789'
  };
  const denied = await profitabilityHandler({ request: new Request('https://eonapp.ch/api/trust/profitability'), env });
  assert.equal(denied.status, 401);
  const allowed = await profitabilityHandler({ request: new Request('https://eonapp.ch/api/trust/profitability?days=30&limit=10', { headers: { authorization: `Bearer ${token}` } }), env });
  assert.equal(allowed.status, 200);
  const payload = await allowed.json();
  assert.equal(payload.schema, 'eonapp.profitability.operator.rt92.v1');
  assert.equal(payload.ok, true);
  assert.equal(payload.summary.aiCoverageRatio, 1.5);
  assert.equal(payload.scaleReady, false);
  assert.doesNotMatch(JSON.stringify(payload), /account_id|click_hash|subject_hash/i);
  db.sqlite.close();
});
