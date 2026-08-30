/** W309 source contract — sealed expiring local confirmations, never execution. */
export const W309_LOCAL_ACTION_SEAL_CONTRACT = Object.freeze({
  schema: 'eonapp.w309.local-action-seal-contract.v1',
  requiredFiles: Object.freeze(['assets/js/local-first/eon-local-action-seal.js']),
  forbiddenPatterns: Object.freeze([
    'localStorage.',
    'sessionStorage.',
    'fetch(',
    'XMLHttpRequest',
    'WebSocket',
    'window.open(',
    'location.assign('
  ]),
  requiredTruth: Object.freeze({
    immutablePayload: true,
    expiryRequired: true,
    explicitUserConfirmationRequired: true,
    externalExecution: false,
    unattendedScheduling: false,
    directNetwork: false,
    providerOrAccountConnection: false
  })
});
