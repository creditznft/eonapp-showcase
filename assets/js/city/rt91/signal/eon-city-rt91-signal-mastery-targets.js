/** RT91 Signal — deterministic physical target contracts for all 40 Zone Mastery objectives. */
import { EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS } from './eon-city-rt91-signal-zone-mastery.js';
import { buildEonCityRt91SignalContractCells } from './eon-city-rt91-signal-contract-cells.js';

export const EON_CITY_RT91_SIGNAL_MASTERY_TARGET_SCHEMA = 'eon.city.signal.mastery-targets.rt91.v1';
const freeze = Object.freeze;
const RANGE_BY_VERB = freeze({ reach: 3.4, inspect: 2.7, scan: 4.4, recover: 2.3, repair: 2.6, route: 2.8, activate: 2.5, stabilize: 2.9, calibrate: 2.6, investigate: 3.1, return: 3.5 });
function hash32(value = '') { let h = 2166136261; for (const c of String(value)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

export function buildEonCityRt91SignalMasteryTargets() {
  const cells = buildEonCityRt91SignalContractCells().cells;
  const byZone = new Map();
  for (const cell of cells) { const rows = byZone.get(cell.zoneId) || []; rows.push(cell); byZone.set(cell.zoneId, rows); }
  const targets = [];
  for (const mission of EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS) {
    const zoneCells = byZone.get(mission.zoneId) || [];
    mission.objectives.forEach((objective, index) => {
      const seed = hash32(`${mission.id}:${objective.id}:${objective.targetKey}:${index}`);
      const cell = zoneCells[seed % Math.max(1, zoneCells.length)];
      const angle = ((seed >>> 5) % 360) * Math.PI / 180;
      const radius = 1.2 + ((seed >>> 13) % 18) / 10;
      const position = freeze({
        x: Number((Number(cell?.position?.x || 0) + Math.cos(angle) * radius).toFixed(2)),
        y: 0.2,
        z: Number((Number(cell?.position?.z || 0) + Math.sin(angle) * radius).toFixed(2))
      });
      targets.push(freeze({
        id: `target:${mission.id}:${objective.id}`,
        targetKey: objective.targetKey,
        missionId: mission.id,
        objectiveId: objective.id,
        zoneId: mission.zoneId,
        verb: objective.verb,
        label: objective.label,
        cellId: cell?.cellId || '',
        position,
        interactionAction: `rt91-signal-objective:${mission.id}:${objective.id}`,
        interactionRange: RANGE_BY_VERB[objective.verb] || 2.8,
        interactive: true,
        requiresExplicitUserAction: true,
        requiresVerifiedReceipt: true,
        rawUserCoordinatesAccepted: false,
        grantsXp: false,
        writesCampaignLedger: false
      }));
    });
  }
  return freeze({
    schema: EON_CITY_RT91_SIGNAL_MASTERY_TARGET_SCHEMA,
    worldId: 'signal-frontier',
    targets: freeze(targets),
    targetCount: targets.length,
    allObjectivesPhysicallyAddressable: targets.length === 40,
    ownsGeometry: false,
    ownsMissionState: false
  });
}

export function validateEonCityRt91SignalMasteryTargets(plan = buildEonCityRt91SignalMasteryTargets()) {
  const errors = [];
  if (plan.schema !== EON_CITY_RT91_SIGNAL_MASTERY_TARGET_SCHEMA || plan.worldId !== 'signal-frontier') errors.push('schema-world');
  if (plan.targetCount !== 40 || plan.targets?.length !== 40 || plan.allObjectivesPhysicallyAddressable !== true) errors.push('count');
  const keys = new Set();
  for (const target of plan.targets || []) {
    const key = `${target.missionId}:${target.objectiveId}`;
    if (keys.has(key) || !target.cellId || !target.targetKey) errors.push(`target:${key}`);
    keys.add(key);
    if (![target.position?.x, target.position?.z].every(Number.isFinite)) errors.push(`position:${key}`);
    if (target.interactive !== true || target.requiresExplicitUserAction !== true || target.requiresVerifiedReceipt !== true || target.rawUserCoordinatesAccepted !== false || target.grantsXp || target.writesCampaignLedger) errors.push(`authority:${key}`);
  }
  if (plan.ownsGeometry || plan.ownsMissionState) errors.push('owner');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), targetCount: plan.targets?.length || 0 });
}

export default freeze({ EON_CITY_RT91_SIGNAL_MASTERY_TARGET_SCHEMA, buildEonCityRt91SignalMasteryTargets, validateEonCityRt91SignalMasteryTargets });
