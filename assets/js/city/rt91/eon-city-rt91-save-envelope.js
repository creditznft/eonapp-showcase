/**
 * RT91 — bounded versioned save envelope for new Living Frontier metadata.
 * Existing campaign/XP/unlock authorities remain outside this envelope.
 */
import { normalizeEonCityRt91ActivityHistory } from './eon-city-rt91-anti-repetition.js';

export const EON_CITY_RT91_SAVE_SCHEMA = 'eon.city.living-frontier-save.rt91.v1';
const freeze = Object.freeze;
const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{1,119}$/i;
const WORLDS = new Set(['command-hub', 'signal-frontier', 'storm-sector', 'my-frontier']);
const DISTRICTS = new Set(['central', 'creator', 'knowledge', 'systems', 'signal', 'transit', 'personal']);
const cleanId = (value = '') => SAFE_ID.test(String(value || '').trim()) ? String(value || '').trim().toLowerCase() : '';
const uniqueIds = (values = [], limit = 200) => freeze([...new Set((values || []).map(cleanId).filter(Boolean))].slice(-limit));

export function sanitizeEonCityRt91SaveEnvelope(input = {}) {
  const districtLevels = {};
  for (const [districtId, level] of Object.entries(input?.districtLevels || {})) {
    if (!DISTRICTS.has(String(districtId))) continue;
    districtLevels[districtId] = Math.max(0, Math.min(4, Math.floor(Number(level) || 0)));
  }
  const currentWorldId = WORLDS.has(String(input?.currentWorldId || '')) ? String(input.currentWorldId) : 'command-hub';
  return freeze({
    schema: EON_CITY_RT91_SAVE_SCHEMA,
    version: 1,
    worldSeed: String(input?.worldSeed || 'eoncity-living-frontier').slice(0, 80),
    currentWorldId,
    lastTravelAnchorId: cleanId(input?.lastTravelAnchorId),
    contractHistory: normalizeEonCityRt91ActivityHistory(input?.contractHistory),
    completedContractIds: uniqueIds(input?.completedContractIds, 120),
    discoveredActivityCellIds: uniqueIds(input?.discoveredActivityCellIds, 240),
    worldTransformationFlags: uniqueIds(input?.worldTransformationFlags, 240),
    districtLevels: freeze(districtLevels),
    updatedAt: Math.max(0, Number(input?.updatedAt || 0)),
    privateContentStored: false,
    rawPromptStored: false,
    rawFileContentStored: false,
    credentialsStored: false,
    ownsXpAuthority: false,
    ownsUnlockAuthority: false,
    ownsBuildingCoordinateAuthority: false
  });
}

export function migrateEonCityRt91SaveEnvelope(input = {}) {
  if (input?.schema === EON_CITY_RT91_SAVE_SCHEMA && Number(input?.version) === 1) return sanitizeEonCityRt91SaveEnvelope(input);
  return sanitizeEonCityRt91SaveEnvelope({
    worldSeed: input?.worldSeed || input?.seed,
    currentWorldId: input?.currentWorldId || input?.worldId,
    lastTravelAnchorId: input?.lastTravelAnchorId || input?.anchorId,
    contractHistory: input?.contractHistory || input?.history,
    completedContractIds: input?.completedContractIds || input?.contractsCompleted,
    discoveredActivityCellIds: input?.discoveredActivityCellIds || input?.discoveries,
    worldTransformationFlags: input?.worldTransformationFlags || input?.transformations,
    districtLevels: input?.districtLevels,
    updatedAt: input?.updatedAt
  });
}

export function validateEonCityRt91SaveEnvelope(envelope = {}) {
  const errors = [];
  if (envelope?.schema !== EON_CITY_RT91_SAVE_SCHEMA || envelope?.version !== 1) errors.push('schema');
  if (!WORLDS.has(envelope?.currentWorldId)) errors.push('world');
  if ((envelope?.contractHistory?.length || 0) > 12 || (envelope?.completedContractIds?.length || 0) > 120 || (envelope?.discoveredActivityCellIds?.length || 0) > 240) errors.push('bounds');
  if (Object.entries(envelope?.districtLevels || {}).some(([id, level]) => !DISTRICTS.has(id) || level < 0 || level > 4)) errors.push('district-levels');
  if (envelope?.privateContentStored || envelope?.rawPromptStored || envelope?.rawFileContentStored || envelope?.credentialsStored) errors.push('privacy');
  if (envelope?.ownsXpAuthority || envelope?.ownsUnlockAuthority || envelope?.ownsBuildingCoordinateAuthority) errors.push('authority');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export default freeze({ EON_CITY_RT91_SAVE_SCHEMA, sanitizeEonCityRt91SaveEnvelope, migrateEonCityRt91SaveEnvelope, validateEonCityRt91SaveEnvelope });
