/**
 * RT92 — permanent premium SOFTWARE capability authority.
 *
 * This ledger is deliberately independent from recurring subscription capacity.
 * Ultimate may unlock eligible software capabilities permanently, but it can
 * never mint hosted AI, storage, scheduling or concurrency capacity.
 *
 * Browser redirects, client metadata and Dodo catalogue records are never grant
 * authority. Only a verified server webhook may call applySoftwareGrantEventToD1.
 */
export const EON_PREMIUM_SOFTWARE_GRANT_SCHEMA = 'eonapp.premium-software-grants.rt92.v1';
export const EON_PREMIUM_SOFTWARE_SCHEMA_DOMAIN = 'premium_billing';
export const EON_PREMIUM_SOFTWARE_SCHEMA_VERSION = 1;
export const EON_ULTIMATE_BUNDLE_ID = 'ultimate';

const freeze = Object.freeze;
const encoder = new TextEncoder();
const ACTIVE = 'active';
const REVOKED = 'revoked';
const ALLOWED_EVENT_TYPES = new Set(['grant', 'revoke', 'restore', 'ignored']);

function clean(value = '', max = 180) {
  return String(value || '').replaceAll(String.fromCharCode(0), '').trim().replace(/[^a-zA-Z0-9._:@/?=&%-]/g, '').slice(0, max);
}
function epoch(value = 0) {
  if (Number.isFinite(Number(value)) && Number(value) > 0) return Math.floor(Number(value));
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}
function toHex(bytes) { return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join(''); }
async function sha256Hex(value = '') { return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(String(value || ''))))); }
function timingSafeEqual(left = '', right = '') {
  const a = String(left || ''); const b = String(right || '');
  const length = Math.max(a.length, b.length); let mismatch = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) mismatch |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  return mismatch === 0;
}

export async function readPremiumSoftwareSchemaAuthority(database) {
  if (!database?.prepare) return freeze({ ok: false, reason: 'billing_db_missing', expectedVersion: EON_PREMIUM_SOFTWARE_SCHEMA_VERSION, actualVersion: 0 });
  try {
    const row = await database.prepare(`SELECT domain, schema_version, migration_name, applied_at FROM eon_schema_authority WHERE domain = ? LIMIT 1`)
      .bind(EON_PREMIUM_SOFTWARE_SCHEMA_DOMAIN).first();
    const actualVersion = Number(row?.schema_version || 0);
    return freeze({
      ok: Boolean(row) && actualVersion === EON_PREMIUM_SOFTWARE_SCHEMA_VERSION,
      reason: !row ? 'premium_schema_authority_missing' : (actualVersion === EON_PREMIUM_SOFTWARE_SCHEMA_VERSION ? '' : 'premium_schema_version_mismatch'),
      expectedVersion: EON_PREMIUM_SOFTWARE_SCHEMA_VERSION,
      actualVersion,
      migrationName: clean(row?.migration_name, 120),
      appliedAt: Number(row?.applied_at || 0) || 0
    });
  } catch {
    return freeze({ ok: false, reason: 'premium_schema_authority_unavailable', expectedVersion: EON_PREMIUM_SOFTWARE_SCHEMA_VERSION, actualVersion: 0 });
  }
}

export async function ensurePremiumSoftwareGrantSchema(database) {
  const status = await readPremiumSoftwareSchemaAuthority(database);
  if (!status.ok) throw new Error(status.reason || 'premium_schema_unavailable');
  return freeze({ ok: true, schema: EON_PREMIUM_SOFTWARE_GRANT_SCHEMA, migrationOnly: true, ...status });
}

export function normalizeSoftwareGrantEvent(candidate = {}, { now = Date.now() } = {}) {
  const eventType = clean(candidate.eventType || candidate.event_type, 40).toLowerCase();
  const bundleId = clean(candidate.bundleId || candidate.bundle_id, 40).toLowerCase();
  const accountId = clean(candidate.accountId || candidate.account_id, 80);
  const sourceOrderRef = clean(candidate.sourceOrderRef || candidate.source_order_ref || candidate.orderRef || candidate.order_ref, 160);
  const sourcePaymentRef = clean(candidate.sourcePaymentRef || candidate.source_payment_ref || candidate.paymentRef || candidate.payment_ref, 160);
  const providerEventId = clean(candidate.providerEventId || candidate.provider_event_id, 160);
  const rawEventType = clean(candidate.rawEventType || candidate.raw_event_type, 96).toLowerCase();
  const occurredAt = epoch(candidate.occurredAt || candidate.occurred_at) || Number(now);
  const errors = [];
  if (!providerEventId) errors.push('provider-event-id-required');
  if (!ALLOWED_EVENT_TYPES.has(eventType)) errors.push('event-type-invalid');
  if (eventType !== 'ignored' && bundleId !== EON_ULTIMATE_BUNDLE_ID) errors.push('bundle-id-invalid');
  if ((eventType === 'grant' || eventType === 'restore') && !accountId) errors.push('account-id-required');
  if (eventType !== 'ignored' && !sourceOrderRef && !sourcePaymentRef) errors.push('provider-order-or-payment-reference-required');
  return freeze({
    ok: errors.length === 0,
    errors: freeze(errors),
    schema: EON_PREMIUM_SOFTWARE_GRANT_SCHEMA,
    providerEventId,
    rawEventType,
    eventType: ALLOWED_EVENT_TYPES.has(eventType) ? eventType : 'ignored',
    accountId,
    bundleId: bundleId === EON_ULTIMATE_BUNDLE_ID ? bundleId : '',
    sourceOrderRef: sourceOrderRef || sourcePaymentRef,
    sourcePaymentRef,
    occurredAt,
    revocationReason: clean(candidate.revocationReason || candidate.revocation_reason, 80)
  });
}

async function grantIdFor(event) {
  const digest = await sha256Hex(`dodo:${event.accountId}:${event.bundleId}:${event.sourceOrderRef}`);
  return `software_${digest.slice(0, 40)}`;
}

export async function readSoftwareGrantByPaymentRef(database, paymentRef = '') {
  const payment = clean(paymentRef, 160);
  if (!database?.prepare || !payment) return null;
  const authority = await readPremiumSoftwareSchemaAuthority(database);
  if (!authority.ok) return null;
  const row = await database.prepare(`SELECT grant_id, account_id, bundle_id, status, source_provider, source_event_id, source_order_ref, source_payment_ref, issued_at, revoked_at, revocation_reason, updated_at FROM eon_software_grants WHERE source_payment_ref = ? ORDER BY updated_at DESC LIMIT 1`).bind(payment).first();
  if (!row) return null;
  return freeze({
    grantId: clean(row.grant_id, 128),
    accountId: clean(row.account_id, 80),
    bundleId: clean(row.bundle_id, 40),
    status: row.status === ACTIVE ? ACTIVE : REVOKED,
    issuedAt: Number(row.issued_at || 0) || 0,
    updatedAt: Number(row.updated_at || 0) || 0,
    sourceProvider: clean(row.source_provider, 32),
    sourceOrderRef: clean(row.source_order_ref, 160),
    sourcePaymentRef: clean(row.source_payment_ref, 160)
  });
}

export async function readAccountActiveSoftwareGrants(database, accountId = '') {
  const account = clean(accountId, 80);
  if (!database?.prepare || !account) return freeze([]);
  const authority = await readPremiumSoftwareSchemaAuthority(database);
  if (!authority.ok) return freeze([]);
  const rows = await database.prepare(`SELECT grant_id, account_id, bundle_id, status, source_provider, source_event_id, source_order_ref, source_payment_ref, issued_at, revoked_at, revocation_reason, updated_at FROM eon_software_grants WHERE account_id = ? AND status = 'active' ORDER BY updated_at DESC`).bind(account).all();
  return freeze((rows?.results || []).map((row) => freeze({
    grantId: clean(row.grant_id, 128),
    accountId: clean(row.account_id, 80),
    bundleId: clean(row.bundle_id, 40),
    status: row.status === ACTIVE ? ACTIVE : REVOKED,
    issuedAt: Number(row.issued_at || 0) || 0,
    updatedAt: Number(row.updated_at || 0) || 0,
    sourceProvider: clean(row.source_provider, 32),
    sourceOrderRef: clean(row.source_order_ref, 160),
    sourcePaymentRef: clean(row.source_payment_ref, 160)
  })));
}

async function findGrantForRevocation(database, event) {
  if (event.sourcePaymentRef) {
    const byPayment = await database.prepare(`SELECT * FROM eon_software_grants WHERE source_payment_ref = ? ORDER BY updated_at DESC LIMIT 1`).bind(event.sourcePaymentRef).first();
    if (byPayment) return byPayment;
  }
  if (event.sourceOrderRef) {
    const byOrder = await database.prepare(`SELECT * FROM eon_software_grants WHERE source_provider = 'dodo' AND source_order_ref = ? LIMIT 1`).bind(event.sourceOrderRef).first();
    if (byOrder) return byOrder;
  }
  return null;
}

export async function applySoftwareGrantEventToD1(database, eventCandidate = {}, rawPayload = '', { now = Date.now() } = {}) {
  await ensurePremiumSoftwareGrantSchema(database);
  const event = normalizeSoftwareGrantEvent(eventCandidate, { now });
  if (!event.ok) return freeze({ ok: false, status: 'invalid_software_grant_event', errors: event.errors, changed: false });
  const payloadHash = await sha256Hex(rawPayload);
  const existing = await database.prepare(`SELECT provider_event_id, payload_hash, processing_status FROM eon_software_grant_events WHERE provider_event_id = ? LIMIT 1`).bind(event.providerEventId).first();
  if (existing?.payload_hash && !timingSafeEqual(existing.payload_hash, payloadHash)) {
    return freeze({ ok: false, status: 'software_grant_event_payload_conflict', duplicate: true, changed: false });
  }
  if (existing?.processing_status === 'processed' || existing?.processing_status === 'processed_no_change') {
    return freeze({ ok: true, status: existing.processing_status, duplicate: true, changed: false });
  }

  const processedAt = Number(now);
  if (!existing) {
    await database.prepare(`INSERT INTO eon_software_grant_events (provider_event_id, provider, raw_event_type, event_type, account_id, bundle_id, source_order_ref, source_payment_ref, occurred_at, processed_at, payload_hash, processing_status) VALUES (?, 'dodo', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing')`)
      .bind(event.providerEventId, event.rawEventType, event.eventType, event.accountId || null, event.bundleId || null, event.sourceOrderRef || null, event.sourcePaymentRef || null, event.occurredAt, processedAt, payloadHash).run();
  } else {
    await database.prepare(`UPDATE eon_software_grant_events SET processed_at = ?, payload_hash = ?, processing_status = 'processing' WHERE provider_event_id = ?`).bind(processedAt, payloadHash, event.providerEventId).run();
  }

  let changed = false;
  let status = 'processed_no_change';
  if (event.eventType === 'grant' || event.eventType === 'restore') {
    const grantId = await grantIdFor(event);
    const prior = await database.prepare(`SELECT grant_id, status FROM eon_software_grants WHERE source_provider = 'dodo' AND source_order_ref = ? LIMIT 1`).bind(event.sourceOrderRef).first();
    await database.prepare(`INSERT INTO eon_software_grants (grant_id, account_id, bundle_id, status, source_provider, source_event_id, source_order_ref, source_payment_ref, issued_at, revoked_at, revocation_reason, updated_at) VALUES (?, ?, ?, 'active', 'dodo', ?, ?, ?, ?, NULL, NULL, ?) ON CONFLICT(source_provider, source_order_ref) DO UPDATE SET account_id=excluded.account_id, bundle_id=excluded.bundle_id, status='active', source_event_id=excluded.source_event_id, source_payment_ref=COALESCE(excluded.source_payment_ref,eon_software_grants.source_payment_ref), revoked_at=NULL, revocation_reason=NULL, updated_at=excluded.updated_at`)
      .bind(grantId, event.accountId, event.bundleId, event.providerEventId, event.sourceOrderRef, event.sourcePaymentRef || null, event.occurredAt, processedAt).run();
    changed = !prior || prior.status !== ACTIVE;
    status = 'processed';
  } else if (event.eventType === 'revoke') {
    const prior = await findGrantForRevocation(database, event);
    if (prior?.grant_id) {
      await database.prepare(`UPDATE eon_software_grants SET status='revoked', source_event_id=?, revoked_at=?, revocation_reason=?, updated_at=? WHERE grant_id=?`)
        .bind(event.providerEventId, event.occurredAt, event.revocationReason || 'provider-revocation', processedAt, prior.grant_id).run();
      changed = prior.status !== REVOKED;
      status = 'processed';
    }
  }

  await database.prepare(`UPDATE eon_software_grant_events SET processing_status = ?, processed_at = ? WHERE provider_event_id = ?`).bind(status, processedAt, event.providerEventId).run();
  return freeze({ ok: true, status, duplicate: Boolean(existing), changed, eventType: event.eventType, bundleId: event.bundleId || null, accountId: event.accountId || null, serverAuthoritative: true, hostedCapacityGranted: false });
}

export function getPremiumSoftwareGrantTruth() {
  return freeze({
    schema: EON_PREMIUM_SOFTWARE_GRANT_SCHEMA,
    sameBillingD1: true,
    separateSchemaAuthorityDomain: EON_PREMIUM_SOFTWARE_SCHEMA_DOMAIN,
    perpetualBundle: EON_ULTIMATE_BUNDLE_ID,
    browserGrantAllowed: false,
    signedWebhookRequired: true,
    hostedCapacityGranted: false,
    recurringSubscriptionReplaced: false,
    refundsAndDisputesCanRevoke: true,
    crossSessionRestoreFromServerLedger: true
  });
}

export default freeze({
  EON_PREMIUM_SOFTWARE_GRANT_SCHEMA,
  EON_PREMIUM_SOFTWARE_SCHEMA_DOMAIN,
  EON_PREMIUM_SOFTWARE_SCHEMA_VERSION,
  EON_ULTIMATE_BUNDLE_ID,
  readPremiumSoftwareSchemaAuthority,
  ensurePremiumSoftwareGrantSchema,
  normalizeSoftwareGrantEvent,
  readAccountActiveSoftwareGrants,
  readSoftwareGrantByPaymentRef,
  applySoftwareGrantEventToD1,
  getPremiumSoftwareGrantTruth
});
