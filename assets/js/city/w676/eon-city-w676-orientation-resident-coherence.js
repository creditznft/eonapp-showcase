/**
 * W676 — one truthful resident cast for the Orientation District Belt.
 *
 * The authored GLB cast is loaded by the existing W649 residency runtime. The
 * W674 renderer keeps bounded silhouettes only while a preferred authored asset
 * is unavailable. This pure module owns no scene, loader, animation, route,
 * storage, network request or AI execution.
 */

export const EON_CITY_W676_ORIENTATION_RESIDENT_COHERENCE_SCHEMA = 'eon.city.orientation-resident-coherence.w676.v1';
const freeze = (value) => Object.freeze(value);

export const EON_CITY_W676_ORIENTATION_RESIDENT_CAST = freeze([
  freeze({ id: 'orientation-architect', role: 'district-specialist', label: 'Orientation Architect', preferredAssetId: 'eoncity-eon-architect-12clips', schedule: freeze(['idle', 'wave', 'talk', 'point', 'walk']) }),
  freeze({ id: 'device-guide', role: 'route-guide', label: 'Device Guide', preferredAssetId: 'eoncity-holo-interface-operator-6clips', schedule: freeze(['idle', 'point', 'talk', 'walk']) }),
  freeze({ id: 'mission-operator', role: 'terminal-operator', label: 'Mission Operator', preferredAssetId: 'eon-x1-worker-9clips', schedule: freeze(['idle', 'work', 'wave', 'walk']) }),
  freeze({ id: 'arrival-citizen', role: 'public-guide', label: 'Arrival Citizen', preferredAssetId: 'citizen-variant-6clips', schedule: freeze(['idle', 'walk', 'talk', 'wave']) }),
  freeze({ id: 'maintenance-worker', role: 'maintenance-specialist', label: 'Maintenance Specialist', preferredAssetId: 'forge-device-lab-specialist-6clips', schedule: freeze(['idle', 'inspect', 'walk', 'work']) }),
  freeze({ id: 'project-liaison', role: 'project-liaison', label: 'Project Liaison', preferredAssetId: 'eoncity-civilian-creator-13clips', schedule: freeze(['idle', 'talk', 'point', 'walk']) })
]);

export const EON_CITY_W676_ORIENTATION_AUTHORED_ASSET_IDS = freeze(
  EON_CITY_W676_ORIENTATION_RESIDENT_CAST.map((entry) => entry.preferredAssetId)
);

export function projectEonCityW676OrientationResidentPresentation(residents = EON_CITY_W676_ORIENTATION_RESIDENT_CAST, loadedAssetIds = []) {
  const loaded = new Set((Array.isArray(loadedAssetIds) ? loadedAssetIds : []).map((value) => String(value || '')));
  const rows = (Array.isArray(residents) ? residents : []).map((resident) => freeze({
    residentId: resident.id,
    preferredAssetId: resident.preferredAssetId,
    source: loaded.has(resident.preferredAssetId) ? 'authored-glb' : 'bounded-fallback',
    authoredVisible: loaded.has(resident.preferredAssetId),
    fallbackVisible: !loaded.has(resident.preferredAssetId),
    claimsRealWork: false,
    automaticWork: false,
    automaticNavigation: false
  }));
  return freeze({
    schema: EON_CITY_W676_ORIENTATION_RESIDENT_COHERENCE_SCHEMA,
    residents: freeze(rows),
    authoredCount: rows.filter((entry) => entry.authoredVisible).length,
    fallbackCount: rows.filter((entry) => entry.fallbackVisible).length,
    totalCount: rows.length,
    duplicateVisibleRepresentations: 0,
    localOnly: true
  });
}

export function getEonCityW676OrientationResidentCoherenceTruth() {
  return freeze({
    schema: EON_CITY_W676_ORIENTATION_RESIDENT_COHERENCE_SCHEMA,
    uniqueAuthoredAssetPerResident: new Set(EON_CITY_W676_ORIENTATION_AUTHORED_ASSET_IDS).size === EON_CITY_W676_ORIENTATION_RESIDENT_CAST.length,
    authoredAssetsLoadedByExistingResidencyRuntime: true,
    fallbackHiddenWhenAuthoredVisible: true,
    authoredAnimationRuntimePreserved: true,
    claimsRealWork: false,
    automaticWork: false,
    automaticNavigation: false,
    privateDataRead: false,
    networkRequestCreated: false
  });
}

export default freeze({
  EON_CITY_W676_ORIENTATION_RESIDENT_COHERENCE_SCHEMA,
  EON_CITY_W676_ORIENTATION_RESIDENT_CAST,
  EON_CITY_W676_ORIENTATION_AUTHORED_ASSET_IDS,
  projectEonCityW676OrientationResidentPresentation,
  getEonCityW676OrientationResidentCoherenceTruth
});
