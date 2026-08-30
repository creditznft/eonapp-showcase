#!/usr/bin/env node
/** W522 source/build gate: current gate authority, route/recovery/capability truth, and evidence freshness. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ALL_ROUTE_ROWS,
  getRouteRow,
  validateRouteContract
} from '../config/route-contract.mjs';
import {
  CAPABILITY_TRUTH_REGISTRY
} from '../assets/js/capabilities/capability-truth-registry.js';
import {
  W486_EVIDENCE_FRESHNESS_CONTRACT,
  validateW486EvidenceFreshnessContract
} from '../config/w486-evidence-freshness-contract.mjs';
import {
  W517_RELEASE_AUTHORITY_REGISTRY,
  W517_GATE_LIFECYCLE_VALUES,
  validateW517SourceConvergenceContract
} from '../config/w517-source-convergence-contract.mjs';
import {
  W522_GATE_RISK_CONVERGENCE_SCHEMA,
  W522_GATE_RISK_REGISTRY,
  W522_REQUIRED_SOURCE_FILES,
  W522_REQUIRED_W517_ACTIVE_IDS,
  W522_REQUIRED_W517_NONACTIVE_IDS,
  W522_TRUTH,
  validateW522GateRiskConvergenceContract,
  validateW522RouteRecoveryCapabilityState
} from '../config/w522-gate-risk-convergence-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exists = (target) => fs.existsSync(target);
const read = (target) => fs.readFileSync(target, 'utf8');
const toPosix = (value) => String(value || '').replaceAll('\\', '/');
const relative = (root, target) => toPosix(path.relative(root, target));

export function parseCanonicalReleaseGates(source = '') {
  const gates = new Map();
  const pattern = /Object\.freeze\(\{\s*id:\s*'([^']+)'\s*,\s*command:\s*(?:\[([^\]]+)\]|canonicalCommand\(([^)]+)\))/g;
  let match;
  while ((match = pattern.exec(String(source)))) {
    const id = match[1];
    const raw = match[2] ?? match[3] ?? '';
    const command = raw.replaceAll("'", '').replaceAll('"', '').split(',').map((entry) => entry.trim()).filter(Boolean);
    if (match[3]) command.unshift('npm');
    gates.set(id, Object.freeze({ id, command }));
  }
  return gates;
}

export function validateW522CanonicalCoverage({ registry = W522_GATE_RISK_REGISTRY, packageScripts = {}, canonicalGates = new Map() } = {}) {
  const errors = [];
  const active = (Array.isArray(registry) ? registry : []).filter((entry) => entry?.lifecycle === 'active');
  for (const entry of active) {
    const directCommand = String(entry.command || '');
    const gate = canonicalGates.get(entry.canonicalGateId);
    if (entry.nestedWithin) {
      const parentScript = String(packageScripts?.[entry.nestedWithin] || '');
      if (!Object.prototype.hasOwnProperty.call(packageScripts || {}, entry.nestedWithin)) errors.push(`nested-parent-script-missing:${entry.id}:${entry.nestedWithin}`);
      if (!parentScript.includes(directCommand)) errors.push(`nested-command-missing:${entry.id}:${entry.nestedWithin}`);
      if (!gate || !gate.command.includes(entry.nestedWithin)) errors.push(`canonical-command-missing-or-mismatched:${entry.id}:${entry.canonicalGateId}`);
      continue;
    }
    if (directCommand.startsWith('npm ')) {
      if (!gate || gate.command.join(' ') !== directCommand) errors.push(`canonical-command-missing-or-mismatched:${entry.id}:${entry.canonicalGateId}`);
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(packageScripts || {}, directCommand)) errors.push(`package-script-missing:${entry.id}:${directCommand}`);
    if (!gate || !gate.command.includes(directCommand)) errors.push(`canonical-command-missing-or-mismatched:${entry.id}:${entry.canonicalGateId}`);
  }
  return Object.freeze(errors);
}

export function validateW522W517Registry({ registry = W517_RELEASE_AUTHORITY_REGISTRY } = {}) {
  const errors = [...validateW517SourceConvergenceContract()];
  const rows = Array.isArray(registry) ? registry : [];
  const byId = new Map(rows.map((entry) => [entry.id, entry]));
  for (const id of W522_REQUIRED_W517_ACTIVE_IDS) {
    const entry = byId.get(id);
    if (!entry || entry.lifecycle !== 'active') errors.push(`w517-active-classification-invalid:${id}`);
  }
  for (const id of W522_REQUIRED_W517_NONACTIVE_IDS) {
    const entry = byId.get(id);
    if (!entry || entry.lifecycle === 'active' || !W517_GATE_LIFECYCLE_VALUES.includes(entry.lifecycle)) errors.push(`w517-historical-classification-invalid:${id}`);
  }
  return Object.freeze(errors);
}

function inspectBuiltRouteConvergence({ root, requireDist }) {
  const issues = [];
  const dist = path.join(root, 'dist');
  const checked = exists(dist);
  if (requireDist && !checked) issues.push('dist-required-but-missing');
  if (!checked) return Object.freeze({ checked, issues: Object.freeze(issues) });
  const capsule = path.join(dist, 'capsule', 'index.html');
  const city = path.join(dist, 'eoncity', 'index.html');
  const redirects = path.join(dist, '_redirects');
  for (const file of [capsule, city, redirects]) if (!exists(file)) issues.push(`built-route-artifact-missing:${relative(root, file)}`);
  if (exists(capsule)) {
    const content = read(capsule);
    if (/EON Sync|\/vault\/backup/i.test(content)) issues.push('built-capsule-retains-legacy-recovery-marker');
    if (!/Portable Workspace Capsule/.test(content)) issues.push('built-capsule-marker-missing');
  }
  const cityMarker = getRouteRow('/eoncity')?.expected?.[0] || 'Checking City access';
  if (exists(city) && !read(city).includes(cityMarker)) issues.push('built-city-canonical-marker-missing');
  if (exists(redirects)) {
    const content = read(redirects);
    for (const expected of ['/vault/backup /capsule 301', '/eoncity-3d /eoncity 301', '/eoncity-play /eoncity 301']) {
      if (!content.includes(expected)) issues.push(`built-redirect-missing:${expected}`);
    }
  }
  return Object.freeze({ checked, issues: Object.freeze(issues) });
}

export function inspectW522GateRiskConvergence({
  root = ROOT,
  requireDist = false,
  canonicalSource = null,
  packageScripts = null,
  routeRows = ALL_ROUTE_ROWS,
  capabilityRecords = CAPABILITY_TRUTH_REGISTRY,
  gateRegistry = W522_GATE_RISK_REGISTRY,
  w517Registry = W517_RELEASE_AUTHORITY_REGISTRY
} = {}) {
  const issues = [];
  issues.push(...validateW522GateRiskConvergenceContract({
    schema: W522_GATE_RISK_CONVERGENCE_SCHEMA,
    registry: gateRegistry,
    truth: W522_TRUTH,
    sourceFiles: W522_REQUIRED_SOURCE_FILES
  }));
  for (const sourceFile of W522_REQUIRED_SOURCE_FILES) {
    if (!exists(path.join(root, sourceFile))) issues.push(`required-source-missing:${sourceFile}`);
  }
  issues.push(...validateRouteContract().map((entry) => `route-contract-invalid:${entry}`));
  issues.push(...validateW522RouteRecoveryCapabilityState({ routeRows, capabilityRecords }));
  issues.push(...validateW522W517Registry({ registry: w517Registry }));
  issues.push(...validateW486EvidenceFreshnessContract(W486_EVIDENCE_FRESHNESS_CONTRACT).map((entry) => `evidence-freshness-invalid:${entry}`));
  if (W486_EVIDENCE_FRESHNESS_CONTRACT.truth?.sourceGateCanApproveProduction !== false) issues.push('evidence-freshness-source-gate-overclaims-production');
  if (W486_EVIDENCE_FRESHNESS_CONTRACT.truth?.physicalDeviceProof !== 'NOT PROVEN') issues.push('evidence-freshness-device-status-overclaimed');

  const parsedPackage = packageScripts || JSON.parse(read(path.join(root, 'package.json'), 'utf8')).scripts || {};
  const source = canonicalSource ?? read(path.join(root, 'scripts/w517-canonical-release-verify.mjs'));
  issues.push(...validateW522CanonicalCoverage({ registry: gateRegistry, packageScripts: parsedPackage, canonicalGates: parseCanonicalReleaseGates(source) }));

  const built = inspectBuiltRouteConvergence({ root, requireDist });
  issues.push(...built.issues);
  return Object.freeze({
    schema: `${W522_GATE_RISK_CONVERGENCE_SCHEMA}.gate`,
    wave: 'W522',
    sourceOnly: true,
    ok: issues.length === 0,
    builtOutputChecked: built.checked,
    truth: W522_TRUTH,
    activeGateCount: gateRegistry.filter((entry) => entry.lifecycle === 'active').length,
    historicalGateCount: gateRegistry.filter((entry) => entry.lifecycle !== 'active').length,
    issues: Object.freeze([...new Set(issues)].sort())
  });
}

function main() {
  const report = inspectW522GateRiskConvergence({ requireDist: process.argv.includes('--require-dist') });
  const target = path.join(ROOT, 'tmp', 'w522-gate-risk-convergence-gate.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) throw new Error(`W522 gate/risk convergence failed:\n${report.issues.map((entry) => `- ${entry}`).join('\n')}`);
  process.stdout.write(`W522 gate/risk convergence passed (${report.activeGateCount} active controls; ${report.historicalGateCount} classified non-authoritative records; built output ${report.builtOutputChecked ? 'checked' : 'not requested'}). Source proof only.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
