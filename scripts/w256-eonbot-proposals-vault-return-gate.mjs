/** W256 — EONBOT guarded proposal and Vault return source/output gate. */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const hub = read('assets/js/chat/eonbot-command-hub.js');
const proposal = read('assets/js/chat/eonbot-action-proposals.js');
const chat = read('assets/js/chat-page.js');
const vault = read('assets/js/vault/eon-vault-page.js');
const vaultHtml = read('vault.html');

expect(hub.includes("route: '/vault#provider-check'"), 'Vault command must use the canonical provider-check anchor.');
expect(hub.includes('requiresProposalReview'), 'Command Hub must identify guarded proposal actions.');
expect(hub.includes("execution: requiresProposalReview ? 'prepared-review-required' : 'prepared-user-tap'"), 'Command receipt must distinguish reviewed actions.');
expect(hub.includes('toolCTA: requiresProposalReview ? null'), 'Guarded actions cannot ship a direct destination CTA.');
expect(proposal.includes('EONBOT_ACTION_PROPOSAL_TTL_MS'), 'Proposal TTL is missing.');
expect(proposal.includes('cancelEonbotActionProposal'), 'Cancellation contract is missing.');
expect(proposal.includes('failEonbotActionProposal'), 'Failure contract is missing.');
expect(proposal.includes('completeEonbotVaultReturnContext'), 'Vault return contract is missing.');
expect(!/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource/.test(proposal), 'Proposal contract must not use remote transport.');
expect(chat.includes('createEonbotActionProposal') && chat.includes('approveEonbotActionProposal') && chat.includes('cancelEonbotActionProposal'), 'Chat must render the explicit proposal lifecycle.');
expect(chat.includes('Confirm and open'), 'Chat must expose an explicit second confirmation.');
expect(vaultHtml.includes('id="eon-vault-chat-return"') && vaultHtml.includes('id="eon-vault-return-chat"'), 'Vault return controls are missing.');
expect(vault.includes('getEonbotVaultReturnContext') && vault.includes('completeEonbotVaultReturnContext'), 'Vault return runtime is missing.');
expect(!/document\.|querySelector|FormData|HTMLInput|textarea|input\.value/i.test(proposal), 'Proposal contract must not contain DOM or secret-intake wiring.');

const report = {
  schema: 'eon.w256.eonbot-proposals-vault-return.v1',
  ok: failures.length === 0,
  checked: [
    'guarded-action-review', 'proposal-expiry-cancel-failure', 'vault-provider-anchor',
    'vault-chat-return', 'no-remote-transport', 'no-secret-intake'
  ],
  failures
};
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts', 'W256_EONBOT_PROPOSALS_VAULT_RETURN_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log('W256 EONBOT proposal/Vault return gate: PASS');
}
