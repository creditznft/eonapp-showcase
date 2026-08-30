import assert from 'node:assert/strict';
import test from 'node:test';
import { W401_ASSET_PROVENANCE_CONTRACT, validateW401AssetProvenanceContract } from '../../config/w401-asset-provenance-contract.mjs';
import { buildCreatorAssetReceiptExport, createCreatorAssetReceipt, CREATOR_ASSET_SOURCE_TYPES, getCreatorAssetProvenanceTruth } from '../../assets/js/creator/asset-provenance.js';
import { inspectW401AssetProvenance } from '../../scripts/w401-asset-provenance-gate.mjs';

test('W401 records local creator-reported source context without claiming rights clearance', () => {
  assert.deepEqual(validateW401AssetProvenanceContract(), []);
  assert.deepEqual(CREATOR_ASSET_SOURCE_TYPES.map((entry) => entry.id), W401_ASSET_PROVENANCE_CONTRACT.sourceTypes);
  const receipt = createCreatorAssetReceipt({ title: 'Opening still', sourceType: 'licensed', reference: 'Licence saved in my project records', attribution: 'Photo by Example', note: 'Review channel crop before export.' });
  assert.equal(receipt.storage, 'current-page-memory-only');
  assert.equal(receipt.proofOfRights, false);
  assert.equal(receipt.publicationApproval, false);
  assert.equal(receipt.requiresReview, false);
  assert.equal(getCreatorAssetProvenanceTruth().remoteLookup, false);
});

test('W401 fails closed for unknown or secret-like receipts', () => {
  const unknown = createCreatorAssetReceipt({ title: 'Found social clip', sourceType: 'unknown' });
  assert.equal(unknown.rightsStatus, 'needs-review');
  assert.throws(() => createCreatorAssetReceipt({ title: 'Key note', sourceType: 'user-owned', reference: 'sk-example-secret-key-123456789' }), /secret/i);
});

test('W401 export stays metadata-only and static gate passes', () => {
  const receipt = createCreatorAssetReceipt({ title: 'Creator generated still', sourceType: 'provider-generated', reference: 'Provider terms reviewed externally' });
  const exported = buildCreatorAssetReceiptExport([receipt]);
  assert.equal(exported.receipts.length, 1);
  assert.match(exported.limitations.join(' '), /No media file/i);
  const report = inspectW401AssetProvenance();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 8);
});
