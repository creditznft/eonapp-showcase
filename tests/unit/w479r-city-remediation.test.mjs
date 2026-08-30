import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectW479RCityRemediation } from '../../scripts/w479r-city-remediation-gate.mjs';

test('W479-R closes City texture, mipmap, frame-budget, and portrait chip source gates', () => {
  const report = inspectW479RCityRemediation({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.equal(report.gates.explicitSvgDimensions, true);
  assert.equal(report.gates.safeTextureFactory, true);
  assert.equal(report.gates.vectorMipmapPolicy, true);
  assert.equal(report.gates.stageBudgetLedger, true);
  assert.equal(report.gates.portraitChipLayout, true);
  assert.ok(report.svgFiles >= 50);
});
