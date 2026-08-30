#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import { buildW451LegacySourceInventory } from './w451-legacy-source-inventory.mjs';
import {
  W451_CLEANUP_ACTIONS,
  W451_CLEANUP_EXECUTION_SCHEMA,
  W451_CLEANUP_GUARANTEES,
  W451_CLEANUP_PRECONDITIONS,
  validateW451CleanupExecutionContract
} from '../config/w451-cleanup-execution-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isRootHistory = (file) => /^(?:BUNDLE_CONTENTS\.md|CHANGED_FILES_|CHANGELOG_|EONAPP_.*(?:HANDOVER|PLAN|VALIDATION)|README_.*(?:HANDOVER|PLAN)|W\d+_.*\.md)/.test(file);
const freeze = (value) => Object.freeze(value);

function buildActionManifest(inventory) {
  const records = inventory.records || [];
  const active = records.filter((entry) => entry.classification === 'active-runtime' || entry.classification === 'active-route-document');
  const compatibility = records.filter((entry) => entry.classification === 'compatibility-document');
  const historical = records.filter((entry) => entry.classification === 'historical');
  const rootHistory = records.filter((entry) => entry.classification === 'review-before-quarantine' && isRootHistory(entry.file));
  return freeze({
    activeFiles: freeze(active.map((entry) => entry.file)),
    compatibilityFiles: freeze(compatibility.map((entry) => entry.file)),
    historicalFiles: freeze(historical.map((entry) => entry.file)),
    rootHistoryFiles: freeze(rootHistory.map((entry) => entry.file)),
    archiveRoots: inventory.historicalRoots,
    actionCounts: freeze({ active: active.length, compatibility: compatibility.length, historical: historical.length, rootHistory: rootHistory.length })
  });
}

function markdown(report) {
  const actions = report.actions.map((action, index) => `${index + 1}. **${action.id}** — ${action.reason}`).join('\n');
  return [
    '# W451.1 Codex legacy-cleanup handoff',
    '',
    `- Status: **${report.status}**`,
    `- Active runtime + route files protected: **${report.manifest.actionCounts.active}**`,
    `- Compatibility documents protected: **${report.manifest.actionCounts.compatibility}**`,
    `- Historical files eligible only for quarantine after proof: **${report.manifest.actionCounts.historical}**`,
    `- Root historical notes requiring review: **${report.manifest.actionCounts.rootHistory}**`,
    '',
    '## Preconditions before Codex changes files',
    '',
    ...report.preconditions.map((item) => `- \`${item}\``),
    '',
    '## Required sequence',
    '',
    actions,
    '',
    '## Non-negotiable boundary',
    '',
    '- This handoff does not delete, move or deploy anything.',
    '- Do not change active source, current route documents, compatibility redirects, package scripts, tests or production assets during the first quarantine pass.',
    '- After quarantine, run the full source foundation verification again and require a human review before any delete-after-proof step.',
    '',
    '## Machine-readable categories',
    '',
    `- Historical roots: ${report.manifest.archiveRoots.map((value) => `\`${value}\``).join(', ')}`,
    `- Protected active graph count: ${report.manifest.actionCounts.active}`,
    `- No active historical imports: ${report.noHistoricalActiveImports ? 'yes' : 'no'}`,
    ''
  ].join('\n');
}

export function buildW451CleanupExecutionHandoff({ writeArtifact = false } = {}) {
  const errors = [...validateW451CleanupExecutionContract()];
  const inventory = buildW451LegacySourceInventory({ writeArtifact: false });
  const fence = auditActiveSurfaceImports({ root });
  const manifest = buildActionManifest(inventory);
  const historicalActive = inventory.records.filter((entry) => entry.classification === 'historical' && fence.reachableModules.includes(entry.file));

  if (inventory.status !== 'pass') errors.push(`W451 inventory did not pass: ${(inventory.errors || []).join('; ')}`);
  if (!fence.ok) errors.push('Active import fence did not pass.');
  if (historicalActive.length) errors.push(`Historical files are active: ${historicalActive.map((entry) => entry.file).join(', ')}`);
  if (manifest.actionCounts.active !== inventory.classifications['active-runtime'] + inventory.classifications['active-route-document']) errors.push('Protected active count does not reconcile with inventory classification.');
  if (!manifest.historicalFiles.length) errors.push('Historical quarantine lane is unexpectedly empty.');

  const report = freeze({
    schema: W451_CLEANUP_EXECUTION_SCHEMA,
    wave: 'W451.1',
    status: errors.length ? 'fail' : 'pass',
    sourceOnly: true,
    preconditions: W451_CLEANUP_PRECONDITIONS,
    actions: W451_CLEANUP_ACTIONS,
    guarantees: W451_CLEANUP_GUARANTEES,
    manifest,
    noHistoricalActiveImports: historicalActive.length === 0,
    errors: freeze(errors),
    limitations: freeze([
      'This handoff does not confirm the canonical Git branch or perform any file operation.',
      'No quarantine or deletion is safe until Codex has rerun the preconditions from the canonical repository.',
      'This is not a deployment, production-output, payment or device-proof claim.'
    ])
  });

  if (writeArtifact) {
    const output = path.join(root, 'artifacts', 'w451-cleanup-execution-handoff');
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(path.join(output, 'manifest.json'), `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(path.join(output, 'CODEX_W451_CLEANUP_HANDOFF.md'), `${markdown(report)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildW451CleanupExecutionHandoff({ writeArtifact: true });
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  process.stdout.write(`W451.1 cleanup execution handoff passed (${report.manifest.actionCounts.historical} historical files; ${report.manifest.actionCounts.rootHistory} root review files).\n`);
}
