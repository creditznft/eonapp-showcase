/** Canonical EON City district identity and backwards-compatible aliases. */
export const EON_CITY_DISTRICT_IDENTITY_SCHEMA = 'eon.city.district-identity.v1';
const freeze = (value) => Object.freeze(value);

export const EON_CITY_DISTRICT_ID_ALIASES = freeze({
  'realm-relay': 'trade-dome',
  'local-ai-observatory': 'vault-station'
});

export function normalizeEonCityDistrictId(value = '') {
  const id = String(value || '').trim().toLowerCase();
  return EON_CITY_DISTRICT_ID_ALIASES[id] || id;
}

export function isEonCityDistrictAlias(value = '') {
  const id = String(value || '').trim().toLowerCase();
  return Object.hasOwn(EON_CITY_DISTRICT_ID_ALIASES, id);
}

export function getEonCityDistrictIdentity(value = '') {
  const requestedId = String(value || '').trim().toLowerCase();
  const districtId = normalizeEonCityDistrictId(requestedId);
  return freeze({
    schema: EON_CITY_DISTRICT_IDENTITY_SCHEMA,
    requestedId,
    districtId,
    aliasApplied: requestedId !== districtId
  });
}
