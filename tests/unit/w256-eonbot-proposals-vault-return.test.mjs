import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildEonbotCommandHubPlan } from '../../assets/js/chat/eonbot-command-hub.js';
import { listEonbotActionReceipts, recordEonbotActionTap } from '../../assets/js/chat/eonbot-action-receipts.js';
import {
  EONBOT_ACTION_PROPOSALS_KEY,
  EONBOT_ACTION_PROPOSAL_TTL_MS,
  EONBOT_VAULT_RETURN_CONTEXT_KEY,
  approveEonbotActionProposal,
  cancelEonbotActionProposal,
  clearEonbotActionProposalsForTest,
  completeEonbotVaultReturnContext,
  createEonbotActionProposal,
  failEonbotActionProposal,
  getEonbotVaultReturnContext,
  listEonbotActionProposals
} from '../../assets/js/chat/eonbot-action-proposals.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

function memoryStorage(seed = {}) {
  const rows = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)]));
  return {
    getItem(key) { return rows.has(String(key)) ? rows.get(String(key)) : null; },
    setItem(key, value) { rows.set(String(key), String(value)); },
    removeItem(key) { rows.delete(String(key)); }
  };
}

test('W256 makes sensitive and permission-guarded EONBOT commands reviewable while direct City stays a local user-tap route', () => {
  const vault = buildEonbotCommandHubPlan('open vault');
  assert.equal(vault.route, '/vault#provider-check');
  assert.equal(vault.toolCTA, null);
  assert.equal(vault.proposal?.schema, 'eon.eonbot.action-proposal.v1');
  assert.equal(vault.proposal?.vaultReturnContext, true);
  assert.equal(vault.commandReceipt.execution, 'prepared-review-required');
  assert.equal(vault.commandReceipt.proposalRequired, true);
  assert.equal(vault.commandReceipt.completed, false);
  assert.equal(vault.commandReceipt.externalEffect, false);
  assert.match(vault.truthNote, /Do not paste .* API keys into Chat/i);

  const voice = buildEonbotCommandHubPlan('use microphone');
  const city3d = buildEonbotCommandHubPlan('open 3d eon city');
  const projects = buildEonbotCommandHubPlan('open projects');
  assert.equal(voice.proposal?.requiresPermission, true);
  assert.equal(city3d.proposal, null);
  assert.equal(city3d.toolCTA?.url, '/eoncity');
  assert.equal(city3d.requiresDeviceReview, false);
  assert.equal(projects.proposal, null);
  assert.equal(projects.toolCTA?.url, '/projects');
});

test('W256 records a local Vault proposal only after review and returns to the same Chat route without retaining chat text', () => {
  const storage = memoryStorage();
  const plan = buildEonbotCommandHubPlan('open vault and I will keep my secret phrase private');
  const created = createEonbotActionProposal(plan.commandReceipt, {
    storage,
    now: 1_000,
    returnRoute: '/chat?thread=chat_localreturn123'
  });
  assert.equal(created.ok, true);
  assert.equal(created.proposal.status, 'reviewing');
  assert.equal(created.proposal.route, '/vault#provider-check');
  assert.equal(created.proposal.returnRoute, '/chat?thread=chat_localreturn123');
  const raw = storage.getItem(EONBOT_ACTION_PROPOSALS_KEY) || '';
  assert.equal(raw.includes('secret phrase'), false);
  assert.doesNotMatch(raw, /api key|wallet|reward|payout|token|credential/i);

  const approved = approveEonbotActionProposal(created.proposal.id, { storage, now: 1_001 });
  assert.equal(approved.ok, true);
  const tap = recordEonbotActionTap({ ...plan.commandReceipt, proposalId: created.proposal.id }, { storage, now: 1_001 });
  assert.equal(tap.ok, true);
  assert.equal(tap.receipt.proposalId, created.proposal.id);
  assert.equal(listEonbotActionReceipts({ storage, now: 1_001 })[0]?.proposalId, created.proposal.id);
  assert.equal(approved.proposal.status, 'approved');
  assert.equal(approved.proposal.completed, true);
  assert.equal(approved.proposal.externalEffect, false);
  assert.equal(approved.navigation.route, '/vault#provider-check');
  assert.equal(approved.navigation.vaultReturn?.returnRoute, '/chat?thread=chat_localreturn123');
  assert.ok(storage.getItem(EONBOT_VAULT_RETURN_CONTEXT_KEY));

  const context = getEonbotVaultReturnContext({ storage, now: 1_002 });
  assert.equal(context?.returnRoute, '/chat?thread=chat_localreturn123');
  assert.equal(Object.hasOwn(context || {}, 'heard'), false);
  const returned = completeEonbotVaultReturnContext({ storage, now: 1_003 });
  assert.equal(returned.ok, true);
  assert.equal(returned.route, '/chat?thread=chat_localreturn123');
  assert.equal(storage.getItem(EONBOT_VAULT_RETURN_CONTEXT_KEY), null);
  clearEonbotActionProposalsForTest({ storage });
});

test('W256 expiry, cancellation and local failure never navigate or create an external effect', () => {
  const storage = memoryStorage();
  const vault = buildEonbotCommandHubPlan('open vault');
  const cancelled = createEonbotActionProposal(vault.commandReceipt, { storage, now: 2_000 });
  assert.equal(cancelEonbotActionProposal(cancelled.proposal.id, { storage, now: 2_001 }).proposal.status, 'cancelled');
  const afterCancel = approveEonbotActionProposal(cancelled.proposal.id, { storage, now: 2_002 });
  assert.equal(afterCancel.ok, false);
  assert.equal(afterCancel.reason, 'proposal-cancelled');

  const expired = createEonbotActionProposal(vault.commandReceipt, { storage, now: 3_000 });
  const afterExpiry = approveEonbotActionProposal(expired.proposal.id, { storage, now: 3_000 + EONBOT_ACTION_PROPOSAL_TTL_MS + 1 });
  assert.equal(afterExpiry.ok, false);
  assert.equal(afterExpiry.reason, 'proposal-expired');
  assert.equal(afterExpiry.navigation, null);

  const permission = buildEonbotCommandHubPlan('use microphone');
  const failed = createEonbotActionProposal(permission.commandReceipt, { storage, now: 4_000 });
  const failure = failEonbotActionProposal(failed.proposal.id, 'local-navigation-failed', { storage, now: 4_001 });
  assert.equal(failure.ok, true);
  assert.equal(failure.proposal.status, 'failed');
  assert.equal(failure.proposal.externalEffect, false);
  assert.equal(listEonbotActionProposals({ storage, now: 4_002 }).some((row) => row.id === failed.proposal.id && row.status === 'failed'), true);
  assert.equal(createEonbotActionProposal(buildEonbotCommandHubPlan('open projects').commandReceipt, { storage, now: 5_000 }).ok, false);
});

test('W256 wires proposal review in Chat and a Vault-only explicit return control', () => {
  const chat = read('assets/js/chat-page.js');
  const vaultHtml = read('vault.html');
  const vaultRuntime = read('assets/js/vault/eon-vault-page.js');
  const widget = read('assets/js/chat/chatbot.js');
  assert.match(chat, /createEonbotActionProposal/);
  assert.match(chat, /approveEonbotActionProposal/);
  assert.match(chat, /proposalId: proposal\.id/);
  assert.match(chat, /cancelEonbotActionProposal/);
  assert.match(chat, /Confirm and open/);
  assert.match(chat, /Do not paste secrets into Chat/);
  assert.match(vaultHtml, /id="eon-vault-chat-return"/);
  assert.match(vaultHtml, /id="eon-vault-return-chat"/);
  assert.match(vaultRuntime, /getEonbotVaultReturnContext/);
  assert.match(vaultRuntime, /completeEonbotVaultReturnContext/);
  assert.match(widget, /Open full EONBOT Chat to review this guarded action/);
  assert.doesNotMatch(`${chat}\n${vaultHtml}\n${vaultRuntime}`, /seed phrase.*chat.*input|api key.*chat.*input/i);
});
