import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { EON_CITY_FLAGSHIP_CASES, EON_CITY_FLAGSHIP_PERFORMANCE_PLAN, EON_CITY_FLAGSHIP_PRESETS, createEonCityFlagshipCertificationController, getEonCityFlagshipPerformancePlan } from '../../assets/js/city/eon-city-flagship-certification.js';
import { validateW624lFlagshipCertificationContract } from '../../config/w624l-flagship-certification-contract.mjs';
const read = (file) => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

test('W624L defines three bounded quality presets and eleven evidence cases', () => {
  assert.deepEqual(Object.keys(EON_CITY_FLAGSHIP_PRESETS), ['low', 'mid', 'high']);
  assert.equal(EON_CITY_FLAGSHIP_CASES.length, 11);
  assert.ok(EON_CITY_FLAGSHIP_CASES.some((entry) => entry.id === 'owner-approval'));
  assert.ok(EON_CITY_FLAGSHIP_CASES.some((entry) => entry.id === 'visual-parity'));
  assert.equal(EON_CITY_FLAGSHIP_PERFORMANCE_PLAN.automaticCertification, false);
});

test('W624L performance plans preserve bounded cell streaming and honest texture status', () => {
  const low = getEonCityFlagshipPerformancePlan('low');
  const high = getEonCityFlagshipPerformancePlan('high');
  assert.equal(low.residentCells, 9);
  assert.equal(high.residentCells, 9);
  assert.equal(low.preset.optionalDetail, false);
  assert.equal(high.preset.optionalDetail, true);
  assert.equal(high.plan.compressedTextureBoundary, 'manifest-gated-when-assets-exist');
  assert.equal(high.finalPerformanceClaim, false);
});

test('W624L collects only bounded local frame and memory evidence', () => {
  let clock = 1000;
  const controller = createEonCityFlagshipCertificationController({ now: () => clock, performanceNow: () => clock, memoryReader: () => ({ usedJSHeapSize: 20_000_000 }) });
  assert.equal(controller.recordFrame(-1).reason, 'invalid-frame-sample');
  clock += 16;
  assert.equal(controller.recordFrame(16).ok, true);
  assert.equal(controller.sampleMemory().ok, true);
  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.metrics.frameSamples, 1);
  assert.equal(snapshot.metrics.memorySamples, 1);
  assert.equal(snapshot.metrics.remoteTelemetry, false);
  assert.equal(snapshot.metrics.thermalMeasured, false);
});

test('W624L case results require explicit human review and bounded evidence references', () => {
  const controller = createEonCityFlagshipCertificationController({ now: () => 2000, performanceNow: () => 2000, memoryReader: () => null });
  assert.equal(controller.selectCase('low-device').reason, 'explicit-review-required');
  assert.equal(controller.recordCase('low-device', 'pass', { explicitUserAction: true, evidenceRef: 'low-device/proof.json' }).reason, 'explicit-human-review-required');
  assert.equal(controller.recordCase('low-device', 'pass', { explicitUserAction: true, explicitHumanReview: true }).reason, 'bounded-evidence-reference-required');
  const result = controller.recordCase('low-device', 'pass', { explicitUserAction: true, explicitHumanReview: true, evidenceRef: 'low-device/proof.json' });
  assert.equal(result.ok, true);
  assert.equal(result.snapshot.passCount, 1);
  assert.equal(result.snapshot.finalPerformanceClaim, false);
});

test('W624L evidence export is explicit and cannot certify itself', () => {
  const controller = createEonCityFlagshipCertificationController({ now: () => 3000, performanceNow: () => 3000, memoryReader: () => null });
  assert.equal(controller.exportEvidence().reason, 'explicit-user-action-required');
  const exported = controller.exportEvidence({ explicitUserAction: true });
  assert.equal(exported.ok, true);
  assert.equal(exported.privateContentIncluded, false);
  assert.equal(exported.evidence.automaticCertification, false);
  assert.equal(exported.evidence.status, 'pending');
});

test('W624L source gate preserves W624B-K and evidence-gated UI', async () => {
  const result = await validateW624lFlagshipCertificationContract();
  assert.equal(result.ok, true, result.checks.filter((entry) => !entry.pass).map((entry) => entry.id).join(', '));
  assert.ok(result.total >= 35);
  const station = read('assets/js/eon-city-play-station.js');
  assert.match(station, /w624l-flagship-certification/);
  assert.match(station, /bindEonCityAccessibilityDeviceSystem/);
  assert.match(station, /bindEonCitySharingCenter/);
  assert.match(read('assets/css/eon-city-play.css'), /W624L · evidence-gated performance/);
});
