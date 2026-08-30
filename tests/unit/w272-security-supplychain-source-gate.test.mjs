import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ROOT,
  getDefaultCsp,
  runW272SecuritySupplyChainSourceGate,
  validateW272Csp,
  validateW272Lockfile
} from '../../scripts/w272-security-supplychain-source-gate.mjs';

test('W272-A0 rejects unsafe script policies and mutable dependency locations', () => {
  const csp = validateW272Csp("default-src 'self'; script-src 'self' 'unsafe-eval' *; script-src-attr 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; report-uri /csp-report");
  assert.equal(csp.ok, false);
  assert.match(csp.errors.join(' '), /unsafe-eval/i);

  const lock = validateW272Lockfile({
    lockfileVersion: 3,
    packages: { 'node_modules/example': { resolved: 'git+https://github.com/example/repo.git' } }
  });
  assert.equal(lock.ok, false);
  assert.match(lock.errors.join(' '), /mutable local\/git/i);
});

test('W272-A0 validates checked-in source controls without approving external security evidence', () => {
  const report = runW272SecuritySupplyChainSourceGate(ROOT);
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.w260Verdict, 'NO_GO');
  assert.equal(report.boardDecision, 'SOURCE_CONTROLS_PASS_EXTERNAL_EDGE_AND_AUDIT_PENDING');
  assert.match(getDefaultCsp(`Content-Security-Policy: ${report.defaultCsp}`), /default-src 'self'/);
  assert.equal(report.broadSchemeReviewRequired.connectSrc, true);
});
