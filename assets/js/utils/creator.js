/**
 * creator.js — Creator workspace state module
 *
 * Manages: content schedule, hook bank, sponsor planner, campaign tracker,
 * and creator pool preview (EonLite activity tracking).
 *
 * All state is localStorage-first. No server calls.
 * EonLite creator pool activity is logged to xp.js for pool preview via appWin.EonXP.
 */

const appWin = /** @type {any} */ (window);
/** @typedef {any} ContentItem */
/** @typedef {any} SavedHook */
/** @typedef {any} SponsorSlot */
/** @typedef {any} Campaign */

// ─── Storage keys ────────────────────────────────────────────────────────────

const KEY_SCHEDULE    = 'eon:creator-schedule:v1';
const KEY_HOOKS       = 'eon:creator-hooks:v1';
const KEY_SPONSORS    = 'eon:creator-sponsors:v1';
const KEY_CAMPAIGNS   = 'eon:creator-campaigns:v1';
const KEY_POOL_LOG    = 'eon:creator-pool-log:v1';

// ─── Constants ───────────────────────────────────────────────────────────────

export const /** @type {any} */
PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'X/Twitter', 'LinkedIn', 'Newsletter', 'Podcast', 'Blog'];
export const /** @type {any} */
CONTENT_STATUSES = ['idea', 'scripted', 'filmed', 'editing', 'scheduled', 'published', 'archived'];
export const /** @type {any} */
CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'completed', 'cancelled'];
export const /** @type {any} */
SPONSOR_STATUSES  = ['prospect', 'negotiating', 'confirmed', 'live', 'paid', 'declined'];

// Points awarded to creator pool for each activity
const /** @type {any} */
POOL_POINTS = {
  'post-published':   10,
  'hook-saved':       2,
  'campaign-active':  5,
  'sponsor-confirmed': 15,
  'schedule-7-days':  8,   // bonus for planning a full week
};

// ─── Generic persistence helpers ─────────────────────────────────────────────

function readStore(/** @type {any} */ key, /** @type {any} */ fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(/** @type {any} */ key, /** @type {any} */ value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function generateId(/** @type {any} */ prefix = 'c') {
  return `${prefix}_${Date.now().toString(36)}_${crypto.getRandomValues(new Uint8Array(3)).reduce((/** @type {any} */ s,/** @type {any} */ b)=>s+b.toString(36).padStart(2,'0'),'')}`;
}

// ─── Creator Pool ─────────────────────────────────────────────────────────────

/**
 * Award creator pool points for an activity.
 * @param {string} activityKey - key in POOL_POINTS
 * @param {string} [label] - human-readable label for the log
 */
export function awardPoolPoints(/** @type {any} */ activityKey, /** @type {any} */ label = '') {
  const pts = POOL_POINTS[activityKey] || 0;
  if (!pts) return;

  const log = readStore(KEY_POOL_LOG, []);
  log.unshift({ id: generateId('pl'), activityKey, pts, label, ts: Date.now() });
  writeStore(KEY_POOL_LOG, log.slice(0, 200)); // keep last 200

  // Also award XP so vault pool preview tracks it
  try {
    appWin.EonXP?.addXP?.('tool-completed', `creator:${activityKey}`);
  } catch {}
}

/**
 * Get total creator pool points earned this epoch (last 30 days).
 * @returns {{ total: number, log: Array<{ts: number, pts: number}> }}
 */
export function getCreatorPoolSummary() {
  const log = readStore(KEY_POOL_LOG, []);
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = log.filter((/** @type {any} */ entry) => entry.ts >= cutoff);
  const total  = recent.reduce((/** @type {any} */ sum, /** @type {any} */ entry) => sum + entry.pts, 0);
  return { total, log: recent };
}

// ─── Content Schedule ─────────────────────────────────────────────────────────

/**
 * @returns {Array<ContentItem>} all schedule items sorted by planned date
 */
export function getSchedule() {
  const items = readStore(KEY_SCHEDULE, []);
  return items.sort((/** @type {any} */ a, /** @type {any} */ b) => (a.plannedDate || '') < (b.plannedDate || '') ? -1 : 1);
}

/**
 * Add a content item to the schedule.
 * @param {{ title: string, platform: string, hook?: string, status?: string, plannedDate?: string, notes?: string }} data
 * @returns {ContentItem}
 */
export function addScheduleItem(/** @type {any} */ data) {
  const items = readStore(KEY_SCHEDULE, []);
  const /** @type {any} */
item  = {
    id:          generateId('s'),
    title:       String(data.title || '').trim().slice(0, 200),
    platform:    PLATFORMS.includes(data.platform) ? data.platform : PLATFORMS[0],
    hook:        String(data.hook || '').trim().slice(0, 300),
    status:      CONTENT_STATUSES.includes(data.status) ? data.status : 'idea',
    plannedDate: data.plannedDate || '',
    notes:       String(data.notes || '').trim().slice(0, 500),
    createdAt:   Date.now(),
    updatedAt:   Date.now()
  };
  items.unshift(item);
  writeStore(KEY_SCHEDULE, items.slice(0, 365)); // keep 1 year

  // Bonus: if 7+ items planned this week, award schedule bonus
  const weekAhead = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const thisWeek  = items.filter((/** @type {any} */ i) => i.plannedDate && new Date(i.plannedDate).getTime() <= weekAhead);
  if (thisWeek.length === 7) {
    awardPoolPoints('schedule-7-days', '7-day content plan filled');
  }

  return item;
}

/**
 * Update a content item's status or fields.
 * @param {string} id
 * @param {Partial<ContentItem>} changes
 * @returns {ContentItem|null}
 */
export function updateScheduleItem(/** @type {any} */ id, /** @type {any} */ changes) {
  const items = readStore(KEY_SCHEDULE, []);
  const idx   = items.findIndex((/** @type {any} */ i) => i.id === id);
  if (idx < 0) return null;

  const prev   = items[idx];
  const /** @type {any} */
updated = {
    ...prev,
    ...changes,
    id:        prev.id,
    createdAt: prev.createdAt,
    updatedAt: Date.now()
  };
  // Sanitize
  if (changes.status && !CONTENT_STATUSES.includes(changes.status)) updated.status = prev.status;
  if (changes.platform && !PLATFORMS.includes(changes.platform))    updated.platform = prev.platform;
  if (changes.title)    updated.title    = String(changes.title).trim().slice(0, 200);
  if (changes.hook)     updated.hook     = String(changes.hook).trim().slice(0, 300);
  if (changes.notes)    updated.notes    = String(changes.notes).trim().slice(0, 500);

  items[idx] = updated;
  writeStore(KEY_SCHEDULE, items);

  if (changes.status === 'published' && prev.status !== 'published') {
    awardPoolPoints('post-published', `Published: ${updated.title}`);
  }

  return updated;
}

/**
 * Delete a schedule item.
 * @param {string} id
 */
export function deleteScheduleItem(/** @type {any} */ id) {
  const items = readStore(KEY_SCHEDULE, []);
  writeStore(KEY_SCHEDULE, items.filter((/** @type {any} */ i) => i.id !== id));
}

// ─── Hook Bank ────────────────────────────────────────────────────────────────

/**
 * @returns {Array<SavedHook>} all saved hooks, newest first
 */
export function getHooks() {
  return readStore(KEY_HOOKS, []);
}

/**
 * Save a hook to the hook bank.
 * @param {{ text: string, platform?: string, topic?: string, score?: number }} data
 * @returns {SavedHook}
 */
export function saveHook(/** @type {any} */ data) {
  const hooks = readStore(KEY_HOOKS, []);
  const /** @type {any} */
hook  = {
    id:       generateId('h'),
    text:     String(data.text || '').trim().slice(0, 400),
    platform: data.platform || '',
    topic:    String(data.topic || '').trim().slice(0, 100),
    score:    typeof data.score === 'number' ? data.score : null,
    savedAt:  Date.now()
  };
  hooks.unshift(hook);
  writeStore(KEY_HOOKS, hooks.slice(0, 100)); // keep 100 hooks
  awardPoolPoints('hook-saved', `Hook saved: ${hook.text.slice(0, 40)}`);
  return hook;
}

/**
 * Delete a saved hook.
 * @param {string} id
 */
export function deleteHook(/** @type {any} */ id) {
  const hooks = readStore(KEY_HOOKS, []);
  writeStore(KEY_HOOKS, hooks.filter((/** @type {any} */ h) => h.id !== id));
}

// ─── Sponsor Planner ──────────────────────────────────────────────────────────

/**
 * @returns {Array<SponsorSlot>} all sponsor slots, newest first
 */
export function getSponsors() {
  return readStore(KEY_SPONSORS, []);
}

/**
 * Add a sponsor slot.
 * @param {{ brand: string, platform: string, status?: string, rate?: number, currency?: string, slot?: string, startDate?: string, endDate?: string, notes?: string }} data
 * @returns {SponsorSlot}
 */
export function addSponsor(/** @type {any} */ data) {
  const sponsors = readStore(KEY_SPONSORS, []);
  const /** @type {any} */
slot = {
    id:        generateId('sp'),
    brand:     String(data.brand || '').trim().slice(0, 100),
    platform:  PLATFORMS.includes(data.platform) ? data.platform : '',
    rate:      typeof data.rate === 'number' && data.rate >= 0 ? data.rate : null,
    currency:  String(data.currency || 'USD').trim().slice(0, 5).toUpperCase(),
    slot:      String(data.slot || '').trim().slice(0, 100), // e.g. "Pre-roll 60s"
    status:    SPONSOR_STATUSES.includes(data.status) ? data.status : 'prospect',
    startDate: data.startDate || '',
    endDate:   data.endDate   || '',
    notes:     String(data.notes || '').trim().slice(0, 500),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  sponsors.unshift(slot);
  writeStore(KEY_SPONSORS, sponsors.slice(0, 200));
  return slot;
}

/**
 * Update a sponsor slot.
 * @param {string} id
 * @param {Partial<SponsorSlot>} changes
 * @returns {SponsorSlot|null}
 */
export function updateSponsor(/** @type {any} */ id, /** @type {any} */ changes) {
  const sponsors = readStore(KEY_SPONSORS, []);
  const idx      = sponsors.findIndex((/** @type {any} */ s) => s.id === id);
  if (idx < 0) return null;

  const prev    = sponsors[idx];
  const /** @type {any} */
updated = { ...prev, ...changes, id: prev.id, createdAt: prev.createdAt, updatedAt: Date.now() };
  if (changes.status && !SPONSOR_STATUSES.includes(changes.status)) updated.status = prev.status;
  if (changes.brand)   updated.brand   = String(changes.brand).trim().slice(0, 100);
  if (changes.notes)   updated.notes   = String(changes.notes).trim().slice(0, 500);
  if (typeof changes.rate !== 'undefined' && changes.rate !== null) {
    updated.rate = Math.max(0, Number(changes.rate) || 0);
  }

  sponsors[idx] = updated;
  writeStore(KEY_SPONSORS, sponsors);

  if (changes.status === 'confirmed' && prev.status !== 'confirmed') {
    awardPoolPoints('sponsor-confirmed', `Sponsor confirmed: ${updated.brand}`);
  }

  return updated;
}

/**
 * Delete a sponsor slot.
 * @param {string} id
 */
export function deleteSponsor(/** @type {any} */ id) {
  const sponsors = readStore(KEY_SPONSORS, []);
  writeStore(KEY_SPONSORS, sponsors.filter((/** @type {any} */ s) => s.id !== id));
}

// ─── Campaign Tracker ─────────────────────────────────────────────────────────

/**
 * @returns {Array<Campaign>} all campaigns, newest first
 */
export function getCampaigns() {
  return readStore(KEY_CAMPAIGNS, []);
}

/**
 * Add a campaign.
 * @param {{ name: string, platform: string, status?: string, goal?: string, metric?: string, target?: number, startDate?: string, endDate?: string, notes?: string }} data
 * @returns {Campaign}
 */
export function addCampaign(/** @type {any} */ data) {
  const campaigns = readStore(KEY_CAMPAIGNS, []);
  const /** @type {any} */
campaign  = {
    id:        generateId('cm'),
    name:      String(data.name || '').trim().slice(0, 150),
    platform:  PLATFORMS.includes(data.platform) ? data.platform : '',
    goal:      String(data.goal || '').trim().slice(0, 200),   // e.g. "1000 new followers"
    metric:    String(data.metric || '').trim().slice(0, 80),  // e.g. "followers", "views"
    target:    typeof data.target === 'number' && data.target > 0 ? data.target : null,
    actual:    null,
    status:    CAMPAIGN_STATUSES.includes(data.status) ? data.status : 'draft',
    startDate: data.startDate || '',
    endDate:   data.endDate   || '',
    notes:     String(data.notes || '').trim().slice(0, 500),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  campaigns.unshift(campaign);
  writeStore(KEY_CAMPAIGNS, campaigns.slice(0, 100));
  return campaign;
}

/**
 * Update a campaign (status, actual metric, notes).
 * @param {string} id
 * @param {Partial<Campaign>} changes
 * @returns {Campaign|null}
 */
export function updateCampaign(/** @type {any} */ id, /** @type {any} */ changes) {
  const campaigns = readStore(KEY_CAMPAIGNS, []);
  const idx       = campaigns.findIndex((/** @type {any} */ c) => c.id === id);
  if (idx < 0) return null;

  const prev    = campaigns[idx];
  const /** @type {any} */
updated = { ...prev, ...changes, id: prev.id, createdAt: prev.createdAt, updatedAt: Date.now() };
  if (changes.status && !CAMPAIGN_STATUSES.includes(changes.status)) updated.status = prev.status;
  if (changes.name)   updated.name   = String(changes.name).trim().slice(0, 150);
  if (changes.goal)   updated.goal   = String(changes.goal).trim().slice(0, 200);
  if (changes.notes)  updated.notes  = String(changes.notes).trim().slice(0, 500);
  if (typeof changes.actual !== 'undefined') {
    updated.actual = changes.actual !== null ? Math.max(0, Number(changes.actual) || 0) : null;
  }
  if (typeof changes.target !== 'undefined') {
    updated.target = changes.target !== null ? Math.max(0, Number(changes.target) || 0) : null;
  }

  campaigns[idx] = updated;
  writeStore(KEY_CAMPAIGNS, campaigns);

  if (changes.status === 'active' && prev.status !== 'active') {
    awardPoolPoints('campaign-active', `Campaign active: ${updated.name}`);
  }

  return updated;
}

/**
 * Delete a campaign.
 * @param {string} id
 */
export function deleteCampaign(/** @type {any} */ id) {
  const campaigns = readStore(KEY_CAMPAIGNS, []);
  writeStore(KEY_CAMPAIGNS, campaigns.filter((/** @type {any} */ c) => c.id !== id));
}

// ─── Export / Import ──────────────────────────────────────────────────────────

/**
 * Export all creator workspace data as a downloadable JSON blob.
 * @returns {string} JSON string of all creator data
 */
export function exportCreatorData() {
  return JSON.stringify({
    version:   '1.0',
    exportedAt: new Date().toISOString(),
    schedule:  readStore(KEY_SCHEDULE, []),
    hooks:     readStore(KEY_HOOKS, []),
    sponsors:  readStore(KEY_SPONSORS, []),
    campaigns: readStore(KEY_CAMPAIGNS, []),
  }, null, 2);
}

/**
 * Import creator workspace data (replaces existing).
 * @param {string} jsonString
 * @returns {{ ok: boolean, error?: string }}
 */
export function importCreatorData(/** @type {any} */ jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') return { ok: false, error: 'Invalid JSON' };
    if (data.version !== '1.0') return { ok: false, error: 'Unsupported version' };

    if (Array.isArray(data.schedule))  writeStore(KEY_SCHEDULE,  data.schedule);
    if (Array.isArray(data.hooks))     writeStore(KEY_HOOKS,     data.hooks);
    if (Array.isArray(data.sponsors))  writeStore(KEY_SPONSORS,  data.sponsors);
    if (Array.isArray(data.campaigns)) writeStore(KEY_CAMPAIGNS, data.campaigns);

    return { ok: true };
  } catch (/** @type {any} */
err) {
    return { ok: false, error: String(err?.message || 'Parse error') };
  }
}

/**
 * Get summary stats for the creator workspace dashboard.
 * @returns {{ scheduledCount: number, publishedCount: number, activeHooks: number, activeSponsors: number, activeCampaigns: number, poolPoints: number }}
 */
export function getWorkspaceSummary() {
  const schedule  = readStore(KEY_SCHEDULE, []);
  const hooks     = readStore(KEY_HOOKS, []);
  const sponsors  = readStore(KEY_SPONSORS, []);
  const campaigns = readStore(KEY_CAMPAIGNS, []);
  const { total: poolPoints } = getCreatorPoolSummary();

  return {
    scheduledCount:  schedule.filter((/** @type {any} */ i) => ['idea', 'scripted', 'filmed', 'editing', 'scheduled'].includes(i.status)).length,
    publishedCount:  schedule.filter((/** @type {any} */ i) => i.status === 'published').length,
    activeHooks:     hooks.length,
    activeSponsors:  sponsors.filter((/** @type {any} */ s) => ['confirmed', 'live', 'negotiating'].includes(s.status)).length,
    activeCampaigns: campaigns.filter((/** @type {any} */ c) => c.status === 'active').length,
    poolPoints
  };
}
