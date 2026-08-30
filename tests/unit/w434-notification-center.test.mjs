import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_NOTIFICATION_CENTER_STORAGE_KEY,
  createEonNotificationCenter,
  getEonNotificationCenterTruth,
  isEonNotificationQuietHour,
  renderEonNotificationCenterMarkup
} from '../../assets/js/notifications/eon-notification-center.js';
import { inspectW434NotificationCenter } from '../../scripts/w434-notification-center-gate.mjs';

class MemoryStorage {
  constructor(seed = {}) { this.store = new Map(Object.entries(seed)); }
  getItem(key) { return this.store.has(key) ? this.store.get(key) : null; }
  setItem(key, value) { this.store.set(key, String(value)); }
}

function fixedCenter(storage = new MemoryStorage()) {
  return createEonNotificationCenter({ storage, now: () => Date.parse('2026-06-29T09:30:00.000Z'), eventTarget: null });
}

test('W434 records only explicit real local events, dedupes them, and blocks sensitive details', () => {
  const storage = new MemoryStorage();
  const center = fixedCenter(storage);
  assert.equal(center.recordActivity({ eventId: 'city:arrival', category: 'city-activity', title: 'Arrived in Command District' }).error, 'explicit-source-event-required');
  const created = center.recordActivity({ eventId: 'city:arrival', category: 'city-activity', title: 'Arrived in Command District', body: 'Your City session is ready.', route: '/eoncity' }, { explicitSourceEvent: true });
  assert.equal(created.ok, true);
  assert.equal(created.delivery, 'in-app-center-only');
  assert.equal(created.networkRequestCreated, false);
  assert.equal(created.snapshot.unreadCount, 1);
  const duplicate = center.recordActivity({ eventId: 'city:arrival', category: 'city-activity', title: 'Arrived in Command District' }, { explicitSourceEvent: true });
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.deduped, true);
  assert.equal(center.getSnapshot().items.length, 1);
  const blocked = center.recordActivity({ eventId: 'city:unsafe', category: 'city-activity', title: 'api key redaction sentinel' }, { explicitSourceEvent: true });
  assert.equal(blocked.error, 'sensitive-activity-text-blocked');
  assert.ok(storage.getItem(EON_NOTIFICATION_CENTER_STORAGE_KEY));
});

test('W434 requires user action for read state and stored category/quiet-hour preferences', () => {
  const center = fixedCenter();
  const created = center.recordActivity({ eventId: 'project:complete', category: 'project-completion', title: 'Project draft completed' }, { explicitSourceEvent: true });
  assert.equal(center.markRead(created.item.id).error, 'explicit-user-action-required');
  assert.equal(center.markRead(created.item.id, { explicitUserAction: true }).ok, true);
  assert.equal(center.getSnapshot().unreadCount, 0);
  assert.equal(center.updatePreferences({ categories: { 'city-activity': false }, quietHours: { enabled: true, start: '22:00', end: '08:00' } }, { explicitUserAction: true }).ok, true);
  const snapshot = center.getSnapshot();
  assert.equal(snapshot.preferences.categories['city-activity'], false);
  assert.equal(snapshot.preferences.quietHours.enabled, true);
  assert.equal(isEonNotificationQuietHour(snapshot.preferences, new Date('2026-06-29T23:00:00')), true);
  assert.equal(isEonNotificationQuietHour(snapshot.preferences, new Date('2026-06-29T12:00:00')), false);
});

test('W434 category visibility preferences are enforced rather than stored as cosmetic switches', () => {
  const center = fixedCenter();
  assert.equal(center.updatePreferences({ categories: { 'city-activity': false } }, { explicitUserAction: true }).ok, true);
  const suppressed = center.recordActivity({ eventId: 'city:suppressed', category: 'city-activity', title: 'Should stay hidden', route: '/eoncity' }, { explicitSourceEvent: true });
  assert.equal(suppressed.ok, true);
  assert.equal(suppressed.suppressed, true);
  assert.equal(suppressed.reason, 'category-disabled-by-user');
  assert.equal(center.getSnapshot().items.length, 0);
  const allowed = center.recordActivity({ eventId: 'project:visible', category: 'project-completion', title: 'Visible project result', route: '/projects' }, { explicitSourceEvent: true });
  assert.equal(allowed.ok, true);
  assert.equal(allowed.suppressed, undefined);
  assert.equal(center.getSnapshot().items.length, 1);
});

test('W434 continuity keeps device delivery explicit and unsupported environments fail closed', async () => {
  const center = fixedCenter();
  const denied = await center.requestDeviceDelivery({ explicitUserAction: true });
  assert.equal(denied.ok, false);
  assert.equal(denied.reason, 'device-notifications-unsupported');
  assert.equal(denied.browserPermissionPrompted, false);
  const markup = renderEonNotificationCenterMarkup(center.getSnapshot());
  assert.match(markup, /will not ask permission automatically/i);
  assert.match(markup, /Enable device alerts/i);
});

test('W434 static gate preserves historical truth while AI V2 delivery remains live-proof gated', () => {
  const gate = inspectW434NotificationCenter();
  const truth = getEonNotificationCenterTruth();
  assert.equal(gate.status, 'pass');
  assert.ok(gate.checkCount >= 10);
  assert.equal(truth.deviceNotificationDelivery, true);
  assert.equal(truth.remotePushSubscription, 'optional-when-server-vapid-configured');
  assert.equal(truth.browserPermissionPromptOnLoad, false);
  assert.equal(truth.liveDeliveryProof, false);
});
