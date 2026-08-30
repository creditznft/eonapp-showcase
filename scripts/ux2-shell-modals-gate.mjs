#!/usr/bin/env node
/** UX-2 source gate: compact modal surfaces without activating cloud/product boundaries. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UX2_SHELL_MODALS_CONTRACT } from '../config/ux2-shell-modals-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (root, relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectUx2ShellModals(root = ROOT) {
  const contract = UX2_SHELL_MODALS_CONTRACT;
  const checks = [];
  const check = (id, ok, detail) => checks.push({ id, ok: Boolean(ok), detail });
  for (const file of contract.requiredFiles) check(`file:${file}`, fs.existsSync(path.join(root, file)), 'required UX-2 source exists');
  const shell = read(root, 'assets/js/eon-app-shell.js');
  const css = read(root, 'assets/css/eon-app-shell.css');
  check('shared-modal', /data-eon-shell-modal-layer/.test(shell) && /data-eon-shell-modal\b/.test(shell) && /function openShellUtilityModal/.test(shell), 'shell has a reusable accessible modal layer');
  for (const mode of contract.requiredModes) check(`mode:${mode}`, new RegExp(`['\"]${mode}['\"]`).test(shell), `modal mode ${mode} is rendered in source`);
  for (const tab of contract.requiredSettingsTabs) check(`tab:${tab}`, new RegExp(`['\"]${tab}['\"]`).test(shell), `settings tab ${tab} is rendered in source`);
  check('profile-local-edit', /data-eon-shell-modal-save-name/.test(shell) && /updateProfile\(/.test(shell) && /remixProfileAvatar\(/.test(shell), 'profile modal edits only local profile presentation');
  check('account-menu-modal-routes', /data-eon-shell-open-profile/.test(shell) && /data-eon-shell-open-settings/.test(shell) && !/<a role="menuitem" href="\/profile"/.test(shell), 'account popover opens in-shell Profile and Settings');
  check('apps-gallery', /id: 'apps', action: 'apps'/.test(shell) && /eon-shell-app-grid/.test(shell) && /Nothing here connects, posts, deploys, or purchases on your behalf\./.test(shell), 'Apps opens a local gallery with no external activation claim');
  check('sync-stays-locked', /EON Sync — Coming soon/.test(shell) && /does not upload local Chat, Vault, projects, files, API keys, or browser caches/.test(shell), 'Sync remains a separately gated future capability');
  check('billing-stays-locked', /Billing is not active/.test(shell) && /no checkout, subscription, payout, referral reward, or marketplace purchase flow/.test(shell), 'billing and value-bearing flows remain inactive');
  check('modal-accessibility', /aria-modal="true"/.test(shell) && /event\.key === 'Escape'/.test(shell) && /focusableNodes\(dialog\)/.test(shell), 'modal has dialog semantics, Escape close and focus containment');
  check('mobile-layout', /eon-shell-modal-layer/.test(css) && /eon-shell-modal-layout/.test(css) && /@media \(max-width: 640px\)/.test(css), 'modal has explicit narrow-screen layout');
  check('no-cloud-sync-endpoint', !/fetch\(['\"]\/api\/(?:sync|vault|projects)/.test(shell), 'UX-2 shell does not add a cloud workspace/sync endpoint');
  return Object.freeze({
    schema: 'eonapp.ux2.shell-modals-gate.v1',
    status: checks.every((item) => item.ok) ? 'pass' : 'fail',
    sourceOnly: true,
    checks: Object.freeze(checks),
    limitations: Object.freeze([
      'This source gate does not prove real Google OAuth, production session behavior, EON Sync, connected-app OAuth, billing, or a device visual review.'
    ])
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = inspectUx2ShellModals();
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== 'pass') process.exitCode = 1;
}
