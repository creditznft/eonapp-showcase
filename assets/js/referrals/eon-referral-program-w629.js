/**
 * W629 — referral, EONKEY and Vault Reveal source contract.
 *
 * This module is intentionally pure and fail-closed. Server/D1 code owns scarce
 * reward truth; browsers may render status and submit reviewed redemption
 * choices, but cannot mint, vest, consume, reverse or transfer value.
 */
import { getEonUnlockMenu } from './eon-keys-catalog.js';

export const EON_W629_SCHEMA = 'eonapp.referrals.eonkeys-vault.w629.v1';
export const EON_W629_VERSION = 1;
export const EON_KEY_GRANT_STATES = Object.freeze(['pending', 'vested', 'available', 'consumed', 'revoked', 'expired']);
export const EON_REFERRAL_QUALIFYING_EVENTS = Object.freeze([
  'google_account_connected',
  'first_project_saved',
  'guide_completed',
  'local_ai_setup_completed',
  'city_orientation_completed',
  'retained_paid_customer'
]);
export const EON_REFERRAL_NON_QUALIFYING_EVENTS = Object.freeze([
  'click', 'link_open', 'copy', 'share', 'impression', 'post', 'signup',
  'trial_start', 'checkout_started', 'ad_view', 'ad_click'
]);
export const EON_REFERRAL_REVERSAL_REASONS = Object.freeze([
  'refund', 'dispute', 'chargeback', 'payment_failure', 'subscription_expired',
  'entitlement_revoked', 'self_referral', 'duplicate_account', 'abuse', 'support_reversal'
]);
export const EON_W629_REAL_EVIDENCE_KEYS = Object.freeze([
  'signedInviterIdentity', 'inviteAccepted', 'selfReferralRejected', 'tamperedLinkRejected',
  'oneLevelOnly', 'browserGrantRejected', 'activationReceiptConsumedOnce', 'clickShareNoGrant',
  'paidRetentionPending', 'paidRetentionVested', 'yearlyCapEnforced', 'duplicateEventIdempotent',
  'refundReversal', 'disputeReversal', 'redeemedUnlockRevoked', 'raceConditionSafe',
  'vaultRevealMigrated', 'privateFieldsRedacted', 'supportAuditReadable'
]);

const safe = (value = '', max = 160) => String(value ?? '').trim().replace(/[^a-zA-Z0-9._:@/-]/g, '').slice(0, max);
const freeze = (value) => Object.freeze(value);

export function classifyReferralSignal(eventType = '') {
  const normalized = safe(eventType, 64).toLowerCase();
  if (EON_REFERRAL_QUALIFYING_EVENTS.includes(normalized)) return freeze({ eventType: normalized, qualifies: true, reason: 'verified-program-event' });
  if (EON_REFERRAL_NON_QUALIFYING_EVENTS.includes(normalized)) return freeze({ eventType: normalized, qualifies: false, reason: 'engagement-alone-never-grants' });
  return freeze({ eventType: normalized, qualifies: false, reason: 'unknown-event-fails-closed' });
}

export function validateReferralAttribution(input = {}) {
  const inviterAccountId = safe(input.inviterAccountId, 80);
  const inviteeAccountId = safe(input.inviteeAccountId, 80);
  const inviterReferralId = safe(input.inviterReferralId, 96);
  const tokenVerified = input.tokenVerified === true;
  const inviterProofVerified = input.inviterProofVerified === true;
  const existingInviterAccountId = safe(input.existingInviterAccountId, 80);
  const errors = [];
  if (!inviterAccountId || !inviteeAccountId || !inviterReferralId) errors.push('identity-missing');
  if (!tokenVerified) errors.push('signed-token-not-verified');
  if (!inviterProofVerified) errors.push('inviter-proof-of-possession-missing');
  if (inviterAccountId && inviterAccountId === inviteeAccountId) errors.push('self-referral-rejected');
  if (existingInviterAccountId && existingInviterAccountId !== inviterAccountId) errors.push('invitee-already-bound');
  if (input.parentInviterAccountId || input.referralDepth > 1) errors.push('multi-level-referral-prohibited');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), oneLevelOnly: true, rawTokenStored: false, publicIdentityExposed: false });
}

export function normalizeGrantTransition({ from = 'pending', to = '', reason = '', timestamp = Date.now() } = {}) {
  const current = safe(from, 24).toLowerCase();
  const next = safe(to, 24).toLowerCase();
  const allowed = {
    pending: ['vested', 'available', 'revoked', 'expired'],
    vested: ['available', 'consumed', 'revoked', 'expired'],
    available: ['consumed', 'revoked', 'expired'],
    consumed: ['revoked'],
    revoked: [],
    expired: []
  };
  const ok = EON_KEY_GRANT_STATES.includes(current) && EON_KEY_GRANT_STATES.includes(next) && allowed[current].includes(next);
  return freeze({
    ok,
    from: current,
    to: next,
    reasonCode: safe(reason || (ok ? 'policy-transition' : 'invalid-transition'), 80),
    occurredAt: Number.isFinite(Number(timestamp)) ? Number(timestamp) : Date.now(),
    terminal: ['revoked', 'expired'].includes(next),
    browserAuthoritative: false
  });
}

export function buildEonKeyRedemptionDecision({ grant = {}, unlockId = '', accountId = '', timestamp = Date.now() } = {}) {
  const account = safe(accountId, 80);
  const grantAccount = safe(grant.accountId, 80);
  const grantId = safe(grant.grantId, 96);
  const keyType = safe(grant.keyType, 24).toLowerCase();
  const status = safe(grant.status, 24).toLowerCase();
  const unlock = getEonUnlockMenu({ keyType }).find((item) => item.id === safe(unlockId, 96));
  const errors = [];
  if (!account || !grantId) errors.push('grant-or-account-missing');
  if (grantAccount && grantAccount !== account) errors.push('grant-owned-by-another-account');
  if (!['available', 'vested'].includes(status)) errors.push('grant-not-vested');
  if (!unlock) errors.push('unlock-not-eligible-for-key');
  if (grant.revokedAt) errors.push('grant-revoked');
  if (grant.expiresAt && Number(grant.expiresAt) <= Number(timestamp)) errors.push('grant-expired');
  if (unlock?.planEquivalent && ['plus', 'studio', 'power', 'max'].includes(unlock.planEquivalent) && unlock.category === 'subscription') errors.push('whole-tier-substitution-prohibited');
  return freeze({
    ok: errors.length === 0,
    errors: freeze(errors),
    grantId,
    unlock: unlock ? freeze({ ...unlock }) : null,
    serverEntitlementRequired: true,
    wholeTierSubstitution: false,
    cashValue: false,
    transferable: false
  });
}

export function buildReferralUxModel(status = {}) {
  const account = status.account || {};
  const balances = account.balances || {};
  const grants = Array.isArray(account.grants) ? account.grants : [];
  const pending = grants.filter((row) => row.status === 'pending').length;
  const available = ['signal', 'builder', 'power'].reduce((sum, key) => sum + Number(balances?.available?.[key] || 0), 0);
  const consumed = ['signal', 'builder', 'power'].reduce((sum, key) => sum + Number(balances?.consumed?.[key] || 0), 0);
  const revoked = ['signal', 'builder', 'power'].reduce((sum, key) => sum + Number(balances?.revoked?.[key] || 0), 0);
  const expired = ['signal', 'builder', 'power'].reduce((sum, key) => sum + Number(balances?.expired?.[key] || 0), 0);
  return freeze({
    schema: EON_W629_SCHEMA,
    programmeActive: status.active === true,
    signedIn: status.signedIn === true,
    ordinarySharingSeparate: true,
    moneyLanguageAllowed: false,
    keyLanguage: 'non-cash individual unlock',
    wholeTierSubstitutionAllowed: false,
    prohibitedRewardForms: freeze(['cash', 'crypto', 'commission', 'gift-card', 'discount', 'renewal-credit', 'free-plan', 'provider-credit']),
    counts: freeze({ pending, available, consumed, revoked, expired }),
    disclosures: freeze([
      'Clicks, copied links, and opened links alone do not earn an EONKEY; the referred person must complete verified Google sign-in.',
      'The one-time Signal EONKEY is subject to one-level attribution, self-referral rejection, replay protection and the monthly cap.',
      'Paid-retention EONKEYS are an additional bonus path, not a requirement for the Google-sign-in Signal key.',
      'Refunds, disputes, abuse or entitlement reversal can revoke related rewards.',
      'EONKEYS are non-cash, non-transferable and never replace a whole subscription tier.'
    ])
  });
}

export function redactReferralEvidence(input = {}) {
  const source = JSON.parse(JSON.stringify(input || {}));
  const forbidden = /token|signature|publicKey|privateKey|email|rawPayload|prompt|media|providerKey|customerRef|subscriptionRef/i;
  const scrub = (value) => {
    if (Array.isArray(value)) return value.map(scrub);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).filter(([key]) => !forbidden.test(key)).map(([key, nested]) => [key, scrub(nested)]));
  };
  const redacted = scrub(source);
  const text = JSON.stringify(redacted);
  return freeze({
    schema: `${EON_W629_SCHEMA}.evidence`,
    evidence: freeze(redacted),
    containsRawToken: /eon[12]\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text),
    containsEmail: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text),
    containsPrivatePayload: /rawPayload|privateKey|providerKey|prompt|media/i.test(text)
  });
}

export function buildReferralCertificationBoard(evidence = {}) {
  const rows = EON_W629_REAL_EVIDENCE_KEYS.map((key) => freeze({ key, passed: evidence?.[key] === true }));
  const passedCount = rows.filter((row) => row.passed).length;
  const pass = passedCount === rows.length;
  return freeze({
    schema: `${EON_W629_SCHEMA}.certification`,
    pass,
    verdict: pass ? 'go-referral-eonkey-vault-certified' : 'no-go-real-referral-evidence-pending',
    totalCount: rows.length,
    passedCount,
    rows: freeze(rows),
    sourceOnlyCannotCertify: true,
    screenshotsAloneCannotCertify: true,
    syntheticBillingCannotCertify: true,
    publicRewardClaimsAllowed: pass
  });
}

export function validateW629ProgramContract() {
  const errors = [];
  if (classifyReferralSignal('share').qualifies) errors.push('share-must-not-qualify');
  if (!classifyReferralSignal('google_account_connected').qualifies) errors.push('verified-google-signin-must-qualify');
  if (!classifyReferralSignal('first_project_saved').qualifies) errors.push('useful-milestone-must-qualify');
  if (validateReferralAttribution({ inviterAccountId: 'a', inviteeAccountId: 'a', inviterReferralId: 'r', tokenVerified: true, inviterProofVerified: true }).ok) errors.push('self-referral-must-fail');
  if (normalizeGrantTransition({ from: 'revoked', to: 'vested' }).ok) errors.push('revoked-grant-must-not-revive');
  if (buildReferralCertificationBoard({}).pass) errors.push('empty-evidence-must-not-certify');
  const redacted = redactReferralEvidence({ token: 'eon1.a.b', customerEmail: 'x@y.test', safeCount: 1 });
  if (redacted.containsRawToken || redacted.containsEmail || redacted.evidence.safeCount !== 1) errors.push('evidence-redaction-failed');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_W629_SCHEMA, version: EON_W629_VERSION });
}

export default freeze({
  EON_W629_SCHEMA,
  EON_W629_VERSION,
  EON_KEY_GRANT_STATES,
  EON_REFERRAL_QUALIFYING_EVENTS,
  EON_REFERRAL_NON_QUALIFYING_EVENTS,
  EON_REFERRAL_REVERSAL_REASONS,
  EON_W629_REAL_EVIDENCE_KEYS,
  classifyReferralSignal,
  validateReferralAttribution,
  normalizeGrantTransition,
  buildEonKeyRedemptionDecision,
  buildReferralUxModel,
  redactReferralEvidence,
  buildReferralCertificationBoard,
  validateW629ProgramContract
});
