/**
 * Tool Registry — EONAPP.CH Agent Tools
 * ======================================
 * Provides agent step handlers with callable tools:
 *   - webSearch(query)       → Jina Reader search (free, no key)
 *   - readUrl(url)           → Jina Reader fetch (free, no key)
 *   - readManyUrls(urls)     → batch reader for token-efficient research packs
 *   - extractPageSignals(url)→ lightweight structured signals from readable page text
 *   - summarizeUrl(url)      → compact digest + signals for a single page
 *   - readContract(...)      → Alchemy JSON-RPC eth_call (Polygon Mainnet)
 *   - listTools()            → introspect available tools
 *
 * All tools are decentral-first: no backend required, no central DB.
 * Optional Alchemy credentials are read only through the encrypted key-vault API; plaintext localStorage aliases are ignored.
 */

import { ApiKeyVault } from './api-key-vault.js';

const JINA_SEARCH_BASE = 'https://s.jina.ai/';
const JINA_READ_BASE = 'https://r.jina.ai/';
const POLYGON_RPC = 'https://polygon-rpc.com'; // Free public RPC — no key needed
const ALCHEMY_RPC_BASE = 'https://polygon-mainnet.g.alchemy.com/v2/';

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_CONTENT_CHARS = 16_000;

/** Read Alchemy API key from vault settings (user-provided, never hardcoded) */
async function _getAlchemyKey() {
  try { return String(await ApiKeyVault.retrieve('alchemy') || '').trim(); }
  catch { return ''; }
}

/** Timeout-wrapped fetch
 * @param {string} url
 * @param {RequestInit} [options]
 */
async function _fetch(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return resp;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── Tool: webSearch ──────────────────────────────────────────────────────────

/**
 * Search the web using Jina Reader's free search endpoint.
 * Returns up to MAX_CONTENT_CHARS of text results.
 *
 * @param {string} query — Search query
 * @param {{ maxChars?: number }} [opts]
 * @returns {Promise<{ ok: boolean, content: string, source: string, error?: string }>}
 */
export async function webSearch(query, opts = {}) {
  const q = String(query || '').trim().slice(0, 500);
  if (!q) return { ok: false, content: '', source: 'webSearch', error: 'Empty query' };

  const maxChars = opts.maxChars ?? MAX_CONTENT_CHARS;
  const url = JINA_SEARCH_BASE + encodeURIComponent(q);

  try {
    const resp = await _fetch(url, {
      headers: { Accept: 'text/plain', 'X-Respond-With': 'no-references' }
    });
    if (!resp.ok) throw new Error(`Jina search ${resp.status}`);
    const text = (await resp.text()).slice(0, maxChars);
    return { ok: true, content: text, source: `jina-search:${q}` };
  } catch (err) {
    const error = /** @type {any} */ (err);
    return { ok: false, content: '', source: 'webSearch', error: String(error?.message || err) };
  }
}

// ─── Tool: readUrl ────────────────────────────────────────────────────────────

/**
 * Read the main content of a URL using Jina Reader's free reader endpoint.
 * Strips HTML, returns clean prose text.
 *
 * @param {string} url — Full URL to read
 * @param {{ maxChars?: number }} [opts]
 * @returns {Promise<{ ok: boolean, content: string, source: string, error?: string }>}
 */
export async function readUrl(url, opts = {}) {
  const rawUrl = String(url || '').trim();
  if (!rawUrl) return { ok: false, content: '', source: 'readUrl', error: 'Empty URL' };

  const maxChars = opts.maxChars ?? MAX_CONTENT_CHARS;
  // Jina Reader strips leading https:// from the path
  const normalized = rawUrl.replace(/^https?:\/\//i, '');
  const jinaUrl = `${JINA_READ_BASE}${normalized}`;

  try {
    const resp = await _fetch(jinaUrl, {
      headers: { Accept: 'text/plain' }
    });
    if (!resp.ok) throw new Error(`Jina read ${resp.status}`);
    const text = (await resp.text()).slice(0, maxChars);
    return { ok: true, content: text, source: `jina-read:${rawUrl}` };
  } catch (err) {
    const error = /** @type {any} */ (err);
    return { ok: false, content: '', source: 'readUrl', error: String(error?.message || err) };
  }
}

// ─── Tool: readManyUrls ───────────────────────────────────────────────────────

/**
 * Read multiple URLs and return a compact research pack.
 * Useful for agents that want to reduce repeated per-URL prompting overhead.
 *
 * @param {string[] | string} urls
 * @param {{ maxChars?: number }} [opts]
 * @returns {Promise<{ ok: boolean, content: string, sources: string[], error?: string }>}
 */
export async function readManyUrls(urls, opts = {}) {
  const list = Array.isArray(urls) ? urls : String(urls || '').split('\n').map((value) => value.trim()).filter(Boolean);
  const normalized = list
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .slice(0, 5);
  if (!normalized.length) return { ok: false, content: '', sources: [], error: 'No URLs provided' };

  const maxChars = opts.maxChars ?? MAX_CONTENT_CHARS;
  const rows = [];
  const sources = [];

  for (const url of normalized) {
    const result = await readUrl(url, { maxChars: Math.max(3000, Math.floor(maxChars / normalized.length)) });
    if (!result.ok) continue;
    rows.push(`URL: ${url}\n${result.content}`.trim());
    sources.push(result.source);
  }

  const content = rows.join('\n\n---\n\n').slice(0, maxChars);
  return content
    ? { ok: true, content, sources }
    : { ok: false, content: '', sources, error: 'No readable content found' };
}

/**
 * @param {string} text
 */
function _extractSignalsFromReadableText(text) {
  const lines = String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const headings = lines.filter((line) => line.length <= 90 && /[A-Za-z\u00C0-\u024F\u0400-\u04FF\u4E00-\u9FFF]/.test(line)).slice(0, 8);
  const bullets = lines.filter((line) => /^[-*•]\s+/.test(line)).slice(0, 8);
  const paragraph = lines.find((line) => line.length > 90) || '';
  return {
    headings,
    bullets,
    paragraph: paragraph.slice(0, 600),
    wordCount: lines.join(' ').split(/\s+/).filter(Boolean).length
  };
}

// ─── Tool: extractPageSignals ────────────────────────────────────────────────

/**
 * Read a URL and return structured page signals useful for agent routing.
 *
 * @param {string} url
 * @returns {Promise<{ ok: boolean, content: string, signals?: any, source: string, error?: string }>}
 */
export async function extractPageSignals(url) {
  const result = await readUrl(url, { maxChars: MAX_CONTENT_CHARS });
  if (!result.ok) return { ok: false, content: '', source: 'extractPageSignals', error: result.error || 'Read failed' };

  const signals = _extractSignalsFromReadableText(result.content);
  return {
    ok: true,
    content: result.content,
    source: result.source,
    signals
  };
}

// ─── Tool: summarizeUrl ─────────────────────────────────────────────────────

/**
 * Read a URL and return a compact digest with structured signals.
 * Better for agent routing than raw prose when the user only needs the gist.
 *
 * @param {string} url
 * @param {{ maxChars?: number }} [opts]
 * @returns {Promise<{ ok: boolean, summary: string, signals?: any, source: string, error?: string }>}
 */
export async function summarizeUrl(url, opts = {}) {
  const result = await readUrl(url, { maxChars: opts.maxChars ?? MAX_CONTENT_CHARS });
  if (!result.ok) return { ok: false, summary: '', source: 'summarizeUrl', error: result.error || 'Read failed' };

  const signals = _extractSignalsFromReadableText(result.content);
  const summary = [
    signals.headings[0] || '',
    signals.paragraph || result.content.slice(0, 420),
    signals.bullets.slice(0, 3).join(' | ')
  ].filter(Boolean).join('\n\n').slice(0, opts.maxChars ?? 6000);

return {
    ok: true,
    summary,
    source: 'tool-registry',
    signals
  };
}

// ─── Tool: readContract ───────────────────────────────────────────────────────

/**
 * Call a read-only smart contract function on Polygon Mainnet via JSON-RPC.
 * Uses Alchemy if user has a key in Vault; falls back to public Polygon RPC.
 *
 * @param {string} address — Contract address (0x...)
 * @param {string} data — Encoded call data (4-byte selector + ABI-encoded params)
 * @returns {Promise<{ ok: boolean, result: string, source: string, error?: string }>}
 */
export async function readContract(address, data) {
  const alchemyKey = await _getAlchemyKey();
  const rpc = alchemyKey ? `${ALCHEMY_RPC_BASE}${alchemyKey}` : POLYGON_RPC;

  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_call',
    params: [{ to: address, data }, 'latest']
  };

  try {
    const resp = await _fetch(rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error(`RPC ${resp.status}`);
    const json = await resp.json();
    if (json.error) throw new Error(json.error.message || 'RPC error');
    return { ok: true, result: json.result || '0x', source: alchemyKey ? 'alchemy' : 'polygon-rpc' };
  } catch (err) {
    const error = /** @type {any} */ (err);
    return { ok: false, result: '0x', source: 'readContract', error: String(error?.message || err) };
  }
}

// ─── Tool: introspect ─────────────────────────────────────────────────────────

/**
 * Returns a list of available tool names and their one-line descriptions.
 * Used by agent planning steps to know what tools exist.
 *
 * @returns {{ name: string, description: string }[]}
 */
export function listTools() {
  return [
    { name: 'webSearch', description: 'Search the web via Jina Reader (free). Returns prose text of top results.' },
    { name: 'readUrl', description: 'Fetch and clean main content from any URL via Jina Reader (free).' },
    { name: 'readManyUrls', description: 'Read multiple URLs and combine them into one compact research pack.' },
    { name: 'extractPageSignals', description: 'Read a URL and return structured page signals such as headings, bullets, and word count.' },
    { name: 'summarizeUrl', description: 'Read a URL and return a compact digest plus structured signals for routing.' },
    { name: 'readContract', description: 'Call a read-only Polygon smart contract function via JSON-RPC.' }
  ];
}

// ─── Convenience: researchTopic ───────────────────────────────────────────────

/**
 * High-level research helper used by agent-executor's research step.
 * Tries webSearch first; if that fails or returns short content, also reads top URL.
 *
 * @param {string} topic
 * @returns {Promise<{ ok: boolean, content: string, sources: string[] }>}
 */
export async function researchTopic(topic) {
  const searchResult = await webSearch(topic);
  const sources = [];
  let combined = '';

  if (searchResult.ok && searchResult.content.length > 200) {
    combined += searchResult.content;
    sources.push(searchResult.source);
  } else {
    // Fallback: try reading a relevant URL from Jina search
    const fallback = await readUrl(`https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/\s+/g, '_'))}`);
    if (fallback.ok) {
      combined += fallback.content;
      sources.push(fallback.source);
    }
  }

  return {
    ok: combined.length > 50,
    content: combined.slice(0, MAX_CONTENT_CHARS),
    sources
  };
}
