/** W623H — tiny browser client for the minimal referral authority. */
import { readPendingShareToken, clearPendingShareToken } from '../utils/share-attribution.js';
import { getOrCreateShareIdentity, signSharePayload } from '../utils/share-link-identity.js';

export const EON_REFERRAL_API = '/api/referrals';
export const EON_REFERRAL_STATUS_SCHEMA = 'eon.referral.public-status.w753.v1';
export const EON_REFERRAL_STATUS_STATES = Object.freeze(['active', 'inactive', 'unavailable']);
const ACTIVATION_SENT_KEY = 'eon:referral:activation-sent:v1';
const ENROLLED_LOCAL_KEY = 'eon:referral:enrolled-local:v1';
const GOOGLE_SIGNIN_CLAIM_KEY = 'eon:referral:google-signin-claim:v1';
let installed = false;
let inflightStatus = null;

function safeSession() {
  try { return globalThis.sessionStorage || null; } catch { return null; }
}

function safeLocal() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

async function readJson(response) {
  try { return await response.json(); } catch { return { ok: false, error: 'invalid_server_response' }; }
}

async function requestWithTimeout(url, options = {}, timeoutMs = 4000, fetcher = globalThis.fetch) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? globalThis.setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    if (typeof fetcher !== 'function') throw new Error('fetch-unavailable');
    return await fetcher(url, { ...options, ...(controller ? { signal: controller.signal } : {}) }); }
  finally { if (timer) globalThis.clearTimeout(timer); }
}

async function postReferral(action, payload = {}, requestOptions = {}) {
  try {
    const response = await requestWithTimeout(EON_REFERRAL_API, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ action, ...payload }),
      keepalive: requestOptions.keepalive === true
    }, Number(requestOptions.timeoutMs || 4000));
    const body = await readJson(response);
    return { ...body, httpStatus: response.status, ok: response.ok && body?.result?.ok !== false };
  } catch {
    return { ok: false, error: 'referral_request_unavailable', httpStatus: 0 };
  }
}

function cleanReference(value = '', fallback = '') {
  return String(value || fallback || '').trim().toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

export function normalizeReferralStatus(raw = {}, { httpStatus = raw?.httpStatus, checkedAt = new Date().toISOString(), endpoint = EON_REFERRAL_API } = {}) {
  const statusCode = Number.isFinite(Number(httpStatus)) ? Number(httpStatus) : 0;
  const explicitState = EON_REFERRAL_STATUS_STATES.includes(String(raw?.statusState || raw?.state || '')) ? String(raw.statusState || raw.state) : '';
  const transportUnavailable = statusCode === 0 || statusCode >= 500 || raw?.ok === false;
  const unavailable = explicitState === 'unavailable' || (!explicitState && transportUnavailable);
  const state = explicitState || (unavailable ? 'unavailable' : raw?.active === true ? 'active' : 'inactive');
  const referenceCode = cleanReference(raw?.referenceCode || raw?.error, state === 'active' ? 'referral-authority-active' : state === 'inactive' ? 'referral-programme-inactive' : 'referral-status-unavailable');
  return Object.freeze({
    ...raw,
    schema: EON_REFERRAL_STATUS_SCHEMA,
    state,
    statusState: state,
    active: state === 'active',
    available: state !== 'unavailable',
    ok: state === 'unavailable' ? false : raw?.ok !== false,
    endpoint: String(raw?.endpoint || endpoint || EON_REFERRAL_API),
    checkedAt: String(raw?.checkedAt || checkedAt || ''),
    httpStatus: statusCode,
    referenceCode,
    error: state === 'unavailable' ? cleanReference(raw?.error, referenceCode) : cleanReference(raw?.error),
    authority: Object.freeze({
      endpoint: String(raw?.authority?.endpoint || raw?.endpoint || endpoint || EON_REFERRAL_API),
      serverSchema: String(raw?.authority?.serverSchema || raw?.serverSchema || raw?.schema || ''),
      databaseBinding: String(raw?.authority?.databaseBinding || raw?.databaseBinding || ''),
      databaseMode: String(raw?.authority?.databaseMode || raw?.databaseMode || ''),
      serverRole: String(raw?.authority?.serverRole || raw?.serverRole || '')
    }),
    freshness: Object.freeze({ checkedAt: String(raw?.freshness?.checkedAt || raw?.checkedAt || checkedAt || ''), cacheControl: 'no-store' })
  });
}

export async function fetchReferralStatus({ force = false, fetcher = globalThis.fetch, timeoutMs = 2500, now = () => new Date().toISOString() } = {}) {
  const useSharedInflight = fetcher === globalThis.fetch && Number(timeoutMs) === 2500;
  if (useSharedInflight && inflightStatus && !force) return inflightStatus;
  const request = requestWithTimeout(EON_REFERRAL_API, { credentials: 'same-origin', headers: { accept: 'application/json' } }, Number(timeoutMs) || 2500, fetcher)
    .then(async (response) => normalizeReferralStatus({ ...(await readJson(response)), httpStatus: response.status }, { httpStatus: response.status, checkedAt: now(), endpoint: EON_REFERRAL_API }))
    .catch((error) => normalizeReferralStatus({ ok: false, error: error?.name === 'AbortError' ? 'referral_status_timeout' : 'referral_status_unavailable', httpStatus: 0 }, { httpStatus: 0, checkedAt: now(), endpoint: EON_REFERRAL_API }));
  if (!useSharedInflight) return request;
  inflightStatus = request.finally(() => { inflightStatus = null; });
  return inflightStatus;
}

export function readPendingReferralToken() {
  return readPendingShareToken();
}

export function hasPendingReferralActivation() {
  if (readPendingReferralToken()) return true;
  try { return safeLocal()?.getItem(ENROLLED_LOCAL_KEY) === 'true'; } catch { return false; }
}

export async function bindReferralIdentityFromInvite(token = '') {
  const value = String(token || '').trim();
  if (!value) return { ok: false, error: 'signed_invite_required' };
  const challengeResponse = await postReferral('request_bind_challenge', { token: value });
  if (!challengeResponse.ok) return challengeResponse;
  const challenge = challengeResponse.result || {};
  if (!challenge.canonical || !challenge.challengeId || !challenge.challenge) return { ok: false, error: 'bind_challenge_invalid' };
  try {
    const identity = await getOrCreateShareIdentity();
    const signature = await signSharePayload(challenge.canonical, identity);
    return postReferral('bind_identity', { token: value, challengeId: challenge.challengeId, challenge: challenge.challenge, signature });
  } catch {
    return { ok: false, error: 'share_identity_signature_unavailable' };
  }
}

export async function enrollPendingReferral({ clearOnSuccess = true } = {}) {
  const token = readPendingReferralToken();
  if (!token) return { ok: false, error: 'no_pending_signed_invite' };
  const result = await postReferral('enroll', { token });
  if (result.ok) {
    try { safeLocal()?.setItem(ENROLLED_LOCAL_KEY, 'true'); } catch {}
    if (clearOnSuccess) clearPendingShareToken();
  }
  return result;
}

export async function beginReferralMilestone(milestone = 'city_orientation_completed') {
  const normalized = String(milestone || '').trim().toLowerCase();
  if (!normalized) return { ok: false, error: 'activation_milestone_required' };
  if (!hasPendingReferralActivation()) return { ok: false, skipped: true, reason: 'no_pending_invite' };
  const token = readPendingReferralToken();
  if (token) {
    const enrolled = await enrollPendingReferral({ clearOnSuccess: false });
    if (!enrolled.ok) return enrolled;
  }
  const response = await postReferral('begin_milestone', { milestone: normalized });
  return response?.result ? { ...response.result, httpStatus: response.httpStatus } : response;
}

export async function recordReferralMilestoneStep({ milestone = 'city_orientation_completed', challengeId = '', challenge = '', step = '' } = {}) {
  const response = await postReferral('record_milestone_step', {
    milestone: String(milestone || '').trim().toLowerCase(),
    challengeId: String(challengeId || '').trim().slice(0, 96),
    challenge: String(challenge || '').trim().slice(0, 160),
    step: String(step || '').trim().toLowerCase().slice(0, 64)
  }, { keepalive: true, timeoutMs: 2500 });
  return response?.result ? { ...response.result, httpStatus: response.httpStatus } : response;
}

export async function completeReferralMilestone({ milestone = 'city_orientation_completed', challengeId = '', challenge = '' } = {}) {
  const response = await postReferral('complete_milestone', {
    milestone: String(milestone || '').trim().toLowerCase(),
    challengeId: String(challengeId || '').trim().slice(0, 96),
    challenge: String(challenge || '').trim().slice(0, 160)
  }, { keepalive: true, timeoutMs: 2500 });
  const result = response?.result ? { ...response.result, httpStatus: response.httpStatus } : response;
  if (result?.ok) {
    clearPendingShareToken();
    try { safeSession()?.setItem(ACTIVATION_SENT_KEY, String(milestone || 'city_orientation_completed')); } catch {}
    try { safeLocal()?.removeItem(ENROLLED_LOCAL_KEY); } catch {}
  }
  return result;
}

export async function qualifyPendingReferralFromGoogleSignIn() {
  const token = readPendingReferralToken();
  if (!token) return { ok: false, skipped: true, reason: 'no_pending_invite' };
  try {
    if (safeSession()?.getItem(GOOGLE_SIGNIN_CLAIM_KEY) === token.slice(-48)) {
      return { ok: true, skipped: true, duplicate: true, reason: 'google_signin_claim_already_attempted' };
    }
  } catch {}
  const result = await postReferral('qualify_google_signin', { token }, { timeoutMs: 6000 });
  if (result.ok) {
    clearPendingShareToken();
    try { safeSession()?.setItem(GOOGLE_SIGNIN_CLAIM_KEY, token.slice(-48)); } catch {}
    try { safeSession()?.setItem(ACTIVATION_SENT_KEY, 'google_account_connected'); } catch {}
    try { safeLocal()?.removeItem(ENROLLED_LOCAL_KEY); } catch {}
    globalThis.dispatchEvent?.(new CustomEvent('eon:referral-qualified', {
      detail: {
        milestone: 'google_account_connected',
        status: result?.result?.status || 'qualified',
        keyType: result?.result?.keyType || ''
      }
    }));
  }
  return result;
}

export async function qualifyReferralActivation(milestone = 'first_project_saved', sourceReceiptId = '') {
  const normalized = String(milestone || '').trim().toLowerCase();
  if (!normalized) return { ok: false, error: 'activation_milestone_required' };
  return postReferral('qualify_activation', { milestone: normalized, sourceReceiptId: String(sourceReceiptId || '').trim().slice(0, 96) });
}

export async function redeemEonKey(grantId = '', unlockId = '') {
  return postReferral('redeem', { grantId: String(grantId || '').trim(), unlockId: String(unlockId || '').trim() });
}

async function tryEnrollThenQualify(milestone, sourceReceiptId = '') {
  const token = readPendingReferralToken();
  let enrolledLocally = false;
  try { enrolledLocally = safeLocal()?.getItem(ENROLLED_LOCAL_KEY) === 'true'; } catch {}
  if (!token && !enrolledLocally) return { ok: false, skipped: true, reason: 'no_pending_invite' };
  if (token) {
    const enrolled = await enrollPendingReferral({ clearOnSuccess: false });
    if (!enrolled.ok) return enrolled;
  }
  const qualified = await qualifyReferralActivation(milestone, sourceReceiptId);
  if (qualified.ok) {
    clearPendingShareToken();
    try { safeSession()?.setItem(ACTIVATION_SENT_KEY, milestone); } catch {}
    try { safeLocal()?.removeItem(ENROLLED_LOCAL_KEY); } catch {}
  }
  return qualified;
}

export function installReferralMilestoneBridge() {
  if (installed || typeof globalThis.addEventListener !== 'function') return () => {};
  installed = true;
  const accountStatus = (() => {
    try { return new URL(globalThis.location?.href || 'https://eonapp.invalid/').searchParams.get('account') || ''; }
    catch { return ''; }
  })();
  if (accountStatus === 'connected' && readPendingReferralToken()) {
    void qualifyPendingReferralFromGoogleSignIn();
  }
  const projectHandler = (event) => {
    try {
      if (safeSession()?.getItem(ACTIVATION_SENT_KEY)) return;
    } catch {}
    const sourceReceiptId = String(event?.detail?.sourceReceiptId || '').trim();
    void tryEnrollThenQualify('first_project_saved', sourceReceiptId);
  };
  globalThis.addEventListener('eon:project-saved', projectHandler);
  return () => {
    globalThis.removeEventListener('eon:project-saved', projectHandler);
    installed = false;
  };
}

export default Object.freeze({
  EON_REFERRAL_API,
  EON_REFERRAL_STATUS_SCHEMA,
  EON_REFERRAL_STATUS_STATES,
  normalizeReferralStatus,
  fetchReferralStatus,
  readPendingReferralToken,
  hasPendingReferralActivation,
  bindReferralIdentityFromInvite,
  enrollPendingReferral,
  beginReferralMilestone,
  recordReferralMilestoneStep,
  completeReferralMilestone,
  qualifyReferralActivation,
  qualifyPendingReferralFromGoogleSignIn,
  redeemEonKey,
  installReferralMilestoneBridge
});
