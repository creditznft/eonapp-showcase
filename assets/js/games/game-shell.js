import { registerEonServiceWorker } from '../utils/eon-service-worker-registration.js';
import { ensureRewardScripts, mountChatWidgetDeferred, warmRewardRuntime, mountAdsDeferred } from '../utils/runtime-loader.js';
const appWin = /** @type {any} */ (window);

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    void registerEonServiceWorker();
  }
}

function resolveRewardsMode(/** @type {any} */ options = {}) {
  if (options.rewardsMode) {
    return options.rewardsMode;
  }
  return document.body.dataset.gameShellRewards || 'immediate';
}

function shouldMountChat(/** @type {any} */ options = {}) {
  if (typeof options.chat === 'boolean') {
    return options.chat;
  }
  return document.body.dataset.gameShellChat !== 'false';
}

function shouldMountAds(/** @type {any} */ options = {}) {
  if (typeof options.ads === 'boolean') {
    return options.ads;
  }
  return document.body.dataset.gameShellAds !== 'false';
}

function publishSeasonContext() {
  const gameId = document.body.dataset.gameId || 'game';
  const seasonId = appWin.EonSeason?.getSeasonId?.() || '';
  const dailySeed = appWin.EonSeason?.getDailySeed?.(gameId) || '';
  if (!seasonId || !dailySeed) {
    return;
  }
  document.body.dataset.seasonId = seasonId;
  document.body.dataset.seasonDailySeed = dailySeed;
  document.dispatchEvent(new CustomEvent('season-context-ready', {
    detail: {
      gameId,
      seasonId,
      dailySeed
    }
  }));
}

function applyDprScaling() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  document.querySelectorAll('canvas').forEach((/** @type {HTMLCanvasElement} */ canvas) => {
    if (canvas.dataset.dprScaled) return;
    const w = canvas.width || canvas.clientWidth || 800;
    const h = canvas.height || canvas.clientHeight || 600;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = canvas.style.width || `${w}px`;
    canvas.style.height = canvas.style.height || `${h}px`;
    const /** @type {any} */
ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    canvas.dataset.dprScaled = '1';
  });
}

function loadSubscriptionBenefits() {
  // Expose subscription helpers globally for games that don't use ES modules
  import('../utils/subscription.js')
    .then((/** @type {any} */ mod) => {
      appWin.EonSubscription = mod;
      appWin.hasFeature = mod.hasFeature;
      appWin.getCurrentPlan = mod.getCurrentPlan;
      appWin.getGameBenefits = mod.getGameBenefits;
      appWin.shouldShowGameAds = mod.shouldShowGameAds;

      // Show subscribe CTA for free-tier users
      _maybeShowSubscribeCTA(mod);
    })
    .catch(() => {});
}

function _maybeShowSubscribeCTA(/** @type {any} */ subMod) {
  try {
    if (typeof subMod?.getCurrentPlan !== 'function') return;
    const plan = subMod.getCurrentPlan();
    if (plan?.id && plan.id !== 'free') return; // Already subscribed

    // Don't show if dismissed recently (24h cooldown)
    const dismissedAt = parseInt(localStorage.getItem('eon-sub-cta-dismissed') || '0', 10);
    if (Date.now() - dismissedAt < 86_400_000) return;

    const /** @type {any} */
banner = document.createElement('div');
    banner.id = 'eon-sub-cta-banner';
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;padding:10px 16px;background:linear-gradient(135deg,#1e1b4b,#312e81);color:#e0e7ff;font-size:0.85rem;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 -4px 16px rgba(0,0,0,.3)';
    banner.innerHTML = `
      <span>✨ Go ad-free & earn 2x Pool Points with <strong>Spark</strong> ($1/mo)</span>
      <div style="display:flex;gap:8px">
        <a href="/vault#entitlements" style="background:#6366f1;color:#fff;padding:6px 16px;border-radius:6px;text-decoration:none;font-weight:700;font-size:0.8rem">Subscribe</a>
        <button id="eon-sub-cta-close" style="background:none;border:1px solid rgba(255,255,255,.2);color:#a5b4fc;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.75rem">Later</button>
      </div>
    `;
    document.body.appendChild(banner);

    banner.querySelector('#eon-sub-cta-close')?.addEventListener('click', () => {
      localStorage.setItem('eon-sub-cta-dismissed', String(Date.now()));
      banner.remove();
    });
  } catch {}
}

export function bootstrapGameShell(/** @type {any} */ options = {}) {
  registerServiceWorker();
  publishSeasonContext();
  loadSubscriptionBenefits();
  applyDprScaling();

  const rewardsMode = resolveRewardsMode(options);
  if (rewardsMode === 'immediate') {
    void ensureRewardScripts();
  } else if (rewardsMode === 'idle') {
    void warmRewardRuntime({ idle: true, timeout: 1200 });
  }

  if (shouldMountChat(options)) {
    void mountChatWidgetDeferred({
      pageType: options.pageType || document.body.dataset.pageType || 'game'
    }, {
      idle: true,
      timeout: 1500
    });
  }

  // Mount game ads (respects subscription — ad-free for Spark+)
  if (shouldMountAds(options)) {
    void mountAdsDeferred('game', document, { idle: true, timeout: 1200 });
  }
}

bootstrapGameShell();
