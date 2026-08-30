/**
 * IPFS Gateway Client — Vanilla JS
 * ===================================
 * Adapted from eonpackage/src/lib/ipfsGatewayClient.ts
 *
 * Features (mirroring eonpackage's 21-gateway architecture):
 * - 8 public gateways: 5 IPFS + 3 Arweave (browser-safe subset)
 * - Local IPFS node support (Kubo HTTP API at 127.0.0.1:5001)
 * - Latency-based gateway selection (fastest first)
 * - Health tracking + circuit breaker (blacklist on 3 failures, 5-min cooldown)
 * - Automatic retry with exponential backoff
 * - CID v0 + v1 validation
 * - 5s timeout per gateway attempt
 * - Pure fetch() — no npm, no local IPFS node required
 *
 * WRITE ARCHITECTURE (decentralized, user-owned by default):
 * - Primary: Local IPFS node (Kubo daemon) via HTTP API
 * - Default policy: no public gateway writes for user data
 * - Optional escape hatch: public gateway writes require explicit opt-in
 * - Project IPFS/IPNS should stay reserved for static app releases and token metadata
 * - Users pin their own content on their own IPFS node when they choose IPFS backup
 *
 * Use cases in EONAPP.CH:
 * - Read epoch snapshots from IPFS (archived by backend)
 * - Optional vault export backup to a user-owned IPFS node
 * - Read NFT metadata CIDs
 * - P2P content sharing via user-owned IPFS CIDs
 *
 * @module utils/ipfs-gateway
 */

const /** @type {any} */
IPFS_GATEWAYS = [
  'https://ipfs.io',
  'https://dweb.link',
  'https://w3s.link',
  'https://nftstorage.link',
  'https://cloudflare-ipfs.com'
];

const /** @type {any} */
ARWEAVE_GATEWAYS = [
  'https://arweave.net',
  'https://g8way.io',
  'https://ar-io.dev'
];

// All readable gateways — order sets initial priority
const /** @type {any} */
ALL_GATEWAYS = [...IPFS_GATEWAYS, ...ARWEAVE_GATEWAYS];

const GATEWAY_TIMEOUT_MS = 5000;
const MAX_RETRIES_PER_GATEWAY = 2;
const BLACKLIST_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const LOCAL_IPFS_API = 'http://127.0.0.1:5001'; // Kubo daemon HTTP API
const LOCAL_IPFS_API_KEY = 'eon:ipfs-local-api:v1';

// CID v0 (Qm...) and CID v1 (bafy...) patterns — from eonpackage
const CID_V0_RE = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
const CID_V1_RE = /^bafy[a-z2-7]{55}$/;
const ARWEAVE_TX_RE = /^[a-zA-Z0-9_-]{43}$/;

// ─── Gateway health tracking ─────────────────────────────────────────────────

const /** @type {any} */
_health = new Map(
  ALL_GATEWAYS.map((/** @type {any} */ url) => [url, {
    url,
    successes: 0,
    failures: 0,
    avgLatencyMs: 0,
    lastSuccessAt: 0,
    lastFailureAt: 0,
    blacklistedUntil: 0
  }])
);

function _recordSuccess(/** @type {any} */ url, /** @type {any} */ latencyMs) {
  const h = _health.get(url);
  if (!h) return;
  const n = h.successes;
  h.successes += 1;
  h.avgLatencyMs = ((h.avgLatencyMs * n) + latencyMs) / h.successes;
  h.lastSuccessAt = Date.now();
  h.blacklistedUntil = 0; // clear blacklist on success
  h.failures = 0;
}

function _recordFailure(/** @type {any} */ url) {
  const h = _health.get(url);
  if (!h) return;
  h.failures += 1;
  h.lastFailureAt = Date.now();
  if (h.failures >= 3) {
    h.blacklistedUntil = Date.now() + BLACKLIST_DURATION_MS;
  }
}

function _availableGateways() {
  const now = Date.now();
  return ALL_GATEWAYS
    .filter((/** @type {any} */ url) => {
      const h = _health.get(url);
      if (!h) return true;
      if (h.blacklistedUntil > now) return false;
      return true;
    })
    .sort((/** @type {any} */ a, /** @type {any} */ b) => {
      const ha = _health.get(a);
      const hb = _health.get(b);
      // Score = success_rate − (avgLatency / 2000). Higher is better.
      const total_a = (ha.successes + ha.failures) || 1;
      const total_b = (hb.successes + hb.failures) || 1;
      const score_a = (ha.successes / total_a) - (ha.avgLatencyMs / 2000);
      const score_b = (hb.successes / total_b) - (hb.avgLatencyMs / 2000);
      return score_b - score_a;
    });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function isValidCid(/** @type {any} */ value) {
  const v = String(value || '').trim();
  return CID_V0_RE.test(v) || CID_V1_RE.test(v);
}

export function isValidArweaveTx(/** @type {any} */ value) {
  return ARWEAVE_TX_RE.test(String(value || '').trim());
}

async function _fetchWithTimeout(/** @type {any} */ url, /** @type {any} */ init = {}, /** @type {any} */ timeoutMs = GATEWAY_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (/** @type {any} */
error) {
    if (error.name === 'AbortError') throw new Error(`Gateway timeout: ${url}`);
    throw error;
  } finally {
    clearTimeout(tid);
  }
}

function _sleep(/** @type {any} */ ms) {
  return new Promise((/** @type {any} */ r) => setTimeout(r, ms));
}

function _normalizeLocalApi(/** @type {any} */ value) {
  const fallback = LOCAL_IPFS_API;
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  try {
    const parsed = new URL(raw);
    if (!/^https?:$/i.test(parsed.protocol)) return fallback;
    const host = parsed.hostname.toLowerCase();
    const isLoopback =
      host === 'localhost' ||
      host === '::1' ||
      host === '127.0.0.1' ||
      host.startsWith('127.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
    if (!isLoopback) return fallback;
    parsed.pathname = parsed.pathname.replace(/\/$/, '');
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return fallback;
  }
}

export function getLocalIpfsApi() {
  try {
    return _normalizeLocalApi(localStorage.getItem(LOCAL_IPFS_API_KEY) || LOCAL_IPFS_API);
  } catch {
    return LOCAL_IPFS_API;
  }
}

export function setLocalIpfsApi(/** @type {any} */ endpoint) {
  const normalized = _normalizeLocalApi(endpoint);
  try {
    if (!endpoint || String(endpoint).trim() === '' || normalized === LOCAL_IPFS_API) {
      localStorage.removeItem(LOCAL_IPFS_API_KEY);
    } else {
      localStorage.setItem(LOCAL_IPFS_API_KEY, normalized);
    }
  } catch {}
  return normalized;
}

/**
 * Check if a local IPFS node (Kubo daemon) is running.
 * @returns {Promise<boolean>}
 */
export async function isLocalNodeAvailable() {
  try {
    const localApi = getLocalIpfsApi();
    const res = await _fetchWithTimeout(`${localApi}/api/v0/id`, { method: 'POST' }, 3000);
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Read: cat ───────────────────────────────────────────────────────────────

/**
 * Fetch content from IPFS by CID.
 * Tries all healthy gateways with retry + exponential backoff.
 *
 * @param {string} cid - IPFS CID (v0 Qm... or v1 bafy...)
 * @param {{ timeout?: number }} opts
 * @returns {Promise<string>} raw content string
 */
export async function cat(/** @type {any} */ cid, /** @type {any} */ opts = {}) {
  if (!isValidCid(cid)) throw new Error(`Invalid IPFS CID: ${cid}`);
  const timeout = opts.timeout || GATEWAY_TIMEOUT_MS;
  const gateways = _availableGateways().filter((/** @type {any} */ g) => !g.includes('arweave'));
  if (gateways.length === 0) throw new Error('All IPFS gateways are blacklisted. Try again shortly.');

  let lastError = null;
  for (const /** @type {any} */
gw of gateways) {
    for (let attempt = 0; attempt < MAX_RETRIES_PER_GATEWAY; attempt += 1) {
      try {
        const url = `${gw}/ipfs/${cid}`;
        const start = Date.now();
        const res = await _fetchWithTimeout(url, {}, timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        _recordSuccess(gw, Date.now() - start);
        return text;
      } catch (/** @type {any} */
error) {
        lastError = error;
        if (attempt < MAX_RETRIES_PER_GATEWAY - 1) {
          await _sleep(500 * Math.pow(2, attempt));
        } else {
          _recordFailure(gw);
        }
      }
    }
  }
  throw new Error(`All IPFS gateways failed. Last error: ${lastError?.message}`);
}

/**
 * Fetch content from Arweave by transaction ID.
 *
 * @param {string} txId - Arweave transaction ID (43 chars)
 * @returns {Promise<string>} raw content string
 */
export async function catArweave(/** @type {any} */ txId, /** @type {any} */ opts = {}) {
  if (!isValidArweaveTx(txId)) throw new Error(`Invalid Arweave TX: ${txId}`);
  const timeout = opts.timeout || GATEWAY_TIMEOUT_MS;
  const gateways = _availableGateways().filter((/** @type {any} */ g) => g.includes('arweave') || g.includes('g8way') || g.includes('ar-io'));
  const allArweave = gateways.length > 0 ? gateways : ARWEAVE_GATEWAYS;

  let lastError = null;
  for (const /** @type {any} */
gw of allArweave) {
    for (let attempt = 0; attempt < MAX_RETRIES_PER_GATEWAY; attempt += 1) {
      try {
        const url = `${gw}/${txId}`;
        const start = Date.now();
        const res = await _fetchWithTimeout(url, {}, timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        _recordSuccess(gw, Date.now() - start);
        return text;
      } catch (/** @type {any} */
error) {
        lastError = error;
        if (attempt < MAX_RETRIES_PER_GATEWAY - 1) {
          await _sleep(500 * Math.pow(2, attempt));
        } else {
          _recordFailure(gw);
        }
      }
    }
  }
  throw new Error(`All Arweave gateways failed. Last error: ${lastError?.message}`);
}

// ─── Write: add ──────────────────────────────────────────────────────────────

/**
 * Upload content to IPFS — decentralized, no third-party pinning service.
 *
 * Write order (decentralized-first):
 * 1. Local IPFS node (Kubo daemon) — user's own node, content pinned locally
 * 2. Public IPFS gateways — community-maintained, no API key needed
 *
 * No Pinata or other centralized pinning service is used.
 * Users who want reliable pinning should run their own IPFS node.
 *
 * @param {string|Uint8Array} content - content to store
 * @param {{ pin?: boolean, allowPublicWrite?: boolean }} opts - pin locally (default true when using local node); public writes require explicit opt-in
 * @returns {Promise<{ cid: string, gateway: string, latencyMs: number, local: boolean }>}
 */
export async function add(/** @type {any} */ content, /** @type {any} */ opts = {}) {
  const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new Error('Content too large (max 10 MB).');

  // Try local IPFS node first (decentralized, user's own node)
  const localResult = await _addViaLocalNode(bytes, opts.pin !== false);
  if (localResult) return localResult;

  if (opts.allowPublicWrite !== true) {
    throw new Error('IPFS write requires a user-owned local IPFS node. Public gateway writes are disabled by default so project IPFS/IPNS stays limited to static app releases and token metadata.');
  }

  // Fallback: try public IPFS gateways that support /api/v0/add
  const /** @type {any} */
  writeGateways = ['https://ipfs.io', 'https://dweb.link'];
  let lastError = null;
  for (const /** @type {any} */
  gw of writeGateways) {
    try {
      const start = Date.now();
      const form = new FormData();
      const blobBytes = bytes instanceof Uint8Array ? bytes.slice().buffer : bytes;
      form.append('file', new Blob([blobBytes]), 'file');
      const res = await _fetchWithTimeout(`${gw}/api/v0/add`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = _parseAddResponse(text);
      if (!parsed.Hash || !isValidCid(parsed.Hash)) throw new Error('Invalid CID in response.');
      _recordSuccess(gw, Date.now() - start);
      return { cid: parsed.Hash, gateway: gw, latencyMs: Date.now() - start, local: false };
    } catch (/** @type {any} */
error) {
      lastError = error;
      _recordFailure(gw);
    }
  }
  throw new Error(`IPFS write failed. No local node running and public gateways unavailable. Start 'ipfs daemon' for reliable decentralized uploads. Last: ${lastError?.message}`);
}

async function _addViaLocalNode(/** @type {any} */ bytes, /** @type {any} */ pin = true) {
  try {
    const start = Date.now();
    const localApi = getLocalIpfsApi();
    const blobBytes = bytes instanceof Uint8Array ? bytes.slice().buffer : bytes;
    const form = new FormData();
    form.append('file', new Blob([blobBytes]), 'eonapp-content');
    const res = await _fetchWithTimeout(`${localApi}/api/v0/add${pin ? '?pin=true' : ''}`, {
      method: 'POST',
      body: form
    }, 15000);
    if (!res.ok) return null; // Local node not available or error
    const data = await res.json();
    if (!data.Hash || !isValidCid(data.Hash)) return null;
    return { cid: data.Hash, gateway: 'local-ipfs-node', latencyMs: Date.now() - start, local: true };
  } catch {
    return null; // Local node not running — graceful fallback
  }
}

function _parseAddResponse(/** @type {any} */ text) {
  const lines = text.split(/\r?\n/).map((/** @type {any} */ l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try { return JSON.parse(lines[i]); } catch { /* continue */ }
  }
  return { Hash: text.trim() };
}

// ─── Third-party provider support ────────────────────────────────────────────

const PROVIDER_CONFIG_KEY = 'eon:ipfs-provider:v2';

/** @type {Record<string, { label: string, hint: string, hasKey: boolean, keyLabel?: string, signupUrl: string, uploadUrl: string }>} */
export const /** @type {any} */
PROVIDER_DEFS = {
  local: {
    label: 'Local IPFS Node',
    hint: 'Run Kubo daemon on your machine — fully decentralized, no account needed.',
    hasKey: false,
    keyLabel: '',
    signupUrl: 'https://docs.ipfs.tech/install/command-line/',
    uploadUrl: ''
  },
  pinata: {
    label: 'Pinata',
    hint: 'Most popular IPFS pinning service. Free tier: 1 GB. Reliable global CDN.',
    hasKey: true,
    keyLabel: 'Pinata JWT',
    signupUrl: 'https://app.pinata.cloud/register',
    uploadUrl: 'https://api.pinata.cloud/pinning/pinFileToIPFS'
  },
  nftstorage: {
    label: 'NFT.Storage',
    hint: 'Free NFT/metadata storage built on Filecoin + IPFS. No size limit on NFT metadata.',
    hasKey: true,
    keyLabel: 'NFT.Storage API Token',
    signupUrl: 'https://nft.storage',
    uploadUrl: 'https://api.nft.storage/upload'
  },
  web3storage: {
    label: 'Web3.Storage',
    hint: 'Filecoin + IPFS storage with 5 GiB free. Great for large vault backups.',
    hasKey: true,
    keyLabel: 'Web3.Storage API Token',
    signupUrl: 'https://console.web3.storage',
    uploadUrl: 'https://api.web3.storage/upload'
  }
};

/**
 * Get the currently configured IPFS provider and API key.
 * @returns {{ provider: string, apiKey: string, rememberOnDevice: boolean }}
 */
export function getProviderConfig() {
  try {
    const raw = localStorage.getItem(PROVIDER_CONFIG_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed.provider === 'string') {
      return { ...parsed, rememberOnDevice: true };
    }
  } catch { /* ignore */ }
  try {
    const sessionRaw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(PROVIDER_CONFIG_KEY) : null;
    const sessionParsed = sessionRaw ? JSON.parse(sessionRaw) : null;
    if (sessionParsed && typeof sessionParsed.provider === 'string') {
      return { ...sessionParsed, rememberOnDevice: false };
    }
  } catch { /* ignore */ }
  return { provider: 'local', apiKey: '', rememberOnDevice: false };
}

/**
 * Save IPFS provider config.
 * Session storage is the default; set rememberOnDevice=true to persist locally.
 * @param {{ provider: string, apiKey: string }} config
 * @param {boolean} [rememberOnDevice=false]
 */
export function setProviderConfig(/** @type {any} */ { provider, apiKey }, /** @type {any} */ rememberOnDevice = false) {
  const payload = JSON.stringify({
    provider: provider || 'local',
    apiKey: (apiKey || '').trim()
  });
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(PROVIDER_CONFIG_KEY, payload);
    }
  } catch { /* ignore */ }
  try {
    if (rememberOnDevice) localStorage.setItem(PROVIDER_CONFIG_KEY, payload);
    else localStorage.removeItem(PROVIDER_CONFIG_KEY);
  } catch { /* ignore */ }
}

/**
 * Test the connection to the currently configured provider.
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
export async function testProviderConnection() {
  const { provider, apiKey } = getProviderConfig();
  try {
    if (provider === 'local') {
      const ok = await isLocalNodeAvailable();
      return { ok, message: ok ? 'Local IPFS node is reachable.' : 'Local node not reachable. Make sure Kubo daemon is running (ipfs daemon).' };
    }
    if (provider === 'pinata') {
      const res = await _fetchWithTimeout('https://api.pinata.cloud/data/testAuthentication', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      }, 8000);
      if (res.ok) return { ok: true, message: 'Pinata authentication successful.' };
      return { ok: false, message: `Pinata auth failed (${res.status}). Check your JWT.` };
    }
    if (provider === 'nftstorage') {
      const res = await _fetchWithTimeout('https://api.nft.storage', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      }, 8000);
      if (res.ok) return { ok: true, message: 'NFT.Storage token valid.' };
      return { ok: false, message: `NFT.Storage auth failed (${res.status}). Check your API token.` };
    }
    if (provider === 'web3storage') {
      const res = await _fetchWithTimeout('https://api.web3.storage/user/account', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      }, 8000);
      if (res.ok) return { ok: true, message: 'Web3.Storage token valid.' };
      return { ok: false, message: `Web3.Storage auth failed (${res.status}). Check your API token.` };
    }
  } catch (/** @type {any} */ err) {
    return { ok: false, message: `Connection error: ${err?.message || 'unknown'}` };
  }
  return { ok: false, message: 'Unknown provider.' };
}

/**
 * Upload content using the configured third-party provider.
 * Falls back to local node if provider is 'local'.
 * @param {string|Uint8Array} content
 * @returns {Promise<{ cid: string, gateway: string, latencyMs: number, local: boolean }>}
 */
export async function addViaProvider(/** @type {any} */ content) {
  const { provider, apiKey } = getProviderConfig();
  const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new Error('Content too large (max 10 MB).');

  const start = Date.now();

  if (provider === 'local') {
    const result = await _addViaLocalNode(bytes, true);
    if (result) return result;
    throw new Error('Local IPFS node is not running. Start Kubo with: ipfs daemon');
  }

  if (!apiKey) throw new Error(`No API key set for ${PROVIDER_DEFS[provider]?.label || provider}.`);

  if (provider === 'pinata') {
    const form = new FormData();
    const blobBytes = bytes instanceof Uint8Array ? bytes.slice().buffer : bytes;
    form.append('file', new Blob([blobBytes]), 'eonapp-vault.json');
    const res = await _fetchWithTimeout('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: form
    }, 30000);
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Pinata upload failed (${res.status}): ${err.slice(0, 120)}`);
    }
    const data = await res.json();
    if (!data.IpfsHash || !isValidCid(data.IpfsHash)) throw new Error('Invalid CID in Pinata response.');
    return { cid: data.IpfsHash, gateway: 'pinata', latencyMs: Date.now() - start, local: false };
  }

  if (provider === 'nftstorage') {
    const blobBytes = bytes instanceof Uint8Array ? bytes.slice().buffer : bytes;
    const res = await _fetchWithTimeout('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/octet-stream'
      },
      body: blobBytes
    }, 30000);
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`NFT.Storage upload failed (${res.status}): ${err.slice(0, 120)}`);
    }
    const data = await res.json();
    if (!data.value?.cid) throw new Error('Invalid CID in NFT.Storage response.');
    return { cid: data.value.cid, gateway: 'nftstorage', latencyMs: Date.now() - start, local: false };
  }

  if (provider === 'web3storage') {
    const form = new FormData();
    const blobBytes = bytes instanceof Uint8Array ? bytes.slice().buffer : bytes;
    form.append('file', new Blob([blobBytes]), 'eonapp-vault.json');
    const res = await _fetchWithTimeout('https://api.web3.storage/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: form
    }, 30000);
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Web3.Storage upload failed (${res.status}): ${err.slice(0, 120)}`);
    }
    const data = await res.json();
    if (!data.cid) throw new Error('Invalid CID in Web3.Storage response.');
    return { cid: data.cid, gateway: 'web3storage', latencyMs: Date.now() - start, local: false };
  }

  throw new Error(`Unsupported IPFS provider: ${provider}`);
}

// ─── Public stats ─────────────────────────────────────────────────────────────

/**
 * Returns health stats for all gateways.
 * @returns {Array<{ url: any, successRate: any, avgLatencyMs: any, blacklisted: any }>}
 */
export function getGatewayStats() {
  const now = Date.now();
  return Array.from(_health.values()).map((/** @type {any} */ h) => ({
    url: h.url,
    successRate: h.successes / ((h.successes + h.failures) || 1),
    avgLatencyMs: Math.round(h.avgLatencyMs),
    blacklisted: h.blacklistedUntil > now,
    lastSuccessAt: h.lastSuccessAt ? new Date(h.lastSuccessAt).toISOString() : null
  }));
}
