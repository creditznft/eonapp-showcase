/** W391D — direct referral attribution preparation, disabled by default. */
export const W391D_RELAY_TRACKING_CONTRACT = Object.freeze({
  sourceOnly: true,
  defaultRollout: 'disabled',
  dedicatedBinding: 'EON_RELAY_DB',
  requiredSecret: 'EON_RELAY_TOKEN_PEPPER',
  requiresSignedInInviter: true,
  requiresSignedInInvitee: true,
  explicitInviteCreation: true,
  explicitAttributionAcceptance: true,
  automaticClickTracking: false,
  storesRawInviteCode: false,
  storesIpAddress: false,
  storesDeviceFingerprint: false,
  storesEmail: false,
  grantsEnabled: false,
  financialValue: false,
  prohibitedLegacyBindings: Object.freeze(['EONAPP_REFERRALS_DB', 'REFERRALS_DB'])
});

export function validateW391DRelayTrackingContract(contract = W391D_RELAY_TRACKING_CONTRACT) {
  const errors = [];
  for (const [key, expected] of Object.entries({ sourceOnly: true, defaultRollout: 'disabled', dedicatedBinding: 'EON_RELAY_DB', requiredSecret: 'EON_RELAY_TOKEN_PEPPER', requiresSignedInInviter: true, requiresSignedInInvitee: true, explicitInviteCreation: true, explicitAttributionAcceptance: true, automaticClickTracking: false, storesRawInviteCode: false, storesIpAddress: false, storesDeviceFingerprint: false, storesEmail: false, grantsEnabled: false, financialValue: false })) {
    if (contract?.[key] !== expected) errors.push(`Relay tracking contract mismatch: ${key}.`);
  }
  return Object.freeze(errors);
}
