import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  W645_DOMAIN_BOARD_SCHEMA,
  W645_EVIDENCE_SUMMARY_SCHEMA,
  W645_KILL_SWITCH_RECEIPT_SCHEMA,
  W645_KILL_SWITCHES,
  W645_REQUIRED_DOMAINS
} from '../../config/w645-production-evidence-contract.mjs';
import { W638_EVIDENCE_INDEX_SCHEMA } from '../../config/w638-evidence-convergence-contract.mjs';
import { validateW643CreatorDeviceClosureContract } from '../../config/w643-creator-device-closure-contract.mjs';
import { evaluateW643CreatorDeviceClosure } from './w643-creator-device-evidence.mjs';
import { validateW644CityOwnerReceipt } from './w644-city-owner-certification.mjs';
import { validateCandidateProvenance, validateLaunchScopeEvidence, validatePreviewReceipt } from './w641-release-governance.mjs';

const freeze = (value) => Object.freeze(value);
const HEX64 = /^[a-f0-9]{64}$/;
const HEX40 = /^[a-f0-9]{40}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,159}$/i;
const TEXT_EXTENSIONS = new Set(['.json','.md','.txt','.log','.csv','.html','.xml']);
const SECRET = /(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|sk-[A-Za-z0-9_-]{16,}|whsec_[A-Za-z0-9_+\/-]{12,}|(?:authorization|cookie|password|secret|token|api[_-]?key)\s*[:=]\s*[^\s,;]{8,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i;
const ABSOLUTE = /(?:^[A-Za-z]:[\\/]|^\/|\\Users\\|\/home\/|\.\.[\\/])/;
const iso = (value) => Number.isFinite(Date.parse(String(value || '')));
const sha256 = (input) => crypto.createHash('sha256').update(input).digest('hex');
const unique = (rows) => [...new Set(rows)];

function normalizeArtifactPath(value = '') {
  const raw = String(value || '').replaceAll('\\','/').trim();
  if (!raw || path.posix.isAbsolute(raw) || /^[A-Za-z]:\//.test(raw)) return null;
  const normalized = path.posix.normalize(raw);
  if (normalized === '..' || normalized.startsWith('../') || normalized.includes('/../')) return null;
  if (!normalized.startsWith('evidence/w638/') && !normalized.startsWith('evidence/w645/')) return null;
  return normalized;
}

function inspectArtifact(root, artifact = {}) {
  const issues = [];
  const relative = normalizeArtifactPath(artifact?.path || artifact);
  if (!relative) return freeze({ ok:false, issues:freeze(['artifact-path-invalid']), path:String(artifact?.path || artifact || '') });
  const absolute = path.join(root, ...relative.split('/'));
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) return freeze({ ok:false, issues:freeze(['artifact-missing']), path:relative });
  const buffer = fs.readFileSync(absolute);
  const digest = sha256(buffer);
  if (artifact?.sha256 && artifact.sha256 !== digest) issues.push('artifact-digest-mismatch');
  if (artifact?.bytes != null && artifact.bytes !== buffer.length) issues.push('artifact-byte-count-mismatch');
  if (TEXT_EXTENSIONS.has(path.extname(relative).toLowerCase()) && SECRET.test(buffer.toString('utf8'))) issues.push('artifact-sensitive-material');
  return freeze({ ok:issues.length===0, issues:freeze(unique(issues)), path:relative, bytes:buffer.length, sha256:digest });
}

function recomputeW638IndexDigest(index = {}) {
  const artifacts = (Array.isArray(index?.artifacts) ? index.artifacts : []).map(({ path: artifactPath, bytes, sha256: digest }) => ({ path: artifactPath, bytes, sha256: digest }));
  return sha256(Buffer.from(JSON.stringify({ lanes: index?.lanes || [], artifacts }), 'utf8'));
}

export function validateW645W638Index(index = {}, { root = process.cwd() } = {}) {
  const issues = [];
  if (index?.schema !== W638_EVIDENCE_INDEX_SCHEMA || index?.wave !== 'W638') issues.push('w638-index-identity-invalid');
  if (!HEX64.test(String(index?.indexDigest || '')) || index.indexDigest !== recomputeW638IndexDigest(index)) issues.push('w638-index-digest-invalid');
  if (index?.sourceGateOk !== true || !Array.isArray(index?.lanes) || index.lanes.length !== 5) issues.push('w638-index-structure-invalid');
  const artifacts = (Array.isArray(index?.artifacts) ? index.artifacts : []).map((artifact) => inspectArtifact(root, artifact));
  if (artifacts.some((artifact) => !artifact.ok)) issues.push('w638-artifact-validation-failed');
  if (index?.boundaries?.syntheticCanCertify !== false || index?.boundaries?.sourceCanCertify !== false || index?.boundaries?.secretsIncluded !== false) issues.push('w638-boundary-invalid');
  return freeze({ ok:issues.length===0, issues:freeze(unique(issues)), artifacts:freeze(artifacts) });
}

export function validateW645DomainBoard(board = {}, { root = process.cwd(), candidate = {}, preview = {}, laneDecisions = {}, creator = {}, city = {} } = {}) {
  const issues = [];
  if (board?.schema !== W645_DOMAIN_BOARD_SCHEMA || board?.wave !== 'W645') issues.push('domain-board-identity-invalid');
  if (board?.candidateDigest !== candidate?.candidateDigest || board?.previewDeploymentId !== preview?.deploymentId) issues.push('domain-board-candidate-link-invalid');
  if (!iso(board?.occurredAt) || board?.ownerReviewed !== true || board?.redactionReviewed !== true) issues.push('domain-board-review-invalid');
  if (board?.secretsIncluded !== false || board?.directIdentifiersIncluded !== false || board?.absolutePathsIncluded !== false) issues.push('domain-board-redaction-invalid');
  const domains = Array.isArray(board?.domains) ? board.domains : [];
  if (domains.length !== 11 || new Set(domains.map((row)=>row?.id)).size !== 11) issues.push('domain-count-invalid');
  const artifactReports = [];
  for (const id of W645_REQUIRED_DOMAINS) {
    const row = domains.find((item)=>item?.id===id);
    if (!row) { issues.push(`domain-missing:${id}`); continue; }
    if (row.status !== 'pass' || row.ownerReviewed !== true || row.redactionReviewed !== true) issues.push(`domain-not-reviewed-pass:${id}`);
    if (row.candidateDigest !== candidate?.candidateDigest || row.previewDeploymentId !== preview?.deploymentId) issues.push(`domain-link-invalid:${id}`);
    const artifacts = Array.isArray(row.artifacts) ? row.artifacts : [];
    if (artifacts.length < 1) issues.push(`domain-artifact-required:${id}`);
    for (const artifact of artifacts) {
      const report = inspectArtifact(root, artifact);
      artifactReports.push(report);
      if (!report.ok) issues.push(`domain-artifact-invalid:${id}`);
    }
  }
  const creatorRow = domains.find((row)=>row?.id==='creator');
  if (creator?.launchScopePass !== true) issues.push('creator-launch-scope-not-pass');
  if (creator?.fullVideoCertified !== true && creatorRow?.mode !== 'image-active-video-gated') issues.push('creator-domain-mode-invalid');
  const cityRow = domains.find((row)=>row?.id==='city');
  if (city?.ok !== true || city?.overallScore < 9.5 || city?.minimumCategoryScore < 9) issues.push('city-owner-certification-not-pass');
  if (cityRow?.mode !== 'active-owner-certified') issues.push('city-domain-mode-invalid');
  const referralRow = domains.find((row)=>row?.id==='referral');
  if (laneDecisions?.referral?.decision === 'gated' && referralRow?.mode !== 'gated-truthful') issues.push('referral-domain-gate-mode-invalid');
  return freeze({ ok:issues.length===0, issues:freeze(unique(issues)), artifacts:freeze(artifactReports) });
}

export function validateW645KillSwitchReceipt(value = {}, { candidate = {}, preview = {} } = {}) {
  const issues = [];
  if (value?.schema !== W645_KILL_SWITCH_RECEIPT_SCHEMA || value?.wave !== 'W645') issues.push('kill-switch-identity-invalid');
  if (value?.status !== 'pass' || !iso(value?.occurredAt)) issues.push('kill-switch-status-invalid');
  if (value?.candidateDigest !== candidate?.candidateDigest || value?.previewDeploymentId !== preview?.deploymentId) issues.push('kill-switch-link-invalid');
  if (!SAFE_ID.test(String(value?.rollbackDeploymentId || ''))) issues.push('rollback-deployment-id-invalid');
  const rows = Array.isArray(value?.switches) ? value.switches : [];
  for (const required of W645_KILL_SWITCHES) {
    const row = rows.find((item)=>item?.id===required.id);
    if (!row || row.setting !== required.setting || row.safeValue !== required.safeValue || row.previewRehearsed !== true || row.expectedEffectObserved !== true || row.dataPreserved !== true || row.customerMutationCreated !== false) issues.push(`kill-switch-invalid:${required.id}`);
  }
  if (rows.length !== W645_KILL_SWITCHES.length) issues.push('kill-switch-count-invalid');
  if (value?.d1ResetPerformed !== false || value?.migrationRollbackPerformed !== false || value?.ownerReviewed !== true || value?.redactionReviewed !== true || value?.secretsIncluded !== false) issues.push('kill-switch-boundary-invalid');
  return freeze({ ok:issues.length===0, issues:freeze(unique(issues)) });
}

export function buildW645ProductionEvidencePackage({ root, candidate, preview, index, laneDecisions, creatorBoard, cityReceipt, domainBoard, killSwitch }) {
  const candidateCheck = validateCandidateProvenance(candidate);
  const previewCheck = validatePreviewReceipt({ ...preview, ownerReviewed:true, redactionReviewed:true }, candidate);
  const indexCheck = validateW645W638Index(index, { root });
  const launchScope = validateLaunchScopeEvidence(index, laneDecisions);
  const creatorContract = validateW643CreatorDeviceClosureContract();
  const creator = evaluateW643CreatorDeviceClosure(creatorBoard);
  const city = validateW644CityOwnerReceipt(cityReceipt);
  const domains = validateW645DomainBoard(domainBoard, { root, candidate, preview, laneDecisions, creator, city });
  const kill = validateW645KillSwitchReceipt(killSwitch, { candidate, preview });
  const issues = unique([candidateCheck,previewCheck,indexCheck,launchScope,creatorContract,city,domains,kill].flatMap((result)=>result?.issues || (result?.ok===false?['validator-failed']:[])));
  if (!creatorContract.ok) issues.push('creator-contract-invalid');
  const pass = issues.length===0;
  const rehearsal = {
    schema:'eonapp.whole-app-production-rehearsal-board.w639.v1', wave:'W639', generatedAt:domainBoard?.occurredAt || new Date(0).toISOString(),
    sourceGateOk:pass, productionVerdict:pass?'pass':'no-go', productionRehearsalPassed:pass, launchCandidateFrozen:pass,
    freezeDigest:candidate?.w639FreezeDigest || '', evidenceIndexDigest:index?.indexDigest || '', buildDigest:candidate?.distPayloadDigest || '',
    domains:W645_REQUIRED_DOMAINS.map((id)=>({ id, status:pass?'pass':'no-go', sourceReady:true, externalEvidence:true })),
    boundaries:{ localBuildCanCertifyProduction:false, emptyEvidenceCanFreezeLaunchCandidate:false, destructiveCustomerActionsAutomated:false }
  };
  const summary = {
    schema:W645_EVIDENCE_SUMMARY_SCHEMA, wave:'W645', productionVerdict:pass?'pass':'no-go', productionCertified:pass,
    candidateDigest:candidate?.candidateDigest || '', commitSha:candidate?.commitSha || '', previewDeploymentId:preview?.deploymentId || '',
    evidenceIndexDigest:index?.indexDigest || '', freezeDigest:candidate?.w639FreezeDigest || '',
    creatorVerdict:creator.productionVerdict, cityOverallScore:city.overallScore, cityMinimumCategoryScore:city.minimumCategoryScore,
    domainCount:W645_REQUIRED_DOMAINS.length, killSwitchesRehearsed:kill.ok, issues:freeze(issues),
    boundaries:{ typedPassCanCertify:false, sourceCanCertify:false, syntheticCanCertify:false, secretsIncluded:false, destructiveCustomerActionsAutomated:false }
  };
  return freeze({ ok:pass, issues:freeze(issues), summary:freeze(summary), rehearsal:freeze(rehearsal), creator, city, checks:freeze({candidate:candidateCheck,preview:previewCheck,index:indexCheck,launchScope,domains,kill}) });
}
