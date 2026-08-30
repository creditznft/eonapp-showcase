#!/usr/bin/env node
/** W374 — source gate for optional Google OAuth Pages Functions. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W374_GOOGLE_OAUTH_PAGES_FUNCTIONS_CONTRACT } from '../config/w374-google-oauth-pages-functions-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function runW374GoogleOauthPagesFunctionsGate(root = ROOT) {
  const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
  const errors = [];
  const check = (value, message) => { if (!value) errors.push(message); };
  const contract = W374_GOOGLE_OAUTH_PAGES_FUNCTIONS_CONTRACT;

  for (const relative of contract.requiredFiles) check(fs.existsSync(path.join(root, relative)), `W374 missing required file: ${relative}`);
  const auth = read('functions/_shared/eon-auth.js');
  const start = read('functions/api/auth/google/start.js');
  const callback = read('functions/api/auth/google/callback.js');
  const session = read('functions/api/auth/session.js');
  const logout = read('functions/api/auth/logout.js');
  const profile = read('assets/js/profile-page.js');
  const docs = read('docs/W374_GOOGLE_OAUTH_PAGES_FUNCTIONS_RUNBOOK_2026-06-26.md');
  const cloudflarePrompt = read('docs/CLOUDFLARE_AI_GOOGLE_IDENTITY_SETUP_PROMPT_2026-06-26.md');

  for (const name of contract.requiredEnvironmentNames) check(`${auth}\n${docs}\n${cloudflarePrompt}`.includes(name), `W374 environment/binding name missing: ${name}`);
  for (const marker of contract.requiredSecurityMarkers) check(`${auth}\n${start}\n${callback}`.includes(marker), `W374 OAuth security marker missing: ${marker}`);
  check(start.includes("scope', 'openid email profile"), 'W374 must request identity-only scopes.');
  check(!/drive|gmail|calendar|contacts|youtube/i.test(start), 'W374 OAuth start must not request Google product scopes.');
  check(callback.includes('exchangeGoogleCode') && callback.includes('verifyGoogleIdToken') && callback.includes('sameState'), 'W374 callback must exchange code only server-side and verify token/state.');
  check(session.includes('publicAuthStatus') && !/session\.accountId|identity_ref_hmac|id_token|access_token|refresh_token/.test(session), 'W374 session endpoint must expose display-safe status only.');
  check(logout.includes('enforceSameOriginMutation') && logout.includes('clearSessionCookie'), 'W374 logout must be same-origin and clear the session cookie.');
  check(!/console\.(log|debug|info)|GOOGLE_OAUTH_CLIENT_SECRET/.test(profile), 'W374 browser profile code must not contain a client secret or debug output.');
  for (const pattern of contract.forbiddenBrowserPatterns) check(!profile.includes(pattern), `W374 forbidden browser OAuth pattern found: ${pattern}`);
  check(auth.includes('automaticCloudBackup: false') && auth.includes('automaticCrossDeviceSync: false'), 'W374 must preserve no-cloud-backup truth.');
  check(cloudflarePrompt.includes('EON_IDENTITY_DB') && cloudflarePrompt.includes('eonapp-identity-preview') && cloudflarePrompt.includes('eonapp-identity-prod'), 'W374 Cloudflare prompt must keep Preview and Production identity data separated.');
  check(!/client secret\s*[:=]\s*[A-Za-z0-9_-]{20,}/i.test(`${docs}\n${cloudflarePrompt}`), 'W374 docs must not embed a credential value.');

  return Object.freeze({
    schema: 'eonapp.w374.google-oauth-pages-functions-gate.v1',
    ok: errors.length === 0,
    sourceOnly: true,
    liveOAuthConfigured: false,
    requiredGoogleScope: 'openid email profile',
    guestModeAvailable: true,
    errors
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW374GoogleOauthPagesFunctionsGate();
  fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'artifacts', 'W374_GOOGLE_OAUTH_PAGES_FUNCTIONS_REPORT_2026-06-26.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}
