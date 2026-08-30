/** W357 provider lifecycle and protocol compatibility contract. */
export const W357_PROVIDER_LIFECYCLE_GOVERNANCE_SCHEMA = 'eon.w357-provider-lifecycle-governance.v1';
export const W357_REQUIRED_SOURCES = Object.freeze([
  'assets/js/ai-kernel/eon-provider-protocol-contract.js',
  'assets/js/ai-kernel/eon-model-manifest-lifecycle.js',
  'assets/js/ai-kernel/eon-provider-adapter-registry.js',
  'assets/js/ai-kernel/eon-provider-review-board.js',
  'assets/js/ai-kernel/eon-model-policy-resolver.js',
  'config/w357-provider-lifecycle-governance-contract.mjs',
  'scripts/w357-provider-lifecycle-governance-gate.mjs',
  'tests/unit/w357-provider-lifecycle-governance.test.mjs'
]);
export const W357_FORBIDDEN_RUNTIME_TOKENS = Object.freeze([
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  'WebSocket',
  'modelListFetched: true',
  'providerCallCreated: true',
  'automaticProviderActivation: true',
  'silentModelReplacement: true'
]);
