import {
  EON_AI_COST_BOUNDARY,
  EON_LOCKED_FEATURE_UNLOCK_COPY,
  getEonKeyTypes,
  getEonReferralRewardMatrix,
  getEonSubscriptionTiers,
  getEonUnlockMenu,
  getTierUnlockPaths,
  validateEonKeysCatalog
} from './eon-keys-catalog.js';
import { buildReferralUxModel } from './eon-referral-program-w629.js';
import { installW629VaultRevealMigration } from './eon-vault-reveal-integration-w629.js';
import {
  EON_LOCKED_FEATURES,
  renderLockedFeatureCta,
  validateLockedFeatureResolver
} from './eon-feature-unlock-resolver.js';
import {
  bindReferralIdentityFromInvite,
  enrollPendingReferral,
  fetchReferralStatus,
  readPendingReferralToken,
  redeemEonKey
} from './eon-referral-server-client.js';
import { createSignedShareLink } from '../utils/signed-share-link.js';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function renderTier(tier) {
  const paths = getTierUnlockPaths(tier.id).unlocks.slice(0, 4);
  const price = tier.monthlyUsd > 0 ? `$${tier.monthlyUsd.toFixed(2)} / month` : 'Free';
  return `<article class="eon-key-card"><p class="eon-key-kicker">${escapeHtml(tier.label)}</p><h2>${escapeHtml(price)}</h2><p>${escapeHtml(tier.promise)}</p><ul>${tier.featureGroups.slice(0, 5).map((feature) => `<li>${escapeHtml(feature.replaceAll('-', ' '))}</li>`).join('')}</ul>${paths.length ? `<p class="eon-key-muted"><strong>Individual EONKEY alternatives:</strong> ${paths.map((item) => escapeHtml(item.label)).join(' · ')}</p>` : ''}</article>`;
}

function renderKey(key) {
  const unlocks = getEonUnlockMenu({ keyType: key.id }).slice(0, 8);
  return `<article class="eon-key-card"><p class="eon-key-kicker">${escapeHtml(key.label)}</p><h2>${escapeHtml(key.earnedBy.replaceAll('-', ' '))}</h2><p>${escapeHtml(key.summary)}</p><ul>${unlocks.map((unlock) => `<li>${escapeHtml(unlock.label)}</li>`).join('')}</ul></article>`;
}

function renderMatrix(row) {
  return `<article class="eon-key-card"><p class="eon-key-kicker">${escapeHtml(row.countsAs)}</p><h2>${escapeHtml(row.label)}</h2><p>${escapeHtml(row.trigger)}</p><p><strong>Inviter:</strong> ${escapeHtml((row.inviterReward || []).join(' · ') || 'No reward')}</p>${row.inviteeReward ? `<p><strong>Invitee:</strong> ${escapeHtml(row.inviteeReward.join(' · ') || 'No reward')}</p>` : ''}</article>`;
}

function sumAvailable(balances = {}) {
  return ['signal', 'builder', 'power', 'sponsor'].reduce((total, key) => total + Number(balances?.available?.[key] || 0), 0);
}

function renderAccountStatus(status = {}) {
  const account = status.account;
  if (!status.active) {
    return `<article class="eon-key-card"><p class="eon-key-kicker">Rollout status</p><h2>Sharing active · grants disabled</h2><p>The minimal referral ledger is coded but not enabled in this deployment. Set <code>EON_REFERRAL_ROLLOUT=testing</code> or <code>production</code> with the dedicated <code>EON_REFERRALS_DB</code> binding. The existing Cloudflare database named <code>EONAPP_REFERRALS_DB</code> is used; no new database or secret is required.</p></article>`;
  }
  if (!status.signedIn) {
    return `<article class="eon-key-card"><p class="eon-key-kicker">Programme active</p><h2>Sign in to earn or redeem</h2><p>Signed links still work for ordinary sharing while signed out. Sign in before sharing to attach your referral identity and receive eligible EONKEYS.</p><p><a class="eon-key-action" href="/api/auth/google/start?returnTo=/eon-keys">Sign in with Google</a></p></article>`;
  }
  const identity = account?.referralIdentity;
  const incoming = account?.incomingInvite;
  const balances = account?.balances || {};
  const w629 = buildReferralUxModel(status);
  return `<article class="eon-key-card"><p class="eon-key-kicker">Your referral account</p><h2>${identity ? 'Invite identity attached' : 'Ready to attach your invite identity'}</h2><p>${identity ? `Referral identity ${escapeHtml(identity.referralId)} is server-bound to this signed-in account.` : 'Create and register one signed invite identity. The public link remains self-contained; only the account relationship is stored.'}</p><p><strong>Incoming invite:</strong> ${escapeHtml(incoming?.status || 'none')}</p><p><strong>Available keys:</strong> ${Number(balances?.available?.signal || 0)} Signal · ${Number(balances?.available?.builder || 0)} Builder · ${Number(balances?.available?.power || 0)} Power · ${Number(balances?.available?.sponsor || 0)} Sponsor</p><p><strong>Lifecycle:</strong> ${w629.counts.pending} pending · ${w629.counts.available} available · ${w629.counts.consumed} consumed · ${w629.counts.revoked} revoked</p><div class="eon-key-actions"><button type="button" data-eon-key-register>${identity ? 'Verify this device identity' : 'Register my invite identity'}</button><button type="button" data-eon-key-accept ${readPendingReferralToken() ? '' : 'disabled'}>Accept saved signed invite</button></div><p class="eon-key-muted">A click or share never grants a key. A low-value Signal Key requires a signed-in invitee plus one useful activation milestone and is capped at five per inviter per month.</p></article>`;
}

function renderGrowthMetrics(status = {}) {
  const metrics = status.account?.growthMetrics;
  if (!status.active || !status.signedIn || !metrics) return '<p class="eon-key-muted">Sign in after rollout to see verified sharing progress.</p>';
  return `<div class="eon-key-grid">
    <article class="eon-key-card"><p class="eon-key-kicker">Accepted</p><h2>${Number(metrics.acceptedInvites || 0)}</h2><p>Signed-in people who accepted your verified invite.</p></article>
    <article class="eon-key-card"><p class="eon-key-kicker">Activated</p><h2>${Number(metrics.activatedInvites || 0)}</h2><p>Invitees who completed a useful first milestone.</p></article>
    <article class="eon-key-card"><p class="eon-key-kicker">Retention pending</p><h2>${Number(metrics.paidPending || 0)}</h2><p>Paid referrals still inside the 14-day qualification window.</p></article>
    <article class="eon-key-card"><p class="eon-key-kicker">Retained</p><h2>${Number(metrics.paidRetained || 0)}</h2><p>Paid referrals that completed the retention rule.</p></article>
  </div><p class="eon-key-muted">Progress is calculated only from accepted invites and verified milestones. EONAPP does not track clicks, impressions, social posts or ad views.</p>`;
}

function renderGrantRedemption(status = {}) {
  const account = status.account;
  const available = (account?.grants || []).filter((grant) => grant.status === 'available');
  if (!status.active || !status.signedIn) return '';
  if (!available.length) return `<article class="eon-key-card"><p class="eon-key-kicker">Redemption</p><h2>No available EONKEY yet</h2><p>Invite useful new users. Signal Keys follow a useful activation; Builder and Power Keys require retained paid referrals.</p></article>`;
  return available.map((grant) => {
    const options = getEonUnlockMenu({ keyType: grant.keyType });
    return `<article class="eon-key-card" data-eon-grant-card="${escapeHtml(grant.grantId)}"><p class="eon-key-kicker">${escapeHtml(grant.keyType)} key</p><h2>Choose one individual unlock</h2><p>${escapeHtml(grant.reason || 'verified referral milestone')}</p><label><span>Unlock</span><select data-eon-key-unlock>${options.map((unlock) => `<option value="${escapeHtml(unlock.id)}">${escapeHtml(unlock.label)}</option>`).join('')}</select></label><p><button type="button" data-eon-key-redeem="${escapeHtml(grant.grantId)}">Redeem this key</button></p></article>`;
  }).join('');
}

function renderDigitalRewards(status = {}) {
  const rewards = status.account?.digitalRewards || [];
  if (!status.active || !status.signedIn) return '';
  if (!rewards.length) return '<p class="eon-key-muted">No digital reward receipts yet.</p>';
  return `<ul>${rewards.map((reward) => `<li><strong>${escapeHtml(reward.code.replaceAll('-', ' '))}</strong> · ${escapeHtml(reward.status)}</li>`).join('')}</ul>`;
}

function render(status = null) {
  const root = document.querySelector('#eon-keys-root');
  if (!root) return;
  const validation = validateEonKeysCatalog();
  const resolverValidation = validateLockedFeatureResolver();
  const resolverExamples = ['project-slots-plus', 'own-api-key-workflows', 'studio-workflow-systems', 'advanced-local-ai-bundles', 'max-local-ai-workrooms'];
  const live = status || { active: false, signedIn: false, account: null };
  const keyInventory = live.account?.balances?.available || { signal: 0, builder: 0, power: 0, sponsor: 0 };
  root.innerHTML = `
    <section class="eon-key-panel eon-key-hero" aria-labelledby="eon-key-hero-title">
      <p class="eon-key-kicker">Subscriptions · referrals · voluntary Sponsor Keys</p>
      <h1 id="eon-key-hero-title">Share useful work. Unlock more EONAPP.</h1>
      <p>EONAPP keeps ordinary display advertising disabled across Free, guest and paid product surfaces. Eligible referrals can earn referral EONKEYS, and signed-in users may voluntarily earn one consumable Sponsor Key from a qualifying rewarded Sponsor Terminal completion. Sponsor Keys unlock only short, bounded EONAPP feature access.</p>
      <p><strong>No subscription replacement:</strong> EONKEYS never create cash value, renewal credit, provider credit or a whole-plan entitlement. Sponsor Keys are consumable and temporary; meaningful feature sessions may require several verified rewarded videos.</p>
      <p><strong>AI cost boundary:</strong> ${escapeHtml(EON_AI_COST_BOUNDARY.statement)}</p>
      <p class="eon-key-status" data-eon-key-catalog-status="${validation.ok ? 'pass' : 'fail'}">Source contract: ${validation.ok ? 'valid' : validation.errors.map(escapeHtml).join(' · ')}</p>
      <p class="eon-key-status" data-eon-referral-live-status="${live.active ? 'active' : 'pending'}">Server programme: ${live.active ? 'active in this deployment' : 'rollout-controlled'}</p>
      <p class="eon-key-status" data-eon-key-action-status role="status" aria-live="polite"></p>
    </section>
    <section class="eon-key-panel" aria-labelledby="eon-key-account-title"><h2 id="eon-key-account-title">Your EONKEY account</h2><div class="eon-key-grid">${renderAccountStatus(live)}</div></section>
    <section class="eon-key-panel" aria-labelledby="eon-key-progress-title"><h2 id="eon-key-progress-title">Verified sharing progress</h2>${renderGrowthMetrics(live)}</section>
    <section class="eon-key-panel" aria-labelledby="eon-key-redeem-title"><h2 id="eon-key-redeem-title">Use an earned key</h2><p>Referral keys unlock their listed item. Sponsor Keys are spent in bundles for short feature sessions on the <a href="/rewards">Sponsor Terminal</a>. No key can become cash, a subscription or provider credit.</p><div class="eon-key-grid">${renderGrantRedemption(live)}</div></section>
    <section class="eon-key-panel" aria-labelledby="eon-key-rewards-title"><h2 id="eon-key-rewards-title">Digital reward receipts</h2>${renderDigitalRewards(live)}</section>
    <section class="eon-key-panel" aria-labelledby="eon-key-tiers-title"><h2 id="eon-key-tiers-title">Subscription plans and individual EONKEY alternatives</h2><p>A subscription includes its complete plan catalogue. EONKEYS unlock only the exact individual item listed; they do not recreate the full plan.</p><div class="eon-key-grid">${getEonSubscriptionTiers().map(renderTier).join('')}</div></section>
    <section class="eon-key-panel" aria-labelledby="eon-key-types-title"><h2 id="eon-key-types-title">EONKEY types</h2><div class="eon-key-grid">${getEonKeyTypes().map(renderKey).join('')}</div></section>
    <section class="eon-key-panel" aria-labelledby="eon-key-matrix-title"><h2 id="eon-key-matrix-title">Verified referral reward path</h2><div class="eon-key-grid">${getEonReferralRewardMatrix().map(renderMatrix).join('')}</div><p class="eon-key-muted">Rewarded video is a separate voluntary path: each qualifying server-validated Sponsor Terminal completion grants one Sponsor Key. <a href="/rewards">Open Sponsor Terminal</a>.</p></section>
    <section class="eon-key-panel" aria-labelledby="eon-key-locked-title"><h2 id="eon-key-locked-title">Unlock language</h2><ul>${Object.values(EON_LOCKED_FEATURE_UNLOCK_COPY).map((copy) => `<li>${escapeHtml(copy)}</li>`).join('')}</ul><p class="eon-key-muted">The browser never grants itself keys. The server ledger controls identity association, qualification, grants, reversals and redemption.</p></section>
    <section class="eon-key-panel" aria-labelledby="eon-key-resolver-title"><h2 id="eon-key-resolver-title">Locked feature resolver examples</h2><p>Every premium gate offers a clear choice: subscribe, start the seven-day trial, review referrals, or use an eligible earned key.</p><div class="eon-key-lock-grid">${resolverExamples.map((id) => renderLockedFeatureCta(id, { keyInventory, checkoutActive: true, referralGrantsActive: live.active, keyRedemptionActive: live.active && sumAvailable(live.account?.balances) > 0 })).join('')}</div><p class="eon-key-muted">Resolver catalogue covers ${EON_LOCKED_FEATURES.length} premium locked-feature examples. Locked feature contract: ${resolverValidation.ok ? 'valid' : resolverValidation.errors.map(escapeHtml).join(' · ')}.</p></section>`;
  bindActions(root);
}

function setActionStatus(message = '', kind = '') {
  const node = document.querySelector('[data-eon-key-action-status]');
  if (!node) return;
  node.textContent = message;
  node.dataset.state = kind;
}

async function refresh(message = '') {
  const status = await fetchReferralStatus({ force: true });
  render(status);
  if (message) setActionStatus(message, 'success');
}

function bindActions(root) {
  root.querySelector('[data-eon-key-register]')?.addEventListener('click', async () => {
    setActionStatus('Creating and registering your signed invite identity…');
    try {
      const invite = await createSignedShareLink({ destination: '/', source: 'eon-keys', missionType: 'share_eonapp' });
      const response = await bindReferralIdentityFromInvite(invite.token);
      if (!response.ok) throw new Error(response.result?.status || response.error || 'identity_registration_failed');
      await refresh('Invite identity registered. New signed links from this browser can now attribute eligible milestones to your account.');
    } catch (error) {
      setActionStatus(`Could not register identity: ${String(error?.message || error)}`, 'error');
    }
  });
  root.querySelector('[data-eon-key-accept]')?.addEventListener('click', async () => {
    setActionStatus('Accepting the saved signed invite…');
    const response = await enrollPendingReferral();
    if (!response.ok) {
      setActionStatus(`Invite was not accepted: ${String(response.result?.status || response.error || 'unavailable')}`, 'error');
      return;
    }
    await refresh('Invite accepted. Save your first useful project to qualify the one-time activation milestone.');
  });
  root.querySelectorAll('[data-eon-key-redeem]').forEach((button) => {
    button.addEventListener('click', async () => {
      const card = button.closest('[data-eon-grant-card]');
      const unlockId = card?.querySelector('[data-eon-key-unlock]')?.value || '';
      button.disabled = true;
      setActionStatus('Redeeming this EONKEY through the server ledger…');
      const response = await redeemEonKey(button.dataset.eonKeyRedeem || '', unlockId);
      if (!response.ok) {
        button.disabled = false;
        setActionStatus(`Redemption failed: ${String(response.result?.status || response.error || 'unavailable')}`, 'error');
        return;
      }
      await refresh(`Unlocked: ${response.result?.unlock?.label || unlockId}.`);
    });
  });
}

async function boot() {
  render();
  const status = await fetchReferralStatus({ force: true });
  installW629VaultRevealMigration({ serverRewards: status?.account?.digitalRewards || [] });
  render(status);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => void boot(), { once: true });
else void boot();
