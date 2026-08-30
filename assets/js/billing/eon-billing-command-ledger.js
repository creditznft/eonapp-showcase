import { assertD1SchemaAuthority } from '../infrastructure/eon-d1-schema-authority.js';
/** A15 I17 — account-scoped billing command and one-subscription/trial authority. */
export const EON_BILLING_COMMAND_SCHEMA = 'eon.billing-command.a15.v1';
export const EON_BILLING_COMMAND_STATES = Object.freeze([
  'prepared', 'provider_pending', 'provider_accepted', 'verified', 'failed', 'cancelled'
]);

const ACTIVE_SUBSCRIPTION_STATES = new Set(['trialing', 'active', 'cancelling', 'grace', 'past_due']);
const PENDING_COMMAND_STATES = new Set(['prepared', 'provider_pending', 'provider_accepted']);
const OPERATION_RE = /^(checkout|software-purchase|change-plan|cancel-at-period-end|reactivate)$/;
const ID_RE = /^[a-zA-Z0-9:_-]{8,180}$/;
const freeze = Object.freeze;

function clean(value = '', limit = 180) {
  return String(value || '').replaceAll(String.fromCharCode(0), '').trim().slice(0, limit);
}

const SUBSCRIPTION_TIERS = Object.freeze(['plus', 'studio', 'power', 'max', 'pro', 'ultra']);
const PRODUCT_TIERS = Object.freeze([...SUBSCRIPTION_TIERS, 'ultimate']);
function cleanTier(value = '') {
  const tier = clean(value, 24).toLowerCase();
  return PRODUCT_TIERS.includes(tier) ? tier : '';
}
function subscriptionTier(value = '') {
  const tier = cleanTier(value);
  return SUBSCRIPTION_TIERS.includes(tier) ? tier : '';
}


function publicCommand(row = {}) {
  if (!row || typeof row !== 'object') return null;
  return freeze({
    schema: EON_BILLING_COMMAND_SCHEMA,
    commandId: clean(row.command_id || row.commandId, 128),
    accountId: clean(row.account_id || row.accountId, 80),
    operation: clean(row.operation, 48),
    requestedTierId: cleanTier(row.requested_tier_id || row.requestedTierId),
    statePrecondition: clean(row.state_precondition || row.statePrecondition, 64),
    status: EON_BILLING_COMMAND_STATES.includes(row.status) ? row.status : 'failed',
    providerObjectRef: clean(row.provider_object_ref || row.providerObjectRef, 128),
    providerHttpStatus: Number(row.provider_http_status || row.providerHttpStatus || 0) || 0,
    trialDays: Math.max(0, Math.min(7, Number(row.trial_days ?? row.trialDays ?? 0) || 0)),
    resultStatus: clean(row.result_status || row.resultStatus, 80),
    errorCode: clean(row.error_code || row.errorCode, 120),
    createdAt: Number(row.created_at || row.createdAt || 0) || 0,
    updatedAt: Number(row.updated_at || row.updatedAt || 0) || 0,
    externalEffectVerified: row.status === 'verified'
  });
}

export async function ensureBillingCommandSchema(database) {
  if (!database?.prepare) throw new Error('billing_db_missing');
  await assertD1SchemaAuthority(database, 'billing');
  return freeze({ ok: true, schema: EON_BILLING_COMMAND_SCHEMA, migrationOnly: true });
}

export function normalizeBillingCommandRequest(input = {}) {
  const accountId = clean(input.accountId, 80);
  const operation = clean(input.operation, 48);
  const requestedTierId = cleanTier(input.requestedTierId || input.tierId);
  const idempotencyKey = clean(input.idempotencyKey, 180);
  const statePrecondition = clean(input.statePrecondition || 'server-ledger-current', 64);
  const errors = [];
  if (!accountId) errors.push('account-required');
  if (!OPERATION_RE.test(operation)) errors.push('operation-invalid');
  if ((operation === 'checkout' || operation === 'change-plan') && !subscriptionTier(requestedTierId)) errors.push('paid-subscription-tier-required');
  if (operation === 'software-purchase' && requestedTierId !== 'ultimate') errors.push('ultimate-software-tier-required');
  if (!ID_RE.test(idempotencyKey)) errors.push('idempotency-key-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), accountId, operation, requestedTierId, idempotencyKey, statePrecondition });
}


export async function readAccountTrialEligibility(database, accountId = '') {
  const account = clean(accountId, 80);
  if (!database?.prepare || !account) return false;
  await ensureBillingCommandSchema(database);
  const lifecycle = await readLifecycle(database, account);
  if (Number(lifecycle?.trial_ends_at || 0) > 0) return false;
  return !(await trialPreviouslyReserved(database, account));
}

export async function readBillingCommand(database, accountId = '', idempotencyKey = '') {
  const account = clean(accountId, 80);
  const key = clean(idempotencyKey, 180);
  if (!database?.prepare || !account || !key) return null;
  await ensureBillingCommandSchema(database);
  const row = await database.prepare(`SELECT * FROM eon_billing_commands WHERE account_id = ? AND idempotency_key = ? LIMIT 1`).bind(account, key).first();
  return row ? publicCommand(row) : null;
}

async function readPendingAccountCommand(database, accountId = '', operation = '') {
  const statuses = [...PENDING_COMMAND_STATES];
  const row = await database.prepare(`SELECT * FROM eon_billing_commands WHERE account_id = ? AND operation = ? AND status IN (?, ?, ?) ORDER BY updated_at DESC LIMIT 1`)
    .bind(accountId, operation, ...statuses).first();
  return row || null;
}

async function readLifecycle(database, accountId = '') {
  return (await database.prepare(`SELECT access_status, provider_subscription_ref, trial_ends_at, source_occurred_at FROM eon_billing_lifecycle WHERE account_id = ? LIMIT 1`).bind(accountId).first()) || null;
}

async function trialPreviouslyReserved(database, accountId = '') {
  const row = await database.prepare(`SELECT command_id FROM eon_billing_commands WHERE account_id = ? AND operation = 'checkout' AND trial_days > 0 AND status IN ('provider_accepted','verified') LIMIT 1`).bind(accountId).first();
  return Boolean(row?.command_id);
}

export async function prepareBillingCommand(database, input = {}, options = {}) {
  const request = normalizeBillingCommandRequest(input);
  if (!request.ok) return freeze({ ok: false, status: 'invalid_command', errors: request.errors, duplicate: false, command: null });
  await ensureBillingCommandSchema(database);
  const existingRow = await database.prepare(`SELECT * FROM eon_billing_commands WHERE account_id = ? AND idempotency_key = ? LIMIT 1`).bind(request.accountId, request.idempotencyKey).first();
  if (existingRow) {
    const existing = publicCommand(existingRow);
    const conflict = existing.operation !== request.operation || existing.requestedTierId !== request.requestedTierId;
    return freeze({ ok: !conflict, status: conflict ? 'idempotency_conflict' : 'duplicate_command', duplicate: true, command: existing, providerRedirectUrl: conflict ? '' : clean(existingRow.provider_redirect_url, 500) });
  }

  if (request.operation === 'checkout') {
    const lifecycle = await readLifecycle(database, request.accountId);
    if (ACTIVE_SUBSCRIPTION_STATES.has(String(lifecycle?.access_status || '')) || clean(lifecycle?.provider_subscription_ref, 128)) {
      return freeze({ ok: false, status: 'existing_subscription_use_plan_change', duplicate: false, command: null });
    }
    const pendingRow = await readPendingAccountCommand(database, request.accountId, 'checkout');
    if (pendingRow) return freeze({ ok: true, status: 'account_pending_command', duplicate: true, command: publicCommand(pendingRow), providerRedirectUrl: clean(pendingRow.provider_redirect_url, 500) });
  }
  if (request.operation !== 'checkout') {
    const pendingRow = await readPendingAccountCommand(database, request.accountId, request.operation);
    if (pendingRow) return freeze({ ok: true, status: 'account_pending_command', duplicate: true, command: publicCommand(pendingRow), providerRedirectUrl: '' });
  }

  const now = Number(options.now || Date.now());
  const commandId = clean(options.commandId || `billingcmd_${request.idempotencyKey}`, 128);
  const lifecycle = request.operation === 'checkout' ? await readLifecycle(database, request.accountId) : null;
  const trialUsed = request.operation === 'checkout' && (Number(lifecycle?.trial_ends_at || 0) > 0 || await trialPreviouslyReserved(database, request.accountId));
  const trialDays = request.operation === 'checkout' && !trialUsed ? 7 : 0;
  try {
    await database.prepare(`INSERT INTO eon_billing_commands (command_id, account_id, idempotency_key, operation, requested_tier_id, state_precondition, status, trial_days, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'prepared', ?, ?, ?)`)
      .bind(commandId, request.accountId, request.idempotencyKey, request.operation, request.requestedTierId || null, request.statePrecondition, trialDays, now, now).run();
  } catch {
    const raced = await database.prepare(`SELECT * FROM eon_billing_commands WHERE account_id = ? AND idempotency_key = ? LIMIT 1`).bind(request.accountId, request.idempotencyKey).first();
    if (raced) return freeze({ ok: true, status: 'duplicate_command', duplicate: true, command: publicCommand(raced), providerRedirectUrl: clean(raced.provider_redirect_url, 500) });
    throw new Error('billing-command-insert-failed');
  }
  const command = publicCommand({
    command_id: commandId,
    account_id: request.accountId,
    operation: request.operation,
    requested_tier_id: request.requestedTierId,
    state_precondition: request.statePrecondition,
    status: 'prepared',
    trial_days: trialDays,
    created_at: now,
    updated_at: now
  });
  return freeze({ ok: true, status: 'command_prepared', duplicate: false, command, providerRedirectUrl: '' });
}

export async function updateBillingCommand(database, commandId = '', patch = {}, options = {}) {
  const id = clean(commandId, 128);
  const status = EON_BILLING_COMMAND_STATES.includes(patch.status) ? patch.status : '';
  if (!database?.prepare || !id || !status) return null;
  await ensureBillingCommandSchema(database);
  const now = Number(options.now || Date.now());
  const redirect = clean(patch.providerRedirectUrl, 500);
  await database.prepare(`UPDATE eon_billing_commands SET status = ?, provider_object_ref = COALESCE(?, provider_object_ref), provider_redirect_url = CASE WHEN ? = '' THEN provider_redirect_url ELSE ? END, provider_http_status = ?, result_status = ?, error_code = ?, updated_at = ? WHERE command_id = ?`)
    .bind(status, clean(patch.providerObjectRef, 128) || null, redirect, redirect, Number(patch.providerHttpStatus || 0) || null, clean(patch.resultStatus, 80) || null, clean(patch.errorCode, 120) || null, now, id).run();
  const row = await database.prepare(`SELECT * FROM eon_billing_commands WHERE command_id = ? LIMIT 1`).bind(id).first();
  return row ? publicCommand(row) : null;
}

export async function reconcileBillingCommandFromWebhook(database, checkoutAttemptId = '', { entitlementChanged = false, processingStatus = '', now = Date.now() } = {}) {
  const id = clean(checkoutAttemptId, 128);
  if (!database?.prepare || !id) return null;
  return updateBillingCommand(database, id, {
    status: entitlementChanged ? 'verified' : 'provider_accepted',
    resultStatus: clean(processingStatus || (entitlementChanged ? 'verified' : 'provider_event_received'), 80),
    errorCode: ''
  }, { now });
}

export function getBillingCommandTruth() {
  return freeze({
    schema: EON_BILLING_COMMAND_SCHEMA,
    accountScopedIdempotency: true,
    onePendingCheckoutPerAccount: true,
    oneActiveSubscriptionPerAccount: true,
    oneTrialReservationPerAccount: true,
    browserCanGrantEntitlement: false,
    signedWebhookReconciliationRequired: true
  });
}
