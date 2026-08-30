import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const station = await readFile(new URL('../../assets/js/eon-city-play-station.js', import.meta.url), 'utf8');
const lab = await readFile(new URL('../../assets/js/city/eon-city-performance-lab.js', import.meta.url), 'utf8');

test('L95 City Performance Lab visibly names the active world being measured', () => {
  assert.match(station, /activeWorldRegionId = String\(runtimeSummary\?\.activeWorldRegionId \|\| runtimeSummary\?\.lifecycle\?\.lastFpsSample\?\.worldRegionId \|\| 'command-hub'\)/);
  assert.match(station, /data-eon-city-performance-world-region|eonCityPerformanceWorldRegion/);
  assert.match(station, /Current local renderer session · \$\{escapeHtml\(activeWorldRegionId\)\}/);
});

test('L95 saved manual performance observations retain the bounded active-world label', () => {
  assert.match(lab, /activeWorldRegionId: String\(summary\.activeWorldRegionId \|\| summary\.lifecycle\?\.lastFpsSample\?\.worldRegionId \|\| 'unknown'\)\.slice\(0, 48\)/);
});
