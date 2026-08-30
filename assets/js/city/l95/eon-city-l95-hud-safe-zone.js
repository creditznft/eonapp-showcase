/**
 * L95-W08 — one responsive ownership contract for the City playfield HUD.
 *
 * This module does not own gameplay, overlays or work state. It publishes a
 * bounded set of CSS variables so movement, contextual actions, Quick Command
 * and objective/status UI never compete for the same phone-sized pixels.
 */
export const EON_CITY_L95_HUD_SAFE_ZONE_SCHEMA = 'eon.city.launch95.hud-safe-zone.v1';

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, finite(value, min)));

export function deriveEonCityL95HudSafeZone(profile = {}) {
  const id = String(profile?.id || profile?.profileId || 'desktop-standard').toLowerCase();
  const width = Math.max(240, finite(profile?.width, 1280));
  const height = Math.max(280, finite(profile?.height, 720));
  const mobile = id.startsWith('mobile-') || width <= 620;
  const portrait = id === 'mobile-portrait' || height > width;
  const shortLandscape = !portrait && height <= 540;
  const tablet = id === 'tablet-portrait';
  const compact = mobile || tablet || id === 'desktop-compact';

  // RT96: the active mobile movement surface is the analogue joystick, not the
  // retired four-button D-pad. Reserve its maintained CSS footprint so nearby
  // prompts/actions never overlap the left-thumb control.
  const movementFootprint = mobile ? (shortLandscape ? 108 : 116) : 0;
  const edge = mobile ? 8 : compact ? 10 : 12;
  const movementBottom = mobile ? edge : 12;
  const actionBottom = mobile ? edge : 12;
  const quickBottom = mobile ? actionBottom + 58 : 84;
  const contextualBottom = mobile ? movementBottom + movementFootprint + 10 : 84;
  const objectiveTop = mobile ? (shortLandscape ? 58 : 66) : 112;
  const topActionMode = mobile ? 'compact' : tablet ? 'compact' : 'full';

  return freeze({
    schema: EON_CITY_L95_HUD_SAFE_ZONE_SCHEMA,
    id: mobile ? (portrait ? 'mobile-portrait-safe' : 'mobile-landscape-safe') : tablet ? 'tablet-safe' : compact ? 'desktop-compact-safe' : 'desktop-safe',
    viewportProfileId: id,
    width: Math.round(width),
    height: Math.round(height),
    mobile,
    portrait,
    shortLandscape,
    compact,
    controlSize: 48,
    movementFootprint,
    movementControl: mobile ? 'analog-joystick' : 'keyboard-pointer',
    cameraLookSurface: mobile ? 'canvas-right-field' : 'canvas',
    simultaneousMoveLookAllowed: mobile,
    browserPanZoomAllowed: false,
    movementBottom,
    actionBottom,
    quickBottom,
    contextualBottom,
    objectiveTop,
    topActionMode,
    composerOrPrimaryActionOcclusionAllowed: false,
    multipleBottomRightFloatOwnersAllowed: false
  });
}

function setCssPx(style, name, value) {
  style?.setProperty?.(name, `${Math.round(clamp(value, 0, 1200))}px`);
}

export function applyEonCityL95HudSafeZone({ productRoot = null, documentRef = globalThis.document, profile = {} } = {}) {
  const zone = deriveEonCityL95HudSafeZone(profile);
  const targetStyle = productRoot?.style;
  if (productRoot?.dataset) {
    productRoot.dataset.eonCityHudSafeZone = EON_CITY_L95_HUD_SAFE_ZONE_SCHEMA;
    productRoot.dataset.eonCityHudLayout = zone.id;
    productRoot.dataset.eonCityHudTopActions = zone.topActionMode;
    productRoot.dataset.eonCityHudMovementControl = zone.movementControl;
    productRoot.dataset.eonCityHudCameraLookSurface = zone.cameraLookSurface;
    productRoot.dataset.eonCityHudSimultaneousMoveLook = zone.simultaneousMoveLookAllowed ? 'true' : 'false';
  }
  setCssPx(targetStyle, '--eon-city-l95-movement-bottom', zone.movementBottom);
  setCssPx(targetStyle, '--eon-city-l95-action-bottom', zone.actionBottom);
  setCssPx(targetStyle, '--eon-city-l95-contextual-bottom', zone.contextualBottom);
  setCssPx(targetStyle, '--eon-city-l95-objective-top', zone.objectiveTop);
  setCssPx(targetStyle, '--eon-city-l95-control-size', zone.controlSize);

  const body = documentRef?.body || null;
  if (body?.dataset) body.dataset.eonCityHudLayout = zone.id;
  setCssPx(body?.style, '--eon-city-l95-quick-bottom', zone.quickBottom);
  setCssPx(body?.style, '--eon-city-l95-contextual-bottom', zone.contextualBottom);
  return zone;
}

export function clearEonCityL95HudSafeZone({ productRoot = null, documentRef = globalThis.document } = {}) {
  if (productRoot?.dataset?.eonCityHudSafeZone === EON_CITY_L95_HUD_SAFE_ZONE_SCHEMA) {
    delete productRoot.dataset.eonCityHudSafeZone;
    delete productRoot.dataset.eonCityHudLayout;
    delete productRoot.dataset.eonCityHudTopActions;
    delete productRoot.dataset.eonCityHudMovementControl;
    delete productRoot.dataset.eonCityHudCameraLookSurface;
    delete productRoot.dataset.eonCityHudSimultaneousMoveLook;
  }
  for (const name of ['--eon-city-l95-movement-bottom', '--eon-city-l95-action-bottom', '--eon-city-l95-contextual-bottom', '--eon-city-l95-objective-top', '--eon-city-l95-control-size']) {
    productRoot?.style?.removeProperty?.(name);
  }
  const body = documentRef?.body || null;
  if (body?.dataset?.eonCityHudLayout) delete body.dataset.eonCityHudLayout;
  body?.style?.removeProperty?.('--eon-city-l95-quick-bottom');
  body?.style?.removeProperty?.('--eon-city-l95-contextual-bottom');
}

export default freeze({
  EON_CITY_L95_HUD_SAFE_ZONE_SCHEMA,
  deriveEonCityL95HudSafeZone,
  applyEonCityL95HudSafeZone,
  clearEonCityL95HudSafeZone
});
