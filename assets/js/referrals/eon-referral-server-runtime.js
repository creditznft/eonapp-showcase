import { assertD1SchemaAuthority } from '../infrastructure/eon-d1-schema-authority.js';
/**
 * W623I — scalable minimal server-authoritative referral and EONKEY runtime.
 *
 * Architectural boundary:
 * - Public share links remain self-contained and are never resolved through D1.
 * - The browser cannot grant, consume, revoke, or forge EONKEYS.
 * - Cloudflare stores only signed-in identity bindings, one-level invite
 *   relationships, qualifying state transitions, non-transferable key grants,
 *   selected unlocks, and small digital-reward receipts.
 * - No click/impression/post tracking, raw share-token storage, referral tree,
 *   payout, cash, wallet, token, ordinary ad-view reward, or subscription reward exists.
 * - A separate rewarded-sponsor authority may create one non-cash Sponsor Key
 *   only from a completed server-validated reward session; ordinary impressions
 *   and clicks remain permanently non-qualifying.
 * - EON_REFERRALS_DB is the preferred dedicated authority. A temporary
 *   EON_BILLING_DB fallback keeps older deployments readable during migration.
 * - No background poller, queue, cron, KV namespace, click tracker, or
 *   generation backend is required.
 */
import { verifySignedShareToken } from '../utils/signed-share-link.js';
import { verifySharePayload } from '../utils/share-link-identity.js';
import { getEonUnlockMenu } from './eon-keys-catalog.js';

export const EON_REFERRAL_SERVER_SCHEMA = 'eonapp.referrals.scalable-minimal-ledger.w623i.v2';
export const EON_REFERRAL_PROGRAM_VERSION = 1;
export const EON_REFERRAL_ROLLOUTS = Object.freeze(['testing', 'production']);
export const EON_REFERRAL_RETENTION_DAYS = 14;
export const EON_REFERRAL_FREE_SIGNAL_MONTHLY_CAP = 5;
export const EON_REFERRAL_PAID_YEARLY_CAP = 3;
export const EON_REFERRAL_BIND_CHALLENGE_TTL_MS = 10 * 60 * 1000;
export const EON_REFERRAL_IDENTITIES_PER_ACCOUNT_CAP = 5;
export const EON_REFERRAL_MILESTONE_CHALLENGE_TTL_MS = 30 * 60 * 1000;
export const EON_REFERRAL_MILESTONE_MIN_DWELL_MS = 3 * 1000;
export const EON_REFERRAL_SERVER_CHALLENGE_MILESTONES = Object.freeze(['city_orientation_completed']);
export const EON_REFERRAL_CITY_ORIENTATION_STEPS = Object.freeze([
  'opened-start-here',
  'reviewed-destination',
  'confirmed-destination'
]);
export const EON_REFERRAL_CITY_ORIENTATION_STEP_MIN_OFFSETS_MS = Object.freeze({
  'opened-start-here': 0,
  'reviewed-destination': 1000,
  'confirmed-destination': EON_REFERRAL_MILESTONE_MIN_DWELL_MS
});
export const EON_REFERRAL_ALLOWED_ACTIVATION_MILESTONES = Object.freeze([
  'google_account_connected',
  'first_project_saved',
  'guide_completed',
  'local_ai_setup_completed',
  'city_orientation_completed'
]);
export const EON_REFERRAL_NON_QUALIFYING_SIGNALS = Object.freeze([
  'raw_click',
  'impression',
  'copied_link',
  'generic_share',
  'ad_view',
  'ad_click',
  'unverified_social_post'
]);

const SAFE_TEXT = /[^a-zA-Z0-9._:@/-]/g;
const encoder = new TextEncoder();
let schemaReadyDatabase = null;

function freeze(value) {
  return Object.freeze(value);
}

function cleanText(value = '', max = 256) {
  return String(value ?? '').trim().replace(SAFE_TEXT, '').slice(0, max);
}

function cleanToken(value = '') {
  const token = String(value || '').trim();
  if (!/^(?:eon1|eon2)\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return '';
  return token.slice(0, 8192);
}

function nowMs(input = Date.now()) {
  const value = Number(input);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : Date.now();
}

function toHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(value = '') {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(String(value || '')));
  return toHex(new Uint8Array(digest));
}

function randomHex(byteLength = 24) {
  const bytes = new Uint8Array(Math.max(16, Math.min(64, Number(byteLength) || 24)));
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

function changedRows(result) {
  return Number(result?.meta?.changes ?? result?.changes ?? 0);
}

async function stableId(namespace = 'event', ...parts) {
  const hash = await sha256Hex([namespace, ...parts].join('\u001f'));
  return `${cleanText(namespace, 24) || 'event'}_${hash.slice(0, 40)}`;
}

function monthStartUtc(timestamp = Date.now()) {
  const date = new Date(nowMs(timestamp));
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

function yearStartUtc(timestamp = Date.now()) {
  const date = new Date(nowMs(timestamp));
  return Date.UTC(date.getUTCFullYear(), 0, 1);
}

function readResults(result) {
  if (Array.isArray(result?.results)) return result.results;
  if (Array.isArray(result)) return result;
  return [];
}

async function queryRows(statement) {
  return readResults(await statement.all());
}

function publicRollout(value = '') {
  const rollout = cleanText(value, 24).toLowerCase();
  return EON_REFERRAL_ROLLOUTS.includes(rollout) ? rollout : 'disabled';
}

export function resolveReferralDatabase(env = {}) {
  if (env.EON_REFERRALS_DB?.prepare) {
    return freeze({ database: env.EON_REFERRALS_DB, binding: 'EON_REFERRALS_DB', mode: 'dedicated' });
  }
  if (env.EON_BILLING_DB?.prepare) {
    return freeze({ database: env.EON_BILLING_DB, binding: 'EON_BILLING_DB', mode: 'legacy-billing-fallback' });
  }
  return freeze({ database: null, binding: '', mode: 'missing' });
}

export function getReferralRuntimeConfig(env = {}) {
  const rollout = publicRollout(env.EON_REFERRAL_ROLLOUT);
  const resolved = resolveReferralDatabase(env);
  const databaseReady = Boolean(resolved.database?.prepare);
  return freeze({
    schema: EON_REFERRAL_SERVER_SCHEMA,
    rollout,
    active: EON_REFERRAL_ROLLOUTS.includes(rollout) && databaseReady,
    databaseBinding: resolved.binding,
    databaseMode: resolved.mode,
    dedicatedDatabaseReady: Boolean(env.EON_REFERRALS_DB?.prepare),
    legacyBillingFallback: resolved.mode === 'legacy-billing-fallback',
    databaseReady,
    extraDatabaseRequired: false,
    extraSecretRequired: false,
    backgroundWorkerRequired: false,
    cronRequired: false,
    clickTracking: false,
    impressionTracking: false,
    ordinaryAdsOutsideReferral: true,
    rewardedSponsorKeysOutsideReferral: true,
    referralAdViewRewards: false,
    signedLinksRemainStateless: true,
    oneLevelOnly: true,
    identityProofOfPossession: 'fresh-p256-challenge',
    identitiesPerAccountCap: EON_REFERRAL_IDENTITIES_PER_ACCOUNT_CAP,
    freeSignalMonthlyCap: EON_REFERRAL_FREE_SIGNAL_MONTHLY_CAP,
    paidRewardYearlyCap: EON_REFERRAL_PAID_YEARLY_CAP,
    retentionDays: EON_REFERRAL_RETENTION_DAYS
  });
}

export async function ensureReferralSchema(database) {
  if (!database?.prepare) throw new Error('referral_db_missing');
  await assertD1SchemaAuthority(database, 'referrals');
  const cached = schemaReadyDatabase === database;
  schemaReadyDatabase = database;
  return freeze({ ok: true, schemaReady: true, cached, migrationOnly: true });
}

async function verifyReferralToken(input = '') {
  const token = cleanToken(input);
  if (!token) return freeze({ ok: false, reason: 'invalid_or_missing_signed_invite' });
  const verified = await verifySignedShareToken(token);
  if (!verified?.ok || verified.payload?.linkKind !== 'referral') {
    return freeze({ ok: false, reason: cleanText(verified?.reason || 'signed_invite_verification_failed', 80) });
  }
  const referralId = cleanText(verified.payload.rootReferralId, 96);
  const shareId = cleanText(verified.payload.shareId || verified.payload.nonce, 128);
  const issuerKey = verified.payload.issuerKey || {};
  if (!referralId || !shareId || !issuerKey.x || !issuerKey.y) return freeze({ ok: false, reason: 'signed_invite_identity_missing' });
  const publicKeyHash = await sha256Hex(`${issuerKey.kty || ''}.${issuerKey.crv || ''}.${issuerKey.x}.${issuerKey.y}`);
  return freeze({
    ok: true,
    token,
    referralId,
    shareId,
    publicKeyHash,
    issuerKey: freeze({ ...issuerKey }),
    tokenHash: await sha256Hex(token),
    issuedAt: Number(verified.payload.issuedAt || 0),
    expiresAt: Number(verified.payload.expiresAt || 0),
    destination: cleanText(verified.payload.destination || '/', 180),
    source: cleanText(verified.payload.source || 'share', 48)
  });
}

export async function requestReferralBindChallenge({ database, accountId = '', token = '', timestamp = Date.now() } = {}) {
  const account = cleanText(accountId, 80);
  if (!account) return freeze({ ok: false, status: 'login_required' });
  await ensureReferralSchema(database);
  const verified = await verifyReferralToken(token);
  if (!verified.ok) return verified;
  const existing = await database.prepare('SELECT referral_id, account_id, status FROM eon_referral_identities WHERE referral_id = ? LIMIT 1').bind(verified.referralId).first();
  if (existing && cleanText(existing.account_id, 80) !== account) return freeze({ ok: false, status: 'identity_already_bound_to_another_account' });
  const time = nowMs(timestamp);
  const random = new Uint8Array(24);
  crypto.getRandomValues(random);
  const challenge = toHex(random);
  const challengeId = await stableId('bind_challenge', account, verified.referralId, challenge, time);
  const canonical = `eon-referral-bind-v1:${challengeId}:${challenge}`;
  const expiresAt = time + EON_REFERRAL_BIND_CHALLENGE_TTL_MS;
  await database.batch([
    database.prepare('DELETE FROM eon_referral_bind_challenges WHERE expires_at < ? OR (used_at IS NOT NULL AND used_at < ?)').bind(time, time - EON_REFERRAL_BIND_CHALLENGE_TTL_MS),
    database.prepare(`
      INSERT INTO eon_referral_bind_challenges (
        challenge_id, account_id, referral_id, challenge_hash, expires_at, used_at, created_at
      ) VALUES (?, ?, ?, ?, ?, NULL, ?)
    `).bind(challengeId, account, verified.referralId, await sha256Hex(challenge), expiresAt, time)
  ]);
  return freeze({ ok: true, status: 'bind_challenge_ready', challengeId, challenge, canonical, expiresAt, referralId: verified.referralId });
}

export async function bindReferralIdentity({ database, accountId = '', token = '', challengeId = '', challenge = '', signature = '', timestamp = Date.now() } = {}) {
  const account = cleanText(accountId, 80);
  if (!account) return freeze({ ok: false, status: 'login_required' });
  await ensureReferralSchema(database);
  const verified = await verifyReferralToken(token);
  if (!verified.ok) return verified;
  const safeChallengeId = cleanText(challengeId, 96);
  const safeChallenge = cleanText(challenge, 128);
  const safeSignature = cleanText(signature, 256);
  if (!safeChallengeId || !safeChallenge || !safeSignature) return freeze({ ok: false, status: 'bind_proof_required' });
  const time = nowMs(timestamp);
  const proof = await database.prepare(`
    SELECT challenge_id, account_id, referral_id, challenge_hash, expires_at, used_at
    FROM eon_referral_bind_challenges
    WHERE challenge_id = ?
    LIMIT 1
  `).bind(safeChallengeId).first();
  if (!proof) return freeze({ ok: false, status: 'bind_challenge_not_found' });
  if (cleanText(proof.account_id, 80) !== account || cleanText(proof.referral_id, 96) !== verified.referralId) return freeze({ ok: false, status: 'bind_challenge_mismatch' });
  if (Number(proof.used_at || 0) > 0) return freeze({ ok: false, status: 'bind_challenge_already_used' });
  if (Number(proof.expires_at || 0) < time) return freeze({ ok: false, status: 'bind_challenge_expired' });
  if (cleanText(proof.challenge_hash, 96) !== await sha256Hex(safeChallenge)) return freeze({ ok: false, status: 'bind_challenge_invalid' });
  const canonical = `eon-referral-bind-v1:${safeChallengeId}:${safeChallenge}`;
  if (!await verifySharePayload(canonical, safeSignature, verified.issuerKey)) return freeze({ ok: false, status: 'bind_signature_invalid' });
  const byReferral = await database.prepare('SELECT referral_id, account_id, status FROM eon_referral_identities WHERE referral_id = ? LIMIT 1').bind(verified.referralId).first();
  if (byReferral && cleanText(byReferral.account_id, 80) !== account) return freeze({ ok: false, status: 'identity_already_bound_to_another_account' });
  if (!byReferral) {
    const count = await database.prepare('SELECT COUNT(*) AS total FROM eon_referral_identities WHERE account_id = ? AND status = ?').bind(account, 'active').first();
    if (Number(count?.total || 0) >= EON_REFERRAL_IDENTITIES_PER_ACCOUNT_CAP) return freeze({ ok: false, status: 'account_referral_identity_cap_reached' });
  }
  await database.batch([
    database.prepare(`
      UPDATE eon_referral_bind_challenges SET used_at = ?
      WHERE challenge_id = ? AND used_at IS NULL
    `).bind(time, safeChallengeId),
    database.prepare(`
      INSERT INTO eon_referral_identities (referral_id, account_id, public_key_hash, status, bound_at, updated_at)
      VALUES (?, ?, ?, 'active', ?, ?)
      ON CONFLICT(referral_id) DO UPDATE SET
        public_key_hash = excluded.public_key_hash,
        status = 'active',
        updated_at = excluded.updated_at
    `).bind(verified.referralId, account, verified.publicKeyHash, time, time)
  ]);
  return freeze({ ok: true, status: byReferral ? 'identity_already_registered' : 'identity_registered', referralId: verified.referralId, proofOfPossession: true });
}

export async function enrollReferral({ database, inviteeAccountId = '', token = '', timestamp = Date.now() } = {}) {
  const invitee = cleanText(inviteeAccountId, 80);
  if (!invitee) return freeze({ ok: false, status: 'login_required' });
  await ensureReferralSchema(database);
  const verified = await verifyReferralToken(token);
  if (!verified.ok) return verified;
  const inviterIdentity = await database.prepare(`
    SELECT referral_id, account_id, status
    FROM eon_referral_identities
    WHERE referral_id = ?
    LIMIT 1
  `).bind(verified.referralId).first();
  const inviter = cleanText(inviterIdentity?.account_id, 80);
  if (!inviter || inviterIdentity?.status !== 'active') return freeze({ ok: false, status: 'inviter_identity_not_registered' });
  if (inviter === invitee) return freeze({ ok: false, status: 'self_referral_rejected' });
  const existing = await database.prepare(`
    SELECT invitee_account_id, inviter_account_id, inviter_referral_id, status
    FROM eon_invite_accounts
    WHERE invitee_account_id = ?
    LIMIT 1
  `).bind(invitee).first();
  if (existing) {
    const same = cleanText(existing.inviter_account_id, 80) === inviter && cleanText(existing.inviter_referral_id, 96) === verified.referralId;
    return freeze({ ok: same, status: same ? 'already_enrolled' : 'invitee_already_enrolled_to_another_inviter' });
  }
  const time = nowMs(timestamp);
  await database.prepare(`
    INSERT INTO eon_invite_accounts (
      invitee_account_id, inviter_account_id, inviter_referral_id, source_share_id,
      source_token_hash, status, program_version, enrolled_at, activated_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'enrolled', ?, ?, NULL, ?)
  `).bind(invitee, inviter, verified.referralId, verified.shareId, verified.tokenHash, EON_REFERRAL_PROGRAM_VERSION, time, time).run();
  return freeze({
    ok: true,
    status: 'enrolled',
    rewardCreated: false,
    message: 'Invite accepted. A verified Google account sign-in can now qualify this one-level referral for one Signal EONKEY, subject to anti-abuse checks and the monthly cap.'
  });
}

async function countGrants(database, accountId, keyTypes, startAt) {
  const placeholders = keyTypes.map(() => '?').join(',');
  const row = await database.prepare(`
    SELECT COUNT(*) AS total
    FROM eon_key_grants
    WHERE account_id = ?
      AND key_type IN (${placeholders})
      AND status IN ('available', 'consumed')
      AND issued_at >= ?
  `).bind(accountId, ...keyTypes, startAt).first();
  return Number(row?.total || 0);
}

async function createKeyGrant(database, { accountId, keyType, reason, sourceEventId, timestamp }) {
  const grantId = await stableId('key', accountId, keyType, sourceEventId);
  await database.prepare(`
    INSERT OR IGNORE INTO eon_key_grants (
      grant_id, account_id, key_type, grant_reason, source_referral_event_id,
      status, issued_at, expires_at, revoked_at
    ) VALUES (?, ?, ?, ?, ?, 'available', ?, NULL, NULL)
  `).bind(grantId, accountId, keyType, reason, sourceEventId, timestamp).run();
  await appendGrantJournal(database, { grantId, accountId, fromStatus: 'pending', toStatus: 'vested', reasonCode: reason || 'qualified-referral', sourceEventId, timestamp });
  await appendGrantJournal(database, { grantId, accountId, fromStatus: 'vested', toStatus: 'available', reasonCode: 'grant_available', sourceEventId, timestamp });
  return grantId;
}

async function createDigitalReward(database, { accountId, rewardCode, sourceEventId, timestamp }) {
  const rewardId = await stableId('reward', accountId, rewardCode, sourceEventId);
  await database.prepare(`
    INSERT OR IGNORE INTO eon_digital_rewards (
      reward_id, account_id, reward_code, source_event_id, status, issued_at, revoked_at, updated_at
    ) VALUES (?, ?, ?, ?, 'available', ?, NULL, ?)
  `).bind(rewardId, accountId, rewardCode, sourceEventId, timestamp, timestamp).run();
  return rewardId;
}

async function appendGrantJournal(database, { grantId = '', accountId = '', fromStatus = '', toStatus = '', reasonCode = '', sourceEventId = '', timestamp = Date.now() } = {}) {
  const safeGrantId = cleanText(grantId, 96);
  const safeAccount = cleanText(accountId, 80);
  const next = cleanText(toStatus, 24).toLowerCase();
  if (!safeGrantId || !safeAccount || !next) return '';
  const time = nowMs(timestamp);
  const journalId = await stableId('grant_journal', safeGrantId, cleanText(fromStatus, 24), next, cleanText(reasonCode, 80), cleanText(sourceEventId, 96));
  await database.prepare(`
    INSERT OR IGNORE INTO eon_key_grant_journal (
      journal_id, grant_id, account_id, from_status, to_status, reason_code, source_event_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(journalId, safeGrantId, safeAccount, cleanText(fromStatus, 24), next, cleanText(reasonCode, 80) || 'policy-transition', cleanText(sourceEventId, 96), time).run();
  return journalId;
}

export async function beginReferralMilestoneChallenge({ database, inviteeAccountId = '', milestone = '', timestamp = Date.now() } = {}) {
  const invitee = cleanText(inviteeAccountId, 80);
  const normalizedMilestone = cleanText(milestone, 64).toLowerCase();
  if (!invitee) return freeze({ ok: false, status: 'login_required' });
  if (!EON_REFERRAL_SERVER_CHALLENGE_MILESTONES.includes(normalizedMilestone)) return freeze({ ok: false, status: 'server_challenge_milestone_not_supported' });
  await ensureReferralSchema(database);
  const association = await database.prepare(`
    SELECT inviter_account_id, status, activated_at
    FROM eon_invite_accounts
    WHERE invitee_account_id = ?
    LIMIT 1
  `).bind(invitee).first();
  if (!cleanText(association?.inviter_account_id, 80)) return freeze({ ok: false, status: 'no_enrolled_invite' });
  const activationEventId = await stableId('invite_activation', invitee);
  const existing = await database.prepare('SELECT status FROM eon_invite_events WHERE event_id = ? LIMIT 1').bind(activationEventId).first();
  if (existing) return freeze({ ok: true, status: cleanText(existing.status, 48) || 'already_processed', duplicate: true, alreadyQualified: true });
  const time = nowMs(timestamp);
  await database.prepare(`
    UPDATE eon_referral_milestone_challenges
    SET status = 'expired', result_status = 'expired', updated_at = ?
    WHERE invitee_account_id = ? AND milestone = ? AND status IN ('ready', 'processing') AND expires_at < ?
  `).bind(time, invitee, normalizedMilestone, time).run();
  const challenge = randomHex(24);
  const challengeHash = await sha256Hex(challenge);
  const challengeId = await stableId('milestone_challenge', invitee, normalizedMilestone, challenge, time);
  const notBefore = time + EON_REFERRAL_MILESTONE_MIN_DWELL_MS;
  const expiresAt = time + EON_REFERRAL_MILESTONE_CHALLENGE_TTL_MS;
  await database.prepare(`
    INSERT INTO eon_referral_milestone_challenges (
      challenge_id, invitee_account_id, milestone, challenge_hash, status,
      required_steps_version, started_at, not_before, expires_at, completed_at,
      receipt_id, result_status, updated_at
    ) VALUES (?, ?, ?, ?, 'ready', 1, ?, ?, ?, NULL, NULL, NULL, ?)
  `).bind(challengeId, invitee, normalizedMilestone, challengeHash, time, notBefore, expiresAt, time).run();
  return freeze({
    ok: true,
    status: 'milestone_challenge_ready',
    challengeId,
    challenge,
    milestone: normalizedMilestone,
    notBefore,
    expiresAt,
    requiredSteps: EON_REFERRAL_CITY_ORIENTATION_STEPS
  });
}

export async function recordReferralMilestoneStep({ database, inviteeAccountId = '', milestone = '', challengeId = '', challenge = '', step = '', timestamp = Date.now() } = {}) {
  const invitee = cleanText(inviteeAccountId, 80);
  const normalizedMilestone = cleanText(milestone, 64).toLowerCase();
  const safeChallengeId = cleanText(challengeId, 96);
  const safeChallenge = cleanText(challenge, 160);
  const normalizedStep = cleanText(step, 64).toLowerCase();
  if (!invitee) return freeze({ ok: false, status: 'login_required' });
  if (!EON_REFERRAL_SERVER_CHALLENGE_MILESTONES.includes(normalizedMilestone)) return freeze({ ok: false, status: 'server_challenge_milestone_not_supported' });
  if (!safeChallengeId || !safeChallenge) return freeze({ ok: false, status: 'milestone_challenge_required' });
  const stepIndex = EON_REFERRAL_CITY_ORIENTATION_STEPS.indexOf(normalizedStep);
  if (stepIndex < 0) return freeze({ ok: false, status: 'milestone_step_not_supported' });
  await ensureReferralSchema(database);
  const row = await database.prepare(`
    SELECT challenge_id, invitee_account_id, milestone, challenge_hash, status,
      started_at, not_before, expires_at, completed_at
    FROM eon_referral_milestone_challenges
    WHERE challenge_id = ?
    LIMIT 1
  `).bind(safeChallengeId).first();
  if (!row) return freeze({ ok: false, status: 'milestone_challenge_not_found' });
  if (cleanText(row.invitee_account_id, 80) !== invitee || cleanText(row.milestone, 64) !== normalizedMilestone) return freeze({ ok: false, status: 'milestone_challenge_mismatch' });
  const time = nowMs(timestamp);
  if (row.status === 'completed') return freeze({ ok: true, status: 'milestone_already_completed', duplicate: true, step: normalizedStep });
  if (row.status !== 'ready') return freeze({ ok: false, status: `milestone_challenge_${cleanText(row.status, 32) || 'unavailable'}` });
  if (time > Number(row.expires_at || 0)) {
    await database.prepare("UPDATE eon_referral_milestone_challenges SET status = 'expired', result_status = 'expired', updated_at = ? WHERE challenge_id = ? AND status = 'ready'").bind(time, safeChallengeId).run();
    return freeze({ ok: false, status: 'milestone_challenge_expired' });
  }
  if (await sha256Hex(safeChallenge) !== cleanText(row.challenge_hash, 96)) return freeze({ ok: false, status: 'milestone_challenge_invalid' });
  const minOffset = Number(EON_REFERRAL_CITY_ORIENTATION_STEP_MIN_OFFSETS_MS[normalizedStep] || 0);
  const earliest = Number(row.started_at || 0) + minOffset;
  if (time < earliest) return freeze({ ok: false, status: 'milestone_step_too_early', retryAfterMs: Math.max(0, earliest - time), step: normalizedStep });
  const existing = await database.prepare('SELECT recorded_at FROM eon_referral_milestone_steps WHERE challenge_id = ? AND step = ? LIMIT 1').bind(safeChallengeId, normalizedStep).first();
  if (existing) return freeze({ ok: true, status: 'milestone_step_already_recorded', duplicate: true, step: normalizedStep, recordedAt: Number(existing.recorded_at || 0) });
  if (stepIndex > 0) {
    const previousStep = EON_REFERRAL_CITY_ORIENTATION_STEPS[stepIndex - 1];
    const previous = await database.prepare('SELECT recorded_at FROM eon_referral_milestone_steps WHERE challenge_id = ? AND step = ? LIMIT 1').bind(safeChallengeId, previousStep).first();
    if (!previous) return freeze({ ok: false, status: 'milestone_step_out_of_order', requiredPreviousStep: previousStep });
  }
  const inserted = await database.prepare(`
    INSERT OR IGNORE INTO eon_referral_milestone_steps (
      challenge_id, invitee_account_id, milestone, step, step_index, recorded_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).bind(safeChallengeId, invitee, normalizedMilestone, normalizedStep, stepIndex + 1, time).run();
  if (changedRows(inserted) !== 1) return freeze({ ok: false, status: 'milestone_step_record_failed', retryable: true });
  return freeze({ ok: true, status: 'milestone_step_recorded', serverRecorded: true, step: normalizedStep, stepIndex: stepIndex + 1, recordedAt: time });
}

export async function completeReferralMilestoneChallenge({ database, inviteeAccountId = '', milestone = '', challengeId = '', challenge = '', timestamp = Date.now() } = {}) {
  const invitee = cleanText(inviteeAccountId, 80);
  const normalizedMilestone = cleanText(milestone, 64).toLowerCase();
  const safeChallengeId = cleanText(challengeId, 96);
  const safeChallenge = cleanText(challenge, 160);
  if (!invitee) return freeze({ ok: false, status: 'login_required' });
  if (!EON_REFERRAL_SERVER_CHALLENGE_MILESTONES.includes(normalizedMilestone)) return freeze({ ok: false, status: 'server_challenge_milestone_not_supported' });
  if (!safeChallengeId || !safeChallenge) return freeze({ ok: false, status: 'milestone_challenge_required' });
  await ensureReferralSchema(database);
  const row = await database.prepare(`
    SELECT challenge_id, invitee_account_id, milestone, challenge_hash, status,
      not_before, expires_at, completed_at, receipt_id, result_status
    FROM eon_referral_milestone_challenges
    WHERE challenge_id = ?
    LIMIT 1
  `).bind(safeChallengeId).first();
  if (!row) return freeze({ ok: false, status: 'milestone_challenge_not_found' });
  if (cleanText(row.invitee_account_id, 80) !== invitee || cleanText(row.milestone, 64) !== normalizedMilestone) return freeze({ ok: false, status: 'milestone_challenge_mismatch' });
  const time = nowMs(timestamp);
  if (row.status === 'completed' && row.receipt_id) {
    const replay = await qualifyReferralActivation({ database, inviteeAccountId: invitee, milestone: normalizedMilestone, sourceReceiptId: cleanText(row.receipt_id, 96), timestamp: time });
    return freeze({ ...replay, duplicate: true, challengeStatus: 'completed', receiptId: cleanText(row.receipt_id, 96) });
  }
  if (row.status === 'processing') return freeze({ ok: false, status: 'milestone_challenge_processing', retryable: true });
  if (row.status !== 'ready') return freeze({ ok: false, status: `milestone_challenge_${cleanText(row.status, 32) || 'unavailable'}` });
  if (time < Number(row.not_before || 0)) return freeze({ ok: false, status: 'milestone_challenge_too_early', retryAfterMs: Math.max(0, Number(row.not_before || 0) - time) });
  if (time > Number(row.expires_at || 0)) {
    await database.prepare("UPDATE eon_referral_milestone_challenges SET status = 'expired', result_status = 'expired', updated_at = ? WHERE challenge_id = ? AND status = 'ready'").bind(time, safeChallengeId).run();
    return freeze({ ok: false, status: 'milestone_challenge_expired' });
  }
  if (await sha256Hex(safeChallenge) !== cleanText(row.challenge_hash, 96)) return freeze({ ok: false, status: 'milestone_challenge_invalid' });
  const recordedStepRows = await queryRows(database.prepare(`
    SELECT step, step_index, recorded_at
    FROM eon_referral_milestone_steps
    WHERE challenge_id = ? AND invitee_account_id = ? AND milestone = ?
    ORDER BY step_index ASC
  `).bind(safeChallengeId, invitee, normalizedMilestone));
  const recordedSteps = new Set(recordedStepRows.map((item) => cleanText(item?.step, 64).toLowerCase()).filter(Boolean));
  const missingSteps = EON_REFERRAL_CITY_ORIENTATION_STEPS.filter((step) => !recordedSteps.has(step));
  if (missingSteps.length) return freeze({ ok: false, status: 'milestone_steps_incomplete', missingSteps: freeze(missingSteps), serverRecordedSteps: freeze([...recordedSteps]) });
  const locked = await database.prepare(`
    UPDATE eon_referral_milestone_challenges
    SET status = 'processing', updated_at = ?
    WHERE challenge_id = ? AND invitee_account_id = ? AND status = 'ready'
  `).bind(time, safeChallengeId, invitee).run();
  if (changedRows(locked) !== 1) return freeze({ ok: false, status: 'milestone_challenge_replay_blocked', retryable: true });
  try {
    const sourceEventId = cleanText(`city_orientation:${safeChallengeId}`, 96);
    const receipt = await recordReferralQualificationReceipt({
      database,
      inviteeAccountId: invitee,
      milestone: normalizedMilestone,
      sourceEventId,
      issuer: 'eonapp-first-party',
      timestamp: time
    });
    if (!receipt.ok) throw new Error(receipt.status || 'qualification_receipt_failed');
    const qualification = await qualifyReferralActivation({
      database,
      inviteeAccountId: invitee,
      milestone: normalizedMilestone,
      sourceReceiptId: receipt.receiptId,
      timestamp: time
    });
    await database.prepare(`
      UPDATE eon_referral_milestone_challenges
      SET status = 'completed', completed_at = ?, receipt_id = ?, result_status = ?, updated_at = ?
      WHERE challenge_id = ? AND status = 'processing'
    `).bind(time, receipt.receiptId, cleanText(qualification.status, 80), time, safeChallengeId).run();
    return freeze({ ...qualification, receiptId: receipt.receiptId, challengeStatus: 'completed', serverIssuedReceipt: true });
  } catch (error) {
    await database.prepare(`
      UPDATE eon_referral_milestone_challenges
      SET status = 'ready', result_status = 'retryable-server-error', updated_at = ?
      WHERE challenge_id = ? AND status = 'processing'
    `).bind(time, safeChallengeId).run();
    throw error;
  }
}

export async function recordReferralQualificationReceipt({ database, inviteeAccountId = '', milestone = '', sourceEventId = '', issuer = 'eonapp-first-party', timestamp = Date.now() } = {}) {
  const invitee = cleanText(inviteeAccountId, 80);
  const normalizedMilestone = cleanText(milestone, 64).toLowerCase();
  const source = cleanText(sourceEventId, 96);
  const safeIssuer = cleanText(issuer, 48);
  if (!invitee || !source) return freeze({ ok: false, status: 'qualification_receipt_identity_missing' });
  if (!EON_REFERRAL_ALLOWED_ACTIVATION_MILESTONES.includes(normalizedMilestone)) return freeze({ ok: false, status: 'activation_milestone_not_allowed' });
  if (!['eonapp-first-party', 'eonapp-google-session', 'owner-proof-fixture'].includes(safeIssuer)) return freeze({ ok: false, status: 'qualification_receipt_issuer_rejected' });
  await ensureReferralSchema(database);
  const time = nowMs(timestamp);
  const receiptId = await stableId('qualification_receipt', invitee, normalizedMilestone, source);
  await database.prepare(`
    INSERT OR IGNORE INTO eon_referral_milestone_receipts (
      receipt_id, invitee_account_id, milestone, source_event_id, issuer, status, issued_at, consumed_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'ready', ?, NULL, ?)
  `).bind(receiptId, invitee, normalizedMilestone, source, safeIssuer, time, time).run();
  return freeze({ ok: true, status: 'qualification_receipt_ready', receiptId, milestone: normalizedMilestone, sourceEventId: source });
}

/**
 * W659G — qualifies a signed invite from a server-verified Google identity session.
 *
 * The browser supplies only the signed invite envelope. The account identifier
 * comes from the opaque EONAPP session created by the Google OAuth callback.
 * The stable source event makes the grant one-time and replay safe. Existing
 * one-level, self-referral, identity-binding, cap, journal and reversal rules
 * remain authoritative.
 */
export async function qualifyReferralGoogleSignIn({ database, inviteeAccountId = '', token = '', timestamp = Date.now() } = {}) {
  const invitee = cleanText(inviteeAccountId, 80);
  if (!invitee) return freeze({ ok: false, status: 'login_required' });
  const enrolled = await enrollReferral({ database, inviteeAccountId: invitee, token, timestamp });
  if (!enrolled.ok) return freeze({ ...enrolled, googleIdentityVerifiedBySession: true });
  const sourceEventId = `google-account-connected:${invitee}`;
  const receipt = await recordReferralQualificationReceipt({
    database,
    inviteeAccountId: invitee,
    milestone: 'google_account_connected',
    sourceEventId,
    issuer: 'eonapp-google-session',
    timestamp
  });
  if (!receipt.ok) return freeze({ ...receipt, googleIdentityVerifiedBySession: true });
  const qualified = await qualifyReferralActivation({
    database,
    inviteeAccountId: invitee,
    milestone: 'google_account_connected',
    sourceReceiptId: receipt.receiptId,
    timestamp
  });
  const deterministicReplay = qualified.status === 'server_milestone_receipt_already_consumed';
  return freeze({
    ...qualified,
    ok: deterministicReplay ? true : qualified.ok,
    status: deterministicReplay ? 'google_referral_already_qualified' : qualified.status,
    duplicate: deterministicReplay || qualified.duplicate === true,
    enrollmentStatus: enrolled.status,
    receiptId: receipt.receiptId,
    milestone: 'google_account_connected',
    googleIdentityVerifiedBySession: true,
    browserGranted: false
  });
}

export async function qualifyReferralActivation({ database, inviteeAccountId = '', milestone = '', sourceReceiptId = '', timestamp = Date.now() } = {}) {
  const invitee = cleanText(inviteeAccountId, 80);
  const normalizedMilestone = cleanText(milestone, 64).toLowerCase();
  if (!invitee) return freeze({ ok: false, status: 'login_required' });
  if (!EON_REFERRAL_ALLOWED_ACTIVATION_MILESTONES.includes(normalizedMilestone)) return freeze({ ok: false, status: 'activation_milestone_not_allowed' });
  await ensureReferralSchema(database);
  const safeReceiptId = cleanText(sourceReceiptId, 96);
  if (!safeReceiptId) return freeze({ ok: false, status: 'server_milestone_receipt_required' });
  const qualificationReceipt = await database.prepare(`
    SELECT receipt_id, invitee_account_id, milestone, source_event_id, issuer, status, issued_at, consumed_at
    FROM eon_referral_milestone_receipts
    WHERE receipt_id = ?
    LIMIT 1
  `).bind(safeReceiptId).first();
  if (!qualificationReceipt) return freeze({ ok: false, status: 'server_milestone_receipt_not_found' });
  if (cleanText(qualificationReceipt.invitee_account_id, 80) !== invitee || cleanText(qualificationReceipt.milestone, 64) !== normalizedMilestone) return freeze({ ok: false, status: 'server_milestone_receipt_mismatch' });
  const association = await database.prepare(`
    SELECT invitee_account_id, inviter_account_id, status, activated_at
    FROM eon_invite_accounts
    WHERE invitee_account_id = ?
    LIMIT 1
  `).bind(invitee).first();
  const inviter = cleanText(association?.inviter_account_id, 80);
  if (!inviter) return freeze({ ok: false, status: 'no_enrolled_invite' });
  const eventId = await stableId('invite_activation', invitee);
  if (qualificationReceipt.status !== 'ready' || Number(qualificationReceipt.consumed_at || 0) > 0) return freeze({ ok: false, status: 'server_milestone_receipt_already_consumed' });
  const existing = await database.prepare('SELECT event_id, status FROM eon_invite_events WHERE event_id = ? LIMIT 1').bind(eventId).first();
  if (existing) return freeze({ ok: true, status: cleanText(existing.status, 48) || 'already_processed', duplicate: true });
  const time = nowMs(timestamp);
  const signalCount = await countGrants(database, inviter, ['signal'], monthStartUtc(time));
  const capped = signalCount >= EON_REFERRAL_FREE_SIGNAL_MONTHLY_CAP;
  await database.prepare(`
    INSERT INTO eon_invite_events (
      event_id, inviter_account_id, invitee_account_id, event_type, source_event_id,
      status, available_at, reason, created_at, updated_at
    ) VALUES (?, ?, ?, 'activated_free_invite', ?, ?, ?, ?, ?, ?)
  `).bind(
    eventId,
    inviter,
    invitee,
    cleanText(qualificationReceipt.source_event_id, 96),
    capped ? 'cap_reached' : 'granted',
    time,
    capped ? 'monthly_signal_cap_reached' : normalizedMilestone,
    time,
    time
  ).run();
  await database.prepare(`
    UPDATE eon_invite_accounts
    SET status = 'activated', activated_at = COALESCE(activated_at, ?), updated_at = ?
    WHERE invitee_account_id = ?
  `).bind(time, time, invitee).run();
  await database.prepare(`
    UPDATE eon_referral_milestone_receipts
    SET status = 'consumed', consumed_at = ?, updated_at = ?
    WHERE receipt_id = ? AND status = 'ready' AND consumed_at IS NULL
  `).bind(time, time, safeReceiptId).run();
  if (!capped) await createKeyGrant(database, { accountId: inviter, keyType: 'signal', reason: 'activated_free_invite', sourceEventId: eventId, timestamp: time });
  await createDigitalReward(database, { accountId: invitee, rewardCode: 'welcome-vault-reveal', sourceEventId: eventId, timestamp: time });
  if (!capped) await createDigitalReward(database, { accountId: inviter, rewardCode: 'signal-vault-relic', sourceEventId: `${eventId}:inviter`, timestamp: time });
  return freeze({
    ok: true,
    status: capped ? 'activation_recorded_signal_cap_reached' : 'signal_key_granted',
    keyType: capped ? '' : 'signal',
    inviterRewardCreated: !capped,
    inviteeDigitalRewardCreated: true,
    cashCreated: false,
    subscriptionCreated: false
  });
}

function isPositivePaidEvent(event = {}) {
  return ['payment.succeeded', 'subscription.renewed'].includes(cleanText(event.rawEventType, 80).toLowerCase());
}

function isReversalEvent(event = {}) {
  return [
    'refund.succeeded',
    'subscription.cancelled',
    'subscription.expired',
    'subscription.failed',
    'dispute.opened',
    'dispute.lost',
    'dispute.expired',
    'dispute.accepted',
    'entitlement_grant.revoked'
  ].includes(cleanText(event.rawEventType, 80).toLowerCase());
}

async function reverseReferralEvent(database, eventId, reason, timestamp) {
  const grants = await queryRows(database.prepare(`
    SELECT grant_id FROM eon_key_grants
    WHERE source_referral_event_id = ? AND status IN ('available', 'consumed')
  `).bind(eventId));
  const statements = [
    database.prepare(`
      UPDATE eon_invite_events
      SET status = 'reversed', reason = ?, updated_at = ?
      WHERE event_id = ? AND status IN ('pending', 'granted', 'cap_reached')
    `).bind(reason, timestamp, eventId),
    database.prepare(`
      UPDATE eon_key_grants
      SET status = 'revoked', revoked_at = ?
      WHERE source_referral_event_id = ? AND status IN ('available', 'consumed')
    `).bind(timestamp, eventId),
    database.prepare(`
      UPDATE eon_digital_rewards
      SET status = 'revoked', revoked_at = ?, updated_at = ?
      WHERE source_event_id = ? AND status = 'available'
    `).bind(timestamp, timestamp, `${eventId}:inviter`)
  ];
  for (const grant of grants) {
    const safeGrantId = cleanText(grant.grant_id, 96);
    const grantRow = await database.prepare('SELECT account_id, status FROM eon_key_grants WHERE grant_id = ? LIMIT 1').bind(safeGrantId).first();
    await appendGrantJournal(database, { grantId: safeGrantId, accountId: cleanText(grantRow?.account_id, 80), fromStatus: cleanText(grantRow?.status, 24), toStatus: 'revoked', reasonCode: reason, sourceEventId: eventId, timestamp });
    statements.push(database.prepare(`
      UPDATE eon_key_unlocks
      SET status = 'revoked', revoked_at = ?, updated_at = ?
      WHERE source_grant_id = ? AND status = 'active'
    `).bind(timestamp, timestamp, cleanText(grant.grant_id, 96)));
  }
  await database.batch(statements);
}

export async function applyReferralBillingSignal(database, event = {}) {
  if (!database?.prepare || !cleanText(event.accountId, 80)) return freeze({ ok: true, status: 'no_referral_action' });
  await ensureReferralSchema(database);
  const invitee = cleanText(event.accountId, 80);
  const association = await database.prepare(`
    SELECT invitee_account_id, inviter_account_id, status
    FROM eon_invite_accounts
    WHERE invitee_account_id = ?
    LIMIT 1
  `).bind(invitee).first();
  const inviter = cleanText(association?.inviter_account_id, 80);
  if (!inviter) return freeze({ ok: true, status: 'no_referral_association' });
  const referralEventId = await stableId('paid_referral', invitee);
  const time = nowMs(event.occurredAt || Date.now());
  if (isReversalEvent(event)) {
    await database.prepare(`
      INSERT INTO eon_referral_billing_state (
        account_id, tier_id, status, source_event_id, provider_subscription_ref,
        paid_since, revoked_at, reason, updated_at
      ) VALUES (?, 'free', 'revoked', ?, ?, NULL, ?, ?, ?)
      ON CONFLICT(account_id) DO UPDATE SET
        tier_id = 'free', status = 'revoked', source_event_id = excluded.source_event_id,
        provider_subscription_ref = COALESCE(excluded.provider_subscription_ref, eon_referral_billing_state.provider_subscription_ref),
        revoked_at = excluded.revoked_at, reason = excluded.reason, updated_at = excluded.updated_at
    `).bind(invitee, cleanText(event.providerEventId, 160), cleanText(event.providerSubscriptionRef, 128), time, cleanText(event.rawEventType || event.eventType, 80), time).run();
    await reverseReferralEvent(database, referralEventId, cleanText(event.rawEventType || event.eventType, 80), time);
    return freeze({ ok: true, status: 'paid_referral_reversed' });
  }
  if (!isPositivePaidEvent(event)) return freeze({ ok: true, status: 'billing_event_not_qualifying' });
  await database.prepare(`
    INSERT INTO eon_referral_billing_state (
      account_id, tier_id, status, source_event_id, provider_subscription_ref,
      paid_since, revoked_at, reason, updated_at
    ) VALUES (?, ?, 'active', ?, ?, ?, NULL, NULL, ?)
    ON CONFLICT(account_id) DO UPDATE SET
      tier_id = excluded.tier_id, status = 'active', source_event_id = excluded.source_event_id,
      provider_subscription_ref = COALESCE(excluded.provider_subscription_ref, eon_referral_billing_state.provider_subscription_ref),
      paid_since = COALESCE(eon_referral_billing_state.paid_since, excluded.paid_since),
      revoked_at = NULL, reason = NULL, updated_at = excluded.updated_at
  `).bind(invitee, cleanText(event.tierId, 24) || 'free', cleanText(event.providerEventId, 160), cleanText(event.providerSubscriptionRef, 128), time, time).run();
  const availableAt = time + (EON_REFERRAL_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await database.prepare(`
    INSERT OR IGNORE INTO eon_invite_events (
      event_id, inviter_account_id, invitee_account_id, event_type, source_event_id,
      status, available_at, reason, created_at, updated_at
    ) VALUES (?, ?, ?, 'retained_paid_referral', ?, 'pending', ?, 'awaiting_14_day_retention', ?, ?)
  `).bind(referralEventId, inviter, invitee, cleanText(event.providerEventId, 160), availableAt, time, time).run();
  return freeze({ ok: true, status: 'paid_referral_pending', availableAt });
}

export function selectPaidReferralKeyType(previousPaidGrantCount = 0) {
  return Number(previousPaidGrantCount || 0) >= 2 ? 'power' : 'builder';
}

export async function reconcileReferralRewards({ database, accountId = '', timestamp = Date.now() } = {}) {
  const inviter = cleanText(accountId, 80);
  if (!inviter) return freeze({ ok: false, status: 'login_required', processed: 0, granted: 0 });
  await ensureReferralSchema(database);
  const time = nowMs(timestamp);
  const rows = await queryRows(database.prepare(`
    SELECT event_id, invitee_account_id, available_at
    FROM eon_invite_events
    WHERE inviter_account_id = ?
      AND event_type = 'retained_paid_referral'
      AND status = 'pending'
      AND available_at <= ?
    ORDER BY available_at ASC
    LIMIT 12
  `).bind(inviter, time));
  let granted = 0;
  let blocked = 0;
  for (const row of rows) {
    const eventId = cleanText(row.event_id, 96);
    const invitee = cleanText(row.invitee_account_id, 80);
    const entitlement = await database.prepare(`
      SELECT status, tier_id, paid_since, updated_at
      FROM eon_referral_billing_state
      WHERE account_id = ?
      LIMIT 1
    `).bind(invitee).first();
    if (!entitlement || entitlement.status !== 'active' || cleanText(entitlement.tier_id, 24) === 'free' || Number(entitlement.paid_since || 0) <= 0) {
      await database.prepare(`
        UPDATE eon_invite_events SET status = 'blocked', reason = 'invitee_not_currently_paid', updated_at = ?
        WHERE event_id = ? AND status = 'pending'
      `).bind(time, eventId).run();
      blocked += 1;
      continue;
    }
    const paidCount = await countGrants(database, inviter, ['builder', 'power'], yearStartUtc(time));
    if (paidCount >= EON_REFERRAL_PAID_YEARLY_CAP) {
      await database.prepare(`
        UPDATE eon_invite_events SET status = 'cap_reached', reason = 'yearly_paid_referral_cap_reached', updated_at = ?
        WHERE event_id = ? AND status = 'pending'
      `).bind(time, eventId).run();
      blocked += 1;
      continue;
    }
    const keyType = selectPaidReferralKeyType(paidCount);
    await createKeyGrant(database, { accountId: inviter, keyType, reason: 'retained_paid_referral', sourceEventId: eventId, timestamp: time });
    await createDigitalReward(database, {
      accountId: inviter,
      rewardCode: keyType === 'power' ? 'builder-circle-relic' : 'builder-vault-relic',
      sourceEventId: `${eventId}:inviter`,
      timestamp: time
    });
    await database.prepare(`
      UPDATE eon_invite_events SET status = 'granted', reason = ?, updated_at = ?
      WHERE event_id = ? AND status = 'pending'
    `).bind(`${keyType}_key_after_retention`, time, eventId).run();
    granted += 1;
  }
  return freeze({ ok: true, status: 'reconciled', processed: rows.length, granted, blocked });
}

function unlockExpiryTimestamp(unlock = {}, timestamp = Date.now()) {
  const time = nowMs(timestamp);
  if (Number(unlock.durationMinutes || 0) > 0) return time + (Number(unlock.durationMinutes) * 60 * 1000);
  if (Number(unlock.durationDays || 0) > 0) return time + (Number(unlock.durationDays) * 24 * 60 * 60 * 1000);
  return null;
}

export async function issueSponsorEonKey({ database, accountId = '', sourceEventId = '', reason = 'verified_rewarded_sponsor_completion', timestamp = Date.now() } = {}) {
  const account = cleanText(accountId, 80);
  const source = cleanText(sourceEventId, 96);
  if (!account || !source) return freeze({ ok: false, status: 'sponsor_grant_subject_required' });
  await ensureReferralSchema(database);
  const time = nowMs(timestamp);
  const grantId = await createKeyGrant(database, { accountId: account, keyType: 'sponsor', reason: cleanText(reason, 80), sourceEventId: source, timestamp: time });
  return freeze({ ok: true, status: 'sponsor_key_available', grantId, keyType: 'sponsor', issuedAt: time, cashCreated: false, subscriptionCreated: false, providerCreditCreated: false });
}

export async function redeemEonKeyBundle({ database, accountId = '', keyType = 'sponsor', unlockId = '', timestamp = Date.now() } = {}) {
  const account = cleanText(accountId, 80);
  const normalizedKeyType = cleanText(keyType, 24).toLowerCase();
  const requestedUnlock = cleanText(unlockId, 120);
  if (!account) return freeze({ ok: false, status: 'login_required' });
  if (!normalizedKeyType || !requestedUnlock) return freeze({ ok: false, status: 'key_type_and_unlock_required' });
  await ensureReferralSchema(database);
  const unlock = getEonUnlockMenu().find((item) => item.id === requestedUnlock) || null;
  if (!unlock) return freeze({ ok: false, status: 'unlock_not_found' });
  if (unlock.keyType !== normalizedKeyType) return freeze({ ok: false, status: 'key_type_does_not_match_unlock' });
  const keysRequired = Math.max(1, Math.floor(Number(unlock.keysRequired || 1)));
  const activeDuplicate = await database.prepare(`
    SELECT unlock_record_id FROM eon_key_unlocks
    WHERE account_id = ? AND unlock_catalog_id = ? AND status = 'active'
      AND (expires_at IS NULL OR expires_at > ?)
    LIMIT 1
  `).bind(account, unlock.id, nowMs(timestamp)).first();
  if (activeDuplicate) return freeze({ ok: false, status: 'unlock_already_active' });
  const grants = await queryRows(database.prepare(`
    SELECT grant_id, issued_at
    FROM eon_key_grants
    WHERE account_id = ? AND key_type = ? AND status = 'available'
    ORDER BY issued_at ASC, grant_id ASC
    LIMIT ?
  `).bind(account, normalizedKeyType, keysRequired));
  if (grants.length < keysRequired) return freeze({ ok: false, status: 'insufficient_keys', keysRequired, availableKeys: grants.length, missingKeys: keysRequired - grants.length });
  const time = nowMs(timestamp);
  const expiresAt = unlockExpiryTimestamp(unlock, time);
  const grantIds = grants.map((row) => cleanText(row.grant_id, 96)).filter(Boolean);
  const unlockRecordId = await stableId('unlock_bundle', account, unlock.id, ...grantIds);
  const primaryGrantId = grantIds[0];
  const statements = [
    database.prepare(`
      INSERT INTO eon_key_unlocks (
        unlock_record_id, account_id, unlock_catalog_id, feature_group, source_grant_id,
        status, issued_at, expires_at, revoked_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, NULL, ?)
    `).bind(unlockRecordId, account, unlock.id, cleanText(unlock.featureGroup, 120), primaryGrantId, time, expiresAt, time)
  ];
  for (const grantId of grantIds) {
    statements.push(database.prepare(`
      UPDATE eon_key_grants SET status = 'consumed'
      WHERE grant_id = ? AND account_id = ? AND key_type = ? AND status = 'available'
    `).bind(grantId, account, normalizedKeyType));
    statements.push(database.prepare(`
      INSERT INTO eon_key_unlock_sources (unlock_record_id, grant_id, account_id, key_type, consumed_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(unlockRecordId, grantId, account, normalizedKeyType, time));
  }
  await database.batch(statements);
  for (const grantId of grantIds) {
    await appendGrantJournal(database, { grantId, accountId: account, fromStatus: 'available', toStatus: 'consumed', reasonCode: `redeemed:${unlock.id}`, sourceEventId: unlockRecordId, timestamp: time });
  }
  return freeze({
    ok: true,
    status: 'unlock_active',
    unlockRecordId,
    keysConsumed: grantIds.length,
    keyType: normalizedKeyType,
    unlock: freeze({ id: unlock.id, label: unlock.label, featureGroup: unlock.featureGroup, category: unlock.category, expiresAt, permanent: false }),
    subscriptionCreated: false,
    cashCreated: false,
    providerCreditCreated: false
  });
}

export async function redeemEonKey({ database, accountId = '', grantId = '', unlockId = '', timestamp = Date.now() } = {}) {
  const account = cleanText(accountId, 80);
  const grant = cleanText(grantId, 96);
  const requestedUnlock = cleanText(unlockId, 120);
  if (!account) return freeze({ ok: false, status: 'login_required' });
  if (!grant || !requestedUnlock) return freeze({ ok: false, status: 'grant_and_unlock_required' });
  await ensureReferralSchema(database);
  const row = await database.prepare(`
    SELECT grant_id, account_id, key_type, status
    FROM eon_key_grants
    WHERE grant_id = ? AND account_id = ?
    LIMIT 1
  `).bind(grant, account).first();
  if (!row) return freeze({ ok: false, status: 'grant_not_found' });
  if (row.status !== 'available') return freeze({ ok: false, status: `grant_${cleanText(row.status, 32) || 'unavailable'}` });
  const unlock = getEonUnlockMenu().find((item) => item.id === requestedUnlock) || null;
  if (!unlock) return freeze({ ok: false, status: 'unlock_not_found' });
  if (unlock.keyType !== row.key_type) return freeze({ ok: false, status: 'key_type_does_not_match_unlock' });
  const activeDuplicate = await database.prepare(`
    SELECT unlock_record_id FROM eon_key_unlocks
    WHERE account_id = ? AND unlock_catalog_id = ? AND status = 'active'
    LIMIT 1
  `).bind(account, unlock.id).first();
  if (activeDuplicate) return freeze({ ok: false, status: 'unlock_already_active' });
  const time = nowMs(timestamp);
  const expiresAt = unlockExpiryTimestamp(unlock, time);
  const unlockRecordId = await stableId('unlock', account, grant, unlock.id);
  await database.batch([
    database.prepare(`
      INSERT INTO eon_key_unlocks (
        unlock_record_id, account_id, unlock_catalog_id, feature_group, source_grant_id,
        status, issued_at, expires_at, revoked_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, NULL, ?)
    `).bind(unlockRecordId, account, unlock.id, cleanText(unlock.featureGroup, 120), grant, time, expiresAt, time),
    database.prepare(`
      UPDATE eon_key_grants SET status = 'consumed'
      WHERE grant_id = ? AND account_id = ? AND status = 'available'
    `).bind(grant, account)
  ]);
  await appendGrantJournal(database, { grantId: grant, accountId: account, fromStatus: 'available', toStatus: 'consumed', reasonCode: `redeemed:${unlock.id}`, sourceEventId: unlockRecordId, timestamp: time });
  return freeze({
    ok: true,
    status: 'unlock_active',
    unlock: freeze({ id: unlock.id, label: unlock.label, featureGroup: unlock.featureGroup, category: unlock.category, expiresAt, permanent: unlock.permanent === true }),
    subscriptionCreated: false,
    cashCreated: false,
    providerCreditCreated: false
  });
}

export async function applyReferralSupportReversal({ database, accountId = '', grantId = '', reasonCode = 'support_reversal', timestamp = Date.now() } = {}) {
  const account = cleanText(accountId, 80);
  const grant = cleanText(grantId, 96);
  const reason = cleanText(reasonCode, 80).toLowerCase();
  if (!account || !grant) return freeze({ ok: false, status: 'support_subject_required' });
  if (!['support_reversal', 'confirmed_abuse', 'duplicate_account'].includes(reason)) return freeze({ ok: false, status: 'support_reason_not_allowed' });
  await ensureReferralSchema(database);
  const row = await database.prepare(`
    SELECT grant_id, account_id, source_referral_event_id, status
    FROM eon_key_grants
    WHERE grant_id = ? AND account_id = ?
    LIMIT 1
  `).bind(grant, account).first();
  if (!row) return freeze({ ok: false, status: 'grant_not_found' });
  if (row.status === 'revoked') return freeze({ ok: true, status: 'already_revoked', duplicate: true });
  const time = nowMs(timestamp);
  await reverseReferralEvent(database, cleanText(row.source_referral_event_id, 96), reason, time);
  const auditId = await stableId('support_audit', account, grant, reason, time);
  await database.prepare(`
    INSERT OR IGNORE INTO eon_referral_support_audit (
      audit_id, account_id, subject_type, subject_id, action, reason_code, created_at
    ) VALUES (?, ?, 'eonkey_grant', ?, 'revoke', ?, ?)
  `).bind(auditId, account, grant, reason, time).run();
  return freeze({ ok: true, status: 'support_reversal_applied', auditId, grantId: grant, reasonCode: reason });
}

async function readReferralGrowthMetrics(database, accountId) {
  const [inviteCounts, eventCounts] = await Promise.all([
    database.prepare(`
      SELECT
        COUNT(*) AS accepted_invites,
        SUM(CASE WHEN activated_at IS NOT NULL THEN 1 ELSE 0 END) AS activated_invites
      FROM eon_invite_accounts
      WHERE inviter_account_id = ?
    `).bind(accountId).first(),
    database.prepare(`
      SELECT
        SUM(CASE WHEN event_type = 'retained_paid_referral' AND status = 'pending' THEN 1 ELSE 0 END) AS paid_pending,
        SUM(CASE WHEN event_type = 'retained_paid_referral' AND status = 'granted' THEN 1 ELSE 0 END) AS paid_retained,
        SUM(CASE WHEN status IN ('reversed', 'blocked') THEN 1 ELSE 0 END) AS reversed_or_blocked
      FROM eon_invite_events
      WHERE inviter_account_id = ?
    `).bind(accountId).first()
  ]);
  return freeze({
    acceptedInvites: Number(inviteCounts?.accepted_invites || 0),
    activatedInvites: Number(inviteCounts?.activated_invites || 0),
    paidPending: Number(eventCounts?.paid_pending || 0),
    paidRetained: Number(eventCounts?.paid_retained || 0),
    reversedOrBlocked: Number(eventCounts?.reversed_or_blocked || 0),
    measurementBoundary: 'qualified-ledger-events-only-no-click-impression-or-social-post-tracking'
  });
}

async function readBalances(database, accountId) {
  const rows = await queryRows(database.prepare(`
    SELECT key_type, status, COUNT(*) AS total
    FROM eon_key_grants
    WHERE account_id = ?
    GROUP BY key_type, status
  `).bind(accountId));
  const pending = { signal: 0, builder: 0, power: 0, sponsor: 0 };
  const available = { signal: 0, builder: 0, power: 0, sponsor: 0 };
  const consumed = { signal: 0, builder: 0, power: 0, sponsor: 0 };
  const revoked = { signal: 0, builder: 0, power: 0, sponsor: 0 };
  const expired = { signal: 0, builder: 0, power: 0, sponsor: 0 };
  for (const row of rows) {
    const keyType = cleanText(row.key_type, 24);
    if (!(keyType in available)) continue;
    const status = cleanText(row.status, 24).toLowerCase();
    const bucket = status === 'available' || status === 'vested'
      ? available
      : status === 'consumed'
        ? consumed
        : status === 'pending'
          ? pending
          : status === 'expired'
            ? expired
            : revoked;
    bucket[keyType] += Number(row.total || 0);
  }
  return freeze({ pending: freeze(pending), available: freeze(available), consumed: freeze(consumed), revoked: freeze(revoked), expired: freeze(expired) });
}

export async function readAccountActiveEonKeyUnlocks({ database, accountId = '', timestamp = Date.now() } = {}) {
  const account = cleanText(accountId, 80);
  if (!database?.prepare || !account) return freeze([]);
  await ensureReferralSchema(database);
  const time = nowMs(timestamp);
  const rows = await queryRows(database.prepare(`
    SELECT unlock_record_id, unlock_catalog_id, feature_group, status, issued_at, expires_at, revoked_at
    FROM eon_key_unlocks
    WHERE account_id = ?
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at = 0 OR expires_at > ?)
      AND (revoked_at IS NULL OR revoked_at = 0)
    ORDER BY issued_at DESC
    LIMIT 120
  `).bind(account, time));
  return freeze(rows.map((row) => freeze({
    recordId: cleanText(row.unlock_record_id, 128),
    unlockId: cleanText(row.unlock_catalog_id, 120),
    featureGroup: cleanText(row.feature_group, 120),
    status: 'active',
    issuedAt: Number(row.issued_at || 0),
    expiresAt: Number(row.expires_at || 0) || null,
    revokedAt: null
  })));
}

export async function readReferralAccountStatus({ database, accountId = '', timestamp = Date.now() } = {}) {
  const account = cleanText(accountId, 80);
  if (!account) return freeze({ ok: true, signedIn: false, account: null });
  await ensureReferralSchema(database);
  const reconciliation = await reconcileReferralRewards({ database, accountId: account, timestamp });
  const [identity, association, grants, unlocks, rewards, pendingRows] = await Promise.all([
    database.prepare('SELECT referral_id, status, bound_at FROM eon_referral_identities WHERE account_id = ? ORDER BY bound_at DESC LIMIT 1').bind(account).first(),
    database.prepare('SELECT status, enrolled_at, activated_at FROM eon_invite_accounts WHERE invitee_account_id = ? LIMIT 1').bind(account).first(),
    queryRows(database.prepare(`
      SELECT grant_id, key_type, grant_reason, status, issued_at, expires_at, revoked_at
      FROM eon_key_grants
      WHERE account_id = ?
      ORDER BY issued_at DESC
      LIMIT 80
    `).bind(account)),
    queryRows(database.prepare(`
      SELECT unlock_record_id, unlock_catalog_id, feature_group, status, issued_at, expires_at, revoked_at
      FROM eon_key_unlocks
      WHERE account_id = ?
      ORDER BY issued_at DESC
      LIMIT 80
    `).bind(account)),
    queryRows(database.prepare(`
      SELECT reward_id, reward_code, status, issued_at, revoked_at
      FROM eon_digital_rewards
      WHERE account_id = ?
      ORDER BY issued_at DESC
      LIMIT 80
    `).bind(account)),
    queryRows(database.prepare(`
      SELECT event_type, status, available_at, reason
      FROM eon_invite_events
      WHERE inviter_account_id = ?
      ORDER BY created_at DESC
      LIMIT 40
    `).bind(account))
  ]);
  const [balances, growthMetrics] = await Promise.all([readBalances(database, account), readReferralGrowthMetrics(database, account)]);
  return freeze({
    ok: true,
    signedIn: true,
    account: freeze({
      referralIdentity: identity ? freeze({ referralId: cleanText(identity.referral_id, 96), status: cleanText(identity.status, 32), boundAt: Number(identity.bound_at || 0) }) : null,
      incomingInvite: association ? freeze({ status: cleanText(association.status, 32), enrolledAt: Number(association.enrolled_at || 0), activatedAt: Number(association.activated_at || 0) }) : null,
      balances,
      growthMetrics,
      grants: freeze(grants.map((row) => freeze({ grantId: cleanText(row.grant_id, 96), keyType: cleanText(row.key_type, 24), reason: cleanText(row.grant_reason, 80), status: cleanText(row.status, 32), issuedAt: Number(row.issued_at || 0), expiresAt: Number(row.expires_at || 0), revokedAt: Number(row.revoked_at || 0) }))),
      unlocks: freeze(unlocks.map((row) => freeze({ recordId: cleanText(row.unlock_record_id, 96), unlockId: cleanText(row.unlock_catalog_id, 120), featureGroup: cleanText(row.feature_group, 120), status: cleanText(row.status, 32), issuedAt: Number(row.issued_at || 0), expiresAt: Number(row.expires_at || 0), revokedAt: Number(row.revoked_at || 0) }))),
      digitalRewards: freeze(rewards.map((row) => freeze({ rewardId: cleanText(row.reward_id, 96), code: cleanText(row.reward_code, 96), status: cleanText(row.status, 32), issuedAt: Number(row.issued_at || 0), revokedAt: Number(row.revoked_at || 0) }))),
      referralEvents: freeze(pendingRows.map((row) => freeze({ type: cleanText(row.event_type, 64), status: cleanText(row.status, 32), availableAt: Number(row.available_at || 0), reason: cleanText(row.reason, 96) }))),
      reconciliation: freeze({
        status: cleanText(reconciliation?.status, 48),
        processed: Number(reconciliation?.processed || 0),
        granted: Number(reconciliation?.granted || 0),
        blocked: Number(reconciliation?.blocked || 0),
        backgroundExecution: false,
        triggeredBySignedInStatusRead: true
      })
    })
  });
}

export function buildReferralPublicStatus(env = {}) {
  const config = getReferralRuntimeConfig(env);
  return freeze({
    schema: EON_REFERRAL_SERVER_SCHEMA,
    ok: true,
    rollout: config.rollout,
    active: config.active,
    databaseBinding: config.databaseBinding,
    databaseMode: config.databaseMode,
    dedicatedDatabaseReady: config.dedicatedDatabaseReady,
    legacyBillingFallback: config.legacyBillingFallback,
    optionalRateLimiterConfigured: Boolean(env.EON_REFERRAL_RATE_LIMITER?.limit),
    sharingActive: true,
    referralGrantsActive: config.active,
    keyRedemptionActive: config.active,
    ordinaryAdsOutsideReferral: true,
    rewardedSponsorKeysOutsideReferral: true,
    referralAdViewRewards: false,
    monetization: 'separate-commercial-rails',
    serverRole: 'minimal-authority-for-identity-association-qualification-grant-reversal-and-redemption',
    decentralizedRole: 'signed-public-links-local-media-local-share-cards-local-campaign-drafts-and-local-generated-content',
    storage: freeze({
      rawTokens: false,
      clicks: false,
      impressions: false,
      socialPosts: false,
      prompts: false,
      media: false,
      providerKeys: false,
      accountRelationship: true,
      qualifyingEvents: true,
      grantsAndUnlocks: true,
      aggregateQualifiedMetrics: true
    }),
    rules: freeze({
      oneLevelOnly: true,
      identityBindingRequiresFreshSignature: true,
      selfReferralRejected: true,
      clickOrShareReward: false,
      freeActivationKey: 'signal',
      freeQualification: 'signed-invite-plus-verified-google-account-session',
      paidKeys: 'builder-for-first-two-retained-paid-referrals-power-for-third',
      paidRetentionDays: EON_REFERRAL_RETENTION_DAYS,
      monthlySignalCap: EON_REFERRAL_FREE_SIGNAL_MONTHLY_CAP,
      yearlyPaidCap: EON_REFERRAL_PAID_YEARLY_CAP,
      cashOrSubscriptionReward: false,
      digitalRewards: true
    }),
    cloudflareLoadModel: 'event-driven-and-lazy-no-polling-no-cron',
    measurement: 'ledger-derived-aggregates-only-no-click-impression-or-social-post-tracking'
  });
}

export function validateReferralServerContract() {
  const errors = [];
  const status = buildReferralPublicStatus({ EON_REFERRAL_ROLLOUT: 'production', EON_REFERRALS_DB: { prepare() {} } });
  if (!status.active || !status.referralGrantsActive || !status.keyRedemptionActive) errors.push('Production referral rollout must activate grants and redemption when D1 exists.');
  if (status.ordinaryAdsOutsideReferral !== true || status.rewardedSponsorKeysOutsideReferral !== true || status.referralAdViewRewards !== false || status.monetization !== 'separate-commercial-rails') errors.push('Referral authority must stay separate from ordinary ads and rewarded Sponsor Keys.');
  if (status.storage.rawTokens || status.storage.clicks || status.storage.impressions || status.storage.prompts || status.storage.media || status.storage.providerKeys) errors.push('Minimal referral ledger stores prohibited data.');
  if (!status.storage.aggregateQualifiedMetrics || status.measurement !== 'ledger-derived-aggregates-only-no-click-impression-or-social-post-tracking') errors.push('Referral measurement must be derived from qualified ledger state only.');
  if (EON_REFERRAL_NON_QUALIFYING_SIGNALS.some((signal) => !/click|impression|share|link|ad|post/.test(signal))) errors.push('Non-qualifying signal contract drifted.');
  if (selectPaidReferralKeyType(0) !== 'builder' || selectPaidReferralKeyType(1) !== 'builder' || selectPaidReferralKeyType(2) !== 'power') errors.push('Paid reward progression must be Builder, Builder, Power.');
  if (EON_REFERRAL_PAID_YEARLY_CAP !== 3 || EON_REFERRAL_RETENTION_DAYS < 14) errors.push('Paid referral cap/retention contract drifted.');
  if (!status.rules.identityBindingRequiresFreshSignature || EON_REFERRAL_IDENTITIES_PER_ACCOUNT_CAP !== 5 || EON_REFERRAL_BIND_CHALLENGE_TTL_MS > 10 * 60 * 1000) errors.push('Referral identity binding must require a short-lived proof-of-possession challenge.');
  if (!EON_REFERRAL_ALLOWED_ACTIVATION_MILESTONES.includes('google_account_connected')) errors.push('Verified Google identity qualification milestone must remain enabled.');
  if (!EON_REFERRAL_SERVER_CHALLENGE_MILESTONES.includes('city_orientation_completed') || EON_REFERRAL_CITY_ORIENTATION_STEPS.length !== 3 || EON_REFERRAL_MILESTONE_MIN_DWELL_MS < 3000) errors.push('City orientation qualification must require a bounded server challenge and explicit steps.');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_REFERRAL_SERVER_SCHEMA, checks: 21 });
}

export default freeze({
  EON_REFERRAL_SERVER_SCHEMA,
  EON_REFERRAL_PROGRAM_VERSION,
  EON_REFERRAL_ROLLOUTS,
  EON_REFERRAL_RETENTION_DAYS,
  EON_REFERRAL_FREE_SIGNAL_MONTHLY_CAP,
  EON_REFERRAL_PAID_YEARLY_CAP,
  EON_REFERRAL_BIND_CHALLENGE_TTL_MS,
  EON_REFERRAL_IDENTITIES_PER_ACCOUNT_CAP,
  EON_REFERRAL_MILESTONE_CHALLENGE_TTL_MS,
  EON_REFERRAL_MILESTONE_MIN_DWELL_MS,
  EON_REFERRAL_SERVER_CHALLENGE_MILESTONES,
  EON_REFERRAL_CITY_ORIENTATION_STEPS,
  EON_REFERRAL_CITY_ORIENTATION_STEP_MIN_OFFSETS_MS,
  EON_REFERRAL_ALLOWED_ACTIVATION_MILESTONES,
  EON_REFERRAL_NON_QUALIFYING_SIGNALS,
  getReferralRuntimeConfig,
  resolveReferralDatabase,
  ensureReferralSchema,
  requestReferralBindChallenge,
  bindReferralIdentity,
  enrollReferral,
  beginReferralMilestoneChallenge,
  recordReferralMilestoneStep,
  completeReferralMilestoneChallenge,
  recordReferralQualificationReceipt,
  qualifyReferralActivation,
  qualifyReferralGoogleSignIn,
  applyReferralBillingSignal,
  reconcileReferralRewards,
  issueSponsorEonKey,
  redeemEonKeyBundle,
  redeemEonKey,
  applyReferralSupportReversal,
  readReferralAccountStatus,
  buildReferralPublicStatus,
  selectPaidReferralKeyType,
  validateReferralServerContract
});
