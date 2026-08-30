import { fetchMonetizationStatus, readDisplayAdConsent, setDisplayAdConsent } from '../monetization/eon-monetization-client.js';
import { bindEonSponsorTerminal, buildSponsorTerminalPresentation } from '../monetization/eon-sponsor-terminal.js';
import { getPublicProductScopeSummary } from '../product/eonapp-product-scope.js';

const freeze = (value) => Object.freeze(value);
let rewardRefreshBound = false;
let redeemingUnlockId = '';

const SPONSOR_FEATURE_TOOLS = Object.freeze({
  'plus-template-library': Object.freeze({
    title: 'Premium template session',
    route: '/projects',
    action: 'Open Projects',
    starter: 'PROJECT LAUNCH TEMPLATE\nOutcome:\nAudience:\nConstraints:\nMilestones:\nNext reviewed action:\nSuccess check:'
  }),
  'plus-workflow-packs': Object.freeze({
    title: 'Workflow pack session',
    route: '/workspace',
    action: 'Open Workspace',
    starter: 'WORKFLOW PACK\n1. Define the outcome.\n2. Collect only the required inputs.\n3. Draft locally.\n4. Review every external action.\n5. Save the approved result to the project.'
  }),
  'local-ai-guided-workflows': Object.freeze({
    title: 'Guided Local/BYOK AI session',
    route: '/local-ai',
    action: 'Open Local AI',
    starter: 'LOCAL/BYOK AI CHECKLIST\n1. Choose LM Studio, Ollama, Jan or your own provider.\n2. Confirm the model is available.\n3. Send a harmless test prompt.\n4. Verify streaming/cancel/reconnect.\n5. Keep provider keys outside rewarded access.'
  }),
  'studio-dashboard': Object.freeze({
    title: 'Studio dashboard session',
    route: '/workspace',
    action: 'Open Workspace',
    starter: 'STUDIO DASHBOARD REVIEW\nActive projects:\nPriority output:\nCreator queue:\nReusable asset:\nNext approval:\nCompletion signal:'
  }),
  'creator-preset-packs': Object.freeze({
    title: 'Creator preset session',
    route: '/create',
    action: 'Open Create',
    starter: 'CREATOR PRESET\nFormat: launch post\nGoal:\nAudience:\nHook:\nProof:\nCall to action:\nTone: concise, credible, specific'
  }),
  'power-automation-packs': Object.freeze({
    title: 'Power automation pack session',
    route: '/automations',
    action: 'Open Automations',
    starter: 'AUTOMATION BLUEPRINT\nTrigger:\nInputs:\nLocal draft step:\nReview checkpoint:\nApproved external action:\nFailure fallback:\nReceipt:'
  })
});

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function formatMinutes(minutes = 0) {
  const value = Math.max(0, Math.floor(Number(minutes) || 0));
  if (value < 60) return `${value} min`;
  if (value % 60 === 0) return `${value / 60} hr${value === 60 ? '' : 's'}`;
  return `${Math.floor(value / 60)}h ${value % 60}m`;
}

function formatTimestamp(timestamp = 0) {
  const value = Number(timestamp || 0);
  if (!value) return '';
  try { return new Date(value).toLocaleString(); } catch { return ''; }
}

async function fetchSponsorRewardStatus() {
  try {
    const response = await globalThis.fetch('/api/monetization/rewarded', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { accept: 'application/json' }
    });
    const body = await response.json().catch(() => ({}));
    return freeze({ ...body, httpOk: response.ok, httpStatus: response.status });
  } catch {
    return freeze({ ok: false, status: 'reward_status_unavailable', httpOk: false, httpStatus: 0, availableKeys: 0, unlocks: [], activeUnlocks: [] });
  }
}

async function redeemSponsorUnlock(unlockId = '') {
  const id = String(unlockId || '').trim();
  if (!id || redeemingUnlockId) return freeze({ ok: false, status: 'redemption_busy' });
  redeemingUnlockId = id;
  try {
    const response = await globalThis.fetch('/api/monetization/rewarded', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ action: 'redeem', unlockId: id })
    });
    const body = await response.json().catch(() => ({}));
    return freeze({ ...body, httpOk: response.ok, httpStatus: response.status });
  } catch {
    return freeze({ ok: false, status: 'reward_redemption_unavailable', httpOk: false, httpStatus: 0 });
  } finally {
    redeemingUnlockId = '';
  }
}

function activeUnlockMap(rewardStatus = {}) {
  return new Map((Array.isArray(rewardStatus?.activeUnlocks) ? rewardStatus.activeUnlocks : [])
    .map((unlock) => [String(unlock?.unlockId || ''), unlock])
    .filter(([id]) => Boolean(id)));
}


function renderActiveSponsorFeatureTools(rewardStatus = {}) {
  const active = Array.isArray(rewardStatus?.activeUnlocks) ? rewardStatus.activeUnlocks : [];
  const cards = active.map((unlock) => {
    const tool = SPONSOR_FEATURE_TOOLS[String(unlock?.featureGroup || '')];
    if (!tool) return '';
    return `<article class="eon-sponsor-feature-tool" data-eon-sponsor-feature="${escapeHtml(unlock.featureGroup || '')}"><div><strong>${escapeHtml(tool.title)}</strong><span>${unlock.expiresAt ? `Available until ${escapeHtml(formatTimestamp(unlock.expiresAt))}` : 'Available during this Sponsor session'}</span></div><pre>${escapeHtml(tool.starter)}</pre><div class="eon-sponsor-feature-actions"><button type="button" data-eon-sponsor-copy="${escapeHtml(unlock.featureGroup || '')}">Copy starter</button><a class="eon-market-secondary" href="${escapeHtml(tool.route)}">${escapeHtml(tool.action)}</a></div></article>`;
  }).filter(Boolean).join('');
  if (!cards) return '';
  return `<section class="eon-sponsor-feature-session" aria-labelledby="eon-sponsor-feature-session-title"><div><p class="eon-hub-kicker">Active feature access</p><h3 id="eon-sponsor-feature-session-title">Your redeemed EONAPP sessions are usable now</h3><p>These tools exist only while the signed server entitlement is active. Copy a starter or open the matching EONAPP workspace before the session expires.</p></div><div class="eon-sponsor-feature-grid">${cards}</div></section>`;
}

function renderRewardWallet(rewardStatus = {}, signedIn = false) {
  if (!signedIn) {
    return `<section class="eon-sponsor-wallet" aria-labelledby="eon-sponsor-wallet-title"><div><p class="eon-hub-kicker">Sponsor Key wallet</p><h3 id="eon-sponsor-wallet-title">Small, consumable access rewards</h3><p>Sign in to collect Sponsor Keys from qualifying rewarded videos and spend them on short EONAPP feature sessions.</p></div><a class="eon-market-secondary" href="/api/auth/google/start?returnTo=${encodeURIComponent('/rewards')}">Sign in</a></section>`;
  }

  const availableKeys = Math.max(0, Number(rewardStatus?.availableKeys || 0));
  const completedToday = Math.max(0, Number(rewardStatus?.completedToday || 0));
  const dailyCap = Math.max(0, Number(rewardStatus?.dailyCap || 0));
  const cooldownUntil = Number(rewardStatus?.cooldownUntil || 0);
  const active = activeUnlockMap(rewardStatus);
  const unlocks = Array.isArray(rewardStatus?.unlocks) ? rewardStatus.unlocks : [];
  const runtimeReady = rewardStatus?.active === true;
  const canStart = rewardStatus?.canStart === true;
  const cooldownCopy = cooldownUntil > Date.now() ? `Next rewarded view after ${escapeHtml(formatTimestamp(cooldownUntil))}.` : 'No reward cooldown is active.';

  return `<section class="eon-sponsor-wallet" aria-labelledby="eon-sponsor-wallet-title">
    <div class="eon-sponsor-wallet-head"><div><p class="eon-hub-kicker">Sponsor Key wallet</p><h3 id="eon-sponsor-wallet-title">${availableKeys} Sponsor Key${availableKeys === 1 ? '' : 's'} available</h3><p>One qualifying completed video adds exactly one consumable Sponsor Key. Keys have no cash value and never become subscription time or hosted-AI credit.</p></div><div class="eon-sponsor-wallet-meter"><strong>${completedToday}/${dailyCap || '—'}</strong><span>rewarded videos today</span></div></div>
    <p class="eon-reward-status">${escapeHtml(runtimeReady ? (canStart ? 'Rewarded video is ready.' : cooldownCopy) : 'Rewarded video runtime is not ready in this deployment. Existing Sponsor Keys and active unlocks remain readable.')}</p>
    ${active.size ? `<div class="eon-sponsor-active"><h4>Active Sponsor unlocks</h4><div class="eon-sponsor-active-grid">${[...active.values()].map((unlock) => `<article><strong>${escapeHtml(unlock.featureGroup || unlock.unlockId)}</strong><span>${unlock.expiresAt ? `Until ${escapeHtml(formatTimestamp(unlock.expiresAt))}` : 'Active'}</span></article>`).join('')}</div></div>` : ''}
    <div class="eon-sponsor-unlock-grid" aria-label="Sponsor Key unlock menu">${unlocks.map((unlock) => {
      const cost = Math.max(1, Number(unlock?.keysRequired || 1));
      const activeUnlock = active.get(String(unlock?.id || ''));
      const enough = availableKeys >= cost;
      const disabled = Boolean(activeUnlock) || !enough || redeemingUnlockId === String(unlock?.id || '');
      const buttonLabel = activeUnlock ? 'Active' : enough ? `Use ${cost} key${cost === 1 ? '' : 's'}` : `Need ${cost - availableKeys} more`;
      return `<article class="eon-sponsor-unlock-card" data-eon-sponsor-unlock-card="${escapeHtml(unlock?.id || '')}"><div><strong>${escapeHtml(unlock?.label || unlock?.id || 'Sponsor unlock')}</strong><span>${cost} video${cost === 1 ? '' : 's'} · ${escapeHtml(formatMinutes(unlock?.durationMinutes || 0))}</span></div><p>${escapeHtml(unlock?.requiresUserLocalOrOwnProviderKey ? 'Unlocks EONAPP workflow capability only; your local runtime or own provider key still pays the AI execution cost.' : 'Temporary EONAPP feature access. No subscription tier or cash value is created.')}</p><button type="button" data-eon-sponsor-redeem="${escapeHtml(unlock?.id || '')}"${disabled ? ' disabled' : ''}>${escapeHtml(buttonLabel)}</button></article>`;
    }).join('')}</div>
  </section>`;
}

function redemptionMessage(result = {}) {
  if (result?.ok) {
    const unlock = result?.unlock || {};
    return `${unlock.label || 'Sponsor unlock'} is active${unlock.expiresAt ? ` until ${formatTimestamp(unlock.expiresAt)}` : ''}. ${Number(result.availableKeys || 0)} Sponsor Keys remain.`;
  }
  if (result?.status === 'insufficient_keys') return `Not enough Sponsor Keys. ${Number(result.missingKeys || 0)} more required.`;
  if (result?.status === 'unlock_already_active') return 'That Sponsor unlock is already active.';
  if (result?.status === 'login_required') return 'Sign in before redeeming Sponsor Keys.';
  return 'Sponsor Key redemption could not be completed. No key or access was changed.';
}

async function renderSponsoredExperienceStatus({ message = '' } = {}) {
  const host = document.getElementById('eon-rewards-root');
  if (!host) return;
  const scope = getPublicProductScopeSummary();
  const status = await fetchMonetizationStatus({ force: true, environment: globalThis });
  const signedIn = status?.signedIn === true;
  const rewardStatus = signedIn ? await fetchSponsorRewardStatus() : freeze({ ok: false, status: 'login_required', availableKeys: 0, unlocks: [], activeUnlocks: [] });
  const terminal = buildSponsorTerminalPresentation(status);
  const sponsorConsent = readDisplayAdConsent(globalThis);
  const terminalAction = terminal.available && sponsorConsent.state === 'allowed'
    ? `<button type="button" data-eon-sponsor-terminal-start>${escapeHtml(terminal.label || 'Watch sponsor video')}</button>`
    : terminal.available
      ? '<button type="button" data-eon-sponsor-consent>Allow sponsored content</button>'
      : terminal.reason === 'sign_in_required'
        ? `<a href="/api/auth/google/start?returnTo=${encodeURIComponent('/rewards')}">Sign in for Sponsor Terminal</a>`
        : '<button type="button" disabled>Sponsor video unavailable</button>';

  host.innerHTML = `<section class="eon-reward-status-shell" aria-labelledby="sponsored-experiences-title">
    <p class="eon-hub-kicker">Production monetization surface</p>
    <h2 id="sponsored-experiences-title">Ads, rewarded video and paid access stay separate</h2>
    <p>Ordinary display advertising is disabled across EONAPP and EON City. The Sponsor Terminal is a separate, explicit and voluntary rewarded experience for signed-in users and never rewards ordinary impressions or clicks.</p>
    <div class="eon-reward-rule-grid">
      <article><strong>Ordinary display ads</strong><span>Disabled across EONAPP and EON City. No banner, native or outstream display placement is part of the RT96 product experience.</span></article>
      <article><strong>Rewarded Sponsor Terminal</strong><span>A signed-in user explicitly starts the ExoClick VAST flow. A qualifying server-validated completion adds exactly 1 Sponsor Key.</span></article>
      <article><strong>Sponsor Keys</strong><span>Consumable access credits only. One or several videos unlock short feature sessions; no video grants a paid tier, cash, provider credit or platform-funded AI.</span></article>
      <article><strong>Paid accounts</strong><span>Paid access remains ordinary-display-free. A paid user may voluntarily open Sponsor Terminal without enabling display ads elsewhere.</span></article>
    </div>
    ${renderRewardWallet(rewardStatus, signedIn)}
    ${renderActiveSponsorFeatureTools(rewardStatus)}
    <section class="eon-sponsor-terminal" data-eon-sponsor-terminal data-eon-sponsor-surface="rewards" aria-labelledby="eon-sponsor-terminal-title">
      <div class="eon-sponsor-terminal-head"><div><p class="eon-hub-kicker">ExoClick · voluntary rewarded VAST</p><h3 id="eon-sponsor-terminal-title">Sponsor Terminal</h3><p>Start only when you choose to watch. Third-party sponsored content is contacted only after your explicit consent. Reward issuance is server-authoritative and duplicate/replay protected.</p></div><div>${terminalAction}</div></div>
      <p class="eon-sponsor-disclosure"><strong>Reward:</strong> ${escapeHtml(terminal.rewardDisclosure || 'Rewarded Sponsor Terminal is unavailable in this deployment.')}</p>
      <p class="eon-sponsor-status" data-eon-sponsor-terminal-status role="status" aria-live="polite">${escapeHtml(message || (terminal.available && sponsorConsent.state === 'allowed' ? (terminal.rewardsEnabled ? 'Sponsor Terminal ready. Complete a qualifying video to earn 1 Sponsor Key.' : 'Sponsor video is available, but Sponsor Key issuance is not ready.') : terminal.available ? 'Sponsor Terminal requires your sponsored-content consent before ExoClick is contacted.' : terminal.reason === 'sign_in_required' ? 'Sign in to use Sponsor Terminal.' : 'Sponsor video is unavailable in this deployment.'))}</p>
      <div class="eon-sponsor-player" data-eon-sponsor-terminal-player></div>
    </section>
    <p class="eon-reward-status" role="status">Monetization: ${escapeHtml(status.reason || 'status unavailable')} · ordinary display provider: ${escapeHtml(status.display?.provider || 'none')} · rewarded verifier: ${escapeHtml(status.rewarded?.verificationMode || 'unavailable')}.</p>
    <p class="eon-reward-status">Product scope: ${scope.retiredCapabilityCount} retired commercial/value capabilities; optional Telegram remains help and updates only.</p>
    <div class="eon-market-actions"><a class="eon-market-secondary" href="/billing">View all plans</a><a class="eon-market-secondary" href="/eon-keys">EONKEYs</a><a class="eon-market-secondary" href="/privacy">Advertising privacy</a><a class="eon-market-secondary" href="/help">Support</a><a class="eon-market-secondary" href="/">Ask EONBOT</a></div>
  </section>`;

  if (terminal.available && sponsorConsent.state === 'allowed') {
    bindEonSponsorTerminal(host.querySelector('[data-eon-sponsor-terminal]'), { environment: globalThis });
  }
  host.querySelector('[data-eon-sponsor-consent]')?.addEventListener('click', () => {
    const changed = setDisplayAdConsent('allowed', { explicitUserAction: true, environment: globalThis });
    if (changed.ok) void renderSponsoredExperienceStatus({ message: 'Sponsored-content consent saved. Sponsor Terminal is ready.' });
  }, { once: true });

  host.querySelectorAll('[data-eon-sponsor-redeem]').forEach((button) => button.addEventListener('click', async () => {
    const unlockId = button.dataset.eonSponsorRedeem || '';
    button.disabled = true;
    const result = await redeemSponsorUnlock(unlockId);
    await renderSponsoredExperienceStatus({ message: redemptionMessage(result) });
  }, { once: true }));


  host.querySelectorAll('[data-eon-sponsor-copy]').forEach((button) => button.addEventListener('click', async () => {
    const featureGroup = button.dataset.eonSponsorCopy || '';
    const tool = SPONSOR_FEATURE_TOOLS[featureGroup];
    if (!tool) return;
    try {
      await globalThis.navigator?.clipboard?.writeText?.(tool.starter);
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Copy unavailable';
    }
  }, { once: true }));

  if (!rewardRefreshBound) {
    rewardRefreshBound = true;
    globalThis.addEventListener?.('eon:sponsor-key-granted', () => {
      void renderSponsoredExperienceStatus({ message: 'Sponsor Key confirmed by the server. Wallet refreshed.' });
    });
  }
}

void renderSponsoredExperienceStatus();
