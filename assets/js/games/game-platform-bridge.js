/**
 * GamePlatformBridge — shared integration layer for all EONAPP.CH games
 *
 * Wraps GameMonetization and provides a unified API for:
 *   - Ad-free subscription checks
 *   - Game-over ad injection into any game modal or screen
 *   - MutationObserver-based visibility hooks for non-module games
 *   - Pool point, coin, and lootbox run-end helpers
 *
 * Usage in a game's eon-integration.js:
 *
 *   import { GamePlatformBridge } from '/assets/js/games/game-platform-bridge.js';
 *
 *   const bridge = new GamePlatformBridge('my-game-id');
 *   bridge.init().then(() => {
 *     bridge.observeVisibility('#my-game-over-modal', {
 *       visibleWhen: 'style-display',
 *       onShow: (el) => bridge.showGameOverAd(el),
 *     });
 *   });
 *
 * @module games/game-platform-bridge
 */

import { GameMonetization } from '../utils/game-monetization.js';
import { attachRelicArt, getRelicTheme } from '../utils/lootbox-relic-bridge.js';

// Browser global type cast for custom window properties
const appWin = /** @type {any} */ (window);

// ─── Visibility helpers ────────────────────────────────────────────────────

/**
 * Check whether a DOM element is considered visible according to the
 * specified detection strategy.
 *
 * Strategies:
 *   'style-display'  — el.style.display is non-empty and not 'none'
 *   'class-hidden'   — el does NOT have the 'hidden' class
 *   'class-active'   — el HAS the 'active' class
 *   'attr-hidden'    — el.hidden is false (HTML hidden attribute)
 *
 * @param {Element} el
 * @param {string} strategy
 * @returns {boolean}
 */
function _isElementVisible(/** @type {HTMLElement} */ el, /** @type {any} */ strategy) {
  switch (strategy) {
    case 'style-display':
      return el.style.display !== '' && el.style.display !== 'none';
    case 'class-hidden':
      return !el.classList.contains('hidden');
    case 'class-active':
      return el.classList.contains('active');
    case 'attr-hidden':
      return !el.hidden;
    default:
      // Permissive fallback — covers most patterns
      return (
        !el.hidden &&
        el.style.display !== 'none' &&
        !el.classList.contains('hidden')
      );
  }
}

// ─── GamePlatformBridge ───────────────────────────────────────────────────

export class GamePlatformBridge {
  /**
   * @param {string} gameId  Unique game identifier matching the platform registry
   */
  constructor(/** @type {any} */ gameId) {
    this.gameId = gameId;
    /** @type {GameMonetization|null} */
    this.monetization = null;
    this._adShownForContainers = new WeakSet();
    this._observers = /** @type {any[]} */ ([]);
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  /**
   * Initialise the bridge.  Must be called before any ad or subscription
   * methods.  Returns `this` for chaining.
   */
  async init() {
    this.monetization = new GameMonetization(this.gameId);
    await this.monetization.init();
    return this;
  }

  // ─── Subscription helpers ─────────────────────────────────────────────────

  /** Returns true when the current session is on a paid plan (ad-free). */
  isAdFree() {
    return this.monetization?.isAdFree() ?? false;
  }

  /**
   * Returns the current plan benefits object:
   * { planId, adFree, poolPointMult, lootboxBoost, lootboxRarityBoost }
   */
  getGameBenefits() {
    return (
      this.monetization?.getGameBenefits() ?? {
        planId: 'free',
        adFree: false,
        poolPointMult: 1,
        lootboxBoost: false,
        lootboxRarityBoost: 0,
      }
    );
  }

  // ─── Ad display ───────────────────────────────────────────────────────────

  /**
   * Show a game-over banner ad inside `containerEl`.
   *
   * If `containerEl` is supplied:
   *   - A [data-eon-cta-slot="game-gameover-banner"] div is injected before the
   *     first button found inside the container (if not already present).
   *   - The AdManager renders the slot.
   *   - Each container receives at most one ad per page-load.
   *
   * If `containerEl` is null, falls back to GameMonetization.showGameOverAd().
   *
   * @param {Element|null} containerEl
   * @returns {boolean}
   */
  showGameOverAd(/** @type {any} */ containerEl = null) {
    if (this.isAdFree()) return false;

    if (!containerEl) {
      return this.monetization?.showGameOverAd() ?? false;
    }

    // Guard against double-rendering in the same container
    if (this._adShownForContainers.has(containerEl)) return false;
    this._adShownForContainers.add(containerEl);

    // Inject ad slot if not already present
    const SLOT_ATTR = 'data-eon-cta-slot';
    const SLOT_VALUE = 'game-gameover-banner';
    let /** @type {any} */
slot = containerEl.querySelector(`[${SLOT_ATTR}="${SLOT_VALUE}"]`);

    if (!slot) {
      slot = document.createElement('div');
      slot.setAttribute(SLOT_ATTR, SLOT_VALUE);
      slot.className = 'gpb-eon-cta-slot';
      (/** @type {HTMLElement} */ (slot)).style.cssText = 'text-align:center;margin:10px auto 6px;min-height:60px;';

      // Insert before the first button or button-like element
      const /** @type {any} */
firstBtn = containerEl.querySelector('button, [role="button"], .btn, .mbt');
      const insertTarget = firstBtn?.parentElement ?? containerEl;
      const insertBefore = firstBtn ?? null;

      if (insertBefore) {
        insertTarget.insertBefore(slot, insertBefore);
      } else {
        insertTarget.appendChild(slot);
      }
    }

    // Ask AdManager to render
    if (this.monetization?.adManager) {
      try {
        this.monetization.adManager.renderSlot(slot, SLOT_VALUE);
        return true;
      } catch {}
    }

    return this.monetization?.showGameOverAd() ?? false;
  }

  /**
   * Try to show an interstitial ad (subject to session cap and cooldown).
   * Safe to call frequently — GameMonetization handles throttling.
   * @returns {boolean}
   */
  showInterstitial() {
    return this.monetization?.showInterstitial() ?? false;
  }

  /**
   * Start the centralized Sponsor Terminal reward flow.
   *
   * Games do not mint coins, revives, loot boxes or any other value from an
   * ad timer. A qualifying rewarded video can only produce one server-issued
   * Sponsor Key, which is redeemed separately for short EONAPP feature access.
   * Paid accounts may opt in to the same rewarded terminal; ad-free status
   * never creates an automatic reward.
   *
   * @param {{ onReward?: (reward: any) => void, onFail?: (result?: any) => void }} options
   * @returns {Promise<any>}
   */
  async showRewardedAd(/** @type {any} */ options = /** @type {any} */ ({})) {
    const { onReward, onFail } = options;
    const monetization = this.monetization;
    if (!monetization?.showRewardedAd) {
      const result = /** @type {any} */ ({ watched: false, reward: null, rewardGranted: false, reason: 'reward_runtime_unavailable', actionUrl: '/rewards' });
      onFail?.(result);
      return result;
    }
    const result = await monetization.showRewardedAd();
    // Session creation is not reward completion. Call onReward only for an
    // explicitly server-confirmed grant returned by a future compatible caller.
    if (result?.rewardGranted === true && result?.reward) onReward?.(result.reward);
    else onFail?.(result);
    return result;
  }


  // ─── Run-end rewards ─────────────────────────────────────────────────────

  /**
   * Call this when a game run ends.  Fires platform pool points, coin awards,
   * and optional lootbox drops in a try/catch wrapper so game never crashes.
   *
   * @param {{ score?: number, win?: boolean, coins?: number, loot?: boolean }} params
   */
  onRunEnd(/** @type {any} */ { score = 0, win = false, coins = 0, loot = undefined } = {}) {
    const dropLoot = loot !== undefined ? loot : win || Math.random() < 0.12;

    try { appWin.EonPoolPoints?.addPoints?.(score, 'game', this.gameId); } catch {}
    if (coins > 0) {
      try { appWin.EonWallet?.awardGameCoins?.(this.gameId, coins); } catch {}
    }
    if (dropLoot) {
      try { appWin.EonLootbox?.drop?.(this.gameId); } catch {}
    }
  }

  // ─── Infinite Themed Lootbox ────────────────────────────────────────────────

  /**
   * Award a themed lootbox with procedurally generated item.
   * Uses the new infinite generation system - each item is unique.
   *
  * @param {{ rarity?: string, source?: string, mintAsNFT?: boolean, score?: number, win?: boolean }} [options]
   * @returns {Promise<Object|null>} The generated lootbox item
   */
  async awardThemedLootbox(/** @type {any} */ options = /** @type {any} */ ({})) {
    try {
      const { 
        rarity = 'common', 
        source = this.gameId,
        mintAsNFT = false,
        score = 0,
        win = false
      } = options;

      // CEO decision: scores should influence quality floor.
      // Base floor 68, boosted by win and score bands, hard-capped at 97.
      const scoreFloor = (() => {
        let floor = 68;
        if (win) floor += 6;
        if (score >= 300) floor += 4;
        if (score >= 800) floor += 5;
        if (score >= 1500) floor += 6;
        if (score >= 3000) floor += 8;
        return Math.max(68, Math.min(97, floor));
      })();

      // Use the new procedural generation if available
      if (appWin.EonLootbox?.dropAsync) {
        const item = await appWin.EonLootbox.dropAsync(source, 0, {
          rarity,
          uploadToIPFS: mintAsNFT,
          origin: 'game-reward',
          queue: 'collection'
        });

        if (item) {
          item.score = Number(score) || 0;
          item.win = !!win;
          item.qualityFloor = scoreFloor;
          await attachRelicArt(item, 256, { qualityFloor: scoreFloor });
        }
        
        return item;
      }
      
      // Fallback to legacy lootbox
      if (appWin.EonLootbox?.drop) {
        const item = appWin.EonLootbox.drop(source, 0, { 
          rarity, 
          origin: 'game-reward',
          queue: 'collection'
        });
        if (item) {
          item.score = Number(score) || 0;
          item.win = !!win;
          item.qualityFloor = scoreFloor;
          await attachRelicArt(item, 256, { qualityFloor: scoreFloor });
        }
        return item;
      }
      
      console.warn('[GamePlatformBridge] Lootbox system not available');
      return null;
    } catch (/** @type {any} */
e) {
      console.warn('[GamePlatformBridge] Failed to award themed lootbox:', e);
      return null;
    }
  }

  /**
   * Award a lootbox with rarity based on game performance.
   * Higher scores = better rarity chances.
   *
   * @param {number} score - Game score
   * @param {boolean} win - Whether player won
   * @returns {Promise<Object|null>} The generated lootbox item
   */
  async awardPerformanceLootbox(/** @type {any} */ score = 0, /** @type {any} */ win = false) {
    // Determine rarity based on score and win status
    let rarity = 'common';
    const benefits = this.getGameBenefits();
    const luckBonus = benefits.lootboxRarityBoost || 0;
    
    if (win && score > 1000) {
      rarity = 'legendary';
    } else if (win && score > 500) {
      rarity = 'epic';
    } else if (win || score > 300) {
      rarity = 'rare';
    }
    
    // Apply luck bonus from subscription
    if (luckBonus > 0 && rarity !== 'legendary') {
      const roll = Math.random();
      if (roll < luckBonus) {
        const /** @type {any} */
rarities = ['common', 'rare', 'epic', 'legendary'];
        const currentIdx = rarities.indexOf(rarity);
        if (currentIdx < rarities.length - 1) {
          rarity = rarities[currentIdx + 1];
        }
      }
    }
    
    return this.awardThemedLootbox({ rarity, mintAsNFT: false, score, win });
  }

  // ─── NFT Claim Hooks ─────────────────────────────────────────────────────

  /**
   * Register a trophy/achievement as claimable for NFT minting.
   * Once loot base URI is live, these can be claimed as on-chain NFTs.
   *
   * @param {string} achievementId  Unique achievement identifier
  * @param {{ name: string, description: string, rarity: 'common'|'rare'|'epic'|'legendary', metadata?: any, source?: string, score?: number, seed?: number }} trophyData
   * @returns {boolean}
   */
  mintClaimableTrophy(/** @type {any} */ achievementId, /** @type {any} */ trophyData = /** @type {any} */ ({})) {
    try {
      const rarity = trophyData.rarity || 'common';
      const source = trophyData.source || this.gameId;
      const score = Number(trophyData.score || 0);
      const qualityFloor = Math.max(68, Math.min(97, 68 + Math.min(Math.floor(score / 400) * 3, 20)));

      // Store in localStorage for later claim when loot base URI is active
      const key = `eon:claimable:${this.gameId}:${achievementId}`;
      const claimData = /** @type {any} */ ({
        ...trophyData,
        gameId: this.gameId,
        achievementId,
        timestamp: Date.now(),
        source,
        rarity,
        qualityFloor
      });

      // Build mint-ready relic payload so trophy claims are deterministic and renderable.
      const relicSeed = Number(trophyData.seed || Date.now());
      const relicItem = /** @type {any} */ ({
        id: `trophy-${this.gameId}-${achievementId}`,
        name: trophyData.name || `${this.gameId} Trophy`,
        rarity,
        source,
        dnaHash: String(relicSeed.toString(16)),
        description: trophyData.description || 'Claimable trophy relic'
      });
      attachRelicArt(relicItem, 256, { qualityFloor }).then(() => {
        try {
          const /** @type {any} */
enriched = {
            ...claimData,
            relicTheme: getRelicTheme(source).name,
            relicSpec: relicItem.relicSpec || null,
            relicPng: relicItem.relicPng || null,
            traitData: relicItem.relicSpec?.traitData || null,
            seed: relicSeed
          };
          localStorage.setItem(key, JSON.stringify(enriched));
        } catch {
          // Keep base claim payload even if enrichment fails.
        }
      });

      localStorage.setItem(key, JSON.stringify(claimData));

      // Also notify platform if available
      if (appWin.EonLootbox?.registerClaimable) {
        appWin.EonLootbox.registerClaimable(this.gameId, achievementId, claimData);
      }

      return true;
    } catch (/** @type {any} */
e) {
      if (appWin.DEBUG) console.warn('[GamePlatformBridge] Failed to register claimable trophy:', e);
      return false;
    }
  }

  /**
   * Get all claimable trophies for this game.
   * @returns {Array<{achievementId: string, data: any}>}
   */
  getClaimableTrophies() {
    try {
      const prefix = `eon:claimable:${this.gameId}:`;
      const /** @type {any} */
trophies = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          trophies.push({ achievementId: key.replace(prefix, ''), data });
        }
      }
      return trophies;
    } catch {
      return [];
    }
  }

  // ─── Visibility observation ──────────────────────────────────────────────

  /**
   * Observe a DOM element and invoke callbacks when it transitions
   * between visible and hidden states.
   *
   * @param {string} selector          CSS selector for the target element
   * @param {{
   *   visibleWhen?: 'style-display'|'class-hidden'|'class-active'|'attr-hidden'|'auto',
   *   onShow?: (el: Element) => void,
   *   onHide?: (el: Element) => void,
   * }} options
   */
  observeVisibility(/** @type {any} */ selector, /** @type {any} */ options = {}) {
    const { visibleWhen = 'auto', onShow, onHide } = options;

    const attach = () => {
      const el = /** @type {HTMLElement | null} */ (document.querySelector(selector));
      if (!el) return;

      let wasVisible = _isElementVisible(el, visibleWhen);

      const observer = new MutationObserver(() => {
        const nowVisible = _isElementVisible(el, visibleWhen);
        if (!wasVisible && nowVisible) {
          wasVisible = true;
          onShow?.(/** @type {HTMLElement} */ (el));
        } else if (wasVisible && !nowVisible) {
          wasVisible = false;
          onHide?.(/** @type {HTMLElement} */ (el));
        }
      });

      observer.observe(el, {
        attributes: true,
        attributeFilter: ['style', 'class', 'hidden'],
      });

      this._observers.push(observer);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach);
    } else {
      attach();
    }
  }

  // ─── Season & Challenge Support ─────────────────────────────────────────

  /**
   * Get the current season challenge for this game.
   * Challenges rotate daily based on seeded random.
   *
   * @returns {{ id: string, type: string, target: number, reward: { xp: number, coins: number }, expires: Date }}
   */
  getSeasonChallenge() {
    const day = Math.floor(Date.now() / 86400000);
    const /** @type {any} */
challengeTypes = {
      'neon-dungeon': ['FLOOR_10', 'KILLS_50', 'NO_DAMAGE_3', 'SPEED_5', 'COINS_200'],
      'dungeon-crawl-zero': ['FLOOR_5', 'KILLS_30', 'SCORE_500', 'TIME_120'],
      'alchemy-lab': ['DISCOVER_5', 'BREW_3', 'QUEST_2', 'RARITY_2'],
      'neural-override': ['WAVE_10', 'ACCURACY_80', 'TIME_60', 'COMBO_5'],
      'realm-wars-lite': ['UNITS_10', 'VICTORY_3', 'TIME_180', 'LOSSES_0'],
      'cyber-rogue': ['FLOOR_7', 'BOSS_2', 'SCORE_1000', 'ITEMS_5'],
      'neon-conquest': ['TERRITORY_5', 'UNITS_20', 'VICTORY_2', 'RESOURCES_1000']
    };

    const types = (/** @type {any} */ (challengeTypes))[this.gameId] || ['SCORE_100', 'TIME_60'];
    const type = types[day % types.length];
    const /** @type {any} */
targets = {
      'FLOOR_10': 10, 'KILLS_50': 50, 'NO_DAMAGE_3': 3, 'SPEED_5': 5, 'COINS_200': 200,
      'FLOOR_5': 5, 'KILLS_30': 30, 'SCORE_500': 500, 'TIME_120': 120,
      'DISCOVER_5': 5, 'BREW_3': 3, 'QUEST_2': 2, 'RARITY_2': 2,
      'WAVE_10': 10, 'ACCURACY_80': 80, 'TIME_60': 60, 'COMBO_5': 5,
      'UNITS_10': 10, 'VICTORY_3': 3, 'TIME_180': 180, 'LOSSES_0': 0,
      'FLOOR_7': 7, 'BOSS_2': 2, 'SCORE_1000': 1000, 'ITEMS_5': 5,
      'TERRITORY_5': 5, 'UNITS_20': 20, 'VICTORY_2': 2, 'RESOURCES_1000': 1000,
      'SCORE_100': 100
    };

    return {
      id: `daily_${day}_${this.gameId}`,
      type,
      target: (/** @type {any} */ (targets))[type] || 100,
      reward: { xp: 50, coins: 25 },
      expires: new Date(new Date().setHours(23, 59, 59, 999))
    };
  }

  /**
   * Report challenge progress.
   * @param {string} challengeId
   * @param {number} progress
   * @returns {boolean} true if challenge completed
   */
  reportChallengeProgress(/** @type {any} */ challengeId, /** @type {any} */ progress) {
    try {
      const key = `eon:challenge:${challengeId}`;
      const current = JSON.parse(localStorage.getItem(key) || '{"progress":0}');
      current.progress = Math.max(current.progress, progress);
      localStorage.setItem(key, JSON.stringify(current));

      // Check if completed
      const challenge = this.getSeasonChallenge();
      if (current.progress >= challenge.target) {
        this._grantChallengeReward(challenge);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Grant challenge reward.
   * @private
   */
  _grantChallengeReward(/** @type {any} */ challenge) {
    try {
      const benefits = this.getGameBenefits();
      const xp = Math.floor(challenge.reward.xp * benefits.poolPointMult);
      const coins = Math.floor(challenge.reward.coins * benefits.poolPointMult);

      if (appWin.EonXP?.award) appWin.EonXP.award(this.gameId, xp);
      if (appWin.EonWallet?.addCoins) appWin.EonWallet.addCoins(coins, 'challenge-reward', this.gameId);
      if (appWin.EonPoolPoints?.awardPoints) appWin.EonPoolPoints.awardPoints('challenge-complete', this.gameId);
    } catch {}
  }

  // ─── Device-Aware Delivery ─────────────────────────────────────────────────

  /**
   * Detect device tier for quality scaling.
   * @returns {'lite'|'standard'|'flagship'|'premium'}
   */
  getDeviceTier() {
    // Check GPU capabilities
    const /** @type {any} */
canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return 'lite';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';

    // Check memory (rough estimate)
    const memory = (/** @type {any} */ (navigator)).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;

    // Check mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Tier classification
    if (memory >= 8 && cores >= 8 && !isMobile) {
      // High-end desktop
      if (renderer.toLowerCase().includes('nvidia') || renderer.toLowerCase().includes('amd') || renderer.toLowerCase().includes('intel')) {
        return renderer.toLowerCase().includes('rtx') || renderer.toLowerCase().includes('radeon') ? 'premium' : 'flagship';
      }
      return 'flagship';
    }

    if (memory >= 4 && cores >= 4) {
      return isMobile ? 'standard' : 'flagship';
    }

    if (memory >= 2 && cores >= 2) {
      return isMobile ? 'lite' : 'standard';
    }

    return 'lite';
  }

  /**
   * Get quality settings based on device tier.
  * @param {string} [tier]  Device tier from getDeviceTier()
   * @returns {{ particles: number, shadows: boolean, antialias: boolean, maxLights: number, textureQuality: 'low'|'medium'|'high' }}
   */
  scaleQuality(/** @type {any} */ tier = '') {
    const deviceTier = tier || this.getDeviceTier();

    const /** @type {any} */
presets = {
      lite: {
        particles: 50,
        shadows: false,
        antialias: false,
        maxLights: 2,
        textureQuality: 'low'
      },
      standard: {
        particles: 100,
        shadows: true,
        antialias: true,
        maxLights: 4,
        textureQuality: 'medium'
      },
      flagship: {
        particles: 200,
        shadows: true,
        antialias: true,
        maxLights: 6,
        textureQuality: 'high'
      },
      premium: {
        particles: 400,
        shadows: true,
        antialias: true,
        maxLights: 8,
        textureQuality: 'high'
      }
    };

    return (/** @type {any} */ (presets))[deviceTier] || presets.standard;
  }

  /** Disconnect all active observers (cleanup). */
  destroy() {
    this._observers.forEach((/** @type {any} */ obs) => obs.disconnect());
    this._observers = [];
    this.monetization = null;
  }
}
