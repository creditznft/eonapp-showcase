import { loadAISettings, detectLocalProviders } from './chat/ai-runtime.js';
import { initAppLanguage, localizeStatic, getCurrentLanguage, translateForUser } from './utils/app-language.js';
import { safeHTML } from './utils/safe-html.js';
import { syncBrowserProviderChip, getBrowserProviderInfo } from './utils/provider-visibility.js';
import { getAIReadiness, getSuperappSetupPlan, CANONICAL_AI_SETUP_PATH, CANONICAL_AI_KEYS_PATH } from './utils/ai-readiness.js';
import { applyBrowserWorkspaceProfile, getBrowserWorkspaceProfiles, getDecentralIdentitySummary, getPortableEntitlementSummary, getPortableEntitlementVerificationSummary, getProfile, isAdminProfile, removeBrowserWorkspaceProfile, upsertCurrentBrowserWorkspaceProfile } from './utils/profile.js';
import { recordAIArtifactTelemetry } from './utils/ai-artifact-analytics.js';
import { buildRecognitionLocaleCandidates, resolveSpeechLocale } from './utils/speech-locale.js';
import { escapeHtml } from './utils/escape.js';
import { runMissionEngine } from './utils/mission-engine.js';
import { loadMissionMemory, summarizeMissionMemory } from './utils/mission-memory.js';
import { assessBrowserRisk, getBrowserHost } from './utils/browser-approval.js';
import { buildBrowserPlaybookPlan } from './utils/browser-operations-playbooks.js';
import { buildBrowserSessionBrokerSummary } from './utils/browser-session-broker.js';
import { getActionTrustMeta } from './utils/action-trust-model.js';
import { clearBrowserPermissionMemory, forgetBrowserPermission, getRememberedBrowserPermission, listRememberedBrowserPermissions, rememberBrowserPermission } from './utils/browser-permission-memory.js';
import eonAnalytics from './utils/eon-analytics.js';
import { initCockpitCampaignCenter } from './utils/cockpit-campaign-center.js';

const esc = escapeHtml;

const /** @type {any} */
BrowserGovernor = {
  getBudget() {
    return {
      maxHistoryMessages: 8,
      maxInputChars: 14000,
      maxOutputTokens: 1200,
      timeoutMs: 45000
    };
  },
  beginRequest() {},
  endRequest() {}
};

const BROWSER_READINESS_UI = {
  readyPrimaryLabel: 'Open EONBOT AI',
  readyPrimaryUrl: '/chat.html',
  readySecondaryLabel: 'Open key setup',
  readySecondaryUrl: CANONICAL_AI_KEYS_PATH,
  setupPrimaryLabel: 'Start onboarding',
  setupPrimaryUrl: CANONICAL_AI_SETUP_PATH,
  setupSecondaryLabel: 'Open key setup',
  setupSecondaryUrl: CANONICAL_AI_KEYS_PATH
};

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
/** @type {any} */
let browserRecognition = null;
/** @type {any} */
let pendingBrowserApproval = null;

async function getBrowserMicrophonePermissionState() {
  try {
    if (!navigator.permissions?.query) return 'unsupported';
    const status = await navigator.permissions.query({ name: 'microphone' });
    return String(status?.state || 'unknown');
  } catch {
    return 'unknown';
  }
}

async function detectBrowserMicrophoneDevices() {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return { supported: false, count: 0 };
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter((/** @type {any} */ d) => d?.kind === 'audioinput');
    return { supported: true, count: audioInputs.length };
  } catch {
    return { supported: true, count: 0 };
  }
}

async function ensureBrowserMicrophoneAccess() {
  if (!navigator.mediaDevices?.getUserMedia) return { ok: false, reason: 'GET_USER_MEDIA_UNSUPPORTED' };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((/** @type {any} */ track) => track.stop());
    return { ok: true, reason: 'OK' };
  } catch (/** @type {any} */ err) {
    const code = String(err?.name || err?.message || '').toUpperCase();
    if (code.includes('NOTALLOWED') || code.includes('SECURITY')) return { ok: false, reason: 'MIC_PERMISSION_DENIED' };
    if (code.includes('NOTFOUND') || code.includes('DEVICENOTFOUND')) return { ok: false, reason: 'MIC_DEVICE_NOT_FOUND' };
    if (code.includes('NOTREADABLE') || code.includes('TRACKSTART')) return { ok: false, reason: 'MIC_DEVICE_BUSY' };
    return { ok: false, reason: 'MIC_ACCESS_FAILED' };
  }
}

async function ensureBrowserMicReady() {
  const permission = await getBrowserMicrophonePermissionState();
  if (permission === 'denied') {
    void _i18n('Microphone permission is blocked in browser settings. Enable it and retry.').then((/** @type {any} */ msg) => setStatus(msg, false));
    return false;
  }

  const access = await ensureBrowserMicrophoneAccess();
  if (access.ok || access.reason === 'GET_USER_MEDIA_UNSUPPORTED') return true;

  if (access.reason === 'MIC_PERMISSION_DENIED') {
    void _i18n('Microphone permission denied. Allow access and retry.').then((/** @type {any} */ msg) => setStatus(msg, false));
  } else if (access.reason === 'MIC_DEVICE_NOT_FOUND') {
    void _i18n('No microphone device detected on this system.').then((/** @type {any} */ msg) => setStatus(msg, false));
  } else if (access.reason === 'MIC_DEVICE_BUSY') {
    void _i18n('Microphone is busy in another app. Close it and retry.').then((/** @type {any} */ msg) => setStatus(msg, false));
  } else {
    void _i18n('Could not access microphone. Check permission and device settings.').then((/** @type {any} */ msg) => setStatus(msg, false));
  }
  return false;
}

const BROWSER_SESSIONS_KEY = 'eon:browser:sessions:v1';
const BROWSER_TEMPLATES_KEY = 'eon:browser:templates:v1';
const BROWSER_ACTION_LOG_KEY = 'eon:browser:action-log:v1';
const BROWSER_DOWNLOADS_KEY = 'eon:browser:downloads:v1';
const BROWSER_OPERATOR_STATE_KEY = 'eon:browser:operator-state:v1';
const BROWSER_TAB_CONTEXT_KEY = 'eon:browser:tab-context:v1';
const BROWSER_PROOF_KEY = 'eon:browser:proof-captures:v1';
const MAX_BROWSER_SESSIONS = 40;
const MAX_BROWSER_TEMPLATES = 40;
const MAX_BROWSER_ACTION_LOG = 100;
const MAX_BROWSER_DOWNLOADS = 120;
const MAX_BROWSER_PROOFS = 40;

// ── Action log ─────────────────────────────────────────────────────────────
// Lightweight execution receipt system: every user-visible browser action
// (fetch, AI analysis, compare, session save, template save) is recorded
// here. The log is shown in the browser UI so users can see exactly what
// the system did on their behalf.

/**
 * @param {'fetch'|'ai-analysis'|'compare'|'session-save'|'template-save'|'local-check'|'handoff'|'download'} type
 * @param {string} detail  Human-readable description of the action
 * @param {'low'|'medium'|'high'} [riskLevel]  Risk level of the action
 */
function recordBrowserAction(/** @type {any} */ type, /** @type {any} */ detail, /** @type {any} */ riskLevel = 'low') {
  try {
    const rows = readListStore(BROWSER_ACTION_LOG_KEY);
    rows.push({
      id: crypto.randomUUID(),
      type: String(type || 'unknown'),
      detail: String(detail || '').slice(0, 300),
      riskLevel: String(riskLevel || 'low'),
      ts: Date.now(),
      iso: new Date().toISOString()
    });
    writeListStore(BROWSER_ACTION_LOG_KEY, rows, MAX_BROWSER_ACTION_LOG);
    renderBrowserActionLog();
  } catch {}
}

async function renderBrowserActionLog() {
  const logEl = getEl('browser-action-log');
  if (!logEl) return;
  const rows = readListStore(BROWSER_ACTION_LOG_KEY);
  if (!rows.length) {
    logEl.textContent = await _i18n('No actions recorded yet this session.');
    return;
  }
  safeHTML(logEl, rows.slice().reverse().slice(0, 20)
    .map((/** @type {any} */ row) => {
      const riskClass = row.riskLevel === 'high' ? 'color:#fca5a5' : row.riskLevel === 'medium' ? 'color:#fcd34d' : 'color:#86efac';
      const time = new Date(row.ts).toLocaleTimeString();
      return `<div class="browser-log-entry" style="font-size:0.78rem;padding:2px 0;border-bottom:1px solid #1e293b">` +
        `<span style="${riskClass};font-weight:600">[${escapeHtml(row.type)}]</span> ` +
        `<span style="color:#94a3b8">${escapeHtml(time)}</span> ` +
        `<span>${escapeHtml(row.detail)}</span>` +
        `</div>`;
    }).join(''));
}

function clearBrowserActionLog() {
  try { localStorage.removeItem(BROWSER_ACTION_LOG_KEY); } catch {}
  renderBrowserActionLog();
}

function normalizeBrowserOperatorState(/** @type {any} */ state = 'observing') {
  const allowed = new Set(['observing', 'planning', 'acting', 'waiting', 'approval-needed', 'blocked']);
  const next = String(state || 'observing').trim().toLowerCase();
  return allowed.has(next) ? next : 'observing';
}

function loadBrowserOperatorState() {
  try {
    const raw = JSON.parse(localStorage.getItem(BROWSER_OPERATOR_STATE_KEY) || 'null');
    return raw && typeof raw === 'object' ? {
      state: normalizeBrowserOperatorState(raw.state || 'observing'),
      detail: String(raw.detail || '').trim().slice(0, 240),
      updatedAt: String(raw.updatedAt || '')
    } : { state: 'observing', detail: '', updatedAt: '' };
  } catch {
    return { state: 'observing', detail: '', updatedAt: '' };
  }
}

function saveBrowserOperatorState(/** @type {any} */ value) {
  const normalized = {
    state: normalizeBrowserOperatorState(value?.state || 'observing'),
    detail: String(value?.detail || '').trim().slice(0, 240),
    updatedAt: String(value?.updatedAt || new Date().toISOString())
  };
  try { localStorage.setItem(BROWSER_OPERATOR_STATE_KEY, JSON.stringify(normalized)); } catch {}
  return normalized;
}

function getActiveBrowserTabRecord() {
  try {
    const state = window.EONTabSystem?.state;
    if (!state?.tabs?.length) return null;
    return state.tabs.find((/** @type {any} */ tab) => tab.id === state.activeTabId) || state.tabs[0] || null;
  } catch {
    return null;
  }
}

function loadBrowserTabContexts() {
  try {
    const raw = JSON.parse(localStorage.getItem(BROWSER_TAB_CONTEXT_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function saveBrowserTabContexts(/** @type {any} */ contexts) {
  try {
    localStorage.setItem(BROWSER_TAB_CONTEXT_KEY, JSON.stringify(contexts && typeof contexts === 'object' ? contexts : {}));
  } catch {}
}

function setActiveBrowserTabContext(/** @type {any} */ context = {}) {
  const tab = getActiveBrowserTabRecord();
  if (!tab?.id) return null;
  const contexts = loadBrowserTabContexts();
  const next = {
    mode: String(context.mode || 'browse').trim().slice(0, 40),
    title: String(context.title || tab.title || tab.url || 'Browser task').trim().slice(0, 120),
    detail: String(context.detail || '').trim().slice(0, 240),
    status: String(context.status || 'observing').trim().slice(0, 40),
    url: String(context.url || tab.url || '').trim().slice(0, 180),
    updatedAt: String(context.updatedAt || new Date().toISOString())
  };
  contexts[tab.id] = next;
  saveBrowserTabContexts(contexts);
  renderBrowserOperatorRail();
  return next;
}

function loadBrowserProofSnapshots() {
  try {
    const raw = JSON.parse(localStorage.getItem(BROWSER_PROOF_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveBrowserProofSnapshots(/** @type {any[]} */ rows) {
  try {
    localStorage.setItem(BROWSER_PROOF_KEY, JSON.stringify(Array.isArray(rows) ? rows.slice(-MAX_BROWSER_PROOFS) : []));
  } catch {}
}

function captureBrowserProofSnapshot(/** @type {any} */ reason = 'manual') {
  const tab = getActiveBrowserTabRecord();
  const operator = loadBrowserOperatorState();
  const contexts = loadBrowserTabContexts();
  const missionMemory = summarizeMissionMemory(loadMissionMemory());
  const proof = {
    id: crypto.randomUUID(),
    reason: String(reason || 'manual').trim().slice(0, 80),
    createdAt: new Date().toISOString(),
    url: String(getEl('browser-url')?.value || tab?.url || '').trim(),
    tabId: String(tab?.id || ''),
    tabTitle: String(tab?.title || '').trim(),
    operatorState: operator.state,
    operatorDetail: operator.detail,
    tabContext: tab?.id ? contexts[tab.id] || null : null,
    sourceLength: String(getEl('browser-source')?.value || '').length,
    outputLength: String(getEl('browser-output')?.textContent || '').length,
    latestMissionReceipt: missionMemory.receipts?.[0] || null,
    actions: readListStore(BROWSER_ACTION_LOG_KEY).slice(-12).map((row) => ({
      type: row.type,
      detail: row.detail,
      riskLevel: row.riskLevel,
      iso: row.iso
    }))
  };
  const rows = loadBrowserProofSnapshots();
  rows.unshift(proof);
  saveBrowserProofSnapshots(rows);
  recordBrowserAction('handoff', `Captured browser proof snapshot: ${proof.reason}`, 'low');
  renderBrowserOperatorRail();
  return proof;
}

function clearBrowserProofSnapshots() {
  try { localStorage.removeItem(BROWSER_PROOF_KEY); } catch {}
  renderBrowserOperatorRail();
}

function setBrowserOperatorState(/** @type {any} */ state = 'observing', /** @type {any} */ detail = '') {
  const next = saveBrowserOperatorState({
    state,
    detail,
    updatedAt: new Date().toISOString()
  });
  renderBrowserOperatorRail();
  return next;
}

function renderBrowserOperatorRail() {
  const copyEl = getEl('browser-operator-copy');
  const metaEl = getEl('browser-operator-meta');
  const contextEl = getEl('browser-operator-context');
  const cleanupEl = getEl('browser-operator-cleanup');
  const actionsEl = getEl('browser-operator-actions');
  if (!copyEl || !metaEl || !contextEl || !cleanupEl || !actionsEl) return;

  const operator = loadBrowserOperatorState();
  const tab = getActiveBrowserTabRecord();
  const contexts = loadBrowserTabContexts();
  const context = tab?.id ? contexts[tab.id] || null : null;
  const proofCount = loadBrowserProofSnapshots().length;
  const downloadCount = readBrowserDownloadRows().length;
  const actionCount = readListStore(BROWSER_ACTION_LOG_KEY).length;

  const stateText = {
    observing: 'Observing',
    planning: 'Planning',
    acting: 'Acting',
    waiting: 'Waiting',
    'approval-needed': 'Approval needed',
    blocked: 'Blocked'
  }[operator.state] || 'Observing';

  copyEl.textContent = context
    ? `Current operator state: ${stateText}. ${context.detail || operator.detail || 'The active tab has mission context attached.'}`
    : `Current operator state: ${stateText}. No tab mission context yet.`;

  safeHTML(metaEl, [
    `<span class="browser-state-pill browser-state-${escapeHtml(operator.state)}">${escapeHtml(stateText)}</span>`,
    operator.detail ? `<span>${escapeHtml(operator.detail)}</span>` : '',
    tab?.title ? `<span>Tab: ${escapeHtml(tab.title)}</span>` : '',
    tab?.url ? `<span>${escapeHtml(tab.url)}</span>` : '',
    `<span>${proofCount} proof snapshot${proofCount === 1 ? '' : 's'}</span>`,
    `<span>${actionCount} action log entry${actionCount === 1 ? '' : 'ies'}</span>`
  ].filter(Boolean).join(''), 'ui');

  safeHTML(contextEl, context
    ? [
        `<li><strong>${escapeHtml(context.title || 'Current mission')}</strong><span>${escapeHtml(context.mode || 'browse')} · ${escapeHtml(context.detail || 'No extra detail')}${context.url ? ` · ${escapeHtml(context.url)}` : ''}</span></li>`,
        context.updatedAt ? `<li><strong>Updated</strong><span>${new Date(context.updatedAt).toLocaleString()}</span></li>` : '',
        operator.detail ? `<li><strong>Operator note</strong><span>${escapeHtml(operator.detail)}</span></li>` : ''
      ].filter(Boolean).join('')
    : '<li><strong>No tab mission context yet.</strong><span>Browse, summarize, or compare a page to create a visible operator context for this tab.</span></li>');

  cleanupEl.innerHTML = `
    <div class="browser-cleanup-summary">
      <strong>Cleanup center</strong>
      <span>${downloadCount} download${downloadCount === 1 ? '' : 's'}</span>
      <span>${proofCount} proof snapshot${proofCount === 1 ? '' : 's'}</span>
      <span>Clear temp media and proofs when you want the cockpit tidy.</span>
    </div>
    <div class="browser-cleanup-actions">
      <button class="btn btn-outline btn-sm" type="button" id="browser-cleanup-open-downloads">Open downloads</button>
      <button class="btn btn-outline btn-sm" type="button" id="browser-cleanup-clear-downloads">Clear downloads</button>
      <button class="btn btn-outline btn-sm" type="button" id="browser-cleanup-clear-proofs">Clear proofs</button>
    </div>
  `;
  cleanupEl.querySelector('#browser-cleanup-open-downloads')?.addEventListener('click', () => {
    const details = document.querySelector('details.browser-details');
    if (details && 'open' in details) {
      /** @type {HTMLDetailsElement} */ (details).open = true;
    }
    getEl('browser-download-summary')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    setStatus('Opened the browser download manager.', true);
  });
  cleanupEl.querySelector('#browser-cleanup-clear-downloads')?.addEventListener('click', () => {
    clearBrowserDownloads();
    setStatus('Browser downloads cleared.', true);
  });
  cleanupEl.querySelector('#browser-cleanup-clear-proofs')?.addEventListener('click', () => {
    clearBrowserProofSnapshots();
    setStatus('Browser proof snapshots cleared.', true);
  });

  const latestProof = loadBrowserProofSnapshots()[0] || null;
  actionsEl.innerHTML = `
    <button class="btn btn-primary btn-sm" type="button" id="browser-proof-capture">Capture proof snapshot</button>
    <button class="btn btn-outline btn-sm" type="button" id="browser-proof-clear">Clear proof snapshots</button>
    ${latestProof ? `<button class="btn btn-outline btn-sm" type="button" id="browser-proof-copy">Copy latest proof</button>` : ''}
  `;

  actionsEl.querySelector('#browser-proof-capture')?.addEventListener('click', () => {
    captureBrowserProofSnapshot('manual sidebar capture');
    setStatus('Browser proof snapshot captured.', true);
  });
  actionsEl.querySelector('#browser-proof-clear')?.addEventListener('click', () => {
    clearBrowserProofSnapshots();
    setStatus('Browser proof snapshots cleared.', true);
  });
  actionsEl.querySelector('#browser-proof-copy')?.addEventListener('click', async () => {
    if (!latestProof) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(latestProof, null, 2));
      setStatus('Latest browser proof copied.', true);
    } catch {
      setStatus('Could not copy browser proof.', false);
    }
  });
}

function normalizeBrowserDownloadEntry(/** @type {any} */ entry = {}) {
  const filename = String(entry.filename || entry.name || '').trim().slice(0, 180);
  const url = String(entry.url || '').trim();
  const kind = String(entry.kind || (url.startsWith('blob:') ? 'blob' : url.startsWith('data:') ? 'data' : 'file')).trim().slice(0, 32) || 'file';
  const source = String(entry.source || 'browser-shell').trim().slice(0, 80) || 'browser-shell';
  const title = String(entry.title || entry.label || filename || url || 'Download').trim().slice(0, 180) || 'Download';
  const size = Number(entry.size || 0);
  return {
    id: String(entry.id || crypto.randomUUID()),
    filename: filename || title,
    title,
    url,
    kind,
    source,
    size: Number.isFinite(size) && size > 0 ? Math.round(size) : 0,
    mimeType: String(entry.mimeType || entry.type || '').trim().slice(0, 80),
    tabId: String(entry.tabId || '').trim().slice(0, 80),
    createdAt: String(entry.createdAt || new Date().toISOString()),
    note: String(entry.note || '').trim().slice(0, 240)
  };
}

function readBrowserDownloadRows() {
  try {
    const rows = JSON.parse(localStorage.getItem(BROWSER_DOWNLOADS_KEY) || '[]');
    return Array.isArray(rows) ? rows.map((row) => normalizeBrowserDownloadEntry(row)).filter((row) => row.filename || row.url) : [];
  } catch {
    return [];
  }
}

/**
 * @param {any[]} rows
 */
function writeBrowserDownloadRows(rows) {
  try {
    localStorage.setItem(BROWSER_DOWNLOADS_KEY, JSON.stringify(Array.isArray(rows) ? rows.slice(-MAX_BROWSER_DOWNLOADS).map((row) => normalizeBrowserDownloadEntry(row)) : []));
  } catch {}
}

function formatBrowserDownloadSize(size = 0) {
  const bytes = Number(size) || 0;
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * @param {any} entry
 */
function recordBrowserDownload(entry = {}) {
  const normalized = normalizeBrowserDownloadEntry(entry);
  if (!normalized.filename && !normalized.url) return { ok: false, rows: readBrowserDownloadRows(), entry: null };
  const rows = readBrowserDownloadRows();
  const next = rows.filter((row) => row.id !== normalized.id && !(normalized.url && row.url === normalized.url && row.filename === normalized.filename));
  next.push(normalized);
  writeBrowserDownloadRows(next);
  renderBrowserDownloadManager();
  recordBrowserAction('download', `${normalized.filename}${normalized.source ? ` · ${normalized.source}` : ''}`, 'low');
  return { ok: true, rows: next, entry: normalized };
}

/**
 * @param {any} downloadId
 */
function removeBrowserDownload(downloadId = '') {
  const id = String(downloadId || '').trim();
  if (!id) return readBrowserDownloadRows();
  const rows = readBrowserDownloadRows();
  const removed = rows.find((row) => row.id === id) || null;
  if (removed?.url?.startsWith('blob:')) {
    try { URL.revokeObjectURL(removed.url); } catch {}
  }
  const next = rows.filter((row) => row.id !== id);
  writeBrowserDownloadRows(next);
  renderBrowserDownloadManager();
  return next;
}

function clearBrowserDownloads() {
  const rows = readBrowserDownloadRows();
  rows.forEach((row) => {
    if (row.url?.startsWith('blob:')) {
      try { URL.revokeObjectURL(row.url); } catch {}
    }
  });
  try { localStorage.removeItem(BROWSER_DOWNLOADS_KEY); } catch {}
  renderBrowserDownloadManager();
}

function renderBrowserDownloadManager() {
  const listEl = getEl('browser-download-list');
  const summaryEl = getEl('browser-download-summary');
  if (!listEl || !summaryEl) return;
  const rows = readBrowserDownloadRows().slice().reverse();
  if (!rows.length) {
    summaryEl.textContent = 'No downloads recorded yet.';
    safeHTML(listEl, '<p class="browser-download-empty">No downloads yet. Export a file from Cockpit workspaces, Vault, or EONBOT and it will appear here.</p>', 'ui');
    return;
  }
  const totalBytes = rows.reduce((sum, row) => sum + (Number(row.size) || 0), 0);
  summaryEl.textContent = `${rows.length} download${rows.length === 1 ? '' : 's'} · ${formatBrowserDownloadSize(totalBytes) || 'size unknown'} total · local-first history`;
  listEl.innerHTML = rows.map((row) => {
    const stamp = row.createdAt ? new Date(row.createdAt).toLocaleString() : '';
    const sizeLabel = formatBrowserDownloadSize(row.size);
    const canOpen = Boolean(row.url && !row.url.startsWith('data:'));
    return `
      <div class="browser-download-row" data-download-id="${escapeHtml(row.id)}">
        <div class="browser-download-row-main">
          <div class="browser-download-row-title">${escapeHtml(row.filename || row.title || 'Download')}</div>
          <div class="browser-download-row-meta">
            <span>${escapeHtml(row.kind || 'file')}</span>
            <span>${escapeHtml(row.source || 'browser-shell')}</span>
            ${sizeLabel ? `<span>${escapeHtml(sizeLabel)}</span>` : ''}
            ${stamp ? `<span>${escapeHtml(stamp)}</span>` : ''}
          </div>
          ${row.note ? `<div class="browser-download-row-note">${escapeHtml(row.note)}</div>` : ''}
        </div>
        <div class="browser-download-row-actions">
          ${canOpen ? `<button class="btn btn-outline btn-sm" type="button" data-download-open="${escapeHtml(row.id)}">Open</button>` : ''}
          ${row.url ? `<button class="btn btn-outline btn-sm" type="button" data-download-copy="${escapeHtml(row.id)}">Copy URL</button>` : ''}
          ${row.url?.startsWith('blob:') ? `<button class="btn btn-outline btn-sm" type="button" data-download-clean="${escapeHtml(row.id)}">Cleanup</button>` : ''}
          <button class="btn btn-outline btn-sm" type="button" data-download-remove="${escapeHtml(row.id)}">Remove</button>
        </div>
      </div>
    `;
  }).join('');
  listEl.querySelectorAll('[data-download-open]').forEach((/** @type {any} */ btn) => {
    btn.addEventListener('click', () => {
      const id = /** @type {HTMLElement} */ (btn).getAttribute('data-download-open') || '';
      const row = readBrowserDownloadRows().find((item) => item.id === id);
      if (!row?.url) return;
      window.open(row.url, '_blank', 'noopener,noreferrer');
    });
  });
  listEl.querySelectorAll('[data-download-copy]').forEach((/** @type {any} */ btn) => {
    btn.addEventListener('click', async () => {
      const id = /** @type {HTMLElement} */ (btn).getAttribute('data-download-copy') || '';
      const row = readBrowserDownloadRows().find((item) => item.id === id);
      if (!row?.url) return;
      try {
        await navigator.clipboard.writeText(row.url);
        setStatus('Download URL copied.', true);
      } catch {
        setStatus('Could not copy download URL.', false);
      }
    });
  });
  listEl.querySelectorAll('[data-download-clean]').forEach((/** @type {any} */ btn) => {
    btn.addEventListener('click', () => {
      const id = /** @type {HTMLElement} */ (btn).getAttribute('data-download-clean') || '';
      removeBrowserDownload(id);
      setStatus('Temporary download cleaned up.', true);
    });
  });
  listEl.querySelectorAll('[data-download-remove]').forEach((/** @type {any} */ btn) => {
    btn.addEventListener('click', () => {
      const id = /** @type {HTMLElement} */ (btn).getAttribute('data-download-remove') || '';
      removeBrowserDownload(id);
      setStatus('Download record removed.', true);
    });
  });
}

function bridgeFrameDownloads(/** @type {HTMLIFrameElement | null} */ frame) {
  if (!frame) return;
  let win = null;
  try { win = frame.contentWindow; } catch { win = null; }
  if (!win) return;
  try {
    if (win.location.origin !== window.location.origin) return;
  } catch {
    return;
  }
  try {
    if (win.__eonDownloadBridgeInstalled) return;
    win.__eonDownloadBridgeInstalled = true;
    const recordFromFrame = (/** @type {any} */ anchor, /** @type {string} */ trigger = 'click') => {
      try {
        const href = String(anchor?.href || '').trim();
        const downloadAttr = String(anchor?.download || '').trim();
        if (!downloadAttr && !href.startsWith('blob:') && !href.startsWith('data:')) return;
        recordBrowserDownload({
          filename: downloadAttr || href.split('/').pop() || 'download',
          url: href,
          kind: href.startsWith('blob:') ? 'blob' : href.startsWith('data:') ? 'data' : 'file',
          source: `frame:${frame.dataset.tabId || 'tab'}`,
          tabId: frame.dataset.tabId || '',
          note: `Captured via ${trigger} bridge`
        });
      } catch {}
    };
    const doc = win.document;
    doc.addEventListener('click', (event) => {
      const target = /** @type {HTMLElement | null} */ (event.target);
      const anchor = target?.closest?.('a');
      if (anchor) recordFromFrame(anchor, 'click');
    }, true);
    const proto = win.HTMLAnchorElement?.prototype;
    const origClick = proto?.click;
    if (proto && typeof origClick === 'function' && !win.__eonDownloadClickPatched) {
      win.__eonDownloadClickPatched = true;
      proto.click = function patchedDownloadClick() {
        try { recordFromFrame(this, 'programmatic'); } catch {}
        return origClick.apply(this, arguments);
      };
    }
  } catch {}
}

window.addEventListener('message', (event) => {
  const payload = /** @type {any} */ (event.data);
  if (!payload || payload.type !== 'eon:browser-download') return;
  if (event.origin && event.origin !== window.location.origin) return;
  recordBrowserDownload(payload.download || payload.entry || payload);
});

function getEl(/** @type {any} */ id) {
  return /** @type {any} */ (document.getElementById(id));
}

function readListStore(/** @type {any} */ key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeListStore(/** @type {any} */ key, /** @type {any} */ rows, /** @type {any} */ maxRows) {
  const clipped = Array.isArray(rows) ? rows.slice(-maxRows) : [];
  try {
    localStorage.setItem(key, JSON.stringify(clipped));
  } catch {}
  return clipped;
}

function downloadJsonFile(/** @type {any} */ filename, /** @type {any} */ data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const /** @type {any} */
anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  recordBrowserDownload({
    filename,
    url,
    kind: 'blob',
    source: 'browser-shell',
    mimeType: 'application/json',
    size: blob.size,
    note: 'Browser shell export'
  });
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function parseImportedJson(/** @type {any} */ file, /** @type {any} */ onLoaded) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || '[]'));
      onLoaded(data);
    } catch {
      setStatus('Import failed: invalid JSON file.', false);
    }
  };
  reader.readAsText(file);
}

function tokenizeCompareText(/** @type {any} */ text = '') {
  return new Set(
    String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((/** @type {any} */ token) => token.length >= 4)
      .slice(0, 1200)
  );
}

function countCompareTokens(/** @type {any} */ text = '') {
  const /** @type {any} */
counts = new Map();
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((/** @type {any} */ token) => token.length >= 4)
    .forEach((/** @type {any} */ token) => {
      counts.set(token, (counts.get(token) || 0) + 1);
    });
  return counts;
}

function topTokensFromCounts(/** @type {any} */ counts, /** @type {any} */ limit = 5, /** @type {any} */ blocked = new Set()) {
  return [...counts.entries()]
    .filter((/** @type {any} */ [token]) => !blocked.has(token))
    .sort((/** @type {any} */ a, /** @type {any} */ b) => b[1] - a[1])
    .slice(0, limit)
    .map((/** @type {any} */ [token]) => token);
}

function buildCompareSnippet(/** @type {any} */ text = '', /** @type {any} */ maxLen = 170) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'No readable content fetched for this URL.';
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen)}...` : cleaned;
}

function escHtml(/** @type {any} */ value = '') {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderCompareMetrics(/** @type {any} */ urlEntries) {
  const box = getEl('browser-compare-metrics');
  if (!box) return;
  if (!Array.isArray(urlEntries) || urlEntries.length < 2) {
    box.textContent = '';
    return;
  }

  const /** @type {any} */
lines = [];
  lines.push('Compare snapshot:');
  urlEntries.forEach((/** @type {any} */ entry) => {
    lines.push(`- ${entry.url} | chars=${entry.text.length} | words=${entry.text.split(/\s+/).filter(Boolean).length}`);
  });

  lines.push('');
  lines.push('Similarity (token overlap):');
  for (let i = 0; i < urlEntries.length; i += 1) {
    for (let j = i + 1; j < urlEntries.length; j += 1) {
      const a = tokenizeCompareText(urlEntries[i].text);
      const b = tokenizeCompareText(urlEntries[j].text);
      const /** @type {any} */
union = new Set([...a, ...b]);
      let intersection = 0;
      a.forEach((/** @type {any} */ token) => {
        if (b.has(token)) intersection += 1;
      });
      const score = union.size ? Math.round((intersection / union.size) * 100) : 0;
      lines.push(`- ${i + 1} vs ${j + 1}: ${score}%`);
    }
  }

  box.textContent = lines.join('\n');
}

function renderCompareVisual(/** @type {any} */ urlEntries) {
  const box = getEl('browser-compare-visual');
  if (!box) return;
  if (!Array.isArray(urlEntries) || urlEntries.length < 2) {
    box.innerHTML = '';
    return;
  }

  const countsByEntry = urlEntries.map((/** @type {any} */ entry) => countCompareTokens(entry.text));
  const /** @type {any} */
allTokens = new Map();
  countsByEntry.forEach((/** @type {any} */ counts) => {
    counts.forEach((/** @type {any} */ count, /** @type {any} */ token) => {
      allTokens.set(token, (allTokens.get(token) || 0) + count);
    });
  });
  const /** @type {any} */
commonTokens = new Set(
    [...allTokens.entries()]
      .sort((/** @type {any} */ a, /** @type {any} */ b) => b[1] - a[1])
      .slice(0, 20)
      .map((/** @type {any} */ [token]) => token)
  );

  const cards = urlEntries.map((/** @type {any} */ entry, /** @type {any} */ idx) => {
    const tokens = topTokensFromCounts(countsByEntry[idx], 5, commonTokens);
    const words = String(entry.text || '').split(/\s+/).filter(Boolean).length;
    return `
      <article class="browser-compare-card">
        <h4>${escHtml(entry.url)}</h4>
        <div class="browser-compare-stat">Chars: ${entry.text.length} · Words: ${words}</div>
        <div class="browser-compare-snippet">${escHtml(buildCompareSnippet(entry.text))}</div>
        <div class="browser-compare-tags">${tokens.length ? tokens.map((/** @type {any} */ token) => `<span>${escHtml(token)}</span>`).join('') : '<span>no high-signal tokens</span>'}</div>
      </article>`;
  }).join('');

  const /** @type {any} */
diffs = [];
  for (let i = 0; i < urlEntries.length; i += 1) {
    for (let j = i + 1; j < urlEntries.length; j += 1) {
      const a = tokenizeCompareText(urlEntries[i].text);
      const b = tokenizeCompareText(urlEntries[j].text);
      const onlyA = [...a].filter((/** @type {any} */ token) => !b.has(token)).slice(0, 4);
      const onlyB = [...b].filter((/** @type {any} */ token) => !a.has(token)).slice(0, 4);
      diffs.push(`Pair ${i + 1} vs ${j + 1} | only ${i + 1}: ${onlyA.join(', ') || 'none'} | only ${j + 1}: ${onlyB.join(', ') || 'none'}`);
    }
  }

  box.innerHTML = `
    <div class="browser-compare-grid">${cards}</div>
    <div class="browser-compare-diffs">${escHtml(diffs.join('\n'))}</div>`;
}

async function _i18n(/** @type {any} */ text, /** @type {any} */ category = 'guide') {
  try {
    return await translateForUser(String(text || ''), { fromLang: 'en', category });
  } catch {
    return String(text || '');
  }
}

function _resolveSpeechLocale() {
  const code = String(getCurrentLanguage() || 'en').toLowerCase();
  const /** @type {any} */
map = {
    en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-PT', it: 'it-IT',
    nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR', ar: 'ar-SA',
    hi: 'hi-IN', tr: 'tr-TR', pl: 'pl-PL', sv: 'sv-SE', da: 'da-DK', fi: 'fi-FI',
    no: 'nb-NO', he: 'he-IL', bn: 'bn-BD', ur: 'ur-PK', ta: 'ta-IN', te: 'te-IN',
    vi: 'vi-VN', th: 'th-TH', id: 'id-ID', uk: 'uk-UA', cs: 'cs-CZ', ro: 'ro-RO'
  };
  return map[code] || (navigator.language || 'en-US');
}

function normalizeUrl(/** @type {any} */ value = '') {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^https?:\/\//i.test(text)) return text;
  if (text.startsWith('/') || text.startsWith('./') || text.startsWith('../')) return text;
  if (text.startsWith('about:') || text.startsWith('blob:') || text.startsWith('data:') || text.startsWith('file:')) return text;
  return `https://${text}`;
}

function stripHtml(/** @type {any} */ html = '') {
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(String(html || ''), 'text/html');
  return (doc.body?.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function setStatus(/** @type {any} */ message, /** @type {any} */ ok = true) {
  const el = getEl('browser-status');
  if (!el) return;
  el.textContent = message;
  el.style.color = ok ? '#cbd5e1' : '#fca5a5';
}


function getBrowserTrustPolicyCopy() {
  return {
    auto: 'EONBOT can auto-run read and some draft actions after review. Submit and sensitive actions always require explicit approval.',
    memory: 'Read and draft approvals can be remembered briefly per host. Submit and sensitive actions are never remembered.',
    warning: 'Treat third-party pages, prompts, and login forms as untrusted until you review them yourself.'
  };
}

function setOutput(/** @type {any} */ text) {
  const el = getEl('browser-output');
  if (!el) return;
  el.textContent = text;
}


async function renderBrowserApprovalRail(/** @type {any} */ approval) {
  const card = getEl('browser-approval-card');
  const copy = getEl('browser-approval-copy');
  const meta = getEl('browser-approval-meta');
  const approveBtn = getEl('browser-approval-approve');
  const cancelBtn = getEl('browser-approval-cancel');
  const noteEl = getEl('browser-approval-note');
  const warningsEl = getEl('browser-approval-warnings');
  const scopeEl = getEl('browser-approval-scope');
  const confirmWrap = getEl('browser-approval-confirm-wrap');
  const confirmInput = getEl('browser-approval-confirm');
  const confirmText = getEl('browser-approval-confirm-text');
  const rememberWrap = getEl('browser-approval-remember-wrap');
  const rememberInput = getEl('browser-approval-remember');
  const rememberText = getEl('browser-approval-remember-text');
  const forgetBtn = getEl('browser-approval-forget');
  if (!card || !copy || !meta) return;

  if (!approval) {
    card.hidden = true;
    pendingBrowserApproval = null;
    return;
  }

  card.hidden = false;
  const actionMeta = getActionTrustMeta(approval.actionClass || (approval.riskLevel === 'high' ? 'sensitive' : approval.riskLevel === 'medium' ? 'draft' : 'read'));
  const needsExplicit = approval.actionClass === 'submit' || approval.actionClass === 'sensitive' || approval.riskLevel === 'high';
  const remembered = approval.host ? getRememberedBrowserPermission({ host: approval.host, actionClass: approval.actionClass || 'read' }) : null;
  copy.textContent = approval.title || await _i18n('Approve a browser action');
  meta.innerHTML = [
    approval.riskLevel ? `<span>${escapeHtml(await _i18n('Risk'))}: ${escapeHtml(String(approval.riskLevel).toUpperCase())}</span>` : '',
    actionMeta?.label ? `<span>${escapeHtml(await _i18n('Class'))}: ${escapeHtml(actionMeta.label)}</span>` : '',
    approval.host ? `<span>${escapeHtml(await _i18n('Host'))}: ${escapeHtml(approval.host)}</span>` : '',
    approval.summary ? `<span>${escapeHtml(approval.summary)}</span>` : '',
    approval.url ? `<span>${escapeHtml(approval.url)}</span>` : ''
  ].filter(Boolean).join('');
  if (noteEl) {
    noteEl.hidden = false;
    noteEl.textContent = await _i18n(
      needsExplicit
        ? 'This action changes external state or touches a sensitive surface. Review it before EONBOT continues.'
        : getBrowserTrustPolicyCopy().auto
    );
  }
  if (warningsEl) {
    const warnings = Array.isArray(approval.warnings) ? approval.warnings.filter(Boolean) : [];
    warningsEl.hidden = !warnings.length;
    warningsEl.innerHTML = warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  }
  if (scopeEl) {
    scopeEl.hidden = false;
    scopeEl.textContent = await _i18n(
      approval.host
        ? `Approval scope: ${approval.host}. ${getBrowserTrustPolicyCopy().memory}`
        : getBrowserTrustPolicyCopy().warning
    );
  }
  if (confirmWrap && confirmInput && confirmText) {
    confirmWrap.hidden = !needsExplicit;
    confirmInput.checked = !needsExplicit;
    confirmText.textContent = await _i18n(
      approval.actionClass === 'sensitive'
        ? 'I reviewed this sensitive browser action and want EONBOT to continue.'
        : 'I reviewed this browser action and want EONBOT to continue.'
    );
  }
  if (rememberWrap && rememberInput && rememberText) {
    const memoryEligible = Boolean(approval.memoryEligible && approval.host && !needsExplicit);
    rememberWrap.hidden = !memoryEligible;
    rememberInput.checked = false;
    rememberText.textContent = await _i18n(
      remembered
        ? `A temporary approval is already saved for ${approval.host}. You can refresh it by approving again.`
        : `Remember this read/draft approval briefly for ${approval.host}.`
    );
  }
  const nextApprove = approveBtn?.cloneNode(true);
  const nextCancel = cancelBtn?.cloneNode(true);
  const nextForget = forgetBtn?.cloneNode(true);
  approveBtn?.replaceWith(nextApprove);
  cancelBtn?.replaceWith(nextCancel);
  forgetBtn?.replaceWith(nextForget);
  const liveApproveBtn = getEl('browser-approval-approve');
  const liveCancelBtn = getEl('browser-approval-cancel');
  const liveForgetBtn = getEl('browser-approval-forget');
  if (liveApproveBtn) {
    liveApproveBtn.textContent = needsExplicit ? await _i18n('Approve after review') : await _i18n('Run now');
    liveApproveBtn.disabled = needsExplicit;
  }
  if (liveCancelBtn) liveCancelBtn.textContent = await _i18n('Cancel');
  if (liveForgetBtn) {
    liveForgetBtn.hidden = !approval.host;
    liveForgetBtn.textContent = await _i18n('Forget saved approvals');
  }
  if (confirmInput && liveApproveBtn) {
    confirmInput.onchange = () => {
      liveApproveBtn.disabled = !confirmInput.checked;
    };
  }
  liveApproveBtn?.addEventListener('click', approvePendingBrowserApproval);
  liveCancelBtn?.addEventListener('click', cancelPendingBrowserApproval);
  liveForgetBtn?.addEventListener('click', () => {
    if (approval.host) {
      forgetBrowserPermission({ host: approval.host });
      void _i18n(`Saved browser approvals cleared for ${approval.host}.`).then((msg) => setStatus(msg, true));
      renderBrowserOperatorRail();
      renderBrowserApprovalRail(approval);
    }
  });
}


async function approvePendingBrowserApproval() {
  const approval = pendingBrowserApproval;
  if (!approval) return;
  pendingBrowserApproval = null;
  await renderBrowserApprovalRail(null);
  const rememberInput = /** @type {HTMLInputElement | null} */ (getEl('browser-approval-remember'));
  const shouldRemember = Boolean(rememberInput?.checked && approval.memoryEligible && approval.host && !approval.requiresApproval && approval.actionClass !== 'submit' && approval.actionClass !== 'sensitive');
  setBrowserOperatorState('acting', approval.title || approval.summary || 'Approved browser action');
  void _i18n(`Approved: ${approval.title || 'browser action'}`).then((msg) => setStatus(msg, true));
  recordBrowserAction('handoff', `Approved browser task: ${approval.title || approval.summary || 'pending action'}`, approval.riskLevel || 'medium');
  try {
    if (shouldRemember) {
      rememberBrowserPermission({
        host: approval.host,
        actionClass: approval.actionClass || 'read',
        title: approval.title || approval.summary || ''
      });
      recordBrowserAction('handoff', `Saved temporary approval for ${approval.host} (${approval.actionClass || 'read'})`, 'low');
    }
    await approval.run?.();
    renderBrowserOperatorRail();
  } catch (error) {
    setOutput(`Approval execution failed: ${/** @type {Error} */ (error).message || 'Unknown error'}`);
    void _i18n('Approved browser action failed.').then((msg) => setStatus(msg, false));
    setBrowserOperatorState('blocked', `Approved browser action failed: ${/** @type {Error} */ (error).message || 'Unknown error'}`);
  }
}

function cancelPendingBrowserApproval() {
  const approval = pendingBrowserApproval;
  pendingBrowserApproval = null;
  renderBrowserApprovalRail(null);
  if (approval) {
    recordBrowserAction('handoff', `Cancelled browser task: ${approval.title || approval.summary || 'pending action'}`, 'low');
  }
  setBrowserOperatorState('observing', 'Pending browser action cancelled');
  void _i18n('Pending browser action cancelled.').then((msg) => setStatus(msg, true));
}


function queueBrowserApproval(/** @type {any} */ approval) {
  pendingBrowserApproval = approval;
  void renderBrowserApprovalRail(approval);
  setBrowserOperatorState('approval-needed', approval?.title || approval?.summary || 'Browser approval required');
  void _i18n(approval?.prompt || 'Browser approval required.').then((msg) => setStatus(msg, false));
  recordBrowserAction('handoff', `Approval queued: ${approval?.title || approval?.summary || 'browser action'}`, approval?.riskLevel || 'medium');
}

async function runBrowserActionWithSafety(/** @type {any} */ approval, /** @type {() => Promise<void> | void} */ run) {
  if (!approval) return false;
  const remembered = approval.memoryEligible && approval.host
    ? getRememberedBrowserPermission({ host: approval.host, actionClass: approval.actionClass || 'read' })
    : null;
  if (approval.requiresApproval && !remembered) {
    queueBrowserApproval({
      title: approval.title,
      summary: approval.summary,
      riskLevel: approval.riskLevel,
      actionClass: approval.actionClass,
      url: approval.url,
      host: approval.host,
      trustedHost: approval.trustedHost,
      warnings: approval.warnings,
      memoryEligible: approval.memoryEligible,
      prompt: approval.reason || approval.prompt || 'Browser approval required',
      run
    });
    return false;
  }
  if (remembered) {
    const trustMeta = getActionTrustMeta(approval.actionClass || 'read');
    recordBrowserAction('handoff', `Auto-approved browser task via saved ${approval.actionClass || 'read'} permission for ${approval.host}`, trustMeta?.riskLevel || 'low');
    setBrowserOperatorState('acting', `Running remembered ${approval.actionClass || 'read'} action for ${approval.host}`);
    void _i18n(`Running with remembered approval for ${approval.host}.`).then((msg) => setStatus(msg, true));
  }
  await run();
  return true;
}

async function renderBrowserRecoveryRail(/** @type {any} */ readiness) {
  const copyEl = getEl('browser-recovery-copy');
  const actionsEl = getEl('browser-recovery-actions');
  if (!copyEl || !actionsEl) return;

  const actions = readiness?.ready
    ? [
        { label: await _i18n('Open WorkBench Browse'), href: '/build?mode=browse', kind: 'primary' },
        { label: await _i18n('Open Create'), href: '/create', kind: 'outline' },
        { label: await _i18n('Open EONBOT AI'), href: '/chat.html', kind: 'outline' },
        { label: await _i18n('Open key setup'), href: CANONICAL_AI_KEYS_PATH, kind: 'outline' }
      ]
    : [
        { label: await _i18n('Start onboarding'), href: CANONICAL_AI_SETUP_PATH, kind: 'primary' },
        { label: await _i18n('Open key setup'), href: CANONICAL_AI_KEYS_PATH, kind: 'outline' },
        { label: await _i18n('Open Create'), href: '/create', kind: 'outline' },
        { label: await _i18n('Open EONBOT AI'), href: '/chat.html', kind: 'outline' }
      ];

  copyEl.textContent = readiness?.ready
    ? `${readiness?.detail || 'AI is ready'} · ${readiness?.trustSummary || ''} ${readiness?.modeGuidance || ''} ${getBrowserTrustPolicyCopy().auto} ${getBrowserTrustPolicyCopy().warning}`
    : `${readiness?.bannerBody || 'AI setup is still needed.'} ${readiness?.trustSummary || ''} ${readiness?.modeGuidance || ''} ${getBrowserTrustPolicyCopy().auto} ${getBrowserTrustPolicyCopy().warning}`;

  actionsEl.innerHTML = actions.map((action) => `
    <a class="btn ${action.kind === 'primary' ? 'btn-primary' : 'btn-outline'} btn-sm" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>
  `).join('');
}

function renderBrowserIdentityRail() {
  const copyEl = getEl('browser-identity-copy');
  const metaEl = getEl('browser-identity-meta');
  const listEl = getEl('browser-identity-attachments');
  const workspacesEl = getEl('browser-identity-workspaces');
  const actionsEl = getEl('browser-identity-actions');
  if (!copyEl || !metaEl || !listEl || !workspacesEl || !actionsEl) return;

  const summary = getDecentralIdentitySummary(getProfile());
  const portable = getPortableEntitlementSummary(getProfile());
  const receiptTrust = getPortableEntitlementVerificationSummary(getProfile());
  const uidShort = String(summary.uid || '').slice(0, 8);
  copyEl.textContent = summary.isRecoverable
    ? `${summary.alias} is ${summary.recoveryLabel.toLowerCase()}. This browser can use attached accounts, but the root identity stays user-owned and recoverable.`
    : `${summary.alias} is still local-only. Export your vault to make recovery survive browser clear and device change.`;

  safeHTML(metaEl, [
    `<span>UID: ${escapeHtml(uidShort)}</span>`,
    `<span>Recovery: ${escapeHtml(summary.recoveryLabel)}</span>`,
    `<span>${summary.browserAttachmentCount} attachment${summary.browserAttachmentCount === 1 ? '' : 's'}</span>`,
    `<span>${summary.browserWorkspaceProfileCount || 0} workspace profile${(summary.browserWorkspaceProfileCount || 0) === 1 ? '' : 's'}</span>`,
    `<span>${portable.receiptStatusLabel}</span>`,
    `<span>${escapeHtml(receiptTrust.verificationLabel)}</span>`,
    `<span>${escapeHtml(receiptTrust.operatorLabel)}</span>`
  ].join(''));

  listEl.innerHTML = summary.browserAttachments.length
    ? summary.browserAttachments.slice(0, 5).map((/** @type {any} */ item) => {
      const lastUsed = item.lastUsedAt ? ` · used ${new Date(item.lastUsedAt).toLocaleDateString()}` : '';
      const email = item.email ? ` · ${escapeHtml(item.email)}` : '';
      return `<li><strong>${escapeHtml(item.label || item.provider)}</strong><span>${escapeHtml(item.provider)}${email}${escapeHtml(lastUsed)}</span></li>`;
    }).join('')
    : '<li><strong>No browser attachments yet</strong><span>Connect Google, GitHub, X, LinkedIn, or Facebook when you want browser handoff and quick login support.</span></li>';

  const workspaceProfiles = getBrowserWorkspaceProfiles();
  workspacesEl.innerHTML = `
    <div class="workspace-head">
      <strong>Account workspace profiles</strong>
      <span>${workspaceProfiles.length} saved profile${workspaceProfiles.length === 1 ? '' : 's'}</span>
    </div>
    <div class="workspace-row">
      <input class="workspace-input" id="browser-workspace-name" type="text" maxlength="72" placeholder="Save as: Client A / Sales / Creator" />
      <input class="workspace-input" id="browser-workspace-notes" type="text" maxlength="180" placeholder="Optional note" />
    </div>
    <div class="workspace-row">
      <select class="workspace-select" id="browser-workspace-select" aria-label="Workspace profiles">
        <option value="">Choose a saved workspace</option>
        ${workspaceProfiles.map((profile) => `
          <option value="${escapeHtml(profile.id)}">${escapeHtml(profile.label)}${profile.attachmentCount ? ` · ${profile.attachmentCount} attachments` : ''}</option>
        `).join('')}
      </select>
    </div>
    <div class="workspace-row">
      <button class="btn btn-primary btn-sm" type="button" id="browser-workspace-save">Save current attachments</button>
      <button class="btn btn-outline btn-sm" type="button" id="browser-workspace-apply">Apply selected</button>
      <button class="btn btn-outline btn-sm" type="button" id="browser-workspace-delete">Delete selected</button>
    </div>
    <div class="workspace-note">These profiles stay local and simply snapshot your browser attachments so you can switch between business workspaces without re-attaching every account.</div>
  `;
  workspacesEl.querySelector('#browser-workspace-save')?.addEventListener('click', () => {
    const name = String(getEl('browser-workspace-name')?.value || '').trim();
    const notes = String(getEl('browser-workspace-notes')?.value || '').trim();
    const saved = upsertCurrentBrowserWorkspaceProfile(name, notes);
    setStatus(`Saved ${saved?.[0]?.label || 'workspace profile'}.`, true);
    renderBrowserIdentityRail();
  });
  workspacesEl.querySelector('#browser-workspace-apply')?.addEventListener('click', () => {
    const select = /** @type {HTMLSelectElement | null} */ (getEl('browser-workspace-select'));
    const id = String(select?.value || '').trim();
    if (!id) {
      setStatus('Choose a workspace profile first.', false);
      return;
    }
    applyBrowserWorkspaceProfile(id);
    setBrowserOperatorState('observing', `Applied browser workspace profile: ${id}`);
    recordBrowserAction('handoff', `Applied browser workspace profile: ${id}`, 'low');
    setStatus('Browser workspace profile applied.', true);
    renderBrowserIdentityRail();
  });
  workspacesEl.querySelector('#browser-workspace-delete')?.addEventListener('click', () => {
    const select = /** @type {HTMLSelectElement | null} */ (getEl('browser-workspace-select'));
    const id = String(select?.value || '').trim();
    if (!id) {
      setStatus('Choose a workspace profile first.', false);
      return;
    }
    removeBrowserWorkspaceProfile(id);
    setStatus('Browser workspace profile deleted.', true);
    renderBrowserIdentityRail();
  });

  const rememberedApprovals = listRememberedBrowserPermissions();
  actionsEl.innerHTML = `
    <a class="btn btn-primary btn-sm" href="/vault#backup">Open backup</a>
    <a class="btn btn-outline btn-sm" href="/vault#api-keys">Manage keys</a>
    <button class="btn btn-outline btn-sm" type="button" id="browser-identity-open-accounts">Connected accounts</button>
    <button class="btn btn-outline btn-sm" type="button" id="browser-identity-open-playbooks">Ops playbooks</button>
    <a class="btn btn-outline btn-sm" href="/vault#entitlements">Subscriptions</a>
    <button class="btn btn-outline btn-sm" type="button" id="browser-clear-approval-memory">Clear browser approvals${rememberedApprovals.length ? ` (${rememberedApprovals.length})` : ''}</button>
    ${receiptTrust.isOperator ? '<a class="btn btn-outline btn-sm" href="/admin.html">Operator console</a>' : ''}
    ${portable.latestReceipt ? '<button class="btn btn-outline btn-sm" type="button" id="browser-identity-copy-receipt">Copy receipt</button>' : ''}
  `;
  actionsEl.querySelector('#browser-identity-open-accounts')?.addEventListener('click', () => {
    window.openPanel?.('eon-panel-accounts');
  });
  actionsEl.querySelector('#browser-identity-open-playbooks')?.addEventListener('click', () => {
    document.getElementById('browser-ops-playbook')?.focus();
    document.getElementById('browser-ops-playbook')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  actionsEl.querySelector('#browser-clear-approval-memory')?.addEventListener('click', () => {
    clearBrowserPermissionMemory();
    setStatus('Browser approval memory cleared.', true);
    renderBrowserOperatorRail();
  });
  actionsEl.querySelector('#browser-identity-copy-receipt')?.addEventListener('click', async () => {
    if (!portable.latestReceipt) {
      return;
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(portable.latestReceipt, null, 2));
      setStatus('Portable receipt copied.', true);
    } catch {
      setStatus('Could not copy portable receipt.', false);
    }
  });
}

function refreshBrowserReadinessUI() {
  const readiness = getAIReadiness(loadAISettings(), BROWSER_READINESS_UI);
  setStatus(readiness.ready ? `AI ready · ${readiness.detail}` : `${readiness.label} · ${readiness.bannerBody} ${readiness.trustSummary || ''}`, readiness.ready);
  renderBrowserRecoveryRail(readiness);
  renderBrowserIdentityRail();
  return readiness;
}

function getBrowserSettings() {
  const settings = loadAISettings();
  const providerId = settings.provider || settings.providerId || 'guide';
  return {
    ...settings,
    provider: providerId
  };
}


async function askBrowserAI(/** @type {any} */ prompt, /** @type {any} */ systemExtra = '') {
  const settings = getBrowserSettings();
  const systemPrompt = `You are EONBOT AI inside the AI Business Cockpit, the primary execution surface for EONAPP.
You help the user research live web pages, summarize readable source text, extract key offers, identify risks, navigate tasks, and hand work off into cockpit workspaces or Build when needed.
Be proactive: suggest next actions, surface risks, and keep the user oriented.
Always stay concrete, structured, and browser-native.
${systemExtra}`.trim();
  const reply = await runMissionEngine({
    mode: 'browse',
    prompt,
    history: [],
    systemPrompt,
    settings: {
      ...settings,
      systemPrompt
    },
    taskType: 'browse',
    origin: 'browser',
    metadata: {
      surface: 'browser',
      browserIntent: String(prompt || '').slice(0, 200)
    },
    governor: BrowserGovernor
  });
  if (typeof reply === 'string') {
    return { text: reply, meta: null };
  }
  return {
    text: String(reply?.text || ''),
    meta: reply?.meta || null
  };
}

async function fetchReadableSource(/** @type {any} */ url) {
  const normalized = normalizeUrl(url);
  if (!normalized) throw new Error('Enter a URL first.');
  if (normalized.startsWith(window.location.origin)) {
    const response = await fetch(normalized);
    if (!response.ok) throw new Error(`Could not fetch page: HTTP ${response.status}`);
    return stripHtml(await response.text()).slice(0, 16000);
  }

  const readerUrl = `https://r.jina.ai/http://${normalized.replace(/^https?:\/\//i, '')}`;
  const response = await fetch(readerUrl);
  if (!response.ok) throw new Error(`Readable source fetch failed: HTTP ${response.status}`);
  return (await response.text()).slice(0, 16000);
}

function applyBrowserFrameSafety(frame, value = '') {
  if (!frame) return;
  let sameOrigin = false;
  try { sameOrigin = new URL(String(value || 'about:blank'), window.location.origin).origin === window.location.origin; } catch {}
  // Same-origin EONAPP app modules retain their normal functionality. Remote
  // pages are isolated without allow-same-origin, get no referrer and cannot
  // inherit top-level browser privileges.
  if (sameOrigin || !value || String(value).startsWith('about:')) frame.removeAttribute('sandbox');
  else frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups');
  frame.referrerPolicy = 'no-referrer';
}

async function loadUrl() {
  const input = getEl('browser-url');
  const frame = getEl('browser-frame');
  const surface = getEl('browser-current-url');
  const url = normalizeUrl(input?.value || '');
  if (!url || !frame) {
    setStatus('Enter a valid URL first.', false);
    return;
  }

  applyBrowserFrameSafety(frame, url);
  frame.src = url;
  if (surface) surface.textContent = url;
  setBrowserOperatorState('acting', `Navigating to ${getBrowserHost(url) || url}`);
  setActiveBrowserTabContext({
    mode: 'browse',
    title: `Navigate ${getBrowserHost(url) || 'page'}`,
    detail: 'Loading page in the active browser tab.',
    status: 'acting',
    url
  });
  setStatus('Loading page...', true);
  recordBrowserAction('fetch', `Navigate: ${url}`);

  // Detect iframe blocking
  frame.onerror = () => {
    setStatus('This site blocks embedding. Use "Fetch Source" to read content, or open in a new tab.', false);
  };

  // Timeout check for blocked sites
  setTimeout(() => {
    try {
      if (frame.contentWindow) {
        setStatus('Page loaded. Some sites may block embedding; fetch source still works.', true);
        setBrowserOperatorState('observing', `Loaded ${getBrowserHost(url) || url}`);
      }
    } catch {
      setStatus('This site blocks embedding (X-Frame-Options or CSP). Use "Fetch Source" to read content.', false);
    }
  }, 3000);
}

function getSessionPayload() {
  return {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    name: String(getEl('browser-session-name')?.value || '').trim() || `Research ${new Date().toLocaleString()}`,
    url: normalizeUrl(getEl('browser-url')?.value || ''),
    query: String(getEl('browser-query')?.value || '').trim(),
    source: String(getEl('browser-source')?.value || '').slice(0, 16000),
    output: String(getEl('browser-output')?.textContent || '').slice(0, 6000),
    compareUrls: String(getEl('browser-compare-urls')?.value || '').slice(0, 2000)
  };
}

function populateSessionList() {
  const list = getEl('browser-session-list');
  if (!list) return;
  const rows = readListStore(BROWSER_SESSIONS_KEY);
  list.innerHTML = rows.length
    ? rows.slice().reverse().map((/** @type {any} */ row) => `<option value="${row.id}">${row.name} (${new Date(row.savedAt).toLocaleString()})</option>`).join('')
    : '<option value="">No saved sessions yet</option>';
}

function saveCurrentSession() {
  const payload = getSessionPayload();
  const rows = readListStore(BROWSER_SESSIONS_KEY);
  rows.push(payload);
  writeListStore(BROWSER_SESSIONS_KEY, rows, MAX_BROWSER_SESSIONS);
  populateSessionList();
  setStatus(`Saved session: ${payload.name}`, true);
  recordBrowserAction('session-save', `Session saved: ${payload.name}`);
}

function loadSelectedSession() {
  const list = getEl('browser-session-list');
  if (!list?.value) return;
  const rows = readListStore(BROWSER_SESSIONS_KEY);
  const row = rows.find((/** @type {any} */ item) => item.id === list.value);
  if (!row) return;
  const urlInput = getEl('browser-url');
  if (urlInput) urlInput.value = row.url || '';
  const queryInput = getEl('browser-query');
  if (queryInput) queryInput.value = row.query || '';
  const sourceInput = getEl('browser-source');
  if (sourceInput) sourceInput.value = row.source || '';
  const compareInput = getEl('browser-compare-urls');
  if (compareInput) compareInput.value = row.compareUrls || '';
  setOutput(row.output || '');
  renderCompareMetrics([]);
  renderCompareVisual([]);
  if (row.url) {
    void loadUrl();
  }
  setStatus(`Loaded session: ${row.name}`, true);
}

function populateTemplateList() {
  const list = getEl('browser-template-list');
  if (!list) return;
  const rows = readListStore(BROWSER_TEMPLATES_KEY);
  list.innerHTML = rows.length
    ? rows.slice().reverse().map((/** @type {any} */ row) => `<option value="${row.id}">${row.name}</option>`).join('')
    : '<option value="">No templates yet</option>';
}

function saveTemplateFromFindings() {
  const name = String(getEl('browser-template-name')?.value || '').trim();
  const source = String(getEl('browser-source')?.value || '').trim();
  const output = String(getEl('browser-output')?.textContent || '').trim();
  if (!name || (!source && !output)) {
    setStatus('Add a template name and source/output first.', false);
    return;
  }
  const rows = readListStore(BROWSER_TEMPLATES_KEY);
  rows.push({
    id: crypto.randomUUID(),
    name,
    savedAt: new Date().toISOString(),
    source: source.slice(0, 12000),
    promptSeed: output.slice(0, 3000)
  });
  writeListStore(BROWSER_TEMPLATES_KEY, rows, MAX_BROWSER_TEMPLATES);
  populateTemplateList();
  setStatus(`Saved template: ${name}`, true);
}

function applySelectedTemplate() {
  const list = getEl('browser-template-list');
  if (!list?.value) return;
  const rows = readListStore(BROWSER_TEMPLATES_KEY);
  const row = rows.find((/** @type {any} */ item) => item.id === list.value);
  if (!row) return;
  const sourceEl = getEl('browser-source');
  const queryEl = getEl('browser-query');
  if (sourceEl && !String(sourceEl.value || '').trim()) {
    sourceEl.value = row.source || '';
  }
  if (queryEl) {
    queryEl.value = row.promptSeed ? `Use template ${row.name} and update for current URL.` : (queryEl.value || '');
  }
  setStatus(`Applied template: ${row.name}`, true);
}

async function runLocalRuntimeChecks() {
  const el = getEl('browser-local-status');
  if (el) el.textContent = await _i18n('Running local runtime checks...');

  const started = performance.now();
  const findings = await detectLocalProviders();
  const elapsed = Math.round(performance.now() - started);

  const /** @type {any} */
lines = [];
  lines.push(`Check completed in ${elapsed}ms`);
  findings.forEach((/** @type {any} */ item) => {
    const models = Array.isArray(item.models) ? item.models.slice(0, 4).join(', ') : '';
    lines.push(`${item.provider}: ${item.available ? 'reachable' : 'unreachable'}${models ? ` | models: ${models}` : ''}`);
  });

  const plan = getSuperappSetupPlan(loadAISettings(), {
    hardwareTier: 'unknown',
    localProviders: findings
  });

  const reachable = findings.filter((/** @type {any} */ item) => item.available).length;
  const tierHint = elapsed < 1200
    ? 'Latency profile suggests Small/Medium local models are viable for fast chat.'
    : 'Latency profile is moderate. Start with small local models before medium/heavy tiers.';
  const gpuHint = reachable > 0
    ? 'If GPU acceleration is enabled in your local runtime, use Medium for content and Small for rapid QA.'
    : 'No local runtime reached. Keep hosted provider active and complete Windows local setup before switching default mode.';

  lines.push('');
  lines.push(tierHint);
  lines.push(gpuHint);
  lines.push(plan.hasLocalRuntime
    ? `Recommended local path: ${plan.suggestedLocalLabel}`
    : 'Recommended local path: Install Ollama, LM Studio, or Jan for private inference.');
  if (plan.localProviderLabels.length) {
    lines.push(`${await _i18n('Local runtimes')}: ${plan.localProviderLabels.join(', ')}`);
  }
  if (plan.localModelNames.length) {
    lines.push(`Local models: ${plan.localModelNames.slice(0, 4).join(', ')}`);
  }
  if (!plan.readiness.ready) {
    lines.push(`AI setup path: ${plan.readiness.bannerBody}`);
  }

  const /** @type {any} */
result = {
    checkedAt: new Date().toISOString(),
    elapsedMs: elapsed,
    reachable,
    findings,
    tierHint,
    gpuHint
  };

  try {
    localStorage.setItem('eon:browser:local-runtime-proof:v1', JSON.stringify(result));
  } catch {}

  if (el) el.textContent = lines.join('\n');
  setStatus(await _i18n(reachable > 0 ? 'Local runtime checks complete.' : 'No local runtime reachable yet.'), reachable > 0);
  renderBrowserRecoveryRail(getAIReadiness(loadAISettings(), BROWSER_READINESS_UI));

  return result;
}

async function performCompareUrls(/** @type {any} */ urls) {
  const /** @type {any} */
samples = [];
  const /** @type {any} */
compareEntries = [];
  setStatus('Fetching readable source for comparison set...', true);
  for (const /** @type {any} */ url of urls) {
    try {
      const source = await fetchReadableSource(url);
      samples.push(`URL: ${url}\n${source.slice(0, 5000)}`);
      compareEntries.push({ url, text: source.slice(0, 10000) });
    } catch (/** @type {any} */ error) {
      samples.push(`URL: ${url}\nFetch failed: ${/** @type {Error} */ (error).message || 'Unknown error'}`);
      compareEntries.push({ url, text: '' });
    }
  }

  const prompt = `Compare these URLs for an operator and creator strategy workflow.\n\n${samples.join('\n\n---\n\n')}\n\nReturn:\n1) one-line summary per URL\n2) overlaps and differences\n3) strongest offer and strongest risk per URL\n4) which URL to model first for the cockpit workbench`;
  setBrowserOperatorState('planning', `Comparing ${urls.length} URLs`);
  setActiveBrowserTabContext({
    mode: 'compare',
    title: 'URL comparison',
    detail: `Comparing ${urls.length} URLs for offers, risks, and creator opportunities.`,
    status: 'planning',
    url: urls[0] || ''
  });
  const response = await askBrowserAI(prompt, 'Comparison mode: produce a practical decision report.');
  setOutput(response.text);
  renderCompareMetrics(compareEntries);
  renderCompareVisual(compareEntries);
  setStatus('URL comparison ready.', true);
  setBrowserOperatorState('observing', `Comparison complete for ${urls.length} URLs`);
  recordBrowserAction('compare', `Compared ${urls.length} URL(s): ${urls.slice(0, 2).join(', ')}`, 'medium');

  recordAIArtifactTelemetry({
    surface: 'browser',
    artifactType: 'compare',
    providerId: response?.meta?.providerId || getBrowserProviderInfo().providerId,
    providerLabel: response?.meta?.provider || getBrowserProviderInfo().label,
    model: response?.meta?.model || getBrowserProviderInfo().model,
    mode: 'analysis',
    local: Boolean(response?.meta?.local),
    outputLength: String(response.text || '').length,
    sourceUrl: urls.join(',')
  });
}

async function runCompareUrls() {
  const primary = normalizeUrl(getEl('browser-url')?.value || '');
  const extraRaw = String(getEl('browser-compare-urls')?.value || '');
  const extras = extraRaw
    .split('\n')
    .map((/** @type {any} */ line) => normalizeUrl(line))
    .filter(Boolean)
    .slice(0, 3);
  const urls = Array.from(new Set([primary, ...extras].filter(Boolean)));

  if (urls.length < 2) {
    setStatus('Add at least two URLs to compare.', false);
    return;
  }

  const approval = assessBrowserRisk(primary, 'compare', '', urls);
  await runBrowserActionWithSafety({
    ...approval,
    title: 'Approve URL comparison',
    summary: `${urls.length} URLs ready for compare mode`,
    url: urls.slice(0, 2).join(', ')
  }, () => performCompareUrls(urls));
}

async function performBrowserAction(/** @type {any} */ mode) {
  const url = normalizeUrl(getEl('browser-url')?.value || '');
  const sourceEl = getEl('browser-source');
  const query = (getEl('browser-query')?.value || '').trim();
  const sourceText = (sourceEl?.value || '').trim();
  let source = sourceText;

  if (!url) {
    setStatus('Enter a URL first.', false);
    return;
  }

  try {
    renderCompareMetrics([]);
    renderCompareVisual([]);
    if (!source) {
      setStatus('Fetching readable page source...', true);
      setBrowserOperatorState('observing', `Reading source from ${getBrowserHost(url) || url}`);
      source = await fetchReadableSource(url);
      if (sourceEl) sourceEl.value = source;
    }

    let prompt = '';
    let systemExtra = '';
    if (mode === 'summarize') {
      systemExtra = 'Return a crisp executive summary for a non-technical product operator.';
      prompt = `URL: ${url}\n\nReadable source:\n${source}\n\nSummarize this page in 6-10 bullet points, then give 3 creator opportunities.`;
    } else if (mode === 'research') {
      systemExtra = 'Return a research pack with risks, opportunities, audience angle, and content angles.';
      prompt = `URL: ${url}\n\nReadable source:\n${source}\n\nBuild a research pack for EONAPP with sections: WHAT IT IS, KEY OFFERS, RISKS, GAPS, CONTENT ANGLES, CREATOR STUDIO NEXT STEPS.`;
    } else if (mode === 'extract') {
      systemExtra = 'Extract only the highest-signal facts and offers.';
      prompt = `URL: ${url}\n\nReadable source:\n${source}\n\nExtract the key points, calls-to-action, pricing/offer hints, and anything a creator should save.`;
    } else {
      systemExtra = 'Answer the user query against the page source only.';
      prompt = `URL: ${url}\n\nReadable source:\n${source}\n\nUser question: ${query || 'What matters on this page?'}\n\nAnswer directly using the page context.`;
    }

    setStatus(await _i18n('Calling AI provider...'), true);
    setBrowserOperatorState('acting', `${mode} on ${getBrowserHost(url) || url}`);
    setActiveBrowserTabContext({
      mode,
      title: `${mode} mission`,
      detail: query || `Processing ${mode} on the current page.`,
      status: 'acting',
      url
    });
    const reply = await askBrowserAI(prompt, systemExtra);
    setOutput(reply.text);
    setStatus('AI output ready.', true);
    setBrowserOperatorState('observing', `${mode} complete for ${getBrowserHost(url) || url}`);
    recordBrowserAction('ai-analysis', `${mode} · ${url.slice(0, 80)}`, 'low');

    document.dispatchEvent(new CustomEvent('eon:ai-action', {
      detail: {
        provider: reply?.meta?.providerId || 'AI',
        action: mode,
        detail: `${mode} on ${url.slice(0, 60)}`,
        outputLength: String(reply.text || '').length,
        url
      }
    }));

    recordAIArtifactTelemetry({
      surface: 'browser',
      artifactType: mode,
      providerId: reply?.meta?.providerId || getBrowserProviderInfo().providerId,
      providerLabel: reply?.meta?.provider || getBrowserProviderInfo().label,
      model: reply?.meta?.model || getBrowserProviderInfo().model,
      mode,
      local: Boolean(reply?.meta?.local),
      outputLength: String(reply.text || '').length,
      sourceUrl: url
    });
    try {
      eonAnalytics.trackEvent('Browser', 'ai_action', `${mode}:${reply?.meta?.providerId || 'unknown'}`);
    } catch {}
  } catch (/** @type {any} */ error) {
    setOutput(`AI/browser error: ${/** @type {Error} */ (error).message || 'Unknown error'}`);
    setStatus('Browser action failed.', false);
    setBrowserOperatorState('blocked', `Browser action failed: ${/** @type {Error} */ (error).message || 'Unknown error'}`);
  }
}

function exportSessions() {
  const rows = readListStore(BROWSER_SESSIONS_KEY);
  downloadJsonFile(`eon-browser-sessions-${Date.now()}.json`, rows);
  setStatus(`Exported ${rows.length} sessions.`, true);
}

function exportTemplates() {
  const rows = readListStore(BROWSER_TEMPLATES_KEY);
  downloadJsonFile(`eon-browser-templates-${Date.now()}.json`, rows);
  setStatus(`Exported ${rows.length} templates.`, true);
}

function importSessionsFromFile(/** @type {any} */ file) {
  parseImportedJson(file, (/** @type {any} */ data) => {
    if (!Array.isArray(data)) {
      setStatus('Session import failed: expected array format.', false);
      return;
    }
    writeListStore(BROWSER_SESSIONS_KEY, data, MAX_BROWSER_SESSIONS);
    populateSessionList();
    setStatus(`Imported ${Math.min(data.length, MAX_BROWSER_SESSIONS)} sessions.`, true);
    recordBrowserAction('session-save', `Imported ${Math.min(data.length, MAX_BROWSER_SESSIONS)} sessions from file`);
  });
}

function importTemplatesFromFile(/** @type {any} */ file) {
  parseImportedJson(file, (/** @type {any} */ data) => {
    if (!Array.isArray(data)) {
      setStatus('Template import failed: expected array format.', false);
      return;
    }
    writeListStore(BROWSER_TEMPLATES_KEY, data, MAX_BROWSER_TEMPLATES);
    populateTemplateList();
    setStatus(`Imported ${Math.min(data.length, MAX_BROWSER_TEMPLATES)} templates.`, true);
  });
}

async function runBrowserAction(/** @type {any} */ mode) {
  const url = normalizeUrl(getEl('browser-url')?.value || '');
  const query = (getEl('browser-query')?.value || '').trim();

  if (!url) {
    setStatus('Enter a URL first.', false);
    return;
  }

  const approval = assessBrowserRisk(url, mode, query);
  await runBrowserActionWithSafety({
    ...approval,
    title: mode === 'query' ? 'Ask EONBOT about page' : `${mode.charAt(0).toUpperCase()}${mode.slice(1)} page`,
    summary: `${mode} · ${getBrowserHost(url) || 'external site'}`,
    url
  }, () => performBrowserAction(mode));
}

function saveToCreatorStudio() {
  const url = normalizeUrl(getEl('browser-url')?.value || '');
  const sourceText = (getEl('browser-source')?.value || '').trim();
  const aiOutput = (getEl('browser-output')?.textContent || '').trim();
  const providerInfo = getBrowserProviderInfo();

  const /** @type {any} */
payload = {
    source: 'browser',
    timestamp: new Date().toISOString(),
    url: url,
    sourceText: sourceText.slice(0, 8000),
    aiOutput: aiOutput.slice(0, 4000),
    provider: {
      id: providerInfo.providerId,
      label: providerInfo.label,
      model: providerInfo.model,
      ready: providerInfo.ready
    },
    metadata: {
      hasSource: !!sourceText,
      hasAIOutput: !!aiOutput,
      sourceLength: sourceText.length,
      outputLength: aiOutput.length
    },
    suggestedPanel: aiOutput ? 'script' : 'idea',
    suggestedTopic: sourceText.slice(0, 280) || url.slice(0, 280)
  };
  setBrowserOperatorState('acting', 'Handing browser research to cockpit workspaces');
  setActiveBrowserTabContext({
    mode: 'handoff',
    title: 'Cockpit handoff',
    detail: 'Sending browser findings into the creative pipeline.',
    status: 'acting',
    url
  });

  try {
    sessionStorage.setItem('eon:creator:launch:v1', JSON.stringify(payload));
  } catch {}
  recordAIArtifactTelemetry({
    surface: 'browser',
    artifactType: 'creator-handoff',
    providerId: providerInfo.providerId,
    providerLabel: providerInfo.label,
    model: providerInfo.model,
    mode: 'handoff',
    local: Boolean(providerInfo.local),
    outputLength: aiOutput.length,
    sourceUrl: url
  });
  window.location.href = '/create';
}

async function startBrowserMic() {
  const micBtn = getEl('browser-query-mic');
  if (!SpeechRecognitionAPI) {
    void _i18n('Speech recognition is not supported in this browser.').then((/** @type {any} */ msg) => setStatus(msg, false));
    return;
  }

  if (!await ensureBrowserMicReady()) return;

  if (browserRecognition) {
    try { browserRecognition.stop(); } catch {}
  }

  const candidates = buildRecognitionLocaleCandidates(
    resolveSpeechLocale({
      appLanguage: localStorage.getItem('eon:lang:preference:v1') || localStorage.getItem('eon:lang:v1') || '',
      preferredLanguage: localStorage.getItem('eon:lang:preference:v1') || localStorage.getItem('eon:lang:v1') || '',
      browserLocales: Array.isArray(navigator.languages) ? navigator.languages : []
    }),
    Array.isArray(navigator.languages) ? navigator.languages : []
  );
  let candidateIndex = 0;

  const recognition = new SpeechRecognitionAPI();
  const target = getEl('browser-query');
  setBrowserOperatorState('observing', 'Voice input armed');
  recognition.lang = candidates[candidateIndex] || _resolveSpeechLocale();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.onstart = () => {
    if (micBtn) micBtn.setAttribute('aria-pressed', 'true');
    void _i18n('Listening for browser query...').then((/** @type {any} */ msg) => setStatus(msg, true));
  };
  recognition.onresult = (/** @type {any} */ event) => {
    let text = '';
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      text += event.results[index][0]?.transcript || '';
    }
    if (target) target.value = text.trim();
  };
  recognition.onerror = ((/** @type {any} */ event) => {
    if (micBtn) micBtn.setAttribute('aria-pressed', 'false');
    const errorCode = String(event?.error || 'unknown');
    if (candidateIndex < candidates.length - 1) {
      candidateIndex += 1;
      try {
        recognition.lang = candidates[candidateIndex];
        recognition.start();
        void _i18n(`Retrying voice locale: ${recognition.lang}`).then((/** @type {any} */ msg) => setStatus(msg, true));
        return;
      } catch {}
    }
    if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed') {
      void _i18n('Microphone permission denied by browser. Enable access and retry.').then((/** @type {any} */ msg) => setStatus(msg, false));
    } else if (errorCode === 'audio-capture') {
      void _i18n('No working microphone detected. Check your audio input device.').then((/** @type {any} */ msg) => setStatus(msg, false));
    } else {
      void _i18n('Microphone failed. Check browser permission.').then((/** @type {any} */ msg) => setStatus(msg, false));
    }
  });
  recognition.onend = () => {
    if (micBtn) micBtn.setAttribute('aria-pressed', 'false');
    void _i18n('Voice query captured.').then((/** @type {any} */ msg) => setStatus(msg, true));
  };
  browserRecognition = recognition;
  recognition.start();
}

initAppLanguage();
localizeStatic(document);
syncBrowserProviderChip();
try {
  refreshBrowserReadinessUI();
} catch {}
loadUrl();
populateSessionList();
populateTemplateList();
renderBrowserActionLog();
renderBrowserOperatorRail();
initCockpitCampaignCenter(document);

// Back / Forward / Refresh / Home nav buttons
getEl('browser-back')?.addEventListener('click', () => { try { window.EONTabSystem?.goBack?.(); } catch {} });
getEl('browser-forward')?.addEventListener('click', () => { try { window.EONTabSystem?.goForward?.(); } catch {} });
getEl('browser-refresh')?.addEventListener('click', () => {
  const frame = /** @type {any} */ (getEl('browser-frame'));
  if (frame?.src && frame.src !== 'about:blank') { const s = frame.src; frame.src = ''; frame.src = s; } else { loadUrl(); }
});
getEl('browser-home')?.addEventListener('click', () => {
  const input = /** @type {any} */ (getEl('browser-url'));
  if (input) input.value = 'https://eonapp.ch/about.html';
  loadUrl();
});

// AI sidebar toggle
(function () {
  const sidebar = getEl('browser-ai-sidebar');
  const toggleBtn = getEl('browser-ai-panel-toggle');
  const closeBtn = getEl('browser-ai-sidebar-close');
  function toggle(/** @type {boolean|undefined} */ forceOpen = undefined) {
    if (!sidebar) return;
    const open = forceOpen !== undefined ? forceOpen : !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', open);
    if (toggleBtn) toggleBtn.setAttribute('aria-pressed', String(open));
  }
  toggleBtn?.addEventListener('click', () => toggle());
  closeBtn?.addEventListener('click', () => toggle(false));
})();

window.addEventListener('storage', (/** @type {any} */ event) => {
  if (event?.key === 'eon:ai-chat-settings:v1') {
    refreshBrowserReadinessUI();
  }
});

getEl('browser-load')?.addEventListener('click', loadUrl);
getEl('browser-fetch-source')?.addEventListener('click', async () => {
  try {
    const url = normalizeUrl(getEl('browser-url')?.value || '');
    const source = await fetchReadableSource(url);
    const sourceEl = getEl('browser-source');
    if (sourceEl) sourceEl.value = source;
    setStatus('Readable source fetched.', true);
    recordBrowserAction('fetch', `Readable source: ${url.slice(0, 80)}`);
  } catch (/** @type {any} */
error) {
    setStatus(/** @type {Error} */ (error).message || 'Readable source fetch failed.', false);
  }
});
getEl('browser-summarize')?.addEventListener('click', () => runBrowserAction('summarize'));
getEl('browser-research')?.addEventListener('click', () => runBrowserAction('research'));
getEl('browser-extract')?.addEventListener('click', () => runBrowserAction('extract'));
getEl('browser-compare')?.addEventListener('click', runCompareUrls);
getEl('browser-creator')?.addEventListener('click', saveToCreatorStudio);
getEl('browser-session-save')?.addEventListener('click', saveCurrentSession);
getEl('browser-session-load')?.addEventListener('click', loadSelectedSession);
getEl('browser-template-save')?.addEventListener('click', saveTemplateFromFindings);
getEl('browser-template-apply')?.addEventListener('click', applySelectedTemplate);
getEl('browser-session-export')?.addEventListener('click', exportSessions);
getEl('browser-template-export')?.addEventListener('click', exportTemplates);
getEl('browser-session-import')?.addEventListener('click', () => getEl('browser-session-import-file')?.click());
getEl('browser-template-import')?.addEventListener('click', () => getEl('browser-template-import-file')?.click());
getEl('browser-session-import-file')?.addEventListener('change', (/** @type {any} */ event) => {
  const file = event?.target?.files?.[0];
  importSessionsFromFile(file);
  if (event?.target) event.target.value = '';
});
getEl('browser-template-import-file')?.addEventListener('change', (/** @type {any} */ event) => {
  const file = event?.target?.files?.[0];
  importTemplatesFromFile(file);
  if (event?.target) event.target.value = '';
});
getEl('browser-local-check')?.addEventListener('click', runLocalRuntimeChecks);
getEl('browser-action-log-clear')?.addEventListener('click', clearBrowserActionLog);
getEl('browser-query')?.addEventListener('keydown', (/** @type {any} */ event) => {
  if (event.key === 'Enter') runBrowserAction('query');
});
getEl('browser-query-mic')?.addEventListener('click', startBrowserMic);
document.querySelectorAll('.browser-quick-site').forEach((/** @type {any} */ button) => {
  button.addEventListener('click', () => {
    const url = button.getAttribute('data-url') || '';
    const input = getEl('browser-url');
    if (input) input.value = url;
    loadUrl();
  });
});

window.EONBrowserEvidence = {
  runLocalRuntimeChecks,
  async runVoiceSelfTest() {
    const report = {
      generatedAt: new Date().toISOString(),
      locale: _resolveSpeechLocale(),
      recognitionSupported: Boolean(SpeechRecognitionAPI),
      synthesisSupported: Boolean('speechSynthesis' in window),
      microphone: {
        permission: await getBrowserMicrophonePermissionState(),
        devices: await detectBrowserMicrophoneDevices(),
        preflight: await ensureBrowserMicrophoneAccess()
      }
    };
    try {
      localStorage.setItem('eon:browser:voice-diagnostics:v1', JSON.stringify(report));
    } catch {}
    return report;
  },
  getLatestVoiceDiagnostics() {
    try {
      return JSON.parse(localStorage.getItem('eon:browser:voice-diagnostics:v1') || 'null');
    } catch {
      return null;
    }
  },
  getLatestLocalRuntimeProof() {
    try {
      return JSON.parse(localStorage.getItem('eon:browser:local-runtime-proof:v1') || 'null');
    } catch {
      return null;
    }
  },
  getActionLog() {
    return readListStore(BROWSER_ACTION_LOG_KEY);
  },
  clearActionLog() {
    clearBrowserActionLog();
  }
};
window.EONBrowserDownloadManager = {
  record: recordBrowserDownload,
  read: readBrowserDownloadRows,
  refresh: renderBrowserDownloadManager,
  clear: clearBrowserDownloads,
  remove: removeBrowserDownload
};

// ============================================================
// EON Browser — Multi-Tab System
// ============================================================
(function initEonTabs() {
  let tabCounter = 0;
/** @type {{ tabs: any[], activeTabId: string | null }} */
const tabState = { tabs: /** @type {any[]} */ ([]), activeTabId: null };
  const TABS_STATE_KEY = 'eon:browser:tabs:v2';

  function nextTabId() { return 'eon-t-' + (++tabCounter); }

/**
 * @param {any} raw
 */
function normalizeTabUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/')) return s;
  if (s.startsWith('./') || s.startsWith('../')) return s;
  if (s.startsWith('about:') || s.startsWith('blob:') || s.startsWith('data:') || s.startsWith('file:')) return s;
  if (s.includes('.') && !s.includes(' ')) return 'https://' + s;
  return 'https://www.google.com/search?q=' + encodeURIComponent(s);
}

  /**
   * @param {any[]} [history]
   * @param {number} [historyIndex]
   */
  function normalizeTabHistory(history = [], historyIndex = -1) {
    const cleaned = Array.isArray(history)
      ? history.map((/** @type {any} */ entry) => normalizeTabUrl(entry)).filter(Boolean)
      : [];
    const unique = /** @type {string[]} */ ([]);
    for (const entry of cleaned) {
      if (!unique.length || unique[unique.length - 1] !== entry) {
        unique.push(entry);
      }
    }
    const index = unique.length ? Math.min(Math.max(Number(historyIndex) || 0, 0), unique.length - 1) : -1;
    return { history: unique, historyIndex: index };
  }

  /**
   * @param {any} tab
   */
  function normalizeTabRecord(tab) {
    const normalizedUrl = normalizeTabUrl(tab?.url || '');
    const title = String(tab?.title || (normalizedUrl || 'New Tab')).slice(0, 80);
    const icon = String(tab?.icon || '🌐').slice(0, 8);
    const isNewTab = Boolean(tab?.isNewTab) || !normalizedUrl;
    const { history, historyIndex } = normalizeTabHistory(tab?.history || [], tab?.historyIndex ?? (normalizedUrl ? 0 : -1));
    const nextHistory = history.length ? history : (normalizedUrl ? [normalizedUrl] : []);
    const nextIndex = nextHistory.length ? Math.min(Math.max(historyIndex, 0), nextHistory.length - 1) : -1;
    return {
      id: String(tab?.id || nextTabId()),
      url: normalizedUrl || '',
      title,
      icon,
      isNewTab,
      history: nextHistory,
      historyIndex: nextIndex
    };
  }

  function getActiveTab() {
    return tabState.tabs.find((t) => t.id === tabState.activeTabId) || null;
  }

  function updateNavButtonState() {
    const backBtn = document.getElementById('browser-back');
    const forwardBtn = document.getElementById('browser-forward');
    const active = getActiveTab();
    const hasBack = Boolean(active && Array.isArray(active.history) && active.historyIndex > 0);
    const hasForward = Boolean(active && Array.isArray(active.history) && active.historyIndex >= 0 && active.historyIndex < active.history.length - 1);
    if (backBtn) backBtn.disabled = !hasBack;
    if (forwardBtn) forwardBtn.disabled = !hasForward;
  }

  function persistTabs() {
    try {
      const payload = {
        tabs: tabState.tabs.map((tab) => normalizeTabRecord(tab)),
        activeTabId: tabState.activeTabId
      };
      localStorage.setItem(TABS_STATE_KEY, JSON.stringify(payload));
    } catch {}
  }

  function restoreTabs() {
    try {
      const raw = JSON.parse(localStorage.getItem(TABS_STATE_KEY) || 'null');
      if (!raw || !Array.isArray(raw.tabs) || !raw.tabs.length) {
        return false;
      }
      tabState.tabs = raw.tabs.map((/** @type {any} */ tab) => normalizeTabRecord(tab));
      tabState.activeTabId = tabState.tabs.some((/** @type {any} */ tab) => tab.id === raw.activeTabId) ? String(raw.activeTabId || '') : tabState.tabs[0].id;
      const maxId = tabState.tabs
        .map((tab) => Number(String(tab.id || '').replace(/^eon-t-/, '')))
        .filter((value) => Number.isFinite(value))
        .reduce((max, value) => Math.max(max, value), 0);
      tabCounter = Math.max(tabCounter, maxId);
      return true;
    } catch {
      return false;
    }
  }

  function renderTabs() {
    const list = document.getElementById('eon-tab-list');
    if (!list) return;
    list.innerHTML = '';
    for (const tab of tabState.tabs) {
      const el = document.createElement('div');
      el.className = 'eon-browser-tab' + (tab.id === tabState.activeTabId ? ' active' : '');
      el.setAttribute('role', 'tab');
      el.setAttribute('aria-selected', String(tab.id === tabState.activeTabId));
      el.setAttribute('data-tab-id', tab.id);
      const favicon = escapeHtml(tab.icon || '🌐');
      const title = escapeHtml((tab.title || 'New Tab').slice(0, 38));
      el.innerHTML = `<span class="eon-tab-favicon">${favicon}</span><span class="eon-tab-title">${title}</span><button class="eon-tab-close" data-close-id="${tab.id}" type="button" aria-label="Close tab">\u00d7</button>`;
      el.addEventListener('click', (/** @type {MouseEvent} */ e) => {
        if (/** @type {HTMLElement} */ (e.target).closest('.eon-tab-close')) return;
        activateTab(tab.id);
      });
      list.appendChild(el);
    }
    list.querySelectorAll('.eon-tab-close').forEach((/** @type {any} */ btn) => {
      btn.addEventListener('click', (/** @type {MouseEvent} */ e) => {
        e.stopPropagation();
        const id = /** @type {HTMLElement} */ (btn).getAttribute('data-close-id') || '';
        closeTab(id);
      });
    });
    updateNavButtonState();
    persistTabs();
  }

  function getFrameHost() {
    return /** @type {HTMLElement | null} */ (document.getElementById('browser-frame-host'));
  }

  function getFramePool() {
    return /** @type {HTMLElement | null} */ (document.getElementById('browser-frame-pool'));
  }

  function getActiveFrame() {
    return /** @type {any} */ (document.getElementById('browser-frame'));
  }

/**
 * @param {any} tab
 */
/**
 * @param {any} tab
 */
function createTabFrame(tab) {
  const frame = document.createElement('iframe');
  frame.title = 'EON Browser viewport';
  frame.className = 'browser-tab-frame';
  frame.dataset.tabId = tab.id;
  frame.hidden = true;
  applyBrowserFrameSafety(frame, tab.url || 'about:blank');
  frame.src = tab.url || 'about:blank';
  frame.addEventListener('load', () => {
    bridgeFrameDownloads(frame);
  });
  return frame;
}

/**
 * @param {any} tab
 */
/**
 * @param {any} tab
 */
function ensureTabFrame(tab) {
  if (!tab) return null;
  if (tab.frameEl && tab.frameEl.isConnected) return tab.frameEl;
  const frame = createTabFrame(tab);
  tab.frameEl = frame;
  const pool = getFramePool();
  if (pool) pool.appendChild(frame);
  bridgeFrameDownloads(frame);
  return frame;
}

  function detachActiveFrame() {
    const frame = getActiveFrame();
    if (!frame) return null;
    const tabId = frame.dataset.tabId || '';
    const tab = tabState.tabs.find((item) => item.id === tabId) || null;
    if (tab) tab.frameEl = frame;
    frame.hidden = true;
    frame.removeAttribute('id');
    const pool = getFramePool();
    if (pool && frame.parentElement !== pool) pool.appendChild(frame);
    return frame;
  }

  /**
   * @param {any} tab
   */
  function activateFrameForTab(tab) {
    if (!tab) return null;
    if (tab.isNewTab || !tab.url) {
      showNewTabPage();
      return null;
    }
    hideNewTabPage();
    const host = getFrameHost();
    if (!host) return null;
    const currentFrame = getActiveFrame();
    if (currentFrame?.dataset?.tabId === tab.id) {
      currentFrame.hidden = false;
      currentFrame.id = 'browser-frame';
      return currentFrame;
    }
    detachActiveFrame();
    const frame = ensureTabFrame(tab);
    if (!frame) return null;
    frame.hidden = false;
    frame.id = 'browser-frame';
    frame.dataset.tabId = tab.id;
    if (frame.parentElement !== host) host.appendChild(frame);
    const urlInput = document.getElementById('browser-url');
    if (urlInput) /** @type {HTMLInputElement} */ (urlInput).value = tab.url;
    updateNavButtonState();
    return frame;
  }

  function showNewTabPage() {
    const page = document.getElementById('eon-newtab-page');
    if (page) { page.hidden = false; }
    const frame = getActiveFrame();
    if (frame) frame.hidden = true;
    const urlInput = document.getElementById('browser-url');
    if (urlInput) { /** @type {HTMLInputElement} */ (urlInput).value = ''; /** @type {HTMLInputElement} */ (urlInput).placeholder = 'Search or enter address…'; }
  }

  function hideNewTabPage() {
    const page = document.getElementById('eon-newtab-page');
    if (page) page.hidden = true;
  }

  /**
   * @param {any} tab
   */
  function updateTabInFrame(tab) {
    if (!tab) return;
    if (tab.isNewTab || !tab.url) {
      showNewTabPage();
      return;
    }
    activateFrameForTab(tab);
    const frame = getActiveFrame();
    if (frame && frame.src !== tab.url) {
      applyBrowserFrameSafety(frame, tab.url);
      frame.setAttribute('src', tab.url);
    }
  }

  /**
   * @param {any} url
   * @param {any} [title]
   * @param {any} [icon]
   */
  /**
   * @param {any} url
   * @param {any} [title]
   * @param {any} [icon]
   */
  function openTab(url, title, icon) {
    const isNewTab = !url;
    const id = nextTabId();
    const resolved = normalizeTabUrl(url);
    const tab = normalizeTabRecord({
      id,
      url: resolved,
      title: title || (isNewTab ? `New Tab ${tabState.tabs.length + 1}` : (resolved || 'New Tab')),
      icon: icon || '🌐',
      isNewTab: Boolean(isNewTab),
      history: resolved ? [resolved] : [],
      historyIndex: resolved ? 0 : -1
    });
    tabState.tabs.push(tab);
    tabState.activeTabId = id;
    renderTabs();
    updateTabInFrame(tab);
    const list = document.getElementById('eon-tab-list');
    list?.querySelector(`[data-tab-id="${String(id).replace(/[^a-zA-Z0-9_-]/g, '')}"]`)?.scrollIntoView?.({ inline: 'center', block: 'nearest' });
    setStatus?.(isNewTab ? 'New Cockpit tab opened.' : `Opened ${tab.title}.`, true);
    return id;
  }

  /**
   * @param {string} id
   */
  /**
   * @param {string} id
   */
  function closeTab(id) {
    const idx = tabState.tabs.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const [removedTab] = tabState.tabs.splice(idx, 1);
    if (removedTab?.frameEl?.parentElement) removedTab.frameEl.parentElement.removeChild(removedTab.frameEl);
    if (removedTab) removedTab.frameEl = null;
    if (tabState.tabs.length === 0) { openTab(null); return; }
    if (tabState.activeTabId === id) {
      tabState.activeTabId = tabState.tabs[Math.min(idx, tabState.tabs.length - 1)].id;
    }
    renderTabs();
    const active = tabState.tabs.find((t) => t.id === tabState.activeTabId);
    if (active) updateTabInFrame(active);
  }

  /**
   * @param {string} id
   */
  /**
   * @param {string} id
   */
  function activateTab(id) {
    const tab = tabState.tabs.find((t) => t.id === id);
    if (!tab) return;
    tabState.activeTabId = id;
    renderTabs();
    updateTabInFrame(tab);
  }

  /**
   * @param {any} tab
   * @param {string} resolved
   */
  /**
   * @param {any} tab
   * @param {string} resolved
   */
  function syncTabHistory(tab, resolved) {
    const next = normalizeTabRecord(tab);
    const history = Array.isArray(next.history) ? next.history.slice(0, Math.max(next.historyIndex + 1, 1)) : [];
    if (!history.length || history[history.length - 1] !== resolved) {
      history.push(resolved);
    }
    return {
      ...next,
      url: resolved,
      title: resolved.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || resolved,
      icon: next.icon || '🌐',
      isNewTab: false,
      history,
      historyIndex: history.length - 1
    };
  }

  /**
   * @param {any} url
   */
  /**
   * @param {any} url
   */
  function navigateCurrentTab(url) {
    const tab = getActiveTab();
    if (!tab) { openTab(url); return; }
    const resolved = normalizeTabUrl(url);
    if (!resolved) return;
    Object.assign(tab, syncTabHistory(tab, resolved));
    renderTabs();
    updateTabInFrame(tab);
    addEonHistory(resolved, tab.title);
  }

  function goBack() {
    const tab = getActiveTab();
    if (!tab || !Array.isArray(tab.history) || tab.historyIndex <= 0) return;
    tab.historyIndex -= 1;
    tab.url = tab.history[tab.historyIndex] || tab.url || '';
    tab.title = tab.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || tab.url || tab.title;
    tab.isNewTab = false;
    renderTabs();
    updateTabInFrame(tab);
    const urlInput = document.getElementById('browser-url');
    if (urlInput) /** @type {HTMLInputElement} */ (urlInput).value = tab.url;
  }

  function goForward() {
    const tab = getActiveTab();
    if (!tab || !Array.isArray(tab.history) || tab.historyIndex < 0 || tab.historyIndex >= tab.history.length - 1) return;
    tab.historyIndex += 1;
    tab.url = tab.history[tab.historyIndex] || tab.url || '';
    tab.title = tab.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || tab.url || tab.title;
    tab.isNewTab = false;
    renderTabs();
    updateTabInFrame(tab);
    const urlInput = document.getElementById('browser-url');
    if (urlInput) /** @type {HTMLInputElement} */ (urlInput).value = tab.url;
  }

  // New tab button
  document.getElementById('eon-new-tab-btn')?.addEventListener('click', () => openTab(null));

  // New tab page — search bar
  const ntSearch = document.getElementById('eon-newtab-search');
  const ntGo = document.getElementById('eon-newtab-go');
  function newtabNavigate() {
    const val = /** @type {HTMLInputElement} */ (ntSearch)?.value?.trim() || '';
    if (!val) return;
    navigateCurrentTab(normalizeTabUrl(val));
  }
  ntGo?.addEventListener('click', newtabNavigate);
  ntSearch?.addEventListener('keydown', (e) => { if (/** @type {KeyboardEvent} */ (e).key === 'Enter') newtabNavigate(); });

  // New tab page — app cards
  document.querySelectorAll('.eon-newtab-app-card').forEach((card) => {
    card.addEventListener('click', () => {
      const url = /** @type {HTMLElement} */ (card).getAttribute('data-app-url') || '';
      if (url) navigateCurrentTab(url);
    });
  });

  // Intercept address bar Enter key (supplement existing handler)
  const addrBar = document.getElementById('browser-url');
  addrBar?.addEventListener('keydown', (e) => {
    if (/** @type {KeyboardEvent} */ (e).key === 'Enter') {
      navigateCurrentTab(/** @type {HTMLInputElement} */ (addrBar).value);
    }
  });

  // Intercept bookmark bar clicks to use tab nav
  document.querySelectorAll('.browser-quick-site').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      const url = /** @type {HTMLElement} */ (btn).getAttribute('data-url') || '';
      if (url) navigateCurrentTab(url);
    }, true);
  });

  // Intercept EON apps panel links
  document.querySelectorAll('.eon-panel-app-card').forEach((card) => {
  card.addEventListener('click', (e) => {
    e.preventDefault();
    const url = /** @type {HTMLElement} */ (card).getAttribute('data-app-url') || card.getAttribute('href') || '';
    if (url) { navigateCurrentTab(url); closeAllPanels(); }
  });
});

maybeInjectAdminShortcuts();

if (!restoreTabs()) {
  // Open first tab as new tab
  openTab(null);
} else {
  tabState.tabs.forEach((tab) => {
    if (tab.url) ensureTabFrame(tab);
  });
  renderTabs();
  const active = getActiveTab();
  if (active) {
    updateTabInFrame(active);
  }
}

  window.EONTabSystem = { openTab, closeTab, activateTab, navigateCurrentTab, goBack, goForward, getActiveTab, getActiveFrame, state: tabState };
})();

// ── History tracking ─────────────────────────────────────────────────────
const EON_HISTORY_KEY = 'eon:browser:history:v2';
const EON_HISTORY_MAX = 500;
const EON_BOOKMARKS_KEY = 'eon:browser:bookmarks:v2';
const EON_BOOKMARKS_MAX = 60;

renderSavedBookmarksBar();
renderBrowserActionLog();
renderBrowserDownloadManager();

/**
 * @param {any} url
 * @param {any} title
 */
function addEonHistory(url, title) {
  try {
    const entries = JSON.parse(localStorage.getItem(EON_HISTORY_KEY) || '[]');
    entries.unshift({ url: String(url || ''), title: String(title || url || ''), ts: Date.now() });
    if (entries.length > EON_HISTORY_MAX) entries.splice(EON_HISTORY_MAX);
    localStorage.setItem(EON_HISTORY_KEY, JSON.stringify(entries));
  } catch {}
}

function getEonHistory() {
  try { return JSON.parse(localStorage.getItem(EON_HISTORY_KEY) || '[]'); } catch { return []; }
}

/**
 * @param {any} entry
 */
function normalizeBookmarkEntry(entry = {}) {
  const url = normalizeUrl(entry.url || '');
  const title = String(entry.title || '').trim().slice(0, 120) || (url ? url.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0] : 'Bookmark');
  const icon = String(entry.icon || '🔖').trim().slice(0, 8) || '🔖';
  return {
    id: String(entry.id || crypto.randomUUID()),
    title,
    url,
    icon,
    createdAt: String(entry.createdAt || new Date().toISOString()),
    updatedAt: new Date().toISOString()
  };
}

function readBookmarkRows() {
  try {
    const rows = JSON.parse(localStorage.getItem(EON_BOOKMARKS_KEY) || '[]');
    return Array.isArray(rows) ? rows.map((row) => normalizeBookmarkEntry(row)).filter((row) => row.url) : [];
  } catch {
    return [];
  }
}

/**
 * @param {any[]} rows
 */
function writeBookmarkRows(rows) {
  try {
    localStorage.setItem(EON_BOOKMARKS_KEY, JSON.stringify(Array.isArray(rows) ? rows.slice(0, EON_BOOKMARKS_MAX).map((row) => normalizeBookmarkEntry(row)) : []));
  } catch {}
}

function getActiveBrowserTabSummary() {
  try {
    const tabSystem = window.EONTabSystem;
    const state = tabSystem?.state;
    const activeTab = state?.tabs?.find((/** @type {any} */ tab) => tab.id === state.activeTabId) || null;
    const url = normalizeUrl(activeTab?.url || getEl('browser-url')?.value || '');
    const title = String(activeTab?.title || '').trim() || (url ? url.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0] : '');
    return {
      url,
      title: title || url || 'Bookmark',
      icon: String(activeTab?.icon || '🔖').trim().slice(0, 8) || '🔖'
    };
  } catch {
    const url = normalizeUrl(getEl('browser-url')?.value || '');
    return {
      url,
      title: url ? url.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0] : 'Bookmark',
      icon: '🔖'
    };
  }
}

function upsertBookmarkRow(/** @type {any} */ entry = {}) {
  const normalized = normalizeBookmarkEntry(entry);
  if (!normalized.url) {
    return { ok: false, rows: readBookmarkRows(), entry: null };
  }
  const rows = readBookmarkRows();
  const key = normalized.id || normalized.url;
  const next = rows.filter((row) => row.id !== key && row.url !== normalized.url);
  next.unshift(normalized);
  writeBookmarkRows(next);
  return { ok: true, rows: next, entry: normalized };
}

function navigateBrowserTo(url = '') {
  const resolved = normalizeUrl(String(url || '').trim());
  if (!resolved) return false;
  if (window.EONTabSystem?.navigateCurrentTab) {
    window.EONTabSystem.navigateCurrentTab(resolved);
    return true;
  }
  const input = getEl('browser-url');
  if (input) /** @type {HTMLInputElement} */ (input).value = resolved;
  loadUrl();
  return true;
}

function removeBookmarkRow(/** @type {any} */ bookmarkId = '') {
  const id = String(bookmarkId || '').trim();
  if (!id) return readBookmarkRows();
  const rows = readBookmarkRows().filter((row) => row.id !== id);
  writeBookmarkRows(rows);
  return rows;
}

function renderSavedBookmarksBar() {
  const container = document.getElementById('eon-user-bookmarks');
  if (!container) return;
  const rows = readBookmarkRows();
  if (!rows.length) {
    container.innerHTML = '<span class="browser-bookmark-empty">No saved bookmarks yet. Use ☆ to save the current page.</span>';
    return;
  }
  container.innerHTML = rows.map((bookmark) => `
    <button class="browser-bookmark-pill" type="button" data-bookmark-url="${escapeHtml(bookmark.url)}" title="${escapeHtml(bookmark.url)}">
      <span class="bookmark-icon">${escapeHtml(bookmark.icon || '🔖')}</span>
      <span class="bookmark-title">${escapeHtml(bookmark.title)}</span>
    </button>
  `).join('');
  container.querySelectorAll('[data-bookmark-url]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const url = /** @type {HTMLElement} */ (btn).getAttribute('data-bookmark-url') || '';
      if (url) navigateBrowserTo(url);
    });
  });
}

function setBookmarkEditorState(/** @type {any} */ entry = null) {
  const titleEl = getEl('eon-bookmark-title');
  const urlEl = getEl('eon-bookmark-url');
  const iconEl = getEl('eon-bookmark-icon');
  const saveBtn = getEl('eon-bookmark-save');
  if (titleEl) /** @type {HTMLInputElement} */ (titleEl).value = entry?.title || '';
  if (urlEl) /** @type {HTMLInputElement} */ (urlEl).value = entry?.url || getActiveBrowserTabSummary().url || '';
  if (iconEl) /** @type {HTMLInputElement} */ (iconEl).value = entry?.icon || '🔖';
  if (saveBtn) {
    saveBtn.dataset.editId = entry?.id || '';
    saveBtn.textContent = entry ? 'Update bookmark' : 'Save bookmark';
  }
}

function renderBookmarksPanel() {
  const list = getEl('eon-bookmark-list');
  if (!list) return;
  const rows = readBookmarkRows();
  if (!rows.length) {
    list.innerHTML = '<p class="browser-bookmark-empty">No bookmarks saved yet. Use ☆ to bookmark the current page.</p>';
    setBookmarkEditorState(null);
    return;
  }
  list.innerHTML = rows.map((bookmark) => `
    <div class="eon-bookmark-row" data-bookmark-id="${escapeHtml(bookmark.id)}">
      <div class="eon-bookmark-row-main">
        <div class="eon-bookmark-row-title">${escapeHtml(bookmark.icon || '🔖')} ${escapeHtml(bookmark.title)}</div>
        <div class="eon-bookmark-row-url">${escapeHtml(bookmark.url)}</div>
      </div>
      <div class="eon-bookmark-row-actions">
        <button class="btn btn-outline btn-sm" type="button" data-bookmark-open="${escapeHtml(bookmark.id)}">Open</button>
        <button class="btn btn-outline btn-sm" type="button" data-bookmark-edit="${escapeHtml(bookmark.id)}">Edit</button>
        <button class="btn btn-outline btn-sm" type="button" data-bookmark-delete="${escapeHtml(bookmark.id)}">Delete</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('[data-bookmark-open]').forEach((/** @type {any} */ btn) => {
    btn.addEventListener('click', () => {
      const id = /** @type {HTMLElement} */ (btn).getAttribute('data-bookmark-open') || '';
      const row = readBookmarkRows().find((item) => item.id === id);
      if (row?.url) navigateBrowserTo(row.url);
    });
  });
  list.querySelectorAll('[data-bookmark-edit]').forEach((/** @type {any} */ btn) => {
    btn.addEventListener('click', () => {
      const id = /** @type {HTMLElement} */ (btn).getAttribute('data-bookmark-edit') || '';
      const row = readBookmarkRows().find((item) => item.id === id);
      if (row) setBookmarkEditorState(row);
    });
  });
  list.querySelectorAll('[data-bookmark-delete]').forEach((/** @type {any} */ btn) => {
    btn.addEventListener('click', () => {
      const id = /** @type {HTMLElement} */ (btn).getAttribute('data-bookmark-delete') || '';
      if (!id) return;
      removeBookmarkRow(id);
      renderSavedBookmarksBar();
      renderBookmarksPanel();
      setStatus('Bookmark removed.', true);
    });
  });
}

function bookmarkCurrentPage() {
  const current = getActiveBrowserTabSummary();
  if (!current.url) {
    setStatus('Open a page first, then bookmark it.', false);
    return;
  }
  const result = upsertBookmarkRow(current);
  renderSavedBookmarksBar();
  renderBookmarksPanel();
  setStatus(result.ok ? `Bookmarked: ${current.title}` : 'Could not bookmark the current page.', result.ok);
}

function renderHistoryPanel() {
  const list = document.getElementById('eon-history-list');
  if (!list) return;
  const entries = /** @type {any[]} */ (getEonHistory());
  if (!entries.length) { list.innerHTML = '<p style="padding:1rem;color:rgba(148,163,184,0.6);font-size:0.83rem;">No history yet.</p>'; return; }
  list.innerHTML = '';
  for (const e of entries.slice(0, 100)) {
    const el = document.createElement('div');
    el.className = 'eon-history-entry';
    const time = new Date(e.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    el.innerHTML = `<div class="eon-history-entry-title">${escapeHtml(e.title.slice(0, 60))}</div><div class="eon-history-entry-url">${escapeHtml(e.url.slice(0, 80))} &middot; ${time}</div>`;
    el.addEventListener('click', () => { window.EONTabSystem?.navigateCurrentTab(e.url); closeAllPanels(); });
    list.appendChild(el);
  }
}

function maybeInjectAdminShortcuts() {
  if (!isAdminProfile(getProfile())) return;

  const appsGrid = document.querySelector('#eon-panel-apps .eon-panel-apps-grid');
  if (appsGrid && !appsGrid.querySelector('[data-admin-only="1"]')) {
    const adminCard = document.createElement('a');
    adminCard.className = 'eon-panel-app-card';
    adminCard.href = '/admin.html';
    adminCard.dataset.appUrl = '/admin.html';
    adminCard.dataset.adminOnly = '1';
    adminCard.innerHTML = '<span>🛠️</span>Admin';
    appsGrid.appendChild(adminCard);
  }

  const newtabApps = document.querySelector('.eon-newtab-apps');
  if (newtabApps && !newtabApps.querySelector('[data-admin-only="1"]')) {
    const adminBtn = document.createElement('button');
    adminBtn.className = 'eon-newtab-app-card';
    adminBtn.type = 'button';
    adminBtn.dataset.appUrl = '/admin.html';
    adminBtn.dataset.adminOnly = '1';
    adminBtn.innerHTML = '<span class="eon-newtab-app-icon">🛠️</span><span class="eon-newtab-app-label">Admin</span><span class="eon-newtab-app-desc">Operator console</span>';
    newtabApps.appendChild(adminBtn);
  }
}

// ============================================================
// EON Browser — Panel Drawer System
// ============================================================
const EON_PANELS = ['eon-panel-apps', 'eon-panel-passwords', 'eon-panel-history', 'eon-panel-bookmarks', 'eon-panel-aiactivity', 'eon-panel-accounts', 'eon-panel-models'];
let renderPasswordList = () => {};

/**
 * @param {string} id
 */
function openPanel(id) {
  closeAllPanels();
  const panel = document.getElementById(id);
  if (!panel) return;
  panel.hidden = false;
  if (id === 'eon-panel-history') renderHistoryPanel();
  if (id === 'eon-panel-bookmarks') renderBookmarksPanel();
  if (id === 'eon-panel-passwords') renderPasswordList();
}

function closeAllPanels() {
  EON_PANELS.forEach((id) => { const el = document.getElementById(id); if (el) el.hidden = true; });
}

// Expose panel controls globally so eon-browser-agent.js can use them
window.openPanel = openPanel;
window.closeAllPanels = closeAllPanels;

// Panel trigger buttons
document.getElementById('eon-apps-btn')?.addEventListener('click', () => openPanel('eon-panel-apps'));
document.getElementById('eon-pwdmgr-btn')?.addEventListener('click', () => openPanel('eon-panel-passwords'));
document.getElementById('eon-history-btn')?.addEventListener('click', () => openPanel('eon-panel-history'));
document.getElementById('eon-bookmarks-btn')?.addEventListener('click', () => openPanel('eon-panel-bookmarks'));
document.getElementById('browser-bookmark-current')?.addEventListener('click', bookmarkCurrentPage);

// Panel close buttons
document.getElementById('eon-panel-apps-close')?.addEventListener('click', closeAllPanels);
document.getElementById('eon-panel-pwds-close')?.addEventListener('click', closeAllPanels);
document.getElementById('eon-panel-history-close')?.addEventListener('click', closeAllPanels);
document.getElementById('eon-panel-bookmarks-close')?.addEventListener('click', closeAllPanels);
document.getElementById('eon-panel-accounts-close')?.addEventListener('click', closeAllPanels);
document.getElementById('eon-panel-models-close')?.addEventListener('click', closeAllPanels);
document.getElementById('eon-models-btn')?.addEventListener('click', () => openPanel('eon-panel-models'));
document.getElementById('eon-history-clear-btn')?.addEventListener('click', () => {
  localStorage.removeItem(EON_HISTORY_KEY);
  renderHistoryPanel();
});
document.getElementById('eon-bookmark-current-panel')?.addEventListener('click', bookmarkCurrentPage);
document.getElementById('eon-bookmarks-refresh')?.addEventListener('click', () => {
  renderSavedBookmarksBar();
  renderBookmarksPanel();
});
document.getElementById('eon-bookmark-save')?.addEventListener('click', () => {
  const title = String(getEl('eon-bookmark-title')?.value || '').trim();
  const url = String(getEl('eon-bookmark-url')?.value || '').trim();
  const icon = String(getEl('eon-bookmark-icon')?.value || '🔖').trim();
  const editId = String(getEl('eon-bookmark-save')?.dataset.editId || '').trim();
  if (!url) {
    setStatus('Enter a URL for the bookmark first.', false);
    return;
  }
  const payload = { id: editId || crypto.randomUUID(), title: title || url, url: normalizeUrl(url), icon: icon || '🔖' };
  const result = upsertBookmarkRow(payload);
  if (result.ok) {
    renderSavedBookmarksBar();
    renderBookmarksPanel();
    setBookmarkEditorState(null);
    setStatus(editId ? 'Bookmark updated.' : 'Bookmark saved.', true);
  } else {
    setStatus('Could not save bookmark.', false);
  }
});
document.getElementById('eon-bookmark-reset')?.addEventListener('click', () => {
  setBookmarkEditorState(null);
  setStatus('Bookmark editor reset.', true);
});
document.getElementById('browser-download-refresh')?.addEventListener('click', () => renderBrowserDownloadManager());
document.getElementById('browser-download-clear')?.addEventListener('click', () => {
  clearBrowserDownloads();
  setStatus('Download history cleared.', true);
});

// Close panels on Escape
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllPanels(); });

// ============================================================
// EON Browser — Password Vault (AES-GCM encrypted)
// ============================================================
(function initPasswordVault() {
  const PWD_STORE_KEY  = 'eon:vault:credentials:v1';
  const PWD_SALT_KEY   = 'eon:vault:salt:v1';
  const PIN_FAIL_KEY   = 'eon:vault:pin-fails:v1'; // sessionStorage — cleared on tab close
  const MAX_PIN_FAILS  = 5;
  const LOCKOUT_MS     = 30 * 60 * 1000; // 30 min
  const AUTO_LOCK_MS   = 10 * 60 * 1000; // 10 min inactivity
  /** @type {CryptoKey | null} */
  let vaultKey = null; // CryptoKey — null means locked
  /** @type {ReturnType<typeof setTimeout> | null} */
  let autoLockTimer = null;

  // ── Auto-lock on inactivity ───────────────────────────────────
  function resetAutoLock() {
    if (!vaultKey) return;
    if (autoLockTimer) clearTimeout(autoLockTimer);
    autoLockTimer = setTimeout(() => {
      vaultKey = null;
      if (autoLockTimer) clearTimeout(autoLockTimer);
      renderPasswordList();
      // Show subtle indicator rather than disruptive alert
      const statusEl = document.getElementById('eon-pwd-lock-screen');
      if (statusEl) {
        const msg = statusEl.querySelector('.eon-vault-auto-lock-msg');
        if (msg) msg.textContent = 'Vault auto-locked after 10 minutes of inactivity.';
      }
    }, AUTO_LOCK_MS);
  }
  ['mousemove', 'keydown', 'pointerdown', 'scroll'].forEach((evt) => {
    document.addEventListener(evt, resetAutoLock, { passive: true });
  });

  // ── PIN rate limiting ─────────────────────────────────────────
  function getPinFailState() {
    try {
      const raw = JSON.parse(sessionStorage.getItem(PIN_FAIL_KEY) || 'null');
      if (raw && typeof raw === 'object') return raw;
    } catch {}
    return { count: 0, lockedUntil: 0 };
  }
  /**
   * @param {any} state
   */
  function savePinFailState(state) {
    try { sessionStorage.setItem(PIN_FAIL_KEY, JSON.stringify(state)); } catch {}
  }
  function recordPinFail() {
    const state = getPinFailState();
    state.count = (state.count || 0) + 1;
    if (state.count >= MAX_PIN_FAILS) {
      state.lockedUntil = Date.now() + LOCKOUT_MS;
      state.count = 0; // reset counter so next lockout window starts fresh
    }
    savePinFailState(state);
    return state;
  }
  function clearPinFails() {
    try { sessionStorage.removeItem(PIN_FAIL_KEY); } catch {}
  }
  function isPinLockedOut() {
    const state = getPinFailState();
    if (state.lockedUntil && Date.now() < state.lockedUntil) {
      return Math.ceil((state.lockedUntil - Date.now()) / 60000); // minutes remaining
    }
    return 0;
  }

  function getSalt() {
    let salt = localStorage.getItem(PWD_SALT_KEY);
    if (!salt) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      salt = btoa(String.fromCharCode(...bytes));
      localStorage.setItem(PWD_SALT_KEY, salt);
    }
    const chars = atob(salt);
    return new Uint8Array(chars.split('').map((c) => c.charCodeAt(0)));
  }

  /**
   * @param {string} pin
   */
  async function deriveKey(pin) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pin), { name: 'PBKDF2' }, false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: getSalt(), iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * @param {CryptoKey} key
   * @param {string} data
   */
  async function encrypt(key, data) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(data));
    return { iv: btoa(String.fromCharCode(...iv)), ct: btoa(String.fromCharCode(...new Uint8Array(ct))) };
  }

  /**
   * @param {CryptoKey} key
   * @param {string} ivB64
   * @param {string} ctB64
   */
  async function decrypt(key, ivB64, ctB64) {
    const iv = new Uint8Array(atob(ivB64).split('').map((c) => c.charCodeAt(0)));
    const ct = new Uint8Array(atob(ctB64).split('').map((c) => c.charCodeAt(0)));
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return new TextDecoder().decode(plain);
  }

  function loadEncryptedStore() {
    try { return JSON.parse(localStorage.getItem(PWD_STORE_KEY) || '[]'); } catch { return []; }
  }

  /**
   * @param {any[]} rows
   */
  function saveEncryptedStore(rows) {
    try { localStorage.setItem(PWD_STORE_KEY, JSON.stringify(rows)); } catch {}
  }

  /**
   * @param {string} domain
   * @param {string} username
   * @param {string} password
   */
  async function addCredential(domain, username, password) {
    if (!vaultKey) return;
    const { iv, ct } = await encrypt(vaultKey, password);
    const rows = loadEncryptedStore();
    rows.push({ id: crypto.randomUUID(), domain: String(domain), username: String(username), iv, ct, ts: Date.now() });
    saveEncryptedStore(rows);
    renderPasswordList();
  }

  /**
   * @param {any} entry
   * @param {HTMLElement} el
   */
  async function revealPassword(entry, el) {
    if (!vaultKey) return;
    try {
      const plain = await decrypt(vaultKey, entry.iv, entry.ct);
      el.textContent = plain;
      setTimeout(() => { el.textContent = '••••••••'; }, 5000);
    } catch { el.textContent = '[decrypt failed]'; }
  }

  renderPasswordList = function renderPasswordList() {
    const lockScreen = document.getElementById('eon-pwd-lock-screen');
    const content = document.getElementById('eon-pwd-vault-content');
    const list = document.getElementById('eon-pwd-list');
    if (!content || !lockScreen || !list) return;
    if (!vaultKey) {
      lockScreen.hidden = false;
      content.hidden = true;
      return;
    }
    lockScreen.hidden = true;
    content.hidden = false;
    const rows = loadEncryptedStore();
    if (!rows.length) { list.innerHTML = '<p style="font-size:0.82rem;color:rgba(148,163,184,0.65);padding:0.5rem 0;">No saved credentials yet.</p>'; return; }
    list.innerHTML = '';
    rows.forEach((/** @type {any} */ entry) => {
      const el = document.createElement('div');
      el.className = 'eon-pwd-entry';
      const passEl = document.createElement('span');
      passEl.className = 'eon-pwd-entry-pass';
      passEl.textContent = '••••••••';
      passEl.title = 'Click to reveal';
      passEl.style.cursor = 'pointer';
      passEl.addEventListener('click', () => revealPassword(entry, passEl));
      el.innerHTML = `<span class="eon-pwd-entry-domain">${escapeHtml(entry.domain)}</span><span class="eon-pwd-entry-user">${escapeHtml(entry.username)}</span>`;
      el.appendChild(passEl);
      list.appendChild(el);
    });
  };

  window.renderPasswordList = renderPasswordList;

  // Unlock / set PIN
  document.getElementById('eon-pwd-pin-submit')?.addEventListener('click', async () => {
    const pinInput = /** @type {HTMLInputElement} */ (document.getElementById('eon-pwd-pin'));
    const pin = pinInput?.value?.trim() || '';
    if (pin.length < 4) { alert('PIN must be at least 4 characters.'); return; }

    // Rate limit check
    const minsLocked = isPinLockedOut();
    if (minsLocked > 0) {
      alert(`Too many failed attempts. Vault locked for ${minsLocked} more minute(s).`);
      if (pinInput) pinInput.value = '';
      return;
    }

    try {
      vaultKey = await deriveKey(pin);
      pinInput.value = '';
      clearPinFails();
      resetAutoLock();
      renderPasswordList();
    } catch {
      const state = recordPinFail();
      const failsLeft = MAX_PIN_FAILS - (state.count || 0);
      if (state.lockedUntil && Date.now() < state.lockedUntil) {
        alert(`Vault locked for 30 minutes after too many failed attempts.`);
      } else {
        alert(`Failed to unlock vault. ${failsLeft > 0 ? `${failsLeft} attempt(s) remaining before lockout.` : 'Try again.'}`);
      }
      if (pinInput) pinInput.value = '';
    }
  });

  document.getElementById('eon-pwd-pin')?.addEventListener('keydown', (e) => {
    if (/** @type {KeyboardEvent} */ (e).key === 'Enter') document.getElementById('eon-pwd-pin-submit')?.click();
  });

  // Add credential
  document.getElementById('eon-pwd-add-btn')?.addEventListener('click', async () => {
    const domain = /** @type {HTMLInputElement} */ (document.getElementById('eon-pwd-new-domain'))?.value?.trim() || '';
    const user   = /** @type {HTMLInputElement} */ (document.getElementById('eon-pwd-new-user'))?.value?.trim() || '';
    const pass   = /** @type {HTMLInputElement} */ (document.getElementById('eon-pwd-new-pass'))?.value || '';
    if (!domain || !user || !pass) { alert('Fill in domain, username, and password.'); return; }
    await addCredential(domain, user, pass);
    /** @type {HTMLInputElement} */ (document.getElementById('eon-pwd-new-domain')).value = '';
    /** @type {HTMLInputElement} */ (document.getElementById('eon-pwd-new-user')).value = '';
    /** @type {HTMLInputElement} */ (document.getElementById('eon-pwd-new-pass')).value = '';
  });

  // Lock vault
  document.getElementById('eon-pwd-lock-vault')?.addEventListener('click', () => {
    vaultKey = null;
    renderPasswordList();
  });

  // Initial render (shows lock screen)
  renderPasswordList();
})();
async function renderBrowserOpsPlaybook(id = 'lead_gen') {
  const box = getEl('browser-ops-plan');
  const status = getEl('browser-ops-status');
  if (!box || !status) return;
  const plan = buildBrowserPlaybookPlan(id);
  const broker = buildBrowserSessionBrokerSummary();
  status.textContent = plan.summary;
  box.innerHTML = `
    <div class="browser-ops-card">
      <div class="browser-ops-title">${esc(plan.label)}</div>
      <div class="browser-ops-sub">${esc(plan.summary)}</div>
      <div class="browser-ops-tags">
        ${(plan.trustLabels || []).map((label) => `<span class="browser-ops-tag">${esc(label)}</span>`).join('')}
      </div>
      <ul class="browser-ops-list">${(plan.steps || []).map((step) => `<li>${esc(step)}</li>`).join('')}</ul>
      <div class="browser-ops-broker">
        <strong>Session/account rail:</strong>
        ${esc(`attachments: ${broker.attachmentCount}, providers: ${broker.providers.join(', ') || 'none'}, saved credentials: ${broker.credentialCount}`)}
      </div>
      <div class="browser-ops-note">${esc(broker.reloginTruth)}</div>
      <div class="browser-ops-note">${(plan.truthNotes || []).map((note) => esc(note)).join(' ')}</div>
    </div>`;
}

function prepareSelectedBrowserPlaybook() {
  const select = getEl('browser-ops-playbook');
  const id = String(select?.value || 'lead_gen');
  void renderBrowserOpsPlaybook(id);
  setStatus(`Prepared playbook: ${id}`, true);
}



getEl('browser-ops-prepare')?.addEventListener('click', prepareSelectedBrowserPlaybook);
void renderBrowserOpsPlaybook(String(getEl('browser-ops-playbook')?.value || 'lead_gen'));
