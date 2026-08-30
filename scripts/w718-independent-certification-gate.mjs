#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W718_BABYLON_REQUIRED_TESTS,
  W718_QUANTITATIVE_GATES,
  W718_REQUIRED_JOURNEYS,
  W718_SCORE_PILLARS,
  evaluateW718OwnerScorecard,
  getW718IndependentCertificationTruth
} from '../config/w718-independent-certification-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const json = (relative) => JSON.parse(read(relative));
const exists = (relative) => fs.existsSync(path.join(root, relative));
const packageJson = json('package.json');
const lock = json('package-lock.json');
const manifest = json('config/w624d-current-unit-test-manifest.json');
const supersededLaunchArchive = json('config/archive/w721-superseded-launch-tests.json');
const scorecard = json('config/w718-owner-scorecard.json');
const dependencyAttempt = json('config/w718-dependency-install-attempt.json');
const score = evaluateW718OwnerScorecard(scorecard);
const truth = getW718IndependentCertificationTruth();
const requiredDocs = [
  'docs/institutional/EONAPP_W701_W719_INSTITUTIONAL_GRADE_COMPLETION_MASTER_PLAN_2026-07-25.md',
  'docs/institutional/EONAPP_W700_OWNER_VIDEO_LIVE_RED_TEAM_AUDIT_2026-07-25.md',
  'docs/institutional/W718_INDEPENDENT_CERTIFICATION_AND_OWNER_ACCEPTANCE_RUNBOOK_2026-07-25.md'
];
const exactScript = String(packageJson.scripts?.['verify:w718-exact-certification'] || '');
const fastScript = String(packageJson.scripts?.['verify:w718-fast-suite'] || '');
const checks = [
  ['score-model', W718_SCORE_PILLARS.length === 12 && W718_SCORE_PILLARS.reduce((sum, row) => sum + row.weight, 0) === 100 && W718_QUANTITATIVE_GATES.length === 14],
  ['journey-matrix', W718_REQUIRED_JOURNEYS.length === 9 && new Set(W718_REQUIRED_JOURNEYS).size === 9],
  ['exact-babylon-lane', W718_BABYLON_REQUIRED_TESTS.length === 24 && W718_BABYLON_REQUIRED_TESTS.every((relative) => exists(relative)) && W718_BABYLON_REQUIRED_TESTS.filter((relative) => /@babylonjs\/core/.test(read(relative))).length >= 16],
  ['babylon-closure-partitioned', W718_BABYLON_REQUIRED_TESTS.filter((relative) => manifest.testFiles.includes(relative)).length === 13 && W718_BABYLON_REQUIRED_TESTS.filter((relative) => supersededLaunchArchive.testFiles.includes(relative)).length === 11 && W718_BABYLON_REQUIRED_TESTS.every((relative) => Number(manifest.testFiles.includes(relative)) + Number(supersededLaunchArchive.testFiles.includes(relative)) === 1) && manifest.certifying === true && supersededLaunchArchive.certifying === false && Number(manifest.wave.slice(1)) >= 721],
  ['exact-lockfile', lock.lockfileVersion >= 3 && packageJson.dependencies?.['@babylonjs/core'] === '9.7.0' && packageJson.dependencies?.['@babylonjs/loaders'] === '9.7.0'],
  ['bounded-infrastructure-receipt', dependencyAttempt.exactLockfile === true && dependencyAttempt.outcome === 'infrastructure-blocked' && dependencyAttempt.errorCode === 'E503' && dependencyAttempt.sourceFailure === false && dependencyAttempt.alternateVersionUsed === false && dependencyAttempt.babylonShimUsed === false],
  ['pending-scorecard-honest', score.ok === false && score.weightedScore === null && scorecard.ownerApproved === false],
  ['source-and-exact-commands', fastScript.includes('w718-run-fast-maintained-suite.mjs') && exactScript.includes('w718-run-exact-certification.mjs')],
  ['evidence-docs', requiredDocs.every(exists) && fs.readdirSync(path.join(root, 'evidence/owner-video-w700')).filter((name) => name.endsWith('.jpg')).length >= 3],
  ['truth-fence', truth.sourceReadinessCanRunWithoutDependencies && truth.exactCertificationRequiresDependencies && truth.exactBabylonTestCount === 24 && !truth.sourceReadinessIsCertification && !truth.automaticScoreAwarded && !truth.automaticDeployment]
];
for (const [id, pass] of checks) console.log(`[W718] ${pass ? 'PASS' : 'FAIL'} ${id}`);
console.log(`[W718] INFO ${manifest.testFileCount} maintained files; ${W718_BABYLON_REQUIRED_TESTS.length} exact dependency files; owner score pending`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W718] ${ok ? 'PASS' : 'FAIL'} SOURCE READINESS ${checks.filter(([, pass]) => pass).length}/${checks.length}; independent certification NOT AWARDED`);
if (!ok) process.exitCode = 1;
