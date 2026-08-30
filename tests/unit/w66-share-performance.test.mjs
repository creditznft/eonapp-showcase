import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importBrowserModule, installStoragePolyfill } from './helpers/import-browser-module.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
installStoragePolyfill();
const files = [
  'assets/js/utils/share-link-codec.js','assets/js/utils/share-attribution.js','assets/js/utils/signed-share-link.js','assets/js/utils/share-link-identity.js',
  'assets/js/utils/share-event-schema.js','assets/js/utils/share-visitor-identity.js','assets/js/utils/share-receipts.js','assets/js/utils/decentralized-receipt-ledger.js'
];
const receipts = await importBrowserModule(root, 'assets/js/utils/share-receipts.js', files);
const ledger = await importBrowserModule(root, 'assets/js/utils/decentralized-receipt-ledger.js', files);

test('visitor pseudonym is share-scoped and receipt excludes forbidden tracking fields', async () => {
  const a = await receipts.createShareReceipt('unique_visit', { shareId: 'share-a', proof: { ip: '1.2.3.4', userAgent: 'secret', route: '/realm.html' } });
  const b = await receipts.createShareReceipt('unique_visit', { shareId: 'share-b', proof: { route: '/realm.html' } });
  assert.notEqual(a.visitorPseudonym, b.visitorPseudonym);
  assert.equal('ip' in a.proof, false);
  assert.equal('userAgent' in a.proof, false);
  assert.equal(ledger.appendShareReceipt(a).stored, true);
  assert.equal(ledger.appendShareReceipt(a).duplicate, true);
  assert.equal(ledger.queueShareReceiptForNostr(a).queued, true);
});
