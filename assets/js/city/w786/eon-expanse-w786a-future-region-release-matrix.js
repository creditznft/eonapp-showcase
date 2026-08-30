/** W786A — truthful future-region release matrix from maintained authorities only. */
const freeze = Object.freeze;

export const EON_EXPANSE_W786A_RELEASE_MATRIX_SCHEMA = 'eon.expanse.future-region-release-matrix.w786a.v1';

const cleanStatus = (value, fallback) => String(value || fallback || '').replaceAll('-', ' ');

export function deriveEonExpanseW786AFutureRegionReleaseMatrix({
  postCampaign = null,
  programmeReview = null,
  openWorldArtAudit = null,
  packageReadiness = null,
  performanceReadiness = null,
  releaseGate = null
} = {}) {
  const visible = postCampaign?.visible === true;
  if (!visible) {return freeze({
    schema: EON_EXPANSE_W786A_RELEASE_MATRIX_SCHEMA,
    visible: false,
    regionId: '',
    rows: freeze([]),
    completedGates: 0,
    totalGates: 6,
    releaseReviewReady: false,
    gatewayActivated: false,
    rendersRegion: false,
    automaticRelease: false,
    grantsXp: false,
    privateContentStored: false
  });}

  const reviewed = programmeReview?.reviewedRegion || null;
  const rows = freeze([
    freeze({
      id: 'maintained-frontier',
      label: 'Maintained frontier progression',
      complete: postCampaign?.futureRegionReady === true,
      status: cleanStatus(postCampaign?.futureRegionStatus, 'maintained frontier pillars required')
    }),
    freeze({
      id: 'programme-review',
      label: 'Authored programme review',
      complete: Boolean(reviewed?.regionId),
      status: reviewed?.regionId ? `${reviewed.regionId.replaceAll('-', ' ')} reviewed; gateway locked` : cleanStatus(programmeReview?.status, 'programme review required')
    }),
    freeze({
      id: 'release-art',
      label: 'Release presentation art',
      complete: openWorldArtAudit?.releaseReady === true,
      status: openWorldArtAudit?.releaseReady === true ? 'No development proxies remain' : `${Math.max(0, Number(openWorldArtAudit?.blockingProxyCount || 0))} authored replacements required`
    }),
    freeze({
      id: 'authored-package',
      label: 'Authored region package',
      complete: packageReadiness?.certificationReady === true,
      status: packageReadiness?.visible === true
        ? `${Math.max(0, Number(packageReadiness?.completedRequirements || 0))}/${Math.max(0, Number(packageReadiness?.totalRequirements || 0))} evidence families complete`
        : 'Programme review required before package evidence'
    }),
    freeze({
      id: 'foreground-performance',
      label: 'Foreground performance and soak',
      complete: performanceReadiness?.certificationReady === true,
      status: cleanStatus(performanceReadiness?.status, 'foreground browser evidence required')
    }),
    freeze({
      id: 'canonical-release-gate',
      label: 'Canonical release gate',
      complete: releaseGate?.releaseReady === true,
      status: cleanStatus(releaseGate?.status, 'release evidence required')
    })
  ]);
  const completedGates = rows.filter((row) => row.complete).length;
  const releaseReviewReady = completedGates === rows.length;
  return freeze({
    schema: EON_EXPANSE_W786A_RELEASE_MATRIX_SCHEMA,
    visible: true,
    regionId: reviewed?.regionId || releaseGate?.recommendedRegionId || '',
    rows,
    completedGates,
    totalGates: rows.length,
    status: releaseReviewReady ? 'future-region-ready-for-explicit-release-review' : 'future-region-release-evidence-incomplete',
    releaseReviewReady,
    gatewayActivated: false,
    rendersRegion: false,
    automaticRelease: false,
    automaticCertification: false,
    grantsXp: false,
    mutatesProgression: false,
    privateContentStored: false
  });
}

export default freeze({ EON_EXPANSE_W786A_RELEASE_MATRIX_SCHEMA, deriveEonExpanseW786AFutureRegionReleaseMatrix });
