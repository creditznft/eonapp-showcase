const freeze = (value) => Object.freeze(value);
const token = (value = '', max = 96) => String(value || '').replace(/[^a-z0-9:_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, max);

export const EON_EXPANSE_W767U_ACTIVITY_ACTION_SCHEMA = 'eon.city.expanse.activity-action.w767u.v1';

export function deriveEonExpanseW767UActivityAction(item = null, zones = []) {
  if (!item?.activityId) return freeze({ available: false, reason: 'activity-required' });
  if (item.status === 'completed') return freeze({ available: false, reason: 'activity-already-completed', activityId: token(item.activityId) });
  if (item.family === 'daily-signal' && item.workspaceId) {return freeze({
    schema: EON_EXPANSE_W767U_ACTIVITY_ACTION_SCHEMA,
    available: true,
    type: item.status === 'ready-to-claim' ? 'claim-daily-signal' : 'open-workspace',
    activityId: token(item.activityId),
    label: String(item.label || 'Daily Signal').slice(0, 100),
    workspaceId: token(item.workspaceId),
    missionId: token(item.missionId),
    dayKey: String(item.dayKey || '').slice(0, 10),
    buttonLabel: item.status === 'ready-to-claim' ? 'Claim Daily Signal' : `Review ${String(item.label || 'Daily Signal').slice(0, 70)}`,
    receiptRequired: true,
    automaticCompletion: false
  });}
  if (item.family === 'productive-mission' && item.workspaceId) {return freeze({
    schema: EON_EXPANSE_W767U_ACTIVITY_ACTION_SCHEMA,
    available: true,
    type: 'open-workspace',
    activityId: token(item.activityId),
    label: String(item.label || 'Productive mission').slice(0, 100),
    workspaceId: token(item.workspaceId),
    buttonLabel: `Review ${String(item.label || 'productive mission').slice(0, 70)}`,
    receiptRequired: true,
    automaticCompletion: false
  });}
  if (item.family === 'side-mission' && item.zoneId) {
    const zone = (zones || []).find((entry) => String(entry?.id || '') === String(item.zoneId));
    if (!zone) return freeze({ available: false, reason: 'activity-zone-unavailable', activityId: token(item.activityId) });
    return freeze({
      schema: EON_EXPANSE_W767U_ACTIVITY_ACTION_SCHEMA,
      available: true,
      type: 'guide-zone',
      activityId: token(item.activityId),
      label: String(item.label || 'Side mission').slice(0, 100),
      zoneId: token(zone.id),
      zoneLabel: String(zone.label || zone.id).slice(0, 100),
      target: freeze({ x: Number(zone.x || 0), y: 0.2, z: Number(zone.z || 0) }),
      buttonLabel: `Guide to ${String(zone.label || zone.id).slice(0, 70)}`,
      receiptRequired: item.receiptRequired === true,
      automaticCompletion: false
    });
  }
  return freeze({ available: false, reason: 'activity-action-not-supported', activityId: token(item.activityId) });
}

export function validateEonExpanseW767UActivityAction(action = null, { explicitUserAction = false, expectedActivityId = '' } = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (!action?.available || !action?.activityId) return freeze({ ok: false, reason: action?.reason || 'activity-action-unavailable' });
  if (expectedActivityId && String(expectedActivityId) !== String(action.activityId)) return freeze({ ok: false, reason: 'activity-selection-changed' });
  return freeze({ ok: true, action, automaticCompletion: false, mutatesProgression: false });
}
