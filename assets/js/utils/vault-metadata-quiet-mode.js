/**
 * vault-metadata-quiet-mode.js — W21 quiet metadata policy for Vault collectibles.
 * Keeps demo/test drops local and prevents gateway fan-out without explicit metadata URIs.
 */

const QUIET_STATS_KEY = 'eon:vault-metadata-quiet-stats:v1';
const SAFE_SAME_ORIGIN_PATHS = [/^\/loot\//i, /^\/assets\/data\//i, /^\/metadata\//i];

function readStats() {
  try { return JSON.parse(localStorage.getItem(QUIET_STATS_KEY) || '{}') || {}; } catch { return {}; }
}

function writeStats(stats) {
  try { localStorage.setItem(QUIET_STATS_KEY, JSON.stringify(stats)); } catch {}
}

function isDemoLike(item = {}) {
  const haystack = [item.origin, item.source, item.category, item.type, item.instanceId, item.id, item.name, item.title]
    .map((value) => String(value || '').toLowerCase())
    .join('|');
  return /demo|preview|sample|test|mock|local-only/.test(haystack) || item.demo === true || item.preview === true || item.liquidatable === false;
}

function normalizeUri(uri = '') {
  return String(uri || '').trim();
}

export function classifyVaultMetadataRequest(item = {}) {
  const uri = normalizeUri(item.metadataUri || item.uri || item.metadata_url);
  if (isDemoLike(item)) {
    return { allow: false, reason: 'demo-preview-local-only', uri };
  }
  if (!uri) {
    return { allow: false, reason: 'missing-explicit-metadata-uri', uri };
  }
  if (/^ipns:\/\//i.test(uri)) {
    return { allow: false, reason: 'ipns-disabled-launch-safety', uri };
  }
  if (/^ipfs:\/\//i.test(uri)) {
    return { allow: true, reason: 'explicit-ipfs-uri', uri };
  }
  if (/^https:\/\/arweave\.net\//i.test(uri)) {
    return { allow: true, reason: 'explicit-arweave-uri', uri };
  }
  if (/^https:\/\/eonapp\.ch\//i.test(uri)) {
    return { allow: true, reason: 'same-origin-production-uri', uri };
  }
  if (/^\//.test(uri) && SAFE_SAME_ORIGIN_PATHS.some((pattern) => pattern.test(uri))) {
    return { allow: true, reason: 'same-origin-safe-path', uri };
  }
  if (/^https?:\/\//i.test(uri)) {
    return { allow: false, reason: 'external-http-metadata-needs-user-retry', uri };
  }
  return { allow: false, reason: 'unsupported-metadata-uri', uri };
}

export function shouldHydrateVaultMetadata(item = {}) {
  return classifyVaultMetadataRequest(item).allow;
}

export function markQuietMetadataSkip(item = {}, reason = '') {
  const stats = readStats();
  const key = reason || classifyVaultMetadataRequest(item).reason || 'unknown';
  stats[key] = (stats[key] || 0) + 1;
  stats.updatedAt = new Date().toISOString();
  writeStats(stats);
  return stats;
}

export function getQuietMetadataStats() {
  return readStats();
}

export function buildQuietMetadataStatus() {
  const stats = readStats();
  const skipped = Object.entries(stats)
    .filter(([key]) => key !== 'updatedAt')
    .reduce((sum, [, value]) => sum + Number(value || 0), 0);
  return {
    skipped,
    updatedAt: stats.updatedAt || null,
    label: skipped ? `${skipped} noisy metadata lookup${skipped === 1 ? '' : 's'} kept local` : 'Quiet mode ready — no gateway storm detected'
  };
}

export default {
  classifyVaultMetadataRequest,
  shouldHydrateVaultMetadata,
  markQuietMetadataSkip,
  getQuietMetadataStats,
  buildQuietMetadataStatus
};
