const freeze = (value) => Object.freeze(value);
const token = (value = '', max = 96) => String(value || '').replace(/[^a-z0-9:_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, max);

export const EON_EXPANSE_W767V_GUIDANCE_LIFECYCLE_SCHEMA = 'eon.city.expanse.guidance-lifecycle.w767v.v1';

export function deriveEonExpanseW767VGuidanceControl({
  expanseActive = false,
  guidanceActive = false,
  nearTarget = false,
  guideState = null
} = {}) {
  const visible = expanseActive === true && guidanceActive === true && nearTarget !== true;
  const guiding = visible && guideState?.active === true;
  return freeze({
    schema: EON_EXPANSE_W767V_GUIDANCE_LIFECYCLE_SCHEMA,
    visible,
    guiding,
    mode: visible ? (guiding ? 'cancel' : 'request') : 'unavailable',
    label: guiding ? 'Stop guiding' : 'EONBOT, guide me',
    ariaLabel: guiding ? 'Stop EONBOT objective guidance' : 'Ask EONBOT to guide the active objective',
    disabled: !visible,
    explicitUserActionRequired: true,
    automaticMovement: false,
    mutatesProgression: false
  });
}

export function shouldClearEonExpanseW767VActivityGuidance({
  reason = '',
  activityObjective = '',
  completedMissionId = ''
} = {}) {
  const objective = String(activityObjective || '');
  if (!objective.startsWith('activity:')) return false;
  if (completedMissionId && objective === `activity:${token(completedMissionId)}`) return true;
  return new Set([
    'explicit-user-cancel',
    'explicit-cancel',
    'return-to-command-hub',
    'expanse-deactivated',
    'activity-target-reached'
  ]).has(String(reason || ''));
}
