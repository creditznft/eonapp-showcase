#!/usr/bin/env node
/** W435 static source gate. It validates a local job fabric; it does not run agents. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonbotJobFabricTruth } from '../assets/js/chat/eonbot-job-fabric.js';
import { W435_EONBOT_JOB_FABRIC_CONTRACT, validateW435EonbotJobFabricContract } from '../config/w435-eonbot-job-fabric-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export function inspectW435EonbotJobFabric() {
  const checks = [];
  const check = (id, condition, detail) => { checks.push({ id, pass: Boolean(condition), detail }); ensure(condition, `${id}: ${detail}`); };
  const implementation = read('assets/js/chat/eonbot-job-fabric.js');
  const updateSafe = read('assets/js/utils/update-safe-user-data.js');
  const truth = getEonbotJobFabricTruth();

  check('required-files', [
    'assets/js/chat/eonbot-job-fabric.js',
    'config/w435-eonbot-job-fabric-contract.mjs',
    'tests/unit/w435-eonbot-job-fabric.test.mjs'
  ].every((relative) => existsSync(path.join(root, relative))), 'implementation, contract and unit tests are present');
  check('contract-valid', validateW435EonbotJobFabricContract().length === 0 && W435_EONBOT_JOB_FABRIC_CONTRACT.wave === 'W435', 'contract preserves the approved W435 source-only job-fabric boundary');
  check('capability-and-intent', /resolveEonbotCapabilityMode/.test(implementation) && /classifyEonKernelIntent/.test(implementation) && /routeIntent/.test(implementation), 'job intake derives only a bounded capability and intent routing receipt');
  check('one-lifecycle', /'answer'/.test(implementation) && /'ready-for-review'/.test(implementation) && /'awaiting-approval'/.test(implementation) && /'completed'/.test(implementation) && /'failed'/.test(implementation), 'one visible lifecycle is defined');
  check('approval-and-receipt-gates', /explicit-user-action-required/.test(implementation) && /explicit-user-approval-required/.test(implementation) && /local-draft-hash-required/.test(implementation) && /local-result-receipt-hash-required/.test(implementation), 'review and completion require explicit person actions plus bounded evidence hashes');
  check('safe-retry-cancel', /retry-not-available/.test(implementation) && /cancelled/.test(implementation) && /safe-failure-code-required/.test(implementation), 'failure, cancellation and retry have bounded local receipts');
  check('no-network-or-privileged-api', !/\bfetch\s*\(/.test(implementation) && !/XMLHttpRequest|WebSocket|navigator\.serviceWorker|Notification\.requestPermission|PushManager|indexedDB/i.test(implementation), 'the job fabric creates no network, push, service-worker or database action');
  check('privacy-boundary', /rawPromptStored: false/.test(implementation) && /rawOutputStored: false/.test(implementation) && /credentialRead: false/.test(implementation) && /SENSITIVE_TEXT/.test(implementation), 'jobs store safe labels and receipt hashes, never prompts, outputs or credentials');
  check('update-survival-registry', updateSafe.includes('eon:eonbot:job-fabric:v1'), 'the local job-fabric key is covered by update-safe data preservation');
  check('truth-boundary', truth.externalExecution === false && truth.providerRequestCreated === false && truth.backgroundAfterClose === false && truth.liveAgentOrNpcClaim === false && truth.productionExecutionProof === false, 'source work does not claim agents, NPC activity, background work or production execution');
  return Object.freeze({
    schema: 'eonapp.w435.eonbot-job-fabric-gate.v1',
    wave: 'W435',
    status: 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    limitations: Object.freeze([
      'No provider adapter, Action Gateway, background runner, external posting, deployment, payment, account connection or device proof was activated.',
      'City AgentSignal/NPC activity remains a later W439 receipt-driven integration; this fabric does not claim live City workers.'
    ])
  });
}

export function runW435EonbotJobFabricGate({ writeArtifact = true } = {}) {
  const result = inspectW435EonbotJobFabric();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w435-eonbot-job-fabric-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW435EonbotJobFabricGate();
  process.stdout.write(`W435 EONBOT job-fabric gate passed (${result.checkCount}/${result.checkCount}). No agent execution was activated.\n`);
}
