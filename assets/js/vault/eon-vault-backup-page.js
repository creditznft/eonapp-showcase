/** EONAPP W209 — explicit encrypted full-Vault backup and safe restore UI. */
import {
  buildEonAppRestorePlan,
  clearEonAppOwnedStorage,
  EON_VAULT_CLEAR_CONFIRMATION,
  getVaultAccountBoundary
} from './eon-vault-lifecycle.js';
import {
  downloadVault,
  exportVault,
  importVaultFile,
  inspectVaultImportFile
} from '../utils/vault.js';

const $ = (selector) => document.querySelector(selector);
let reviewedRestore = null;

function say(message) {
  const node = $('#eon-vault-backup-status');
  if (node) node.textContent = String(message || '');
}

function setText(selector, value) {
  const node = $(selector);
  if (node) node.textContent = String(value || '');
}

function readFile() {
  return $('#eon-vault-backup-file')?.files?.[0] || null;
}

function fileIdentity(file) {
  return file ? `${String(file.name || '')}:${Number(file.size || 0)}:${Number(file.lastModified || 0)}` : '';
}

function renderBoundary() {
  const boundary = getVaultAccountBoundary();
  setText('#eon-vault-backup-boundary', `${boundary.ownedKeyCount} EONAPP records are in this browser profile. ${boundary.restoreRule}`);
}

function renderRestorePlan(plan) {
  const node = $('#eon-vault-restore-plan');
  if (!node) return;
  node.textContent = `Backup has ${plan.backupOwnedKeyCount} EONAPP records: ${plan.createKeys.length} new, ${plan.overwriteKeys.length} would update. ${plan.staleKeys.length} current-only EONAPP records stay in Merge mode. Unrelated browser storage is always preserved.`;
}

async function previewRestore() {
  const file = readFile();
  const passphrase = $('#eon-vault-restore-passphrase')?.value || '';
  if (!file) { say('Choose an encrypted Vault backup first.'); return; }
  try {
    say('Checking encrypted backup without changing this browser…');
    const snapshot = await inspectVaultImportFile(file, passphrase);
    const plan = buildEonAppRestorePlan(snapshot);
    reviewedRestore = Object.freeze({ reviewToken: snapshot.reviewToken, fileIdentity: fileIdentity(file) });
    renderRestorePlan(plan);
    say('Backup verified. Review the restore plan, then choose Merge restore or Replace EONAPP data.');
  } catch (error) {
    say(String(error?.message || 'The backup could not be checked.'));
  }
}

async function restore(mode) {
  const file = readFile();
  const passphrase = $('#eon-vault-restore-passphrase')?.value || '';
  if (!file) { say('Choose an encrypted Vault backup first.'); return; }
  if (!reviewedRestore?.reviewToken || reviewedRestore.fileIdentity !== fileIdentity(file)) { say('Preview this exact encrypted backup again before restoring it.'); return; }
  if (mode === 'replace-eonapp' && !window.confirm('Replace EONAPP local data with this backup? Unrelated browser storage is preserved.')) return;
  try {
    say('Restoring encrypted EONAPP records…');
    const result = await importVaultFile(file, passphrase, { mode, reviewToken: reviewedRestore.reviewToken });
    renderRestorePlan(result.restoreReceipt?.plan || buildEonAppRestorePlan(result));
    reviewedRestore = null;
    say(mode === 'merge'
      ? 'Merge restore complete. Existing EONAPP records not in the backup were kept; unrelated browser storage was preserved.'
      : 'Replace restore complete. Only EONAPP-owned browser records were replaced; unrelated browser storage was preserved.');
  } catch (error) {
    say(String(error?.message || 'The backup could not be restored.'));
  }
}

async function exportFullVault() {
  const passphrase = $('#eon-vault-export-passphrase')?.value || '';
  const confirmation = $('#eon-vault-export-confirm')?.value || '';
  if (passphrase !== confirmation) { say('The backup passphrases do not match.'); return; }
  try {
    say('Creating an encrypted full EONAPP Vault backup…');
    const exported = await exportVault(passphrase, { reason: 'w209-user-full-encrypted-export' });
    downloadVault(exported);
    say('Encrypted full Vault backup downloaded. Keep the file and passphrase separately.');
  } catch (error) {
    say(String(error?.message || 'The encrypted Vault backup could not be created.'));
  }
}

function clearLocalData() {
  const confirmation = $('#eon-vault-clear-confirmation')?.value || '';
  const result = clearEonAppOwnedStorage({ confirmation });
  if (!result.ok) {
    say(`No data was removed. Type exactly: ${EON_VAULT_CLEAR_CONFIRMATION}`);
    return;
  }
  renderBoundary();
  setText('#eon-vault-restore-plan', 'EONAPP local data has been removed from this browser profile. Unrelated browser storage was preserved.');
  say('EONAPP local browser data was removed. This cannot delete provider-side accounts or recover a lost backup passphrase.');
}

function init() {
  renderBoundary();
  $('#eon-vault-export')?.addEventListener('click', exportFullVault);
  $('#eon-vault-backup-file')?.addEventListener('change', () => { reviewedRestore = null; setText('#eon-vault-restore-plan', 'Preview the selected encrypted backup before restoring.'); });
  $('#eon-vault-preview-restore')?.addEventListener('click', previewRestore);
  $('#eon-vault-restore-merge')?.addEventListener('click', () => restore('merge'));
  $('#eon-vault-restore-replace')?.addEventListener('click', () => restore('replace-eonapp'));
  $('#eon-vault-clear')?.addEventListener('click', clearLocalData);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
