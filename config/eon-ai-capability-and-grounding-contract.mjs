/**
 * W605 — EONAPP AI capability, grounding, memory and web-research contract.
 *
 * This deliberately distinguishes model training from runtime grounding.
 * Source-controlled EONAPP facts may be injected into model requests; private
 * user content is never silently used for fine-tuning or sent to a provider
 * merely because a memory record exists.
 */
export const EON_AI_GROUNDING_CONTRACT_SCHEMA = 'eonapp.w606.ai-grounding-contract.v1';
export const EON_AI_GROUNDING_CONTRACT_AS_OF = '2026-07-04';

export const EON_AI_GROUNDING_CONTRACT = Object.freeze({
  schema: EON_AI_GROUNDING_CONTRACT_SCHEMA,
  asOf: EON_AI_GROUNDING_CONTRACT_AS_OF,
  training: Object.freeze({
    productGrounding: 'source-controlled-runtime-context',
    automaticFineTuningFromUserContent: false,
    automaticFineTuningFromChatHistory: false,
    datasetCurationRequiresHumanReview: true,
    trainingClaim: 'EONAPP makes a selected model better informed through a versioned grounding pack; it does not claim to retrain the foundation model in the browser.'
  }),
  memory: Object.freeze({
    scope: 'same-browser-local-ledger-until-an-explicit-sync-product-is-proved',
    automaticCaptureFromRawChat: false,
    explicitConsentRequired: true,
    secretLikeContentAllowed: false,
    providerAgnostic: true,
    recallLimitedToRelevantCards: true
  }),
  webResearch: Object.freeze({
    architecture: 'client-only-local-evidence',
    directLocalModelInternetAccess: false,
    silentBrowsing: false,
    explicitUserRequestRequired: true,
    clientSourceCaptureRequired: true,
    sourceAttributionRequired: true,
    retrievalTimestampRequired: true,
    arbitraryUrlFetchAllowed: false,
    directCorsFetchAllowedOnlyWhenSourcePermitsIt: true,
    eonappServerProxyAllowed: false,
    cloudflareWorkerAllowed: false,
    browserExtensionBridgeInstalled: false,
    claim: 'A local model is not web-enabled merely because EONAPP runs in a browser. Current information may be supplied only through an explicit, client-captured local evidence packet with sources and capture time.'
  }),
  media: Object.freeze({
    localMediaAdapterActive: false,
    localImageAdapterSourceIntegrated: true,
    localVideoAdapterSourceIntegrated: false,
    liveImageGenerationProven: false,
    liveVideoGenerationProven: false,
    creatorAutoDownloadOrEditProven: false,
    explicitHighLoadConsentRequired: true,
    outputValidationRequired: true
  })
});

function normalizeText(value = '') {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function assessEonAiResearchRequest(input = '', options = {}) {
  const text = normalizeText(input);
  const explicit = Boolean(options.explicit) || /\b(search|browse|research|look up|latest|today|current|news|sources?|citations?)\b/.test(text);
  const clientSourcesReady = Boolean(options.clientSourcesReady) || Number(options.clientSourceCount || 0) > 0;
  const requiresFreshness = /\b(latest|today|current|news|price|weather|score|schedule|law|regulation|version|release)\b/.test(text);
  if (!explicit && !requiresFreshness) {
    return Object.freeze({ requested: false, allowed: false, state: 'not-requested', reason: 'No explicit or freshness-sensitive research request was detected.' });
  }
  if (!clientSourcesReady) {
    return Object.freeze({ requested: true, allowed: false, state: 'client-sources-required', reason: 'Do not imply current web access. Ask the user to add local cited sources or explicitly capture a permitted public extract in the browser.' });
  }
  return Object.freeze({ requested: true, allowed: true, state: 'explicit-client-sourced-research', reason: 'A client-only source packet may be used only for this explicit request and must retain source attribution and capture time.' });
}

export function validateEonAiGroundingContract(contract = EON_AI_GROUNDING_CONTRACT) {
  const issues = [];
  if (contract?.schema !== EON_AI_GROUNDING_CONTRACT_SCHEMA) issues.push('schema-invalid');
  if (contract?.training?.automaticFineTuningFromUserContent !== false) issues.push('automatic-user-finetune-must-stay-disabled');
  if (contract?.memory?.explicitConsentRequired !== true) issues.push('memory-consent-must-be-required');
  if (contract?.memory?.secretLikeContentAllowed !== false) issues.push('memory-secret-boundary-invalid');
  if (contract?.webResearch?.directLocalModelInternetAccess !== false) issues.push('local-model-direct-web-must-stay-disabled');
  if (contract?.webResearch?.silentBrowsing !== false) issues.push('silent-browsing-must-stay-disabled');
  if (contract?.webResearch?.sourceAttributionRequired !== true) issues.push('research-citations-must-be-required');
  if (contract?.webResearch?.eonappServerProxyAllowed !== false || contract?.webResearch?.cloudflareWorkerAllowed !== false) issues.push('research-must-remain-client-only');
  if (contract?.media?.localMediaAdapterActive !== false) issues.push('media-adapter-cannot-be-claimed-active');
  return Object.freeze(issues);
}
