/** EONAPP W218 — local profile identity, appearance, PWA truth, and encrypted portable backup. */
import { getEonPwaState, requestEonPwaInstall, applyEonPwaUpdate, reloadEonPwaAfterUpdate } from './eon-pwa-manager.js';
import { createEonPwaRecoveryRehearsal } from './eon-pwa-recovery-rehearsal.js';
import { renderAvatarMarkup } from './utils/avatar.js';
import { ensureProfile, remixProfileAvatar, updateProfile } from './utils/profile.js';
import { EON_THEME_OPTIONS, getEonTheme, setEonTheme } from './utils/storage.js';
import { readEonbotProactiveSettings, setEonbotProactiveEnabled } from './utils/eonbot-proactive-suggestions.js';
import { getChatLanguagePreference, resolveChatLanguage, setChatLanguagePreference } from './utils/app-language.js';
import { LANGUAGES } from './utils/multi-language.js';
import { VOICE_LANGUAGE_OPTIONS, getVoiceLanguageOption, readVoiceLanguagePreference, saveVoiceLanguagePreference } from './chat/voice-language-preferences.js';
import { resolveEonVoiceFallbackPlan } from './chat/eon-voice-fallback-strategy.js';
import {
  clearEonbotInteractionPreferences,
  getEonbotInteractionPreferenceTruth,
  readEonbotInteractionPreferences,
  setEonbotInteractionPreferences
} from './chat/eonbot-interaction-preferences.js';
import { openEonShareSheet } from './utils/eon-share-sheet.js';
import { getAccountFoundationPublicSummary } from './account/eon-account-foundation.js';
import { getIdentityReturnTo } from './account/eon-identity-onboarding.js';
import { clearLocalMeasurementData, getLocalMeasurementPreference, setLocalMeasurementPreference } from './utils/eon-analytics.js';
import { getAggregateAnalyticsPreference, setAggregateAnalyticsPreference } from './utils/analytics-bridge.js';
import { clearTrustTelemetry } from './utils/trust-telemetry.js';
import { clearRuntimeErrors } from './utils/runtime-error-telemetry.js';
import { getEonDataContinuityLabel, getEonDataContinuityTruth } from './local-first/eon-data-continuity.js';
import { getGoogleDriveBackupFoundationTruth } from './local-first/eon-google-drive-backup-foundation.js';
import { getGoogleDriveSnapshotTruth } from './local-first/eon-google-drive-snapshot-connector.js';

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = String(value || '');
}

function readLanguage() {
  try { return String(localStorage.getItem('eon:lang:v1') || 'English'); } catch { return 'English'; }
}

function dispatchProfileChange(profile) {
  try { window.dispatchEvent(new CustomEvent('eon:profile-changed', { detail: { alias: profile?.alias || '' } })); } catch {}
}

let currentGoogleAuthState = Object.freeze({ available: false, signedIn: false, rollout: 'disabled' });

const PREFERENCE_SECTION_IDS = Object.freeze([
  'profile-general',
  'profile-account-backup',
  'profile-voice-language',
  'profile-device-app',
  'profile-privacy',
  'profile-sharing'
]);

function preferenceSectionFromHash(hash = window.location.hash) {
  const targetId = String(hash || '').replace(/^#/, '').trim();
  const target = targetId ? document.getElementById(targetId) : null;
  const parent = target?.closest?.('.eon-preferences-section');
  if (parent?.id && PREFERENCE_SECTION_IDS.includes(parent.id)) return parent.id;
  return PREFERENCE_SECTION_IDS.includes(targetId) ? targetId : PREFERENCE_SECTION_IDS[0];
}

function setActivePreferenceNavigation(sectionId = preferenceSectionFromHash()) {
  document.querySelectorAll('[data-preference-target]').forEach((button) => {
    const active = button.dataset.preferenceTarget === sectionId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
    if (active) button.setAttribute('aria-current', 'location');
    else button.removeAttribute('aria-current');
  });
}

function setActivePreferencePanel(sectionId = preferenceSectionFromHash(), { updateHash = false } = {}) {
  const activeId = PREFERENCE_SECTION_IDS.includes(sectionId) ? sectionId : PREFERENCE_SECTION_IDS[0];
  document.querySelectorAll('[data-preference-section]').forEach((section) => {
    const isActive = section.id === activeId;
    section.dataset.preferenceActive = String(isActive);
    const panel = section.querySelector('.eon-preferences-section-panel');
    const toggle = section.querySelector('[data-preference-toggle]');
    if (panel) panel.hidden = !isActive;
    if (toggle) toggle.setAttribute('aria-expanded', String(isActive));
  });
  setActivePreferenceNavigation(activeId);
  if (updateHash && window.location.hash !== `#${activeId}`) {
    try { window.history.replaceState(null, '', `#${activeId}`); } catch {}
  }
  return activeId;
}

function bindPreferenceNavigation() {
  setActivePreferencePanel();
  document.querySelectorAll('[data-preference-target], [data-preference-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.preferenceTarget || button.dataset.preferenceToggle || '';
      if (!PREFERENCE_SECTION_IDS.includes(target)) return;
      setActivePreferencePanel(target, { updateHash: true });
      if (!window.matchMedia('(min-width: 961px)').matches) {
        const section = document.getElementById(target);
        section?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
      }
    });
  });
  window.addEventListener('hashchange', () => setActivePreferencePanel(preferenceSectionFromHash()));
}

function currentAccountNotice() {
  const value = new URLSearchParams(window.location.search).get('account') || '';
  const notices = {
    connected: 'Google Login is active for account access. Your local work stayed on this device.',
    cancelled: 'Google Login was cancelled. Guest mode remains available.',
    unavailable: 'Google Login is not enabled on this deployment. Guest mode remains available.',
    error: 'Google Login could not be completed. No local EONAPP work was uploaded.'
  };
  return notices[value] || '';
}

function profileGoogleReturnTo() {
  const candidate = new URLSearchParams(window.location.search).get('returnTo') || '/profile';
  return getIdentityReturnTo(candidate);
}

function renderGoogleAuthState(state = currentGoogleAuthState, message = '') {
  currentGoogleAuthState = Object.freeze({
    available: Boolean(state?.available),
    signedIn: Boolean(state?.signedIn),
    rollout: ['testing', 'public'].includes(state?.rollout) ? state.rollout : 'disabled'
  });
  const detail = document.querySelector('#eon-profile-account-foundation-detail');
  const login = document.querySelector('#eon-profile-google-login');
  const logout = document.querySelector('#eon-profile-google-logout');
  const remove = document.querySelector('#eon-profile-delete-account');
  const status = document.querySelector('#eon-profile-google-auth-status');
  const mode = document.querySelector('#eon-profile-google-auth-mode');

  let detailText = 'Google Login is optional and not configured on this deployment yet. It is only for minimal account access after explicit testing proof—not for purchases, local-work recovery, or uploading browser-local work.';
  let modeText = 'Guest mode is active. No Google account is required.';
  if (currentGoogleAuthState.available && currentGoogleAuthState.signedIn) {
    detailText = 'Google Login is active for account access only. It did not upload browser-local work to EONAPP, Google, or Cloudflare.';
    modeText = 'Signed in with Google. Only minimal account/session metadata is held in Cloudflare.';
  } else if (currentGoogleAuthState.available && currentGoogleAuthState.rollout === 'testing') {
    detailText = 'Optional Google Login is in limited test mode. Only approved Google OAuth test users can complete sign-in. Guest mode remains fully available.';
    modeText = 'Identity-only testing mode. Google Login is not a cloud backup.';
  } else if (currentGoogleAuthState.available) {
    detailText = 'Optional Google Login is available for minimal account access only. It does not upload browser-local work, create purchase access, or restore work across devices.';
    modeText = 'Identity-only Google Login. No Google service connection is granted.';
  }

  if (detail) detail.textContent = detailText;
  if (mode) mode.textContent = modeText;
  const foundation = document.querySelector('#eon-profile-account-foundation-status');
  if (foundation) {
    foundation.textContent = currentGoogleAuthState.signedIn
      ? 'Account connected. Browser-local work remains on this device.'
      : (currentGoogleAuthState.available
        ? 'Optional Google Login is ready for this deployment. Guest mode remains available.'
        : 'Guest mode is active. Account sign-in is unavailable on this deployment.');
  }
  if (login) {
    login.hidden = currentGoogleAuthState.signedIn;
    login.disabled = !currentGoogleAuthState.available;
    login.textContent = currentGoogleAuthState.available ? 'Continue with Google' : 'Google Login unavailable';
  }
  if (logout) logout.hidden = !currentGoogleAuthState.signedIn;
  if (remove) remove.hidden = !currentGoogleAuthState.signedIn;
  if (status) {
    status.textContent = message || currentAccountNotice() || (currentGoogleAuthState.signedIn
      ? 'This sign-in session does not back up local EONAPP work.'
      : 'Google Login is optional. Your current work stays on this device; restore it with a Portable Workspace Capsule when needed.');
  }
}

async function refreshGoogleAuthState() {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { accept: 'application/json' },
      cache: 'no-store'
    });
    const payload = await response.json();
    renderGoogleAuthState(payload, currentAccountNotice());
  } catch {
    renderGoogleAuthState({ available: false, signedIn: false, rollout: 'disabled' }, 'Google Login is unavailable in this browser session. Guest mode remains available.');
  }
}

function renderAccountFoundation(profile = ensureProfile()) {
  const summary = getAccountFoundationPublicSummary(profile);
  setText('#eon-profile-account-foundation-status', summary.message);
  setText('#eon-profile-account-backup-warning', 'Google Login does not copy local Chat, Vault, projects, Realm setup, City progress, files, provider keys, or settings to EONAPP or Google. One encrypted Capsule is the live all-at-once file for eligible workspace records. Google Drive backup uses a separate explicit permission only from the Capsule page and never reuses Google Login consent.');
  const card = document.querySelector('#eon-profile-account-foundation');
  if (card) card.dataset.accountMode = summary.mode;
  renderGoogleAuthState(currentGoogleAuthState);
  return summary;
}

function renderDataContinuity() {
  const truth = getEonDataContinuityTruth();
  const drive = getGoogleDriveBackupFoundationTruth();
  const connector = getGoogleDriveSnapshotTruth({ configured: false });
  setText('#eon-profile-continuity-status', `${getEonDataContinuityLabel()} One Capsule contains all eligible EONAPP workspace records as one encrypted file; it does not include unknown browser storage or secret material. ${truth.manualStorageGuidance} Google Drive uses the same encrypted Capsule format; it does not create sync.`);
  setText('#eon-profile-drive-backup-status', `Google Drive encrypted snapshot connector: ${connector.state.replaceAll('-', ' ')}. Open Capsule to prepare the separate consent flow. ${drive.userMessage}`);
}

function renderProfileIdentity(message = '') {
  const profile = ensureProfile();
  const avatar = document.querySelector('#eon-profile-avatar');
  if (avatar) avatar.innerHTML = renderAvatarMarkup(profile, { size: 80, alt: `${profile.alias || 'EONAPP'} local avatar` });
  setText('#eon-profile-alias', profile.alias || 'Local profile');
  setText('#eon-profile-identity-note', 'Generated locally for this browser profile. It is not a public account or identity check.');
  const input = document.querySelector('#eon-profile-alias-input');
  if (input && document.activeElement !== input) input.value = profile.alias || '';
  setText('#eon-profile-status', message);
  return profile;
}

function themeLabel(value) {
  return { graphite: 'Graphite', obsidian: 'Obsidian', ember: 'Ember' }[value] || 'Graphite';
}

function renderThemeChoice(message = '') {
  const active = getEonTheme();
  document.querySelectorAll('[data-eon-theme-choice]').forEach((button) => {
    const selected = button.dataset.eonThemeChoice === active;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  setText('#eon-profile-theme-status', message || `${themeLabel(active)} is active in this browser profile.`);
}

function renderEonbotReminderPreference(message = '') {
  const preference = readEonbotProactiveSettings();
  const toggle = document.querySelector('#eon-profile-reminder-toggle');
  if (toggle) toggle.checked = preference.enabled;
  setText('#eon-profile-reminder-status', message || (preference.enabled
    ? 'Optional in-app reminders are enabled for this browser profile. Browser notifications remain off.'
    : 'Optional in-app reminders are off. EONBOT will not interrupt you.'));
}

function renderLocalMeasurementPreference(message = '') {
  const preference = getLocalMeasurementPreference();
  const toggle = document.querySelector('#eon-profile-measurement-toggle');
  if (toggle) toggle.checked = preference.enabled;
  setText('#eon-profile-measurement-status', message || preference.note);
}

function renderAggregateAnalyticsPreference(message = '') {
  const preference = getAggregateAnalyticsPreference();
  const toggle = document.querySelector('#eon-profile-aggregate-analytics-toggle');
  if (toggle) toggle.checked = preference.enabled;
  setText('#eon-profile-aggregate-analytics-status', message || preference.note);
}

function renderEonbotInteractionPreferences(message = '') {
  const preference = readEonbotInteractionPreferences();
  const truth = getEonbotInteractionPreferenceTruth(preference);
  const languageSelect = document.querySelector('#eon-profile-eonbot-language');
  if (languageSelect) {
    if (!languageSelect.options.length) {
      const follow = document.createElement('option');
      follow.value = 'auto';
      follow.textContent = 'Follow app language';
      languageSelect.appendChild(follow);
      LANGUAGES.filter((language) => language.active !== false && language.public !== false).forEach((language) => {
        const option = document.createElement('option');
        option.value = language.code;
        option.textContent = `${language.name} (${language.englishName})`;
        languageSelect.appendChild(option);
      });
    }
    languageSelect.value = getChatLanguagePreference();
  }
  const speechSelect = document.querySelector('#eon-profile-speech-language');
  if (speechSelect) {
    if (!speechSelect.options.length) {
      VOICE_LANGUAGE_OPTIONS.forEach((entry) => {
        const option = document.createElement('option');
        option.value = entry.value;
        option.textContent = entry.value === 'auto' ? 'Auto — follow chat or device language' : entry.label.replace(/^Voice:\s*/i, '');
        speechSelect.appendChild(option);
      });
    }
    speechSelect.value = readVoiceLanguagePreference();
  }
  const voiceToggle = document.querySelector('#eon-profile-eonbot-voice-toggle');
  const greetingToggle = document.querySelector('#eon-profile-eonbot-greeting-toggle');
  if (voiceToggle) voiceToggle.checked = preference.voiceOutputEnabled;
  if (greetingToggle) greetingToggle.checked = preference.personalizedGreetingEnabled;
  const language = String(resolveChatLanguage() || 'en').toUpperCase();
  const speech = getVoiceLanguageOption(readVoiceLanguagePreference());
  const speechLabel = speech.value === 'auto' ? 'AUTO' : speech.label.replace(/^Voice:\s*/i, '');
  setText('#eon-profile-eonbot-preferences-status', message || `${truth.note} Reply language: ${language}. Speech recognition: ${speechLabel}. ${truth.boundary}`);

  const targetLocale = speech.value === 'auto' ? (navigator.language || 'en-US') : speech.value;
  const voices = typeof window.speechSynthesis?.getVoices === 'function' ? window.speechSynthesis.getVoices() : [];
  const fallback = resolveEonVoiceFallbackPlan({
    targetLocale,
    recognitionSupported: Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    synthesisSupported: Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance),
    microphoneCaptureSupported: Boolean(navigator.mediaDevices?.getUserMedia),
    voices,
    localCompanionReady: false,
    localCompanionAirplaneModeProven: false
  });
  const inputLabel = {
    'browser-assisted-dictation': 'EONAPP Dictate',
    'typed-or-os-dictation': 'typing or operating-system dictation',
    'local-companion-stt': 'local companion dictation'
  }[fallback.input.mode] || 'editable text input';
  const outputLabel = {
    'browser-speech-synthesis': 'a matching installed spoken voice',
    'device-default-best-effort': 'the device default voice where understandable',
    'visible-text-and-device-read-aloud': 'visible text with browser or device Read Aloud',
    'local-companion-tts': 'local companion speech'
  }[fallback.output.mode] || 'visible text';
  setText('#eon-profile-voice-reach-status', `Best available no-key path: ${inputLabel} and ${outputLabel}. Support varies by browser, operating system, installed voice and language; typed chat always remains available.`);
}

function dispatchChatLanguageChange() {
  try { document.dispatchEvent(new CustomEvent('eon:chat-language-changed')); } catch {}
}

function renderPwaState(state = getEonPwaState(), message = '') {
  const installed = Boolean(state?.standalone);
  const installButton = document.querySelector('#eon-profile-install-button');
  const updateButton = document.querySelector('#eon-profile-update-button');
  const summary = installed
    ? 'EONAPP is open as an installed app in this browser profile.'
    : 'EONAPP is open in this browser profile. Installation is optional and depends on your browser.';
  setText('#eon-profile-pwa', summary);
  if (installButton) {
    installButton.disabled = installed;
    installButton.textContent = installed ? 'Installed in this profile' : 'Install EONAPP';
  }
  if (updateButton) {
    const reloadRequired = state?.reloadRequired === true;
    const updateReady = state?.updateReady === true;
    updateButton.disabled = !reloadRequired && !updateReady;
    updateButton.textContent = reloadRequired ? 'Reload updated app' : updateReady ? 'Apply update' : state?.updateRequestPending ? 'Activating update…' : 'No update ready';
    updateButton.dataset.eonPwaAction = reloadRequired ? 'reload' : 'apply';
  }
  setText('#eon-profile-pwa-status', message || (!installed && !state?.installAvailable ? state?.installGuidance || '' : ''));
}


function recoveryRehearsalController() {
  return createEonPwaRecoveryRehearsal();
}

function renderRecoveryRehearsal(snapshot = recoveryRehearsalController().getSnapshot(), message = '') {
  const status = document.querySelector('#eon-profile-recovery-status');
  const steps = document.querySelector('#eon-profile-recovery-steps');
  const clear = document.querySelector('#eon-profile-recovery-clear');
  const latest = Array.isArray(snapshot?.rehearsals) ? snapshot.rehearsals[0] : null;
  if (clear) clear.disabled = !latest;
  if (!latest) {
    if (status) status.textContent = message || 'No rehearsal is prepared. This creates a redacted local plan only; it does not back up, restore, update, reload, or certify this device.';
    if (steps) steps.replaceChildren();
    return;
  }
  if (status) {
    const inventory = latest.inventory || {};
    const reviewState = latest.status === 'manual-plan-reviewed' ? 'The manual plan is acknowledged.' : 'Manual proof is still pending.';
    status.textContent = message || `${reviewState} Redacted inventory: ${Number(inventory.protectedCategoryCount || 0)} protected categories and ${Number(inventory.protectedKeysPresent || 0)} protected local records observed. No values or key names were read or stored.`;
  }
  if (!steps) return;
  const list = document.createElement('ol');
  list.className = 'eon-profile-recovery-steps';
  for (const step of latest.steps || []) {
    const item = document.createElement('li');
    const copy = document.createElement('span');
    copy.textContent = step.label;
    item.appendChild(copy);
    if (step.acknowledged) {
      const done = document.createElement('strong');
      done.textContent = ' Reviewed locally';
      item.appendChild(done);
    } else {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'eon-record-button';
      button.dataset.eonRecoveryStep = step.id;
      button.dataset.eonRecoveryRehearsal = latest.rehearsalId;
      button.textContent = 'Mark reviewed';
      item.appendChild(button);
    }
    list.appendChild(item);
  }
  steps.replaceChildren(list);
}

function bindProfileControls() {
  document.querySelector('#eon-profile-google-login')?.addEventListener('click', () => {
    if (!currentGoogleAuthState.available) {
      renderGoogleAuthState(currentGoogleAuthState, 'Google Login is not enabled on this deployment. Guest mode remains available.');
      return;
    }
    window.location.assign(`/api/auth/google/start?returnTo=${encodeURIComponent(profileGoogleReturnTo())}`);
  });
  document.querySelector('#eon-profile-google-logout')?.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: '{}'
      });
      if (!response.ok) throw new Error('logout_failed');
      renderGoogleAuthState({ available: currentGoogleAuthState.available, signedIn: false, rollout: currentGoogleAuthState.rollout }, 'Signed out. Your browser-local EONAPP work remains on this device.');
    } catch {
      renderGoogleAuthState(currentGoogleAuthState, 'Sign-out could not be completed. Close this browser session and try again later.');
    }
  });
  document.querySelector('#eon-profile-delete-account')?.addEventListener('click', async () => {
    const confirmed = window.confirm('Delete the minimal EONAPP cloud account and active sessions now? This does not delete local Chat, Vault, projects, files, Realm setup, City progress, settings, or your encrypted backups from this device.');
    if (!confirmed) return;
    try {
      const response = await fetch('/api/account/delete-request', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE_EON_ACCOUNT' })
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error('delete_failed');
      renderGoogleAuthState({ available: currentGoogleAuthState.available, signedIn: false, rollout: currentGoogleAuthState.rollout }, 'Minimal cloud account metadata and active sessions were deleted. Your browser-local EONAPP work remains on this device.');
    } catch {
      renderGoogleAuthState(currentGoogleAuthState, 'Cloud account deletion could not be completed. No local EONAPP work was changed.');
    }
  });
  document.querySelector('#eon-profile-save')?.addEventListener('click', () => {
    const alias = document.querySelector('#eon-profile-alias-input')?.value || '';
    const profile = updateProfile({ alias });
    renderProfileIdentity('Saved locally in this browser profile.');
    renderAccountFoundation(profile);
  void refreshGoogleAuthState();
    dispatchProfileChange(profile);
  });
  document.querySelector('#eon-profile-remix-avatar')?.addEventListener('click', () => {
    const profile = remixProfileAvatar();
    renderProfileIdentity('A new local avatar was generated.');
    renderAccountFoundation(profile);
    dispatchProfileChange(profile);
  });
  document.querySelectorAll('[data-eon-theme-choice]').forEach((button) => button.addEventListener('click', () => {
    const theme = button.dataset.eonThemeChoice || 'graphite';
    if (!EON_THEME_OPTIONS.includes(theme)) return;
    setEonTheme(theme);
    renderThemeChoice(`${themeLabel(theme)} saved locally.`);
  }));
  document.querySelector('#eon-profile-reminder-toggle')?.addEventListener('change', (event) => {
    const next = setEonbotProactiveEnabled(Boolean(event.currentTarget.checked));
    renderEonbotReminderPreference(next.enabled
      ? 'Optional in-app reminders are enabled. Browser notifications remain off.'
      : 'Optional in-app reminders are disabled.');
  });
  document.querySelector('#eon-profile-measurement-toggle')?.addEventListener('change', (event) => {
    const preference = setLocalMeasurementPreference(Boolean(event.currentTarget.checked));
    if (!preference.enabled) {
      clearTrustTelemetry();
      clearRuntimeErrors();
    }
    renderLocalMeasurementPreference(preference.enabled
      ? 'Redacted local diagnostics are enabled only in this browser profile. Nothing is sent to EONAPP or partners.'
      : 'Local diagnostics are off and retained local diagnostics were cleared. Nothing is sent to EONAPP or partners.');
  });
  document.querySelector('#eon-profile-clear-measurement')?.addEventListener('click', () => {
    clearLocalMeasurementData();
    clearTrustTelemetry();
    clearRuntimeErrors();
    renderLocalMeasurementPreference('Local diagnostics were cleared from this browser profile.');
  });
  document.querySelector('#eon-profile-aggregate-analytics-toggle')?.addEventListener('change', (event) => {
    const result = setAggregateAnalyticsPreference(Boolean(event.currentTarget.checked));
    const status = result?.write?.status || 'unavailable';
    if (!result?.write?.ok) {
      renderAggregateAnalyticsPreference(`Aggregate measurement preference was not saved (${status}). Measurement remains off.`);
      return;
    }
    renderAggregateAnalyticsPreference(result.enabled
      ? 'Aggregate route measurement is enabled for this browser profile on the production site. Only approved logical route IDs are sent.'
      : 'Aggregate route measurement is off for this browser profile.');
  });
  document.querySelector('#eon-profile-eonbot-language')?.addEventListener('change', (event) => {
    const next = setChatLanguagePreference(event.currentTarget.value || 'auto');
    dispatchChatLanguageChange();
    renderEonbotInteractionPreferences(next === 'auto'
      ? 'EONBOT will follow the app language in this browser profile.'
      : `EONBOT reply language is set to ${next.toUpperCase()} in this browser profile.`);
  });
  document.querySelector('#eon-profile-speech-language')?.addEventListener('change', (event) => {
    const next = saveVoiceLanguagePreference(event.currentTarget.value || 'auto');
    const option = getVoiceLanguageOption(next);
    if (next !== 'auto' && option.language && option.language !== 'auto') {
      setChatLanguagePreference(option.language);
      dispatchChatLanguageChange();
    }
    renderEonbotInteractionPreferences(next === 'auto'
      ? 'Speech recognition will follow the chat or device language automatically.'
      : `Speech recognition is set to ${option.label.replace(/^Voice:\s*/i, '')}; EONBOT replies will follow the same language.`);
  });
  document.querySelector('#eon-profile-eonbot-voice-toggle')?.addEventListener('change', (event) => {
    const next = setEonbotInteractionPreferences({ voiceOutputEnabled: Boolean(event.currentTarget.checked) });
    renderEonbotInteractionPreferences(next.voiceOutputEnabled
      ? 'Voice output is enabled locally. Microphone input still needs a separate tap and browser permission.'
      : 'Voice output is off. Typed input and visual replies remain available.');
  });
  document.querySelector('#eon-profile-eonbot-greeting-toggle')?.addEventListener('change', (event) => {
    const next = setEonbotInteractionPreferences({ personalizedGreetingEnabled: Boolean(event.currentTarget.checked) });
    renderEonbotInteractionPreferences(next.personalizedGreetingEnabled
      ? 'EONBOT may use this local profile alias in its next greeting.'
      : 'EONBOT will use a generic greeting instead of this local profile alias.');
  });
  document.querySelector('#eon-profile-eonbot-clear-preferences')?.addEventListener('click', () => {
    clearEonbotInteractionPreferences();
    setChatLanguagePreference('auto');
    saveVoiceLanguagePreference('auto');
    dispatchChatLanguageChange();
    renderEonbotInteractionPreferences('EONBOT voice, greeting, reply-language and speech-language preferences were reset in this browser profile.');
  });
  document.querySelector('#eon-profile-local-ai')?.addEventListener('click', () => {
    try { localStorage.setItem('eon:chat:prefill:v1', 'Help me make Local AI ready on this device. Prefer Local Lite or a verified installed runtime, explain privacy/storage/offline limits, and never switch to a hosted provider automatically.'); } catch {}
    window.location.assign('/local-ai#eonbot-local-ai-setup');
  });
  document.querySelector('#eon-profile-open-share-center')?.addEventListener('click', async () => {
    const status = document.querySelector('#eon-profile-share-status');
    if (status) status.textContent = 'Opening Invite & Share Center…';
    try {
      await openEonShareSheet({ type: 'eonapp' });
      if (status) status.textContent = 'Signed invite links are created locally and do not activate rewards, payouts, scheduling, or public publishing.';
    } catch {
      if (status) status.textContent = 'Invite & Share Center could not open in this browser.';
    }
  });
  document.querySelector('#eon-profile-install-button')?.addEventListener('click', async () => {
    const result = await requestEonPwaInstall({ explicitUserAction: true });
    renderPwaState(getEonPwaState(), result.ok ? 'Install request sent to your browser.' : result.guidance || 'This browser did not offer an install prompt.');
  });
  document.querySelector('#eon-profile-update-button')?.addEventListener('click', async (event) => {
    const action = String(event.currentTarget?.dataset?.eonPwaAction || 'apply');
    if (action === 'reload') {
      const result = reloadEonPwaAfterUpdate({ explicitUserAction: true });
      if (!result.ok) renderPwaState(getEonPwaState(), 'The updated worker is not ready to reload yet.');
      return;
    }
    const result = await applyEonPwaUpdate({ explicitUserAction: true });
    renderPwaState(getEonPwaState(), result.ok ? 'Update accepted. This page will offer a separate reload after the selected release activates.' : 'No verified update is ready in this browser profile.');
  });
  document.querySelector('#eon-profile-recovery-rehearse')?.addEventListener('click', () => {
    const result = recoveryRehearsalController().prepare({ safeLabel: 'Profile recovery rehearsal' }, { explicitUserAction: true });
    renderRecoveryRehearsal(result.snapshot, result.ok
      ? 'Redacted rehearsal prepared locally. It did not read Vault values, create a backup, restore anything, apply an update, or certify recovery.'
      : 'The redacted rehearsal could not be saved in this browser profile.');
  });
  document.querySelector('#eon-profile-recovery-clear')?.addEventListener('click', () => {
    const confirmed = window.confirm('Clear the local redacted recovery rehearsal history? This does not delete backups, Vault records, Chat, projects, or any other EONAPP data.');
    if (!confirmed) return;
    const result = recoveryRehearsalController().clear({ explicitUserAction: true });
    renderRecoveryRehearsal(result.snapshot, result.ok ? 'Redacted rehearsal history was cleared from this browser profile.' : 'The rehearsal history could not be cleared in this browser profile.');
  });
  document.querySelector('#eon-profile-recovery-steps')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-eon-recovery-step]');
    if (!button) return;
    const confirmed = window.confirm('Mark this manual recovery-plan step as reviewed? This does not create a backup, restore data, apply an update, or certify recovery.');
    if (!confirmed) return;
    const result = recoveryRehearsalController().acknowledgeStep(
      button.dataset.eonRecoveryRehearsal || '',
      button.dataset.eonRecoveryStep || '',
      { explicitUserAction: true, explicitUserConfirmation: true }
    );
    renderRecoveryRehearsal(result.snapshot, result.ok ? 'Manual plan step recorded locally. Real PWA update, rollback, and cross-device evidence remain separate gates.' : 'That rehearsal step could not be recorded.');
  });
}

function init() {
  setText('#eon-profile-language', readLanguage());
  setText('#eon-profile-device', getEonPwaState().standalone ? 'Installed app in this browser profile' : 'Browser profile');
  const profile = renderProfileIdentity();
  renderAccountFoundation(profile);
  renderDataContinuity();
  renderThemeChoice();
  renderPwaState();
  renderRecoveryRehearsal(getEonPwaState().recoveryRehearsal);
  renderLocalMeasurementPreference();
  renderAggregateAnalyticsPreference();
  renderEonbotReminderPreference();
  renderEonbotInteractionPreferences();
  bindProfileControls();
  bindPreferenceNavigation();
  window.addEventListener('eon:pwa-state', (event) => renderPwaState(event.detail || getEonPwaState()));
  window.addEventListener('eon:theme-changed', () => renderThemeChoice());
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
