import { emitMonetizationEvent, fetchMonetizationStatus, readDisplayAdConsent } from './eon-monetization-client.js';

export const EON_SPONSOR_TERMINAL_SCHEMA = 'eonapp.monetization.sponsor-terminal.rt92.v2';
export const EON_SPONSOR_PLAYER_SCRIPT = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js';
export const EON_SPONSOR_TAIL_VIDEO = '/assets/media/sponsor-terminal/eonapp-sponsor-terminal-tail.mp4';

const PLAYER_PROMISE_KEY = '__EON_FLUID_PLAYER_PROMISE_RT92__';
const freeze = (value) => Object.freeze(value);

function stripControlCharacters(value = '') {
  return Array.from(String(value || '')).filter((character) => {
    const code = character.charCodeAt(0);
    return code >= 32 && code !== 127;
  }).join('');
}
function safeText(value = '', max = 180) {
  return stripControlCharacters(value).trim().slice(0, max);
}

async function requestRewardSession(environment = globalThis, { surface = 'rewards', worldId = '' } = {}) {
  try {
    const response = await environment.fetch('/api/monetization/rewarded', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ action: 'start', surface, worldId })
    });
    const body = await response.json().catch(() => ({}));
    return freeze({ ...body, httpOk: response.ok, httpStatus: response.status });
  } catch { return freeze({ ok: false, status: 'reward_session_unavailable', httpOk: false, httpStatus: 0 }); }
}

async function readRewardSession(environment = globalThis, sessionId = '') {
  try {
    const response = await environment.fetch(`/api/monetization/rewarded?session=${encodeURIComponent(sessionId)}`, { credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json' } });
    const body = await response.json().catch(() => ({}));
    return freeze({ ...body, httpOk: response.ok, httpStatus: response.status });
  } catch { return freeze({ ok: false, status: 'reward_status_unavailable' }); }
}

async function watchRewardSession(host, environment, sessionId, { maxPolls = 50, intervalMs = 1500 } = {}) {
  for (let poll = 0; poll < maxPolls; poll += 1) {
    const status = await readRewardSession(environment, sessionId);
    if (status?.session?.status === 'completed') {
      setStatus(host, `Sponsor video completed. 1 Sponsor Key added. Balance: ${Number(status.availableKeys || 0)}.`, 'reward-granted');
      emitMonetizationEvent('sponsor-key-granted', { provider: 'exoclick', surface: 'rewards', format: 'vast' }, environment);
      try { environment.dispatchEvent?.(new CustomEvent('eon:sponsor-key-granted', { detail: { sessionId, availableKeys: Number(status.availableKeys || 0) } })); } catch {}
      return status;
    }
    if (status?.session?.status === 'expired') {
      setStatus(host, 'Sponsor session expired before a qualifying completion. No Sponsor Key was issued.', 'expired');
      return status;
    }
    await new Promise((resolve) => environment.setTimeout(resolve, intervalMs));
  }
  setStatus(host, 'Sponsor playback ended, but reward confirmation is still pending. Refresh the reward status before trying again.', 'verification-pending');
  return freeze({ ok: false, status: 'reward_confirmation_pending' });
}

function setStatus(host, message, state = '') {
  const node = host?.querySelector?.('[data-eon-sponsor-terminal-status]');
  if (node) {
    node.textContent = safeText(message, 500);
    if (state) node.dataset.state = state;
  }
}

function ensureFluidPlayer(environment = globalThis) {
  if (typeof environment.fluidPlayer === 'function') return Promise.resolve(environment.fluidPlayer);
  if (environment[PLAYER_PROMISE_KEY]) return environment[PLAYER_PROMISE_KEY];
  environment[PLAYER_PROMISE_KEY] = new Promise((resolve, reject) => {
    const documentRef = environment.document;
    if (!documentRef?.createElement) return reject(new Error('document-unavailable'));
    const existing = documentRef.querySelector(`script[src="${EON_SPONSOR_PLAYER_SCRIPT}"]`);
    const script = existing || documentRef.createElement('script');
    const ready = () => typeof environment.fluidPlayer === 'function'
      ? resolve(environment.fluidPlayer)
      : reject(new Error('fluid-player-unavailable'));
    if (!existing) {
      script.async = true;
      script.src = EON_SPONSOR_PLAYER_SCRIPT;
      script.dataset.eonSponsorPlayer = 'fluid-player';
      documentRef.head?.append(script);
    }
    if (existing && typeof environment.fluidPlayer === 'function') return ready();
    script.addEventListener('load', ready, { once: true });
    script.addEventListener('error', () => reject(new Error('fluid-player-load-failed')), { once: true });
  }).catch((error) => {
    try { delete environment[PLAYER_PROMISE_KEY]; } catch { environment[PLAYER_PROMISE_KEY] = undefined; }
    throw error;
  });
  return environment[PLAYER_PROMISE_KEY];
}

export function buildSponsorTerminalPresentation(status = {}) {
  const sponsor = status?.sponsorVideo || {};
  if (status?.signedIn !== true) return freeze({ available: false, reason: 'sign_in_required', label: 'Sign in to open Sponsor Terminal', rewardsEnabled: false });
  if (sponsor?.available !== true || sponsor?.provider !== 'exoclick' || !sponsor?.vastTag) {
    return freeze({ available: false, reason: status?.reason || 'sponsor_video_unavailable', label: 'Sponsor video unavailable', rewardsEnabled: false });
  }
  const rewarded = status?.rewarded || {};
  const rewardsEnabled = rewarded.available === true && rewarded.provider === 'exoclick' && rewarded.serverVerifierReady === true;
  return freeze({
    available: true,
    reason: rewardsEnabled ? 'reward-ready' : 'video-only',
    provider: 'exoclick',
    zoneId: safeText(sponsor.zoneId, 32),
    vastTag: safeText(sponsor.vastTag, 500),
    label: rewardsEnabled ? 'Watch video · earn 1 Sponsor Key' : 'Watch voluntary sponsor video',
    rewardsEnabled,
    rewardDisclosure: rewardsEnabled
      ? 'A qualifying completed video earns exactly 1 consumable Sponsor Key. One key only unlocks a short low-cost feature; larger temporary features require multiple completed videos.'
      : 'Sponsor video is available, but this deployment cannot currently issue Sponsor Keys.'
  });
}

export async function startEonSponsorTerminal({ host, environment = globalThis } = {}) {
  if (!host || !environment.document) return freeze({ ok: false, reason: 'terminal_host_unavailable' });
  const button = host.querySelector('[data-eon-sponsor-terminal-start]');
  if (button) button.disabled = true;
  const consent = readDisplayAdConsent(environment);
  if (consent.state !== 'allowed') {
    if (button) button.disabled = false;
    setStatus(host, 'Allow third-party sponsored content before starting Sponsor Terminal.', 'consent-required');
    return freeze({ ok: false, reason: 'sponsor_consent_required' });
  }
  setStatus(host, 'Checking Sponsor Terminal availability…', 'checking');

  const status = await fetchMonetizationStatus({ force: true, environment });
  const presentation = buildSponsorTerminalPresentation(status);
  if (!presentation.available) {
    if (button) button.disabled = false;
    setStatus(host, presentation.reason === 'sign_in_required' ? 'Sign in to use the voluntary Sponsor Terminal.' : 'Sponsor video is not available in this deployment.', 'unavailable');
    return freeze({ ok: false, reason: presentation.reason });
  }

  let rewardSession = null;
  if (presentation.rewardsEnabled) {
    setStatus(host, 'Creating a one-time rewarded Sponsor session…', 'reward-session');
    rewardSession = await requestRewardSession(environment, { surface: host.dataset?.eonSponsorSurface || 'rewards', worldId: host.dataset?.eonSponsorWorld || '' });
    if (!rewardSession?.ok || !rewardSession?.vastUrl) {
      if (button) button.disabled = false;
      const message = rewardSession?.status === 'cooldown_active'
        ? 'Sponsor reward is cooling down. Try again after the displayed cooldown.'
        : rewardSession?.status === 'daily_cap_reached'
          ? 'Daily Sponsor Key limit reached.'
          : 'Rewarded Sponsor session is unavailable. No key or access changed.';
      setStatus(host, message, 'reward-unavailable');
      return freeze({ ok: false, reason: rewardSession?.status || 'reward_session_unavailable' });
    }
  }

  setStatus(host, 'Preparing the voluntary sponsor video…', 'loading');
  let fluidPlayerFactory;
  try {
    fluidPlayerFactory = await ensureFluidPlayer(environment);
  } catch {
    if (button) button.disabled = false;
    setStatus(host, 'Sponsor video player could not load. No reward or access changed.', 'player-unavailable');
    emitMonetizationEvent('sponsor-video-unavailable', { provider: 'exoclick', surface: 'rewards', format: 'vast', reason: 'player-load-failed' }, environment);
    return freeze({ ok: false, reason: 'player_load_failed' });
  }

  const playerHost = host.querySelector('[data-eon-sponsor-terminal-player]');
  if (!playerHost) {
    if (button) button.disabled = false;
    return freeze({ ok: false, reason: 'player_host_unavailable' });
  }
  playerHost.replaceChildren();
  const video = environment.document.createElement('video');
  const id = `eon-sponsor-video-${Date.now().toString(36)}`;
  video.id = id;
  video.controls = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.setAttribute('aria-label', 'Voluntary sponsored video');
  const source = environment.document.createElement('source');
  source.src = EON_SPONSOR_TAIL_VIDEO;
  source.type = 'video/mp4';
  video.append(source);
  playerHost.append(video);

  let player = null;
  try {
    player = fluidPlayerFactory(id, {
      layoutControls: { fillToContainer: true, allowDownload: false },
      vastOptions: {
        adList: [{ roll: 'preRoll', vastTag: rewardSession?.vastUrl || presentation.vastTag, timer: 0 }]
      }
    });
    host.dataset.eonSponsorTerminalState = 'started';
    setStatus(host, presentation.rewardsEnabled ? 'Sponsor video started. Complete the video to earn 1 Sponsor Key.' : 'Sponsor video started. This viewing supports EONAPP.', 'started');
    emitMonetizationEvent('sponsor-video-started', { provider: 'exoclick', slot: 'sponsor-terminal', surface: 'rewards', format: 'vast' }, environment);
    const playPromise = typeof player?.play === 'function' ? player.play() : video.play();
    Promise.resolve(playPromise).catch(() => {
      setStatus(host, 'Press Play in the video player to begin the sponsor transmission.', 'awaiting-play');
    });
    if (rewardSession?.sessionId) void watchRewardSession(host, environment, rewardSession.sessionId);
  } catch {
    playerHost.replaceChildren();
    if (button) button.disabled = false;
    setStatus(host, 'Sponsor video could not start. No reward or access changed.', 'start-failed');
    emitMonetizationEvent('sponsor-video-unavailable', { provider: 'exoclick', surface: 'rewards', format: 'vast', reason: 'player-start-failed' }, environment);
    return freeze({ ok: false, reason: 'player_start_failed' });
  }

  video.addEventListener('ended', () => {
    if (!presentation.rewardsEnabled) setStatus(host, 'Sponsor transmission ended.', 'ended');
    emitMonetizationEvent('sponsor-video-local-content-ended', { provider: 'exoclick', surface: 'rewards', format: 'vast', reason: presentation.rewardsEnabled ? 'reward-verification-server-authoritative' : 'video-only' }, environment);
    if (button) button.disabled = false;
  }, { once: true });

  return freeze({
    ok: true,
    provider: 'exoclick',
    zoneId: presentation.zoneId,
    rewardsEnabled: presentation.rewardsEnabled,
    rewardSessionId: rewardSession?.sessionId || '',
    clientCompletionCanReward: false,
    dispose() {
      try { player?.destroy?.(); } catch {}
      playerHost.replaceChildren();
      if (button) button.disabled = false;
      setStatus(host, 'Sponsor Terminal ready.', 'ready');
    }
  });
}

export function bindEonSponsorTerminal(host, { environment = globalThis } = {}) {
  // This runtime-visible marker proves the bundled Sponsor Terminal module
  // survived production minification; release staging verifies it alongside
  // the same-origin tail asset.
  if (host?.dataset) host.dataset.eonSponsorTerminalRuntime = EON_SPONSOR_TERMINAL_SCHEMA;
  const button = host?.querySelector?.('[data-eon-sponsor-terminal-start]');
  if (!button) return freeze({ ok: false, reason: 'start_control_unavailable' });
  const onStart = () => void startEonSponsorTerminal({ host, environment });
  button.addEventListener('click', onStart);
  return freeze({ ok: true, dispose() { button.removeEventListener('click', onStart); } });
}

export default bindEonSponsorTerminal;
