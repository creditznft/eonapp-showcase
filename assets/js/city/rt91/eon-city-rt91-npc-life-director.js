/** RT91 — low-frequency deterministic NPC life decisions; animation/render remains elsewhere. */
export const EON_CITY_RT91_NPC_LIFE_SCHEMA = 'eon.city.npc-life.rt91.v1';
const freeze = Object.freeze;
const STATES = freeze(['idle', 'travel', 'work', 'inspect', 'converse', 'shelter', 'react', 'guide', 'repair', 'dock', 'celebrate']);
const CADENCE = freeze({ lite: 1400, balanced: 1000, cinematic: 800 });

function hash32(value = '') {
  let hash = 2166136261;
  for (const character of String(value || 'npc')) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

export function deriveEonCityRt91NpcLifeDecision({ npcId = '', worldId = '', role = 'citizen', quality = 'balanced', at = Date.now(), nearPlayer = false, activeObjectiveRole = '', stormSeverity = 0, missionCompletedRecently = false, hiddenWorld = false } = {}) {
  const cadenceMs = CADENCE[String(quality)] || CADENCE.balanced;
  if (hiddenWorld) return freeze({ schema: EON_CITY_RT91_NPC_LIFE_SCHEMA, npcId: String(npcId), worldId: String(worldId), state: 'idle', active: false, cadenceMs: 0, reason: 'hidden-world-suspended', decisionRunsAtFrameRate: false, animationMayRunAtFrameRateWhenVisible: false, aiRequired: false, ownsAnimationLoop: false, grantsProgression: false });
  const candidates = ['idle', 'travel', 'work', 'inspect'];
  if (nearPlayer) candidates.push('converse', 'react');
  if (/guide|navigator|pathfinder/.test(String(role))) candidates.push('guide');
  if (/maintenance|engineer|worker/.test(String(role)) || /repair|maintenance/.test(String(activeObjectiveRole))) candidates.push('repair');
  if (Number(stormSeverity) >= 3) candidates.push('shelter', 'react');
  if (missionCompletedRecently) candidates.push('celebrate');
  if (/eonbot|dock/.test(String(role))) candidates.push('dock');
  const bucket = Math.floor((Number(at) || 0) / cadenceMs);
  const state = candidates[hash32(`${npcId}:${worldId}:${role}:${bucket}`) % candidates.length];
  return freeze({
    schema: EON_CITY_RT91_NPC_LIFE_SCHEMA,
    npcId: String(npcId),
    worldId: String(worldId),
    state,
    active: true,
    cadenceMs,
    decisionRunsAtFrameRate: false,
    animationMayRunAtFrameRateWhenVisible: true,
    aiRequired: false,
    ownsAnimationLoop: false,
    grantsProgression: false
  });
}

export function validateEonCityRt91NpcLifeDecision(decision = {}) {
  const errors = [];
  if (decision?.schema !== EON_CITY_RT91_NPC_LIFE_SCHEMA || !STATES.includes(decision?.state)) errors.push('state');
  if (decision?.active && (decision.cadenceMs < 700 || decision.cadenceMs > 1600)) errors.push('cadence');
  if (decision?.decisionRunsAtFrameRate === true || decision?.aiRequired === true || decision?.ownsAnimationLoop === true || decision?.grantsProgression === true) errors.push('authority');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export default freeze({ EON_CITY_RT91_NPC_LIFE_SCHEMA, deriveEonCityRt91NpcLifeDecision, validateEonCityRt91NpcLifeDecision });
