/**
 * EON Browser Platform — Browse Mode for EONAPP.CH
 * ==================================================
 * Adapted from eonpackage/src/platforms/EON_Browser_Platform_V5.tsx
 * for vanilla JS, localStorage-first persistence, and EONAPP WorkBench.
 *
 * Browser-mode workspace for tabs, saved sessions, agent tasks,
 * bookmarks, and AI-powered browsing. Displays sites via iframe
 * where X-Frame-Options allows.
 *
 * Features:
 * - Tab management (open, close, pin, navigate)
 * - Session persistence (save/restore workspace state)
 * - Bookmark management with folders
 * - AI Agent tasks (navigate, extract, post drafts)
 * - Quick Sites directory (50+ curated sites)
 * - URL bar with search engine integration
 * - History tracking per session
 * - Privacy settings (cookie policy, fingerprint)
 *
 * @module utils/eon-browser
 */

import { runMissionEngine } from './mission-engine.js';
import * as aiRuntimeModule from '../chat/ai-runtime.js';

// Browser global type cast for custom window properties.
// Fallback to globalThis so Node-based smoke tests can import the module safely.
const appWin = /** @type {any} */ (typeof window !== 'undefined' ? window : globalThis);

// -- Storage keys --
const TABS_KEY = 'eon:browser:tabs:v1';
const SESSIONS_KEY = 'eon:browser:sessions:v1';
const BOOKMARKS_KEY = 'eon:browser:bookmarks:v1';
const HISTORY_KEY = 'eon:browser:history:v1';
const SETTINGS_KEY = 'eon:browser:settings:v1';
const AGENT_TASKS_KEY = 'eon:browser:agent-tasks:v1';

// -- Quick Sites (curated directory) --
export const /** @type {any} */
QUICK_SITES = [
  // Social
  { name: 'X / Twitter', url: 'https://twitter.com', icon: 'X', category: 'Social', allowsEmbed: false },
  { name: 'Reddit', url: 'https://reddit.com', icon: 'R', category: 'Social', allowsEmbed: false },
  { name: 'LinkedIn', url: 'https://linkedin.com', icon: 'Li', category: 'Social', allowsEmbed: false },
  { name: 'Discord', url: 'https://discord.com', icon: 'Dc', category: 'Social', allowsEmbed: false },
  { name: 'Telegram', url: 'https://web.telegram.org', icon: 'Tg', category: 'Social', allowsEmbed: false },
  { name: 'Bluesky', url: 'https://bsky.app', icon: 'Bs', category: 'Social', allowsEmbed: false },
  { name: 'Mastodon', url: 'https://mastodon.social', icon: 'Ma', category: 'Social', allowsEmbed: false },
  // Video
  { name: 'YouTube', url: 'https://youtube.com', icon: 'Yt', category: 'Video', allowsEmbed: false },
  { name: 'Twitch', url: 'https://twitch.tv', icon: 'Tw', category: 'Video', allowsEmbed: false },
  { name: 'Vimeo', url: 'https://vimeo.com', icon: 'Vm', category: 'Video', allowsEmbed: false },
  // Work
  { name: 'Gmail', url: 'https://mail.google.com', icon: 'Gm', category: 'Work', allowsEmbed: false },
  { name: 'Google Docs', url: 'https://docs.google.com', icon: 'Gd', category: 'Work', allowsEmbed: false },
  { name: 'Notion', url: 'https://notion.so', icon: 'No', category: 'Work', allowsEmbed: false },
  { name: 'GitHub', url: 'https://github.com', icon: 'Gh', category: 'Work', allowsEmbed: false },
  { name: 'Figma', url: 'https://figma.com', icon: 'Fi', category: 'Work', allowsEmbed: false },
  { name: 'Slack', url: 'https://app.slack.com', icon: 'Sl', category: 'Work', allowsEmbed: false },
  { name: 'Trello', url: 'https://trello.com', icon: 'Tr', category: 'Work', allowsEmbed: false },
  // AI Tools
  { name: 'ChatGPT', url: 'https://chat.openai.com', icon: 'Cp', category: 'AI Tools', allowsEmbed: false },
  { name: 'Claude', url: 'https://claude.ai', icon: 'Cl', category: 'AI Tools', allowsEmbed: false },
  { name: 'Gemini', url: 'https://gemini.google.com', icon: 'Ge', category: 'AI Tools', allowsEmbed: false },
  { name: 'Perplexity', url: 'https://perplexity.ai', icon: 'Pp', category: 'AI Tools', allowsEmbed: false },
  { name: 'Midjourney', url: 'https://midjourney.com', icon: 'Mj', category: 'AI Tools', allowsEmbed: false },
  // Crypto
  { name: 'CoinGecko', url: 'https://coingecko.com', icon: 'Cg', category: 'Crypto', allowsEmbed: false },
  { name: 'Etherscan', url: 'https://etherscan.io', icon: 'Et', category: 'Crypto', allowsEmbed: false },
  { name: 'Uniswap', url: 'https://app.uniswap.org', icon: 'Un', category: 'Crypto', allowsEmbed: false },
  { name: 'OpenSea', url: 'https://opensea.io', icon: 'Os', category: 'Crypto', allowsEmbed: false },
  { name: 'TradingView', url: 'https://tradingview.com', icon: 'Tv', category: 'Crypto', allowsEmbed: false },
  { name: 'DeFiLlama', url: 'https://defillama.com', icon: 'Dl', category: 'Crypto', allowsEmbed: false },
  // News
  { name: 'HackerNews', url: 'https://news.ycombinator.com', icon: 'Hn', category: 'News', allowsEmbed: true },
  { name: 'ProductHunt', url: 'https://producthunt.com', icon: 'Ph', category: 'News', allowsEmbed: false },
  { name: 'Medium', url: 'https://medium.com', icon: 'Md', category: 'News', allowsEmbed: false },
  { name: 'Wikipedia', url: 'https://wikipedia.org', icon: 'Wk', category: 'News', allowsEmbed: false },
  { name: 'Dev.to', url: 'https://dev.to', icon: 'Dv', category: 'News', allowsEmbed: true }
];

// -- AI Task Templates --
export const /** @type {any} */
AI_TEMPLATES = [
  { id: 'tmpl-social-post', name: 'Social Media Post', description: 'Draft and schedule posts', category: 'Marketing', icon: 'S', steps: ['Define topic', 'Generate copy', 'Review', 'Schedule'] },
  { id: 'tmpl-thread-writer', name: 'Twitter Thread', description: 'Create engaging threads', category: 'Marketing', icon: 'T', steps: ['Input idea', 'Generate tweets', 'Add hooks', 'Export'] },
  { id: 'tmpl-seo-content', name: 'SEO Blog Post', description: 'Research and write SEO articles', category: 'Content', icon: 'B', steps: ['Keyword', 'Research', 'Outline', 'Write'] },
  { id: 'tmpl-competitor-research', name: 'Competitor Research', description: 'Analyze competitor sites', category: 'Research', icon: 'R', steps: ['Competitor URLs', 'Navigate', 'Extract', 'Compare'] },
  { id: 'tmpl-market-scan', name: 'Market Scan', description: 'Find unmet needs across forums', category: 'Research', icon: 'M', steps: ['Market', 'Scan', 'Cluster', 'Report'] },
  { id: 'tmpl-price-compare', name: 'Price Comparison', description: 'Compare prices across products', category: 'Research', icon: 'P', steps: ['Product', 'Search', 'Extract', 'Compare'] },
  { id: 'tmpl-data-extract', name: 'Data Extraction', description: 'Extract structured data from pages', category: 'Data', icon: 'D', steps: ['URL', 'Identify data', 'Extract', 'Format'] },
  { id: 'tmpl-summarize', name: 'Page Summarizer', description: 'Summarize any web page', category: 'Content', icon: 'Z', steps: ['Navigate', 'Read', 'Summarize', 'Export'] }
];

// -- Search engines --
const /** @type {any} */
SEARCH_ENGINES = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
  perplexity: { name: 'Perplexity', url: 'https://perplexity.ai/search?q=' }
};

// -- URL security helpers (SF-9) --
// Only allow http: and https: schemes. Block javascript:, data:, file:, vbscript:, blob:
const /** @type {any} */
ALLOWED_SCHEMES = new Set(['https:', 'http:']);

// Basic phishing/abuse denylist — expandable; does NOT replace a real blocklist feed
const /** @type {any} */
URL_DENYLIST = new Set([
  'bit.ly', 'tinyurl.com', 'cutt.ly', 'rebrand.ly', 'short.link',
  'is.gd', 'v.gd', 'bc.vc', 'adf.ly', 'linktr.ee', 'grabify.link',
  'iplogger.org', 'iplogger.com', 'blasze.tk', 'blasze.com', '2no.co',
  'yip.su', 'trackurl.it', 'l-page.vip', 'getlinkinfo.com',
  'qr-code-generator-free.com', 'free.fr'
]);

/**
 * Validate and sanitize a URL before embedding in an iframe.
 * @param {string} rawUrl
 * @returns {{ ok: boolean, url: string, reason?: string }}
 */
export function validateBrowserUrl(/** @type {any} */ rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return { ok: false, url: '', reason: 'empty' };
  const trimmed = rawUrl.trim();
  let /** @type {any} */
parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    // Not a valid URL
    return { ok: false, url: '', reason: 'invalid URL' };
  }
  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    return { ok: false, url: '', reason: `disallowed scheme: ${parsed.protocol}` };
  }
  if (URL_DENYLIST.has(parsed.hostname.toLowerCase())) {
    return { ok: false, url: '', reason: 'URL shortener/tracker blocked' };
  }
  // Return the canonical form (prevents double-encoding tricks)
  return { ok: true, url: parsed.href };
}

/**
 * Escape a URL for safe use as an HTML attribute value.
 * This prevents `"` breakout from attribute context even if validation is bypassed.
 * @param {string} url
 * @returns {string}
 */
export function escapeUrlAttr(/** @type {any} */ url) {
  return String(url || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// -- Helpers --
function cryptoId() {
  const bytes = new Uint8Array(8);
  if (!window.crypto?.getRandomValues) throw new Error('crypto.getRandomValues required');
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, /** @type {any} */ b => b.toString(16).padStart(2, '0')).join('');
}

function loadJson(/** @type {any} */ key, /** @type {any} */ fallback) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch { return fallback; }
}

function saveJson(/** @type {any} */ key, /** @type {any} */ value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function getDomainFromUrl(/** @type {any} */ url) {
  try { return new URL(url).hostname; } catch { return url; }
}

function getFaviconUrl(/** @type {any} */ url) {
  const domain = getDomainFromUrl(url);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

// -- Service class --
class EONBrowserService {
  constructor() {
    /** @type {any[]} */
    this.tabs = [];
    /** @type {any[]} */
    this.sessions = [];
    /** @type {any[]} */
    this.bookmarks = [];
    /** @type {any[]} */
    this.history = [];
    /** @type {any[]} */
    this.agentTasks = [];
    this.activeTabId = null;
    this.activeSessionId = null;
    this.settings = {
      searchEngine: 'google',
      cookiePolicy: { blockTracking: true, thirdPartyCookiesAllowed: false, httpsOnly: true, doNotTrack: true },
      adBlockerEnabled: false,
      homeUrl: ''
    };
    this._hydrate();
  }

  // -- Tab management --
  openTab(/** @type {any} */ url, /** @type {any} */ title) {
    url = url || '';
    // SF-9: validate URL before creating tab
    if (url) {
      const validation = validateBrowserUrl(url);
      if (!validation.ok) {
        if (appWin.DEBUG) console.warn('[EONBrowser] Blocked URL:', url, validation.reason);
        url = '';
      } else {
        url = validation.url;
      }
    }
    title = title || getDomainFromUrl(url);
    const /** @type {any} */
tab = {
      id: `tab-${cryptoId()}`,
      title,
      url,
      displayUrl: url,
      favicon: url ? getFaviconUrl(url) : '',
      status: url ? 'loading' : 'empty',
      sessionId: this.activeSessionId || 'default',
      isAIControlled: false,
      isPinned: false,
      isIncognito: false,
      canEmbed: false,
      loadedAt: Date.now()
    };
    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this._addHistory(url, title);
    this._persist();
    return tab;
  }

  closeTab(/** @type {any} */ tabId) {
    const idx = this.tabs.findIndex(/** @type {any} */ t => t.id === tabId);
    if (idx === -1) return;
    this.tabs.splice(idx, 1);
    if (this.activeTabId === tabId) {
      this.activeTabId = this.tabs.length > 0 ? this.tabs[Math.max(0, idx - 1)].id : null;
    }
    this._persist();
  }

  navigateTab(/** @type {any} */ tabId, /** @type {any} */ url) {
    const tab = this.tabs.find(/** @type {any} */ t => t.id === tabId);
    if (!tab) return;
    // SF-9: validate URL before navigating
    if (url) {
      const validation = validateBrowserUrl(url);
      if (!validation.ok) {
        if (appWin.DEBUG) console.warn('[EONBrowser] Blocked navigation:', url, validation.reason);
        return null;
      }
      url = validation.url;
    }
    tab.url = url;
    tab.displayUrl = url;
    tab.title = getDomainFromUrl(url);
    tab.favicon = getFaviconUrl(url);
    tab.status = 'loading';
    tab.loadedAt = Date.now();
    this._addHistory(url, tab.title);
    this._persist();
    return tab;
  }

  setActiveTab(/** @type {any} */ tabId) {
    this.activeTabId = tabId;
    this._persist();
  }

  getActiveTab() {
    return this.tabs.find(/** @type {any} */ t => t.id === this.activeTabId) || null;
  }

  pinTab(/** @type {any} */ tabId) {
    const tab = this.tabs.find(/** @type {any} */ t => t.id === tabId);
    if (tab) { tab.isPinned = !tab.isPinned; this._persist(); }
    return tab;
  }

  // -- Session management --
  createSession(/** @type {any} */ name, /** @type {any} */ color) {
    const /** @type {any} */
session = {
      id: `sess-${cryptoId()}`,
      name: name || 'New Session',
      color: color || 'blue',
      bookmarks: [],
      history: [],
      proxyLabel: 'Direct',
      createdAt: Date.now(),
      isIncognito: false
    };
    this.sessions.push(session);
    this.activeSessionId = session.id;
    this._persist();
    return session;
  }

  switchSession(/** @type {any} */ sessionId) {
    this.activeSessionId = sessionId;
    this._persist();
  }

  deleteSession(/** @type {any} */ sessionId) {
    this.sessions = this.sessions.filter(/** @type {any} */ s => s.id !== sessionId);
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = this.sessions.length > 0 ? this.sessions[0].id : null;
    }
    this._persist();
  }

  // -- Bookmark management --
  addBookmark(/** @type {any} */ url, /** @type {any} */ title, /** @type {any} */ folderId) {
    const /** @type {any} */
bm = {
      id: `bm-${cryptoId()}`,
      url,
      title: title || getDomainFromUrl(url),
      favicon: getFaviconUrl(url),
      folderId: folderId || null,
      addedAt: Date.now()
    };
    this.bookmarks.push(bm);
    this._persist();

    if (appWin.EonPoolPoints?.awardPoints) {
      appWin.EonPoolPoints.awardPoints('signal-save', `Bookmarked: ${bm.title}`);
    }
    return bm;
  }

  removeBookmark(/** @type {any} */ bookmarkId) {
    this.bookmarks = this.bookmarks.filter(/** @type {any} */ b => b.id !== bookmarkId);
    this._persist();
  }

  getBookmarksByFolder(/** @type {any} */ folderId) {
    return this.bookmarks.filter(/** @type {any} */ b => b.folderId === folderId);
  }

  // -- AI Agent Tasks --
  createAgentTask(/** @type {any} */ goal, /** @type {any} */ model) {
    const /** @type {any} */
task = {
      id: `agent-${cryptoId()}`,
      goal,
      steps: [],
      status: 'planning',
      model: model || 'default',
      tabId: this.activeTabId,
      createdAt: Date.now(),
      extractedData: '',
      requiresApproval: true,
      completedAt: null,
      successRate: null
    };
    this.agentTasks.push(task);
    this._persist();

    if (appWin.EonPoolPoints?.awardPoints) {
      appWin.EonPoolPoints.awardPoints('mission-run', `Created browser agent task: ${goal.slice(0, 50)}`);
    }
    return task;
  }

  updateAgentTask(/** @type {any} */ taskId, /** @type {any} */ updates) {
    const task = this.agentTasks.find(/** @type {any} */ t => t.id === taskId);
    if (!task) return;
    Object.assign(task, updates);
    this._persist();
    return task;
  }

  completeAgentTask(/** @type {any} */ taskId, /** @type {any} */ extractedData, /** @type {any} */ successRate) {
    const task = this.agentTasks.find(/** @type {any} */ t => t.id === taskId);
    if (!task) return;
    task.status = 'done';
    task.extractedData = extractedData || '';
    task.successRate = successRate || null;
    task.completedAt = Date.now();
    this._persist();

    if (appWin.EonPoolPoints?.awardPoints) {
      appWin.EonPoolPoints.awardPoints('mission-first', `Completed browser agent task: ${task.goal.slice(0, 50)}`);
    }
    return task;
  }

  // -- Search --
  search(/** @type {any} */ query) {
    const engine = (/** @type {any} */ (SEARCH_ENGINES))[this.settings.searchEngine] || SEARCH_ENGINES.google;
    const searchUrl = engine.url + encodeURIComponent(query);
    return this.openTab(searchUrl, `Search: ${query}`);
  }

  // -- Settings --
  updateSettings(/** @type {any} */ updates) {
    Object.assign(this.settings, updates);
    this._persist();
  }

  // -- Reading List --
  addToReadingList(/** @type {any} */ url, /** @type {any} */ title) {
    const /** @type {any} */
item = {
      id: `rl-${cryptoId()}`,
      url,
      title: title || getDomainFromUrl(url),
      favicon: getFaviconUrl(url),
      addedAt: Date.now(),
      readAt: null,
      isRead: false,
      notes: ''
    };
    if (!this._readingList) this._readingList = loadJson('eon:browser:reading-list:v1', []);
    this._readingList.push(item);
    saveJson('eon:browser:reading-list:v1', this._readingList.slice(-200));
    return item;
  }

  markReadingListItemRead(/** @type {any} */ itemId) {
    if (!this._readingList) this._readingList = loadJson('eon:browser:reading-list:v1', []);
    const item = this._readingList.find((/** @type {any} */ i) => i.id === itemId);
    if (item) {
      item.isRead = true;
      item.readAt = Date.now();
      saveJson('eon:browser:reading-list:v1', this._readingList);
    }
  }

  removeReadingListItem(/** @type {any} */ itemId) {
    if (!this._readingList) this._readingList = loadJson('eon:browser:reading-list:v1', []);
    this._readingList = this._readingList.filter((/** @type {any} */ i) => i.id !== itemId);
    saveJson('eon:browser:reading-list:v1', this._readingList);
  }

  getReadingList() {
    if (!this._readingList) this._readingList = loadJson('eon:browser:reading-list:v1', []);
    return this._readingList;
  }

  // -- Tab Groups --
  createTabGroup(/** @type {any} */ name, /** @type {any} */ color) {
    if (!this._tabGroups) this._tabGroups = loadJson('eon:browser:tab-groups:v1', []);
    const /** @type {any} */
group = {
      id: `tg-${cryptoId()}`,
      name: name || 'New Group',
      color: color || 'blue',
      tabIds: [],
      collapsed: false,
      createdAt: Date.now()
    };
    this._tabGroups.push(group);
    saveJson('eon:browser:tab-groups:v1', this._tabGroups);
    return group;
  }

  addTabToGroup(/** @type {any} */ tabId, /** @type {any} */ groupId) {
    if (!this._tabGroups) this._tabGroups = loadJson('eon:browser:tab-groups:v1', []);
    const group = this._tabGroups.find((/** @type {any} */ g) => g.id === groupId);
    if (group && !group.tabIds.includes(tabId)) {
      group.tabIds.push(tabId);
      saveJson('eon:browser:tab-groups:v1', this._tabGroups);
    }
  }

  removeTabFromGroup(/** @type {any} */ tabId, /** @type {any} */ groupId) {
    if (!this._tabGroups) this._tabGroups = loadJson('eon:browser:tab-groups:v1', []);
    const group = this._tabGroups.find((/** @type {any} */ g) => g.id === groupId);
    if (group) {
      group.tabIds = group.tabIds.filter((/** @type {any} */ id) => id !== tabId);
      saveJson('eon:browser:tab-groups:v1', this._tabGroups);
    }
  }

  getTabGroups() {
    if (!this._tabGroups) this._tabGroups = loadJson('eon:browser:tab-groups:v1', []);
    return this._tabGroups;
  }

  deleteTabGroup(/** @type {any} */ groupId) {
    if (!this._tabGroups) this._tabGroups = loadJson('eon:browser:tab-groups:v1', []);
    this._tabGroups = this._tabGroups.filter((/** @type {any} */ g) => g.id !== groupId);
    saveJson('eon:browser:tab-groups:v1', this._tabGroups);
  }

  // -- Page Notes --
  addPageNote(/** @type {any} */ url, /** @type {any} */ text) {
    if (!this._pageNotes) this._pageNotes = loadJson('eon:browser:page-notes:v1', []);
    const /** @type {any} */
note = {
      id: `note-${cryptoId()}`,
      url,
      domain: getDomainFromUrl(url),
      text,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this._pageNotes.push(note);
    if (this._pageNotes.length > 500) this._pageNotes = this._pageNotes.slice(-500);
    saveJson('eon:browser:page-notes:v1', this._pageNotes);

    if (appWin.EonPoolPoints?.awardPoints) {
      appWin.EonPoolPoints.awardPoints('signal-save', `Added page note for ${note.domain}`);
    }
    return note;
  }

  getPageNotes(/** @type {any} */ url) {
    if (!this._pageNotes) this._pageNotes = loadJson('eon:browser:page-notes:v1', []);
    if (url) return this._pageNotes.filter((/** @type {any} */ n) => n.url === url);
    return this._pageNotes;
  }

  deletePageNote(/** @type {any} */ noteId) {
    if (!this._pageNotes) this._pageNotes = loadJson('eon:browser:page-notes:v1', []);
    this._pageNotes = this._pageNotes.filter((/** @type {any} */ n) => n.id !== noteId);
    saveJson('eon:browser:page-notes:v1', this._pageNotes);
  }

  // -- AI Page Summarization --
  async summarizePage(/** @type {any} */ url, /** @type {any} */ aiRuntime) {
    if (!aiRuntime) {
      aiRuntime = aiRuntimeModule;
    }

    const domain = getDomainFromUrl(url);
    const prompt = `Summarize the key information that would typically be found on ${domain}. 
Since I cannot directly read the page content, provide a general summary of what ${domain} is known for, its main features, and typical content. 
Keep the summary under 150 words. Format: 3-5 bullet points.`;

    try {
      const settings = aiRuntime.loadAISettings();
      const reply = await runMissionEngine({
        mode: 'browse',
        prompt,
        history: [],
        systemPrompt: 'You are a web content summarizer. Provide concise, factual summaries.',
        settings,
        taskType: 'browse',
        origin: 'browser-utils',
        metadata: {
          surface: 'browser',
          url,
          domain,
          action: 'summarize'
        }
      });

      const result = String(reply?.text || '');
      if (result) {
        if (appWin.EonPoolPoints?.awardPoints) {
          appWin.EonPoolPoints.awardPoints('mission-run', `Summarized page: ${domain}`);
        }
        return { success: true, summary: result.trim(), url, domain };
      }
      return { success: false, error: 'AI returned empty' };
    } catch (/** @type {any} */
err) {
      return { success: false, error: (/** @type {Error} */ (err)).message };
    }
  }

  // -- AI Web Research Agent --
  async runResearchAgent(/** @type {any} */ topic, /** @type {any} */ depth, /** @type {any} */ aiRuntime) {
    if (!aiRuntime) {
      aiRuntime = aiRuntimeModule;
    }

    const depthLevel = depth || 'standard';
    const prompt = depthLevel === 'deep'
      ? `Conduct deep research on: "${topic}". Provide: 1) Overview, 2) Key players/entities, 3) Recent developments, 4) Market data if applicable, 5) Future outlook, 6) Sources to verify. Be thorough and factual.`
      : `Research and summarize: "${topic}". Provide: 1) Brief overview, 2) Key facts, 3) Recent developments. Keep under 300 words.`;

    try {
      const settings = aiRuntime.loadAISettings();
      const reply = await runMissionEngine({
        mode: 'research',
        prompt,
        history: [],
        systemPrompt: 'You are a research analyst. Provide factual, well-structured research summaries. Always distinguish facts from speculation.',
        settings,
        taskType: 'research',
        origin: 'browser-utils',
        metadata: {
          surface: 'browser',
          topic,
          depth: depthLevel,
          action: 'research'
        }
      });

      const result = String(reply?.text || '');
      if (result) {
        const task = this.createAgentTask(`Research: ${topic}`, settings?.model || 'auto');
        this.completeAgentTask(task.id, result.trim(), 85);

        if (appWin.EonPoolPoints?.awardPoints) {
          appWin.EonPoolPoints.awardPoints('mission-run', `Research agent: ${topic.slice(0, 50)}`);
        }
        return { success: true, research: result.trim(), taskId: task.id };
      }
      return { success: false, error: 'AI returned empty' };
    } catch (/** @type {any} */
err) {
      return { success: false, error: (/** @type {Error} */ (err)).message };
    }
  }

  // -- History --
  _addHistory(/** @type {any} */ url, /** @type {any} */ title) {
    if (!url) return;
    this.history.push({
      id: `hist-${cryptoId()}`,
      url,
      title: title || getDomainFromUrl(url),
      visitedAt: Date.now(),
      sessionId: this.activeSessionId || 'default'
    });
    // Keep last 500 entries
    if (this.history.length > 500) this.history = this.history.slice(-500);
  }

  getHistory(/** @type {any} */ limit) {
    return this.history.slice(-(limit || 50)).reverse();
  }

  clearHistory() {
    this.history = [];
    this._persist();
  }

  // -- Private --
  _hydrate() {
    this.tabs = loadJson(TABS_KEY, []);
    this.sessions = loadJson(SESSIONS_KEY, []);
    this.bookmarks = loadJson(BOOKMARKS_KEY, []);
    this.history = loadJson(HISTORY_KEY, []);
    this.agentTasks = loadJson(AGENT_TASKS_KEY, []);
    this.settings = loadJson(SETTINGS_KEY, this.settings);

    if (this.tabs.length > 0) {
      this.activeTabId = this.tabs[this.tabs.length - 1].id;
    }
    if (this.sessions.length > 0) {
      this.activeSessionId = this.sessions[0].id;
    }
  }

  _persist() {
    saveJson(TABS_KEY, this.tabs);
    saveJson(SESSIONS_KEY, this.sessions);
    saveJson(BOOKMARKS_KEY, this.bookmarks);
    saveJson(HISTORY_KEY, this.history.slice(-500));
    saveJson(AGENT_TASKS_KEY, this.agentTasks.slice(-100));
    saveJson(SETTINGS_KEY, this.settings);
  }
}

// -- Singleton --
const eonBrowserService = new EONBrowserService();
export default eonBrowserService;
export { EONBrowserService };
