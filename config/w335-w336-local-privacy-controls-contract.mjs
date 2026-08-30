/** W335–W336 source contract — user-owned local privacy controls. */
export const W335_W336_LOCAL_PRIVACY_CONTROLS_CONTRACT = Object.freeze({
  schema: 'eonapp.w335-w336.local-privacy-controls-contract.v1',
  requiredFiles: Object.freeze([
    'assets/js/local-first/eon-local-privacy-diagnostics.js',
    'assets/js/eon-workspace-pages.js',
    'assets/js/chat/ai-runtime.js',
    'assets/js/utils/chat-threads.js'
  ]),
  forbiddenPatterns: Object.freeze(['fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon(', 'location.assign(', 'window.open(']),
  expectedTruth: Object.freeze({
    directNetwork: false,
    cloudSync: false,
    rawContentRead: false,
    clearRequiresExplicitUserConfirmation: true,
    encryptedVaultChangedByTemporaryClear: false,
    providerKeyChangedByTemporaryClear: false
  })
});
