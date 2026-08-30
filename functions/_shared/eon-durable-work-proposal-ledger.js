/**
 * RT92 server-side durable-work proposal ledger.
 *
 * This persists only redacted proposal metadata in a future dedicated D1
 * binding. It does not admit capacity, queue work, execute a provider, schedule
 * a run, approve an external effect or store prompt/output/credential bodies.
 */
export const EON_DURABLE_WORK_LEDGER_SCHEMA = 'eonapp.durable-work-proposal-ledger.rt92.v1';
export const EON_DURABLE_WORK_LEDGER_ROLLOUTS = Object.freeze(['testing']);
const ROLLOUT_SET = new Set(EON_DURABLE_WORK_LEDGER_ROLLOUTS);
const ID_RE = /^[a-zA-Z0-9._:-]{1,140}$/;
const DIGEST_RE = /^(?:sha256:)?[a-f0-9]{32,128}$/i;
const WORKLOAD_SET = new Set(['platform-hosted', 'local', 'byok']);
const RAW_KEYS = Object.freeze(['prompt','rawPrompt','input','rawInput','content','body','message','messages','credentials','credential','secret','token','apiKey','authorization','output','result']);
const freeze = Object.freeze;

function safeId(value = '', max = 140) {
  const text = String(value || '').trim().slice(0, max);
  return ID_RE.test(text) ? text : '';
}
function safeDigest(value = '') {
  const text = String(value || '').trim();
  return DIGEST_RE.test(text) ? text.toLowerCase() : '';
}
function positiveInteger(value, max = 1_000_000) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(1, Math.trunc(number))) : 1;
}
function hasRawKeys(input = {}) { return RAW_KEYS.some((key) => Object.prototype.hasOwnProperty.call(input || {}, key)); }
function nowNumber(value = Date.now()) { const number = Number(value); return Number.isFinite(number) && number > 0 ? Math.trunc(number) : Date.now(); }
function randomId(prefix = 'work') { return `${prefix}:${crypto.randomUUID()}`; }
async function sha256Hex(value = '') {
  const bytes = new TextEncoder().encode(String(value || ''));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function getEonDurableWorkLedgerConfig(env = {}) {
  const rollout = String(env.EON_DURABLE_WORK_ROLLOUT || '').trim().toLowerCase();
  const db = env.EON_WORK_DB || null;
  const configured = ROLLOUT_SET.has(rollout) && Boolean(db);
  return freeze({
    configured,
    rollout: configured ? rollout : 'disabled',
    db: configured ? db : null,
    productionAllowed: false,
    runtimeActive: false,
    backgroundExecution: false,
    capacityAdmissionActive: false
  });
}

export function normalizeEonDurableWorkProposalInput(input = {}, { now = Date.now() } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return freeze({ ok: false, reason: 'object-input-required' });
  if (hasRawKeys(input)) return freeze({ ok: false, reason: 'raw-work-payload-forbidden' });
  const capabilityId = safeId(input.capabilityId);
  const taskClass = safeId(input.taskClass);
  const projectRef = safeId(input.projectRef);
  const inputDigest = safeDigest(input.inputDigest);
  const idempotencyKey = safeId(input.idempotencyKey);
  const workloadClass = String(input.workloadClass || '').trim().toLowerCase();
  const requestedUnits = positiveInteger(input.requestedUnits);
  const clock = nowNumber(now);
  const requestedExpiry = Number(input.expiresAtMs);
  const maxExpiry = clock + 60 * 60_000;
  const expiresAtMs = Number.isFinite(requestedExpiry) ? Math.min(Math.trunc(requestedExpiry), maxExpiry) : clock + 15 * 60_000;
  if (!capabilityId || !taskClass || !inputDigest || !idempotencyKey) return freeze({ ok: false, reason: 'capability-task-digest-idempotency-required' });
  if (!WORKLOAD_SET.has(workloadClass)) return freeze({ ok: false, reason: 'known-workload-class-required' });
  if (expiresAtMs <= clock) return freeze({ ok: false, reason: 'future-expiry-required' });
  return freeze({ ok: true, capabilityId, taskClass, projectRef, inputDigest, idempotencyKey, workloadClass, requestedUnits, createdAtMs: clock, expiresAtMs });
}

function publicProposal(row = {}, { now = Date.now() } = {}) {
  return freeze({
    proposalId: safeId(row.proposal_id || row.proposalId),
    projectRef: safeId(row.project_ref || row.projectRef),
    capabilityId: safeId(row.capability_id || row.capabilityId),
    taskClass: safeId(row.task_class || row.taskClass),
    workloadClass: String(row.workload_class || row.workloadClass || ''),
    requestedUnits: positiveInteger(row.requested_units ?? row.requestedUnits),
    status: (() => {
      const stored = ['prepared','cancelled','expired'].includes(String(row.status || '')) ? String(row.status) : 'prepared';
      if (stored === 'prepared' && Number(row.expires_at || row.expiresAtMs || 0) <= nowNumber(now)) return 'expired';
      return stored;
    })(),
    createdAtMs: nowNumber(row.created_at || row.createdAtMs),
    expiresAtMs: nowNumber(row.expires_at || row.expiresAtMs),
    cancelledAtMs: row.cancelled_at ? nowNumber(row.cancelled_at) : null,
    rawPromptStored: false,
    rawOutputStored: false,
    credentialStored: false,
    providerTokenStored: false,
    capacityAdmitted: false,
    backgroundJobCreated: false,
    externalEffectCreated: false
  });
}

async function auditEvent(db, { proposalId, accountRef, eventCode, eventBasis, now }) {
  const auditId = randomId('workaudit');
  const eventDigest = `sha256:${await sha256Hex(`${proposalId}:${accountRef}:${eventCode}:${eventBasis}`)}`;
  await db.prepare('INSERT INTO eon_durable_work_audit (audit_id,proposal_id,account_ref,event_code,event_digest,created_at) VALUES (?,?,?,?,?,?)')
    .bind(auditId, proposalId, accountRef, eventCode, eventDigest, now).run();
}

export async function createEonDurableWorkProposal(db, accountRef = '', input = {}, { now = Date.now() } = {}) {
  if (!db?.prepare) return freeze({ ok: false, reason: 'work-db-required', proposalCreated: false });
  const account = safeId(accountRef);
  if (!account) return freeze({ ok: false, reason: 'server-account-required', proposalCreated: false });
  const normalized = normalizeEonDurableWorkProposalInput(input, { now });
  if (!normalized.ok) return freeze({ ...normalized, proposalCreated: false });

  const existing = await db.prepare('SELECT * FROM eon_durable_work_proposals WHERE account_ref=? AND idempotency_key=? LIMIT 1')
    .bind(account, normalized.idempotencyKey).first();
  if (existing) return freeze({ ok: true, idempotentReplay: true, proposalCreated: false, proposal: publicProposal(existing), runtimeActive: false });

  const proposalId = randomId('workproposal');
  await db.prepare('INSERT INTO eon_durable_work_proposals (proposal_id,account_ref,project_ref,capability_id,task_class,workload_class,requested_units,input_digest,idempotency_key,status,created_at,expires_at,cancelled_at) VALUES (?,?,?,?,?,?,?,?,?,\'prepared\',?,?,NULL)')
    .bind(proposalId, account, normalized.projectRef || null, normalized.capabilityId, normalized.taskClass, normalized.workloadClass, normalized.requestedUnits, normalized.inputDigest, normalized.idempotencyKey, normalized.createdAtMs, normalized.expiresAtMs).run();
  await auditEvent(db, { proposalId, accountRef: account, eventCode: 'prepared', eventBasis: normalized.inputDigest, now: normalized.createdAtMs });
  const row = await db.prepare('SELECT * FROM eon_durable_work_proposals WHERE proposal_id=? AND account_ref=? LIMIT 1').bind(proposalId, account).first();
  return freeze({ ok: true, idempotentReplay: false, proposalCreated: true, proposal: publicProposal(row), runtimeActive: false, capacityAdmitted: false, backgroundJobCreated: false, networkProviderRequestCreated: false });
}

export async function listEonDurableWorkProposals(db, accountRef = '', { now = Date.now(), limit = 24 } = {}) {
  if (!db?.prepare) return freeze({ ok: false, reason: 'work-db-required', proposals: freeze([]) });
  const account = safeId(accountRef);
  if (!account) return freeze({ ok: false, reason: 'server-account-required', proposals: freeze([]) });
  const clock = nowNumber(now);
  const rows = await db.prepare('SELECT * FROM eon_durable_work_proposals WHERE account_ref=? ORDER BY created_at DESC LIMIT ?').bind(account, Math.min(50, positiveInteger(limit, 50))).all();
  return freeze({ ok: true, proposals: freeze((rows?.results || []).map((row) => publicProposal(row, { now: clock }))), runtimeActive: false, backgroundExecution: false, readMutatedStorage: false });
}

export async function cancelEonDurableWorkProposal(db, accountRef = '', proposalId = '', { now = Date.now() } = {}) {
  if (!db?.prepare) return freeze({ ok: false, reason: 'work-db-required', cancelled: false });
  const account = safeId(accountRef);
  const id = safeId(proposalId);
  if (!account || !id) return freeze({ ok: false, reason: 'account-and-proposal-required', cancelled: false });
  const clock = nowNumber(now);
  const existing = await db.prepare('SELECT * FROM eon_durable_work_proposals WHERE proposal_id=? AND account_ref=? LIMIT 1').bind(id, account).first();
  if (!existing) return freeze({ ok: false, reason: 'proposal-not-found', cancelled: false });
  if (existing.status === 'cancelled') return freeze({ ok: true, cancelled: true, idempotentReplay: true, proposal: publicProposal(existing, { now: clock }), runtimeActive: false });
  if (existing.status !== 'prepared' || Number(existing.expires_at || 0) <= clock) return freeze({ ok: false, reason: 'proposal-not-cancellable', cancelled: false, proposal: publicProposal(existing, { now: clock }) });
  await db.prepare("UPDATE eon_durable_work_proposals SET status='cancelled',cancelled_at=? WHERE proposal_id=? AND account_ref=? AND status='prepared'").bind(clock, id, account).run();
  await auditEvent(db, { proposalId: id, accountRef: account, eventCode: 'cancelled', eventBasis: existing.input_digest, now: clock });
  const row = await db.prepare('SELECT * FROM eon_durable_work_proposals WHERE proposal_id=? AND account_ref=? LIMIT 1').bind(id, account).first();
  return freeze({ ok: true, cancelled: true, idempotentReplay: false, proposal: publicProposal(row), runtimeActive: false, backgroundJobCreated: false, externalEffectCreated: false });
}

export function getEonDurableWorkProposalLedgerTruth() {
  return freeze({
    schema: EON_DURABLE_WORK_LEDGER_SCHEMA,
    testingOnly: true,
    productionAllowed: false,
    dedicatedBindingRequired: 'EON_WORK_DB',
    storesRawPrompt: false,
    storesRawOutput: false,
    storesCredentials: false,
    capacityAdmissionActive: false,
    schedulerActive: false,
    executorActive: false,
    backgroundJobCreated: false,
    externalEffectCreated: false
  });
}
