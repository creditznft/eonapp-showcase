/** W390/W391 source foundation contract. */
export const W390_W391_COLLECTION_RELAY_CONTRACT = Object.freeze({
  waves: Object.freeze(['W390A', 'W390B', 'W391A', 'W391B', 'W391C']),
  collectionEnabled: false,
  relayEnabled: false,
  deterministicOnly: true,
  noFinancialValue: true,
  noTransfer: true,
  noInviteCreation: true,
  noGrantCreation: true,
  requiredDatabases: Object.freeze(['EON_RELAY_DB']),
  requiredMigrations: Object.freeze(['relay/migrations/0001_eon_relay_pilot.sql']),
  requiredManualProof: Object.freeze(['google-testing-proof', 'encrypted-recovery-proof', 'legal-packet', 'abuse-review', 'human-release-signoff'])
});

export function validateW390W391CollectionRelayContract(contract = W390_W391_COLLECTION_RELAY_CONTRACT) {
  const errors = [];
  if (!Array.isArray(contract?.waves) || contract.waves.length !== 5) errors.push('Collection/Relay wave list is invalid.');
  for (const [key, expected] of Object.entries({ collectionEnabled: false, relayEnabled: false, deterministicOnly: true, noFinancialValue: true, noTransfer: true, noInviteCreation: true, noGrantCreation: true })) if (contract?.[key] !== expected) errors.push(`Collection/Relay boundary mismatch: ${key}.`);
  if (!Array.isArray(contract?.requiredDatabases) || !contract.requiredDatabases.includes('EON_RELAY_DB')) errors.push('Relay database contract is incomplete.');
  return Object.freeze(errors);
}
