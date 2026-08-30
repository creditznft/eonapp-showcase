import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { applyIdentityMigrations } from '../helpers/eon-d1-test-migrations.mjs';
import {
  EON_RETURN_REMINDER_MAX_NEW_PER_UTC_DAY,
  attributedReminderRoute,
  isReminderQuietAt,
  nextReminderQuietEndAt,
  normalizeReminderQuietHours,
  reminderRoutePathOnly,
  utcDayStartedAt
} from '../../functions/_shared/eon-notification-reminder-policy.js';
import { getEonRetentionNotificationScaleTruth } from '../../workers/eon-retention-notifications/src/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => readFileSync(path.join(root, file), 'utf8');

test('RT92 identity v6 installs return-reminder policy without content storage', () => {
  const db = new DatabaseSync(':memory:');
  applyIdentityMigrations(db);
  const authority = db.prepare("SELECT schema_version, migration_name FROM eon_schema_authority WHERE domain='identity'").get();
  assert.equal(authority.schema_version, 6);
  assert.equal(authority.migration_name, '0006_notification_policy_authority.sql');
  const columns = new Set(db.prepare('PRAGMA table_info(eon_push_reminders)').all().map((row) => row.name));
  for (const name of ['quiet_hours_enabled', 'quiet_start_minute', 'quiet_end_minute', 'timezone_offset_minutes', 'expires_at']) assert.equal(columns.has(name), true, name);
  const policySql = read('identity/migrations/0006_notification_policy_authority.sql');
  assert.match(policySql, /scheduled_count INTEGER NOT NULL DEFAULT 0 CHECK \(scheduled_count BETWEEN 0 AND 3\)/);
  const reminderColumns = [...columns].join(' ');
  assert.doesNotMatch(reminderColumns, /prompt|notification_body|project_name|raw_click/i);
});

test('RT92 reminder quiet-hours math handles overnight local windows', () => {
  const quiet = normalizeReminderQuietHours({ enabled: true, start: '22:00', end: '08:00', timezoneOffsetMinutes: -330 });
  assert.deepEqual(quiet, { enabled: true, startMinute: 1320, endMinute: 480, timezoneOffsetMinutes: -330 });
  const reminder = { quiet_hours_enabled: 1, quiet_start_minute: 1320, quiet_end_minute: 480, timezone_offset_minutes: -330 };
  // 17:30 UTC = 23:00 IST, inside quiet hours.
  const now = Date.parse('2026-08-17T17:30:00Z');
  assert.equal(isReminderQuietAt(reminder, now), true);
  assert.equal(nextReminderQuietEndAt(reminder, now), Date.parse('2026-08-18T02:30:00Z'));
  assert.equal(utcDayStartedAt(now), Date.parse('2026-08-17T00:00:00Z'));
});

test('RT92 return reminder stores path-only deep link and uses generic nonunique attribution', () => {
  assert.equal(reminderRoutePathOnly('/projects?project=secret#tab'), '/projects');
  assert.equal(attributedReminderRoute('/projects?project=secret#tab'), '/projects?utm_source=eon-service-reminder&utm_medium=push&utm_campaign=return-reminder');
  assert.equal(EON_RETURN_REMINDER_MAX_NEW_PER_UTC_DAY, 3);
  const reminderApi = read('functions/api/notifications/reminder.js');
  assert.match(reminderApi, /return_reminder_daily_cap_reached/);
  assert.match(reminderApi, /EON_RETURN_REMINDER_EXPIRY_AFTER_DUE_MS/);
  assert.match(reminderApi, /reminderRoutePathOnly/);
  assert.doesNotMatch(reminderApi, /utm_(?:content|term)|click_id/);
});

test('RT92 queue enforces quiet hours and expiry before Web Push and never counts click success', () => {
  const worker = read('workers/eon-retention-notifications/src/index.js');
  const queueBlock = worker.slice(worker.indexOf('async function processQueueMessage'), worker.indexOf('async function mapWithConcurrency'));
  assert.ok(queueBlock.indexOf('expiresAt > 0') < queueBlock.indexOf('processReminder(env, reminder'));
  assert.ok(queueBlock.indexOf('isReminderQuietAt(reminder, now)') < queueBlock.indexOf('processReminder(env, reminder'));
  assert.match(worker, /attributedReminderRoute\(reminder\.route \|\| '\/'\)/);
  assert.doesNotMatch(worker, /notification[_ -]?click|click[_ -]?success/i);
  const truth = getEonRetentionNotificationScaleTruth();
  assert.equal(truth.serverQuietHoursEnforced, true);
  assert.equal(truth.staleReminderExpiryHours, 24);
  assert.equal(truth.freshReminderScheduleCapPerUtcDay, 3);
  assert.equal(truth.successHeartbeatWritePerPush, false);
});

test('RT92 shared shell boots growth attribution so non-chat reminder returns become measurable activity', () => {
  const shell = read('assets/js/eon-app-shell.js');
  const growth = read('assets/js/growth/eon-growth-attribution.js');
  assert.match(shell, /import \{ bootEonGrowthAttribution \} from '\.\/growth\/eon-growth-attribution\.js'/);
  assert.match(shell, /bootEonGrowthAttribution\(\);/);
  assert.match(growth, /if \(growthAttributionBootResult\) return growthAttributionBootResult/);
  assert.match(growth, /emitEonGrowthEvent\('landing_view'/);
  assert.match(growth, /emitEonGrowthEvent\('engaged_5s'/);
});
