/**
 * Mission Memory
 * --------------
 * Local-first mission budget memory and receipt history.
 *
 * Purpose:
 * - remember the last successful budget mode per task family
 * - store recent mission receipts in a compact local memory card
 * - explain why a mission got the budget it did
 */

const MEMORY_KEY = 'eon:mission-memory:v1';
const MAX_RECENT = 24;
const MAX_TASK_PROFILES = 32;
const MAX_RECENT_RECEIPTS = 24;

/**
 * @typedef {'auto'|'safe'|'balanced'|'performance'} BudgetMode
 */

/**
 * @typedef {Object} BudgetCeiling
 * @property {number} maxHistoryMessages
 * @property {number} maxInputChars
 * @property {number} maxOutputTokens
 * @property {number} timeoutMs
 */

/**
 * @typedef {Object} TaskProfile
 * @property {string} taskType
 * @property {string} label
 * @property {BudgetMode} budgetMode
 * @property {string} providerId
 * @property {string} providerLabel
 * @property {string} model
 * @property {number} successes
 * @property {number} failures
 * @property {string} lastOutcome
 * @property {string} lastMissionId
 * @property {string} lastSummary
 * @property {number} lastUsedAt
 * @property {number} lastCompletedAt
 */

/**
 * @typedef {Object} MissionRecentEntry
 * @property {string} missionId
 * @property {string} taskType
 * @property {string} mode
 * @property {BudgetMode} budgetMode
 * @property {string} providerId
 * @property {string} providerLabel
 * @property {string} model
 * @property {string} outcome
 * @property {string} summary
 * @property {string} prompt
 * @property {number} ts
 * @property {number} completedAt
 */

/**
 * @typedef {Object} MissionReceipt
 * @property {string} schema
 * @property {string} missionId
 * @property {string} mode
 * @property {string} taskClass
 * @property {string} idempotencyKey
 * @property {string} provider
 * @property {string} model
 * @property {string} routeExplanation
 * @property {string} fallbackReason
 * @property {string} prompt
 * @property {number} createdAt
 */

/** @type {{ auto: string, safe: string, balanced: string, performance: string }} */
const BUDGET_MODE_LABELS = {
  auto: 'Auto',
  safe: 'Safe',
  balanced: 'Balanced',
  performance: 'Performance'
};

/** @type {Record<'safe' | 'balanced' | 'performance', BudgetCeiling>} */
const BUDGET_MODE_CEILINGS = {
  safe: { maxHistoryMessages: 6, maxInputChars: 1200, maxOutputTokens: 280, timeoutMs: 15000 },
  balanced: { maxHistoryMessages: 12, maxInputChars: 2400, maxOutputTokens: 520, timeoutMs: 25000 },
  performance: { maxHistoryMessages: 18, maxInputChars: 4000, maxOutputTokens: 900, timeoutMs: 40000 }
};

function nowIso() {
  return new Date().toISOString();
}

/**
 * @param {string} taskType
 * @returns {string}
 */
function normalizeTaskType(taskType = '') {
  const text = String(taskType || '').trim().toLowerCase();
  return text || 'ask';
}

/**
 * @param {string} mode
 * @returns {BudgetMode}
 */
function normalizeBudgetMode(mode = 'auto') {
  const text = String(mode || 'auto').trim().toLowerCase();
  return /** @type {BudgetMode} */ (Object.prototype.hasOwnProperty.call(BUDGET_MODE_LABELS, text) ? text : 'auto');
}

/**
 * @param {number | undefined} baseValue
 * @param {number | undefined} capValue
 * @returns {number}
 */
function clampField(baseValue, capValue) {
  const base = Number(baseValue);
  const cap = Number(capValue);
  if (!Number.isFinite(base)) return Number.isFinite(cap) ? cap : (baseValue ?? 0);
  if (!Number.isFinite(cap)) return base;
  return Math.min(base, cap);
}

/**
 * @param {Partial<Record<'maxHistoryMessages' | 'maxInputChars' | 'maxOutputTokens' | 'timeoutMs', number>>} baseBudget
 * @param {BudgetCeiling | null} ceiling
 * @returns {Partial<Record<'maxHistoryMessages' | 'maxInputChars' | 'maxOutputTokens' | 'timeoutMs', number>>}
 */
function capBudget(baseBudget = {}, ceiling = null) {
  if (!ceiling) return { ...baseBudget };
  return {
    ...baseBudget,
    maxHistoryMessages: clampField(baseBudget.maxHistoryMessages, ceiling.maxHistoryMessages),
    maxInputChars: clampField(baseBudget.maxInputChars, ceiling.maxInputChars),
    maxOutputTokens: clampField(baseBudget.maxOutputTokens, ceiling.maxOutputTokens),
    timeoutMs: clampField(baseBudget.timeoutMs, ceiling.timeoutMs)
  };
}

/**
 * @returns {ReturnType<typeof normalizeMissionMemory>}
 */
function loadMissionMemory() {
  try {
    const raw = JSON.parse(localStorage.getItem(MEMORY_KEY) || 'null');
    return normalizeMissionMemory(raw);
  } catch {
    return normalizeMissionMemory(null);
  }
}

/**
 * @param {any} memory
 */
function saveMissionMemory(memory) {
  const normalized = normalizeMissionMemory(memory);
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(normalized));
  } catch {}
  return normalized;
}

/**
 * @param {Partial<TaskProfile> & Record<string, any>} profile
 * @returns {TaskProfile}
 */
function normalizeTaskProfile(profile = {}) {
  const taskType = normalizeTaskType(profile.taskType || profile.mode || 'ask');
  return {
    taskType,
    label: String(profile.label || taskType).trim().slice(0, 80),
    budgetMode: /** @type {BudgetMode} */ (normalizeBudgetMode(profile.budgetMode || 'auto')),
    providerId: String(profile.providerId || '').trim().toLowerCase(),
    providerLabel: String(profile.providerLabel || '').trim().slice(0, 80),
    model: String(profile.model || '').trim().slice(0, 120),
    successes: Math.max(0, Number(profile.successes || 0)),
    failures: Math.max(0, Number(profile.failures || 0)),
    lastOutcome: String(profile.lastOutcome || '').trim().slice(0, 40),
    lastMissionId: String(profile.lastMissionId || '').trim().slice(0, 120),
    lastSummary: String(profile.lastSummary || '').trim().slice(0, 240),
    lastUsedAt: Number(profile.lastUsedAt || 0),
    lastCompletedAt: Number(profile.lastCompletedAt || 0)
  };
}

/**
 * @param {any} raw
 */
function normalizeMissionMemory(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const taskProfiles = source.taskProfiles && typeof source.taskProfiles === 'object' ? source.taskProfiles : {};
  const recent = Array.isArray(source.recent) ? source.recent : [];
  const receipts = Array.isArray(source.receipts) ? source.receipts : [];
  /** @type {Record<string, TaskProfile>} */
  const normalizedProfiles = {};
  for (const [taskType, profile] of Object.entries(taskProfiles)) {
    normalizedProfiles[normalizeTaskType(taskType)] = normalizeTaskProfile(profile);
  }
  const orderedProfiles = /** @type {[string, TaskProfile][]} */ (Object.entries(normalizedProfiles))
    .sort((/** @type {[string, TaskProfile]} */ a, /** @type {[string, TaskProfile]} */ b) => (b[1].successes + b[1].failures) - (a[1].successes + a[1].failures))
    .slice(0, MAX_TASK_PROFILES);

  return {
    schemaVersion: 'mission-memory/v1',
    defaultBudgetMode: normalizeBudgetMode(source.defaultBudgetMode || 'balanced'),
    taskProfiles: Object.fromEntries(orderedProfiles),
    recent: recent
      .filter((/** @type {any} */ row) => row && typeof row === 'object')
      .map((/** @type {any} */ row) => ({
        missionId: String(row.missionId || '').trim().slice(0, 120),
        taskType: normalizeTaskType(row.taskType || row.mode || 'ask'),
        mode: String(row.mode || 'ask').trim().slice(0, 40),
        budgetMode: normalizeBudgetMode(row.budgetMode || 'auto'),
        providerId: String(row.providerId || '').trim().toLowerCase(),
        providerLabel: String(row.providerLabel || '').trim().slice(0, 80),
        model: String(row.model || '').trim().slice(0, 120),
        outcome: String(row.outcome || 'unknown').trim().slice(0, 40),
        summary: String(row.summary || '').trim().slice(0, 240),
        prompt: String(row.prompt || '').trim().slice(0, 240),
        ts: Number(row.ts || row.completedAt || Date.now()),
        completedAt: Number(row.completedAt || row.ts || Date.now())
      }))
    .sort((/** @type {MissionRecentEntry} */ a, /** @type {MissionRecentEntry} */ b) => a.ts - b.ts)
      .slice(-MAX_RECENT),
    receipts: receipts
      .filter((/** @type {any} */ row) => row && typeof row === 'object')
      .map((/** @type {any} */ row) => ({
        schema: String(row.schema || 'mission-receipt/v1').trim().slice(0, 48),
        missionId: String(row.missionId || '').trim().slice(0, 120),
        mode: String(row.mode || 'ask').trim().slice(0, 40),
        taskClass: String(row.taskClass || '').trim().slice(0, 40),
        idempotencyKey: String(row.idempotencyKey || '').trim().slice(0, 160),
        provider: String(row.provider || '').trim().slice(0, 80),
        model: String(row.model || '').trim().slice(0, 120),
        routeExplanation: String(row.routeExplanation || '').trim().slice(0, 240),
        fallbackReason: String(row.fallbackReason || '').trim().slice(0, 240),
        prompt: String(row.prompt || '').trim().slice(0, 240),
        createdAt: Number(row.createdAt || row.completedAt || Date.now())
      }))
    .sort((/** @type {MissionReceipt} */ a, /** @type {MissionReceipt} */ b) => a.createdAt - b.createdAt)
      .slice(-MAX_RECENT_RECEIPTS),
    updatedAt: String(source.updatedAt || nowIso())
  };
}

function resolveMissionBudgetDecision({
  taskType = 'ask',
  requestedBudgetMode = 'auto',
  baseBudget = {},
  memory = loadMissionMemory()
} = {}) {
  const taskKey = normalizeTaskType(taskType);
  const memoryState = normalizeMissionMemory(memory);
  const requestedMode = normalizeBudgetMode(requestedBudgetMode);
  const profile = memoryState.taskProfiles[taskKey] || null;
  const effectiveMode = requestedMode !== 'auto'
    ? requestedMode
    : profile?.budgetMode && profile.budgetMode !== 'auto'
      ? profile.budgetMode
      : memoryState.defaultBudgetMode;
  const ceiling = effectiveMode === 'auto' ? null : BUDGET_MODE_CEILINGS[effectiveMode] || null;
  const budget = capBudget(baseBudget, ceiling);
  const source = requestedMode !== 'auto'
    ? 'user'
    : profile?.budgetMode && profile.budgetMode !== 'auto'
      ? 'memory'
      : 'default';
  const reason = source === 'user'
    ? `User selected ${BUDGET_MODE_LABELS[effectiveMode] || effectiveMode} budget mode for ${taskKey}.`
    : source === 'memory'
      ? `Using remembered ${BUDGET_MODE_LABELS[effectiveMode] || effectiveMode} budget mode for ${taskKey}.`
      : `Using default ${BUDGET_MODE_LABELS[effectiveMode] || effectiveMode} budget mode for ${taskKey}.`;

  return {
    taskType: taskKey,
    requestedBudgetMode: requestedMode,
    budgetMode: effectiveMode,
    budgetModeLabel: BUDGET_MODE_LABELS[effectiveMode] || effectiveMode,
    budgetModeSource: source,
    budget,
    reason,
    profile
  };
}

/**
 * @param {Object} [options]
 * @param {string} [options.missionId]
 * @param {string} [options.taskType]
 * @param {string} [options.mode]
 * @param {BudgetMode} [options.budgetMode]
 * @param {string} [options.providerId]
 * @param {string} [options.providerLabel]
 * @param {string} [options.model]
 * @param {string} [options.outcome]
 * @param {string} [options.summary]
 * @param {string} [options.prompt]
 * @param {number} [options.completedAt]
 */
function recordMissionMemory({
  missionId = '',
  taskType = 'ask',
  mode = 'ask',
  budgetMode = 'auto',
  providerId = '',
  providerLabel = '',
  model = '',
  outcome = 'success',
  summary = '',
  prompt = '',
  completedAt = Date.now()
} = {}) {
  const memory = loadMissionMemory();
  const taskKey = normalizeTaskType(taskType || mode);
  const current = memory.taskProfiles[taskKey] || normalizeTaskProfile({ taskType: taskKey, label: taskKey });
  const nextProfile = {
    ...current,
    taskType: taskKey,
    label: current.label || taskKey,
    budgetMode: normalizeBudgetMode(budgetMode || current.budgetMode || 'auto'),
    providerId: String(providerId || current.providerId || '').trim().toLowerCase(),
    providerLabel: String(providerLabel || current.providerLabel || '').trim(),
    model: String(model || current.model || '').trim(),
    successes: current.successes + (String(outcome || '').toLowerCase() === 'success' ? 1 : 0),
    failures: current.failures + (String(outcome || '').toLowerCase() === 'success' ? 0 : 1),
    lastOutcome: String(outcome || 'unknown').trim(),
    lastMissionId: String(missionId || current.lastMissionId || '').trim(),
    lastSummary: String(summary || '').trim().slice(0, 240),
    lastUsedAt: Date.now(),
    lastCompletedAt: Number(completedAt || Date.now())
  };

  memory.taskProfiles[taskKey] = nextProfile;
  memory.defaultBudgetMode = normalizeBudgetMode(memory.defaultBudgetMode || nextProfile.budgetMode || 'balanced');
  const entry = {
    missionId: String(missionId || '').trim(),
    taskType: taskKey,
    mode: String(mode || taskKey).trim(),
    budgetMode: nextProfile.budgetMode,
    providerId: nextProfile.providerId,
    providerLabel: nextProfile.providerLabel,
    model: nextProfile.model,
    outcome: String(outcome || 'unknown').trim(),
    summary: String(summary || '').trim().slice(0, 240),
    prompt: String(prompt || '').trim().slice(0, 240),
    ts: Number(completedAt || Date.now()),
    completedAt: Number(completedAt || Date.now())
  };

  memory.recent.push(entry);
  memory.recent = memory.recent.slice(-MAX_RECENT);
  memory.updatedAt = nowIso();
  return saveMissionMemory(memory);
}

/**
 * @param {Partial<MissionReceipt> & Record<string, any>} [receipt]
 */
function recordMissionReceipt(receipt = {}) {
  const memory = loadMissionMemory();
  /** @type {MissionReceipt | null} */
  const normalized = receipt && typeof receipt === 'object' ? (() => { const r = /** @type {any} */ (receipt); return {
    schema: String(r.schema || 'mission-receipt/v1').trim().slice(0, 48),
    missionId: String(r.missionId || '').trim().slice(0, 120),
    mode: String(r.mode || 'ask').trim().slice(0, 40),
    taskClass: String(r.taskClass || '').trim().slice(0, 40),
    idempotencyKey: String(r.idempotencyKey || '').trim().slice(0, 160),
    provider: String(r.provider || '').trim().slice(0, 80),
    model: String(r.model || '').trim().slice(0, 120),
    routeExplanation: String(r.routeExplanation || '').trim().slice(0, 240),
    fallbackReason: String(r.fallbackReason || '').trim().slice(0, 240),
    prompt: String(r.prompt || '').trim().slice(0, 240),
    createdAt: Number(r.createdAt || r.completedAt || Date.now())
  }; })() : null;
  if (!normalized || !normalized.missionId) {
    return memory;
  }
  memory.receipts = Array.isArray(memory.receipts) ? memory.receipts : [];
  memory.receipts = memory.receipts.filter((/** @type {MissionReceipt} */ row) => row?.missionId !== normalized.missionId);
  memory.receipts.push(normalized);
  memory.receipts = memory.receipts.slice(-MAX_RECENT_RECEIPTS);
  memory.updatedAt = nowIso();
  return saveMissionMemory(memory);
}

/**
 * @param {any} [memory]
 */
function summarizeMissionMemory(memory = loadMissionMemory()) {
  const state = normalizeMissionMemory(memory);
  const profiles = /** @type {TaskProfile[]} */ (Object.values(state.taskProfiles))
    .sort((/** @type {TaskProfile} */ a, /** @type {TaskProfile} */ b) => (b.successes + b.failures) - (a.successes + a.failures))
    .slice(0, 4)
    .map((/** @type {TaskProfile} */ profile) => ({
      taskType: profile.taskType,
      label: profile.label,
      budgetMode: profile.budgetMode,
      providerLabel: profile.providerLabel || profile.providerId || 'n/a',
      model: profile.model || 'auto',
      successes: profile.successes,
      failures: profile.failures,
      lastOutcome: profile.lastOutcome || 'unknown'
    }));

  const recent = state.recent.slice(-4).reverse();
  return {
    schemaVersion: state.schemaVersion,
    defaultBudgetMode: state.defaultBudgetMode,
    updatedAt: state.updatedAt,
    profileCount: Object.keys(state.taskProfiles).length,
    recentCount: state.recent.length,
    receiptCount: state.receipts.length,
    topProfiles: profiles,
    recent,
    receipts: state.receipts.slice(-4).reverse()
  };
}

/**
 * @param {any} [memory]
 */
function formatMissionMemorySummary(memory = loadMissionMemory()) {
  const summary = summarizeMissionMemory(memory);
  const top = summary.topProfiles[0];
  const recent = summary.recent[0];
  const parts = [
    `Default ${BUDGET_MODE_LABELS[summary.defaultBudgetMode] || summary.defaultBudgetMode}`,
    `${summary.profileCount} task profiles`,
    `${summary.recentCount} recent missions`
  ];
  if (top) {
    parts.push(`Top ${top.label} → ${BUDGET_MODE_LABELS[top.budgetMode] || top.budgetMode}`);
  }
  if (recent) {
    parts.push(`Last ${recent.taskType} via ${recent.providerLabel || recent.providerId || 'guide'}`);
  }
  return parts.join(' · ');
}

export {
  BUDGET_MODE_LABELS,
  BUDGET_MODE_CEILINGS,
  formatMissionMemorySummary,
  loadMissionMemory,
  recordMissionMemory,
  recordMissionReceipt,
  resolveMissionBudgetDecision,
  saveMissionMemory,
  summarizeMissionMemory
};
