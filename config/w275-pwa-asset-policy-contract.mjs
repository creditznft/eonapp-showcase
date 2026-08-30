/**
 * W275-A0 — Offline/PWA asset policy source contract.
 * This contract certifies only checked-in controls. Device, browser, update,
 * rollback and storage-pressure behavior require external evidence.
 */
export const W275_PWA_ASSET_POLICY_SCHEMA = 'eonapp.w275.pwa-asset-policy-source-readiness.v1';

export const W275_PWA_ASSET_POLICY = Object.freeze({
  schema: W275_PWA_ASSET_POLICY_SCHEMA,
  decision: 'SOURCE_READY_EXTERNAL_PWA_EVIDENCE_PENDING',
  scope: 'source-only',
  cachePolicy: Object.freeze({
    releaseIdentity: 'release-specific-owned-cache',
    ownedCachePrefixes: Object.freeze(['eonapp-shell-', 'eonapp-assets-', 'eonapp-pages-']),
    maxAssetEntries: 160,
    maxPageEntries: 32,
    maxPrecacheEntries: 40,
    updateActivation: 'explicit-user-request-only',
    protectedNavigation: Object.freeze([
      '/admin', '/billing', '/payment', '/api/', '/functions/', '/reward-access',
      '/rewards', '/telegram', '/vault', '/capsule'
    ])
  }),
  externalEvidenceRequired: Object.freeze([
    'first-install-on-real-device',
    'user-approved-update-and-refresh',
    'update-rollback-or-recovery-drill',
    'offline-and-slow-network-recovery',
    'storage-pressure-and-cache-eviction-observation'
  ]),
  prohibitions: Object.freeze([
    'No giant offline City or game cache.',
    'No automatic replacement-worker activation during an active session.',
    'No protected Vault/admin/reward/Telegram navigation caching.',
    'No release or install claim based only on source inspection.'
  ])
});
