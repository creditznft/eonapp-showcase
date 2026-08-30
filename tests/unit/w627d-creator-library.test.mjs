import test from 'node:test';
import assert from 'node:assert/strict';
import { createCreatorAssetVersion, deleteCreatorAsset, getCreatorLibraryTruth, listCreatorAssets, saveCreatorAsset } from '../../assets/js/create/creator-library-store.js';

function memoryStorage() { const map = new Map(); return { getItem: (key) => map.get(key) || null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) }; }

test('W627D saves only digest-matched completed output metadata', async () => {
  const storage = memoryStorage();
  assert.equal((await saveCreatorAsset({ jobState: 'complete', sha256: 'abc', digestMatched: false }, { storage, explicitUserAction: true })).reason, 'digest-matched-output-required');
  const result = await saveCreatorAsset({ jobState: 'complete', mediaKind: 'image', title: 'Launch image', sha256: 'a'.repeat(64), digestMatched: true, width: 512, height: 512, rail: 'local-runtime' }, { storage, explicitUserAction: true });
  assert.equal(result.ok, true);
  assert.equal(result.asset.mediaStoredLocally, false);
  assert.equal(listCreatorAssets({ storage }).length, 1);
  assert.equal(getCreatorLibraryTruth().rawMediaInGenericCapsule, false);
});

test('W627D creates versions and supports confirmed deletion', async () => {
  const storage = memoryStorage();
  const saved = await saveCreatorAsset({ jobState: 'saved', mediaKind: 'video', title: 'Clip', sha256: 'b'.repeat(64), digestMatched: true }, { storage, explicitUserAction: true });
  const version = createCreatorAssetVersion(saved.asset.assetId, { title: 'Clip revision' }, { storage, explicitUserAction: true });
  assert.equal(version.ok, true);
  assert.equal(version.asset.parentAssetId, saved.asset.assetId);
  assert.equal((await deleteCreatorAsset(saved.asset.assetId, { storage, explicitUserAction: true, confirmed: true })).ok, true);
  assert.equal(listCreatorAssets({ storage }).length, 1);
});
