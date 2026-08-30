/**
 * Local institutional model-evaluation ledger.
 *
 * Stores bounded numeric/operational evidence only. Prompts, responses,
 * credentials and raw provider payloads are deliberately excluded.
 */
export const EON_AI_EVALUATION_SCHEMA = 'eonapp.ai-evaluation-ledger.v2';
export const EON_AI_EVALUATION_STORAGE_KEY = 'eon:ai-evaluation-ledger:v1';
export const EON_AI_EVALUATION_MAX_RECORDS = 240;
export const EON_AI_EVALUATION_MAX_AGE_MS = 45 * 24 * 60 * 60 * 1000;

// Sanitization deliberately removes control characters before storing local evidence.
// eslint-disable-next-line no-control-regex
const clean = (value = '', max = 120) => String(value || '').replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const clamp = (value, min, max, fallback = 0) => Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Number(value))) : fallback;
function store(target) { if (target?.getItem && target?.setItem) return target; try { return localStorage; } catch { return null; } }
function read(target) { try { const raw = JSON.parse(store(target)?.getItem(EON_AI_EVALUATION_STORAGE_KEY) || '{}'); return Array.isArray(raw.records) ? raw.records : []; } catch { return []; } }
function write(records, target) { try { store(target)?.setItem(EON_AI_EVALUATION_STORAGE_KEY, JSON.stringify({ schema: EON_AI_EVALUATION_SCHEMA, records: records.slice(0, EON_AI_EVALUATION_MAX_RECORDS) })); return true; } catch { return false; } }

export function normalizeEonAiEvaluation(input = {}, options = {}) {
  if (options.explicitForegroundTest !== true) return Object.freeze({ ok: false, reason: 'explicit-foreground-test-required', record: null });
  const providerId = clean(input.providerId, 64).toLowerCase();
  const modelId = clean(input.modelId, 160);
  const taskType = clean(input.taskType || 'chat', 64).toLowerCase();
  if (!providerId || !modelId) return Object.freeze({ ok: false, reason: 'provider-and-model-required', record: null });
  const now = Number(options.now ?? Date.now());
  const success = input.success === true;
  const record = Object.freeze({
    schema: EON_AI_EVALUATION_SCHEMA,
    id: clean(input.id || `eval-${providerId}-${now}-${Math.random().toString(36).slice(2, 8)}`, 160),
    providerId,
    modelId,
    taskType,
    local: input.local === true,
    evidenceType: 'foreground-test',
    userInitiated: true,
    success,
    latencyMs: clamp(input.latencyMs, 0, 10 * 60 * 1000),
    firstTokenLatencyMs: clamp(input.firstTokenLatencyMs, 0, 10 * 60 * 1000),
    tokensPerSecond: clamp(input.tokensPerSecond, 0, 100000),
    qualityScore: clamp(input.qualityScore, 0, 100),
    qualityScored: input.qualityScore !== undefined && input.qualityScore !== null,
    structuredOutputValid: input.structuredOutputValid === true,
    toolResultValid: input.toolResultValid === true,
    outputReceiptValid: input.outputReceiptValid === true,
    failureClass: success ? '' : clean(input.failureClass || 'unknown-failure', 64).toLowerCase(),
    checkedAt: now,
    promptStored: false,
    responseStored: false,
    providerPayloadStored: false,
    credentialStored: false
  });
  return Object.freeze({ ok: true, reason: null, record });
}

const OPERATIONAL_FAILURE_CLASSES = new Set(['cancelled', 'timeout', 'network', 'rate-limit', 'model-unavailable', 'provider-error', 'unknown']);

/**
 * Normalizes evidence from an actual foreground AI request. This is deliberately
 * narrower than a quality evaluation: it may learn reliability and speed but it
 * cannot claim output quality, structured-output validity or tool correctness.
 */
export function normalizeEonAiOperationalOutcome(input = {}, options = {}) {
  if (options.userInitiatedRequest !== true) return Object.freeze({ ok: false, reason: 'user-initiated-request-required', record: null });
  const providerId = clean(input.providerId, 64).toLowerCase();
  const modelId = clean(input.modelId, 160);
  const taskType = clean(input.taskType || 'chat', 64).toLowerCase();
  if (!providerId || !modelId) return Object.freeze({ ok: false, reason: 'provider-and-model-required', record: null });
  const now = Number(options.now ?? Date.now());
  const success = input.success === true;
  const rawFailure = clean(input.failureClass || 'unknown', 64).toLowerCase();
  const failureClass = success ? '' : (OPERATIONAL_FAILURE_CLASSES.has(rawFailure) ? rawFailure : 'unknown');
  const record = Object.freeze({
    schema: EON_AI_EVALUATION_SCHEMA,
    id: clean(input.id || `ops-${providerId}-${now}-${Math.random().toString(36).slice(2, 8)}`, 160),
    providerId,
    modelId,
    taskType,
    local: input.local === true,
    evidenceType: 'foreground-operation',
    userInitiated: true,
    success,
    latencyMs: clamp(input.latencyMs, 0, 10 * 60 * 1000),
    firstTokenLatencyMs: clamp(input.firstTokenLatencyMs, 0, 10 * 60 * 1000),
    tokensPerSecond: clamp(input.tokensPerSecond, 0, 100000),
    qualityScore: 0,
    qualityScored: false,
    structuredOutputValid: false,
    toolResultValid: false,
    outputReceiptValid: false,
    failureClass,
    checkedAt: now,
    promptStored: false,
    responseStored: false,
    errorTextStored: false,
    providerPayloadStored: false,
    credentialStored: false
  });
  return Object.freeze({ ok: true, reason: null, record });
}

export function recordEonAiOperationalOutcome(input = {}, options = {}) {
  const normalized = normalizeEonAiOperationalOutcome(input, options);
  if (!normalized.ok) return normalized;
  const now = Number(options.now ?? Date.now());
  const rows = [normalized.record, ...read(options.storage)]
    .filter((row) => Number(row?.checkedAt || 0) >= now - EON_AI_EVALUATION_MAX_AGE_MS)
    .slice(0, EON_AI_EVALUATION_MAX_RECORDS);
  return Object.freeze({ ok: write(rows, options.storage), reason: null, record: normalized.record, count: rows.length });
}

function stableFeedbackToken(value = '') {
  let hash = 2166136261;
  for (const char of String(value || '')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Records an explicit user quality signal without copying the prompt/reply into
 * the evaluation ledger. A repeated rating for the same request replaces the
 * prior rating instead of accumulating duplicate votes.
 */
export function recordEonAiUserQualityFeedback(input = {}, options = {}) {
  if (options.explicitUserFeedback !== true) return Object.freeze({ ok: false, reason: 'explicit-user-feedback-required', record: null });
  const providerId = clean(input.providerId, 64).toLowerCase();
  const modelId = clean(input.modelId, 160);
  const taskType = clean(input.taskType || 'chat', 64).toLowerCase();
  const rating = clean(input.rating, 24).toLowerCase();
  if (!providerId || !modelId) return Object.freeze({ ok: false, reason: 'provider-and-model-required', record: null });
  if (!['positive', 'negative'].includes(rating)) return Object.freeze({ ok: false, reason: 'binary-rating-required', record: null });
  const now = Number(options.now ?? Date.now());
  const requestToken = stableFeedbackToken(clean(input.requestId || `${providerId}:${modelId}:${taskType}:${now}`, 180));
  const record = Object.freeze({
    schema: EON_AI_EVALUATION_SCHEMA,
    id: `feedback-${requestToken}`,
    providerId,
    modelId,
    taskType,
    local: input.local === true,
    evidenceType: 'user-quality-feedback',
    userInitiated: true,
    success: false,
    latencyMs: 0,
    firstTokenLatencyMs: 0,
    tokensPerSecond: 0,
    qualityScore: rating === 'positive' ? 100 : 0,
    qualityScored: true,
    rating,
    structuredOutputValid: false,
    toolResultValid: false,
    outputReceiptValid: false,
    failureClass: '',
    checkedAt: now,
    promptStored: false,
    responseStored: false,
    errorTextStored: false,
    providerPayloadStored: false,
    credentialStored: false
  });
  const rows = [record, ...read(options.storage).filter((row) => row?.id !== record.id)]
    .filter((row) => Number(row?.checkedAt || 0) >= now - EON_AI_EVALUATION_MAX_AGE_MS)
    .slice(0, EON_AI_EVALUATION_MAX_RECORDS);
  return Object.freeze({ ok: write(rows, options.storage), reason: null, record, count: rows.length });
}

export function recordEonAiEvaluation(input = {}, options = {}) {
  const normalized = normalizeEonAiEvaluation(input, options);
  if (!normalized.ok) return normalized;
  const now = Number(options.now ?? Date.now());
  const rows = [normalized.record, ...read(options.storage)]
    .filter((row) => Number(row?.checkedAt || 0) >= now - EON_AI_EVALUATION_MAX_AGE_MS)
    .slice(0, EON_AI_EVALUATION_MAX_RECORDS);
  return Object.freeze({ ok: write(rows, options.storage), reason: null, record: normalized.record, count: rows.length });
}

export function listEonAiEvaluations(options = {}) {
  const now = Number(options.now ?? Date.now());
  const providerId = clean(options.providerId, 64).toLowerCase();
  const modelId = clean(options.modelId, 160);
  const taskType = clean(options.taskType, 64).toLowerCase();
  const rows = read(options.storage).filter((row) => (
    Number(row?.checkedAt || 0) >= now - EON_AI_EVALUATION_MAX_AGE_MS
    && (!providerId || row.providerId === providerId)
    && (!modelId || row.modelId === modelId)
    && (!taskType || row.taskType === taskType)
  ));
  return Object.freeze(rows.slice(0, Math.max(1, Math.min(Number(options.limit || 80), EON_AI_EVALUATION_MAX_RECORDS))).map(Object.freeze));
}

export function summarizeEonAiModelEvidence(providerId = '', modelId = '', options = {}) {
  const rows = listEonAiEvaluations({ ...options, providerId, modelId, limit: EON_AI_EVALUATION_MAX_RECORDS });
  if (!rows.length) return Object.freeze({ sampleCount: 0, reliability: 0, evalScore: 0, measuredTokensPerSecond: 0, firstTokenLatencyMs: 0, lastCheckedAt: 0 });
  const reliabilityRows = rows.filter((row) => row.evidenceType !== 'user-quality-feedback');
  const successes = reliabilityRows.filter((row) => row.success);
  const qualityRows = rows.filter((row) => row.qualityScored === true || (row.evidenceType !== 'foreground-operation' && row.evidenceType !== 'user-quality-feedback' && Number(row.qualityScore || 0) > 0));
  const speedRows = successes.filter((row) => Number(row.tokensPerSecond || 0) > 0);
  const firstTokenRows = successes.filter((row) => Number(row.firstTokenLatencyMs || 0) > 0);
  const avg = (field, source = rows) => source.length ? source.reduce((sum, row) => sum + Number(row[field] || 0), 0) / source.length : 0;
  return Object.freeze({
    sampleCount: rows.length,
    operationalSampleCount: rows.filter((row) => row.evidenceType === 'foreground-operation').length,
    userFeedbackSampleCount: rows.filter((row) => row.evidenceType === 'user-quality-feedback').length,
    qualitySampleCount: qualityRows.length,
    reliability: reliabilityRows.length ? successes.length / reliabilityRows.length : 0,
    evalScore: avg('qualityScore', qualityRows),
    measuredTokensPerSecond: avg('tokensPerSecond', speedRows),
    firstTokenLatencyMs: avg('firstTokenLatencyMs', firstTokenRows),
    structuredOutputPassRate: reliabilityRows.length ? reliabilityRows.filter((row) => row.structuredOutputValid).length / reliabilityRows.length : 0,
    toolPassRate: reliabilityRows.length ? reliabilityRows.filter((row) => row.toolResultValid).length / reliabilityRows.length : 0,
    outputReceiptPassRate: reliabilityRows.length ? reliabilityRows.filter((row) => row.outputReceiptValid).length / reliabilityRows.length : 0,
    lastCheckedAt: Math.max(...rows.map((row) => Number(row.checkedAt || 0)))
  });
}

export function clearEonAiEvaluations(options = {}) { try { store(options.storage)?.removeItem(EON_AI_EVALUATION_STORAGE_KEY); return true; } catch { return false; } }
export function getEonAiEvaluationTruth() { return Object.freeze({ schema: EON_AI_EVALUATION_SCHEMA, boundedLocalEvidence: true, promptStored: false, responseStored: false, errorTextStored: false, credentialStored: false, providerPayloadStored: false, backgroundBenchmarking: false, explicitForegroundTestRequiredForQuality: true, foregroundOperationalLearning: true, operationalQualityInference: false, explicitUserQualityFeedback: true, feedbackStoresMessageContent: false, userInitiatedRequestsOnly: true }); }
