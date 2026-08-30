import test from 'node:test';
import assert from 'node:assert/strict';
import { saveCreatorAsset, listCreatorAssets } from '../../assets/js/create/creator-library-store.js';
import { applyCreatorLibraryRestore, buildCreatorLibraryExport, EON_CREATOR_RESTORE_CONFIRMATION, getCreatorDataSurvivalTruth, inspectCreatorLibraryRestore } from '../../assets/js/create/creator-data-survival.js';

function memoryStorage() { const map = new Map(); return { getItem: (key) => map.get(key) || null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) }; }

test('W627F export includes metadata and excludes raw media', async () => {
  const storage = memoryStorage();
  await saveCreatorAsset({ jobState: 'complete', mediaKind: 'image', title: 'Asset', sha256: 'c'.repeat(64), digestMatched: true }, { storage, explicitUserAction: true });
  const exported = buildCreatorLibraryExport({ storage, now: () => 1_700_000_000_000 });
  assert.equal(exported.assetCount, 1);
  assert.equal(exported.genericCapsuleIncludesRawMedia, false);
  assert.equal(exported.assets[0].rawMediaIncluded, false);
  assert.equal(getCreatorDataSurvivalTruth().automaticMerge, false);
});

test('W627F restore requires preview, explicit confirmation and conflict choices', async () => {
  const source = memoryStorage();
  await saveCreatorAsset({ jobState: 'complete', mediaKind: 'image', title: 'Asset', sha256: 'd'.repeat(64), digestMatched: true }, { storage: source, explicitUserAction: true });
  const exported = buildCreatorLibraryExport({ storage: source });
  const target = memoryStorage();
  const preview = inspectCreatorLibraryRestore(exported, { storage: target });
  assert.equal(preview.changes[0].status, 'add');
  assert.equal(applyCreatorLibraryRestore(preview, [], { storage: target, explicitUserAction: true, confirmation: 'wrong' }).ok, false);
  const applied = applyCreatorLibraryRestore(preview, [], { storage: target, explicitUserAction: true, confirmation: EON_CREATOR_RESTORE_CONFIRMATION });
  assert.equal(applied.ok, true);
  assert.equal(listCreatorAssets({ storage: target }).length, 1);
});
