/** W321–W327 source contract — Creator Suite 2 inside Workspace only. */
export const W321_W327_CREATOR_SUITE_CONTRACT = Object.freeze({
  schema: 'eonapp.w321-w327.creator-suite-contract.v1',
  requiredFiles: Object.freeze([
    'assets/js/creator-suite-2/creator-suite-2-engine.js',
    'assets/js/creator-suite-2/creator-suite-2-workspace.js'
  ]),
  forbiddenPatterns: Object.freeze([
    'localStorage.',
    'sessionStorage.',
    'fetch(',
    'XMLHttpRequest',
    'WebSocket',
    'window.open(',
    'location.assign(',
    'oauth',
    'token='
  ]),
  expectedTruth: Object.freeze({
    canonicalSurface: 'Workspace',
    providerGeneration: false,
    upload: false,
    schedule: false,
    publish: false,
    durableEncryptedSave: false,
    exportRequiresUserAction: true
  })
});
