import assert from 'node:assert/strict';
import test from 'node:test';
import { getEonActionGatewayTruth, prepareDisabledActionGatewayProposal } from '../../assets/js/action-gateway/eon-action-gateway-contract.js';
import { inspectW406W407ActionGateway } from '../../scripts/w406-w407-action-gateway-gate.mjs';

test('W406/W407 keeps action gateway disabled until server proof', () => {
  const truth = getEonActionGatewayTruth();
  const proposal = prepareDisabledActionGatewayProposal('cloudflare-project-deploy');
  assert.equal(truth.enabled, false);
  assert.equal(truth.browserCanExecuteExternalAction, false);
  assert.equal(proposal.ok, false);
  assert.equal(proposal.externalEffect, false);
});

test('W406/W407 static source gate passes without an external action', () => {
  const report = inspectW406W407ActionGateway({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.match(report.limitations.join(' '), /No action database/i);
});
