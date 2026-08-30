/**
 * Game Monetization Helper — EONAPP.CH
 * Shared module that all games import for ad display, subscription checks,
 * and EonLite pool integration. Works with the platform AdManager and subscription system.
 *
 * Usage in game HTML:
 *   <div class="eon-cta-slot" data-eon-cta-slot="game-interstitial"></div>
 *   <div class="eon-cta-slot" data-eon-cta-slot="game-sidebar-banner"></div>
 *   <div class="eon-cta-slot" data-eon-cta-slot="game-gameover-banner"></div>
 *
 *   <script type="module">
 *     import { GameMonetization } from '/assets/js/utils/game-monetization.js';
 *     const monetization = new GameMonetization('neon-dungeon');
 *     monetization.init();
 *   </script>
 *
 * @module utils/game-monetization
 */

import { AD_PLACEMENTS } from '../ads/config.js';
const AD_SLOTS = AD_PLACEMENTS;
const appWin = /** @type {any} */ (window);

const SUB_KEY = 'eon:entitlements:v1';
const /** @type {any} */
PLAN_ORDER = ['free', 'spark', 'builder', 'pro', 'operator'];

function readPlanId() {
  try {
    const data = JSON.parse(localStorage.getItem(SUB_KEY) || 'null');
    return data?.activePlanId || 'free';
  } catch {
    return 'free';
  }
}

function isPlanAtLeast(/** @type {any} */ planId, /** @type {any} */ minimumPlanId) {
  const current = PLAN_ORDER.indexOf(planId);
  const minimum = PLAN_ORDER.indexOf(minimumPlanId);
  return current >= minimum;
}

export class GameMonetization {
  constructor(/** @type {any} */ gameId) {
    this.gameId = gameId;
    this.planId = 'free';
    this.adManager = null;
    this.interstitialsShown = 0;
    this.maxInterstitialsPerSession = 5;
    this.lastInterstitialTime = 0;
    this.cooldownMs = 60000;
    this.initialized = false;
  }

  async init() {
    this.planId = readPlanId();
    this._loadAdManager();
    this.initialized = true;

    // Process renewal if needed
    try {
      const { processRenewals } = await import('./entitlements.js');
      processRenewals();
      this.planId = readPlanId();
    } catch {}

    return this;
  }

  _loadAdManager() {
    import('../ads/AdManager.js')
      .then((/** @type {any} */ mod) => {
        this.adManager = mod.AdManager.mount('game');
      })
      .catch(() => {});
  }

  // ─── Subscription checks ──────────────────────────────────────────────────

  isAdFree() {
    return isPlanAtLeast(this.planId, 'spark');
  }

  getPoolPointMultiplier() {
    const /** @type {any} */ mults = { free: 1, spark: 1.5, builder: 2, pro: 3, operator: 3 };
    return mults[this.planId] || 1;
  }

  /** @deprecated Use getPoolPointMultiplier() */
  getPoolBoost() {
    return this.getPoolPointMultiplier();
  }

  /** @deprecated Use getPoolPointMultiplier() */
  getEarnCapMultiplier() {
    return this.getPoolPointMultiplier();
  }

  getLootboxRarityBoost() {
    const /** @type {any} */ boosts = { free: 0, spark: 0.1, builder: 0.15, pro: 0.2, operator: 0.3 };
    return boosts[this.planId] || 0;
  }

  getGameBenefits() {
    return {
      planId: this.planId,
      adFree: this.isAdFree(),
      poolPointMult: this.getPoolPointMultiplier(),
      poolBoost: this.getPoolPointMultiplier(), // backward compat alias
      earnCapMult: this.getPoolPointMultiplier(),
      lootboxBoost: isPlanAtLeast(this.planId, 'spark'),
      lootboxRarityBoost: this.getLootboxRarityBoost()
    };
  }

  // ─── Ad display ────────────────────────────────────────────────────────────

  canShowInterstitial() {
    if (this.isAdFree()) return false;
    if (this.interstitialsShown >= this.maxInterstitialsPerSession) return false;
    if (Date.now() - this.lastInterstitialTime < this.cooldownMs) return false;
    return true;
  }

  showInterstitial() {
    if (!this.canShowInterstitial()) return false;
    this.interstitialsShown += 1;
    this.lastInterstitialTime = Date.now();

    // Try AdManager
    if (this.adManager) {
      try {
        const /** @type {any} */
slots = document.querySelectorAll('[data-eon-cta-slot="game-interstitial"]');
        slots.forEach((/** @type {any} */ s) => { this.adManager.renderSlot(s, 'game-interstitial'); });
        return true;
      } catch {}
    }

    // Try resolving slot URL directly
    const gameSlots = (/** @type {any} */ (AD_SLOTS)).game || {};
    const interstitial = gameSlots['game-interstitial'];
    if (interstitial?.length > 0) {
      const slot = interstitial[0];
      if (slot.url && !slot.url.includes('YOUR-')) {
        window.open(slot.url, '_blank');
        return true;
      }
    }
    return false;
  }

  async showRewardedAd(/** @type {any} */ callback) {
    // Rewarded value is never minted by a game, timer, ad-free subscription,
    // VAST impression, or fallback branch. The only live reward authority is
    // the signed-in Sponsor Terminal server flow, which issues a consumable
    // Sponsor Key after the server accepts the ExoClick VAST progression.
    const host = document.querySelector('[data-eon-sponsor-terminal]');
    if (!host) {
      const result = Object.freeze({
        watched: false,
        reward: null,
        rewardGranted: false,
        reason: 'sponsor_terminal_required',
        actionUrl: '/rewards'
      });
      callback?.(result);
      return result;
    }

    try {
      const { startEonSponsorTerminal } = await import('../monetization/eon-sponsor-terminal.js');
      const started = await startEonSponsorTerminal({ host, environment: globalThis });
      const result = Object.freeze({
        watched: false,
        reward: null,
        rewardGranted: false,
        sessionStarted: started?.ok === true,
        rewardSessionId: started?.rewardSessionId || '',
        reason: started?.ok ? 'server_reward_session_started' : (started?.reason || 'reward_session_unavailable'),
        actionUrl: '/rewards'
      });
      callback?.(result);
      return result;
    } catch {
      const result = Object.freeze({ watched: false, reward: null, rewardGranted: false, reason: 'reward_runtime_unavailable', actionUrl: '/rewards' });
      callback?.(result);
      return result;
    }
  }

  showGameOverAd() {
    if (this.isAdFree()) return false;
    const /** @type {any} */
slots = document.querySelectorAll('[data-eon-cta-slot="game-gameover-banner"]');
    if (this.adManager && slots.length > 0) {
      slots.forEach((/** @type {any} */ s) => { this.adManager.renderSlot(s, 'game-gameover-banner'); });
      return true;
    }
    return false;
  }

  // ─── Pool Points & EonLite earnings ──────────────────────────────────────────────

  /**
   * Award Pool Points for a game action.
   * Pool Points determine EonLite mint pool share — value-independent.
   */
  awardPoolPoints(/** @type {any} */ actionKey, /** @type {any} */ label) {
    if (!appWin.EonPoolPoints?.awardPoints) return 0;
    return appWin.EonPoolPoints.awardPoints(actionKey, label || this.gameId);
  }

  /**
   * @deprecated Use awardPoolPoints() instead. Direct EonLite awards are being
   * replaced by Pool Points which settle to EonLite at epoch end.
   */
  awardGameEONL(/** @type {any} */ score) {
    // Award pool points instead of direct EonLite
    const actionKey = score >= 1000 ? 'game-run-complete' : 'game-floor-complete';
    this.awardPoolPoints(actionKey, `score:${score}`);
    // Also award direct EonLite for backward compat
    if (appWin.EonWallet?.awardGameCoins) {
      return appWin.EonWallet.awardGameCoins(this.gameId, score);
    }
    return 0;
  }

  awardLootboxDrop() {
    if (!appWin.EonLootbox?.drop) return null;
    const rarityBoost = this.getLootboxRarityBoost();
    return appWin.EonLootbox.drop(this.gameId, 0.12 + rarityBoost, { origin: 'game', queue: 'collection' });
  }

  // ─── Upgrade prompt ─────────────────────────────────────────────────────────

  getUpgradePrompt() {
    if (this.planId !== 'free') return null;
    return {
      message: 'Subscribe to Spark for ad-free games, 2x Pool Points, and priority lootbox drops!',
      cta: 'Upgrade to Spark →',
      url: '/vault#subscribe=spark'
    };
  }

  showUpgradeToast() {
    const prompt = this.getUpgradePrompt();
    if (!prompt) return;
    const /** @type {any} */
toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:80px;right:24px;background:#0f172a;border:1px solid rgba(99,102,241,.4);color:#818cf8;font-size:.8rem;font-weight:600;padding:.5rem 1rem;border-radius:8px;z-index:9997;cursor:pointer;max-width:280px';
    toast.textContent = prompt.message;
    toast.addEventListener('click', () => { window.location.href = prompt.url; });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }
}

// Global convenience for games that use script tags
appWin.GameMonetization = GameMonetization;
appWin.getGameBenefits = () => {
  const gm = new GameMonetization('global');
  gm.planId = readPlanId();
  return gm.getGameBenefits();
};

export default GameMonetization;
