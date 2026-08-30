const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const safeText = (value, limit = 120) => String(value || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);

export const EON_EXPANSE_W767I_TOUCH_INTERACTION_SCHEMA = 'eon.city.expanse.touch-interaction.w767i.v1';

function sanitizeTarget(value = null) {
  if (!value || typeof value !== 'object') return null;
  const id = safeText(value.id || value.targetId, 180);
  if (!id) return null;
  return freeze({
    id,
    label: safeText(value.label || 'Interact', 90) || 'Interact',
    distance: Math.max(0, finite(value.distance, 0))
  });
}

export function deriveEonExpanseW767ITouchInteraction({
  coarsePointer = false,
  expanseActive = false,
  transitActive = false,
  boardOpen = false,
  nearestInteraction = null
} = {}) {
  const target = sanitizeTarget(nearestInteraction);
  const active = Boolean(coarsePointer && expanseActive && !transitActive && !boardOpen && target);
  const distanceLabel = target && Number.isFinite(target.distance) ? `${Math.round(target.distance)} m` : '';
  return freeze({
    schema: EON_EXPANSE_W767I_TOUCH_INTERACTION_SCHEMA,
    active,
    coarsePointer: Boolean(coarsePointer),
    keyboardHintAllowed: !coarsePointer,
    target: active ? target : null,
    label: active ? target.label : '',
    distanceLabel: active ? distanceLabel : '',
    buttonText: active ? `${target.label}${distanceLabel ? ` · ${distanceLabel}` : ''}` : '',
    ariaLabel: active ? `${target.label}${distanceLabel ? `, ${distanceLabel} away` : ''}` : '',
    explicitUserActionRequired: true,
    canonicalNearestDispatch: true,
    storesPrivateContent: false
  });
}

export function validateEonExpanseW767IInteractionDispatch({
  explicitUserAction = false,
  expanseActive = false,
  transitActive = false,
  expectedTargetId = '',
  currentTargetId = ''
} = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (!expanseActive) return freeze({ ok: false, reason: 'expanse-not-active' });
  if (transitActive) return freeze({ ok: false, reason: 'expanse-transit-active' });
  const expected = safeText(expectedTargetId, 180);
  const current = safeText(currentTargetId, 180);
  if (!current) return freeze({ ok: false, reason: 'no-nearby-expanse-interaction' });
  if (expected && expected !== current) return freeze({ ok: false, reason: 'expanse-interaction-target-changed', expectedTargetId: expected, currentTargetId: current });
  return freeze({ ok: true, targetId: current, explicitUserAction: true, canonicalNearestDispatch: true });
}
