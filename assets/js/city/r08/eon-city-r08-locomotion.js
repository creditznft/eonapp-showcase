/**
 * R08 — intentional EON City locomotion authority.
 *
 * Movement speed is selected from explicit player intent and current world
 * context. Diagonal axis magnitude must never implicitly enable a faster gait.
 * Sprint has no stamina/currency/progression side effect and is safe to clear
 * whenever a blocking surface, blur, navigation or runtime disposal occurs.
 */
const freeze = Object.freeze;

export const EON_CITY_R08_LOCOMOTION_SCHEMA = 'eon.city.locomotion.r08.v1';
export const EON_CITY_R08_SPEEDS = freeze({
  commandHub: freeze({ travel: 4.6, sprint: 6.8 }),
  openWorld: freeze({ travel: 5.4, sprint: 8.6 })
});

export function deriveEonCityR08Locomotion({
  moving = false,
  sprintRequested = false,
  expanseActive = false,
  blocked = false
} = {}) {
  const world = expanseActive ? 'open-world' : 'command-hub';
  const profile = expanseActive ? EON_CITY_R08_SPEEDS.openWorld : EON_CITY_R08_SPEEDS.commandHub;
  const sprinting = moving === true && sprintRequested === true && blocked !== true;
  const speed = blocked === true || moving !== true ? 0 : sprinting ? profile.sprint : profile.travel;
  return freeze({
    schema: EON_CITY_R08_LOCOMOTION_SCHEMA,
    world,
    moving: moving === true,
    blocked: blocked === true,
    sprintRequested: sprintRequested === true,
    sprinting,
    speed,
    gait: speed <= 0 ? 'idle' : sprinting ? 'sprint' : 'travel',
    staminaRequired: false,
    progressionRequired: false,
    diagonalSpeedBoost: false
  });
}

export function isEonCityR08SprintKeyboardCode(code = '') {
  return String(code || '') === 'ShiftLeft' || String(code || '') === 'ShiftRight';
}

export default freeze({
  EON_CITY_R08_LOCOMOTION_SCHEMA,
  EON_CITY_R08_SPEEDS,
  deriveEonCityR08Locomotion,
  isEonCityR08SprintKeyboardCode
});
