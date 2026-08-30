import { EON_REWARD_PRIMARY_PROVIDER, EON_REWARD_RULES } from './eon-reward-policy.js';

const root = document.getElementById('eon-rewards-root');
const freeze = (value) => Object.freeze(value);
let config = null;
let status = null;
let busy = false;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function surfaceFromLocation() {
  const raw = new URL(location.href).searchParams.get('surface') || 'rewards';
  return String(raw).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'rewards';
}

function timestamp(value = 0) {
  const number = Number(value || 0);
  if (!number) return '';
  try { return new Date(number).toLocaleString(); } catch { return ''; }
}

function duration(minutes = 0) {
  const value = Math.max(0, Number(minutes || 0));
  if (value < 60) return `${value} min`;
  if (value % 60 === 0) return `${value / 60} hr${value === 60 ? '' : 's'}`;
  return `${Math.floor(value / 60)}h ${value % 60}m`;
}

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...options });
  const body = await response.json().catch(() => ({}));
  return freeze({ response, body });
}

function signInCard() {
  return `<section class="eon-reward-card eon-reward-signin"><p class="eon-hub-kicker">Signed-in reward authority</p><h2>Sign in to use Sponsored Missions</h2><p>MyLead mission credit is attached only to an authenticated EONAPP account through opaque server-generated identifiers. Browser returns, iframe closes, clicks and redirects never create EONKEYS.</p><a class="eon-hub-primary" href="/api/auth/google/start?returnTo=${encodeURIComponent('/rewards')}">Sign in with Google</a></section>`;
}

function missionCard() {
  const provider = config?.providers?.find?.((entry) => entry.id === EON_REWARD_PRIMARY_PROVIDER) || {};
  const available = provider.available === true;
  return `<section class="eon-reward-card eon-reward-mission" aria-labelledby="eon-sponsored-mission-title">
    <div class="eon-reward-head"><div><p class="eon-hub-kicker">Primary voluntary reward lane</p><h2 id="eon-sponsored-mission-title">MyLead Sponsored Missions</h2><p>Open the external OfferWall only when you want extra EONKEYS. EONAPP credits the exact virtual amount reported by a trusted MyLead server postback after an approved conversion.</p></div><span class="eon-reward-chip">${available ? 'Available' : 'Not configured'}</span></div>
    <div class="eon-reward-truth"><strong>Reward truth</strong><span>Closing the OfferWall, returning to EONAPP, a JavaScript callback, an ad click, or ordinary video playback cannot mint EONKEYS.</span></div>
    <label class="eon-reward-consent"><input type="checkbox" data-eon-reward-consent ${available ? '' : 'disabled'}><span>I understand offers open on a third-party MyLead page and EONAPP rewards only after MyLead's server confirms the conversion.</span></label>
    <button type="button" class="eon-hub-primary" data-eon-open-mylead ${available ? '' : 'disabled'}>Open Sponsored Missions</button>
    <p class="eon-reward-status" data-eon-mission-status>${available ? 'No private chat history, Local AI/BYOK answer, files, memory, email or provider keys are sent in the OfferWall URL.' : 'MyLead is fail-closed in this deployment until its server configuration is complete.'}</p>
  </section>`;
}

function walletCard() {
  const balance = Number(status?.balance || 0);
  const debt = Math.max(0, Number(status?.debt || 0));
  const debtCopy = debt > 0
    ? `<p class="eon-reward-debt"><strong>Reward adjustment: -${debt} EONKEYS.</strong> New Sponsored Mission credits repay this adjustment first. You cannot redeem while the balance is below the required price.</p>`
    : '<p class="eon-reward-muted">EONKEYS are non-cash, non-transferable software unlock credits. They are not a USD balance.</p>';
  return `<section class="eon-reward-card eon-reward-wallet"><div class="eon-reward-head"><div><p class="eon-hub-kicker">Server ledger</p><h2>Your EONKEY balance</h2></div><div class="eon-reward-balance"><strong>${balance}</strong><span>EONKEYS</span></div></div>${debtCopy}</section>`;
}

function activeMap() {
  return new Map((Array.isArray(status?.activeUnlocks) ? status.activeUnlocks : []).map((entry) => [String(entry.unlockId || ''), entry]));
}

function unlockCards() {
  const unlocks = Array.isArray(config?.unlocks) ? config.unlocks : [];
  const balance = Number(status?.balance || 0);
  const active = activeMap();
  return `<section class="eon-reward-card"><div><p class="eon-hub-kicker">Bounded software unlocks</p><h2>Spend EONKEYS on temporary EONAPP capability</h2><p>Hosted inference is not included. Local/BYOK workflows still use your local runtime or your own provider key where applicable.</p></div><div class="eon-reward-grid">${unlocks.map((unlock) => {
    const current = active.get(String(unlock.id || ''));
    const cost = Number(unlock.eonkeys || 0);
    const enough = balance >= cost;
    const disabled = busy || Boolean(current) || !enough;
    const label = current ? `Active until ${timestamp(current.expiresAt)}` : enough ? `Use ${cost} EONKEYS` : `Need ${Math.max(0, cost - balance)} more`;
    return `<article class="eon-reward-unlock"><div><strong>${escapeHtml(unlock.label || unlock.id)}</strong><span>${cost} EONKEYS · ${escapeHtml(duration(unlock.durationMinutes))}</span></div><p>Temporary feature access only. No subscription tier, cash, discount, provider credit or unlimited hosted AI is created.</p><button type="button" data-eon-redeem="${escapeHtml(unlock.id)}" ${disabled ? 'disabled' : ''}>${escapeHtml(label)}</button>${current && unlock.route ? `<a href="${escapeHtml(unlock.route)}">Open feature</a>` : ''}</article>`;
  }).join('')}</div></section>`;
}

function historyCard() {
  const history = Array.isArray(status?.history) ? status.history : [];
  return `<section class="eon-reward-card"><div><p class="eon-hub-kicker">Reward history</p><h2>Server-authoritative ledger</h2></div>${history.length ? `<div class="eon-reward-history">${history.map((entry) => {
    const amount = Number(entry.amount || 0);
    const signed = amount > 0 ? `+${amount}` : `${amount}`;
    return `<article><div><strong>${escapeHtml(entry.type || 'event')}</strong><span>${escapeHtml(timestamp(entry.createdAt))}</span></div><b>${escapeHtml(signed)} EONKEYS</b><small>${escapeHtml(entry.provider || 'eonapp')} · ${escapeHtml(entry.reason || '')}</small></article>`;
  }).join('')}</div>` : '<p class="eon-reward-muted">No Sponsored Mission credits or redemptions are recorded yet.</p>'}</section>`;
}

function render() {
  if (!root) return;
  if (!config || !status) {
    root.innerHTML = '<section class="eon-reward-card"><p>Loading server reward authority…</p></section>';
    return;
  }
  root.innerHTML = `${walletCard()}${missionCard()}${unlockCards()}${historyCard()}<section class="eon-reward-card eon-reward-boundary"><p class="eon-hub-kicker">Privacy & fairness boundary</p><h2>Sponsored Missions do not change normal EONAPP access</h2><p>Skipping, declining or receiving no suitable offer does not remove normal Free, Local AI, BYOK or EON City access. Paid accounts remain ad-free by default; Sponsored Missions are a separate voluntary action. ${EON_REWARD_RULES.browserCanMint ? '' : 'The browser has no mint authority.'}</p></section>`;
  bind();
}

function setMissionStatus(message) {
  const node = root?.querySelector?.('[data-eon-mission-status]');
  if (node) node.textContent = String(message || '');
}

async function refresh() {
  try {
    const [configResult, statusResult] = await Promise.all([jsonFetch('/api/rewards/config'), jsonFetch('/api/rewards')]);
    if (configResult.response.status === 401 || statusResult.response.status === 401) {
      root.innerHTML = signInCard();
      return;
    }
    config = configResult.body;
    status = statusResult.body;
    if (!configResult.response.ok || !statusResult.response.ok) throw new Error(configResult.body?.error || statusResult.body?.status || 'reward_authority_unavailable');
    render();
  } catch (error) {
    root.innerHTML = `<section class="eon-reward-card"><p class="eon-hub-kicker">Reward authority unavailable</p><h2>Sponsored Missions are temporarily unavailable</h2><p>${escapeHtml(error?.message || 'The server reward ledger could not be reached.')}</p><p>Normal EONAPP, Local AI, BYOK and EON City access are unaffected.</p></section>`;
  }
}

async function openMyLead() {
  if (busy) return;
  const consent = root?.querySelector?.('[data-eon-reward-consent]');
  if (!consent?.checked) {
    setMissionStatus('Please review and accept the external Sponsored Mission disclosure first.');
    return;
  }
  const popup = window.open('about:blank', '_blank');
  if (popup) { try { popup.opener = null; } catch {} }
  busy = true;
  setMissionStatus('Creating a private mission correlation…');
  try {
    const { response, body } = await jsonFetch('/api/rewards/launch', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ provider: 'mylead', surface: surfaceFromLocation() })
    });
    if (!response.ok || !body?.offerwallUrl) throw new Error(body?.status || body?.error || 'mission_launch_failed');
    if (popup) popup.location.replace(body.offerwallUrl);
    else {
      const fallback = window.open(body.offerwallUrl, '_blank');
      if (fallback) { try { fallback.opener = null; } catch {} }
    }
    setMissionStatus('Sponsored Missions opened. Returning to this page does not create a reward; refresh after MyLead confirms a conversion server-to-server.');
  } catch (error) {
    try { popup?.close?.(); } catch {}
    setMissionStatus(`Sponsored Missions could not open: ${error?.message || 'unavailable'}.`);
  } finally {
    busy = false;
  }
}

async function redeem(unlockId) {
  if (busy) return;
  busy = true;
  render();
  try {
    const { response, body } = await jsonFetch('/api/rewards', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ action: 'redeem', unlockId })
    });
    if (!response.ok || !body?.ok) throw new Error(body?.status || body?.error || 'reward_redemption_failed');
    await refresh();
  } catch (error) {
    busy = false;
    render();
    setMissionStatus(`Redemption was not completed: ${error?.message || 'unavailable'}.`);
  }
}

function bind() {
  root?.querySelector?.('[data-eon-open-mylead]')?.addEventListener('click', () => void openMyLead());
  for (const button of root?.querySelectorAll?.('[data-eon-redeem]') || []) {
    button.addEventListener('click', () => void redeem(button.getAttribute('data-eon-redeem') || ''));
  }
}

if (root) void refresh();
