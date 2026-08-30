#!/usr/bin/env node
/** W418/W611 source gate: final delivery must remain specific about engineering candidates versus external proof. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonCityProceduralRendererProfile } from '../assets/js/city/eon-city-procedural-renderer-profile.js';
import { getCityAssetReleasePreflightSummary } from '../assets/js/city/eon-city-asset-release-preflight.js';
import { W418_FINAL_FLAGSHIP_AUDIT_CONTRACT, validateW418FinalFlagshipAuditContract } from '../config/w418-final-flagship-audit-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW418FinalFlagshipAudit() {
  const contract = W418_FINAL_FLAGSHIP_AUDIT_CONTRACT;
  const handover = read('FINAL_HANDOVER_W418/00_START_HERE_CODEX.md');
  const operatorRunbook = read('FINAL_HANDOVER_W418/02_MANUAL_PROOF_CHECKLIST.md');
  const status = read('FINAL_HANDOVER_W418/04_STATUS_AND_BLOCKERS.md');
  const suite = read('scripts/run-current-unit-suite.mjs');
  const packageJson = read('package.json');
  const renderer = getEonCityProceduralRendererProfile();
  const assetRelease = getCityAssetReleasePreflightSummary();
  const requiredFiles = [
    'FINAL_HANDOVER_W418/00_START_HERE_CODEX.md',
    'FINAL_HANDOVER_W418/01_CODEX_EXECUTION_RUNBOOK.md',
    'FINAL_HANDOVER_W418/02_MANUAL_PROOF_CHECKLIST.md',
    'FINAL_HANDOVER_W418/03_FLAGSHIP_ASSET_PRODUCTION_BRIEF.md',
    'FINAL_HANDOVER_W418/04_STATUS_AND_BLOCKERS.md',
    'FINAL_HANDOVER_W418/05_CHANGED_FILES_W415_TO_W418.md',
    'FINAL_HANDOVER_W418/06_FINAL_VALIDATION_RECEIPT_W418.md',
    'FINAL_HANDOVER_W418/07_PACKAGE_CONTENTS_AND_EXCLUSIONS.md',
    'FINAL_HANDOVER_W418/08_PACKAGE_REPRODUCIBILITY_RECEIPT_W418.md',
    'FINAL_HANDOVER_W418/CODEX_W418_COPY_PASTE_PROMPT.md',
    'docs/W418_FINAL_FLAGSHIP_AUDIT_AND_CODEX_HANDOVER_2026-06-28.md'
  ];
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  check('contract-valid', validateW418FinalFlagshipAuditContract().length === 0, 'W418 contract has no internal mismatch');
  check('professional-handover-files-exist', requiredFiles.every((relative) => existsSync(path.join(root, relative))), 'Codex, manual-proof, asset and blocker documents exist');
  check('renderer-is-source-hardened-not-final-art', renderer.primaryWorldMaterial === 'PBRMetallicRoughnessMaterial' && renderer.shadows.cinematic === true && renderer.finalBinaryArt === false && renderer.remoteAssets === false, 'renderer claims only source-hardening scope');
  check('asset-release-is-blocked-until-evidence', assetRelease.ready === false && assetRelease.catalog.shipped >= 8 && /Local engineering-candidate City binaries/i.test(assetRelease.currentState) && assetRelease.truth.finalVisualCertification === false && assetRelease.truth.finalVisualReleaseApproved === false, 'local candidate art remains blocked from final release pending provenance and device evidence');
  check('unit-suite-includes-new-tests', ['w416-city-renderer-hardening.test.mjs', 'w417-city-asset-release-preflight.test.mjs', 'w418-final-flagship-audit.test.mjs'].every((name) => suite.includes(name)), 'current certification suite includes every W416–W418 test');
  check('package-exposes-final-commands', /qa:w416-city-renderer-hardening/.test(packageJson) && /qa:w417-city-asset-release-preflight/.test(packageJson) && /qa:w418-final-flagship-audit/.test(packageJson) && /verify:w418-final-flagship-source/.test(packageJson), 'package scripts expose independent and combined final checks');
  check('manual-proof-list-is-complete', /Google OAuth/i.test(operatorRunbook) && /Android/i.test(operatorRunbook) && /iOS/i.test(operatorRunbook) && /two-device/i.test(operatorRunbook) && /licensed\/original/i.test(operatorRunbook), 'manual checklist covers identity, devices, Sync and final art');
  check('handover-uses-precise-grade-language', /not an institutional-grade final visual-art certification/i.test(handover) && /source-complete/i.test(status) && /external proof/i.test(status), 'handover does not overstate City visual completion');
  return Object.freeze({ schema: 'eonapp.w418.final-flagship-audit-gate.v1', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), externalEvidenceRequired: contract.externalEvidenceRequired, prohibitedStatusClaims: contract.prohibitedStatusClaims });
}

export function runW418FinalFlagshipAuditGate({ writeArtifact = true } = {}) {
  const report = inspectW418FinalFlagshipAudit();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w418-final-flagship-audit-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runW418FinalFlagshipAuditGate();
  process.stdout.write(`W418 final flagship audit gate passed (${report.checkCount}/${report.checkCount}).\n`);
}
