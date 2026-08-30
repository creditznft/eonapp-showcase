/** W337–W343 local-first feasibility, beta and evidence boundaries. */

export const W337_W343_LOCAL_FIRST_READINESS_SCHEMA = 'eonapp.w337-w343.local-first-readiness.v1';

export const W337_W343_LOCAL_FIRST_READINESS_CONTRACT = Object.freeze({
  schema: W337_W343_LOCAL_FIRST_READINESS_SCHEMA,
  requiredFiles: Object.freeze([
    'assets/js/ai-kernel/eon-local-runner-feasibility.js',
    'assets/js/ai-kernel/eon-provider-review-board.js',
    'assets/js/ai-kernel/eon-direct-manual-submission-proof.js',
    'assets/js/local-first/eon-device-evidence-matrix.js',
    'assets/js/local-first/eon-local-beta-readiness.js',
    'config/w342-evidence-recovery-status.mjs',
    'scripts/w337-w343-local-first-readiness-gate.mjs',
    'tests/unit/w337-w343-local-first-readiness.test.mjs'
  ]),
  forbiddenPatterns: Object.freeze([
    'fetch(', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'navigator.serviceWorker.register', 'window.open(', 'eth_sendTransaction', 'eth_sendRawTransaction', 'localStorage.', 'sessionStorage.'
  ]),
  expectedTruth: Object.freeze({
    backgroundRunnerShipped: false,
    cloudRelay: false,
    hardcodedModels: false,
    oauthInitiated: false,
    remoteTelemetryCreated: false,
    commercialFeaturesAllowed: false
  })
});
