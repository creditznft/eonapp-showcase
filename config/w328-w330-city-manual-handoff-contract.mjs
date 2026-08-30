/** W328–W330 — City parity and user-controlled manual handoff contract. */
export const W328_W330_CITY_MANUAL_HANDOFF_CONTRACT = Object.freeze({
  schema: 'eonapp.w328-w330.city-manual-handoff-contract.v1',
  requiredFiles: Object.freeze([
    'assets/js/ai-kernel/eon-city-event-bridge.js',
    'assets/js/operator/agent-presence.js',
    'assets/js/eon-city-play-station.js',
    'assets/js/eon-city-3d-station.js',
    'assets/js/eon-operator-map.js',
    'assets/js/eon-workspace-pages.js',
    'assets/js/creator-suite-2/creator-suite-2-workspace.js'
  ]),
  forbiddenPatterns: Object.freeze([
    'fetch(', 'XMLHttpRequest', 'WebSocket', 'window.open(', 'location.assign(', 'oauth', 'authorization:'
  ]),
  expectedTruth: Object.freeze({
    citySource: 'eon-ai-kernel',
    cityCanApprove: false,
    cityCanExecute: false,
    manualSubmissionOnly: true,
    providerCall: false,
    externalEffect: false
  })
});
