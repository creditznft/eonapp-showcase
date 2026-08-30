#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ledgerPath = path.join(root, 'config', 'w662-implementation-exposure-ledger.json');
const write = process.argv.includes('--write');
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
const component = ledger.components?.find((entry) => entry.id === 'camera-relative-controls');
if (!component) throw new Error('[w662b-ledger] camera-relative-controls component is missing.');
if (component.status === 'complete') throw new Error('[w662b-ledger] camera controls cannot be complete before authenticated browser proof.');

component.status = 'human-proof-required';
component.evidence.sourcePresent = true;
component.evidence.activeRuntimeImported = true;
component.evidence.frontendTriggerVisible = true;
component.evidence.functionalInteractionProven = true;
component.evidence.automatedTestProven = true;
component.evidence.authenticatedHumanProof = false;
component.references.sourcePaths = Array.from(new Set([
  'assets/js/city/eon-city-camera-relative-movement.js',
  'assets/js/city/eon-city-play-core.js',
  'assets/js/city/eon-city-third-person-controller.js'
]));
component.references.importPaths = ['assets/js/city/eon-city-play-core.js'];
component.references.testPaths = Array.from(new Set([
  'tests/unit/w662-camera-relative-movement.test.mjs',
  'scripts/w662-apply-camera-relative-core-patch.mjs',
  'tests/unit/w661e-frame-aware-browser-proof.test.mjs',
  'tests/unit/w661e-frame-safe-pulse.test.mjs',
  'tests/unit/w661e-pointer-completion-click-suppression.test.mjs',
  'tests/unit/w661e-pointer-event-timestamp-release.test.mjs'
]));
component.references.humanProofRefs = [];
component.references.knownContradictions = [
  'The fixed-axis defect is removed in source and deterministic tests, but authenticated Chrome/Edge/Firefox/mobile/controller proof is still required.'
];
component.nextAction = 'Run the governed browser parity matrix at 0°, 90°, 180° and 270°, including D-pad, touch/analogue, controller, overlay focus and post-transition release.';

const statusCounts = {};
const priorityCounts = {};
for (const entry of ledger.components) {
  statusCounts[entry.status] = (statusCounts[entry.status] || 0) + 1;
  priorityCounts[entry.priority] = (priorityCounts[entry.priority] || 0) + 1;
}
ledger.summary.componentCount = ledger.components.length;
ledger.summary.statusCounts = statusCounts;
ledger.summary.priorityCounts = priorityCounts;
ledger.summary.p0NotComplete = ledger.components.filter((entry) => entry.priority === 'P0' && entry.status !== 'complete').map((entry) => entry.id);
ledger.summary.acceptedComplete = ledger.components.filter((entry) => entry.status === 'complete').map((entry) => entry.id);
ledger.summary.broadVisualCodingAuthorized = false;
ledger.summary.nextAuthorizedWave = 'W662B authenticated browser parity proof; no Preview or production action';
ledger.generatedAt = '2026-07-23T04:15:00+05:30';

const output = `${JSON.stringify(ledger, null, 2)}\n`;
if (!write) {
  console.log('[w662b-ledger] PASS: implementation status can be recorded. Use --write to update the ledger.');
  process.exit(0);
}
fs.writeFileSync(ledgerPath, output);
console.log(`[w662b-ledger] PASS: camera-relative-controls recorded as ${component.status}; authenticated human proof remains false.`);
