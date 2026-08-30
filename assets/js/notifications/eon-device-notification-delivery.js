/** Institutional AI V2 — explicit, privacy-bounded device notification delivery.
 *
 * Browser notification permission is requested only from a visible user action.
 * Local notifications use the canonical service worker. Background Web Push is
 * optional and requires a signed-in server subscription + configured VAPID key.
 */
import { registerEonServiceWorker } from '../utils/eon-service-worker-registration.js';
import { normalizeEonNotificationRoute } from '../../../config/eon-notification-route-authority.mjs';

export const EON_DEVICE_NOTIFICATION_SCHEMA = 'eonapp.device-notification-delivery.ai-v2.v1';
export const EON_DEVICE_NOTIFICATION_SUBSCRIPTION_KEY = 'eon:device-notifications:subscription:v1';
export const EON_RETURN_REMINDER_KEY = 'eon:device-notifications:return-reminder:v1';
const freeze = (value) => Object.freeze(value);
const SECRET_LIKE = /(?:\b(?:api[-_ ]?key|secret|token|password|passphrase|private[-_ ]?key|seed(?:\s+phrase)?|mnemonic|recovery)\b\s*[:=]|\b(?:sk|gsk|AIza|sk-or-v1|sk-ant|csk|tgp_v1|nvapi|cfut|hf|fw|ghp|gho)_[A-Za-z0-9_-]{12,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/i;

function clean(value = '', max = 240) {
  // Sanitization deliberately strips C0 controls from a server-provided error label.
  // eslint-disable-next-line no-control-regex
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function safeRoute(value = '/') { return normalizeEonNotificationRoute(clean(value, 300) || '/'); }

function base64UrlToBytes(value = '') {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = globalThis.atob?.(padded) || '';
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function sameApplicationServerKey(subscription, expectedBytes) {
  try {
    const current = subscription?.options?.applicationServerKey;
    if (!current) return false;
    const bytes = current instanceof Uint8Array ? current : new Uint8Array(current);
    if (bytes.byteLength !== expectedBytes.byteLength) return false;
    for (let index = 0; index < bytes.byteLength; index += 1) if (bytes[index] !== expectedBytes[index]) return false;
    return true;
  } catch { return false; }
}


function readReturnReminder(storage = globalThis.localStorage) {
  try { return JSON.parse(storage?.getItem?.(EON_RETURN_REMINDER_KEY) || 'null'); } catch { return null; }
}
function writeReturnReminder(value, storage = globalThis.localStorage) {
  try { storage?.setItem?.(EON_RETURN_REMINDER_KEY, JSON.stringify(value)); return true; } catch { return false; }
}
function clearReturnReminder(storage = globalThis.localStorage) {
  try { storage?.removeItem?.(EON_RETURN_REMINDER_KEY); return true; } catch { return false; }
}

function readLocalReceipt(storage = globalThis.localStorage) {
  try { return JSON.parse(storage?.getItem?.(EON_DEVICE_NOTIFICATION_SUBSCRIPTION_KEY) || 'null'); } catch { return null; }
}

function writeLocalReceipt(value, storage = globalThis.localStorage) {
  try { storage?.setItem?.(EON_DEVICE_NOTIFICATION_SUBSCRIPTION_KEY, JSON.stringify(value)); return true; } catch { return false; }
}

function clearLocalReceipt(storage = globalThis.localStorage) {
  try { storage?.removeItem?.(EON_DEVICE_NOTIFICATION_SUBSCRIPTION_KEY); return true; } catch { return false; }
}

export function getEonDeviceNotificationCapability({ environment = globalThis } = {}) {
  const notification = environment?.Notification;
  const serviceWorker = environment?.navigator?.serviceWorker;
  const pushManager = environment?.PushManager;
  return freeze({
    schema: EON_DEVICE_NOTIFICATION_SCHEMA,
    secureContext: environment?.isSecureContext === true || /^https:$/i.test(String(environment?.location?.protocol || '')) || /^(?:localhost|127\.0\.0\.1)$/i.test(String(environment?.location?.hostname || '')),
    notificationsApi: typeof notification === 'function' || typeof notification === 'object',
    serviceWorker: Boolean(serviceWorker?.register),
    pushManager: typeof pushManager === 'function' || typeof pushManager === 'object',
    permission: clean(notification?.permission || 'unsupported', 24),
    localDeviceNotificationPossible: Boolean(notification && serviceWorker?.register),
    backgroundPushPossible: Boolean(notification && serviceWorker?.register && pushManager),
    automaticPermissionPrompt: false
  });
}

async function fetchConfig(fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') return freeze({ available: false, reason: 'fetch-unavailable', applicationServerKey: '' });
  try {
    const response = await fetchImpl('/api/notifications/config', { method: 'GET', credentials: 'same-origin', headers: { accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    return freeze({
      available: response.ok && data?.available === true,
      signedInRequired: data?.signedInRequired !== false,
      applicationServerKey: clean(data?.applicationServerKey, 256),
      reason: clean(data?.reason || (response.ok ? '' : 'notification-config-unavailable'), 100)
    });
  } catch { return freeze({ available: false, reason: 'notification-config-unavailable', applicationServerKey: '' }); }
}

export async function requestEonDeviceNotifications({ explicitUserAction = false, environment = globalThis, fetchImpl = globalThis.fetch, storage = globalThis.localStorage } = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', permissionPrompted: false, subscriptionCreated: false });
  const capability = getEonDeviceNotificationCapability({ environment });
  if (!capability.secureContext || !capability.localDeviceNotificationPossible) return freeze({ ok: false, reason: 'device-notifications-unsupported', permissionPrompted: false, subscriptionCreated: false, capability });
  let permission = capability.permission;
  let permissionPrompted = false;
  if (permission !== 'granted') {
    if (permission === 'denied') return freeze({ ok: false, reason: 'notification-permission-denied', permissionPrompted: false, subscriptionCreated: false, capability });
    permissionPrompted = true;
    permission = await environment.Notification.requestPermission();
  }
  if (permission !== 'granted') return freeze({ ok: false, reason: 'notification-permission-not-granted', permissionPrompted, subscriptionCreated: false, capability });

  const registered = await registerEonServiceWorker({ navigatorRef: environment.navigator });
  if (!registered.ok) return freeze({ ok: false, reason: registered.reason, permissionPrompted, subscriptionCreated: false, capability });
  const registration = registered.registration;
  const config = await fetchConfig(fetchImpl);
  if (!config.available || !config.applicationServerKey || !registration?.pushManager) {
    const receipt = { schema: EON_DEVICE_NOTIFICATION_SCHEMA, permission: 'granted', localOnly: true, backgroundPush: false, updatedAt: Date.now() };
    writeLocalReceipt(receipt, storage);
    return freeze({ ok: true, reason: config.reason || 'local-device-notifications-enabled-background-push-unavailable', permissionPrompted, subscriptionCreated: false, localDeviceNotifications: true, backgroundPush: false, receipt });
  }

  try {
    const applicationServerKey = base64UrlToBytes(config.applicationServerKey);
    let subscription = await registration.pushManager.getSubscription();
    let subscriptionCreated = false;
    let replacedStaleApplicationKey = false;
    if (subscription && !sameApplicationServerKey(subscription, applicationServerKey)) {
      await subscription.unsubscribe?.();
      subscription = null;
      replacedStaleApplicationKey = true;
    }
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      subscriptionCreated = true;
    }
    const response = await fetchImpl('/api/notifications/subscription', {
      method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ subscription: subscription.toJSON?.() || subscription, consent: 'service-device-alerts-v1' })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok !== true) throw new Error(clean(data?.error || 'push-subscription-registration-failed', 100));
    const receipt = { schema: EON_DEVICE_NOTIFICATION_SCHEMA, permission: 'granted', localOnly: false, backgroundPush: true, subscriptionId: clean(data.subscriptionId, 120), updatedAt: Date.now() };
    writeLocalReceipt(receipt, storage);
    return freeze({ ok: true, reason: replacedStaleApplicationKey ? 'device-notifications-enabled-vapid-key-refreshed' : 'device-notifications-enabled', permissionPrompted, subscriptionCreated, serverRegistrationUpdated: true, replacedStaleApplicationKey, localDeviceNotifications: true, backgroundPush: true, receipt });
  } catch (error) {
    const receipt = { schema: EON_DEVICE_NOTIFICATION_SCHEMA, permission: 'granted', localOnly: true, backgroundPush: false, updatedAt: Date.now() };
    writeLocalReceipt(receipt, storage);
    return freeze({ ok: true, reason: `local-device-notifications-enabled:${clean(error?.message || 'background-push-unavailable', 100)}`, permissionPrompted, subscriptionCreated: false, localDeviceNotifications: true, backgroundPush: false, receipt });
  }
}

export async function disableEonDeviceNotifications({ explicitUserAction = false, environment = globalThis, fetchImpl = globalThis.fetch, storage = globalThis.localStorage } = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const receipt = readLocalReceipt(storage);
  try {
    const reminder = readReturnReminder(storage);
    if (reminder?.reminderId && typeof fetchImpl === 'function') {
      await fetchImpl('/api/notifications/reminder', { method: 'DELETE', credentials: 'same-origin', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ reminderId: reminder.reminderId }) });
    }
    const registration = await environment?.navigator?.serviceWorker?.ready;
    const subscription = await registration?.pushManager?.getSubscription?.();
    if ((receipt?.subscriptionId || subscription) && typeof fetchImpl === 'function') {
      await fetchImpl('/api/notifications/subscription', {
        method: 'DELETE', credentials: 'same-origin', headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ subscriptionId: receipt?.subscriptionId || '', subscription: subscription?.toJSON?.() || subscription || null })
      });
    }
    await subscription?.unsubscribe?.();
  } catch {}
  clearReturnReminder(storage);
  clearLocalReceipt(storage);
  return freeze({ ok: true, reason: 'device-notifications-disabled', permissionRevokedByBrowser: false });
}


export async function sendEonDeviceNotificationSelfTest({ explicitUserAction = false, fetchImpl = globalThis.fetch, storage = globalThis.localStorage } = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const receipt = readLocalReceipt(storage);
  if (!receipt?.backgroundPush || !receipt?.subscriptionId) return freeze({ ok: false, reason: 'background-push-subscription-required' });
  if (typeof fetchImpl !== 'function') return freeze({ ok: false, reason: 'fetch-unavailable' });
  try {
    const response = await fetchImpl('/api/notifications/self-test', {
      method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ confirm: 'SEND_DEVICE_ALERT_TEST' })
    });
    const data = await response.json().catch(() => ({}));
    return freeze({
      ok: response.ok && data?.ok === true,
      reason: clean(data?.error || (response.ok ? 'push-self-test-requested' : 'push-self-test-failed'), 100),
      accepted: Math.max(0, Number(data?.accepted || 0)),
      failed: Math.max(0, Number(data?.failed || 0)),
      deliveryClaim: clean(data?.deliveryClaim, 64)
    });
  } catch { return freeze({ ok: false, reason: 'push-self-test-unavailable' }); }
}


export async function scheduleEonReturnReminder({ explicitUserAction = false, delayMinutes = 0, route = '/', quietHours = null, fetchImpl = globalThis.fetch, storage = globalThis.localStorage, environment = globalThis } = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const receipt = readLocalReceipt(storage);
  if (!receipt?.backgroundPush || !receipt?.subscriptionId) return freeze({ ok: false, reason: 'background-push-subscription-required' });
  const allowedDelays = new Set([60, 1440, 4320]);
  const delay = Math.floor(Number(delayMinutes || 0));
  if (!allowedDelays.has(delay)) return freeze({ ok: false, reason: 'return-reminder-preset-required' });
  const dueAt = Date.now() + delay * 60 * 1000;
  const quiet = quietHours && typeof quietHours === 'object' ? {
    enabled: quietHours.enabled === true,
    start: clean(quietHours.start || '22:00', 5),
    end: clean(quietHours.end || '08:00', 5)
  } : { enabled: false, start: '22:00', end: '08:00' };
  const DateCtor = typeof environment?.Date === 'function' ? environment.Date : Date;
  const timezoneOffsetMinutes = Math.trunc(Number(new DateCtor().getTimezoneOffset?.() || 0));
  try {
    const response = await fetchImpl('/api/notifications/reminder', {
      method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ dueAt, route: safeRoute(route), consent: 'service-return-reminder-v1', quietHours: quiet, timezoneOffsetMinutes })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok !== true) return freeze({ ok: false, reason: clean(data?.error || 'return-reminder-schedule-failed', 100) });
    const reminder = {
      schema: EON_DEVICE_NOTIFICATION_SCHEMA,
      reminderId: clean(data.reminderId, 120),
      dueAt: Number(data.dueAt || dueAt),
      expiresAt: Number(data.expiresAt || 0),
      route: safeRoute(data.route || route),
      oneTime: true,
      quietHoursEnforced: data.quietHoursEnforced === true
    };
    writeReturnReminder(reminder, storage);
    return freeze({ ok: true, reason: 'return-reminder-scheduled', reminder });
  } catch { return freeze({ ok: false, reason: 'return-reminder-service-unavailable' }); }
}

export async function cancelEonReturnReminder({ explicitUserAction = false, fetchImpl = globalThis.fetch, storage = globalThis.localStorage } = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const reminder = readReturnReminder(storage);
  if (!reminder?.reminderId) return freeze({ ok: true, reason: 'no-return-reminder' });
  try {
    const response = await fetchImpl('/api/notifications/reminder', {
      method: 'DELETE', credentials: 'same-origin', headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ reminderId: reminder.reminderId })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok !== true) return freeze({ ok: false, reason: clean(data?.error || 'return-reminder-cancel-failed', 100) });
  } catch { return freeze({ ok: false, reason: 'return-reminder-service-unavailable' }); }
  clearReturnReminder(storage);
  return freeze({ ok: true, reason: 'return-reminder-cancelled' });
}

export function getEonReturnReminderStatus({ storage = globalThis.localStorage, now = Date.now() } = {}) {
  const reminder = readReturnReminder(storage);
  if (!reminder?.reminderId || !Number.isFinite(Number(reminder?.dueAt))) return freeze({ scheduled: false, reminderId: '', dueAt: 0, route: '/' });
  const expiresAt = Number(reminder.expiresAt || 0);
  if ((expiresAt > 0 && expiresAt <= Number(now)) || Number(reminder.dueAt) < Number(now) - 24 * 60 * 60 * 1000) {
    clearReturnReminder(storage);
    return freeze({ scheduled: false, reminderId: '', dueAt: 0, expiresAt: 0, route: '/' });
  }
  return freeze({ scheduled: true, reminderId: clean(reminder.reminderId, 120), dueAt: Number(reminder.dueAt), expiresAt, route: safeRoute(reminder.route || '/'), quietHoursEnforced: reminder.quietHoursEnforced === true });
}

export async function showEonDeviceNotification(input = {}, { explicitSourceEvent = false, environment = globalThis } = {}) {
  if (explicitSourceEvent !== true) return freeze({ ok: false, reason: 'explicit-source-event-required' });
  const title = clean(input.title, 120); const body = clean(input.body, 280); const route = safeRoute(input.route || '/');
  if (!title || SECRET_LIKE.test(`${title}\n${body}`)) return freeze({ ok: false, reason: 'unsafe-notification-content' });
  if (environment?.Notification?.permission !== 'granted') return freeze({ ok: false, reason: 'notification-permission-not-granted' });
  try {
    const registration = await environment.navigator.serviceWorker.ready;
    await registration.showNotification(title, { body, icon: '/assets/img/icons/icon-192.png', badge: '/assets/img/icons/icon-192.png', tag: clean(input.tag || input.eventId || 'eonapp-activity', 120), renotify: false, data: { url: route, eonSchema: EON_DEVICE_NOTIFICATION_SCHEMA } });
    return freeze({ ok: true, reason: 'device-notification-shown', route });
  } catch { return freeze({ ok: false, reason: 'device-notification-show-failed' }); }
}

export function getEonDeviceNotificationStatus({ environment = globalThis, storage = globalThis.localStorage } = {}) {
  const capability = getEonDeviceNotificationCapability({ environment });
  const receipt = readLocalReceipt(storage);
  return freeze({
    schema: EON_DEVICE_NOTIFICATION_SCHEMA,
    supported: capability.localDeviceNotificationPossible,
    permission: capability.permission,
    enabled: capability.permission === 'granted' && Boolean(receipt),
    backgroundPush: capability.permission === 'granted' && receipt?.backgroundPush === true,
    localDeviceNotifications: capability.permission === 'granted' && Boolean(receipt),
    subscriptionId: clean(receipt?.subscriptionId, 120),
    automaticPermissionPrompt: false,
    marketingConsent: false,
    userCanDisable: true
  });
}
