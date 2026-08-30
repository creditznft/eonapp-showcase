/**
 * W466 — final release evidence ledger.
 *
 * This module composes declared evidence states only. It never reads a browser,
 * asks for credentials, opens network connections, changes deployment state, or
 * enables commerce. A source package can make missing proof explicit, but it
 * cannot manufacture the proof or approve a release.
 */
import { W466_PRODUCTION_RELEASE_EVIDENCE_CONTRACT } from '../../../config/w466-production-release-evidence-contract.mjs';

export const EON_W466_PRODUCTION_RELEASE_EVIDENCE_SCHEMA = 'eon.release.production-evidence.w466.v1';
export const EON_W466_REQUIRED_SOURCE_VALIDATION = W466_PRODUCTION_RELEASE_EVIDENCE_CONTRACT.sourceValidationMustPass;
export const EON_W466_REQUIRED_CORE_EXTERNAL_EVIDENCE = W466_PRODUCTION_RELEASE_EVIDENCE_CONTRACT.coreExternalEvidence;
export const EON_W466_REQUIRED_COMMERCIAL_EXTERNAL_EVIDENCE = W466_PRODUCTION_RELEASE_EVIDENCE_CONTRACT.commercialExternalEvidence;

const freeze = (value) => Object.freeze(value);
const normalized = (ids, evidence = {}) => freeze(Object.fromEntries(ids.map((id) => [id, evidence?.[id] === true])));
const missing = (evidence, ids) => freeze(ids.filter((id) => evidence[id] !== true));

function sourceStatus(missingSource) {
  return missingSource.length === 0 ? 'source-validation-recorded' : 'blocked-source-validation-required';
}

function coreStatus(missingSource, missingCore) {
  if (missingSource.length) return 'blocked-source-validation-required';
  if (missingCore.length) return 'blocked-core-external-evidence-required';
  return 'ready-for-human-core-release-review-commercial-disabled';
}

function commercialStatus(missingSource, missingCommercial) {
  if (missingSource.length) return 'blocked-source-validation-required';
  if (missingCommercial.length) return 'blocked-commercial-external-evidence-required';
  return 'ready-for-human-commercial-review';
}

/**
 * Build a redaction-safe status board from boolean proof attestations supplied
 * by a reviewer. The board intentionally retains no URLs, account IDs, logs,
 * screenshots, cookies, provider payloads, or user data.
 */
export function buildEonW466ProductionReleaseEvidenceBoard({ sourceValidation = {}, externalEvidence = {}, commercialEvidence = {} } = {}) {
  const source = normalized(EON_W466_REQUIRED_SOURCE_VALIDATION, sourceValidation);
  const core = normalized(EON_W466_REQUIRED_CORE_EXTERNAL_EVIDENCE, externalEvidence);
  const commercial = normalized(EON_W466_REQUIRED_COMMERCIAL_EXTERNAL_EVIDENCE, commercialEvidence);
  const missingSource = missing(source, EON_W466_REQUIRED_SOURCE_VALIDATION);
  const missingCore = missing(core, EON_W466_REQUIRED_CORE_EXTERNAL_EVIDENCE);
  const missingCommercial = missing(commercial, EON_W466_REQUIRED_COMMERCIAL_EXTERNAL_EVIDENCE);
  const coreReviewStatus = coreStatus(missingSource, missingCore);
  const commercialReviewStatus = commercialStatus(missingSource, missingCommercial);

  return freeze({
    schema: EON_W466_PRODUCTION_RELEASE_EVIDENCE_SCHEMA,
    sourceOnly: true,
    canonicalRoutes: W466_PRODUCTION_RELEASE_EVIDENCE_CONTRACT.canonicalRoutes,
    sourceValidation: source,
    coreExternalEvidence: core,
    commercialExternalEvidence: commercial,
    missingSourceValidation: missingSource,
    missingCoreExternalEvidence: missingCore,
    missingCommercialExternalEvidence: missingCommercial,
    sourceValidationStatus: sourceStatus(missingSource),
    coreReviewStatus,
    commercialReviewStatus,
    releaseReviewStatus: missingSource.length || missingCore.length || missingCommercial.length
      ? 'blocked-evidence-required'
      : 'ready-for-human-release-review',
    coreReleaseEvidenceReadyForHumanReview: missingSource.length === 0 && missingCore.length === 0,
    commercialEvidenceReadyForHumanReview: missingSource.length === 0 && missingCommercial.length === 0,
    productionReleaseApproved: false,
    commercialActivationApproved: false,
    sourcePerformedDeployment: false,
    sourcePerformedLegacyDeletion: false,
    sourceGeneratedDeviceOrPaymentEvidence: false,
    requiresHumanGoNoGo: true
  });
}

/** A stable default used by UIs, scripts, and handoffs. */
export function getEonW466ProductionReleaseTruth() {
  const board = buildEonW466ProductionReleaseEvidenceBoard();
  return freeze({
    schema: EON_W466_PRODUCTION_RELEASE_EVIDENCE_SCHEMA,
    sourceOnly: true,
    releaseReviewStatus: board.releaseReviewStatus,
    coreReviewStatus: board.coreReviewStatus,
    commercialReviewStatus: board.commercialReviewStatus,
    productionReleaseApproved: false,
    commercialActivationApproved: false,
    requiresHumanGoNoGo: true
  });
}

export function assertEonW466HumanReviewReady(board = buildEonW466ProductionReleaseEvidenceBoard()) {
  if (board?.releaseReviewStatus === 'ready-for-human-release-review') return board;
  const missingItems = [
    ...(Array.isArray(board?.missingSourceValidation) ? board.missingSourceValidation : []),
    ...(Array.isArray(board?.missingCoreExternalEvidence) ? board.missingCoreExternalEvidence : []),
    ...(Array.isArray(board?.missingCommercialExternalEvidence) ? board.missingCommercialExternalEvidence : [])
  ];
  throw new Error(`W466 release review is blocked: ${missingItems.join(', ') || 'evidence-required'}`);
}
