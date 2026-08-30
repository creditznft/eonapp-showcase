/**
 * W717 — institutional security, privacy and certification simplification.
 *
 * Source readiness only. External penetration testing, Cloudflare policy
 * evidence, dependency advisory resolution, live OAuth/session checks and
 * production incident drills remain W718/W719 evidence requirements.
 */
import { validateW530SecurityOauthContract } from './w530-security-oauth-contract.mjs';
import { validateW636SecurityPrivacyAbuseContract } from './w636-security-privacy-abuse-contract.mjs';

export const W717_SECURITY_CERTIFICATION_SCHEMA = 'eonapp.security-certification-simplification.w717.v1';

const freeze = Object.freeze;

export const W717_THREAT_MODEL = freeze([
  freeze({
    id: 'project-handoff',
    assets: freeze(['project title', 'task metadata', 'ordinary work references']),
    threats: freeze(['unreviewed import', 'overwrite', 'path injection', 'private payload expansion']),
    controls: freeze(['local review before import', 'bounded JSON schema', 'no automatic merge', 'no ownership claim', 'safe internal routes']),
    externalProof: 'Hostile handoff corpus and headed-browser review in W718.'
  }),
  freeze({
    id: 'vault-and-recovery',
    assets: freeze(['provider credentials', 'encrypted backup', 'recovery material']),
    threats: freeze(['plaintext exposure', 'cross-surface leakage', 'unsafe restore', 'secret logging']),
    controls: freeze(['Vault-only custody', 'masked display', 'explicit restore review', 'secret scan', 'no ordinary project copy']),
    externalProof: 'Owner recovery drill and storage inspection in W718.'
  }),
  freeze({
    id: 'provider-keys',
    assets: freeze(['BYOK secret', 'verification state', 'provider route']),
    threats: freeze(['DOM disclosure', 'network forwarding to wrong origin', 'silent verification', 'credential persistence drift']),
    controls: freeze(['no secret in cross-route state', 'explicit verification', 'provider allowlist', 'masked status only', 'no telemetry payload']),
    externalProof: 'Real provider network trace and logout/reload review in W718.'
  }),
  freeze({
    id: 'referral-and-eonkeys',
    assets: freeze(['referral identity', 'qualification event', 'grant and reversal ledger']),
    threats: freeze(['replay', 'self-referral', 'duplicate grant', 'cash-equivalent claim', 'client-side entitlement mutation']),
    controls: freeze(['server ledger', 'idempotency', 'replay protection', 'refund reversal', 'non-cash individual unlock boundary']),
    externalProof: 'Server replay, duplicate-conflict and fraud review in W718.'
  }),
  freeze({
    id: 'payment-callbacks',
    assets: freeze(['Dodo event', 'subscription state', 'entitlement ledger']),
    threats: freeze(['unsigned webhook', 'replay', 'query-parameter entitlement', 'open redirect', 'duplicate subscription drift']),
    controls: freeze(['signed webhook', 'bounded body', 'idempotent ledger', 'allowlisted checkout URL', 'browser callback cannot grant access']),
    externalProof: 'Real signed webhook, replay and refund lifecycle in W718.'
  })
]);

export const W717_CERTIFICATION_LANES = freeze([
  freeze({ id: 'source-authority', command: 'npm run verify:institutional-source', current: true, requiresDependencies: false, purpose: 'W701–W717 source contracts and focused gates.' }),
  freeze({ id: 'current-unit', command: 'npm run test:unit', current: true, requiresDependencies: true, purpose: 'One maintained manifest; historical evidence is explicitly non-certifying.' }),
  freeze({ id: 'integration', command: 'npm run verify:w718-integration', current: false, requiresDependencies: true, purpose: 'Cross-route, Functions, persistence and provider integration.' }),
  freeze({ id: 'build-smoke', command: 'npm run build && npm run smoke:build', current: true, requiresDependencies: true, purpose: 'One production build and one Pages-root smoke pass.' }),
  freeze({ id: 'browser-device', command: 'npm run verify:w718-browser-device', current: false, requiresDependencies: true, purpose: 'Headed browser, accessibility, performance and owner-device evidence.' }),
  freeze({ id: 'security', command: 'npm run verify:institutional-security', current: true, requiresDependencies: false, purpose: 'Secret scan plus current OAuth, privacy, abuse and W717 controls.' }),
  freeze({ id: 'release', command: 'npm run verify:w719-frozen-release', current: false, requiresDependencies: true, purpose: 'Frozen candidate identity, Preview, production parity and rollback.' })
]);

export const W717_EXTERNAL_EVIDENCE_REQUIRED = freeze([
  'exact-lockfile dependency advisory receipt',
  'independent penetration test or documented equivalent review',
  'Cloudflare WAF, rate-limit, bindings and D1 access evidence',
  'controlled Google OAuth and session lifecycle',
  'real signed Dodo webhook replay, refund and duplicate-conflict evidence',
  'browser CSP delivery and redacted report evidence',
  'owner Vault restore and provider-key persistence inspection',
  'incident-response and rollback tabletop drill'
]);

export function validateW717SecurityCertificationContract({
  threatModel = W717_THREAT_MODEL,
  lanes = W717_CERTIFICATION_LANES,
  externalEvidence = W717_EXTERNAL_EVIDENCE_REQUIRED
} = {}) {
  const checks = freeze({
    schema: W717_SECURITY_CERTIFICATION_SCHEMA === 'eonapp.security-certification-simplification.w717.v1',
    inheritedOauth: validateW530SecurityOauthContract().length === 0,
    inheritedSecurity: validateW636SecurityPrivacyAbuseContract().ok,
    threatModel: Array.isArray(threatModel) && threatModel.length === 5 && threatModel.every((row) => row.assets?.length && row.threats?.length >= 3 && row.controls?.length >= 4 && row.externalProof),
    lanes: Array.isArray(lanes) && lanes.length === 7 && new Set(lanes.map((row) => row.id)).size === 7,
    currentSourceLane: lanes.some((row) => row.id === 'source-authority' && row.current && !row.requiresDependencies),
    currentSecurityLane: lanes.some((row) => row.id === 'security' && row.current && !row.requiresDependencies),
    deferredPhysicalLanes: lanes.filter((row) => ['integration', 'browser-device', 'release'].includes(row.id)).every((row) => !row.current && row.requiresDependencies),
    externalFence: Array.isArray(externalEvidence) && externalEvidence.length >= 8
  });
  return freeze({ ok: Object.values(checks).every(Boolean), checks });
}

export function getW717SecurityCertificationTruth() {
  return freeze({
    schema: W717_SECURITY_CERTIFICATION_SCHEMA,
    sourceSecurityReviewed: true,
    productionSecurityCertified: false,
    dependencyAuditCompleted: false,
    penetrationTestCompleted: false,
    physicalBrowserEvidenceCompleted: false,
    historicalTestsCertifyCurrentSource: false,
    currentUnitManifestRequired: true,
    secretScanRequired: true,
    exactBuildRequired: true,
    immutableReleaseRequired: true,
    performsNetworkRequest: false,
    mutatesProduction: false,
    startsOauth: false,
    startsPayment: false
  });
}

export default freeze({
  W717_SECURITY_CERTIFICATION_SCHEMA,
  W717_THREAT_MODEL,
  W717_CERTIFICATION_LANES,
  W717_EXTERNAL_EVIDENCE_REQUIRED,
  validateW717SecurityCertificationContract,
  getW717SecurityCertificationTruth
});
