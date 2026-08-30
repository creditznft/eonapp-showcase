#!/usr/bin/env node
/** W535 fresh evidence-first truth board. Aggregates local gates only and fails closed on absent source contracts. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W535_RELEASE_TRUTH_CONTRACT,
  validateW535ReleaseTruthContract
} from '../config/w535-release-truth-reaudit-contract.mjs';
import { inspectW519LegacyTransportQuarantine } from './w519-legacy-transport-quarantine-gate.mjs';
import { inspectW525AGoogleDriveVaultProfile } from './w525a-google-drive-vault-profile-gate.mjs';
import { inspectW525BAccountVaultUx } from './w525b-account-vault-ux-gate.mjs';
import { inspectW527EnvLocalAi } from './w527-env-local-ai-gate.mjs';
import { inspectW528MachineEvidence } from './w528-machine-evidence-gate.mjs';
import { inspectW529AndroidEmulator } from './w529-android-emulator-gate.mjs';
import { inspectW530SecurityOauth } from './w530-security-oauth-gate.mjs';
import { inspectW533DomainContinuity } from './w533-domain-continuity-gate.mjs';
import { inspectW534HistoricalDocumentation } from './w534-historical-documentation-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function buildW535ReleaseTruthBoard({ root = ROOT } = {}) {
  const issues = [...validateW535ReleaseTruthContract()];
  const checks = Object.freeze([
    Object.freeze({ id: 'W519', result: inspectW519LegacyTransportQuarantine({ root }) }),
    Object.freeze({ id: 'W525A', result: inspectW525AGoogleDriveVaultProfile({ root }) }),
    Object.freeze({ id: 'W525B', result: inspectW525BAccountVaultUx({ root }) }),
    Object.freeze({ id: 'W527', result: inspectW527EnvLocalAi() }),
    Object.freeze({ id: 'W528', result: inspectW528MachineEvidence({ root }) }),
    Object.freeze({ id: 'W529', result: inspectW529AndroidEmulator({ root }) }),
    Object.freeze({ id: 'W530', result: inspectW530SecurityOauth({ root }) }),
    Object.freeze({ id: 'W533', result: inspectW533DomainContinuity({ root }) }),
    Object.freeze({ id: 'W534', result: inspectW534HistoricalDocumentation({ root }) })
  ]);
  for (const check of checks) if (!check.result?.ok) issues.push(`source-check-failed:${check.id}`);
  const localSourceGreen = issues.length === 0;
  const boardState = localSourceGreen ? 'LIMITED_PREVIEW_ONLY' : 'BLOCKED';
  return Object.freeze({
    schema: W535_RELEASE_TRUTH_CONTRACT.schema,
    wave: 'W535',
    recordedAt: new Date().toISOString(),
    boardState,
    summary: localSourceGreen
      ? 'Local source contracts are green. This candidate is eligible only for an owner-authorized limited preview path; this source-only verifier does not prove preview, deployment, device, OAuth, Drive transfer, a current Trust Hub CID/gateway check, or an owner launch decision.'
      : 'One or more local source contracts failed. Do not create a preview or deployment until the listed issue is resolved.',
    localSourceGreen,
    checks: checks.map(({ id, result }) => Object.freeze({ id, ok: Boolean(result?.ok), sourceOnly: result?.sourceOnly !== false, issues: result?.issues || [] })),
    productTruth: Object.freeze({
      canonicalOrigin: 'https://eonapp.ch',
      capsule: 'encrypted-manual-user-held-export-import',
      automaticMultiDeviceSync: 'not-active',
      googleDrive: 'separate-encrypted-snapshot-source-present-not-externally-proven',
      googleLogin: 'identity-only-separate-from-drive-consent',
      localAiRuntime: 'explicit-loopback-probe-not-run',
      machineEvidence: 'source-static-shape-pass-emulated-browser-pending',
      androidEmulator: 'source-lane-pass-emulator-pending',
      securityOauth: 'source-structural-review-pass-external-evidence-pending',
      trustHub: 'separate-static-package-not-published-from-this-worktree',
      vaultReveals: 'visual-only-no-financial-or-ownership-effect'
    }),
    externalEvidenceRequired: W535_RELEASE_TRUTH_CONTRACT.externalEvidenceRequired,
    prohibitedClaims: W535_RELEASE_TRUTH_CONTRACT.prohibitedClaims,
    issues: Object.freeze(issues.sort())
  });
}

function main() {
  const board = buildW535ReleaseTruthBoard();
  const output = path.join(ROOT, 'tmp', 'w535-release-truth-board.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(board, null, 2)}\n`);
  console.log(JSON.stringify(board, null, 2));
  if (board.boardState === 'BLOCKED') process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
