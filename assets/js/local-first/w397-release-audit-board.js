/** W397 — local, redacted human release-audit board. */
import { W397_RELEASE_AUDIT_CONTRACT } from '../../../config/w397-release-audit-contract.mjs';

export const W397_RELEASE_AUDIT_BOARD_SCHEMA = 'eonapp.w397.release-audit-board.v1';

const SECRET_RE = /(api[-_ ]?key|secret|token|password|mnemonic|seed|private[-_ ]?key|cookie|authorization|bearer|session[_-]?id)/i;

function cleanText(value = '', max = 200) {
  let output = '';
  for (const character of String(value ?? '')) {
    const code = character.codePointAt(0) || 0;
    output += code < 32 || code === 127 ? ' ' : character;
    if (output.length >= max) break;
  }
  return output.trim();
}

function safeRef(value = '') {
  const text = cleanText(value, 120);
  return SECRET_RE.test(text) ? '[redacted: secret-shaped evidence reference rejected]' : text.replace(/[^a-z0-9._/:-]/gi, '');
}

function safeNote(value = '') {
  const text = cleanText(value, 200);
  return SECRET_RE.test(text) ? '[redacted: secret-shaped note rejected]' : text;
}

function safeManualBlockers(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const entries = {};
  for (const id of W397_RELEASE_AUDIT_CONTRACT.manualBlockers) {
    const row = source[id] && typeof source[id] === 'object' ? source[id] : {};
    entries[id] = Object.freeze({
      observed: row.observed === true,
      evidenceRef: safeRef(row.evidenceRef),
      note: safeNote(row.note)
    });
  }
  return Object.freeze(entries);
}

export function createW397ReleaseAuditBoard({ releaseId = '', notes = '', manualBlockers = {}, createdAt = Date.now() } = {}) {
  const blockers = safeManualBlockers(manualBlockers);
  const pending = W397_RELEASE_AUDIT_CONTRACT.manualBlockers.filter((id) => blockers[id].observed !== true);
  return Object.freeze({
    schema: W397_RELEASE_AUDIT_BOARD_SCHEMA,
    releaseId: cleanText(releaseId, 80).replace(/[^a-z0-9._-]/gi, '-') || 'unlabeled-release',
    createdAt: new Date(Number.isFinite(Number(createdAt)) ? Number(createdAt) : Date.now()).toISOString(),
    notes: safeNote(notes),
    sourceGateStatus: 'must-be-run-separately',
    manualBlockers: blockers,
    pending,
    manualEvidenceComplete: pending.length === 0,
    sourceOnly: true,
    productionReleaseCertified: false,
    inactiveUntilLater: W397_RELEASE_AUDIT_CONTRACT.inactiveUntilLater,
    warnings: Object.freeze([
      'This board does not inspect a device, server, D1 database, Google setting, backup file, OAuth session, social connection or production deployment.',
      'Completing fields records human observations only; an authorized human must still make the release decision.'
    ])
  });
}

export function getW397ReleaseAuditTruth() {
  return Object.freeze({
    schema: W397_RELEASE_AUDIT_BOARD_SCHEMA,
    browserStorageRead: false,
    browserStorageWrite: false,
    networkRequestCreated: false,
    releaseCertification: false,
    collectionEnabled: false,
    referralRewardsEnabled: false,
    socialConnectorEnabled: false
  });
}
