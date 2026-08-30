#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonShellDrawerAccessibilityState } from '../assets/js/shell/eon-shell-navigation.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectW617aShellLaunchReadinessGate() {
  const errors = [];
  const closed = getEonShellDrawerAccessibilityState({ mobile: true, open: false });
  const open = getEonShellDrawerAccessibilityState({ mobile: true, open: true });
  const desktop = getEonShellDrawerAccessibilityState({ mobile: false, open: true });

  if (closed.drawerState !== 'closed') errors.push('Mobile closed drawer does not report closed state.');
  if (closed.sidebarAriaHidden !== 'true') errors.push('Mobile closed drawer must retain aria-hidden=true.');
  if (closed.sidebarInert !== true) errors.push('Mobile closed drawer must make the sidebar inert.');
  if (closed.mainInert !== false) errors.push('Mobile closed drawer must keep main content available.');
  if (open.sidebarAriaHidden !== 'false' || open.sidebarInert !== false || open.mainInert !== true) errors.push('Mobile open drawer must expose sidebar and make main inert.');
  if (desktop.drawerState !== 'desktop' || desktop.sidebarAriaHidden !== '' || desktop.sidebarInert !== false || desktop.mainInert !== false) errors.push('Desktop shell must not inherit mobile drawer hiding.');

  const shell = read('assets/js/eon-app-shell.js');
  if (!shell.includes('getEonShellDrawerAccessibilityState')) errors.push('App shell is not using the central drawer accessibility resolver.');
  if (!shell.includes('sidebar.inert = accessibility.sidebarInert')) errors.push('App shell does not apply sidebar.inert.');
  if (!shell.includes('setDrawerOpen(false, state);')) errors.push('App shell does not initialize the drawer through the central close path.');
  if (!shell.includes("setDrawerOpen(sidebar.classList.contains('is-open'), state);")) errors.push('App shell resize path does not re-sync drawer accessibility state.');

  for (const file of ['assets/css/chat.css', 'assets/css/layout.css', 'assets/css/subscription.css', 'assets/css/workbench.css']) {
    const css = read(file);
    if (/#64748b|#818cf8|#c4b5fd|#c7d2fe|#a9b5c7/i.test(css)) errors.push(`${file} still contains pre-W617A low-contrast bottom-nav colours.`);
    if (!/#94a3b8|#aebbd0/i.test(css)) errors.push(`${file} missing hardened inactive bottom-nav colour.`);
    if (!/#e0e7ff/i.test(css)) errors.push(`${file} missing hardened active/focus bottom-nav colour.`);
  }

  return Object.freeze({ ok: errors.length === 0, errors, schema: 'eonapp.w617a.shell-launch-readiness-gate.v1', checks: 10 });
}

const report = inspectW617aShellLaunchReadinessGate();
if (!report.ok) {
  console.error(`[W617A] shell launch readiness gate failed:\n- ${report.errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`[W617A] shell launch readiness gate passed (${report.checks}/10).`);
