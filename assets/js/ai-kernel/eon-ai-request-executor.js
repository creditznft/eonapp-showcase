/**
 * A15 I10 — canonical foreground AI Request Executor.
 *
 * This authority owns the lifecycle around a single user-initiated model call.
 * Provider adapters remain in the maintained AI runtime, but they may not add
 * attempts, switch provider/model, or invent fallback behavior outside this
 * executor. Receipts contain metadata only — never prompts, replies or keys.
 */

export const EON_AI_REQUEST_EXECUTOR_SCHEMA = 'eonapp.ai-request-executor.a15.v1';
export const EON_AI_REQUEST_RECEIPT_SCHEMA = 'eonapp.ai-request-receipt.a15.v1';
export const EON_AI_REQUEST_MAX_ATTEMPTS = 1;

const TERMINAL_STATES = new Set(['completed', 'failed', 'cancelled']);

function freeze(value) { return Object.freeze(value); }
function text(value = '', max = 180) { return Array.from(String(value || '').trim()).filter((character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127; }).join('').slice(0, max); }
function integer(value = 0) { return Math.max(0, Math.floor(Number(value) || 0)); }
function nowMs(value) { return Number.isFinite(Number(value)) ? Number(value) : Date.now(); }
function requestId(cryptoApi = globalThis.crypto) {
  if (typeof cryptoApi?.randomUUID === 'function') return `ai-${cryptoApi.randomUUID()}`;
  const bytes = new Uint8Array(16);
  if (typeof cryptoApi?.getRandomValues === 'function') cryptoApi.getRandomValues(bytes);
  else throw new Error('Secure randomness is required for an AI request receipt.');
  return `ai-${[...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}
function abortReason(signal) {
  const reason = signal?.reason;
  if (typeof reason === 'string' && reason.trim()) return text(reason, 120);
  if (reason instanceof Error && reason.message) return text(reason.message, 120);
  return 'request-cancelled';
}
function composeAbortSignal(externalSignal, timeoutMs = 0) {
  const controller = new AbortController();
  let timeout = 0;
  const abortFromExternal = () => {
    try { controller.abort(externalSignal?.reason || 'request-cancelled'); } catch {}
  };
  if (externalSignal?.aborted) abortFromExternal();
  else externalSignal?.addEventListener?.('abort', abortFromExternal, { once: true });
  if (integer(timeoutMs) > 0) {
    timeout = setTimeout(() => {
      try { controller.abort('request-timeout'); } catch {}
    }, integer(timeoutMs));
    timeout?.unref?.();
  }
  return freeze({
    signal: controller.signal,
    cleanup() {
      if (timeout) clearTimeout(timeout);
      externalSignal?.removeEventListener?.('abort', abortFromExternal);
    }
  });
}

export function createEonAiRequestPlan(input = {}, options = {}) {
  const providerId = text(input.providerId, 80).toLowerCase();
  const model = text(input.model, 180);
  const mode = input.streaming === true ? 'stream' : 'batch';
  const userInitiated = input.userInitiated === true;
  const consentSource = text(input.consentSource, 160);
  const startedAt = nowMs(input.startedAt ?? options.now?.());
  const errors = [];
  if (!userInitiated) errors.push('user-initiation-required');
  if (!consentSource) errors.push('request-consent-required');
  if (!providerId || providerId === 'guide') errors.push('provider-required');
  if (!model) errors.push('model-required');
  if (input.allowProviderFallback === true || input.allowModelFallback === true) errors.push('silent-fallback-forbidden');
  return freeze({
    schema: EON_AI_REQUEST_EXECUTOR_SCHEMA,
    requestId: text(input.requestId, 140) || requestId(options.cryptoApi),
    state: errors.length ? 'rejected' : 'ready',
    errors: freeze(errors),
    origin: text(input.origin || 'unknown', 80),
    taskType: text(input.taskType || 'chat', 80),
    mode,
    providerId,
    model,
    endpointClass: text(input.endpointClass || 'provider-direct', 80),
    local: input.local === true,
    userInitiated,
    consentSource,
    inputChars: integer(input.inputChars),
    historyMessages: integer(input.historyMessages),
    attachmentCount: integer(input.attachmentCount),
    searchMode: input.searchMode === true,
    maxAttempts: EON_AI_REQUEST_MAX_ATTEMPTS,
    allowProviderFallback: false,
    allowModelFallback: false,
    startedAt
  });
}

function settlement(plan, state, details = {}) {
  const completedAt = nowMs(details.completedAt);
  return freeze({
    schema: EON_AI_REQUEST_RECEIPT_SCHEMA,
    requestId: plan.requestId,
    state: TERMINAL_STATES.has(state) ? state : 'failed',
    origin: plan.origin,
    taskType: plan.taskType,
    mode: plan.mode,
    providerId: plan.providerId,
    model: plan.model,
    local: plan.local,
    searchMode: plan.searchMode,
    attemptCount: integer(details.attemptCount),
    maxAttempts: EON_AI_REQUEST_MAX_ATTEMPTS,
    fallbackAttempted: false,
    providerChanged: false,
    modelChanged: false,
    userInitiated: plan.userInitiated,
    consentSource: plan.consentSource,
    startedAt: plan.startedAt,
    completedAt,
    elapsedMs: Math.max(0, completedAt - plan.startedAt),
    cancellationReason: state === 'cancelled' ? text(details.reason, 120) : '',
    errorCode: state === 'failed' ? text(details.errorCode || 'request-failed', 100) : '',
    containsPrompt: false,
    containsReply: false,
    containsApiKey: false,
    containsEndpointCredential: false
  });
}

export class EonAiRequestExecutionError extends Error {
  constructor(message, receipt) {
    super(message);
    this.name = 'EonAiRequestExecutionError';
    this.receipt = receipt;
  }
}

export async function executeEonAiRequest({ plan, transport, signal = null, timeoutMs = 0, now = () => Date.now() } = {}) {
  if (!plan || plan.schema !== EON_AI_REQUEST_EXECUTOR_SCHEMA || plan.state !== 'ready') {
    const reason = plan?.errors?.[0] || 'request-plan-invalid';
    const receipt = settlement(plan || createEonAiRequestPlan({}, { now }), 'failed', { attemptCount: 0, errorCode: reason, completedAt: now() });
    throw new EonAiRequestExecutionError(reason, receipt);
  }
  if (typeof transport !== 'function') {
    const receipt = settlement(plan, 'failed', { attemptCount: 0, errorCode: 'transport-required', completedAt: now() });
    throw new EonAiRequestExecutionError('transport-required', receipt);
  }
  if (signal?.aborted) {
    const receipt = settlement(plan, 'cancelled', { attemptCount: 0, reason: abortReason(signal), completedAt: now() });
    throw new EonAiRequestExecutionError('Request cancelled.', receipt);
  }

  const composed = composeAbortSignal(signal, timeoutMs);
  try {
    const value = await transport({ signal: composed.signal, attempt: 1, plan });
    if (composed.signal.aborted) {
      const receipt = settlement(plan, 'cancelled', { attemptCount: 1, reason: abortReason(composed.signal), completedAt: now() });
      throw new EonAiRequestExecutionError('Request cancelled.', receipt);
    }
    return freeze({ ok: true, value, receipt: settlement(plan, 'completed', { attemptCount: 1, completedAt: now() }) });
  } catch (error) {
    if (error instanceof EonAiRequestExecutionError) throw error;
    const cancelled = composed.signal.aborted || error?.name === 'AbortError';
    const receipt = settlement(plan, cancelled ? 'cancelled' : 'failed', {
      attemptCount: 1,
      reason: cancelled ? abortReason(composed.signal) : '',
      errorCode: cancelled ? '' : text(error?.code || error?.name || 'request-failed', 100),
      completedAt: now()
    });
    throw new EonAiRequestExecutionError(cancelled ? 'Request cancelled.' : text(error?.message || 'AI request failed.', 240), receipt);
  } finally {
    composed.cleanup();
  }
}

export function getEonAiRequestExecutorTruth() {
  return freeze({
    schema: EON_AI_REQUEST_EXECUTOR_SCHEMA,
    foregroundOnly: true,
    userInitiationRequired: true,
    consentSourceRequired: true,
    maxAttempts: EON_AI_REQUEST_MAX_ATTEMPTS,
    hiddenRetryAllowed: false,
    providerFallbackAllowed: false,
    modelFallbackAllowed: false,
    cancellationOwned: true,
    receiptContainsPrompt: false,
    receiptContainsReply: false,
    receiptContainsApiKey: false
  });
}

export default freeze({ createEonAiRequestPlan, executeEonAiRequest, getEonAiRequestExecutorTruth });
