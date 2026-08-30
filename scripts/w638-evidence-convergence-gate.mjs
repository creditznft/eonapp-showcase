#!/usr/bin/env node
/** W638 source gate and redacted production evidence indexer. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W638_EVIDENCE_CONVERGENCE_CONTRACT,
  validateW638EvidenceConvergenceContract
} from '../config/w638-evidence-convergence-contract.mjs';
import { buildW638EvidenceIndex, loadW638EvidenceBoard } from './lib/w638-evidence-index.mjs';
import { getDirectProviderRegistryTruth } from '../assets/js/direct-byok/provider-registry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const freeze = (value) => Object.freeze(value);
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

function inspectLegacyAuditSafety() {
  const audit = read('scripts/launch-evidence-audit.mjs');
  return !/manualStatusMissing/.test(audit) && /buildW638EvidenceIndex/.test(audit) && /productionVerdict/.test(audit);
}

function sourceChecks(index) {
  const contract = validateW638EvidenceConvergenceContract();
  const billing = JSON.parse(read('config/w628-billing-certification-board.json'));
  const referral = JSON.parse(read('config/w629-referral-certification-board.json'));
  const localCreator = JSON.parse(read('config/w625h-local-creator-certification-board.json'));
  const creator = JSON.parse(read('config/w627-creator-certification-board.json'));
  const provider = JSON.parse(read('config/w626-reviewed-provider-models.json'));
  const companion = JSON.parse(read('config/w626-creator-companion-release.json'));
  const providerTruth = getDirectProviderRegistryTruth();
  const files = [
    'config/w638-evidence-convergence-contract.mjs',
    'config/w638-evidence-convergence-board.json',
    'scripts/lib/w638-evidence-index.mjs',
    'scripts/w638-evidence-convergence-gate.mjs',
    'tests/unit/w638-evidence-convergence.test.mjs',
    'EVIDENCE/w638/README.md'
  ];
  return freeze([
    freeze({ id: 'contract', pass: contract.ok, detail: `${W638_EVIDENCE_CONVERGENCE_CONTRACT.lanes.length} evidence lanes` }),
    freeze({ id: 'files', pass: files.every(exists), detail: 'canonical contract, board, indexer, gate, test and intake instructions' }),
    freeze({ id: 'board-index', pass: index.sourceGateOk && index.productionCertified === false && ['not-run', 'no-go'].includes(index.productionVerdict), detail: `production verdict ${index.productionVerdict}` }),
    freeze({ id: 'billing-boundary', pass: billing.sourceComplete === true && billing.publicAvailabilityClaimAllowed === false && billing.liveCustomerEvidenceIncluded === false, detail: 'W628 source complete but real customer evidence pending' }),
    freeze({ id: 'referral-boundary', pass: referral.sourceComplete === true && referral.sourceOnlyCannotCertify === true && referral.syntheticBillingCannotCertify === true, detail: 'W629 source/synthetic evidence cannot certify rewards' }),
    freeze({ id: 'local-creator-boundary', pass: localCreator.certifying === false && localCreator.sourceIntegrationAloneCanPass === false && creator.sourceIntegrationAloneCanPass === false, detail: 'local Creator remains real-device NO-GO' }),
    freeze({ id: 'provider-boundary', pass: provider.status === 'reviewed-source-rails-enabled-real-user-owned-provider-proof-pending' && provider.models.length >= 5 && provider.models.every((model) => model.enabled === true && Boolean(model.reviewedAt) && Boolean(model.registryDigest)) && providerTruth.realProviderProofComplete === false && /pending/.test(providerTruth.currentProofState), detail: 'reviewed provider source rails may be enabled, but real user-owned provider proof remains non-certifying and pending' }),
    freeze({ id: 'companion-boundary', pass: companion.signed === false && companion.publicReleaseAllowed === false, detail: 'unsigned companion cannot certify or release' }),
    freeze({ id: 'manual-pass-retired', pass: inspectLegacyAuditSafety(), detail: 'legacy launch audit derives verdict from W638 index instead of typed Status: PASS' }),
    freeze({ id: 'redaction-boundary', pass: index.boundaries?.secretsIncluded === false && index.boundaries?.fullCustomerIdentifiersIncluded === false, detail: 'index contains digests and redacted metadata only' })
  ]);
}

export function inspectW638EvidenceConvergence({ writeArtifact = false } = {}) {
  const board = loadW638EvidenceBoard(root);
  const index = buildW638EvidenceIndex(board, { root });
  const checks = sourceChecks(index);
  const result = freeze({
    schema: 'eonapp.gate.billing-referral-creator-provider-evidence-convergence.w638.2026-07-11.v1',
    wave: 'W638',
    ok: checks.every((row) => row.pass),
    total: checks.length,
    passed: checks.filter((row) => row.pass).length,
    checks,
    productionVerdict: index.productionVerdict,
    productionCertified: index.productionCertified,
    evidenceIndex: index,
    limitations: freeze(W638_EVIDENCE_CONVERGENCE_CONTRACT.lanes.map((lane) => `${lane.id}: genuine external evidence pending until its derived lane verdict is PASS`))
  });
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts/w638-evidence-convergence');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'evidence-index.json'), `${JSON.stringify(index, null, 2)}\n`);
    fs.writeFileSync(path.join(directory, 'source-receipt.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const result = inspectW638EvidenceConvergence({ writeArtifact: true });
  for (const check of result.checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.id} — ${check.detail}`);
  console.log(`\nW638 evidence convergence source gate: ${result.passed}/${result.total}; production ${result.productionVerdict.toUpperCase()}`);
  if (!result.ok) process.exitCode = 1;
}
