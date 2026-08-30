/** W399 pre-launch source audit. */
export const W399_PRELAUNCH_AUDIT_CONTRACT = Object.freeze({
  wave: 'W399',
  sourceCandidateOnly: true,
  productionCertified: false,
  requiredScripts: Object.freeze([
    'verify:w397-release-candidate',
    'qa:w519-legacy-transport-quarantine',
    'qa:w406-w407-action-gateway',
    'qa:w388b-w389-connectors-deployment',
    'qa:w398-w399-creator-pilot-measurement'
  ]),
  inactiveUntilProof: Object.freeze([
    'collection-grants', 'legacy-transport-and-control', 'social-oauth-and-direct-posting',
    'github-and-cloudflare-user-deployment', 'cloud-media-or-automatic-sync'
  ])
});

export function validateW399PrelaunchAuditContract(contract = W399_PRELAUNCH_AUDIT_CONTRACT) {
  const errors = [];
  if (contract?.wave !== 'W399' || contract?.sourceCandidateOnly !== true || contract?.productionCertified !== false) errors.push('W399 source/production truth is invalid.');
  if (!Array.isArray(contract?.requiredScripts) || contract.requiredScripts.length < 5) errors.push('W399 required script list is incomplete.');
  return Object.freeze(errors);
}
