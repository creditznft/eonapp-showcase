import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'config/w662h-whole-app-reconciliation.json');
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = [];
if (report.schema !== 'eonapp.w662h.whole-app-reconciliation.2026-07-23.v1') errors.push('schema-invalid');
if (!Array.isArray(report.findings) || report.findings.length < 16) errors.push('finding-coverage-incomplete');
const ids = new Set();
for (const finding of report.findings || []) {
  if (!finding.id || ids.has(finding.id)) errors.push(`finding-id-invalid:${finding.id || 'missing'}`);
  ids.add(finding.id);
  if (!['P0', 'P1', 'P2'].includes(finding.priority)) errors.push(`priority-invalid:${finding.id}`);
  if (!['source-remediated', 'human-proof-required', 'external-verification-required'].includes(finding.status)) errors.push(`status-invalid:${finding.id}`);
  if (!Array.isArray(finding.sourcePaths) || !finding.sourcePaths.length) errors.push(`source-path-missing:${finding.id}`);
  for (const sourcePath of finding.sourcePaths || []) {
    if (!fs.existsSync(path.join(root, sourcePath))) errors.push(`source-path-not-found:${finding.id}:${sourcePath}`);
  }
  if (!Array.isArray(finding.testPaths)) errors.push(`test-path-list-missing:${finding.id}`);
  for (const testPath of finding.testPaths || []) {
    if (!fs.existsSync(path.join(root, testPath))) errors.push(`test-path-not-found:${finding.id}:${testPath}`);
  }
  if (finding.humanProofAccepted !== false) errors.push(`human-proof-fabricated:${finding.id}`);
}
for (const required of ['ready-complete-state-truth', 'city-modal-focus-authority', 'physical-living-nexus-gateway', 'camera-relative-input-parity']) {
  if (!ids.has(required)) errors.push(`required-finding-missing:${required}`);
}
if (report.acceptance?.sourceGateComplete !== true) errors.push('source-gate-not-complete');
if (report.acceptance?.ownerAccepted || report.acceptance?.previewAuthorized || report.acceptance?.productionAuthorized) errors.push('release-authority-broadened');
if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, schema: report.schema, findingCount: report.findings.length, humanProofAccepted: false, previewAuthorized: false }, null, 2));
