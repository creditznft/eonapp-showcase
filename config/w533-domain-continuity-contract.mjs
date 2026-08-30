/** W533 — explicit-domain move contract. A Capsule is a manual user-held file, never cross-origin storage sharing. */
export const W533_DOMAIN_CONTINUITY_SCHEMA = 'eonapp.w533.domain-continuity.v1';
export const W533_CANONICAL_APP_ORIGIN = 'https://eonapp.ch';
export const W533_TRUST_HUB_ORIGIN = 'https://eon.hub';
export const W533_DOMAIN_CONTINUITY_CONTRACT = Object.freeze({
  wave: 'W533',
  schema: W533_DOMAIN_CONTINUITY_SCHEMA,
  canonicalOrigin: W533_CANONICAL_APP_ORIGIN,
  trustHubOrigin: W533_TRUST_HUB_ORIGIN,
  transferMode: 'explicit-user-held-encrypted-capsule-only',
  prohibited: Object.freeze([
    'cross-origin-browser-storage-read',
    'automatic-domain-sync',
    'silent-capsule-upload',
    'automatic-restore',
    'trust-hub-capsule-import'
  ]),
  userSteps: Object.freeze([
    'create-one-encrypted-capsule',
    'keep-file-and-passphrase-separate',
    'open-the-reviewed-eonapp-origin',
    'inspect-no-values-restore-plan',
    'choose-records-and-confirm-explicitly'
  ])
});

export function validateW533DomainContinuityContract(contract = W533_DOMAIN_CONTINUITY_CONTRACT) {
  const issues = [];
  if (contract?.schema !== W533_DOMAIN_CONTINUITY_SCHEMA) issues.push('schema-invalid');
  if (contract?.canonicalOrigin !== W533_CANONICAL_APP_ORIGIN) issues.push('canonical-origin-invalid');
  if (contract?.transferMode !== 'explicit-user-held-encrypted-capsule-only') issues.push('transfer-mode-invalid');
  for (const blocked of ['cross-origin-browser-storage-read', 'automatic-domain-sync', 'silent-capsule-upload', 'automatic-restore']) {
    if (!contract?.prohibited?.includes(blocked)) issues.push(`missing-prohibition:${blocked}`);
  }
  return Object.freeze(issues);
}
