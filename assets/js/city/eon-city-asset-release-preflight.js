/**
 * W417 — pure-data preflight for any future City binary art release.
 *
 * This module never loads a binary. It validates the evidence that must exist
 * before the catalog can move an asset from planned to shipped. The Node-side
 * companion checks real file hashes after Codex receives licensed/original art.
 */
import {
  CITY_ASSET_ALLOWED_ORIGINS,
  CITY_ASSET_CATALOG,
  CITY_ASSET_ROOT,
  getCityAssetById,
  getCityAssetBudget,
  normalizeCityAssetQuality
} from './eon-city-asset-catalog.js';

export const EON_CITY_ASSET_RELEASE_PREFLIGHT_SCHEMA = 'eon.city.asset-release-preflight.w417.v1';
const SAFE_GLB_PATH = /^\/assets\/city\/[a-z0-9][a-z0-9/_-]*\.glb$/i;
const SHA256 = /^[a-f0-9]{64}$/i;
const REQUIRED_LODS = Object.freeze(['lod0', 'lod1', 'lod2']);

function asText(value) {
  return String(value || '').trim();
}

function isSafeCityAssetPath(value) {
  return SAFE_GLB_PATH.test(asText(value)) && !asText(value).includes('..') && asText(value).startsWith(CITY_ASSET_ROOT);
}

function isValidHash(value) {
  return SHA256.test(asText(value));
}

function freezeErrors(errors) {
  return Object.freeze([...errors]);
}

export function getCityAssetReleaseTruth() {
  const localEngineeringCandidateCount = CITY_ASSET_CATALOG.filter((entry) => entry.status === 'shipped').length;
  return Object.freeze({
    schema: EON_CITY_ASSET_RELEASE_PREFLIGHT_SCHEMA,
    binaryLoadEnabled: localEngineeringCandidateCount > 0,
    engineeringCandidateLoadEnabled: localEngineeringCandidateCount > 0,
    shippedBinaryCount: localEngineeringCandidateCount,
    automaticApproval: false,
    remoteNetwork: false,
    userData: false,
    humanArtProofCaptured: false,
    finalVisualCertification: false,
    finalVisualReleaseApproved: false
  });
}

export function validateCityAssetReleaseManifest(manifest = {}, { catalog = CITY_ASSET_CATALOG } = {}) {
  const errors = [];
  const quality = normalizeCityAssetQuality(manifest?.quality || 'balanced');
  const budget = getCityAssetBudget(quality);
  if (asText(manifest?.schema) !== EON_CITY_ASSET_RELEASE_PREFLIGHT_SCHEMA) errors.push('Manifest schema is invalid.');
  if (!/^[a-z0-9][a-z0-9_-]{5,80}$/i.test(asText(manifest?.releaseId))) errors.push('Release id must be a stable local identifier.');
  if (!Array.isArray(manifest?.entries) || !manifest.entries.length) errors.push('Manifest must include one or more asset entries.');
  if (!manifest?.proofs?.humanArtReview || !manifest?.proofs?.licenceReview || !manifest?.proofs?.visualQaPlan || !manifest?.proofs?.devicePerformancePlan) errors.push('Manifest must declare the four mandatory human/device proof tracks.');
  if (manifest?.remoteNetwork !== false || manifest?.containsUserData !== false) errors.push('Manifest cannot use remote network or user data.');
  const ids = new Set();
  for (const entry of manifest?.entries || []) {
    const assetId = asText(entry?.assetId);
    const asset = (catalog || []).find((candidate) => candidate?.id === assetId) || getCityAssetById(assetId);
    if (!assetId || !asset) { errors.push(`Unknown catalog asset: ${assetId || 'missing'}.`); continue; }
    if (ids.has(assetId)) errors.push(`Duplicate asset entry: ${assetId}.`);
    ids.add(assetId);
    if (!['approved', 'shipped'].includes(asset.status)) errors.push(`${assetId} must be approved in the catalog before release preflight.`);
    if (!isSafeCityAssetPath(entry?.sourcePath)) errors.push(`${assetId} source path must be a local /assets/city/*.glb path.`);
    if (!isValidHash(entry?.sha256)) errors.push(`${assetId} requires a SHA-256 hash.`);
    if (!/^docs\/city-art\/[a-z0-9/_-]+\.md$/i.test(asText(entry?.evidencePath))) errors.push(`${assetId} requires a local art/provenance evidence document.`);
    if (!entry?.lod || REQUIRED_LODS.some((lod) => !isSafeCityAssetPath(entry.lod?.[lod]))) errors.push(`${assetId} must declare safe local lod0/lod1/lod2 GLB paths.`);
    if (asText(entry?.texture?.releaseFormat) !== 'KTX2/Basis Universal') errors.push(`${assetId} must declare KTX2/Basis Universal textures.`);
    if (Number(entry?.texture?.maxDimension) > Number(asset.constraints.maxTextureDimension) || Number(entry?.texture?.maxDimension) <= 0) errors.push(`${assetId} texture dimension exceeds its catalog budget.`);
    if (Number(entry?.metrics?.compressedBytes) > Number(asset.constraints.maxCompressedBytes) || Number(entry?.metrics?.compressedBytes) <= 0) errors.push(`${assetId} compressed-byte metric exceeds its catalog budget.`);
    if (Number(entry?.metrics?.triangles) > Number(asset.constraints.maxTriangles) || Number(entry?.metrics?.triangles) <= 0) errors.push(`${assetId} triangle metric exceeds its catalog budget.`);
    if (Number(entry?.metrics?.materials) > Number(asset.constraints.maxMaterials) || Number(entry?.metrics?.materials) <= 0) errors.push(`${assetId} material metric exceeds its catalog budget.`);
    if (Number(entry?.metrics?.drawCalls) > Number(asset.constraints.maxDrawCalls) || Number(entry?.metrics?.drawCalls) <= 0) errors.push(`${assetId} draw-call metric exceeds its catalog budget.`);
    if (!CITY_ASSET_ALLOWED_ORIGINS.includes(asText(entry?.provenance?.origin))) errors.push(`${assetId} has an unsupported provenance origin.`);
    if (asText(entry?.provenance?.licence) !== 'EONAPP controlled original work') errors.push(`${assetId} must use the controlled original-work licence declaration.`);
    if (entry?.provenance?.humanReviewed !== true || entry?.provenance?.derivativeOfThirdParty !== false) errors.push(`${assetId} must have human review and no third-party derivative status.`);
    if (entry?.remoteNetwork !== false || entry?.containsUserData !== false) errors.push(`${assetId} cannot use remote network or user data.`);
  }
  if ((manifest?.entries || []).length > budget.maxAssets) errors.push(`Release exceeds the ${quality} asset budget.`);
  return Object.freeze({
    schema: EON_CITY_ASSET_RELEASE_PREFLIGHT_SCHEMA,
    ok: errors.length === 0,
    quality,
    budget,
    errors: freezeErrors(errors),
    entryCount: Array.isArray(manifest?.entries) ? manifest.entries.length : 0,
    finalBinaryArt: false,
    remoteNetwork: false,
    containsUserData: false
  });
}

export function getCityAssetReleasePreflightSummary() {
  const planned = CITY_ASSET_CATALOG.filter((entry) => entry.status === 'planned').length;
  const approved = CITY_ASSET_CATALOG.filter((entry) => entry.status === 'approved').length;
  const shipped = CITY_ASSET_CATALOG.filter((entry) => entry.status === 'shipped').length;
  return Object.freeze({
    schema: EON_CITY_ASSET_RELEASE_PREFLIGHT_SCHEMA,
    ready: false,
    currentState: shipped > 0
      ? 'Local engineering-candidate City binaries are present, but final visual-release approval is blocked pending manifest, review, device evidence and owner approval.'
      : 'No local engineering-candidate City binary is present in this source package.',
    catalog: Object.freeze({ planned, approved, shipped }),
    requiredBeforeFinalVisualRelease: Object.freeze([
      'catalog approval for each asset',
      'local GLB hash verification',
      'local provenance evidence',
      'lod0/lod1/lod2 budget validation',
      'KTX2/Basis texture validation',
      'human art/licence review',
      'device visual and performance evidence'
    ]),
    truth: getCityAssetReleaseTruth()
  });
}
