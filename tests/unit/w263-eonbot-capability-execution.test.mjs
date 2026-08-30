import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  buildEonbotCommandHubPlan,
  listEonbotExecutionCapabilities,
  matchesEonbotCommandHubAction
} from '../../assets/js/chat/eonbot-command-hub.js';
import {
  approveEonbotActionProposal,
  createEonbotActionProposal
} from '../../assets/js/chat/eonbot-action-proposals.js';
import {
  listEonbotActionReceipts,
  recordEonbotActionTap
} from '../../assets/js/chat/eonbot-action-receipts.js';
import { runW263EonbotCapabilityExecutionGate } from '../../scripts/w263-eonbot-capability-execution-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const gate = path.join(root, 'scripts', 'w263-eonbot-capability-execution-gate.mjs');
const receiptPath = path.join(root, 'assets', 'js', 'chat', 'eonbot-action-receipts.js');

function memoryStorage(seed = {}) {
  const rows = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)]));
  return {
    getItem(key) { return rows.has(String(key)) ? rows.get(String(key)) : null; },
    setItem(key, value) { rows.set(String(key), String(value)); },
    removeItem(key) { rows.delete(String(key)); }
  };
}

test('W263 exposes only finite explicit-user-tap local capability records', () => {
  const capabilities = listEonbotExecutionCapabilities();
  assert.ok(capabilities.length >= 10);
  assert.equal(new Set(capabilities.map((entry) => entry.id)).size, capabilities.length);
  for (const capability of capabilities) {
    assert.equal(capability.requiresUserTap, true);
    assert.equal(capability.externalEffect, false);
    assert.ok(['prepared-user-tap', 'prepared-review-required'].includes(capability.execution));
    assert.equal(capability.requiresProposalReview, Boolean(capability.sensitive || capability.requiresPermission || capability.requiresDeviceReview));
  }
  const vault = capabilities.find((entry) => entry.id === 'open-vault');
  const projects = capabilities.find((entry) => entry.id === 'open-projects');
  assert.equal(vault?.requiresProposalReview, true);
  assert.equal(projects?.requiresProposalReview, false);
});

test('W263 validates exact capability route/type pairs rather than accepting a syntactically safe forged receipt', () => {
  const plan = buildEonbotCommandHubPlan('open projects');
  assert.equal(matchesEonbotCommandHubAction(plan.commandReceipt), true);
  assert.equal(matchesEonbotCommandHubAction({ ...plan.commandReceipt, route: '/vault' }), false);
  assert.equal(matchesEonbotCommandHubAction({ ...plan.commandReceipt, actionType: 'city-guidance' }), false);
  assert.equal(matchesEonbotCommandHubAction({ ...plan.commandReceipt, interpretedAs: 'not-a-capability' }), false);
});

test('W263 denies guarded receipt creation until a matching local proposal is approved', () => {
  const storage = memoryStorage();
  const vault = buildEonbotCommandHubPlan('open vault');
  const noProposal = recordEonbotActionTap(vault.commandReceipt, { storage, now: 1_000 });
  assert.equal(noProposal.ok, false);
  assert.equal(noProposal.reason, 'proposal-required');

  const created = createEonbotActionProposal(vault.commandReceipt, { storage, now: 1_001 });
  assert.equal(created.ok, true);
  const beforeApproval = recordEonbotActionTap({ ...vault.commandReceipt, proposalId: created.proposal.id }, { storage, now: 1_002 });
  assert.equal(beforeApproval.ok, false);
  assert.equal(beforeApproval.reason, 'proposal-not-approved');

  const approved = approveEonbotActionProposal(created.proposal.id, { storage, now: 1_003 });
  assert.equal(approved.ok, true);
  const recorded = recordEonbotActionTap({ ...vault.commandReceipt, proposalId: created.proposal.id }, { storage, now: 1_004 });
  assert.equal(recorded.ok, true);
  assert.equal(recorded.receipt.externalEffect, false);
  assert.equal(listEonbotActionReceipts({ storage, now: 1_004 }).length, 1);

  const forged = recordEonbotActionTap({ ...vault.commandReceipt, route: '/vault#wrong', proposalId: created.proposal.id }, { storage, now: 1_005 });
  assert.equal(forged.ok, false);
  assert.equal(forged.reason, 'invalid-command-receipt');
});

test('W263 source gate passes and fails closed if guarded-receipt approval is removed', () => {
  const report = runW263EonbotCapabilityExecutionGate(root);
  assert.equal(report.ok, true, report.errors.join('\n'));
  const original = fs.readFileSync(receiptPath, 'utf8');
  try {
    fs.writeFileSync(receiptPath, original.replace("if (!proposalId) return Object.freeze({ ok: false, receipt: null, reason: 'proposal-required' });", 'if (!proposalId) return Object.freeze({ ok: true, receipt: null, reason: null });'));
    const result = spawnSync(process.execPath, [gate], { cwd: root, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /Receipts must fail closed for guarded capabilities/);
  } finally {
    fs.writeFileSync(receiptPath, original);
  }
});
