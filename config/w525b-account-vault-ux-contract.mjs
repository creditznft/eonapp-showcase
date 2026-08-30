/** W525B — account, preferences and Vault experience contract. */
export const W525B_ACCOUNT_VAULT_UX_CONTRACT = Object.freeze({
  wave: 'W525B',
  schema: 'eonapp.account-vault-ux.v1',
  sourceOnly: true,
  vault: Object.freeze({
    sections: Object.freeze(['overview', 'recovery', 'backup', 'ai-keys', 'reveals', 'safety']),
    recoveryModel: 'one encrypted user-held Capsule for all eligible local workspace records',
    capsuleCompression: 'not-implemented-and-not-claimed',
    excludedFromCapsule: Object.freeze(['provider keys', 'recovery secrets', 'wallets', 'OAuth sessions', 'raw media', 'unknown storage']),
    visualRevealsSeparate: true
  }),
  profile: Object.freeze({
    sections: Object.freeze(['general', 'account-backup', 'voice-language', 'device-app', 'privacy', 'sharing']),
    signInIsBackup: false,
    driveConnected: false
  }),
  shell: Object.freeze({
    profileHover: 'desktop-fine-pointer-delayed-only',
    touchRequiresTap: true,
    keyboardRequiresFocusOrClick: true
  }),
  prohibited: Object.freeze([
    'automatic backup',
    'automatic multi-device sync',
    'automatic restore',
    'Drive OAuth or upload',
    'provider-key export',
    'Vault Reveal entitlement or marketplace action'
  ])
});
