/** W400C + W423 — compact, guest-first Google identity entry contract. */
export const W400C_GOOGLE_IDENTITY_ENTRY_CONTRACT = Object.freeze({
  sourceOnly: true,
  topLevelGuestAction: true,
  automaticGuestSignInCard: true,
  directOauthFromHeader: false,
  simpleSignInModalRequired: true,
  profileAcknowledgementRequired: false,
  guestModeAvailable: true,
  guestContinuationButton: false,
  publicRolloutClaimed: false,
  prohibited: Object.freeze(['google-secret', 'client-secret', 'localStorage-token', 'direct-header-oauth', 'forced-profile-signin', 'backup-ack-gate', 'continue-as-guest-button'])
});

export function validateW400CGoogleIdentityEntryContract(contract = W400C_GOOGLE_IDENTITY_ENTRY_CONTRACT) {
  const errors = [];
  for (const [key, expected] of Object.entries({ sourceOnly: true, topLevelGuestAction: true, automaticGuestSignInCard: true, directOauthFromHeader: false, simpleSignInModalRequired: true, profileAcknowledgementRequired: false, guestModeAvailable: true, guestContinuationButton: false, publicRolloutClaimed: false })) {
    if (contract?.[key] !== expected) errors.push(`Identity entry contract mismatch: ${key}.`);
  }
  return Object.freeze(errors);
}
