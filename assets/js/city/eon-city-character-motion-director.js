/**
 * W603 — Navigator motion director.
 *
 * Converts the actual collision-resolved City movement into a stable, natural
 * character animation state. It is intentionally engine-agnostic and does not
 * read user data, open routes, or create gameplay actions. Rendering code owns
 * the final transform; this module only describes the public-facing motion
 * contract so a blocked character never plays a run cycle in place.
 */
export const EON_CITY_CHARACTER_MOTION_SCHEMA = 'eon.city.character-motion-director.w603.v1';

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value, places = 4) => Number(Number(value || 0).toFixed(places));
const normalizeAngle = (value) => {
  let angle = finite(value);
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
};

export function getEonCityNavigatorMotionClip({ moving = false, speed = 0, turnRate = 0, focused = false } = {}) {
  if (moving) return finite(speed) >= 5.15 ? 'Run' : 'Walk';
  if (Math.abs(finite(turnRate)) > 1.7) return turnRate < 0 ? 'TurnLeft' : 'TurnRight';
  if (focused) return 'Inspect';
  return 'Idle';
}

export function createEonCityCharacterMotionDirector({ initialHeading = 0, walkSpeed = 4.8, runThreshold = 5.15, turnResponsiveness = 11.5, stoppedGraceMs = 115 } = {}) {
  let heading = normalizeAngle(initialHeading);
  let lastHeading = heading;
  let idleElapsedMs = 0;
  let snapshot = freeze({
    schema: EON_CITY_CHARACTER_MOTION_SCHEMA,
    moving: false,
    speed: 0,
    turnRate: 0,
    heading,
    desiredHeading: heading,
    clip: 'Idle',
    stoppedGraceMs,
    localOnly: true,
    readsUserData: false,
    remoteNetwork: false
  });

  return freeze({
    update({ desiredMove = null, appliedStep = 0, deltaMs = 16, focused = false, heading: requestedHeading = null } = {}) {
      const safeDeltaMs = clamp(finite(deltaMs, 16), 1, 80);
      const seconds = safeDeltaMs / 1000;
      const x = finite(desiredMove?.x);
      const z = finite(desiredMove?.z);
      const hasIntent = Math.hypot(x, z) > 0.0001;
      const actualDistance = Math.max(0, finite(appliedStep));
      const speed = actualDistance / Math.max(0.001, seconds);
      const moving = actualDistance > 0.001;
      const desiredHeading = hasIntent
        ? Math.atan2(x, z)
        : (requestedHeading === null || requestedHeading === undefined ? heading : finite(requestedHeading));
      const turnDelta = normalizeAngle(desiredHeading - heading);
      const alpha = 1 - Math.exp(-turnResponsiveness * seconds);
      heading = normalizeAngle(heading + turnDelta * (moving || Math.abs(turnDelta) > 0.16 ? alpha : alpha * 0.28));
      const turnRate = normalizeAngle(heading - lastHeading) / Math.max(0.001, seconds);
      lastHeading = heading;
      idleElapsedMs = moving ? 0 : idleElapsedMs + safeDeltaMs;
      const motionForClip = moving || (hasIntent && idleElapsedMs < stoppedGraceMs && speed > 0.03);
      const speedForClip = Math.max(speed, walkSpeed * (hasIntent && idleElapsedMs < stoppedGraceMs ? 0.55 : 0));
      const clip = motionForClip
        ? (speedForClip >= runThreshold ? 'Run' : 'Walk')
        : getEonCityNavigatorMotionClip({ moving: false, speed: speedForClip, turnRate, focused });
      snapshot = freeze({
        schema: EON_CITY_CHARACTER_MOTION_SCHEMA,
        moving,
        intendedMovement: hasIntent,
        blocked: hasIntent && !moving,
        speed: round(speed),
        turnRate: round(turnRate),
        heading: round(heading),
        desiredHeading: round(desiredHeading),
        clip,
        focused: Boolean(focused),
        idleElapsedMs: Math.round(idleElapsedMs),
        localOnly: true,
        readsUserData: false,
        remoteNetwork: false
      });
      return snapshot;
    },
    reset(nextHeading = 0) {
      heading = normalizeAngle(nextHeading);
      lastHeading = heading;
      idleElapsedMs = 0;
      snapshot = freeze({ ...snapshot, heading: round(heading), desiredHeading: round(heading), clip: 'Idle', moving: false, speed: 0, turnRate: 0, blocked: false, idleElapsedMs: 0 });
      return snapshot;
    },
    getSnapshot() { return snapshot; }
  });
}
