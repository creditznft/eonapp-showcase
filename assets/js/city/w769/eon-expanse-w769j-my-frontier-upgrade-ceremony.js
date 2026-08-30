/** W769J — bounded visual ceremony for newly verified operational My Frontier districts. */
export const EON_EXPANSE_W769J_UPGRADE_CEREMONY_SCHEMA = 'eon.expanse.my-frontier-upgrade-ceremony.w769j.v1';
const freeze = Object.freeze;
const safeAt = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

const operationalKeys = (projection = {}) => new Map((Array.isArray(projection?.plots) ? projection.plots : [])
  .filter((entry) => Number(entry?.level || 0) >= 2 && entry?.upgradeStatus === 'operational' && entry?.plotId && entry?.buildingId)
  .map((entry) => [`${entry.plotId}:${entry.buildingId}`, freeze({
    plotId: String(entry.plotId),
    buildingId: String(entry.buildingId),
    upgradeReceiptId: String(entry.upgradeReceiptId || '')
  })]));

export function createEonExpanseW769JUpgradeCeremonyDirector({ reducedMotion = false, durationMs = 1180 } = {}) {
  const duration = reducedMotion ? 240 : Math.max(700, Math.min(2200, Number(durationMs) || 1180));
  let initialized = false;
  let previous = new Map();
  const active = new Map();
  const snapshot = (at = 0) => freeze({
    schema: EON_EXPANSE_W769J_UPGRADE_CEREMONY_SCHEMA,
    initialized,
    active: freeze([...active.values()].map((entry) => freeze({
      ...entry,
      progress: Math.max(0, Math.min(1, (safeAt(at) - entry.startedAt) / Math.max(1, entry.durationMs)))
    }))),
    reducedMotion: Boolean(reducedMotion),
    ownsRenderLoop: false,
    grantsXp: false,
    mutatesMissionState: false,
    privateContentStored: false,
    automaticUpgrade: false
  });
  return freeze({
    noteProjection(projection = {}, { at = 0 } = {}) {
      const clock = safeAt(at);
      const current = operationalKeys(projection);
      if (!initialized) {
        initialized = true;
        previous = current;
        return snapshot(clock);
      }
      for (const [key, entry] of current) {
        if (!previous.has(key)) {active.set(key, freeze({
          id: `upgrade-ceremony:${key}`,
          ...entry,
          startedAt: clock,
          expiresAt: clock + duration,
          durationMs: duration
        }));}
      }
      for (const key of active.keys()) if (!current.has(key)) active.delete(key);
      previous = current;
      return snapshot(clock);
    },
    update({ at = 0 } = {}) {
      const clock = safeAt(at);
      for (const [key, entry] of active) if (clock >= entry.expiresAt) active.delete(key);
      return snapshot(clock);
    },
    getState({ at = 0 } = {}) { return snapshot(safeAt(at)); }
  });
}

export default freeze({ EON_EXPANSE_W769J_UPGRADE_CEREMONY_SCHEMA, createEonExpanseW769JUpgradeCeremonyDirector });
