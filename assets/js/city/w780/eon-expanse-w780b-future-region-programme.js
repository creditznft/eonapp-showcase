/** W780B — deterministic, review-only future-region programme projection. */
import { EON_EXPANSE_W780A_FUTURE_REGIONS } from './eon-expanse-w780a-future-region-catalog.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W780B_FUTURE_REGION_PROGRAMME_SCHEMA = 'eon.expanse.future-region-programme.w780b.v1';

function stableIndex(seed = '', length = 1) {
  let hash = 2166136261;
  for (const char of String(seed || 'eon-expanse')) {
    hash ^= char.codePointAt(0) || 0;
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return length > 0 ? hash % length : 0;
}

export function deriveEonExpanseW780BFutureRegionProgramme({
  postCampaign = null,
  worldSeed = 'eon-expanse',
  regions = EON_EXPANSE_W780A_FUTURE_REGIONS,
  releasedRegionIds = []
} = {}) {
  const visible = postCampaign?.visible === true;
  if (!visible) {return freeze({
    schema: EON_EXPANSE_W780B_FUTURE_REGION_PROGRAMME_SCHEMA,
    visible: false,
    status: 'signal-frontier-campaign-required',
    rows: freeze([]),
    recommendedRegion: null,
    reviewAvailable: false,
    automaticUnlock: false,
    createsRegion: false,
    rendersRegion: false,
    grantsXp: false,
    privateContentStored: false
  });}

  const released = new Set((Array.isArray(releasedRegionIds) ? releasedRegionIds : []).map((value) => String(value || '').trim().toLowerCase()).filter(Boolean));
  const safeRegions = Array.isArray(regions) ? regions.filter((entry) => entry?.id && entry?.publicReleaseReady === false && !released.has(String(entry.id).toLowerCase())) : [];
  const ready = postCampaign?.futureRegionReady === true;
  const recommended = safeRegions[stableIndex(worldSeed, safeRegions.length)] || null;
  const rows = freeze(safeRegions.map((entry) => freeze({
    id: entry.id,
    label: entry.label,
    gatewayId: entry.gatewayId,
    promise: entry.promise,
    status: ready && entry.id === recommended?.id ? 'recommended-for-programme-review' : 'locked-authored-programme',
    heroRequirementCount: entry.heroRequirements.length,
    missionFamilyCount: entry.missionFamilies.length,
    publicReleaseReady: false
  })));

  return freeze({
    schema: EON_EXPANSE_W780B_FUTURE_REGION_PROGRAMME_SCHEMA,
    visible: true,
    status: ready ? 'programme-review-ready' : 'maintained-frontier-pillars-required',
    readinessLabel: ready
      ? 'Future-region planning is ready for an explicit authored programme review.'
      : `${Number(postCampaign?.completedPillars || 0)}/${Number(postCampaign?.totalPillars || 5)} maintained pillars complete.`,
    rows,
    excludedReleasedRegionIds: freeze([...released]),
    recommendedRegion: recommended ? freeze({
      id: recommended.id,
      label: recommended.label,
      gatewayId: recommended.gatewayId,
      promise: recommended.promise,
      architecture: recommended.architecture,
      environment: recommended.environment,
      audio: recommended.audio,
      missionFamilies: recommended.missionFamilies,
      heroRequirements: recommended.heroRequirements
    }) : null,
    reviewAvailable: ready && Boolean(recommended),
    selectionPersisted: false,
    gatewayActivated: false,
    automaticUnlock: false,
    createsRegion: false,
    rendersRegion: false,
    grantsXp: false,
    mutatesProgression: false,
    privateContentStored: false
  });
}

export default freeze({ EON_EXPANSE_W780B_FUTURE_REGION_PROGRAMME_SCHEMA, deriveEonExpanseW780BFutureRegionProgramme });
