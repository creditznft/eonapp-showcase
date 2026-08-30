/** W388B Workspace plan for global creator connectors. */
import { getEonSocialConnectorTruth, listEonSocialConnectors } from './eon-social-connector-registry.js';
import { getEonConnectorConsentTruth } from './eon-connector-consent-registry.js';

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

export function renderEonSocialConnectorsWorkspace() {
  const truth = getEonSocialConnectorTruth();
  const consentTruth = getEonConnectorConsentTruth();
  const connectors = listEonSocialConnectors();
  return `<section id="eon-connectors" class="eon-hub-card eon-hub-card-full eon-social-connectors" aria-labelledby="eon-social-connectors-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">Creator Connectors · W388B architecture</p><h2 id="eon-social-connectors-title">Prepare once. Post only where you explicitly approve.</h2><p>Export and native share can hand a finished creator package to apps on your device. Direct posting is not connected yet. Every future connection needs official platform approval, user consent, per-post review, cancellation and revocation.</p></div><span class="eon-record-status">${escapeHtml(truth.rollout)}</span></div><div class="eon-record-list">${connectors.map((connector) => `<article class="eon-record-card"><div><p class="eon-record-type">${escapeHtml(connector.category.replaceAll('-', ' '))}</p><h3>${escapeHtml(connector.label)}</h3><p><strong>Now:</strong> ${escapeHtml(connector.now)}</p><p><strong>Later:</strong> ${escapeHtml(connector.later)}</p></div><span class="eon-record-status">No connection</span></article>`).join('')}</div><p class="eon-profile-status">W442 consent records are local, expiring, and revocable; OAuth, tokens and platform actions remain unavailable (${consentTruth.oauthStarted ? 'not applicable' : 'not started'}).</p><p class="eon-profile-status">EONAPP does not yet hold social accounts, tokens, drafts, schedule times, posting history, audience data, or direct-post results. Platform eligibility varies by platform, account and location.</p></section>`;
}

export function bindEonSocialConnectorsWorkspace() {}

export function getEonSocialConnectorsWorkspaceTruth() {
  return Object.freeze({ ...getEonSocialConnectorTruth(), workspaceSurface: true, connectButtons: false, directPostingControls: false });
}
