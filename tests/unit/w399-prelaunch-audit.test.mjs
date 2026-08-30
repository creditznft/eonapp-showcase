import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectW399PrelaunchAudit } from '../../scripts/w399-prelaunch-audit-gate.mjs';

test('W399 holds every future external or value-bearing system inactive', () => {
  const report = inspectW399PrelaunchAudit({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.equal(report.productionCertified, false);
  assert.match(report.limitations.join(' '), /does not prove Cloudflare configuration/i);
});
