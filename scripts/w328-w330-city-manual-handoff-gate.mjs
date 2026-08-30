#!/usr/bin/env node
/** W328–W330 — verifies City mirrors the kernel and manual handoff has no side effect. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W328_W330_CITY_MANUAL_HANDOFF_CONTRACT } from '../config/w328-w330-city-manual-handoff-contract.mjs';
import { getEonKernelCityBridgeTruth, recordEonKernelCityMirror } from '../assets/js/ai-kernel/eon-city-event-bridge.js';
import { getAgentPresenceOutcome } from '../assets/js/operator/agent-presence.js';
import { getCreatorSuite2SessionTruth } from '../assets/js/creator-suite-2/creator-suite-2-workspace.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function memoryStorage() {
  const map = new Map();
  return { getItem: (key) => map.has(key) ? map.get(key) : null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key) };
}

export function runW328W330CityManualHandoffGate(root = ROOT) {
  const errors = [];
  const contract = W328_W330_CITY_MANUAL_HANDOFF_CONTRACT;
  for (const relative of contract.requiredFiles) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) { errors.push(`Required City/manual-handoff file missing: ${relative}`); continue; }
    const source = fs.readFileSync(file, 'utf8').toLowerCase();
    if (relative !== 'assets/js/eon-workspace-pages.js') {
      for (const pattern of contract.forbiddenPatterns) if (source.includes(pattern)) errors.push(`City/manual-handoff source contains forbidden capability ${pattern}: ${relative}`);
    }
  }
  const bridgeSource = fs.readFileSync(path.join(root, 'assets/js/ai-kernel/eon-city-event-bridge.js'), 'utf8');
  const presenceSource = fs.readFileSync(path.join(root, 'assets/js/operator/agent-presence.js'), 'utf8');
  const workspaceSource = fs.readFileSync(path.join(root, 'assets/js/eon-workspace-pages.js'), 'utf8');
  if (!bridgeSource.includes("source: 'eon-ai-kernel'")) errors.push('Kernel City bridge still impersonates a legacy source.');
  if (!presenceSource.includes("'eon-ai-kernel'")) errors.push('Agent presence does not recognize the dedicated Kernel source.');
  if (!workspaceSource.includes('Manual Submission Desk')) errors.push('Workspace lacks the manual submission desk.');
  const manualDeskStart = workspaceSource.indexOf('function renderManualSubmissionDesk()');
  const manualDeskEnd = workspaceSource.indexOf('function renderKernelForegroundReviewInbox()', manualDeskStart);
  const manualDeskSource = manualDeskStart >= 0 ? workspaceSource.slice(manualDeskStart, manualDeskEnd >= 0 ? manualDeskEnd : undefined).toLowerCase() : '';
  for (const pattern of contract.forbiddenPatterns) if (manualDeskSource.includes(pattern)) errors.push(`Manual submission desk contains forbidden capability ${pattern}.`);
  const storage = memoryStorage();
  const mirror = recordEonKernelCityMirror({ task: { taskId: 'eontask_abcdefghijklmnop', state: 'completed', createdAt: '2026-06-26T00:00:00.000Z', updatedAt: '2026-06-26T00:00:01.000Z' }, role: 'writer' }, { storage });
  if (!mirror.ok || mirror.entry?.source !== contract.expectedTruth.citySource) errors.push('Kernel City mirror did not retain the dedicated safe source.');
  const outcome = getAgentPresenceOutcome({ latest: mirror.entry });
  if (outcome.route !== '/workspace#eon-kernel-review-inbox-title' || outcome.nativeSurface !== 'Workspace') errors.push('Kernel outcome must route to native Workspace review.');
  const city = getEonKernelCityBridgeTruth();
  const creator = getCreatorSuite2SessionTruth();
  if (city.cityCanApprove !== contract.expectedTruth.cityCanApprove || city.cityCanExecute !== contract.expectedTruth.cityCanExecute) errors.push('City must not approve or execute.');
  if (creator.externalEffect !== contract.expectedTruth.externalEffect || creator.providerCall !== contract.expectedTruth.providerCall || creator.exportRequiresUserAction !== true) errors.push('Creator/manual handoff boundary drifted.');
  return Object.freeze({ schema: contract.schema, ok: errors.length === 0, errors, city, creator, mirror: mirror.entry, outcome });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW328W330CityManualHandoffGate();
  if (!report.ok) console.error(JSON.stringify(report, null, 2));
  else console.log('W328–W330 City/manual handoff gate passed: the Kernel owns safe City events and users remain in control of export/submission.');
  process.exitCode = report.ok ? 0 : 1;
}
