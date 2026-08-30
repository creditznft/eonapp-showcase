import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCreatorCertificationBoard, getUnifiedCreatorCertificationTruth } from '../../assets/js/create/creator-certification.js';

test('W627G source-only board remains no-go', () => {
  const board = buildCreatorCertificationBoard({});
  assert.equal(board.pass, false);
  assert.equal(board.passedCount, 0);
  assert.equal(board.publicAvailabilityClaimAllowed, false);
  assert.equal(getUnifiedCreatorCertificationTruth().sourceIntegrationAloneCanPass, false);
});

test('W627G requires every evidence row and real image, video and device proof', () => {
  const template = buildCreatorCertificationBoard({});
  const rows = Object.fromEntries(Object.keys(template.rows).map((key) => [key, 'pass']));
  assert.equal(buildCreatorCertificationBoard(rows).pass, false);
  const passed = buildCreatorCertificationBoard({ ...rows, realImageProof: true, realVideoProof: true, realDeviceProof: true });
  assert.equal(passed.pass, true);
  assert.equal(passed.verdict, 'go-unified-creator-certified');
});
