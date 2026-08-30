#!/usr/bin/env node
/**
 * W517 source convergence runner.
 *
 * It owns deterministic generator execution, a source identity manifest,
 * source inventory, release-authority registry, and a clean-checkout drift
 * guard. Git is preferred when available, but the handover format is a
 * deliberately Git-free ZIP, so the same identity must be verifiable from a
 * portable source tree as well. It deliberately emits time-bearing receipts
 * only under tmp/.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildW451LegacySourceInventory } from './w451-legacy-source-inventory.mjs';
import { writeW517EphemeralJson } from './w517-evidence-output.mjs';
import {
  W517_ARTIFACT_ROOT,
  W517_GATE_REGISTRY_PATH,
  W517_GENERATED_OUTPUTS,
  W517_GENERATOR_COMMANDS,
  W517_RELEASE_AUTHORITY_REGISTRY,
  W517_REQUIRED_PUBLIC_MIRRORS,
  W517_SOURCE_CONVERGENCE_SCHEMA,
  W517_SOURCE_INVENTORY_PATH,
  W517_SOURCE_MANIFEST_PATH,
  isW517ManifestExcluded,
  validateW517SourceConvergenceContract
} from '../config/w517-source-convergence-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toPosix = (value) => String(value || '').replaceAll('\\', '/');
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const sha256File = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function run(command, args, { root = ROOT, stdio = 'inherit' } = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio, encoding: stdio === 'pipe' ? 'utf8' : undefined });
  if (result.status !== 0) {
    const detail = stdio === 'pipe' ? `\n${String(result.stderr || result.stdout || '').trim()}` : '';
    throw new Error(`W517 command failed: ${[command, ...args].join(' ')}${detail}`);
  }
  return result;
}

function isGitWorkTree(root = ROOT) {
  const result = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: root, stdio: 'pipe', encoding: 'utf8' });
  return result.status === 0 && String(result.stdout || '').trim() === 'true';
}

function walkPortableSourceFiles(directory, root = directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const relative = toPosix(path.relative(root, absolute));
    if (isW517ManifestExcluded(`${relative}${entry.isDirectory() ? '/' : ''}`)) continue;
    if (entry.isDirectory()) walkPortableSourceFiles(absolute, root, files);
    else if (entry.isFile()) files.push(relative);
  }
  return files;
}

/**
 * Return the canonical source file set for both a repository checkout and the
 * intentionally Git-free handover ZIP. The portable path uses the exact W517
 * exclusion policy; it never treats node_modules, build output, temporary
 * evidence, or W517 self-artifacts as source identity inputs.
 */
export function sourceIdentityFiles({ root = ROOT } = {}) {
  if (isGitWorkTree(root)) {
    const result = run('git', ['ls-files', '-z'], { root, stdio: 'pipe' });
    return result.stdout
      .split('\0')
      .filter(Boolean)
      .map((relative) => toPosix(relative))
      .filter((relative) => !isW517ManifestExcluded(relative))
      .sort();
  }
  return walkPortableSourceFiles(root, root)
    .filter((relative) => !isW517ManifestExcluded(relative))
    .sort();
}

export function gitTrackedFiles({ root = ROOT } = {}) {
  return sourceIdentityFiles({ root });
}

function writeIfChanged(root, relative, value) {
  const target = path.join(root, relative);
  const content = typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`;
  const prior = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  if (prior === content) return false;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return true;
}

export function buildW517SourceManifest({ root = ROOT, files = gitTrackedFiles({ root }) } = {}) {
  const records = [...files].map((relative) => toPosix(relative)).sort().map((relative) => {
    const absolute = path.join(root, relative);
    const stats = fs.statSync(absolute);
    if (!stats.isFile()) throw new Error(`W517 manifest tracked path is not a file: ${relative}`);
    return Object.freeze({ path: relative, bytes: stats.size, sha256: sha256File(absolute) });
  });
  const aggregateSha256 = sha256(records.map((entry) => `${entry.sha256}  ${entry.path}\n`).join(''));
  return Object.freeze({
    schema: `${W517_SOURCE_CONVERGENCE_SCHEMA}.manifest`,
    format: 'git-tracked-or-portable-source-files-after-w517-generators',
    sourceRoot: 'SOURCE/',
    fileCount: records.length,
    aggregateSha256,
    exclusions: ['git metadata', 'dependencies', 'dist', 'temporary evidence', 'W517 generated convergence artifacts'],
    files: records
  });
}

export function buildW517SourceInventory({ root = ROOT, trackedFiles = new Set(gitTrackedFiles({ root })) } = {}) {
  const legacy = buildW451LegacySourceInventory({ writeArtifact: false });
  const records = legacy.records.filter((entry) => trackedFiles.has(entry.file));
  const releaseEligibleClassifications = new Set(['active-runtime', 'active-route-document', 'compatibility-document', 'release-tooling']);
  const releaseScoreEligible = records
    .filter((entry) => releaseEligibleClassifications.has(entry.classification))
    .map((entry) => entry.file)
    .sort();
  const classifications = {};
  for (const record of records) classifications[record.classification] = (classifications[record.classification] || 0) + 1;
  return Object.freeze({
    schema: `${W517_SOURCE_CONVERGENCE_SCHEMA}.inventory`,
    sourceScope: 'Git-tracked files when Git is present, otherwise the portable W517 source set; temporary, build and W517 self-artifacts are excluded.',
    status: legacy.status,
    activeImportReachability: {
      activeModuleCount: legacy.activeModuleCount,
      historicalReachable: legacy.errors.filter((entry) => entry.includes('Historical material is reachable')),
      errors: legacy.errors
    },
    classifications,
    releaseScoreBoundary: {
      policy: 'Only active import-reachable code, current route documents and canonical release tooling may be release-authoritative. Historical, test-only and review-before-quarantine material is inventory context, not a release score pass.',
      eligibleClassifications: [...releaseEligibleClassifications].sort(),
      eligibleFileCount: releaseScoreEligible.length,
      eligibleFiles: releaseScoreEligible
    },
    reviewOnlyCandidates: legacy.candidatesForHumanReview.filter((file) => trackedFiles.has(file)),
    records
  });
}

export function buildW517GateRegistry({ root = ROOT } = {}) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const missingCommands = W517_RELEASE_AUTHORITY_REGISTRY
    .filter((entry) => entry.command.startsWith('npm run '))
    .map((entry) => entry.command.replace(/^npm run\s+/, '').trim().split(/\s+/)[0])
    .filter((name) => name && !Object.prototype.hasOwnProperty.call(packageJson.scripts || {}, name));
  if (missingCommands.length) throw new Error(`W517 registry references missing package scripts: ${missingCommands.join(', ')}.`);
  return Object.freeze({
    schema: `${W517_SOURCE_CONVERGENCE_SCHEMA}.gate-registry`,
    scope: 'Release authority. W522 owns the cross-gate risk matrix; this registry supplies the canonical lifecycle classifications.',
    authorityRule: 'Only active entries may contribute to the canonical source-release result. Superseded, archival and evidence-only entries cannot make that result green.',
    entries: W517_RELEASE_AUTHORITY_REGISTRY,
    unclassifiedHistoricalCommands: 'None. Every listed historical command has an explicit lifecycle classification; unlisted historical commands are non-authoritative by default.'
  });
}

function generateArtifacts({ root = ROOT } = {}) {
  const contractErrors = validateW517SourceConvergenceContract();
  if (contractErrors.length) throw new Error(`Invalid W517 contract:\n${contractErrors.map((entry) => `- ${entry}`).join('\n')}`);
  const generatedCommands = [];
  for (const entry of W517_GENERATOR_COMMANDS) {
    run(process.execPath, [entry.script], { root });
    generatedCommands.push(entry.id);
  }
  const trackedFiles = new Set(gitTrackedFiles({ root }));
  const inventory = buildW517SourceInventory({ root, trackedFiles });
  const registry = buildW517GateRegistry({ root });
  const inventoryChanged = writeIfChanged(root, W517_SOURCE_INVENTORY_PATH, inventory);
  const registryChanged = writeIfChanged(root, W517_GATE_REGISTRY_PATH, registry);
  const manifest = buildW517SourceManifest({ root });
  const manifestChanged = writeIfChanged(root, W517_SOURCE_MANIFEST_PATH, manifest);
  return Object.freeze({
    generatedCommands,
    artifactChanges: {
      inventory: inventoryChanged,
      gateRegistry: registryChanged,
      sourceManifest: manifestChanged
    },
    manifest,
    inventory,
    registry
  });
}

function gitStatus({ root = ROOT } = {}) {
  if (!isGitWorkTree(root)) return [];
  const result = run('git', ['status', '--porcelain=v1', '--untracked-files=all'], { root, stdio: 'pipe' });
  return String(result.stdout || '').split('\n').filter(Boolean);
}

function sourceIdentityMode(root = ROOT) {
  return isGitWorkTree(root) ? 'git' : 'portable-archive';
}

function sourceIdentityRevision(root = ROOT, manifest) {
  if (!isGitWorkTree(root)) return `portable:${manifest.aggregateSha256}`;
  return String(run('git', ['rev-parse', 'HEAD'], { root, stdio: 'pipe' }).stdout || '').trim();
}

function validatePublicMirrors({ root = ROOT } = {}) {
  const errors = [];
  for (const pair of W517_REQUIRED_PUBLIC_MIRRORS) {
    const source = path.join(root, pair.source);
    const mirror = path.join(root, pair.mirror);
    if (!fs.existsSync(source)) errors.push(`Missing generator source: ${pair.source}`);
    else if (!fs.existsSync(mirror)) errors.push(`Missing public mirror: ${pair.mirror}`);
    else if (sha256File(source) !== sha256File(mirror)) errors.push(`Public mirror mismatch: ${pair.source} != ${pair.mirror}`);
  }
  for (const relative of W517_GENERATED_OUTPUTS) {
    if (!fs.existsSync(path.join(root, relative))) errors.push(`Missing declared generated output: ${relative}`);
  }
  return errors;
}

function verifyManifest({ root = ROOT, manifest } = {}) {
  const current = buildW517SourceManifest({ root });
  const serialized = `${JSON.stringify(current, null, 2)}\n`;
  const stored = fs.readFileSync(path.join(root, W517_SOURCE_MANIFEST_PATH), 'utf8');
  const errors = [];
  if (stored !== serialized) errors.push('Stored W517 source manifest does not match current tracked source identity.');
  if (manifest && manifest.aggregateSha256 !== current.aggregateSha256) errors.push('Generated W517 source manifest aggregate hash drifted during verification.');
  return { manifest: current, errors };
}

export function verifyW517CleanCheckout({ root = ROOT } = {}) {
  const identityMode = sourceIdentityMode(root);
  const beforeManifest = buildW517SourceManifest({ root });
  const before = gitStatus({ root });
  if (before.length) throw new Error(`W517 clean-checkout guard requires no pre-existing source drift:\n${before.join('\n')}`);
  const generated = generateArtifacts({ root });
  const mirrorErrors = validatePublicMirrors({ root });
  const manifestCheck = verifyManifest({ root, manifest: generated.manifest });
  const after = gitStatus({ root });
  const errors = [...mirrorErrors, ...manifestCheck.errors];
  if (beforeManifest.aggregateSha256 !== manifestCheck.manifest.aggregateSha256) {
    errors.push('Generator drift detected: the portable/Git source identity changed after prescribed W517 generation.');
  }
  if (after.length) errors.push(`Generator drift detected after prescribed W517 generation:\n${after.join('\n')}`);
  const receipt = {
    schema: `${W517_SOURCE_CONVERGENCE_SCHEMA}.clean-checkout-receipt`,
    ok: errors.length === 0,
    recordedAt: new Date().toISOString(),
    node: process.version,
    npmUserAgent: process.env.npm_config_user_agent || null,
    sourceIdentityMode: identityMode,
    commit: sourceIdentityRevision(root, manifestCheck.manifest),
    generators: generated.generatedCommands,
    sourceManifest: {
      fileCount: manifestCheck.manifest.fileCount,
      aggregateSha256: manifestCheck.manifest.aggregateSha256
    },
    errors
  };
  const evidencePath = writeW517EphemeralJson('clean-checkout-receipt.json', receipt, { root });
  if (errors.length) throw new Error(`W517 clean-checkout verification failed:\n${errors.join('\n')}`);
  return { ...receipt, evidencePath };
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function isW517SourceConvergenceCli(argv1 = process.argv[1], importMetaUrl = import.meta.url) {
  return Boolean(argv1) && pathToFileURL(path.resolve(argv1)).href === importMetaUrl;
}

function main() {
  const mode = process.argv[2] || 'generate';
  if (mode === 'generate') {
    const result = generateArtifacts({ root: ROOT });
    print({ schema: W517_SOURCE_CONVERGENCE_SCHEMA, ok: true, mode, generatedCommands: result.generatedCommands, artifactChanges: result.artifactChanges, sourceManifest: { fileCount: result.manifest.fileCount, aggregateSha256: result.manifest.aggregateSha256 } });
    return;
  }
  if (mode === 'manifest') {
    const manifest = buildW517SourceManifest({ root: ROOT });
    const changed = writeIfChanged(ROOT, W517_SOURCE_MANIFEST_PATH, manifest);
    print({ schema: W517_SOURCE_CONVERGENCE_SCHEMA, ok: true, mode, changed, sourceManifest: { fileCount: manifest.fileCount, aggregateSha256: manifest.aggregateSha256 } });
    return;
  }
  if (mode === 'inventory') {
    const inventory = buildW517SourceInventory({ root: ROOT });
    const changed = writeIfChanged(ROOT, W517_SOURCE_INVENTORY_PATH, inventory);
    print({ schema: W517_SOURCE_CONVERGENCE_SCHEMA, ok: true, mode, changed, activeModuleCount: inventory.activeImportReachability.activeModuleCount, eligibleFileCount: inventory.releaseScoreBoundary.eligibleFileCount });
    return;
  }
  if (mode === 'gate-registry') {
    const registry = buildW517GateRegistry({ root: ROOT });
    const changed = writeIfChanged(ROOT, W517_GATE_REGISTRY_PATH, registry);
    print({ schema: W517_SOURCE_CONVERGENCE_SCHEMA, ok: true, mode, changed, entries: registry.entries.length });
    return;
  }
  if (mode === 'verify') {
    print(verifyW517CleanCheckout({ root: ROOT }));
    return;
  }
  throw new Error(`Unknown W517 source convergence mode: ${mode}`);
}

if (isW517SourceConvergenceCli()) {
  try {
    main();
  } catch (error) {
    console.error(error?.stack || error);
    process.exitCode = 1;
  }
}
