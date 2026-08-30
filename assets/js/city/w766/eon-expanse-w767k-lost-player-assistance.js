const freeze = (value) => Object.freeze(value);
const point = (value = {}) => freeze({ x: Number(value.x || 0), z: Number(value.z || 0) });
const distance2d = (a = {}, b = {}) => Math.hypot(Number(a.x || 0) - Number(b.x || 0), Number(a.z || 0) - Number(b.z || 0));

export const EON_EXPANSE_W767K_LOST_ASSISTANCE_SCHEMA = 'eon.city.expanse.lost-player-assistance.w767k.v1';

export function createEonExpanseW767KLostPlayerAssistanceDirector({
  now = () => Date.now(),
  idleThresholdMs = 35000,
  movementThreshold = 1.4,
  progressThreshold = 3.5,
  dismissCooldownMs = 30000
} = {}) {
  const safeIdleThresholdMs = Math.max(15000, Number(idleThresholdMs || 35000));
  const safeMovementThreshold = Math.max(0.5, Number(movementThreshold || 1.4));
  const safeProgressThreshold = Math.max(1, Number(progressThreshold || 3.5));
  const safeDismissCooldownMs = Math.max(5000, Number(dismissCooldownMs || 30000));
  let objectiveId = '';
  let anchorPosition = point();
  let bestDistance = Infinity;
  let lastMeaningfulAt = 0;
  let lastInteractionAt = 0;
  let dismissedUntil = 0;
  let guideAcceptedAt = 0;
  let state = null;

  const buildState = ({ active = false, reason = 'idle', at = now(), distance = null } = {}) => freeze({
    schema: EON_EXPANSE_W767K_LOST_ASSISTANCE_SCHEMA,
    active,
    reason,
    objectiveId,
    distance: Number.isFinite(Number(distance)) ? Number(distance) : null,
    idleForMs: lastMeaningfulAt ? Math.max(0, at - lastMeaningfulAt) : 0,
    lastMeaningfulAt,
    lastInteractionAt,
    dismissedUntil,
    guideAcceptedAt,
    prompt: active ? 'Need a route? EONBOT can lead you toward the active objective.' : '',
    actionLabel: active ? 'EONBOT, guide me' : '',
    explicitUserActionRequired: true,
    automaticMovement: false,
    automaticMissionProgress: false,
    automaticSpeech: false,
    storesPrivateContent: false
  });

  const reset = (reason = 'reset', { at = now() } = {}) => {
    objectiveId = '';
    anchorPosition = point();
    bestDistance = Infinity;
    lastMeaningfulAt = Number(at || now());
    state = buildState({ active: false, reason, at: Number(at || now()) });
    return freeze({ ok: true, state });
  };

  const update = ({
    expanseActive = false,
    bonded = false,
    transitActive = false,
    guideActive = false,
    boardOpen = false,
    objective = '',
    position = {},
    distance = null,
    nearTarget = false,
    at = now()
  } = {}) => {
    const timestamp = Number(at || now());
    const nextObjective = String(objective || '');
    const nextPosition = point(position);
    const nextDistance = Number.isFinite(Number(distance)) ? Math.max(0, Number(distance)) : null;
    if (!lastMeaningfulAt) lastMeaningfulAt = timestamp;
    if (nextObjective !== objectiveId) {
      objectiveId = nextObjective;
      anchorPosition = nextPosition;
      bestDistance = nextDistance ?? Infinity;
      lastMeaningfulAt = timestamp;
      state = buildState({ active: false, reason: nextObjective ? 'objective-changed' : 'objective-unavailable', at: timestamp, distance: nextDistance });
      return state;
    }
    if (distance2d(anchorPosition, nextPosition) >= safeMovementThreshold) {
      anchorPosition = nextPosition;
      lastMeaningfulAt = timestamp;
    }
    if (nextDistance !== null && nextDistance <= bestDistance - safeProgressThreshold) {
      bestDistance = nextDistance;
      lastMeaningfulAt = timestamp;
    } else if (nextDistance !== null && !Number.isFinite(bestDistance)) bestDistance = nextDistance;

    let reason = 'tracking';
    let active = false;
    if (!expanseActive) reason = 'expanse-inactive';
    else if (!bonded) reason = 'companion-not-bonded';
    else if (!objectiveId || nextDistance === null) reason = 'objective-unavailable';
    else if (transitActive) reason = 'transit-active';
    else if (guideActive) reason = 'guidance-active';
    else if (boardOpen) reason = 'mission-board-open';
    else if (nearTarget || nextDistance <= 8) reason = 'near-target';
    else if (timestamp < dismissedUntil) reason = 'dismissed-cooldown';
    else if (timestamp - lastMeaningfulAt < safeIdleThresholdMs) reason = 'tracking';
    else { reason = 'assistance-available'; active = true; }
    state = buildState({ active, reason, at: timestamp, distance: nextDistance });
    return state;
  };

  const recordInteraction = ({ at = now() } = {}) => {
    const timestamp = Number(at || now());
    lastInteractionAt = timestamp;
    lastMeaningfulAt = timestamp;
    state = buildState({ active: false, reason: 'interaction-recorded', at: timestamp, distance: state?.distance });
    return freeze({ ok: true, state });
  };

  const acceptGuide = ({ explicitUserAction = false, at = now() } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', state: state || buildState({ at: Number(at || now()) }) });
    const timestamp = Number(at || now());
    guideAcceptedAt = timestamp;
    lastMeaningfulAt = timestamp;
    state = buildState({ active: false, reason: 'guide-accepted', at: timestamp, distance: state?.distance });
    return freeze({ ok: true, state, delegatesToCanonicalGuideController: true });
  };

  const dismiss = ({ explicitUserAction = false, at = now() } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', state: state || buildState({ at: Number(at || now()) }) });
    const timestamp = Number(at || now());
    dismissedUntil = timestamp + safeDismissCooldownMs;
    state = buildState({ active: false, reason: 'explicit-dismissal', at: timestamp, distance: state?.distance });
    return freeze({ ok: true, state });
  };

  const certify = () => freeze({
    ok: true,
    schema: EON_EXPANSE_W767K_LOST_ASSISTANCE_SCHEMA,
    idleThresholdMs: safeIdleThresholdMs,
    movementThreshold: safeMovementThreshold,
    progressThreshold: safeProgressThreshold,
    explicitUserActionRequired: true,
    automaticMovement: false,
    automaticMissionProgress: false,
    automaticSpeech: false,
    storesPrivateContent: false,
    state: state || buildState({ at: now() })
  });

  reset('initialized', { at: now() });
  return freeze({ update, recordInteraction, acceptGuide, dismiss, reset, getState: () => state, certify });
}
