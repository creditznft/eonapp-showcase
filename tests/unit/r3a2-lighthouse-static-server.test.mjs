import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRedirectRules, resolveStaticRedirect, safeJoin } from '../../scripts/lhci-static-server.mjs';

test('W260-R3 A2 parses exact Cloudflare redirect entries but ignores wildcard rewrites', () => {
  const rules = parseRedirectRules(`
# comment
/ /chat 301
/u/* /realm-profile.html?user=:splat 200
/index.html /chat 301
/* /404.html 404
`);
  assert.deepEqual(rules, [
    { from: '/', to: '/chat', status: 301 },
    { from: '/index.html', to: '/chat', status: 301 }
  ]);
});

test('W260-R3 A2 follows public redirect target and preserves query strings', () => {
  const rules = parseRedirectRules('/ /chat 301\n');
  assert.deepEqual(resolveStaticRedirect('/?source=lh', rules), { status: 301, location: '/chat?source=lh' });
  assert.equal(resolveStaticRedirect('/chat', rules), null);
});

test('W260-R3 A2 static root guard rejects traversal and allows internal asset paths', () => {
  assert.equal(safeJoin('/safe/dist', '../secret.txt'), null);
  assert.equal(safeJoin('/safe/dist', 'assets/app.js'), '/safe/dist/assets/app.js');
});

import { classifyLighthouseCommandFailure, classifyLighthouseReport } from '../../scripts/w107-main-lighthouse-direct.mjs';

test('W260-R3 A2 treats a Chrome error document as environment-blocked rather than a Lighthouse score', () => {
  const result = classifyLighthouseReport({
    finalUrl: 'chrome-error://chromewebdata/',
    categories: { performance: { score: null }, accessibility: { score: 0.8 } }
  });
  assert.equal(result.usable, false);
  assert.equal(result.environmentBlocked, true);
  assert.equal(result.reason, 'chrome-error-final-url');
});

test('W260-R3 A2 only accepts a report with complete finite category scores', () => {
  const result = classifyLighthouseReport({
    finalUrl: 'http://127.0.0.1:4195/chat',
    categories: {
      performance: { score: 0.91 },
      accessibility: { score: 0.97 },
      'best-practices': { score: 0.96 },
      seo: { score: 0.92 }
    }
  });
  assert.equal(result.usable, true);
  assert.equal(result.environmentBlocked, false);
});


test('W282 preflight classifies an absent navigation trace as browser-environment blocked, never as a score', () => {
  const result = classifyLighthouseCommandFailure('Runtime error encountered: Something went wrong with recording the trace over your page load. (NO_NAVSTART)');
  assert.equal(result.environmentBlocked, true);
  assert.equal(result.reason, 'browser-navigation-trace-unavailable:no-navstart');
});

test('W282 preflight keeps an unknown missing report fail-closed', () => {
  const result = classifyLighthouseCommandFailure('Lighthouse process exited without a report');
  assert.equal(result.environmentBlocked, false);
  assert.equal(result.reason, 'report-not-created-before-timeout');
});
