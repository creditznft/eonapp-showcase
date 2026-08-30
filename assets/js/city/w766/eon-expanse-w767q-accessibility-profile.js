const freeze = (value) => Object.freeze(value);

export const EON_EXPANSE_W767Q_ACCESSIBILITY_SCHEMA = 'eon.city.expanse.accessibility-profile.w767q.v1';

export function deriveEonExpanseW767QAccessibilityProfile({
  reducedMotion = false,
  coarsePointer = false,
  forcedColors = false
} = {}) {
  const motionReduced = reducedMotion === true;
  const touchTargetPx = coarsePointer === true ? 48 : 44;
  return freeze({
    schema: EON_EXPANSE_W767Q_ACCESSIBILITY_SCHEMA,
    reducedMotion: motionReduced,
    coarsePointer: coarsePointer === true,
    forcedColors: forcedColors === true,
    animationEnabled: !motionReduced,
    transitionDurationMs: motionReduced ? 0 : 180,
    touchTargetPx,
    preservesObjectiveText: true,
    preservesDistanceText: true,
    preservesEventText: true,
    preservesHubReturn: true,
    autoMovesPlayer: false,
    mutatesProgression: false
  });
}
