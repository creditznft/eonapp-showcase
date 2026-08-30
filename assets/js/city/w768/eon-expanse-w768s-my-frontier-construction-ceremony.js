/** W768S — bounded visual ceremony for newly verified My Frontier foundations. */
export const EON_EXPANSE_W768S_CONSTRUCTION_CEREMONY_SCHEMA = 'eon.expanse.my-frontier-construction-ceremony.w768s.v1';
const freeze = Object.freeze;
const safeAt = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

const constructedKeys = (presentation = {}) => new Map((Array.isArray(presentation?.plots) ? presentation.plots : [])
  .filter((entry) => entry?.status === 'constructed-foundation' && entry?.plotId && entry?.constructedBuildingId)
  .map((entry) => [`${entry.plotId}:${entry.constructedBuildingId}`, freeze({ plotId: String(entry.plotId), buildingId: String(entry.constructedBuildingId), buildingLabel: String(entry.buildingLabel || entry.constructedBuildingId) })]));

export function createEonExpanseW768SConstructionCeremonyDirector({ reducedMotion = false, durationMs = 1350 } = {}) {
  const duration = reducedMotion ? 260 : Math.max(700, Math.min(2400, Number(durationMs) || 1350));
  let initialized = false;
  let previous = new Map();
  const active = new Map();
  const snapshot = (at = 0) => freeze({
    schema: EON_EXPANSE_W768S_CONSTRUCTION_CEREMONY_SCHEMA,
    initialized,
    active: freeze([...active.values()].map((entry) => freeze({ ...entry, progress: Math.max(0, Math.min(1, (safeAt(at) - entry.startedAt) / Math.max(1, entry.durationMs))) }))),
    reducedMotion: Boolean(reducedMotion),
    ownsRenderLoop: false,
    grantsXp: false,
    mutatesMissionState: false,
    privateContentStored: false
  });
  return freeze({
    notePresentation(presentation = {}, { at = 0 } = {}) {
      const clock = safeAt(at);
      const current = constructedKeys(presentation);
      if (!initialized) {
        initialized = true;
        previous = current;
        return snapshot(clock);
      }
      for (const [key, entry] of current) {
        if (!previous.has(key)) active.set(key, freeze({ id: `construction-ceremony:${key}`, ...entry, startedAt: clock, expiresAt: clock + duration, durationMs: duration }));
      }
      for (const [key] of active) if (!current.has(key)) active.delete(key);
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

export default freeze({ EON_EXPANSE_W768S_CONSTRUCTION_CEREMONY_SCHEMA, createEonExpanseW768SConstructionCeremonyDirector });
