/**
 * RT91 — bounded public gameplay context for optional EONBOT/AI guidance.
 *
 * This module does not invoke AI, resolve providers, read credentials, inspect
 * user work, or own any gameplay/progression authority. It only projects the
 * small public state that an already user-initiated EONBOT request may use.
 */
export const EON_CITY_RT91_AI_GUIDANCE_SCHEMA = 'eon.city.ai-guidance.rt91.v1';
const freeze = Object.freeze;
const WORLD_IDS = new Set(['command-hub', 'signal-frontier', 'storm-sector', 'my-frontier']);
const clean = (value = '', max = 160) => String(value || '').trim().replace(/\p{Cc}+/gu, ' ').slice(0, max);
const id = (value = '', max = 120) => clean(value, max).replace(/[^a-zA-Z0-9:_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max);

export function buildEonCityRt91AiGuidanceEnvelope(input = {}) {
  const worldRegionId = WORLD_IDS.has(String(input?.worldRegionId || '')) ? String(input.worldRegionId) : 'command-hub';
  return freeze({
    schema: EON_CITY_RT91_AI_GUIDANCE_SCHEMA,
    worldRegionId,
    worldLabel: clean(input?.worldLabel || worldRegionId, 80),
    missionId: id(input?.missionId, 96),
    objectiveId: id(input?.objectiveId, 96),
    nextAction: clean(input?.nextAction, 240),
    includesPrivateContent: false,
    localAiRequired: false,
    localAiOptional: true,
    userInitiatedAiOnly: true,
    deterministicGameplayAuthority: true,
    awardsXp: false,
    writesProgression: false,
    ownsMissionCompletion: false,
    ownsGeometry: false,
    ownsProviderSelection: false,
    readsPrompt: false,
    readsFiles: false,
    readsCredentials: false,
    networkRequestCreated: false
  });
}

export function validateEonCityRt91AiGuidanceEnvelope(value = {}) {
  const errors = [];
  if (value?.schema !== EON_CITY_RT91_AI_GUIDANCE_SCHEMA) errors.push('schema');
  if (!WORLD_IDS.has(String(value?.worldRegionId || ''))) errors.push('world');
  if (value?.includesPrivateContent !== false || value?.localAiRequired !== false || value?.localAiOptional !== true || value?.userInitiatedAiOnly !== true) errors.push('privacy-ai-boundary');
  if (value?.deterministicGameplayAuthority !== true || value?.awardsXp !== false || value?.writesProgression !== false || value?.ownsMissionCompletion !== false || value?.ownsGeometry !== false || value?.ownsProviderSelection !== false) errors.push('authority');
  if (value?.readsPrompt !== false || value?.readsFiles !== false || value?.readsCredentials !== false || value?.networkRequestCreated !== false) errors.push('io-boundary');
  for (const forbidden of ['prompt', 'rawPrompt', 'file', 'fileContent', 'credential', 'apiKey', 'providerKey', 'media', 'output', 'target', 'position']) if (Object.hasOwn(value || {}, forbidden)) errors.push(`forbidden:${forbidden}`);
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export default freeze({ EON_CITY_RT91_AI_GUIDANCE_SCHEMA, buildEonCityRt91AiGuidanceEnvelope, validateEonCityRt91AiGuidanceEnvelope });
