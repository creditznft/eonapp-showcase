/**
 * W430 — EON City authored vertical-slice contract.
 *
 * The direct Babylon City is one compact, work-ready route: Arrival Gate,
 * Command District, Creator Atrium, and Forge Bay. This registry joins the
 * existing original vector art, procedural geometry, planned-binary catalog,
 * focus coordinates, and strict truth boundary in one source-controlled plan.
 * It does not load GLB/GLTF art, copy private work into City, or issue any
 * final-art, device-performance, or release-certification claim.
 */
import { CITY_ASSET_CATALOG, CITY_ASSET_QUALITY_BUDGETS } from './eon-city-asset-catalog.js';
import { EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT } from './eon-city-arrival-district.js';
import { EON_COMMAND_DISTRICT_BLUEPRINT } from './eon-city-command-district.js';
import { EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT } from './eon-city-creator-forge-district.js';
import { getCityVectorArtAsset, getCityVectorArtPlan } from './eon-city-vector-art-kit.js';

export const EON_CITY_AUTHORED_VERTICAL_SLICE_SCHEMA = 'eon.city.authored-vertical-slice.w430.v1';

const freeze = (value) => Object.freeze(value);
const QUALITY_ORDER = freeze(['lite', 'balanced', 'cinematic']);

function safeQuality(value = 'balanced') {
  const quality = String(value || '').trim().toLowerCase();
  return QUALITY_ORDER.includes(quality) ? quality : 'balanced';
}

function region(entry) {
  return freeze({
    ...entry,
    artIds: freeze([...(entry.artIds || [])]),
    plannedBinaryAssetIds: freeze([...(entry.plannedBinaryAssetIds || [])]),
    qualities: freeze([...(entry.qualities || QUALITY_ORDER)]),
    focus: freeze({ ...entry.focus }),
    wayfinding: freeze({ ...entry.wayfinding }),
    runtimeBudget: freeze({ ...entry.runtimeBudget }),
    truth: freeze({ ...entry.truth })
  });
}

/**
 * The four areas are intentionally ordered as a first-session visual journey.
 * `focus` coordinates are safe local camera/player positions, not routes.
 */
export const EON_CITY_AUTHORED_VERTICAL_SLICE_REGIONS = freeze([
  region({
    id: 'arrival-gate',
    title: 'Arrival Gate',
    chapter: 'Arrive',
    detail: 'A calm wet-street threshold with clear wayfinding toward the Command District.',
    sourceBlueprint: EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.id,
    artIds: ['arrival-emblem', 'arrival-star', 'wet-street', 'vapor-caustics', 'neon-lantern'],
    plannedBinaryAssetIds: ['arrival-gate-exterior', 'street-furniture-kit'],
    qualities: ['lite', 'balanced', 'cinematic'],
    focus: { x: 0, z: 7.8, heading: Math.PI, cameraAlpha: -Math.PI / 4, cameraBeta: 1.12, cameraRadius: 19 },
    wayfinding: { x: -2.55, y: 1.15, z: 6.55, scale: 0.88 },
    runtimeBudget: { maxMarkers: 1, maxLabelTextures: 1, maxAdditionalLights: 0, maxDecorativeNodes: 4 },
    truth: { originalProcedural: true, originalVectorArt: true, finalBinaryArt: false, remoteNetwork: false, userData: false }
  }),
  region({
    id: 'command-district',
    title: 'Command District',
    chapter: 'Choose',
    detail: 'The operational heart: EONBOT, the Command Deck, and review-first routes into real work.',
    sourceBlueprint: EON_COMMAND_DISTRICT_BLUEPRINT.id,
    artIds: ['command-emblem', 'command-circuit', 'eon-monogram', 'obsidian-ceramic', 'holo-kiosk'],
    plannedBinaryAssetIds: ['command-centre-exterior', 'command-room-interior', 'command-terminal-kit'],
    qualities: ['lite', 'balanced', 'cinematic'],
    focus: { x: 0, z: -10.72, heading: Math.PI, cameraAlpha: -Math.PI / 2, cameraBeta: 1.03, cameraRadius: 12.4 },
    wayfinding: { x: 2.35, y: 1.15, z: -8.65, scale: 0.92 },
    runtimeBudget: { maxMarkers: 1, maxLabelTextures: 1, maxAdditionalLights: 0, maxDecorativeNodes: 5 },
    truth: { originalProcedural: true, originalVectorArt: true, finalBinaryArt: false, remoteNetwork: false, userData: false }
  }),
  region({
    id: 'creator-atrium',
    title: 'Creator Atrium',
    chapter: 'Imagine',
    detail: 'A prismatic planning space that routes creator work only after an explicit visible choice.',
    sourceBlueprint: EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.id,
    artIds: ['creator-emblem', 'creator-prism', 'prismatic-glass', 'aurora-ribbon', 'signal-kite'],
    plannedBinaryAssetIds: ['creator-atrium-exterior'],
    qualities: ['lite', 'balanced', 'cinematic'],
    focus: { x: -1.92, z: -10.68, heading: Math.PI, cameraAlpha: -Math.PI / 2 + 0.14, cameraBeta: 1.02, cameraRadius: 12.7 },
    wayfinding: { x: -5.25, y: 1.15, z: -8.45, scale: 0.88 },
    runtimeBudget: { maxMarkers: 1, maxLabelTextures: 1, maxAdditionalLights: 0, maxDecorativeNodes: 5 },
    truth: { originalProcedural: true, originalVectorArt: true, finalBinaryArt: false, remoteNetwork: false, userData: false }
  }),
  region({
    id: 'forge-bay',
    title: 'Forge Bay',
    chapter: 'Make',
    detail: 'An industrial build lane that hands off to native Forge only after deliberate review.',
    sourceBlueprint: EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.id,
    artIds: ['forge-emblem', 'forge-stripe', 'amber-rail', 'forge-plumes', 'street-barrier'],
    plannedBinaryAssetIds: ['forge-bay-exterior', 'street-furniture-kit'],
    qualities: ['lite', 'balanced', 'cinematic'],
    focus: { x: 8.2, z: -0.68, heading: Math.PI, cameraAlpha: -Math.PI / 2 + 0.36, cameraBeta: 1.04, cameraRadius: 14.4 },
    wayfinding: { x: 7.25, y: 1.15, z: 2.4, scale: 0.9 },
    runtimeBudget: { maxMarkers: 1, maxLabelTextures: 1, maxAdditionalLights: 0, maxDecorativeNodes: 5 },
    truth: { originalProcedural: true, originalVectorArt: true, finalBinaryArt: false, remoteNetwork: false, userData: false }
  })
]);

const QUALITY_MARKER_BUDGETS = freeze({
  lite: freeze({ maxVisibleRegions: 4, maxLabelTextures: 2, maxDecorativeNodes: 10, maxAdditionalLights: 0, markerScale: 0.78 }),
  balanced: freeze({ maxVisibleRegions: 4, maxLabelTextures: 4, maxDecorativeNodes: 18, maxAdditionalLights: 0, markerScale: 1 }),
  cinematic: freeze({ maxVisibleRegions: 4, maxLabelTextures: 4, maxDecorativeNodes: 22, maxAdditionalLights: 0, markerScale: 1.08 })
});

export function getCityAuthoredVerticalSliceRegion(id = '') {
  const entry = EON_CITY_AUTHORED_VERTICAL_SLICE_REGIONS.find((item) => item.id === String(id || '').trim());
  return entry ? freeze({ ...entry, artIds: freeze([...entry.artIds]), plannedBinaryAssetIds: freeze([...entry.plannedBinaryAssetIds]), focus: freeze({ ...entry.focus }), wayfinding: freeze({ ...entry.wayfinding }), runtimeBudget: freeze({ ...entry.runtimeBudget }), truth: freeze({ ...entry.truth }) }) : null;
}

export function getCityAuthoredVerticalSlicePlan({ quality = 'balanced' } = {}) {
  const resolvedQuality = safeQuality(quality);
  const vectorPlan = getCityVectorArtPlan({ quality: resolvedQuality });
  const allowedArt = new Set(vectorPlan.entries.map((entry) => entry.id));
  const budgets = QUALITY_MARKER_BUDGETS[resolvedQuality];
  const regions = EON_CITY_AUTHORED_VERTICAL_SLICE_REGIONS
    .filter((entry) => entry.qualities.includes(resolvedQuality))
    .slice(0, budgets.maxVisibleRegions)
    .map((entry) => freeze({
      ...entry,
      artIds: freeze(entry.artIds.filter((id) => allowedArt.has(id))),
      plannedBinaryAssetIds: freeze([...entry.plannedBinaryAssetIds]),
      focus: freeze({ ...entry.focus }),
      wayfinding: freeze({ ...entry.wayfinding }),
      runtimeBudget: freeze({ ...entry.runtimeBudget }),
      truth: freeze({ ...entry.truth })
    }));
  return freeze({
    schema: EON_CITY_AUTHORED_VERTICAL_SLICE_SCHEMA,
    quality: resolvedQuality,
    route: '/eoncity',
    renderer: 'Babylon WebGL',
    regions: freeze(regions),
    markerBudget: budgets,
    assetBudget: CITY_ASSET_QUALITY_BUDGETS[resolvedQuality],
    originalVectorArt: true,
    finalBinaryArt: false,
    localOnly: true,
    remoteNetwork: false,
    displaysPrivateWork: false,
    automaticNavigation: false,
    automaticExecution: false
  });
}

export function getCityAuthoredVerticalSliceSummary({ quality = 'balanced' } = {}) {
  const plan = getCityAuthoredVerticalSlicePlan({ quality });
  return freeze({
    schema: EON_CITY_AUTHORED_VERTICAL_SLICE_SCHEMA,
    quality: plan.quality,
    title: 'Living Creator Metropolis · first vertical slice',
    regionCount: plan.regions.length,
    regionIds: freeze(plan.regions.map((entry) => entry.id)),
    sourceArtCount: plan.regions.reduce((sum, entry) => sum + entry.artIds.length, 0),
    plannedBinaryAssetCount: plan.regions.reduce((sum, entry) => sum + entry.plannedBinaryAssetIds.length, 0),
    markerBudget: plan.markerBudget,
    assetBudget: plan.assetBudget,
    originalProcedural: true,
    originalVectorArt: true,
    finalBinaryArt: false,
    artRightsStatus: 'source-controlled vector art only; final binary-release evidence remains required',
    localOnly: true,
    remoteNetwork: false,
    displaysPrivateWork: false,
    deviceFrameProof: false,
    finalVisualCertification: false
  });
}

export function getCityAuthoredVerticalSliceTruth() {
  return freeze({
    schema: EON_CITY_AUTHORED_VERTICAL_SLICE_SCHEMA,
    canonicalRoute: '/eoncity',
    renderer: 'Babylon WebGL',
    sourceControlledVectorArt: true,
    binaryAssetReleaseEnabled: false,
    finalBinaryArt: false,
    finalVisualCertification: false,
    realDeviceFrameBudgetVerified: false,
    remoteAssets: false,
    remoteTelemetry: false,
    userDataInRenderer: false,
    automaticNavigation: false,
    automaticExecution: false
  });
}

export function validateCityAuthoredVerticalSlice() {
  const errors = [];
  const ids = new Set();
  const plannedAssets = new Set(CITY_ASSET_CATALOG.map((entry) => entry.id));
  if (EON_CITY_AUTHORED_VERTICAL_SLICE_REGIONS.length !== 4) errors.push('W430 needs exactly four authored vertical-slice regions.');
  for (const entry of EON_CITY_AUTHORED_VERTICAL_SLICE_REGIONS) {
    if (!/^[a-z0-9-]{4,48}$/.test(entry.id || '') || ids.has(entry.id)) errors.push('Vertical-slice region id is invalid or duplicated.');
    ids.add(entry.id);
    if (!entry.title || !entry.chapter || !entry.detail || !entry.sourceBlueprint) errors.push(`${entry.id || 'unknown'} is missing authored copy or a source blueprint.`);
    if (!Array.isArray(entry.artIds) || entry.artIds.length < 3) errors.push(`${entry.id || 'unknown'} needs at least three source-art references.`);
    for (const artId of entry.artIds) if (!getCityVectorArtAsset(artId)) errors.push(`${entry.id || 'unknown'} references unknown source art: ${artId}.`);
    for (const assetId of entry.plannedBinaryAssetIds) if (!plannedAssets.has(assetId)) errors.push(`${entry.id || 'unknown'} references unknown planned binary asset: ${assetId}.`);
    if (!Array.isArray(entry.qualities) || QUALITY_ORDER.some((quality) => !entry.qualities.includes(quality))) errors.push(`${entry.id || 'unknown'} must provide the same authored path at every quality tier.`);
    for (const key of ['x', 'z', 'heading', 'cameraAlpha', 'cameraBeta', 'cameraRadius']) if (!Number.isFinite(Number(entry.focus?.[key]))) errors.push(`${entry.id || 'unknown'} has invalid local focus coordinates.`);
    if (entry.truth?.originalProcedural !== true || entry.truth?.originalVectorArt !== true || entry.truth?.finalBinaryArt !== false || entry.truth?.remoteNetwork !== false || entry.truth?.userData !== false) errors.push(`${entry.id || 'unknown'} violates the local vertical-slice truth boundary.`);
    if (Number(entry.runtimeBudget?.maxAdditionalLights) !== 0) errors.push(`${entry.id || 'unknown'} cannot add dynamic lights beyond the scene budget.`);
  }
  for (const id of ['arrival-gate', 'command-district', 'creator-atrium', 'forge-bay']) if (!ids.has(id)) errors.push(`W430 is missing ${id}.`);
  const serialised = JSON.stringify(EON_CITY_AUTHORED_VERTICAL_SLICE_REGIONS);
  if (/https?:\/\/|wallet|payment|token|reward|loot|referral|credential|api[-_ ]?key|social|publish|schedule/i.test(serialised)) errors.push('W430 vertical slice contains a forbidden remote, value, credential, or publishing surface.');
  return freeze({ schema: EON_CITY_AUTHORED_VERTICAL_SLICE_SCHEMA, ok: errors.length === 0, errors: freeze(errors), regionCount: EON_CITY_AUTHORED_VERTICAL_SLICE_REGIONS.length, localOnly: true });
}
