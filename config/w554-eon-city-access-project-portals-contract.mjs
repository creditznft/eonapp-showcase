/**
 * W649B — authenticated-only EON City entry contract.
 *
 * Product boundary:
 * - The real Babylon EON City has no public-preview mode.
 * - Signed-out `/eoncity` renders a premium static portal only.
 * - Babylon, GLB, City audio and game controls may boot only after the existing
 *   EONAPP identity endpoint confirms a signed-in session.
 * - W649 game binaries remain ordinary same-origin Cloudflare Pages assets.
 *   The browser gate controls boot and bandwidth; it does not claim URL-level
 *   secrecy for static files and does not add a game-specific Function relay.
 */
export const EON_CITY_ACCESS_SCHEMA = 'eon.city.access.w649b.v1';
export const EON_CITY_ACCESS_MODES = Object.freeze(['authenticated-play']);
export const EON_CITY_DEFAULT_ACCESS_MODE = 'authenticated-play';
export const EON_CITY_ACCESS_ROUTE = '/api/city/access';
export const EON_CITY_GOOGLE_LOGIN_ROUTE = '/api/auth/google/start?returnTo=%2Feoncity';
export const EON_CITY_HEAVY_BOOT_MODULE = '/assets/js/city/eon-city-runtime-owner.js';

export function normalizeEonCityAccessMode() {
  return EON_CITY_DEFAULT_ACCESS_MODE;
}

export function buildEonCityAccessDecision({ identityAvailable = false, signedIn = false } = {}) {
  const available = identityAvailable === true;
  const authenticated = available && signedIn === true;
  const accessState = authenticated ? 'authorized' : available ? 'signed-out' : 'identity-unavailable';
  const reason = authenticated
    ? 'City play access is available.'
    : available
      ? 'Sign in with Google to enter the full EON City.'
      : 'Google sign-in is not configured for this deployment yet.';
  return Object.freeze({
    schema: EON_CITY_ACCESS_SCHEMA,
    mode: EON_CITY_DEFAULT_ACCESS_MODE,
    accessState,
    requiresIdentity: true,
    identityAvailable: available,
    signedIn: authenticated,
    canBootFullCity: authenticated,
    loginRoute: EON_CITY_GOOGLE_LOGIN_ROUTE,
    heavyRuntimeImportAllowed: authenticated,
    staticPortalOnly: !authenticated,
    publicPreviewAvailable: false,
    browserGateOnly: true,
    clientFirstStaticAssetDelivery: true,
    pagesFunctionAssetRelayAllowed: false,
    edgeAssetProtectionConfigured: false,
    edgeAssetProtectionRequiredBeforeBinaryArt: false,
    reason,
    dataCustody: 'Google Login is identity only. It does not back up local projects, Vault records, provider keys, City progress, prompts, files, or settings.'
  });
}

export function isEonCityHeavyBootAllowed(decision = {}) {
  return decision?.schema === EON_CITY_ACCESS_SCHEMA
    && decision?.accessState === 'authorized'
    && decision?.heavyRuntimeImportAllowed === true
    && decision?.canBootFullCity === true;
}

export default Object.freeze({
  EON_CITY_ACCESS_SCHEMA,
  EON_CITY_ACCESS_MODES,
  EON_CITY_DEFAULT_ACCESS_MODE,
  EON_CITY_ACCESS_ROUTE,
  EON_CITY_GOOGLE_LOGIN_ROUTE,
  EON_CITY_HEAVY_BOOT_MODULE,
  normalizeEonCityAccessMode,
  buildEonCityAccessDecision,
  isEonCityHeavyBootAllowed
});
