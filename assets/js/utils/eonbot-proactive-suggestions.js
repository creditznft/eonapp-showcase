/**
 * Opt-in, in-app EONBOT reminders.
 * Browser notifications are intentionally out of scope until a real push
 * service, permission UX, delivery receipts and quiet-hours policy exist.
 */

export const EONBOT_PROACTIVE_SETTINGS_KEY = 'eon:eonbot-proactive:v1';
export const EONBOT_PROACTIVE_SCHEMA = 'eonbot.proactive.v1';
const DAY_MS = 24 * 60 * 60 * 1000;

function nowIso(now = Date.now()) {
  return new Date(Number(now) || Date.now()).toISOString();
}

function normalizeSettings(value = {}) {
  const raw = value && typeof value === 'object' ? value : {};
  return {
    schema: EONBOT_PROACTIVE_SCHEMA,
    enabled: raw.enabled === true,
    lastSuggestionAt: String(raw.lastSuggestionAt || ''),
    dismissedIds: Array.isArray(raw.dismissedIds) ? raw.dismissedIds.map((item) => String(item || '')).filter(Boolean).slice(-24) : []
  };
}

export function readEonbotProactiveSettings(storage = globalThis.localStorage) {
  try {
    return normalizeSettings(JSON.parse(storage?.getItem(EONBOT_PROACTIVE_SETTINGS_KEY) || '{}'));
  } catch {
    return normalizeSettings();
  }
}

export function saveEonbotProactiveSettings(next = {}, storage = globalThis.localStorage) {
  const normalized = normalizeSettings(next);
  try { storage?.setItem(EONBOT_PROACTIVE_SETTINGS_KEY, JSON.stringify(normalized)); } catch {}
  return normalized;
}

export function setEonbotProactiveEnabled(enabled, storage = globalThis.localStorage) {
  const current = readEonbotProactiveSettings(storage);
  return saveEonbotProactiveSettings({ ...current, enabled: Boolean(enabled) }, storage);
}

function isWithinDailyCap(value = '', now = Date.now()) {
  const timestamp = Date.parse(String(value || ''));
  return Number.isFinite(timestamp) && (Number(now) - timestamp) < DAY_MS;
}

/**
 * Return one safe, meaningful reminder at most once per 24 hours. It never
 * triggers a browser notification, external request or automatic action.
 */
export function buildEonbotProactiveSuggestion({
  settings = readEonbotProactiveSettings(),
  localRuntimeStatus = null,
  now = Date.now()
} = {}) {
  const normalized = normalizeSettings(settings);
  if (!normalized.enabled || isWithinDailyCap(normalized.lastSuggestionAt, now)) return null;

  const localChecked = Boolean(localRuntimeStatus?.checkedAt);
  const localReady = Boolean(localRuntimeStatus?.ok);
  const id = localReady ? 'workspace-next-step' : localChecked ? 'local-ai-retry' : 'local-ai-check';
  if (normalized.dismissedIds.includes(id)) return null;

  if (localReady) {
    return Object.freeze({
      id,
      label: 'Your tested local AI is ready. Open AI Cockpit when you want focused tools.',
      actionLabel: 'Open AI Cockpit',
      url: '/workspace'
    });
  }
  if (localChecked) {
    return Object.freeze({
      id,
      label: 'Your local AI check is not ready yet. You can review the device result when you choose.',
      actionLabel: 'Review local AI',
      url: '/local-ai#eonbot-local-ai-setup'
    });
  }
  return Object.freeze({
    id,
    label: 'You have not checked local AI on this device. EONBOT can stay in Guide mode until you decide.',
    actionLabel: 'Check this device',
    url: '/local-ai#eonbot-local-ai-setup'
  });
}

export function recordEonbotProactiveSuggestion(_id = '', storage = globalThis.localStorage, now = Date.now()) {
  const current = readEonbotProactiveSettings(storage);
  return saveEonbotProactiveSettings({ ...current, lastSuggestionAt: nowIso(now) }, storage);
}

export function dismissEonbotProactiveSuggestion(id = '', storage = globalThis.localStorage) {
  const current = readEonbotProactiveSettings(storage);
  const safeId = String(id || '').trim();
  const dismissedIds = safeId ? [...new Set([...current.dismissedIds, safeId])].slice(-24) : current.dismissedIds;
  return saveEonbotProactiveSettings({ ...current, dismissedIds }, storage);
}
