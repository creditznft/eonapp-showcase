import assert from 'node:assert/strict';
import test from 'node:test';
import { W388A3_EONBOT_SHAREABLE_CONTRACT, validateW388A3EonbotShareableContract } from '../../config/w388a3-eonbot-shareable-contract.mjs';
import { buildEonbotCommandHubPlan } from '../../assets/js/chat/eonbot-command-hub.js';
import { buildEonShareIntentFromChat, getEonShareIntentTruth } from '../../assets/js/share/eon-share-intent.js';
import { inspectW388A3EonbotShareable } from '../../scripts/w388a3-eonbot-shareable-gate.mjs';

test('W388A.3 turns explicit EONBOT shareable requests into a user-tap local handoff', () => {
  assert.deepEqual(validateW388A3EonbotShareableContract(), []);
  const plan = buildEonbotCommandHubPlan('Make this launch video shareable and invite a remix');
  assert.equal(plan.commandId, 'make-creation-shareable');
  assert.equal(plan.route, '/workspace#eon-share');
  assert.equal(plan.commandReceipt.completed, false);
  assert.equal(plan.commandReceipt.externalEffect, false);
  assert.equal(plan.shareIntent.accepted, true);
  assert.equal(plan.shareIntent.wantsRemix, true);
  assert.equal(getEonShareIntentTruth().directPublishing, false);
});

test('W388A.3 short-lived intent excludes secret-looking requests', () => {
  const plain = buildEonShareIntentFromChat('Make this visual campaign shareable for independent creators.');
  assert.equal(plain.accepted, true);
  assert.match(plain.usefulOutcome, /visual campaign/i);
  assert.throws(() => buildEonShareIntentFromChat('Make this shareable. api key: example-secret-123456789'), /secret/i);
});

test('W388A.3 gate keeps no connector, posting, tracking or referral claim', () => {
  const report = inspectW388A3EonbotShareable({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.match(report.limitations.join(' '), /No model output is made public/i);
});
