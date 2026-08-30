/**
 * W607 — EON City gameplay interaction and control contract.
 *
 * This module is renderer-independent. It gives the Babylon runtime one
 * unambiguous screen-relative movement convention and one bounded landmark
 * approach contract. It never opens routes, starts work, records telemetry,
 * requests a microphone, or performs network activity.
 */
export const EON_CITY_GAMEPLAY_CONTRACT_SCHEMA = 'eon.city.gameplay-contract.w607.v1';

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value, digits = 4) => Number(Number(value).toFixed(digits));

export const EON_CITY_DIRECT_HUD_ACTIONS = freeze([
  freeze({ id: 'command-room', label: 'Command Room', kind: 'primary-cockpit' }),
  freeze({ id: 'eonbot', label: 'EONBOT', kind: 'companion' }),
  freeze({ id: 'districts', label: 'Districts', kind: 'world-map' }),
  freeze({ id: 'menu', label: 'Menu', kind: 'controls-and-settings' })
]);

export const EON_CITY_INPUT_CHANNELS = freeze([
  'keyboard', 'mouse', 'touch', 'controller', 'pointer-look', 'click-to-move'
]);

export const EON_CITY_CONTROL_CONVENTION = freeze({
  schema: `${EON_CITY_GAMEPLAY_CONTRACT_SCHEMA}.control-convention.w618a`,
  leftRightInverted: false,
  positiveStrafeMeans: 'screen-right',
  negativeStrafeMeans: 'screen-left',
  forwardMeans: 'toward-the-current-camera-target-on-the-ground-plane',
  clickToMoveDefaultForDirectCity: true,
  landmarkClickDefault: true,
  quickOpenStillRequiresVisibleReview: true,
  localOnly: true,
  remoteNetwork: false
});

function normalize2d(vector = {}) {
  const x = clamp(finite(vector.x), -1, 1);
  const z = clamp(finite(vector.z), -1, 1);
  const length = Math.hypot(x, z);
  if (!length) return freeze({ x: 0, z: 0, length: 0 });
  return freeze({ x: round(length > 1 ? x / length : x), z: round(length > 1 ? z / length : z), length: round(Math.min(1, length)) });
}

function inputCandidate(value = {}) {
  const normalized = normalize2d(value);
  return freeze({ strafe: normalized.x, forward: normalized.z, active: normalized.length > 0.001 });
}

/**
 * Selects a complete input source, rather than mixing axes from keyboard,
 * touch and controller. This prevents diagonal/reversed-feeling motion when a
 * released device leaves a tiny stale axis value behind.
 */
export function resolveEonCityInputIntent({ keyboard = {}, touch = {}, controller = {} } = {}) {
  const candidates = [
    freeze({ source: 'keyboard', ...inputCandidate(keyboard) }),
    freeze({ source: 'touch', ...inputCandidate(touch) }),
    freeze({ source: 'controller', ...inputCandidate(controller) })
  ];
  const selected = candidates.find((candidate) => candidate.active) || freeze({ source: 'none', strafe: 0, forward: 0, active: false });
  return freeze({
    schema: EON_CITY_GAMEPLAY_CONTRACT_SCHEMA,
    source: selected.source,
    strafe: selected.strafe,
    forward: selected.forward,
    active: selected.active,
    localOnly: true,
    remoteNetwork: false
  });
}

/**
 * Resolves screen-relative movement. Positive strafe is always screen-right,
 * positive forward is always toward the camera's forward ray. This is the
 * authoritative fix for the old reversed right-vector implementation.
 */
export function resolveEonCityCameraRelativeMove({ input = {}, cameraForward = {} } = {}) {
  const intent = normalize2d({ x: input.strafe ?? input.x, z: input.forward ?? input.z });
  const forward = normalize2d({ x: cameraForward.x, z: cameraForward.z });
  if (!intent.length || !forward.length) {
    return freeze({
      schema: EON_CITY_GAMEPLAY_CONTRACT_SCHEMA,
      x: 0,
      z: 0,
      active: false,
      screenRelative: true,
      directionConvention: 'positive-strafe-is-screen-right'
    });
  }
  // W618A: for Babylon's ArcRotate camera, the ground-plane screen-right
  // vector must be the clockwise perpendicular of the camera forward ray. The
  // previous counter-clockwise perpendicular made A/D and left/right feel
  // inverted in the live City when the default camera looked toward +Z.
  const right = { x: forward.z, z: -forward.x };
  const move = normalize2d({
    x: right.x * intent.x + forward.x * intent.z,
    z: right.z * intent.x + forward.z * intent.z
  });
  return freeze({
    schema: EON_CITY_GAMEPLAY_CONTRACT_SCHEMA,
    x: move.x,
    z: move.z,
    active: move.length > 0.001,
    screenRelative: true,
    directionConvention: 'positive-strafe-is-screen-right'
  });
}

/**
 * Converts a visible landmark boundary into a non-blocking local approach
 * cue. It is intentionally not a route action: the player must still select a
 * visible Review, Guide, Enter or Quick Open control.
 */
export function describeEonCityLandmarkApproach({ player = {}, landmark = null } = {}) {
  const id = String(landmark?.id || '').trim();
  const radius = Math.max(0, finite(landmark?.radius));
  if (!id || !radius) return null;
  const distance = Math.hypot(finite(player?.x) - finite(landmark?.x), finite(player?.z) - finite(landmark?.z));
  const inRange = distance <= radius;
  return freeze({
    schema: EON_CITY_GAMEPLAY_CONTRACT_SCHEMA,
    id,
    label: String(landmark?.label || landmark?.title || id),
    distance: round(distance, 1),
    radius: round(radius, 1),
    inRange,
    prompt: inRange ? `Review ${String(landmark?.label || landmark?.title || id)}` : null,
    localOnly: true,
    autoNavigation: false,
    opensRoute: false,
    executesWork: false,
    remoteNetwork: false
  });
}

/**
 * Documents the first-run dialog's pointer ownership requirements. The live
 * source uses this data both for source gates and for the browser proof runner.
 */
export function getEonCityOverlayInputIsolationContract() {
  return freeze({
    schema: EON_CITY_GAMEPLAY_CONTRACT_SCHEMA,
    layer: 'first-run-modal',
    minimumZIndex: 1200,
    requiresPointerEvents: true,
    requiresIsolatedStackingContext: true,
    requiresCanvasHitTestExclusion: true,
    userActionRequired: true,
    localOnly: true,
    remoteNetwork: false
  });
}

export function validateEonCityGameplayContract({ directHudActions = EON_CITY_DIRECT_HUD_ACTIONS } = {}) {
  const errors = [];
  const ids = new Set();
  for (const action of Array.isArray(directHudActions) ? directHudActions : []) {
    const id = String(action?.id || '');
    const label = String(action?.label || '');
    if (!/^[a-z0-9-]{3,48}$/.test(id) || ids.has(id)) errors.push(`Invalid or duplicate direct HUD action: ${id || 'unknown'}`);
    ids.add(id);
    if (!label || /^interact$/i.test(label)) errors.push(`Direct HUD action must name the actual destination, not generic Interact: ${id || 'unknown'}`);
  }
  for (const required of ['command-room', 'eonbot', 'districts', 'menu']) {
    if (!ids.has(required)) errors.push(`Direct HUD action is missing: ${required}`);
  }
  const overlay = getEonCityOverlayInputIsolationContract();
  if (overlay.minimumZIndex < 1000 || !overlay.requiresCanvasHitTestExclusion) errors.push('First-run overlay input isolation is incomplete.');
  const right = resolveEonCityCameraRelativeMove({ input: { strafe: 1, forward: 0 }, cameraForward: { x: 0, z: 1 } });
  if (right.x <= 0 || Math.abs(right.z) > 0.0001) errors.push('Positive strafe does not resolve to screen-right for the default Babylon camera.');
  if (EON_CITY_CONTROL_CONVENTION.leftRightInverted !== false || EON_CITY_CONTROL_CONVENTION.clickToMoveDefaultForDirectCity !== true) errors.push('W618A control convention must disable inverted left/right and enable direct City click-to-move.');
  return freeze({
    schema: EON_CITY_GAMEPLAY_CONTRACT_SCHEMA,
    ok: errors.length === 0,
    errors: freeze(errors),
    directHudActionCount: Array.isArray(directHudActions) ? directHudActions.length : 0,
    inputChannels: EON_CITY_INPUT_CHANNELS,
    localOnly: true,
    remoteNetwork: false
  });
}
