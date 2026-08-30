#!/usr/bin/env node
/** W639 whole-app production rehearsal and launch-candidate freeze source/build gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W639_PRODUCTION_REHEARSAL_FREEZE_CONTRACT,
  validateW639ProductionRehearsalFreezeContract
} from '../config/w639-production-rehearsal-freeze-contract.mjs';
import { buildW638EvidenceIndex, loadW638EvidenceBoard } from './lib/w638-evidence-index.mjs';
import {
  createW639ReleaseFreezeManifest,
  deriveW639RehearsalBoard,
  inspectW639Build
} from './lib/w639-release-freeze.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const freeze = (value) => Object.freeze(value);
const exists = (relative) => fs.existsSync(path.join(root, relative));
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));

function sourceChecks({ manifest, evidenceIndex, rehearsal }) {
  const contract = validateW639ProductionRehearsalFreezeContract();
  const packageJson = readJson('package.json');
  const migrationFiles = manifest.categories.find((category) => category.id === 'persistence')?.files.filter((file) => file.path.endsWith('.sql')) || [];
  const files = [
    'config/w639-production-rehearsal-freeze-contract.mjs',
    'config/w639-production-rehearsal-board.json',
    'scripts/lib/w639-release-freeze.mjs',
    'scripts/w639-production-rehearsal-freeze-gate.mjs',
    'tests/unit/w639-production-rehearsal-freeze.test.mjs'
  ];
  return freeze([
    freeze({ id: 'contract', pass: contract.ok, detail: `${W639_PRODUCTION_REHEARSAL_FREEZE_CONTRACT.rehearsalDomains.length} rehearsal domains` }),
    freeze({ id: 'files', pass: files.every(exists), detail: 'contract, input board, manifest library, gate and maintained tests' }),
    freeze({ id: 'freeze-manifest', pass: manifest.ok && manifest.categoryCount === 10 && manifest.fileCount >= 55 && /^[a-f0-9]{64}$/.test(manifest.freezeDigest), detail: `${manifest.fileCount} frozen files / ${manifest.categoryCount} categories` }),
    freeze({ id: 'migration-registry', pass: migrationFiles.length >= 10 && migrationFiles.every((file) => file.exists), detail: `${migrationFiles.length} migration files fingerprinted` }),
    freeze({ id: 'w638-link', pass: evidenceIndex.sourceGateOk && evidenceIndex.productionCertified === false && rehearsal.evidenceIndexDigest === evidenceIndex.indexDigest, detail: `W638 ${evidenceIndex.productionVerdict}` }),
    freeze({ id: 'truthful-rehearsal', pass: rehearsal.sourceGateOk && rehearsal.productionRehearsalPassed === false && rehearsal.launchCandidateFrozen === false && rehearsal.productionVerdict === 'not-run', detail: `production ${rehearsal.productionVerdict}` }),
    freeze({ id: 'local-build-boundary', pass: rehearsal.boundaries?.localBuildCanCertifyProduction === false && rehearsal.boundaries?.emptyEvidenceCanFreezeLaunchCandidate === false, detail: 'source/build cannot certify production' }),
    freeze({ id: 'incident-boundary', pass: W639_PRODUCTION_REHEARSAL_FREEZE_CONTRACT.incidentRules.customerActionsNeverAutomatedByRehearsal === true && W639_PRODUCTION_REHEARSAL_FREEZE_CONTRACT.incidentRules.migrationRollbackMustNeverDeleteUserDataByDefault === true, detail: 'incident drills fail closed and preserve user data' }),
    freeze({ id: 'commands', pass: packageJson.scripts?.['qa:w639-production-rehearsal-freeze']?.includes('w639-production-rehearsal-freeze-gate.mjs') && packageJson.scripts?.['qa:w639-build-rehearsal']?.includes('--build') && packageJson.scripts?.['launch:evidence-audit'] === 'node scripts/launch-evidence-audit.mjs', detail: 'source, build and evidence commands registered' }),
    freeze({ id: 'release-no-go', pass: W639_PRODUCTION_REHEARSAL_FREEZE_CONTRACT.launchCandidateFrozen === false && W639_PRODUCTION_REHEARSAL_FREEZE_CONTRACT.externalEvidenceRequired.length === 5, detail: 'launch candidate remains unfrozen pending external proof' })
  ]);
}

export function inspectW639ProductionRehearsalFreeze({ buildMode = false, writeArtifact = false } = {}) {
  const manifest = createW639ReleaseFreezeManifest({ root });
  const evidenceIndex = buildW638EvidenceIndex(loadW638EvidenceBoard(root), { root });
  const input = readJson('config/w639-production-rehearsal-board.json');
  const build = buildMode ? inspectW639Build({ root }) : null;
  const rehearsal = deriveW639RehearsalBoard({ manifest, evidenceIndex, build, domainEvidence: input.domainEvidence || {} });
  const checks = [...sourceChecks({ manifest, evidenceIndex, rehearsal })];
  if (buildMode) checks.push(freeze({ id: 'production-build', pass: build?.ok === true, detail: build?.ok ? `${build.routeCount} critical HTML routes / ${build.buildDigest.slice(0, 12)}` : build?.reason || 'build contract failed' }));
  const result = freeze({
    schema: 'eonapp.gate.whole-app-production-rehearsal-freeze.w639.2026-07-11.v1',
    wave: 'W639',
    mode: buildMode ? 'build' : 'source',
    ok: checks.every((row) => row.pass),
    total: checks.length,
    passed: checks.filter((row) => row.pass).length,
    checks: freeze(checks),
    freezeManifest: manifest,
    build,
    rehearsal,
    productionCertified: false,
    launchCandidateFrozen: false,
    limitations: W639_PRODUCTION_REHEARSAL_FREEZE_CONTRACT.externalEvidenceRequired
  });
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts/w639-production-rehearsal-freeze');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'freeze-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    fs.writeFileSync(path.join(directory, 'rehearsal-board.json'), `${JSON.stringify(rehearsal, null, 2)}\n`);
    fs.writeFileSync(path.join(directory, buildMode ? 'build-receipt.json' : 'source-receipt.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const buildMode = process.argv.includes('--build');
  const result = inspectW639ProductionRehearsalFreeze({ buildMode, writeArtifact: true });
  for (const check of result.checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.id} — ${check.detail}`);
  console.log(`\nW639 ${result.mode} rehearsal gate: ${result.passed}/${result.total}; production ${result.rehearsal.productionVerdict.toUpperCase()}; launch candidate NOT FROZEN`);
  if (!result.ok) process.exitCode = 1;
}
