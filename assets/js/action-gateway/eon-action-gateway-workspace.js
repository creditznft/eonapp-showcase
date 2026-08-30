/** W406/W407 Workspace status surface for an intentionally disabled action gateway. */
import { EON_ACTION_GATEWAY_TYPES, getEonActionGatewayTruth } from './eon-action-gateway-contract.js';
import { getEonActionGatewayReviewPilotTruth } from './eon-action-gateway-review-pilot.js';

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

export function renderEonActionGatewayWorkspace() {
  const truth = getEonActionGatewayTruth();
  const reviewPilot = getEonActionGatewayReviewPilotTruth();
  return `<section id="eon-action-gateway" class="eon-hub-card eon-hub-card-full eon-action-gateway" aria-labelledby="eon-action-gateway-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">Action Gateway · W406/W407 preparation</p><h2 id="eon-action-gateway-title">A plan is not an external action.</h2><p>Future posts, repository creation and Cloudflare deployment must each receive a server-issued proposal, a visible user confirmation, expiry, cancellation and a redacted durable receipt. This release creates none of them.</p></div><span class="eon-record-status">${escapeHtml(truth.rollout)}</span></div><div class="eon-record-list">${EON_ACTION_GATEWAY_TYPES.map((action) => `<article class="eon-record-card"><div><p class="eon-record-type">Future action type</p><h3>${escapeHtml(action.label)}</h3><p>Requires official connection, user review, an explicit final confirmation and a durable server receipt. EONBOT text alone can never perform it.</p></div><span class="eon-record-status">Disabled</span></article>`).join('')}</div><p class="eon-profile-status">W441 review pilot: ${reviewPilot.localReviewProposal ? 'local proposals may be reviewed and held, but they cannot execute externally.' : 'not available.'}</p><p class="eon-profile-status">Current local EONBOT proposals and route receipts remain local navigation/review records. They cannot publish, connect, deploy, grant or change external accounts.</p></section>`;
}

export function bindEonActionGatewayWorkspace() {}

export function getEonActionGatewayWorkspaceTruth() {
  return Object.freeze({ ...getEonActionGatewayTruth(), workspaceSurface: true, executeControl: false, serverReceipt: false });
}
