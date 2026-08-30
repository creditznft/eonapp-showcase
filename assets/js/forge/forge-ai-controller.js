/**
 * W648 — trusted parent-page controller for Forge AI.
 *
 * Provider keys and requests remain inside the maintained shared AI runtime.
 * Generated source is returned as an isolated proposal and validated by the
 * Forge protocol before the workspace may review or apply it.
 */

import {
  PROVIDERS,
  createAIReply,
  getProviderVerification,
  loadAISettings
} from '../chat/ai-runtime.js';
import {
  FORGE_AI_ALLOWED_FILES,
  FORGE_AI_MAX_INPUT_CHARS,
  FORGE_AI_MAX_OUTPUT_TOKENS,
  buildForgeAiPrompt,
  validateForgeAiProposal
} from './forge-ai-protocol.js';

export const FORGE_AI_TIMEOUT_MS = 90_000;

function runtimeDefaults(overrides = {}) {
  return {
    providers: PROVIDERS,
    createAIReply,
    getProviderVerification,
    loadAISettings,
    ...overrides
  };
}

export function getForgeAiReadiness(settings = null, overrides = {}) {
  const runtime = runtimeDefaults(overrides);
  const current = settings || runtime.loadAISettings();
  const providerId = String(current?.provider || 'guide').trim().toLowerCase();
  const provider = runtime.providers?.[providerId] || runtime.providers?.guide || { id: 'guide', label: 'Guide only' };
  const proof = runtime.getProviderVerification(provider.id, current);
  const ready = Boolean(provider.id !== 'guide' && provider.enabled !== false && proof?.ready && proof?.model);
  return {
    ready,
    providerId: provider.id,
    providerLabel: provider.label || provider.id,
    model: ready ? String(proof.model || current?.model || '') : '',
    endpoint: ready ? String(proof.endpoint || provider.defaultEndpoint || current?.endpoint || '') : '',
    state: String(proof?.state || (provider.enabled === false ? 'provider-disabled' : 'verification-required')),
    reason: ready ? '' : String(provider.enabled === false ? provider.hint || `${provider.label} is not available in direct-browser mode.` : proof?.reason || 'Choose and verify an AI provider first.'),
    checkedAt: String(proof?.checkedAt || ''),
    settings: current
  };
}

export function createForgeAiGovernor(abortController = new AbortController()) {
  const budget = Object.freeze({
    maxHistoryMessages: 0,
    maxInputChars: FORGE_AI_MAX_INPUT_CHARS,
    maxOutputTokens: FORGE_AI_MAX_OUTPUT_TOKENS,
    timeoutMs: FORGE_AI_TIMEOUT_MS
  });
  return {
    getBudget: () => ({ ...budget }),
    beginRequest() {},
    endRequest() {},
    getStatus: () => ({ budget: { ...budget } }),
    createAbortController: () => abortController
  };
}

async function withForgeTimeout(promise, timeoutMs, abortController) {
  let timer = 0;
  try {
    return await Promise.race([
      promise,
      new Promise((_resolve, reject) => {
        timer = setTimeout(() => {
          try { abortController?.abort('forge-timeout'); } catch {}
          reject(new Error('Forge AI timed out before a complete proposal arrived. No project files were changed.'));
        }, timeoutMs);
        timer?.unref?.();
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function runForgeAiRequest({
  mode = 'improve',
  action = 'improve',
  title = '',
  type = 'website',
  brief = '',
  instruction = '',
  files = {},
  selectedPaths = FORGE_AI_ALLOWED_FILES,
  requestId = '',
  timeoutMs = FORGE_AI_TIMEOUT_MS,
  cancelToken = { cancelled: false },
  abortController = new AbortController(),
  settings = null
} = {}, overrides = {}) {
  const runtime = runtimeDefaults(overrides);
  const readiness = getForgeAiReadiness(settings, runtime);
  if (!readiness.ready) return { ok: false, state: 'not-ready', error: readiness.reason, readiness };
  if (cancelToken?.cancelled) return { ok: false, state: 'cancelled', error: 'Forge AI was cancelled before the request started.', readiness };

  const id = String(requestId || `forge-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  let prompt = '';
  try {
    prompt = buildForgeAiPrompt({ requestId: id, mode, action, title, type, brief, instruction, files, selectedPaths });
  } catch (error) {
    return { ok: false, state: 'rejected-before-request', error: error?.message || 'Forge could not prepare this request.', readiness };
  }

  try {
    const response = await withForgeTimeout(runtime.createAIReply({
        input: prompt,
        history: [],
        settings: {
          ...readiness.settings,
          provider: readiness.providerId,
          model: readiness.model,
          endpoint: readiness.endpoint,
          assistantMode: 'advanced',
          taskType: 'forge-code',
          temperature: 0.2,
          maxTokens: FORGE_AI_MAX_OUTPUT_TOKENS,
          abortSignal: abortController.signal,
          requestContext: { userInitiated: true, consentSource: 'forge-reviewed-source-selection', origin: 'forge' }
        },
        governor: createForgeAiGovernor(abortController)
      }), Math.max(5_000, Number(timeoutMs) || FORGE_AI_TIMEOUT_MS), abortController);
    if (cancelToken?.cancelled) return { ok: false, state: 'cancelled', error: 'Forge AI was cancelled. The returned proposal was discarded and no files changed.', readiness };
    if (String(response?.meta?.providerId || '') !== readiness.providerId) return { ok: false, state: 'provider-mismatch', error: 'The response came from a different provider than the one you approved. It was discarded.', readiness };
    if (String(response?.meta?.model || '') !== readiness.model) return { ok: false, state: 'model-mismatch', error: 'The response came from a different model than the verified model. It was discarded.', readiness };

    const validated = validateForgeAiProposal({ rawText: response?.text || '', requestId: id, mode, action, baseFiles: files, selectedPaths });
    if (!validated.ok) return { ok: false, state: 'invalid-proposal', error: validated.error, readiness, settlement: response?.meta || null };
    return {
      ok: true,
      state: 'proposal-ready',
      readiness,
      proposal: {
        ...validated.proposal,
        providerId: readiness.providerId,
        providerLabel: readiness.providerLabel,
        model: readiness.model,
        requestedAt: new Date().toISOString(),
        settlement: {
          providerId: String(response?.meta?.providerId || ''),
          model: String(response?.meta?.model || ''),
          elapsedMs: Math.max(0, Number(response?.meta?.elapsedMs) || 0),
          local: response?.meta?.local === true,
          status: 'completed'
        }
      }
    };
  } catch (error) {
    if (cancelToken?.cancelled || (abortController?.signal?.aborted && abortController?.signal?.reason === 'forge-cancelled')) {
      return { ok: false, state: 'cancelled', error: 'Forge AI was cancelled. No project files were changed.', readiness };
    }
    const message = String(error?.message || 'Forge AI request failed.');
    const state = /timed out|forge-timeout/i.test(message) || abortController?.signal?.reason === 'forge-timeout' ? 'timeout' : /401|unauthor/i.test(message) ? 'unauthorized' : /402|payment/i.test(message) ? 'payment-required' : /429|rate/i.test(message) ? 'rate-limited' : 'request-failed';
    return { ok: false, state, error: `${message} No project files were changed.`, readiness };
  }
}
