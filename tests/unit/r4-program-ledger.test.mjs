import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectR4ProgramLedger } from '../../scripts/r4-program-ledger-gate.mjs';

test('R4 program ledger is canonical, source-honest and keeps commercial activation blocked', () => {
  const report = inspectR4ProgramLedger();
  assert.equal(report.ok, true, report.errors.join('\n'));
  const byId = new Map(report.ledger.lanes.map((lane) => [lane.id, lane]));
  assert.equal(byId.get('R4-00')?.status, 'complete-source');
  assert.equal(byId.get('R4-00')?.externalProofRequired, true);
  assert.equal(byId.get('A-03')?.status, 'complete-source');
  assert.equal(byId.get('A-03')?.externalProofRequired, true);
  assert.equal(byId.get('C-00')?.status, 'blocked-external');
  assert.equal(byId.get('M-00')?.status, 'hold-governance');
  assert.equal(byId.get('M-01')?.status, 'blocked-external');
  assert.match(report.ledger.productArchitecture.navigationDecision, /Apps collection/i);
  assert.match(report.ledger.sourceTruth, /does not certify/i);
});
