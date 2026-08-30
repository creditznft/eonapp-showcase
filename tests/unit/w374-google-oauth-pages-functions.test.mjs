import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_AUTH_CONSENT_VERSION,
  getIdentityConfig,
  makeOauthFlow,
  openOauthFlow,
  publicAuthStatus,
  sealOauthFlow
} from '../../functions/_shared/eon-auth.js';
import { onRequestGet as startGoogleOauth } from '../../functions/api/auth/google/start.js';
import { onRequestGet as getAuthSession } from '../../functions/api/auth/session.js';
import { onRequestPost as logout } from '../../functions/api/auth/logout.js';
import { onRequestPost as deleteAccount } from '../../functions/api/account/delete-request.js';
import { runW374GoogleOauthPagesFunctionsGate } from '../../scripts/w374-google-oauth-pages-functions-gate.mjs';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

function createD1Mock() {
  const calls = [];
  const database = {
    calls,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() { calls.push({ type: 'run', sql, args }); return { success: true }; },
            async first() {
              calls.push({ type: 'first', sql, args });
              if (sql.includes('FROM eon_schema_authority')) {
                return { domain: 'identity', schema_version: 6, migration_name: '0006_notification_policy_authority.sql', applied_at: 1 };
              }
              return null;
            }
          };
        }
      };
    },
    async batch(statements) { calls.push({ type: 'batch', count: statements.length }); return []; }
  };
  return database;
}

function configuredEnvironment(overrides = {}) {
  return {
    APP_ORIGIN: 'https://eonapp.ch',
    GOOGLE_REDIRECT_URI: 'https://eonapp.ch/api/auth/google/callback',
    EON_AUTH_ROLLOUT: 'testing',
    GOOGLE_OAUTH_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
    GOOGLE_OAUTH_CLIENT_SECRET: 'server-only-test-secret-never-ship',
    EON_AUTH_SUBJECT_PEPPER: 'subject-pepper-test-only',
    EON_SESSION_SIGNING_KEY: 'session-key-test-only',
    EON_OAUTH_FLOW_SIGNING_KEY: 'flow-key-test-only',
    EON_IDENTITY_DB: createD1Mock(),
    ...overrides
  };
}

function request(path, init = {}) {
  return new Request(`https://eonapp.ch${path}`, init);
}

test('W374 fails closed without the exact production configuration and keeps guest mode usable', () => {
  const missing = getIdentityConfig(request('/api/auth/session'), { APP_ORIGIN: 'https://eonapp.ch' });
  assert.equal(missing.configured, false);
  const status = publicAuthStatus(missing);
  assert.equal(status.available, false);
  assert.equal(status.guestUseAvailable, true);
  assert.equal(status.automaticCloudBackup, false);
  assert.equal(status.automaticCrossDeviceSync, false);
});

test('W374 starts identity-only Google OAuth with PKCE, state, nonce and no secret in the redirect', async () => {
  const env = configuredEnvironment();
  const response = await startGoogleOauth({ request: request('/api/auth/google/start?returnTo=/profile'), env });
  assert.equal(response.status, 302);
  const target = new URL(response.headers.get('location'));
  assert.equal(target.origin, 'https://accounts.google.com');
  assert.equal(target.searchParams.get('scope'), 'openid email profile');
  assert.equal(target.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(target.searchParams.get('state'));
  assert.ok(target.searchParams.get('nonce'));
  assert.ok(target.searchParams.get('code_challenge'));
  assert.doesNotMatch(target.toString(), /server-only-test-secret-never-ship/);
  const cookie = response.headers.get('set-cookie') || '';
  assert.match(cookie, /eon_oauth_flow=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
});

test('W374 seals the short OAuth flow and rejects a tampered state cookie', async () => {
  const env = configuredEnvironment();
  const config = getIdentityConfig(request('/api/auth/google/start'), env);
  const flow = await makeOauthFlow(config, '/profile');
  const sealed = await sealOauthFlow(flow, config.flowKey);
  const reopened = await openOauthFlow(sealed, config.flowKey);
  assert.equal(reopened.state, flow.state);
  assert.equal(reopened.nonce, flow.nonce);
  assert.equal(reopened.returnTo, '/profile');
  await assert.rejects(() => openOauthFlow(`${sealed}x`, config.flowKey));
});

test('W374 exposes only a safe session status and keeps mutations same-origin/account-scoped', async () => {
  const env = configuredEnvironment();
  const sessionResponse = await getAuthSession({ request: request('/api/auth/session'), env });
  const payload = await sessionResponse.json();
  assert.equal(payload.available, true);
  assert.equal(payload.signedIn, false);
  assert.equal(payload.automaticCloudBackup, false);
  assert.doesNotMatch(JSON.stringify(payload), /test-client|server-only-test-secret|accountId|identity_ref|access_token|refresh_token/i);

  const logoutResponse = await logout({ request: request('/api/auth/logout', { method: 'POST', headers: { origin: 'https://eonapp.ch', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' }, body: '{}' }), env });
  assert.equal(logoutResponse.status, 200);
  assert.match(logoutResponse.headers.get('set-cookie') || '', /__Host-eon_session=/);

  const deleted = await deleteAccount({ request: request('/api/account/delete-request', { method: 'POST', headers: { origin: 'https://eonapp.ch', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' }, body: JSON.stringify({ confirm: 'DELETE_EON_ACCOUNT' }) }), env });
  assert.equal(deleted.status, 401);
  const wrongOrigin = await logout({ request: request('/api/auth/logout', { method: 'POST', headers: { origin: 'https://wrong.example', 'content-type': 'application/json' }, body: '{}' }), env });
  assert.equal(wrongOrigin.status, 403);
});

test('W374 browser and D1 sources keep credentials and local work out of the identity implementation', () => {
  const profile = read('assets/js/profile-page.js');
  const migration = read('identity/migrations/0001_eon_identity.sql');
  const auth = read('functions/_shared/eon-auth.js');
  assert.doesNotMatch(profile, /GOOGLE_OAUTH_CLIENT_SECRET|window\.google\.accounts|google\.accounts\.id/i);
  assert.doesNotMatch(migration, /email\s+TEXT|access_token|refresh_token|chat_text|vault_data|provider_key|card_number/i);
  assert.match(auth, new RegExp(EON_AUTH_CONSENT_VERSION));
  const report = runW374GoogleOauthPagesFunctionsGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
});
