/** W711 — street-readable identity and useful arrival frontage for all Core districts. */
export const EON_CITY_W711_DISTRICT_STREET_IDENTITY_SCHEMA = 'eon.city.district-street-identity.w711.v1';
const freeze = Object.freeze;
const round = (value, places = 3) => Number(Number(value || 0).toFixed(places));
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const point = (x = 0, y = 0, z = 0) => freeze({ x: round(x), y: round(y), z: round(z) });
const PURPOSES = freeze({
  'orientation-hall': freeze({ purposeLine: 'Start · Learn · Enter Expanse', form: 'arrival-spire', accent: 'orientation' }),
  'transit-network': freeze({ purposeLine: 'Travel · Routes · Accessibility', form: 'signal-ring', accent: 'mobility' }),
  'agent-theatre': freeze({ purposeLine: 'Review · Approve · Verify', form: 'review-steps', accent: 'proposal' }),
  'creator-atrium': freeze({ purposeLine: 'Create · Capture · Publish', form: 'creator-frame', accent: 'creation' }),
  'forge-basilica': freeze({ purposeLine: 'Build · Test · Export', form: 'forge-stack', accent: 'forge' }),
  'command-centre': freeze({ purposeLine: 'Monitor · Coordinate · Decide', form: 'command-prism', accent: 'command' }),
  'archive-canopy': freeze({ purposeLine: 'Search · Learn · Retrieve', form: 'knowledge-canopy', accent: 'archive' }),
  'vault-station': freeze({ purposeLine: 'Protect · Recover · Verify', form: 'vault-monolith', accent: 'custody' }),
  'trade-dome': freeze({ purposeLine: 'Plan · Share · Collaborate', form: 'civic-dome', accent: 'collaboration' })
});
function normalizeVector(from = {}, to = {}) {
  const dx = finite(to.x) - finite(from.x); const dz = finite(to.z) - finite(from.z); const length = Math.max(0.001, Math.hypot(dx, dz));
  return freeze({ x: dx / length, z: dz / length, perpendicularX: -dz / length, perpendicularZ: dx / length, length: round(length) });
}
function districtPlan(district = {}, index = 0) {
  const purpose = PURPOSES[district.id] || freeze({ purposeLine: String(district.purpose || district.label || 'Productive district'), form: 'district-prism', accent: 'district' });
  const station = district.station?.position || district.center || { x: 0, z: 0 }; const centre = district.center || { x: 0, z: 0 };
  const vector = normalizeVector(station, centre); const t = 0.58;
  const court = point(finite(station.x) + (finite(centre.x) - finite(station.x)) * t, 0.04, finite(station.z) + (finite(centre.z) - finite(station.z)) * t);
  const pylonOffset = 1.55;
  const pylonLeft = point(court.x + vector.perpendicularX * pylonOffset, 1.35, court.z + vector.perpendicularZ * pylonOffset);
  const pylonRight = point(court.x - vector.perpendicularX * pylonOffset, 1.35, court.z - vector.perpendicularZ * pylonOffset);
  const markerRadius = 2.35;
  const wayfinding = freeze([
    freeze({ id: `${district.id}:wayfinding:station`, label: 'Transit', targetId: district.station?.id || `${district.id}:station`, position: point(court.x - vector.x * markerRadius, 0.18, court.z - vector.z * markerRadius), actionKind: 'station' }),
    freeze({ id: `${district.id}:wayfinding:nexus`, label: 'NEXUS', targetId: `${district.id}:nexus-station`, position: point(court.x + vector.perpendicularX * markerRadius, 0.18, court.z + vector.perpendicularZ * markerRadius), actionKind: 'nexus' }),
    freeze({ id: `${district.id}:wayfinding:eonbot`, label: 'EONBOT', targetId: district.eonbotDock?.id || `${district.id}:eonbot-dock`, position: point(court.x - vector.perpendicularX * markerRadius, 0.18, court.z - vector.perpendicularZ * markerRadius), actionKind: 'eonbot-dock' }),
    freeze({ id: `${district.id}:wayfinding:work`, label: 'District Work', targetId: district.terminals?.[0]?.id || `${district.id}:terminal`, position: point(court.x + vector.x * markerRadius, 0.18, court.z + vector.z * markerRadius), actionKind: 'terminal' })
  ]);
  return freeze({
    id: district.id,
    label: district.label,
    purposeLine: purpose.purposeLine,
    form: purpose.form,
    accent: purpose.accent,
    boulevard: freeze({ id: `${district.id}:arrival-boulevard`, from: point(station.x, 0, station.z), to: point(centre.x, 0, centre.z), width: 2.15, length: vector.length, pedestrianSafe: true, automaticNavigation: false }),
    arrivalCourt: freeze({ id: `${district.id}:arrival-court`, position: court, radius: 2.85, reviewFirst: true }),
    identityGateway: freeze({ id: `${district.id}:identity-gateway`, pylonLeft, pylonRight, height: 2.7, span: 3.1, purposeLine: purpose.purposeLine }),
    signatureLandmark: freeze({ id: `${district.id}:street-landmark`, form: purpose.form, position: point(court.x, 0, court.z), height: round(4.8 + (index % 3) * 0.85), purposeLine: purpose.purposeLine, interactive: false }),
    wayfinding,
    functionalFrontageCount: Array.isArray(district.buildings) ? district.buildings.filter((entry) => entry.functional !== false).length : 0,
    terminalCount: Array.isArray(district.terminals) ? district.terminals.length : 0,
    reviewFirst: true,
    automaticNavigation: false,
    automaticExecution: false,
    privateContentStored: false,
    localOnly: true
  });
}

export function buildEonCityW711DistrictStreetIdentity({ districts = [] } = {}) {
  const rows = freeze((Array.isArray(districts) ? districts : []).map(districtPlan));
  return freeze({
    schema: EON_CITY_W711_DISTRICT_STREET_IDENTITY_SCHEMA,
    districts: rows,
    districtCount: rows.length,
    uniqueFormCount: new Set(rows.map((entry) => entry.form)).size,
    boulevardCount: rows.length,
    identityGatewayCount: rows.length,
    wayfindingMarkerCount: rows.reduce((sum, entry) => sum + entry.wayfinding.length, 0),
    purposeIdentityEncoded: true,
    oneCanonicalScene: true,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    privateContentStored: false,
    networkRequestCreated: false,
    deterministic: true,
    localOnly: true
  });
}

export function validateEonCityW711DistrictStreetIdentity(plan = {}) {
  const errors = [];
  if (plan?.schema !== EON_CITY_W711_DISTRICT_STREET_IDENTITY_SCHEMA) errors.push('schema-invalid');
  if (!Array.isArray(plan?.districts) || plan.districts.length !== 9 || new Set(plan.districts.map((entry) => entry.id)).size !== 9) errors.push('nine-district-identities-required');
  if (plan?.uniqueFormCount !== 9 || new Set((plan?.districts || []).map((entry) => entry.purposeLine)).size !== 9) errors.push('distinct-purpose-and-form-required');
  if (!(plan?.districts || []).every((entry) => entry.boulevard?.length > 0 && entry.identityGateway?.pylonLeft && entry.identityGateway?.pylonRight)) errors.push('arrival-boulevard-and-gateway-required');
  if (!(plan?.districts || []).every((entry) => entry.wayfinding?.length === 4 && new Set(entry.wayfinding.map((marker) => marker.actionKind)).size === 4)) errors.push('four-wayfinding-markers-required');
  if (!(plan?.districts || []).every((entry) => entry.functionalFrontageCount >= 2 && entry.terminalCount >= 2)) errors.push('functional-frontage-required');
  if (!plan?.purposeIdentityEncoded || !plan?.oneCanonicalScene || plan?.automaticNavigation || plan?.automaticExecution || plan?.privateDataRead || plan?.privateContentStored || plan?.networkRequestCreated) errors.push('truth-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), districtCount: plan?.districts?.length || 0, uniqueFormCount: plan?.uniqueFormCount || 0, wayfindingMarkerCount: plan?.wayfindingMarkerCount || 0 });
}

export function getEonCityW711DistrictStreetIdentityTruth() {
  return freeze({
    schema: `${EON_CITY_W711_DISTRICT_STREET_IDENTITY_SCHEMA}.truth.v1`,
    nineStreetReadableDistricts: true,
    distinctGeometryBeforeOpeningPanel: true,
    purposeLineMetadataPresent: true,
    existingFunctionalBuildingsRetained: true,
    fourWayfindingTargetsPerDistrict: true,
    oneCanonicalScene: true,
    newAssetDownloadRequired: false,
    automaticNavigation: false,
    automaticExecution: false,
    readsPrivateWork: false
  });
}
