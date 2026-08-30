/** W370 — My Realm visual profile contract. */
export const W370_MY_REALM_VISUAL_PROFILE_CONTRACT = Object.freeze({
  wave: 'W370',
  schema: 'eonapp.w370.my-realm-visual-profile-contract.v1',
  route: '/realm-studio',
  localFields: Object.freeze(['realmId', 'theme', 'landmark', 'companion', 'atmosphere', 'projectDisplay', 'updatedAt']),
  backup: Object.freeze({ encrypted: true, localDownloadOnly: true, passphraseStored: false, contains: 'realm-visual-profile-only' }),
  truthRules: Object.freeze({
    localOnly: true,
    publicPublishingActive: false,
    globalHandleRegistry: false,
    cloudSyncActive: false,
    marketplace: false,
    wallet: false,
    payment: false,
    backupIncludesChat: false,
    backupIncludesVault: false,
    backupIncludesProviderKeys: false,
    backupIncludesFiles: false
  }),
  evidence: Object.freeze({
    sourceGateIsNotBrowserBackupProof: true,
    requiresLaterBrowserExportImportProof: true,
    requiresLaterAccessibilityReview: true,
    requiresLaterAssetIntegrationProof: true
  })
});

export function validateW370MyRealmVisualProfileContract() {
  const errors = [];
  const rules = W370_MY_REALM_VISUAL_PROFILE_CONTRACT.truthRules;
  if (!rules.localOnly || rules.publicPublishingActive || rules.globalHandleRegistry || rules.cloudSyncActive) errors.push('W370 must keep Realm visual configuration local and non-public.');
  if (rules.marketplace || rules.wallet || rules.payment || rules.backupIncludesChat || rules.backupIncludesVault || rules.backupIncludesProviderKeys || rules.backupIncludesFiles) errors.push('W370 backup or visual profile boundary includes prohibited data.');
  if (!W370_MY_REALM_VISUAL_PROFILE_CONTRACT.backup.encrypted || !W370_MY_REALM_VISUAL_PROFILE_CONTRACT.backup.localDownloadOnly || W370_MY_REALM_VISUAL_PROFILE_CONTRACT.backup.passphraseStored) errors.push('W370 encrypted backup rules are incomplete.');
  return errors;
}
