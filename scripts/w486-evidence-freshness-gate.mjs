#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W486_EVIDENCE_FRESHNESS_CONTRACT, validateW486EvidenceFreshnessContract } from '../config/w486-evidence-freshness-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const absolute = (relative) => path.join(root, relative);
const read = (relative) => readFileSync(absolute(relative), 'utf8');
const exists = (relative) => existsSync(absolute(relative));

export function inspectW486EvidenceFreshness({ writeArtifact = false } = {}) {
  const checks = [];
  const check = (id, value, detail) => {
    checks.push({ id, pass: Boolean(value), detail });
    assert.equal(Boolean(value), true, `${id}: ${detail}`);
  };
  const pkg = JSON.parse(read('package.json'));
  const receipt = JSON.parse(read(W486_EVIDENCE_FRESHNESS_CONTRACT.currentReceipt));
  const reconciliation = read('MERGE_PROVENANCE/INSTITUTIONAL_SCORE_RECONCILIATION.md');
  const historicalNotice = receipt?.historical_artifact_notice || {};

  check('required-files', [
    'config/w486-evidence-freshness-contract.mjs',
    'scripts/w486-evidence-freshness-gate.mjs',
    'tests/unit/w486-evidence-freshness.test.mjs',
    W486_EVIDENCE_FRESHNESS_CONTRACT.currentReceipt,
    'MERGE_PROVENANCE/INSTITUTIONAL_SCORE_RECONCILIATION.md'
  ].every(exists), 'W486 contract, gate, test and current evidence files exist');
  check('contract-valid', validateW486EvidenceFreshnessContract().length === 0, 'W486 contract validates');
  check('script-wired', pkg.scripts['qa:w486-evidence-freshness'] === 'node scripts/w486-evidence-freshness-gate.mjs && node --test tests/unit/w486-evidence-freshness.test.mjs', 'package.json exposes W486 QA');
  check('verify-chain-wired', /qa:w486-evidence-freshness/.test(pkg.scripts['verify:w4795-codex-ready-source'] || ''), 'final verification chain includes W486');
  const suite = receipt?.validation?.unit_suite || {};
  check('current-suite-recorded', Number.isInteger(suite.tests) && suite.tests >= 550 && suite.passed === suite.tests && suite.failed === 0, `W485 receipt records a passing current suite (${suite.passed || 0}/${suite.tests || 0})`);
  check('source-still-not-production-approved', receipt?.external_status?.city_live_certification?.includes('FIX REQUIRED') && receipt?.external_status?.physical_device_proof === 'NOT PROVEN', 'receipt keeps external City/device proof unapproved');
  check('score-reconciliation-is-explicit', /46\.2\/100/.test(reconciliation) && /historic risk observation/i.test(reconciliation), 'score reconciliation marks the old value as historical rather than current proof');
  for (const artifact of W486_EVIDENCE_FRESHNESS_CONTRACT.historicArtifacts) {
    const historicPresent = exists(artifact.path);
    const historicKey = /W235/.test(artifact.path) ? 'w235' : /W238/.test(artifact.path) ? 'w238' : '';
    const ledgeredWhenAbsent = historicPresent || (artifact.portableRetention === 'ledger-only-when-historic-binary-is-not-in-the-clean-source-handover' && Boolean(historicalNotice?.[historicKey]));
    check(`historic-artifact-traceable:${path.basename(artifact.path)}`, ledgeredWhenAbsent, historicPresent ? 'historic report is retained for traceability' : 'lean source handover records this historic report in the current validation receipt');
    check(`current-proof-present:${path.basename(artifact.path)}`, exists(artifact.currentExecutableProof), 'current executable replacement proof exists');
  }

  const result = Object.freeze({
    schema: `${W486_EVIDENCE_FRESHNESS_CONTRACT.schema}.gate-report`,
    wave: 'W486',
    status: 'pass',
    checkCount: checks.length,
    checks: Object.freeze(checks),
    authorityOrder: W486_EVIDENCE_FRESHNESS_CONTRACT.authorityOrder,
    staleArtifacts: W486_EVIDENCE_FRESHNESS_CONTRACT.historicArtifacts,
    externalStatus: W486_EVIDENCE_FRESHNESS_CONTRACT.truth
  });
  if (writeArtifact) {
    const dir = absolute('artifacts/w486-evidence-freshness');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'report.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = inspectW486EvidenceFreshness({ writeArtifact: true });
  process.stdout.write(`W486 evidence-freshness gate passed (${result.checkCount}/${result.checkCount}); historic artifacts remain context-only.\n`);
}
