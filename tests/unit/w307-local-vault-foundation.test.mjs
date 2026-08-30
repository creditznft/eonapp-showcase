import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import {
  createLocalVaultRecordId,
  createLocalVaultSalt,
  deriveLocalVaultKey,
  sealLocalVaultRecord,
  openLocalVaultRecord,
  getLocalVaultCryptoTruth
} from '../../assets/js/local-first/eon-local-vault-crypto.js';
import { getEncryptedRecordStoreTruth } from '../../assets/js/local-first/eon-encrypted-record-store.js';
import { runW307LocalVaultFoundationGate } from '../../scripts/w307-local-vault-foundation-gate.mjs';

const cryptoApi = webcrypto;

test('W307 seals and opens one opaque local record with a non-exportable derived key', async () => {
  const salt = createLocalVaultSalt({ cryptoApi });
  const key = await deriveLocalVaultKey('a deliberate local vault passphrase', salt, { cryptoApi });
  const recordId = createLocalVaultRecordId({ cryptoApi });
  const envelope = await sealLocalVaultRecord({ task: 'private draft', safe: true }, { key, recordId, cryptoApi, now: 1_770_000_000_000 });
  assert.equal(envelope.recordId, recordId);
  assert.equal(envelope.ciphertext.includes('private draft'), false);
  assert.equal('passphrase' in envelope, false);
  const opened = await openLocalVaultRecord(envelope, { key, cryptoApi });
  assert.deepEqual(opened.value, { task: 'private draft', safe: true });
});

test('W307 rejects a wrong passphrase key and record-id swapping', async () => {
  const salt = createLocalVaultSalt({ cryptoApi });
  const goodKey = await deriveLocalVaultKey('a deliberate local vault passphrase', salt, { cryptoApi });
  const wrongKey = await deriveLocalVaultKey('a different local vault passphrase', salt, { cryptoApi });
  const recordId = createLocalVaultRecordId({ cryptoApi });
  const envelope = await sealLocalVaultRecord({ privateMarker: 'not in browser storage' }, { key: goodKey, recordId, cryptoApi });
  await assert.rejects(() => openLocalVaultRecord(envelope, { key: wrongKey, cryptoApi }), /could not be decrypted/i);
  const replacement = createLocalVaultRecordId({ cryptoApi });
  await assert.rejects(() => openLocalVaultRecord(envelope, { key: goodKey, recordId: replacement, cryptoApi }), /binding did not match/i);
});

test('W307 cryptography and envelope store truth are local-only and source gate remains green', () => {
  const cryptoTruth = getLocalVaultCryptoTruth();
  const storeTruth = getEncryptedRecordStoreTruth();
  assert.equal(cryptoTruth.directNetwork, false);
  assert.equal(cryptoTruth.localStorage, false);
  assert.equal(cryptoTruth.keyExport, false);
  assert.equal(cryptoTruth.passphrasePersistence, false);
  assert.equal(storeTruth.network, false);
  assert.equal(storeTruth.localStorage, false);
  const report = runW307LocalVaultFoundationGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
});
