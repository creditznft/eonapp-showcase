/** W794A — explicit, transient Storm Sector gateway journey controller. */
import { sanitizeEonExpanseW793AActivation } from '../w793/eon-expanse-w793a-future-region-activation.js';
import {
  EON_EXPANSE_W792B_STORM_SECTOR_ARRIVAL
} from '../w792/eon-expanse-w792b-storm-sector-layout.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W794A_STORM_JOURNEY_SCHEMA = 'eon.expanse.storm-sector-journey.w794a.v1';
export const EON_EXPANSE_W794A_SIGNAL_FRONTIER_RETURN = freeze({ x: 43, y: 0.45, z: -142 });

export function createEonExpanseW794AStormSectorJourney({ now = Date.now, durationMs = 2800 } = {}) {
  const duration = Math.max(800, Math.min(8000, Number(durationMs) || 2800));
  let activation = null;
  let state = freeze({
    schema: EON_EXPANSE_W794A_STORM_JOURNEY_SCHEMA,
    status: 'gateway-locked',
    regionId: 'signal-frontier',
    targetRegionId: 'storm-sector',
    direction: '',
    startedAt: 0,
    completesAt: 0,
    progress: 0,
    transitionPending: false,
    explicitUserAction: false,
    automaticTravel: false,
    grantsXp: false,
    privateContentStored: false
  });

  const project = (patch = {}) => {
    state = freeze({ ...state, ...patch, schema: EON_EXPANSE_W794A_STORM_JOURNEY_SCHEMA, automaticTravel: false, grantsXp: false, privateContentStored: false });
    return state;
  };

  const syncActivation = (candidate = null) => {
    activation = sanitizeEonExpanseW793AActivation(candidate);
    if (!activation && !['departing', 'returning', 'storm-sector-active'].includes(state.status)) project({ status: 'gateway-locked', regionId: 'signal-frontier', direction: '', transitionPending: false });
    else if (activation && state.status === 'gateway-locked') project({ status: 'gateway-ready', regionId: 'signal-frontier', direction: '', transitionPending: false });
    return freeze({ ok: true, available: Boolean(activation), state });
  };

  const start = (direction, { explicitUserAction = false, expectedActivationId = '' } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', state });
    if (!activation) return freeze({ ok: false, reason: 'storm-sector-gateway-locked', state });
    if (expectedActivationId && expectedActivationId !== activation.activationId) return freeze({ ok: false, reason: 'activation-stale', state });
    const entering = direction === 'enter';
    const allowed = entering ? state.status === 'gateway-ready' : state.status === 'storm-sector-active';
    if (!allowed) return freeze({ ok: false, reason: entering ? 'storm-sector-entry-unavailable' : 'storm-sector-return-unavailable', state });
    const startedAt = Math.max(1, Number(now()) || Date.now());
    project({
      status: entering ? 'departing' : 'returning',
      direction,
      startedAt,
      completesAt: startedAt + duration,
      progress: 0,
      transitionPending: false,
      explicitUserAction: true
    });
    return freeze({ ok: true, state, activationId: activation.activationId, packageDigest: activation.packageDigest, buildDigest: activation.buildDigest, deploymentChannel: activation.deploymentChannel });
  };

  const update = (at = now()) => {
    if (!['departing', 'returning'].includes(state.status)) return freeze({ ok: true, state, changed: false });
    const current = Math.max(state.startedAt, Number(at) || state.startedAt);
    const progress = Math.min(1, Math.max(0, (current - state.startedAt) / Math.max(1, state.completesAt - state.startedAt)));
    if (progress < 1) {
      project({ progress });
      return freeze({ ok: true, state, changed: true, completed: false });
    }
    const entered = state.direction === 'enter';
    project({
      status: entered ? 'storm-sector-active' : activation ? 'gateway-ready' : 'gateway-locked',
      regionId: entered ? 'storm-sector' : 'signal-frontier',
      direction: '',
      progress: 1,
      transitionPending: true
    });
    return freeze({
      ok: true,
      state,
      changed: true,
      completed: true,
      transition: freeze({
        type: entered ? 'enter-storm-sector' : 'return-signal-frontier',
        regionId: state.regionId,
        position: entered ? EON_EXPANSE_W792B_STORM_SECTOR_ARRIVAL : EON_EXPANSE_W794A_SIGNAL_FRONTIER_RETURN,
        activationId: activation?.activationId || '',
        packageDigest: activation?.packageDigest || '',
        explicitUserAction: true,
        teleportPresentation: false,
        grantsXp: false
      })
    });
  };

  const consumeTransition = () => {
    if (!state.transitionPending) return freeze({ ok: false, reason: 'transition-unavailable', state });
    const type = state.regionId === 'storm-sector' ? 'enter-storm-sector' : 'return-signal-frontier';
    const transition = freeze({
      type,
      regionId: state.regionId,
      position: state.regionId === 'storm-sector' ? EON_EXPANSE_W792B_STORM_SECTOR_ARRIVAL : EON_EXPANSE_W794A_SIGNAL_FRONTIER_RETURN,
      activationId: activation?.activationId || '',
      packageDigest: activation?.packageDigest || '',
      explicitUserAction: true,
      grantsXp: false
    });
    project({ transitionPending: false, startedAt: 0, completesAt: 0 });
    return freeze({ ok: true, transition, state });
  };

  return freeze({
    schema: EON_EXPANSE_W794A_STORM_JOURNEY_SCHEMA,
    syncActivation,
    startEnter(options = {}) { return start('enter', options); },
    startReturn(options = {}) { return start('return', options); },
    update,
    consumeTransition,
    getState() { return state; },
    reset({ explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', state });
      project({ status: activation ? 'gateway-ready' : 'gateway-locked', regionId: 'signal-frontier', direction: '', startedAt: 0, completesAt: 0, progress: 0, transitionPending: false, explicitUserAction: true });
      return freeze({ ok: true, state });
    }
  });
}

export default freeze({ EON_EXPANSE_W794A_STORM_JOURNEY_SCHEMA, EON_EXPANSE_W794A_SIGNAL_FRONTIER_RETURN, createEonExpanseW794AStormSectorJourney });
