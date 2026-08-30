/**
 * W434 compatibility facade for a retired early push helper.
 *
 * This file intentionally no longer subscribes Web Push, exposes a Web Push application key,
 * auto-wires a permission button, or requests browser permission on load.
 * Existing legacy callers are routed through the current Activity Center and,
 * only after explicit opt-in, local device alerts. Background delivery remains
 * deployment/live-proof gated by the institutional Web Push path.
 */
import { disableEonDeviceNotificationDelivery, getEonNotificationCenterSnapshot, recordEonNotificationActivity, requestEonDeviceNotificationDelivery } from '../notifications/eon-notification-center.js';
import { getEonDeviceNotificationStatus, showEonDeviceNotification } from '../notifications/eon-device-notification-delivery.js';

async function record(category, eventId, title, body, route = '') {
  return recordEonNotificationActivity({ eventId, category, title, body, route }, { explicitSourceEvent: true });
}

export async function requestSubscription() {
  return requestEonDeviceNotificationDelivery({ explicitUserAction: true });
}

export async function unsubscribe() { return disableEonDeviceNotificationDelivery({ explicitUserAction: true }); }

export async function isSubscribed() { return getEonDeviceNotificationStatus().enabled === true; }

export async function sendLocalNotification(title = 'EONAPP activity', options = {}) {
  const eventId = String(options?.eventId || 'city-activity:legacy-local');
  const activity = await record('city-activity', eventId, title, String(options?.body || ''), String(options?.route || '/eoncity'));
  const snapshot = getEonNotificationCenterSnapshot();
  const mayAlertDevice = activity?.suppressed !== true
    && snapshot?.preferences?.categories?.['city-activity'] !== false
    && snapshot?.quietHoursActive !== true
    && snapshot?.deviceDelivery?.enabled === true;
  const device = mayAlertDevice
    ? await showEonDeviceNotification({ eventId, title, body: String(options?.body || ''), route: String(options?.route || '/eoncity') }, { explicitSourceEvent: true })
    : { ok: false, reason: snapshot?.quietHoursActive ? 'quiet-hours-active' : activity?.suppressed ? 'category-disabled-by-user' : 'device-alerts-disabled' };
  return Boolean(activity?.ok || device.ok);
}

export async function initNotifButton() { return { ok: true, automaticPermissionPrompt: false, status: getEonDeviceNotificationStatus() }; }

export async function getNotificationSummary() {
  const snapshot = getEonNotificationCenterSnapshot();
  const device = getEonDeviceNotificationStatus();
  return {
    supported: device.supported,
    permission: device.permission,
    subscribed: device.enabled,
    confirmedLocal: device.localDeviceNotifications,
    backgroundPush: device.backgroundPush,
    unreadCount: snapshot.unreadCount,
    delivery: device.backgroundPush ? 'activity-center-plus-web-push' : device.enabled ? 'activity-center-plus-local-device-alerts' : 'in-app-center-only',
    reason: device.enabled ? '' : 'explicit-opt-in-required'
  };
}

export async function notifyMissionCompleted(title = 'Mission complete', body = 'A real local mission receipt is ready for review.') {
  return Boolean((await record('project-completion', 'project-completion:legacy-mission', title, body, '/projects'))?.ok);
}

export async function notifyApprovalRequired(title = 'Approval required', body = 'A real local action needs your review.') {
  return Boolean((await record('approval-needed', 'approval-needed:legacy-action', title, body, '/'))?.ok);
}

export async function notifyBackupReminder(title = 'Backup reminder', body = 'Review the Vault backup controls on this device.') {
  return Boolean((await record('sync-data', 'sync-data:legacy-backup', title, body, '/capsule'))?.ok);
}

if (typeof window !== 'undefined') {
  window.EONPush = { requestSubscription, unsubscribe, isSubscribed, sendLocalNotification, initNotifButton, getNotificationSummary, notifyMissionCompleted, notifyApprovalRequired, notifyBackupReminder };
}
