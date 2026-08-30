import assert from 'node:assert/strict';
import test from 'node:test';
import { createCityQualityGovernor, getCityQualityGovernorPolicy, getCityQualityGovernorTruth } from '../../assets/js/city/eon-city-quality-governor.js';
import { inspectW431CityQualityGovernor } from '../../scripts/w431-city-quality-governor-gate.mjs';

test('W431 recommends local protection then visible safe mode without persistence', () => {
  let now = 0;
  const governor = createCityQualityGovernor({ quality: 'balanced', now: () => ++now });
  let decision = null;
  for (let index = 0; index < 150; index += 1) decision = governor.recordFrame(42).decision || decision;
  assert.equal(decision?.action, 'apply-protection');
  assert.equal(governor.getSnapshot().protectionApplied, false);
  governor.markProtectionApplied(decision.reason);
  for (let index = 0; index < 320; index += 1) decision = governor.recordFrame(58).decision || decision;
  assert.equal(decision?.action, 'recommend-safe-mode');
  const snapshot = governor.getSnapshot();
  assert.equal(snapshot.localOnly, true);
  assert.equal(snapshot.persistence, 'memory-only');
  assert.equal(snapshot.remoteTelemetry, false);
  assert.equal(snapshot.changesSavedPreference, false);
  assert.equal(snapshot.automaticNavigation, false);
});

test('W431 lite is a user-controlled floor and never self-degrades', () => {
  const governor = createCityQualityGovernor({ quality: 'lite' });
  let decision = null;
  for (let index = 0; index < 240; index += 1) decision = governor.recordFrame(90).decision || decision;
  assert.equal(getCityQualityGovernorPolicy('lite').canApplyProtection, false);
  assert.equal(decision, null);
  assert.equal(governor.getSnapshot().protectionApplied, false);
  assert.equal(getCityQualityGovernorTruth().automaticSafeModeRestart, false);
});

test('W431 source gate remains green', () => {
  const report = inspectW431CityQualityGovernor();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 8);
});
