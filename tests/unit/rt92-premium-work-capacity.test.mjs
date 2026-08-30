import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createEonDurableWorkProposal } from '../../functions/_shared/eon-durable-work-proposal-ledger.js';
import {
  EON_WORK_CAPACITY_SOURCES,
  getEonWorkCapacityTruth,
  readEonActiveWorkCapacity,
  releaseEonWorkCapacityLease,
  reserveEonWorkCapacity
} from '../../functions/_shared/eon-premium-work-capacity.js';

class Statement {
  constructor(db, sql, args = []) { this.db = db; this.sql = sql; this.args = args; }
  bind(...args) { return new Statement(this.db, this.sql, args); }
  async run() { return this.db.prepare(this.sql).run(...this.args); }
  async first() { return this.db.prepare(this.sql).get(...this.args) || null; }
  async all() { return { results: this.db.prepare(this.sql).all(...this.args) }; }
}

class D1Mock {
  constructor() {
    this.sqlite = new DatabaseSync(':memory:');
    this.sqlite.exec('PRAGMA foreign_keys = ON;');
    this.sqlite.exec(fs.readFileSync(new URL('../../durable-work/migrations/0001_eon_durable_work_proposals.sql', import.meta.url), 'utf8'));
    this.sqlite.exec(fs.readFileSync(new URL('../../durable-work/migrations/0002_eon_work_capacity_leases.sql', import.meta.url), 'utf8'));
  }
  prepare(sql) { return new Statement(this.sqlite, sql); }
  async batch(statements = []) {
    this.sqlite.exec('BEGIN IMMEDIATE;');
    try {
      const results = [];
      for (const statement of statements) {
        results.push(this.sqlite.prepare(statement.sql).run(...statement.args));
      }
      this.sqlite.exec('COMMIT;');
      return results;
    } catch (error) {
      this.sqlite.exec('ROLLBACK;');
      throw error;
    }
  }
}

const now = 1_786_948_800_000;
const capabilityId = 'business-intelligence-briefs';

function proposalInput(idempotencyKey, overrides = {}) {
  return {
    projectRef: 'project:client-a',
    capabilityId,
    taskClass: 'local-business-brief',
    workloadClass: 'platform-hosted',
    requestedUnits: 3,
    inputDigest: `sha256:${'a'.repeat(64)}`,
    idempotencyKey,
    expiresAtMs: now + 600_000,
    ...overrides
  };
}

function seedCapacity(db, {
  accountRef = 'acct:1',
  capability = capabilityId,
  periodKey = '2026-08',
  sourceAuthority = 'testing',
  unitLimit = 10,
  unitsUsed = 0,
  concurrencyLimit = 2,
  activeLeases = 0,
  startsAt = now - 1_000,
  expiresAt = now + 86_400_000,
  status = 'active'
} = {}) {
  db.sqlite.prepare(`INSERT INTO eon_work_capacity
    (account_ref,capability_id,period_key,source_authority,status,unit_limit,units_used,concurrency_limit,active_leases,starts_at,expires_at,reservation_nonce,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,NULL,?)`)
    .run(accountRef, capability, periodKey, sourceAuthority, status, unitLimit, unitsUsed, concurrencyLimit, activeLeases, startsAt, expiresAt, now);
}

test('capacity truth allows only server capacity sources and excludes Ultimate/perpetual ownership', () => {
  const truth = getEonWorkCapacityTruth();
  assert.deepEqual([...EON_WORK_CAPACITY_SOURCES], ['subscription', 'metered', 'testing']);
  assert.deepEqual([...truth.allowedCapacitySources], ['subscription', 'metered', 'testing']);
  assert.equal(truth.allowedCapacitySources.includes('ultimate'), false);
  assert.equal(truth.ultimatePerpetualGrantIsCapacityAuthority, false);
  assert.equal(truth.browserCanCreateCapacityEnvelope, false);
  assert.equal(truth.browserCanIncreaseLimit, false);
  assert.equal(truth.executorActive, false);
  assert.equal(truth.schedulerActive, false);
  assert.equal(truth.leaseRequiredBeforeFutureHostedExecution, true);
});

test('server can reserve finite capacity for a prepared platform-hosted proposal without executing it', async () => {
  const db = new D1Mock();
  seedCapacity(db);
  const created = await createEonDurableWorkProposal(db, 'acct:1', proposalInput('idem:capacity:1'), { now });
  const reserved = await reserveEonWorkCapacity(db, 'acct:1', created.proposal.proposalId, { now });
  assert.equal(reserved.ok, true);
  assert.equal(reserved.leaseCreated, true);
  assert.equal(reserved.lease.unitsReserved, 3);
  assert.equal(reserved.lease.status, 'active');
  assert.equal(reserved.backgroundJobCreated, false);
  assert.equal(reserved.executionStarted, false);
  assert.equal(reserved.runtimeActive, false);

  const capacity = db.sqlite.prepare('SELECT * FROM eon_work_capacity').get();
  assert.equal(capacity.units_used, 3);
  assert.equal(capacity.active_leases, 1);
  assert.equal(capacity.reservation_nonce, null);
});

test('reservation is idempotent per proposal and does not double-charge units or concurrency', async () => {
  const db = new D1Mock();
  seedCapacity(db);
  const created = await createEonDurableWorkProposal(db, 'acct:1', proposalInput('idem:capacity:2'), { now });
  const first = await reserveEonWorkCapacity(db, 'acct:1', created.proposal.proposalId, { now });
  const replay = await reserveEonWorkCapacity(db, 'acct:1', created.proposal.proposalId, { now: now + 1_000 });
  assert.equal(first.ok, true);
  assert.equal(replay.ok, true);
  assert.equal(replay.idempotentReplay, true);
  assert.equal(replay.leaseCreated, false);
  assert.equal(replay.lease.leaseId, first.lease.leaseId);
  const capacity = db.sqlite.prepare('SELECT units_used,active_leases FROM eon_work_capacity').get();
  assert.equal(capacity.units_used, 3);
  assert.equal(capacity.active_leases, 1);
});

test('finite unit limits fail closed before a lease is created', async () => {
  const db = new D1Mock();
  seedCapacity(db, { unitLimit: 2 });
  const created = await createEonDurableWorkProposal(db, 'acct:1', proposalInput('idem:capacity:3'), { now });
  const result = await reserveEonWorkCapacity(db, 'acct:1', created.proposal.proposalId, { now });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'capacity-limit-reached');
  assert.equal(db.sqlite.prepare('SELECT count(*) AS n FROM eon_work_capacity_leases').get().n, 0);
  assert.equal(db.sqlite.prepare('SELECT units_used FROM eon_work_capacity').get().units_used, 0);
});

test('concurrency is reserved independently from consumed unit quota and release frees only concurrency', async () => {
  const db = new D1Mock();
  seedCapacity(db, { unitLimit: 100, concurrencyLimit: 1 });
  const a = await createEonDurableWorkProposal(db, 'acct:1', proposalInput('idem:capacity:4a'), { now });
  const b = await createEonDurableWorkProposal(db, 'acct:1', proposalInput('idem:capacity:4b', { inputDigest: `sha256:${'b'.repeat(64)}` }), { now });
  const first = await reserveEonWorkCapacity(db, 'acct:1', a.proposal.proposalId, { now });
  assert.equal(first.ok, true);
  const blocked = await reserveEonWorkCapacity(db, 'acct:1', b.proposal.proposalId, { now: now + 1_000 });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'concurrency-limit-reached');

  const released = await releaseEonWorkCapacityLease(db, 'acct:1', first.lease.leaseId, { now: now + 2_000 });
  assert.equal(released.ok, true);
  assert.equal(released.lease.status, 'released');
  let capacity = db.sqlite.prepare('SELECT units_used,active_leases FROM eon_work_capacity').get();
  assert.equal(capacity.units_used, 3, 'release must not restore consumed/reserved monthly quota');
  assert.equal(capacity.active_leases, 0);

  const second = await reserveEonWorkCapacity(db, 'acct:1', b.proposal.proposalId, { now: now + 3_000 });
  assert.equal(second.ok, true);
  capacity = db.sqlite.prepare('SELECT units_used,active_leases FROM eon_work_capacity').get();
  assert.equal(capacity.units_used, 6);
  assert.equal(capacity.active_leases, 1);
});

test('missing server capacity envelope fails closed', async () => {
  const db = new D1Mock();
  const created = await createEonDurableWorkProposal(db, 'acct:1', proposalInput('idem:capacity:5'), { now });
  const result = await reserveEonWorkCapacity(db, 'acct:1', created.proposal.proposalId, { now });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'server-capacity-envelope-not-found');
});

test('database constraint rejects Ultimate as a hosted capacity source authority', () => {
  const db = new D1Mock();
  assert.throws(() => seedCapacity(db, { sourceAuthority: 'ultimate' }), /CHECK constraint failed/i);
});

test('local and BYOK proposals cannot reserve EONAPP-funded server capacity', async () => {
  for (const workloadClass of ['local', 'byok']) {
    const db = new D1Mock();
    seedCapacity(db);
    const created = await createEonDurableWorkProposal(db, 'acct:1', proposalInput(`idem:${workloadClass}`, { workloadClass }), { now });
    const result = await reserveEonWorkCapacity(db, 'acct:1', created.proposal.proposalId, { now });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'server-hosted-capacity-only');
  }
});

test('active capacity reads are side-effect-free and expose only finite server authority', async () => {
  const db = new D1Mock();
  seedCapacity(db, { unitLimit: 8, unitsUsed: 3, concurrencyLimit: 2, activeLeases: 1 });
  const result = await readEonActiveWorkCapacity(db, 'acct:1', capabilityId, { now });
  assert.equal(result.ok, true);
  assert.equal(result.capacity.unitsRemaining, 5);
  assert.equal(result.capacity.concurrencyRemaining, 1);
  assert.equal(result.capacity.sourceAuthority, 'testing');
  assert.equal(result.capacity.browserCanWriteCapacity, false);
  assert.equal(result.capacity.ultimatePerpetualGrantIsCapacityAuthority, false);
});
