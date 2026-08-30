/**
 * Mission Engine
 * --------------
 * Canonical request path for serious EONAPP work.
 *
 * It combines:
 * - a foreground-only mission plan
 * - the user-selected verified provider/model
 * - canonical AI execution
 * - mission receipts returned to the caller
 */

import { createAIReply, createAIReplyStream, getApiKey, loadAISettings, PROVIDERS } from '../chat/ai-runtime.js';
import { createLoadGovernor } from '../chat/load-governor.js';
import { loadMissionMemory, recordMissionMemory, recordMissionReceipt, resolveMissionBudgetDecision } from './mission-memory.js';
import { recordAgentPresence } from '../operator/agent-presence.js';

const MISSION_BUDGET_HINTS = {
  ask: { maxHistoryMessages: 6, maxInputChars: 1800, maxOutputTokens: 420, timeoutMs: 18000 },
  chat_reply: { maxHistoryMessages: 6, maxInputChars: 1800, maxOutputTokens: 420, timeoutMs: 18000 },
  voice: { maxHistoryMessages: 4, maxInputChars: 1200, maxOutputTokens: 320, timeoutMs: 15000 },
  signal: { maxHistoryMessages: 10, maxInputChars: 2800, maxOutputTokens: 700, timeoutMs: 25000 },
  browse: { maxHistoryMessages: 8, maxInputChars: 2400, maxOutputTokens: 600, timeoutMs: 22000 },
  build: { maxHistoryMessages: 14, maxInputChars: 4200, maxOutputTokens: 1200, timeoutMs: 40000 },
  code: { maxHistoryMessages: 14, maxInputChars: 4200, maxOutputTokens: 1200, timeoutMs: 40000 },
  agent: { maxHistoryMessages: 12, maxInputChars: 3600, maxOutputTokens: 1000, timeoutMs: 35000 },
  hive: { maxHistoryMessages: 12, maxInputChars: 3600, maxOutputTokens: 1100, timeoutMs: 35000 },
  boardroom: { maxHistoryMessages: 10, maxInputChars: 3000, maxOutputTokens: 900, timeoutMs: 28000 },
  image: { maxHistoryMessages: 4, maxInputChars: 1400, maxOutputTokens: 420, timeoutMs: 18000 },
  music: { maxHistoryMessages: 4, maxInputChars: 1400, maxOutputTokens: 420, timeoutMs: 18000 },
  video: { maxHistoryMessages: 4, maxInputChars: 1600, maxOutputTokens: 520, timeoutMs: 22000 },
  distribute_prepare: { maxHistoryMessages: 8, maxInputChars: 2600, maxOutputTokens: 720, timeoutMs: 24000 },
  publish: { maxHistoryMessages: 6, maxInputChars: 1800, maxOutputTokens: 420, timeoutMs: 18000 },
  research: { maxHistoryMessages: 10, maxInputChars: 3000, maxOutputTokens: 800, timeoutMs: 28000 }
};

function createForegroundMissionPlan({ baseSettings = {}, intentText = '', origin = 'workbench', taskType = 'chat', metadata = {}, requiresApproval = false } = {}) {
  const providerId = String(baseSettings.provider || 'guide').trim().toLowerCase() || 'guide';
  const provider = PROVIDERS[providerId] || PROVIDERS.guide;
  const model = String(baseSettings.model || '').trim();
  const planId = `foreground-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
  if (requiresApproval && metadata?.reviewApproved !== true) {
    return {
      planId,
      status: 'review-required',
      stage: 'foreground-review',
      reason: 'Review this request before sending it to the selected provider.',
      policyDecision: { allowed: false, requiresApproval: true, pendingApprovals: ['provider-request-review'] },
      providerSelection: { provider, model, source: 'explicit-user-settings', retryPolicy: 'none', fallbackChain: [] },
      action: taskType,
      taskType,
      origin,
      metadata,
      containsPrompt: false
    };
  }
  return {
    planId,
    status: 'ready',
    stage: 'ready-to-execute',
    policyDecision: { allowed: true, foregroundOnly: true, externalEffectAuthority: false },
    providerSelection: { provider, model, source: 'explicit-user-settings', retryPolicy: 'none', fallbackChain: [] },
    action: taskType,
    taskType,
    origin,
    metadata,
    createdAt: Date.now(),
    intentChars: String(intentText || '').length,
    containsPrompt: false
  };
}

/**
 * @param {any} mode
 * @param {any} taskType
 * @returns {any}
 */
export function resolveMissionBudgetHint(mode, taskType) {
  const key = String(taskType || mode || 'ask').toLowerCase();
  return /** @type {any} */ (MISSION_BUDGET_HINTS)[key] || /** @type {any} */ (MISSION_BUDGET_HINTS)[mode] || MISSION_BUDGET_HINTS.ask;
}

/**
 * @param {any} mode
 * @param {any} taskType
 * @param {any} prompt
 * @returns {string}
 */
export function classifyMissionTaskMode(mode, taskType, prompt = '') {
  const text = `${String(mode || '')} ${String(taskType || '')} ${String(prompt || '')}`.toLowerCase();
  if (/(video|reel|short|youtube)/.test(text)) return 'video';
  if (/(music|song|beat|audio|mix|remix)/.test(text)) return 'music';
  if (/(image|thumbnail|poster|graphic|cover)/.test(text)) return 'image';
  if (/(code|website|app|builder|editor)/.test(text)) return 'code';
  if (/(research|browse|browser|analyze|compare|scrape)/.test(text)) return 'research';
  if (/(publish|post|distribute|ship|upload)/.test(text)) return 'publish';
  if (/(voice|podcast|tts|audio)/.test(text)) return 'voice';
  return String(taskType || mode || 'ask').toLowerCase();
}

/**
 * @param {any} governor
 * @param {any} budgetHint
 * @returns {any}
 */
export function createMissionGovernorProxy(governor, budgetHint) {
  const source = governor || createLoadGovernor();
  const hint = budgetHint || {};
  return {
    getBudget() {
      const base = typeof source.getBudget === 'function' ? source.getBudget() : {};
      return {
        ...base,
        maxHistoryMessages: Number.isFinite(hint.maxHistoryMessages) ? Math.max(1, Math.min(base.maxHistoryMessages || hint.maxHistoryMessages, hint.maxHistoryMessages)) : base.maxHistoryMessages,
        maxInputChars: Number.isFinite(hint.maxInputChars) ? Math.max(256, Math.min(base.maxInputChars || hint.maxInputChars, hint.maxInputChars)) : base.maxInputChars,
        maxOutputTokens: Number.isFinite(hint.maxOutputTokens) ? Math.max(64, Math.min(base.maxOutputTokens || hint.maxOutputTokens, hint.maxOutputTokens)) : base.maxOutputTokens,
        timeoutMs: Number.isFinite(hint.timeoutMs) ? Math.max(5000, Math.min(base.timeoutMs || hint.timeoutMs, hint.timeoutMs)) : base.timeoutMs
      };
    },
    beginRequest() {
      return source.beginRequest?.();
    },
    endRequest() {
      return source.endRequest?.();
    },
    abortAll() {
      return source.abortAll?.();
    },
    getStatus() {
      const status = source.getStatus?.() || {};
      return {
        ...status,
        missionBudgetHint: hint
      };
    }
  };
}

/**
 * @param {{ mode: any, prompt: any, orchestration: any, reply: any, budgetDecision?: any, taskClass?: any }} param0
 * @returns {any}
 */
export function buildMissionReceipt({ mode, prompt, orchestration, reply, budgetDecision = null, taskClass = '' }) {
  return {
    schema: 'mission-receipt/v1',
    missionId: orchestration?.planId || `mission-${Date.now()}`,
    mode,
    prompt: String(prompt || ''),
    planId: orchestration?.planId || '',
    action: orchestration?.action || '',
    idempotencyKey: orchestration?.policyDecision?.jobId || orchestration?.idempotencyKey || '',
    taskClass: taskClass || classifyMissionTaskMode(mode, orchestration?.taskType || mode, prompt),
    provider: orchestration?.providerSelection?.provider?.id || orchestration?.provider || '',
    model: orchestration?.model || orchestration?.providerSelection?.model || '',
    routing: reply?.meta?.routing || null,
    providerMeta: reply?.meta || null,
    budget: reply?.meta?.budget || orchestration?.budget || null,
    memory: reply?.meta?.memory || orchestration?.memory || null,
    routeExplanation: budgetDecision?.reason || orchestration?.providerSelection?.provider?.label || orchestration?.providerSelection?.provider?.id || 'guide',
    fallbackReason: reply?.meta?.routing?.reason || null,
    createdAt: Date.now()
  };
}

/**
 * @param {{ mode?: any, prompt?: any, systemPrompt?: any }} param0
 * @returns {string}
 */
export function buildGuideFallback({ mode, prompt: _prompt, systemPrompt }) {
  const modeLabel = String(mode || 'ask').toLowerCase();
  const detail = systemPrompt ? String(systemPrompt).split('\n').find((line) => line.trim()) || '' : '';
  const lead = modeLabel === 'ask'
    ? 'Guide mode is active. Connect an AI provider for richer responses.'
    : 'Guide mode is active. Connect an AI provider to continue.';
  return detail ? `${lead}\n${detail}` : lead;
}

/**
 * @param {any} param0
 * @returns {Promise<any>}
 */
export async function runMissionEngine({
  mode = 'ask',
  prompt = '',
  history = [],
  systemPrompt = '',
  settings = {},
  taskType = '',
  origin = 'workbench',
  metadata = {},
  requiresApproval = false,
  adminOverride = null,
  governor = null,
  onChunk,
  onDone,
  onError
}) {
  const intentText = String(prompt || '').trim();
  if (!intentText) {
    const msg = 'Ask a question first.';
    onError?.(msg);
    throw new Error(msg);
  }

  const baseSettings = { ...loadAISettings(), ...(settings || {}) };
  const configuredProvider = PROVIDERS[String(baseSettings.provider || 'guide').trim()] || PROVIDERS.guide;
  const hasUsableProvider = configuredProvider.id === 'guide'
    || !configuredProvider.requiresApiKey
    || Boolean(getApiKey(configuredProvider.id));

  if (!hasUsableProvider) {
    const fallbackText = buildGuideFallback({ mode, prompt: intentText, systemPrompt });
    const mission = buildMissionReceipt({
      mode,
      prompt: intentText,
      orchestration: {
        planId: `mission-${Date.now()}`,
        action: 'guide',
        providerSelection: { provider: { id: 'guide' }, model: '', taskType: 'guide' },
        provider: 'guide',
        model: '',
        status: 'guide-fallback'
      },
      reply: { meta: { providerId: 'guide', provider: 'Guide mode', model: '', routing: { provider: 'guide', reason: 'no-configured-provider' } } }
    });
    // The local Guide fallback is a completed answer, not a background agent.
    // It is still represented as a truthful local City signal so users can see
    // that no cloud/provider work was needed.
    recordAgentPresence({
      source: 'mission-engine',
      workRef: mission.missionId,
      action: 'guide',
      role: 'guide',
      status: 'complete',
      phase: 'guide',
      providerId: 'guide'
    });
    if (onChunk) onChunk(fallbackText);
    onDone?.(fallbackText);
    recordMissionReceipt(mission);
    return {
      text: fallbackText,
      meta: {
        provider: 'Guide mode',
        providerId: 'guide',
        model: '',
        local: true,
        elapsedMs: 0,
        routing: { provider: 'guide', reason: 'no-configured-provider' }
      },
      plan: null,
      mission
    };
  }

  const memoryState = loadMissionMemory();
  const taskHint = resolveMissionBudgetHint(mode, taskType);
  const requestedBudgetMode = String(metadata?.budgetMode || settings?.budgetMode || 'auto').trim().toLowerCase() || 'auto';
  const budgetDecision = resolveMissionBudgetDecision({
    taskType: taskType || mode,
    requestedBudgetMode,
    baseBudget: taskHint,
    memory: memoryState
  });
  const budgetHint = budgetDecision.budget || taskHint;
  const orchestration = createForegroundMissionPlan({
    baseSettings,
    intentText,
    origin,
    metadata: {
      ...metadata,
      mode,
      taskType: taskType || mode,
      requestedBudgetMode: budgetDecision.requestedBudgetMode,
      effectiveBudgetMode: budgetDecision.budgetMode,
      budgetReason: budgetDecision.reason,
      adminOverrideSupplied: Boolean(adminOverride)
    },
    taskType: taskType || mode,
    requiresApproval
  });

  if (orchestration?.status !== 'ready') {
    const reason =
      orchestration?.policyDecision?.reason ||
      orchestration?.reason ||
      orchestration?.error ||
      'Request could not be scheduled.';
    const pendingApproval = Boolean(orchestration?.policyDecision?.requiresApproval || orchestration?.policyDecision?.pendingApprovals?.length);
    recordAgentPresence({
      source: 'mission-engine',
      workRef: orchestration?.planId || orchestration?.policyDecision?.jobId || `mission-${Date.now()}`,
      action: taskType || mode,
      status: pendingApproval ? 'waiting' : 'failed',
      phase: pendingApproval ? 'waiting-approval' : 'failed',
      providerId: orchestration?.providerSelection?.provider?.id || baseSettings.provider || 'guide'
    });
    onDone?.(reason);
    return {
      text: reason,
      meta: null,
      plan: orchestration,
      mission: buildMissionReceipt({ mode, prompt: intentText, orchestration, reply: null })
    };
  }

  const routedSettings = { ...baseSettings };
  const activeGovernor = createMissionGovernorProxy(governor || createLoadGovernor(), budgetHint);
  const mission = buildMissionReceipt({
    mode,
    prompt: intentText,
    orchestration: {
      ...orchestration,
      budget: activeGovernor.getBudget(),
      memory: {
        budgetMode: budgetDecision.budgetMode,
        budgetModeLabel: budgetDecision.budgetModeLabel,
        budgetModeSource: budgetDecision.budgetModeSource,
        reason: budgetDecision.reason
      }
    },
    reply: null,
    budgetDecision,
    taskClass: classifyMissionTaskMode(mode, taskType || mode, intentText)
  });
  const sharedSettings = {
    ...routedSettings,
    systemPrompt: [systemPrompt, routedSettings.systemPrompt].filter(Boolean).join('\n\n'),
    budgetMode: budgetDecision.budgetMode,
    requestContext: {
      userInitiated: metadata?.userInitiated !== false,
      consentSource: String(metadata?.consentSource || `${origin}-user-action`).slice(0, 160),
      origin
    }
  };
  const presenceWorkRef = mission.missionId || orchestration?.planId || orchestration?.policyDecision?.jobId || `mission-${Date.now()}`;
  const presenceAction = taskType || mode || orchestration?.action || 'chat';
  const presenceProvider = orchestration?.providerSelection?.provider?.id || routedSettings.provider || 'guide';
  // A plan has been accepted. City can show a generic coordinator signal, but
  // it still cannot reveal prompt text, reply text, a model name or a secret.
  recordAgentPresence({
    source: 'mission-engine',
    workRef: presenceWorkRef,
    action: presenceAction,
    role: 'coordinator',
    status: 'active',
    phase: 'routing',
    providerId: presenceProvider
  });
  recordAgentPresence({
    source: 'mission-engine',
    workRef: presenceWorkRef,
    action: presenceAction,
    status: 'active',
    phase: 'working',
    providerId: presenceProvider
  });

  try {
    const reply = onChunk
      ? await createAIReplyStream({
          input: intentText,
          history,
          settings: sharedSettings,
          governor: activeGovernor,
          onChunk
        })
      : await createAIReply({
          input: intentText,
          history,
          settings: sharedSettings,
          governor: activeGovernor
        });

    const text = String(reply?.text || '');
    const enrichedMission = {
      ...mission,
      provider: reply?.meta?.providerId || mission.provider,
      model: reply?.meta?.model || mission.model,
      budget: {
        ...activeGovernor.getBudget(),
        mode: budgetDecision.budgetMode,
        label: budgetDecision.budgetModeLabel,
        source: budgetDecision.budgetModeSource,
        reason: budgetDecision.reason
      },
      routeExplanation: reply?.meta?.routing?.reason || budgetDecision.reason || mission.routeExplanation,
      completedAt: Date.now()
    };

    recordMissionMemory({
      missionId: enrichedMission.missionId,
      taskType: taskType || mode,
      mode,
      budgetMode: budgetDecision.budgetMode,
      providerId: reply?.meta?.providerId || mission.provider || '',
      providerLabel: reply?.meta?.provider || orchestration?.providerSelection?.provider?.label || orchestration?.providerSelection?.provider?.id || '',
      model: reply?.meta?.model || mission.model || '',
      outcome: 'success',
      summary: text,
      prompt: intentText,
      completedAt: enrichedMission.completedAt
    });
    recordMissionReceipt(enrichedMission);
    recordAgentPresence({
      source: 'mission-engine',
      workRef: presenceWorkRef,
      action: presenceAction,
      status: 'complete',
      phase: 'complete',
      providerId: reply?.meta?.providerId || presenceProvider
    });

    onDone?.(text);
    return {
      text,
      meta: {
        ...(reply?.meta || {}),
        budget: enrichedMission.budget,
        routeExplanation: enrichedMission.routeExplanation,
        memory: {
          budgetMode: budgetDecision.budgetMode,
          budgetModeLabel: budgetDecision.budgetModeLabel,
          budgetModeSource: budgetDecision.budgetModeSource,
          reason: budgetDecision.reason
        }
      },
      plan: orchestration,
      mission: enrichedMission,
      budget: enrichedMission.budget,
      routeExplanation: enrichedMission.routeExplanation,
      taskClass: mission.taskClass
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err || 'AI request failed.');
    recordAgentPresence({
      source: 'mission-engine',
      workRef: presenceWorkRef,
      action: presenceAction,
      status: 'failed',
      phase: 'failed',
      providerId: presenceProvider
    });
    onError?.(msg);
    throw err instanceof Error ? err : new Error(msg);
  }
}
