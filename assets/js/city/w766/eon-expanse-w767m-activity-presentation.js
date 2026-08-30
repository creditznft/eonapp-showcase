const freeze = (value) => Object.freeze(value);

export const EON_EXPANSE_W767M_ACTIVITY_PRESENTATION_SCHEMA = 'eon.city.expanse.activity-presentation.w767m.v1';

function currentCycleKey(at = Date.now()) {
  const date = new Date(Number(at || Date.now()));
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

export function deriveEonExpanseW767MActivityAssetPresentation({
  assetKey = '',
  state = {},
  at = Date.now()
} = {}) {
  const key = String(assetKey || '');
  const progress = state?.activityProgress || {};
  const cycleActive = String(progress.cycleKey || '') === currentCycleKey(at);
  let visible = true;
  let reason = 'persistent-activity-surface';

  if (key === 'lost-worker') {
    visible = progress.lostWorkerLocated !== true;
    reason = visible ? 'lost-worker-awaiting-location' : 'lost-worker-already-located';
  } else if (key.startsWith('productive:')) {
    // Productive anchors remain available as truthful shortcuts even after a
    // receipt-backed completion. Completion changes progression, not access.
    visible = true;
    reason = 'productive-surface-remains-available';
  } else if (key.startsWith('repeatable:')) {
    const itemId = key.slice('repeatable:'.length);
    const completed = cycleActive && [
      ...(progress.signalFragments || []),
      ...(progress.archiveSweepRecords || []),
      ...(progress.eonbotSignals || [])
    ].includes(itemId);
    visible = !completed;
    reason = visible ? 'repeatable-item-available' : 'repeatable-item-completed-current-cycle';
  }

  return freeze({
    schema: EON_EXPANSE_W767M_ACTIVITY_PRESENTATION_SCHEMA,
    assetKey: key,
    visible,
    interactive: visible,
    reason,
    cycleActive,
    mutatesMissionState: false,
    storesPrivateContent: false
  });
}
