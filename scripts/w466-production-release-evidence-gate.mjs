#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W466_PRODUCTION_RELEASE_EVIDENCE_CONTRACT, validateW466ProductionReleaseEvidenceContract } from '../config/w466-production-release-evidence-contract.mjs';
import {
  EON_W466_REQUIRED_COMMERCIAL_EXTERNAL_EVIDENCE,
  EON_W466_REQUIRED_CORE_EXTERNAL_EVIDENCE,
  EON_W466_REQUIRED_SOURCE_VALIDATION,
  buildEonW466ProductionReleaseEvidenceBoard,
  getEonW466ProductionReleaseTruth
} from '../assets/js/release/eon-w466-production-release-evidence.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const allTrue = (ids) => Object.fromEntries(ids.map((id) => [id, true]));

export function inspectW466ProductionReleaseEvidence() {
  const checks = [];
  const check = (id, value, detail) => {
    checks.push({ id, pass: Boolean(value), detail });
    assert.equal(Boolean(value), true, `${id}: ${detail}`);
  };
  const source = read('assets/js/release/eon-w466-production-release-evidence.js');
  const defaultBoard = buildEonW466ProductionReleaseEvidenceBoard();
  const coreReady = buildEonW466ProductionReleaseEvidenceBoard({
    sourceValidation: allTrue(EON_W466_REQUIRED_SOURCE_VALIDATION),
    externalEvidence: allTrue(EON_W466_REQUIRED_CORE_EXTERNAL_EVIDENCE)
  });
  const humanReviewReady = buildEonW466ProductionReleaseEvidenceBoard({
    sourceValidation: allTrue(EON_W466_REQUIRED_SOURCE_VALIDATION),
    externalEvidence: allTrue(EON_W466_REQUIRED_CORE_EXTERNAL_EVIDENCE),
    commercialEvidence: allTrue(EON_W466_REQUIRED_COMMERCIAL_EXTERNAL_EVIDENCE)
  });
  const truth = getEonW466ProductionReleaseTruth();

  check('required-files', [
    'config/w466-production-release-evidence-contract.mjs',
    'assets/js/release/eon-w466-production-release-evidence.js',
    'scripts/w466-production-release-evidence-gate.mjs',
    'tests/unit/w466-production-release-evidence.test.mjs'
  ].every((file) => existsSync(path.join(root, file))), 'W466 contract, evidence ledger, gate and tests exist');
  check('contract-valid', validateW466ProductionReleaseEvidenceContract().length === 0, 'W466 contract remains valid and source-only');
  check('canonical-route-boundary', W466_PRODUCTION_RELEASE_EVIDENCE_CONTRACT.canonicalRoutes.join(',') === '/,/eoncity,/insights', 'W466 preserves the canonical route contract');
  check('bounded-evidence-only', /retains no URLs, account IDs, logs/.test(source) && /screenshots, cookies, provider payloads, or user data/.test(source), 'ledger has no raw external evidence ingestion surface');
  check('default-blocked', defaultBoard.releaseReviewStatus === 'blocked-evidence-required' && defaultBoard.productionReleaseApproved === false && defaultBoard.commercialActivationApproved === false, 'default board cannot certify a release');
  check('core-ready-not-approved', coreReady.coreReviewStatus === 'ready-for-human-core-release-review-commercial-disabled' && coreReady.productionReleaseApproved === false, 'even a reviewed core lane remains human-blocked');
  check('full-evidence-not-approved', humanReviewReady.releaseReviewStatus === 'ready-for-human-release-review' && humanReviewReady.productionReleaseApproved === false && humanReviewReady.commercialActivationApproved === false, 'all boolean attestations still cannot self-approve a release or commerce');
  check('truth-boundary', truth.productionReleaseApproved === false && truth.commercialActivationApproved === false && truth.requiresHumanGoNoGo === true, 'source truth remains fail-closed');

  return Object.freeze({
    schema: 'eon.release.production-evidence-gate.w466.v1',
    wave: 'W466',
    status: 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    limitations: Object.freeze(['This gate validates release-evidence bookkeeping only. It is not deployment, Cloudflare, device, PWA, OAuth, Sync, Telegram, payment, legal, security, legacy-deletion, or human GO evidence.'])
  });
}

export function runW466ProductionReleaseEvidenceGate({ writeArtifact = true } = {}) {
  const result = inspectW466ProductionReleaseEvidence();
  if (writeArtifact) {
    const dir = path.join(root, 'artifacts', 'w466-production-release-evidence-gate');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW466ProductionReleaseEvidenceGate();
  process.stdout.write(`W466 production release evidence gate passed (${result.checkCount}/${result.checkCount}). Release remains externally blocked.\n`);
}
