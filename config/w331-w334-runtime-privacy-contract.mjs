/** W331–W334 source contract — explicit runtime selection and local privacy hardening. */
export const W331_W334_RUNTIME_PRIVACY_CONTRACT = Object.freeze({
  schema: 'eonapp.w331-w334.runtime-privacy-contract.v1',
  requiredFiles: Object.freeze([
    'assets/js/chat/ai-runtime.js',
    'assets/js/chat-page.js',
    'assets/js/utils/chat-threads.js',
    'assets/js/ai-kernel/eon-ai-kernel-bridge.js',
    'assets/js/ai-kernel/eon-command-intake.js',
    'config/w303-legacy-salvage-manifest.json'
  ]),
  canonicalSurfaces: Object.freeze([
    'assets/js/chat-page.js',
    'assets/js/chat/ai-runtime.js',
    'assets/js/eon-workspace-pages.js',
    'assets/js/ai-kernel/eon-ai-kernel-bridge.js'
  ]),
  legacyRuntimeModules: Object.freeze([
    'assets/js/utils/eon-auto-router.js',
    'assets/js/agents/agent-executor.js',
    'assets/js/agents/agent-orchestrator.js',
    'assets/js/agents/mission-engine.js',
    'assets/js/agents/provider-orchestrator.js',
    'platform-backend'
  ]),
  expectedTruth: Object.freeze({
    routing: 'explicit-provider-and-model',
    providerFallback: 'none',
    rawChatThreadStorage: 'session-only',
    modelManifestStorage: 'session-only',
    legacyPlaintextCleanup: 'explicit-user-action',
    canonicalLegacyExecutorImports: 0,
    cloudSync: false,
    externalExecution: false
  })
});
