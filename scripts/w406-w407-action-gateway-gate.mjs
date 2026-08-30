#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W406_W407_ACTION_GATEWAY_CONTRACT, validateW406W407ActionGatewayContract } from '../config/w406-w407-action-gateway-contract.mjs';
import { getEonActionGatewayTruth, prepareDisabledActionGatewayProposal } from '../assets/js/action-gateway/eon-action-gateway-contract.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW406W407ActionGateway() {
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const truth = getEonActionGatewayTruth();
  const proposal = prepareDisabledActionGatewayProposal('connector-post');
  const status = read('functions/api/actions/status.js');
  const prepare = read('functions/api/actions/prepare.js');
  const execute = read('functions/api/actions/execute.js');
  const migration = read('action-gateway/migrations/0001_eon_action_gateway.sql');
  const workspace = read('assets/js/eon-workspace-pages.js');
  check('contract-valid', validateW406W407ActionGatewayContract().length === 0, 'Action Gateway contract has no internal violations');
  check('truth-disabled', truth.enabled === false && truth.browserCanExecuteExternalAction === false && truth.externalEffectCreated === false, 'No browser or server external effect is enabled');
  check('proposal-disabled', proposal.ok === false && proposal.status === 'disabled' && proposal.externalEffect === false, 'Action proposals fail closed before activation');
  check('functions-disabled', /enabled:\s*false/.test(status) && /503/.test(prepare) && /503/.test(execute), 'Action endpoints are explicitly disabled');
  check('no-secret-or-transport', !/fetch\s*\(|XMLHttpRequest|WebSocket|secret|token/i.test(`${status}\n${prepare}\n${execute}`), 'Disabled endpoints hold no token, secret or outbound transport');
  check('dedicated-schema', /EON_ACTIONS_DB/.test(migration) && /eon_action_proposals/.test(migration) && /eon_action_receipts/.test(migration), 'Future durable proposal/receipt schema is isolated');
  check('workspace-truth', /renderEonActionGatewayWorkspace/.test(workspace), 'Workspace explains approval-first Action Gateway state');
  return Object.freeze({ schema: 'eonapp.w406-w407.action-gateway-gate.v1', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['No action database, approval, connector, repository, deployment, external post or durable receipt is created.']) });
}
export function runW406W407ActionGatewayGate({ writeArtifact = true } = {}) { const result = inspectW406W407ActionGateway(); if (writeArtifact) { const dir = path.join(root, 'artifacts', 'w406-w407-action-gateway-gate'); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`); } return result; }
if (import.meta.url === `file://${process.argv[1]}`) { const result = runW406W407ActionGatewayGate(); process.stdout.write(`W406/W407 Action Gateway gate passed (${result.checkCount}/${result.checkCount}).\n`); }
