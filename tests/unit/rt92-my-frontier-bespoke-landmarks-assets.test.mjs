import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_RT92_MY_FRONTIER_BESPOKE_LANDMARKS,
  EON_CITY_RT92_MY_FRONTIER_BESPOKE_TOTAL_BYTES,
  deriveEonCityRt92MyFrontierBespokePlan,
  validateEonCityRt92MyFrontierBespokeCatalogue
} from '../../assets/js/city/rt92/my-frontier/eon-city-rt92-my-frontier-bespoke-landmarks.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

const constructedPresentation = {
  plots: EON_CITY_RT92_MY_FRONTIER_BESPOKE_LANDMARKS.map((entry, index) => ({
    plotId: `plot-${index + 1}`,
    district: entry.district,
    constructedBuildingId: entry.buildingId,
    status: 'constructed-foundation'
  }))
};

test('RT92 ships five unique bespoke landmark families with three strictly decreasing LODs', () => {
  const validation = validateEonCityRt92MyFrontierBespokeCatalogue();
  assert.equal(validation.ok, true, validation.errors.join(','));
  assert.equal(EON_CITY_RT92_MY_FRONTIER_BESPOKE_LANDMARKS.length, 5);
  assert.equal(new Set(EON_CITY_RT92_MY_FRONTIER_BESPOKE_LANDMARKS.map((entry) => entry.buildingId)).size, 5);
  for (const entry of EON_CITY_RT92_MY_FRONTIER_BESPOKE_LANDMARKS) {
    assert.deepEqual(entry.lods.map((lod) => lod.lod), [0, 1, 2]);
    assert.ok(entry.lods[0].triangleCount > entry.lods[1].triangleCount);
    assert.ok(entry.lods[1].triangleCount > entry.lods[2].triangleCount);
    assert.equal(entry.lods.every((lod) => lod.externalTextures === 0), true);
  }
});

test('all 15 source/public GLBs are real, content-addressed and byte-identical to the manifest', () => {
  let observedBytes = 0;
  let observedFiles = 0;
  for (const entry of EON_CITY_RT92_MY_FRONTIER_BESPOKE_LANDMARKS) {
    for (const lod of entry.lods) {
      const relative = lod.path.replace(/^\//, '');
      const publicFile = path.join(repo, 'public', relative);
      const sourceFile = path.join(repo, relative);
      for (const file of [sourceFile, publicFile]) {
        const buffer = fs.readFileSync(file);
        assert.equal(buffer.subarray(0, 4).toString('ascii'), 'glTF', `${file} is not GLB`);
        assert.equal(buffer.length, lod.bytes, `${file} byte drift`);
        assert.equal(sha256(buffer), lod.sha256, `${file} SHA drift`);
      }
      assert.equal(fs.readFileSync(sourceFile).equals(fs.readFileSync(publicFile)), true, `${relative} source/public mismatch`);
      observedBytes += lod.bytes;
      observedFiles += 1;
    }
  }
  assert.equal(observedFiles, 15);
  assert.equal(observedBytes, EON_CITY_RT92_MY_FRONTIER_BESPOKE_TOTAL_BYTES);
  assert.ok(observedBytes < 2 * 1024 * 1024, `bespoke payload too large: ${observedBytes}`);
});

test('quality selection loads one landmark LOD per constructed plot and keeps Hub first frame at zero bytes', () => {
  const lite = deriveEonCityRt92MyFrontierBespokePlan({ presentation: constructedPresentation, quality: 'lite' });
  const balanced = deriveEonCityRt92MyFrontierBespokePlan({ presentation: constructedPresentation, quality: 'balanced' });
  const cinematic = deriveEonCityRt92MyFrontierBespokePlan({ presentation: constructedPresentation, quality: 'cinematic' });
  assert.equal(lite.requestedCount, 5);
  assert.equal(balanced.requestedCount, 5);
  assert.equal(cinematic.requestedCount, 5);
  assert.deepEqual(lite.plots.map((entry) => entry.selectedLod), [2,2,2,2,2]);
  assert.deepEqual(balanced.plots.map((entry) => entry.selectedLod), [1,1,1,1,1]);
  assert.deepEqual(cinematic.plots.map((entry) => entry.selectedLod), [0,0,0,0,0]);
  assert.equal(balanced.hubFirstFrameBinaryDelta, 0);
  assert.equal(balanced.fallbackRequiredUntilValidated, true);
  assert.ok(lite.requestedBytes < balanced.requestedBytes);
  assert.ok(balanced.requestedBytes < cinematic.requestedBytes);
});
