/**
 * RT92 server-only premium work-capacity foundation.
 *
 * Capacity rows have no browser writer. A future billing/metering authority may
 * populate them. This module can reserve/release finite leases for PREPARED
 * durable-work proposals, but it cannot execute or schedule the work itself.
 */
export const EON_WORK_CAPACITY_SCHEMA = 'eonapp.premium-work-capacity.rt92.v1';
export const EON_WORK_CAPACITY_SOURCES = Object.freeze(['subscription', 'metered', 'testing']);
const SOURCE_SET = new Set(EON_WORK_CAPACITY_SOURCES);
const ID_RE = /^[a-zA-Z0-9._:-]{1,140}$/;
const freeze = Object.freeze;

function safeId(value = '') { const text = String(value || '').trim(); return ID_RE.test(text) ? text : ''; }
function positive(value, fallback = 0) { const number = Number(value); return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : fallback; }
function nowNumber(value = Date.now()) { const number = Number(value); return Number.isFinite(number) && number > 0 ? Math.trunc(number) : Date.now(); }
function leaseId() { return `worklease:${crypto.randomUUID()}`; }

function publicCapacity(row = {}, now = Date.now()) {
  const clock = nowNumber(now);
  const sourceAuthority = SOURCE_SET.has(String(row.source_authority || '')) ? String(row.source_authority) : '';
  const storedStatus = ['active','paused','revoked','expired'].includes(String(row.status || '')) ? String(row.status) : 'expired';
  const status = storedStatus === 'active' && Number(row.expires_at || 0) <= clock ? 'expired' : storedStatus;
  const unitLimit = positive(row.unit_limit);
  const unitsUsed = positive(row.units_used);
  const concurrencyLimit = positive(row.concurrency_limit);
  const activeLeases = positive(row.active_leases);
  return freeze({
    accountRef: safeId(row.account_ref),
    capabilityId: safeId(row.capability_id),
    periodKey: safeId(row.period_key),
    sourceAuthority,
    status,
    unitLimit,
    unitsUsed,
    unitsRemaining: Math.max(0, unitLimit - unitsUsed),
    concurrencyLimit,
    activeLeases,
    concurrencyRemaining: Math.max(0, concurrencyLimit - activeLeases),
    startsAtMs: positive(row.starts_at),
    expiresAtMs: positive(row.expires_at),
    ultimatePerpetualGrantIsCapacityAuthority: false,
    browserCanWriteCapacity: false
  });
}

function publicLease(row = {}) {
  return freeze({
    leaseId: safeId(row.lease_id),
    proposalId: safeId(row.proposal_id),
    capabilityId: safeId(row.capability_id),
    periodKey: safeId(row.period_key),
    unitsReserved: Math.max(1, positive(row.units_reserved, 1)),
    status: ['active','consumed','released','expired'].includes(String(row.status || '')) ? String(row.status) : 'expired',
    createdAtMs: positive(row.created_at),
    expiresAtMs: positive(row.expires_at),
    releasedAtMs: row.released_at ? positive(row.released_at) : null,
    backgroundJobCreated: false,
    executionStarted: false
  });
}

export async function readEonActiveWorkCapacity(db, accountRef = '', capabilityId = '', { now = Date.now() } = {}) {
  if (!db?.prepare) return freeze({ ok: false, reason: 'work-db-required', capacity: null });
  const account = safeId(accountRef); const capability = safeId(capabilityId); const clock = nowNumber(now);
  if (!account || !capability) return freeze({ ok: false, reason: 'account-and-capability-required', capacity: null });
  const row = await db.prepare("SELECT * FROM eon_work_capacity WHERE account_ref=? AND capability_id=? AND status='active' AND starts_at<=? AND expires_at>? ORDER BY expires_at DESC LIMIT 1").bind(account, capability, clock, clock).first();
  if (!row) return freeze({ ok: false, reason: 'server-capacity-envelope-not-found', capacity: null });
  const capacity = publicCapacity(row, clock);
  if (!SOURCE_SET.has(capacity.sourceAuthority)) return freeze({ ok: false, reason: 'invalid-server-capacity-authority', capacity: null });
  return freeze({ ok: true, capacity });
}

export async function reserveEonWorkCapacity(db, accountRef = '', proposalId = '', { now = Date.now(), leaseTtlMs = 15 * 60_000 } = {}) {
  if (!db?.prepare || typeof db.batch !== 'function') return freeze({ ok: false, reason: 'transactional-work-db-required', leaseCreated: false });
  const account = safeId(accountRef); const proposal = safeId(proposalId); const clock = nowNumber(now);
  if (!account || !proposal) return freeze({ ok: false, reason: 'account-and-proposal-required', leaseCreated: false });

  const existingLease = await db.prepare('SELECT * FROM eon_work_capacity_leases WHERE proposal_id=? AND account_ref=? LIMIT 1').bind(proposal, account).first();
  if (existingLease) return freeze({ ok: true, leaseCreated: false, idempotentReplay: true, lease: publicLease(existingLease), runtimeActive: false });

  const work = await db.prepare("SELECT * FROM eon_durable_work_proposals WHERE proposal_id=? AND account_ref=? AND status='prepared' LIMIT 1").bind(proposal, account).first();
  if (!work) return freeze({ ok: false, reason: 'prepared-proposal-required', leaseCreated: false });
  if (Number(work.expires_at || 0) <= clock) return freeze({ ok: false, reason: 'proposal-expired', leaseCreated: false });
  if (String(work.workload_class || '') !== 'platform-hosted') return freeze({ ok: false, reason: 'server-hosted-capacity-only', leaseCreated: false });

  const capacityResult = await readEonActiveWorkCapacity(db, account, work.capability_id, { now: clock });
  if (!capacityResult.ok) return freeze({ ...capacityResult, leaseCreated: false });
  const capacity = capacityResult.capacity;
  const units = Math.max(1, positive(work.requested_units, 1));
  if (capacity.unitsRemaining < units) return freeze({ ok: false, reason: 'capacity-limit-reached', leaseCreated: false, capacity });
  if (capacity.concurrencyRemaining < 1) return freeze({ ok: false, reason: 'concurrency-limit-reached', leaseCreated: false, capacity });

  const id = leaseId();
  const expiry = Math.min(Number(work.expires_at), clock + Math.max(60_000, positive(leaseTtlMs, 15 * 60_000)));
  const update = db.prepare("UPDATE eon_work_capacity SET units_used=units_used+?,active_leases=active_leases+1,reservation_nonce=?,updated_at=? WHERE account_ref=? AND capability_id=? AND period_key=? AND status='active' AND starts_at<=? AND expires_at>? AND units_used+?<=unit_limit AND active_leases<concurrency_limit AND (reservation_nonce IS NULL OR reservation_nonce='')")
    .bind(units, id, clock, account, work.capability_id, capacity.periodKey, clock, clock, units);
  const insert = db.prepare("INSERT INTO eon_work_capacity_leases (lease_id,proposal_id,account_ref,capability_id,period_key,units_reserved,status,created_at,expires_at,released_at) SELECT ?,?,?,?,?,?,'active',?,?,NULL FROM eon_work_capacity WHERE account_ref=? AND capability_id=? AND period_key=? AND reservation_nonce=?")
    .bind(id, proposal, account, work.capability_id, capacity.periodKey, units, clock, expiry, account, work.capability_id, capacity.periodKey, id);
  const clear = db.prepare("UPDATE eon_work_capacity SET reservation_nonce=NULL,updated_at=? WHERE account_ref=? AND capability_id=? AND period_key=? AND reservation_nonce=?")
    .bind(clock, account, work.capability_id, capacity.periodKey, id);
  await db.batch([update, insert, clear]);

  const row = await db.prepare('SELECT * FROM eon_work_capacity_leases WHERE lease_id=? AND account_ref=? LIMIT 1').bind(id, account).first();
  if (!row) return freeze({ ok: false, reason: 'capacity-admission-race-or-limit', leaseCreated: false, runtimeActive: false });
  return freeze({ ok: true, leaseCreated: true, idempotentReplay: false, lease: publicLease(row), runtimeActive: false, backgroundJobCreated: false, executionStarted: false });
}

export async function releaseEonWorkCapacityLease(db, accountRef = '', leaseRef = '', { now = Date.now(), releaseStatus = 'released' } = {}) {
  if (!db?.prepare || typeof db.batch !== 'function') return freeze({ ok: false, reason: 'transactional-work-db-required', released: false });
  const account = safeId(accountRef); const id = safeId(leaseRef); const clock = nowNumber(now);
  if (!account || !id) return freeze({ ok: false, reason: 'account-and-lease-required', released: false });
  const lease = await db.prepare('SELECT * FROM eon_work_capacity_leases WHERE lease_id=? AND account_ref=? LIMIT 1').bind(id, account).first();
  if (!lease) return freeze({ ok: false, reason: 'lease-not-found', released: false });
  if (lease.status !== 'active') return freeze({ ok: true, released: true, idempotentReplay: true, lease: publicLease(lease), runtimeActive: false });
  const nextStatus = releaseStatus === 'consumed' ? 'consumed' : releaseStatus === 'expired' ? 'expired' : 'released';
  const decrement = db.prepare("UPDATE eon_work_capacity SET active_leases=CASE WHEN active_leases>0 THEN active_leases-1 ELSE 0 END,updated_at=? WHERE account_ref=? AND capability_id=? AND period_key=? AND EXISTS (SELECT 1 FROM eon_work_capacity_leases WHERE lease_id=? AND account_ref=? AND status='active')")
    .bind(clock, account, lease.capability_id, lease.period_key, id, account);
  const close = db.prepare("UPDATE eon_work_capacity_leases SET status=?,released_at=? WHERE lease_id=? AND account_ref=? AND status='active'").bind(nextStatus, clock, id, account);
  await db.batch([decrement, close]);
  const row = await db.prepare('SELECT * FROM eon_work_capacity_leases WHERE lease_id=? AND account_ref=? LIMIT 1').bind(id, account).first();
  return freeze({ ok: true, released: true, idempotentReplay: false, lease: publicLease(row), runtimeActive: false, executionStarted: false });
}

export function getEonWorkCapacityTruth() {
  return freeze({
    schema: EON_WORK_CAPACITY_SCHEMA,
    allowedCapacitySources: EON_WORK_CAPACITY_SOURCES,
    ultimatePerpetualGrantIsCapacityAuthority: false,
    browserCanCreateCapacityEnvelope: false,
    browserCanIncreaseLimit: false,
    finiteUnitsRequired: true,
    finiteConcurrencyRequired: true,
    leaseRequiredBeforeFutureHostedExecution: true,
    executorActive: false,
    schedulerActive: false,
    requiresD1BatchAtomicityDeploymentProof: true
  });
}
