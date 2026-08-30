/** RT91 — one source-safe layout contract for modal/HUD surface ownership. */
import { deriveEonCityL95HudSafeZone } from '../l95/eon-city-l95-hud-safe-zone.js';
import { buildEonCityW756ExperiencePlan } from '../w756/eon-city-w756-onboarding-navigation-accessibility.js';
import { getEonCityOverlayCoordinatorTruth } from '../eon-city-overlay-coordinator.js';

export const EON_CITY_RT91_SURFACE_SAFETY_SCHEMA = 'eon.city.surface-safety.rt91.v1';
const freeze = Object.freeze;

export function buildEonCityRt91SurfaceSafety({ width = 1280, height = 720, coarsePointer = false, modalOpen = false } = {}) {
  const profile = { id: coarsePointer || width <= 620 ? (height > width ? 'mobile-portrait' : 'mobile-landscape') : width < 1024 ? 'desktop-compact' : 'desktop-standard', width, height };
  const safeZone = deriveEonCityL95HudSafeZone(profile);
  const experience = buildEonCityW756ExperiencePlan({ width, height, coarsePointer });
  const overlay = getEonCityOverlayCoordinatorTruth();
  return freeze({
    schema: EON_CITY_RT91_SURFACE_SAFETY_SCHEMA,
    viewport: freeze({ width: safeZone.width, height: safeZone.height, shortLandscape: safeZone.shortLandscape, portrait: safeZone.portrait }),
    safeZone,
    modalOpen: Boolean(modalOpen),
    modalPolicy: freeze({
      oneVisibleModal: overlay.oneVisibleModal,
      oneFocusOwner: overlay.focusTrap,
      gameplayInputCleared: overlay.gameplayInputCleared,
      escapeClosesVisibleDialog: overlay.escapeUsesVisibleCloseAction,
      focusRestored: overlay.focusReturnsToTriggerOrCanvas,
      competingHudHidden: overlay.hidesCompetingHudWhileModalOpen
    }),
    hudPolicy: freeze({
      minimumControlPx: Math.max(48, experience.mobile.minimumTouchTargetPx),
      maxPersistentWorldLabels: experience.navigation.maxWorldLabels,
      oneInteractionCard: experience.navigation.oneInteractionCard,
      multipleBottomRightFloatOwnersAllowed: safeZone.multipleBottomRightFloatOwnersAllowed,
      primaryActionOcclusionAllowed: safeZone.composerOrPrimaryActionOcclusionAllowed,
      safeAreas: experience.mobile.safeAreas,
      overflowFailSafeRequired: safeZone.shortLandscape
    }),
    automaticNavigation: false,
    automaticFullscreen: false,
    automaticOrientationLock: false,
    ownsDomLifecycle: false,
    ownsRenderLoop: false
  });
}

export function validateEonCityRt91SurfaceSafety(plan = buildEonCityRt91SurfaceSafety()) {
  const errors = [];
  if (plan.schema !== EON_CITY_RT91_SURFACE_SAFETY_SCHEMA) errors.push('schema');
  if (!plan.modalPolicy?.oneVisibleModal || !plan.modalPolicy?.oneFocusOwner || !plan.modalPolicy?.gameplayInputCleared || !plan.modalPolicy?.focusRestored) errors.push('modal-ownership');
  if ((plan.hudPolicy?.minimumControlPx || 0) < 48 || plan.hudPolicy?.maxPersistentWorldLabels !== 3 || !plan.hudPolicy?.oneInteractionCard) errors.push('hud');
  if (plan.hudPolicy?.multipleBottomRightFloatOwnersAllowed || plan.hudPolicy?.primaryActionOcclusionAllowed) errors.push('collision');
  if (plan.automaticNavigation || plan.automaticFullscreen || plan.automaticOrientationLock || plan.ownsDomLifecycle || plan.ownsRenderLoop) errors.push('authority');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export default freeze({ EON_CITY_RT91_SURFACE_SAFETY_SCHEMA, buildEonCityRt91SurfaceSafety, validateEonCityRt91SurfaceSafety });
