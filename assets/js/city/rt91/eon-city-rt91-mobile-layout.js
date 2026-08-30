/** RT91 — source-safe mobile/short-landscape layout acceptance projection. */
import { deriveEonCityL95HudSafeZone } from '../l95/eon-city-l95-hud-safe-zone.js';
import { buildEonCityW756ExperiencePlan } from '../w756/eon-city-w756-onboarding-navigation-accessibility.js';

export const EON_CITY_RT91_MOBILE_LAYOUT_SCHEMA = 'eon.city.mobile-layout.rt91.v1';
const freeze = Object.freeze;

export function buildEonCityRt91MobileLayout({ width = 844, height = 390, coarsePointer = true } = {}) {
  const profileId = height > width ? 'mobile-portrait' : 'mobile-landscape';
  const safeZone = deriveEonCityL95HudSafeZone({ id: profileId, width, height });
  const experience = buildEonCityW756ExperiencePlan({ width, height, coarsePointer });
  return freeze({
    schema: EON_CITY_RT91_MOBILE_LAYOUT_SCHEMA,
    width: safeZone.width,
    height: safeZone.height,
    portrait: safeZone.portrait,
    shortLandscape: safeZone.shortLandscape,
    minimumTouchTargetPx: Math.max(safeZone.controlSize, experience.mobile.minimumTouchTargetPx),
    dockPresentation: safeZone.portrait ? experience.mobile.portraitDock : experience.mobile.landscapeDock,
    openWorldCardPeerCount: 3,
    collapseLongWorldCopyOnShortLandscape: safeZone.shortLandscape,
    buttonsMustRemainVisible: true,
    safeScrollingRequired: true,
    horizontalOverflowAllowed: false,
    topRightControlCollisionAllowed: false,
    safeAreas: true,
    automaticFullscreen: false,
    automaticOrientationLock: false,
    ownsLayoutRuntime: false
  });
}

export function validateEonCityRt91MobileLayout(plan = buildEonCityRt91MobileLayout()) {
  const errors = [];
  if (plan.schema !== EON_CITY_RT91_MOBILE_LAYOUT_SCHEMA) errors.push('schema');
  if ((plan.minimumTouchTargetPx || 0) < 48 || plan.openWorldCardPeerCount !== 3 || !plan.buttonsMustRemainVisible || !plan.safeScrollingRequired) errors.push('usability');
  if (plan.horizontalOverflowAllowed || plan.topRightControlCollisionAllowed || plan.automaticFullscreen || plan.automaticOrientationLock || plan.ownsLayoutRuntime) errors.push('safety');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export default freeze({ EON_CITY_RT91_MOBILE_LAYOUT_SCHEMA, buildEonCityRt91MobileLayout, validateEonCityRt91MobileLayout });
