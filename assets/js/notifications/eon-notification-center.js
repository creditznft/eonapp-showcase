/**
 * W434 — local Activity Center and notification-consent foundation.
 *
 * The Center stores small, redacted in-app activity records in this browser.
 * It never asks browser permission on load, sends marketing, or manufactures an
 * event. Device delivery is an explicit-user-action extension; background Web
 * Push remains proof-gated by deployment configuration and live device evidence.
 */
import { renderEonRetentionConsentNotice } from './eon-retention-consent.js';
import { cancelEonReturnReminder, getEonDeviceNotificationStatus, getEonReturnReminderStatus, requestEonDeviceNotifications, disableEonDeviceNotifications, scheduleEonReturnReminder, sendEonDeviceNotificationSelfTest } from './eon-device-notification-delivery.js';

export const EON_NOTIFICATION_CENTER_SCHEMA = 'eonapp.notification-center.w434.v1';
export const EON_NOTIFICATION_CENTER_STORAGE_KEY = 'eon:notification-center:v1';
export const EON_NOTIFICATION_CENTER_MAX_ITEMS = 80;

export const EON_NOTIFICATION_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'eonbot-reply', label: 'EONBOT replies', source: 'eonbot' }),
  Object.freeze({ id: 'approval-needed', label: 'Approvals needed', source: 'approval' }),
  Object.freeze({ id: 'project-completion', label: 'Project completion', source: 'project' }),
  Object.freeze({ id: 'sync-data', label: 'Sync and data care', source: 'sync' }),
  Object.freeze({ id: 'city-activity', label: 'EON City activity', source: 'city' }),
  Object.freeze({ id: 'collaboration', label: 'Collaboration', source: 'collaboration' })
]);

const CATEGORY_MAP = new Map(EON_NOTIFICATION_CATEGORIES.map((category) => [category.id, category]));
const EVENT_ID_RE = /^[a-z][a-z0-9:_-]{2,180}$/i;
const INTERNAL_ROUTE_RE = /^\/(?!\/)[a-z0-9._~!$&'()*+,;=:@/%?-]*$/i;
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const SENSITIVE_TEXT = /(sk-[a-z0-9_-]{18,}|AIza[\w-]{20,}|gsk_[a-z0-9_-]{16,}|sk-ant-[a-z0-9_-]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:seed|recovery|mnemonic)\s+phrase\b|\b(?:password|api\s*key|access\s*token|session\s*cookie)\b)/i;
const freeze = (value) => Object.freeze(value);

function deepClone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function safeText(value, max) {
  const visible = Array.from(String(value || '')).map((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 ? ' ' : character;
  }).join('');
  return visible.replace(/\s+/g, ' ').trim().slice(0, max);
}

function safeNow(now) {
  const value = Number(now);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : Date.now();
}

function defaultPreferences() {
  return {
    categories: Object.fromEntries(EON_NOTIFICATION_CATEGORIES.map((category) => [category.id, true])),
    quietHours: { enabled: false, start: '22:00', end: '08:00' }
  };
}

function defaultState(now = Date.now()) {
  return {
    schema: EON_NOTIFICATION_CENTER_SCHEMA,
    version: 1,
    updatedAt: safeNow(now),
    preferences: defaultPreferences(),
    items: []
  };
}

function readStorage(storage) {
  try { return storage?.getItem?.(EON_NOTIFICATION_CENTER_STORAGE_KEY) || null; } catch { return null; }
}

function writeStorage(storage, value) {
  try { storage?.setItem?.(EON_NOTIFICATION_CENTER_STORAGE_KEY, JSON.stringify(value)); return true; } catch { return false; }
}

function normalizeQuietHours(value = {}) {
  const enabled = value?.enabled === true;
  const start = TIME_RE.test(String(value?.start || '')) ? String(value.start) : '22:00';
  const end = TIME_RE.test(String(value?.end || '')) ? String(value.end) : '08:00';
  return freeze({ enabled, start, end });
}

function normalizePreferences(value = {}) {
  const fallback = defaultPreferences();
  const categories = {};
  for (const category of EON_NOTIFICATION_CATEGORIES) categories[category.id] = value?.categories?.[category.id] !== false;
  return freeze({ categories: freeze(categories), quietHours: normalizeQuietHours(value?.quietHours || fallback.quietHours) });
}

function normalizeItem(value = {}) {
  const category = CATEGORY_MAP.get(String(value?.category || ''));
  const eventId = String(value?.eventId || '');
  const title = safeText(value?.title, 140);
  const body = safeText(value?.body, 320);
  if (!category || !EVENT_ID_RE.test(eventId) || !title || SENSITIVE_TEXT.test(`${title}\n${body}`)) return null;
  const route = INTERNAL_ROUTE_RE.test(String(value?.route || '')) ? String(value.route) : '';
  const createdAt = safeNow(value?.createdAt);
  return freeze({
    id: String(value?.id || `activity_${eventId}`).slice(0, 230),
    eventId,
    category: category.id,
    title,
    body,
    route,
    createdAt,
    read: value?.read === true,
    delivery: 'in-app-center-only'
  });
}

function normalizeState(value = null, now = Date.now()) {
  const base = defaultState(now);
  if (!value || typeof value !== 'object' || value.schema !== EON_NOTIFICATION_CENTER_SCHEMA) return freeze(base);
  const dedupe = new Set();
  const items = [];
  for (const candidate of Array.isArray(value.items) ? value.items : []) {
    const item = normalizeItem(candidate);
    if (!item || dedupe.has(item.eventId)) continue;
    dedupe.add(item.eventId);
    items.push(item);
  }
  items.sort((left, right) => right.createdAt - left.createdAt);
  return freeze({
    schema: EON_NOTIFICATION_CENTER_SCHEMA,
    version: 1,
    updatedAt: safeNow(value.updatedAt || now),
    preferences: normalizePreferences(value.preferences),
    items: freeze(items.slice(0, EON_NOTIFICATION_CENTER_MAX_ITEMS))
  });
}

function readState(storage, now) {
  try { return normalizeState(JSON.parse(readStorage(storage) || 'null'), now); } catch { return normalizeState(null, now); }
}

function minuteOfDay(text) {
  const [hour, minute] = String(text || '').split(':').map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute) ? (hour * 60) + minute : 0;
}

export function isEonNotificationQuietHour(preferences = {}, at = new Date()) {
  const quietHours = normalizeQuietHours(preferences?.quietHours || preferences);
  if (!quietHours.enabled) return false;
  const start = minuteOfDay(quietHours.start);
  const end = minuteOfDay(quietHours.end);
  const current = (at.getHours() * 60) + at.getMinutes();
  if (start === end) return true;
  return start < end ? current >= start && current < end : current >= start || current < end;
}

function createId(eventId, createdAt) {
  const suffix = `${eventId}:${createdAt}`.replace(/[^a-z0-9]/gi, '').slice(-24) || 'activity';
  return `activity_${suffix}`;
}

function emitChange(target, detail) {
  try {
    if (target?.dispatchEvent && typeof globalThis.CustomEvent === 'function') target.dispatchEvent(new CustomEvent('eon:notification-center-changed', { detail }));
  } catch {}
}

/**
 * Create a local Activity Center controller. It is intentionally injected with
 * storage so source tests can prove behavior without browser permissions.
 */
export function createEonNotificationCenter({ storage = globalThis.localStorage, now = () => Date.now(), eventTarget = globalThis } = {}) {
  const nowValue = () => safeNow(now());
  const snapshot = () => {
    const state = readState(storage, nowValue());
    const unreadCount = state.items.filter((item) => !item.read).length;
    return freeze({
      ...state,
      unreadCount,
      deviceDelivery: getEonDeviceNotificationStatus({ storage }),
      returnReminder: getEonReturnReminderStatus({ storage, now: nowValue() }),
      quietHoursActive: isEonNotificationQuietHour(state.preferences, new Date(nowValue())),
      storage: 'local-browser-only',
      networkRequestCreated: false,
      automaticPermissionPrompt: false,
      remotePushSubscription: getEonDeviceNotificationStatus({ storage }).backgroundPush,
      crossDeviceDedupe: false,
      liveDeliveryProof: false
    });
  };
  const save = (state) => {
    const normalized = normalizeState(state, nowValue());
    const stored = writeStorage(storage, normalized);
    const next = snapshot();
    emitChange(eventTarget, freeze({ unreadCount: next.unreadCount, itemCount: next.items.length }));
    return freeze({ ok: stored, snapshot: next, browserStorageChanged: stored, networkRequestCreated: false, automaticPermissionPrompt: false });
  };

  return freeze({
    getSnapshot: snapshot,
    recordActivity({ eventId = '', category = '', title = '', body = '', route = '' } = {}, { explicitSourceEvent = false } = {}) {
      if (explicitSourceEvent !== true) return freeze({ ok: false, error: 'explicit-source-event-required', browserStorageChanged: false, networkRequestCreated: false });
      if (!EVENT_ID_RE.test(String(eventId || ''))) return freeze({ ok: false, error: 'event-id-required', browserStorageChanged: false, networkRequestCreated: false });
      if (!CATEGORY_MAP.has(String(category || ''))) return freeze({ ok: false, error: 'notification-category-invalid', browserStorageChanged: false, networkRequestCreated: false });
      const cleanTitle = safeText(title, 140);
      const cleanBody = safeText(body, 320);
      if (!cleanTitle) return freeze({ ok: false, error: 'notification-title-required', browserStorageChanged: false, networkRequestCreated: false });
      if (SENSITIVE_TEXT.test(`${cleanTitle}\n${cleanBody}`)) return freeze({ ok: false, error: 'sensitive-activity-text-blocked', browserStorageChanged: false, networkRequestCreated: false });
      if (route && !INTERNAL_ROUTE_RE.test(String(route))) return freeze({ ok: false, error: 'internal-route-required', browserStorageChanged: false, networkRequestCreated: false });
      const state = readState(storage, nowValue());
      if (state.preferences.categories[String(category)] === false) {
        return freeze({ ok: true, suppressed: true, reason: 'category-disabled-by-user', item: null, browserStorageChanged: false, networkRequestCreated: false, snapshot: snapshot() });
      }
      const existing = state.items.find((item) => item.eventId === String(eventId));
      if (existing) return freeze({ ok: true, deduped: true, item: existing, browserStorageChanged: false, networkRequestCreated: false, snapshot: snapshot() });
      const item = normalizeItem({ id: createId(eventId, nowValue()), eventId, category, title: cleanTitle, body: cleanBody, route, createdAt: nowValue(), read: false });
      const next = { ...state, updatedAt: nowValue(), items: [item, ...state.items].slice(0, EON_NOTIFICATION_CENTER_MAX_ITEMS) };
      const result = save(next);
      return freeze({ ...result, ok: result.ok, deduped: false, item, delivery: 'in-app-center-only' });
    },
    markRead(itemId = '', { explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, networkRequestCreated: false });
      const state = readState(storage, nowValue());
      const item = state.items.find((entry) => entry.id === String(itemId));
      if (!item) return freeze({ ok: false, error: 'activity-item-not-found', browserStorageChanged: false, networkRequestCreated: false });
      const next = { ...state, updatedAt: nowValue(), items: state.items.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry) };
      return save(next);
    },
    markAllRead({ explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, networkRequestCreated: false });
      const state = readState(storage, nowValue());
      return save({ ...state, updatedAt: nowValue(), items: state.items.map((item) => ({ ...item, read: true })) });
    },
    updatePreferences(nextPreferences = {}, { explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, networkRequestCreated: false });
      const state = readState(storage, nowValue());
      const next = { ...state, updatedAt: nowValue(), preferences: normalizePreferences({ ...state.preferences, ...deepClone(nextPreferences), categories: { ...state.preferences.categories, ...(nextPreferences?.categories || {}) }, quietHours: { ...state.preferences.quietHours, ...(nextPreferences?.quietHours || {}) } }) };
      return save(next);
    },
    async requestDeviceDelivery({ explicitUserAction = false } = {}) {
      const result = await requestEonDeviceNotifications({ explicitUserAction });
      return freeze({ ...result, browserPermissionPrompted: result.permissionPrompted === true, networkRequestCreated: result.serverRegistrationUpdated === true, pushSubscriptionCreated: result.subscriptionCreated === true, deviceDelivery: snapshot().deviceDelivery });
    },
    async disableDeviceDelivery({ explicitUserAction = false } = {}) {
      const result = await disableEonDeviceNotifications({ explicitUserAction });
      return freeze({ ...result, deviceDelivery: snapshot().deviceDelivery });
    },
    async testDeviceDelivery({ explicitUserAction = false } = {}) {
      return sendEonDeviceNotificationSelfTest({ explicitUserAction });
    },
    async scheduleReturnReminder({ explicitUserAction = false, delayMinutes = 0, route = '/' } = {}) {
      return scheduleEonReturnReminder({ explicitUserAction, delayMinutes, route, quietHours: snapshot().preferences.quietHours, storage });
    },
    async cancelReturnReminder({ explicitUserAction = false } = {}) {
      return cancelEonReturnReminder({ explicitUserAction, storage });
    }
  });
}

const browserCenter = () => createEonNotificationCenter();

export function getEonNotificationCenterSnapshot() { return browserCenter().getSnapshot(); }
export function recordEonNotificationActivity(event, options) { return browserCenter().recordActivity(event, options); }
export function markEonNotificationRead(itemId, options) { return browserCenter().markRead(itemId, options); }
export function markAllEonNotificationRead(options) { return browserCenter().markAllRead(options); }
export function updateEonNotificationPreferences(preferences, options) { return browserCenter().updatePreferences(preferences, options); }
export function requestEonDeviceNotificationDelivery(options) { return browserCenter().requestDeviceDelivery(options); }
export function disableEonDeviceNotificationDelivery(options) { return browserCenter().disableDeviceDelivery(options); }
export function testEonDeviceNotificationDelivery(options) { return browserCenter().testDeviceDelivery(options); }
export function scheduleEonNotificationReturnReminder(options) { return browserCenter().scheduleReturnReminder(options); }
export function cancelEonNotificationReturnReminder(options) { return browserCenter().cancelReturnReminder(options); }

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function dateLabel(timestamp) {
  try { return new Date(timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); } catch { return ''; }
}

/** Rendered only inside the shell Settings modal; it never requests permission. */
export function renderEonNotificationCenterMarkup(snapshot = getEonNotificationCenterSnapshot()) {
  const items = Array.isArray(snapshot?.items) ? snapshot.items : [];
  const categoryControls = EON_NOTIFICATION_CATEGORIES.map((category) => `<label class="eon-shell-notification-preference"><input type="checkbox" data-eon-notification-category="${category.id}" ${snapshot?.preferences?.categories?.[category.id] !== false ? 'checked' : ''} /> <span>${escapeHtml(category.label)}</span></label>`).join('');
  const canScheduleItemReminder = snapshot?.deviceDelivery?.backgroundPush === true && snapshot?.returnReminder?.scheduled !== true;
  const list = items.length
    ? items.slice(0, 12).map((item) => `<article class="eon-shell-notification-item${item.read ? '' : ' is-unread'}"><div><p class="eon-shell-notification-item-kicker">${escapeHtml(CATEGORY_MAP.get(item.category)?.label || item.category)} · ${escapeHtml(dateLabel(item.createdAt))}</p><strong>${escapeHtml(item.title)}</strong>${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}${item.route ? `<a href="${escapeHtml(item.route)}">Open related workspace</a>${canScheduleItemReminder ? `<button type="button" data-eon-notification-item-reminder="1440" data-eon-notification-reminder-route="${escapeHtml(item.route)}">Remind me tomorrow</button>` : ''}` : ''}</div>${item.read ? '' : `<button type="button" data-eon-notification-mark-read="${escapeHtml(item.id)}">Mark read</button>`}</article>`).join('')
    : '<p class="eon-shell-modal-note">No real local activity has been recorded yet. This Center never creates reward, marketing, or fake agent events.</p>';
  return `<div class="eon-shell-notification-center"><p>Activity Center keeps small, redacted updates locally. Device alerts are optional and permission is requested only after you press Enable.</p>${renderEonRetentionConsentNotice()}<div class="eon-shell-notification-summary"><strong>${Number(snapshot?.unreadCount || 0)} unread</strong><button type="button" data-eon-notification-mark-all ${items.length ? '' : 'disabled'}>Mark all read</button></div><section class="eon-shell-notification-device"><strong>Device alerts</strong><p>${snapshot?.deviceDelivery?.enabled ? (snapshot.deviceDelivery.backgroundPush ? 'Enabled with background Web Push subscription on this device.' : 'Enabled for local device alerts; background Web Push is not configured for this deployment.') : 'Off. EONAPP will not ask permission automatically.'}</p><div><button type="button" data-eon-notification-enable-device>${snapshot?.deviceDelivery?.enabled ? 'Refresh device alerts' : 'Enable device alerts'}</button>${snapshot?.deviceDelivery?.backgroundPush ? '<button type="button" data-eon-notification-test-device>Send test</button>' : ''}${snapshot?.deviceDelivery?.enabled ? '<button type="button" data-eon-notification-disable-device>Disable</button>' : ''}</div><p class="eon-shell-modal-note" data-eon-notification-device-status></p>${snapshot?.deviceDelivery?.backgroundPush ? `<div class="eon-shell-notification-reminders"><strong>One-time return reminder</strong><p>${snapshot?.returnReminder?.scheduled ? `Scheduled for ${escapeHtml(dateLabel(snapshot.returnReminder.dueAt))}.` : 'Off. Nothing is scheduled automatically.'}</p><div>${snapshot?.returnReminder?.scheduled ? '<button type="button" data-eon-notification-cancel-reminder>Cancel reminder</button>' : '<button type="button" data-eon-notification-reminder="60">In 1 hour</button><button type="button" data-eon-notification-reminder="1440">Tomorrow</button><button type="button" data-eon-notification-reminder="4320">In 3 days</button>'}</div></div>` : ''}</section><fieldset class="eon-shell-notification-preferences"><legend>Show in Activity Center</legend>${categoryControls}</fieldset><fieldset class="eon-shell-notification-quiet"><legend>Quiet hours for device alerts</legend><label><input type="checkbox" data-eon-notification-quiet-enabled ${snapshot?.preferences?.quietHours?.enabled ? 'checked' : ''} /> Save quiet-hours preference</label><div><label>From <input type="time" data-eon-notification-quiet-start value="${escapeHtml(snapshot?.preferences?.quietHours?.start || '22:00')}" /></label><label>To <input type="time" data-eon-notification-quiet-end value="${escapeHtml(snapshot?.preferences?.quietHours?.end || '08:00')}" /></label></div><p class="eon-shell-modal-note">Quiet hours suppress client-originated device alerts and defer one-time Web Push reminders until quiet hours end. New return reminders are capped at 3 per UTC day, expire 24 hours after their due time, and are never scheduled automatically for promotion.</p></fieldset><section class="eon-shell-notification-list" aria-label="Recent activity">${list}</section></div>`;
}

export function getEonNotificationCenterTruth() {
  return freeze({
    schema: EON_NOTIFICATION_CENTER_SCHEMA,
    status: 'activity-center-plus-opt-in-device-alerts-source-ready',
    inAppCenter: true,
    localBrowserStorage: true,
    browserPermissionPromptOnLoad: false,
    browserPermissionPromptedByModule: false,
    remotePushSubscription: 'optional-when-server-vapid-configured',
    serverDelivery: 'source-ready-subscription-path; sender-proof-required',
    deviceNotificationDelivery: true,
    crossDeviceDedupe: false,
    categoryPreferencesEnforced: true,
    quietHoursPreferenceOnly: false,
    clientDeviceQuietHoursEnforced: true,
    serverReturnReminderQuietHoursEnforced: true,
    returnReminderFreshScheduleCapPerUtcDay: 3,
    returnReminderExpiryHoursAfterDue: 24,
    itemScopedReturnReminder: true,
    oneActiveReturnReminderPerAccount: true,
    rewardsOrMarketingEvents: false,
    fabricatedAgentEvents: false,
    liveDeliveryProof: false
  });
}
