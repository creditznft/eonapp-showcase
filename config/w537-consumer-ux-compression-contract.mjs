/** W537 — consumer UX compression for Profile and Capsule. */
export const W537_CONSUMER_UX_COMPRESSION_CONTRACT = Object.freeze({
  wave: 'W537',
  schema: 'eonapp.consumer-ux-compression.v1',
  sourceOnly: true,
  profile: Object.freeze({
    selectedPanelDesktop: true,
    mobileAccordion: true,
    vaultSeparate: true,
    sections: Object.freeze([
      'profile-general',
      'profile-account-backup',
      'profile-voice-language',
      'profile-device-app',
      'profile-privacy',
      'profile-sharing'
    ])
  }),
  capsule: Object.freeze({
    defaultPrimaryActions: Object.freeze(['create-capsule', 'restore-capsule']),
    optionalCollapsedCard: 'google-drive',
    advancedRecoveryCollapsed: true,
    advancedRecoveryIncludes: Object.freeze([
      'move-workspace',
      'inspect-first-restore-rules',
      'capsule-exclusions',
      'technical-detail'
    ])
  }),
  prohibited: Object.freeze([
    'automatic backup',
    'automatic sync',
    'automatic restore',
    'wallet export',
    'payment activation',
    'reward or referral activation'
  ])
});
