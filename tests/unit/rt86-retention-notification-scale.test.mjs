import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getEonRetentionNotificationScaleTruth } from '../../workers/eon-retention-notifications/src/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => readFileSync(path.join(root, file), 'utf8');

test('RT86 scale authority passes as a read-only source gate', () => {
  const result = spawnSync(process.execPath, ['scripts/rt86-retention-notification-scale-gate.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /\[RT86\] PASS 23\/23/);
});

test('RT86 scale truth bounds queue fan-out, D1 subrequests and terminal storage', () => {
  const truth = getEonRetentionNotificationScaleTruth();
  assert.equal(truth.maxRemindersPerMinuteScan, 5000);
  assert.equal(truth.theoreticalReminderReleasePerDay, 7_200_000);
  assert.equal(truth.claimChunkSize, 80);
  assert.equal(truth.queueBatchSize, 50);
  assert.equal(truth.maxD1QueriesPerQueueBatchUpperBound, 400);
  assert.equal(truth.queueConsumerConcurrencyPerInvocation, 4);
  assert.equal(truth.maxActiveDevicesPerAccount, 5);
  assert.equal(truth.terminalReminderRowsPersisted, false);
  assert.equal(truth.automaticMarketing, false);
});

test('RT86 rollout is preview-testable, production-disabled and D1-protective', () => {
  const wrangler = read('workers/eon-retention-notifications/wrangler.jsonc');
  const pagesWrangler = read('wrangler.jsonc');
  assert.equal((wrangler.match(/"max_concurrency"\s*:\s*10/g) || []).length, 3);
  assert.equal((wrangler.match(/"max_batch_size"\s*:\s*50/g) || []).length, 3);
  assert.doesNotMatch(wrangler, /"cpu_ms"\s*:/);
  assert.match(wrangler, /Cloudflare still enforces the plan default/);
  assert.match(wrangler, /eonapp-retention-notifications-preview/);
  assert.match(wrangler, /eonapp-retention-notifications-production/);
  assert.equal((wrangler.match(/"EON_PUSH_ROLLOUT"\s*:\s*"disabled"/g) || []).length, 2);
  assert.equal((wrangler.match(/"EON_PUSH_ROLLOUT"\s*:\s*"testing"/g) || []).length, 1);
  assert.equal((wrangler.match(/"crons"\s*:\s*\[\s*"\* \* \* \* \*"\s*\]/g) || []).length, 1);
  assert.equal((wrangler.match(/"crons"\s*:\s*\[\s*\]/g) || []).length, 2);
  assert.equal((pagesWrangler.match(/"EON_PUSH_ROLLOUT"\s*:\s*"disabled"/g) || []).length, 2);
  assert.equal((pagesWrangler.match(/"EON_PUSH_ROLLOUT"\s*:\s*"testing"/g) || []).length, 1);
});

test('RT86 reminder lifecycle does not persist terminal rows or arbitrary push bodies', () => {
  const worker = read('workers/eon-retention-notifications/src/index.js');
  const reminder = read('functions/api/notifications/reminder.js');
  assert.match(worker, /DELETE FROM eon_push_reminders/);
  assert.match(reminder, /DELETE FROM eon_push_reminders/);
  assert.doesNotMatch(worker, /SET delivered_at=/);
  assert.match(worker, /customBodiesLoaded: 0/);
  assert.match(worker, /marketingMessages: 0/);
});


test('RT86 secret generator emits valid VAPID/encryption shapes without persisting them', () => {
  const result = spawnSync(process.execPath, ['scripts/rt86-generate-web-push-secrets.mjs', '--json', '--subject', 'https://preview.example.test'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const values = JSON.parse(result.stdout);
  assert.equal(Buffer.from(values.EON_PUSH_VAPID_PUBLIC_KEY, 'base64url').byteLength, 65);
  assert.equal(Buffer.from(values.EON_PUSH_VAPID_PUBLIC_KEY, 'base64url')[0], 4);
  assert.equal(Buffer.from(values.EON_PUSH_VAPID_PRIVATE_KEY, 'base64url').byteLength, 32);
  assert.equal(Buffer.from(values.EON_PUSH_SUBSCRIPTION_ENCRYPTION_KEY, 'base64url').byteLength, 32);
  assert.equal(values.EON_PUSH_VAPID_SUBJECT, 'https://preview.example.test');
});
