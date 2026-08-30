/** W659G compatibility facade over the canonical asset-bound W659F NPC authority. */
import { normalizeEonCityDistrictId } from '../eon-city-district-identity.js';
import {
  EON_CITY_W659F_NPC_ROLES,
  getEonCityW659fNpcRole,
  getEonCityW659fNpcRolesForDistrict,
  validateEonCityW659fNpcRoles
} from '../w659f/eon-city-w659f-npc-role-registry.js';

export const EON_CITY_W659G_NPC_OPERATOR_SCHEMA = 'eon.city.w659g.npc-operators.v2';
const freeze = (value) => Object.freeze(value);
const toSet = (values = []) => values instanceof Set ? values : new Set(values || []);

export const EON_CITY_W659G_NPC_OPERATORS = EON_CITY_W659F_NPC_ROLES;

export function getEonCityW659gNpcOperator(id = '') {
  return getEonCityW659fNpcRole(id);
}

export function getEonCityW659gNpcActionsForDistrict(districtId = '') {
  const entries = getEonCityW659fNpcRolesForDistrict(normalizeEonCityDistrictId(districtId));
  return freeze(entries.flatMap((entry) => entry.actions.map((item) => freeze({
    ...item,
    operatorId: entry.id,
    operatorLabel: entry.label,
    operatorAssetId: entry.assetId,
    purpose: `${entry.label}: ${item.purpose}`
  }))));
}

export function resolveEonCityW659gNpcOperatorsNearPosition({
  districtId = '',
  position = {},
  residentAssetIds = [],
  residentStationIds = []
} = {}) {
  const canonicalDistrictId = normalizeEonCityDistrictId(districtId);
  const assets = toSet(residentAssetIds);
  const stations = toSet(residentStationIds);
  const rows = [];
  for (const entry of getEonCityW659fNpcRolesForDistrict(canonicalDistrictId)) {
    const residentAssetId = [entry.assetId, ...(entry.fallbackAssetIds || [])].find((assetId) => assets.has(assetId)) || null;
    if (!residentAssetId) continue;
    const pairedResident = entry.nearbyStationId ? stations.has(entry.nearbyStationId) : assets.has(entry.nearbyBuildingId);
    if (!pairedResident) continue;
    const distance = Math.hypot(Number(position?.x || 0) - entry.interactionPoint.x, Number(position?.z || 0) - entry.interactionPoint.z);
    if (distance > entry.interactionRadius) continue;
    rows.push(freeze({
      ...entry,
      residentAssetId,
      distance,
      districtId: canonicalDistrictId,
      interactionState: 'available-for-review',
      operatorBinding: freeze({
        assetId: residentAssetId,
        nearbyStationId: entry.nearbyStationId,
        nearbyBuildingId: entry.nearbyBuildingId,
        pairedResident: true
      })
    }));
  }
  rows.sort((left, right) => left.distance - right.distance || left.id.localeCompare(right.id));
  return freeze(rows);
}

export function validateEonCityW659gNpcOperators() {
  const result = validateEonCityW659fNpcRoles(EON_CITY_W659G_NPC_OPERATORS);
  return freeze({ ...result, schema: EON_CITY_W659G_NPC_OPERATOR_SCHEMA, canonicalRegistry: 'w659f-npc-role-registry' });
}
