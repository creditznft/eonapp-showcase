#!/usr/bin/env node
/** W388A.3 source gate: EONBOT prepares share drafts only after a visible CTA tap. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W388A3_EONBOT_SHAREABLE_CONTRACT, validateW388A3EonbotShareableContract } from '../config/w388a3-eonbot-shareable-contract.mjs';
import { buildEonbotCommandHubPlan } from '../assets/js/chat/eonbot-command-hub.js';
import { getEonShareIntentTruth } from '../assets/js/share/eon-share-intent.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW388A3EonbotShareable() {
  const commandHub = read('assets/js/chat/eonbot-command-hub.js');
  const chatPage = read('assets/js/chat-page.js');
  const intent = read('assets/js/share/eon-share-intent.js');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const truth = getEonShareIntentTruth();
  const plan = buildEonbotCommandHubPlan('Make this creator video shareable as a remix card');
  const noTransport = !/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource)\s*\(/.test(intent);

  check('contract-valid', validateW388A3EonbotShareableContract().length === 0, 'W388A.3 contract has no internal violations');
  check('canonical-command', plan.matched === true && plan.commandId === 'make-creation-shareable' && plan.route === W388A3_EONBOT_SHAREABLE_CONTRACT.canonicalRoute, 'EONBOT recognizes explicit shareable/remix requests and routes to canonical Workspace');
  check('local-intent-only', plan.shareIntent?.accepted === true && plan.commandReceipt.completed === false && plan.commandReceipt.externalEffect === false, 'command prepares a local draft and never marks a task complete');
  check('cta-required', truth.explicitCtaRequired === true && /transientShareIntentByMessage\.get\(entry\)/.test(chatPage) && /link\.addEventListener\('click'/.test(chatPage) && /writeEonShareIntent\(shareIntent\)/.test(chatPage), 'chat intent is written only from the visible user CTA handler');
  check('no-private-transfer', truth.attachmentTransfer === false && truth.privateChatTransfer === false && truth.providerCredentials === false && truth.accountData === false && /does not include attachments, private chat history, API keys, files, media, account data/i.test(intent), 'intent excludes attachments, chat history, credentials, media and accounts');
  check('session-expiry', truth.sessionStorageOnly === true && /MAX_AGE_MS/.test(intent) && /expiresAt/.test(intent) && !/localStorage|indexedDB/i.test(intent), 'intent is bounded to browser session storage and expires');
  check('no-connector-or-value-claim', truth.directPublishing === false && truth.socialConnection === false && truth.tracking === false && truth.referralReward === false && noTransport, 'intent creates no connection, publishing, tracking, or referral value');
  check('secret-protection', /SECRET_LIKE/.test(intent) && /looks like it contains a secret/i.test(intent), 'secret-looking requests are rejected from the handoff');
  return Object.freeze({ schema: 'eonapp.w388a3.eonbot-shareable-gate.v1', wave: W388A3_EONBOT_SHAREABLE_CONTRACT.wave, status: 'pass', checkCount: checks.length, checks, limitations: Object.freeze(['Static source verification only.', 'No model output is made public, no social platform is connected, no content is posted, no recipient account is created, and no referral reward or measurement is enabled.']) });
}

export function runW388A3EonbotShareableGate({ writeArtifact = true } = {}) {
  const result = inspectW388A3EonbotShareable();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w388a3-eonbot-shareable-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW388A3EonbotShareableGate();
  process.stdout.write(`W388A.3 EONBOT shareable gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
