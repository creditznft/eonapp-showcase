#!/usr/bin/env node
/**
 * W537 source gate — Profile selected-panel settings and compressed Capsule UX.
 *
 * Static contract only. It proves the source information architecture and
 * disclosure boundaries. It does not prove browser rendering, production
 * deployment, Google Drive consent, or physical-device evidence.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W537_CONSUMER_UX_COMPRESSION_CONTRACT } from '../config/w537-consumer-ux-compression-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED = Object.freeze([
  'profile.html',
  'capsule.html',
  'assets/js/profile-page.js',
  'assets/css/eon-hubs.css',
  'assets/css/eon-vault-v2.css',
  'config/w537-consumer-ux-compression-contract.mjs'
]);

const read = (root, relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const has = (root, relative) => fs.existsSync(path.join(root, relative));

export function inspectW537ConsumerUxCompression({ root = ROOT } = {}) {
  const issues = [];
  for (const relative of REQUIRED) if (!has(root, relative)) issues.push(`missing-required-source:${relative}`);
  if (issues.length) {
    return Object.freeze({ wave: W537_CONSUMER_UX_COMPRESSION_CONTRACT.wave, sourceOnly: true, ok: false, issues: Object.freeze(issues.sort()) });
  }

  const profileHtml = read(root, 'profile.html');
  const capsuleHtml = read(root, 'capsule.html');
  const profileJs = read(root, 'assets/js/profile-page.js');
  const hubsCss = read(root, 'assets/css/eon-hubs.css');
  const vaultCss = read(root, 'assets/css/eon-vault-v2.css');

  const requiredNeedles = [
    [profileHtml, 'data-preference-target="profile-general"', 'profile-nav-targets-missing'],
    [profileHtml, 'data-preference-toggle="profile-account-backup"', 'profile-accordion-toggle-missing'],
    [profileHtml, 'Learn why backup stays separate', 'profile-boundary-disclosure-missing'],
    [profileHtml, 'data-preference-active="true"', 'profile-default-selected-panel-missing'],
    [profileJs, 'function setActivePreferencePanel', 'profile-selected-panel-controller-missing'],
    [profileJs, "window.matchMedia('(min-width: 961px)').matches", 'profile-mobile-accordion-branch-missing'],
    [hubsCss, '.eon-preferences-section[data-preference-active="false"]{display:none', 'profile-desktop-selected-panel-css-missing'],
    [hubsCss, '.eon-preferences-section[data-preference-active="false"]{display:block', 'profile-mobile-accordion-css-missing'],
    [capsuleHtml, 'Learn why one Capsule is the recovery file', 'capsule-learn-why-disclosure-missing'],
    [capsuleHtml, 'data-eon-capsule-card="google-drive"', 'capsule-google-drive-card-missing'],
    [capsuleHtml, 'Advanced recovery', 'capsule-advanced-recovery-heading-missing'],
    [capsuleHtml, 'Inspect-first restore rules', 'capsule-inspect-first-rules-missing'],
    [capsuleHtml, 'Provider keys, Vault recovery material, wallets, payments, OAuth sessions, rewards/referrals, raw media, model files, caches, and unknown browser storage stay outside the Capsule.', 'capsule-exclusion-copy-missing'],
    [vaultCss, '.eon-capsule-primary-grid', 'capsule-primary-grid-css-missing'],
    [vaultCss, '.eon-capsule-disclosure', 'capsule-disclosure-css-missing'],
    [vaultCss, '.eon-capsule-advanced-grid', 'capsule-advanced-grid-css-missing']
  ];
  for (const [source, needle, issue] of requiredNeedles) if (!source.includes(needle)) issues.push(issue);

  if (!/Google Drive backup[\s\S]*Optional, separate consent, and collapsed by default\./.test(capsuleHtml)) {
    issues.push('capsule-google-drive-collapsed-summary-copy-missing');
  }
  if (!/Create one encrypted Capsule[\s\S]*Restore a Capsule/.test(capsuleHtml)) {
    issues.push('capsule-primary-actions-order-missing');
  }

  return Object.freeze({
    wave: W537_CONSUMER_UX_COMPRESSION_CONTRACT.wave,
    schema: W537_CONSUMER_UX_COMPRESSION_CONTRACT.schema,
    sourceOnly: true,
    browserEvidence: 'not-proven',
    ok: issues.length === 0,
    checked: REQUIRED,
    issues: Object.freeze(issues.sort())
  });
}

function main() {
  const result = inspectW537ConsumerUxCompression();
  const target = path.join(ROOT, 'tmp', 'w537-consumer-ux-compression-gate.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) throw new Error(`W537 consumer UX compression source gate failed:\n${result.issues.map((issue) => `- ${issue}`).join('\n')}`);
  console.log('W537 consumer UX compression source gate passed. This receipt is source-only and does not prove production, Google Drive consent, or physical-device rendering.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
