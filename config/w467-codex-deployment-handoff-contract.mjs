/** W467 — reproducible Codex deployment-handoff contract. */
export const W467_CODEX_DEPLOYMENT_HANDOFF_CONTRACT = Object.freeze({
  wave: 'W467',
  schema: 'eon.release.codex-deployment-handoff.w467.v1',
  sourceOnly: true,
  canonicalRoutes: Object.freeze(['/', '/eoncity', '/insights']),
  requiredLocalCommands: Object.freeze([
    'npm ci',
    'npm run verify:w449-w467-source-foundations',
    'npm run security:secret-scan:ci -- --allow-no-history'
  ]),
  requiredPostDeployCommands: Object.freeze([
    'node scripts/w453a-production-city-edge-proof.mjs --base-url https://eonapp.ch --confirm-network --out artifacts/w453a-production-city-edge-proof.json',
    'node scripts/w458a-sync-basic-status-proof.mjs --origin=https://eonapp.ch --allow-network',
    'node scripts/w461-telegram-research-production-proof.mjs --origin=https://eonapp.ch --allow-network --out artifacts/w461-telegram-research-production-proof.json'
  ]),
  requiredEvidenceRows: Object.freeze([
    'sourceValidation',
    'cloudflareDeployment',
    'cityEdgeProof',
    'telegramResearchEdgeProof',
    'syncBasicProof',
    'browserAndDeviceProof',
    'legacyQuarantineProof',
    'merchantCommercialStatus',
    'humanGoNoGo'
  ]),
  excludedFromSourceBundle: Object.freeze(['.env', '.env.local', 'node_modules', 'dist', '.git', 'browser profiles', 'customer data', 'D1 exports', 'provider payloads', 'tokens', 'secrets']),
  boundaries: Object.freeze({
    deploymentPerformedByScript: false,
    sourceBundleApprovesRelease: false,
    sourceBundleApprovesCommerce: false,
    sourceBundleContainsSecrets: false
  })
});

export function validateW467CodexDeploymentHandoffContract(contract = W467_CODEX_DEPLOYMENT_HANDOFF_CONTRACT) {
  const issues = [];
  if (contract?.wave !== 'W467' || contract?.schema !== 'eon.release.codex-deployment-handoff.w467.v1') issues.push('w467-identity-invalid');
  if (contract?.sourceOnly !== true) issues.push('w467-must-remain-source-only');
  if (!Array.isArray(contract?.canonicalRoutes) || contract.canonicalRoutes.join(',') !== '/,/eoncity,/insights') issues.push('w467-canonical-routes-invalid');
  if (!Array.isArray(contract?.requiredLocalCommands) || contract.requiredLocalCommands.length < 3) issues.push('w467-local-command-set-incomplete');
  if (!Array.isArray(contract?.requiredPostDeployCommands) || contract.requiredPostDeployCommands.length < 3) issues.push('w467-post-deploy-command-set-incomplete');
  if (!Array.isArray(contract?.requiredEvidenceRows) || contract.requiredEvidenceRows.length < 8) issues.push('w467-evidence-row-set-incomplete');
  for (const [key, expected] of Object.entries(W467_CODEX_DEPLOYMENT_HANDOFF_CONTRACT.boundaries)) {
    if (contract?.boundaries?.[key] !== expected) issues.push(`w467-boundary-invalid:${key}`);
  }
  return Object.freeze(issues);
}
