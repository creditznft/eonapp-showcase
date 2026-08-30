#!/usr/bin/env node
/** W460.1 source gate: current local receipts only; no historical replay or delivery claims. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonbotJobActivityBridgeTruth } from '../assets/js/notifications/eonbot-job-activity-bridge.js';
import { W460_EONBOT_JOB_ACTIVITY_BRIDGE_CONTRACT, validateW460EonbotJobActivityBridgeContract } from '../config/w460-eonbot-job-activity-bridge-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export function inspectW460EonbotJobActivityBridge() {
  const checks = [];
  const check = (id, condition, detail) => { checks.push({ id, pass: Boolean(condition), detail }); ensure(condition, `${id}: ${detail}`); };
  const bridge = read('assets/js/notifications/eonbot-job-activity-bridge.js');
  const fabric = read('assets/js/chat/eonbot-job-fabric.js');
  const center = read('assets/js/notifications/eon-notification-center.js');
  const shell = read('assets/js/eon-app-shell.js');
  const updateSafe = read('assets/js/utils/update-safe-user-data.js');
  const truth = getEonbotJobActivityBridgeTruth();

  check('required-files', W460_EONBOT_JOB_ACTIVITY_BRIDGE_CONTRACT.requiredFiles.every((relative) => existsSync(path.join(root, relative))), 'job fabric, bridge, Activity Center, shell, contract and deterministic test exist');
  check('contract-valid', validateW460EonbotJobActivityBridgeContract().length === 0 && W460_EONBOT_JOB_ACTIVITY_BRIDGE_CONTRACT.wave === 'W460.1', 'contract preserves a current-receipt-only local boundary');
  check('current-receipt-only', /subscribeEonbotJobFabricReceipts/.test(bridge) && /explicitCurrentReceipt: true/.test(bridge) && !/getEonbotJobFabricSnapshot|createEonbotJobFabric\s*\(/.test(bridge), 'bridge subscribes to a current receipt and does not enumerate or recreate saved job history');
  check('receipt-emits-after-save', /persist\((?:next|updated), receipt\)/.test(fabric) && /if \(stored\) emitEonbotJobFabricSnapshot\(snapshot, currentReceipt\)/.test(fabric) && /currentReceipt/.test(fabric), 'fabric carries a receipt only through the current successful mutation event');
  check('activity-center-source-event', /recordEonNotificationActivity/.test(bridge) && /explicitSourceEvent: true/.test(bridge) && /eonbot-job:\$\{receipt\.eventId\}/.test(bridge), 'Activity Center gets a stable dedupe id only through its explicit source-event API');
  check('activity-center-dedupes', /state\.items\.find\(\(item\) => item\.eventId === String\(eventId\)\)/.test(center), 'existing Activity Center dedupe prevents duplicate current receipt entries');
  check('shell-wiring', /startEonbotJobActivityBridge/.test(shell), 'shell starts the local receipt bridge without adding a separate runtime');
  check('update-safe-storage', updateSafe.includes('eon:notification-center:v1') && updateSafe.includes('eon:eonbot:job-fabric:v1'), 'W145 protects Activity Center and job-fabric local records across application updates');
  check('no-network-push-or-external', !/fetch\s*\(|XMLHttpRequest|WebSocket|Notification\.requestPermission|PushManager|navigator\.serviceWorker|window\.location|providerRequestCreated\s*:\s*true/i.test(bridge), 'bridge opens no network channel, permission, push, service worker, navigation or provider action');
  check('truth-boundary', truth.currentReceiptOnly === true && truth.persistedHistoryScanned === false && truth.historicalReplay === false && truth.networkRequestCreated === false && truth.browserPermissionRequested === false && truth.pushSubscriptionCreated === false && truth.externalActionStarted === false && truth.backgroundWorkStarted === false && truth.fabricatedCompletion === false && truth.liveDeliveryProof === false, 'truth object remains fail-closed about replay, delivery, external work and live proof');
  return Object.freeze({
    schema: 'eonapp.w460.eonbot-job-activity-bridge-gate.v1', wave: 'W460.1', status: 'pass', sourceOnly: true,
    checkCount: checks.length, checks: Object.freeze(checks),
    limitations: Object.freeze([
      'This bridge does not scan or replay persisted job history, request browser permission, send a push, call a provider, or perform external work.',
      'It does not prove a user saw an item, a browser stayed open, a device delivered a notification, or an EONBOT result was published, deployed or otherwise executed.'
    ])
  });
}

export function runW460EonbotJobActivityBridgeGate({ writeArtifact = true } = {}) {
  const result = inspectW460EonbotJobActivityBridge();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w460-eonbot-job-activity-bridge-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW460EonbotJobActivityBridgeGate();
  process.stdout.write(`W460.1 EONBOT Activity Center receipt gate passed (${result.checkCount}/${result.checkCount}). No history replay, push or external action was started.\n`);
}
