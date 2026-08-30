import { escapeHtml } from './utils/escape.js';
import { ensureProfile, getInviteSummary, getProfileStats, getReferralActivitySummary, readReferralReturnEvents } from './utils/profile.js';
import { renderReferralShareCenter } from './utils/referral-share-center.js';
import { exportShareCard, downloadCanvas } from './utils/share-card.js';
import { showToast } from './utils/share.js';

function el(id) {
  return document.getElementById(id);
}

function renderHero() {
  const stats = getProfileStats();
  const invite = getInviteSummary();
  const activity = getReferralActivitySummary();
  const root = el('leaderboard-hero-stats');
  if (!root) return;
  root.innerHTML = `
    <div class="leaderboard-stat">
      <span class="leaderboard-stat-label">Signed-link status</span>
      <div class="leaderboard-stat-value">Ready</div>
      <div class="leaderboard-stat-note">eon2 referral and eon3 Realm links are self-contained.</div>
    </div>
    <div class="leaderboard-stat">
      <span class="leaderboard-stat-label">Qualified relationships</span>
      <div class="leaderboard-stat-value">${Number(stats.referralReturns || 0)}</div>
      <div class="leaderboard-stat-note">No reward or payout is issued for this count.</div>
    </div>
    <div class="leaderboard-stat">
      <span class="leaderboard-stat-label">Recognition level</span>
      <div class="leaderboard-stat-value">${escapeHtml(invite.referralTier?.name || 'Signed Share Ready')}</div>
      <div class="leaderboard-stat-note">Recognition only · no account benefit.</div>
    </div>
    <div class="leaderboard-stat">
      <span class="leaderboard-stat-label">Local activity streak</span>
      <div class="leaderboard-stat-value">${Number(activity.streak || 0)}</div>
      <div class="leaderboard-stat-note">A local display record, not a reward condition.</div>
    </div>
  `;
}

function renderRelationshipLog() {
  const root = el('leaderboard-list');
  if (!root) return;
  const profile = ensureProfile();
  const events = readReferralReturnEvents()
    .filter((event) => !profile?.uid || event?.fromUid === profile.uid || event?.referrerId === profile.uid || event?.profileId === profile.uid)
    .slice(-20)
    .reverse();

  if (!events.length) {
    root.innerHTML = `<div class="leaderboard-empty">
      No local qualified relationship entries yet. A posted link alone is never a conversion, reward, payment, or public rank.
    </div>`;
    return;
  }

  root.innerHTML = events.map((event, index) => `
    <div class="leaderboard-row">
      <div class="leaderboard-rank">#${index + 1}</div>
      <div class="leaderboard-user">
        <strong>${escapeHtml(String(event?.fromAlias || event?.fromUid || 'Pseudonymous relationship').slice(0, 24))}</strong>
        <span>${escapeHtml(String(event?.at || '').slice(0, 10) || 'Local record')} · qualified relationship context</span>
      </div>
      <div class="leaderboard-score">recorded</div>
    </div>
  `).join('');
}

function renderMilestones() {
  const invite = getInviteSummary();
  const root = el('leaderboard-milestones');
  if (!root) return;
  root.innerHTML = invite.referralLadder.map((tier) => `
    <div class="leaderboard-mile">
      <div>
        <strong>${escapeHtml(tier.emoji)} ${escapeHtml(tier.name)}</strong>
        <span class="state">${escapeHtml(tier.unlock)}</span>
        <span class="state">Recognition only · no points, payout, subscription, NFT, or revenue share.</span>
      </div>
      <div class="badge ${tier.current ? 'badge-green' : tier.unlocked ? 'badge-gold' : ''}">${tier.min}+ relationships</div>
    </div>
  `).join('');
}

function renderShareCard() {
  const card = el('leaderboard-share-card');
  if (!card) return;
  const stats = getProfileStats();
  card.innerHTML = `
    <span class="share-kicker">Signed public share</span>
    <h3>Share EONAPP without a link registry.</h3>
    <p>
      Create a fresh self-contained signed link for a referral or Realm. It can verify without D1, KV, a Worker lookup, or a stored short alias.
      Opening it does not create credit, money, access, a payout, or a public ranking.
    </p>
    <div class="leaderboard-share-grid">
      <div class="leaderboard-share-metric"><span>Link protocol</span><strong>eon2 / eon3</strong></div>
      <div class="leaderboard-share-metric"><span>Fresh link entropy</span><strong>128-bit</strong></div>
      <div class="leaderboard-share-metric"><span>Qualified relationships</span><strong>${Number(stats.referralReturns || 0)}</strong></div>
    </div>
    <div class="leaderboard-share-actions">
      <button class="btn btn-primary btn-sm" type="button" id="leaderboard-share-card-download">Download share card</button>
      <button class="btn btn-outline btn-sm" type="button" id="leaderboard-share-card-create">Open signed share creator</button>
    </div>
  `;
}

async function downloadShareCard() {
  const card = el('leaderboard-share-card');
  if (!card) return showToast('Share card is not available yet.', 'error');
  const result = await exportShareCard(card, { fileToken: 'signed-share-card', backgroundColor: '#08101f', preferredScale: 2 });
  if (!result.ok) return showToast('Share card export is not available right now.', 'error');
  downloadCanvas(result.canvas, result.filename);
  showToast('Share card downloaded.', 'success');
}

function focusShareCreator() {
  const root = el('leaderboard-referral-cta');
  root?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  root?.querySelector('[data-ref-share-copy]')?.focus();
}

function renderShareCreator() {
  const root = el('leaderboard-referral-cta');
  if (!root) return;
  renderReferralShareCenter(root, {
    profile: ensureProfile(),
    source: 'leaderboard-signed-share',
    destination: '/vault',
    heading: 'Create a signed referral link',
    description: 'Each link carries its own signature and fresh cryptographic randomness. No short-link registry, click ledger, reward, payout, or revenue-share campaign is active.'
  });
}

function refresh() {
  renderHero();
  renderRelationshipLog();
  renderMilestones();
  renderShareCard();
  renderShareCreator();
  showToast('Signed-share status refreshed.', 'success');
}

document.addEventListener('DOMContentLoaded', () => {
  renderHero();
  renderRelationshipLog();
  renderMilestones();
  renderShareCard();
  renderShareCreator();

  el('leaderboard-refresh')?.addEventListener('click', refresh);
  el('leaderboard-share-card-btn')?.addEventListener('click', () => void downloadShareCard());
  el('leaderboard-share-campaign-btn')?.addEventListener('click', focusShareCreator);
  el('leaderboard-share-card')?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('#leaderboard-share-card-download')) void downloadShareCard();
    if (target.closest('#leaderboard-share-card-create')) focusShareCreator();
  });
  document.addEventListener('eon:referral:return', () => {
    renderHero();
    renderRelationshipLog();
    renderMilestones();
    renderShareCard();
  });
});
