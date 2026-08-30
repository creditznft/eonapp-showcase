/**
 * W695 — canonical character forward-axis and actual-displacement locomotion.
 *
 * The shipped Pathfinder GLBs are calibrated independently from their bind-pose
 * skeleton evidence. World movement remains on the player anchor; only the
 * model wrapper receives an asset/variant-specific visual offset. Animation is
 * selected from measured post-collision displacement, never raw input alone.
 */

export const EON_CITY_W695_CHARACTER_MOTION_SCHEMA = 'eon.city.character-motion-truth.w695.v1';
const freeze = (value) => Object.freeze(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const normalizeAngle = (value = 0) => {
  let angle = Number(value) || 0;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
};
const point = (value = {}) => freeze({ x: Number(value?.x) || 0, y: Number(value?.y) || 0, z: Number(value?.z) || 0 });

export const EON_CITY_W695_CHARACTER_AXIS_CALIBRATIONS = freeze({
  'eoncity-pathfinder-prime-11clips': freeze({
    assetId: 'eoncity-pathfinder-prime-11clips',
    variants: freeze({
      primary: freeze({
        sha256: '4fc5f5bc696fa6a992ca86466be39f7e87b156e1589841b6dc5d797081d78b10',
        modelForwardAxis: '+z', visualHeadingOffset: 0,
        bindPoseEvidence: freeze({ headfrontDeltaZ: 0.04143, meanToeDeltaZ: 0.09412, auditedNodes: freeze(['Head', 'headfront', 'LeftFoot', 'LeftToeBase', 'RightFoot', 'RightToeBase']) })
      }),
      fallback: freeze({
        sha256: 'bd52fc0c68a60a8944eb94b7d33737409473f95ef4df8c68b40cccaaaeb73a18',
        modelForwardAxis: '+z', visualHeadingOffset: 0,
        bindPoseEvidence: freeze({ sameAuthoredSkeletonAsPrimary: true })
      })
    })
  }),
  'eoncity-pathfinder-a-vanguard-6clips': freeze({
    assetId: 'eoncity-pathfinder-a-vanguard-6clips',
    variants: freeze({
      primary: freeze({
        sha256: '341989730eef8df7648c6bcd5d7df322123f5e890f8a5c8022253cc68fab4f08',
        modelForwardAxis: '+z', visualHeadingOffset: 0,
        bindPoseEvidence: freeze({ headfrontDeltaZ: 0.07301, meanToeDeltaZ: 0.1134, auditedNodes: freeze(['Head', 'headfront', 'LeftFoot', 'LeftToeBase', 'RightFoot', 'RightToeBase']) })
      }),
      fallback: freeze({
        sha256: 'f87948576117253d0bb8bef9d50f9ed57ebb3d178f9c4374ea4a011646606654',
        modelForwardAxis: '+z', visualHeadingOffset: 0,
        bindPoseEvidence: freeze({ sameAuthoredSkeletonAsPrimary: true })
      })
    })
  })
});

export function getEonCityW695CharacterAxisCalibration(assetId = '', variant = 'primary') {
  const record = EON_CITY_W695_CHARACTER_AXIS_CALIBRATIONS[String(assetId || '')];
  if (!record) return null;
  const variantName = Object.hasOwn(record.variants, String(variant)) ? String(variant) : 'primary';
  const calibration = record.variants[variantName];
  return freeze({ ...calibration, assetId: record.assetId, variant: variantName, schema: EON_CITY_W695_CHARACTER_MOTION_SCHEMA, provisionalVisualBrowserConfirmation: true });
}

export function resolveEonCityW695CharacterVisualHeading(worldHeading = 0, assetId = '', variant = 'primary') {
  const calibration = getEonCityW695CharacterAxisCalibration(assetId, variant);
  return normalizeAngle(Number(worldHeading) + Number(calibration?.visualHeadingOffset || 0));
}

export function createEonCityW695LocomotionTruthController({
  initialPosition = {}, initialHeading = 0, walkThreshold = 0.055, runThreshold = 5.3,
  blockedThreshold = 0.035, stopHoldMs = 115, headingSmoothing = 0.35
} = {}) {
  let prior = point(initialPosition);
  let heading = normalizeAngle(initialHeading);
  let actualSpeed = 0;
  let animationState = 'idle';
  let idleHoldMs = 0;
  let updateCount = 0;
  let blockedCount = 0;
  let last = freeze({
    schema: EON_CITY_W695_CHARACTER_MOTION_SCHEMA,
    animationState: 'idle', moving: false, blocked: false, actualSpeed: 0,
    displacement: freeze({ x: 0, z: 0, distance: 0 }), heading,
    desiredHeading: heading, visualHeading: heading, activeAssetId: '', activeVariant: '',
    modelForwardAxis: 'unknown', source: 'initial'
  });

  const snapshot = () => last;
  return freeze({
    reset({ position = prior, worldHeading = heading } = {}) {
      prior = point(position);
      heading = normalizeAngle(worldHeading);
      actualSpeed = 0;
      animationState = 'idle';
      idleHoldMs = 0;
      updateCount = 0;
      blockedCount = 0;
      last = freeze({ ...last, animationState: 'idle', moving: false, blocked: false, actualSpeed: 0, heading, visualHeading: heading, displacement: freeze({ x: 0, z: 0, distance: 0 }), source: 'reset' });
      return last;
    },
    update({
      position = prior, desiredDirection = null, deltaSeconds = 0.016,
      activeAssetId = '', activeVariant = 'primary', runRequested = false, panelOpen = false
    } = {}) {
      const current = point(position);
      const delta = clamp(deltaSeconds, 0.001, 0.25);
      const dx = current.x - prior.x;
      const dz = current.z - prior.z;
      const distance = Math.hypot(dx, dz);
      const measuredSpeed = distance / delta;
      // Smooth one-frame collision and floating-point jitter while reacting fast
      // enough for responsive walk/idle transitions.
      actualSpeed += (measuredSpeed - actualSpeed) * 0.62;
      const desiredX = Number(desiredDirection?.x) || 0;
      const desiredZ = Number(desiredDirection?.z) || 0;
      const desiredMagnitude = Math.hypot(desiredX, desiredZ);
      const desiredHeading = desiredMagnitude > 0.001 ? Math.atan2(desiredX, desiredZ) : heading;
      const physicallyMoving = distance >= walkThreshold * delta && actualSpeed >= walkThreshold;
      const blocked = desiredMagnitude > 0.08 && measuredSpeed <= blockedThreshold;
      if (blocked) blockedCount += 1;
      if (physicallyMoving) {
        const measuredHeading = Math.atan2(dx, dz);
        const difference = normalizeAngle(measuredHeading - heading);
        heading = normalizeAngle(heading + difference * clamp(headingSmoothing, 0.05, 1));
        idleHoldMs = 0;
        animationState = runRequested || actualSpeed >= runThreshold ? 'run' : 'walk';
      } else {
        if (desiredMagnitude > 0.08) {
          const difference = normalizeAngle(desiredHeading - heading);
          heading = normalizeAngle(heading + difference * clamp(headingSmoothing * 1.25, 0.08, 1));
        }
        idleHoldMs += delta * 1000;
        if (panelOpen || blocked || idleHoldMs >= stopHoldMs) animationState = 'idle';
      }
      const calibration = getEonCityW695CharacterAxisCalibration(activeAssetId, activeVariant);
      const visualHeading = normalizeAngle(heading + Number(calibration?.visualHeadingOffset || 0));
      updateCount += 1;
      last = freeze({
        schema: EON_CITY_W695_CHARACTER_MOTION_SCHEMA,
        animationState,
        moving: physicallyMoving,
        blocked,
        actualSpeed: Number(actualSpeed.toFixed(3)),
        measuredSpeed: Number(measuredSpeed.toFixed(3)),
        displacement: freeze({ x: Number(dx.toFixed(5)), z: Number(dz.toFixed(5)), distance: Number(distance.toFixed(5)) }),
        heading: Number(heading.toFixed(6)),
        desiredHeading: Number(desiredHeading.toFixed(6)),
        visualHeading: Number(visualHeading.toFixed(6)),
        desiredDirection: freeze({ x: Number(desiredX.toFixed(4)), z: Number(desiredZ.toFixed(4)), magnitude: Number(desiredMagnitude.toFixed(4)) }),
        activeAssetId: String(activeAssetId || ''),
        activeVariant: String(activeVariant || ''),
        modelForwardAxis: calibration?.modelForwardAxis || 'procedural:+z',
        visualHeadingOffset: Number(calibration?.visualHeadingOffset || 0),
        idleHoldMs: Math.round(idleHoldMs),
        updateCount,
        blockedCount,
        source: physicallyMoving ? 'post-collision-displacement' : blocked ? 'blocked-input-idle' : 'stationary-idle'
      });
      prior = current;
      return last;
    },
    getSnapshot: snapshot
  });
}

export function validateEonCityW695CalibrationRegistry(registry = EON_CITY_W695_CHARACTER_AXIS_CALIBRATIONS) {
  const errors = [];
  for (const assetId of ['eoncity-pathfinder-prime-11clips', 'eoncity-pathfinder-a-vanguard-6clips']) {
    const entry = registry?.[assetId];
    if (!entry) { errors.push(`missing:${assetId}`); continue; }
    for (const variant of ['primary', 'fallback']) {
      const calibration = entry.variants?.[variant];
      if (!calibration || !/^[a-f0-9]{64}$/.test(calibration.sha256 || '')) errors.push(`hash:${assetId}:${variant}`);
      if (calibration?.modelForwardAxis !== '+z' || !Number.isFinite(Number(calibration?.visualHeadingOffset))) errors.push(`axis:${assetId}:${variant}`);
    }
    if (!(entry.variants.primary.bindPoseEvidence?.headfrontDeltaZ > 0) || !(entry.variants.primary.bindPoseEvidence?.meanToeDeltaZ > 0)) errors.push(`bind-pose:${assetId}`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), assetCount: Object.keys(registry || {}).length });
}

export function getEonCityW695Truth() {
  return freeze({
    schema: EON_CITY_W695_CHARACTER_MOTION_SCHEMA,
    perAssetVariantCalibration: true,
    bindPoseEvidenceRecorded: true,
    globalBlindHalfTurnForbidden: true,
    animationUsesPostCollisionDisplacement: true,
    blockedMovementReturnsIdle: true,
    debugSnapshotAvailable: true,
    visualBrowserConfirmationStillRequired: true,
    automaticNavigation: false,
    automaticExecution: false
  });
}

export default freeze({
  EON_CITY_W695_CHARACTER_MOTION_SCHEMA,
  EON_CITY_W695_CHARACTER_AXIS_CALIBRATIONS,
  getEonCityW695CharacterAxisCalibration,
  resolveEonCityW695CharacterVisualHeading,
  createEonCityW695LocomotionTruthController,
  validateEonCityW695CalibrationRegistry,
  getEonCityW695Truth
});
