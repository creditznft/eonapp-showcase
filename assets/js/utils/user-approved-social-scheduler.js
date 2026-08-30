/**
 * user-approved-social-scheduler.js
 * W25 approval-first social scheduling integration.
 *
 * It creates local schedule items and opens official composer/share intents only
 * after user approval. It never posts secretly and never bypasses platform UI.
 */

const QUEUE_KEY = 'eon:social:approval-schedule:v1';
const AUDIT_KEY = 'eon:social:approval-schedule-audit:v1';

/**
 * @typedef {Object} SocialPlatform
 * @property {string} id
 * @property {string} label
 * @property {number} limit
 */

/**
 * @typedef {Object} ApprovalScheduleItemInput
 * @property {string=} id
 * @property {string=} campaignId
 * @property {string=} campaign
 * @property {string=} platform
 * @property {string=} text
 * @property {string=} copy
 * @property {string=} url
 * @property {string=} scheduledAt
 * @property {string=} startAt
 * @property {string=} status
 * @property {boolean=} userApproved
 * @property {string=} openedAt
 * @property {string=} createdAt
 */

/**
 * @typedef {Object} ApprovalScheduleItem
 * @property {string} id
 * @property {string} campaignId
 * @property {string} platform
 * @property {string} platformLabel
 * @property {string} text
 * @property {string} url
 * @property {string} scheduledAt
 * @property {string} status
 * @property {boolean} userApproved
 * @property {string | null} openedAt
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} policy
 */

/**
 * @typedef {Object} ApprovalScheduleCampaign
 * @property {string=} id
 * @property {string=} text
 * @property {string=} url
 * @property {string[]=} posts
 */

/**
 * @typedef {Object} ApprovalScheduleOptions
 * @property {string[]=} channels
 * @property {string=} startAt
 * @property {string=} url
 */

export const APPROVED_SOCIAL_PLATFORMS = Object.freeze([
  { id: 'whatsapp', label: 'WhatsApp', limit: 900 },
  { id: 'x', label: 'X', limit: 260 },
  { id: 'facebook', label: 'Facebook', limit: 500 },
  { id: 'telegram', label: 'Telegram', limit: 900 },
  { id: 'linkedin', label: 'LinkedIn', limit: 700 },
  { id: 'reddit', label: 'Reddit', limit: 300 },
  { id: 'email', label: 'Email', limit: 1200 }
]);

const /** @type {Record<string, SocialPlatform>} */
PLATFORM_BY_ID = APPROVED_SOCIAL_PLATFORMS.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, /** @type {Record<string, SocialPlatform>} */ ({}));

function nowIso() { return new Date().toISOString(); }

/**
 * @param {string} key
 * @param {any} fallback
 */
function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '');
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/**
 * @param {string} key
 * @param {any} value
 */
function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function esc(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clampText(text, limit) {
  const raw = String(text || '').replace(/\s+/g, ' ').trim();
  if (raw.length <= limit) return raw;
  return `${raw.slice(0, Math.max(0, limit - 1)).trim()}…`;
}

/**
 * @param {string | undefined} startAt
 * @param {number} index
 */
function scheduleDateForIndex(startAt, index) {
  const base = startAt ? new Date(startAt) : new Date(Date.now() + 60 * 60 * 1000);
  const date = Number.isFinite(base.getTime()) ? base : new Date(Date.now() + 60 * 60 * 1000);
  date.setDate(date.getDate() + Math.floor(index / 2));
  if (index % 2 === 1) date.setHours(date.getHours() + 6);
  return date.toISOString();
}

/**
 * @param {ApprovalScheduleItemInput} item
 * @param {number} index
 * @returns {ApprovalScheduleItem}
 */
export function normalizeScheduleItem(item = {}, index = 0) {
  const platform = PLATFORM_BY_ID[String(item.platform || 'x').trim().toLowerCase()] || PLATFORM_BY_ID.x;
  const text = clampText(item.text || item.copy || 'Try my EONAPP Realm and AI workspace.', platform.limit);
  return {
    id: String(item.id || `sched-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 7)}`),
    campaignId: String(item.campaignId || item.campaign || 'campaign-local'),
    platform: platform.id,
    platformLabel: platform.label,
    text,
    url: String(item.url || '').trim(),
    scheduledAt: item.scheduledAt || scheduleDateForIndex(item.startAt, index),
    status: item.status || 'scheduled-needs-approval',
    userApproved: item.userApproved === true,
    openedAt: item.openedAt || null,
    createdAt: item.createdAt || nowIso(),
    updatedAt: nowIso(),
    policy: 'User approval required before opening composer. No automatic posting.'
  };
}

/**
 * @param {ApprovalScheduleCampaign} campaign
 * @param {ApprovalScheduleOptions} options
 */
export function createApprovalSchedule(campaign = {}, options = {}) {
  const channels = Array.isArray(options.channels) && options.channels.length
    ? options.channels
    : ['whatsapp', 'x', 'telegram', 'linkedin', 'email'];
  const posts = Array.isArray(campaign.posts) && campaign.posts.length
    ? campaign.posts
    : [String(campaign.text || `I am building with EONAPP. ${campaign.url || ''}`).trim()];
  const items = channels.slice(0, 12).map((platform, index) => normalizeScheduleItem({
    campaignId: campaign.id || 'campaign-local',
    platform,
    text: posts[index % posts.length],
    url: campaign.url || options.url || '',
    startAt: options.startAt
  }, index));
  const existing = listApprovalSchedule();
  writeJson(QUEUE_KEY, [...items, ...existing].slice(0, 80));
  appendScheduleAudit({ type: 'create-schedule', count: items.length, campaignId: campaign.id || 'campaign-local' });
  return { ok: true, items };
}

/** @returns {ApprovalScheduleItem[]} */
export function listApprovalSchedule() {
  const rows = readJson(QUEUE_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

/**
 * @param {string | number} itemId
 * @returns {ApprovalScheduleItem | null}
 */
export function markScheduleItemApproved(itemId) {
  const id = String(itemId || '');
  const rows = listApprovalSchedule();
  const next = rows.map((item) => item.id === id ? { ...item, status: 'approved-ready-to-open', userApproved: true, updatedAt: nowIso() } : item);
  writeJson(QUEUE_KEY, next);
  appendScheduleAudit({ type: 'approve-item', itemId: id });
  return next.find((item) => item.id === id) || null;
}

/**
 * @param {ApprovalScheduleItem} item
 */
export function buildComposerUrl(item) {
  const platform = String(item.platform || '').toLowerCase();
  const text = String(item.text || '').trim();
  const url = String(item.url || '').trim();
  const full = [text, url].filter(Boolean).join(' ');
  if (platform === 'whatsapp') return `https://wa.me/?text=${encodeURIComponent(full)}`;
  if (platform === 'x') return `https://x.com/intent/post?text=${encodeURIComponent([text, url].filter(Boolean).join('\n\n'))}`;
  if (platform === 'facebook') return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url || 'https://eonapp.ch/')}&quote=${encodeURIComponent(text)}`;
  if (platform === 'telegram') return `https://t.me/share/url?url=${encodeURIComponent(url || 'https://eonapp.ch/')}&text=${encodeURIComponent(text)}`;
  if (platform === 'linkedin') return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url || 'https://eonapp.ch/')}`;
  if (platform === 'reddit') return `https://www.reddit.com/submit?url=${encodeURIComponent(url || 'https://eonapp.ch/')}&title=${encodeURIComponent(text)}`;
  if (platform === 'email') return `mailto:?subject=${encodeURIComponent('EONAPP Realm')}&body=${encodeURIComponent(full)}`;
  return '';
}

/**
 * @param {string | number} itemId
 * @param {((url: string, target?: string, features?: string) => void) | null} opener
 */
export function approveAndOpenComposer(itemId, opener = null) {
  const item = markScheduleItemApproved(itemId);
  if (!item) return { ok: false, error: 'Item not found.' };
  const composerUrl = buildComposerUrl(item);
  const rows = listApprovalSchedule().map((row) => row.id === item.id ? { ...row, status: 'approved-opened-composer', openedAt: nowIso(), updatedAt: nowIso() } : row);
  writeJson(QUEUE_KEY, rows);
  appendScheduleAudit({ type: 'open-composer', itemId: item.id, platform: item.platform });
  if (typeof opener === 'function') opener(composerUrl, '_blank', 'noopener,noreferrer');
  else if (typeof window !== 'undefined' && composerUrl) window.open(composerUrl, '_blank', 'noopener,noreferrer');
  return { ok: true, item: rows.find((row) => row.id === item.id), composerUrl };
}

/**
 * @param {Object} [event]
 */
export function appendScheduleAudit(event = {}) {
  const rows = readJson(AUDIT_KEY, []);
  const list = Array.isArray(rows) ? rows : [];
  list.unshift({
    id: `soc-audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    ...event,
    timestamp: nowIso()
  });
  writeJson(AUDIT_KEY, list.slice(0, 80));
}

function renderQueueRows() {
  const items = listApprovalSchedule().slice(0, 8);
  if (!items.length) return '<p class="sg-muted sg-empty-state">No approval schedule yet. Generate a signed invite draft, then create a review schedule.</p>';
  return items.map((item) => `
    <article class="eon-social-schedule-row" data-schedule-id="${esc(item.id)}">
      <div><strong>${esc(item.platformLabel)}</strong><span>${esc(new Date(item.scheduledAt).toLocaleString())}</span></div>
      <p>${esc(item.text)}</p>
      <button class="btn btn-sm btn-outline eon-social-approve-open" type="button" data-schedule-id="${esc(item.id)}">Approve & open composer</button>
    </article>`).join('');
}

/**
 * @param {HTMLElement | Element | null} root
 * @param {ApprovalScheduleCampaign} campaign
 */
export function renderApprovalSchedulerPanel(root, campaign = {}) {
  if (!root) return { ok: false, reason: 'missing-root' };
  root.innerHTML = `
    <section class="eon-social-scheduler" aria-label="User-approved social scheduler">
      <div class="eon-social-scheduler-head">
        <div><strong>Approval-first social scheduler</strong><span>Create a 5-channel schedule. You approve every post before a composer opens.</span></div>
        <button class="btn btn-sm btn-primary" id="eon-social-schedule-create" type="button">Create approval schedule</button>
      </div>
      <div class="eon-social-schedule-list" id="eon-social-schedule-list">${renderQueueRows()}</div>
    </section>`;
  const refresh = () => {
    const list = root.querySelector?.('#eon-social-schedule-list');
    if (list) list.innerHTML = renderQueueRows();
    root.querySelectorAll?.('.eon-social-approve-open').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.getAttribute('data-schedule-id');
        approveAndOpenComposer(id);
        refresh();
      });
    });
  };
  root.querySelector?.('#eon-social-schedule-create')?.addEventListener('click', () => {
    createApprovalSchedule(campaign, {});
    refresh();
  });
  refresh();
  return { ok: true, count: listApprovalSchedule().length };
}
