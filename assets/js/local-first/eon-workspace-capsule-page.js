/** W518 Capsule restore UI + W536 explicit Google Drive snapshot actions. No background sync or hidden restore. */
import {
  collectWorkspaceCapsuleEntries,
  createWorkspaceCapsuleFromStorage,
  createWorkspaceCapsuleRestoreSession,
  EON_WORKSPACE_CAPSULE_CONFIRMATION,
  EON_WORKSPACE_CAPSULE_SCHEMA,
  getWorkspaceCapsuleTruth,
  recoverPendingWorkspaceCapsule,
  serializeWorkspaceCapsule
} from './eon-workspace-capsule.js';
import { createDomainContinuityMovePlan } from './eon-domain-continuity.js';
import {
  downloadGoogleDriveSnapshot,
  getGoogleDriveSnapshotTruth,
  listGoogleDriveSnapshots,
  loadGoogleIdentityServices,
  readGoogleDrivePublicConfig,
  requestGoogleDriveAccess,
  revokeGoogleDriveAccess,
  trashGoogleDriveSnapshot,
  uploadGoogleDriveSnapshot
} from './eon-google-drive-snapshot-connector.js';
import { recordEonCoreOutcome } from '../contracts/outcomes/eon-core-outcome-authority.js';
import {
  EON_CREATOR_MEDIA_BUNDLE_CONFIRMATION,
  createCreatorMediaBundle,
  createCreatorMediaBundleRestoreSession,
  serializeCreatorMediaBundle
} from '../data-survival/eon-creator-media-bundle.js';

const $ = (selector) => document.querySelector(selector);
let stage = null;
let driveConfig = null;
let driveSession = null;
let drivePrepared = false;
const restoreSession = createWorkspaceCapsuleRestoreSession();
const mediaRestoreSession = createCreatorMediaBundleRestoreSession();
let mediaStage = null;
const loadDataSurvivalInventory = () => import('../data-survival/eon-data-survival-inventory.js');
const loadDataSurvivalDeletion = () => import('../data-survival/eon-data-survival-deletion.js');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function say(message) {
  const node = $('#eon-capsule-status');
  if (node) node.textContent = String(message || '');
}

function selectedFile() {
  return $('#eon-capsule-file')?.files?.[0] || null;
}

function selectedMediaFile() {
  return $('#eon-media-bundle-file')?.files?.[0] || null;
}

function passphrase(selector) {
  return String($(selector)?.value || '');
}

function formatBytes(value = 0) {
  const bytes = Math.max(0, Number(value) || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function setDriveStatus(message = '') {
  const node = $('#eon-drive-snapshot-status');
  if (node) node.textContent = String(message || '');
}

function setDriveControls({ prepared = drivePrepared, connected = Boolean(driveSession?.credential) } = {}) {
  const start = $('#eon-drive-prepare');
  const backup = $('#eon-drive-backup');
  const list = $('#eon-drive-list');
  const revoke = $('#eon-drive-revoke');
  if (start) {
    start.disabled = prepared;
    start.textContent = prepared ? 'Google Drive backup prepared' : 'Prepare Google Drive backup';
  }
  if (backup) backup.hidden = !prepared;
  if (list) list.hidden = !prepared;
  if (revoke) {
    revoke.hidden = !connected;
    revoke.disabled = !connected;
  }
}

function renderDriveSnapshots(records = []) {
  const root = $('#eon-drive-snapshots');
  if (!root) return;
  if (!records.length) {
    root.innerHTML = '<p class="eon-vault-state">No EONAPP encrypted snapshots were found in the currently approved Google Drive session.</p>';
    return;
  }
  root.innerHTML = `<p class="eon-vault-state"><strong>Google Drive backups</strong> · ${records.length} encrypted snapshot${records.length === 1 ? '' : 's'}. Select one only to inspect a local restore plan or move it to Drive trash.</p>${records.map((record) => `<article class="eon-vault-card"><strong>${escapeHtml(record.name)}</strong><span>${escapeHtml(record.createdAt || 'Date unavailable')} · ${formatBytes(record.size)}</span><div class="eon-vault-actions"><button class="eon-vault-secondary" type="button" data-eon-drive-inspect="${escapeHtml(record.id)}">Inspect restore plan</button><button class="eon-vault-danger" type="button" data-eon-drive-trash="${escapeHtml(record.id)}">Move to Drive trash</button></div></article>`).join('')}`;
  root.querySelectorAll('[data-eon-drive-inspect]').forEach((button) => button.addEventListener('click', () => inspectDriveSnapshot(String(button.dataset.eonDriveInspect || ''))));
  root.querySelectorAll('[data-eon-drive-trash]').forEach((button) => button.addEventListener('click', () => trashDriveSnapshot(String(button.dataset.eonDriveTrash || ''))));
}

async function prepareDriveBackup() {
  try {
    setDriveStatus('Checking whether Google Drive backup is configured for this deployment…');
    driveConfig = await readGoogleDrivePublicConfig();
    if (!driveConfig.configured) {
      const truth = getGoogleDriveSnapshotTruth({ configured: false });
      setDriveStatus(`Google Drive backup is not enabled on this deployment yet. ${truth.state.replaceAll('-', ' ')}. No Google permission or workspace data was requested.`);
      return;
    }
    setDriveStatus('Loading the Google Drive consent screen only. No workspace data has been read or uploaded.');
    await loadGoogleIdentityServices();
    drivePrepared = true;
    setDriveControls();
    setDriveStatus('Google Drive backup is prepared. Review your Capsule passphrase, then choose Connect & back up encrypted Capsule. Google Login is not reused.');
  } catch (error) {
    setDriveStatus(String(error?.message || 'Google Drive backup could not be prepared.'));
  }
}

async function requireDriveSession() {
  if (driveSession?.credential) return driveSession;
  if (!drivePrepared || !driveConfig?.configured) throw new Error('Prepare Google Drive backup before requesting separate Drive permission.');
  setDriveStatus('Choose a Google account and approve the separate Drive backup permission…');
  driveSession = await requestGoogleDriveAccess({ clientId: driveConfig.clientId });
  setDriveControls({ prepared: true, connected: true });
  return driveSession;
}

async function backupToDrive() {
  const first = passphrase('#eon-capsule-export-passphrase');
  const second = passphrase('#eon-capsule-export-confirm');
  if (first !== second) { setDriveStatus('The Capsule passphrases do not match.'); return; }
  try {
    setDriveStatus('Creating one encrypted Capsule in this browser before Google Drive is contacted…');
    const capsule = await createWorkspaceCapsuleFromStorage({ passphrase: first });
    const serialized = serializeWorkspaceCapsule(capsule);
    const session = await requireDriveSession();
    setDriveStatus('Uploading the encrypted Capsule snapshot to the Google Drive account you selected…');
    const receipt = await uploadGoogleDriveSnapshot({ accessCredential: session.credential, serializedCapsule: serialized, capsule });
    const compression = capsule.compression?.algorithm === 'gzip' ? 'compressed before encryption' : 'encrypted without compression';
    setDriveStatus(`Encrypted Capsule uploaded to Google Drive: ${receipt.name} (${formatBytes(receipt.size)}; ${compression}). This is a one-time snapshot, not sync.`);
    recordEonCoreOutcome({ kind: 'backup-readiness-receipt', route: '/capsule', source: 'capsule-local', receiptId: `drive-backup:${Date.now()}`, verified: true });
    await showDriveSnapshots({ quiet: true });
  } catch (error) {
    setDriveStatus(String(error?.message || 'The encrypted Capsule was not uploaded. Local workspace records were not changed.'));
  }
}

async function showDriveSnapshots({ quiet = false } = {}) {
  try {
    const session = await requireDriveSession();
    if (!quiet) setDriveStatus('Reading the list of EONAPP encrypted snapshot files created for this Drive session…');
    const records = await listGoogleDriveSnapshots({ accessCredential: session.credential });
    renderDriveSnapshots(records);
    if (!quiet) setDriveStatus(`${records.length} EONAPP encrypted snapshot${records.length === 1 ? '' : 's'} listed. No local workspace records changed.`);
  } catch (error) {
    setDriveStatus(String(error?.message || 'Google Drive backups could not be listed.'));
  }
}

async function inspectDriveSnapshot(fileId = '') {
  const secret = passphrase('#eon-capsule-restore-passphrase');
  if (!secret) { setDriveStatus('Enter the selected snapshot passphrase in the restore section before inspecting it.'); return; }
  try {
    const session = await requireDriveSession();
    setDriveStatus('Downloading the selected encrypted snapshot only to inspect a local restore plan…');
    const raw = await downloadGoogleDriveSnapshot({ accessCredential: session.credential, fileId });
    const nextStage = await restoreSession.stageCapsule(raw, { passphrase: secret });
    renderStage(nextStage);
    setDriveStatus('Drive snapshot inspected. Choose only the local changes you want, then type the confirmation phrase to apply them.');
  } catch (error) {
    renderStage(null);
    setDriveStatus(String(error?.message || 'The selected Google Drive snapshot could not be inspected.'));
  }
}

async function trashDriveSnapshot(fileId = '') {
  if (!globalThis.confirm?.('Move this encrypted EONAPP snapshot to Google Drive trash? This does not change local workspace records.')) return;
  try {
    const session = await requireDriveSession();
    setDriveStatus('Moving the selected encrypted snapshot to Google Drive trash…');
    await trashGoogleDriveSnapshot({ accessCredential: session.credential, fileId });
    setDriveStatus('Snapshot moved to Google Drive trash. Local workspace records were not changed.');
    await showDriveSnapshots({ quiet: true });
  } catch (error) {
    setDriveStatus(String(error?.message || 'The Google Drive snapshot could not be moved to trash.'));
  }
}

async function revokeDriveSession() {
  const previous = driveSession;
  driveSession = null;
  setDriveControls({ prepared: drivePrepared, connected: false });
  renderDriveSnapshots([]);
  if (!previous?.credential) { setDriveStatus('No in-memory Google Drive permission exists in this browser tab.'); return; }
  const result = await revokeGoogleDriveAccess({ accessCredential: previous.credential });
  setDriveStatus(result.revoked
    ? 'Google Drive permission was revoked for this browser session. Existing encrypted Drive copies are not deleted automatically.'
    : 'This browser session cleared its Google Drive permission. You can also remove EONAPP access from your Google Account security settings.');
}

function downloadCapsule(serialized) {
  const blob = new Blob([serialized], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `eonapp-workspace-capsule-${new Date().toISOString().slice(0, 10)}.eoncapsule`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}


function downloadJsonFile(serialized, filename) {
  const blob = new Blob([String(serialized || '')], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = String(filename || 'eonapp-export.json');
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function renderDataSurvivalCoverage() {
  const target = $('#eon-data-survival-coverage');
  if (!target) return;
  try {
    const { buildEonDataSurvivalInventory, createEonDataSurvivalCoverageReceipt } = await loadDataSurvivalInventory();
    const inventory = await buildEonDataSurvivalInventory();
    const receipt = createEonDataSurvivalCoverageReceipt(inventory);
    const counts = inventory.counts || {};
    target.innerHTML = `<strong>${receipt.complete ? 'Coverage classified' : 'Coverage review required'}</strong><span>${Number(counts.localStorageOwned || 0)} local record${Number(counts.localStorageOwned || 0) === 1 ? '' : 's'} · ${Number(counts.indexedDbObserved || 0)} observed IndexedDB store${Number(counts.indexedDbObserved || 0) === 1 ? '' : 's'} · ${Number(counts.cacheStorageOwned || 0)} EONAPP cache${Number(counts.cacheStorageOwned || 0) === 1 ? '' : 's'}</span><small>Workspace Capsule, Creator media, encrypted secrets, device-bound identity, session state and replaceable caches remain separate protection classes. No record values are shown here.</small>`;
  } catch (error) {
    target.textContent = `Data Survival inventory could not be inspected: ${String(error?.message || error)}`;
  }
}

async function exportCreatorMediaBundle() {
  const first = passphrase('#eon-media-bundle-passphrase');
  const second = passphrase('#eon-media-bundle-confirm');
  if (first !== second) { say('The Creator media bundle passphrases do not match.'); return; }
  try {
    say('Reading explicitly saved Creator media and encrypting it locally…');
    const bundle = await createCreatorMediaBundle({ passphrase: first });
    downloadJsonFile(serializeCreatorMediaBundle(bundle), `eonapp-creator-media-${new Date().toISOString().slice(0, 10)}.eonmedia.json`);
    say(`Encrypted Creator media bundle downloaded: ${bundle.recordCount} raw-media record${bundle.recordCount === 1 ? '' : 's'} · ${formatBytes(bundle.totalBytes)}. It was not uploaded and its passphrase was not stored.`);
  } catch (error) {
    say(String(error?.message || 'The encrypted Creator media bundle could not be created.'));
  }
}

function renderMediaStage(nextStage) {
  mediaStage = nextStage?.ok ? nextStage : null;
  const target = $('#eon-media-bundle-stage');
  const commit = $('#eon-media-bundle-commit');
  if (!target) return;
  if (!mediaStage) {
    target.textContent = 'Choose an encrypted Creator media bundle to inspect raw-media changes without applying them.';
    if (commit) commit.disabled = true;
    return;
  }
  target.innerHTML = `<p><strong>${mediaStage.recordCount} verified media record${mediaStage.recordCount === 1 ? '' : 's'}</strong> · ${formatBytes(mediaStage.totalBytes)} · raw bytes remain encrypted outside the private restore session.</p>${mediaStage.changes.map((change) => {
    const id = escapeHtml(change.assetId);
    if (change.status === 'add') return `<label class="eon-vault-field"><input type="checkbox" data-eon-media-change data-asset-id="${id}" data-action="add" checked /> Add ${escapeHtml(change.title)} (${formatBytes(change.bytes)})</label>`;
    if (change.status === 'replace') return `<label class="eon-vault-field"><input type="checkbox" data-eon-media-change data-asset-id="${id}" data-action="replace" /> Replace ${escapeHtml(change.title)} (${formatBytes(change.bytes)}) — explicit choice only</label>`;
    return `<p class="eon-vault-state">${escapeHtml(change.title)} is already identical and will be skipped.</p>`;
  }).join('') || '<p class="eon-vault-state">This bundle contains no restorable media.</p>'}`;
  if (commit) commit.disabled = !mediaStage.changes.some((change) => change.status === 'add' || change.status === 'replace');
}

async function inspectCreatorMediaBundle() {
  const file = selectedMediaFile();
  if (!file) { say('Choose an encrypted Creator media bundle first.'); return; }
  try {
    say('Decrypting and verifying the selected Creator media bundle without changing this browser…');
    const nextStage = await mediaRestoreSession.stageBundle(await file.text(), { passphrase: passphrase('#eon-media-bundle-restore-passphrase') });
    renderMediaStage(nextStage);
    say('Creator media bundle inspected. New media is selected by default; replacing existing media always requires a separate choice.');
  } catch (error) {
    renderMediaStage(null);
    say(String(error?.message || 'The Creator media bundle could not be inspected.'));
  }
}

async function commitCreatorMediaBundle() {
  if (!mediaStage) { say('Inspect a Creator media bundle before applying it.'); return; }
  const choices = [...document.querySelectorAll('[data-eon-media-change]:checked')].map((node) => ({ assetId: String(node.dataset.assetId || ''), action: String(node.dataset.action || '') }));
  const chosen = mediaRestoreSession.choose(mediaStage.stageId, choices);
  if (!chosen.ok) { say(`Creator media choices were rejected: ${chosen.reason}`); return; }
  try {
    say('Restoring selected Creator media with metadata and media rollback prepared…');
    const receipt = await mediaRestoreSession.commit(chosen.stageId, { confirmation: passphrase('#eon-media-bundle-confirmation') });
    if (!receipt.ok) {
      say(receipt.reason === 'explicit-confirmation-required' ? `Nothing changed. Type exactly: ${EON_CREATOR_MEDIA_BUNDLE_CONFIRMATION}` : `Creator media restore did not complete: ${receipt.reason}`);
      return;
    }
    renderMediaStage(null);
    say(`Creator media restore complete: ${receipt.restored} record${receipt.restored === 1 ? '' : 's'} and ${formatBytes(receipt.totalBytes)} verified.`);
    await renderDataSurvivalCoverage();
  } catch (error) {
    say(String(error?.message || 'Creator media restore could not complete.'));
  }
}

async function clearAllLocalEonAppData() {
  const confirmation = passphrase('#eon-data-survival-clear-confirmation');
  const backupAcknowledged = $('#eon-data-survival-backup-ack')?.checked === true;
  try {
    const [{ EON_DATA_SURVIVAL_CLEAR_CONFIRMATION }, { clearEonAppDataInventory }] = await Promise.all([
      loadDataSurvivalInventory(),
      loadDataSurvivalDeletion()
    ]);
    const receipt = await clearEonAppDataInventory({ confirmation, backupAcknowledged });
    if (!receipt.ok) {
      say(receipt.reason === 'confirmation-required'
        ? `Nothing changed. Type exactly: ${EON_DATA_SURVIVAL_CLEAR_CONFIRMATION}`
        : receipt.reason === 'backup-acknowledgement-required'
          ? 'Nothing changed. Confirm that you understand local work is unrecoverable without your separate exports.'
          : `Local deletion stopped safely: ${receipt.reason}`);
      return;
    }
    downloadJsonFile(JSON.stringify(receipt, null, 2), `eonapp-local-deletion-receipt-${new Date().toISOString().slice(0, 10)}.json`);
    say(`Local EONAPP deletion verified: ${receipt.removed.localStorage} local records, ${receipt.removed.sessionStorage} session records, ${receipt.removed.indexedDb} databases and ${receipt.removed.caches} caches removed. Unrelated same-origin data was preserved.`);
    renderMediaStage(null);
    await renderDataSurvivalCoverage();
  } catch (error) {
    say(String(error?.message || 'Local EONAPP deletion could not be verified.'));
  }
}

function renderBoundary() {
  const target = $('#eon-capsule-boundary');
  if (!target) return;
  const entries = collectWorkspaceCapsuleEntries();
  const truth = getWorkspaceCapsuleTruth();
  target.textContent = `${entries.length} allowlisted local workspace record${entries.length === 1 ? '' : 's'} are eligible in this browser and are collected together into one encrypted Capsule. Default merge is ${truth.defaultMerge}; overwrite is always key-by-key.`;
}

function renderMovePlan() {
  const target = $('#eon-capsule-move-plan');
  const scenario = String($('#eon-capsule-move-scenario')?.value || 'new-device');
  if (!target) return;
  const targetOrigin = scenario === 'trust-hub'
    ? 'https://eon.hub'
    : scenario === 'future-reviewed-origin'
      ? 'https://future-reviewed-eonapp-origin.invalid'
      : 'https://eonapp.ch';
  const plan = createDomainContinuityMovePlan({ sourceOrigin: globalThis.location?.origin || 'https://eonapp.ch', targetOrigin });
  const steps = plan.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('');
  const blocked = plan.blocked.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  target.innerHTML = `<p><strong>${escapeHtml(plan.headline)}</strong></p><ol class="eon-vault-notices">${steps}</ol><p class="eon-vault-muted">${escapeHtml(plan.transferMode)}</p><ul class="eon-vault-notices">${blocked}</ul>`;
}

function renderStage(nextStage) {
  stage = nextStage;
  const target = $('#eon-capsule-stage');
  const commit = $('#eon-capsule-commit');
  if (!target) return;
  if (!nextStage) {
    target.textContent = 'Choose a Capsule to see a no-values restore plan.';
    if (commit) commit.disabled = true;
    return;
  }
  const lines = nextStage.changes.map((change) => {
    const key = escapeHtml(change.key);
    const bytes = `${change.incomingBytes} byte${change.incomingBytes === 1 ? '' : 's'}`;
    if (change.status === 'add') return `<label class="eon-vault-field"><input type="checkbox" data-eon-capsule-change data-key="${key}" data-action="add" checked /> Add <code>${key}</code> (${bytes})</label>`;
    if (change.status === 'conflict') return `<label class="eon-vault-field"><input type="checkbox" data-eon-capsule-change data-key="${key}" data-action="overwrite" /> Replace conflicting <code>${key}</code> (${bytes}) — explicit overwrite only</label>`;
    return `<p class="eon-vault-state"><code>${key}</code> is already identical and will be skipped.</p>`;
  }).join('') || '<p class="eon-vault-state">This file contains no eligible workspace records.</p>';
  target.innerHTML = `<p><strong>${escapeHtml(nextStage.sourceFormat)}</strong> · ${nextStage.changes.length} reviewed key${nextStage.changes.length === 1 ? '' : 's'} · values are not shown.</p>${lines}`;
  if (commit) commit.disabled = !nextStage.changes.some((change) => change.status === 'add' || change.status === 'conflict');
}

async function exportCapsule() {
  const first = passphrase('#eon-capsule-export-passphrase');
  const second = passphrase('#eon-capsule-export-confirm');
  if (first !== second) { say('The Capsule passphrases do not match.'); return; }
  try {
    say('Encrypting every eligible local workspace record into one Capsule in this browser…');
    const capsule = await createWorkspaceCapsuleFromStorage({ passphrase: first });
    downloadCapsule(serializeWorkspaceCapsule(capsule));
    const compression = capsule.compression?.algorithm === 'gzip' ? 'Compressed before encryption.' : 'Encrypted without compression because compression was unavailable or would not reduce this file.';
    say(`One encrypted Capsule downloaded with ${capsule.manifest.recordCount} eligible allowlisted record${capsule.manifest.recordCount === 1 ? '' : 's'}. ${compression} Keep the file and passphrase separately.`);
    recordEonCoreOutcome({ kind: 'backup-readiness-receipt', route: '/capsule', source: 'capsule-local', receiptId: `capsule-backup:${Date.now()}`, verified: true });
  } catch (error) {
    say(String(error?.message || 'The Capsule could not be created.'));
  }
}

async function inspectFile() {
  const file = selectedFile();
  const secret = passphrase('#eon-capsule-restore-passphrase');
  if (!file) { say('Choose a Capsule or legacy Vault file first.'); return; }
  try {
    say('Inspecting the file without changing this browser…');
    const text = await file.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { throw new Error('The selected file is not valid JSON.'); }
    const nextStage = parsed?.schema === EON_WORKSPACE_CAPSULE_SCHEMA
      ? await restoreSession.stageCapsule(text, { passphrase: secret })
      : await (async () => {
          const { inspectVaultImportFile } = await import('../utils/vault.js');
          const legacySnapshot = await inspectVaultImportFile(file, secret);
          return restoreSession.stageLegacyVaultSnapshot(legacySnapshot, { passphrase: secret });
        })();
    renderStage(nextStage);
    say('File inspected. Choose only the changes you want, then type the confirmation phrase to apply them atomically.');
  } catch (error) {
    renderStage(null);
    say(String(error?.message || 'The file could not be inspected.'));
  }
}

function chosenChanges() {
  return [...document.querySelectorAll('[data-eon-capsule-change]:checked')].map((node) => ({ key: String(node.dataset.key || ''), action: String(node.dataset.action || '') }));
}

async function commitStage() {
  if (!stage) { say('Inspect a file before applying changes.'); return; }
  try {
    const selected = chosenChanges();
    const chosen = restoreSession.choose(stage.stageId, selected);
    renderStage(chosen);
    say('Writing selected changes with an encrypted rollback journal…');
    const result = await restoreSession.commit(chosen.stageId, { confirmation: passphrase('#eon-capsule-confirmation') });
    if (!result.ok) {
      say(result.reason === 'explicit-confirmation-required'
        ? `Nothing changed. Type exactly: ${EON_WORKSPACE_CAPSULE_CONFIRMATION}`
        : `Nothing was accepted as a partial restore: ${result.reason}`);
      return;
    }
    renderStage(null);
    say(`Capsule restore complete: ${result.changedKeys.length} selected key${result.changedKeys.length === 1 ? '' : 's'} verified. Local receipt recorded; network sync was not used.`);
    recordEonCoreOutcome({ kind: 'recovery-restore-receipt', route: '/capsule', source: 'capsule-local', receiptId: `capsule-restore:${Date.now()}`, verified: true });
  } catch (error) {
    say(String(error?.message || 'The selected changes could not be prepared.'));
  }
}

async function recoverInterruptedRestore() {
  try {
    const result = await recoverPendingWorkspaceCapsule({ passphrase: passphrase('#eon-capsule-restore-passphrase') });
    say(result.ok ? `Capsule recovery: ${result.action}.` : `Capsule recovery preserved the encrypted journal: ${result.reason}`);
  } catch (error) {
    say(String(error?.message || 'Capsule recovery could not run.'));
  }
}

function init() {
  renderBoundary();
  renderMovePlan();
  void renderDataSurvivalCoverage();
  $('#eon-capsule-export')?.addEventListener('click', exportCapsule);
  $('#eon-capsule-inspect')?.addEventListener('click', inspectFile);
  $('#eon-capsule-commit')?.addEventListener('click', commitStage);
  $('#eon-capsule-recover')?.addEventListener('click', recoverInterruptedRestore);
  $('#eon-media-bundle-export')?.addEventListener('click', exportCreatorMediaBundle);
  $('#eon-media-bundle-inspect')?.addEventListener('click', inspectCreatorMediaBundle);
  $('#eon-media-bundle-commit')?.addEventListener('click', commitCreatorMediaBundle);
  $('#eon-data-survival-clear')?.addEventListener('click', clearAllLocalEonAppData);
  $('#eon-drive-prepare')?.addEventListener('click', prepareDriveBackup);
  $('#eon-drive-backup')?.addEventListener('click', backupToDrive);
  $('#eon-drive-list')?.addEventListener('click', () => showDriveSnapshots());
  $('#eon-drive-revoke')?.addEventListener('click', revokeDriveSession);
  setDriveControls({ prepared: false, connected: false });
  $('#eon-capsule-show-move-plan')?.addEventListener('click', renderMovePlan);
  $('#eon-capsule-move-scenario')?.addEventListener('change', renderMovePlan);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
