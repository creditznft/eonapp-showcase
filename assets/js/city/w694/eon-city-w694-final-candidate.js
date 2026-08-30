/** W694 — final local candidate truth authority. */
export const EON_CITY_W694_FINAL_CANDIDATE_SCHEMA = 'eonapp.final-local-candidate.w694.v1';
const freeze = (value) => Object.freeze(value);

export function validateEonCityW694FinalCandidate(candidate = {}, sourceManifest = {}, maintainedManifest = {}) {
  const errors = [];
  if (candidate.schema !== EON_CITY_W694_FINAL_CANDIDATE_SCHEMA || candidate.wave !== 'W694') errors.push('candidate-schema-invalid');
  if (candidate.status !== 'local-source-candidate-browser-proof-pending') errors.push('candidate-status-invalid');
  if (sourceManifest.schema !== 'eonapp.source-reconciliation.w694.v1' || sourceManifest.currentWave !== 'W694' || sourceManifest.sourceFileCount !== sourceManifest.files?.length || !/^[a-f0-9]{64}$/.test(sourceManifest.aggregateSha256 || '')) errors.push('source-manifest-invalid');
  const maintainedWave = Number(String(maintainedManifest.currentWave || '').replace(/^W/, ''));
  if (!Number.isFinite(maintainedWave) || maintainedWave < 694 || maintainedManifest.testFileCount !== maintainedManifest.testFiles?.length) errors.push('maintained-manifest-invalid');
  if (candidate.evidence?.headedBrowser !== 'pending' || candidate.evidence?.ownerDevice !== 'pending' || candidate.evidence?.visualScore !== 'not-claimed' || candidate.evidence?.ninePointFiveScore !== 'not-claimed') errors.push('evidence-boundary-invalid');
  const boundary = candidate.releaseBoundaries || {};
  if (boundary.githubUploadPerformed || boundary.actionsRunPerformed || boundary.previewPerformed || boundary.mergePerformed || boundary.deploymentPerformed || boundary.productionReleaseAllowed) errors.push('release-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), sourceFileCount: sourceManifest.sourceFileCount || 0, maintainedTestCount: maintainedManifest.testFileCount || 0, browserProof: candidate.evidence?.headedBrowser || 'unknown' });
}

export function getEonCityW694Truth() {
  return freeze({
    schema: EON_CITY_W694_FINAL_CANDIDATE_SCHEMA,
    exactSourceManifestRequired: true,
    maintainedSuiteAlignmentRequired: true,
    ownerRecordingMatrixRequired: true,
    browserProofPendingAllowedForLocalCandidate: true,
    browserProofPendingBlocksProduction: true,
    visualScoreNotClaimed: true,
    githubUploadPerformed: false,
    deploymentPerformed: false
  });
}

export default freeze({ EON_CITY_W694_FINAL_CANDIDATE_SCHEMA, validateEonCityW694FinalCandidate, getEonCityW694Truth });
