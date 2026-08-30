/**
 * EONAPP XP & Level System — WorkBench Era (S4 update)
 * Tracks user experience points, levels 1-100, WorkBench activity rewards.
 * Fires level-up events → triggers lootbox drops.
 * Separate from Pool Points (Pool Points = economic share; XP = reputation/progression)
 */
(function () {
  'use strict';

  // Browser global type cast for custom window properties
  const appWin = /** @type {any} */ (window);

  const XP_KEY = 'eon:xp:v1';
  // XP required to reach each level (cumulative). Level 1 = 0 XP.
  // Formula: level N needs N*N*80 cumulative XP (quadratic growth slows at high levels)
  const LEVEL_THRESHOLDS = (function () {
    const /** @type {any} */
t = [0]; // index = level, value = cumulative XP needed
    for (let i = 1; i <= 100; i++) t.push(Math.floor(i * i * 80));
    return t;
  })();

  // Activity XP reward table — WorkBench era
  const /** @type {any} */
ACTIVITY_REWARDS = {
    // Legacy alias kept for compatibility with existing callers/tests.
    'game-played':        { xp: 50,  label: 'Played a game',                  daily: true,  dailyCap: 5 },
    // WorkBench core activities
    'mission-run':         { xp: 60,  label: 'Completed a WorkBench mission', daily: true,  dailyCap: 10 },
    'ai-inference':        { xp: 20,  label: 'AI inference call',             daily: true,  dailyCap: 20 },
    'code-generated':      { xp: 40,  label: 'Generated code',                daily: true,  dailyCap: 8 },
    'analysis-run':        { xp: 35,  label: 'Ran an analysis',               daily: true,  dailyCap: 8 },
    'hive-query':          { xp: 50,  label: 'Ran a Hive query',              daily: true,  dailyCap: 5 },
    'signal-run':          { xp: 50,  label: 'Signal research query',         daily: true,  dailyCap: 6 },
    'agent-task':          { xp: 100, label: 'Completed an Agent task',       daily: true,  dailyCap: 4 },
    // Creator & social
    'content-published':   { xp: 80,  label: 'Published content',             daily: true,  dailyCap: 3 },
    'moderation-review':   { xp: 30,  label: 'Moderation review completed',   daily: true,  dailyCap: 10 },
    // IoT / Voice / Language
    'iot-command':         { xp: 15,  label: 'IoT device command',            daily: true,  dailyCap: 20 },
    'voice-session':       { xp: 25,  label: 'Voice session used',            daily: true,  dailyCap: 5 },
    'translation-run':     { xp: 20,  label: 'Translation completed',         daily: true,  dailyCap: 10 },
    // NFT & economy
    'lootbox-opened':      { xp: 10,  label: 'Opened a lootbox',              daily: true,  dailyCap: 3 },
    'nft-merged':          { xp: 50,  label: 'Merged NFTs',                   daily: true,  dailyCap: 2 },
    'anchor-submitted':    { xp: 200, label: 'Submitted on-chain proof',      daily: false, dailyCap: 0 },
    // Social & referrals
    'challenge-sent':      { xp: 40,  label: 'Sent a challenge',              daily: true,  dailyCap: 3 },
    'challenge-won':       { xp: 100, label: 'Won a challenge',               daily: true,  dailyCap: 2 },
    'share':               { xp: 30,  label: 'Shared a result',               daily: true,  dailyCap: 5 },
    'referral':            { xp: 200, label: 'Referred a friend',             daily: false, dailyCap: 0 },
    // Milestones
    'daily-login':         { xp: 15,  label: 'Daily login',                   daily: true,  dailyCap: 1 },
    'profile-set':         { xp: 50,  label: 'Set up profile',                daily: false, dailyCap: 0, oneTime: true },
    'subscription':        { xp: 500, label: 'Subscribed',                    daily: false, dailyCap: 0, oneTime: true },
  };

  function today() { return new Date().toISOString().slice(0, 10); }

  function load() {
    try {
      const raw = localStorage.getItem(XP_KEY);
      const d = raw ? JSON.parse(raw) : {};
      const activities = d.activities && typeof d.activities === 'object' && !Array.isArray(d.activities) ? d.activities : {};
      return {
        totalXp:    Number.isFinite(Number(d.totalXp)) ? Math.max(0, Math.floor(Number(d.totalXp))) : 0,
        level:      Number.isFinite(Number(d.level)) ? Math.max(1, Math.min(100, Math.floor(Number(d.level)))) : 1,
        activities
      };
    } catch { return { totalXp: 0, level: 1, activities: {} }; }
  }

  function save(/** @type {any} */ d) {
    try { localStorage.setItem(XP_KEY, JSON.stringify(d)); } catch {}
  }

  // Recalculate correct level from XP
  function recalcLevel(/** @type {any} */ totalXp) {
    for (let i = 100; i >= 1; i--) {
      if (totalXp >= LEVEL_THRESHOLDS[i]) return Math.min(i, 100);
    }
    return 1;
  }

  // Check daily cap for an activity
  function checkDailyCap(/** @type {any} */ data, /** @type {any} */ activityId, /** @type {any} */ cap) {
    const k = activityId + ':' + today();
    const count = (data.activities[k] || 0);
    if (cap > 0 && count >= cap) return false;
    data.activities[k] = count + 1;
    // Prune old activity keys (keep only last 7 days to limit storage)
    const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    for (const /** @type {any} */
key of Object.keys(data.activities)) {
      const parts = key.split(':');
      const datePart = parts[parts.length - 1];
      if (!datePart || datePart < cutoff) delete data.activities[key];
    }
    return true;
  }

  const /** @type {any} */
XP = {
    /** Get current XP state */
    getState() {
      const d = load();
      const lvl = recalcLevel(d.totalXp);
      const nextLvl = Math.min(lvl + 1, 100);
      const currentFloor = LEVEL_THRESHOLDS[lvl - 1] || 0;
      const nextFloor = LEVEL_THRESHOLDS[lvl] || LEVEL_THRESHOLDS[100];
      const progress = nextFloor > currentFloor
        ? (d.totalXp - currentFloor) / (nextFloor - currentFloor)
        : 1;
      return {
        totalXp: d.totalXp,
        level: lvl,
        nextLevel: nextLvl,
        xpIntoLevel: d.totalXp - currentFloor,
        xpForNextLevel: nextFloor - currentFloor,
        progressPct: Math.min(Math.round(progress * 100), 100)
      };
    },

    /** Award XP for an activity. Returns { xpGained, levelsGained, newLevel } */
    award(/** @type {any} */ activityId, /** @type {any} */ multiplier) {
      multiplier = typeof multiplier === 'number' ? Math.max(1, Math.floor(multiplier)) : 1;
      const reward = ACTIVITY_REWARDS[activityId];
      if (!reward) return null;

      const data = load();
      const oldLevel = recalcLevel(data.totalXp);

      // Daily cap check
      if (reward.daily) {
        if (!checkDailyCap(data, activityId, reward.dailyCap)) return null;
      } else if (reward.oneTime) {
        const oneTimeKey = 'ot:' + activityId;
        if (data.activities[oneTimeKey]) {
          return null;
        }
        data.activities[oneTimeKey] = 1;
      }

      const xpGained = reward.xp * multiplier;
      data.totalXp += xpGained;
      const newLevel = recalcLevel(data.totalXp);
      const levelsGained = newLevel - oldLevel;
      data.level = newLevel;
      save(data);

      const /** @type {any} */
result = { xpGained, levelsGained, newLevel, oldLevel, activityLabel: reward.label };
      XP._notify(result);

      // Trigger lootbox drop on level-up
      if (levelsGained > 0 && appWin.EonLootbox) {
        for (let i = 0; i < levelsGained; i++) {
          appWin.EonLootbox.dropLevelUpBox(newLevel - levelsGained + i + 1);
        }
      }
      return result;
    },

    /** Award score-based XP (game over callback) */
    awardScore(/** @type {any} */ gameId, /** @type {any} */ score) {
      if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1_000_000_000) {
        if (appWin.DEBUG) console.warn('[XP] Invalid score rejected:', score);
        return null;
      }
      if (typeof gameId !== 'string' || gameId.length > 64) {
        if (appWin.DEBUG) console.warn('[XP] Invalid gameId rejected:', gameId);
        return null;
      }
      const seasonMultiplier = Number(appWin.EonSeason?.getRewardMultiplier?.(gameId, score) || 1);
      const bonusXp = Math.floor((score / 500) * Math.max(1, seasonMultiplier));
      if (bonusXp <= 0) return null;
      const data = load();
      const oldLevel = recalcLevel(data.totalXp);
      // Score bonus uses a daily cap of 200 XP per game per day
      const capKey = 'score:' + gameId + ':' + today();
      const used = data.activities[capKey] || 0;
      const allowed = Math.max(0, 200 - used);
      const actual = Math.min(bonusXp, allowed);
      if (actual <= 0) return null;
      data.activities[capKey] = used + actual;
      data.totalXp += actual;
      const newLevel = recalcLevel(data.totalXp);
      data.level = newLevel;
      save(data);
      const /** @type {any} */
result = { xpGained: actual, levelsGained: newLevel - oldLevel, newLevel, oldLevel, activityLabel: 'Score bonus' };
      XP._notify(result);
      if (newLevel > oldLevel && appWin.EonLootbox) {
        appWin.EonLootbox.dropLevelUpBox(newLevel);
      }
      return result;
    },

    /** Level name (flavor text) */
    getLevelTitle(/** @type {any} */ lvl) {
      const /** @type {any} */
titles = [
        '', 'Wanderer', 'Seeker', 'Apprentice', 'Initiate', 'Scout',
        'Explorer', 'Challenger', 'Striker', 'Hunter', 'Sentinel',
        'Warrior', 'Duelist', 'Ranger', 'Adept', 'Guardian',
        'Champion', 'Enforcer', 'Warden', 'Vindicator', 'Arbiter',
        'Sage', 'Oracle', 'Arcanist', 'Harbinger', 'Phantom',
        'Warlord', 'Sovereign', 'Archon', 'Overlord', 'Paragon',
        'Mythic I', 'Mythic II', 'Mythic III', 'Mythic IV', 'Mythic V',
        'Legend I', 'Legend II', 'Legend III', 'Legend IV', 'Legend V',
        'Eternal I', 'Eternal II', 'Eternal III', 'Eternal IV', 'Eternal V',
        'Ascendant', 'Transcendent', 'Immortal', 'EON Master'
      ];
      return titles[Math.min(lvl, 50)] || 'EON Master';
    },

    _notify(/** @type {any} */ result) {
      document.dispatchEvent(new CustomEvent('xp-gained', { detail: result }));
      if (result.levelsGained > 0) {
        document.dispatchEvent(new CustomEvent('level-up', { detail: result }));
      }
    }
  };

  // XP bar injection (injects into header near credits badge)
  function injectXpBar() {
    if (document.querySelector('.xp-badge')) return;
    const /** @type {any} */
header = document.querySelector('.header-inner');
    if (!header) return;
    const /** @type {any} */
utilityRail = header.querySelector('.shell-utility-rail');
    const /** @type {any} */
mountTarget = utilityRail || header;

    const state = XP.getState();
    const /** @type {any} */
badge = document.createElement('a');
    badge.href = '/vault#xp';
    badge.className = 'xp-badge';
    badge.title = `Level ${state.level} - ${XP.getLevelTitle(state.level)}`;
    const /** @type {any} */
lvl = document.createElement('span');
    lvl.className = 'xp-lvl';
    lvl.textContent = `Lv${state.level}`;
    const /** @type {any} */
wrap = document.createElement('span');
    wrap.className = 'xp-bar-wrap';
    const /** @type {any} */
fill = document.createElement('span');
    fill.className = 'xp-bar-fill';
    fill.style.width = `${Math.max(0, Math.min(100, state.progressPct))}%`;
    wrap.appendChild(fill);
    badge.append(lvl, wrap);

    const /** @type {any} */
creditsBadge = mountTarget.querySelector('.credits-badge');
    if (creditsBadge) mountTarget.insertBefore(badge, creditsBadge);
    else mountTarget.appendChild(badge);
  }

  function updateXpBar() {
    const /** @type {any} */
badge = document.querySelector('.xp-badge');
    if (!badge) return;
    const state = XP.getState();
    const /** @type {any} */
lvl = badge.querySelector('.xp-lvl');
    const /** @type {any} */
fill = badge.querySelector('.xp-bar-fill');
    if (lvl) lvl.textContent = `Lv${state.level}`;
    if (fill) fill.style.width = state.progressPct + '%';
    badge.title = `Level ${state.level} - ${XP.getLevelTitle(state.level)}`;
  }

  document.addEventListener('xp-gained', () => updateXpBar());

  // Styles are provided in static CSS to avoid CSP inline-style violations.

  // Level-up toast notification
  document.addEventListener('level-up', (/** @type {any} */ e) => {
    const { newLevel } = e.detail;
    const title = XP.getLevelTitle(newLevel);
    const /** @type {any} */
toast = document.createElement('div');
    toast.className = 'level-up-toast';
    toast.append('⬆ Level Up! You are now ');
    const /** @type {any} */
strong = document.createElement('strong');
    strong.textContent = `Lv${newLevel} ${title}`;
    toast.append(strong, ' ✦');
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3100);
  });

  function init() {
    const xpAny = /** @type {any} */ (XP);
    xpAny.award('daily-login');
    injectXpBar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  appWin.EonXP = XP;
})();
