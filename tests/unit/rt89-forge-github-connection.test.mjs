import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEonForgeGitHubAuthorizeUrl,
  connectEonForgeGitHubAccount,
  createEonForgeGitHubFlow,
  disconnectEonForgeGitHub,
  getEonForgeGitHubAccessToken,
  getEonForgeGitHubConnectionConfig,
  getEonForgeGitHubConnectionTruth,
  readEonForgeGitHubConnection,
  readEonForgeGitHubFlow
} from '../../functions/_shared/eon-forge-github-connection.js';

const USER_TOKEN = ['ghu','abcdefghijklmnopqrstuvwxyz123456'].join('_');
const REFRESH_TOKEN = ['ghr','abcdefghijklmnopqrstuvwxyz123456'].join('_');
function fakeDb() {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (sql.startsWith('INSERT INTO eon_github_forge_connections')) {
                const [connectionId, accountRef, providerAccountId, providerLogin, envelope, tokenExpiresAt, refreshExpiresAt, status, createdAt, updatedAt] = args;
                const existing = rows.get(accountRef);
                rows.set(accountRef, {
                  connection_id: existing?.connection_id || connectionId,
                  provider_account_id: providerAccountId,
                  provider_login: providerLogin,
                  credential_envelope: envelope,
                  token_expires_at: tokenExpiresAt,
                  refresh_expires_at: refreshExpiresAt,
                  status,
                  created_at: existing?.created_at || createdAt,
                  updated_at: updatedAt,
                  revoked_at: null
                });
                return { success: true };
              }
              if (sql.startsWith('UPDATE eon_github_forge_connections SET credential_envelope=')) {
                const [envelope, tokenExpiresAt, refreshExpiresAt, updatedAt, accountRef] = args;
                const row = rows.get(accountRef);
                if (row?.status === 'connected') Object.assign(row, { credential_envelope: envelope, token_expires_at: tokenExpiresAt, refresh_expires_at: refreshExpiresAt, updated_at: updatedAt });
                return { success: true };
              }
              if (sql.startsWith("UPDATE eon_github_forge_connections SET status='revoked'")) {
                const [revokedAt, updatedAt, accountRef] = args;
                const row = rows.get(accountRef);
                if (row) Object.assign(row, { status: 'revoked', credential_envelope: '', revoked_at: revokedAt, updated_at: updatedAt });
                return { success: true };
              }
              throw new Error(`unexpected-run-sql:${sql}`);
            },
            async first() {
              if (!sql.startsWith('SELECT connection_id,provider_account_id')) throw new Error(`unexpected-first-sql:${sql}`);
              const [accountRef] = args;
              const row = rows.get(accountRef);
              return row?.status === 'connected' ? { ...row } : null;
            }
          };
        }
      };
    }
  };
}

function configured(db = fakeDb()) {
  const request = new Request('https://eonapp.ch/api/forge/github/status');
  const env = {
    APP_ORIGIN: 'https://eonapp.ch',
    EON_FORGE_GITHUB_ROLLOUT: 'testing',
    GITHUB_APP_CLIENT_ID: 'Iv23abcdefghijklmnop',
    GITHUB_APP_SLUG: 'eonapp-forge-test',
    GITHUB_APP_CLIENT_SECRET: 'client-secret-abcdefghijklmnopqrstuvwxyz',
    EON_GITHUB_FLOW_SIGNING_KEY: 'flow-signing-key-abcdefghijklmnopqrstuvwxyz-123456',
    EON_GITHUB_TOKEN_ENCRYPTION_KEY: 'encryption-key-abcdefghijklmnopqrstuvwxyz-123456',
    EON_CONNECTORS_DB: db,
    EON_ACTIONS_DB: { prepare() { throw new Error('not-used'); } }
  };
  return { db, request, env, config: getEonForgeGitHubConnectionConfig(request, env) };
}

function oauthFetch({ accessToken = USER_TOKEN, refreshToken = REFRESH_TOKEN, user = { login: 'acme', id: 42 } } = {}) {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('/login/oauth/access_token')) return new Response(JSON.stringify({ access_token: accessToken, expires_in: 28800, refresh_token: refreshToken, refresh_token_expires_in: 15811200 }), { status: 200, headers: { 'content-type': 'application/json' } });
    if (String(url) === 'https://api.github.com/user') return new Response(JSON.stringify(user), { status: 200, headers: { 'content-type': 'application/json' } });
    throw new Error(`unexpected-fetch:${url}`);
  };
  return { fetchImpl, calls };
}

test('RT89 GitHub connection fails closed unless exact HTTPS origin, dedicated DBs and secrets are configured', () => {
  const db = fakeDb();
  const bad = getEonForgeGitHubConnectionConfig(new Request('https://preview.example/api/forge/github/status'), {
    APP_ORIGIN: 'https://eonapp.ch', EON_FORGE_GITHUB_ROLLOUT: 'production', GITHUB_APP_CLIENT_ID: 'x', GITHUB_APP_CLIENT_SECRET: 'short', EON_CONNECTORS_DB: db
  });
  assert.equal(bad.configured, false);
  assert.deepEqual(getEonForgeGitHubConnectionTruth(bad), {
    schema: 'eonapp.forge.github-connection.rt89.v1', available: false, rollout: 'disabled', githubAppUserToken: true,
    patPasteRequired: false, serverEncryptedCustody: true, browserTokenExposure: false, sameOriginMutationRequired: true,
    dedicatedConnectorDb: true, dedicatedActionDb: true
  });
  const { config } = configured(db);
  assert.equal(config.configured, true);
  assert.equal(config.connectorsDb, db);
  assert.equal(config.appSlug, 'eonapp-forge-test');
});

test('RT89 GitHub OAuth flow is signed, state-bound, account-bound by caller and uses the official GitHub authorize endpoint', async () => {
  const { config } = configured();
  const created = await createEonForgeGitHubFlow(config, 'acct-1');
  assert.match(created.cookie, /; Path=\/; Secure; HttpOnly; SameSite=Lax;/);
  assert.doesNotMatch(created.cookie, /; Domain=/i);
  const request = new Request('https://eonapp.ch/api/forge/github/callback', { headers: { cookie: created.cookie.split(';')[0] } });
  const flow = await readEonForgeGitHubFlow(config, request, created.flow.state);
  assert.equal(flow.accountId, 'acct-1');
  await assert.rejects(() => readEonForgeGitHubFlow(config, request, 'wrong-state'), /github-flow-state-invalid/);
  const tamperedCookie = created.cookie.split(';')[0].replace(/.$/, (value) => value === 'a' ? 'b' : 'a');
  await assert.rejects(() => readEonForgeGitHubFlow(config, new Request(request.url, { headers: { cookie: tamperedCookie } }), created.flow.state), /github-flow-signature-invalid/);
  const url = new URL(buildEonForgeGitHubAuthorizeUrl(config, created.flow.state));
  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.pathname, '/login/oauth/authorize');
  assert.equal(url.searchParams.get('redirect_uri'), 'https://eonapp.ch/api/forge/github/callback');
  assert.equal(url.searchParams.get('state'), created.flow.state);
});

test('RT89 GitHub connection encrypts server-custodied user/refresh tokens and never exposes them in public connection metadata', async () => {
  const { config, db } = configured();
  const mock = oauthFetch();
  const result = await connectEonForgeGitHubAccount(config, 'acct-1', 'oauth-code', { fetchImpl: mock.fetchImpl, now: 1_000_000 });
  assert.equal(result.connected, true);
  assert.equal(result.providerLogin, 'acme');
  const row = db.rows.get('acct-1');
  assert.ok(row);
  assert.doesNotMatch(row.credential_envelope, /ghu_|ghr_|abcdefghijklmnopqrstuvwxyz123456/);
  const parsedEnvelope = JSON.parse(row.credential_envelope);
  assert.equal(parsedEnvelope.alg, 'AES-GCM-256');
  const publicConnection = await readEonForgeGitHubConnection(config, 'acct-1');
  assert.equal(publicConnection.providerLogin, 'acme');
  assert.equal('accessToken' in publicConnection, false);
  assert.equal('refreshToken' in publicConnection, false);
  const serverToken = await getEonForgeGitHubAccessToken(config, 'acct-1', { fetchImpl: mock.fetchImpl, now: 1_000_100 });
  assert.match(serverToken.accessToken, /^ghu_/);
  assert.equal(serverToken.providerLogin, 'acme');
});

test('RT89 disconnect revokes remotely when possible, clears encrypted local custody regardless, and returns only bounded booleans', async () => {
  const { config, db } = configured();
  const connectMock = oauthFetch();
  await connectEonForgeGitHubAccount(config, 'acct-1', 'oauth-code', { fetchImpl: connectMock.fetchImpl, now: 2_000_000 });
  let revokeBody = '';
  const result = await disconnectEonForgeGitHub(config, 'acct-1', { fetchImpl: async (url, options = {}) => {
    assert.match(String(url), /\/applications\/Iv23abcdefghijklmnop\/token$/);
    assert.equal(options.method, 'DELETE');
    assert.match(String(options.headers.authorization), /^Basic /);
    revokeBody = String(options.body || '');
    return new Response(null, { status: 204 });
  } });
  assert.equal(result.remoteTokenRevoked, true);
  assert.equal(result.localCredentialDeleted, true);
  assert.doesNotMatch(JSON.stringify(result), /ghu_|ghr_/);
  assert.match(revokeBody, /access_token/);
  assert.equal(db.rows.get('acct-1').credential_envelope, '');
  assert.equal(db.rows.get('acct-1').status, 'revoked');
  assert.equal(await readEonForgeGitHubConnection(config, 'acct-1'), null);
});
