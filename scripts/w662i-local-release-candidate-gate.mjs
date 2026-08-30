#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const exists = (relative) => fs.existsSync(path.join(root, relative));
const candidate = readJson('config/w662i-local-release-candidate.json');
const sourceSuite = readJson('reports/w662i-local-source-suite/receipt.json');
const ledger = readJson('config/w662-implementation-exposure-ledger.json');
const wholeApp = readJson('config/w662h-whole-app-reconciliation.json');
const errors = [];

if (candidate.schema !== 'eonapp.w662i.local-release-candidate.2026-07-23.v1') errors.push('schema-invalid');
if (candidate.authority?.localBranch !== 'local/w662-9.5-reconciliation') errors.push('local-branch-invalid');
if (candidate.authority?.previewChangedByLocalCandidate !== false || candidate.authority?.productionChangedByLocalCandidate !== false) errors.push('remote-authority-broadened');
for (const wave of ['W662A','W662B','W662C','W662D','W662E','W662F','W662G','W662H','W662I']) {
  if (!candidate.programme?.[wave]) errors.push(`wave-status-missing:${wave}`);
}
if (sourceSuite.sourceSuitePassed !== true || sourceSuite.failedFileCount !== 0) errors.push('source-suite-not-clean');
if (sourceSuite.maintainedFileCount !== 334) errors.push('maintained-file-count-mismatch');
if (sourceSuite.passedFileCount !== candidate.verification?.maintainedSourceSuite?.passedFiles) errors.push('source-suite-pass-count-mismatch');
if (sourceSuite.dependencyBlockedFileCount !== candidate.verification?.maintainedSourceSuite?.dependencyBlockedFiles) errors.push('dependency-block-count-mismatch');
if (sourceSuite.dependencyBlockedFileCount !== 0) errors.push('dependency-block-remains');
if (sourceSuite.fullDependencySuitePassed !== true) errors.push('full-suite-not-certified');
if (candidate.verification?.fullDependencySuite !== 'pass-334-of-334-maintained-files') errors.push('full-suite-candidate-status-invalid');
const buildStatus = candidate.verification?.productionBuild;
const buildCertified = buildStatus === 'pass-permanent-predeploy-smoke-site-audit';
if (!['pending-after-full-source-pass', 'pass-permanent-predeploy-smoke-site-audit'].includes(buildStatus)) errors.push('build-status-invalid');
if (buildCertified && candidate.authority?.githubChangedByLocalCandidate !== true) errors.push('github-candidate-truth-missing');
if (!buildCertified && candidate.authority?.githubChangedByLocalCandidate !== false) errors.push('github-candidate-overclaimed');
if (buildCertified && !exists('docs/W662I_BUILD_CERTIFICATION_RECEIPT_2026-07-23.md')) errors.push('build-receipt-missing');
if (candidate.authorization?.localSourceCandidateReady !== true) errors.push('local-candidate-not-ready');
if (candidate.authorization?.dependencyRestoredBuildRequired !== false) errors.push('dependency-restoration-status-stale');
for (const field of ['mergeAuthorized','previewAuthorized','productionAuthorized','ninePointFiveClaimAuthorized']) {
  if (candidate.authorization?.[field] !== false) errors.push(`authorization-overclaimed:${field}`);
}
if (wholeApp.acceptance?.sourceGateComplete !== true || wholeApp.acceptance?.ownerAccepted !== false) errors.push('whole-app-truth-invalid');
if (ledger.summary?.statusCounts?.['human-proof-required'] !== 29 || ledger.summary?.statusCounts?.complete !== 2) errors.push('ledger-status-invalid');
if (ledger.components.some((component) => component.status === 'complete' && component.evidence?.authenticatedHumanProof !== true)) errors.push('ledger-completion-without-human-proof');
for (const relative of [
  'docs/W662_ORIGINAL_9_5_RECOVERY_PROGRAMME.md',
  'docs/W662H_WHOLE_APP_RECONCILIATION_RECEIPT_2026-07-23.md',
  'reports/w662i-local-source-suite/receipt.json',
  'docs/W662I_NPM_DEPENDENCY_BLOCK_2026-07-23.md'
]) if (!exists(relative)) errors.push(`required-receipt-missing:${relative}`);

if (errors.length) {
  console.error(JSON.stringify({ ok:false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  ok:true,
  schema:candidate.schema,
  localSourceCandidateReady:true,
  maintainedFiles:sourceSuite.maintainedFileCount,
  passedFiles:sourceSuite.passedFileCount,
  dependencyBlockedFiles:sourceSuite.dependencyBlockedFileCount,
  genuineFailedFiles:sourceSuite.failedFileCount,
  fullSourceSuiteCertified:true,
  fullBuildCertified:buildCertified,
  authenticatedPreviewCertified:false,
  ninePointFiveClaimAuthorized:false
}, null, 2));
