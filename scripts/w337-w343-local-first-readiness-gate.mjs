#!/usr/bin/env node
/** W337–W343 — source-only local runner, provider review, manual handoff and beta readiness gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W337_W343_LOCAL_FIRST_READINESS_CONTRACT } from '../config/w337-w343-local-first-readiness-contract.mjs';
import { buildW342EvidenceRecoveryStatus } from '../config/w342-evidence-recovery-status.mjs';
import { getEonLocalRunnerFeasibilityTruth } from '../assets/js/ai-kernel/eon-local-runner-feasibility.js';
import { getEonProviderReviewBoardTruth } from '../assets/js/ai-kernel/eon-provider-review-board.js';
import { getEonDirectManualSubmissionTruth } from '../assets/js/ai-kernel/eon-direct-manual-submission-proof.js';
import { getEonDeviceEvidenceMatrixTruth } from '../assets/js/local-first/eon-device-evidence-matrix.js';
import { getEonLocalBetaReadinessTruth } from '../assets/js/local-first/eon-local-beta-readiness.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function runW337W343LocalFirstReadinessGate(root = ROOT) {
  const contract = W337_W343_LOCAL_FIRST_READINESS_CONTRACT;
  const errors = [];
  for (const relative of contract.requiredFiles) {
    if (!fs.existsSync(path.join(root, relative))) errors.push(`Required W337–W343 file missing: ${relative}`);
  }
  if (errors.length) return Object.freeze({ schema: contract.schema, ok: false, errors });

  const sourceFiles = contract.requiredFiles.filter((relative) => relative.startsWith('assets/') || relative.startsWith('config/'));
  for (const relative of sourceFiles) {
    const content = fs.readFileSync(path.join(root, relative), 'utf8');
    for (const pattern of contract.forbiddenPatterns) {
      if (content.includes(pattern)) errors.push(`Forbidden remote/persistence primitive in ${relative}: ${pattern}`);
    }
  }

  const runner = getEonLocalRunnerFeasibilityTruth();
  const providers = getEonProviderReviewBoardTruth();
  const manual = getEonDirectManualSubmissionTruth();
  const devices = getEonDeviceEvidenceMatrixTruth();
  const beta = getEonLocalBetaReadinessTruth();
  const evidence = buildW342EvidenceRecoveryStatus(root);
  const combined = {
    backgroundRunnerShipped: runner.backgroundRunnerShipped,
    cloudRelay: runner.cloudRelay,
    hardcodedModels: providers.hardcodedModels,
    oauthInitiated: providers.oauthInitiated,
    remoteTelemetryCreated: devices.remoteTelemetryCreated,
    commercialFeaturesAllowed: beta.commercialFeaturesAllowed
  };
  for (const [key, expected] of Object.entries(contract.expectedTruth)) {
    if (combined[key] !== expected) errors.push(`W337–W343 truth drifted: ${key} must equal ${String(expected)}.`);
  }
  if (manual.publish !== false || manual.schedule !== false || manual.externalReceiptVerification !== false) errors.push('Manual submission handoff must remain user-controlled and unverified by EONAPP.');
  if (!evidence.missing.length || evidence.fabricated !== false || evidence.archiveHashManifestChanged !== false) errors.push('W342 evidence recovery status must report current missing provenance without fabrication or archive mutation.');

  return Object.freeze({
    schema: contract.schema,
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    truth: Object.freeze(combined),
    evidenceStatus: evidence.status,
    missingEvidenceCount: evidence.missing.length
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW337W343LocalFirstReadinessGate();
  if (!report.ok) console.error(JSON.stringify(report, null, 2));
  else console.log(`W337–W343 local-first readiness gate passed: research-only boundaries intact; ${report.missingEvidenceCount} authoritative evidence files still require recovery.`);
  process.exitCode = report.ok ? 0 : 1;
}
