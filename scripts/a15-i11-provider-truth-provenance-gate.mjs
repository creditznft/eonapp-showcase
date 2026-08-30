import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PROVIDERS, buildPerplexitySonarPayload } from '../assets/js/chat/ai-runtime.js';
import { createEonProviderExecutionContract, getEonProviderExecutionContractTruth } from '../assets/js/ai-kernel/eon-provider-execution-contract.js';
import { createEonAiProvenanceReceipt, getEonAiProvenanceReceiptTruth } from '../assets/js/ai-kernel/eon-ai-provenance-receipt.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EVIDENCE_DIR = path.join(ROOT, 'docs/institutional/a15/evidence');
const OUTPUT = path.join(EVIDENCE_DIR, 'A15_I11_PROVIDER_TRUTH_PROVENANCE_GATE_RECEIPT.json');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const read = (relative) => readFileSync(path.join(ROOT, relative), 'utf8');
const errors = [];

const runtimeSource = read('assets/js/chat/ai-runtime.js');
const chatSource = read('assets/js/chat-page.js');
const attachmentSource = read('assets/js/chat/local-attachments.js');
const provenanceSource = read('assets/js/ai-kernel/eon-ai-provenance-receipt.js');

const ordinaryContract = createEonProviderExecutionContract(PROVIDERS.perplexity, {});
const blockedSearchContract = createEonProviderExecutionContract(PROVIDERS.perplexity, { searchMode: true });
const explicitSearchContract = createEonProviderExecutionContract(PROVIDERS.perplexity, {
  searchMode: true,
  searchConsentSource: 'a15-i11-labelled-search-action'
});
const ordinaryPayload = buildPerplexitySonarPayload({ model: 'provider-verified-model' }, [{ role: 'user', content: 'private test prompt' }], { maxOutputTokens: 256 }, { providerContract: ordinaryContract });
const explicitPayload = buildPerplexitySonarPayload({ model: 'provider-verified-model' }, [], { maxOutputTokens: 256 }, { stream: true, providerContract: explicitSearchContract });

if (ordinaryContract.search.enabled || ordinaryPayload.disable_search !== true) errors.push('Ordinary Perplexity requests do not fail closed with provider search disabled.');
if (blockedSearchContract.search.enabled || blockedSearchContract.search.state !== 'blocked-missing-explicit-search-consent') errors.push('Provider search can be enabled without an explicit labelled consent source.');
if (!explicitSearchContract.search.enabled || explicitPayload.disable_search !== false || explicitPayload.stream !== true) errors.push('Explicit labelled provider search does not produce the expected bounded payload.');
if (!/disable_search/.test(runtimeSource)) errors.push('Runtime does not send the Perplexity disable_search field.');
if (!/data\?\.citations/.test(runtimeSource) || !/data\?\.search_results/.test(runtimeSource)) errors.push('Runtime discards provider citations or search results.');
if (!/createEonAiProvenanceReceipt/.test(runtimeSource) || !/provenanceReceipt/.test(runtimeSource)) errors.push('Batch and streaming runtime do not emit the canonical provenance receipt.');
if (!/attachmentCoverage: attachmentRequest\.coverage/.test(chatSource)) errors.push('Chat does not pass attachment inclusion and omission coverage into the executor.');
if (!/includedText/.test(attachmentSource) || !/omissions/.test(attachmentSource)) errors.push('Attachment intake does not distinguish included text from preview-only omissions.');
if (/pricePerToken|estimatedCost|defaultCost|assumedCost/i.test(runtimeSource + provenanceSource)) errors.push('Runtime contains an invented token price or estimated cost authority.');

const provenanceReceipt = createEonAiProvenanceReceipt({
  requestId: 'ai-a15-i11-gate',
  providerId: 'perplexity',
  providerContract: ordinaryContract,
  inputChars: 512,
  systemPromptIncluded: true,
  historyRequested: 18,
  historyIncluded: 12,
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
  usage: { prompt_tokens: 120, completion_tokens: 40, total_tokens: 160 },
  citations: [{ title: 'Returned source', url: 'https://example.com/source' }],
  searchResults: [{ title: 'Returned result', url: 'https://example.com/result' }]
});
if (provenanceReceipt.context.historyOmitted !== 6 || provenanceReceipt.context.attachments.omitted !== 2) errors.push('Context omission receipt does not preserve exact counts.');
if (provenanceReceipt.usage.totalTokens !== 160 || provenanceReceipt.cost.amount !== null || provenanceReceipt.cost.estimatedByEonapp) errors.push('Usage or cost receipt invents unsupported provider values.');
if (provenanceReceipt.search.citationCount !== 1 || provenanceReceipt.search.searchResultCount !== 1) errors.push('Citation or search-result evidence is not preserved.');
if (provenanceReceipt.containsPrompt || provenanceReceipt.containsReply || provenanceReceipt.containsApiKey || provenanceReceipt.containsAttachmentContent) errors.push('Provenance receipt contains private content.');

const providerTruth = getEonProviderExecutionContractTruth();
const provenanceTruth = getEonAiProvenanceReceiptTruth();
if (providerTruth.ordinaryProviderSearchDefault !== 'disabled' || !providerTruth.explicitSearchConsentRequired || providerTruth.inventedCostAllowed) errors.push('Provider execution truth is weaker than the I11 launch policy.');
if (!provenanceTruth.contextInclusionAndOmissionRecorded || !provenanceTruth.citationsPreserved || provenanceTruth.promptStored || provenanceTruth.attachmentContentStored) errors.push('Provenance truth is weaker than the I11 launch policy.');

const core = {
  schema: 'eonapp.a15.i11.provider-truth-provenance-gate-receipt.v1',
  generatedAt: new Date().toISOString(),
  wave: 'I11',
  status: errors.length ? 'fail' : 'pass',
  providerAuthority: {
    schema: providerTruth.schema,
    providerCount: Object.keys(PROVIDERS).length,
    ordinaryProviderSearchDefault: providerTruth.ordinaryProviderSearchDefault,
    explicitSearchConsentRequired: providerTruth.explicitSearchConsentRequired,
    oneProviderAttempt: providerTruth.oneProviderAttempt,
    hiddenRetryAllowed: providerTruth.hiddenRetryAllowed,
    crossProviderFallback: providerTruth.crossProviderFallback
  },
  perplexitySimulation: {
    ordinary: { state: ordinaryContract.search.state, disableSearch: ordinaryPayload.disable_search },
    blockedWithoutConsent: { state: blockedSearchContract.search.state, enabled: blockedSearchContract.search.enabled },
    explicit: { state: explicitSearchContract.search.state, disableSearch: explicitPayload.disable_search, stream: explicitPayload.stream }
  },
  provenanceSimulation: provenanceReceipt,
  sourceFiles: [
    'assets/js/chat/ai-runtime.js',
    'assets/js/chat-page.js',
    'assets/js/chat/local-attachments.js',
    'assets/js/ai-kernel/eon-provider-execution-contract.js',
    'assets/js/ai-kernel/eon-ai-provenance-receipt.js'
  ],
  errors
};
const receipt = { ...core, digest: digest(JSON.stringify(core)) };
mkdirSync(EVIDENCE_DIR, { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I11] ${receipt.status.toUpperCase()}: ordinary provider search disabled; explicit search consent-gated; context, usage, cost and citations receipt verified.`);
if (errors.length) {
  for (const error of errors) console.error(`[A15 I11] ${error}`);
  process.exitCode = 1;
}
