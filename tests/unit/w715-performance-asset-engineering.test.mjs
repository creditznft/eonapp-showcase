import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EONAPP_W715_BUDGETS,
  buildEonAppW715PerformancePlan,
  evaluateEonAppW715Observation,
  getEonAppW715PerformanceAssetTruth,
  validateEonAppW715PerformancePlan
} from '../../assets/js/runtime/w715/eonapp-w715-performance-asset-engineering.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const digest = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const binaries = (base) => fs.readdirSync(base, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(?:glb|gltf|bin|png|webp|ktx2|ogg|mp3)$/i.test(entry.name))
  .map((entry) => {
    const full = path.join(entry.parentPath || entry.path, entry.name);
    return { relative: path.relative(base, full).replaceAll('\\', '/'), bytes: fs.statSync(full).size, sha256: digest(full) };
  });

test('W715 maps low, balanced and high to the existing safe City profiles', () => {
  const rows = ['low', 'balanced', 'high'].map((quality) => buildEonAppW715PerformancePlan({ quality }));
  assert.deepEqual(rows.map((row) => row.cityQuality), ['lite', 'balanced', 'cinematic']);
  assert.equal(rows.every((row) => validateEonAppW715PerformancePlan(row).ok), true);
  assert.equal(buildEonAppW715PerformancePlan({ quality: 'high', reducedData: true }).quality, 'low');
  assert.equal(buildEonAppW715PerformancePlan({ quality: 'high', deviceMemoryGb: 4 }).quality, 'low');
});

test('W715 budgets resident districts, streamed cells, frame time and memory by quality', () => {
  const low = buildEonAppW715PerformancePlan({ quality: 'low' });
  const high = buildEonAppW715PerformancePlan({ quality: 'high' });
  assert.equal(low.budgets.residentDistrictCountMax, 1);
  assert.equal(high.budgets.residentDistrictCountMax, 2);
  assert.equal(high.budgets.visibleCellCountMax, 25);
  assert.equal(high.budgets.interactiveCellCountMax, 9);
  assert.ok(low.budgets.usedHeapBytesMax < high.budgets.usedHeapBytesMax);
  assert.ok(high.budgets.p95FrameMsMax < low.budgets.p95FrameMsMax);
});

test('W715 evaluates local observations without awarding automatic certification', () => {
  const plan = buildEonAppW715PerformancePlan({ quality: 'balanced' });
  const pass = evaluateEonAppW715Observation({ firstFrameMs: 4200, p95FrameMs: 30, memory: { latestUsedBytes: 300 * 1024 * 1024 }, contextLost: false }, plan);
  const fail = evaluateEonAppW715Observation({ firstFrameMs: 6000, p95FrameMs: 55, memory: { latestUsedBytes: 900 * 1024 * 1024 }, contextLost: true }, plan);
  assert.equal(pass.ok, true);
  assert.equal(pass.automaticallyCertified, false);
  assert.equal(pass.manualReviewRequired, true);
  assert.equal(fail.ok, false);
});

test('W715 canonical and public W649 binary stores are exact mirrors with no build duplicates', () => {
  const source = binaries(path.join(root, 'assets/city/w649'));
  const publicFiles = binaries(path.join(root, 'public/assets/city/w649'));
  const publicMap = new Map(publicFiles.map((entry) => [entry.relative, entry]));
  assert.equal(source.length, 76);
  assert.equal(publicFiles.length, 76);
  assert.equal(source.every((entry) => publicMap.get(entry.relative)?.sha256 === entry.sha256), true);
  assert.equal(new Set(publicFiles.map((entry) => entry.sha256)).size, publicFiles.length);
  assert.ok(Math.max(...publicFiles.map((entry) => entry.bytes)) <= EONAPP_W715_BUDGETS.perBinaryAssetBytesMax);
});

test('W715 cache and service-worker update remains explicit and content-addressed', () => {
  const sw = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8');
  // Content-addressed City art remains in one release-stable browser cache;
  // changed bytes receive a new URL while unchanged bytes avoid the network.
  assert.match(sw, /PERSISTENT_CITY_ASSET_CACHE = 'eonapp-city-assets-v1'/);
  assert.match(sw, /EONAPP_APPLY_UPDATE/);
  assert.match(sw, /explicitUserAction === true/);
  assert.doesNotMatch(sw, /self\.skipWaiting\(\)\s*;/);
});

test('W715 truth requires real browser/device proof and performs no hidden work', () => {
  const truth = getEonAppW715PerformanceAssetTruth();
  assert.equal(truth.buildShipsOneBinaryCopy, true);
  assert.equal(truth.preloadAll, false);
  assert.equal(truth.localObservationOnly, true);
  assert.equal(truth.realDeviceProofRequired, true);
  assert.equal(truth.browserProofRequired, true);
  assert.equal(truth.automaticCertification, false);
  assert.equal(truth.performsNetworkRequest, false);
  assert.equal(truth.mutatesCache, false);
});
