import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  buildEonCityL95ProgressiveAssetAdmission,
  validateEonCityL95ProgressiveAssetAdmission
} from '../../assets/js/city/l95/eon-city-l95-progressive-asset-admission.js';

test('L95 progressive detail uses full, throttled, then paused admission as pressure rises', () => {
  const nominal = buildEonCityL95ProgressiveAssetAdmission({ pressure: 'nominal', maxConcurrentLoads: 2 });
  const elevated = buildEonCityL95ProgressiveAssetAdmission({ pressure: 'elevated', maxConcurrentLoads: 2 });
  const critical = buildEonCityL95ProgressiveAssetAdmission({ pressure: 'critical', maxConcurrentLoads: 2 });
  assert.equal(nominal.optionalConcurrencyLimit, 2);
  assert.equal(elevated.optionalConcurrencyLimit, 1);
  assert.equal(critical.optionalConcurrencyLimit, 0);
  assert.equal(critical.cancelInflightLoads, false);
  assert.equal(critical.visibleFrameBypassesAdmission, true);
  assert.equal(validateEonCityL95ProgressiveAssetAdmission(critical).ok, true);
});

test('L95 hidden tabs stop starting optional GLB decode/attachment work', () => {
  const plan = buildEonCityL95ProgressiveAssetAdmission({ pressure: 'nominal', visibility: 'hidden', maxConcurrentLoads: 2 });
  assert.equal(plan.optionalConcurrencyLimit, 0);
  assert.equal(plan.optionalPaused, true);
  assert.equal(plan.networkCacheAuthorityChanged, false);
});

test('L95 W731 local asset runtime distinguishes critical visible-frame work from optional detail', async () => {
  const source = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-local-assets.js', import.meta.url), 'utf8');
  assert.match(source, /buildEonCityL95ProgressiveAssetAdmission/);
  assert.match(source, /priority:\s*'critical'/);
  assert.match(source, /priority:\s*'optional'/);
  assert.match(source, /setOptionalAdmission/);
  assert.match(source, /activeOptionalLoads/);
});

test('L95 live City telemetry drives optional asset admission from universal pressure', async () => {
  const [station, runtime] = await Promise.all([
    readFile(new URL('../../assets/js/eon-city-play-station.js', import.meta.url), 'utf8'),
    readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8')
  ]);
  assert.match(station, /const workloadSnapshot = workloadGovernor\.recordPerformanceSample/);
  assert.match(station, /setOptionalAssetAdmission\?\.\(\{[^]*pressure:\s*workloadSnapshot\?\.pressure/);
  assert.match(runtime, /setOptionalAssetAdmission\(options = \{\}\)/);
  assert.match(runtime, /pendingOptionalAssetAdmission/);
});

const myFrontierPublicSource = await readFile(new URL('../../assets/js/city/l95/eon-city-l95-my-frontier-public-infrastructure.js', import.meta.url), 'utf8');
const myFrontierRendererSource = await readFile(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');

test('L95 My Frontier public authored detail shares the optional asset pressure gate', () => {
  assert.match(myFrontierPublicSource, /buildEonCityL95ProgressiveAssetAdmission/);
  assert.match(myFrontierPublicSource, /optionalConcurrencyLimit/);
  assert.match(myFrontierPublicSource, /maxConcurrentLoads/);
  assert.match(myFrontierRendererSource, /setOptionalAssetAdmission/);
});
