/**
 * W406B / W611 — EON City art intake and local asset-pipeline contract.
 *
 * This module owns a source-controlled map from City landmarks to either a
 * local engineering candidate or a procedural fallback. It never downloads
 * art, uploads data, calls a remote service, or turns engineering candidates
 * into final visual-release approval. W602–W604 candidates are same-origin
 * GLBs with local provenance records; owner visual review, KTX2/Basis final
 * packaging, device performance proof, and launch approval remain separate.
 */
import {
  CITY_ASSET_CATALOG_SCHEMA,
  getCityAssetBudget,
  getCityAssetById,
  getCityAssetCatalogSummary,
  getCityAssetVariant,
  isCityAssetLoadable,
  normalizeCityAssetQuality
} from './eon-city-asset-catalog.js';

export const EON_CITY_ART_INTAKE_SCHEMA = 'eon.city.art-intake.w406b.v2';
export const EON_CITY_CANONICAL_PUBLIC_ENGINE = 'babylon-eoncity';

const freezeRecord = (entry) => Object.freeze({
  ...entry,
  composition: Object.freeze({ ...entry.composition }),
  fallback: Object.freeze({ ...entry.fallback }),
  intake: Object.freeze({ ...entry.intake }),
  lod: Object.freeze({ ...entry.lod }),
  texture: Object.freeze({ ...entry.texture })
});

export const EON_CITY_ART_STYLE_BIBLE = Object.freeze({
  id: 'midnight-neon-atelier-v1',
  visualLanguage: 'midnight neon atelier',
  architecture: Object.freeze(['dark graphite and navy massing', 'glass and brushed metal contrast', 'wet street reflections', 'readable human-scale signage']),
  accents: Object.freeze(['cyan', 'violet', 'mint']),
  atmosphere: Object.freeze(['restrained bloom', 'rain', 'fog', 'skyline depth']),
  compositionRules: Object.freeze([
    'Arrival Gate, Command Deck and one companion must read within the first frame.',
    'District wayfinding remains calm, human-scale and connected to real EONAPP work.',
    'Hero scenes use authored set pieces; procedural systems only vary weather, distant skyline and alley dressing.'
  ]),
  prohibitedVisualClaims: Object.freeze([
    'generic infinite cube city',
    'unproven AAA or cinematic quality claim',
    'copied or unlicensed character, vehicle, building or texture art',
    'runtime-generated binary art presented as authored production art'
  ]),
  humanVisualReviewRequired: true
});

export const EON_CITY_ART_PIPELINE_POLICY = Object.freeze({
  publicEngine: EON_CITY_CANONICAL_PUBLIC_ENGINE,
  publicRoute: '/eoncity',
  noSecondPublicCity: true,
  sourceOnly: true,
  localEngineeringCandidatesAllowed: true,
  finalVisualReleaseApproved: false,
  localOnly: true,
  remoteNetwork: false,
  userData: false,
  assetContainer: 'GLB',
  textureTranscode: 'KTX2 / Basis Universal remains mandatory for final release packaging; W604 candidate art currently uses embedded original PNG PBR maps.',
  geometryOptimization: 'Evaluate offline Meshopt or Draco only after visual and loading evidence.',
  lodPolicy: Object.freeze({ levels: Object.freeze(['lod0', 'lod1', 'lod2']), requiredForShippedAsset: true, switchBy: 'distance-and-quality-profile' }),
  texturePolicy: Object.freeze({ maxDimension: 2048, requireMips: true, noRemoteTexture: true }),
  releaseRequirements: Object.freeze([
    'catalog provenance evidence',
    'human art and licence review',
    'SHA-256 and same-origin path',
    'quality-budget check',
    'KTX2/Basis packaging or a written final-format exception',
    'real-device visual and performance proof',
    'mobile fallback proof',
    'owner visual approval'
  ]),
  mobileFallback: Object.freeze({ mode: 'procedural-source-controlled', quality: 'lite', binaryLoadBeforeProof: true, finalVisualReleaseBeforeProof: false })
});

function resolveIntakeState(assetId) {
  const asset = getCityAssetById(assetId);
  const loadable = Boolean(asset && isCityAssetLoadable(asset));
  const variant = loadable ? getCityAssetVariant(asset, 'balanced') : null;
  return Object.freeze({
    status: loadable ? 'engineering-candidate' : 'planned',
    binaryIncluded: loadable,
    loadable,
    sameOriginPath: variant?.sourcePath || null,
    evidencePath: loadable ? asset?.provenance?.evidencePath || null : null,
    sha256: variant?.sha256 || null,
    ownerVisualApproval: loadable ? 'pending' : 'not-applicable'
  });
}

function texturePolicyFor(assetId) {
  const candidate = resolveIntakeState(assetId);
  if (candidate.loadable) {
    return Object.freeze({
      sourceFormat: 'source-controlled-local-glb',
      releaseFormat: 'candidate-local-pbr; KTX2/Basis Universal pending final package',
      maxDimension: 2048,
      remoteNetwork: false
    });
  }
  return Object.freeze({
    sourceFormat: 'authoring-source-not-shipped',
    releaseFormat: 'KTX2/Basis Universal',
    maxDimension: 2048,
    remoteNetwork: false
  });
}

const intakeAsset = ({ assetId, district, landmarkId, visualRole, firstFramePriority, composition, fallbackId }) => freezeRecord({
  assetId,
  district,
  landmarkId,
  visualRole,
  firstFramePriority,
  publicEngine: EON_CITY_CANONICAL_PUBLIC_ENGINE,
  composition,
  intake: resolveIntakeState(assetId),
  lod: {
    levels: ['lod0', 'lod1', 'lod2'],
    firstFrameTier: 'lod1',
    mobileTier: 'lod2',
    qualityGovernorFallback: 'procedural-source-controlled'
  },
  texture: texturePolicyFor(assetId),
  fallback: {
    id: fallbackId,
    mode: 'procedural-source-controlled',
    localOnly: true,
    remoteNetwork: false,
    userData: false
  }
});

/**
 * The first five entries are current local engineering candidates. The final
 * three remain clearly planned. Neither state is a release certificate.
 */
export const EON_CITY_ART_INTAKE = Object.freeze([
  intakeAsset({
    assetId: 'command-horizon-arrival-gate', district: 'arrival', landmarkId: 'orientation-hall', visualRole: 'first-frame Arrival Gate and calm entry plaza', firstFramePriority: 1,
    composition: { hero: true, readableAtDistance: true, workMeaning: 'orientation and return-to-work' }, fallbackId: 'procedural-arrival-gate'
  }),
  intakeAsset({
    assetId: 'command-horizon-command-deck', district: 'command', landmarkId: 'command-centre', visualRole: 'Command Deck exterior landmark', firstFramePriority: 2,
    composition: { hero: true, readableAtDistance: true, workMeaning: 'EONBOT and mission entry' }, fallbackId: 'procedural-command-centre'
  }),
  intakeAsset({
    assetId: 'command-horizon-wayfinding', district: 'arrival', landmarkId: 'orientation-hall', visualRole: 'wet-street edge, lamps, rails and tactile wayfinding', firstFramePriority: 3,
    composition: { hero: false, readableAtDistance: false, workMeaning: 'safe route readability' }, fallbackId: 'procedural-street-furniture'
  }),
  intakeAsset({
    assetId: 'eonbot-companion', district: 'command', landmarkId: 'command-centre', visualRole: 'readable companion presence near the first real work choice', firstFramePriority: 4,
    composition: { hero: true, readableAtDistance: true, workMeaning: 'guide to chat and real task selection' }, fallbackId: 'procedural-eonbot'
  }),
  intakeAsset({
    assetId: 'operator-hero', district: 'arrival', landmarkId: 'orientation-hall', visualRole: 'Navigator reveal and readable player movement silhouette', firstFramePriority: 5,
    composition: { hero: true, readableAtDistance: true, workMeaning: 'intentful exploration and return state' }, fallbackId: 'procedural-operator'
  }),
  intakeAsset({
    assetId: 'creator-atrium-exterior', district: 'creator', landmarkId: 'preview-gallery', visualRole: 'Creator Atrium authored district facade', firstFramePriority: 6,
    composition: { hero: true, readableAtDistance: true, workMeaning: 'creator and Share Pack entry' }, fallbackId: 'procedural-creator-atrium'
  }),
  intakeAsset({
    assetId: 'forge-bay-exterior', district: 'forge', landmarkId: 'workshop', visualRole: 'Forge Bay authored district facade', firstFramePriority: 7,
    composition: { hero: true, readableAtDistance: true, workMeaning: 'build and preview work entry' }, fallbackId: 'procedural-forge-bay'
  }),
  intakeAsset({
    assetId: 'signal-tower-exterior', district: 'signal', landmarkId: 'relay', visualRole: 'Signal Tower focal point for future campaign planning', firstFramePriority: 8,
    composition: { hero: true, readableAtDistance: true, workMeaning: 'draft planning only; no social posting' }, fallbackId: 'procedural-signal-tower'
  })
]);

function hasForbiddenNetworkValue(value) {
  if (typeof value === 'string') return /(^|[^a-z])(?:https?:)?\/\//i.test(value);
  if (Array.isArray(value)) return value.some(hasForbiddenNetworkValue);
  if (value && typeof value === 'object') return Object.values(value).some(hasForbiddenNetworkValue);
  return false;
}

function isAllowedTextureDeclaration(entry, loadable) {
  if (entry?.texture?.remoteNetwork !== false || Number(entry?.texture?.maxDimension) > 2048) return false;
  if (loadable) return /candidate-local-pbr; KTX2\/Basis Universal pending final package/.test(String(entry?.texture?.releaseFormat || ''));
  return entry?.texture?.releaseFormat === 'KTX2/Basis Universal';
}

export function getCityArtIntakeByAssetId(assetId) {
  return EON_CITY_ART_INTAKE.find((entry) => entry.assetId === String(assetId || '')) || null;
}

export function getCityArtIntakeFirstFramePlan({ quality = 'balanced' } = {}) {
  const resolvedQuality = normalizeCityAssetQuality(quality);
  const budget = getCityAssetBudget(resolvedQuality);
  const count = resolvedQuality === 'lite' ? 3 : (resolvedQuality === 'balanced' ? 5 : 6);
  const entries = EON_CITY_ART_INTAKE
    .slice()
    .sort((left, right) => left.firstFramePriority - right.firstFramePriority)
    .slice(0, Math.min(count, budget.maxAssets))
    .map((entry) => Object.freeze({
      assetId: entry.assetId,
      district: entry.district,
      landmarkId: entry.landmarkId,
      visualRole: entry.visualRole,
      firstFramePriority: entry.firstFramePriority,
      loadable: entry.intake.loadable,
      sourcePath: entry.intake.sameOriginPath,
      fallback: entry.fallback
    }));
  const loadableCount = entries.filter((entry) => entry.loadable).length;
  return Object.freeze({
    schema: EON_CITY_ART_INTAKE_SCHEMA,
    quality: resolvedQuality,
    publicEngine: EON_CITY_CANONICAL_PUBLIC_ENGINE,
    entries: Object.freeze(entries),
    allProceduralFallbacks: loadableCount === 0,
    binaryLoadEnabled: loadableCount > 0,
    remoteNetwork: false,
    finalVisualReleaseApproved: false
  });
}

export function validateCityArtIntake(intake = EON_CITY_ART_INTAKE) {
  const errors = [];
  const ids = new Set();
  const priorities = new Set();
  if (!Array.isArray(intake) || intake.length < 8) errors.push('W406B requires the authored district intake map.');
  for (const entry of intake || []) {
    const asset = getCityAssetById(entry?.assetId);
    const loadable = Boolean(asset && isCityAssetLoadable(asset));
    const variant = loadable ? getCityAssetVariant(asset, 'balanced') : null;
    if (!entry?.assetId || !/^[a-z0-9-]+$/.test(entry.assetId)) errors.push(`Invalid intake asset id: ${String(entry?.assetId || '')}.`);
    if (ids.has(entry?.assetId)) errors.push(`Duplicate intake asset id: ${entry?.assetId}.`);
    ids.add(entry?.assetId);
    if (!asset) errors.push(`${entry?.assetId || 'unknown'} is absent from the City asset catalog.`);
    if (asset && !['planned', 'shipped'].includes(asset.status)) errors.push(`${entry.assetId} has an unsupported intake status.`);
    if (!entry?.district || !entry?.landmarkId || !entry?.visualRole) errors.push(`${entry?.assetId || 'unknown'} needs district, landmark and visual role.`);
    if (!Number.isInteger(entry?.firstFramePriority) || entry.firstFramePriority < 1) errors.push(`${entry?.assetId || 'unknown'} needs a positive first-frame priority.`);
    if (priorities.has(entry?.firstFramePriority)) errors.push(`Duplicate first-frame priority: ${entry?.firstFramePriority}.`);
    priorities.add(entry?.firstFramePriority);
    if (entry?.publicEngine !== EON_CITY_CANONICAL_PUBLIC_ENGINE) errors.push(`${entry?.assetId || 'unknown'} must target the canonical Babylon City only.`);
    if (!entry?.intake || entry.intake.binaryIncluded !== loadable || entry.intake.loadable !== loadable) errors.push(`${entry?.assetId || 'unknown'} intake state must match its catalog load contract.`);
    if (loadable) {
      if (entry?.intake?.status !== 'engineering-candidate' || entry?.intake?.sameOriginPath !== variant?.sourcePath || entry?.intake?.sha256 !== variant?.sha256 || entry?.intake?.evidencePath !== asset?.provenance?.evidencePath || entry?.intake?.ownerVisualApproval !== 'pending') errors.push(`${entry?.assetId || 'unknown'} candidate record must mirror local catalog provenance and remain visually pending.`);
    } else if (entry?.intake?.status !== 'planned' || entry?.intake?.sameOriginPath !== null || entry?.intake?.evidencePath !== null || entry?.intake?.sha256 !== null || entry?.intake?.ownerVisualApproval !== 'not-applicable') {
      errors.push(`${entry?.assetId || 'unknown'} planned intake must stay non-loadable.`);
    }
    if (entry?.fallback?.mode !== 'procedural-source-controlled' || entry?.fallback?.localOnly !== true || entry?.fallback?.remoteNetwork !== false || entry?.fallback?.userData !== false) errors.push(`${entry?.assetId || 'unknown'} needs a safe local procedural fallback.`);
    if (!Array.isArray(entry?.lod?.levels) || entry.lod.levels.join(',') !== 'lod0,lod1,lod2') errors.push(`${entry?.assetId || 'unknown'} must declare lod0/lod1/lod2.`);
    if (!isAllowedTextureDeclaration(entry, loadable)) errors.push(`${entry?.assetId || 'unknown'} violates the local texture release policy.`);
    if (hasForbiddenNetworkValue(entry)) errors.push(`${entry?.assetId || 'unknown'} contains a forbidden network value.`);
  }
  const requiredFirstFrame = ['command-horizon-arrival-gate', 'command-horizon-command-deck', 'command-horizon-wayfinding', 'eonbot-companion', 'operator-hero'];
  for (const assetId of requiredFirstFrame) if (!ids.has(assetId)) errors.push(`First-frame intake is missing ${assetId}.`);
  return Object.freeze({ schema: EON_CITY_ART_INTAKE_SCHEMA, ok: errors.length === 0, errors: Object.freeze(errors), intakeCount: Array.isArray(intake) ? intake.length : 0, catalogSchema: CITY_ASSET_CATALOG_SCHEMA });
}

export function getCityArtIntakeSummary({ quality = 'balanced' } = {}) {
  const resolvedQuality = normalizeCityAssetQuality(quality);
  const validation = validateCityArtIntake();
  const firstFrame = getCityArtIntakeFirstFramePlan({ quality: resolvedQuality });
  const catalog = getCityAssetCatalogSummary();
  const loadableEntries = EON_CITY_ART_INTAKE.filter((entry) => entry.intake.loadable);
  return Object.freeze({
    schema: EON_CITY_ART_INTAKE_SCHEMA,
    valid: validation.ok,
    publicEngine: EON_CITY_CANONICAL_PUBLIC_ENGINE,
    publicRoute: '/eoncity',
    quality: resolvedQuality,
    intakeCount: EON_CITY_ART_INTAKE.length,
    firstFrameAssetIds: Object.freeze(firstFrame.entries.map((entry) => entry.assetId)),
    shippedBinaryCount: catalog.shippedBinaryCount,
    loadableCount: loadableEntries.length,
    engineeringCandidateCount: loadableEntries.length,
    plannedCount: EON_CITY_ART_INTAKE.length - loadableEntries.length,
    allAssetsPlanned: false,
    allFallbacksProcedural: false,
    remoteNetwork: false,
    containsUserData: false,
    humanArtProofCaptured: false,
    visualCertificationCaptured: false,
    ownerVisualApprovalCaptured: false,
    releaseReady: false,
    mobileFallback: EON_CITY_ART_PIPELINE_POLICY.mobileFallback,
    limitations: Object.freeze([
      'W602–W604 local GLB candidates are engineering assets only; candidate loading does not equal final visual-release approval.',
      'KTX2/Basis final packaging, human art/licence review, real browser/device visual review, performance evidence and owner approval remain required.',
      'Planned Creator, Forge and Signal landmarks still resolve to safe procedural fallbacks until their own local provenance and quality contracts are complete.'
    ])
  });
}
