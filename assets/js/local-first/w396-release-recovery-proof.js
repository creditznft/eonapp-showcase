/**
 * W396 — redacted local release/restore evidence board.
 *
 * This helper never snapshots browser storage, reads files, contacts a server,
 * invokes backup export, or certifies a release. It only gives the operator a
 * small, secret-safe checklist record that can accompany human browser proof.
 */
import { W145_UPDATE_SURVIVAL_SCHEMA } from '../utils/update-safe-user-data.js';
import { EON_LOCAL_ENCRYPTED_EXPORT_SCHEMA } from './eon-local-encrypted-export.js';

export const W396_RELEASE_RECOVERY_SCHEMA = 'eonapp.w396.release-recovery-evidence.v1';
export const W396_MANUAL_LANES = Object.freeze([
  Object.freeze({ id: 'pre-update-local-storage-manifest', label: 'Capture redacted pre-update local-state manifest', required: true }),
  Object.freeze({ id: 'cold-start-after-deploy', label: 'Cold-start the updated release on the same browser profile', required: true }),
  Object.freeze({ id: 'encrypted-backup-export', label: 'Create an explicit encrypted local backup', required: true }),
  Object.freeze({ id: 'encrypted-backup-recovery-drill-into-empty-target', label: 'Restore the backup into a separate empty local target', required: true }),
  Object.freeze({ id: 'rollback-or-last-known-good-recovery', label: 'Verify last-known-good rollback or recovery procedure', required: true }),
  Object.freeze({ id: 'guest-and-identity-local-work-boundary', label: 'Verify guest/identity flow does not upload or restore local work', required: true }),
  Object.freeze({ id: 'redacted-real-browser-evidence', label: 'Attach redacted manual browser evidence', required: true })
]);

const SECRET_PATTERN = /(api[-_ ]?key|secret|token|password|mnemonic|seed|private[-_ ]?key|cookie|authorization|bearer|session[_-]?id)/i;

function cleanText(value = '', max = 240) {
  let output = '';
  for (const character of String(value ?? '')) {
    const code = character.codePointAt(0) || 0;
    output += code < 32 || code === 127 ? ' ' : character;
    if (output.length >= max) break;
  }
  return output.trim();
}

function cleanReleaseId(value = '') {
  return cleanText(value, 80).replace(/[^a-z0-9._-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'unlabeled-release';
}

function cleanNote(value = '') {
  const note = cleanText(value, 240);
  return SECRET_PATTERN.test(note) ? '[redacted: secret-shaped note rejected]' : note;
}

function safeCompletionMap(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const output = {};
  for (const lane of W396_MANUAL_LANES) {
    const candidate = source[lane.id] && typeof source[lane.id] === 'object' ? source[lane.id] : {};
    output[lane.id] = Object.freeze({
      completed: candidate.completed === true,
      note: cleanNote(candidate.note),
      evidenceRef: cleanText(candidate.evidenceRef, 120).replace(/[^a-z0-9._/-]/gi, '')
    });
  }
  return Object.freeze(output);
}

export function createW396ReleaseRecoveryEvidence({ releaseId = '', operatorNotes = '', lanes = {}, createdAt = Date.now() } = {}) {
  const completion = safeCompletionMap(lanes);
  const pending = W396_MANUAL_LANES.filter((lane) => completion[lane.id].completed !== true).map((lane) => lane.id);
  return Object.freeze({
    schema: W396_RELEASE_RECOVERY_SCHEMA,
    releaseId: cleanReleaseId(releaseId),
    createdAt: new Date(Number.isFinite(Number(createdAt)) ? Number(createdAt) : Date.now()).toISOString(),
    operatorNotes: cleanNote(operatorNotes),
    lanes: completion,
    pending,
    manualProofComplete: pending.length === 0,
    sourceOnly: true,
    releaseCertified: false,
    storageProofSchema: W145_UPDATE_SURVIVAL_SCHEMA,
    encryptedBackupSchema: EON_LOCAL_ENCRYPTED_EXPORT_SCHEMA,
    automaticCloudBackup: false,
    automaticCrossDeviceSync: false,
    identityRestoresLocalWork: false,
    notes: Object.freeze([
      'This board records only user-entered, redacted proof references. It does not inspect storage, files, sessions, credentials, Cloudflare, Google or browser activity.',
      'Even when every lane is marked complete, a human W397 release audit is still required before any release certification claim.'
    ])
  });
}

export function getW396ReleaseRecoveryTruth() {
  return Object.freeze({
    schema: W396_RELEASE_RECOVERY_SCHEMA,
    localProofBoardOnly: true,
    networkRequestCreated: false,
    browserStorageRead: false,
    browserStorageWrite: false,
    fileRead: false,
    backupExportStarted: false,
    backupRestoreStarted: false,
    automaticCloudBackup: false,
    automaticCrossDeviceSync: false,
    releaseCertification: false
  });
}
