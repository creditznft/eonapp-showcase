const STATE_PREFIX = 'eon:challenge-state:';
const META_PREFIX = 'eon:challenge-meta:';
const DAILY_CHALLENGE_COUNT = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const CURRENT_STATE_VERSION = 2;
const /** @type {any} */
EVENT_LIMITS = {
  toolRun: { minIntervalMs: 700, maxPerDay: 120 },
  share: { minIntervalMs: 1200, maxPerDay: 40 },
  challengeWin: { minIntervalMs: 1200, maxPerDay: 40 },
  rewardedUnlock: { minIntervalMs: 1500, maxPerDay: 20 },
  vaultExport: { minIntervalMs: 3000, maxPerDay: 10 },
  favorite: { minIntervalMs: 450, maxPerDay: 60 }
};

const /** @type {any} */
CHALLENGE_TEMPLATES = [
  {
    id: 'tool-sprint',
    name: 'Tool Sprint',
    description: 'Run {target} tools today.',
    icon: '⚡',
    difficulty: 'easy',
    eventType: 'toolRun',
    targetRange: [2, 4],
    reward: { xpRange: [20, 35], badge: 'daily-tool-sprint' }
  },
  {
    id: 'share-spark',
    name: 'Share Spark',
    description: 'Share {target} result cards today.',
    icon: '📣',
    difficulty: 'easy',
    eventType: 'share',
    targetRange: [1, 2],
    reward: { xpRange: [18, 28], badge: 'daily-share-spark' }
  },
  {
    id: 'challenge-breaker',
    name: 'Challenge Breaker',
    description: 'Beat {target} challenge links today.',
    icon: '🏁',
    difficulty: 'medium',
    eventType: 'challengeWin',
    targetRange: [1, 2],
    reward: { xpRange: [28, 45], badge: 'daily-challenge-breaker' }
  },
  {
    id: 'bonus-hunter',
    name: 'Bonus Hunter',
    description: 'Open {target} optional bonus unlocks today.',
    icon: '🎁',
    difficulty: 'medium',
    eventType: 'rewardedUnlock',
    targetRange: [1, 2],
    reward: { xpRange: [25, 40], badge: 'daily-bonus-hunter' }
  },
  {
    id: 'vault-keeper',
    name: 'Vault Keeper',
    description: 'Export your vault {target} time today.',
    icon: '🧷',
    difficulty: 'easy',
    eventType: 'vaultExport',
    targetRange: [1, 1],
    reward: { xpRange: [16, 24], badge: 'daily-vault-keeper' }
  },
  {
    id: 'collector-pulse',
    name: 'Collector Pulse',
    description: 'Save {target} new favorites today.',
    icon: '⭐',
    difficulty: 'easy',
    eventType: 'favorite',
    targetRange: [1, 2],
    reward: { xpRange: [16, 26], badge: 'daily-collector-pulse' }
  }
];

const /** @type {any} */
VALID_EVENT_TYPES = new Set(CHALLENGE_TEMPLATES.map((/** @type {any} */ template) => template.eventType));

function readJson(/** @type {any} */ key, /** @type {any} */ fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(/** @type {any} */ key, /** @type {any} */ value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function clamp(/** @type {any} */ value, /** @type {any} */ min, /** @type {any} */ max) {
  return Math.min(max, Math.max(min, value));
}

function hashString(/** @type {any} */ input = '') {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getDateKey(/** @type {any} */ date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function previousDateKey(/** @type {any} */ dateKey) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return getDateKey(new Date(date.getTime() - DAY_MS));
}

function getStateKey(/** @type {any} */ userId, /** @type {any} */ dateKey = getDateKey()) {
  return `${STATE_PREFIX}${userId}:${dateKey}`;
}

function getMetaKey(/** @type {any} */ userId) {
  return `${META_PREFIX}${userId}`;
}

function getDefaultMeta() {
  return {
    currentStreak: 0,
    longestStreak: 0,
    totalXp: 0,
    totalCompleted: 0,
    lastCompletedDay: ''
  };
}

function pickInRange(/** @type {any} */ seed, /** @type {any} */ [min, max]) {
  return min + (seed % (max - min + 1));
}

function pickTemplates(/** @type {any} */ userId, /** @type {any} */ dayKey) {
  const /** @type {any} */
pool = [...CHALLENGE_TEMPLATES];
  const /** @type {any} */
selected = [];
  let cursor = hashString(`${userId}:${dayKey}:seed`);

  while (selected.length < DAILY_CHALLENGE_COUNT && pool.length) {
    const index = cursor % pool.length;
    selected.push(pool.splice(index, 1)[0]);
    cursor = hashString(`${cursor}:${selected.length}`);
  }

  return selected;
}

function createChallenge(/** @type {any} */ template, /** @type {any} */ seed, /** @type {any} */ index, /** @type {any} */ dayKey) {
  const target = pickInRange(hashString(`${seed}:target:${index}`), template.targetRange);
  const xp = pickInRange(hashString(`${seed}:xp:${index}`), template.reward.xpRange);

  return {
    id: `${template.id}:${dayKey}:${index}`,
    templateId: template.id,
    name: template.name,
    description: template.description.replace('{target}', target),
    icon: template.icon,
    difficulty: template.difficulty,
    eventType: template.eventType,
    target,
    current: 0,
    progress: 0,
    completed: false,
    completedAt: null,
    reward: {
      xp,
      badge: template.reward.badge
    }
  };
}

function buildDailyState(/** @type {any} */ userId, /** @type {any} */ dayKey = getDateKey()) {
  const seed = hashString(`${userId}:${dayKey}`);
  const challenges = pickTemplates(userId, dayKey).map((/** @type {any} */ template, /** @type {any} */ index) =>
    createChallenge(template, seed, index, dayKey)
  );

  return {
    version: CURRENT_STATE_VERSION,
    userId,
    dayKey,
    createdAt: new Date().toISOString(),
    completedAt: null,
    allCompleted: false,
    challenges,
    events: {}
  };
}

function normalizeEventLog(/** @type {any} */ rawEvents = {}) {
  if (!rawEvents || typeof rawEvents !== 'object') {
    return {};
  }

  return Object.entries(rawEvents).reduce((/** @type {any} */ acc, /** @type {any} */ [eventType, value]) => {
    if (!VALID_EVENT_TYPES.has(eventType) || !value || typeof value !== 'object') {
      return acc;
    }
    acc[eventType] = {
      count: clamp(Number(value.count || 0), 0, 500),
      lastAt: clamp(Number(value.lastAt || 0), 0, Date.now() + DAY_MS)
    };
    return acc;
  }, {});
}

function normalizeExistingState(/** @type {any} */ userId, /** @type {any} */ dayKey, /** @type {any} */ existing) {
  if (!existing || existing.dayKey !== dayKey || !Array.isArray(existing.challenges)) {
    return null;
  }

  if (existing.challenges.length === 0) {
    return null;
  }

  const normalizedChallenges = existing.challenges.slice(0, DAILY_CHALLENGE_COUNT).map((/** @type {any} */ challenge) => {
    const target = clamp(Number(challenge.target || 1), 1, 12);
    const current = clamp(Number(challenge.current || 0), 0, target);
    const completed = Boolean(challenge.completed || current >= target);
    return {
      ...challenge,
      target,
      current,
      progress: completed ? 100 : Math.round((current / target) * 100),
      completed,
      completedAt: completed ? challenge.completedAt || new Date().toISOString() : null,
      reward: {
        xp: clamp(Number(challenge.reward?.xp || 0), 0, 300),
        badge: challenge.reward?.badge || ''
      }
    };
  });

  if (normalizedChallenges.length === 0) {
    return null;
  }

  return {
    ...existing,
    version: CURRENT_STATE_VERSION,
    userId,
    dayKey,
    challenges: normalizedChallenges,
    events: normalizeEventLog(existing.events)
  };
}

function ensureDailyState(/** @type {any} */ userId) {
  const dayKey = getDateKey();
  const stateKey = getStateKey(userId, dayKey);
  const existing = readJson(stateKey, null);
  const normalized = normalizeExistingState(userId, dayKey, existing);
  if (normalized) {
    if (normalized.version !== existing?.version || !existing?.events) {
      writeJson(stateKey, normalized);
    }
    return normalized;
  }

  const created = buildDailyState(userId, dayKey);
  writeJson(stateKey, created);
  return created;
}

function saveDailyState(/** @type {any} */ userId, /** @type {any} */ state) {
  writeJson(getStateKey(userId, state.dayKey), state);
}

function ensureMeta(/** @type {any} */ userId) {
  const key = getMetaKey(userId);
  const existing = readJson(key, null);
  if (existing) {
    return { ...getDefaultMeta(), ...existing };
  }

  const created = getDefaultMeta();
  writeJson(key, created);
  return created;
}

function saveMeta(/** @type {any} */ userId, /** @type {any} */ meta) {
  writeJson(getMetaKey(userId), meta);
}

function updateStreak(/** @type {any} */ meta, /** @type {any} */ dayKey) {
  const yesterday = previousDateKey(dayKey);
  const currentStreak = meta.lastCompletedDay === yesterday ? meta.currentStreak + 1 : 1;

  return {
    ...meta,
    currentStreak,
    longestStreak: Math.max(meta.longestStreak || 0, currentStreak),
    lastCompletedDay: dayKey
  };
}

export function getChallengeSnapshot(/** @type {any} */ userId) {
  const state = ensureDailyState(userId);
  const meta = ensureMeta(userId);
  return { state, meta };
}

function gateChallengeEvent(/** @type {any} */ state, /** @type {any} */ eventType, /** @type {any} */ increment) {
  if (!VALID_EVENT_TYPES.has(eventType)) {
    return { allowed: false, reason: 'invalid-event' };
  }

  const limit = EVENT_LIMITS[eventType];
  if (!limit) {
    return { allowed: true };
  }

  const current = state.events?.[eventType] || { count: 0, lastAt: 0 };
  const now = Date.now();
  if (limit.minIntervalMs && now - Number(current.lastAt || 0) < limit.minIntervalMs) {
    return { allowed: false, reason: 'cooldown' };
  }
  if (limit.maxPerDay && Number(current.count || 0) + increment > limit.maxPerDay) {
    return { allowed: false, reason: 'daily-cap' };
  }

  return { allowed: true, now, current };
}

export function recordChallengeEvent(/** @type {any} */ userId, /** @type {any} */ eventType, /** @type {any} */ increment = 1) {
  const state = ensureDailyState(userId);
  let meta = ensureMeta(userId);
  const safeIncrement = clamp(Math.floor(Number(increment) || 1), 1, 5);
  const gate = gateChallengeEvent(state, eventType, safeIncrement);
  if (!gate.allowed) {
    return {
      state,
      meta,
      changed: false,
      newlyCompleted: [],
      dayCompleted: false,
      rateLimited: true,
      reason: gate.reason
    };
  }

  const /** @type {any} */
newlyCompleted = [];
  let changed = true;
  state.events = {
    ...(state.events || {}),
    [eventType]: {
      count: Number(gate.current?.count || 0) + safeIncrement,
      lastAt: gate.now || Date.now()
    }
  };

  state.challenges = state.challenges.map((/** @type {any} */ challenge) => {
    if (challenge.eventType !== eventType || challenge.completed) {
      return challenge;
    }

    const nextCurrent = clamp(challenge.current + safeIncrement, 0, challenge.target);
    if (nextCurrent === challenge.current) {
      return challenge;
    }

    const /** @type {any} */
next = {
      ...challenge,
      current: nextCurrent,
      progress: Math.round((nextCurrent / challenge.target) * 100)
    };

    if (nextCurrent >= challenge.target) {
      next.completed = true;
      next.completedAt = new Date().toISOString();
      next.progress = 100;
      newlyCompleted.push(next);
      meta = {
        ...meta,
        totalXp: (meta.totalXp || 0) + (next.reward?.xp || 0),
        totalCompleted: (meta.totalCompleted || 0) + 1
      };
    }

    return next;
  });

  let dayCompleted = false;
  if (!state.allCompleted && state.challenges.length && state.challenges.every((/** @type {any} */ challenge) => challenge.completed)) {
    state.allCompleted = true;
    state.completedAt = new Date().toISOString();
    meta = updateStreak(meta, state.dayKey);
    dayCompleted = true;
    changed = true;
  }

  if (changed) {
    saveDailyState(userId, state);
    saveMeta(userId, meta);
  }

  return {
    state,
    meta,
    changed,
    newlyCompleted,
    dayCompleted,
    rateLimited: false,
    reason: null
  };
}

export function getChallengeToastMessages(/** @type {any} */ update) {
  if (!update) {
    return [];
  }

  if (update.rateLimited) {
    return [];
  }

  const /** @type {any} */
messages = [];
  if (update.newlyCompleted?.length) {
    const xp = update.newlyCompleted.reduce((/** @type {any} */ sum, /** @type {any} */ challenge) => sum + (challenge.reward?.xp || 0), 0);
    if (update.newlyCompleted.length === 1) {
      const first = update.newlyCompleted[0];
      messages.push(`${first.icon} ${first.name} complete${xp ? ` · +${xp} XP` : ''}`);
    } else {
      messages.push(`✅ ${update.newlyCompleted.length} challenges complete${xp ? ` · +${xp} XP` : ''}`);
    }
  }

  if (update.dayCompleted) {
    const streak = update.meta?.currentStreak || 1;
    messages.push(`Daily streak complete · ${streak} day${streak === 1 ? '' : 's'} in a row`);
  }

  return messages;
}
