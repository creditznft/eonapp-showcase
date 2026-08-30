/** W623H — minimal server-authoritative referral and EONKEY ledger. */
import {
  enforceSameOriginMutation,
  getIdentityConfig,
  jsonResponse,
  readSession
} from '../_shared/eon-auth.js';
import { EON_REQUEST_LIMITS, readBoundedJson } from '../_shared/eon-request-security.js';
import {
  beginReferralMilestoneChallenge,
  bindReferralIdentity,
  buildReferralPublicStatus,
  completeReferralMilestoneChallenge,
  enrollReferral,
  recordReferralMilestoneStep,
  getReferralRuntimeConfig,
  resolveReferralDatabase,
  qualifyReferralActivation,
  qualifyReferralGoogleSignIn,
  readReferralAccountStatus,
  requestReferralBindChallenge,
  redeemEonKey
} from '../../assets/js/referrals/eon-referral-server-runtime.js';


const REFERRAL_STATUS_SCHEMA = 'eon.referral.public-status.w753.v1';
const REFERRAL_ENDPOINT = '/api/referrals';

function withReferralTruth(publicStatus = {}, statusState = '', referenceCode = '', extra = {}) {
  const state = ['active', 'inactive', 'unavailable'].includes(statusState)
    ? statusState
    : publicStatus?.active === true ? 'active' : 'inactive';
  const checkedAt = new Date().toISOString();
  return {
    ...publicStatus,
    ...extra,
    statusSchema: REFERRAL_STATUS_SCHEMA,
    statusState: state,
    active: state === 'active',
    available: state !== 'unavailable',
    configuredActive: publicStatus?.active === true,
    endpoint: REFERRAL_ENDPOINT,
    checkedAt,
    referenceCode: String(referenceCode || (state === 'active' ? 'referral-authority-active' : state === 'inactive' ? 'referral-programme-inactive' : 'referral-status-unavailable')),
    authority: {
      endpoint: REFERRAL_ENDPOINT,
      serverSchema: publicStatus?.schema || '',
      databaseBinding: publicStatus?.databaseBinding || '',
      databaseMode: publicStatus?.databaseMode || '',
      serverRole: publicStatus?.serverRole || ''
    },
    freshness: { checkedAt, cacheControl: 'no-store' }
  };
}


function response(body, status = 200) {
  return jsonResponse(body, status, { 'cache-control': 'no-store, max-age=0' });
}

async function readSignedInAccount(request, env) {
  const identity = getIdentityConfig(request, env);
  if (!identity.configured) return { identity, session: null };
  return { identity, session: await readSession(identity, request) };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const publicStatus = buildReferralPublicStatus(env);
  const { session } = await readSignedInAccount(request, env);
  if (!session?.accountId || !publicStatus.active) {
    const state = publicStatus.active ? 'active' : 'inactive';
    const referenceCode = publicStatus.active ? 'referral-sign-in-required' : 'referral-programme-inactive';
    return response(withReferralTruth(publicStatus, state, referenceCode, {
      signedIn: Boolean(session?.accountId),
      account: null,
      message: publicStatus.active
        ? 'Sign in to register an invite identity, accept a signed invite, view EONKEYS or redeem an eligible unlock.'
        : 'Sharing remains available. The referral programme is inactive because its server rollout or required database authority is not enabled.'
    }));
  }
  try {
    const accountStatus = await readReferralAccountStatus({ database: resolveReferralDatabase(env).database, accountId: session.accountId });
    return response(withReferralTruth(publicStatus, 'active', 'referral-authority-active', accountStatus));
  } catch {
    return response(withReferralTruth(publicStatus, 'unavailable', 'referral-status-read-failed', { signedIn: true, account: null, ok: false, error: 'referral_status_unavailable' }), 503);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const publicStatus = buildReferralPublicStatus(env);
  const runtime = getReferralRuntimeConfig(env);
  const referralDatabase = resolveReferralDatabase(env).database;
  const { identity, session } = await readSignedInAccount(request, env);
  if (!identity.configured) return response(withReferralTruth(publicStatus, 'unavailable', 'identity-unavailable', { ok: false, error: 'identity_unavailable' }), 503);
  if (!enforceSameOriginMutation(request, identity)) return response(withReferralTruth(publicStatus, publicStatus.active ? 'active' : 'inactive', 'same-origin-required', { ok: false, error: 'same_origin_required' }), 403);
  if (!session?.accountId) return response(withReferralTruth(publicStatus, publicStatus.active ? 'active' : 'inactive', 'sign-in-required', { ok: false, error: 'sign_in_required' }), 401);
  if (!runtime.active) return response(withReferralTruth(publicStatus, 'inactive', 'referral-programme-inactive', { ok: false, error: 'referral_rollout_inactive' }), 503);
  const parsed = await readBoundedJson(request, { maxBytes: EON_REQUEST_LIMITS.referralMutation });
  if (!parsed.ok) return response(withReferralTruth(publicStatus, publicStatus.active ? 'active' : 'inactive', parsed.error, { ok: false, error: parsed.error }), parsed.status);
  const body = parsed.value;
  const action = String(body?.action || '').trim().toLowerCase();
  if (env.EON_REFERRAL_RATE_LIMITER?.limit) {
    const limited = await env.EON_REFERRAL_RATE_LIMITER.limit({ key: `${session.accountId}:${action || 'unknown'}` });
    if (!limited?.success) return response(withReferralTruth(publicStatus, 'active', 'rate-limited', { ok: false, error: 'rate_limited', retryable: true }), 429);
  }
  let result;
  try {
    if (action === 'request_bind_challenge') {
      result = await requestReferralBindChallenge({ database: referralDatabase, accountId: session.accountId, token: body.token });
    } else if (action === 'bind_identity') {
      result = await bindReferralIdentity({ database: referralDatabase, accountId: session.accountId, token: body.token, challengeId: body.challengeId, challenge: body.challenge, signature: body.signature });
    } else if (action === 'enroll') {
      result = await enrollReferral({ database: referralDatabase, inviteeAccountId: session.accountId, token: body.token });
    } else if (action === 'begin_milestone') {
      result = await beginReferralMilestoneChallenge({ database: referralDatabase, inviteeAccountId: session.accountId, milestone: body.milestone });
    } else if (action === 'record_milestone_step') {
      result = await recordReferralMilestoneStep({
        database: referralDatabase,
        inviteeAccountId: session.accountId,
        milestone: body.milestone,
        challengeId: body.challengeId,
        challenge: body.challenge,
        step: body.step
      });
    } else if (action === 'complete_milestone') {
      result = await completeReferralMilestoneChallenge({
        database: referralDatabase,
        inviteeAccountId: session.accountId,
        milestone: body.milestone,
        challengeId: body.challengeId,
        challenge: body.challenge
      });
    } else if (action === 'qualify_activation') {
      result = await qualifyReferralActivation({ database: referralDatabase, inviteeAccountId: session.accountId, milestone: body.milestone, sourceReceiptId: body.sourceReceiptId });
    } else if (action === 'qualify_google_signin') {
      result = await qualifyReferralGoogleSignIn({ database: referralDatabase, inviteeAccountId: session.accountId, token: body.token });
    } else if (action === 'redeem') {
      result = await redeemEonKey({ database: referralDatabase, accountId: session.accountId, grantId: body.grantId, unlockId: body.unlockId });
    } else {
      return response(withReferralTruth(publicStatus, 'active', 'unsupported-referral-action', { ok: false, error: 'unsupported_referral_action' }), 400);
    }
  } catch {
    return response(withReferralTruth(publicStatus, 'unavailable', 'referral-action-unavailable', { ok: false, error: 'referral_action_unavailable' }), 503);
  }
  const status = result?.ok ? 200 : (result?.status === 'login_required' ? 401 : 409);
  return response(withReferralTruth(publicStatus, 'active', result?.ok ? 'referral-action-complete' : 'referral-action-rejected', { ok: result?.ok === true, result }), status);
}
