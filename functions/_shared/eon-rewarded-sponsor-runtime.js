import { hmacBase64Url } from './eon-auth.js';
import { getEonMonetizationRuntimeConfig } from '../../assets/js/monetization/eon-monetization-policy.js';
import { canRewardedProviderMint, getRewardedProviderAdapter } from '../../config/rt97-rewarded-provider-contract.mjs';
import { ensureReferralSchema, issueSponsorEonKey, readAccountActiveEonKeyUnlocks, redeemEonKeyBundle, resolveReferralDatabase } from '../../assets/js/referrals/eon-referral-server-runtime.js';
import { getEonUnlockMenu } from '../../assets/js/referrals/eon-keys-catalog.js';

export const EON_REWARDED_SPONSOR_SCHEMA = 'eonapp.monetization.rewarded-sponsor.rt92.v1';
export const EON_REWARDED_SESSION_TTL_MS = 3 * 60 * 1000;
export const EON_REWARDED_MIN_COMPLETE_MS = 9_000;
export const EON_REWARDED_EVENT_ORDER = Object.freeze(['start', 'firstQuartile', 'midpoint', 'thirdQuartile', 'complete']);
export const EON_REWARDED_EVENT_MIN_ELAPSED_MS = Object.freeze({ start: 0, firstQuartile: 1500, midpoint: 3500, thirdQuartile: 6000, complete: EON_REWARDED_MIN_COMPLETE_MS });

const encoder = new TextEncoder();
const freeze = (value) => Object.freeze(value);

function clean(value = '', max = 160) {
  return Array.from(String(value || '').trim()).filter((character) => {
    const cp = character.codePointAt(0) || 0;
    return cp > 31 && cp !== 127;
  }).join('').replace(/[^a-zA-Z0-9._:@/-]/g, '').slice(0, max);
}
function nowMs(value = Date.now()) { const n = Number(value); return Number.isFinite(n) && n > 0 ? Math.floor(n) : Date.now(); }
function randomId(prefix = 'rw') {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `${prefix}_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}
async function sha256Hex(value = '') {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(String(value || '')));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}
function equalText(left = '', right = '') {
  const a = String(left || ''); const b = String(right || ''); const length = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < length; i += 1) mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return mismatch === 0;
}
function dayStartUtc(timestamp = Date.now()) {
  const date = new Date(nowMs(timestamp));
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
function signingSecret(env = {}) { return String(env.EON_REWARDED_SIGNING_KEY || ''); }
function sessionMessage(sessionId = '', event = '', expiresAt = 0) { return `eon-reward-v1|${clean(sessionId, 96)}|${clean(event, 32)}|${Number(expiresAt || 0)}`; }
async function signSessionEvent(env, sessionId, event, expiresAt) { return hmacBase64Url(sessionMessage(sessionId, event, expiresAt), signingSecret(env)); }
async function verifySessionEvent(env, sessionId, event, expiresAt, token) {
  const secret = signingSecret(env);
  if (secret.length < 32 || !token) return false;
  return equalText(await signSessionEvent(env, sessionId, event, expiresAt), token);
}

export function getRewardedSponsorRuntimeConfig(env = {}) {
  const monetization = getEonMonetizationRuntimeConfig(env);
  const referral = resolveReferralDatabase(env);
  const secretReady = signingSecret(env).length >= 32;
  const databaseReady = Boolean(referral.database?.prepare);
  const adapter = getRewardedProviderAdapter(monetization.rewarded.provider);
  const active = monetization.rewarded.enabled === true && monetization.rewarded.provider === 'exoclick' && adapter?.completionAssurance === 'server-validated-vast-sequence' && adapter?.clientCompletionCanMint === false && secretReady && databaseReady;
  return freeze({
    schema: EON_REWARDED_SPONSOR_SCHEMA,
    active,
    provider: active ? 'exoclick' : 'none',
    verificationMode: 'server-validated-vast-wrapper-sequence',
    providerSignedCompletion: adapter?.providerSignedCompletion === true,
    rewardClass: active ? adapter.rewardClass : 'none',
    permanentValueAllowed: adapter?.permanentValueAllowed === true,
    clientCompletionCanMint: adapter?.clientCompletionCanMint === true,
    serverSequenceValidated: active,
    secretReady,
    databaseReady,
    dailyCap: monetization.rewarded.dailyCap,
    cooldownMinutes: monetization.rewarded.cooldownMinutes,
    zoneId: monetization.sponsorVideo.zoneId,
    upstreamVastTag: monetization.sponsorVideo.vastTag,
    sessionTtlMs: EON_REWARDED_SESSION_TTL_MS,
    minCompleteMs: EON_REWARDED_MIN_COMPLETE_MS
  });
}

async function countAvailableSponsorKeys(database, accountId) {
  const row = await database.prepare(`SELECT COUNT(*) AS total FROM eon_key_grants WHERE account_id = ? AND key_type = 'sponsor' AND status = 'available'`).bind(accountId).first();
  return Number(row?.total || 0);
}

function publicUnlockCatalog() {
  return freeze(getEonUnlockMenu({ keyType: 'sponsor' }).map((unlock) => freeze({
    id: unlock.id,
    label: unlock.label,
    keysRequired: Number(unlock.keysRequired || 1),
    durationMinutes: Number(unlock.durationMinutes || 0),
    featureGroup: unlock.featureGroup,
    category: unlock.category,
    requiresUserLocalOrOwnProviderKey: unlock.requiresUserLocalOrOwnProviderKey === true
  })));
}

function sponsorUnlockIds() {
  return new Set(getEonUnlockMenu({ keyType: 'sponsor' }).map((unlock) => String(unlock.id || '')));
}

async function readActiveSponsorUnlocks(database, accountId, timestamp = Date.now()) {
  const allowed = sponsorUnlockIds();
  const rows = await readAccountActiveEonKeyUnlocks({ database, accountId, timestamp });
  return freeze(rows.filter((row) => allowed.has(String(row.unlockId || ''))).map((row) => freeze({
    unlockId: clean(row.unlockId, 120),
    featureGroup: clean(row.featureGroup, 120),
    issuedAt: Number(row.issuedAt || 0),
    expiresAt: Number(row.expiresAt || 0) || null
  })));
}

export async function readRewardedSponsorAccountStatus({ env = {}, accountId = '', sessionId = '', timestamp = Date.now() } = {}) {
  const account = clean(accountId, 80);
  const config = getRewardedSponsorRuntimeConfig(env);
  if (!account) return freeze({ ok: false, status: 'login_required', config, availableKeys: 0, unlocks: publicUnlockCatalog() });
  if (!config.databaseReady) return freeze({ ok: false, status: 'reward_database_unavailable', config, availableKeys: 0, unlocks: publicUnlockCatalog() });
  const database = resolveReferralDatabase(env).database;
  await ensureReferralSchema(database);
  const time = nowMs(timestamp);
  const [availableKeys, activeUnlocks] = await Promise.all([
    countAvailableSponsorKeys(database, account),
    readActiveSponsorUnlocks(database, account, time)
  ]);
  let session = null;
  const safeSessionId = clean(sessionId, 96);
  if (safeSessionId) {
    const row = await database.prepare(`SELECT session_id, status, grant_id, issued_at, started_at, completed_at, expires_at FROM eon_sponsor_reward_sessions WHERE session_id = ? AND account_id = ? LIMIT 1`).bind(safeSessionId, account).first();
    if (row) session = freeze({
      sessionId: clean(row.session_id, 96), status: clean(row.status, 32), grantId: clean(row.grant_id, 96),
      issuedAt: Number(row.issued_at || 0), startedAt: Number(row.started_at || 0), completedAt: Number(row.completed_at || 0), expiresAt: Number(row.expires_at || 0)
    });
  }
  const daily = await database.prepare(`SELECT COUNT(*) AS total, MAX(completed_at) AS last_completed_at FROM eon_sponsor_reward_sessions WHERE account_id = ? AND status = 'completed' AND completed_at >= ?`).bind(account, dayStartUtc(time)).first();
  const completedToday = Number(daily?.total || 0);
  const lastCompletedAt = Number(daily?.last_completed_at || 0);
  const cooldownMs = Number(config.cooldownMinutes || 0) * 60 * 1000;
  const cooldownUntil = lastCompletedAt > 0 ? lastCompletedAt + cooldownMs : 0;
  return freeze({
    ok: true,
    status: config.active ? 'ready' : 'rewarded_runtime_unavailable',
    active: config.active,
    provider: config.provider,
    verificationMode: config.verificationMode,
    providerSignedCompletion: false,
    availableKeys,
    completedToday,
    dailyCap: config.dailyCap,
    cooldownMinutes: config.cooldownMinutes,
    cooldownUntil,
    canStart: config.active && completedToday < config.dailyCap && time >= cooldownUntil,
    session,
    activeUnlocks,
    unlocks: publicUnlockCatalog()
  });
}

export async function startRewardedSponsorSession({ env = {}, accountId = '', surface = 'rewards', worldId = '', offerId = 'sponsor-key-v1', requestOrigin = '', timestamp = Date.now() } = {}) {
  const account = clean(accountId, 80);
  const config = getRewardedSponsorRuntimeConfig(env);
  if (!account) return freeze({ ok: false, status: 'login_required' });
  if (!config.active) return freeze({ ok: false, status: 'rewarded_runtime_unavailable' });
  const database = resolveReferralDatabase(env).database;
  await ensureReferralSchema(database);
  const status = await readRewardedSponsorAccountStatus({ env, accountId: account, timestamp });
  if (!status.canStart) {
    if (status.completedToday >= status.dailyCap) return freeze({ ok: false, status: 'daily_cap_reached', dailyCap: status.dailyCap });
    return freeze({ ok: false, status: 'cooldown_active', cooldownUntil: status.cooldownUntil });
  }
  const time = nowMs(timestamp);
  const existing = await database.prepare(`
    SELECT session_id, expires_at FROM eon_sponsor_reward_sessions
    WHERE account_id = ? AND provider = 'exoclick' AND status IN ('issued','started','verifying') AND expires_at > ?
    ORDER BY issued_at DESC LIMIT 1
  `).bind(account, time).first();
  if (existing?.session_id) {
    const existingId = clean(existing.session_id, 96);
    const existingExpiresAt = Number(existing.expires_at || 0);
    const existingToken = await signSessionEvent(env, existingId, 'vast', existingExpiresAt);
    const origin = String(requestOrigin || '').replace(/\/$/, '');
    return freeze({
      ok: true, status: 'reward_session_reused', sessionId: existingId, expiresAt: existingExpiresAt,
      vastUrl: `${origin}/api/monetization/rewarded/vast?session=${encodeURIComponent(existingId)}&token=${encodeURIComponent(existingToken)}`,
      reward: freeze({ keyType: 'sponsor', keysOnCompletion: 1 }), clientCannotMint: true, reused: true
    });
  }
  const expiresAt = time + EON_REWARDED_SESSION_TTL_MS;
  const sessionId = randomId('sponsor');
  await database.prepare(`
    INSERT INTO eon_sponsor_reward_sessions (
      session_id, account_id, provider, offer_id, surface, world_id, status,
      proof_hash, grant_id, issued_at, started_at, completed_at, expires_at, updated_at
    ) VALUES (?, ?, 'exoclick', ?, ?, ?, 'issued', NULL, NULL, ?, NULL, NULL, ?, ?)
  `).bind(sessionId, account, clean(offerId, 80), clean(surface, 64), clean(worldId, 64) || null, time, expiresAt, time).run();
  const origin = String(requestOrigin || '').replace(/\/$/, '');
  const vastToken = await signSessionEvent(env, sessionId, 'vast', expiresAt);
  return freeze({
    ok: true,
    status: 'reward_session_issued',
    sessionId,
    expiresAt,
    vastUrl: `${origin}/api/monetization/rewarded/vast?session=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(vastToken)}`,
    reward: freeze({ keyType: 'sponsor', keysOnCompletion: 1 }),
    clientCannotMint: true
  });
}

export async function buildRewardedSponsorVastWrapper({ env = {}, sessionId = '', token = '', origin = '', timestamp = Date.now() } = {}) {
  const config = getRewardedSponsorRuntimeConfig(env);
  const sid = clean(sessionId, 96);
  if (!config.active || !sid) return freeze({ ok: false, status: 'rewarded_runtime_unavailable' });
  const database = resolveReferralDatabase(env).database;
  await ensureReferralSchema(database);
  const row = await database.prepare(`SELECT session_id, status, expires_at FROM eon_sponsor_reward_sessions WHERE session_id = ? AND provider = 'exoclick' LIMIT 1`).bind(sid).first();
  if (!row) return freeze({ ok: false, status: 'reward_session_not_found' });
  const expiresAt = Number(row.expires_at || 0);
  if (expiresAt <= nowMs(timestamp)) return freeze({ ok: false, status: 'reward_session_expired' });
  if (!await verifySessionEvent(env, sid, 'vast', expiresAt, token)) return freeze({ ok: false, status: 'reward_token_invalid' });
  const base = String(origin || '').replace(/\/$/, '');
  const tracking = {};
  for (const event of EON_REWARDED_EVENT_ORDER) {
    const eventToken = await signSessionEvent(env, sid, event, expiresAt);
    tracking[event] = `${base}/api/monetization/rewarded/event?session=${encodeURIComponent(sid)}&event=${encodeURIComponent(event)}&token=${encodeURIComponent(eventToken)}`;
  }
  const upstream = String(config.upstreamVastTag || '').replace(/]]>/g, ']]]]><![CDATA[>');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<VAST version="3.0"><Ad id="eonapp-rewarded"><Wrapper><AdSystem>EONAPP</AdSystem><VASTAdTagURI><![CDATA[${upstream}]]></VASTAdTagURI><Creatives><Creative><Linear><TrackingEvents><Tracking event="start"><![CDATA[${tracking.start}]]></Tracking><Tracking event="firstQuartile"><![CDATA[${tracking.firstQuartile}]]></Tracking><Tracking event="midpoint"><![CDATA[${tracking.midpoint}]]></Tracking><Tracking event="thirdQuartile"><![CDATA[${tracking.thirdQuartile}]]></Tracking><Tracking event="complete"><![CDATA[${tracking.complete}]]></Tracking></TrackingEvents></Linear></Creative></Creatives></Wrapper></Ad></VAST>`;
  return freeze({ ok: true, status: 'vast_ready', xml });
}

export async function recordRewardedSponsorTrackingEvent({ env = {}, sessionId = '', event = '', token = '', timestamp = Date.now() } = {}) {
  const config = getRewardedSponsorRuntimeConfig(env);
  const sid = clean(sessionId, 96);
  const normalizedEvent = EON_REWARDED_EVENT_ORDER.includes(String(event || '')) ? String(event) : '';
  if (!config.active || !sid || !normalizedEvent) return freeze({ ok: false, status: 'invalid_reward_event' });
  const database = resolveReferralDatabase(env).database;
  await ensureReferralSchema(database);
  const session = await database.prepare(`SELECT session_id, account_id, status, issued_at, started_at, expires_at, grant_id FROM eon_sponsor_reward_sessions WHERE session_id = ? AND provider = 'exoclick' LIMIT 1`).bind(sid).first();
  if (!session) return freeze({ ok: false, status: 'reward_session_not_found' });
  const time = nowMs(timestamp);
  const expiresAt = Number(session.expires_at || 0);
  if (expiresAt <= time) {
    await database.prepare(`UPDATE eon_sponsor_reward_sessions SET status = 'expired', updated_at = ? WHERE session_id = ? AND status NOT IN ('completed','expired')`).bind(time, sid).run();
    return freeze({ ok: false, status: 'reward_session_expired' });
  }
  if (!await verifySessionEvent(env, sid, normalizedEvent, expiresAt, token)) return freeze({ ok: false, status: 'reward_token_invalid' });
  if (session.status === 'completed') return freeze({ ok: true, status: 'already_completed', duplicate: true, grantId: clean(session.grant_id, 96) });
  const existing = await database.prepare(`SELECT event_type FROM eon_sponsor_reward_events WHERE session_id = ? AND event_type = ? LIMIT 1`).bind(sid, normalizedEvent).first();
  if (existing) return freeze({ ok: true, status: 'event_already_recorded', duplicate: true });
  const index = EON_REWARDED_EVENT_ORDER.indexOf(normalizedEvent);
  if (index > 0) {
    const previous = EON_REWARDED_EVENT_ORDER[index - 1];
    const previousRow = await database.prepare(`SELECT received_at FROM eon_sponsor_reward_events WHERE session_id = ? AND event_type = ? LIMIT 1`).bind(sid, previous).first();
    if (!previousRow) return freeze({ ok: false, status: 'reward_event_out_of_order', expectedPrevious: previous });
  }
  const issuedAt = Number(session.issued_at || 0);
  const startedAt = Number(session.started_at || 0) || (normalizedEvent === 'start' ? time : 0);
  const reference = startedAt || issuedAt;
  if (time - reference < Number(EON_REWARDED_EVENT_MIN_ELAPSED_MS[normalizedEvent] || 0)) return freeze({ ok: false, status: 'reward_event_too_early' });
  if (normalizedEvent === 'complete' && startedAt > 0 && time - startedAt < EON_REWARDED_MIN_COMPLETE_MS) return freeze({ ok: false, status: 'reward_completion_too_early' });
  const proofHash = await sha256Hex(`${sid}|${normalizedEvent}|${time}|${token}`);
  await database.batch([
    database.prepare(`INSERT INTO eon_sponsor_reward_events (session_id, event_type, received_at, proof_hash) VALUES (?, ?, ?, ?)`).bind(sid, normalizedEvent, time, proofHash),
    database.prepare(`UPDATE eon_sponsor_reward_sessions SET status = ?, started_at = COALESCE(started_at, ?), updated_at = ? WHERE session_id = ?`).bind(normalizedEvent === 'complete' ? 'verifying' : 'started', normalizedEvent === 'start' ? time : null, time, sid)
  ]);
  if (normalizedEvent !== 'complete') return freeze({ ok: true, status: 'reward_event_recorded', event: normalizedEvent });
  const rows = await database.prepare(`SELECT event_type, received_at, proof_hash FROM eon_sponsor_reward_events WHERE session_id = ? ORDER BY received_at ASC`).bind(sid).all();
  const events = Array.isArray(rows?.results) ? rows.results : [];
  const names = new Set(events.map((row) => String(row.event_type || '')));
  if (!EON_REWARDED_EVENT_ORDER.every((name) => names.has(name))) return freeze({ ok: false, status: 'reward_sequence_incomplete' });
  const startRow = events.find((row) => row.event_type === 'start');
  if (!startRow || time - Number(startRow.received_at || 0) < EON_REWARDED_MIN_COMPLETE_MS) return freeze({ ok: false, status: 'reward_completion_too_early' });
  const accountId = clean(session.account_id, 80);
  // Re-check cross-session economics at grant time. Starting several sessions
  // must not bypass the daily cap or cooldown if another session completes first.
  const finalAdmission = await readRewardedSponsorAccountStatus({ env, accountId, timestamp: time });
  if (finalAdmission.completedToday >= finalAdmission.dailyCap) return freeze({ ok: false, status: 'daily_cap_reached', dailyCap: finalAdmission.dailyCap });
  if (Number(finalAdmission.cooldownUntil || 0) > time) return freeze({ ok: false, status: 'cooldown_active', cooldownUntil: finalAdmission.cooldownUntil });
  const mintAuthority = canRewardedProviderMint(config.provider, config.rewardClass);
  if (!mintAuthority.ok || mintAuthority.permanentValueAllowed) return freeze({ ok: false, status: 'reward_provider_mint_not_authorized' });
  const grant = await issueSponsorEonKey({ database, accountId, sourceEventId: `sponsor:${sid}`, timestamp: time });
  if (!grant.ok) return freeze({ ok: false, status: 'sponsor_key_grant_failed' });
  const completionProof = await sha256Hex(events.map((row) => `${row.event_type}:${row.received_at}:${row.proof_hash}`).join('|'));
  await database.prepare(`UPDATE eon_sponsor_reward_sessions SET status = 'completed', proof_hash = ?, grant_id = ?, completed_at = ?, updated_at = ? WHERE session_id = ? AND status <> 'completed'`).bind(completionProof, grant.grantId, time, time, sid).run();
  const availableKeys = await countAvailableSponsorKeys(database, accountId);
  return freeze({ ok: true, status: 'sponsor_key_granted', grantId: grant.grantId, keyType: 'sponsor', keysGranted: 1, availableKeys, completedAt: time });
}

export async function redeemSponsorUnlock({ env = {}, accountId = '', unlockId = '', timestamp = Date.now() } = {}) {
  const account = clean(accountId, 80);
  if (!account) return freeze({ ok: false, status: 'login_required' });
  const database = resolveReferralDatabase(env).database;
  if (!database?.prepare) return freeze({ ok: false, status: 'reward_database_unavailable' });
  const result = await redeemEonKeyBundle({ database, accountId: account, keyType: 'sponsor', unlockId, timestamp });
  if (!result?.ok) return result;
  const status = await readRewardedSponsorAccountStatus({ env, accountId: account, timestamp });
  return freeze({ ...result, availableKeys: status.availableKeys, activeUnlocks: status.activeUnlocks });
}

export function validateRewardedSponsorRuntimeContract() {
  const errors = [];
  if (EON_REWARDED_MIN_COMPLETE_MS < 8_000) errors.push('reward completion must not be accepted instantly');
  if (EON_REWARDED_EVENT_ORDER.join(',') !== 'start,firstQuartile,midpoint,thirdQuartile,complete') errors.push('VAST completion sequence drifted');
  const providerAuthority = canRewardedProviderMint('exoclick', 'bounded-sponsor-unlock');
  if (!providerAuthority.ok || providerAuthority.permanentValueAllowed || providerAuthority.clientCompletionCanMint) errors.push('rewarded provider assurance drifted');
  const unlocks = publicUnlockCatalog();
  if (!unlocks.length || unlocks.some((item) => item.keysRequired < 1 || item.keysRequired > 6 || item.durationMinutes <= 0 || item.durationMinutes > 240)) errors.push('Sponsor unlock economics drifted');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_REWARDED_SPONSOR_SCHEMA });
}

export default freeze({
  EON_REWARDED_SPONSOR_SCHEMA,
  EON_REWARDED_SESSION_TTL_MS,
  EON_REWARDED_MIN_COMPLETE_MS,
  EON_REWARDED_EVENT_ORDER,
  EON_REWARDED_EVENT_MIN_ELAPSED_MS,
  getRewardedSponsorRuntimeConfig,
  readRewardedSponsorAccountStatus,
  startRewardedSponsorSession,
  buildRewardedSponsorVastWrapper,
  recordRewardedSponsorTrackingEvent,
  redeemSponsorUnlock,
  validateRewardedSponsorRuntimeContract
});
