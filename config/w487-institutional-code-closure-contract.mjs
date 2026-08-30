/**
 * W487 — source-level institutional code-closure contract.
 *
 * This contract deliberately measures what source can prove. It does not
 * represent browser/device certification, payment readiness, publishing,
 * provider activation, sync, rewards or IoT activation.
 */
export const W487_INSTITUTIONAL_CODE_CLOSURE_SCHEMA = 'eonapp.w487.institutional-code-closure.v1';

export const W487_PRIMARY_HIERARCHY = Object.freeze([
  Object.freeze({ id: 'chat', label: 'EONBOT', href: '/' }),
  Object.freeze({ id: 'projects', label: 'Projects', href: '/projects' }),
  Object.freeze({ id: 'library', label: 'Library', href: '/library' }),
  Object.freeze({ id: 'forge', label: 'Forge', href: '/forge' }),
  Object.freeze({ id: 'eoncity', label: 'EON City', href: '/eoncity' }),
  Object.freeze({ id: 'vault', label: 'Vault', href: '/vault' })
]);

export const W487_INSTITUTIONAL_CODE_CLOSURE = Object.freeze({
  schema: W487_INSTITUTIONAL_CODE_CLOSURE_SCHEMA,
  sourceImplementationScore: 96,
  sourceImplementationScoreMeaning: 'A code-and-source-contract measure only; it is not a deployed institutional launch score.',
  primaryHierarchy: W487_PRIMARY_HIERARCHY,
  requiredSourceControls: Object.freeze({
    unifiedProductNarrative: true,
    desktopHoverExpandRail: true,
    localChatSearchOnly: true,
    legacyCommercialArchiveFence: true,
    accessMilestonesDisabled: true,
    cityFirstFrameShield: true,
    cityCommandDeckOverflowContainment: true,
    automaticPostingAllowedNow: false,
    localMediaRuntimeAllowedNow: false,
    paymentAllowedNow: false,
    syncAllowedNow: false,
    iotRemoteControlAllowedNow: false
  }),
  releaseEvidenceStillRequired: Object.freeze([
    'deploy-rebase-and-production-identity',
    'city-webgl-console-and-frame-trace',
    'desktop-tablet-android-ios-physical-device-walkthrough',
    'pwa-update-and-offline-rehearsal',
    'oauth-boundary-proof-when-owner-configured'
  ])
});

export function validateW487InstitutionalCodeClosureContract(contract = W487_INSTITUTIONAL_CODE_CLOSURE) {
  const errors = [];
  if (contract?.schema !== W487_INSTITUTIONAL_CODE_CLOSURE_SCHEMA) errors.push('W487 schema mismatch.');
  if (!Number.isFinite(contract?.sourceImplementationScore) || contract.sourceImplementationScore < 95 || contract.sourceImplementationScore > 100) {
    errors.push('W487 source implementation score must be a bounded 95–100 source-only value.');
  }
  const hierarchy = Array.isArray(contract?.primaryHierarchy) ? contract.primaryHierarchy : [];
  const ids = hierarchy.map((entry) => entry?.id);
  if (JSON.stringify(ids) !== JSON.stringify(['chat', 'projects', 'library', 'forge', 'eoncity', 'vault'])) {
    errors.push('W487 primary hierarchy must be EONBOT → Projects → Library → Forge → EON City → Vault.');
  }
  if (hierarchy.some((entry) => !String(entry?.label || '').trim() || !String(entry?.href || '').startsWith('/'))) {
    errors.push('W487 hierarchy entries require visible labels and local routes.');
  }
  const controls = contract?.requiredSourceControls || {};
  for (const key of ['unifiedProductNarrative', 'desktopHoverExpandRail', 'localChatSearchOnly', 'legacyCommercialArchiveFence', 'accessMilestonesDisabled', 'cityFirstFrameShield', 'cityCommandDeckOverflowContainment']) {
    if (controls[key] !== true) errors.push(`W487 required source control missing: ${key}.`);
  }
  for (const key of ['automaticPostingAllowedNow', 'localMediaRuntimeAllowedNow', 'paymentAllowedNow', 'syncAllowedNow', 'iotRemoteControlAllowedNow']) {
    if (controls[key] !== false) errors.push(`W487 inactive capability must remain false: ${key}.`);
  }
  if (!Array.isArray(contract?.releaseEvidenceStillRequired) || contract.releaseEvidenceStillRequired.length < 5) {
    errors.push('W487 must retain an explicit external-evidence queue.');
  }
  return errors;
}
