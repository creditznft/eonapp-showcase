/**
 * W566 — EON City original-art source register and provenance intake boundary.
 *
 * This is a source-controlled record of the procedural/vector fallback that
 * exists today, plus a pure validator for future binary-art intake packets.
 * It never uploads, stores, fetches, approves, hashes, loads or ships art.
 * A valid intake packet is only ready for human rights review; W417 remains
 * the separate binary-release preflight and stays blocked in this source.
 */
import { CITY_ASSET_CATALOG, getCityAssetCatalogSummary, isCityAssetLoadable } from './eon-city-asset-catalog.js';
import { EON_CITY_ART_INTAKE } from './eon-city-art-intake.js';
import { getCityAssetReleaseTruth } from './eon-city-asset-release-preflight.js';
import { CITY_PLAY_ORIGINAL_ASSET_LEDGER } from './eon-city-play-art-direction.js';

export const EON_CITY_ART_SOURCE_REGISTER_SCHEMA = 'eon.city.art-source-register.w566.v1';
export const EON_CITY_ART_SOURCE_CANDIDATE_SCHEMA = 'eon.city.art-source-candidate.w566.v1';

const SAFE_ID = /^[a-z0-9][a-z0-9-]{2,79}$/;
const SAFE_LOCAL_SOURCE = /^assets\/js\/city\/[a-z0-9][a-z0-9-]*\.js$/;
const SAFE_LOCAL_EVIDENCE = /^docs\/city-art\/[a-z0-9][a-z0-9/_-]*\.md$/;
const SAFE_TEXT = /^[\p{L}\p{N} .,'()&/+\-:]{2,160}$/u;
const SAFE_ATTRIBUTION = /^[\p{L}\p{N} .,'()&/+\-:]{0,280}$/u;

const freeze = (value) => Object.freeze(value);
const freezeArray = (entries) => freeze(entries.map((entry) => freeze(entry)));
const asText = (value) => String(value ?? '').trim();
const hasExternalUrl = (value) => /(?:^|[^a-z])(?:https?:)?\/\//i.test(asText(value));
const exactKeys = (object, allowed) => Object.keys(object && typeof object === 'object' ? object : {}).every((key) => allowed.includes(key));

/**
 * These classes describe evidence a future human review must see. They do not
 * create a licence or assert that a third-party licence has been verified.
 */
export const EON_CITY_ART_SOURCE_CLASSES = freezeArray([
  {
    id: 'eonapp-original',
    label: 'EONAPP original work',
    releasePolicy: 'eligible only after local evidence, human review, W417 preflight and device proof',
    thirdPartyDerivativeAllowed: false,
    requiresAttributionRecord: false
  },
  {
    id: 'commissioned-original',
    label: 'Commissioned original work',
    releasePolicy: 'requires executed rights record and human review before W417 preflight',
    thirdPartyDerivativeAllowed: false,
    requiresAttributionRecord: true
  },
  {
    id: 'reviewed-commercial-licence',
    label: 'Reviewed commercial licence',
    releasePolicy: 'intake-only; current W417 original-work policy must be explicitly expanded and reviewed before release',
    thirdPartyDerivativeAllowed: false,
    requiresAttributionRecord: true
  }
]);

function currentProceduralSource(entry) {
  return freeze({
    sourceId: entry.id,
    sourceClass: 'eonapp-original',
    state: 'current-procedural-fallback',
    kind: entry.kind,
    sourcePath: entry.sourcePath,
    origin: entry.origin,
    licence: entry.licence,
    removalPath: entry.removalPath,
    binary: false,
    loadable: false,
    remoteNetwork: false,
    containsUserData: false,
    humanRightsReviewCaptured: false,
    attributionRequired: false
  });
}

/**
 * The only current register entries are existing source code assets. Their
 * provenance is source-adjacent and controlled; this is not a claim of a
 * completed final-art or legal clearance review.
 */
export const EON_CITY_ART_SOURCE_REGISTER = freeze(CITY_PLAY_ORIGINAL_ASSET_LEDGER.map(currentProceduralSource));

/** No GLB, KTX2, image, audio or texture candidate is accepted in W566. */
export const EON_CITY_BINARY_ART_INTAKE_REGISTER = freeze([]);

export const EON_CITY_ART_BINARY_REQUIREMENTS = freeze([
  'stable catalog asset id',
  'local evidence record with no external URL',
  'declared source class and rights holder',
  'generated-origin disclosure when applicable',
  'no private/user/project/Vault/provider content',
  'human rights and art review',
  'W417 hash, LOD, texture-budget and release-preflight evidence',
  'real-device visual and performance evidence',
  'edge path policy proof before private binary delivery'
]);

function getClass(id) {
  return EON_CITY_ART_SOURCE_CLASSES.find((entry) => entry.id === asText(id)) || null;
}

function makeCandidateErrors(candidate) {
  const errors = [];
  const root = candidate && typeof candidate === 'object' ? candidate : {};
  const allowedRoot = ['schema', 'sourceId', 'assetId', 'sourceClass', 'stage', 'evidencePath', 'rights', 'content'];
  const allowedRights = ['rightsHolder', 'licenceLabel', 'attributionRequired', 'attributionText', 'commercialUseAllowed', 'derivativeOfThirdParty'];
  const allowedContent = ['kind', 'generatedOriginDisclosed', 'containsUserData', 'networkSource', 'runtimePath', 'sha256'];
  if (!exactKeys(root, allowedRoot)) errors.push('candidate-has-unknown-or-sensitive-fields');
  if (asText(root.schema) !== EON_CITY_ART_SOURCE_CANDIDATE_SCHEMA) errors.push('candidate-schema-invalid');
  if (!SAFE_ID.test(asText(root.sourceId))) errors.push('candidate-source-id-invalid');
  const asset = CITY_ASSET_CATALOG.find((entry) => entry.id === asText(root.assetId));
  if (!asset || asset.status !== 'planned') errors.push('candidate-asset-must-be-planned-catalog-entry');
  const sourceClass = getClass(root.sourceClass);
  if (!sourceClass) errors.push('candidate-source-class-invalid');
  if (asText(root.stage) !== 'intake-pending-human-rights-review') errors.push('candidate-stage-must-remain-intake-pending');
  if (!SAFE_LOCAL_EVIDENCE.test(asText(root.evidencePath)) || hasExternalUrl(root.evidencePath)) errors.push('candidate-evidence-must-be-local-doc-path');
  if (!exactKeys(root.rights, allowedRights)) errors.push('candidate-rights-has-unknown-fields');
  if (!SAFE_TEXT.test(asText(root.rights?.rightsHolder))) errors.push('candidate-rights-holder-invalid');
  if (!SAFE_TEXT.test(asText(root.rights?.licenceLabel))) errors.push('candidate-licence-label-invalid');
  if (typeof root.rights?.attributionRequired !== 'boolean') errors.push('candidate-attribution-requirement-invalid');
  if (!SAFE_ATTRIBUTION.test(asText(root.rights?.attributionText))) errors.push('candidate-attribution-invalid');
  if (root.rights?.commercialUseAllowed !== true) errors.push('candidate-commercial-use-not-confirmed');
  if (root.rights?.derivativeOfThirdParty !== false) errors.push('candidate-third-party-derivative-not-allowed');
  if (!exactKeys(root.content, allowedContent)) errors.push('candidate-content-has-unknown-fields');
  if (!['glb', 'ktx2-texture', 'image', 'audio'].includes(asText(root.content?.kind))) errors.push('candidate-content-kind-invalid');
  if (typeof root.content?.generatedOriginDisclosed !== 'boolean') errors.push('candidate-generated-origin-disclosure-invalid');
  if (root.content?.containsUserData !== false) errors.push('candidate-must-not-contain-user-data');
  if (root.content?.networkSource !== false) errors.push('candidate-must-not-use-network-source');
  if (root.content?.runtimePath !== null || root.content?.sha256 !== null) errors.push('candidate-must-not-declare-runtime-path-or-hash-before-w417');
  return errors;
}

/**
 * Checks a proposed source packet without retaining it. `intakeEligible` is
 * deliberately weaker than approval or release; no packet can become loadable
 * through this function.
 */
export function inspectCityArtSourceCandidate(candidate = {}) {
  const errors = makeCandidateErrors(candidate);
  const sourceClass = getClass(candidate?.sourceClass);
  const intakeEligible = errors.length === 0;
  return freeze({
    schema: EON_CITY_ART_SOURCE_CANDIDATE_SCHEMA,
    intakeEligible,
    requiresHumanRightsReview: true,
    requiresHumanArtReview: true,
    requiresW417Preflight: true,
    requiresDeviceProof: true,
    requiresEdgePathPolicyForPrivateBinary: true,
    currentW417OriginalWorkPolicyCompatible: sourceClass?.id !== 'reviewed-commercial-licence',
    approved: false,
    loadable: false,
    shipped: false,
    stored: false,
    networkRequestCreated: false,
    errors: freeze([...errors])
  });
}

/** Validates only immutable, source-controlled register state. */
export function validateEonCityArtSourceRegister({
  sourceRegister = EON_CITY_ART_SOURCE_REGISTER,
  binaryIntakeRegister = EON_CITY_BINARY_ART_INTAKE_REGISTER,
  catalog = CITY_ASSET_CATALOG,
  intake = EON_CITY_ART_INTAKE
} = {}) {
  const errors = [];
  const sourceIds = new Set();
  const expectedIds = new Set(CITY_PLAY_ORIGINAL_ASSET_LEDGER.map((entry) => entry.id));
  if (!Array.isArray(sourceRegister) || sourceRegister.length !== CITY_PLAY_ORIGINAL_ASSET_LEDGER.length) errors.push('source-register-must-match-current-procedural-ledger');
  for (const entry of sourceRegister || []) {
    if (!SAFE_ID.test(asText(entry?.sourceId)) || sourceIds.has(entry?.sourceId)) errors.push('source-register-id-invalid-or-duplicate');
    sourceIds.add(entry?.sourceId);
    if (!expectedIds.has(entry?.sourceId)) errors.push('source-register-entry-not-in-current-ledger');
    if (entry?.sourceClass !== 'eonapp-original' || entry?.state !== 'current-procedural-fallback') errors.push('source-register-current-source-class-invalid');
    if (!SAFE_LOCAL_SOURCE.test(asText(entry?.sourcePath)) || hasExternalUrl(entry?.sourcePath)) errors.push('source-register-path-must-be-safe-local-city-source');
    if (!/^EONAPP original/i.test(asText(entry?.origin)) || asText(entry?.licence) !== 'EONAPP controlled original work') errors.push('source-register-provenance-or-licence-invalid');
    if (entry?.binary !== false || entry?.loadable !== false || entry?.remoteNetwork !== false || entry?.containsUserData !== false) errors.push('source-register-must-remain-procedural-and-local');
  }
  if (sourceIds.size !== expectedIds.size || [...expectedIds].some((id) => !sourceIds.has(id))) errors.push('source-register-missing-current-ledger-entry');
  if (!Array.isArray(binaryIntakeRegister) || binaryIntakeRegister.length !== 0) errors.push('binary-intake-register-must-remain-empty-in-w566');
  const shippedCandidates = Array.isArray(catalog) ? catalog.filter((entry) => entry?.status === 'shipped') : [];
  if (!Array.isArray(catalog) || !shippedCandidates.length || shippedCandidates.some((entry) => !isCityAssetLoadable(entry))) errors.push('catalog-must-contain-local-engineering-candidates-in-w611');
  if (!Array.isArray(intake) || intake.filter((entry) => entry?.intake?.loadable === true).length < 5 || intake.some((entry) => entry?.intake?.loadable === true && entry?.intake?.ownerVisualApproval !== 'pending')) errors.push('art-intake-must-keep-loadable-candidates-visually-pending-in-w611');
  return freeze({
    schema: EON_CITY_ART_SOURCE_REGISTER_SCHEMA,
    ok: errors.length === 0,
    errors: freeze(errors),
    currentProceduralSourceCount: Array.isArray(sourceRegister) ? sourceRegister.length : 0,
    binaryIntakeCount: Array.isArray(binaryIntakeRegister) ? binaryIntakeRegister.length : 0,
    engineeringCandidateAssetCount: shippedCandidates.length,
    sourceOnly: true,
    remoteNetwork: false,
    binaryLoadEnabled: shippedCandidates.length > 0,
    userData: false
  });
}

/** Returns current truthful status; this is not a legal-clearance or asset-delivery API. */
export function getEonCityArtSourceRegisterTruth() {
  const validation = validateEonCityArtSourceRegister();
  const releaseTruth = getCityAssetReleaseTruth();
  const catalog = getCityAssetCatalogSummary();
  return freeze({
    schema: EON_CITY_ART_SOURCE_REGISTER_SCHEMA,
    registerValid: validation.ok,
    currentProceduralSourceCount: validation.currentProceduralSourceCount,
    binaryIntakeCount: validation.binaryIntakeCount,
    engineeringCandidateAssetCount: validation.engineeringCandidateAssetCount,
    approvedBinarySourceCount: 0,
    shippedBinarySourceCount: catalog.shippedBinaryCount,
    sourceOnly: true,
    proceduralFallbackRetained: true,
    currentArtIsProceduralOrVectorFallback: false,
    candidateBinaryArtPresent: catalog.shippedBinaryCount > 0,
    humanRightsReviewCapturedForBinary: false,
    humanArtReviewCapturedForBinary: false,
    binaryLicenceEvidenceCaptured: false,
    binaryHashCaptured: false,
    binaryLoadEnabled: releaseTruth.binaryLoadEnabled === true,
    directStaticBinaryDeliveryProven: false,
    edgePathPolicyProven: false,
    deviceVisualProofCaptured: false,
    devicePerformanceProofCaptured: false,
    finalBinaryArtClaim: false,
    remoteNetwork: false,
    containsUserData: false
  });
}
