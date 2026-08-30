import { getDecentralIdentitySummary, updateRecoveryState } from './profile.js';
import { ApiKeyVault } from './api-key-vault.js';
import { escapeHtml } from './escape.js';

const NUDGE_DISMISSED_UNTIL = 'eon:onboarding:nudge:dismissed-until:v1';
const NUDGE_COMPLETED = 'eon:onboarding:nudge:completed:v1';
const NUDGE_EMAIL = 'eon:onboarding:contact-email:v1';
const SESSION_KEYS = 'eon:ai-chat-session-keys:v1';
const ACCOUNT_PROTECTED_EVENT = 'eon-onboarding-progress';
const ONE_DAY = 24 * 60 * 60 * 1000;

function safeGet(storage, key) {
  try { return storage.getItem(key); } catch { return null; }
}

function safeSet(storage, key, value) {
  try { storage.setItem(key, value); } catch {}
}

function safeJson(value, fallback) {
  try { return JSON.parse(value || ''); } catch { return fallback; }
}

function hasSessionAiKey() {
  const raw = safeJson(safeGet(sessionStorage, SESSION_KEYS), {});
  return Boolean(raw && typeof raw === 'object' && Object.values(raw).some(Boolean));
}

function hasStoredAiKey() {
  try { return Boolean(ApiKeyVault.hasKeys?.() || ApiKeyVault.list?.().length); } catch { return false; }
}

function hasContactEmail() {
  const stored = String(safeGet(localStorage, NUDGE_EMAIL) || '').trim();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(stored)) return true;
  try {
    const summary = getDecentralIdentitySummary();
    return summary.browserAttachments?.some((item) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(item.email || '')));
  } catch {
    return false;
  }
}

function getRecoverySummary() {
  try { return getDecentralIdentitySummary(); } catch { return null; }
}

export function getOnboardingChecklist() {
  const summary = getRecoverySummary();
  const recovery = /** @type {{ lastExportAt?: unknown, mirrorTargets?: unknown[] }} */ (summary?.recovery || {});
  const hasEncryptedBackup = Boolean(recovery.lastExportAt || (summary && summary.recoveryStatus !== 'local-only'));
  const hasCloudMirror = Array.isArray(recovery.mirrorTargets) && recovery.mirrorTargets.length > 0;
  const hasAi = hasSessionAiKey() || hasStoredAiKey();
  const hasEmail = hasContactEmail();
  const steps = [
    {
      id: 'backup',
      label: 'Create encrypted Vault backup',
      description: 'Protect your local account if browser data is cleared or the device is lost.',
      done: hasEncryptedBackup,
      href: '/vault#export',
      cta: 'Open backup'
    },
    {
      id: 'cloud',
      label: 'Add recovery mirror',
      description: 'Save an encrypted backup to your own cloud/IPFS provider when ready.',
      done: hasCloudMirror,
      href: '/vault#backup',
      cta: 'Add mirror'
    },
    {
      id: 'ai',
      label: 'Connect AI power',
      description: 'Guide mode works free. Add a provider key or local runtime for real AI responses.',
      done: hasAi,
      href: '/local-ai',
      cta: 'Set up AI'
    },
    {
      id: 'email',
      label: 'Optional recovery contact',
      description: 'Save an email locally for support/reference. EONAPP does not create a central account from this.',
      done: hasEmail,
      href: '/support.html',
      cta: 'Support'
    }
  ];
  const completed = steps.filter((step) => step.done).length;
  return { steps, completed, total: steps.length, complete: completed === steps.length };
}

export function shouldShowOnboardingReminder(options = {}) {
  if (options.force) return true;
  if (safeGet(localStorage, NUDGE_COMPLETED) === '1') return false;
  const dismissedUntil = Number(safeGet(localStorage, NUDGE_DISMISSED_UNTIL) || 0);
  if (Number.isFinite(dismissedUntil) && dismissedUntil > Date.now()) return false;
  const pageType = document.body?.dataset?.pageType || '';
  if (/admin|payment|billing|subscription|nowpayments/i.test(pageType)) return false;
  const checklist = getOnboardingChecklist();
  return !checklist.complete;
}

function dismissFor(days = 3) {
  safeSet(localStorage, NUDGE_DISMISSED_UNTIL, String(Date.now() + days * ONE_DAY));
}

function saveEmail(value) {
  const email = String(value || '').trim().slice(0, 128);
  if (!email) return { ok: false, message: 'Enter an email first.' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, message: 'That email does not look valid.' };
  safeSet(localStorage, NUDGE_EMAIL, email);
  window.dispatchEvent(new CustomEvent(ACCOUNT_PROTECTED_EVENT, { detail: getOnboardingChecklist() }));
  return { ok: true, message: 'Recovery contact saved locally on this device.' };
}

function markCloudMirror(provider = 'cloud-drive') {
  try {
    const summary = getDecentralIdentitySummary();
    const existing = Array.isArray(summary?.recovery?.mirrorTargets) ? summary.recovery.mirrorTargets : [];
    updateRecoveryState({ mirrorTargets: [...new Set([...existing, provider])] });
    window.dispatchEvent(new CustomEvent(ACCOUNT_PROTECTED_EVENT, { detail: getOnboardingChecklist() }));
    return true;
  } catch {
    return false;
  }
}

function renderStep(step) {
  return `
    <li class="eon-onboarding-step ${step.done ? 'is-done' : ''}">
      <span class="eon-onboarding-check" aria-hidden="true">${step.done ? '✓' : '•'}</span>
      <div>
        <strong>${escapeHtml(step.label)}</strong>
        <p>${escapeHtml(step.description)}</p>
        <a href="${escapeHtml(step.href)}">${escapeHtml(step.done ? 'Review' : step.cta)}</a>
      </div>
    </li>`;
}

function renderReminder(root, checklist) {
  root.innerHTML = `
    <div class="eon-onboarding-backdrop" data-onboarding-close="1"></div>
    <section class="eon-onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="eon-onboarding-title">
      <button type="button" class="eon-onboarding-close" data-onboarding-close="1" aria-label="Close onboarding reminder">×</button>
      <div class="eon-onboarding-kicker">Account setup</div>
      <h2 id="eon-onboarding-title">Protect your EONAPP workspace</h2>
      <p class="eon-onboarding-copy">EONAPP is local-first. Finish these setup steps so your Vault, AI setup, and workspace can be recovered if browser data is lost.</p>
      <div class="eon-onboarding-meter" aria-label="${checklist.completed} of ${checklist.total} setup steps complete">
        <span style="width:${Math.round((checklist.completed / checklist.total) * 100)}%"></span>
      </div>
      <ol class="eon-onboarding-list">${checklist.steps.map(renderStep).join('')}</ol>
      <form class="eon-onboarding-email" data-onboarding-email-form="1">
        <label for="eon-onboarding-email">Optional email for support/recovery notes</label>
        <div>
          <input id="eon-onboarding-email" type="email" autocomplete="email" placeholder="you@example.com" value="${escapeHtml(safeGet(localStorage, NUDGE_EMAIL) || '')}" />
          <button type="submit" class="btn btn-outline btn-sm">Save locally</button>
        </div>
        <small id="eon-onboarding-email-status">Stored only in your browser unless you send it to support.</small>
      </form>
      <div class="eon-onboarding-actions">
        <a class="btn btn-primary" href="/vault#export">Back up Vault</a>
        <a class="btn btn-outline" href="/local-ai">Set up AI</a>
        <button type="button" class="btn btn-outline" data-onboarding-cloud="1">Mark cloud backup planned</button>
        <button type="button" class="btn btn-outline" data-onboarding-later="1">Remind me later</button>
      </div>
    </section>`;
}

function attachHandlers(root) {
  root.querySelectorAll('[data-onboarding-close]').forEach((node) => {
    node.addEventListener('click', () => {
      dismissFor(3);
      root.remove();
    });
  });
  root.querySelector('[data-onboarding-later]')?.addEventListener('click', () => {
    dismissFor(7);
    root.remove();
  });
  root.querySelector('[data-onboarding-cloud]')?.addEventListener('click', () => {
    const ok = markCloudMirror('user-cloud-provider-planned');
    const status = root.querySelector('#eon-onboarding-email-status');
    if (status) {
      status.textContent = ok
        ? 'Cloud-backup reminder saved. Export an encrypted Vault backup next.'
        : 'Open Vault to configure cloud backup providers.';
    }
    renderReminder(root, getOnboardingChecklist());
    attachHandlers(root);
  });
  root.querySelector('[data-onboarding-email-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = root.querySelector('#eon-onboarding-email');
    const result = saveEmail(input?.value || '');
    const status = root.querySelector('#eon-onboarding-email-status');
    if (status) status.textContent = result.message;
    if (result.ok) {
      renderReminder(root, getOnboardingChecklist());
      attachHandlers(root);
    }
  });
}

export function initOnboardingReminder(options = {}) {
  if (typeof document === 'undefined') return null;
  if (!shouldShowOnboardingReminder(options)) return null;
  if (document.getElementById('eon-onboarding-reminder')) return null;
  const delay = Number(options.delayMs ?? 1800);
  window.setTimeout(() => {
    if (!shouldShowOnboardingReminder(options)) return;
    const checklist = getOnboardingChecklist();
    if (checklist.complete) {
      safeSet(localStorage, NUDGE_COMPLETED, '1');
      return;
    }
    const root = document.createElement('div');
    root.id = 'eon-onboarding-reminder';
    root.className = 'eon-onboarding-reminder';
    renderReminder(root, checklist);
    document.body.appendChild(root);
    attachHandlers(root);
  }, delay);
  return true;
}

export default initOnboardingReminder;

// W21 inline Vault reminder strip helpers. These complement the sitewide modal above.
const VAULT_REMINDER_DISMISS_KEY = 'eon:onboarding-reminder-dismissed:v1';

function readVaultReminderDismissed() {
  try { return JSON.parse(localStorage.getItem(VAULT_REMINDER_DISMISS_KEY) || '{}') || {}; } catch { return {}; }
}

function isVaultReminderDismissed(id) {
  const dismissed = readVaultReminderDismissed();
  const row = dismissed[id];
  if (!row?.at) return false;
  return Date.now() - new Date(row.at).getTime() < ONE_DAY;
}

export function dismissOnboardingReminder(id) {
  const dismissed = readVaultReminderDismissed();
  dismissed[id] = { at: new Date().toISOString() };
  try { localStorage.setItem(VAULT_REMINDER_DISMISS_KEY, JSON.stringify(dismissed)); } catch {}
}

export function buildVaultReminderState({ profile = {}, providerHealth = {}, shareStats = {} } = {}) {
  const recovery = profile?.recovery || {};
  const hasBackup = Boolean(recovery.lastExportAt || recovery.recoveryPhraseSet || recovery.mirrorTargets?.length);
  const healthyProviders = Object.values(providerHealth || {}).filter((row) => row?.ok).length;
  const shareAttempts = Number(shareStats?.total || 0);
  const reminders = [];
  if (!hasBackup && !isVaultReminderDismissed('backup')) {
    reminders.push({ id: 'backup', tone: 'warning', title: 'Backup still missing', body: 'Download an encrypted Vault backup and store it somewhere private before serious use.', href: '#backup', cta: 'Open backup' });
  }
  if (healthyProviders === 0 && !isVaultReminderDismissed('providers')) {
    reminders.push({ id: 'providers', tone: 'info', title: 'AI provider not verified', body: 'Add or retest one provider so Chat, Cockpit, and Vault can leave guide mode.', href: '#api-keys', cta: 'Check providers' });
  }
  if (shareAttempts === 0 && !isVaultReminderDismissed('referral')) {
    reminders.push({ id: 'referral', tone: 'success', title: 'Referral link ready', body: 'Create a signed Realm or referral link when you are ready to share. Sharing itself creates no points, reward, payout, or central click record.', href: '#invite', cta: 'Share link' });
  }
  return {
    hasBackup,
    healthyProviders,
    shareAttempts,
    reminders
  };
}

export function renderOnboardingReminderStrip(root, options = {}) {
  if (!root) return null;
  const state = buildVaultReminderState(options);
  if (!state.reminders.length) {
    root.innerHTML = '<div class="onboarding-reminder-strip is-complete"><strong>Vault basics complete.</strong><span>Backup, provider, and share reminders are clear for now.</span></div>';
    return state;
  }
  root.innerHTML = `
    <div class="onboarding-reminder-strip">
      ${state.reminders.map((item) => `<article class="onboarding-reminder-card tone-${item.tone}" data-reminder-id="${item.id}">
        <div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.body)}</span></div>
        <div class="onboarding-reminder-actions">
          <a class="btn btn-outline btn-sm" href="${escapeHtml(item.href)}">${escapeHtml(item.cta)}</a>
          <button class="btn btn-outline btn-sm" type="button" data-dismiss-reminder="${escapeHtml(item.id)}">Later</button>
        </div>
      </article>`).join('')}
    </div>
  `;
  root.querySelectorAll('[data-dismiss-reminder]').forEach((node) => {
    node.addEventListener('click', () => {
      dismissOnboardingReminder(node.getAttribute('data-dismiss-reminder') || 'unknown');
      renderOnboardingReminderStrip(root, options);
    });
  });
  return state;
}
