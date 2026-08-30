import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CITY_ACCESS_SCHEMA,
  buildEonCityAccessDecision,
  normalizeEonCityAccessMode
} from '../../config/w554-eon-city-access-project-portals-contract.mjs';
import { isEonCityOwnerWorldReview, onRequestGet as cityAccess } from '../../functions/api/city/access.js';
import { createProject, loadProjects } from '../../assets/js/utils/eon-workspace-store.js';
import { createEonProjectDistrictRegistry } from '../../assets/js/city/eon-city-project-district-manifest.js';
import { deriveEonCityMissionState, listEonCityProjectPortalCandidates } from '../../assets/js/city/eon-city-project-district-workspace.js';

function memoryStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); }
  };
}

test('W649B normalizes every access mode to authenticated play and fails closed without a signed-in identity', () => {
  assert.equal(normalizeEonCityAccessMode('AUTHENTICATED-PLAY'), 'authenticated-play');
  assert.equal(normalizeEonCityAccessMode('public-preview'), 'authenticated-play');
  assert.equal(normalizeEonCityAccessMode('unknown'), 'authenticated-play');
  const signedIn = buildEonCityAccessDecision({ mode: 'authenticated-play', identityAvailable: true, signedIn: true });
  assert.equal(signedIn.schema, EON_CITY_ACCESS_SCHEMA);
  assert.equal(signedIn.accessState, 'authorized');
  assert.equal(signedIn.canBootFullCity, true);
  assert.equal(signedIn.heavyRuntimeImportAllowed, true);
  assert.equal(signedIn.staticPortalOnly, false);
  assert.equal(signedIn.publicPreviewAvailable, false);
  const signedOut = buildEonCityAccessDecision({ mode: 'public-preview', identityAvailable: true, signedIn: false });
  assert.equal(signedOut.accessState, 'signed-out');
  assert.equal(signedOut.canBootFullCity, false);
  assert.equal(signedOut.heavyRuntimeImportAllowed, false);
  assert.equal(signedOut.staticPortalOnly, true);
  assert.equal(signedOut.publicPreviewAvailable, false);
  const unavailable = buildEonCityAccessDecision({ identityAvailable: false, signedIn: true });
  assert.equal(unavailable.accessState, 'identity-unavailable');
  assert.equal(unavailable.canBootFullCity, false);
});

test('W554 City access endpoint exposes safe state only and fails closed when identity is unavailable', async () => {
  const response = await cityAccess({ request: new Request('https://eonapp.ch/api/city/access'), env: { EON_CITY_ACCESS_MODE: 'authenticated-play' } });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.schema, EON_CITY_ACCESS_SCHEMA);
  assert.equal(payload.canBootFullCity, false);
  assert.equal(payload.heavyRuntimeImportAllowed, false);
  assert.equal(payload.identity.available, false);
  assert.doesNotMatch(JSON.stringify(payload), /\"(?:accountId|email|access_token|refresh_token|client_secret|promptText|projectId)\"\s*:/i);
});

test('W554 owner-world review is a fail-closed server allowlist decision', () => {
  assert.equal(isEonCityOwnerWorldReview({}, { accountId: 'owner-a' }), false);
  assert.equal(isEonCityOwnerWorldReview({ EON_CITY_OWNER_REVIEW_ACCOUNT_IDS: 'owner-a, owner-b' }, null), false);
  assert.equal(isEonCityOwnerWorldReview({ EON_CITY_OWNER_REVIEW_ACCOUNT_IDS: 'owner-a, owner-b' }, { accountId: 'owner-a' }), true);
  assert.equal(isEonCityOwnerWorldReview({ EON_CITY_OWNER_REVIEW_ACCOUNT_IDS: 'owner-a' }, { accountId: 'owner-b' }), false);
});

test('W554 links a real local Project to a private City portal without leaking project content into the render plan', () => {
  const storage = memoryStorage();
  const project = createProject({
    title: 'Portfolio launch',
    summary: 'Private campaign notes must stay in the workspace.',
    tasks: [{ title: 'Publish the first page', status: 'todo' }]
  }, { storage });
  const candidates = listEonCityProjectPortalCandidates(loadProjects({ storage }));
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].id, project.id);
  assert.equal(candidates[0].title, 'Portfolio launch');
  assert.equal(candidates[0].openTaskCount, 1);
  assert.equal(deriveEonCityMissionState('active'), 'focus');
  assert.equal(deriveEonCityMissionState('paused'), 'paused');
  assert.equal(deriveEonCityMissionState('complete'), 'completed');

  const registry = createEonProjectDistrictRegistry({ storage, now: () => 1700000000000 });
  const created = registry.create({
    projectReference: project.id,
    displayLabel: 'Portfolio launch portal',
    paletteId: 'forge',
    missionState: 'focus',
    approvedTaskCards: []
  }, { explicitUserAction: true, explicitCitySafeLabelApproval: true });
  assert.equal(created.ok, true);
  const text = JSON.stringify(created.renderPlan);
  assert.doesNotMatch(text, new RegExp(project.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(text, /Private campaign notes|Publish the first page/);
  assert.equal(created.renderPlan.projectReferenceExposed, false);
  assert.equal(created.renderPlan.promptExposed, false);
  assert.equal(created.renderPlan.secretExposed, false);
});

import { onRequest as privateCityAssetGate } from '../../functions/city-private/_middleware.js';
import { createSession } from '../../functions/_shared/eon-auth.js';

function memoryIdentityDb() {
  const sessions = new Map();
  return {
    prepare(sql = '') {
      const statement = String(sql);
      return {
        bind(...args) {
          return {
            async run() {
              if (statement.includes('INSERT INTO eon_identity_sessions')) {
                sessions.set(String(args[0]), { session_id_hmac: String(args[0]), account_id: String(args[1]), expires_at: Number(args[3]) });
              }
              if (statement.includes('DELETE FROM eon_identity_sessions WHERE session_id_hmac')) sessions.delete(String(args[0]));
              return { success: true };
            },
            async first() {
              if (statement.includes('FROM eon_schema_authority')) return { domain: 'identity', schema_version: 6, migration_name: '0006_notification_policy_authority.sql', applied_at: 1 };
              if (statement.includes('SELECT session_id_hmac')) return sessions.get(String(args[0])) || null;
              return null;
            }
          };
        }
      };
    }
  };
}

function identityEnv(database) {
  return {
    APP_ORIGIN: 'https://eonapp.ch',
    EON_AUTH_ROLLOUT: 'testing',
    GOOGLE_REDIRECT_URI: 'https://eonapp.ch/api/auth/google/callback',
    GOOGLE_OAUTH_CLIENT_ID: 'test-client.apps.googleusercontent.com',
    GOOGLE_OAUTH_CLIENT_SECRET: 'test-client-secret',
    EON_AUTH_SUBJECT_PEPPER: 'test-subject-pepper',
    EON_SESSION_SIGNING_KEY: 'test-session-key',
    EON_OAUTH_FLOW_SIGNING_KEY: 'test-flow-key',
    EON_IDENTITY_DB: database
  };
}

test('W554 emits owner review only for the signed-in server-allowlisted account', async () => {
  const database = memoryIdentityDb();
  const env = {
    ...identityEnv(database),
    EON_CITY_OWNER_REVIEW_ACCOUNT_IDS: 'owner-review-account'
  };
  const session = await createSession({ database, sessionKey: env.EON_SESSION_SIGNING_KEY }, 'owner-review-account');
  const response = await cityAccess({
    request: new Request('https://eonapp.ch/api/city/access', {
      headers: { cookie: `__Host-eon_session=${session.sessionId}` }
    }),
    env
  });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.ownerWorldReview, true);
  assert.doesNotMatch(JSON.stringify(payload), /owner-review-account/);
});

test('W554B private City asset middleware fails closed without identity configuration or a safe method', async () => {
  let called = false;
  const unconfigured = await privateCityAssetGate({
    request: new Request('https://eonapp.ch/city-private/w554-access-check.json'),
    env: {},
    next: async () => { called = true; return new Response('unexpected'); }
  });
  assert.equal(unconfigured.status, 503);
  assert.equal(called, false);
  assert.equal(unconfigured.headers.get('cache-control'), 'no-store, max-age=0');
  const wrongMethod = await privateCityAssetGate({
    request: new Request('https://eonapp.ch/city-private/w554-access-check.json', { method: 'POST' }),
    env: {},
    next: async () => new Response('unexpected')
  });
  assert.equal(wrongMethod.status, 405);
  assert.doesNotMatch(await wrongMethod.text(), /client_secret|account_id|email|project/i);
});

test('W554B private City asset middleware allows only an existing identity session and isolates the response cache', async () => {
  const database = memoryIdentityDb();
  const env = identityEnv(database);
  const session = await createSession({ database, sessionKey: env.EON_SESSION_SIGNING_KEY }, 'account_test');
  let nextCalls = 0;
  const response = await privateCityAssetGate({
    request: new Request('https://eonapp.ch/city-private/w554-access-check.json', {
      headers: { cookie: `__Host-eon_session=${session.sessionId}` }
    }),
    env,
    next: async () => { nextCalls += 1; return new Response('{"fixture":true}', { headers: { 'content-type': 'application/json', vary: 'Accept-Encoding' } }); }
  });
  assert.equal(response.status, 200);
  assert.equal(nextCalls, 1);
  assert.equal(response.headers.get('x-eon-city-asset-gate'), 'identity-session');
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.match(response.headers.get('vary') || '', /Cookie/);
  assert.equal(await response.text(), '{"fixture":true}');
});
