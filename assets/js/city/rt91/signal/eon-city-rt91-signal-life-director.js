/** RT91 Signal — bounded per-zone NPC and EONBOT life projection. */
import { EON_EXPANSE_W766_ZONES } from '../../w766/eon-expanse-w766-region-contract.js';
import { deriveEonCityRt91NpcLifeDecision } from '../eon-city-rt91-npc-life-director.js';
import { deriveEonCityRt91EonbotWorldBehavior } from '../eon-city-rt91-eonbot-world-director.js';

export const EON_CITY_RT91_SIGNAL_LIFE_SCHEMA = 'eon.city.signal.life-director.rt91.v1';
const freeze = Object.freeze;
const ROLES = freeze({
  'gateway-overlook': freeze(['pathfinder-guide', 'relay-technician']),
  'beacon-fields': freeze(['maintenance-worker', 'field-inspector']),
  'archive-ruins': freeze(['navigator-guide', 'archive-researcher']),
  'transit-scar': freeze(['maintenance-worker', 'transit-engineer']),
  'horizon-vault': freeze(['vault-steward', 'signal-inspector'])
});

export function deriveEonCityRt91SignalLife({ zoneId = 'gateway-overlook', quality = 'balanced', at = Date.now(), nearPlayer = true, objective = null, missionCompletedRecently = false, hiddenWorld = false } = {}) {
  const zone = EON_EXPANSE_W766_ZONES.find((entry) => entry.id === zoneId) || EON_EXPANSE_W766_ZONES[0];
  const roles = ROLES[zone.id] || freeze([]);
  const npcDecisions = roles.map((role, index) => deriveEonCityRt91NpcLifeDecision({
    npcId: `rt91-signal-${zone.id}-npc-${index + 1}`,
    worldId: 'signal-frontier',
    role,
    quality,
    at,
    nearPlayer,
    activeObjectiveRole: objective?.verb || '',
    missionCompletedRecently,
    hiddenWorld
  }));
  const eonbot = deriveEonCityRt91EonbotWorldBehavior({
    worldId: 'signal-frontier',
    objective,
    discoveryNearby: objective?.verb === 'scan' || objective?.verb === 'investigate',
    interactableNearby: ['inspect', 'repair', 'activate', 'calibrate'].includes(objective?.verb),
    missionCompletedRecently,
    dockingAvailable: zone.id === 'gateway-overlook'
  });
  return freeze({
    schema: EON_CITY_RT91_SIGNAL_LIFE_SCHEMA,
    worldId: 'signal-frontier',
    zoneId: zone.id,
    npcDecisions: freeze(npcDecisions),
    eonbot,
    npcDecisionCadenceFrameRate: false,
    visibleAnimationMayRunAtFrameRate: !hiddenWorld,
    hiddenWorldSuspended: hiddenWorld,
    fullWorldPopulationAlwaysActive: false,
    runtimeAiRequired: false,
    ownsRenderLoop: false
  });
}

export function validateEonCityRt91SignalLife(result = {}) {
  const errors = [];
  if (result.schema !== EON_CITY_RT91_SIGNAL_LIFE_SCHEMA || result.worldId !== 'signal-frontier') errors.push('schema-world');
  if (!EON_EXPANSE_W766_ZONES.some((zone) => zone.id === result.zoneId)) errors.push('zone');
  if (result.npcDecisions?.length !== 2) errors.push('npc-budget');
  for (const npc of result.npcDecisions || []) {
    if (npc.worldId !== 'signal-frontier' || npc.decisionRunsAtFrameRate === true || npc.ownsAnimationLoop === true || npc.grantsProgression === true) errors.push(`npc:${npc?.npcId || 'missing'}`);
  }
  if (result.eonbot?.autoCompletesObjective !== false || result.eonbot?.autoNavigatesPlayer !== false || result.eonbot?.grantsProgression !== false) errors.push('eonbot-authority');
  if (result.npcDecisionCadenceFrameRate || result.fullWorldPopulationAlwaysActive || result.runtimeAiRequired || result.ownsRenderLoop) errors.push('runtime-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), npcCount: result.npcDecisions?.length || 0 });
}

export default freeze({ EON_CITY_RT91_SIGNAL_LIFE_SCHEMA, deriveEonCityRt91SignalLife, validateEonCityRt91SignalLife });
