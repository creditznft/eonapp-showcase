/**
 * A15 I11 — redacted AI context, search, usage and cost provenance receipt.
 *
 * Receipts explain what was included or omitted and what the provider reported.
 * They never contain prompts, replies, attachment names/content or credentials.
 */

export const EON_AI_PROVENANCE_RECEIPT_SCHEMA = 'eonapp.ai-provenance-receipt.a15.v1';

const freeze = (value) => Object.freeze(value);
const count = (value = 0) => Math.max(0, Math.floor(Number(value) || 0));
const clean = (value = '', max = 220) => Array.from(String(value || '')).filter((character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127; }).join('').trim().slice(0, max);

const SENSITIVE_URL_KEYS = new Set(['access_token', 'api_key', 'apikey', 'auth', 'authorization', 'code', 'credential', 'key', 'password', 'secret', 'session', 'sig', 'signature', 'state', 'token']);
function safeCitationUrl(value = '') {
  try {
    const parsed = new URL(String(value || '').trim());
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) return '';
    for (const key of [...parsed.searchParams.keys()]) {
      if (SENSITIVE_URL_KEYS.has(String(key || '').toLowerCase())) parsed.searchParams.delete(key);
    }
    parsed.hash = '';
    return parsed.toString().slice(0, 1000);
  } catch {
    return '';
  }
}

function firstNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number >= 0) return Math.floor(number);
  }
  return null;
}

export function normalizeEonProviderUsage(value = {}) {
  const raw = value && typeof value === 'object' ? value : {};
  const inputTokens = firstNumber(raw.inputTokens, raw.input_tokens, raw.promptTokens, raw.prompt_tokens, raw.promptTokenCount, raw.prompt_eval_count, raw?.tokens?.input_tokens);
  const outputTokens = firstNumber(raw.outputTokens, raw.output_tokens, raw.completionTokens, raw.completion_tokens, raw.candidatesTokenCount, raw.eval_count, raw?.tokens?.output_tokens);
  const reportedTotal = firstNumber(raw.totalTokens, raw.total_tokens, raw.totalTokenCount, raw?.tokens?.total_tokens);
  const totalTokens = reportedTotal ?? (inputTokens !== null && outputTokens !== null ? inputTokens + outputTokens : null);
  const providerCost = Number.isFinite(Number(raw.cost)) && Number(raw.cost) >= 0 ? Number(raw.cost) : null;
  const currency = providerCost === null ? '' : clean(raw.currency || raw.costCurrency || '', 12).toUpperCase();
  return freeze({
    status: inputTokens === null && outputTokens === null && totalTokens === null ? 'not-reported-by-provider' : 'provider-reported',
    inputTokens,
    outputTokens,
    totalTokens,
    costStatus: providerCost === null ? 'not-reported-by-provider' : 'provider-reported',
    providerCost,
    currency,
    estimatedByEonapp: false
  });
}

function normalizeCitation(value, index) {
  if (typeof value === 'string') {
    const url = safeCitationUrl(value);
    return url ? freeze({ index: index + 1, title: '', url, capturedAt: '', source: 'provider-response' }) : null;
  }
  const item = value && typeof value === 'object' ? value : {};
  const url = safeCitationUrl(item.url || item.link || item.source || '');
  const title = clean(item.title || item.name || '', 240);
  if (!url && !title) return null;
  return freeze({
    index: index + 1,
    title,
    url,
    capturedAt: clean(item.capturedAt || item.date || '', 80),
    source: clean(item.sourceType || item.source || 'provider-response', 80)
  });
}

export function normalizeEonCitations(values = []) {
  return freeze((Array.isArray(values) ? values : []).map(normalizeCitation).filter(Boolean).slice(0, 40));
}

export function normalizeEonSearchResults(values = []) {
  return freeze((Array.isArray(values) ? values : []).map((value, index) => {
    const item = value && typeof value === 'object' ? value : {};
    const url = safeCitationUrl(item.url || item.link || '');
    const title = clean(item.title || item.name || '', 240);
    if (!url && !title) return null;
    return freeze({ index: index + 1, title, url, date: clean(item.date || item.publishedAt || '', 80) });
  }).filter(Boolean).slice(0, 40));
}

function normalizeAttachmentCoverage(value = {}) {
  const raw = value && typeof value === 'object' ? value : {};
  const byKind = raw.byKind && typeof raw.byKind === 'object' ? raw.byKind : {};
  const omissions = Array.isArray(raw.omissions) ? raw.omissions : [];
  return freeze({
    total: count(raw.total),
    includedText: count(raw.includedText),
    omitted: count(raw.omitted),
    byKind: freeze(Object.fromEntries(Object.entries(byKind).map(([key, amount]) => [clean(key, 40), count(amount)]).filter(([key]) => key))),
    omissions: freeze(omissions.map((item) => freeze({
      kind: clean(item?.kind || 'unknown', 40),
      count: count(item?.count),
      reason: clean(item?.reason || 'not-included', 100)
    })).filter((item) => item.count > 0).slice(0, 20)),
    containsNames: false,
    containsContent: false
  });
}

export function createEonAiProvenanceReceipt(input = {}) {
  const providerContract = input.providerContract && typeof input.providerContract === 'object' ? input.providerContract : {};
  const usage = normalizeEonProviderUsage(input.usage);
  const citations = normalizeEonCitations(input.citations);
  const searchResults = normalizeEonSearchResults(input.searchResults);
  const requestedHistory = count(input.historyRequested);
  const includedHistory = Math.min(requestedHistory, count(input.historyIncluded));
  const attachmentCoverage = normalizeAttachmentCoverage(input.attachmentCoverage);
  const clientResearchSources = count(input.clientResearchSources);
  const searchEnabled = providerContract?.search?.enabled === true;
  const providerSearchEvidenceUnexpected = providerContract?.search?.ordinaryRequestDisableSearch === true && (citations.length > 0 || searchResults.length > 0);

  return freeze({
    schema: EON_AI_PROVENANCE_RECEIPT_SCHEMA,
    requestId: clean(input.requestId, 160),
    providerId: clean(input.providerId, 80),
    protocol: clean(providerContract.protocol, 80),
    context: freeze({
      inputChars: count(input.inputChars),
      systemPromptIncluded: input.systemPromptIncluded === true,
      historyRequested: requestedHistory,
      historyIncluded: includedHistory,
      historyOmitted: Math.max(0, requestedHistory - includedHistory),
      attachments: attachmentCoverage,
      clientResearchSources,
      clientResearchIncluded: clientResearchSources > 0,
      forgeIsolation: input.forgeIsolation === true
    }),
    search: freeze({
      requested: providerContract?.search?.requested === true,
      enabled: searchEnabled,
      state: clean(providerContract?.search?.state, 120),
      disableSearchSent: providerContract?.search?.ordinaryRequestDisableSearch === true,
      citations,
      searchResults,
      citationCount: citations.length,
      searchResultCount: searchResults.length,
      evidenceUnexpectedWhileDisabled: providerSearchEvidenceUnexpected
    }),
    usage,
    cost: freeze({
      billingAuthority: clean(providerContract?.usage?.billingAuthority || 'user-provider-account', 80),
      status: usage.costStatus,
      amount: usage.providerCost,
      currency: usage.currency,
      estimatedByEonapp: false,
      hiddenRetryCostPossible: false
    }),
    containsPrompt: false,
    containsReply: false,
    containsApiKey: false,
    containsAttachmentNames: false,
    containsAttachmentContent: false,
    containsResearchExtracts: false
  });
}

export function getEonAiProvenanceReceiptTruth() {
  return freeze({
    schema: EON_AI_PROVENANCE_RECEIPT_SCHEMA,
    contextInclusionAndOmissionRecorded: true,
    providerSearchTruthRecorded: true,
    citationsPreserved: true,
    providerUsageOnly: true,
    inventedCostAllowed: false,
    promptStored: false,
    replyStored: false,
    apiKeyStored: false,
    attachmentNamesStored: false,
    attachmentContentStored: false,
    researchExtractsStored: false
  });
}

export default freeze({ createEonAiProvenanceReceipt, normalizeEonProviderUsage, normalizeEonCitations, normalizeEonSearchResults, getEonAiProvenanceReceiptTruth });
