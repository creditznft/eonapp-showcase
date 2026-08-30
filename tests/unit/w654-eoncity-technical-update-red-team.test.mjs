import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectW654TechnicalRedTeam } from '../../scripts/w654-eoncity-technical-update-red-team-audit.mjs';

test('W654 proves normal app updates do not force a complete City asset redownload', () => {
  const report = inspectW654TechnicalRedTeam();
  assert.equal(report.ok, true, report.failures.join('\n'));
  assert.match(report.updateAnswer, /No full redownload/);
  assert.match(report.updateAnswer, /changed model bytes produce a new URL/);
  assert.equal(report.metrics.logicalAssets, 38);
  assert.equal(report.metrics.binaries, 76);
  assert.equal(report.metrics.maxResidentDistricts, 2);
  assert.equal(report.metrics.liteMaxResidentDistricts, 1);
  assert.match(report.decision, /bounded two-district overlap residency/);
  assert.equal(report.updateScenarios.length, 5);
  assert.equal(report.updateScenarios.find((entry) => entry.id === 'shell-only-release').unchangedGameAssetsDownloaded, false);
  assert.equal(report.updateScenarios.find((entry) => entry.id === 'one-model-changed').fullLibraryDownloaded, false);
  assert.equal(report.updateScenarios.find((entry) => entry.id === 'browser-cache-evicted').fullLibraryPreloaded, false);
});

test('W654 technical red-team audit clears the previsual 9.5 target', () => {
  const report = inspectW654TechnicalRedTeam();
  assert.equal(report.localCriteriaScore, 100);
  assert.ok(report.executivePrevisualScore >= 95);
  assert.ok(report.metrics.starterPrimaryBytes < report.metrics.activePrimaryBytes);
});
