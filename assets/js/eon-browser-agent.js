/**
 * EON Browser — AI Agent Layer
 * AI Activity Monitor · Dual-Layer Perception · Proactive EONBOT · NFT Ability Gates
 */

import {
  detectCaptchaChallengeFromDoc,
  getCaptchaSummary,
  renderCaptchaSummary
} from './utils/captcha-assist.js';

// ── Escape helper ──────────────────────────────────────────────────────────────
/**
 * @param {any} s
 */
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
// EON AI Activity Monitor
// ============================================================
const EONActivityMonitor = (() => {
  /** @type {any[]} */
  const events = [];
  let sessionCalls = 0;
  let sessionTokensEst = 0;
  const sessionProviders = new Set();

  const PROVIDER_COLORS = {
    openrouter: '#a78bfa',
    groq: '#f59e0b',
    openai: '#10b981',
    fireworks: '#f97316',
    cerebras: '#3b82f6',
    local: '#22c55e',
    llm: '#e879f9',
    unknown: '#94a3b8'
  };

  /**
   * @param {any} provider
   */
  function getColor(provider) {
    const p = String(provider || '').toLowerCase();
    for (const [k, v] of Object.entries(PROVIDER_COLORS)) {
      if (p.includes(k)) return v;
    }
    return PROVIDER_COLORS.unknown;
  }

  /**
   * @param {any} provider
   * @param {any} action
   * @param {any} detail
   * @param {any} outputLength
   */
  function log(provider, action, detail, outputLength) {
    const ev = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36),
      provider: String(provider || 'AI'),
      action:   String(action   || 'action'),
      detail:   String(detail   || '').slice(0, 140),
      ts:       Date.now(),
      outputLength: Number(outputLength || 0)
    };
    events.unshift(ev);
    if (events.length > 60) events.splice(60);

    sessionCalls++;
    sessionTokensEst += Math.round((ev.outputLength || 200) / 4);
    sessionProviders.add(ev.provider);

    setPulseActive(true);
    renderAll();
    setTimeout(() => setPulseActive(false), 5000);
  }

  /**
   * @param {boolean} active
   */
  function setPulseActive(active) {
    const dot        = document.getElementById('eon-ai-pulse');
    const label      = document.getElementById('eon-ai-pulse-label');
    const agentDot   = document.getElementById('eon-agent-dot-anim');
    const statusText = document.getElementById('eon-agent-status-text');

    if (dot)   dot.className   = 'eon-ai-pulse' + (active ? ' eon-ai-pulse--active' : '');
    if (agentDot) agentDot.className = 'eon-agent-dot' + (active ? ' eon-agent-dot--active' : '');

    if (active && events[0]) {
      const e = events[0];
      if (label)      label.textContent      = e.provider.toUpperCase() + ' · ' + e.action;
      if (statusText) statusText.textContent = '⚡ ' + e.provider + ' — ' + e.action;
    } else {
      if (label)      label.textContent      = 'AI ready';
      if (statusText) statusText.textContent = 'Watching for AI activity…';
    }
  }

  function renderActivityLog() {
    const list = document.getElementById('eon-activity-log');
    if (!list) return;
    if (!events.length) {
      list.innerHTML = '<p class="eon-activity-empty">No AI activity yet. Use Summarize, Research Mode, or Ask AI.</p>';
      return;
    }
    list.innerHTML = events.slice(0, 25).map(ev => {
      const color = getColor(ev.provider);
      const time  = new Date(ev.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `<div class="eon-activity-entry">
        <div class="eon-activity-header">
          <span class="eon-activity-provider" style="color:${color}">${esc(ev.provider)}</span>
          <span class="eon-activity-action">${esc(ev.action)}</span>
          <span class="eon-activity-time">${time}</span>
        </div>
        ${ev.detail ? `<div class="eon-activity-detail">${esc(ev.detail)}</div>` : ''}
        ${ev.outputLength ? `<div class="eon-activity-meta">${ev.outputLength.toLocaleString()} chars output · ~${Math.round(ev.outputLength/4).toLocaleString()} tokens</div>` : ''}
      </div>`;
    }).join('');
  }

  function renderDualLayer() {
    const feed = document.getElementById('eon-dual-ai-feed');
    if (!feed) return;

    if (!events.length) {
      feed.innerHTML = '<p class="eon-activity-empty">Navigate to a page and run an AI action to see what the AI perceives.</p>';
    } else {
      feed.innerHTML = events.slice(0, 12).map((ev, i) => {
        const color  = getColor(ev.provider);
        const age    = Math.round((Date.now() - ev.ts) / 1000);
        const ageStr = age < 60 ? `${age}s ago` : `${Math.round(age / 60)}m ago`;
        return `<div class="eon-dual-feed-row" style="animation-delay:${i * 0.06}s">
          <div class="eon-dual-feed-brain" style="color:${color}">🧠</div>
          <div class="eon-dual-feed-info">
            <div class="eon-dual-feed-provider" style="color:${color}">${esc(ev.provider)}</div>
            <div class="eon-dual-feed-action">${esc(ev.action)}</div>
            ${ev.detail ? `<div class="eon-dual-feed-detail">${esc(ev.detail)}</div>` : ''}
          </div>
          <span class="eon-dual-feed-age">${ageStr}</span>
        </div>`;
      }).join('');
    }

    const callsEl     = document.getElementById('eon-stats-calls');
    const tokensEl    = document.getElementById('eon-stats-tokens');
    const providersEl = document.getElementById('eon-stats-providers');
    if (callsEl)     callsEl.textContent     = String(sessionCalls);
    if (tokensEl)    tokensEl.textContent    = sessionTokensEst.toLocaleString();
    if (providersEl) providersEl.textContent = [...sessionProviders].join(', ') || '—';
  }

  function renderAll() {
    renderActivityLog();
    renderDualLayer();
  }

window.EONActivityMonitor = { log, events, renderAll, setPulseActive };
  return { log, events, renderAll };
})();

// ============================================================
// EON Browser DOM Automation
// Browser-local helpers for same-origin tabs. This is not a
// cross-site bot or CAPTCHA solver; it is a user-owned action
// helper for pages the cockpit can already see.
// ============================================================
const EONBrowserAutomation = (() => {
  function getActiveFrameContext() {
    const frame = window.EONTabSystem?.getActiveFrame?.();
    if (!frame) {
      throw new Error('Open a page in a browser tab first.');
    }
    let doc = null;
    let win = null;
    try {
      win = frame.contentWindow;
      doc = frame.contentDocument;
    } catch {}
    if (!doc || !win) {
      throw new Error('The active page is cross-origin or blocked. DOM automation only works on browser-local pages.');
    }
    return { frame, doc, win };
  }

  /**
   * @param {string} message
   * @param {boolean} [ok]
   */
  function syncAutomationStatus(message, ok = true) {
    const el = document.getElementById('browser-automation-status');
    if (el) el.textContent = message;
    EONActivityMonitor.log('local', ok ? 'automation' : 'automation-failed', message, message.length);
  }

  /**
   * @param {Element} el
   */
  function dispatchInput(el) {
    try {
      el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    } catch {}
  }

  /**
   * @param {string} selector
   */
  function click(selector) {
    const { doc } = getActiveFrameContext();
    const el = doc.querySelector(selector);
    if (!el) throw new Error(`No element matches "${selector}".`);
    if (typeof el.click === 'function') el.click();
    else el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    syncAutomationStatus(`Clicked ${selector}.`, true);
    return { ok: true, action: 'click', selector };
  }

  /**
   * @param {string} selector
   * @param {any} value
   */
  function fill(selector, value) {
    const { doc } = getActiveFrameContext();
    const el = doc.querySelector(selector);
    if (!el) throw new Error(`No element matches "${selector}".`);
    if (!('value' in el)) throw new Error(`"${selector}" is not an input or textarea.`);
    /** @type {HTMLInputElement | HTMLTextAreaElement} */ (el).value = String(value || '');
    dispatchInput(el);
    syncAutomationStatus(`Filled ${selector}.`, true);
    return { ok: true, action: 'fill', selector, value: String(value || '') };
  }

  /**
   * @param {string} selector
   */
  function submit(selector) {
    const { doc } = getActiveFrameContext();
    const el = doc.querySelector(selector);
    if (!el) throw new Error(`No element matches "${selector}".`);
    const form = el.closest?.('form') || (el.tagName === 'FORM' ? el : null);
    if (!form) throw new Error(`"${selector}" does not belong to a form.`);
    const isSubmitControl = ['BUTTON', 'INPUT'].includes(String(el.tagName || '').toUpperCase());
    if (typeof form.requestSubmit === 'function') form.requestSubmit(isSubmitControl ? el : undefined);
    else form.submit();
    syncAutomationStatus(`Submitted form for ${selector}.`, true);
    return { ok: true, action: 'submit', selector };
  }

  /**
   * @param {string} selector
   * @param {any} value
   */
  function select(selector, value) {
    const { doc } = getActiveFrameContext();
    const el = doc.querySelector(selector);
    if (!el) throw new Error(`No element matches "${selector}".`);
    if (el.tagName !== 'SELECT') throw new Error(`"${selector}" is not a <select>.`);
    const selectEl = /** @type {HTMLSelectElement} */ (el);
    const options = [...selectEl.options];
    const match = options.find((opt) => opt.value === value || String(opt.textContent || '').trim().toLowerCase() === String(value || '').trim().toLowerCase());
    if (!match) throw new Error(`No option matches "${value}".`);
    selectEl.value = match.value;
    dispatchInput(selectEl);
    syncAutomationStatus(`Selected "${match.textContent || match.value}" in ${selector}.`, true);
    return { ok: true, action: 'select', selector, value: match.value };
  }

  function inspectActivePage() {
    const { frame, doc } = getActiveFrameContext();
    const title = String(doc.title || '').trim() || 'Untitled page';
    const url = String(frame.dataset?.url || frame.src || '').trim();
    const fields = doc.querySelectorAll('input, textarea, select, button, [contenteditable="true"]').length;
    const anchors = doc.querySelectorAll('a').length;
    const summary = `${title} · ${url || 'same-origin page'} · ${fields} controls · ${anchors} links`;
    syncAutomationStatus(summary, true);
    return { ok: true, summary, title, url, fields, anchors };
  }

  function inspectCaptcha() {
    const { frame, doc } = getActiveFrameContext();
    const challenge = detectCaptchaChallengeFromDoc(doc);
    const summary = challenge?.ok ? `${getCaptchaSummary(challenge)} Review it manually in the active page.` : getCaptchaSummary(challenge);
    syncAutomationStatus(summary, challenge.ok !== false);
    const box = document.getElementById('browser-captcha-status');
    if (box) box.textContent = summary;
    return { ...challenge, summary, frameUrl: String(frame.dataset?.url || frame.src || '') };
  }

  async function solveCaptcha() {
    throw new Error('Automatic CAPTCHA solving has been removed. Review the challenge yourself and continue manually.');
  }

  /**
   * @param {any} [payload]
   */
  function runStep(payload = {}) {
    const action = String(payload.action || '').trim().toLowerCase();
    const selector = String(payload.selector || '').trim();
    const value = String(payload.value || '').trim();
    if (!action) throw new Error('Choose an automation action first.');
    if (!selector) throw new Error('Enter a selector first.');
    switch (action) {
      case 'click': return click(selector);
      case 'fill': return fill(selector, value);
      case 'submit': return submit(selector);
      case 'select': return select(selector, value);
      default: throw new Error(`Unsupported automation action: ${action}`);
    }
  }

  return { inspectActivePage, inspectCaptcha, solveCaptcha, runStep, click, fill, submit, select };
})();

function refreshCaptchaAssistPanel() {
  const status = document.getElementById('browser-captcha-status');
  if (status) {
    renderCaptchaSummary(status, detectCaptchaChallengeFromDoc(window.EONTabSystem?.getActiveFrame?.()?.contentDocument || document));
  }
}

document.getElementById('browser-captcha-scan')?.addEventListener('click', () => {
  try {
    const result = EONBrowserAutomation.inspectCaptcha();
    if (result?.ok === false) {
      const box = document.getElementById('browser-captcha-status');
      if (box) box.textContent = result.message || 'No CAPTCHA challenge found.';
    }
  } catch (error) {
    const msg = `Challenge scan failed: ${/** @type {Error} */ (error).message || 'Unknown error'}`;
    const box = document.getElementById('browser-captcha-status');
    if (box) box.textContent = msg;
    EONActivityMonitor.log('local', 'captcha-scan-failed', msg, msg.length);
  }
});


refreshCaptchaAssistPanel();

window.EONBrowserAutomation = EONBrowserAutomation;

// ── Activity panel tab switching ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.eon-agent-layer-tab').forEach((/** @type {any} */ tab) => {
    tab.addEventListener('click', () => {
      const layer = tab.dataset.layer;
      document.querySelectorAll('.eon-agent-layer-tab').forEach((/** @type {any} */ t) =>
        t.classList.toggle('active', t === tab)
      );
      document.querySelectorAll('.eon-agent-layer-content').forEach((/** @type {any} */ c) => {
        c.hidden = c.id !== 'eon-agent-layer-' + layer;
      });
      if (layer === 'dual')      EONActivityMonitor.renderAll();
      if (layer === 'abilities') window.renderAbilityGrid?.();
    });
  });

  document.getElementById('eon-panel-agent-close')?.addEventListener('click', () =>
    window.closeAllPanels?.()
  );
  document.getElementById('eon-agent-btn')?.addEventListener('click', () =>
    window.openPanel?.('eon-panel-aiactivity')
  );
  document.getElementById('eon-ai-pulse-wrap')?.addEventListener('click', () =>
    window.openPanel?.('eon-panel-aiactivity')
  );

  document.getElementById('browser-automation-scan')?.addEventListener('click', () => {
    try {
      const result = EONBrowserAutomation.inspectActivePage();
      const status = document.getElementById('browser-automation-status');
      if (status) status.textContent = result.summary;
    } catch (err) {
      const msg = String((/** @type {any} */ (err))?.message || 'Could not inspect active page.');
      const status = document.getElementById('browser-automation-status');
      if (status) status.textContent = msg;
      EONActivityMonitor.log('local', 'automation-failed', msg, msg.length);
    }
  });

  document.getElementById('browser-automation-run')?.addEventListener('click', () => {
    const action = String(document.getElementById('browser-automation-action')?.value || '');
    const selector = String(document.getElementById('browser-automation-selector')?.value || '');
    const value = String(document.getElementById('browser-automation-value')?.value || '');
    try {
      EONBrowserAutomation.runStep({ action, selector, value });
    } catch (err) {
      const msg = String((/** @type {any} */ (err))?.message || 'Automation step failed.');
      const status = document.getElementById('browser-automation-status');
      if (status) status.textContent = msg;
      EONActivityMonitor.log('local', 'automation-failed', msg, msg.length);
    }
  });
});

// ============================================================
// Proactive EONBOT System
// ============================================================
(function initProactiveBot() {
  /** @type {ReturnType<typeof setTimeout> | null} */
  let proactiveTimer = null;
  let lastNotifiedUrl = '';
  let hasGreeted = false;

  const HINTS = [
    { match: 'github.com',   icon: '💻', msg: 'I can summarize this repository or explain the code.',           actions: [{ label: 'Fetch & Summarize', action: 'fetch' }, { label: 'Research', action: 'research' }] },
    { match: 'youtube.com',  icon: '🎬', msg: 'I can help you extract insights or create content from this.',    actions: [{ label: 'Research Mode',    action: 'research' }] },
    { match: 'twitter.com',  icon: '🐦', msg: 'I can analyze this thread or help you craft a response.',         actions: [{ label: 'Extract Points',   action: 'extract' }] },
    { match: 'reddit.com',   icon: '📋', msg: 'I can summarize this discussion and extract the key insights.',   actions: [{ label: 'Summarize',        action: 'summarize' }] },
    { match: 'medium.com',   icon: '✍️', msg: 'I can summarize this article and find content angles for EON.',   actions: [{ label: 'Summarize',        action: 'summarize' }] },
    { match: 'linkedin.com', icon: '💼', msg: 'I can analyze this profile or draft a professional message.',     actions: [{ label: 'Research',         action: 'research' }] },
    { match: 'docs.',        icon: '📚', msg: 'I can explain this documentation or generate code examples.',     actions: [{ label: 'Summarize',        action: 'summarize' }] },
    { match: 'news',         icon: '📰', msg: 'I can extract the key facts and create a creator briefing.',      actions: [{ label: 'Extract Points',   action: 'extract' }] }
  ];

  /**
   * @param {string} url
   */
  function getHint(url) {
    try {
      const host = new URL(url).hostname.replace('www.', '');
      const full = host + url;
      return HINTS.find(h => full.includes(h.match)) || null;
    } catch { return null; }
  }

  /**
   * @param {any} icon
   * @param {string} message
   * @param {any[]} [actions]
   */
  function showToast(icon, message, actions) {
    document.getElementById('eon-proactive-toast')?.remove();
    const toast = document.createElement('div');
    toast.id = 'eon-proactive-toast';
    toast.className = 'eon-proactive-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    const btnsHtml = (actions || []).map(a =>
      `<button class="eon-toast-action-btn" data-action="${esc(a.action)}">${esc(a.label)}</button>`
    ).join('');

    toast.innerHTML = `
      <div class="eon-toast-head">
        <span class="eon-toast-icon-el">${icon || '💬'}</span>
        <span class="eon-toast-bot-name">EONBOT</span>
        <button class="eon-toast-dismiss" aria-label="Dismiss">×</button>
      </div>
      <p class="eon-toast-body">${esc(message)}</p>
      ${btnsHtml ? `<div class="eon-toast-btns">${btnsHtml}</div>` : ''}
    `;

    const viewport = document.querySelector('.browser-viewport-wrap') || document.body;
    viewport.appendChild(toast);

    const auto = setTimeout(() => toast.remove(), 14000);
    toast.querySelector('.eon-toast-dismiss')?.addEventListener('click', () => { clearTimeout(auto); toast.remove(); });
    toast.querySelectorAll('.eon-toast-action-btn').forEach((/** @type {any} */ btn) => {
      btn.addEventListener('click', () => {
        clearTimeout(auto); toast.remove();
        const actionMap = { summarize: 'browser-summarize', research: 'browser-research', extract: 'browser-extract', fetch: 'browser-fetch-source' };
        const elId = actionMap[/** @type {keyof typeof actionMap} */ (btn.getAttribute('data-action') || '')];
        if (elId) document.getElementById(elId)?.click();
      });
    });
  }

  /**
   * @param {string} url
   */
  function scheduleContextualPrompt(url) {
    if (proactiveTimer) clearTimeout(proactiveTimer);
    if (!url || url === lastNotifiedUrl || /^(about:|\/|#)/.test(url)) return;
    proactiveTimer = setTimeout(() => {
      lastNotifiedUrl = url;
      const hint = getHint(url);
      if (hint) {
        showToast(hint.icon, hint.msg, hint.actions);
      } else {
        showToast('🤖', 'I can analyze this page, extract key points, or run deep research on it.', [
          { label: 'Summarize', action: 'summarize' },
          { label: 'Research',  action: 'research' }
        ]);
      }
    }, 5500);
  }

  function greetOnLoad() {
    if (hasGreeted) return;
    hasGreeted = true;
    setTimeout(() => {
      showToast('👋', 'Welcome to EON Browser! Enter any URL and I\'ll offer to analyze it. Or pick an app from the bookmarks bar.', [
        { label: 'Open Chat', action: 'summarize' }
      ]);
    }, 3500);
  }

  // Hook URL bar
  document.getElementById('browser-load')?.addEventListener('click', () => {
    scheduleContextualPrompt(document.getElementById('browser-url')?.value || '');
  });
  document.getElementById('browser-url')?.addEventListener('keydown', (/** @type {KeyboardEvent} */ e) => {
    if (e.key === 'Enter') scheduleContextualPrompt(String((/** @type {HTMLInputElement} */ (e.target)).value || ''));
  });

  // Greet on first new-tab open
  document.addEventListener('eon:tab:newtab', greetOnLoad);
  // Also try on page load if user lands directly
  setTimeout(greetOnLoad, 3500);

  window.EONProactiveBot = { scheduleContextualPrompt, showToast, greetOnLoad };
})();

// ============================================================
// EON NFT Ability System
// ============================================================
const _EONAbilities = (() => {
  const ABILITIES = {
    MULTI_TAB:      { name: 'Multi-Tab Browsing',        tier: null,      icon: '🗂️',  desc: 'Open multiple tabs simultaneously' },
    EONBOT_CHAT:    { name: 'EONBOT Chat',               tier: null,      icon: '💬',  desc: 'Full EONBOT chat in every tab' },
    PAGE_SUMMARIZE: { name: 'Page Summarization',        tier: null,      icon: '📝',  desc: 'AI summarizes any web page' },
    PASSWORD_VAULT: { name: 'Password Vault',            tier: 'STARTER', icon: '🔑',  desc: 'AES-GCM encrypted credential storage' },
    HISTORY:        { name: 'Browsing History',          tier: 'STARTER', icon: '📋',  desc: 'Persistent session browsing history' },
    RESEARCH_MODE:  { name: 'Deep Research Mode',        tier: 'STARTER', icon: '🔬',  desc: 'Multi-angle AI research packs' },
    AI_AGENT_LAYER: { name: 'AI Activity Monitor',       tier: 'PRO',     icon: '🤖',  desc: 'Live dual-layer AI perception view' },
    AUTO_FETCH:     { name: 'Auto Page Analysis',        tier: 'PRO',     icon: '⚡',  desc: 'AI auto-analyzes every page on load' },
    PROACTIVE_BOT:  { name: 'Proactive EONBOT',         tier: 'PRO',     icon: '🎙️', desc: 'Contextual AI suggestions as you browse' },
    BACKGROUND_AI:  { name: 'Background AI Tasks',       tier: 'ULTRA',   icon: '🧠',  desc: 'AI runs tasks while you do other work' },
    MULTI_AGENT:    { name: 'Multi-Agent Orchestration', tier: 'ULTRA',   icon: '🌐',  desc: 'Chain multiple AI agents on complex tasks' },
    AUTO_LOGIN:     { name: 'AI Auto-Login',             tier: 'ULTRA',   icon: '🚀',  desc: 'AI uses vault credentials to log in for you' }
  };

  const TIERS = {
    STARTER: { name: 'EON Starter NFT', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'Free with signup' },
    PRO:     { name: 'EON Pro NFT',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'EON Marketplace' },
    ULTRA:   { name: 'EON Ultra NFT',   color: '#f97316', bg: 'rgba(249,115,22,0.12)',  label: 'Rare drop — EON Vault' }
  };

  function getOwned() {
    try { return JSON.parse(localStorage.getItem('eon:nft-abilities:v1') || '{}'); }
    catch { return {}; }
  }

  /**
   * @param {keyof typeof ABILITIES} key
   */
  function hasAbility(key) {
    const ab = ABILITIES[key];
    if (!ab || !ab.tier) return true;
    if (ab.tier === 'STARTER') return true;
    const owned = getOwned();
    if (ab.tier === 'PRO')   return Boolean(owned.PRO || owned.ULTRA);
    if (ab.tier === 'ULTRA') return Boolean(owned.ULTRA);
    return false;
  }

  /**
   * @param {keyof typeof ABILITIES} key
   */
  function showUnlockModal(key) {
    const ab = ABILITIES[key];
    if (!ab?.tier) return;
      const tier = TIERS[/** @type {keyof typeof TIERS} */ (ab.tier)];
    document.getElementById('eon-ability-modal')?.remove();
    const m = document.createElement('div');
    m.id = 'eon-ability-modal';
    m.className = 'eon-ability-modal-overlay';
    m.innerHTML = `
      <div class="eon-ability-modal-box" style="--tier-color:${tier.color};--tier-bg:${tier.bg}">
        <div class="eon-ability-modal-icon">${ab.icon}</div>
        <h3 class="eon-ability-modal-title">${esc(ab.name)}</h3>
        <p class="eon-ability-modal-desc">${esc(ab.desc)}</p>
        <div class="eon-ability-modal-tier">
          Requires: <strong style="color:${tier.color}">${esc(tier.name)}</strong>
          <span class="eon-ability-tier-label">${esc(tier.label)}</span>
        </div>
        <div class="eon-ability-modal-btns">
          <a href="/vault.html#nft" class="btn btn-primary btn-sm" target="_blank">Get ${esc(tier.name)}</a>
          <a href="/marketplace.html" class="btn btn-outline btn-sm" target="_blank">Browse Marketplace</a>
          <button class="btn btn-outline btn-sm" id="eon-ability-modal-close">Close</button>
        </div>
        <p class="eon-ability-modal-note">⚡ EON NFTs are utility tokens on Polygon Mainnet. They unlock real browser features.</p>
      </div>`;
    document.body.appendChild(m);
    m.querySelector('#eon-ability-modal-close')?.addEventListener('click', () => m.remove());
    m.addEventListener('click', (/** @type {MouseEvent} */ e) => { if (e.target === m) m.remove(); });
  }

  function renderAbilityGrid() {
    const grid   = document.getElementById('eon-abilities-grid');
    const tierEl = document.getElementById('eon-current-tier');
    if (!grid) return;
    const owned = getOwned();
    if (tierEl) tierEl.textContent = owned.ULTRA ? 'Ultra' : owned.PRO ? 'Pro' : 'Starter';

    grid.innerHTML = Object.entries(ABILITIES).map(([key, ab]) => {
      const abilityKey = /** @type {keyof typeof ABILITIES} */ (key);
      const unlocked  = hasAbility(abilityKey);
      const tierInfo  = ab.tier ? TIERS[/** @type {keyof typeof TIERS} */ (ab.tier)] : null;
      const tierColor = tierInfo ? tierInfo.color : '#22c55e';
      return `<div class="eon-ability-card${unlocked ? '' : ' eon-ability-card--locked'}" data-key="${esc(key)}" title="${esc(ab.desc)}">
        <div class="eon-ability-card-icon">${ab.icon}</div>
        <div class="eon-ability-card-name">${esc(ab.name)}</div>
        <div class="eon-ability-card-status" style="color:${tierColor}">
          ${unlocked ? '✓ Active' : '🔒 ' + esc(tierInfo ? tierInfo.name : '')}
        </div>
      </div>`;
    }).join('');

    grid.querySelectorAll('.eon-ability-card--locked').forEach((/** @type {any} */ card) =>
      card.addEventListener('click', () => showUnlockModal(/** @type {keyof typeof ABILITIES} */ (card.dataset.key || 'MULTI_TAB')))
    );
  }

  window.EONAbilities        = { hasAbility, showUnlockModal, renderAbilityGrid, ABILITIES, TIERS };
  window.renderAbilityGrid   = renderAbilityGrid;
  return { hasAbility, showUnlockModal, renderAbilityGrid };
})();

void _EONAbilities;

// ── React to AI action events dispatched by eon-browser-page.js ───────────────
document.addEventListener('eon:ai-action', (/** @type {Event} */ e) => {
  const { provider, action, detail, outputLength, url } = e.detail || {};
  const fullDetail = url ? `${detail || ''} · ${String(url).slice(0, 60)}` : detail;
  window.EONActivityMonitor?.log(provider || 'AI', action || 'AI action', fullDetail, outputLength);
});
