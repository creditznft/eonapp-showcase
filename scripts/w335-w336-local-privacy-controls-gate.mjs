#!/usr/bin/env node
/** W335–W336 — verifies privacy diagnostics are local, bounded and explicit. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W335_W336_LOCAL_PRIVACY_CONTROLS_CONTRACT } from '../config/w335-w336-local-privacy-controls-contract.mjs';
import { getEonLocalPrivacyDiagnosticsTruth, inspectEonLocalPrivacy } from '../assets/js/local-first/eon-local-privacy-diagnostics.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function runW335W336LocalPrivacyControlsGate(root = ROOT) {
  const errors = [];
  const contract = W335_W336_LOCAL_PRIVACY_CONTROLS_CONTRACT;
  for (const relative of contract.requiredFiles) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) errors.push(`Required W335–W336 file missing: ${relative}`);
  }
  if (errors.length) return Object.freeze({ schema: contract.schema, ok: false, errors });
  const diagnostics = fs.readFileSync(path.join(root, 'assets/js/local-first/eon-local-privacy-diagnostics.js'), 'utf8');
  for (const pattern of contract.forbiddenPatterns) if (diagnostics.includes(pattern)) errors.push(`Privacy diagnostics contain forbidden network/navigation capability ${pattern}.`);
  const workspace = fs.readFileSync(path.join(root, 'assets/js/eon-workspace-pages.js'), 'utf8');
  const privacyStart = workspace.indexOf('function renderLocalPrivacyControls()');
  const privacyEnd = workspace.indexOf('function renderKernelForegroundReviewInbox()', privacyStart);
  const privacySection = privacyStart >= 0 ? workspace.slice(privacyStart, privacyEnd >= 0 ? privacyEnd : undefined) : '';
  const privacyBindingStart = workspace.indexOf("root.querySelector('[data-workspace-clear-temporary]')");
  const privacyBindingEnd = workspace.indexOf("root.querySelector('[data-workspace-share]')", privacyBindingStart);
  const privacyBinding = privacyBindingStart >= 0 ? workspace.slice(privacyBindingStart, privacyBindingEnd >= 0 ? privacyBindingEnd : undefined) : '';
  if (!privacySection.includes('Device privacy controls') || !privacySection.includes('data-workspace-clear-temporary')) errors.push('Workspace lacks the local privacy control surface.');
  if (!privacySection.includes('data-workspace-clear-legacy-chat')) errors.push('Workspace lacks the explicit legacy plaintext Chat cleanup path.');
  for (const pattern of contract.forbiddenPatterns) if (privacySection.includes(pattern) || privacyBinding.includes(pattern)) errors.push(`Workspace privacy controls contain forbidden network/navigation capability ${pattern}.`);
  const runtime = fs.readFileSync(path.join(root, 'assets/js/chat/ai-runtime.js'), 'utf8');
  if (!runtime.includes('getModelDiscoveryCacheTruth') || runtime.includes('localStorage.getItem(MODEL_CACHE_KEY)') || runtime.includes('localStorage.setItem(MODEL_CACHE_KEY')) errors.push('Model discovery cache must remain session-only with an exported privacy truth.');
  const truth = getEonLocalPrivacyDiagnosticsTruth();
  const status = inspectEonLocalPrivacy({ sessionStorage: null, localStorage: null });
  for (const [key, value] of Object.entries(contract.expectedTruth)) if (truth[key] !== value) errors.push(`Privacy truth drifted for ${key}.`);
  if (status.rawContentRead !== false || status.cloudSync !== false || status.directNetwork !== false) errors.push('Privacy diagnostics must not read content or create network/cloud activity.');
  return Object.freeze({ schema: contract.schema, ok: errors.length === 0, errors, truth, statusSchema: status.schema });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW335W336LocalPrivacyControlsGate();
  if (!report.ok) console.error(JSON.stringify(report, null, 2));
  else console.log('W335–W336 local privacy controls gate passed: bounded device-only diagnostics and explicit temporary-state cleanup are intact.');
  process.exitCode = report.ok ? 0 : 1;
}
