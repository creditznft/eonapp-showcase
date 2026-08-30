/**
 * W719.13 — keyboard input normalization shared by both City render paths.
 *
 * Some owner/browser sessions expose a usable `KeyboardEvent.key` but an empty
 * or layout-dependent `KeyboardEvent.code`. This pure resolver keeps W/A/S/D,
 * arrows and visible shortcuts reliable without reading text fields, moving the
 * player automatically, or changing any work state.
 */
export const EON_CITY_W719_INPUT_SCHEMA = 'eon.city.input-authority.w719.13.v1';

const freeze = Object.freeze;

const KEY_TO_CODE = freeze({
  w: 'KeyW', s: 'KeyS', a: 'KeyA', d: 'KeyD',
  arrowup: 'ArrowUp', arrowdown: 'ArrowDown', arrowleft: 'ArrowLeft', arrowright: 'ArrowRight',
  escape: 'Escape', esc: 'Escape', m: 'KeyM', e: 'KeyE', l: 'KeyL', c: 'KeyC', r: 'KeyR',
  ' ': 'Space', space: 'Space', spacebar: 'Space'
});

const CODE_TO_DIRECTION = freeze({
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right'
});

export function resolveEonCityW719KeyboardCode(event = {}) {
  const code = String(event?.code || '').trim();
  if (code) return code;
  return KEY_TO_CODE[String(event?.key || '').trim().toLowerCase()] || '';
}

export function resolveEonCityW719MovementDirection(event = {}) {
  return CODE_TO_DIRECTION[resolveEonCityW719KeyboardCode(event)] || '';
}

export function getEonCityW719InputTruth() {
  return freeze({
    schema: `${EON_CITY_W719_INPUT_SCHEMA}.truth.v1`,
    keyboardCodePreferred: true,
    keyboardKeyFallback: true,
    wasdSupported: true,
    arrowsSupported: true,
    editableTargetsStillSuppressedByRuntime: true,
    automaticMovement: false,
    workStateChanged: false
  });
}
