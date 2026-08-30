/** W527 — redacted environment and local-runtime evidence contract. */
export const W527_ENV_LOCAL_AI_SCHEMA = 'eonapp.w527.env-local-ai-evidence.v1';
export const W527_APPROVED_LOOPBACK_HOSTS = Object.freeze(['127.0.0.1', 'localhost', '[::1]', '::1']);
export const W527_LOCAL_AI_PROVIDERS = Object.freeze([
  Object.freeze({ id: 'ollama', env: Object.freeze(['OLLAMA_BASE_URL', 'EON_OLLAMA_BASE_URL']), fallback: 'http://127.0.0.1:11434', path: '/api/tags', kind: 'ollama' }),
  Object.freeze({ id: 'lmstudio', env: Object.freeze(['LMSTUDIO_BASE_URL', 'EON_LMSTUDIO_BASE_URL']), fallback: 'http://127.0.0.1:1234/v1', path: '/models', kind: 'openai-compatible' }),
  Object.freeze({ id: 'jan', env: Object.freeze(['JAN_BASE_URL', 'EON_JAN_BASE_URL']), fallback: 'http://127.0.0.1:1337/v1', path: '/models', kind: 'openai-compatible' })
]);
export const W527_ENV_LOCAL_AI_CONTRACT = Object.freeze({
  wave: 'W527',
  schema: W527_ENV_LOCAL_AI_SCHEMA,
  sourceOnly: true,
  environment: Object.freeze({
    secretValuesAllowedInReceipt: false,
    requiredIgnorePattern: '.env.local',
    allowedOutput: Object.freeze(['present-or-missing', 'configured-or-default', 'provider-id', 'model-count', 'model-list-digest', 'timestamp', 'status'])
  }),
  localAi: Object.freeze({
    loopbackOnly: true,
    userFlagRequiredForProbe: '--probe-loopback',
    noModelMutation: true,
    noPromptByDefault: true,
    unavailableStatus: 'not-detected'
  })
});

export function validateW527EnvLocalAiContract(contract = W527_ENV_LOCAL_AI_CONTRACT) {
  const issues = [];
  if (contract?.schema !== W527_ENV_LOCAL_AI_SCHEMA) issues.push('schema-invalid');
  if (contract?.environment?.secretValuesAllowedInReceipt !== false) issues.push('receipt-secret-boundary-invalid');
  if (contract?.localAi?.loopbackOnly !== true) issues.push('loopback-boundary-invalid');
  if (contract?.localAi?.userFlagRequiredForProbe !== '--probe-loopback') issues.push('explicit-probe-flag-invalid');
  if (contract?.localAi?.noModelMutation !== true) issues.push('model-mutation-boundary-invalid');
  return Object.freeze(issues);
}
