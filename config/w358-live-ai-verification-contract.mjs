/** W358 — live AI operator proof contract. */
export const W358_LIVE_AI_VERIFICATION_CONTRACT = Object.freeze({
  schema: 'eonapp.w358-live-ai-verification.v1',
  localEnvOnly: true,
  outboundCallsRequireExplicitConfirm: true,
  hardcodedModelFallback: false,
  modelSelection: Object.freeze(['direct-user-discovery', 'explicit-operator-model-env']),
  directProviderOnly: true,
  cloudRelayAllowed: false,
  browserKeyStorage: 'session-only',
  rawKeysInReport: false,
  rawPromptsInReport: false,
  rawResponsesInReport: false,
  sourceOfTruth: 'operator-run-local-evidence',
  deploymentGate: 'does-not-approve-deployment-by-itself'
});
