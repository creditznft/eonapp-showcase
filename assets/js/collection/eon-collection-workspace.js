/**
 * W429 — Vault Reveals surface.
 *
 * This is visual progression language only. It deliberately cannot generate a
 * grant, spend currency, open a chance mechanic, create an NFT, transfer an
 * item, or modify City capability. It makes the planned City progression
 * visible without misleading anyone about what is live today.
 */
import { listEonCollectionArtifacts, listEonCollectionMissions, getEonCollectionTruth, resolveDeterministicVaultReveal } from './eon-collection-foundation.js';
import { createEonCollectionEligibilityRegistry } from './eon-collection-eligibility.js';

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

function revealMark(artifact) {
  const glyph = {
    'forge-keystone': '⌁',
    'share-signal': '◌',
    'remix-wayfinder': '✦'
  }[artifact.id] || '◇';
  return `<span class="eon-vault-reveal-mark" aria-hidden="true"><span>${glyph}</span></span>`;
}

function renderArtifact(artifact) {
  const mission = listEonCollectionMissions().find((candidate) => candidate.artifactId === artifact.id);
  const reveal = resolveDeterministicVaultReveal({ missionId: mission?.id, evidenceKind: mission?.evidenceKind });
  return `<article class="eon-vault-reveal-card" data-eon-vault-reveal="${escapeHtml(artifact.id)}">
    ${revealMark(artifact)}
    <div>
      <p class="eon-vault-reveal-tier">${escapeHtml(artifact.tier)} · planned</p>
      <h3>${escapeHtml(artifact.label)}</h3>
      <p>${escapeHtml(artifact.visual)}</p>
      <small>${escapeHtml(reveal.reason)}</small>
    </div>
  </article>`;
}

export function renderEonCollectionWorkspace() {
  const truth = getEonCollectionTruth();
  const eligibility = createEonCollectionEligibilityRegistry().getSnapshot();
  return `<section class="eon-vault-reveals" data-eon-vault-reveals aria-labelledby="eon-vault-reveals-title">
    <header class="eon-vault-reveals-head">
      <div>
        <p class="eon-vault-kicker">Visual progression</p>
        <h2 id="eon-vault-reveals-title">Vault Reveals</h2>
        <p>Earned visual milestones will live here and can later change the look of your personal EON City. They are never money, tokens, NFTs, paid chance, or a marketplace.</p>
      </div>
      <span class="eon-vault-badge">${escapeHtml(truth.rollout === 'enabled' ? 'Available' : 'Not live yet')}</span>
    </header>
    <div class="eon-vault-reveal-grid">${listEonCollectionArtifacts().map(renderArtifact).join('')}</div>
    <p class="eon-vault-reveal-note">Local review register: ${escapeHtml(String(eligibility.activeEligibilityCount))} visual eligibility record${eligibility.activeEligibilityCount === 1 ? '' : 's'}. Eligibility is not a grant, ownership claim, account entitlement, or City unlock.</p>
    <p class="eon-vault-reveal-note">Current state: visual preview only. Nothing can be earned, bought, traded, transferred, sold, or used as an account entitlement until identity, recovery, policy, anti-abuse, and human-release proof are complete.</p>
  </section>`;
}

export function bindEonCollectionWorkspace() {
  // Intentionally no controls: a display surface must never become a hidden grant path.
}

export function getEonCollectionWorkspaceTruth() {
  return Object.freeze({ ...getEonCollectionTruth(), workspaceSurface: true, interactiveGrantControls: false, sourceProofOnly: true, cityCosmeticsActive: false });
}
