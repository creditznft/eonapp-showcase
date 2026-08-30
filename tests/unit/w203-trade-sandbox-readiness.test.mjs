import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { auditMarketIntelligenceSafety } from '../../scripts/w375-market-intelligence-safety-gate.mjs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('W203 retires the sandbox route to Research Lab and does not ship a separate execution checklist page', () => {
  const redirects = read('_redirects');
  assert.match(redirects, /^\/trade\/sandbox \/insights 301/m);
  assert.match(redirects, /^\/trade-sandbox\.html \/insights 301/m);
  assert.equal(existsSync(new URL('../../trade-sandbox.html', import.meta.url)), false);
  assert.equal(existsSync(new URL('../../assets/js/trade/eon-trade-sandbox.js', import.meta.url)), false);
});

test('W203 replacement uses the current local-only safety gate', () => {
  const report = auditMarketIntelligenceSafety({ root: process.cwd() });
  assert.equal(report.ok, true, JSON.stringify(report.failures));
});
