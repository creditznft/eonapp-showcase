/**
 * EONAPP Notification System
 * In-app toast notifications + optional browser push permission request.
 * Lightweight, no backend required. All in-browser.
 */

const STORAGE_KEY = 'eon:notifications';
const MAX_STORED  = 50;
const BrowserNotification = typeof globalThis !== 'undefined' ? globalThis.Notification : undefined;

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * @typedef {'info'|'success'|'warning'|'error'|'reward'} NotifType
 * @typedef {{ id: string, type: NotifType, title: string, body?: string, ts: number, read: boolean, gameId?: string, link?: string }} Notification
 */

// ─── Toast UI ───────────────────────────────────────────────────────────────

/** @type {any} */
let _container = null;

function _getContainer() {
  if (_container) return _container;
  _container = document.createElement('div');
  _container.id = 'eon-toast-container';
  _container.setAttribute('role', 'region');
  _container.setAttribute('aria-label', 'Notifications');
  _container.setAttribute('aria-live', 'polite');
  _container.style.cssText = [
    'position:fixed', 'top:1.1rem', 'right:1rem',
    'z-index:9999', 'display:flex', 'flex-direction:column',
    'gap:.55rem', 'max-width:min(22rem,calc(100vw - 1.25rem))', 'pointer-events:none'
  ].join(';');
  document.body.appendChild(_container);
  return _container;
}

const /** @type {any} */
TYPE_META = {
  info:    { icon: 'ℹ️', color: '#4f46e5', bg: '#1a1f3c' },
  success: { icon: '✅', color: '#22c55e', bg: '#0f2415' },
  warning: { icon: '⚠️', color: '#f59e0b', bg: '#2a1e0a' },
  error:   { icon: '❌', color: '#ef4444', bg: '#3b1515' },
  reward:  { icon: '⚡', color: '#a78bfa', bg: '#1c1240' }
};

/**
 * Show a toast notification on screen.
 * @param {string} title
 * @param {{ type?: NotifType, body?: string, duration?: number, link?: string }} [opts]
 */
export function showToast(/** @type {any} */ title, /** @type {any} */ opts = {}) {
  const { type = 'info', body = '', duration = 4500, link = '' } = opts;
  const meta   = TYPE_META[type] || TYPE_META.info;
  const toastId = `eon-toast-${Date.now()}`;

  const /** @type {any} */
toast = document.createElement('div');
  toast.id = toastId;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-atomic', 'true');
  toast.style.cssText = [
    `background:${meta.bg}`, `border:1px solid ${meta.color}44`,
    'border-radius:.75rem', 'padding:.8rem 1rem',
    'display:flex', 'align-items:flex-start', 'gap:.6rem',
    'pointer-events:all', 'box-shadow:0 4px 20px rgba(0,0,0,.6)',
    'animation:eon-toast-in .25s ease', 'opacity:1',
    'cursor: default', 'max-width:22rem'
  ].join(';');

  const inner = link
    ? `<a href="${link}" style="text-decoration:none;color:inherit;flex:1;">`
    : `<div style="flex:1;">`;
  const innerClose = link ? `</a>` : `</div>`;

  toast.innerHTML = `
    <span style="font-size:1.15rem;flex-shrink:0" aria-hidden="true">${meta.icon}</span>
    ${inner}
      <div style="font-weight:700;font-size:.9rem;color:#e2e8f0">${title}</div>
      ${body ? `<div style="font-size:.82rem;color:#9ca3af;margin-top:.2rem">${body}</div>` : ''}
    ${innerClose}
    <button style="background:none;border:none;color:#4b5563;cursor:pointer;font-size:1.1rem;flex-shrink:0;padding:0;line-height:1"
      aria-label="Dismiss notification" onclick="this.closest('[role=alert]').remove()">×</button>
  `;

  // Inject animation keyframes once
  if (!document.getElementById('eon-toast-style')) {
    const /** @type {any} */
s = document.createElement('style');
    s.id = 'eon-toast-style';
    s.textContent = `@keyframes eon-toast-in{from{opacity:0;transform:translateY(.5rem)}to{opacity:1;transform:none}}`;
    document.head.appendChild(s);
  }

  const container = _getContainer();
  container.prepend(toast);

  // Auto-dismiss
  setTimeout(() => {
    toast.style.transition = 'opacity .3s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 320);
  }, duration);
}

// ─── Persistent Notification Store ──────────────────────────────────────────

/**
 * Load persisted notifications.
 * @returns {Notification[]}
 */
function _load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Save notifications to storage.
 * @param {Notification[]} list
 */
function _save(/** @type {any} */ list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_STORED)));
  } catch { /* storage full — ignore */ }
}

/**
 * Add a notification to the persistent store (and show toast).
 * @param {string} title
 * @param {{ type?: NotifType, body?: string, gameId?: string, link?: string, silent?: boolean }} [opts]
 * @returns {Notification}
 */
export function pushNotification(/** @type {any} */ title, /** @type {any} */ opts = {}) {
  const { type = 'info', body = '', gameId, link, silent = false } = opts;
  /** @type {Notification} */
  const /** @type {any} */
notif = {
    id:     `notif_${crypto.getRandomValues(new Uint8Array(4)).reduce((/** @type {any} */ s,/** @type {any} */ b) => s + b.toString(16).padStart(2,'0'), '')}`,
    type,
    title,
    body,
    ts:     Date.now(),
    read:   false,
    gameId,
    link
  };
  const list = _load();
  list.unshift(notif);
  _save(list);

  if (!silent) showToast(title, { type, body, link });
  _emitBadgeUpdate();
  return notif;
}

/**
 * Mark a notification as read by ID.
 * @param {string} id
 */
export function markRead(/** @type {any} */ id) {
  const list = _load().map(/** @type {any} */ n => n.id === id ? { ...n, read: true } : n);
  _save(list);
  _emitBadgeUpdate();
}

/** Mark all notifications as read. */
export function markAllRead() {
  const list = _load().map(/** @type {any} */ n => ({ ...n, read: true }));
  _save(list);
  _emitBadgeUpdate();
}

/**
 * Get all notifications.
 * @returns {Notification[]}
 */
export function getNotifications() { return _load(); }

/**
 * Get unread count.
 * @returns {number}
 */
export function getUnreadCount() { return _load().filter(/** @type {any} */ n => !n.read).length; }

// ─── Badge Updates ──────────────────────────────────────────────────────────

/** @type {Array<(count: number) => void>} */
const /** @type {any} */
_badge_listeners = [];

/** @param {(count: number) => void} fn */
export function onBadgeUpdate(fn) { _badge_listeners.push(fn); }

function _emitBadgeUpdate() {
  const count = getUnreadCount();
  _badge_listeners.forEach((/** @type {any} */ fn) => fn(count));
  // Also update any DOM elements with data-notif-badge attribute
  document.querySelectorAll('[data-notif-badge]').forEach((/** @type {any} */ el) => {
    el.textContent  = count > 0 ? String(count > 99 ? '99+' : count) : '';
    el.style.display = count > 0 ? '' : 'none';
  });
}

// ─── Game Event Helpers ─────────────────────────────────────────────────────

/**
 * Notify user of a lootbox drop.
 * @param {string} itemName
 * @param {string} rarity  e.g. 'common', 'rare', 'epic', 'legendary'
 * @param {string} [gameId]
 */
export function notifyLootboxDrop(/** @type {any} */ itemName, /** @type {any} */ rarity, /** @type {any} */ gameId) {
  const rarityEmoji = /** @type {Record<string, string>} */ ({ common: '⬜', uncommon: '🟩', rare: '🔵', epic: '🟣', legendary: '🌟' })[rarity] || '🎁';
  pushNotification(`${rarityEmoji} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)} drop!`, {
    type: 'reward',
    body: `You received: ${itemName}`,
    gameId,
    link: '/vault'
  });
}

/**
 * Notify user of pool point earnings.
 * @param {number} points
 * @param {string} action  e.g. 'game-run-complete'
 */
export function notifyPoolPoints(/** @type {any} */ points, /** @type {any} */ action) {
  if (points < 10) return; // suppress micro-notifications
  pushNotification(`+${points} Pool Points`, {
    type: 'reward',
    body: `Earned from: ${action.replace(/-/g, ' ')}`,
    link: '/vault',
    silent: false
  });
}

/**
 * Notify user of a subscription event.
 * @param {'activated'|'renewed'|'expiring-soon'|'expired'} event
 * @param {string} [planName]
 */
export function notifySubscription(/** @type {any} */ event, /** @type {any} */ planName = '') {
  const /** @type {any} */
msgs = {
    'activated':     { title: `${planName} plan activated 🎉`,       type: /** @type {NotifType} */ ('success') },
    'renewed':       { title: `${planName} plan auto-renewed ✅`,     type: /** @type {NotifType} */ ('success') },
    'expiring-soon': { title: `Subscription expiring soon ⚠️`,        type: /** @type {NotifType} */ ('warning'), body: 'Ensure you have EonLite in your wallet.' },
    'expired':       { title: `Subscription expired`,                  type: /** @type {NotifType} */ ('error'),   body: 'Renew in the Vault to restore benefits.' }
  };
  const m = (/** @type {Record<string, any>} */ (msgs))[event];
  if (!m) return;
  pushNotification(m.title, { type: m.type, body: m.body || '', link: '/vault' });
}

/**
 * Notify user of a new game release or update.
 * @param {string} gameName
 * @param {string} gameUrl
 * @param {string} [detail]
 */
export function notifyNewGame(/** @type {any} */ gameName, /** @type {any} */ gameUrl, /** @type {any} */ detail = '') {
  pushNotification(`🎮 New: ${gameName}`, {
    type: 'info',
    body: detail,
    link: gameUrl
  });
}

/**
 * Notify user of a P2P swap offer received.
 * @param {string} fromAlias
 * @param {number} amount
 * @param {string} token  e.g. 'EonLite'
 */
export function notifySwapOffer(/** @type {any} */ fromAlias, /** @type {any} */ amount, /** @type {any} */ token) {
  pushNotification(`💱 Swap offer from ${fromAlias}`, {
    type: 'info',
    body: `Offering ${amount} ${token} — check the Vault to accept`,
    link: '/vault'
  });
}

// ─── Browser Push Permission ─────────────────────────────────────────────────

/**
 * Request browser push notification permission.
 * Only call this in response to a user gesture.
 * @returns {Promise<NotificationPermission>}
 */
export async function requestPushPermission() {
  if (!BrowserNotification) return 'denied';
  if (BrowserNotification.permission === 'granted') return 'granted';
  if (BrowserNotification.permission === 'denied')  return 'denied';
  return await BrowserNotification.requestPermission();
}

/**
 * Show a native browser notification (falls back to toast).
 * @param {string} title
 * @param {{ body?: string, icon?: string, tag?: string, link?: string }} [opts]
 */
export async function showBrowserNotification(/** @type {any} */ title, /** @type {any} */ opts = {}) {
  const { body = '', icon = '/favicon.svg', tag = 'eon-notif', link = '' } = opts;
  if (BrowserNotification?.permission === 'granted') {
    const n = new BrowserNotification(title, { body, icon, tag });
    if (link) n.onclick = () => { window.open(link, '_blank', 'noopener'); n.close(); };
  } else {
    showToast(title, { body, link });
  }
}

// ─── Init ────────────────────────────────────────────────────────────────────

/**
 * Initialise the notification system.
 * Call once from main.js or hub.js.
 */
export function initNotifications() {
  _emitBadgeUpdate();

  // Subscribe to subscription expiry warnings via storage polling
  const checkExpiry = () => {
    try {
      const sub = JSON.parse(localStorage.getItem('eon:subscription') || 'null');
      if (!sub || !sub.expiresAt) return;
      const daysLeft = (sub.expiresAt - Date.now()) / 86_400_000;
      if (daysLeft > 0 && daysLeft <= 3) {
        const lastWarn = Number(localStorage.getItem('eon:notif:sub-warn') || '0');
        if (Date.now() - lastWarn > 86_400_000) { // once per day
          notifySubscription('expiring-soon', sub.planId || '');
          localStorage.setItem('eon:notif:sub-warn', String(Date.now()));
        }
      } else if (daysLeft <= 0) {
        const lastExp = Number(localStorage.getItem('eon:notif:sub-expired') || '0');
        if (Date.now() - lastExp > 86_400_000) {
          notifySubscription('expired');
          localStorage.setItem('eon:notif:sub-expired', String(Date.now()));
        }
      }
    } catch { /* ignore */ }
  };

  checkExpiry();
}
