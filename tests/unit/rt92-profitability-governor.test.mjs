import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { evaluateVexrailProfitabilitySnapshot, getVexrailProfitabilityGovernorConfig, readVexrailProfitabilityGovernor } from '../../functions/_shared/eon-profitability-governor.js';

function d1(sqlite) {
  return { prepare(sql) { const stmt = sqlite.prepare(sql); return { bind(...args) { return { async first() { return stmt.get(...args) || null; }, async run() { stmt.run(...args); return { success: true }; } }; }, async first() { return stmt.get() || null; } }; } };
}
function trustDb() {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of ['migrations/trust/0001_trust_support_incident_authority.sql','migrations/trust/0002_vexrail_economic_aggregate.sql','migrations/trust/0003_growth_profitability_authority.sql']) sqlite.exec(readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8'));
  return sqlite;
}

test('RT92 profitability governor defaults to 1.25 coverage in observe mode', () => {
  const cfg = getVexrailProfitabilityGovernorConfig({});
  assert.equal(cfg.targetRatio, 1.25);
  assert.equal(cfg.mode, 'observe');
  assert.equal(cfg.minimumPrompts, 200);
  assert.equal(cfg.learningPromptBudget, 50);
});

test('RT92 profitability snapshot turns GREEN only after sufficient reconciled 1.25x coverage', () => {
  const cfg = getVexrailProfitabilityGovernorConfig({ EON_VEXRAIL_PROFIT_GOVERNOR_MODE: 'enforce', EON_VEXRAIL_PROFIT_MIN_PROMPTS: '100' });
  const green = evaluateVexrailProfitabilitySnapshot({ observedPrompts: 120, revenueMicros: 1500, costMicros: 1000, revenueEvidenceRows: 1, costEvidenceRows: 1 }, cfg);
  assert.equal(green.state, 'GREEN'); assert.equal(green.allowed, true); assert.equal(green.ratio, 1.5);
  const red = evaluateVexrailProfitabilitySnapshot({ observedPrompts: 120, revenueMicros: 1100, costMicros: 1000, revenueEvidenceRows: 1, costEvidenceRows: 1 }, cfg);
  assert.equal(red.state, 'RED'); assert.equal(red.allowed, false);
});

test('RT92 new cohort stays bounded YELLOW and learning loss budget can fail it closed', () => {
  const cfg = getVexrailProfitabilityGovernorConfig({ EON_VEXRAIL_PROFIT_GOVERNOR_MODE: 'enforce', EON_VEXRAIL_LEARNING_LOSS_BUDGET_MICROS: '100' });
  const fresh = evaluateVexrailProfitabilitySnapshot({ observedPrompts: 3 }, cfg);
  assert.equal(fresh.state, 'YELLOW'); assert.equal(fresh.allowed, true);
  const loss = evaluateVexrailProfitabilitySnapshot({ observedPrompts: 20, revenueMicros: 100, costMicros: 500, revenueEvidenceRows: 1, costEvidenceRows: 1 }, cfg);
  assert.equal(loss.state, 'RED'); assert.equal(loss.reason, 'learning_loss_budget_exhausted'); assert.equal(loss.allowed, false);
});


test('RT92 enforce mode stops an unreconciled learning cohort after the prompt budget', () => {
  const cfg = getVexrailProfitabilityGovernorConfig({ EON_VEXRAIL_PROFIT_GOVERNOR_MODE: 'enforce', EON_VEXRAIL_LEARNING_PROMPT_BUDGET: '25' });
  const within = evaluateVexrailProfitabilitySnapshot({ observedPrompts: 24 }, cfg);
  assert.equal(within.state, 'YELLOW'); assert.equal(within.allowed, true);
  const exhausted = evaluateVexrailProfitabilitySnapshot({ observedPrompts: 25 }, cfg);
  assert.equal(exhausted.state, 'RED'); assert.equal(exhausted.reason, 'learning_reconciliation_required'); assert.equal(exhausted.allowed, false);
});

test('RT92 governor reads reconciled country/request-class economics from unified ledger', async () => {
  const sqlite = trustDb();
  try {
    const now = 1_800_000_000_000;
    const day = Math.floor(now / 86400000) * 86400000;
    sqlite.prepare(`INSERT INTO eon_profitability_daily(day_started_at,provider,country,source,campaign,placement,device_class,model_id,request_class,vexrail_revenue_micros,vexrail_cost_micros,ai_prompt_count,revenue_reconciled,vexrail_cost_reconciled,updated_at) VALUES(?,'vexrail',?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(day, 'CA', '', '', '', 'desktop', 'model-a', 'simple_chat', 1300, 1000, 250, 1, 1, now);
    const state = await readVexrailProfitabilityGovernor(d1(sqlite), { country: 'CA', requestClass: 'simple_chat' }, { EON_VEXRAIL_PROFIT_GOVERNOR_MODE: 'enforce', EON_VEXRAIL_PROFIT_MIN_PROMPTS: '200' }, now);
    assert.equal(state.state, 'GREEN'); assert.equal(state.allowed, true); assert.equal(state.ratio, 1.3);
  } finally { sqlite.close(); }
});

test('RT97 Sponsored Discovery can govern the local_byok_discovery cohort independently', async () => {
  const sqlite = trustDb();
  try {
    const now = 1_800_000_000_000;
    const day = Math.floor(now / 86400000) * 86400000;
    const insert = sqlite.prepare(`INSERT INTO eon_profitability_daily(day_started_at,provider,country,source,campaign,placement,device_class,user_cohort,model_id,request_class,vexrail_revenue_micros,vexrail_cost_micros,ai_prompt_count,revenue_reconciled,vexrail_cost_reconciled,updated_at) VALUES(?,'vexrail',?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    insert.run(day, 'IN', '', '', '', 'desktop', 'signed_in_free', 'model-a', 'simple_chat', 2000, 1000, 250, 1, 1, now);
    insert.run(day, 'IN', '', '', '', 'desktop', 'local_byok_discovery', 'model-a', 'simple_chat', 400, 1000, 250, 1, 1, now);
    const db = d1(sqlite);
    const overall = await readVexrailProfitabilityGovernor(db, { country: 'IN', requestClass: 'simple_chat' }, { EON_VEXRAIL_PROFIT_GOVERNOR_MODE: 'enforce', EON_VEXRAIL_PROFIT_MIN_PROMPTS: '200' }, now);
    const discovery = await readVexrailProfitabilityGovernor(db, { country: 'IN', requestClass: 'simple_chat', userCohort: 'local_byok_discovery' }, { EON_VEXRAIL_PROFIT_GOVERNOR_MODE: 'enforce', EON_VEXRAIL_PROFIT_MIN_PROMPTS: '200' }, now);
    assert.equal(overall.state, 'RED');
    assert.equal(discovery.state, 'RED');
    assert.equal(discovery.ratio, 0.4);
    const free = await readVexrailProfitabilityGovernor(db, { country: 'IN', requestClass: 'simple_chat', userCohort: 'signed_in_free' }, { EON_VEXRAIL_PROFIT_GOVERNOR_MODE: 'enforce', EON_VEXRAIL_PROFIT_MIN_PROMPTS: '200' }, now);
    assert.equal(free.state, 'GREEN');
    assert.equal(free.ratio, 2);
  } finally { sqlite.close(); }
});
