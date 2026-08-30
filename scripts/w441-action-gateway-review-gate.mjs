#!/usr/bin/env node
import assert from 'node:assert/strict'; import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { getEonActionGatewayReviewPilotTruth } from '../assets/js/action-gateway/eon-action-gateway-review-pilot.js';
import { W441_ACTION_GATEWAY_REVIEW_CONTRACT, validateW441ActionGatewayReviewContract } from '../config/w441-action-gateway-review-contract.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const read = (file) => readFileSync(path.join(root, file), 'utf8'); const ensure = (value, message) => assert.equal(Boolean(value), true, message);
export function inspectW441ActionGatewayReview() {
  const checks = []; const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const pilot = read('assets/js/action-gateway/eon-action-gateway-review-pilot.js'); const workspace = read('assets/js/action-gateway/eon-action-gateway-workspace.js'); const updateSafe = read('assets/js/utils/update-safe-user-data.js'); const truth = getEonActionGatewayReviewPilotTruth();
  check('required-files', ['assets/js/action-gateway/eon-action-gateway-review-pilot.js', 'config/w441-action-gateway-review-contract.mjs', 'tests/unit/w441-action-gateway-review.test.mjs'].every((file) => existsSync(path.join(root, file))), 'review pilot, contract and test exist');
  check('contract-valid', validateW441ActionGatewayReviewContract().length === 0 && W441_ACTION_GATEWAY_REVIEW_CONTRACT.wave === 'W441', 'contract keeps execution unavailable');
  check('approved-local-lifecycle', /explicitScopeApproval/.test(pilot) && /explicitFinalApproval/.test(pilot) && /approval-held/.test(pilot) && /local-approval-/.test(pilot), 'proposal scope and final approval create local review receipts only');
  check('fail-closed-execution', /external-execution-not-released/.test(pilot) && /externalEffectCreated: false/.test(pilot) && /credentialRead: false/.test(pilot), 'execution attempt remains explicitly blocked');
  check('no-network-or-worker', !/\bfetch\s*\(|XMLHttpRequest|WebSocket|navigator\.serviceWorker|indexedDB/.test(pilot), 'pilot starts no network, worker or database action');
  check('workspace-truth', /getEonActionGatewayReviewPilotTruth/.test(workspace) && /cannot execute externally/.test(workspace), 'work surface calls the local review layer by its truthful state');
  check('update-safe-key', updateSafe.includes('eon:action-gateway:review-pilot:v1'), 'review pilot record is protected by W145');
  check('truth-boundary', truth.externalExecution === false && truth.credentialRead === false && truth.backgroundJobCreated === false && truth.productionExecutionProof === false, 'source does not claim Action Gateway execution proof');
  return Object.freeze({ schema: 'eonapp.w441.action-gateway-review-gate.v1', wave: 'W441', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['No server action record, token, OAuth, provider connection, post, repository, deployment, payment or external effect exists.']) });
}
export function runW441ActionGatewayReviewGate({ writeArtifact = true } = {}) { const result = inspectW441ActionGatewayReview(); if (writeArtifact) { const dir = path.join(root, 'artifacts', 'w441-action-gateway-review-gate'); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`); } return result; }
if (import.meta.url === `file://${process.argv[1]}`) { const result = runW441ActionGatewayReviewGate(); process.stdout.write(`W441 Action Gateway review gate passed (${result.checkCount}/${result.checkCount}). No external action was executed.\n`); }
