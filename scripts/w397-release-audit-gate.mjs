#!/usr/bin/env node
/** W397 source gate: verifies the release checklist is complete and honest. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W397_RELEASE_AUDIT_CONTRACT, validateW397ReleaseAuditContract } from '../config/w397-release-audit-contract.mjs';
import { getW397ReleaseAuditTruth } from '../assets/js/local-first/w397-release-audit-board.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW397ReleaseAudit() {
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const contract = W397_RELEASE_AUDIT_CONTRACT;
  const pkg = JSON.parse(read('package.json'));
  const docs = read('docs/W397_FINAL_RELEASE_AUDIT_2026-06-28.md');
  const board = read('assets/js/local-first/w397-release-audit-board.js');
  const truth = getW397ReleaseAuditTruth();

  check('contract-valid', validateW397ReleaseAuditContract(contract).length === 0, 'W397 audit contract has no internal violations');
  for (const script of contract.requiredSourceScripts) check(`script:${script}`, Boolean(pkg.scripts?.[script]), `required release-candidate script exists: ${script}`);
  check('composite-command', /verify:w397-release-candidate/.test(JSON.stringify(pkg.scripts || {})), 'package exposes one complete W397 release candidate command');
  check('manual-blockers-documented', contract.manualBlockers.every((id) => docs.includes(id) || docs.includes(id.replaceAll('-', ' '))), 'every manual blocker is documented');
  check('source-not-production', /source candidate only/i.test(docs) && /productionReleaseCertified: false/.test(board), 'W397 never equates source green with production release');
  check('inactive-features-documented', contract.inactiveUntilLater.every((id) => docs.includes(id) || docs.includes(id.replaceAll('-', ' '))), 'deferred feature boundaries are documented');
  check('board-no-transport', /networkRequestCreated: false/.test(board) && /browserStorageRead: false/.test(board) && /releaseCertification: false/.test(board), 'local audit board has no transport or certification behavior');
  check('truth-boundaries', truth.releaseCertification === false && truth.collectionEnabled === false && truth.referralRewardsEnabled === false && truth.socialConnectorEnabled === false, 'runtime audit truth keeps Collection, referrals and connectors inactive');
  check('identity-restore-order', /Controlled Google OAuth Testing-mode sign-in/.test(docs) && /W396 encrypted local backup recovery drill/.test(docs), 'manual identity and restore gates remain prerequisites');

  return Object.freeze({
    schema: 'eonapp.w397.release-audit-gate.v1',
    wave: 'W397',
    status: 'pass',
    sourceOnly: true,
    productionReleaseCertified: false,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    requiredManualBlockers: contract.manualBlockers,
    inactiveUntilLater: contract.inactiveUntilLater,
    limitations: Object.freeze([
      'This source gate does not observe a live deployment, real device, OAuth session, D1 binding, backup/restore action, dependency upgrade, or social platform.',
      'A human release decision remains required after the manual blocker evidence is complete.'
    ])
  });
}

export function runW397ReleaseAuditGate({ writeArtifact = true } = {}) {
  const result = inspectW397ReleaseAudit();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w397-release-audit-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW397ReleaseAuditGate();
  process.stdout.write(`W397 release audit gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
