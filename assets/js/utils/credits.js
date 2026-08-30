/**
 * EONAPP Oracle Credits System
 * @deprecated VA3/S4-10: Credits are being migrated to Pool Points.
 * On first load, any existing credit balance is converted 1:1 to Pool Points
 * via window.PoolPoints.award('credit-migration', balance) and the legacy
 * storage key is cleared. This file remains for backward compatibility only.
 * New features should use Pool Points (pool-points.js) directly.
 *
 * Manages localStorage credits, badge injection, earn/spend logic.
 * Usage: loaded by any page; automatically injects badge into .header-inner
 */
(function () {
  'use strict';
  const appWin = /** @type {any} */ (window);

  const KEY = 'eon:credits:v1';
  const MIGRATED_KEY = 'eon:credits-migrated:v1';
  const VISIT_KEY = 'eon:last-visit';
  const TOOL_KEY_PREFIX = 'eon:tool-credit:';
  const REF_KEY = 'eon:referral-credits';

  function normalizeCreditAmount(/** @type {any} */ value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100) / 100;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      const data = raw ? JSON.parse(raw) : { credits: 0, earned: 0 };
      if (typeof data.credits !== 'number') data.credits = 0;
      if (typeof data.earned !== 'number') data.earned = 0;
      return data;
    } catch { return { credits: 0, earned: 0 }; }
  }

  function save(/** @type {any} */ data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  }

  const /** @type {any} */
Credits = {
    get() { return load().credits; },

    /** @param {number} n @param {string} reason */
    add(/** @type {any} */ n, /** @type {any} */ reason) {
      const safeN = normalizeCreditAmount(n);
      if (safeN <= 0) return load().credits;
      if (safeN > 10000) { if (appWin.DEBUG) console.warn('[Credits] add capped at 10000'); return load().credits; }
      const data = load();
      data.credits = Math.max(0, normalizeCreditAmount(data.credits || 0) + safeN);
      data.earned = normalizeCreditAmount(data.earned || 0) + safeN;
      save(data);
      Credits._notify(reason);
      return data.credits;
    },

    spend(/** @type {any} */ n) {
      const safeN = normalizeCreditAmount(n);
      if (safeN <= 0) return false;
      const data = load();
      if ((data.credits || 0) < safeN) return false;
      data.credits = normalizeCreditAmount((data.credits || 0) - safeN);
      save(data);
      Credits._notify('spend');
      return true;
    },

    canSpend(/** @type {any} */ n) {
      const safeN = normalizeCreditAmount(n);
      return safeN > 0 && load().credits >= safeN;
    },

    // Mark a tool as having awarded its first-complete credit
    awardToolCredit(/** @type {any} */ toolId) {
      const key = TOOL_KEY_PREFIX + toolId;
      if (localStorage.getItem(key)) return false;
      localStorage.setItem(key, '1');
      Credits.add(1, 'tool-complete');
      return true;
    },

    // Daily return bonus
    checkDailyBonus() {
      const today = new Date().toISOString().slice(0, 10);
      const last = localStorage.getItem(VISIT_KEY);
      if (last !== today) {
        localStorage.setItem(VISIT_KEY, today);
        if (last) Credits.add(0.5, 'daily-return');
      }
    },

    // Sponsor visit award (call after 3s delay on sponsor tab open)
    awardSponsor(/** @type {any} */ sponsorId) {
      const safeId = String(sponsorId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
      if (!safeId) return false;
      const key = `eon:sponsor:${safeId}:ts`;
      const last = localStorage.getItem(key);
      const now = Date.now();
      // Prevent re-award within 24h
      if (last && (now - parseInt(last, 10)) < 86400000) return false;
      localStorage.setItem(key, String(now));
      Credits.add(2, 'sponsor');
      return true;
    },

    // Handle referral credit logging
    logReferral(/** @type {any} */ refName) {
      const safeName = String(refName || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
      if (!safeName) return false;
      const key = `eon:ref:${btoa(safeName.slice(0, 20))}`;
      if (localStorage.getItem(key)) return false;
      localStorage.setItem(key, '1');
      const total = parseInt(localStorage.getItem(REF_KEY) || '0', 10) + 1;
      localStorage.setItem(REF_KEY, String(total));
      Credits.add(1, 'referral');
      return true;
    },

    _notify(/** @type {any} */ reason) {
      document.dispatchEvent(new CustomEvent('credits-changed', { detail: { credits: Credits.get(), reason } }));
    }
  };

  // Badge injection
  function injectBadge() {
    const /** @type {any} */
header = document.querySelector('.header-inner');
    if (!header) return;
    // Site shell owns profile link rendering; only clean up accidental duplicates.
    const links = Array.from(header.querySelectorAll('a[href*="vault.html#profile"]'));
    if (links.length > 1) {
      links.slice(1).forEach((/** @type {any} */ node) => node.remove());
    }
  }

  function updateBadge(/** @type {any} */ animate) {
    const /** @type {any} */
el = document.querySelector('.credits-count');
    if (!el) return;
    el.textContent = String(Math.floor(Credits.get()));
    if (animate) {
      const badge = el.closest('.credits-badge');
      if (badge) {
        badge.classList.remove('pulse');
        void (/** @type {HTMLElement} */ (badge)).offsetWidth;
        badge.classList.add('pulse');
      }
    }
  }

  document.addEventListener('credits-changed', (/** @type {any} */ e) => {
    updateBadge(e.detail && e.detail.reason !== 'spend');
  });

  // Check referral param on load
  function checkReferral() {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        const name = atob(ref).slice(0, 40);
        if (name) Credits.logReferral(name);
      }
    } catch {}
  }

  // Init on DOM ready
  function init() {
    // VA3/S4-10: Migrate legacy credits to Pool Points (one-time, non-destructive)
    if (!localStorage.getItem(MIGRATED_KEY)) {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const data = JSON.parse(raw);
          const balance = Math.floor(Number(data.credits) || 0);
          if (balance > 0 && appWin.PoolPoints && typeof appWin.PoolPoints.award === 'function') {
            appWin.PoolPoints.award('credit-migration', balance);
          }
        }
      } catch {}
      localStorage.setItem(MIGRATED_KEY, '1');
    }
    Credits.checkDailyBonus();
    checkReferral();
    injectBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  appWin.EonCredits = Credits;
})();
export {};
