const freeze = (value) => Object.freeze(value);

export const EON_EXPANSE_W767O_EVENT_LIFECYCLE_SCHEMA = 'eon.city.expanse.dynamic-event-lifecycle.w767o.v1';

export function deriveEonExpanseW767ODynamicEventLifecycle(event = null, { at = Date.now() } = {}) {
  const suppliedAt = Number(at);
  const timestamp = Number.isFinite(suppliedAt) ? suppliedAt : Date.now();
  const startsAt = Number(event?.startsAt);
  const endsAt = Number(event?.endsAt);
  const valid = Boolean(event?.id && event?.windowId && Number.isFinite(startsAt) && Number.isFinite(endsAt) && endsAt > startsAt);
  const status = !valid ? 'inactive'
    : timestamp < startsAt ? 'upcoming'
      : timestamp >= endsAt ? 'expired'
        : 'active';
  return freeze({
    schema: EON_EXPANSE_W767O_EVENT_LIFECYCLE_SCHEMA,
    valid,
    active: status === 'active',
    status,
    eventId: valid ? String(event.id) : '',
    windowId: valid ? String(event.windowId) : '',
    startsAt: valid ? startsAt : 0,
    endsAt: valid ? endsAt : 0,
    remainingMs: status === 'active' ? Math.max(0, endsAt - timestamp) : 0,
    blocksHubReturn: false,
    irreversibleFailure: false,
    mutatesProgression: false
  });
}

export function validateEonExpanseW767ODynamicEventReview({
  event = null,
  expectedEventId = '',
  expectedWindowId = '',
  explicitUserAction = false,
  at = Date.now()
} = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const lifecycle = deriveEonExpanseW767ODynamicEventLifecycle(event, { at });
  if (!lifecycle.valid) return freeze({ ok: false, reason: 'dynamic-event-unavailable', lifecycle });
  if (!lifecycle.active) return freeze({ ok: false, reason: lifecycle.status === 'expired' ? 'dynamic-event-expired' : 'dynamic-event-not-active', lifecycle });
  if (expectedEventId && String(expectedEventId) !== lifecycle.eventId) return freeze({ ok: false, reason: 'dynamic-event-changed', lifecycle });
  if (expectedWindowId && String(expectedWindowId) !== lifecycle.windowId) return freeze({ ok: false, reason: 'dynamic-event-window-changed', lifecycle });
  return freeze({
    ok: true,
    event: freeze({ id: lifecycle.eventId, windowId: lifecycle.windowId, startsAt: lifecycle.startsAt, endsAt: lifecycle.endsAt }),
    lifecycle,
    grantsXp: false,
    mutatesProgression: false,
    blocksHubReturn: false
  });
}
