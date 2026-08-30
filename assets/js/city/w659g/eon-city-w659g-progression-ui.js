/** W659G — Productive City missions, Vault Reveals and EONKEY status panel. */
import { getEonCityProductiveRpgPlan } from '../eon-city-productive-rpg-loop.js';
import { fetchReferralStatus } from '../../referrals/eon-referral-server-client.js';
import {
  EON_CITY_W659G_COSMETIC_REWARDS,
  EON_CITY_W659G_MISSION_RULES,
  EON_CITY_W659G_REVEAL_THRESHOLD,
  EON_CITY_W659G_VERIFIED_ACTION_EVENT,
  openEonCityW659gVaultReveal,
  readEonCityW659gProgression,
  recordEonCityW659gVerifiedAction,
  selectEonCityW659gCosmetic
} from './eon-city-w659g-progression-ledger.js';

export const EON_CITY_W659G_PROGRESSION_UI_SCHEMA = 'eon.city.w659g.progression-ui.v1';
const STYLE_ID = 'eon-city-w659g-progression-style';
const escapeHtml = (value = '') => String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const sumAvailable = (status = {}) => Object.values(status?.account?.balances?.available || {}).reduce((sum, value) => sum + Number(value || 0), 0);

function ensureStyle(documentLike) {
  if (documentLike.getElementById(STYLE_ID)) return;
  const style = documentLike.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .eon-w659g-progress{position:fixed;right:18px;bottom:84px;z-index:78;font:500 13px/1.45 system-ui,sans-serif;color:#f7f8fa}
    .eon-w659g-progress>button{border:1px solid rgba(114,226,255,.45);border-radius:999px;background:rgba(7,12,19,.94);color:inherit;padding:10px 14px;box-shadow:0 12px 32px rgba(0,0,0,.35);cursor:pointer}
    /* W719.21: missions remain available from City Menu without occupying the playfield. */
    .eon-w659g-progress[data-eon-city-menu-only="true"]{position:static}.eon-w659g-progress[data-eon-city-menu-only="true"]>button{display:none}.eon-w659g-progress[data-eon-city-menu-only="true"]>.eon-w659g-panel{position:fixed;right:max(10px,calc(50vw - 195px));bottom:10vh}
    .eon-w659g-progress>button strong{color:#8be9ff}.eon-w659g-panel{position:absolute;right:0;bottom:48px;width:min(390px,calc(100vw - 28px));max-height:min(70vh,680px);overflow:auto;border:1px solid rgba(114,226,255,.28);border-radius:20px;background:rgba(6,10,17,.98);box-shadow:0 24px 70px rgba(0,0,0,.65);padding:16px}
    .eon-w659g-head,.eon-w659g-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.eon-w659g-head h2{margin:0;font-size:18px}.eon-w659g-head button,.eon-w659g-panel button,.eon-w659g-panel a{border:1px solid rgba(255,255,255,.18);border-radius:10px;background:rgba(255,255,255,.06);color:inherit;padding:8px 10px;text-decoration:none;cursor:pointer}
    .eon-w659g-panel button:disabled{opacity:.45;cursor:not-allowed}.eon-w659g-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.eon-w659g-stat{border:1px solid rgba(255,255,255,.09);border-radius:12px;padding:10px;background:rgba(255,255,255,.035)}.eon-w659g-stat strong{display:block;font-size:18px;color:#8be9ff}.eon-w659g-meter{height:8px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}.eon-w659g-meter i{display:block;height:100%;background:linear-gradient(90deg,#6ee7ff,#ffb35c);width:var(--progress,0%)}
    .eon-w659g-list{display:grid;gap:8px;margin:10px 0}.eon-w659g-list article{border:1px solid rgba(255,255,255,.09);border-radius:12px;padding:10px;background:rgba(255,255,255,.025)}.eon-w659g-list small{color:#9aa7b5}.eon-w659g-reveal{border-color:rgba(255,179,92,.45)!important;background:linear-gradient(135deg,rgba(255,179,92,.13),rgba(110,231,255,.08))!important}.eon-w659g-status{min-height:20px;color:#b8c5d1}.eon-w659g-actions{display:flex;flex-wrap:wrap;gap:8px}.eon-w659g-truth{color:#9aa7b5;font-size:12px}.eon-w659g-new{animation:eonW659gPulse .8s ease-out}@keyframes eonW659gPulse{50%{transform:scale(1.015);box-shadow:0 0 36px rgba(255,179,92,.22)}}
    @media(max-width:640px){.eon-w659g-progress{right:10px;bottom:72px}.eon-w659g-panel{position:fixed;left:10px;right:10px;bottom:124px;width:auto;max-height:62vh}}
  `;
  documentLike.head.appendChild(style);
}

function applySelectedCosmetics(root, state) {
  const selected = state?.selectedCosmetics || {};
  root.dataset.eonCityEonbotSkin = selected.eonbotSkin || 'command-orbit';
  root.dataset.eonCityCaptureOverlay = selected.captureOverlay || '';
  root.dataset.eonCityTheme = selected.cityTheme || '';
  root.dataset.eonCityArrivalEffect = selected.arrivalEffect || '';
}

function recordExistingProductiveReceipts(storage) {
  const plan = getEonCityProductiveRpgPlan({ storage });
  for (const mission of plan.missions || []) {
    if (!mission?.outcome?.verified || !mission.outcome.receiptId) continue;
    const type = mission.id === 'orientation' ? 'city.orientation.completed' : 'city.real-work-receipt';
    recordEonCityW659gVerifiedAction({ type, receiptId: mission.outcome.receiptId, verified: true, verifiedAt: mission.outcome.verifiedAt, source: mission.outcome.source }, { storage, now: mission.outcome.verifiedAt });
  }
}

export function bindEonCityW659gProgression(root, { onStatus = () => {}, storage = globalThis.localStorage } = {}) {
  if (!root?.ownerDocument) return () => {};
  ensureStyle(root.ownerDocument);
  recordExistingProductiveReceipts(storage);
  const shell = root.ownerDocument.createElement('section');
  shell.className = 'eon-w659g-progress';
  shell.dataset.eonCityW659gProgression = EON_CITY_W659G_PROGRESSION_UI_SCHEMA;
  shell.dataset.eonCityMenuOnly = 'true';
  shell.innerHTML = `<button type="button" data-w659g-toggle aria-expanded="false"><strong>0 XP</strong> · Missions &amp; Rewards</button><section class="eon-w659g-panel" data-w659g-panel hidden aria-label="Missions and rewards"><div class="eon-w659g-head"><div><small>Productive City · W659G</small><h2>Missions, Reveals &amp; EONKEYS</h2></div><button type="button" data-w659g-close aria-label="Close">×</button></div><div data-w659g-content></div><p class="eon-w659g-status" data-w659g-status role="status" aria-live="polite"></p></section>`;
  root.appendChild(shell);
  const toggle = shell.querySelector('[data-w659g-toggle]');
  const panel = shell.querySelector('[data-w659g-panel]');
  const close = shell.querySelector('[data-w659g-close]');
  const content = shell.querySelector('[data-w659g-content]');
  const statusNode = shell.querySelector('[data-w659g-status]');
  let referralStatus = null;
  let disposed = false;

  const setStatus = (message = '') => { if (statusNode) statusNode.textContent = String(message || ''); onStatus?.(message); };
  const render = () => {
    if (disposed) return;
    const state = readEonCityW659gProgression({ storage });
    applySelectedCosmetics(root, state);
    toggle.innerHTML = `<strong>${state.xp} XP</strong> · ${state.pendingReveals ? `${state.pendingReveals} Reveal${state.pendingReveals === 1 ? '' : 's'} ready` : 'Missions & Rewards'}`;
    const owned = EON_CITY_W659G_COSMETIC_REWARDS.filter((entry) => state.ownedCosmetics.includes(entry.id));
    const keyCount = sumAvailable(referralStatus);
    const signedIn = referralStatus?.signedIn === true || referralStatus?.account?.signedIn === true;
    const progressPercent = Math.round((state.revealProgress / EON_CITY_W659G_REVEAL_THRESHOLD) * 100);
    content.innerHTML = `
      <div class="eon-w659g-stats"><div class="eon-w659g-stat"><small>City XP</small><strong>${state.xp}</strong></div><div class="eon-w659g-stat"><small>Reveals ready</small><strong>${state.pendingReveals}</strong></div><div class="eon-w659g-stat"><small>EONKEYS</small><strong>${referralStatus ? keyCount : '—'}</strong></div></div>
      <p><strong>Next Vault Reveal</strong> · ${state.revealProgress}/${EON_CITY_W659G_REVEAL_THRESHOLD}</p><div class="eon-w659g-meter" style="--progress:${progressPercent}%"><i></i></div>
      <div class="eon-w659g-actions"><button class="eon-w659g-reveal" type="button" data-w659g-reveal${state.pendingReveals ? '' : ' disabled'}>Open Vault Reveal</button><a href="/workspace#eon-share">Share &amp; Earn</a><a href="/eon-keys">EONKEY unlocks</a><a href="/rewards">Sponsor Terminal</a></div>
      <p class="eon-w659g-truth">City XP and Vault Reveals are non-cash progression. Referral EONKEYS come only from verified server referral milestones. Sponsor Keys come only from qualifying server-validated Sponsor Terminal completions. City clicks and local play cannot mint either.</p>
      <h3>Always-available mission routes</h3><div class="eon-w659g-list">${EON_CITY_W659G_MISSION_RULES.map((entry) => `<article><strong>${escapeHtml(entry.title)}</strong><br><small>${escapeHtml(entry.station)} · +${entry.xp} XP · +${entry.reveal} Reveal progress</small></article>`).join('')}</div>
      <div class="eon-w659g-row"><h3>Cosmetic collection</h3><span>${owned.length}/${EON_CITY_W659G_COSMETIC_REWARDS.length}</span></div><div class="eon-w659g-list">${owned.length ? owned.map((entry) => `<article><strong>${escapeHtml(entry.label)}</strong><p>${escapeHtml(entry.description)}</p><button type="button" data-w659g-select="${escapeHtml(entry.id)}">Use cosmetic</button></article>`).join('') : '<article><strong>No earned cosmetic yet</strong><p>Complete verified missions to fill the Reveal meter.</p></article>'}</div>
      <p class="eon-w659g-truth">${referralStatus ? (signedIn ? 'Referral ledger connected to your signed-in EON account.' : 'Sign in with Google to view account-bound referral progress and redeem available EONKEYS.') : 'Open this panel to refresh account-bound EONKEY status.'}</p>`;
    content.querySelector('[data-w659g-reveal]')?.addEventListener('click', () => {
      const result = openEonCityW659gVaultReveal({ explicitUserAction: true }, { storage });
      if (!result.ok) { setStatus('No Vault Reveal is ready yet. Complete verified missions to fill the meter.'); return; }
      shell.classList.remove('eon-w659g-new'); void shell.offsetWidth; shell.classList.add('eon-w659g-new');
      setStatus(`Vault Reveal opened: ${result.outcome.label}. Duplicate protection was applied.`);
      render();
    });
    content.querySelectorAll('[data-w659g-select]').forEach((button) => button.addEventListener('click', () => {
      const result = selectEonCityW659gCosmetic(button.dataset.w659gSelect, { explicitUserAction: true }, { storage });
      setStatus(result.ok ? `${result.reward.label} is now active in this browser.` : 'That cosmetic is not available to this collection.');
      render();
    }));
  };

  const refreshReferral = async () => {
    referralStatus = await fetchReferralStatus({ force: true });
    render();
  };
  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) { render(); void refreshReferral(); }
  };
  const onVerifiedAction = (event) => {
    const result = recordEonCityW659gVerifiedAction(event?.detail || {}, { storage });
    if (result.ok && result.reason === 'recorded') setStatus(`Mission verified: +${result.awarded.xp} City XP and +${result.awarded.reveal} Reveal progress.`);
    render();
  };
  const onReferralQualified = () => { void refreshReferral(); };
  toggle.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false));
  globalThis.addEventListener?.(EON_CITY_W659G_VERIFIED_ACTION_EVENT, onVerifiedAction);
  globalThis.addEventListener?.('eon:referral-qualified', onReferralQualified);
  render();
  root.dataset.eonCityW659gProgression = EON_CITY_W659G_PROGRESSION_UI_SCHEMA;
  return () => {
    disposed = true;
    globalThis.removeEventListener?.(EON_CITY_W659G_VERIFIED_ACTION_EVENT, onVerifiedAction);
    globalThis.removeEventListener?.('eon:referral-qualified', onReferralQualified);
    shell.remove();
    delete root.dataset.eonCityW659gProgression;
  };
}
