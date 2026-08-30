/**
 * W237 compatibility fence, reconciled for RT97.
 *
 * The legacy automatic Sponsored Discovery/ad-injection layer remains disabled
 * on every protected app surface. RT97 adds one separate, explicit two-step
 * Sponsored Discovery tool inside Local AI/BYOK. That tool does not use this
 * auto-render authority; it is governed by rt97-sponsored-discovery-contract
 * and remains Vexrail/geo/economics fail-closed until the existing Sponsored Vexrail authority admits the reviewed one-turn request.
 */
export const SPONSORED_DISCOVERY_SCHEMA = 'eon.sponsored-discovery-policy.v1';
export const SPONSORED_DISCOVERY_MODE = 'disabled';
export const SPONSORED_DISCOVERY_ACTIVE = false;
export const SPONSORED_DISCOVERY_EXPLICIT_TOOL_AVAILABLE = true;

export const SPONSORED_DISCOVERY_PROTECTED_SURFACES = Object.freeze([
  '/chat',
  '/eoncity',
  '/eoncity/lite',
  '/eoncity/tour',
  '/eoncity/3d',
  '/eoncity/play',
  '/vault',
  '/capsule',
  '/realm-studio',
  '/market',
  '/local-ai',
  '/workspace',
  '/projects',
  '/library',
  '/automations',
  '/trade',
  '/profile'
]);

export const SPONSORED_DISCOVERY_FORBIDDEN_FORMATS = Object.freeze([
  'smartlink',
  'contextual_text_rewrite',
  'affiliate_link_rewrite',
  'sponsored_answer',
  'popup',
  'popunder',
  'interstitial',
  'offerwall',
  'rewarded_ad',
  'auto_redirect',
  'chat_message_injection'
]);

export function canRenderSponsoredDiscovery(surface = '') {
  return Object.freeze({
    ok: false,
    active: false,
    surface: String(surface || ''),
    reason: 'sponsored-discovery-disabled',
    mode: SPONSORED_DISCOVERY_MODE
  });
}

export function getSponsoredDiscoveryStatus() {
  return Object.freeze({
    schema: SPONSORED_DISCOVERY_SCHEMA,
    mode: SPONSORED_DISCOVERY_MODE,
    active: SPONSORED_DISCOVERY_ACTIVE,
    automaticInsertionActive: false,
    explicitToolAvailable: SPONSORED_DISCOVERY_EXPLICIT_TOOL_AVAILABLE,
    explicitToolSurface: '/local-ai',
    explicitToolAuthority: 'eonapp.sponsored-discovery.rt97.v1',
    protectedSurfaces: SPONSORED_DISCOVERY_PROTECTED_SURFACES,
    forbiddenFormats: SPONSORED_DISCOVERY_FORBIDDEN_FORMATS,
    reason: 'Automatic sponsored insertion remains disabled. RT97 permits only the isolated, labelled, review-and-confirm Sponsored Discovery tool on /local-ai; it sends one sanitized signed-in request through the existing server-side Vexrail authority and remains fail-closed.'
  });
}

export default {
  SPONSORED_DISCOVERY_SCHEMA,
  SPONSORED_DISCOVERY_MODE,
  SPONSORED_DISCOVERY_ACTIVE,
  SPONSORED_DISCOVERY_EXPLICIT_TOOL_AVAILABLE,
  SPONSORED_DISCOVERY_PROTECTED_SURFACES,
  SPONSORED_DISCOVERY_FORBIDDEN_FORMATS,
  canRenderSponsoredDiscovery,
  getSponsoredDiscoveryStatus
};
