/**
 * W342 — read-only missing-evidence recovery status.
 *
 * This does not create, copy, or normalize release evidence. It only tells an
 * operator which canonical files must be recovered from authoritative source
 * control or regenerated with real proof.
 */

import fs from 'node:fs';
import path from 'node:path';

export const W342_EVIDENCE_RECOVERY_SCHEMA = 'eonapp.w342.evidence-recovery.v1';

export const W342_REQUIRED_AUTHORITATIVE_EVIDENCE = Object.freeze([
  'release-evidence/W260_RELEASE_BOARD_2026-06-25/RELEASE_BOARD.json',
  'release-evidence/W263_EONBOT_CAPABILITY_EXECUTION_SOURCE_READINESS_2026-06-25/W263_BOARD.json',
  'release-evidence/W264_CREATOR_BUILD_HANDOFF_SOURCE_READINESS_2026-06-25/W264_BOARD.json',
  'release-evidence/W267_RED_TEAM_AUDIT_2026-06-25/RED_TEAM_BOARD.json',
  'release-evidence/W268_OPERATIONS_READINESS_2026-06-25/OPERATIONS_BOARD.json',
  'release-evidence/W271_ACCESSIBILITY_I18N_SOURCE_READINESS_2026-06-25/W271_BOARD.json',
  'release-evidence/W272_SECURITY_SUPPLYCHAIN_SOURCE_READINESS_2026-06-25/W272_BOARD.json',
  'release-evidence/W281_AI_PROVIDER_LIFECYCLE_SOURCE_READINESS_2026-06-25/W281_BOARD.json',
  'release-evidence/W285_LOCAL_AI_DEVICE_SUPPORT_SOURCE_READINESS_2026-06-25/W285_BOARD.json',
  'release-evidence/W287_EONBOT_LANGUAGE_VOICE_SOURCE_READINESS_2026-06-25/W287_BOARD.json',
  'release-evidence/W288_CREATOR_HANDOFF_INTEGRITY_SOURCE_READINESS_2026-06-25/W288_BOARD.json'
]);

export function buildW342EvidenceRecoveryStatus(root = process.cwd()) {
  const missing = W342_REQUIRED_AUTHORITATIVE_EVIDENCE.filter((relative) => !fs.existsSync(path.join(root, relative)));
  return Object.freeze({
    schema: W342_EVIDENCE_RECOVERY_SCHEMA,
    status: missing.length ? 'blocked-authoritative-recovery-required' : 'present-awaiting-validation',
    missing: Object.freeze(missing),
    presentCount: W342_REQUIRED_AUTHORITATIVE_EVIDENCE.length - missing.length,
    requiredCount: W342_REQUIRED_AUTHORITATIVE_EVIDENCE.length,
    fabricated: false,
    archiveHashManifestChanged: false,
    nextStep: missing.length
      ? 'Retrieve the exact files from authoritative source control or regenerate them with real evidence; do not fabricate boards.'
      : 'Run every existing evidence gate and preserve its original provenance.'
  });
}
