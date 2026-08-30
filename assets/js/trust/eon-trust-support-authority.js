/** A15 I20 — one trust, support, policy, status and incident authority. */
export const EON_TRUST_SUPPORT_SCHEMA = 'eon.trust-support.a15.v1';
export const EON_TRUST_POLICY_VERSION = '2026-08-05';
export const EON_CASE_STATUSES = Object.freeze(['submitted', 'triaged', 'awaiting_user', 'in_review', 'resolved', 'closed']);
export const EON_CASE_PRIORITIES = Object.freeze(['normal', 'high', 'urgent']);
export const EON_SUPPORT_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'technical', label: 'Technical problem', ownerRole: 'support-operations', defaultPriority: 'normal' }),
  Object.freeze({ id: 'billing', label: 'Billing, trial, cancellation or refund', ownerRole: 'billing-operations', defaultPriority: 'high' }),
  Object.freeze({ id: 'privacy-rights', label: 'Privacy, access, export, correction or deletion', ownerRole: 'privacy-operations', defaultPriority: 'high' }),
  Object.freeze({ id: 'security', label: 'Security vulnerability or account safety', ownerRole: 'security-operations', defaultPriority: 'urgent' }),
  Object.freeze({ id: 'abuse', label: 'Abuse, harmful content or policy concern', ownerRole: 'trust-safety-operations', defaultPriority: 'high' }),
  Object.freeze({ id: 'accessibility', label: 'Accessibility barrier', ownerRole: 'accessibility-operations', defaultPriority: 'high' })
]);

const CATEGORY_BY_ID = new Map(EON_SUPPORT_CATEGORIES.map((row) => [row.id, row]));
const SECRET_PATTERNS = Object.freeze([
  /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/i,
  /\b(?:sk|pk|rk|api)[-_][A-Za-z0-9_-]{20,}\b/,
  /\b(?:seed phrase|recovery phrase|private key)\b\s*[:=-]/i,
  /\b(?:\d[ -]*?){13,19}\b/
]);

function clean(value = '', limit = 4000) {
  return Array.from(String(value ?? '')).filter((character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127; }).join('').trim().slice(0, limit);
}
function cleanId(value = '', limit = 120) {
  return clean(value, limit).replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, limit);
}
function hasSecretLikeContent(value = '') {
  return SECRET_PATTERNS.some((pattern) => pattern.test(String(value || '')));
}

export function getSupportCategory(categoryId = '') {
  return CATEGORY_BY_ID.get(clean(categoryId, 40).toLowerCase()) || null;
}

export function validateTrustCaseInput(input = {}) {
  const category = getSupportCategory(input.categoryId || input.category);
  const subject = clean(input.subject, 120);
  const description = clean(input.description, 2000);
  const routePath = clean(input.routePath, 240);
  const errors = [];
  if (!category) errors.push('category_invalid');
  if (subject.length < 5) errors.push('subject_too_short');
  if (description.length < 20) errors.push('description_too_short');
  if (Object.prototype.hasOwnProperty.call(input, 'evidence')) errors.push('attachments_or_evidence_not_accepted');
  if (hasSecretLikeContent(`${subject}\n${description}`)) errors.push('secret_like_content_rejected');
  if (routePath && (!routePath.startsWith('/') || routePath.startsWith('//'))) errors.push('route_invalid');
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    value: Object.freeze({
      categoryId: category?.id || '',
      ownerRole: category?.ownerRole || '',
      priority: category?.defaultPriority || 'normal',
      subject,
      description,
      routePath: routePath || '/',
      evidence: null
    })
  });
}

export function publicTrustCase(row = {}) {
  if (!row || typeof row !== 'object') return null;
  const status = EON_CASE_STATUSES.includes(String(row.status || '')) ? String(row.status) : 'submitted';
  return Object.freeze({
    schema: EON_TRUST_SUPPORT_SCHEMA,
    caseId: cleanId(row.case_id || row.caseId, 80),
    categoryId: clean(row.category_id || row.categoryId, 40),
    subject: clean(row.subject, 160),
    status,
    priority: EON_CASE_PRIORITIES.includes(String(row.priority || '')) ? String(row.priority) : 'normal',
    ownerRole: clean(row.owner_role || row.ownerRole, 80),
    publicResponse: clean(row.public_response || row.publicResponse, 2000),
    createdAt: Number(row.created_at || row.createdAt || 0) || 0,
    updatedAt: Number(row.updated_at || row.updatedAt || 0) || 0,
    resolvedAt: Number(row.resolved_at || row.resolvedAt || 0) || 0,
    responseBoundary: 'Use the private case token. Never place passwords, provider keys, recovery material, payment-card data or private work in a case.'
  });
}

export function getTrustPolicySet() {
  return Object.freeze({
    schema: `${EON_TRUST_SUPPORT_SCHEMA}.policy-set`,
    version: EON_TRUST_POLICY_VERSION,
    refundWithdrawalCancellation: Object.freeze({
      cancellation: 'Subscriptions can be managed through the verified Dodo customer portal. Cancellation stops future renewal according to the provider-confirmed billing state; it does not create a browser-local entitlement.',
      withdrawalAndRefund: 'Refund, withdrawal, duplicate-charge and dispute requests are reviewed as billing cases under applicable law and the verified Dodo transaction record. EONAPP does not promise an automatic refund outside a confirmed legal or provider obligation.',
      trial: 'A seven-day trial is available only when the server billing command ledger confirms that the account has not previously used a trial. Trial eligibility is not inferred from browser storage.',
      disputes: 'Chargebacks and disputes can revoke access when a verified Dodo lifecycle event requires it. A support case does not itself alter billing or entitlement state.'
    }),
    privacyRights: Object.freeze({
      rights: ['access', 'export', 'correction', 'restriction', 'objection', 'deletion'],
      requestPath: '/help#trust-support-case',
      localDataBoundary: 'Most workspace content remains on the user device and must be managed through Data Survival and local deletion controls.',
      serverDataBoundary: 'Identity, billing, referral, support and legally retained transaction records are handled according to their declared inventory and retention class.'
    }),
    support: Object.freeze({
      caseCategories: EON_SUPPORT_CATEGORIES.map((row) => row.id),
      attachmentsAccepted: false,
      automaticPlanChanges: false,
      automaticRefunds: false,
      automaticPrivacyDecisions: false,
      guaranteedResponseTime: false,
      resolvedCaseRetentionDays: 90,
      deletionMode: 'self-service anonymization with an active case token; operator retention cleanup is separate',
      rateLimit: 'privacy-preserving hashed request bucket; no IP address is stored'
    }),
    incident: Object.freeze({
      publicStatusPath: '/status',
      ownerBoardPublic: false,
      publicUpdatesContainPrivateContent: false,
      rollbackAuthoritySeparate: true
    })
  });
}

function requiredEnv(env = {}, key = '') { return clean(env?.[key], key.includes('ADDRESS') ? 600 : 240); }
export function getPublicOperatorConfig(env = {}) {
  const identity = Object.freeze({
    legalName: requiredEnv(env, 'EONAPP_OPERATOR_LEGAL_NAME'),
    tradingName: requiredEnv(env, 'EONAPP_OPERATOR_TRADING_NAME') || 'EONAPP',
    address: requiredEnv(env, 'EONAPP_OPERATOR_ADDRESS'),
    country: requiredEnv(env, 'EONAPP_OPERATOR_COUNTRY'),
    supportContact: requiredEnv(env, 'EONAPP_SUPPORT_CONTACT'),
    privacyContact: requiredEnv(env, 'EONAPP_PRIVACY_CONTACT'),
    securityContact: requiredEnv(env, 'EONAPP_SECURITY_CONTACT'),
    governingLaw: requiredEnv(env, 'EONAPP_GOVERNING_LAW'),
    venue: requiredEnv(env, 'EONAPP_LEGAL_VENUE')
  });
  const missing = Object.entries(identity).filter(([key, value]) => key !== 'tradingName' && !value).map(([key]) => key);
  return Object.freeze({
    schema: `${EON_TRUST_SUPPORT_SCHEMA}.operator-config`,
    configured: missing.length === 0,
    launchEligible: missing.length === 0,
    identity,
    missing: Object.freeze(missing),
    policyVersion: EON_TRUST_POLICY_VERSION,
    policySet: getTrustPolicySet()
  });
}

export function getTrustSupportTruth() {
  return Object.freeze({
    schema: `${EON_TRUST_SUPPORT_SCHEMA}.truth`,
    realCaseIds: true,
    caseAccessTokenReturnedOnce: true,
    caseTokenStoredRaw: false,
    D1Backed: true,
    rawAttachmentsAccepted: false,
    supportEvidenceStored: false,
    supportRetentionDays: 90,
    supportDeletionAvailable: true,
    rateLimitStoresRawIp: false,
    browserCanAlterBilling: false,
    supportCaseCanAlterEntitlement: false,
    publicIncidentUpdatesContainPrivateData: false,
    operatorIdentityMustBeConfiguredBeforePaidLaunch: true,
    policyVersion: EON_TRUST_POLICY_VERSION
  });
}
