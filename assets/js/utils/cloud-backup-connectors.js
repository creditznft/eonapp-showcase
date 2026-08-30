/**
 * Manual encrypted-storage destinations and Google Drive readiness surface.
 *
 * No connector is enabled here. The module never authenticates, uploads,
 * verifies an upload, retrieves provider files, schedules a backup, or
 * synchronizes devices. It only supports the real manual path: create an
 * encrypted Capsule, then place it in storage the user controls.
 */
import { getEonDataContinuityTruth } from '../local-first/eon-data-continuity.js';
import {
  buildGoogleDriveBackupConsentPreview,
  getGoogleDriveBackupFoundationTruth
} from '../local-first/eon-google-drive-backup-foundation.js';

const CLOUD_BACKUP_STATUS_KEY = 'eon:manual-encrypted-backup-status:v3';
const LEGACY_CLOUD_BACKUP_STATUS_KEY = 'eon:cloud-backup-handoff:v2';

function safeText(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseStatus(value) {
  if (value == null || value === '') return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readStatus() {
  try {
    const current = parseStatus(localStorage.getItem(CLOUD_BACKUP_STATUS_KEY));
    if (current) return current;
    // Preserve the previous local-only activity receipt during the key rename.
    return parseStatus(localStorage.getItem(LEGACY_CLOUD_BACKUP_STATUS_KEY)) || {};
  } catch {
    return {};
  }
}

function writeStatus(next) {
  try {
    localStorage.setItem(CLOUD_BACKUP_STATUS_KEY, JSON.stringify(next));
    localStorage.removeItem(LEGACY_CLOUD_BACKUP_STATUS_KEY);
  } catch {}
}

export const CLOUD_BACKUP_PROVIDERS = Object.freeze([
  Object.freeze({
    id: 'google-drive',
    label: 'Google Drive',
    url: 'https://drive.google.com/drive/my-drive',
    phase: 'manual storage now · first approved connector later',
    automationPriority: 'first-approved',
    steps: ['Create an encrypted Capsule', 'Open your private Google Drive', 'Upload the encrypted file yourself', 'Keep its passphrase separate and one extra offline copy']
  }),
  Object.freeze({
    id: 'onedrive',
    label: 'OneDrive',
    url: 'https://onedrive.live.com',
    phase: 'manual storage now · second connector later',
    automationPriority: 'second-approved',
    steps: ['Create an encrypted Capsule', 'Open your private OneDrive', 'Upload the encrypted file yourself', 'Keep its passphrase separate and one extra offline copy']
  }),
  Object.freeze({
    id: 'icloud',
    label: 'iCloud Drive',
    url: 'https://www.icloud.com/iclouddrive',
    phase: 'manual destination only',
    automationPriority: 'not-planned',
    steps: ['Create an encrypted Capsule', 'Open your private iCloud Drive', 'Upload the encrypted file yourself', 'Keep its passphrase separate and one extra offline copy']
  }),
  Object.freeze({
    id: 'dropbox',
    label: 'Dropbox',
    url: 'https://www.dropbox.com/home',
    phase: 'manual destination only',
    automationPriority: 'not-planned',
    steps: ['Create an encrypted Capsule', 'Open your private Dropbox', 'Upload the encrypted file yourself', 'Keep its passphrase separate and one extra offline copy']
  })
]);

function providerFor(providerId) {
  return CLOUD_BACKUP_PROVIDERS.find((item) => item.id === providerId) || null;
}

function latestActionLabel(entry) {
  if (!entry) return 'No manual storage action recorded in this browser';
  if (entry.action === 'provider-opened') return `${entry.label} opened manually; EONAPP cannot verify an upload`;
  if (entry.action === 'capsule-guidance-opened') return `Capsule guidance opened for ${entry.label}; no backup file was created or uploaded yet`;
  if (entry.action === 'checklist-copied') return `${entry.label} manual-storage checklist copied locally`;
  if (entry.action === 'consent-plan-reviewed') return `${entry.label} connector consent plan reviewed locally; no provider connection exists`;
  return `${entry.label} manual storage activity was recorded locally`;
}

export function getCloudBackupStatus() {
  const providers = readStatus();
  const latest = Object.values(providers).sort((a, b) => String(b?.at || '').localeCompare(String(a?.at || '')))[0] || null;
  return Object.freeze({
    providers,
    latest,
    manualHandoffCount: Object.keys(providers).length,
    connectedCount: 0,
    connected: false,
    label: latestActionLabel(latest),
    automaticUploadActive: false,
    crossDeviceSyncActive: false,
    googleDrive: getGoogleDriveBackupFoundationTruth()
  });
}

export function recordCloudBackupHandoff(providerId, patch = {}) {
  const provider = providerFor(providerId);
  if (!provider) throw new Error('Unknown manual storage destination.');
  const status = readStatus();
  status[provider.id] = {
    providerId: provider.id,
    label: provider.label,
    phase: provider.phase,
    at: new Date().toISOString(),
    manualOnly: true,
    uploadVerified: false,
    connected: false,
    ...patch
  };
  writeStatus(status);
  return Object.freeze({ ...status[provider.id] });
}

export function buildCloudBackupChecklist(providerId) {
  const provider = providerFor(providerId) || CLOUD_BACKUP_PROVIDERS[0];
  return `${provider.label} manual encrypted-storage checklist:\n${provider.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\nImportant: EONAPP cannot silently upload, verify, synchronize, or restore this file. Google Login is not Google Drive permission. Keep the passphrase separately.`;
}

function selectedProviders(providerIds) {
  const ids = Array.isArray(providerIds) && providerIds.length ? new Set(providerIds) : null;
  return ids ? CLOUD_BACKUP_PROVIDERS.filter((provider) => ids.has(provider.id)) : CLOUD_BACKUP_PROVIDERS;
}

function reviewGoogleDrivePlan(root, statusTarget) {
  const plan = buildGoogleDriveBackupConsentPreview();
  const existing = root.querySelector('[data-google-drive-consent-preview]');
  if (existing) {
    existing.remove();
    return;
  }
  const panel = document.createElement('div');
  panel.className = 'cloud-backup-consent-preview';
  panel.dataset.googleDriveConsentPreview = '1';
  panel.innerHTML = `
    <strong>${safeText(plan.title)}</strong>
    <p><code>${safeText(plan.scope)}</code> would be requested later, only after a user chooses Drive backup. It is not requested in this build.</p>
    <p><b>Would do:</b> ${safeText(plan.willDo.join(' '))}</p>
    <p><b>Would not do:</b> ${safeText(plan.willNotDo.join(' '))}</p>
  `;
  root.querySelector('.cloud-backup-connectors')?.append(panel);
  if (statusTarget) statusTarget.textContent = 'Google Drive consent plan opened locally. No Google Drive account is connected.';
}

export function renderCloudBackupConnectors(root, options = {}) {
  if (!root) return null;
  const status = getCloudBackupStatus();
  const continuity = getEonDataContinuityTruth();
  const providers = selectedProviders(options.providerIds);
  root.innerHTML = `
    <div class="cloud-backup-connectors" data-cloud-backup-connectors="1">
      <div class="cloud-backup-head">
        <span class="cloud-backup-kicker">Manual encrypted storage</span>
        <h3>Keep a backup file where you control it</h3>
        <p>Create a Capsule first. You may then manually store the encrypted file in private cloud storage. Opening a storage provider does not connect an account, upload a file, prove an upload, or turn on sync.</p>
        <strong data-cloud-backup-status>${safeText(status.label)}</strong>
      </div>
      <div class="cloud-backup-grid">
        ${providers.map((provider) => {
          const saved = status.providers[provider.id];
          const savedLabel = saved ? 'Manual activity recorded · upload not verified' : 'Manual destination available';
          const drivePlan = provider.id === 'google-drive'
            ? '<button class="btn btn-outline btn-sm" type="button" data-cloud-consent-plan="google-drive">Review consent plan</button>'
            : '';
          return `<article class="cloud-backup-card" data-cloud-provider="${safeText(provider.id)}">
            <strong>${safeText(provider.label)}</strong>
            <span>${safeText(savedLabel)}</span>
            <small>${safeText(provider.phase)}</small>
            <div class="cloud-backup-actions">
              <a class="btn btn-primary btn-sm" href="/capsule" data-cloud-capsule="${safeText(provider.id)}">Create encrypted Capsule</a>
              <a class="btn btn-outline btn-sm" href="${safeText(provider.url)}" target="_blank" rel="noopener noreferrer" data-cloud-open="${safeText(provider.id)}">Open storage manually</a>
              <button class="btn btn-outline btn-sm" type="button" data-cloud-checklist="${safeText(provider.id)}">Checklist</button>
              ${drivePlan}
            </div>
          </article>`;
        }).join('')}
      </div>
      <p class="cloud-backup-note">${safeText(continuity.manualStorageGuidance)}</p>
      <p class="cloud-backup-note">Automatic multi-device sync, automatic cloud upload, provider-connected backup, and managed recovery storage are not active.</p>
    </div>
  `;

  const statusTarget = root.querySelector('[data-cloud-backup-status]');
  root.querySelectorAll('[data-cloud-capsule]').forEach((node) => {
    node.addEventListener('click', () => {
      recordCloudBackupHandoff(node.getAttribute('data-cloud-capsule') || '', { action: 'capsule-guidance-opened' });
    });
  });
  root.querySelectorAll('[data-cloud-open]').forEach((node) => {
    node.addEventListener('click', () => {
      recordCloudBackupHandoff(node.getAttribute('data-cloud-open') || '', { action: 'provider-opened' });
    });
  });
  root.querySelectorAll('[data-cloud-checklist]').forEach((node) => {
    node.addEventListener('click', async () => {
      const providerId = node.getAttribute('data-cloud-checklist') || '';
      const text = buildCloudBackupChecklist(providerId);
      try {
        await navigator.clipboard.writeText(text);
        node.textContent = 'Copied';
        setTimeout(() => { node.textContent = 'Checklist'; }, 1600);
      } catch {
        window.prompt('Copy this checklist', text);
      }
      recordCloudBackupHandoff(providerId, { action: 'checklist-copied' });
      if (statusTarget) statusTarget.textContent = latestActionLabel(getCloudBackupStatus().latest);
    });
  });
  root.querySelectorAll('[data-cloud-consent-plan]').forEach((node) => {
    node.addEventListener('click', () => {
      recordCloudBackupHandoff('google-drive', { action: 'consent-plan-reviewed' });
      reviewGoogleDrivePlan(root, statusTarget);
    });
  });
  return status;
}

export default {
  CLOUD_BACKUP_PROVIDERS,
  getCloudBackupStatus,
  recordCloudBackupHandoff,
  buildCloudBackupChecklist,
  renderCloudBackupConnectors
};
