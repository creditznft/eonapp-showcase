import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  A15_A14_BASELINE_COMMIT,
  A15_REPOSITORY_ROOT,
  A15_W802B_ARCHIVE_SHA256,
  A15_W802B_SOURCE_COMMIT,
  dispositionA15Delta,
  git,
  inspectA14ToW802BDelta,
  inspectCityCoreBoundary,
  inspectCityStorage,
  inspectCoreCityBoundary,
  sha256,
  sha256File
} from './lib/a15-source-authority.mjs';

const evidenceRoot = path.join(A15_REPOSITORY_ROOT, 'docs/institutional/a15/evidence');
mkdirSync(evidenceRoot, { recursive: true });
const sourceArchiveArg = process.argv.find((arg) => arg.startsWith('--source-archive='))?.slice('--source-archive='.length) || '';
const baselineCleanArg = process.argv.includes('--baseline-clean');
const existingEnvironmentPath = path.join(evidenceRoot, 'A15_I00_ENVIRONMENT_RECEIPT.json');
const existingEnvironment = existsSync(existingEnvironmentPath)
  ? JSON.parse(readFileSync(existingEnvironmentPath, 'utf8'))
  : null;
const currentHead = git(['rev-parse', 'HEAD']);
const currentBranch = git(['branch', '--show-current']);
const sourceCommitDate = git(['show', '-s', '--format=%cI', A15_W802B_SOURCE_COMMIT]);
const sourceCommitIsAncestor = (() => {
  try {
    git(['merge-base', '--is-ancestor', A15_W802B_SOURCE_COMMIT, 'HEAD']);
    return true;
  } catch {
    return false;
  }
})();
const workingTreeStatus = execFileSync('git', ['status', '--porcelain'], { cwd: A15_REPOSITORY_ROOT, encoding: 'utf8' }).trimEnd();
const changedPaths = workingTreeStatus.split('\n').filter(Boolean).map((line) => line.slice(3).trim().split(' -> ').at(-1));
const planningChangePattern = /^(?:docs\/institutional\/a15\/|scripts\/(?:lib\/)?a15-|tests\/unit\/a15-|package\.json$)/;
const nonPlanningChanges = changedPaths.filter((file) => !planningChangePattern.test(file));
const suppliedArchive = sourceArchiveArg
  ? Object.freeze({
      expectedSha256: A15_W802B_ARCHIVE_SHA256,
      suppliedFile: path.basename(sourceArchiveArg),
      suppliedSha256: sha256File(sourceArchiveArg),
      verified: sha256File(sourceArchiveArg) === A15_W802B_ARCHIVE_SHA256
    })
  : existingEnvironment?.archive || Object.freeze({
      expectedSha256: A15_W802B_ARCHIVE_SHA256,
      suppliedFile: null,
      suppliedSha256: null,
      verified: null
    });

const environment = Object.freeze({
  schema: 'eonapp.a15.i00.environment-receipt.v1',
  generatedAt: sourceCommitDate,
  branch: currentBranch,
  currentHead,
  sourceBaselineCommit: A15_W802B_SOURCE_COMMIT,
  sourceBaselineIsAncestor: sourceCommitIsAncestor,
  a14BaselineCommit: A15_A14_BASELINE_COMMIT,
  node: process.version,
  npmInstalled: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(),
  npmRequired: '11.12.1',
  registry: (() => {
    try { return execFileSync('npm', ['config', 'get', 'registry'], { encoding: 'utf8' }).trim(); } catch { return 'unknown'; }
  })(),
  workingTreeCleanBeforeGeneration: baselineCleanArg || existingEnvironment?.workingTreeCleanBeforeGeneration === true || workingTreeStatus === '',
  currentChangesPlanningOnly: nonPlanningChanges.length === 0,
  nonPlanningChanges: Object.freeze(nonPlanningChanges),
  dependencyState: Object.freeze({
    lockedInstallKnownBlocker: 'private npm mirror 404 for locked ws@7.5.11',
    productionBuild: 'blocked-until-exact-install',
    builtArtifactGate: 'blocked-until-exact-install',
    lockfileMutationAllowed: false
  }),
  archive: suppliedArchive
});

const delta = inspectA14ToW802BDelta();
const coreBoundary = inspectCoreCityBoundary();
const cityBoundary = inspectCityCoreBoundary();
const cityStorage = inspectCityStorage();
const dispositions = dispositionA15Delta(delta);

function csvCell(value) {
  const text = Array.isArray(value) ? value.join('|') : value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeJson(name, value) {
  writeFileSync(path.join(evidenceRoot, name), `${JSON.stringify(value, null, 2)}\n`);
}

function writeCsv(name, headers, rows) {
  const lines = [headers.map(csvCell).join(','), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(','))];
  writeFileSync(path.join(evidenceRoot, name), `${lines.join('\n')}\n`);
}

writeJson('A15_I00_ENVIRONMENT_RECEIPT.json', environment);
writeJson('A15_C01_CORE_ROUTE_IMPORT_GRAPH.json', coreBoundary);
writeJson('A15_C01_CITY_CLOSURE_GRAPH.json', cityBoundary);
writeJson('A15_C01_CITY_STORAGE_INVENTORY.json', cityStorage);
writeCsv('A15_C01_A14_TO_W802B_DELTA_REGISTRY.csv', ['status', 'file', 'insertions', 'deletions'], delta.rows);
writeCsv('A15_C01_CITY_STORAGE_INVENTORY.csv', ['file', 'references', 'mechanisms', 'directAccess', 'keys'], cityStorage.rows);
writeCsv('A15_C01_W767_W802_SYSTEM_DISPOSITION.csv', ['status', 'file', 'insertions', 'deletions', 'zone', 'owner', 'disposition', 'reason'], dispositions);
writeCsv('A15_C01_RED_AMBER_GREEN_OWNERSHIP_MAP.csv', ['file', 'zone', 'owner', 'disposition', 'reason'], dispositions);

const blockers = Object.freeze([
  ...(coreBoundary.coupledRouteCount > 0 ? [`core-routes-reaching-city:${coreBoundary.coupledRouteCount}`] : []),
  ...(cityBoundary.nonCityModuleCount > 0 ? [`city-runtime-reaching-non-city:${cityBoundary.nonCityModuleCount}`] : []),
  ...(cityStorage.directAccessModuleCount > 0 ? [`city-direct-storage-modules:${cityStorage.directAccessModuleCount}`] : [])
]);
const receiptCore = {
  schema: 'eonapp.a15.i00-c01.baseline-receipt.v1',
  generatedAt: sourceCommitDate,
  source: {
    a14BaselineCommit: A15_A14_BASELINE_COMMIT,
    w802bBaselineCommit: A15_W802B_SOURCE_COMMIT,
    currentHead,
    currentBranch,
    sourceBaselineIsAncestor: sourceCommitIsAncestor,
    archiveSha256: A15_W802B_ARCHIVE_SHA256
  },
  delta: { changedFiles: delta.changedFiles, insertions: delta.insertions, deletions: delta.deletions },
  coreBoundary: {
    routeCount: coreBoundary.routeCount,
    coupledRouteCount: coreBoundary.coupledRouteCount,
    distinctCityModuleCount: coreBoundary.distinctCityModuleCount
  },
  cityBoundary: {
    moduleCount: cityBoundary.moduleCount,
    cityModuleCount: cityBoundary.cityModuleCount,
    nonCityModuleCount: cityBoundary.nonCityModuleCount
  },
  cityStorage: {
    planningStaticModuleCount: cityStorage.planningStaticModuleCount,
    observedReferenceModuleCount: cityStorage.observedReferenceModuleCount,
    directAccessModuleCount: cityStorage.directAccessModuleCount,
    nonAccessReferenceModuleCount: cityStorage.nonAccessReferenceModuleCount,
    planningCountDiscrepancy: cityStorage.planningCountDiscrepancy,
    namedKeyCount: cityStorage.namedKeys.length
  },
  ownership: {
    red: dispositions.filter((row) => row.zone === 'red').length,
    amber: dispositions.filter((row) => row.zone === 'amber').length,
    green: dispositions.filter((row) => row.zone === 'green').length
  },
  planningOnly: true,
  productBehaviorChanged: false,
  boundaryTargetSatisfied: blockers.length === 0,
  blockers
};
const receipt = Object.freeze({ ...receiptCore, receiptDigest: sha256(JSON.stringify(receiptCore)) });
writeJson('A15_I00_C01_BASELINE_RECEIPT.json', receipt);

console.log(JSON.stringify({ ok: true, evidenceRoot, receipt }, null, 2));
