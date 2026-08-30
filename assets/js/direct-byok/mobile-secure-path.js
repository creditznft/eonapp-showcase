/** W626F — fail-closed mobile credential path selection. */
const freeze = Object.freeze;

export function resolveDirectMobilePath({ provider = {}, platform = 'browser', oauthSession = null, nativeWrapper = null, companionReachable = false } = {}) {
  const mobile = ['ios', 'android', 'mobile-browser'].includes(String(platform));
  if (!mobile) return freeze({ allowed: companionReachable === true, path: companionReachable ? 'desktop-companion-loopback' : 'companion-required', permanentBrowserCredentialAllowed: false, reason: companionReachable ? 'owner-companion-ready' : 'owner-companion-not-reachable' });
  if (provider.mobileOAuth === true && oauthSession?.shortLived === true && oauthSession?.expiresAt) return freeze({ allowed: true, path: 'provider-oauth-short-lived', permanentBrowserCredentialAllowed: false, reason: 'provider-oauth-ready' });
  if (nativeWrapper?.signed === true && nativeWrapper?.secureCredentialStore === true && nativeWrapper?.shortLivedSession === true) return freeze({ allowed: true, path: 'signed-native-wrapper', permanentBrowserCredentialAllowed: false, reason: 'signed-wrapper-ready' });
  return freeze({ allowed: false, path: 'guide-or-desktop-companion', permanentBrowserCredentialAllowed: false, reason: 'provider-has-no-proven-safe-mobile-credential-path' });
}

export function getDirectMobileSecurityTruth() {
  return freeze({ ordinaryMobileLocalStorageCredentialsAllowed: false, oauthPreferred: true, shortLivedCredentialsPreferred: true, signedNativeWrapperAcceptedWhenProven: true, unsafeProviderFallback: 'guide-or-desktop-companion', supportedMobileProviderProofComplete: false });
}
