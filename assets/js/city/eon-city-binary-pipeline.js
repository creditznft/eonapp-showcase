/**
 * W567 — EON City future binary-art packaging, LOD and fallback contract.
 *
 * This is a pure-data validator. It does not add, fetch, decode, render,
 * store, upload or proxy GLB/KTX2/audio/image bytes. A valid package spec is
 * still pending binary evidence and cannot enable loading or shipment.
 */
import { CITY_ASSET_CATALOG } from './eon-city-asset-catalog.js';
import { EON_CITY_ART_SOURCE_CANDIDATE_SCHEMA, inspectCityArtSourceCandidate } from './eon-city-art-source-register.js';
import { getCityAssetReleaseTruth } from './eon-city-asset-release-preflight.js';

export const EON_CITY_BINARY_PIPELINE_SCHEMA = 'eon.city.binary-pipeline.w567.v1';
export const EON_CITY_BINARY_PIPELINE_MANIFEST_SCHEMA = 'eon.city.binary-pipeline-manifest.w567.v1';

const SAFE_ID = /^[a-z0-9][a-z0-9-]{2,79}$/;
const SAFE_GLB_PATH = /^\/assets\/city\/[a-z0-9][a-z0-9/_-]*\.glb$/i;
const SAFE_KTX2_PATH = /^\/assets\/city\/[a-z0-9][a-z0-9/_-]*\.ktx2$/i;
const SAFE_NAME = /^[a-z0-9][a-z0-9-]{1,79}$/;
const MAX_CLIPS = 6;

const freeze = (value) => Object.freeze(value);
const asText = (value) => String(value ?? '').trim();
const positiveInt = (value) => Number.isInteger(value) && value > 0;
const noExternalPath = (value) => !/(?:^|[^a-z])(?:https?:)?\/\//i.test(asText(value)) && !asText(value).includes('..');
const exactKeys = (object, allowed) => Object.keys(object && typeof object === 'object' ? object : {}).every((key) => allowed.includes(key));

export const EON_CITY_BINARY_PIPELINE_REQUIREMENTS = freeze([
  'W566 intake packet must be eligible for human rights review',
  'planned City catalog asset only',
  'three local GLB LOD paths with monotonic metrics',
  'simplified collision declaration with no private data',
  'review-bounded animation declaration with no embedded audio',
  'KTX2/Basis texture inventory within catalog limits',
  'procedural City Lite fallback',
  'static direct-delivery shape only; no Pages Function proxy',
  'W417 release preflight and human/device evidence remain mandatory'
]);

/** No future binary package is registered or shipped in W567. */
export const EON_CITY_BINARY_PIPELINE_MANIFESTS = freeze([]);

function catalogAsset(assetId, catalog) {
  return (catalog || []).find((entry) => entry?.id === assetId) || null;
}

function validGlbPath(value) {
  return SAFE_GLB_PATH.test(asText(value)) && noExternalPath(value);
}

function validKtx2Path(value) {
  return SAFE_KTX2_PATH.test(asText(value)) && noExternalPath(value);
}

function validateLod(lod, asset, errors, id) {
  const allowed = ['path', 'compressedBytes', 'triangles', 'materials', 'drawCalls'];
  if (!exactKeys(lod, allowed)) errors.push(`${id}-lod-has-unknown-fields`);
  if (!validGlbPath(lod?.path)) errors.push(`${id}-lod-path-invalid`);
  if (!positiveInt(lod?.compressedBytes) || lod.compressedBytes > asset.constraints.maxCompressedBytes) errors.push(`${id}-lod-byte-budget-invalid`);
  if (!positiveInt(lod?.triangles) || lod.triangles > asset.constraints.maxTriangles) errors.push(`${id}-lod-triangle-budget-invalid`);
  if (!positiveInt(lod?.materials) || lod.materials > asset.constraints.maxMaterials) errors.push(`${id}-lod-material-budget-invalid`);
  if (!positiveInt(lod?.drawCalls) || lod.drawCalls > asset.constraints.maxDrawCalls) errors.push(`${id}-lod-draw-call-budget-invalid`);
}

function validateTextures(textures, asset, errors) {
  if (!Array.isArray(textures) || !textures.length || textures.length > 4) {
    errors.push('texture-inventory-required-and-bounded');
    return;
  }
  const textureIds = new Set();
  let totalBytes = 0;
  for (const texture of textures) {
    if (!exactKeys(texture, ['id', 'path', 'format', 'width', 'height', 'compressedBytes', 'mips'])) errors.push('texture-has-unknown-fields');
    if (!SAFE_NAME.test(asText(texture?.id)) || textureIds.has(texture?.id)) errors.push('texture-id-invalid-or-duplicate');
    textureIds.add(texture?.id);
    if (!validKtx2Path(texture?.path)) errors.push('texture-path-must-be-local-ktx2');
    if (asText(texture?.format) !== 'KTX2/Basis Universal') errors.push('texture-format-must-be-ktx2-basis');
    if (!positiveInt(texture?.width) || !positiveInt(texture?.height) || texture.width > asset.constraints.maxTextureDimension || texture.height > asset.constraints.maxTextureDimension) errors.push('texture-dimension-budget-invalid');
    if (!positiveInt(texture?.compressedBytes)) errors.push('texture-byte-metric-invalid');
    totalBytes += Number(texture?.compressedBytes || 0);
    if (texture?.mips !== true) errors.push('texture-mips-required');
  }
  if (totalBytes > asset.constraints.maxCompressedBytes) errors.push('texture-total-byte-budget-invalid');
}

/**
 * Validates a prospective package only. Passing this check means the planned
 * shape is internally bounded; it never means a binary exists or is released.
 */
export function validateEonCityBinaryPipelineManifest(manifest = {}, { catalog = CITY_ASSET_CATALOG } = {}) {
  const errors = [];
  const root = manifest && typeof manifest === 'object' ? manifest : {};
  const allowedRoot = ['schema', 'packageId', 'assetId', 'stage', 'binaryPresent', 'runtimeLoadEnabled', 'provenance', 'lod', 'collision', 'animation', 'textures', 'fallback', 'delivery'];
  if (!exactKeys(root, allowedRoot)) errors.push('manifest-has-unknown-or-sensitive-fields');
  if (asText(root.schema) !== EON_CITY_BINARY_PIPELINE_MANIFEST_SCHEMA) errors.push('manifest-schema-invalid');
  if (!SAFE_ID.test(asText(root.packageId))) errors.push('manifest-package-id-invalid');
  const asset = catalogAsset(asText(root.assetId), catalog);
  if (!asset || asset.status !== 'planned') errors.push('manifest-asset-must-be-planned-catalog-entry');
  if (asText(root.stage) !== 'package-spec-pending-binary-evidence') errors.push('manifest-stage-must-remain-pending-binary-evidence');
  if (root.binaryPresent !== false || root.runtimeLoadEnabled !== false) errors.push('manifest-cannot-claim-binary-or-runtime-load');

  const provenance = inspectCityArtSourceCandidate(root.provenance || {});
  if (asText(root.provenance?.schema) !== EON_CITY_ART_SOURCE_CANDIDATE_SCHEMA || root.provenance?.assetId !== root.assetId || provenance.intakeEligible !== true) errors.push('manifest-provenance-intake-must-be-eligible-and-match-asset');

  const lod = root.lod && typeof root.lod === 'object' ? root.lod : {};
  const lodKeys = ['lod0', 'lod1', 'lod2'];
  if (!exactKeys(lod, lodKeys) || lodKeys.some((key) => !Object.prototype.hasOwnProperty.call(lod, key))) errors.push('manifest-must-declare-exactly-three-lods');
  if (asset) {
    validateLod(lod.lod0, asset, errors, 'lod0');
    validateLod(lod.lod1, asset, errors, 'lod1');
    validateLod(lod.lod2, asset, errors, 'lod2');
    const hasLod0Triangles = positiveInt(lod.lod0?.triangles);
    const hasLod1Triangles = positiveInt(lod.lod1?.triangles);
    const hasLod2Triangles = positiveInt(lod.lod2?.triangles);
    if ((hasLod0Triangles && hasLod1Triangles && lod.lod0.triangles <= lod.lod1.triangles) || (hasLod1Triangles && hasLod2Triangles && lod.lod1.triangles <= lod.lod2.triangles)) errors.push('lod-triangles-must-descend');
    const hasLod0Bytes = positiveInt(lod.lod0?.compressedBytes);
    const hasLod1Bytes = positiveInt(lod.lod1?.compressedBytes);
    const hasLod2Bytes = positiveInt(lod.lod2?.compressedBytes);
    if ((hasLod0Bytes && hasLod1Bytes && lod.lod0.compressedBytes < lod.lod1.compressedBytes) || (hasLod1Bytes && hasLod2Bytes && lod.lod1.compressedBytes < lod.lod2.compressedBytes)) errors.push('lod-byte-size-must-not-increase');
  }

  const collision = root.collision && typeof root.collision === 'object' ? root.collision : {};
  if (!exactKeys(collision, ['mode', 'triangleCount', 'containsUserData', 'dynamic'])) errors.push('collision-has-unknown-fields');
  if (!['simplified-static-mesh', 'primitive-proxies'].includes(asText(collision.mode))) errors.push('collision-mode-invalid');
  const collisionCap = asset ? Math.max(128, Math.floor(asset.constraints.maxTriangles * 0.15)) : 128;
  if (!positiveInt(collision.triangleCount) || collision.triangleCount > collisionCap) errors.push('collision-triangle-budget-invalid');
  if (collision.containsUserData !== false || collision.dynamic !== false) errors.push('collision-must-be-static-and-private-data-free');

  const animation = root.animation && typeof root.animation === 'object' ? root.animation : {};
  if (!exactKeys(animation, ['mode', 'clipCount', 'autoplay', 'embeddedAudio', 'containsUserData'])) errors.push('animation-has-unknown-fields');
  if (!['none', 'manual-review'].includes(asText(animation.mode))) errors.push('animation-mode-invalid');
  if (!Number.isInteger(animation.clipCount) || animation.clipCount < 0 || animation.clipCount > MAX_CLIPS) errors.push('animation-clip-count-invalid');
  if (asset?.constraints?.staticOnly === true && animation.clipCount !== 0) errors.push('static-asset-cannot-declare-animation-clips');
  if (animation.autoplay !== false || animation.embeddedAudio !== false || animation.containsUserData !== false) errors.push('animation-must-not-autoplay-embed-audio-or-carry-user-data');

  if (asset) validateTextures(root.textures, asset, errors);

  const fallback = root.fallback && typeof root.fallback === 'object' ? root.fallback : {};
  if (!exactKeys(fallback, ['mode', 'forceOnLite', 'binaryLoadBeforeProof'])) errors.push('fallback-has-unknown-fields');
  if (fallback.mode !== 'procedural-source-controlled' || fallback.forceOnLite !== true || fallback.binaryLoadBeforeProof !== false) errors.push('fallback-must-remain-procedural-and-proof-gated');

  const delivery = root.delivery && typeof root.delivery === 'object' ? root.delivery : {};
  if (!exactKeys(delivery, ['sameOriginStaticOnly', 'remoteNetwork', 'pagesFunctionProxy', 'edgePathPolicyProven', 'privateBinaryDeclared'])) errors.push('delivery-has-unknown-fields');
  if (delivery.sameOriginStaticOnly !== true || delivery.remoteNetwork !== false || delivery.pagesFunctionProxy !== false || delivery.edgePathPolicyProven !== false || delivery.privateBinaryDeclared !== false) errors.push('delivery-must-remain-static-local-and-unproven');

  return freeze({
    schema: EON_CITY_BINARY_PIPELINE_MANIFEST_SCHEMA,
    specValid: errors.length === 0,
    releaseEligible: false,
    binaryLoadEnabled: false,
    approved: false,
    shipped: false,
    stored: false,
    networkRequestCreated: false,
    errors: freeze(errors)
  });
}

/** Checks the static W567 state: no accepted binary package is registered. */
export function validateEonCityBinaryPipelineRegister(manifests = EON_CITY_BINARY_PIPELINE_MANIFESTS) {
  const errors = [];
  if (!Array.isArray(manifests) || manifests.length !== 0) errors.push('w567-pipeline-register-must-remain-empty');
  return freeze({
    schema: EON_CITY_BINARY_PIPELINE_SCHEMA,
    ok: errors.length === 0,
    errors: freeze(errors),
    registeredPackageCount: Array.isArray(manifests) ? manifests.length : 0,
    sourceOnly: true,
    binaryLoadEnabled: false,
    remoteNetwork: false,
    containsUserData: false
  });
}

/** Current source truth; W602–W604 candidates exist but no W567 final package/delivery/visual claim is released. */
export function getEonCityBinaryPipelineTruth() {
  const register = validateEonCityBinaryPipelineRegister();
  const release = getCityAssetReleaseTruth();
  return freeze({
    schema: EON_CITY_BINARY_PIPELINE_SCHEMA,
    registerValid: register.ok,
    registeredPackageCount: register.registeredPackageCount,
    sourceOnly: true,
    binaryPackagePresent: false,
    engineeringCandidateAssetsPresent: release.shippedBinaryCount > 0,
    binaryLoadEnabled: release.binaryLoadEnabled === true,
    humanRightsReviewCaptured: false,
    humanArtReviewCaptured: false,
    hashProofCaptured: false,
    lodProofCaptured: false,
    textureProofCaptured: false,
    collisionProofCaptured: false,
    animationProofCaptured: false,
    directStaticDeliveryProven: false,
    edgePathPolicyProven: false,
    deviceVisualProofCaptured: false,
    devicePerformanceProofCaptured: false,
    finalBinaryArtClaim: false,
    remoteNetwork: false,
    containsUserData: false
  });
}
