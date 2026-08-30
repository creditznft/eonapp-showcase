/** W797A — explicit, mission-gated intra-region Transit for Storm Sector. */
import { EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST } from '../w792/eon-expanse-w792a-storm-sector-authored-package.js';
import { sanitizeEonExpanseW795AStormMissionState } from '../w795/eon-expanse-w795a-storm-sector-mission-runtime.js';

const freeze = Object.freeze;
const point = (x, y, z) => freeze({ x, y, z });
export const EON_EXPANSE_W797A_STORM_TRANSIT_SCHEMA = 'eon.expanse.storm-sector.transit.w797a.v1';
export const EON_EXPANSE_W797A_STORM_TRANSIT_NODES = freeze([
  freeze({ id: 'charged-gateway', label: 'Charged Gateway', position: point(952, 0.45, -174), requiredMissionId: '' }),
  freeze({ id: 'relay-basin', label: 'Relay Basin', position: point(990, 0.45, -158), requiredMissionId: '' }),
  freeze({ id: 'stabilizer-ridge', label: 'Stabilizer Ridge', position: point(1050, 0.45, -202), requiredMissionId: 'weather-restoration' }),
  freeze({ id: 'storm-eye', label: 'Storm Eye', position: point(1108, 0.45, -182), requiredMissionId: 'relay-repair' })
]);

const nodeById = new Map(EON_EXPANSE_W797A_STORM_TRANSIT_NODES.map((entry) => [entry.id, entry]));
const clonePoint = (candidate = {}) => point(Number(candidate.x || 0), Number(candidate.y || 0.45), Number(candidate.z || 0));
const distance2d = (a = {}, b = {}) => Math.hypot(Number(a.x || 0) - Number(b.x || 0), Number(a.z || 0) - Number(b.z || 0));

export function deriveEonExpanseW797AStormTransitView({ missionState = null, currentPosition = null, journeyState = null } = {}) {
  const missions = sanitizeEonExpanseW795AStormMissionState(missionState);
  const completed = new Set(missions.completedMissionIds || []);
  const activeJourney = journeyState?.status === 'active' ? journeyState : null;
  const nodes = EON_EXPANSE_W797A_STORM_TRANSIT_NODES.map((entry) => {
    const unlocked = !entry.requiredMissionId || completed.has(entry.requiredMissionId);
    const distance = currentPosition ? distance2d(currentPosition, entry.position) : null;
    return freeze({
      ...entry,
      unlocked,
      lockReason: unlocked ? '' : `Complete ${entry.requiredMissionId.replaceAll('-', ' ')} first.`,
      distance,
      nearby: distance !== null && distance <= 5.5,
      activeDestination: activeJourney?.destinationNodeId === entry.id,
      explicitUserActionRequired: true
    });
  });
  return freeze({
    schema: EON_EXPANSE_W797A_STORM_TRANSIT_SCHEMA,
    regionId: 'storm-sector',
    packageDigest: EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST,
    nodes: freeze(nodes),
    unlockedNodeCount: nodes.filter((entry) => entry.unlocked).length,
    totalNodeCount: nodes.length,
    journey: activeJourney,
    grantsXp: false,
    automaticTravel: false,
    rawCoordinatesAccepted: false,
    privateContentStored: false
  });
}

export function createEonExpanseW797AStormTransitController({ durationMs = 1900, now = Date.now } = {}) {
  const safeDuration = Math.max(700, Math.min(5000, Number(durationMs) || 1900));
  let state = freeze({
    schema: EON_EXPANSE_W797A_STORM_TRANSIT_SCHEMA,
    status: 'idle',
    regionId: 'storm-sector',
    packageDigest: EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST,
    startedAt: 0,
    durationMs: safeDuration,
    source: null,
    destination: null,
    destinationNodeId: '',
    pose: null,
    progress: 0,
    transition: null,
    grantsXp: false,
    automaticTravel: false,
    privateContentStored: false
  });

  const start = ({ destinationNodeId = '', currentPosition = null, missionState = null, explicitUserAction = false } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', state });
    if (state.status === 'active') return freeze({ ok: false, reason: 'storm-transit-already-active', state });
    const node = nodeById.get(String(destinationNodeId || '')) || null;
    if (!node) return freeze({ ok: false, reason: 'storm-transit-node-unknown', state });
    const view = deriveEonExpanseW797AStormTransitView({ missionState, currentPosition });
    const nodeView = view.nodes.find((entry) => entry.id === node.id);
    if (!nodeView?.unlocked) return freeze({ ok: false, reason: 'storm-transit-node-locked', nodeId: node.id, state, view });
    const source = clonePoint(currentPosition || node.position);
    if (distance2d(source, node.position) <= 4) return freeze({ ok: false, reason: 'storm-transit-already-at-destination', nodeId: node.id, state, view });
    const startedAt = Math.max(1, Number(now()) || Date.now());
    state = freeze({
      ...state,
      status: 'active',
      startedAt,
      source,
      destination: node.position,
      destinationNodeId: node.id,
      pose: source,
      progress: 0,
      transition: null,
      grantsXp: false,
      automaticTravel: false,
      privateContentStored: false
    });
    return freeze({ ok: true, state, node: nodeView, grantsXp: false, automaticTravel: false });
  };

  const update = (timeMs = now()) => {
    if (state.status !== 'active') return state;
    const elapsed = Math.max(0, Number(timeMs) - state.startedAt);
    const raw = Math.max(0, Math.min(1, elapsed / state.durationMs));
    const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
    const source = state.source;
    const destination = state.destination;
    const lift = Math.sin(Math.PI * eased) * 1.6;
    const pose = point(
      source.x + (destination.x - source.x) * eased,
      source.y + (destination.y - source.y) * eased + lift,
      source.z + (destination.z - source.z) * eased
    );
    if (raw < 1) {
      state = freeze({ ...state, pose, progress: raw });
      return state;
    }
    state = freeze({
      ...state,
      status: 'complete',
      pose: destination,
      progress: 1,
      transition: freeze({
        type: 'storm-sector-transit-complete',
        destinationNodeId: state.destinationNodeId,
        position: destination,
        packageDigest: state.packageDigest,
        grantsXp: false,
        automaticTravel: false
      })
    });
    return state;
  };

  const consumeTransition = () => {
    const transition = state.transition;
    state = freeze({ ...state, status: 'idle', startedAt: 0, source: null, destination: null, destinationNodeId: '', pose: null, progress: 0, transition: null });
    return transition;
  };

  const cancel = ({ explicitUserAction = false, reason = 'storm-transit-cancelled' } = {}) => {
    if (!explicitUserAction && state.status === 'active') return freeze({ ok: false, reason: 'explicit-user-action-required', state });
    const wasActive = state.status === 'active';
    state = freeze({ ...state, status: 'idle', startedAt: 0, source: null, destination: null, destinationNodeId: '', pose: null, progress: 0, transition: null });
    return freeze({ ok: true, cancelled: wasActive, reason, state });
  };

  return freeze({
    schema: EON_EXPANSE_W797A_STORM_TRANSIT_SCHEMA,
    start,
    update,
    consumeTransition,
    cancel,
    getState() { return state; },
    getView(missionState = null, currentPosition = null) { return deriveEonExpanseW797AStormTransitView({ missionState, currentPosition, journeyState: state }); }
  });
}

export default freeze({
  EON_EXPANSE_W797A_STORM_TRANSIT_SCHEMA,
  EON_EXPANSE_W797A_STORM_TRANSIT_NODES,
  deriveEonExpanseW797AStormTransitView,
  createEonExpanseW797AStormTransitController
});
