/**
 * W520 chat-session-state contract.
 *
 * Browser-local daily guide accounting and mission UI state. This module has no
 * provider, network, entitlement, reward, posting, or identity side effects.
 */

export const CHAT_DAILY_FREE_GUIDE_LIMIT = 100;
export const CHAT_DAILY_GUIDE_USAGE_KEY = 'eon:chat:daily-guide-usage:v1';
export const CHAT_MISSION_TIMELINE_KEY = 'eon:workbench:mission-timeline:v1';
export const CHAT_MISSION_UI_MODE_KEY = 'eon:chat:mission-ui-mode:v1';

function resolveStorage(storage) {
  try { return storage || globalThis.localStorage || null; } catch { return null; }
}

function asDate(now) {
  try {
    const value = typeof now === 'function' ? now() : new Date();
    return value instanceof Date ? value : new Date(value);
  } catch {
    return new Date();
  }
}

function todayKey(now) {
  return asDate(now).toISOString().slice(0, 10);
}

export function sanitizeChatInput(text) {
  return (text || '').trim().replace(/\s+/g, ' ').slice(0, 4000);
}

export function createChatDailyGuideUsageStore({
  storage = null,
  key = CHAT_DAILY_GUIDE_USAGE_KEY,
  limit = CHAT_DAILY_FREE_GUIDE_LIMIT,
  now = () => new Date(),
  isUnlimited = () => false
} = {}) {
  const safeLimit = Math.max(1, Math.floor(Number(limit || CHAT_DAILY_FREE_GUIDE_LIMIT)));
  const read = () => {
    try {
      const parsed = JSON.parse(resolveStorage(storage)?.getItem(key) || 'null');
      if (parsed?.day === todayKey(now)) {
        return { day: parsed.day, count: Math.max(0, Number(parsed.count || 0) || 0) };
      }
    } catch {}
    return { day: todayKey(now), count: 0 };
  };
  const write = (count) => {
    const next = { day: todayKey(now), count: Math.max(0, Math.floor(Number(count || 0))) };
    try { resolveStorage(storage)?.setItem(key, JSON.stringify(next)); } catch {}
    return next;
  };
  const getAllowance = () => {
    const usage = read();
    const unlimited = Boolean(isUnlimited?.());
    return Object.freeze({
      ...usage,
      limit: safeLimit,
      remaining: unlimited ? Infinity : Math.max(0, safeLimit - usage.count),
      unlimited
    });
  };
  const increment = () => {
    const allowance = getAllowance();
    if (allowance.unlimited) return allowance;
    const next = write(allowance.count + 1);
    return Object.freeze({ ...next, limit: safeLimit, remaining: Math.max(0, safeLimit - next.count), unlimited: false });
  };
  return Object.freeze({ read, write, getAllowance, increment });
}

export function createChatMissionTimelineStore({
  storage = null,
  timelineKey = CHAT_MISSION_TIMELINE_KEY,
  uiModeKey = CHAT_MISSION_UI_MODE_KEY,
  now = () => new Date()
} = {}) {
  const load = () => {
    try {
      const rows = JSON.parse(resolveStorage(storage)?.getItem(timelineKey) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  };
  const save = (rows) => {
    try { resolveStorage(storage)?.setItem(timelineKey, JSON.stringify(Array.isArray(rows) ? rows.slice(-40) : [])); } catch {}
  };
  const append = (entry = {}) => {
    const rows = load();
    rows.push({
      id: `mission-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ts: Date.now(),
      ...entry
    });
    save(rows);
    return rows[rows.length - 1];
  };
  const formatStamp = (ts) => {
    try {
      return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(Number(ts || Date.now())));
    } catch {
      return '';
    }
  };
  const getMode = () => {
    try { return resolveStorage(storage)?.getItem(uiModeKey) || 'simple'; } catch { return 'simple'; }
  };
  const setMode = (mode) => {
    try { resolveStorage(storage)?.setItem(uiModeKey, mode === 'advanced' ? 'advanced' : 'simple'); } catch {}
  };
  return Object.freeze({ load, save, append, formatStamp, getMode, setMode, now });
}
