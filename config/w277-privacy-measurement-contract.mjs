/** W277-A0 — privacy-preserving local measurement source contract. */
export const W277_PRIVACY_MEASUREMENT_SCHEMA = 'eonapp.w277.privacy-measurement-source-readiness.v1';

export const W277_PRIVACY_MEASUREMENT_POLICY = Object.freeze({
  schema: W277_PRIVACY_MEASUREMENT_SCHEMA,
  decision: 'SOURCE_READY_EXTERNAL_PRIVACY_EVIDENCE_PENDING',
  scope: 'source-only',
  collection: Object.freeze({
    defaultEnabled: false,
    transport: 'browser-local-only',
    pageviewLimit: 64,
    eventLimit: 120,
    sessionLimit: 20,
    trustEventLimit: 120
  }),
  exclusions: Object.freeze([
    'chat-content', 'credentials', 'url-queries', 'url-fragments', 'cookies',
    'fingerprinting', 'remote-analytics', 'advertising', 'referral-attribution'
  ]),
  externalEvidenceRequired: Object.freeze([
    'independent-privacy-and-retention-review',
    'browser-storage-clear-and-disable-observation',
    'preview-live-third-party-tag-inventory',
    'jurisdictional-user-rights-and-notice-review',
    'support-and-incident-data-handling-review'
  ])
});
