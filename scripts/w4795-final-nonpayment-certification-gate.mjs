#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W4795_FINAL_NONPAYMENT_CERTIFICATION_CONTRACT, validateW4795FinalNonpaymentCertificationContract } from '../config/w4795-final-nonpayment-certification-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const exists = (file) => existsSync(path.join(root, file));

export function buildW4795FinalNonpaymentCertificationBoard() {
  const contract = W4795_FINAL_NONPAYMENT_CERTIFICATION_CONTRACT;
  return Object.freeze({
    schema: contract.schema,
    wave: contract.wave,
    status: 'source-ready-codex-proof-required',
    sourceOnly: true,
    requiredSourceCommands: contract.requiredSourceCommands,
    codexEvidenceRows: contract.codexEvidenceRows,
    certificationTruth: contract.certificationTruth,
    blockedUntilCodexProof: contract.blockedUntilCodexProof,
    codexInstruction: 'Fetch current main, rebase this source patch, run source commands, deploy only after green validation, capture every evidence row separately, then request owner GO/NO-GO. Do not activate commerce, local image/video adapters, direct social OAuth, or automatic posting.'
  });
}

export function inspectW4795FinalNonpaymentCertification({ writeArtifact = false } = {}) {
  const checks = [];
  const check = (id, value, detail) => {
    checks.push({ id, pass: Boolean(value), detail });
    assert.equal(Boolean(value), true, `${id}: ${detail}`);
  };
  const packageJson = JSON.parse(read('package.json'));
  const roadmap = read('NEXT_CHAT_CURRENT/MASTER_EXECUTION_ROADMAP_W479_R_TO_W482.md');
  const codexProtocol = read('NEXT_CHAT_CURRENT/CODEX_ROLE_AND_HANDOVER_PROTOCOL.md');
  const cityStatus = read('CITY_EVIDENCE_COMPACT/CITY_CERTIFICATION_STATUS.md');
  const board = buildW4795FinalNonpaymentCertificationBoard();

  check('required-files', [
    'config/w4795-final-nonpayment-certification-contract.mjs',
    'scripts/w4795-final-nonpayment-certification-gate.mjs',
    'tests/unit/w4795-final-nonpayment-certification.test.mjs',
    'NEXT_CHAT_CURRENT/MASTER_EXECUTION_ROADMAP_W479_R_TO_W482.md',
    'NEXT_CHAT_CURRENT/CODEX_ROLE_AND_HANDOVER_PROTOCOL.md'
  ].every(exists), 'W479.5 contract, gate, test, roadmap and Codex protocol exist');
  check('contract-valid', validateW4795FinalNonpaymentCertificationContract().length === 0, 'W479.5 contract validates');
  check('script-wired', packageJson.scripts['qa:w4795-final-nonpayment-certification'] === 'node scripts/w4795-final-nonpayment-certification-gate.mjs && node --test tests/unit/w4795-final-nonpayment-certification.test.mjs', 'package.json exposes W479.5 gate');
  check('verify-chain-wired', /qa:w4795-final-nonpayment-certification/.test(packageJson.scripts['verify:w4795-codex-ready-source'] || ''), 'final Codex-ready verify chain includes W479.5 gate');
  check('source-only-truth', board.sourceOnly === true && board.certificationTruth.productionCertifiedBySourceBundle === false, 'source board does not certify production');
  check('city-proof-blockers-visible', board.codexEvidenceRows.includes('cityDesktopColdWarm90s') && board.codexEvidenceRows.includes('cityAndroidPhysical') && board.codexEvidenceRows.includes('cityIphoneSafariPhysical') && board.codexEvidenceRows.includes('cityTabletPhysical'), 'City live and physical device proof remains explicit');
  check('commerce-social-media-inactive', board.certificationTruth.commerceApproved === false && board.certificationTruth.localImageVideoAdaptersActive === false && board.certificationTruth.directSocialConnectorsActive === false && board.certificationTruth.automaticPostingActive === false, 'no commerce/social/local-media activation claim');
  check('roadmap-boundary', /W480 — Dodo payments \(only after W479\.5 owner GO\)/.test(roadmap) && /No AI auto-posting/.test(roadmap), 'roadmap keeps Dodo and direct publishing behind proof');
  check('codex-role-boundary', /Codex may do/.test(codexProtocol) && /Codex may not do/.test(codexProtocol) && /activate Dodo/.test(codexProtocol) && /activate direct social connectors/.test(codexProtocol), 'Codex protocol forbids activation work');
  check('city-not-cert-by-archive', /FIX REQUIRED|FIX REQUIRED/i.test(cityStatus) || /physical/i.test(board.blockedUntilCodexProof.join(' ')), 'source package cannot erase previous live City proof blockers');

  const result = Object.freeze({
    schema: 'eon.release.final-nonpayment-certification-gate.w4795.v1',
    wave: 'W479.5',
    status: 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    board,
    limitations: Object.freeze(['This is a source-side final non-payment certification gate. It is not a production deploy, live browser witness, physical device run, payment approval, direct social connector, local image/video generation adapter, or owner GO.'])
  });

  if (writeArtifact) {
    const dir = path.join(root, 'artifacts', 'w4795-final-nonpayment-certification');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'board.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = inspectW4795FinalNonpaymentCertification({ writeArtifact: true });
  process.stdout.write(`W479.5 final non-payment certification gate passed (${result.checkCount}/${result.checkCount}). Codex/live proof still required.\n`);
}
