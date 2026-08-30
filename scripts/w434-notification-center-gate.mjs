#!/usr/bin/env node
/** W434 continuity gate: historical local-only contract + Institutional AI V2 supersession. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonNotificationCenterTruth } from '../assets/js/notifications/eon-notification-center.js';
import { W434_NOTIFICATION_CENTER_CONTRACT, validateW434NotificationCenterContract } from '../config/w434-notification-center-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export function inspectW434NotificationCenter() {
  const checks = [];
  const check = (id, condition, detail) => { checks.push({ id, pass: Boolean(condition), detail }); ensure(condition, `${id}: ${detail}`); };
  const center = read('assets/js/notifications/eon-notification-center.js');
  const delivery = read('assets/js/notifications/eon-device-notification-delivery.js');
  const server = ['functions/api/notifications/config.js', 'functions/api/notifications/subscription.js', 'functions/api/notifications/self-test.js', 'functions/_shared/eon-web-push.js'].map(read).join('\n');
  const shell = read('assets/js/eon-app-shell.js');
  const worker = read('service-worker/eonapp-service-worker.js');
  const watchdog = read('assets/js/utils/mission-watchdog.js');
  const w145 = read('assets/js/utils/update-safe-user-data.js');
  const truth = getEonNotificationCenterTruth();

  check('required-files', ['assets/js/notifications/eon-notification-center.js', 'assets/js/notifications/eon-device-notification-delivery.js', 'functions/_shared/eon-web-push.js', 'functions/api/notifications/subscription.js', 'service-worker/eonapp-service-worker.js'].every((relative) => existsSync(path.join(root, relative))), 'Activity Center and explicit device-delivery sources are present');
  check('contract-valid', validateW434NotificationCenterContract().length === 0 && W434_NOTIFICATION_CENTER_CONTRACT.categories.length === 6, 'historical W434 truth is preserved and explicit AI V2 supersession is declared');
  check('shell-wired', /renderEonNotificationCenterMarkup/.test(shell) && /data-eon-notification-enable-device/.test(shell) && /data-eon-notification-test-device/.test(shell), 'Settings exposes Activity Center, explicit Enable and explicit push self-test controls');
  check('explicit-source-event', /explicit-source-event-required/.test(center) && /sensitive-activity-text-blocked/.test(center), 'activity rows still require real redacted source events');
  check('explicit-permission', /explicit-user-action-required/.test(delivery) && /Notification\.requestPermission/.test(delivery) && /automaticPermissionPrompt: false/.test(delivery), 'browser permission is reachable only through the explicit device-delivery function');
  check('encrypted-custody', /sealEonPushSubscription/.test(server) && /AES-GCM/.test(server) && /encrypted_subscription/.test(server), 'push endpoint custody is encrypted before D1 persistence');
  check('web-push-protocol', /aes128gcm/.test(server) && /vapid/.test(server) && /ECDH/.test(server), 'server delivery implements encrypted Web Push and VAPID source paths');
  check('same-origin-account-scope', /enforceSameOriginMutation/.test(server) && /readSession/.test(server) && /account_id/.test(server), 'subscription mutation and self-test are same-origin and account-scoped');
  check('service-worker-safe-delivery', /addEventListener\('push'/.test(worker) && /safePushRoute/.test(worker) && /safePushText/.test(worker) && !/raw\?\.icon/.test(worker), 'service worker accepts only bounded text/internal routes and ignores remote notification icons');
  check('watchdog-not-marketing', /recordEonNotificationActivity/.test(watchdog) && !/marketing/.test(watchdog), 'mission watchdog remains an explicit local activity source, not a promotional sender');
  check('update-safe-key', /eon:notification-center:v1/.test(w145), 'Activity Center preferences/read state remain update-protected');
  check('truth-boundary', truth.inAppCenter && truth.deviceNotificationDelivery === true && truth.browserPermissionPromptOnLoad === false && truth.liveDeliveryProof === false, 'source-ready device delivery is distinguished from not-yet-run live delivery proof');
  return Object.freeze({ schema: 'eonapp.w434.notification-center-gate.v2', wave: 'W434', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['Live browser permission, real push-service acceptance, closed-tab delivery, unsubscribe and multi-device behavior still require deployment/runtime proof.', 'Marketing/reward push remains prohibited; service-device alerts require explicit opt-in.']) });
}

export function runW434NotificationCenterGate({ writeArtifact = true } = {}) {
  const result = inspectW434NotificationCenter();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w434-notification-center-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW434NotificationCenterGate();
  process.stdout.write(`W434 continuity gate passed (${result.checkCount}/${result.checkCount}). Device delivery is source-ready; live proof remains pending.\n`);
}
