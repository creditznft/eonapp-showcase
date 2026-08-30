/** RT92 — privacy-bounded one-time return-reminder delivery policy. */
import { normalizeEonNotificationRoute } from '../../config/eon-notification-route-authority.mjs';

export const EON_RETURN_REMINDER_MAX_NEW_PER_UTC_DAY = 3;
export const EON_RETURN_REMINDER_EXPIRY_AFTER_DUE_MS = 24 * 60 * 60 * 1000;
export const EON_RETURN_REMINDER_POLICY_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function timeToMinute(value = '', fallback = 0) {
  const text = String(value || '');
  if (!TIME_RE.test(text)) return fallback;
  const [hours, minutes] = text.split(':').map(Number);
  return hours * 60 + minutes;
}

export function normalizeReminderQuietHours(value = {}) {
  const offset = Math.trunc(Number(value?.timezoneOffsetMinutes ?? 0));
  return Object.freeze({
    enabled: value?.enabled === true,
    startMinute: timeToMinute(value?.start, 22 * 60),
    endMinute: timeToMinute(value?.end, 8 * 60),
    timezoneOffsetMinutes: Number.isInteger(offset) && offset >= -840 && offset <= 840 ? offset : 0
  });
}

export function reminderRoutePathOnly(value = '/') {
  const route = normalizeEonNotificationRoute(String(value || '/') || '/');
  try { return new URL(route, 'https://eonapp.invalid').pathname || '/'; } catch { return '/'; }
}

export function attributedReminderRoute(value = '/') {
  const url = new URL(reminderRoutePathOnly(value), 'https://eonapp.invalid');
  url.searchParams.set('utm_source', 'eon-service-reminder');
  url.searchParams.set('utm_medium', 'push');
  url.searchParams.set('utm_campaign', 'return-reminder');
  return `${url.pathname}${url.search}`;
}

export function reminderLocalMinute(now = Date.now(), timezoneOffsetMinutes = 0) {
  const utcMinute = Math.floor(Number(now) / 60000);
  const localMinute = ((utcMinute - Number(timezoneOffsetMinutes || 0)) % 1440 + 1440) % 1440;
  return localMinute;
}

export function isReminderQuietAt(reminder = {}, now = Date.now()) {
  if (Number(reminder?.quiet_hours_enabled || 0) !== 1) return false;
  const start = Number(reminder?.quiet_start_minute ?? 1320);
  const end = Number(reminder?.quiet_end_minute ?? 480);
  const minute = reminderLocalMinute(now, reminder?.timezone_offset_minutes || 0);
  if (start === end) return true;
  return start < end ? minute >= start && minute < end : minute >= start || minute < end;
}

export function nextReminderQuietEndAt(reminder = {}, now = Date.now()) {
  if (!isReminderQuietAt(reminder, now)) return Number(now);
  const end = Number(reminder?.quiet_end_minute ?? 480);
  const current = reminderLocalMinute(now, reminder?.timezone_offset_minutes || 0);
  let deltaMinutes = (end - current + 1440) % 1440;
  if (deltaMinutes === 0) deltaMinutes = 1440;
  return Number(now) + deltaMinutes * 60 * 1000;
}

export function utcDayStartedAt(now = Date.now()) {
  const date = new Date(Number(now));
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
