import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import {
  W476_API_NEGATIVE_TEST_MATRIX,
  W476_API_SURFACE_CONTRACT,
  getW476ApiSurface,
  isW476ApiMethodAllowed,
  validateW476ApiSurfaceContract
} from '../../config/w476-api-surface-contract.mjs';
import { inspectW476ApiSurfaceContract } from '../../scripts/w476-api-surface-contract-gate.mjs';
import { onRequestPost as deleteRequest } from '../../functions/api/account/delete-request.js';
import { onRequestPost as actionExecute } from '../../functions/api/actions/execute.js';
import { onRequestPost as actionPrepare } from '../../functions/api/actions/prepare.js';
import { onRequestGet as actionStatus } from '../../functions/api/actions/status.js';
import { onRequestGet as authSession } from '../../functions/api/auth/session.js';
import { onRequestPost as logout } from '../../functions/api/auth/logout.js';
import { onRequestGet as connectorStatus } from '../../functions/api/connectors/status.js';
import { onRequestGet as deploymentStatus } from '../../functions/api/deployments/status.js';
import { onRequestPost as offlineCapability } from '../../functions/api/offline/capability.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const app = (path, init = {}) => new Request(`https://eonapp.ch${path}`, init);
const configuredIdentityEnvironment = Object.freeze({
  APP_ORIGIN: 'https://eonapp.ch',
  GOOGLE_REDIRECT_URI: 'https://eonapp.ch/api/auth/google/callback',
  EON_AUTH_ROLLOUT: 'testing',
  GOOGLE_OAUTH_CLIENT_ID: 'test-client.apps.googleusercontent.com',
  GOOGLE_OAUTH_CLIENT_SECRET: 'not-a-real-secret',
  EON_AUTH_SUBJECT_PEPPER: 'not-a-real-pepper',
  EON_SESSION_SIGNING_KEY: 'not-a-real-session-key',
  EON_OAUTH_FLOW_SIGNING_KEY: 'not-a-real-flow-key',
  EON_IDENTITY_DB: { prepare() { return { bind() { return { async first() { return null; }, async run() { return { success: true }; } }; } }; } }
});

test('W476-A6 API surface inventory is complete, unique and explicitly fail-closed', () => {
  assert.deepEqual(validateW476ApiSurfaceContract(), []);
  assert.equal(W476_API_SURFACE_CONTRACT.surfaces.length, 12);
  assert.ok(W476_API_NEGATIVE_TEST_MATRIX.length >= 18);
  assert.equal(W476_API_SURFACE_CONTRACT.productionApproved, false);
  assert.equal(getW476ApiSurface('/csp-report')?.state, 'active-privacy-bounded-telemetry');
  assert.equal(getW476ApiSurface('/api/actions/execute')?.state, 'hard-disabled');
  for (const entry of W476_API_SURFACE_CONTRACT.surfaces) {
    assert.ok(entry.methods.length >= 1, entry.route);
    assert.ok(entry.negativeCases.length >= 1, entry.route);
    assert.ok(entry.sensitiveData.length >= 16, entry.route);
    for (const method of entry.methods) assert.equal(isW476ApiMethodAllowed(entry.route, method), true);
    assert.equal(isW476ApiMethodAllowed(entry.route, 'DELETE'), false);
  }
});

test('W476-A6 source gate maps only the retained Pages Function handlers and materializes evidence', () => {
  const result = inspectW476ApiSurfaceContract();
  assert.equal(result.ok, true, result.issues.join('\n'));
  assert.equal(result.functionCount, 12);
  assert.ok(result.negativeCaseCount >= 18);
});

test('W476-A6 negative endpoint matrix proves disabled and unconfigured routes fail without privileged output', async () => {
  const disabled = await Promise.all([
    actionExecute(), actionPrepare()
  ]);
  for (const response of disabled) {
    assert.equal(response.status, 503);
    const payload = await response.json();
    assert.equal(payload.ok, false);
    assert.doesNotMatch(JSON.stringify(payload), /token|secret|key|accountId|email|wallet|payment/i);
  }

  const publicResponses = await Promise.all([
    actionStatus(), connectorStatus(), deploymentStatus(), authSession({ request: app('/api/auth/session'), env: {} })
  ]);
  for (const response of publicResponses) {
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.doesNotMatch(JSON.stringify(payload), /access_token|refresh_token|client_secret|accountId|identity_ref|sessionId/i);
  }


});

test('W476-A6 same-origin mutations reject a hostile origin before a mutation can run', async () => {
  const hostileHeaders = { origin: 'https://attacker.invalid', 'sec-fetch-site': 'cross-site', 'content-type': 'application/json' };
  const signedOut = await logout({ request: app('/api/auth/logout', { method: 'POST', headers: hostileHeaders, body: '{}' }), env: configuredIdentityEnvironment });
  assert.equal(signedOut.status, 403);
  assert.equal((await signedOut.json()).error, 'origin_check_failed');

  const deletion = await deleteRequest({ request: app('/api/account/delete-request', { method: 'POST', headers: hostileHeaders, body: JSON.stringify({ confirm: 'DELETE_EON_ACCOUNT' }) }), env: configuredIdentityEnvironment });
  assert.equal(deletion.status, 403);
  assert.equal((await deletion.json()).error, 'origin_check_failed');
});


test('W476-A6 offline capability endpoint fails closed before issuing any local-offline authority', async () => {
  const body = JSON.stringify({
    installationId: 'offline-1234567890abcdef',
    manifestDigest: 'a'.repeat(64),
    packs: ['core', 'city']
  });

  const unavailable = await offlineCapability({
    request: app('/api/offline/capability', {
      method: 'POST',
      headers: { origin: 'https://eonapp.ch', 'content-type': 'application/json' },
      body
    }),
    env: {}
  });
  assert.equal(unavailable.status, 503);
  assert.equal((await unavailable.json()).error, 'identity_unavailable');

  const hostile = await offlineCapability({
    request: app('/api/offline/capability', {
      method: 'POST',
      headers: { origin: 'https://attacker.invalid', 'sec-fetch-site': 'cross-site', 'content-type': 'application/json' },
      body
    }),
    env: configuredIdentityEnvironment
  });
  assert.equal(hostile.status, 403);
  assert.equal((await hostile.json()).error, 'same_origin_required');

  const signedOut = await offlineCapability({
    request: app('/api/offline/capability', {
      method: 'POST',
      headers: { origin: 'https://eonapp.ch', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' },
      body
    }),
    env: configuredIdentityEnvironment
  });
  assert.equal(signedOut.status, 401);
  const payload = await signedOut.json();
  assert.equal(payload.error, 'signed_in_required');
  assert.doesNotMatch(JSON.stringify(payload), /account|email|cookie|token|provider|prompt|project|file|wallet|payment/i);
});
