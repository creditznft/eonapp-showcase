#!/usr/bin/env node
/** W306 + W364A — preserves guest-first local work while allowing only a planned optional Google identity. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W306_LOCAL_FIRST_BOUNDARY_CONTRACT } from '../config/w306-local-first-boundary-contract.mjs';
import { EON_LOCAL_FIRST_BOUNDARY, isLocalFirstBoundarySatisfied } from '../assets/js/local-first/local-first-boundary.js';
import { getCapabilityTruth } from '../assets/js/capabilities/capability-truth-registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (root, relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function runW306LocalFirstBoundaryGate(root = ROOT) {
  const errors = [];
  const contract = W306_LOCAL_FIRST_BOUNDARY_CONTRACT;
  for (const relative of contract.requiredFiles) if (!fs.existsSync(path.join(root, relative))) errors.push(`Required W306 file missing: ${relative}`);
  if (!isLocalFirstBoundarySatisfied(EON_LOCAL_FIRST_BOUNDARY)) errors.push('The exported guest-first local-data boundary policy is incomplete.');

  const retired = read(root, 'assets/js/utils/eon-accounts-manager.js');
  if (!retired.includes(contract.retiredModuleMarker)) errors.push('Legacy account module does not declare its retired import fence.');
  for (const pattern of ['window.google.accounts', 'sessionStorage', 'localStorage', 'startGoogleSignIn', 'window.EONAccountsManager']) {
    if (retired.includes(pattern)) errors.push(`Retired account module still contains forbidden active behavior: ${pattern}`);
  }

  const onboarding = read(root, 'assets/js/onboarding-page.js');
  for (const pattern of ['ob-google-connect-btn', 'startGoogleSignIn', 'EONAccountsManager']) {
    if (onboarding.includes(pattern)) errors.push(`Onboarding still exposes retired Google identity behavior: ${pattern}`);
  }
  if (!onboarding.includes("getLocalFirstBoundaryNotice('geminiByok')")) errors.push('Onboarding must clarify Gemini BYOK versus EONAPP identity.');

  const pwa = read(root, 'assets/js/eon-pwa-manager.js');
  const localExport = read(root, 'assets/js/local-first/eon-local-encrypted-export.js');
  const profile = read(root, 'profile.html');
  const account = read(root, 'assets/js/account/eon-account-foundation.js');
  for (const [label, source] of [['PWA', pwa], ['backup', localExport]]) {
    if (/future explicit encrypted backup or account[- ]local export service/i.test(source)) errors.push(`${label} still advertises a cloud account-local export path.`);
  }
  if (!pwa.includes("getLocalFirstBoundaryNotice('pwa')")) errors.push('PWA copy must come from the local-first boundary contract.');
  if (!localExport.includes("getLocalFirstBoundaryNotice('backup')")) errors.push('Backup copy must come from the local-first boundary contract.');
  for (const phrase of contract.localFirstLanguage) {
    if (!`${profile}\n${account}`.toLowerCase().includes(phrase.toLowerCase())) errors.push(`Profile/account copy must include required data-custody language: ${phrase}`);
  }
  if (!profile.includes('id="eon-profile-account-backup-warning"')) errors.push('Profile must show the account-to-backup warning near optional identity language.');
  for (const forbidden of ['window.google.accounts', 'GOOGLE_OAUTH_CLIENT_SECRET', 'googleOAuthClientSecret', 'fetch(']) {
    if (account.includes(forbidden)) errors.push(`Account foundation must remain pre-auth and local-only: ${forbidden}`);
  }

  const manifest = JSON.parse(read(root, 'config/w303-legacy-salvage-manifest.json'));
  const manifestById = new Map((manifest.records || []).map((record) => [record.id, record]));
  for (const id of contract.requiredLegacyIds) {
    const record = manifestById.get(id);
    if (!record) errors.push(`Legacy manifest missing W306 record: ${id}`);
    else if (id === 'eon-accounts-manager' && record.classification !== 'archive-forever') errors.push('Legacy account manager must be archive-forever.');
  }

  for (const id of contract.requiredCapabilityIds) {
    const record = getCapabilityTruth(id);
    if (!record) errors.push(`Capability truth registry missing ${id}.`);
    else if (id.startsWith('legacy-') && record.lifecycle !== 'retired') errors.push(`${id} must remain retired.`);
    else if (id === 'google-identity-sign-in' && record.lifecycle !== 'planned') errors.push('Optional Google identity must remain planned until server-side proof exists.');
    else if (id === 'cloud-workspace-control-plane' && record.lifecycle !== 'blocked') errors.push('Cloud workspace control plane must remain blocked.');
  }

  const activeSources = [
    'assets/js/onboarding-page.js',
    'assets/js/eon-pwa-manager.js',
    'assets/js/local-first/eon-local-encrypted-export.js',
    'assets/js/chat/eonbot-command-hub.js',
    'assets/js/eon-workspace-pages.js',
    'assets/js/eon-automations-page.js',
    'assets/js/city/city-prepared-action.js',
    'assets/js/account/eon-account-foundation.js'
  ].map((relative) => `${relative}\n${read(root, relative)}`).join('\n');
  for (const pattern of contract.forbiddenActivePatterns) if (activeSources.includes(pattern)) errors.push(`Active local-first source contains forbidden identity/account pattern: ${pattern}`);

  return Object.freeze({
    schema: 'eonapp.w306.local-first-boundary-gate.v2',
    ok: errors.length === 0,
    errors,
    guestFirst: true,
    optionalGoogleIdentity: 'planned-only',
    cloudWorkspaceControlPlane: false,
    automaticCrossDeviceSync: false
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW306LocalFirstBoundaryGate();
  if (!report.ok) console.error(JSON.stringify(report, null, 2));
  else console.log('W306 local-first boundary gate passed: guest-first, optional Google identity planned only, encrypted portable backup required for local recovery.');
  process.exitCode = report.ok ? 0 : 1;
}
