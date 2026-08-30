/** RT91 Signal — ten authored Zone Mastery missions layered after the existing campaign. */
import { EON_EXPANSE_W766_ZONES } from '../../w766/eon-expanse-w766-region-contract.js';

export const EON_CITY_RT91_SIGNAL_ZONE_MASTERY_SCHEMA = 'eon.city.signal.zone-mastery.rt91.v1';
const freeze = Object.freeze;
const verbs = new Set(['reach', 'inspect', 'scan', 'recover', 'repair', 'route', 'activate', 'stabilize', 'calibrate', 'investigate', 'return']);
const objective = (id, verb, label, targetKey) => freeze({ id, verb, label, targetKey, automaticCompletion: false });
const mission = ({ id, zoneId, label, prerequisiteMissionId, sequence, objectives, transformationHint }) => freeze({
  schema: EON_CITY_RT91_SIGNAL_ZONE_MASTERY_SCHEMA,
  id, worldId: 'signal-frontier', zoneId, label, prerequisiteMissionId, sequence,
  objectives: freeze(objectives),
  transformationHint,
  storyClass: 'zone-mastery',
  authored: true,
  repeatable: false,
  rewardAuthority: false,
  grantsXp: false,
  writesCampaignLedger: false,
  automaticCompletion: false,
  runtimeAiRequired: false,
  privateContentStored: false
});

export const EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS = freeze([
  mission({ id: 'gateway-frontier-bearings', zoneId: 'gateway-overlook', label: 'Frontier Bearings', prerequisiteMissionId: 'beyond-the-gate', sequence: 1, transformationHint: 'gateway-route-clarity', objectives: [objective('reach-panorama-frame', 'reach', 'Reach the outer panorama frame.', 'gateway-panorama-frame'), objective('inspect-relay-spine', 'inspect', 'Inspect the repaired relay spine.', 'gateway-relay-spine'), objective('scan-frontier-lines', 'scan', 'Scan the three outbound frontier lines.', 'gateway-frontier-lines'), objective('return-pathfinder', 'return', 'Return to Pathfinder at the overlook.', 'gateway-pathfinder')] }),
  mission({ id: 'gateway-relay-watch', zoneId: 'gateway-overlook', label: 'Relay Watch', prerequisiteMissionId: 'gateway-frontier-bearings', sequence: 2, transformationHint: 'gateway-ambient-traffic', objectives: [objective('reach-watch-relay', 'reach', 'Reach the watch relay.', 'gateway-watch-relay'), objective('inspect-static-break', 'inspect', 'Inspect the remaining static break.', 'gateway-static-break'), objective('repair-watch-relay', 'repair', 'Repair the watch relay.', 'gateway-watch-relay'), objective('activate-overlook-watch', 'activate', 'Activate the overlook watch circuit.', 'gateway-watch-circuit')] }),

  mission({ id: 'beacon-grid-resonance', zoneId: 'beacon-fields', label: 'Grid Resonance', prerequisiteMissionId: 'first-light', sequence: 1, transformationHint: 'beacon-grid-sequenced', objectives: [objective('reach-secondary-pylon', 'reach', 'Reach the secondary pylon field.', 'beacon-secondary-pylon'), objective('scan-grid-resonance', 'scan', 'Scan the pylon resonance pattern.', 'beacon-resonance-grid'), objective('calibrate-grid-phase', 'calibrate', 'Calibrate the field phase.', 'beacon-phase-console'), objective('activate-grid-sequence', 'activate', 'Activate the sequenced beacon grid.', 'beacon-grid-sequence')] }),
  mission({ id: 'beacon-maintenance-circuit', zoneId: 'beacon-fields', label: 'Maintenance Circuit', prerequisiteMissionId: 'beacon-grid-resonance', sequence: 2, transformationHint: 'beacon-maintenance-activity', objectives: [objective('reach-maintenance-drones', 'reach', 'Reach the maintenance drone circuit.', 'beacon-maintenance-circuit'), objective('recover-field-coupler', 'recover', 'Recover the damaged field coupler.', 'beacon-field-coupler'), objective('repair-drone-circuit', 'repair', 'Repair the maintenance circuit.', 'beacon-maintenance-circuit'), objective('return-beacon-core', 'return', 'Return to the Beacon core.', 'beacon-core')] }),

  mission({ id: 'archive-memory-fragments', zoneId: 'archive-ruins', label: 'Memory Fragments', prerequisiteMissionId: 'echoes-in-the-archive', sequence: 1, transformationHint: 'archive-memory-walls', objectives: [objective('reach-memory-wall', 'reach', 'Reach the fractured memory wall.', 'archive-memory-wall'), objective('investigate-memory-fracture', 'investigate', 'Investigate the memory fracture.', 'archive-memory-fracture'), objective('recover-memory-shard', 'recover', 'Recover the stable memory shard.', 'archive-memory-shard'), objective('scan-restored-record', 'scan', 'Scan the restored record.', 'archive-restored-record')] }),
  mission({ id: 'archive-silent-stacks', zoneId: 'archive-ruins', label: 'Silent Stacks', prerequisiteMissionId: 'archive-memory-fragments', sequence: 2, transformationHint: 'archive-orbiting-records', objectives: [objective('reach-silent-stack', 'reach', 'Reach the silent archive stack.', 'archive-silent-stack'), objective('inspect-stack-bridges', 'inspect', 'Inspect the disconnected archive bridges.', 'archive-stack-bridges'), objective('recover-index-key', 'recover', 'Recover the archive index key.', 'archive-index-key'), objective('activate-knowledge-orbit', 'activate', 'Activate the knowledge orbit.', 'archive-knowledge-orbit')] }),

  mission({ id: 'transit-service-corridor', zoneId: 'transit-scar', label: 'Service Corridor', prerequisiteMissionId: 'the-broken-line', sequence: 1, transformationHint: 'transit-service-line', objectives: [objective('reach-service-gantry', 'reach', 'Reach the damaged service gantry.', 'transit-service-gantry'), objective('repair-service-cable', 'repair', 'Repair the severed service cable.', 'transit-service-cable'), objective('route-maintenance-power', 'route', 'Route maintenance power through the corridor.', 'transit-power-router'), objective('return-maintainer', 'return', 'Return to the Maintenance Worker.', 'transit-maintainer')] }),
  mission({ id: 'transit-line-integrity', zoneId: 'transit-scar', label: 'Line Integrity', prerequisiteMissionId: 'transit-service-corridor', sequence: 2, transformationHint: 'transit-ambient-traffic', objectives: [objective('reach-line-integrity-console', 'reach', 'Reach the line-integrity console.', 'transit-integrity-console'), objective('inspect-rail-fracture', 'inspect', 'Inspect the remaining rail fracture.', 'transit-rail-fracture'), objective('calibrate-line-timing', 'calibrate', 'Calibrate the regional line timing.', 'transit-line-timing'), objective('activate-service-run', 'activate', 'Activate a service run.', 'transit-service-run')] }),

  mission({ id: 'vault-resonance', zoneId: 'horizon-vault', label: 'Vault Resonance', prerequisiteMissionId: 'horizon-reconnected', sequence: 1, transformationHint: 'vault-threshold-illumination', objectives: [objective('reach-outer-ring', 'reach', 'Reach the outer Vault ring.', 'vault-outer-ring'), objective('scan-vault-resonance', 'scan', 'Scan the resonance across the Vault threshold.', 'vault-resonance'), objective('stabilize-threshold-field', 'stabilize', 'Stabilize the threshold field.', 'vault-threshold-field'), objective('return-vault-interface', 'return', 'Return to the Vault interface.', 'vault-interface')] }),
  mission({ id: 'vault-beyond-threshold', zoneId: 'horizon-vault', label: 'Beyond the Threshold', prerequisiteMissionId: 'the-first-reveal', sequence: 2, transformationHint: 'vault-signature-state', objectives: [objective('reach-deep-frame', 'reach', 'Reach the deep chamber frame.', 'vault-deep-frame'), objective('investigate-frontier-signal', 'investigate', 'Investigate the signal beyond the restored route.', 'vault-frontier-signal'), objective('activate-horizon-observatory', 'activate', 'Activate the Horizon observatory.', 'vault-horizon-observatory'), objective('return-signal-vanguard', 'return', 'Return to the Signal Vanguard threshold.', 'vault-vanguard-threshold')] })
]);

export function validateEonCityRt91SignalZoneMastery() {
  const errors = [];
  const zoneIds = new Set(EON_EXPANSE_W766_ZONES.map((zone) => zone.id));
  const missionIds = new Set(EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS.map((entry) => entry.id));
  const perZone = new Map();
  for (const entry of EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS) {
    if (!zoneIds.has(entry.zoneId)) errors.push(`zone:${entry.id}`);
    perZone.set(entry.zoneId, (perZone.get(entry.zoneId) || 0) + 1);
    if (entry.objectives.length < 3 || entry.objectives.length > 4) errors.push(`objectives:${entry.id}`);
    if (!entry.prerequisiteMissionId || !entry.transformationHint) errors.push(`prerequisite:${entry.id}`);
    for (const step of entry.objectives) if (!verbs.has(step.verb) || !step.id || !step.targetKey || step.automaticCompletion !== false) errors.push(`objective:${entry.id}:${step?.id || 'missing'}`);
    if (entry.grantsXp || entry.rewardAuthority || entry.writesCampaignLedger || entry.automaticCompletion || entry.runtimeAiRequired || entry.privateContentStored) errors.push(`authority:${entry.id}`);
  }
  if (missionIds.size !== 10 || EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS.length !== 10) errors.push('mission-count');
  for (const zoneId of zoneIds) if (perZone.get(zoneId) !== 2) errors.push(`zone-mission-count:${zoneId}`);
  return freeze({ ok: errors.length === 0, errors: freeze(errors), missionCount: EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS.length, zoneCount: perZone.size });
}

export function listEonCityRt91SignalZoneMasteryMissions(zoneId = '') {
  const target = String(zoneId || '');
  return target ? freeze(EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS.filter((entry) => entry.zoneId === target)) : EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS;
}

export default freeze({ EON_CITY_RT91_SIGNAL_ZONE_MASTERY_SCHEMA, EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS, validateEonCityRt91SignalZoneMastery, listEonCityRt91SignalZoneMasteryMissions });
