import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { PROVIDERS, buildPerplexitySonarPayload } from '../../assets/js/chat/ai-runtime.js';
import {
  createEonProviderExecutionContract,
  getEonProviderExecutionContractTruth
} from '../../assets/js/ai-kernel/eon-provider-execution-contract.js';
import {
  createEonAiProvenanceReceipt,
  getEonAiProvenanceReceiptTruth,
  normalizeEonProviderUsage
} from '../../assets/js/ai-kernel/eon-ai-provenance-receipt.js';
import {
  addLocalAttachments,
  clearQueuedLocalAttachments,
  getQueuedLocalAttachmentRequest
} from '../../assets/js/chat/local-attachments.js';

function fakeFile({ name, type = 'text/plain', content = '', lastModified = 1 } = {}) {
  const payload = String(content);
  return {
    name,
    type,
    size: Buffer.byteLength(payload),
    lastModified,
    async text() { return payload; },
    slice() { return this; }
  };
}

test('A15 I11 disables Perplexity provider search for every ordinary request', () => {
  const contract = createEonProviderExecutionContract(PROVIDERS.perplexity, {});
  assert.equal(contract.protocol, 'perplexity-sonar');
  assert.equal(contract.search.enabled, false);
  assert.equal(contract.search.ordinaryRequestDisableSearch, true);
  assert.equal(contract.search.state, 'disabled-for-ordinary-request');
  const payload = buildPerplexitySonarPayload({ model: 'sonar-pro' }, [{ role: 'user', content: 'hello' }], { maxOutputTokens: 300 }, { providerContract: contract });
  assert.equal(payload.disable_search, true);
  assert.equal(payload.stream, undefined);
});

test('A15 I11 enables provider search only with an explicit labelled consent source', () => {
  const blocked = createEonProviderExecutionContract(PROVIDERS.perplexity, { searchMode: true });
  assert.equal(blocked.search.enabled, false);
  assert.equal(blocked.search.state, 'blocked-missing-explicit-search-consent');
  const allowed = createEonProviderExecutionContract(PROVIDERS.perplexity, {
    searchMode: true,
    searchConsentSource: 'labelled-provider-search-action'
  });
  assert.equal(allowed.search.enabled, true);
  const payload = buildPerplexitySonarPayload({ model: 'sonar-pro' }, [], { maxOutputTokens: 100 }, { stream: true, providerContract: allowed });
  assert.equal(payload.disable_search, false);
  assert.equal(payload.stream, true);
});

test('A15 I11 normalizes only provider-reported usage and never invents cost', () => {
  assert.deepEqual(normalizeEonProviderUsage({ prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 }), {
    status: 'provider-reported',
    inputTokens: 12,
    outputTokens: 8,
    totalTokens: 20,
    costStatus: 'not-reported-by-provider',
    providerCost: null,
    currency: '',
    estimatedByEonapp: false
  });
  const absent = normalizeEonProviderUsage({});
  assert.equal(absent.status, 'not-reported-by-provider');
  assert.equal(absent.totalTokens, null);
  assert.equal(absent.providerCost, null);
});

test('A15 I11 provenance records context omissions and citations without private content', () => {
  const contract = createEonProviderExecutionContract(PROVIDERS.perplexity, {});
  const receipt = createEonAiProvenanceReceipt({
    requestId: 'ai-i11-test',
    providerId: 'perplexity',
    providerContract: contract,
    inputChars: 420,
    systemPromptIncluded: true,
    historyRequested: 20,
    historyIncluded: 8,
    attachmentCoverage: {
      total: 3,
      includedText: 1,
      omitted: 2,
      byKind: { text: 1, image: 1, pdf: 1 },
      omissions: [
        { kind: 'image', count: 1, reason: 'local-image-preview-only' },
        { kind: 'pdf', count: 1, reason: 'local-pdf-preview-only' }
      ]
    },
    usage: { prompt_tokens: 10, completion_tokens: 5 },
    citations: [{ title: 'Source', url: 'https://example.com/source' }],
    searchResults: [{ title: 'Result', url: 'https://example.com/result' }]
  });
  assert.equal(receipt.context.historyOmitted, 12);
  assert.equal(receipt.context.attachments.includedText, 1);
  assert.equal(receipt.context.attachments.omitted, 2);
  assert.equal(receipt.search.disableSearchSent, true);
  assert.equal(receipt.search.citationCount, 1);
  assert.equal(receipt.search.evidenceUnexpectedWhileDisabled, true);
  assert.equal(receipt.cost.amount, null);
  assert.equal(receipt.cost.estimatedByEonapp, false);
  assert.equal(receipt.containsPrompt, false);
  assert.equal(receipt.containsReply, false);
  assert.equal(receipt.containsAttachmentNames, false);
  assert.doesNotMatch(JSON.stringify(receipt), /private prompt|attachment-name|attachment body/i);
});

test('A15 I11 local attachment intake exposes redacted inclusion and omission coverage', async () => {
  clearQueuedLocalAttachments();
  await addLocalAttachments([
    fakeFile({ name: 'brief.txt', content: 'Public draft text.' }),
    fakeFile({ name: 'moodboard.png', type: 'image/png', content: 'binary' }),
    fakeFile({ name: 'source.pdf', type: 'application/pdf', content: 'binary' })
  ]);
  const request = getQueuedLocalAttachmentRequest();
  assert.equal(request.coverage.total, 3);
  assert.equal(request.coverage.includedText, 1);
  assert.equal(request.coverage.omitted, 2);
  assert.deepEqual(request.coverage.byKind, { text: 1, image: 1, pdf: 1 });
  assert.equal(request.coverage.containsNames, false);
  assert.doesNotMatch(JSON.stringify(request.coverage), /brief\.txt|moodboard\.png|source\.pdf/);
  clearQueuedLocalAttachments();
});

test('A15 I11 runtime and Chat wire one provenance authority through batch and stream paths', () => {
  const runtime = readFileSync(new URL('../../assets/js/chat/ai-runtime.js', import.meta.url), 'utf8');
  const chat = readFileSync(new URL('../../assets/js/chat-page.js', import.meta.url), 'utf8');
  assert.match(runtime, /createEonProviderExecutionContract/);
  assert.match(runtime, /createEonAiProvenanceReceipt/);
  assert.match(runtime, /disable_search/);
  assert.match(runtime, /citations: execution\.provenanceReceipt\.search\.citations/);
  assert.match(runtime, /citations: provenanceReceipt\.search\.citations/);
  assert.match(chat, /attachmentCoverage: attachmentRequest\.coverage/);
  assert.doesNotMatch(runtime, /estimatedCost|pricePerToken|inventedCost/i);
});

test('A15 I11 truth contracts preserve source and cost honesty', () => {
  const providerTruth = getEonProviderExecutionContractTruth();
  const receiptTruth = getEonAiProvenanceReceiptTruth();
  assert.equal(providerTruth.ordinaryProviderSearchDefault, 'disabled');
  assert.equal(providerTruth.explicitSearchConsentRequired, true);
  assert.equal(providerTruth.inventedCostAllowed, false);
  assert.equal(receiptTruth.contextInclusionAndOmissionRecorded, true);
  assert.equal(receiptTruth.citationsPreserved, true);
  assert.equal(receiptTruth.promptStored, false);
  assert.equal(receiptTruth.attachmentContentStored, false);
});
