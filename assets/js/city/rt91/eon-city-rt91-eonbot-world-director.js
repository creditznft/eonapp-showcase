/** RT91 — deterministic EONBOT world behavior projection; Local AI may enrich copy, not authority. */
export const EON_CITY_RT91_EONBOT_WORLD_SCHEMA = 'eon.city.eonbot-world-director.rt91.v1';
const freeze = Object.freeze;

export function deriveEonCityRt91EonbotWorldBehavior({ worldId = '', objective = null, hazardSeverity = 0, discoveryNearby = false, interactableNearby = false, playerIdleMs = 0, missionCompletedRecently = false, dockingAvailable = false } = {}) {
  let state = 'orbit';
  let purpose = 'stay near the player without blocking movement or camera';
  if (missionCompletedRecently) { state = 'celebrate'; purpose = 'acknowledge the completed objective'; }
  else if (Number(hazardSeverity) >= 3) { state = 'warn'; purpose = 'warn about the nearby environmental hazard'; }
  else if (objective?.position) { state = 'guide'; purpose = 'move ahead toward the active objective without auto-navigating the player'; }
  else if (interactableNearby) { state = 'inspect'; purpose = 'inspect the nearby reviewed interaction'; }
  else if (discoveryNearby) { state = 'scout'; purpose = 'scout the nearby discovery'; }
  else if (dockingAvailable && Number(playerIdleMs) >= 12_000) { state = 'dock'; purpose = 'dock at a nearby authored companion point'; }
  else if (Number(playerIdleMs) >= 8_000) { state = 'wander'; purpose = 'perform a short bounded ambient exploration'; }
  return freeze({
    schema: EON_CITY_RT91_EONBOT_WORLD_SCHEMA,
    worldId: String(worldId || ''),
    state,
    purpose,
    positioning: freeze({ minimumPlayerDistance: 1.6, preferredPlayerDistance: state === 'guide' ? 3.4 : 2.4, maximumPlayerDistance: 5.5, avoidCameraCenterCone: true, blocksPlayerCollision: false }),
    localAiMayEnrichDialogue: true,
    localAiRequired: false,
    autoCompletesObjective: false,
    autoNavigatesPlayer: false,
    grantsProgression: false
  });
}

export default freeze({ EON_CITY_RT91_EONBOT_WORLD_SCHEMA, deriveEonCityRt91EonbotWorldBehavior });
