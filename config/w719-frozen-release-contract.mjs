/** W719 — immutable Cloudflare release and stabilisation authority. */
export const W719_FROZEN_RELEASE_SCHEMA = 'eonapp.frozen-cloudflare-release.w719.v1';
const freeze = Object.freeze;

export const W719_RELEASE_STAGES = freeze([
  'exact-source-commit',
  'exact-w718-certification',
  'owner-acceptance',
  'freeze-candidate',
  'stage-complete-pages-root',
  'preview-deploy',
  'preview-verification',
  'production-owner-go',
  'identical-production-promotion',
  'production-verification',
  'rollback-rehearsal',
  'observe-24-hours',
  'observe-7-days'
]);

export const W719_PREVIEW_VERIFICATION_ROUTES = freeze([
  '/', '/create', '/projects', '/library', '/vault', '/local-ai', '/automations', '/billing', '/eoncity',
  '/release/candidate-provenance.json', '/api/auth/session', '/api/city/access', '/api/billing/status', '/api/referrals'
]);

export const W719_STABILISATION_RULES = freeze({
  observationHours: freeze([24, 168]),
  p0p1OnlyFixWindow: true,
  newFeaturesBlocked: true,
  privatePromptCollection: false,
  privateProjectCollection: false,
  rollbackUsesPreviousDeployment: true,
  rollbackRebuildAllowed: false
});

export function validateW719OwnerGo(value = {}) {
  const score = Number(value.overallScore);
  const minimum = Number(value.minimumPillarScore);
  const p0 = Number(value.p0Open);
  const p1 = Number(value.p1Open);
  const digest = String(value.pagesRootDigest || '');
  const candidateDigest = String(value.candidateDigest || '');
  const sourceCommit = String(value.sourceCommit || '');
  const checks = freeze({
    schema: value.schema === W719_FROZEN_RELEASE_SCHEMA,
    ownerAccepted: value.ownerAccepted === true,
    previewCertified: value.previewCertified === true,
    productionGo: value.productionGo === true,
    score: Number.isFinite(score) && score >= 9.5,
    minimum: Number.isFinite(minimum) && minimum >= 9,
    criticals: p0 === 0 && p1 === 0,
    pagesRootDigest: /^[a-f0-9]{64}$/.test(digest),
    candidateDigest: /^[a-f0-9]{64}$/.test(candidateDigest),
    sourceCommit: /^[a-f0-9]{40}$/.test(sourceCommit),
    previewIdentity: /^https:\/\//.test(String(value.previewUrl || '')) && Boolean(value.previewDeploymentId),
    rollbackIdentity: Boolean(value.rollbackDeploymentId)
  });
  return freeze({ ok: Object.values(checks).every(Boolean), checks });
}

export function getW719FrozenReleaseTruth() {
  return freeze({
    schema: W719_FROZEN_RELEASE_SCHEMA,
    sourceReleaseMachineryReady: true,
    candidateFrozen: false,
    previewDeployed: false,
    productionDeployed: false,
    liveProductionCertified: false,
    ownerGoRequired: true,
    exactW718ReceiptRequired: true,
    identicalRootRequired: true,
    rebuildBetweenPreviewAndProduction: false,
    automaticDeployment: false,
    automaticRollback: false,
    githubActionsRequired: false,
    cloudflareCredentialsReadBySourceGate: false
  });
}

export default freeze({
  W719_FROZEN_RELEASE_SCHEMA,
  W719_RELEASE_STAGES,
  W719_PREVIEW_VERIFICATION_ROUTES,
  W719_STABILISATION_RULES,
  validateW719OwnerGo,
  getW719FrozenReleaseTruth
});
