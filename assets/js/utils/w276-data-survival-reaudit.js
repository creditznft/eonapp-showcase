/**
 * W276 — data survival and migration re-audit.
 *
 * This module is intentionally evidence-only. It strengthens the local storage
 * comparison used by W145 and models the external proof that still has to be
 * observed on real Preview/PWA deployments. It must never be used to claim a
 * Cloudflare deployment, browser upgrade, IndexedDB migration, or recovery
 * drill has happened when it has not.
 */
import {
  W145_UPDATE_SURVIVAL_SCHEMA,
  assertW145UpdateSurvivalManifest,
  buildW145UpdateSurvivalManifest
} from './update-safe-user-data.js';

export const W276_DATA_SURVIVAL_REAUDIT_SCHEMA = 'eonapp.w276.data-survival-reaudit.v1';
export const W276_REQUIRED_EVIDENCE_IDS = Object.freeze([
  'pre-update-redacted-export',
  'preview-upgrade-and-downgrade',
  'installed-pwa-update-and-rollback',
  'chat-vault-projects-workspace-city-restore',
  'indexeddb-and-cache-preservation',
  'malformed-data-recovery-and-support-handoff'
]);

export const W276_RELEASE_CLAIM_FENCE = Object.freeze([
  'No Cloudflare update, PWA update, downgrade, restore, IndexedDB, cache, device, support or release claim is proven by a local simulation.',
  'Do not capture or upload raw Vault values, provider keys, Chat content, wallets, private project text, or personal identity data.',
  'A failed, blocked, or not-run task remains evidence; it must not be rewritten as pass.'
]);

function cloneEvidenceRows(evidence = []) {
  const byId = new Map((Array.isArray(evidence) ? evidence : []).map((row) => [String(row?.id || ''), row]));
  return W276_REQUIRED_EVIDENCE_IDS.map((id) => {
    const row = byId.get(id) || {};
    return Object.freeze({
      id,
      status: ['not-collected', 'blocked', 'failed', 'passed'].includes(row.status) ? row.status : 'not-collected',
      evidenceRefs: Array.isArray(row.evidenceRefs) ? row.evidenceRefs.map((value) => String(value).slice(0, 180)) : [],
      notes: String(row.notes || '').slice(0, 600)
    });
  });
}

export function buildW276LocalStorageReaudit(beforeStorage = {}, afterStorage = beforeStorage, options = {}) {
  const manifest = buildW145UpdateSurvivalManifest(beforeStorage, afterStorage, {
    simulatedFrom: options.fromBuild || 'previous-reviewed-build',
    simulatedTo: options.toBuild || 'candidate-reviewed-build',
    reason: options.reason || 'w276-local-storage-reaudit'
  });
  const observedAppOwnedKeys = Number(manifest.before?.appOwnedKeyCount || 0);
  const dynamicAppOwnedKeys = Number(manifest.unclassifiedSummary?.totalObservedKeys || 0);
  return Object.freeze({
    schema: W276_DATA_SURVIVAL_REAUDIT_SCHEMA,
    type: 'local-storage-transition-check',
    localOnly: true,
    externalDeploymentEvidence: false,
    sourceManifestSchema: W145_UPDATE_SURVIVAL_SCHEMA,
    ok: Boolean(manifest.ok),
    observedAppOwnedKeys,
    dynamicAppOwnedKeys,
    lostKeys: [...(manifest.lostKeys || [])],
    changedKeys: [...(manifest.changedKeys || [])],
    unexpectedNewAppKeys: [...(manifest.unexpectedNewAppKeys || [])],
    manifest
  });
}

export function assertW276LocalStorageReaudit(result) {
  if (!result || result.schema !== W276_DATA_SURVIVAL_REAUDIT_SCHEMA || result.type !== 'local-storage-transition-check') {
    throw new Error('Invalid W276 local-storage re-audit result');
  }
  assertW145UpdateSurvivalManifest(result.manifest);
  if (!result.ok) throw new Error('W276 local-storage re-audit failed');
  return result;
}

export function buildW276EvidenceBoard(options = {}) {
  const requiredEvidence = cloneEvidenceRows(options.requiredEvidence);
  const passedExternalEvidence = requiredEvidence.filter((row) => row.status === 'passed' && row.evidenceRefs.length > 0).length;
  const allExternalEvidencePassed = passedExternalEvidence === W276_REQUIRED_EVIDENCE_IDS.length;
  const requestedVerdict = String(options.verdict || 'NO_GO');
  const verdict = allExternalEvidencePassed && requestedVerdict === 'READY_FOR_INDEPENDENT_REVIEW'
    ? 'READY_FOR_INDEPENDENT_REVIEW'
    : 'NO_GO';
  return Object.freeze({
    schema: W276_DATA_SURVIVAL_REAUDIT_SCHEMA,
    boardId: String(options.boardId || 'W276-DATA-SURVIVAL-REAUDIT').slice(0, 120),
    generatedAt: options.generatedAt || new Date().toISOString(),
    verdict,
    verdictReason: verdict === 'NO_GO'
      ? 'External upgrade, rollback, restore, IndexedDB/cache and support evidence is incomplete or has not received independent review.'
      : 'Evidence collection is complete; an independent reviewer still decides release readiness.',
    localStaticBaseline: Object.freeze({
      status: String(options.localStaticStatus || 'strengthened-not-external-proof'),
      source: 'W145 local storage simulation plus W276 dynamic app-owned key comparison',
      externalDeploymentEvidence: false
    }),
    requiredEvidence,
    releaseClaimFence: W276_RELEASE_CLAIM_FENCE,
    canDeclareReleaseReadiness: false
  });
}

export function validateW276EvidenceBoard(board) {
  const errors = [];
  if (!board || board.schema !== W276_DATA_SURVIVAL_REAUDIT_SCHEMA) errors.push('Invalid W276 evidence-board schema.');
  if (!board || !['NO_GO', 'READY_FOR_INDEPENDENT_REVIEW'].includes(board.verdict)) errors.push('W276 board verdict is invalid.');
  if (board?.canDeclareReleaseReadiness !== false) errors.push('W276 may not self-declare release readiness.');
  const rows = Array.isArray(board?.requiredEvidence) ? board.requiredEvidence : [];
  if (rows.length !== W276_REQUIRED_EVIDENCE_IDS.length) errors.push('W276 must enumerate each required external evidence lane exactly once.');
  for (const id of W276_REQUIRED_EVIDENCE_IDS) {
    const matches = rows.filter((row) => row?.id === id);
    if (matches.length !== 1) errors.push(`W276 required evidence lane missing or duplicated: ${id}.`);
    const row = matches[0];
    if (row && !['not-collected', 'blocked', 'failed', 'passed'].includes(row.status)) errors.push(`W276 lane has invalid status: ${id}.`);
    if (row?.status === 'passed' && (!Array.isArray(row.evidenceRefs) || row.evidenceRefs.length === 0)) errors.push(`W276 cannot mark ${id} passed without an evidence reference.`);
  }
  const anyIncomplete = rows.some((row) => row.status !== 'passed');
  if (board?.verdict === 'READY_FOR_INDEPENDENT_REVIEW' && anyIncomplete) errors.push('W276 cannot reach independent review while evidence is incomplete.');
  if (board?.verdict === 'NO_GO' && !anyIncomplete && rows.length === W276_REQUIRED_EVIDENCE_IDS.length) errors.push('W276 board is inconsistent: all evidence is passed but verdict is still NO_GO.');
  return Object.freeze({ ok: errors.length === 0, errors });
}

export default {
  W276_DATA_SURVIVAL_REAUDIT_SCHEMA,
  W276_REQUIRED_EVIDENCE_IDS,
  W276_RELEASE_CLAIM_FENCE,
  buildW276LocalStorageReaudit,
  assertW276LocalStorageReaudit,
  buildW276EvidenceBoard,
  validateW276EvidenceBoard
};
