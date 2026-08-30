import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, loadProjects } from '../../assets/js/utils/eon-workspace-store.js';
import { attachCreatorAssetToProject, buildCreatorAssetReference, prepareCreatorContinuation } from '../../assets/js/create/creator-project-integration.js';

function memoryStorage() { const map = new Map(); return { getItem: (key) => map.get(key) || null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) }; }

test('W627E attaches a redacted verified creator reference to a real local project', () => {
  const storage = memoryStorage();
  const project = createProject({ title: 'Launch' }, { storage });
  const asset = { assetId: 'creatorasset_123', title: 'Hero', mediaKind: 'image', sha256: 'a'.repeat(64), providerId: 'local' };
  const result = attachCreatorAssetToProject(project.id, asset, { storage, explicitUserAction: true, confirmed: true });
  assert.equal(result.ok, true);
  assert.equal(result.reference.rawPromptIncluded, false);
  assert.equal(loadProjects({ storage }).projects[0].artifacts.length, 1);
});

test('W627E prepares Forge and export continuations without remote action', async () => {
  const sessionStorage = memoryStorage();
  const asset = { assetId: 'creatorasset_123', title: 'Hero', mediaKind: 'image', sha256: 'a'.repeat(64) };
  assert.equal(buildCreatorAssetReference(asset).mediaBodyIncluded, false);
  const forge = await prepareCreatorContinuation(asset, 'forge', { explicitUserAction: true, sessionStorage, cryptoApi: globalThis.crypto, handoffId: 'handoff_w627e_forge' });
  assert.equal(forge.preparedOnly, true);
  assert.equal(forge.href, '/forge?handoff=handoff_w627e_forge');
  assert.equal((await prepareCreatorContinuation(asset, 'export', { explicitUserAction: true })).destination, 'export');
});
