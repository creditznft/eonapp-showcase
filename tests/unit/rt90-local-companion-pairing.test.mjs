import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEonLocalCompanionPairingManager, isEonLocalApprovalPostAllowed } from '../../tools/eon-local-bridge/pairing-manager.mjs';
import { resolveEonLocalCompanionTrustStorePath } from '../../tools/eon-local-bridge/trusted-browser-manager.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const serverSource = fs.readFileSync(path.join(root, 'tools', 'eon-local-bridge', 'server.mjs'), 'utf8');

test('RT90 Windows trust records use LocalAppData so MSI cleanup matches the runtime', () => {
  const windowsPath = resolveEonLocalCompanionTrustStorePath({ platform: 'win32', localAppData: 'C:\\Users\\Eon\\AppData\\Local', home: 'C:\\Users\\Eon' });
  assert.match(windowsPath.replace(/\\/g, '/'), /AppData\/Local\/EONAPP\/local-companion-trusted-browsers\.json$/);
  const portablePath = resolveEonLocalCompanionTrustStorePath({ platform: 'linux', localAppData: '', home: '/home/eon' });
  assert.equal(portablePath.replace(/\\/g, '/'), '/home/eon/.eonapp/local-companion-trusted-browsers.json');
});

test('RT90 local approval tolerates an omitted embedded-browser Origin only with an exact loopback Referer', () => {
  assert.equal(isEonLocalApprovalPostAllowed({
    host: '127.0.0.1:17565',
    origin: '',
    referer: 'http://127.0.0.1:17565/pair/approve?request=local-request'
  }), true);
  assert.equal(isEonLocalApprovalPostAllowed({
    host: '127.0.0.1:17565',
    origin: 'https://evil.example',
    referer: 'http://127.0.0.1:17565/pair/approve?request=local-request'
  }), false);
  assert.equal(isEonLocalApprovalPostAllowed({
    host: '127.0.0.1:17565',
    origin: '',
    referer: 'https://evil.example/pair/approve'
  }), false);
});

test('RT93 local approval preserves a loopback-only referer for the same-origin approval POST', () => {
  assert.match(serverSource, /Referrer-Policy', 'same-origin'/);
  assert.match(serverSource, /localApprovalPostAllowed/);
});

test('RT90 code-free pairing is origin-bound, approval-gated and token is consumed exactly once', () => {
  let at = 1_700_000_000_000;
  let sequence = 0;
  const manager = createEonLocalCompanionPairingManager({
    now: () => at,
    randomId: () => `request-${++sequence}`,
    randomToken: () => `session-${++sequence}`,
    ttlMs: 90_000
  });
  const created = manager.create('https://eonapp.ch');
  assert.equal(created.ok, true);
  assert.equal(manager.consume(created.requestId, 'https://evil.example').error, 'pair-origin-mismatch');
  assert.equal(manager.consume(created.requestId, 'https://eonapp.ch').pending, true);
  assert.equal(manager.approve(created.requestId).approved, true);
  const paired = manager.consume(created.requestId, 'https://eonapp.ch');
  assert.equal(paired.ok, true);
  assert.equal(paired.approved, true);
  assert.match(paired.token, /^session-/);
  assert.equal(manager.consume(created.requestId, 'https://eonapp.ch').error, 'pair-request-not-found');
});

test('RT90 code-free pairing requests expire and never mint a token without local approval', () => {
  let at = 1000;
  const manager = createEonLocalCompanionPairingManager({ now: () => at, randomId: () => 'request-expire', randomToken: () => 'should-not-appear', ttlMs: 15_000 });
  const created = manager.create('https://eonapp.ch');
  assert.equal(manager.consume(created.requestId, 'https://eonapp.ch').pending, true);
  at += 15_001;
  assert.equal(manager.consume(created.requestId, 'https://eonapp.ch').error, 'pair-request-not-found');
});

test('RT90 trusted browser resumes with a public-key challenge and rejects replay', async () => {
  const { webcrypto } = await import('node:crypto');
  const { createEonLocalCompanionTrustedBrowserManager } = await import('../../tools/eon-local-bridge/trusted-browser-manager.mjs');
  const keys = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const publicKeyJwk = await webcrypto.subtle.exportKey('jwk', keys.publicKey);
  const manager = createEonLocalCompanionTrustedBrowserManager({ persist: false, randomId: () => 'challenge-one', randomNonce: () => 'nonce-one' });
  assert.equal(manager.register('https://eonapp.ch', 'eon-test-browser-key', publicKeyJwk).ok, true);
  const challenge = manager.createChallenge('https://eonapp.ch', 'eon-test-browser-key');
  assert.equal(challenge.ok, true);
  const message = new TextEncoder().encode(`eon-local-companion:https://eonapp.ch:${challenge.challengeId}:${challenge.nonce}`);
  const signature = await webcrypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.privateKey, message);
  const encoded = Buffer.from(signature).toString('base64url');
  const verified = await manager.verifyChallenge('https://eonapp.ch', 'eon-test-browser-key', challenge.challengeId, encoded);
  assert.equal(verified.ok, true);
  assert.equal((await manager.verifyChallenge('https://eonapp.ch', 'eon-test-browser-key', challenge.challengeId, encoded)).ok, false);
});

test('RT90 trusted browser is origin-bound and a wrong private key cannot reconnect', async () => {
  const { webcrypto } = await import('node:crypto');
  const { createEonLocalCompanionTrustedBrowserManager } = await import('../../tools/eon-local-bridge/trusted-browser-manager.mjs');
  const registered = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const attacker = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const publicKeyJwk = await webcrypto.subtle.exportKey('jwk', registered.publicKey);
  const manager = createEonLocalCompanionTrustedBrowserManager({ persist: false, randomId: () => 'challenge-wrong-key', randomNonce: () => 'nonce-wrong-key' });
  manager.register('https://eonapp.ch', 'eon-bound-browser-key', publicKeyJwk);
  assert.equal(manager.createChallenge('https://evil.example', 'eon-bound-browser-key').error, 'trusted-browser-not-found');
  const challenge = manager.createChallenge('https://eonapp.ch', 'eon-bound-browser-key');
  const message = new TextEncoder().encode(`eon-local-companion:https://eonapp.ch:${challenge.challengeId}:${challenge.nonce}`);
  const badSignature = await webcrypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, attacker.privateKey, message);
  const result = await manager.verifyChallenge('https://eonapp.ch', 'eon-bound-browser-key', challenge.challengeId, Buffer.from(badSignature).toString('base64url'));
  assert.equal(result.ok, false);
  assert.equal(result.error, 'trusted-browser-signature-invalid');
});
