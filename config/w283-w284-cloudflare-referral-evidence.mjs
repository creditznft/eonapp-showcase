/**
 * W283/W284 — owner-only Cloudflare/D1 evidence and referral decision boundary.
 *
 * This module makes no network request and holds no credential, account ID,
 * database ID, secret, deployment name or activation switch. It exists to
 * prevent a local source handover from being mistaken for remote proof.
 */
export const W283_W284_EVIDENCE_SCHEMA = 'eon.cloudflare.referral-evidence.w283-w284-a0.v1';
export const W283_CLOUDFLARE_EVIDENCE_MODE = 'owner-read-only-evidence-pending';
export const W284_REFERRAL_ACTIVATION_MODE = 'not-authorised';

export const W283_READ_ONLY_EVIDENCE_REQUIREMENTS = Object.freeze([
  'Authenticated owner inventories Pages deployments and project bindings by name only; never expose secret values.',
  'Authenticated owner inventories D1 databases by name only; never create, bind, migrate, delete or write.',
  'For the candidate referral D1 database only, inspect sqlite_master schema metadata before any row-level query.',
  'Save redacted command receipts outside source control with timestamp, owner role, command class and result status.',
  'Rehearse a rollback path on Preview before any future production change and record the accountable owner.'
]);

export const W284_REQUIRED_APPROVALS = Object.freeze({
  exactNonFinancialProductDefinition: false,
  legalConsumerReferralReview: false,
  privacyRetentionDeletionReview: false,
  securityThreatModelAndAbuseReview: false,
  supportAppealAndDisclosureReview: false,
  serverIdempotencyAndRateLimitProof: false,
  previewBindingAndSchemaEvidence: false,
  observedRollbackAndKillSwitchDrill: false,
  namedAccountableOwner: false
});

export const W284_PROHIBITED_ACTIVATION_BEHAVIOURS = Object.freeze([
  'wallet', 'custody', 'private key', 'seed phrase', 'coin', 'token',
  'cash', 'payout', 'commission', 'revenue share', 'exchange rate',
  'automatic entitlement', 'client authoritative grant', 'click reward',
  'share reward', 'ad view reward', 'raw IP storage', 'device fingerprint'
]);

export function evaluateW284ReferralActivationDecision(approvals = W284_REQUIRED_APPROVALS) {
  const missing = Object.entries(W284_REQUIRED_APPROVALS)
    .filter(([key]) => approvals?.[key] !== true)
    .map(([key]) => key);
  return Object.freeze({
    schema: W283_W284_EVIDENCE_SCHEMA,
    mode: W284_REFERRAL_ACTIVATION_MODE,
    authorised: false,
    active: false,
    missing,
    prohibited: W284_PROHIBITED_ACTIVATION_BEHAVIOURS,
    reason: 'W284 is a future decision gate. Existing Cloudflare/D1 resources must be read-only inventoried before any product, legal, privacy, security, owner and rollback approval can be evaluated.'
  });
}

export function validateW283W284EvidenceContract() {
  const errors = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  assert(W283_CLOUDFLARE_EVIDENCE_MODE === 'owner-read-only-evidence-pending', 'W283 must remain owner-read-only evidence pending.');
  assert(W284_REFERRAL_ACTIVATION_MODE === 'not-authorised', 'W284 must remain not authorised.');
  assert(W283_READ_ONLY_EVIDENCE_REQUIREMENTS.length >= 5, 'W283 must preserve all read-only evidence requirements.');
  const decision = evaluateW284ReferralActivationDecision();
  assert(decision.authorised === false && decision.active === false, 'W284 must fail closed without approvals.');
  assert(decision.missing.length === Object.keys(W284_REQUIRED_APPROVALS).length, 'Every W284 approval must be independently evidenced.');
  for (const term of ['wallet', 'coin', 'token', 'payout', 'raw IP storage']) assert(W284_PROHIBITED_ACTIVATION_BEHAVIOURS.includes(term), `W284 must prohibit ${term}.`);
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}
