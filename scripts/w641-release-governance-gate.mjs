#!/usr/bin/env node
/** W641 source gate. Production remains unavailable until genuine protected authorization and exact-candidate proofs exist. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W641_RELEASE_GOVERNANCE_CONTRACT,
  W641_REQUIRED_REHEARSAL_DOMAINS,
  validateW641ReleaseGovernanceContract
} from '../config/w641-release-governance-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const json = (relative) => JSON.parse(read(relative));
const freeze = (value) => Object.freeze(value);
const count = (text, pattern) => text.match(pattern)?.length || 0;

export function inspectW641ReleaseGovernance() {
  const contract = validateW641ReleaseGovernanceContract();
  const packageJson = json('package.json');
  const board = json('config/w639-production-rehearsal-board.json');
  const ci = read('.github/workflows/ci.yml');
  const preview = read('.github/workflows/preview.yml');
  const authorize = exists('.github/workflows/authorize-production.yml') ? read('.github/workflows/authorize-production.yml') : '';
  const deploy = read('.github/workflows/deploy.yml');
  const requiredFiles = [
    'config/w641-release-governance-contract.mjs',
    'config/w641-launch-authorization-template.json',
    'scripts/lib/w641-release-governance.mjs',
    'scripts/w641-build-release-candidate.mjs',
    'scripts/w641-verify-release-candidate.mjs',
    'scripts/w641-release-governance-gate.mjs',
    'tests/unit/w641-release-governance.test.mjs',
    'EVIDENCE/w641/README.md',
    '.github/workflows/authorize-production.yml'
  ];
  const domainKeys = Object.keys(board.domainEvidence || {});

  const classicProductionPromotion =
    /(?:download-artifact|gh run download)/.test(deploy)
    && /w641-verify-release-candidate/.test(deploy)
    && /working-directory:\s*source/.test(deploy)
    && !/npm run build/.test(deploy)
    && !/npm ci/.test(deploy);

  const storageFreeSameRunPromotion =
    /verify:codex-predeploy/.test(deploy)
    && count(deploy, /npm run release:candidate -- --commit/g) === 1
    && /release:candidate:verify/.test(deploy)
    && /w641-verify-release-candidate/.test(deploy)
    && /w660l-stage-pages-deploy-root/.test(deploy)
    && /PREVIEW_BRANCH:\s*stage4-production-gate/.test(deploy)
    && count(deploy, /DEPLOY_ROOT:\s*\$\{\{\s*steps\.stage\.outputs\.root\s*\}\}/g) >= 2
    && /candidateDigest/.test(deploy)
    && /distPayloadDigest/.test(deploy)
    && /--branch=main/.test(deploy)
    && /if:\s*failure\(\)/.test(deploy)
    && /deployments\/\$ROLLBACK_ID\/rollback/.test(deploy)
    && !/(?:actions\/(?:upload|download)-artifact|gh run download)/.test(deploy);

  const storageFreeCiCandidate =
    /verify:codex-predeploy/.test(ci)
    && count(ci, /npm run release:candidate -- --commit/g) === 1
    && /release:candidate:verify/.test(ci)
    && /refs\/heads\/main/.test(ci)
    && !/actions\/upload-artifact/.test(ci);

  const classicEnvironmentProof =
    /repos\/\$\{REPO\}\/environments\/production/.test(authorize)
    && /required_reviewers/.test(authorize);
  const storageFreeEnvironmentProof =
    /repos\/\$REPO\/environments\/production/.test(deploy)
    && /w641-create-environment-receipt/.test(deploy)
    && /environmentProtectionDigest/.test(deploy);

  const classicRollbackRecord =
    /(?:rollbackDeploymentId|ROLLBACK_ID)/.test(authorize)
    && /previous_production_deployment_id/.test(authorize);
  const storageFreeRollbackRecord =
    /Capture exact rollback authority/.test(deploy)
    && /rollbackDeploymentId/.test(deploy)
    && /deployments\/\$ROLLBACK_ID\/rollback/.test(deploy);

  const classicAuthorizationStage =
    /workflow_dispatch/.test(authorize)
    && /environment:\s*\n\s*name:\s*launch-authorization/.test(authorize)
    && /validate-production-promotion/.test(authorize);
  const storageFreeAuthorizationStage =
    /workflow_dispatch/.test(deploy)
    && /environment:\s*\n\s*name:\s*production/.test(deploy)
    && /Record protected Stage-4 owner authorization/.test(deploy);

  const checks = freeze([
    freeze({ id: 'contract', pass: contract.ok, detail: 'immutable exact-candidate promotion and fail-closed owner authorization' }),
    freeze({ id: 'files', pass: requiredFiles.every(exists), detail: `${requiredFiles.length} governance files present` }),
    freeze({ id: 'complete-domain-template', pass: domainKeys.length === 11 && W641_REQUIRED_REHEARSAL_DOMAINS.every((id) => domainKeys.includes(id)), detail: `${domainKeys.length}/11 W639 input domains` }),
    freeze({ id: 'ci-candidate-artifact', pass: storageFreeCiCandidate, detail: 'CI builds and locally verifies one immutable candidate after permanent predeploy PASS without Actions artifact storage' }),
    freeze({ id: 'preview-no-rebuild', pass: /(?:download-artifact|gh run download)/.test(preview) && /w641-verify-release-candidate/.test(preview) && /working-directory:\s*source/.test(preview) && !/npm run build/.test(preview), detail: 'Preview downloads and verifies candidate without rebuilding' }),
    freeze({ id: 'preview-functions-parity', pass: /previewAliasUrl/.test(preview) && /api-surface-receipt\.json/.test(preview) && /w646-owner-evidence/.test(preview) && /candidate-provenance\.json/.test(preview) && /eonapp\.preview-api-surface-receipt\.w646\.v1/.test(preview), detail: 'Preview verifies deployment URL, stable alias and semantic JSON API parity' }),
    freeze({ id: 'authorization-stage', pass: classicAuthorizationStage || storageFreeAuthorizationStage, detail: 'owner authorization is protected by an explicit environment gate' }),
    freeze({ id: 'production-manual-only', pass: /workflow_dispatch/.test(deploy) && !/workflow_run/.test(deploy) && /environment:\s*\n\s*name:\s*production/.test(deploy), detail: 'ordinary CI cannot trigger production' }),
    freeze({ id: 'production-no-rebuild', pass: classicProductionPromotion || storageFreeSameRunPromotion, detail: 'production promotes one exact verified candidate with no rebuild after its Preview proof' }),
    freeze({ id: 'environment-proof', pass: classicEnvironmentProof || storageFreeEnvironmentProof, detail: 'GitHub production protection is queried and recorded' }),
    freeze({ id: 'rollback-record', pass: classicRollbackRecord || storageFreeRollbackRecord, detail: 'previous production deployment identity and executable rollback are mandatory' }),
    freeze({ id: 'commands', pass: packageJson.scripts?.['qa:w641-release-governance']?.includes('w641-release-governance-gate.mjs') && packageJson.scripts?.['release:candidate']?.includes('w641-build-release-candidate.mjs') && packageJson.scripts?.['release:candidate:verify']?.includes('w641-verify-release-candidate.mjs'), detail: 'W641 commands registered' }),
    freeze({ id: 'honest-state', pass: W641_RELEASE_GOVERNANCE_CONTRACT.ordinaryCiCanDeployProduction === false, detail: 'source gate cannot authorize or certify production' })
  ]);
  return freeze({
    schema: 'eonapp.gate.release-governance-lock.w641.v1',
    wave: 'W641',
    ok: checks.every((row) => row.pass),
    total: checks.length,
    passed: checks.filter((row) => row.pass).length,
    checks,
    productionAuthorized: false,
    launchCandidatePromoted: false
  });
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const result = inspectW641ReleaseGovernance();
  for (const check of result.checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.id} — ${check.detail}`);
  console.log(`\nW641 release governance source gate: ${result.passed}/${result.total}; production authorization NOT-RUN`);
  if (!result.ok) process.exitCode = 1;
}
