import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDirectByokCertificationBoard, evaluateDirectByokCertification, getDirectByokPrivacyTruth } from '../../assets/js/direct-byok/byok-certification.js';
import { buildDirectHistoryExport, clearDirectHistory, readDirectHistory, recordDirectHistoryReceipt } from '../../assets/js/direct-byok/direct-history.js';
import { EON_DIRECT_RECEIPT_SCHEMA } from '../../assets/js/direct-byok/direct-job-contract.js';

function memoryStorage() { const map = new Map(); return { getItem: (k) => map.get(k) || null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) }; }

test('W626H source integration alone is no-go and all real rows default pending', () => {
  const result = evaluateDirectByokCertification({});
  assert.equal(result.pass, false);
  assert.equal(result.verdict, 'no-go-real-provider-evidence-pending');
  assert.equal(buildDirectByokCertificationBoard({}).passedCount, 0);
  assert.equal(getDirectByokPrivacyTruth().sourceIntegrationAloneCanPass, false);
});

test('W626H can certify only complete signed companion and real network evidence', () => {
  const passRows = Object.fromEntries(Object.keys(buildDirectByokCertificationBoard({}).rows).map((key) => [key, 'pass']));
  const result = evaluateDirectByokCertification({ ...passRows, companionRelease: { signed: true, secureCredentialStore: true, loopbackOriginAuth: true }, eonappServerProxyObserved: false, eonappServerMediaStorageObserved: false });
  assert.equal(result.pass, true);
  assert.equal(result.publicAvailabilityClaimAllowed, true);
});

test('W626H local history is redacted, exportable and deletable', () => {
  const storage = memoryStorage();
  const receipt = { schema: EON_DIRECT_RECEIPT_SCHEMA, jobId: 'job_123', providerId: 'fal', mediaKind: 'image', modelId: 'model', safeLabel: 'Image', state: 'completed', message: 'done', rawPromptIncluded: false };
  assert.equal(recordDirectHistoryReceipt(receipt, { storage }).ok, true);
  assert.equal(readDirectHistory({ storage }).length, 1);
  assert.equal(buildDirectHistoryExport({ storage }).includesCredentials, false);
  assert.equal(clearDirectHistory({ storage, explicitUserAction: true }).ok, true);
  assert.equal(readDirectHistory({ storage }).length, 0);
});
