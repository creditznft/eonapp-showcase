import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { UX2_SHELL_MODALS_CONTRACT } from '../../config/ux2-shell-modals-contract.mjs';
import { inspectUx2ShellModals } from '../../scripts/ux2-shell-modals-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('UX-2 provides compact Profile, Settings and Apps surfaces without enabling Sync or billing', () => {
  const shell = read('assets/js/eon-app-shell.js');
  assert.match(shell, /data-eon-shell-modal/);
  assert.match(shell, /Sign in to EONAPP/);
  for (const mode of UX2_SHELL_MODALS_CONTRACT.requiredModes) assert.match(shell, new RegExp(`['\"]${mode}['\"]`));
  for (const tab of UX2_SHELL_MODALS_CONTRACT.requiredSettingsTabs) assert.match(shell, new RegExp(`['\"]${tab}['\"]`));
  assert.match(shell, /EON Sync — Coming soon/);
  assert.match(shell, /Billing is not active/);
  assert.doesNotMatch(shell, /fetch\(['\"]\/api\/(?:sync|vault|projects)/);
});

test('UX-2 source gate passes and remains source-only', () => {
  const report = inspectUx2ShellModals();
  assert.equal(report.status, 'pass', report.checks.filter((item) => !item.ok).map((item) => item.id).join(', '));
  assert.match(report.limitations.join(' '), /real Google OAuth/i);
});
