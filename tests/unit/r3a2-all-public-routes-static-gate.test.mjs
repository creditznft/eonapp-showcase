import assert from 'node:assert/strict';
import test from 'node:test';
import { isInternalLocation, isRedirectStatus } from '../../scripts/r3a2-all-public-routes-static-gate.mjs';

test('W260-R3 A2 identifies only valid HTTP redirect statuses', () => {
  assert.equal(isRedirectStatus(301), true);
  assert.equal(isRedirectStatus(308), true);
  assert.equal(isRedirectStatus(200), false);
  assert.equal(isRedirectStatus(404), false);
});

test('W260-R3 A2 keeps all static redirect resolution inside the local origin', () => {
  const origin = 'http://127.0.0.1:4180';
  assert.equal(isInternalLocation('/chat', origin), true);
  assert.equal(isInternalLocation('http://127.0.0.1:4180/chat', origin), true);
  assert.equal(isInternalLocation('https://eonapp.ch/chat', origin), false);
  assert.equal(isInternalLocation('not a url', origin), true);
});
