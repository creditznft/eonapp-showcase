import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { normalizeProfitabilityEvidence, reconcileProfitabilityEvidence } from '../../functions/_shared/eon-profitability-reconciliation.js';
import { onRequestPost as reconcileHandler } from '../../functions/api/trust/profitability/reconcile.js';
import { readVexrailProfitabilityGovernor } from '../../functions/_shared/eon-profitability-governor.js';

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
  return {
    sqlite,
    prepare(sql) { return new Statement(sqlite, sql); },
    async batch(statements) {
      sqlite.exec('BEGIN IMMEDIATE');
      try { const results = statements.map((statement) => statement.run()); sqlite.exec('COMMIT'); return results; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    }
  };
}

const vexrailEvidence = {
  provider: 'vexrail',
  evidenceRef: 'vexrail-statement-2026-08-17-A',
  reportingCurrency: 'USD',
  rows: [{
    date: '2026-08-17', country: 'CA', source: 'ppcmate', medium: 'native', campaign: 'c1', creative: 'a1', placement: 'z1',
    deviceClass: 'desktop', osFamily: 'windows', browserFamily: 'chrome', userCohort: 'free', modelId: 'model-a', requestClass: 'simple_chat',
    vexrailRevenueMicros: 1_500_000, vexrailCostMicros: 1_000_000
  }]
};

test('RT92 reconciliation validation is provider-specific, USD-only and rejects malformed monetary evidence', () => {
  assert.equal(normalizeProfitabilityEvidence(vexrailEvidence).ok, true);
  assert.equal(normalizeProfitabilityEvidence({ ...vexrailEvidence, reportingCurrency: 'EUR' }).reason, 'reconciliation_currency_unsupported');
  assert.equal(normalizeProfitabilityEvidence({ ...vexrailEvidence, rows: [{ date: '2026-08-17', vexrailRevenueMicros: 1 }] }).reason, 'reconciliation_row_invalid');
  assert.equal(normalizeProfitabilityEvidence({ ...vexrailEvidence, provider: 'unknown' }).reason, 'reconciliation_provider_invalid');
});



test('RT97 AdSense revenue is accepted only through provider reconciliation evidence', async () => {
  const db = makeD1();
  try {
    const now = Date.parse('2026-08-17T15:00:00Z');
    const evidence = {
      provider: 'adsense', evidenceRef: 'adsense-finalized-report-2026-08-17-A', reportingCurrency: 'USD',
      rows: [{ date: '2026-08-17', country: 'CA', source: 'organic', campaign: 'guides', placement: 'guide:guides/ai-api-cost-calculator', adsenseRevenueMicros: 275000 }]
    };
    const result = await reconcileProfitabilityEvidence(db, evidence, { now });
    assert.equal(result.ok, true);
    const row = db.sqlite.prepare("SELECT provider,adsense_revenue_micros,revenue_reconciled FROM eon_profitability_daily WHERE provider='adsense'").get();
    assert.deepEqual({ ...row }, { provider: 'adsense', adsense_revenue_micros: 275000, revenue_reconciled: 1 });
    assert.equal(normalizeProfitabilityEvidence({ ...evidence, rows: [{ ...evidence.rows[0], adsenseRevenueMicros: -1 }] }).reason, 'reconciliation_row_invalid');
  } finally { db.sqlite.close(); }
});

test('RT92 reconciliation imports exact provider evidence idempotently and stores only hashed receipt authority', async () => {
  const db = makeD1();
  try {
    const now = Date.parse('2026-08-17T15:00:00Z');
    const first = await reconcileProfitabilityEvidence(db, vexrailEvidence, { now });
    assert.equal(first.ok, true); assert.equal(first.skipped, false); assert.equal(first.rowCount, 1);
    const row = db.sqlite.prepare(`SELECT provider,vexrail_revenue_micros,vexrail_cost_micros,revenue_reconciled,vexrail_cost_reconciled FROM eon_profitability_daily`).get();
    assert.deepEqual({ ...row }, { provider: 'vexrail', vexrail_revenue_micros: 1_500_000, vexrail_cost_micros: 1_000_000, revenue_reconciled: 1, vexrail_cost_reconciled: 1 });
    const receipt = db.sqlite.prepare('SELECT receipt_hash,payload_digest,provider,row_count FROM eon_profitability_reconciliation_receipts').get();
    assert.equal(receipt.provider, 'vexrail'); assert.equal(receipt.row_count, 1);
    assert.equal(receipt.receipt_hash.length, 64); assert.equal(receipt.payload_digest.length, 64);
    assert.equal(JSON.stringify(receipt).includes(vexrailEvidence.evidenceRef), false);

    const repeat = await reconcileProfitabilityEvidence(db, vexrailEvidence, { now: now + 1000 });
    assert.equal(repeat.ok, true); assert.equal(repeat.skipped, true);
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM eon_profitability_reconciliation_receipts').get().n, 1);
    assert.equal(db.sqlite.prepare('SELECT vexrail_revenue_micros FROM eon_profitability_daily').get().vexrail_revenue_micros, 1_500_000);

    const conflict = await reconcileProfitabilityEvidence(db, { ...vexrailEvidence, rows: [{ ...vexrailEvidence.rows[0], vexrailRevenueMicros: 1_600_000 }] }, { now: now + 2000 });
    assert.equal(conflict.ok, false); assert.equal(conflict.reason, 'reconciliation_evidence_conflict');
  } finally { db.sqlite.close(); }
});

test('RT92 provider rows remain isolated and corrected evidence replaces, rather than double-counts, the same cohort row', async () => {
  const db = makeD1();
  try {
    const now = Date.parse('2026-08-17T15:00:00Z');
    const ppc = { provider: 'ppcmate', evidenceRef: 'ppcmate-daily-2026-08-17-v1', rows: [{ date: '2026-08-17', country: 'CA', campaign: 'c1', ppcSpendMicros: 900_000 }] };
    assert.equal((await reconcileProfitabilityEvidence(db, ppc, { now })).ok, true);
    const corrected = { provider: 'ppcmate', evidenceRef: 'ppcmate-daily-2026-08-17-corrected-v2', rows: [{ date: '2026-08-17', country: 'CA', campaign: 'c1', ppcSpendMicros: 1_000_000 }] };
    assert.equal((await reconcileProfitabilityEvidence(db, corrected, { now: now + 1 })).ok, true);
    const spend = db.sqlite.prepare("SELECT ppc_spend_micros,spend_reconciled FROM eon_profitability_daily WHERE provider='ppcmate'").get();
    assert.deepEqual({ ...spend }, { ppc_spend_micros: 1_000_000, spend_reconciled: 1 });
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) n FROM eon_profitability_daily WHERE provider='vexrail'").get().n, 0);
  } finally { db.sqlite.close(); }
});

test('RT92 reconciled Vexrail evidence can satisfy the 1.25x governor only when prompt sample telemetry is present', async () => {
  const db = makeD1();
  try {
    const now = Date.parse('2026-08-17T15:00:00Z');
    await reconcileProfitabilityEvidence(db, vexrailEvidence, { now });
    const day = Date.parse('2026-08-17T00:00:00Z');
    db.sqlite.prepare(`UPDATE eon_profitability_daily SET ai_prompt_count=250 WHERE provider='vexrail' AND day_started_at=?`).run(day);
    const state = await readVexrailProfitabilityGovernor(db, { country: 'CA', requestClass: 'simple_chat' }, { EON_VEXRAIL_PROFIT_GOVERNOR_MODE: 'enforce', EON_VEXRAIL_PROFIT_MIN_PROMPTS: '200' }, now);
    assert.equal(state.state, 'GREEN'); assert.equal(state.ratio, 1.5); assert.equal(state.allowed, true);
  } finally { db.sqlite.close(); }
});

test('RT92 reconciliation API is operator-only and rejects evidence-ref reuse with altered economics', async () => {
  const db = makeD1();
  try {
    const token = 'operator-profitability-reconcile-token-0123456789';
    const env = { EON_TRUST_DB: db, EON_TRUST_OPERATOR_TOKEN: token, EON_TRUST_RATE_LIMIT_SALT: 'reconcile-rate-limit-salt-012345678901' };
    const makeRequest = (body, authorized = true) => new Request('https://eonapp.ch/api/trust/profitability/reconcile', { method: 'POST', headers: { 'content-type': 'application/json', ...(authorized ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
    assert.equal((await reconcileHandler({ request: makeRequest(vexrailEvidence, false), env })).status, 401);
    const created = await reconcileHandler({ request: makeRequest(vexrailEvidence), env });
    assert.equal(created.status, 201);
    const repeated = await reconcileHandler({ request: makeRequest(vexrailEvidence), env });
    assert.equal(repeated.status, 200);
    const conflict = await reconcileHandler({ request: makeRequest({ ...vexrailEvidence, rows: [{ ...vexrailEvidence.rows[0], vexrailCostMicros: 1_100_000 }] }), env });
    assert.equal(conflict.status, 409);
  } finally { db.sqlite.close(); }
});
