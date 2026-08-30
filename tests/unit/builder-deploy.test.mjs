import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDeployManifest, verifyDeployBundle } from '../../assets/js/utils/builder-deploy.js';

test('builder deploy verifier passes a clean bundle', () => {
  const manifest = buildDeployManifest({
    projectName: 'Launch Site',
    target: 'cloudflare-pages',
    route: '/',
    html: '<!doctype html><html><body>Hello</body></html>',
    css: 'body { color: white; }',
    js: 'console.log("hi");'
  });

  const verification = verifyDeployBundle({
    manifest,
    html: '<!doctype html><html><body>Hello</body></html>',
    css: 'body { color: white; }',
    js: 'console.log("hi");'
  });

  assert.equal(verification.ok, true);
  assert.equal(manifest.verification.status, 'ready-for-human-review');
  assert.ok(verification.checks.every((check) => typeof check.ok === 'boolean'));
});

test('builder deploy verifier flags obvious secrets', () => {
  const manifest = buildDeployManifest({
    projectName: 'Launch Site',
    target: 'cloudflare-pages',
    route: '/',
    html: '<!doctype html><html><body>Credit card 4111</body></html>',
    css: '',
    js: ''
  });

  const verification = verifyDeployBundle({
    manifest,
    html: '<!doctype html><html><body>Credit card 4111</body></html>',
    css: '',
    js: ''
  });

  assert.equal(verification.ok, false);
  assert.ok(verification.checks.some((check) => check.name === 'No payment or identity secrets in bundle' && check.ok === false));
});
