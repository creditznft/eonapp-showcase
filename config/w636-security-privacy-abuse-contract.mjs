/** W636 — source security, privacy, secrets and abuse-resistance contract. */
export const W636_SECURITY_PRIVACY_ABUSE_CONTRACT = Object.freeze({
  schema: 'eonapp.security-privacy-abuse.w636.v1',
  wave: 'W636',
  sourceCertified: true,
  productionCertified: false,
  requestLimits: Object.freeze({
    accountMutation: 2 * 1024,
    billingMutation: 8 * 1024,
    referralMutation: 12 * 1024,
    cspReport: 12 * 1024,
    providerWebhook: 256 * 1024,
    supportCase: 20 * 1024
  }),
  controls: Object.freeze({
    boundedMutationBodies: true,
    jsonContentTypeRequired: true,
    sameOriginMutationRequired: true,
    providerWebhookSigned: true,
    providerWebhookReplayPayloadBound: true,
    checkoutUrlAllowlisted: true,
    browserAccountIdSuppressed: true,
    browserProviderSessionIdSuppressed: true,
    plaintextProviderAliasRetired: true,
    persistentBrowserAdminHmacRetired: true,
    fixedTrustedOrigins: true,
    cspTelemetryRedactedAndBounded: true,
    localAttachmentSecretFilter: true,
    immutableWorkflowActions: true,
    strictUtf8RequestBodies: true,
    hardenedApiResponseHeaders: true,
    legacyCryptoClaimsRetired: true,
    legacyProviderKeyExportRetired: true,
    lockfileRequired: true
  }),
  sensitiveBrowserStorageForbidden: Object.freeze([
    'eon:vault:api-keys:v1',
    'eon:security:hmac-key'
  ]),
  externalEvidenceRequired: Object.freeze([
    'independent penetration test',
    'Cloudflare WAF and rate-limit evidence',
    'real signed Dodo webhook replay and duplicate-conflict evidence',
    'browser CSP delivery and redacted alert delivery evidence',
    'real abuse and referral fraud review',
    'owner review of production secrets and bindings'
  ])
});

export function validateW636SecurityPrivacyAbuseContract(value = W636_SECURITY_PRIVACY_ABUSE_CONTRACT) {
  const checks = Object.freeze({
    schema: value?.schema === 'eonapp.security-privacy-abuse.w636.v1',
    sourceCertified: value?.sourceCertified === true,
    productionFence: value?.productionCertified === false,
    requestBounds: Object.values(value?.requestLimits || {}).every((number) => Number.isInteger(number) && number > 0 && number <= 256 * 1024),
    controls: Object.values(value?.controls || {}).every((flag) => flag === true),
    evidenceFence: Array.isArray(value?.externalEvidenceRequired) && value.externalEvidenceRequired.length >= 5
  });
  return Object.freeze({ ok: Object.values(checks).every(Boolean), checks });
}
