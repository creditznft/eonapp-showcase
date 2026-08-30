#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W646_PERMANENT_STAGE_COUNT,
  W646_WORKFLOW_CHAIN,
  validateW646FinalFreezeDeploymentContract
} from '../config/w646-final-freeze-deployment-contract.mjs';
import { W624D_CODEX_PREDEPLOY_STEPS } from './run-w624d-codex-predeploy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const count = (text, pattern) => (text.match(pattern) || []).length;
const includesAny = (text, markers) => markers.some((marker) => text.includes(marker));

const board = JSON.parse(read('config/w646-final-freeze-deployment-board.json'));
const pkg = JSON.parse(read('package.json'));
const workflows = Object.fromEntries(
  W646_WORKFLOW_CHAIN.map((name) => [name, read(`.github/workflows/${name}`)])
);
// Git checks out this repository on Windows as CRLF in some supported release
// environments. The workflow policy is line-ending agnostic, so normalize only
// its textual representation before enforcing the production safeguards.
const production = workflows['deploy.yml'].replace(/\r\n/g, '\n');
const ci = workflows['ci.yml'];
const candidateBuilder = read('scripts/w641-build-release-candidate.mjs');
const finalSteps = [
  'qa:w641-release-governance',
  'qa:w642-product-truth-retention',
  'qa:w643-creator-device-closure',
  'qa:w644-city-owner-certification',
  'qa:w645-production-evidence',
  'qa:w646-final-freeze-deployment'
];

const legacyArtifactPromotion =
  production.includes('without rebuilding') &&
  production.includes('w641-verify-release-candidate.mjs') &&
  production.includes('w641-validate-production-promotion.mjs') &&
  production.includes('working-directory: source') &&
  !production.includes('npm run build');

const protectedSameRunPromotion =
  production.includes('environment:\n      name: production') &&
  production.includes('Run permanent predeploy certification') &&
  count(production, /npm run release:candidate -- --commit/g) === 1 &&
  production.includes('npm run release:candidate:verify') &&
  production.includes('w641-verify-release-candidate.mjs') &&
  production.includes('w660l-stage-pages-deploy-root.mjs') &&
  includesAny(production, [
    'Deploy same-run candidate to production gate Preview',
    'Deploy identical staged bytes to production gate Preview'
  ]) &&
  includesAny(production, [
    'Promote exact same candidate bytes to production',
    'Promote identical staged bytes to production'
  ]) &&
  count(production, /DEPLOY_ROOT:\s*\$\{\{\s*steps\.stage\.outputs\.root\s*\}\}/g) >= 2 &&
  production.includes('--branch=main') &&
  production.includes('Roll back production after any failed post-deploy proof') &&
  production.includes('deployments/$ROLLBACK_ID/rollback') &&
  !/actions\/(?:upload|download)-artifact|gh run download/.test(production) &&
  !production.includes('npm run build');

const legacyApiParity =
  production.includes('production-api-surface-receipt.json') &&
  ['/api/auth/session', '/api/city/access', '/api/billing/status', '/api/referrals']
    .every((route) => production.includes(route));

const semanticSameRunApiParity =
  includesAny(production, [
    'Verify production gate Pages Functions API parity',
    'Verify gate Pages Functions API parity'
  ]) &&
  includesAny(production, [
    'Verify live production Pages Functions API parity',
    'Verify production Pages Functions API parity'
  ]) &&
  [
    '/api/auth/session',
    'eonapp.identity-only.v1',
    '/api/city/access',
    'eon.city.access.w649b.v1',
    '/api/billing/status',
    'eonapp.billing.dodo-lifecycle.w628.v1',
    '/api/referrals',
    'eonapp.referrals.scalable-minimal-ledger.w623i.v2',
    'response.status !== 200',
    'body?.schema !== schema'
  ].every((marker) => production.includes(marker));

const legacyLiveIdentity =
  production.includes('/release/candidate-provenance.json') &&
  production.includes('production-deployment-receipt.w646.v1');

const protectedSameRunLiveIdentity =
  production.includes('/release/candidate-provenance.json') &&
  production.includes('.candidateDigest') &&
  production.includes('.commitSha') &&
  production.includes('.distPayloadDigest') &&
  includesAny(production, [
    'eonapp.a15.stage4.production-deployment.v1',
    'eonapp.a15.stage4.production-deployment.v2'
  ]) &&
  production.includes('rollbackDeploymentId') &&
  production.includes('https://eonapp.ch');

const checks = [
  ['contract', validateW646FinalFreezeDeploymentContract().ok],
  ['files', [
    'config/w646-final-freeze-deployment-contract.mjs',
    'config/w646-final-freeze-deployment-board.json',
    'scripts/lib/w646-final-certification.mjs',
    'scripts/w646-validate-post-deploy-certification.mjs',
    'tests/unit/w646-final-freeze-deployment.test.mjs',
    'docs/EONAPP_W646_FINAL_DEPLOYMENT_AND_EVIDENCE_RUNBOOK_2026-07-11.md',
    'docs/EONAPP_W646_TEST_AND_SCREENSHOT_MATRIX_2026-07-11.md'
  ].every(exists)],
  ['honest-board',
    board.publicDecision === 'no-go' &&
    board.productionDeployed === false &&
    board.liveProductionCertified === false],
  ['permanent-minimum-82',
    W624D_CODEX_PREDEPLOY_STEPS.length >= W646_PERMANENT_STAGE_COUNT &&
    finalSteps.every((id) => W624D_CODEX_PREDEPLOY_STEPS.some((row) => row.script === id))],
  ['candidate-requires-82', candidateBuilder.includes('predeploy.stepCount < 82')],
  ['workflow-chain',
    W646_WORKFLOW_CHAIN.every((name) => exists(`.github/workflows/${name}`)) &&
    workflows['production-evidence.yml'].includes('evidence_ref') &&
    workflows['authorize-production.yml'].includes('environment-protection.json')],
  ['no-ci-production',
    !ci.includes('pages deploy') &&
    !ci.includes('environment:\n      name: production')],
  ['exact-production-promotion', legacyArtifactPromotion || protectedSameRunPromotion],
  ['functions-parity-verification', legacyApiParity || semanticSameRunApiParity],
  ['live-identity-verification', legacyLiveIdentity || protectedSameRunLiveIdentity],
  ['postdeploy-validator',
    pkg.scripts?.['release:w646-postdeploy-verify']?.includes('w646-validate-post-deploy-certification.mjs')],
  ['source-command',
    pkg.scripts?.['qa:w646-final-freeze-deployment']?.includes('w646-final-freeze-deployment-gate.mjs')]
];

for (const [id, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${id}`);
const ok = checks.every(([, pass]) => pass);
console.log(
  `\nW646 final freeze/deployment source gate: ${checks.filter(([, pass]) => pass).length}/${checks.length}; ` +
  'production deployment NOT-RUN; public decision NO-GO'
);
if (!ok) process.exitCode = 1;
