/** W787A — privacy-safe future-region release evidence export. */
const freeze = Object.freeze;

export const EON_EXPANSE_W787A_RELEASE_EVIDENCE_SCHEMA = 'eon.expanse.future-region-release-evidence.w787a.v1';

const row = (entry = {}) => freeze({
  id: String(entry.id || '').slice(0, 80),
  complete: entry.complete === true,
  status: String(entry.status || '').slice(0, 240)
});

export function createEonExpanseW787AReleaseEvidence({
  releaseMatrix = null,
  packageReadiness = null,
  performanceReadiness = null,
  artAudit = null,
  generatedAt = Date.now()
} = {}) {
  const matrixRows = freeze([...(releaseMatrix?.rows || [])].map(row));
  const performanceMetrics = freeze([...(performanceReadiness?.metrics || [])].map((entry) => freeze({
    key: String(entry.key || '').slice(0, 40),
    used: Math.max(0, Number(entry.used || 0)),
    limit: Math.max(0, Number(entry.limit || 0)),
    withinBudget: entry.withinBudget === true
  })));
  return freeze({
    schema: EON_EXPANSE_W787A_RELEASE_EVIDENCE_SCHEMA,
    generatedAt: Math.max(0, Number(generatedAt) || Date.now()),
    regionId: String(releaseMatrix?.regionId || packageReadiness?.regionId || '').slice(0, 120),
    releaseMatrix: freeze({
      status: String(releaseMatrix?.status || 'release-matrix-unavailable').slice(0, 160),
      completedGates: Math.max(0, Number(releaseMatrix?.completedGates || 0)),
      totalGates: Math.max(0, Number(releaseMatrix?.totalGates || matrixRows.length)),
      readyForExplicitReleaseReview: releaseMatrix?.releaseReviewReady === true,
      rows: matrixRows
    }),
    authoredPackage: freeze({
      status: String(packageReadiness?.status || 'package-readiness-unavailable').slice(0, 160),
      completedRequirements: Math.max(0, Number(packageReadiness?.completedRequirements || 0)),
      totalRequirements: Math.max(0, Number(packageReadiness?.totalRequirements || 0)),
      certificationReady: packageReadiness?.certificationReady === true,
      packageDigest: packageReadiness?.certificationReady === true ? String(packageReadiness?.packageDigest || '').slice(0, 64) : ''
    }),
    performance: freeze({
      status: String(performanceReadiness?.status || 'performance-readiness-unavailable').slice(0, 160),
      staticBudgetPass: performanceReadiness?.staticBudgetPass === true,
      foregroundMeasured: performanceReadiness?.foregroundMeasured === true,
      foregroundPass: performanceReadiness?.foregroundPass === true,
      soakVerified: performanceReadiness?.soakVerified === true,
      certificationReady: performanceReadiness?.certificationReady === true,
      metrics: performanceMetrics
    }),
    art: freeze({
      releaseReady: artAudit?.releaseReady === true,
      blockingProxyCount: Math.max(0, Number(artAudit?.blockingProxyCount || 0)),
      visibleDevelopmentProxyCount: Math.max(0, Number(artAudit?.visibleDevelopmentProxyCount || 0))
    }),
    certificationClaimed: false,
    gatewayActivated: false,
    regionRendered: false,
    automaticRelease: false,
    grantsXp: false,
    privateContentStored: false
  });
}

export function serializeEonExpanseW787AReleaseEvidence(evidence = null, { pretty = true } = {}) {
  return JSON.stringify(evidence || createEonExpanseW787AReleaseEvidence(), null, pretty ? 2 : 0);
}

export default freeze({
  EON_EXPANSE_W787A_RELEASE_EVIDENCE_SCHEMA,
  createEonExpanseW787AReleaseEvidence,
  serializeEonExpanseW787AReleaseEvidence
});
