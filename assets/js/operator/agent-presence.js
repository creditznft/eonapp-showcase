/**
 * EON City Agent Presence — truthful local work-visualization bridge.
 *
 * This module deliberately visualizes only finite, local lifecycle facts that
 * the product already recorded. It never starts provider work, reads prompts,
 * saves model output, exposes credentials, or fabricates autonomous agents.
 * City renderers consume these small sanitized records as optional NPC / signal
 * cues so users can understand real work without mistaking the City for a
 * second automation runtime.
 */

export const AGENT_PRESENCE_SCHEMA = 'eon.agent.presence.v1';
export const AGENT_PRESENCE_STORAGE_KEY = 'eon:agent:presence:v1';
export const AGENT_PRESENCE_PREFERENCES_KEY = 'eon:agent:presence-preferences:v1';
export const AGENT_PRESENCE_EVENT = 'eon:agent-presence';
export const AGENT_PRESENCE_MAX_ENTRIES = 24;
export const AGENT_PRESENCE_MAX_VISIBLE = 4;

// Bounded provider identifiers are optional local metadata. They are hidden
// from City by default and never include model names, endpoints, keys, account
// information, prompts, or outputs. Unknown values are discarded.
export const AGENT_PRESENCE_PROVIDER_LABELS = Object.freeze({
  guide: 'Guide only',
  browserlocal: 'EON Local Lite', ollama: 'Ollama (local)', lmstudio: 'LM Studio (local)', jan: 'Jan (local)',
  groq: 'Groq', gemini: 'Google Gemini', cerebras: 'Cerebras', mistral: 'Mistral AI',
  deepseek: 'DeepSeek', perplexity: 'Perplexity', together: 'Together AI',
  nvidia: 'NVIDIA NIM', sambanova: 'SambaNova', fireworks: 'Fireworks AI',
  huggingface: 'Hugging Face', openai: 'OpenAI', openrouter: 'OpenRouter'
});
const SAFE_PROVIDER_IDS = new Set(Object.keys(AGENT_PRESENCE_PROVIDER_LABELS));

const SAFE_SOURCES = new Set(['eon-ai-kernel', 'mission-engine', 'agent-executor', 'operator-activity']);
const SAFE_ROLES = new Set(['coordinator', 'researcher', 'builder', 'reviewer', 'local-runner', 'guide']);
const SAFE_STATUSES = new Set(['queued', 'active', 'handoff', 'waiting', 'complete', 'failed', 'ready']);
const SAFE_PHASES = new Set(['queued', 'planning', 'routing', 'working', 'review', 'waiting-approval', 'complete', 'failed', 'guide']);
const SAFE_ACTIONS = new Set(['plan', 'research', 'idea', 'build', 'code', 'image', 'music', 'script', 'voice', 'subtitles', 'video', 'distribute_prepare', 'publish', 'chat_reply', 'eonbrowser_assist', 'agent', 'hive', 'boardroom', 'ask', 'signal', 'browse', 'automation', 'local-ai', 'chat', 'guide']);
const ACTIVE_PRESENCE_STATUSES = new Set(['queued', 'active', 'handoff', 'waiting', 'ready']);

function nowIso() {
  return new Date().toISOString();
}

function safeStorage(storage) {
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function cleanText(value, max = 120) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function makeId(prefix = 'agent') {
  try {
    if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`;
  } catch {}
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function roleForAction(action = '') {
  const normalized = String(action || '').toLowerCase();
  if (['plan', 'research', 'idea', 'script'].includes(normalized)) return 'researcher';
  if (['build', 'code', 'image', 'music', 'voice', 'subtitles', 'video', 'automation'].includes(normalized)) return 'builder';
  if (['publish', 'distribute_prepare'].includes(normalized)) return 'reviewer';
  if (normalized === 'local-ai') return 'local-runner';
  if (normalized === 'guide') return 'guide';
  if (['agent', 'hive', 'boardroom', 'ask', 'signal', 'browse', 'chat', 'chat_reply', 'eonbrowser_assist'].includes(normalized)) return 'coordinator';
  return 'coordinator';
}

function normalizeProviderId(providerId = '') {
  const id = String(providerId || '').toLowerCase().trim();
  return SAFE_PROVIDER_IDS.has(id) ? id : 'guide';
}

function providerKind(providerId = '') {
  const raw = String(providerId || '').toLowerCase().trim();
  // Preserve the older generic category-only bridge without retaining an
  // arbitrary provider identifier in storage.
  if (raw === 'local') return 'local';
  if (raw === 'cloud') return 'cloud';
  const id = normalizeProviderId(raw);
  if (!id || id === 'guide') return 'guide';
  if (['browserlocal', 'ollama', 'lmstudio', 'jan'].includes(id)) return 'local';
  return 'cloud';
}

/** A bounded display label for an already-selected provider. Never accepts arbitrary text. */
export function getAgentPresenceProviderLabel(providerId = '') {
  return AGENT_PRESENCE_PROVIDER_LABELS[normalizeProviderId(providerId)] || AGENT_PRESENCE_PROVIDER_LABELS.guide;
}

function normalizePreferences(candidate = {}) {
  const source = candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : {};
  const detailLevel = ['summary', 'provider-category', 'provider-identity'].includes(String(source.detailLevel || ''))
    ? String(source.detailLevel)
    : 'summary';
  return Object.freeze({
    enabled: source.enabled !== false,
    detailLevel
  });
}

function readEnvelope(storage) {
  const fallback = { schema: AGENT_PRESENCE_SCHEMA, updatedAt: nowIso(), entries: [] };
  try {
    const parsed = JSON.parse(storage?.getItem(AGENT_PRESENCE_STORAGE_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.entries)) return fallback;
    return {
      schema: AGENT_PRESENCE_SCHEMA,
      updatedAt: cleanText(parsed.updatedAt || nowIso(), 64),
      entries: parsed.entries.map(normalizeEntry).filter(Boolean).slice(-AGENT_PRESENCE_MAX_ENTRIES)
    };
  } catch {
    return fallback;
  }
}

function writeEnvelope(envelope, storage) {
  try {
    storage?.setItem(AGENT_PRESENCE_STORAGE_KEY, JSON.stringify({
      schema: AGENT_PRESENCE_SCHEMA,
      updatedAt: nowIso(),
      entries: (envelope?.entries || []).slice(-AGENT_PRESENCE_MAX_ENTRIES)
    }));
    return true;
  } catch {
    return false;
  }
}

function normalizeEntry(entry = {}) {
  const source = SAFE_SOURCES.has(String(entry.source || '').toLowerCase()) ? String(entry.source).toLowerCase() : 'operator-activity';
  const action = SAFE_ACTIONS.has(String(entry.action || '').toLowerCase()) ? String(entry.action).toLowerCase() : 'chat';
  const role = SAFE_ROLES.has(String(entry.role || '').toLowerCase()) ? String(entry.role).toLowerCase() : roleForAction(action);
  const status = SAFE_STATUSES.has(String(entry.status || '').toLowerCase()) ? String(entry.status).toLowerCase() : 'ready';
  const phase = SAFE_PHASES.has(String(entry.phase || '').toLowerCase()) ? String(entry.phase).toLowerCase() : (status === 'failed' ? 'failed' : status === 'complete' ? 'complete' : status === 'queued' ? 'queued' : status === 'waiting' ? 'waiting-approval' : 'working');
  const workRef = cleanText(entry.workRef || entry.jobId || entry.missionId || makeId('work'), 120);
  // Generic older records keep only a category (local/cloud) and normalize to
  // guide as their identity. Preserve that category during re-hydration.
  const rawProviderId = String(entry.providerId || '').toLowerCase().trim();
  const providerInput = rawProviderId && rawProviderId !== 'guide' ? rawProviderId : (entry.providerKind || rawProviderId || 'guide');
  if (!workRef) return null;
  return Object.freeze({
    id: cleanText(entry.id || `presence:${workRef}:${role}`, 180),
    schema: AGENT_PRESENCE_SCHEMA,
    source,
    workRef,
    role,
    action,
    status,
    phase,
    providerId: normalizeProviderId(providerInput),
    providerKind: providerKind(providerInput),
    // Labels are derived from the bounded ID above; arbitrary caller labels are
    // intentionally not persisted.
    providerLabel: getAgentPresenceProviderLabel(providerInput),
    createdAt: cleanText(entry.createdAt || nowIso(), 64),
    updatedAt: cleanText(entry.updatedAt || nowIso(), 64),
    completedAt: status === 'complete' || status === 'failed' ? cleanText(entry.completedAt || nowIso(), 64) : '',
    // The bridge never preserves a prompt, transcript, response, model name,
    // API key, wallet data, identifier, or arbitrary metadata.
    localOnly: true,
    externalEffect: false
  });
}

function emit(entry) {
  try {
    if (typeof globalThis.dispatchEvent === 'function' && typeof globalThis.CustomEvent === 'function') {
      globalThis.dispatchEvent(new CustomEvent(AGENT_PRESENCE_EVENT, { detail: entry }));
    }
  } catch {}
}

function findEntryIndex(entries, candidate) {
  return entries.findIndex((entry) => entry.workRef === candidate.workRef && entry.role === candidate.role);
}

/** Records a sanitized lifecycle fact. This never initiates work. */
export function recordAgentPresence(entry = {}, { storage } = {}) {
  const resolvedStorage = safeStorage(storage);
  const normalized = normalizeEntry(entry);
  if (!normalized) return Object.freeze({ ok: false, reason: 'invalid-presence', entry: null });
  const envelope = readEnvelope(resolvedStorage);
  const index = findEntryIndex(envelope.entries, normalized);
  const previous = index >= 0 ? envelope.entries[index] : null;
  const merged = normalizeEntry({
    ...previous,
    ...normalized,
    id: previous?.id || normalized.id,
    createdAt: previous?.createdAt || normalized.createdAt,
    updatedAt: nowIso()
  });
  const entries = envelope.entries.slice();
  if (index >= 0) entries[index] = merged;
  else entries.push(merged);
  const ok = writeEnvelope({ entries }, resolvedStorage);
  if (ok) emit(merged);
  return Object.freeze({ ok, reason: ok ? null : 'storage-unavailable', entry: merged });
}

/** Maps existing product activity to a truthful generic visual cue. */
export function recordAgentPresenceFromOperatorActivity(activity = {}, { storage } = {}) {
  const source = String(activity?.source || '').toLowerCase();
  const status = String(activity?.status || '').toLowerCase();
  if (!['automation', 'local-ai', 'chat'].includes(source) || !SAFE_STATUSES.has(status)) {
    return Object.freeze({ ok: false, reason: 'activity-not-agent-eligible', entry: null });
  }
  const action = source === 'automation' ? 'automation' : source === 'local-ai' ? 'local-ai' : 'chat';
  const role = roleForAction(action);
  const workRef = cleanText(activity?.id || makeId('activity'), 120);
  const phase = status === 'queued' ? 'queued' : status === 'waiting' ? 'waiting-approval' : status === 'complete' ? 'complete' : status === 'failed' ? 'failed' : status === 'ready' ? 'planning' : 'working';
  return recordAgentPresence({
    source: 'operator-activity',
    workRef,
    role,
    action,
    status,
    phase,
    providerId: action === 'local-ai' ? 'local' : 'guide',
    createdAt: activity?.at || nowIso(),
    updatedAt: activity?.at || nowIso()
  }, { storage });
}

export function listAgentPresence({ limit = 12, activeOnly = false, storage } = {}) {
  const safeLimit = Math.max(1, Math.min(AGENT_PRESENCE_MAX_ENTRIES, Number(limit) || 12));
  const entries = readEnvelope(safeStorage(storage)).entries;
  const filtered = activeOnly ? entries.filter((entry) => ACTIVE_PRESENCE_STATUSES.has(entry.status)) : entries;
  return filtered.slice().sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, safeLimit);
}

/**
 * Derives a small visual collaboration state from already-recorded lifecycle facts.
 * This is intentionally not an agent transcript or an inference about model behavior.
 * A huddle only means that two or more real local status cues are visible, or that a
 * recorded checked handoff/review exists. It never creates work, messages, or a remote queue.
 */
export function getAgentPresenceCollaboration(entries = []) {
  const active = Array.isArray(entries)
    ? entries.filter((entry) => ACTIVE_PRESENCE_STATUSES.has(String(entry?.status || '').toLowerCase())).slice(0, AGENT_PRESENCE_MAX_VISIBLE)
    : [];
  const roles = [...new Set(active.map((entry) => String(entry.role || 'coordinator')).filter((role) => SAFE_ROLES.has(role)))];
  const handoff = active.find((entry) => entry.status === 'handoff');
  const waiting = active.find((entry) => entry.status === 'waiting');
  const mode = !active.length
    ? 'idle'
    : handoff ? 'handoff'
      : waiting ? 'review'
        : active.length >= 2 ? 'parallel'
          : 'focused';
  const copy = {
    idle: { title: 'No active work crew', bubble: 'No recorded work is active. City does not invent a busy team.', accent: '#64748b' },
    focused: { title: 'Focused local work', bubble: 'One recorded work step is visible. Use Chat or the native app to manage it.', accent: '#5eead4' },
    parallel: { title: 'Live work crew', bubble: 'Recorded local work cues are visible together. This is status, not a transcript.', accent: '#a5b4fc' },
    handoff: { title: 'Checked handoff', bubble: 'A recorded work step is handing off. Review happens in the native app.', accent: '#fbbf24' },
    review: { title: 'Review needed', bubble: 'Recorded work is waiting for your explicit review. City cannot approve it.', accent: '#fb7185' }
  }[mode];
  return Object.freeze({
    schema: AGENT_PRESENCE_SCHEMA,
    mode,
    title: copy.title,
    bubble: copy.bubble,
    accent: copy.accent,
    activeCount: active.length,
    roles: Object.freeze(roles),
    workRefs: Object.freeze([...new Set(active.map((entry) => entry.workRef))].slice(0, AGENT_PRESENCE_MAX_VISIBLE)),
    localOnly: true,
    externalEffect: false
  });
}

export function getAgentPresenceSummary({ storage } = {}) {
  const entries = listAgentPresence({ limit: AGENT_PRESENCE_MAX_ENTRIES, storage });
  const active = entries.filter((entry) => ACTIVE_PRESENCE_STATUSES.has(entry.status)).slice(0, AGENT_PRESENCE_MAX_VISIBLE);
  return Object.freeze({
    schema: AGENT_PRESENCE_SCHEMA,
    count: entries.length,
    activeCount: active.length,
    visibleLimit: AGENT_PRESENCE_MAX_VISIBLE,
    active,
    latest: entries[0] || null,
    collaboration: getAgentPresenceCollaboration(active),
    localOnly: true,
    externalEffect: false
  });
}

/**
 * Returns a status-only City outcome relay for the latest recorded local step.
 * It intentionally contains no work reference, prompt, response, transcript,
 * provider/model identity, account detail, key, Vault value, or private result.
 * The native Chat/work surface remains the only place to review actual output.
 */
export function getAgentPresenceOutcome(summary = {}) {
  const latest = summary?.latest && typeof summary.latest === 'object' ? summary.latest : null;
  const status = String(latest?.status || '').toLowerCase();
  const outcome = {
    waiting: { mode: 'review', title: 'Review needed', bubble: 'A recorded local work step is waiting for your explicit review in Chat or its native work surface.', accent: '#fbbf24' },
    complete: { mode: 'result-ready', title: 'Result ready', bubble: 'A recorded local work step completed. Review the actual result in Chat or its native work surface.', accent: '#5eead4' },
    failed: { mode: 'attention', title: 'Attention needed', bubble: 'A recorded local work step needs attention. Review the safe status and next step in Chat or its native work surface.', accent: '#fb7185' }
  }[status];
  const nativeSurface = latest?.source === 'eon-ai-kernel'
    ? Object.freeze({ route: '/workspace#eon-kernel-review-inbox-title', label: 'Workspace' })
    : Object.freeze({ route: '/', label: 'Chat' });
  if (!outcome) {
    return Object.freeze({
      schema: AGENT_PRESENCE_SCHEMA,
      mode: 'none',
      title: 'No result relay',
      bubble: 'No completed or review-needed local work state is ready to relay.',
      accent: '#64748b',
      visible: false,
      route: nativeSurface.route,
      nativeSurface: nativeSurface.label,
      localOnly: true,
      externalEffect: false
    });
  }
  return Object.freeze({
    schema: AGENT_PRESENCE_SCHEMA,
    mode: outcome.mode,
    title: outcome.title,
    bubble: outcome.bubble,
    accent: outcome.accent,
    visible: true,
    route: nativeSurface.route,
    nativeSurface: nativeSurface.label,
    localOnly: true,
    externalEffect: false
  });
}

export function readAgentPresencePreferences({ storage } = {}) {
  const resolvedStorage = safeStorage(storage);
  try { return normalizePreferences(JSON.parse(resolvedStorage?.getItem(AGENT_PRESENCE_PREFERENCES_KEY) || 'null')); } catch { return normalizePreferences(); }
}

export function saveAgentPresencePreferences(candidate = {}, { storage } = {}) {
  const preferences = normalizePreferences(candidate);
  try { safeStorage(storage)?.setItem(AGENT_PRESENCE_PREFERENCES_KEY, JSON.stringify(preferences)); } catch {}
  try { globalThis.dispatchEvent?.(new CustomEvent('eon:agent-presence-preferences', { detail: preferences })); } catch {}
  return preferences;
}

export function describeAgentPresence(entry = {}, preferences = {}) {
  const safe = normalizeEntry(entry) || null;
  const pref = normalizePreferences(preferences);
  if (!safe) return Object.freeze({ title: 'No active work signal', bubble: 'No recorded work is running.', accent: '#64748b' });
  const roleLabels = { coordinator: 'EONBOT coordinator', researcher: 'Research agent', builder: 'Build agent', reviewer: 'Review agent', 'local-runner': 'Local runtime', guide: 'Guide mode' };
  const statusCopy = {
    queued: 'queued locally until this device can continue', active: 'working on a real local task', handoff: 'handing work to the next checked step', waiting: 'waiting for your review', ready: 'ready for your explicit start', complete: 'finished a recorded step', failed: 'needs your attention'
  };
  const accent = safe.status === 'failed' ? '#fb7185' : (safe.status === 'waiting' || safe.status === 'queued') ? '#fbbf24' : safe.role === 'builder' ? '#a5b4fc' : safe.role === 'researcher' ? '#5eead4' : safe.role === 'local-runner' ? '#34d399' : '#c4b5fd';
  const provider = pref.detailLevel === 'provider-identity' && safe.providerId !== 'guide'
    ? ` · ${getAgentPresenceProviderLabel(safe.providerId)} selected connection`
    : pref.detailLevel === 'provider-category' && safe.providerKind !== 'guide'
      ? ` · ${safe.providerKind === 'local' ? 'local runtime' : 'cloud provider'}`
      : '';
  return Object.freeze({
    title: roleLabels[safe.role] || 'EONAPP agent',
    bubble: `${statusCopy[safe.status] || 'updated locally'}${provider}`,
    accent,
    status: safe.status,
    role: safe.role
  });
}

/** Subscribes only to this browser's local, sanitized presence changes. */
export function subscribeAgentPresence(listener, { storage = safeStorage() } = {}) {
  if (typeof listener !== 'function') return () => {};
  const onPresence = () => listener(getAgentPresenceSummary({ storage }));
  const onStorage = (event) => {
    if (event.key === AGENT_PRESENCE_STORAGE_KEY || event.key === AGENT_PRESENCE_PREFERENCES_KEY) onPresence();
  };
  try { globalThis.addEventListener?.(AGENT_PRESENCE_EVENT, onPresence); } catch {}
  try { globalThis.addEventListener?.('eon:agent-presence-preferences', onPresence); } catch {}
  try { globalThis.addEventListener?.('storage', onStorage); } catch {}
  return () => {
    try { globalThis.removeEventListener?.(AGENT_PRESENCE_EVENT, onPresence); } catch {}
    try { globalThis.removeEventListener?.('eon:agent-presence-preferences', onPresence); } catch {}
    try { globalThis.removeEventListener?.('storage', onStorage); } catch {}
  };
}

export function clearAgentPresence({ storage } = {}) {
  try { safeStorage(storage)?.removeItem(AGENT_PRESENCE_STORAGE_KEY); } catch {}
}
