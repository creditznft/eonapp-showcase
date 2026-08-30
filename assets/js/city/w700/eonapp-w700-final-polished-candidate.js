/** W700 — final polished local candidate truth authority. */
export const EONAPP_W700_FINAL_POLISHED_CANDIDATE_SCHEMA = 'eonapp.final-polished-local-candidate.w700.v1';
const freeze = (value) => Object.freeze(value);

export function validateEonAppW700FinalPolishedCandidate(candidate = {}, sourceManifest = {}, maintainedManifest = {}, ownerMatrix = {}) {
  const errors = [];
  if (candidate.schema !== EONAPP_W700_FINAL_POLISHED_CANDIDATE_SCHEMA || candidate.wave !== 'W700') errors.push('candidate-schema-invalid');
  if (candidate.status !== 'final-polished-local-source-candidate-browser-proof-pending') errors.push('candidate-status-invalid');
  if (sourceManifest.schema !== 'eonapp.source-reconciliation.w700.v1' || sourceManifest.currentWave !== 'W700' || sourceManifest.sourceFileCount !== sourceManifest.files?.length || !/^[a-f0-9]{64}$/.test(sourceManifest.aggregateSha256 || '')) errors.push('source-manifest-invalid');
  if (maintainedManifest.currentWave !== 'W700' || maintainedManifest.testFileCount !== maintainedManifest.testFiles?.length || maintainedManifest.testFileCount < 376) errors.push('maintained-manifest-invalid');
  if (ownerMatrix.schema !== 'eon.city.owner-recording-matrix.w700.v1' || ownerMatrix.status !== 'pending-owner-browser-evidence' || ownerMatrix.recordings?.length < 20 || ownerMatrix.recordings?.some((entry) => entry.status !== 'pending')) errors.push('owner-matrix-invalid');
  if (candidate.evidence?.glbBindPoseInspection !== 'complete' || candidate.evidence?.headedBrowser !== 'pending' || candidate.evidence?.ownerDevice !== 'pending' || candidate.evidence?.visualScore !== 'not-claimed' || candidate.evidence?.ninePointFiveScore !== 'not-claimed') errors.push('evidence-boundary-invalid');
  const boundary = candidate.releaseBoundaries || {};
  if (boundary.githubUploadPerformed || boundary.actionsRunPerformed || boundary.previewPerformed || boundary.mergePerformed || boundary.deploymentPerformed || boundary.productionReleaseAllowed) errors.push('release-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), sourceFileCount: sourceManifest.sourceFileCount || 0, maintainedTestCount: maintainedManifest.testFileCount || 0, ownerRecordingCount: ownerMatrix.recordings?.length || 0, browserProof: candidate.evidence?.headedBrowser || 'unknown' });
}

export function getEonAppW700FinalPolishedCandidateTruth() {
  return freeze({
    schema: EONAPP_W700_FINAL_POLISHED_CANDIDATE_SCHEMA,
    w694BaselinePreserved: true,
    exactW700SourceManifestRequired: true,
    maintainedSuiteAlignmentRequired: true,
    expandedOwnerRecordingMatrixRequired: true,
    glbBindPoseInspectionComplete: true,
    headedBrowserStillRequired: true,
    ownerDeviceStillRequired: true,
    ninePointFiveScoreNotClaimed: true,
    githubUploadPerformed: false,
    deploymentPerformed: false,
    productionReleaseAllowed: false
  });
}

export default freeze({ EONAPP_W700_FINAL_POLISHED_CANDIDATE_SCHEMA, validateEonAppW700FinalPolishedCandidate, getEonAppW700FinalPolishedCandidateTruth });
