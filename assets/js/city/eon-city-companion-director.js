/**
 * W603 — EONBOT formation and presentation director.
 *
 * The companion moves only as a local visual guide. It has no background work,
 * microphone, provider, account, route-opening or autonomous-agent capability.
 * The director keeps EONBOT out of the camera/player line and gives it a
 * readable formation: follow while travelling, guide near a selected landmark,
 * observe while reviewing, listen/speak after explicit Voice/EONBOT UI actions.
 */
export const EON_CITY_COMPANION_DIRECTOR_SCHEMA = 'eon.city.companion-director.w603.v1';

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

export const EON_CITY_COMPANION_MODES = Object.freeze(['idle', 'follow', 'guide', 'observe', 'scan', 'listen', 'speak', 'orbit', 'return', 'perch', 'dock']);

function positionOf(value = {}) {
  return { x: finite(value.x), y: finite(value.y), z: finite(value.z) };
}

function distance2D(a, b) {
  return Math.hypot(finite(a?.x) - finite(b?.x), finite(a?.z) - finite(b?.z));
}

function smooth(current, target, alpha) {
  return current + (target - current) * alpha;
}

function getMode({ intent = '', moving = false, focusedLandmark = null, nearbyLandmark = null } = {}) {
  const requested = String(intent || '').trim().toLowerCase();
  if (EON_CITY_COMPANION_MODES.includes(requested)) return requested;
  if (focusedLandmark) return 'observe';
  if (nearbyLandmark) return moving ? 'guide' : 'scan';
  return moving ? 'follow' : 'idle';
}

export function createEonCityCompanionDirector({ initialPosition = { x: 1.1, y: 1.58, z: 5.9 }, response = 7.5, hoverAmplitude = 0.085, minimumCameraDistance = 1.2 } = {}) {
  let position = positionOf(initialPosition);
  let heading = 0;
  let phase = 0;
  let snapshot = freeze({
    schema: EON_CITY_COMPANION_DIRECTOR_SCHEMA,
    mode: 'idle',
    position: freeze({ ...position }),
    heading: 0,
    distanceFromPlayer: 0,
    cameraSafe: true,
    localOnly: true,
    autonomousAgent: false,
    remoteNetwork: false
  });

  return freeze({
    update({ operatorPosition = {}, operatorHeading = 0, cameraPosition = null, landmark = null, nearbyLandmark = null, dockPosition = null, moving = false, intent = '', deltaMs = 16, reducedMotion = false } = {}) {
      const operator = positionOf(operatorPosition);
      const safeDeltaMs = clamp(finite(deltaMs, 16), 1, 80);
      const seconds = safeDeltaMs / 1000;
      phase += seconds;
      const mode = getMode({ intent, moving, focusedLandmark: landmark, nearbyLandmark });
      const headingBase = finite(operatorHeading);
      const forward = { x: Math.sin(headingBase), z: Math.cos(headingBase) };
      const right = { x: Math.cos(headingBase), z: -Math.sin(headingBase) };
      const selected = landmark ? positionOf(landmark) : null;
      let target = { x: operator.x + right.x * 1.08 + forward.x * 0.48, y: operator.y + 1.5, z: operator.z + right.z * 1.08 + forward.z * 0.48 };
      if (mode === 'guide' && (selected || nearbyLandmark)) {
        const next = positionOf(selected || nearbyLandmark);
        const dx = next.x - operator.x;
        const dz = next.z - operator.z;
        const length = Math.max(0.001, Math.hypot(dx, dz));
        const ratio = Math.min(1.55, Math.max(0.78, length * 0.34));
        target = { x: operator.x + (dx / length) * ratio, y: operator.y + 1.74, z: operator.z + (dz / length) * ratio };
      } else if (mode === 'observe' && selected) {
        const dx = selected.x - operator.x;
        const dz = selected.z - operator.z;
        const length = Math.max(0.001, Math.hypot(dx, dz));
        target = { x: operator.x + (dx / length) * 0.92 + right.x * 0.58, y: operator.y + 1.68, z: operator.z + (dz / length) * 0.92 + right.z * 0.58 };
      } else if (mode === 'orbit') {
        const orbit = phase * 0.9;
        target = { x: operator.x + Math.cos(orbit) * 1.36, y: operator.y + 1.62, z: operator.z + Math.sin(orbit) * 1.36 };
      } else if (mode === 'perch') {
        target = { x: operator.x - right.x * 0.9 + forward.x * 0.82, y: operator.y + 0.82, z: operator.z - right.z * 0.9 + forward.z * 0.82 };
      } else if (mode === 'return') {
        target = { x: operator.x + right.x * 0.72 - forward.x * 0.18, y: operator.y + 1.44, z: operator.z + right.z * 0.72 - forward.z * 0.18 };
      } else if (mode === 'dock' && dockPosition) {
        const dock = positionOf(dockPosition);
        target = { x: dock.x, y: dock.y || 0.88, z: dock.z };
      } else if (mode === 'scan' && (selected || nearbyLandmark)) {
        const next = positionOf(selected || nearbyLandmark);
        const orbit = phase * 1.15;
        target = { x: next.x + Math.cos(orbit) * 0.68, y: (next.y || operator.y) + 1.1, z: next.z + Math.sin(orbit) * 0.68 };
      }
      if (!reducedMotion && !['dock', 'perch'].includes(mode)) target.y += Math.sin(phase * (mode === 'speak' ? 4.1 : 2.3)) * hoverAmplitude;
      let cameraSafe = true;
      if (cameraPosition) {
        const camera = positionOf(cameraPosition);
        const tooNearCamera = distance2D(target, camera) < minimumCameraDistance;
        if (tooNearCamera) {
          cameraSafe = false;
          target.x += right.x * 1.18 + forward.x * 0.35;
          target.z += right.z * 1.18 + forward.z * 0.35;
        }
      }
      const alpha = 1 - Math.exp(-response * seconds);
      position = {
        x: smooth(position.x, target.x, alpha),
        y: smooth(position.y, target.y, alpha),
        z: smooth(position.z, target.z, alpha)
      };
      const lookTarget = mode === 'dock' ? operator : (selected || (mode === 'guide' && nearbyLandmark ? positionOf(nearbyLandmark) : operator));
      const desiredHeading = Math.atan2(lookTarget.x - position.x, lookTarget.z - position.z);
      const turn = normalizeAngle(desiredHeading - heading);
      heading = normalizeAngle(heading + turn * Math.min(1, alpha * 1.35));
      snapshot = freeze({
        schema: EON_CITY_COMPANION_DIRECTOR_SCHEMA,
        mode,
        position: freeze({ x: round(position.x), y: round(position.y), z: round(position.z) }),
        heading: round(heading),
        target: freeze({ x: round(target.x), y: round(target.y), z: round(target.z) }),
        distanceFromPlayer: round(distance2D(position, operator)),
        cameraSafe,
        landmarkId: String((selected || nearbyLandmark)?.id || '') || null,
        localOnly: true,
        autonomousAgent: false,
        backgroundWorkStarted: false,
        microphoneRequested: false,
        remoteNetwork: false
      });
      return snapshot;
    },
    getSnapshot() { return snapshot; }
  });
}
