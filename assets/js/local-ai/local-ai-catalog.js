/**
 * W233 — Local AI starter catalogue.
 *
 * This is intentionally a small, versioned set of *profiles*, not a remote
 * marketplace. The authoritative model list is the runtime the user already
 * installed and explicitly scans on their own device. Catalog entries only
 * give conservative, inspectable starting points and copyable Ollama commands.
 */
import { detectLocalAiCapabilityProfile } from '../utils/local-ai-capability-matrix.js';

export const LOCAL_AI_CATALOG_SCHEMA = 'eon.local-ai.catalog.v1';
export const LOCAL_AI_CATALOG_UPDATED_AT = '2026-06-25';

const PROFILE_ROWS = Object.freeze([
  Object.freeze({
    id: 'starter-private-chat',
    label: 'Lightweight private chat (Phi)',
    summary: 'A lightweight fallback local text model for private everyday chat, short notes, and guided EONBOT help on a supported desktop.',
    model: 'phi4-mini',
    officialUrl: 'https://ollama.com/library/phi4-mini',
    workloads: Object.freeze(['chat', 'short notes', 'private basics']),
    minMemoryGb: 8,
    minCores: 4,
    priority: 1,
    caution: 'Start with one small model only. Exact storage, speed and suitability depend on the selected runtime, model tag and other apps running on the device.'
  }),
  Object.freeze({
    id: 'compact-private-chat',
    label: 'Compact private chat',
    summary: 'A conservative starting point for private notes, summaries, and everyday EONBOT conversation.',
    model: 'gemma3:4b',
    officialUrl: 'https://ollama.com/library/gemma3',
    workloads: Object.freeze(['chat', 'summaries', 'multilingual basics', 'image input where supported']),
    minMemoryGb: 8,
    minCores: 4,
    priority: 0,
    caution: 'Actual memory and speed depend on the selected quantization, context size, and other apps running on the device.'
  }),
  Object.freeze({
    id: 'balanced-private-chat',
    label: 'Balanced private chat',
    summary: 'A stronger local text model for longer drafting, reasoning, and multilingual conversation on a capable desktop.',
    model: 'qwen3:8b',
    officialUrl: 'https://ollama.com/library/qwen3',
    workloads: Object.freeze(['chat', 'longer drafting', 'reasoning', 'multilingual']),
    minMemoryGb: 16,
    minCores: 8,
    priority: 2,
    caution: 'Prefer this only after compact chat is stable. Device-memory hints are estimates, not guarantees.'
  }),
  Object.freeze({
    id: 'private-search-embeddings',
    label: 'Private search / notes index',
    summary: 'For a future private local search index. This profile does not activate RAG, upload files, or create an index by itself.',
    model: 'qwen3-embedding:0.6b',
    officialUrl: 'https://ollama.com/library/qwen3-embedding',
    workloads: Object.freeze(['embeddings', 'private search foundation']),
    minMemoryGb: 8,
    minCores: 4,
    priority: 3,
    caution: 'EONAPP has no automatic file indexing in this release. Installing an embedding model alone does not enable a data feature.'
  }),
  Object.freeze({
    id: 'heavy-local-code',
    label: 'Heavy local coding (advanced)',
    summary: 'A demanding coding profile for a high-memory desktop. Do not choose it merely because it is listed.',
    model: 'qwen3-coder:30b',
    officialUrl: 'https://ollama.com/library/qwen3-coder',
    workloads: Object.freeze(['coding', 'repository review']),
    minMemoryGb: 48,
    minCores: 12,
    priority: 4,
    caution: 'This is an advanced desktop profile. It is not suitable for ordinary phones, small laptops, or low-VRAM systems.'
  })
]);

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fitFor(profile, device) {
  const memoryGb = asNumber(device?.memoryGB || device?.memoryGb);
  const cores = asNumber(device?.cpuCores || device?.cores);
  const mobile = String(device?.computeClass || '').toLowerCase() === 'mobile' || /mobile|ios|android/i.test(String(device?.platformFamily || ''));
  if (mobile) {
    return Object.freeze({ level: 'not-recommended', label: 'Use Local Lite on this phone', reason: 'Desktop runtimes are not a phone default. Use the separate browser-local Local Lite path for basic private text.' });
  }
  if (memoryGb && memoryGb < profile.minMemoryGb) {
    return Object.freeze({ level: 'not-recommended', label: 'Below conservative memory guidance', reason: `This profile starts at roughly ${profile.minMemoryGb} GB reported memory; choose a smaller profile or stay in Guide Mode.` });
  }
  if (cores && cores < profile.minCores) {
    return Object.freeze({ level: 'cautious', label: 'Try only after a self-test', reason: `The device reports ${cores} logical cores; the profile is more comfortable from about ${profile.minCores}.` });
  }
  if (!memoryGb || !cores) {
    return Object.freeze({ level: 'cautious', label: 'Device signal incomplete', reason: 'Browser hardware hints are unavailable. Start with compact chat and run the self-test.' });
  }
  if (profile.id === 'heavy-local-code' && memoryGb < 64) {
    return Object.freeze({ level: 'cautious', label: 'Advanced hardware only', reason: 'This profile is intentionally conservative and may still be slow or unsuitable.' });
  }
  return Object.freeze({ level: 'recommended', label: profile.priority === 0 ? 'Recommended first local model' : 'Reasonable on this device', reason: 'Still run the local self-test before selecting it for EONBOT.' });
}

export function getLocalAiStarterCatalog(options = {}) {
  const device = options.device || detectLocalAiCapabilityProfile(options.deviceContext || {});
  return Object.freeze({
    schema: LOCAL_AI_CATALOG_SCHEMA,
    updatedAt: LOCAL_AI_CATALOG_UPDATED_AT,
    device: Object.freeze({
      label: String(device?.label || 'This device'),
      computeClass: String(device?.computeClass || 'unknown'),
      memoryGB: asNumber(device?.memoryGB || device?.memoryGb),
      cpuCores: asNumber(device?.cpuCores || device?.cores)
    }),
    profiles: Object.freeze(PROFILE_ROWS.map((profile) => Object.freeze({ ...profile, fit: fitFor(profile, device) })))
  });
}

export function findLocalAiStarterProfile(id = '') {
  return PROFILE_ROWS.find((profile) => profile.id === String(id || '').trim()) || null;
}

function normalizeModelKey(value = '') {
  return String(value || '').trim().toLowerCase();
}

function matchesInstalledModel(installedModel = '', preferredModel = '') {
  const installed = normalizeModelKey(installedModel);
  const preferred = normalizeModelKey(preferredModel);
  if (!installed || !preferred) return false;
  return installed === preferred || installed.startsWith(`${preferred}:`);
}

export function findPreferredDiscoveredLocalModel(models = [], options = {}) {
  const rows = Array.isArray(models) ? models.filter((row) => row && typeof row === 'object') : [];
  if (!rows.length) return null;
  const catalog = getLocalAiStarterCatalog(options);
  const preferredProfiles = catalog.profiles
    .filter((profile) => profile.fit.level !== 'not-recommended')
    .sort((left, right) => Number(left.priority || 999) - Number(right.priority || 999));
  for (const profile of preferredProfiles) {
    const matched = rows.find((row) => matchesInstalledModel(row.model, profile.model));
    if (matched) return matched;
  }
  // Fail unknown: an arbitrary first scan result is not a reviewed recommendation.
  // The user may still choose any installed local-only model and self-test it.
  return null;
}

export function buildOllamaPullCommand(profileOrId = '') {
  const profile = typeof profileOrId === 'object' ? profileOrId : findLocalAiStarterProfile(profileOrId);
  if (!profile?.model) return '';
  return `ollama pull ${profile.model}`;
}

export function buildOllamaRunCommand(profileOrId = '') {
  const profile = typeof profileOrId === 'object' ? profileOrId : findLocalAiStarterProfile(profileOrId);
  if (!profile?.model) return '';
  return `ollama run ${profile.model}`;
}
