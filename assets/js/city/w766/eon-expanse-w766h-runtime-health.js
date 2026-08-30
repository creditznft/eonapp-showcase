const freeze = (value) => Object.freeze(value);
export const EON_EXPANSE_W766H_HEALTH_SCHEMA = 'eon.city.expanse.runtime-health.w766h.v1';
export function createEonExpanseW766HRuntimeHealth() {
  let counters = { mounts: 0, disposals: 0, activeRoots: 0, activeObservers: 0, transitJourneys: 0, failedTransitions: 0, maxActiveRoots: 0, lastReason: '' };
  const update = (patch) => { counters = { ...counters, ...patch }; counters.maxActiveRoots = Math.max(counters.maxActiveRoots, counters.activeRoots); return freeze({ ...counters }); };
  return freeze({
    mount({ observers = 0 } = {}) { return update({ mounts: counters.mounts + 1, activeRoots: counters.activeRoots + 1, activeObservers: counters.activeObservers + Number(observers || 0) }); },
    dispose({ observers = 0 } = {}) { return update({ disposals: counters.disposals + 1, activeRoots: Math.max(0, counters.activeRoots - 1), activeObservers: Math.max(0, counters.activeObservers - Number(observers || 0)) }); },
    beginTransit() { return update({ transitJourneys: counters.transitJourneys + 1 }); },
    transitionFailure(reason = 'unknown') { return update({ failedTransitions: counters.failedTransitions + 1, lastReason: String(reason) }); },
    getState() { return freeze({ schema: EON_EXPANSE_W766H_HEALTH_SCHEMA, ...counters, balancedLifecycle: counters.mounts === counters.disposals + counters.activeRoots, leakSuspected: counters.activeRoots > 1 || counters.activeObservers > Math.max(1, counters.activeRoots * 4) }); },
    certify() { const state = this.getState(); const failures = []; if (!state.balancedLifecycle) failures.push('mount-disposal-imbalance'); if (state.activeRoots > 1) failures.push('duplicate-expanse-root'); if (state.leakSuspected) failures.push('resource-leak-suspected'); return freeze({ ok: failures.length === 0, failures: freeze(failures), state }); }
  });
}
