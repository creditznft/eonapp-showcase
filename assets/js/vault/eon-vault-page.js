/** EONAPP W196 — concise Vault home. */
import { getEonPwaLocalProfileTruth } from '../eon-pwa-manager.js';
import { createSafeVaultBackupSummary, getVaultSecurityTruth } from './eon-vault-security.js';
import { migrateKnownLegacyProviderStorage } from './eon-vault-lifecycle.js';
import { ApiKeyVault } from '../utils/api-key-vault.js';
import { PROVIDERS, clearApiKey, getApiKey, getProviderHealthSnapshot, getProviderVerification, loadAISettings, saveAISettings, setApiKey, verifyProviderReadiness } from '../chat/ai-runtime.js';
import { bindEonCollectionWorkspace, renderEonCollectionWorkspace } from '../collection/eon-collection-workspace.js';
import { getEonDataContinuityTruth } from '../local-first/eon-data-continuity.js';
import { getGoogleDriveBackupFoundationTruth } from '../local-first/eon-google-drive-backup-foundation.js';
import { getGoogleDriveSnapshotTruth } from '../local-first/eon-google-drive-snapshot-connector.js';
import { renderCloudBackupConnectors } from '../utils/cloud-backup-connectors.js';
import { renderLockedFeatureSurface } from '../referrals/eon-locked-feature-surface.js';
import { recordEonCoreOutcome } from '../contracts/outcomes/eon-core-outcome-authority.js';

const $ = (selector) => document.querySelector(selector);

const VAULT_TAB_ALIASES = Object.freeze({
  overview: 'overview',
  'vault-overview': 'overview',
  recovery: 'recovery',
  'vault-recovery': 'recovery',
  backup: 'backup',
  'vault-backup': 'backup',
  'eon-vault-google-drive-card': 'backup',
  'eon-vault-manual-storage-card': 'backup',
  'ai-keys': 'ai-keys',
  'vault-ai-keys': 'ai-keys',
  'provider-check': 'ai-keys',
  reveals: 'reveals',
  'vault-reveals': 'reveals',
  safety: 'safety',
  'vault-safety': 'safety'
});

const VAULT_TAB_HASHES = Object.freeze({
  overview: 'vault-overview',
  recovery: 'vault-recovery',
  backup: 'vault-backup',
  'ai-keys': 'vault-ai-keys',
  reveals: 'vault-reveals',
  safety: 'vault-safety'
});

function resolvedVaultTab(value = '') {
  return VAULT_TAB_ALIASES[String(value || '').replace(/^#/, '').trim()] || 'overview';
}

function activateVaultTab(value = '', { updateHash = false } = {}) {
  const tab = resolvedVaultTab(value);
  document.querySelectorAll('[data-eon-vault-panel]').forEach((panel) => {
    const active = panel.dataset.eonVaultPanel === tab;
    panel.hidden = !active;
    panel.setAttribute('aria-hidden', String(!active));
  });
  document.querySelectorAll('[data-eon-vault-tab]').forEach((button) => {
    const active = button.dataset.eonVaultTab === tab;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  if (updateHash) {
    const nextHash = `#${VAULT_TAB_HASHES[tab] || VAULT_TAB_HASHES.overview}`;
    if (window.location.hash !== nextHash) history.replaceState(null, '', nextHash);
  }
  return tab;
}

function setText(selector, value) {
  const node = $(selector);
  if (node) node.textContent = String(value || '');
}

import { completeEonbotVaultReturnContext, getEonbotVaultReturnContext } from '../chat/eonbot-action-proposals.js';

function providerCandidates() {
  return Object.values(PROVIDERS)
    .filter((provider) => provider && provider.enabled !== false && provider.id && provider.requiresApiKey && provider.modelsUrl && provider.id !== 'custom')
    .sort((a, b) => String(a.label || a.id).localeCompare(String(b.label || b.id)));
}

function currentProviderId() {
  const select = /** @type {HTMLSelectElement | null} */ ($('#eon-vault-provider-select'));
  return String(select?.value || '').trim();
}

function safeProviderHealth(providerId) {
  try { return getProviderHealthSnapshot()?.[providerId] || null; } catch { return null; }
}

function formatProviderCheckAge(checkedAt = '') {
  const timestamp = Date.parse(String(checkedAt || ''));
  if (!Number.isFinite(timestamp)) return '';
  const ageMs = Math.max(0, Date.now() - timestamp);
  if (ageMs < 60_000) return 'checked just now';
  const minutes = Math.floor(ageMs / 60_000);
  if (minutes < 60) return `checked ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `checked ${hours}h ago`;
  return `checked ${Math.floor(hours / 24)}d ago`;
}

function providerStatusText(providerId) {
  const provider = PROVIDERS[providerId];
  const health = safeProviderHealth(providerId);
  const readiness = getProviderVerification(providerId);
  if (readiness.state === 'encrypted-recovery-available-restore-required') {
    return `Encrypted ${provider?.label || providerId} recovery is available. Restore it with your passphrase into this browser session before refreshing models. No network request was made.`;
  }
  if (readiness.state === 'legacy-migration-required') {
    return `A legacy ${provider?.label || providerId} credential needs migration into the encrypted Vault before it can be used.`;
  }
  if (readiness.state === 'stale-health-not-ready') {
    return `A previous ${provider?.label || providerId} verification is recorded, but no active key exists in this browser session. Restore or verify the key before use.`;
  }
  if (readiness.state === 'no-credential') return `No active ${provider?.label || providerId} key exists in this browser session.`;
  if (readiness.ready && readiness.model) {
    const count = Math.max(0, Number(health.discoveredCount || health.models?.length || 0));
    const age = formatProviderCheckAge(health.checkedAt);
    if (readiness.credentialVerified === false) {
      return `${provider?.label || providerId} model catalogue checked · recommended ${readiness.model}${count ? ` · ${count} chat-capable model${count === 1 ? '' : 's'} discovered` : ''}${age ? ` · ${age}` : ''}. This provider does not authenticate its model-list endpoint; your key will be validated by the first real request you explicitly send.`;
    }
    return `${provider?.label || providerId} verified for this browser session · recommended ${readiness.model}${count ? ` · ${count} chat-capable model${count === 1 ? '' : 's'} discovered` : ''}${age ? ` · ${age}` : ''}.`;
  }
  if (health?.status === 'key-saved-needs-verification') return `${provider?.label || providerId} key is in this browser session. Run the compatibility check before Chat can use it.`;
  if (health?.error) return `${provider?.label || providerId} is not ready: ${String(health.error).slice(0, 180)}`;
  if (getApiKey(providerId)) return `${provider?.label || providerId} key is in this browser session but is not yet verified.`;
  return 'No hosted provider has been verified in this session.';
}

async function refreshSelectedProviderModels() {
  const providerId = currentProviderId();
  const provider = PROVIDERS[providerId];
  const key = String(getApiKey(providerId) || '').trim();
  if (!provider || !key) {
    setText('#eon-vault-provider-check-status', 'Restore or verify this provider key in the current browser session before refreshing its model catalogue. No network request was made.');
    return;
  }
  const before = safeProviderHealth(providerId);
  const priorModels = new Set(Array.isArray(before?.models) ? before.models : []);
  const settings = loadAISettings();
  setText('#eon-vault-provider-check-status', `Refreshing ${provider.label || providerId} chat-capable models directly from the provider…`);
  try {
    const health = await verifyProviderReadiness(providerId, key, {
      forceRefresh: true,
      modelSelectionPolicy: settings.modelSelectionPolicy || 'auto',
      taskType: 'chat',
      endpoint: settings.provider === providerId ? settings.endpoint : ''
    });
    if (!health?.ok || !health?.model) {
      setText('#eon-vault-provider-check-status', `${provider.label || providerId} did not return a usable verified chat-model catalogue. EONBOT will not silently switch providers.`);
      return;
    }
    const currentModels = Array.isArray(health.models) ? health.models : [];
    const newCount = currentModels.filter((model) => !priorModels.has(model)).length;
    const recommendationChanged = Boolean(before?.model && before.model !== health.model);
    const pieces = [
      `${provider.label || providerId} model catalogue refreshed`,
      `${Math.max(0, Number(health.discoveredCount || currentModels.length || 0))} chat-capable model${Number(health.discoveredCount || currentModels.length || 0) === 1 ? '' : 's'} discovered`,
      `current ${settings.modelSelectionPolicy || 'Auto'} recommendation: ${health.model}`
    ];
    if (newCount) pieces.push(`${newCount} new candidate${newCount === 1 ? '' : 's'} in the verified envelope`);
    if (recommendationChanged) pieces.push(`previous recommendation: ${before.model}`);
    pieces.push('No model was downloaded and no provider was changed');
    setText('#eon-vault-provider-check-status', `${pieces.join(' · ')}.`);
  } catch {
    setText('#eon-vault-provider-check-status', `The ${provider.label || providerId} model refresh could not complete. The prior verified state remains the only available authority; no provider switch or model download was attempted.`);
  }
}

function renderProviderVerification({ preserveStatus = false } = {}) {
  const select = /** @type {HTMLSelectElement | null} */ ($('#eon-vault-provider-select'));
  if (!select) return;
  const prior = String(select.value || '');
  select.textContent = '';
  const candidates = providerCandidates();
  candidates.forEach((provider) => {
    const option = document.createElement('option');
    option.value = provider.id;
    option.textContent = provider.label || provider.id;
    select.append(option);
  });
  if (prior && candidates.some((provider) => provider.id === prior)) select.value = prior;
  if (!preserveStatus) setText('#eon-vault-provider-check-status', providerStatusText(currentProviderId()));
}

async function verifySelectedProvider() {
  const providerId = currentProviderId();
  const provider = PROVIDERS[providerId];
  const input = /** @type {HTMLInputElement | null} */ ($('#eon-vault-provider-key'));
  const save = /** @type {HTMLInputElement | null} */ ($('#eon-vault-provider-save'));
  const passphraseInput = /** @type {HTMLInputElement | null} */ ($('#eon-vault-provider-passphrase'));
  // A restored key stays session-only and never returns to the password field.
  // Verification may therefore use the existing session key after an explicit
  // Vault restore, while first-time verification still requires Vault input.
  const rawKey = String(input?.value || getApiKey(providerId) || '').trim();
  if (!provider || !rawKey) {
    setText('#eon-vault-provider-check-status', 'Enter a provider key in Vault to run this explicit compatibility check. Do not paste it into Chat.');
    return;
  }
  setText('#eon-vault-provider-check-status', `Checking ${provider.label || providerId} directly from this browser…`);
  setApiKey(providerId, rawKey, false);
  try {
    const passphrase = String(passphraseInput?.value || '');
    await ApiKeyVault.store(providerId, rawKey, save?.checked ? { persist: true, passphrase } : {});
    const current = loadAISettings();
    const health = await verifyProviderReadiness(providerId, rawKey, {
      forceRefresh: true,
      modelSelectionPolicy: current.modelSelectionPolicy || 'auto',
      taskType: 'chat',
      endpoint: current.provider === providerId ? current.endpoint : ''
    });
    if (input) input.value = '';
    if (passphraseInput) passphraseInput.value = '';
    if (!health?.ok || !health?.model) {
      setText('#eon-vault-provider-check-status', `${provider.label || providerId} did not return a verified chat-capable model. The key remains session-only unless you explicitly selected encrypted storage.`);
      renderSecurity();
      return;
    }
    const verifiedModels = Array.isArray(health.models) ? health.models : [health.model].filter(Boolean);
    const keepPinned = current.provider === providerId && current.modelPinned === true && verifiedModels.includes(current.model);
    saveAISettings({
      ...current,
      assistantMode: current.assistantMode === 'guide' ? 'auto' : current.assistantMode,
      mode: 'hybrid',
      provider: providerId,
      model: keepPinned ? current.model : '',
      modelPinned: keepPinned,
      endpoint: health.endpoint || provider.defaultEndpoint || current.endpoint || ''
    });
    const credentialVerified = health.credentialVerified !== false;
    setText('#eon-vault-provider-check-status', credentialVerified
      ? `${provider.label || providerId} verified with ${health.model}. Chat may use it from this session. ${save?.checked ? 'An encrypted local restore copy was saved.' : 'The key is session-only.'}`
      : `${provider.label || providerId} model compatibility is ready with ${health.model}. Its public model catalogue cannot validate the key; the provider will validate your key on the first real request you explicitly send. ${save?.checked ? 'An encrypted local restore copy was saved.' : 'The key is session-only.'}`);
    recordEonCoreOutcome({ kind: 'byok-provider-verification', route: '/vault#vault-ai-keys', source: 'vault-direct-byok', receiptId: `byok-provider-verification:${Date.now()}`, verified: credentialVerified });
    renderSecurity();
  } catch {
    if (input) input.value = '';
    setText('#eon-vault-provider-check-status', `The ${provider.label || providerId} check could not complete. Nothing was sent to EONAPP. Review the provider key, browser network policy, and provider availability, then try again.`);
  }
}

async function restoreSelectedProvider() {
  const providerId = currentProviderId();
  const provider = PROVIDERS[providerId];
  if (!provider) return;
  setText('#eon-vault-provider-check-status', `Restoring ${provider.label || providerId} to this browser session…`);
  const passphraseInput = /** @type {HTMLInputElement | null} */ ($('#eon-vault-provider-passphrase'));
  const passphrase = String(passphraseInput?.value || '');
  let diagnostic;
  try { diagnostic = await ApiKeyVault.diagnoseRetrieve(providerId, { timeoutMs: 30_000, passphrase }); } catch {
    diagnostic = { nonEmptyKeyReturned: false, failureStage: 'operation-failed' };
  } finally {
    // A recovery passphrase is read only for this explicit action and must not
    // remain in the page after either a successful or failed restore attempt.
    if (passphraseInput) passphraseInput.value = '';
  }
  if (!diagnostic?.nonEmptyKeyReturned) {
    const guidance = {
      'passphrase-required': 'Enter the passphrase that created this encrypted recovery copy, then try Restore again.',
      'provider-entry-missing': `No encrypted ${provider.label || providerId} recovery copy exists in this browser. Enter and verify the key again to create one.`,
      'envelope-malformed': 'This encrypted recovery copy is incomplete or malformed. It was not sent anywhere; enter and verify the provider key again to replace it.',
      'decrypt-failed': 'This recovery copy could not be opened with that passphrase. Check the passphrase used when it was saved, or enter and verify the provider key again.',
      'operation-timeout': 'The encrypted recovery operation timed out locally. Nothing was sent to EONAPP; try again before replacing the key.',
      'provider-invalid': 'This provider selection is invalid. Choose the provider again before restoring.',
      'operation-failed': 'The encrypted key restore could not complete safely. Nothing was sent to EONAPP; try again or verify the provider key again.'
    };
    setText('#eon-vault-provider-check-status', guidance[diagnostic?.failureStage] || 'The encrypted key restore could not complete safely. Nothing was sent to EONAPP; try again or verify the provider key again.');
    return;
  }
  const restored = await ApiKeyVault.retrieve(providerId, { timeoutMs: 30_000, passphrase });
  if (!restored) {
    setText('#eon-vault-provider-check-status', 'The encrypted recovery completed but no session key was available. Nothing was sent to EONAPP; verify the provider key again.');
    return;
  }
  setApiKey(providerId, restored, false);
  setText('#eon-vault-provider-check-status', `${provider.label || providerId} key restored to this browser session. Run Verify selected provider before Chat can use it.`);
  try { renderSecurity({ preserveProviderCheckStatus: true }); } catch {}
}

function clearSelectedProvider() {
  const providerId = currentProviderId();
  const provider = PROVIDERS[providerId];
  if (!provider) return;
  clearApiKey(providerId);
  try { ApiKeyVault.remove(providerId); } catch {}
  setText('#eon-vault-provider-check-status', `${provider.label || providerId} was cleared from this browser session and encrypted Vault storage.`);
  renderSecurity();
}

function renderEonbotReturnContext() {
  const card = $('#eon-vault-chat-return');
  const copy = $('#eon-vault-chat-return-copy');
  const button = $('#eon-vault-return-chat');
  const context = getEonbotVaultReturnContext();
  if (!card || !button) return;
  if (!context) {
    card.hidden = true;
    button.onclick = null;
    return;
  }
  card.hidden = false;
  if (copy) copy.textContent = 'You opened Vault from a reviewed EONBOT action. This page is the only place for provider keys and other sensitive settings. Nothing from Vault is copied into Chat.';
  button.onclick = () => {
    const completed = completeEonbotVaultReturnContext();
    if (!completed.ok) {
      setText('#eon-vault-action-status', 'The EONBOT return context is no longer active. You can open Chat normally.');
      return;
    }
    window.location.assign(completed.route);
  };
}

function renderProviders(security) {
  const host = $('#eon-vault-providers');
  if (!host) return;
  host.textContent = '';
  const providers = security.apiVault.providerNames || [];
  if (!providers.length) {
    host.textContent = 'No encrypted provider entries are stored in this browser profile.';
    return;
  }
  providers.forEach((provider) => {
    const chip = document.createElement('span');
    chip.className = 'eon-vault-chip';
    chip.textContent = provider;
    host.append(chip);
  });
}

function renderVaultReveals() {
  const root = $('#eon-vault-reveals-root');
  if (!root) return;
  root.innerHTML = renderEonCollectionWorkspace();
  bindEonCollectionWorkspace(root);
}

function renderVaultPremiumBoundary() {
  const overview = $('#eon-vault-premium-boundary');
  if (overview) overview.innerHTML = renderLockedFeatureSurface('vault', { compact: true });
  const reveals = $('#eon-vault-reveals-premium-boundary');
  if (reveals) reveals.innerHTML = renderLockedFeatureSurface('vault', { compact: true });
}

function renderVaultOverview() {
  const root = $('#eon-vault-overview-status');
  if (!root) return;
  const security = getVaultSecurityTruth();
  const providerState = security.apiVault.encryptedEntries
    ? 'Encrypted AI-provider entries exist on this browser; their values remain hidden.'
    : 'No encrypted AI-provider entries are stored on this browser.';
  root.textContent = `Recovery is ready as a user-held encrypted Capsule. ${providerState} Google Drive encrypted snapshots use a separate permission only after a user opens the Capsule backup flow; this deployment still needs owner configuration.`;
}

function renderDataContinuity() {
  const root = $('#eon-vault-continuity');
  if (!root) return;
  const truth = getEonDataContinuityTruth();
  const driveConnector = getGoogleDriveSnapshotTruth({ configured: false });
  root.textContent = '';

  const live = document.createElement('p');
  live.innerHTML = '<strong>Live now:</strong> Create one compressed-when-useful encrypted Capsule containing every eligible EONAPP-owned workspace record in this browser. Keep its passphrase separately, then inspect every restore before applying selected changes.';
  root.append(live);

  const device = document.createElement('p');
  device.textContent = 'EONAPP can be installed on more than one device, but each PWA keeps its own browser storage. A Capsule is the current deliberate way to move supported work between devices.';
  root.append(device);

  const driveLine = document.createElement('p');
  driveLine.innerHTML = `<strong>Google Drive:</strong> EONAPP now has a separate encrypted-snapshot connector. ${driveConnector.configured ? 'This deployment is configured for a user-confirmed Drive action.' : 'This deployment still requires owner configuration before the button can ask for Drive consent.'} It uploads one user-confirmed encrypted Capsule snapshot—not background sync.`;
  root.append(driveLine);

  const inactive = document.createElement('p');
  inactive.textContent = `Not active: ${truth.notActive.map((lane) => lane.label).join(', ')}.`;
  root.append(inactive);
}

function renderGoogleDriveFoundation() {
  const root = $('#eon-vault-google-drive');
  if (!root) return;
  const foundation = getGoogleDriveBackupFoundationTruth();
  const connector = getGoogleDriveSnapshotTruth({ configured: false });
  root.innerHTML = `
    <span class="eon-vault-drive-kicker">First cloud-backup lane · ${connector.state}</span>
    <h3>Google Drive encrypted backup</h3>
    <p>Google Login stays identity-only. A separate user action on the Capsule page can request the limited Drive backup permission after this deployment is configured.</p>
    <ul class="eon-vault-drive-list">
      <li>EONAPP creates one compressed-when-useful encrypted Capsule in this browser before any Google Drive upload.</li>
      <li>No access credential is persisted in Vault, localStorage, a Capsule, analytics, or the server.</li>
      <li>Backups are one-time snapshots. Restore remains manual: inspect the no-values plan, then apply only selected local changes.</li>
    </ul>
    <div class="eon-vault-actions"><a class="eon-vault-primary" href="/capsule">Open encrypted Drive backup</a></div>
    <p class="eon-vault-muted">${foundation.userMessage} The connector has source support but remains unavailable until the owner configures a public browser client ID and completes controlled Google evidence.</p>
  `;
}

function renderManualStorage() {
  const root = $('#eon-vault-manual-storage');
  if (!root) return;
  renderCloudBackupConnectors(root, { providerIds: ['google-drive'] });
}

function renderSecurity({ preserveProviderCheckStatus = false } = {}) {
  const security = getVaultSecurityTruth();
  setText('#eon-vault-provider-status', security.apiVault.encryptedEntries ? 'Encrypted provider entries found' : 'No provider key stored');
  setText('#eon-vault-device-status', security.apiVault.passphraseEncryptedRecovery ? 'Passphrase-encrypted recovery is configured' : 'Keys remain session-only unless you create a passphrase-encrypted recovery copy');
  setText('#eon-vault-sync-status', getEonPwaLocalProfileTruth());
  setText('#eon-vault-legacy-status', security.legacyReviewMessage);
  setText('#eon-vault-migration-status', security.migration.pendingLegacySourceCount
    ? `${security.migration.pendingLegacySourceCount} known legacy provider-storage source${security.migration.pendingLegacySourceCount === 1 ? '' : 's'} need secure review.`
    : 'No known legacy provider-storage source is currently present.');
  const migrationCard = $('[data-eon-vault-card="migration"]');
  if (migrationCard) migrationCard.hidden = !security.migration.pendingLegacySourceCount;
  renderProviders(security);
  renderProviderVerification({ preserveStatus: preserveProviderCheckStatus });
  renderEonbotReturnContext();
  const notices = $('#eon-vault-notices');
  if (notices) {
    notices.textContent = '';
    security.notices.forEach((notice) => {
      const item = document.createElement('li');
      item.textContent = notice;
      notices.append(item);
    });
  }
}

function downloadSafeSummary() {
  const payload = JSON.stringify(createSafeVaultBackupSummary(), null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `eonapp-vault-safe-summary-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setText('#eon-vault-action-status', 'Safe summary downloaded. It contains no raw keys or recovery secret.');
}

function openChat(prompt) {
  try { localStorage.setItem('eon:chat:prefill:v1', prompt); } catch {}
  window.location.assign(`/chat?q=${encodeURIComponent(prompt)}`);
}

function init() {
  renderSecurity();
  renderVaultOverview();
  renderVaultReveals();
  renderVaultPremiumBoundary();
  renderDataContinuity();
  renderGoogleDriveFoundation();
  renderManualStorage();
  activateVaultTab(window.location.hash || 'overview');
  document.querySelectorAll('[data-eon-vault-tab], [data-eon-vault-open-tab]').forEach((button) => {
    button.addEventListener('click', () => activateVaultTab(button.dataset.eonVaultTab || button.dataset.eonVaultOpenTab || 'overview', { updateHash: true }));
  });
  window.addEventListener('hashchange', () => activateVaultTab(window.location.hash || 'overview'));
  $('#eon-vault-refresh')?.addEventListener('click', () => {
    renderSecurity();
    renderVaultOverview();
    setText('#eon-vault-action-status', 'Vault status refreshed without reading or showing secret values.');
  });
  $('#eon-vault-safe-summary')?.addEventListener('click', downloadSafeSummary);
  $('#eon-vault-migrate')?.addEventListener('click', async () => {
    const passphrase = String((/** @type {HTMLInputElement | null} */ ($('#eon-vault-provider-passphrase')))?.value || '');
    if (!globalThis.confirm?.('Migrate known legacy provider keys into passphrase-encrypted recovery storage? The source is removed or redacted only after every write verifies.')) return;
    setText('#eon-vault-action-status', 'Encrypting and verifying known legacy provider entries locally…');
    const result = await migrateKnownLegacyProviderStorage({ passphrase, confirmedByUser: true });
    if (result.ok) {
      renderSecurity();
      renderVaultOverview();
      setText('#eon-vault-action-status', result.sourceCount
        ? `Secure migration completed for ${result.migratedProviderCount} provider entr${result.migratedProviderCount === 1 ? 'y' : 'ies'}. No raw values were displayed.`
        : 'No known legacy provider-storage source required migration.');
      const passphraseInput = /** @type {HTMLInputElement | null} */ ($('#eon-vault-provider-passphrase'));
      if (passphraseInput) passphraseInput.value = '';
    } else {
      setText('#eon-vault-action-status', 'Migration could not complete. No source was intentionally removed; review this browser before relying on it for long-term secret storage.');
    }
  });
  $('#eon-vault-provider-select')?.addEventListener('change', () => setText('#eon-vault-provider-check-status', providerStatusText(currentProviderId())));
  $('#eon-vault-provider-form')?.addEventListener('submit', (event) => { event.preventDefault(); void verifySelectedProvider(); });
  $('#eon-vault-provider-refresh-models')?.addEventListener('click', () => { void refreshSelectedProviderModels(); });
  $('#eon-vault-provider-restore')?.addEventListener('click', () => { void restoreSelectedProvider(); });
  $('#eon-vault-provider-clear')?.addEventListener('click', clearSelectedProvider);
  $('#eon-vault-local-ai')?.addEventListener('click', () => openChat('Help me review this device’s local AI setup and explain what remains local versus cloud-based.'));
  $('#eon-vault-security-chat')?.addEventListener('click', () => openChat('Explain EONAPP Vault safety in simple terms. Do not ask me to paste any seed phrase, password, API key, or exchange secret.'));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
