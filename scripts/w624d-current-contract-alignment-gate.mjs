#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W624D_ARCHIVED_CONTRACT_ASSERTIONS,
  W624D_REQUIRED_CURRENT_TESTS,
  W624D_REQUIRED_BUILD_DEPENDENT_TESTS,
  W624D_REQUIRED_PREDEPLOY_SCRIPTS
} from '../config/w624d-current-contract-alignment-contract.mjs';
import { CURRENT_UNIT_TESTS } from './run-current-unit-suite.mjs';
import { EONAPP_COMPACT_PRIMARY_NAVIGATION } from '../assets/js/shell/eon-shell-navigation.js';
import { getRouteRow } from '../config/route-contract.mjs';
import { validateW621LiveDodoRolloutContract } from '../config/w621-live-dodo-cloudflare-rollout-contract.mjs';
import { validateW624bCityRuntimeContract } from '../config/w624b-city-runtime-consolidation-contract.mjs';
import { validateW624cCommandDistrictContract } from '../config/w624c-command-district-vertical-slice-contract.mjs';
import { validateW624dWayfinderCameraContract } from '../config/w624d-wayfinder-camera-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const normalize = (value) => String(value).replace(/\\/g, '/');

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function discoverArchivedAssertions() {
  const unitDirectory = path.join(root, 'tests/unit');
  const discovered = [];
  for (const name of fs.readdirSync(unitDirectory).filter((entry) => entry.endsWith('.mjs')).sort()) {
    const relative = `tests/unit/${name}`;
    const source = read(relative);
    const marker = '// W624D archived contract snapshot: superseded by current canonical alignment coverage.';
    let cursor = 0;
    while ((cursor = source.indexOf(marker, cursor)) !== -1) {
      const tail = source.slice(cursor + marker.length, cursor + marker.length + 900);
      const match = tail.match(/\s*test\.skip\((['"])(.*?)\1/);
      if (match) discovered.push(Object.freeze({ file: relative, name: match[2] }));
      cursor += marker.length;
    }
  }
  return discovered;
}

export function inspectW624dCurrentContractAlignment() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const discovered = discoverArchivedAssertions();
  const expectedKeys = new Set(W624D_ARCHIVED_CONTRACT_ASSERTIONS.map((entry) => `${normalize(entry.file)}\u0000${entry.name}`));
  const discoveredKeys = new Set(discovered.map((entry) => `${normalize(entry.file)}\u0000${entry.name}`));
  const packageJson = JSON.parse(read('package.json'));
  const currentTestSet = new Set(CURRENT_UNIT_TESTS.map(normalize));
  const archivedFiles = new Set(W624D_ARCHIVED_CONTRACT_ASSERTIONS.map((entry) => normalize(entry.file)));
  const missingExpected = [...expectedKeys].filter((key) => !discoveredKeys.has(key));
  const unlistedDiscovered = [...discoveredKeys].filter((key) => !expectedKeys.has(key));

  add('exact-archived-count', W624D_ARCHIVED_CONTRACT_ASSERTIONS.length === 47 && discovered.length === 47, `${discovered.length}/47 exact superseded assertions discovered`);
  add('manifest-matches-source', missingExpected.length === 0 && unlistedDiscovered.length === 0, `${missingExpected.length} missing; ${unlistedDiscovered.length} unlisted`);
  add('archive-entries-have-replacements', W624D_ARCHIVED_CONTRACT_ASSERTIONS.every((entry) => entry.replacements.length > 0 && entry.replacements.every((replacement) => fs.existsSync(path.join(root, replacement)))), 'every superseded assertion points to an existing maintained replacement');
  add('required-current-tests-exist', W624D_REQUIRED_CURRENT_TESTS.every((relative) => fs.existsSync(path.join(root, relative))), `${W624D_REQUIRED_CURRENT_TESTS.length} required current test files exist`);
  add('required-current-tests-run', W624D_REQUIRED_CURRENT_TESTS.every((relative) => currentTestSet.has(normalize(relative))), `${W624D_REQUIRED_CURRENT_TESTS.length} current replacement tests are in test:unit`);
  add('build-dependent-tests-exist', W624D_REQUIRED_BUILD_DEPENDENT_TESTS.every((relative) => fs.existsSync(path.join(root, relative))), `${W624D_REQUIRED_BUILD_DEPENDENT_TESTS.length} build-dependent certification test exists`);
  add('build-dependent-tests-not-in-unit', W624D_REQUIRED_BUILD_DEPENDENT_TESTS.every((relative) => !currentTestSet.has(normalize(relative))), 'build-dependent certification does not make a clean source-only unit run depend on dist');
  add('replacement-tests-not-archived', W624D_REQUIRED_CURRENT_TESTS.every((relative) => !archivedFiles.has(normalize(relative))), 'no replacement test file is classified as an archived snapshot');
  add('predeploy-scripts-present', W624D_REQUIRED_PREDEPLOY_SCRIPTS.every((name) => typeof packageJson.scripts?.[name] === 'string' && packageJson.scripts[name].trim()), `${W624D_REQUIRED_PREDEPLOY_SCRIPTS.length} required package scripts present`);
  const predeployRunner = read('scripts/run-w624d-codex-predeploy.mjs');
  add('codex-predeploy-is-current', /run-w624d-codex-predeploy\.mjs/.test(packageJson.scripts?.['verify:w624d-codex-predeploy'] || '') && /test:unit/.test(predeployRunner) && /qa:w624d-wayfinder-camera/.test(predeployRunner) && /qa:w624d-current-contract-alignment/.test(predeployRunner) && /qa:w624d-test-archive/.test(predeployRunner) && /qa:w625a-real-local-image-tooling/.test(predeployRunner) && /qa:w625h-local-creator-certification/.test(predeployRunner) && /qa:w626a-direct-job-threat-model/.test(predeployRunner) && /qa:w626h-byok-privacy-certification/.test(predeployRunner) && /qa:w629h-referral-red-team-certification/.test(predeployRunner) && /qa:w630-whole-app-ux/.test(predeployRunner) && /qa:w631-project-workspace-forge-automation/.test(predeployRunner) && /qa:w632-account-vault-custody/.test(predeployRunner) && /qa:w633-every-route-audit/.test(predeployRunner) && /qa:w634-responsive-accessibility-input/.test(predeployRunner) && /qa:w635-performance-cache-update-safety/.test(predeployRunner) && /qa:w636-security-privacy-abuse/.test(predeployRunner) && /qa:w637-persistence-migration-recovery/.test(predeployRunner) && /qa:w638-evidence-convergence/.test(predeployRunner) && /qa:w639-production-rehearsal-freeze/.test(predeployRunner) && /script: 'build'[\s\S]*script: 'smoke:build'[\s\S]*script: 'qa:w635-build-performance'[\s\S]*script: 'qa:w639-build-rehearsal'[\s\S]*script: 'qa:w623f-certification-v2'/.test(predeployRunner), 'lock-protected Codex predeploy runs source-only units, W636-W639 security, recovery, evidence and rehearsal gates, then builds, audits W635 budgets, runs the W639 build rehearsal and executes build-dependent W623F certification');
  add('codex-predeploy-resumes-safely', /checkpointPath/.test(predeployRunner) && /computeSourceFingerprint/.test(predeployRunner) && /readCheckpoint\(fingerprint\)/.test(predeployRunner) && /sourceFingerprint/.test(predeployRunner) && /RESUME/.test(predeployRunner), 'interrupted Codex runs resume only when the certifying source fingerprint is unchanged');
  add('create-first-navigation', EONAPP_COMPACT_PRIMARY_NAVIGATION.map((entry) => entry.id).join(',') === 'chat,create,projects,library,eoncity' && getRouteRow('/create')?.status === 200 && getRouteRow('/studio')?.to === '/create', 'Create-first navigation and compatibility aliases match W623E');
  add('live-dodo-contract', validateW621LiveDodoRolloutContract().ok, 'live Dodo checkout/webhook contract remains current');
  add('single-city-runtime', validateW624bCityRuntimeContract().ok && validateW624cCommandDistrictContract().ok && validateW624dWayfinderCameraContract().ok, 'W624B-D City contracts remain compatible');
  add('historical-diagnostic-non-certifying', /NOT CERTIFIED/.test(read('scripts/run-archived-legacy-diagnostic.mjs')) && /informational only/.test(read('scripts/run-archived-legacy-diagnostic.mjs')), 'archive diagnostic cannot be mistaken for release certification');
  add('alignment-document-present', fs.existsSync(path.join(root, 'EONAPP_W624D_CURRENT_TEST_CONTRACT_ALIGNMENT_2026-07-11.md')), 'Codex-facing alignment report exists');
  add('no-unmarked-new-skips-in-aligned-files', [...archivedFiles].every((relative) => {
    const source = read(relative);
    const expectedInFile = W624D_ARCHIVED_CONTRACT_ASSERTIONS.filter((entry) => normalize(entry.file) === relative).length;
    const totalSkips = source.match(/test\.skip\(/g)?.length || 0;
    const totalMarkers = source.match(/W624D archived contract snapshot/g)?.length || 0;
    return totalSkips === expectedInFile && totalMarkers === expectedInFile;
  }), 'each aligned file has one explicit marker for every archived skip and no additional skips');

  return Object.freeze({
    schema: 'eonapp.w624d-current-contract-alignment-report.2026-07-11.v1',
    ok: checks.every((entry) => entry.pass),
    passed: checks.filter((entry) => entry.pass).length,
    total: checks.length,
    archivedAssertions: discovered.length,
    currentReplacementTests: W624D_REQUIRED_CURRENT_TESTS.length,
    buildDependentTests: W624D_REQUIRED_BUILD_DEPENDENT_TESTS.length,
    checks: Object.freeze(checks)
  });
}

const report = inspectW624dCurrentContractAlignment();
for (const check of report.checks) console.log(`[W624D-ALIGN] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W624D-ALIGN] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}; ${report.archivedAssertions} exact historical assertions; ${report.currentReplacementTests} maintained replacement tests.`);
if (!report.ok) process.exitCode = 1;
