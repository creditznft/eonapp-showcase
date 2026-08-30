#!/usr/bin/env node
/**
 * W519 source gate — physical quarantine of legacy transport/control systems.
 *
 * This is a source gate only. It proves that current source and generated
 * output do not reach the preserved historical families; it does not prove a
 * deployment, device behavior, authorization, or launch approval.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import { CURRENT_UNIT_TESTS } from './run-current-unit-suite.mjs';
import {
  W519_ACTIVE_DENYLIST,
  W519_ACTIVE_ENTRYPOINTS,
  W519_APPROVED_WEBRTC_SOURCE_PATHS,
  W519_BUILD_DENYLIST,
  W519_LEGACY_TRANSPORT_QUARANTINE_SCHEMA,
  W519_QUARANTINE_ROOT,
  W519_QUARANTINED_SOURCE_PATHS,
  W519_RETIRED_PACKAGE_SCRIPTS,
  validateW519LegacyTransportQuarantineContract
} from '../config/w519-legacy-transport-quarantine-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toPosix = (value) => String(value || '').replaceAll('\\', '/');
const relativePath = (root, target) => toPosix(path.relative(root, target));
const exists = (target) => fs.existsSync(target);
const read = (target) => fs.readFileSync(target, 'utf8');

function isLocalSpecifier(specifier = '') {
  return String(specifier).startsWith('.') || String(specifier).startsWith('/');
}

function extractJsSpecifiers(source = '') {
  const specifiers = new Set();
  const patterns = [
    /\bimport\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+(?:[\s\S]*?\s+from\s+)["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source))) specifiers.add(match[1]);
  }
  return [...specifiers];
}

function resolveLocalSpecifier({ root, fromFile, specifier }) {
  if (!isLocalSpecifier(specifier)) return null;
  const direct = String(specifier).startsWith('/')
    ? path.join(root, String(specifier).replace(/^\/+/, ''))
    : path.resolve(path.dirname(fromFile), specifier);
  const candidates = [direct];
  if (!path.extname(direct)) candidates.push(`${direct}.js`, `${direct}.mjs`, path.join(direct, 'index.js'), path.join(direct, 'index.mjs'));
  return candidates.find(exists) || null;
}

export function collectLocalImportGraph({ root = ROOT, entrypoints = [] } = {}) {
  const queue = entrypoints
    .map((entry) => path.isAbsolute(entry) ? entry : path.join(root, entry))
    .filter(exists);
  const visited = new Set();
  while (queue.length) {
    const current = queue.shift();
    const relative = relativePath(root, current);
    if (visited.has(relative)) continue;
    visited.add(relative);
    if (!/\.(?:[cm]?js|ts|tsx)$/i.test(current)) continue;
    for (const specifier of extractJsSpecifiers(read(current))) {
      const resolved = resolveLocalSpecifier({ root, fromFile: current, specifier });
      if (resolved) queue.push(resolved);
    }
  }
  return Object.freeze([...visited].sort());
}

function walkFiles(directory, output = []) {
  if (!exists(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walkFiles(absolute, output);
    else if (entry.isFile()) output.push(absolute);
  }
  return output;
}

function scanMarkers({ root, files, markers, label, issues }) {
  for (const relative of files) {
    const absolute = path.isAbsolute(relative) ? relative : path.join(root, relative);
    if (!exists(absolute) || !fs.statSync(absolute).isFile()) continue;
    const source = read(absolute);
    for (const marker of markers) {
      if (source.includes(marker)) issues.push(`${label}-marker:${relativePath(root, absolute)}:${marker}`);
    }
  }
}

function buildOutputFiles({ root, distDirectory }) {
  const directory = distDirectory
    ? (path.isAbsolute(distDirectory) ? distDirectory : path.join(root, distDirectory))
    : path.join(root, 'dist');
  return { directory, files: walkFiles(directory) };
}

export function inspectW519LegacyTransportQuarantine({
  root = ROOT,
  requireDist = false,
  distDirectory = null,
  extraActiveEntrypoints = []
} = {}) {
  const issues = [...validateW519LegacyTransportQuarantineContract()];
  const packageJsonPath = path.join(root, 'package.json');
  const packageJson = exists(packageJsonPath) ? JSON.parse(read(packageJsonPath)) : { scripts: {} };

  for (const relative of W519_QUARANTINED_SOURCE_PATHS) {
    const activePath = path.join(root, relative);
    const archivedPath = path.join(root, W519_QUARANTINE_ROOT, relative);
    if (exists(activePath)) issues.push(`active-path-not-quarantined:${relative}`);
    if (!exists(archivedPath)) issues.push(`archive-path-missing:${relative}`);
  }

  for (const name of W519_RETIRED_PACKAGE_SCRIPTS) {
    if (Object.prototype.hasOwnProperty.call(packageJson.scripts || {}, name)) issues.push(`retired-package-script-present:${name}`);
  }
  for (const [name, command] of Object.entries(packageJson.scripts || {})) {
    for (const marker of ['eon-sync/eon-sync-basic', 'eon-relay-pilot', 'functions/api/sync', 'functions/api/relay']) {
      if (String(command).includes(marker)) issues.push(`package-script-legacy-reference:${name}:${marker}`);
    }
  }

  const routeAudit = auditActiveSurfaceImports({ root });
  if (!routeAudit.ok) issues.push(...routeAudit.legacyPrefixHits.map((entry) => `active-route-legacy-prefix:${entry}`));
  const activeGraph = collectLocalImportGraph({ root, entrypoints: [...W519_ACTIVE_ENTRYPOINTS, ...extraActiveEntrypoints] });
  const activeArchiveHits = activeGraph.filter((entry) => entry === W519_QUARANTINE_ROOT || entry.startsWith(`${W519_QUARANTINE_ROOT}/`));
  issues.push(...activeArchiveHits.map((entry) => `active-import-reaches-quarantine:${entry}`));

  const testGraph = collectLocalImportGraph({ root, entrypoints: CURRENT_UNIT_TESTS });
  const testArchiveHits = testGraph.filter((entry) => entry === W519_QUARANTINE_ROOT || entry.startsWith(`${W519_QUARANTINE_ROOT}/`));
  issues.push(...testArchiveHits.map((entry) => `current-test-import-reaches-quarantine:${entry}`));
  for (const relative of W519_QUARANTINED_SOURCE_PATHS.filter((entry) => entry.startsWith('tests/'))) {
    if (CURRENT_UNIT_TESTS.includes(relative)) issues.push(`quarantined-test-is-current:${relative}`);
  }

  scanMarkers({ root, files: W519_ACTIVE_ENTRYPOINTS, markers: W519_ACTIVE_DENYLIST, label: 'active-shell', issues });

  const approvedWebRtc = new Set(W519_APPROVED_WEBRTC_SOURCE_PATHS.map((entry) => toPosix(entry)));
  const activeJsFiles = walkFiles(path.join(root, 'assets', 'js'))
    .filter((absolute) => /\.js$/i.test(absolute));
  for (const absolute of activeJsFiles) {
    const source = read(absolute);
    if (!source.includes('RTCPeerConnection')) continue;
    const relative = relativePath(root, absolute);
    if (!approvedWebRtc.has(relative)) issues.push(`active-webrtc-outside-approved-voice:${relative}`);
  }
  for (const relative of approvedWebRtc) {
    const absolute = path.join(root, relative);
    if (!exists(absolute)) { issues.push(`approved-webrtc-source-missing:${relative}`); continue; }
    const source = read(absolute);
    if (!source.includes('explicitUserAction')) issues.push(`approved-webrtc-missing-explicit-action:${relative}`);
    if (!source.includes('EON_LOCAL_BRIDGE_ENDPOINT')) issues.push(`approved-webrtc-missing-loopback-bridge:${relative}`);
    if (!source.includes('noCloudCredentialCustody')) issues.push(`approved-webrtc-missing-custody-boundary:${relative}`);
    if (/new\s+WebSocket\s*\(/.test(source)) issues.push(`approved-webrtc-opens-websocket:${relative}`);
  }

  for (const prohibited of ['functions/api/relay', 'functions/api/sync', 'functions/_shared/eon-relay.js', 'functions/_shared/eon-sync-basic.js']) {
    if (exists(path.join(root, prohibited))) issues.push(`active-function-path-present:${prohibited}`);
  }

  const output = buildOutputFiles({ root, distDirectory });
  const builtOutputChecked = exists(output.directory);
  if (requireDist && !builtOutputChecked) issues.push(`dist-required-but-missing:${relativePath(root, output.directory)}`);
  if (builtOutputChecked) {
    for (const absolute of output.files) {
      const source = read(absolute);
      for (const marker of W519_BUILD_DENYLIST) {
        if (source.includes(marker)) issues.push(`built-output-marker:${relativePath(root, absolute)}:${marker}`);
      }
    }
  }

  return Object.freeze({
    schema: `${W519_LEGACY_TRANSPORT_QUARANTINE_SCHEMA}.gate`,
    wave: 'W519',
    sourceOnly: true,
    productionApproved: false,
    ok: issues.length === 0,
    quarantineRoot: W519_QUARANTINE_ROOT,
    quarantinedPathCount: W519_QUARANTINED_SOURCE_PATHS.length,
    activeRouteModuleCount: routeAudit.moduleCount,
    currentTestModuleCount: testGraph.length,
    builtOutputChecked,
    issues: Object.freeze(issues.sort())
  });
}

function main() {
  const requireDist = process.argv.includes('--require-dist');
  const result = inspectW519LegacyTransportQuarantine({ requireDist });
  const target = path.join(ROOT, 'tmp', 'w519-legacy-transport-quarantine-gate.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) throw new Error(`W519 legacy transport/control quarantine failed:\n${result.issues.map((entry) => `- ${entry}`).join('\n')}`);
  process.stdout.write(`W519 legacy transport/control quarantine passed (${result.quarantinedPathCount} archived paths; ${result.activeRouteModuleCount} active route modules; built output ${result.builtOutputChecked ? 'checked' : 'not requested'}). Source proof only.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
