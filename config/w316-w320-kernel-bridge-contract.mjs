/** W316–W320 source contract — Chat/Workspace/City compatibility bridge. */
export const W316_W320_KERNEL_BRIDGE_CONTRACT = Object.freeze({
  schema: 'eonapp.w316-w320.kernel-bridge-contract.v1',
  requiredFiles: Object.freeze([
    'assets/js/ai-kernel/eon-role-profiles.js',
    'assets/js/ai-kernel/eon-guided-workflow-blueprints.js',
    'assets/js/ai-kernel/eon-ai-kernel-session-store.js',
    'assets/js/ai-kernel/eon-ai-kernel-review-inbox.js',
    'assets/js/ai-kernel/eon-city-event-bridge.js',
    'assets/js/ai-kernel/eon-ai-kernel-bridge.js'
  ]),
  forbiddenPatterns: Object.freeze([
    'localStorage.',
    'fetch(',
    'XMLHttpRequest',
    'WebSocket',
    'window.open(',
    'location.assign(',
    'token=',
    'authorization:'
  ]),
  expectedTruth: Object.freeze({
    foregroundOnly: true,
    externalExecution: false,
    rawPromptStored: false,
    rawOutputStored: false,
    cityCanApprove: false,
    cityCanExecute: false,
    autonomousAgents: false,
    sessionOnly: true
  })
});
