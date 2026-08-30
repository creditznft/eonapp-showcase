/**
 * social-publisher.js — EONAPP.CH Creator Studio
 * ================================================
 * Real social media posting directly from the browser.
 *
 * Platform support matrix:
 *   Discord   — full API via webhooks (no auth needed, user adds webhook URL)
 *   Telegram  — full API via Bot API (user creates bot via @BotFather)
 *   Slack     — full API via incoming webhooks
 *   Twitter/X — web intent (opens compose with pre-filled text)
 *   LinkedIn  — share intent
 *   Reddit    — submit intent with subreddit config
 *   Threads   — web intent
 *   Bluesky   — web intent
 *   Mastodon  — share intent with user instance
 *   Pinterest — share/create-pin intent
 *   Facebook  — clipboard + compose open
 *   Medium    — clipboard + new story page
 *   Dev.to    — clipboard + new post page
 *   Substack  — clipboard + dashboard open
 *   WordPress — clipboard + wp-admin new post
 *   Ghost     — clipboard + ghost editor
 *   Vimeo     — clipboard + Vimeo upload page
 *   Behance   — clipboard + Behance project editor
 *   Dribbble  — clipboard + Dribbble shot upload
 *   ArtStation — clipboard + ArtStation project upload
 *   Twitch    — clipboard + stream/video manager open
 *   GitHub    — clipboard + new gist/repo draft flow
 *   TikTok    — clipboard copy + opens TikTok upload
 *   Instagram — clipboard copy + opens Instagram
 *   YouTube   — clipboard copy + opens YouTube Studio
 *
 * Security: credentials stored in localStorage under SP_KEYS_KEY.
 * For highest sensitivity (bot tokens), users are advised to use
 * a dedicated bot/webhook per platform.
 *
 * @module utils/social-publisher
 */

import {
  canUseSocialVideoUpload,
  recordSocialVideoUpload,
  isSocialVideoUploadPlatform
} from './subscription.js';
import { touchBrowserAttachment, upsertBrowserAttachment } from './profile.js';
import { buildDistributionAutomationPlan, getPlatformAutomationPolicy } from './distribution-automation-rails.js';

const SP_KEYS_KEY = 'eon:social:accounts:v1';
const SP_LOG_KEY  = 'eon:social:log:v1';
const OAUTH_STATE_KEY = 'eon:social:oauth:v1';
const SOCIAL_API_BASE = '/api/v1/social';

export function normalizeSocialContent(/** @type {any} */ content = {}) {
  const title = String(content.title || content.subject || 'EONAPP post').trim().slice(0, 120) || 'EONAPP post';
  const text = String(content.text || content.description || '').trim();
  const mediaUrl = String(content.mediaUrl || content.mediaUri || content.assetUrl || '').trim();
  const mediaKind = String(content.kind || content.type || content.postType || '').trim().toLowerCase();
  const embedTitle = String(content.embedTitle || title).trim().slice(0, 256) || title;
  const embedDescription = String(content.embedDescription || text || title).trim().slice(0, 4096) || title;
  const attachments = Array.isArray(content.attachments)
    ? content.attachments
        .map((/** @type {any} */ item) => ({
          ...item,
          url: String(item?.url || item?.mediaUrl || '').trim(),
          type: String(item?.type || item?.kind || '').trim().toLowerCase(),
          label: String(item?.label || item?.title || '').trim().slice(0, 120)
        }))
        .filter((/** @type {any} */ item) => item.url)
        .slice(0, 6)
    : [];
  return {
    title,
    text,
    mediaUrl,
    kind: mediaKind,
    embedTitle,
    embedDescription,
    attachments,
    metadata: content.metadata && typeof content.metadata === 'object' ? { ...content.metadata } : {}
  };
}

function appendMediaNote(/** @type {any} */ text, /** @type {any} */ mediaUrl, /** @type {any} */ limit) {
  const body = String(text || '').trim();
  const url = String(mediaUrl || '').trim();
  if (!url) return body.slice(0, limit);
  const mediaLine = `\n\nMedia: ${url}`;
  return `${body}${mediaLine}`.trim().slice(0, limit);
}

function assertSocialVideoQuota(/** @type {any} */ platform) {
  if (!isSocialVideoUploadPlatform(platform)) return null;
  const quota = canUseSocialVideoUpload(platform);
  if (!quota.ok) {
    throw new Error(quota.message || `Monthly ${quota.platformLabel} upload limit reached.`);
  }
  return quota;
}

function getDefaultNextUrl() {
  try {
    return `${window.location.origin}${window.location.pathname}`;
  } catch {
    return '/create';
  }
}

function loadOAuthState() {
  try { return JSON.parse(localStorage.getItem(OAUTH_STATE_KEY) || '{}'); }
  catch { return {}; }
}

/**
 * @param {any} state
 */
function saveOAuthState(state) {
  try { localStorage.setItem(OAUTH_STATE_KEY, JSON.stringify(state || {})); } catch {}
}

/**
 * @param {string} platform
 */
function getBrowserOAuthUrl(platform) {
  const normalized = String(platform || '').trim().toLowerCase();
  /** @type {Record<string, string>} */
  const urls = {
    google: 'https://accounts.google.com/',
    youtube: 'https://accounts.google.com/',
    x: 'https://x.com/i/flow/login',
    linkedin: 'https://www.linkedin.com/login',
    facebook: 'https://www.facebook.com/login',
    github: 'https://github.com/login',
    tiktok: 'https://www.tiktok.com/login',
    instagram: 'https://www.instagram.com/accounts/login/'
  };
  return urls[normalized] || 'https://www.google.com/';
}

function sanitizeAuthUrl(/** @type {any} */ value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw, window.location.origin);
    const protocol = url.protocol.toLowerCase();
    const localhostHosts = new Set(['localhost', '127.0.0.1', '::1']);
    const isLocalHttp = protocol === 'http:' && localhostHosts.has(url.hostname);
    const isSameOrigin = url.origin === window.location.origin;

    if (url.username || url.password) return '';
    if (!(protocol === 'https:' || isSameOrigin || isLocalHttp)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

function sanitizePublisherUrl(/** @type {any} */ value, /** @type {any} */ allowedHosts = []) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw, window.location.origin);
    const protocol = url.protocol.toLowerCase();
    if (!(protocol === 'https:' || protocol === 'http:')) return '';
    if (url.username || url.password) return '';
    if (Array.isArray(allowedHosts) && allowedHosts.length > 0 && !allowedHosts.includes(url.hostname.toLowerCase())) {
      return '';
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

export async function startPlatformOAuth(/** @type {any} */ platform, /** @type {any} */ uid, /** @type {any} */ next = getDefaultNextUrl()) {
  const normalized = String(platform || '').trim().toLowerCase();
  const accountUid = String(uid || '').trim();
  if (!normalized) throw new Error('Missing platform.');
  if (!accountUid) throw new Error('Missing account uid.');
  const authUrl = sanitizeAuthUrl(getBrowserOAuthUrl(normalized));
  const state = loadOAuthState();
  state[normalized] = {
    status: 'pending',
    uid: accountUid,
    authUrl,
    next: String(next || '').trim(),
    startedAt: new Date().toISOString()
  };
  saveOAuthState(state);
  upsertBrowserAttachment({
    provider: normalized,
    accountId: accountUid,
    label: normalized.toUpperCase(),
    name: normalized.toUpperCase(),
    email: '',
    authKind: 'browser-oauth',
    source: 'browser',
    attachedAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    browserManaged: true
  });
  return {
    ok: true,
    platform: normalized,
    authUrl,
    browserAttachment: true,
    nextSteps: [`Open ${normalized.toUpperCase()} in this browser, complete sign-in, then click Check Status to mark the attachment connected.`]
  };
}

export async function getPlatformOAuthStatus(/** @type {any} */ platform, /** @type {any} */ uid) {
  const normalized = String(platform || '').trim().toLowerCase();
  const accountUid = String(uid || '').trim();
  const state = loadOAuthState()[normalized];
  const connected = !!state && state.uid === accountUid && state.status === 'connected';
  return {
    ok: true,
    platform: normalized,
    uid: accountUid,
    connected,
    pending: !!state && state.uid === accountUid && state.status === 'pending',
    authUrl: state?.authUrl || '',
    browserAttachment: true
  };
}

export async function confirmPlatformOAuth(/** @type {any} */ platform, /** @type {any} */ uid) {
  const normalized = String(platform || '').trim().toLowerCase();
  const accountUid = String(uid || '').trim();
  if (!normalized || !accountUid) throw new Error('Missing platform attachment data.');
  const state = loadOAuthState();
  state[normalized] = {
    ...(state[normalized] || {}),
    status: 'connected',
    uid: accountUid,
    connectedAt: new Date().toISOString()
  };
  saveOAuthState(state);
  touchBrowserAttachment(normalized, accountUid);
  return {
    ok: true,
    platform: normalized,
    uid: accountUid,
    connected: true,
    pending: false,
    browserAttachment: true
  };
}

try {
  window.EONSocialAttachments = {
    startPlatformOAuth,
    getPlatformOAuthStatus,
    confirmPlatformOAuth
  };
} catch {}

export async function uploadPlatformContent(/** @type {any} */ platform, /** @type {any} */ payload) {
  const response = await fetch(`${SOCIAL_API_BASE}/upload/${platform}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload || {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || `Upload failed for ${platform}.`);
  }
  return data;
}

// ── Platform definitions ─────────────────────────────────────────────────────

export const /** @type {any} */
PLATFORMS = {
  discord: {
    label: 'Discord',
    emoji: '🔵',
    method: 'api',
    maxLength: 2000,
    setupFields: [
      {
        id: 'webhook_url',
        label: 'Webhook URL',
        type: 'url',
        hint: 'Discord server → Settings → Integrations → Webhooks → New Webhook → Copy URL'
      }
    ],
    isConfigured(/** @type {any} */ creds) {
      return typeof creds?.webhook_url === 'string' &&
        (creds.webhook_url.startsWith('https://discord.com/api/webhooks/') ||
         creds.webhook_url.startsWith('https://discordapp.com/api/webhooks/'));
    },
    async post(/** @type {any} */ creds, /** @type {any} */ content) {
      if (!this.isConfigured(creds)) throw new Error('Discord: Webhook URL not configured or invalid.');
      const /** @type {any} */
body = {
        username: 'EONAPP',
        content: appendMediaNote(content.text, content.mediaUrl, 2000)
      };
      if (content.embedTitle) {
        (/** @type {any} */ (body)).embeds = [{
          title: content.embedTitle.slice(0, 256),
          description: appendMediaNote(content.embedDescription || content.text, content.mediaUrl, 4096),
          color: 7864283
        }];
        delete body.content;
      }
      const res = await fetch(creds.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const d = await res.json(); msg = d.message || msg; } catch {}
        throw new Error(`Discord error: ${msg}`);
      }
      return { platform: 'discord', method: 'api' };
    }
  },

  telegram: {
    label: 'Telegram',
    emoji: '✈️',
    method: 'api',
    maxLength: 4096,
    setupFields: [
      {
        id: 'bot_token',
        label: 'Bot Token',
        type: 'password',
        hint: 'Open Telegram → message @BotFather → /newbot → copy the token (123456:ABC-DEF…)'
      },
      {
        id: 'chat_id',
        label: 'Chat ID',
        type: 'text',
        hint: 'Your personal chat ID or group/channel ID. Message @userinfobot to get yours.'
      }
    ],
    isConfigured(/** @type {any} */ creds) {
      return !!(creds?.bot_token && creds?.chat_id);
    },
    async post(/** @type {any} */ creds, /** @type {any} */ content) {
      if (!this.isConfigured(creds)) throw new Error('Telegram: Bot token and chat ID are required.');
      // Validate token format (must not allow arbitrary URLs)
      if (!/^\d+:[A-Za-z0-9_-]{35,}$/.test(creds.bot_token)) {
        throw new Error('Telegram: Bot token format is invalid.');
      }
      const res = await fetch(
        `https://api.telegram.org/bot${encodeURIComponent(creds.bot_token)}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: String(creds.chat_id).trim(),
            text: appendMediaNote(content.text, content.mediaUrl, 4096),
            parse_mode: 'Markdown'
          })
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!data.ok) throw new Error(`Telegram error: ${data.description || `HTTP ${res.status}`}`);
      return { platform: 'telegram', method: 'api', messageId: data.result?.message_id };
    }
  },

  slack: {
    label: 'Slack',
    emoji: '🟣',
    method: 'api',
    maxLength: 3000,
    setupFields: [
      {
        id: 'webhook_url',
        label: 'Incoming Webhook URL',
        type: 'url',
        hint: 'Slack App → Incoming Webhooks → Add New Webhook to Workspace → Copy URL'
      }
    ],
    isConfigured(/** @type {any} */ creds) {
      return typeof creds?.webhook_url === 'string' && creds.webhook_url.startsWith('https://hooks.slack.com/services/');
    },
    async post(/** @type {any} */ creds, /** @type {any} */ content) {
      if (!this.isConfigured(creds)) throw new Error('Slack: Incoming webhook URL not configured or invalid.');
      const res = await fetch(creds.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: appendMediaNote(content.text, content.mediaUrl, 3000) })
      });
      if (!res.ok) throw new Error(`Slack error: HTTP ${res.status}`);
      return { platform: 'slack', method: 'api' };
    }
  },

  twitter: {
    label: 'Twitter / X',
    emoji: '𝕏',
    method: 'intent',
    maxLength: 280,
    setupFields: [],
    isConfigured() { return true; },
    post(/** @type {any} */ _creds, /** @type {any} */ content) {
      const text = appendMediaNote(content.text, content.mediaUrl, 280);
      window.open(
        `https://x.com/intent/post?text=${encodeURIComponent(text)}`,
        '_blank', 'width=620,height=420,resizable=yes'
      );
      return { platform: 'twitter', method: 'intent' };
    }
  },

  threads: {
    label: 'Threads',
    emoji: '🧵',
    method: 'intent',
    maxLength: 500,
    setupFields: [],
    isConfigured() { return true; },
    post(/** @type {any} */ _creds, /** @type {any} */ content) {
      const text = appendMediaNote(content.text, content.mediaUrl, 500);
      window.open(
        `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`,
        '_blank', 'width=620,height=420,resizable=yes'
      );
      return { platform: 'threads', method: 'intent' };
    }
  },

  bluesky: {
    label: 'Bluesky',
    emoji: '🦋',
    method: 'intent',
    maxLength: 300,
    setupFields: [],
    isConfigured() { return true; },
    post(/** @type {any} */ _creds, /** @type {any} */ content) {
      const text = appendMediaNote(content.text, content.mediaUrl, 300);
      window.open(
        `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`,
        '_blank', 'width=720,height=560,resizable=yes'
      );
      return { platform: 'bluesky', method: 'intent' };
    }
  },

  mastodon: {
    label: 'Mastodon',
    emoji: '🐘',
    method: 'intent',
    maxLength: 500,
    setupFields: [
      {
        id: 'instance',
        label: 'Mastodon Instance',
        type: 'text',
        hint: 'e.g. mastodon.social (no https://)'
      }
    ],
    isConfigured(/** @type {any} */ creds) {
      return !!creds?.instance;
    },
    post(/** @type {any} */ creds, /** @type {any} */ content) {
      const instance = String(creds?.instance || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (!instance) throw new Error('Mastodon: add your instance domain (e.g. mastodon.social).');
      const text = appendMediaNote(content.text, content.mediaUrl, 500);
      window.open(
        `https://${instance}/share?text=${encodeURIComponent(text)}`,
        '_blank', 'width=720,height=560,resizable=yes'
      );
      return { platform: 'mastodon', method: 'intent' };
    }
  },

  linkedin: {
    label: 'LinkedIn',
    emoji: '💼',
    method: 'intent',
    maxLength: 700,
    setupFields: [
      {
        id: 'account_uid',
        label: 'Account UID',
        type: 'text',
        hint: 'Your EON user id (used to tie this browser attachment to your local profile)'
      }
    ],
    isConfigured() { return true; },
    post(/** @type {any} */ _creds, /** @type {any} */ content) {
      // LinkedIn share intent — opens share dialog
      const summary = appendMediaNote(content.text, content.mediaUrl, 700);
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?mini=true&summary=${encodeURIComponent(summary)}`,
        '_blank', 'width=620,height=520,resizable=yes'
      );
      return { platform: 'linkedin', method: 'intent' };
    }
  },

  reddit: {
    label: 'Reddit',
    emoji: '🟠',
    method: 'intent',
    maxLength: 1000,
    setupFields: [
      {
        id: 'subreddit',
        label: 'Default Subreddit',
        type: 'text',
        hint: 'e.g. entrepreneur or SideProject — leave blank to let Reddit choose'
      }
    ],
    isConfigured() { return true; },
    post(/** @type {any} */ creds, /** @type {any} */ content) {
      const sub = creds?.subreddit ? `/r/${creds.subreddit.replace(/^r\//,'')}` : '';
      const title = (content.title || content.text.slice(0, 100)).slice(0, 300);
      const body  = appendMediaNote(content.text, content.mediaUrl, 1000);
      window.open(
        `https://reddit.com${sub}/submit?title=${encodeURIComponent(title)}&text=${encodeURIComponent(body)}`,
        '_blank', 'width=800,height=620,resizable=yes'
      );
      return { platform: 'reddit', method: 'intent' };
    }
  },

  pinterest: {
    label: 'Pinterest',
    emoji: '📌',
    method: 'intent',
    maxLength: 500,
    setupFields: [
      {
        id: 'landing_url',
        label: 'Landing URL (optional)',
        type: 'url',
        hint: 'Website or product URL to attach to the pin'
      }
    ],
    isConfigured() { return true; },
    post(/** @type {any} */ creds, /** @type {any} */ content) {
      const description = appendMediaNote(content.text, content.mediaUrl, 500);
      const url = creds?.landing_url || window.location.origin;
      window.open(
        `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(description)}`,
        '_blank', 'width=800,height=620,resizable=yes'
      );
      return { platform: 'pinterest', method: 'intent' };
    }
  },

  facebook: {
    label: 'Facebook',
    emoji: '🔷',
    method: 'clipboard',
    maxLength: 63206,
    setupFields: [
      {
        id: 'account_uid',
        label: 'Account UID',
        type: 'text',
        hint: 'Your EON user id (used to tie this browser attachment to your local profile)'
      }
    ],
    isConfigured() { return true; },
    async post(/** @type {any} */ _creds, /** @type {any} */ content) {
      await navigator.clipboard.writeText(appendMediaNote(content.text, content.mediaUrl, 5000));
      window.open('https://www.facebook.com/', '_blank');
      return { platform: 'facebook', method: 'clipboard', note: 'Caption copied to clipboard. Paste into Facebook composer.' };
    }
  },

  medium: {
    label: 'Medium',
    emoji: '✍️',
    method: 'clipboard',
    maxLength: 100000,
    setupFields: [],
    isConfigured() { return true; },
    async post(/** @type {any} */ _creds, /** @type {any} */ content) {
      await navigator.clipboard.writeText(appendMediaNote(content.text, content.mediaUrl, 100000));
      window.open('https://medium.com/new-story', '_blank');
      return { platform: 'medium', method: 'clipboard', note: 'Draft copied to clipboard. Paste into Medium editor.' };
    }
  },

  devto: {
    label: 'Dev.to',
    emoji: '👩‍💻',
    method: 'clipboard',
    maxLength: 100000,
    setupFields: [],
    isConfigured() { return true; },
    async post(/** @type {any} */ _creds, /** @type {any} */ content) {
      await navigator.clipboard.writeText(appendMediaNote(content.text, content.mediaUrl, 100000));
      window.open('https://dev.to/new', '_blank');
      return { platform: 'devto', method: 'clipboard', note: 'Draft copied to clipboard. Paste into Dev.to editor.' };
    }
  },

  substack: {
    label: 'Substack',
    emoji: '📰',
    method: 'clipboard',
    maxLength: 100000,
    setupFields: [],
    isConfigured() { return true; },
    async post(/** @type {any} */ _creds, /** @type {any} */ content) {
      await navigator.clipboard.writeText(appendMediaNote(content.text, content.mediaUrl, 100000));
      window.open('https://substack.com/home', '_blank');
      return { platform: 'substack', method: 'clipboard', note: 'Draft copied to clipboard. Open your publication editor and paste.' };
    }
  },

  wordpress: {
    label: 'WordPress',
    emoji: '🧩',
    method: 'clipboard',
    maxLength: 100000,
    setupFields: [
      {
        id: 'site_url',
        label: 'WordPress Site URL (optional)',
        type: 'url',
        hint: 'e.g. https://yourblog.com'
      }
    ],
    isConfigured() { return true; },
    async post(/** @type {any} */ creds, /** @type {any} */ content) {
      await navigator.clipboard.writeText(appendMediaNote(content.text, content.mediaUrl, 100000));
      const site = sanitizePublisherUrl(creds?.site_url);
      window.open(site ? `${site}/wp-admin/post-new.php` : 'https://wordpress.com/', '_blank', 'noopener,noreferrer');
      return { platform: 'wordpress', method: 'clipboard', note: 'Draft copied to clipboard. Paste into the WordPress editor.' };
    }
  },

  ghost: {
    label: 'Ghost',
    emoji: '👻',
    method: 'clipboard',
    maxLength: 100000,
    setupFields: [
      {
        id: 'site_url',
        label: 'Ghost Site URL (optional)',
        type: 'url',
        hint: 'e.g. https://yourblog.com'
      }
    ],
    isConfigured() { return true; },
    async post(/** @type {any} */ creds, /** @type {any} */ content) {
      await navigator.clipboard.writeText(appendMediaNote(content.text, content.mediaUrl, 100000));
      const site = sanitizePublisherUrl(creds?.site_url);
      window.open(site ? `${site}/ghost/#/editor/post` : 'https://ghost.org/', '_blank', 'noopener,noreferrer');
      return { platform: 'ghost', method: 'clipboard', note: 'Draft copied to clipboard. Paste into Ghost editor.' };
    }
  },

  vimeo: {
    label: 'Vimeo',
    emoji: '🎞️',
    method: 'clipboard',
    maxLength: 5000,
    setupFields: [],
    isConfigured() { return true; },
    async post(/** @type {any} */ _creds, /** @type {any} */ content) {
      await navigator.clipboard.writeText(appendMediaNote(content.text, content.mediaUrl, 5000));
      window.open('https://vimeo.com/upload', '_blank');
      return { platform: 'vimeo', method: 'clipboard', note: 'Description copied to clipboard. Paste it in Vimeo upload details.' };
    }
  },

  behance: {
    label: 'Behance',
    emoji: '🟦',
    method: 'clipboard',
    maxLength: 5000,
    setupFields: [],
    isConfigured() { return true; },
    async post(/** @type {any} */ _creds, /** @type {any} */ content) {
      await navigator.clipboard.writeText(appendMediaNote(content.text, content.mediaUrl, 5000));
      window.open('https://www.behance.net/project/create', '_blank');
      return { platform: 'behance', method: 'clipboard', note: 'Project copy copied to clipboard. Paste into Behance project editor.' };
    }
  },

  dribbble: {
    label: 'Dribbble',
    emoji: '🏀',
    method: 'clipboard',
    maxLength: 3000,
    setupFields: [],
    isConfigured() { return true; },
    async post(/** @type {any} */ _creds, /** @type {any} */ content) {
      await navigator.clipboard.writeText(appendMediaNote(content.text, content.mediaUrl, 3000));
      window.open('https://dribbble.com/shots/new', '_blank');
      return { platform: 'dribbble', method: 'clipboard', note: 'Shot description copied. Paste into Dribbble shot details.' };
    }
  },

  artstation: {
    label: 'ArtStation',
    emoji: '🎨',
    method: 'clipboard',
    maxLength: 5000,
    setupFields: [],
    isConfigured() { return true; },
    async post(/** @type {any} */ _creds, /** @type {any} */ content) {
      await navigator.clipboard.writeText(appendMediaNote(content.text, content.mediaUrl, 5000));
      window.open('https://www.artstation.com/projects/new', '_blank');
      return { platform: 'artstation', method: 'clipboard', note: 'Project writeup copied. Paste into ArtStation upload form.' };
    }
  },

  twitch: {
    label: 'Twitch',
    emoji: '🟪',
    method: 'clipboard',
    maxLength: 500,
    setupFields: [],
    isConfigured() { return true; },
    async post(/** @type {any} */ _creds, /** @type {any} */ content) {
      await navigator.clipboard.writeText(appendMediaNote(content.text, content.mediaUrl, 500));
      window.open('https://dashboard.twitch.tv/', '_blank');
      return { platform: 'twitch', method: 'clipboard', note: 'Stream title/description copied. Paste into Twitch dashboard.' };
    }
  },

  github: {
    label: 'GitHub',
    emoji: '🐙',
    method: 'clipboard',
    maxLength: 100000,
    setupFields: [
      {
        id: 'repo_url',
        label: 'Repo URL (optional)',
        type: 'url',
        hint: 'e.g. https://github.com/yourname/yourrepo'
      }
    ],
    isConfigured() { return true; },
    async post(/** @type {any} */ creds, /** @type {any} */ content) {
      await navigator.clipboard.writeText(appendMediaNote(content.text, content.mediaUrl, 100000));
      const repo = sanitizePublisherUrl(creds?.repo_url, ['github.com', 'gist.github.com']);
      window.open(repo || 'https://gist.github.com/', '_blank', 'noopener,noreferrer');
      return { platform: 'github', method: 'clipboard', note: 'Release notes/update copied. Paste into release, README, or gist.' };
    }
  },

  tiktok: {
    label: 'TikTok',
    emoji: '🎵',
    method: 'clipboard',
    maxLength: 2200,
    setupFields: [
      {
        id: 'account_uid',
        label: 'Account UID',
        type: 'text',
        hint: 'Your EON user id (used to tie this browser attachment to your local profile)'
      }
    ],
    isConfigured() { return true; },
    async post(/** @type {any} */ _creds, /** @type {any} */ content) {
      assertSocialVideoQuota('tiktok');
      await navigator.clipboard.writeText(appendMediaNote(content.text, content.mediaUrl, 2200));
      window.open('https://www.tiktok.com/upload', '_blank');
      recordSocialVideoUpload('tiktok');
      return { platform: 'tiktok', method: 'clipboard', note: 'Caption copied to clipboard — paste it in TikTok Upload.' };
    }
  },

  instagram: {
    label: 'Instagram',
    emoji: '📸',
    method: 'clipboard',
    maxLength: 2200,
    setupFields: [
      {
        id: 'account_uid',
        label: 'Account UID',
        type: 'text',
        hint: 'Your EON user id (used to tie this browser attachment to your local profile)'
      }
    ],
    isConfigured() { return true; },
    async post(/** @type {any} */ _creds, /** @type {any} */ content) {
      assertSocialVideoQuota('instagram');
      await navigator.clipboard.writeText(appendMediaNote(content.text, content.mediaUrl, 2200));
      window.open('https://www.instagram.com/', '_blank');
      recordSocialVideoUpload('instagram');
      return { platform: 'instagram', method: 'clipboard', note: 'Caption copied to clipboard — paste it when creating your Instagram post.' };
    }
  },

  youtube: {
    label: 'YouTube',
    emoji: '▶️',
    method: 'clipboard',
    maxLength: 5000,
    setupFields: [
      {
        id: 'account_uid',
        label: 'Account UID',
        type: 'text',
        hint: 'Your EON user id (used to tie this browser attachment to your local profile)'
      }
    ],
    isConfigured() { return true; },
    async post(/** @type {any} */ creds, /** @type {any} */ content) {
      assertSocialVideoQuota('youtube');
      if (creds?.account_uid && creds?.oauth_connected === '1') {
        const mediaUrl = String(content.mediaUrl || '').trim();
        const fallbackDescription = appendMediaNote(content.text, mediaUrl, 5000);
        const result = await uploadPlatformContent('youtube', {
          uid: creds.account_uid,
          title: (content.title || 'EONAPP Upload').slice(0, 100),
          description: fallbackDescription,
          mediaUrl,
          privacyStatus: 'private'
        });
        recordSocialVideoUpload('youtube');
        return {
          platform: 'youtube',
          method: 'api',
          note: result?.note || 'YouTube metadata upload request accepted.'
        };
      }
      await navigator.clipboard.writeText(appendMediaNote(content.text, content.mediaUrl, 5000));
      window.open('https://studio.youtube.com/', '_blank');
      recordSocialVideoUpload('youtube');
      return { platform: 'youtube', method: 'clipboard', note: 'Description copied to clipboard — paste it in YouTube Studio.' };
    }
  }
};

// ── Credential store ─────────────────────────────────────────────────────────

function _loadAccounts() {
  try { return JSON.parse(localStorage.getItem(SP_KEYS_KEY) || '{}'); } catch { return {}; }
}

function _saveAccounts(/** @type {any} */ accounts) {
  try { localStorage.setItem(SP_KEYS_KEY, JSON.stringify(accounts)); } catch {}
}

/**
 * Get stored credentials for a platform.
 * @param {string} platform
 * @returns {Record<string,string>}
 */
export function getAccountCreds(/** @type {any} */ platform) {
  return (/** @type {any} */ (_loadAccounts()))[platform] || {};
}

/**
 * Store credentials for a platform (sanitised to string values only).
 * @param {string} platform
 * @param {Record<string,string>} creds
 */
export function setAccountCreds(/** @type {any} */ platform, /** @type {any} */ creds) {
  const accounts = _loadAccounts();
  const /** @type {any} */
safe = {};
  for (const [k, v] of Object.entries(creds || {})) {
    if (typeof v === 'string') (/** @type {any} */ (safe))[k] = v.trim().slice(0, 2048);
  }
  (/** @type {any} */ (accounts))[platform] = safe;
  _saveAccounts(accounts);
}

/**
 * Returns true if the platform has valid credentials (or needs none).
 * @param {string} platform
 */
export function isPlatformReady(/** @type {any} */ platform) {
  const def = (/** @type {any} */ (PLATFORMS))[platform];
  if (!def) return false;
  return def.isConfigured(getAccountCreds(platform));
}

/**
 * Returns array of all platform IDs that are either intent/clipboard (always ready)
 * or have valid API credentials saved.
 */
export function getReadyPlatforms() {
  return Object.keys(PLATFORMS).filter(/** @type {any} */ p => isPlatformReady(p));
}

// ── Post log ─────────────────────────────────────────────────────────────────

function _loadLog() {
  try { return JSON.parse(localStorage.getItem(SP_LOG_KEY) || '[]'); } catch { return []; }
}

function _appendLog(/** @type {any} */ entry) {
  try {
    const log = _loadLog();
    log.unshift({ ...entry, ts: Date.now() });
    localStorage.setItem(SP_LOG_KEY, JSON.stringify(log.slice(0, 200)));
  } catch {}
}

export function getPostLog(/** @type {any} */ limit = 50) {
  return _loadLog().slice(0, limit);
}

// ── Core posting ──────────────────────────────────────────────────────────────

/**
 * Post content to a single platform.
 * @param {string} platform
 * @param {{ title?: string, text: string, embedTitle?: string, embedDescription?: string }} content
 */
export async function post(/** @type {any} */ platform, /** @type {any} */ content) {
  const def = (/** @type {any} */ (PLATFORMS))[platform];
  if (!def) throw new Error(`Unknown platform: ${platform}`);
  const creds = getAccountCreds(platform);
  const normalized = normalizeSocialContent(content);
  const result = await def.post(creds, normalized);
  _appendLog({ ...result, title: normalized.title });
  return result;
}

/**
 * Post content to multiple platforms sequentially.
 * Returns array of results, never throws.
 */
export async function postToAll(/** @type {any} */ platforms, /** @type {any} */ content) {
  const normalized = normalizeSocialContent(content);
  const /** @type {any} */
results = [];
  for (const /** @type {any} */
platform of platforms) {
    try {
      const result = await post(platform, normalized);
      results.push({ ...result, success: true });
    } catch (/** @type {any} */
err) {
      results.push({ platform, success: false, error: String((/** @type {any} */ (err))?.message || err) });
      _appendLog({ platform, success: false, error: String((/** @type {any} */ (err))?.message || err), title: normalized.title });
    }
  }
  return results;
}

export function buildReferralCampaignContent(/** @type {any} */ options = {}) {
  const inviteUrl = String(options.inviteUrl || '').trim() || window.location.origin;
  const alias = String(options.alias || options.profile?.alias || 'someone').trim();
  const placement = String(options.placement || 'referral').trim();
  const title = String(options.title || 'Join EONAPP').trim() || 'Join EONAPP';
  const hook = String(options.hook || `I’m using EONAPP with EONBOT and the EON Browser to run tasks, create content, and share results.`).trim();
  const body = String(options.text || '').trim() || `${hook}\n\nInvite link:\n${inviteUrl}`;
  const text = [
    `${title} — ${alias}`,
    body,
    `Placement: ${placement}`,
    `Invite link: ${inviteUrl}`
  ].filter(Boolean).join('\n\n');
  return {
    title,
    text,
    inviteUrl,
    alias,
    placement,
    metadata: {
      source: 'referral-campaign',
      placement,
      alias
    }
  };
}

export async function launchReferralCampaign(/** @type {any} */ options = {}) {
  const platforms = Array.isArray(options.platforms) && options.platforms.length
    ? options.platforms
    : getReadyPlatforms();
  const content = options.content || buildReferralCampaignContent(options);
  if (!platforms.length) {
    return { ok: false, error: 'No connected accounts ready.', platforms: [], results: [] };
  }
  const results = await postToAll(platforms, content);
  const successCount = results.filter((/** @type {any} */ row) => row?.success).length;
  const failureCount = results.length - successCount;
  try {
    if (successCount > 0 && window.EonPoolPoints?.awardPoints) {
      window.EonPoolPoints.awardPoints('referral-campaign-share', `AI share campaign · ${content.title || 'EONAPP'}`);
    }
  } catch {}
  return {
    ok: successCount > 0,
    platforms,
    results,
    successCount,
    failureCount,
    content
  };
}

/**
 * Get method label for display.
 * @param {string} platform
 */
export function getMethodLabel(/** @type {any} */ platform) {
  const m = (/** @type {any} */ (PLATFORMS))[platform]?.method;
  if (m === 'api') return '🔗 Direct API';
  if (m === 'intent') return '🌐 Web share';
  if (m === 'clipboard') return '📋 Clipboard';
  return m || '?';
}

/**
 * Return the setup guide text for a platform (for the setup UI).
 */
export function getSetupGuide(/** @type {any} */ platform) {
  const /** @type {any} */
guides = {
    discord: `1. Open your Discord server\n2. Go to Server Settings → Integrations → Webhooks\n3. Click "New Webhook" → name it "EONAPP"\n4. Click "Copy Webhook URL" and paste it below\n✅ That's it — no login or OAuth needed.`,
    telegram: `1. Open Telegram and search for @BotFather\n2. Send /newbot — pick a name and username\n3. Copy the bot token it gives you (looks like 123456789:ABC-...)\n4. Add your bot to a channel/group OR message it directly\n5. Get your Chat ID by messaging @userinfobot\n✅ Your bot will post to that chat/channel.`,
    slack: `1. Go to api.slack.com/apps and create a Slack App\n2. Enable "Incoming Webhooks"\n3. Click "Add New Webhook to Workspace" and choose a channel\n4. Copy the webhook URL and paste it below\n✅ EONAPP can now post directly to that channel.`,
    reddit: `Reddit setup is optional. Enter a default subreddit (e.g. "entrepreneur") to pre-fill it when posting. You can always change it on Reddit before submitting.`,
    twitter: 'No setup needed — Twitter opens with your text pre-filled for you to review and post.',
    threads: 'No setup needed — Threads opens with your text pre-filled.',
    bluesky: 'No setup needed — Bluesky opens a compose dialog with your text pre-filled.',
    mastodon: 'Add your Mastodon instance (e.g. mastodon.social). EONAPP opens your instance share composer with text pre-filled.',
    pinterest: 'Optional: add a landing URL so Pinterest pre-fills your destination link.',
    facebook: 'No setup needed — EONAPP copies your caption and opens Facebook for manual review/post.',
    linkedin: 'Optional browser attachment: set Account UID, then connect to keep the session tied to your local profile. Without attachment, LinkedIn share dialog opens.',
    medium: 'No setup needed — EONAPP copies the draft and opens Medium new story.',
    devto: 'No setup needed — EONAPP copies the draft and opens Dev.to new post page.',
    substack: 'No setup needed — EONAPP copies the draft and opens Substack dashboard/editor.',
    wordpress: 'Optional: set your site URL to jump directly to wp-admin/post-new.php; otherwise WordPress homepage opens.',
    ghost: 'Optional: set your Ghost site URL to jump directly to /ghost/#/editor/post; otherwise Ghost homepage opens.',
    vimeo: 'No setup needed — EONAPP copies your description and opens Vimeo upload. Add a stable media URL for a video bundle when you want the post to stay automation-ready.',
    behance: 'No setup needed — EONAPP copies project text and opens Behance create project page.',
    dribbble: 'No setup needed — EONAPP copies shot text and opens Dribbble new shot page.',
    artstation: 'No setup needed — EONAPP copies project writeup and opens ArtStation project upload.',
    twitch: 'No setup needed — EONAPP copies title/description and opens Twitch dashboard.',
    github: 'Optional: set repo URL for quick open. Otherwise Gist opens. Paste copied update into README/release/gist.',
    tiktok: 'Optional browser attachment: set Account UID, then connect from Account Setup. Without attachment, caption is copied and TikTok Upload opens. Add a stable media URL for video automation.',
    instagram: 'Optional browser attachment: set Account UID, then connect from Account Setup. Without attachment, caption is copied and Instagram opens. Add a stable media URL for video automation.',
    youtube: 'No setup needed — YouTube opens with your title/description pre-filled for manual review. Add a stable media URL (Arweave or hosted file) for direct upload.'
  };
  return (/** @type {any} */ (guides))[platform] || 'No setup needed.';
}


export function getPlatformAutomationMeta(/** @type {any} */ platform) {
  return getPlatformAutomationPolicy(platform);
}

export function buildPublishAutomationPlan(/** @type {any} */ platforms = [], /** @type {any} */ content = {}, /** @type {any} */ browserHost = '') {
  return buildDistributionAutomationPlan({ platforms, content, browserHost });
}
