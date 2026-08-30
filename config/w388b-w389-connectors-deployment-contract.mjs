/** W388B/W389 architecture contract. */
export const W388B_W389_CONNECTORS_DEPLOYMENT_CONTRACT = Object.freeze({
  waves: Object.freeze(['W388B', 'W388C', 'W388D', 'W389']),
  connectorsEnabled: false,
  directPostingEnabled: false,
  tokenStorageEnabled: false,
  githubConnected: false,
  cloudflareDeployEnabled: false,
  nativeShareExportAllowed: true,
  requiredFutureBindings: Object.freeze(['EON_CONNECTORS_DB', 'EON_ACTIONS_DB']),
  requiredMigration: 'connector/migrations/0001_eon_connector_custody.sql'
});

export function validateW388BW389ConnectorsDeploymentContract(contract = W388B_W389_CONNECTORS_DEPLOYMENT_CONTRACT) {
  const errors = [];
  for (const [key, expected] of Object.entries({ connectorsEnabled: false, directPostingEnabled: false, tokenStorageEnabled: false, githubConnected: false, cloudflareDeployEnabled: false, nativeShareExportAllowed: true })) if (contract?.[key] !== expected) errors.push(`Connector/deployment boundary mismatch: ${key}.`);
  if (!Array.isArray(contract?.requiredFutureBindings) || !contract.requiredFutureBindings.includes('EON_CONNECTORS_DB') || !contract.requiredFutureBindings.includes('EON_ACTIONS_DB')) errors.push('Connector/deployment future binding contract is incomplete.');
  return Object.freeze(errors);
}
