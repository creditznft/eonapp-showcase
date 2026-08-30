/** W391 Workspace status surface: explains a future Relay pilot without an invite/reward action. */
import { getEonRelayPilotTruth } from './eon-relay-pilot-contract.js';

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

export function renderEonRelayPilotWorkspace() {
  const truth = getEonRelayPilotTruth();
  return `<section id="eon-relay" class="eon-hub-card eon-hub-card-full eon-relay-pilot" aria-labelledby="eon-relay-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">EON Relay · W391 pilot preparation</p><h2 id="eon-relay-title">Invite people through useful work—not an empty link.</h2><p>Relay will only recognize a small number of verified creator activations after legal, anti-abuse, account, restoration and human-release gates. An invite, click, signup, share, post, view or follower count never earns anything by itself.</p></div><span class="eon-record-status">${escapeHtml(truth.rollout)}</span></div><div class="eon-record-list"><article class="eon-record-card"><div><p class="eon-record-type">Future direct activation</p><h3>Three verified grants maximum</h3><p>Future grants are non-transferable visual presentation treatments only. No cash, credits, discounts, subscription time, payout, sale, token, NFT or downline.</p></div><span class="eon-record-status">Not active</span></article><article class="eon-record-card"><div><p class="eon-record-type">Current creator loop</p><h3>Share Pack → Remix Card → useful outcome</h3><p>Creators can already draft, export and share useful public-safe starting points. EONAPP does not record reach, claim a referral or create a reward from these steps.</p></div><span class="eon-record-status">Local only</span></article></div><p class="eon-profile-status">Relay needs a dedicated server ledger and a legal/reversal policy before it can generate an invite or grant any Collection presentation treatment.</p></section>`;
}

export function bindEonRelayPilotWorkspace() {}

export function getEonRelayPilotWorkspaceTruth() {
  return Object.freeze({ ...getEonRelayPilotTruth(), workspaceSurface: true, inviteButton: false, referralLink: false, grantControls: false });
}
