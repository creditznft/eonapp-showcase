#!/usr/bin/env node
/** W374B — verifies optional Google Login is discoverable without becoming a data-backup claim or a guest-mode gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W374B_GOOGLE_IDENTITY_ONBOARDING_SURFACES_CONTRACT } from '../config/w374b-google-identity-onboarding-surfaces-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function runW374BGoogleIdentityOnboardingSurfacesGate(root = ROOT) {
  const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
  const errors = [];
  const check = (value, message) => { if (!value) errors.push(message); };
  const contract = W374B_GOOGLE_IDENTITY_ONBOARDING_SURFACES_CONTRACT;
  for (const file of contract.requiredFiles) check(fs.existsSync(path.join(root, file)), `W374B missing file: ${file}`);
  const browser = [
    read('assets/js/account/eon-identity-onboarding.js'),
    read('assets/js/eon-app-shell.js'),
    read('assets/js/profile-page.js'),
    read('chat.html'), read('assets/js/apps/eon-app-deck-page.js'), read('assets/js/eon-city-portal.js'),
    read('eoncity-3d.html'), read('assets/js/eon-city-play-station.js'), read('realm-studio.html'), read('billing.html')
  ].join('\n');
  const auth = read('functions/_shared/eon-auth.js');
  const callback = read('functions/api/auth/google/callback.js');
  check(browser.includes('Google Login is not a backup'), 'W374B must state the Google Login is not a backup warning on the onboarding surfaces.');
  check(browser.includes('Account &amp; backup') || browser.includes('Account & backup'), 'W374B must expose a visible Account & backup path.');
  check(browser.includes('/capsule'), 'W374B must include a local encrypted backup path.');
  check(browser.includes('Guest') || browser.includes('guest'), 'W374B must preserve visible guest-first use.');
  check(auth.includes("'/chat'") && auth.includes("'/realm-studio'") && auth.includes("'/eoncity/play'"), 'W374B return-to allowlist is missing an onboarding surface.');
  check(callback.includes('authStatusReturnRedirect') && callback.includes('flow.returnTo'), 'W374B must return completed OAuth only to an allowlisted originating surface.');
  for (const token of contract.forbiddenBrowserTokens) check(!browser.includes(token), `W374B browser source must not contain ${token}.`);
  check(!/access_token|refresh_token|id_token/i.test(browser), 'W374B browser onboarding must not expose OAuth token handling.');
  return Object.freeze({ schema: 'eonapp.w374b.google-identity-onboarding-surfaces-gate.v1', ok: errors.length === 0, sourceOnly: true, guestModeAvailable: true, automaticCloudBackup: false, errors });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW374BGoogleIdentityOnboardingSurfacesGate();
  fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'artifacts', 'W374B_GOOGLE_IDENTITY_ONBOARDING_SURFACES_REPORT_2026-06-26.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}
