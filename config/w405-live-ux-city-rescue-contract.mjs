/** W405 + W423 — repair contract for a calm Chat shell and sole Babylon City. */
export const W405_LIVE_UX_CITY_RESCUE_CONTRACT = Object.freeze({
  sourceOnly: true,
  canonicalCityPath: '/eoncity',
  legacyCityQuarantined: true,
  chatRailTooltips: true,
  guestSignInVisible: true,
  automaticGuestSignInCard: true,
  simpleGoogleModal: true,
  signInPrivacyLine: true,
  anchoredUtilityPopovers: true,
  focusedKeyboardMovement: false,
  windowKeyboardMovement: true,
  localViewReset: true,
  directHudCalm: true,
  publicThreeCityRoute: false,
  visualCertificationClaimed: false,
  prohibited: Object.freeze(['legacy-realm-cache', 'automatic-oauth', 'unreviewed-binary-art', 'fake-aaa-claim', 'backup-ack-gate', 'public-city-map'])
});

export function validateW405LiveUxCityRescueContract(contract = W405_LIVE_UX_CITY_RESCUE_CONTRACT) {
  const expected = {
    sourceOnly: true,
    canonicalCityPath: '/eoncity',
    legacyCityQuarantined: true,
    chatRailTooltips: true,
    guestSignInVisible: true,
    automaticGuestSignInCard: true,
    simpleGoogleModal: true,
    signInPrivacyLine: true,
    anchoredUtilityPopovers: true,
    focusedKeyboardMovement: false,
    windowKeyboardMovement: true,
    localViewReset: true,
    directHudCalm: true,
    publicThreeCityRoute: false,
    visualCertificationClaimed: false
  };
  const errors = [];
  for (const [key, value] of Object.entries(expected)) {
    if (contract?.[key] !== value) errors.push(`W405 contract mismatch: ${key}.`);
  }
  return Object.freeze(errors);
}
