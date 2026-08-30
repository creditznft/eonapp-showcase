import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { RT92_DURABLE_WORK_SERVER_PILOT, validateRt92DurableWorkServerPilot } from '../../config/rt92-durable-work-server-pilot.mjs';
import {
  createEonDurableWorkProposal,
  listEonDurableWorkProposals,
  cancelEonDurableWorkProposal,
  getEonDurableWorkLedgerConfig,
  getEonDurableWorkProposalLedgerTruth,
  normalizeEonDurableWorkProposalInput
} from '../../functions/_shared/eon-durable-work-proposal-ledger.js';

class Statement {
  constructor(db, sql, args = []) { this.db = db; this.sql = sql; this.args = args; }
  bind(...args) { return new Statement(this.db, this.sql, args); }
  async run() { return this.db.prepare(this.sql).run(...this.args); }
  async first() { return this.db.prepare(this.sql).get(...this.args) || null; }
  async all() { return { results: this.db.prepare(this.sql).all(...this.args) }; }
}
function makeD1() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(fs.readFileSync(new URL('../../durable-work/migrations/0001_eon_durable_work_proposals.sql', import.meta.url), 'utf8'));
  return { sqlite, prepare(sql) { return new Statement(sqlite, sql); } };
}
const now = 1_786_948_800_000;
const input = {
  projectRef: 'project:client-a',
  capabilityId: 'business-intelligence-briefs',
  taskClass: 'local-business-brief',
  workloadClass: 'platform-hosted',
  requestedUnits: 3,
  inputDigest: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  idempotencyKey: 'idem:business:1',
  expiresAtMs: now + 600_000
};

test('durable-work server pilot contract remains testing-only and non-executing', () => {
  const validation = validateRt92DurableWorkServerPilot();
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  const truth = getEonDurableWorkProposalLedgerTruth();
  assert.deepEqual([...RT92_DURABLE_WORK_SERVER_PILOT.requiredMigrations], [
    'durable-work/migrations/0001_eon_durable_work_proposals.sql',
    'durable-work/migrations/0002_eon_work_capacity_leases.sql'
  ]);
  assert.equal(truth.testingOnly, true);
  assert.equal(truth.productionAllowed, false);
  assert.equal(truth.capacityAdmissionActive, false);
  assert.equal(truth.schedulerActive, false);
  assert.equal(truth.executorActive, false);
  assert.equal(truth.backgroundJobCreated, false);
});

test('rollout requires testing plus dedicated EON_WORK_DB and never enables production mode', () => {
  assert.equal(getEonDurableWorkLedgerConfig({}).configured, false);
  assert.equal(getEonDurableWorkLedgerConfig({ EON_DURABLE_WORK_ROLLOUT: 'production', EON_WORK_DB: {} }).configured, false);
  const testing = getEonDurableWorkLedgerConfig({ EON_DURABLE_WORK_ROLLOUT: 'testing', EON_WORK_DB: { prepare() {} } });
  assert.equal(testing.configured, true);
  assert.equal(testing.productionAllowed, false);
  assert.equal(testing.runtimeActive, false);
});

test('proposal normalization rejects raw prompts/credentials and caps expiry', () => {
  assert.equal(normalizeEonDurableWorkProposalInput({ ...input, prompt: 'secret' }, { now }).ok, false);
  assert.equal(normalizeEonDurableWorkProposalInput({ ...input, credentials: { key: 'x' } }, { now }).ok, false);
  const normalized = normalizeEonDurableWorkProposalInput({ ...input, expiresAtMs: now + 8 * 60 * 60_000 }, { now });
  assert.equal(normalized.ok, true);
  assert.equal(normalized.expiresAtMs, now + 60 * 60_000);
});

test('server proposal ledger persists only redacted metadata and is idempotent', async () => {
  const db = makeD1();
  const first = await createEonDurableWorkProposal(db, 'acct:1', input, { now });
  assert.equal(first.ok, true);
  assert.equal(first.proposalCreated, true);
  assert.equal(first.capacityAdmitted, false);
  assert.equal(first.backgroundJobCreated, false);
  assert.equal(first.proposal.rawPromptStored, false);
  assert.equal(first.proposal.rawOutputStored, false);
  assert.equal(first.proposal.credentialStored, false);

  const replay = await createEonDurableWorkProposal(db, 'acct:1', input, { now: now + 1_000 });
  assert.equal(replay.ok, true);
  assert.equal(replay.idempotentReplay, true);
  assert.equal(replay.proposalCreated, false);
  assert.equal(replay.proposal.proposalId, first.proposal.proposalId);

  const stored = db.sqlite.prepare('SELECT * FROM eon_durable_work_proposals').get();
  assert.equal(stored.account_ref, 'acct:1');
  assert.equal(stored.input_digest, input.inputDigest);
  assert.equal('prompt' in stored, false);
  assert.equal('output' in stored, false);
  assert.equal('credentials' in stored, false);
});

test('proposal list expires prepared records and cancellation is explicit/idempotent', async () => {
  const db = makeD1();
  const created = await createEonDurableWorkProposal(db, 'acct:2', input, { now });
  const cancelled = await cancelEonDurableWorkProposal(db, 'acct:2', created.proposal.proposalId, { now: now + 1_000 });
  assert.equal(cancelled.ok, true);
  assert.equal(cancelled.cancelled, true);
  assert.equal(cancelled.backgroundJobCreated, false);
  assert.equal(cancelled.externalEffectCreated, false);
  const replay = await cancelEonDurableWorkProposal(db, 'acct:2', created.proposal.proposalId, { now: now + 2_000 });
  assert.equal(replay.ok, true);
  assert.equal(replay.idempotentReplay, true);

  const expiring = await createEonDurableWorkProposal(db, 'acct:2', { ...input, idempotencyKey: 'idem:business:2', expiresAtMs: now + 3_000 }, { now });
  assert.equal(expiring.ok, true);
  const listed = await listEonDurableWorkProposals(db, 'acct:2', { now: now + 4_000 });
  const expired = listed.proposals.find((item) => item.proposalId === expiring.proposal.proposalId);
  assert.equal(expired.status, 'expired');
  assert.equal(listed.readMutatedStorage, false);
  const storedExpired = db.sqlite.prepare('SELECT status FROM eon_durable_work_proposals WHERE proposal_id=?').get(expiring.proposal.proposalId);
  assert.equal(storedExpired.status, 'prepared');
});

test('source does not wire EON_WORK_DB or durable-work rollout into current local/preview/production wrangler config', () => {
  const wrangler = fs.readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8');
  assert.equal(wrangler.includes('EON_WORK_DB'), false);
  assert.equal(wrangler.includes('EON_DURABLE_WORK_ROLLOUT'), false);
});
