/** W310–W315 source contract — provider-neutral local AI kernel foundation. */
export const W310_W315_AI_KERNEL_CONTRACT = Object.freeze({
  schema: 'eonapp.w310-w315.ai-kernel-contract.v1',
  requiredFiles: Object.freeze([
    'assets/js/ai-kernel/eon-task-contract.js',
    'assets/js/ai-kernel/eon-provider-adapter-registry.js',
    'assets/js/ai-kernel/eon-model-manifest.js',
    'assets/js/ai-kernel/eon-model-policy-resolver.js',
    'assets/js/ai-kernel/eon-adapter-contract-lab.js',
    'assets/js/ai-kernel/eon-routing-receipt.js'
  ]),
  forbiddenPatterns: Object.freeze([
    'localStorage.',
    'sessionStorage.',
    'fetch(',
    'XMLHttpRequest',
    'WebSocket',
    'window.open(',
    'location.assign('
  ]),
  expectedTruth: Object.freeze({
    foregroundOnly: true,
    hardcodedModelSelection: false,
    backgroundDiscovery: false,
    hiddenCrossProviderFallback: false,
    localTaskHostedFallback: false,
    adapterCannotBeSupportedWithoutTests: true,
    dataDestinationVisible: true
  })
});
