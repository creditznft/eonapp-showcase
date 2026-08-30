/**
 * W260-R3 A1 — Active hosted-AI contract registry.
 *
 * This file intentionally records stable base and model-discovery URLs only.
 * Model availability, pricing, quota and account entitlement are volatile and
 * must be re-verified from a user-owned provider account before EONBOT uses a
 * hosted model. No key or user-specific model list belongs in this registry.
 */
export const AI_API_CONTRACT_SCHEMA = 'eonapp.w476.ai-api-contracts.v2';
export const AI_API_CONTRACT_REVIEW_CADENCE = 'monthly-and-before-provider-merge';
export const AI_API_CONTRACT_AS_OF = '2026-08-15';

const freezeContract = (row) => Object.freeze({
  transport: 'https',
  readinessProof: 'user-initiated-authenticated-model-list',
  executionPolicy: 'byok-only',
  ...row
});

/**
 * Active EONBOT hosted providers only. Disabled, historical and informational
 * integrations are intentionally not listed here.
 */
export const AI_PROVIDER_CONTRACTS = Object.freeze({
  groq: freezeContract({
    provider: 'Groq',
    kind: 'openai-compatible',
    baseUrl: 'https://api.groq.com/openai/v1',
    modelsUrl: 'https://api.groq.com/openai/v1/models',
    chatPath: '/chat/completions',
    officialDocs: 'https://console.groq.com/docs/quickstart',
    migration: Object.freeze({
      maxOutputField: 'max_completion_tokens',
      legacyFunctionsForbidden: true,
      note: 'Chat Completions remain supported. Use max_completion_tokens and never send legacy functions/function_call fields.'
    })
  }),
  gemini: freezeContract({
    provider: 'Google Gemini',
    kind: 'gemini-generate-content',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    modelsUrl: 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',
    chatPath: '/models/{model}:generateContent',
    officialDocs: 'https://ai.google.dev/gemini-api/docs',
    migration: Object.freeze({
      currentRuntime: 'generateContent-v1beta',
      reviewRequired: 'Gemini v1 is stable and Interactions is the recommended API for new projects; do not migrate this existing browser client without a separate compatibility and data-handling review.',
      note: 'Keep model-list verification tied to generateContent support until a dedicated migration wave changes the runtime contract.'
    })
  }),
  cerebras: freezeContract({
    provider: 'Cerebras',
    kind: 'openai-compatible',
    baseUrl: 'https://api.cerebras.ai/v1',
    modelsUrl: 'https://api.cerebras.ai/v1/models',
    chatPath: '/chat/completions',
    officialDocs: 'https://inference-docs.cerebras.ai',
    migration: Object.freeze({
      versionPatchStatus: 'Version 2 became the default on 2026-07-21; endpoint paths remain /v1.',
      note: 'Do not pin the retired version-1 behavior. User-owned compatibility proof remains required for structured-output/tooling changes.'
    })
  }),
  mistral: freezeContract({
    provider: 'Mistral AI',
    kind: 'openai-compatible',
    baseUrl: 'https://api.mistral.ai/v1',
    modelsUrl: 'https://api.mistral.ai/v1/models',
    chatPath: '/chat/completions',
    officialDocs: 'https://docs.mistral.ai'
  }),
  deepseek: freezeContract({
    provider: 'DeepSeek',
    kind: 'openai-compatible',
    baseUrl: 'https://api.deepseek.com',
    modelsUrl: 'https://api.deepseek.com/models',
    chatPath: '/chat/completions',
    officialDocs: 'https://api-docs.deepseek.com',
    migration: Object.freeze({
      currentBasePath: 'https://api.deepseek.com (no /v1 segment)',
      legacyModelAliasesRetireAt: '2026-07-24T15:59:00Z',
      legacyAliasReplacements: Object.freeze({ 'deepseek-chat': 'deepseek-v4-flash (non-thinking mode)', 'deepseek-reasoner': 'deepseek-v4-flash (thinking mode)' }),
      note: 'Do not reintroduce deepseek-chat or deepseek-reasoner. EONAPP blocks their selection before retirement; authenticated model discovery remains authoritative.'
    })
  }),
  perplexity: freezeContract({
    provider: 'Perplexity',
    kind: 'perplexity-sonar',
    baseUrl: 'https://api.perplexity.ai/v1',
    modelsUrl: 'https://api.perplexity.ai/v1/models',
    chatPath: '/sonar',
    officialDocs: 'https://docs.perplexity.ai',
    readinessProof: 'user-initiated-public-model-catalogue-plus-first-inference-key-proof',
    modelListCredentialProof: false,
    migration: Object.freeze({
      catalogueScope: 'Agent API model catalogue',
      executionScope: 'Sonar API only',
      note: 'GET /v1/models is public and lists Agent API models. EON filters it to Perplexity Sonar compatibility; the user key is not described as credential-verified until the first successful Sonar request.'
    })
  }),
  together: freezeContract({
    provider: 'Together AI',
    kind: 'openai-compatible',
    baseUrl: 'https://api.together.ai/v1',
    modelsUrl: 'https://api.together.ai/v1/models',
    chatPath: '/chat/completions',
    officialDocs: 'https://docs.together.ai',
    migration: Object.freeze({
      namespacedModelIdsRequired: true,
      legacyBaseUrl: 'https://api.together.xyz/v1',
      note: 'Together model IDs must be provider-namespaced. Never send OpenAI model labels such as gpt-4o to Together.'
    })
  }),
  nvidia: freezeContract({
    provider: 'NVIDIA API Catalog / NIM',
    kind: 'openai-compatible',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    modelsUrl: 'https://integrate.api.nvidia.com/v1/models',
    chatPath: '/chat/completions',
    officialDocs: 'https://docs.api.nvidia.com',
    browserDirectStatus: 'unsupported-cors',
    safeAlternativeTransport: 'local-companion-planned',
    migration: Object.freeze({
      ngcTeamScopedPathsForbidden: true,
      ngcTeamScopedRetirementDate: '2026-09-30',
      note: 'This inference surface is API Catalog/NIM, not a team-scoped NGC management path.'
    })
  }),
  sambanova: freezeContract({
    provider: 'SambaNova',
    kind: 'openai-compatible',
    baseUrl: 'https://api.sambanova.ai/v1',
    modelsUrl: 'https://api.sambanova.ai/v1/models',
    chatPath: '/chat/completions',
    officialDocs: 'https://docs.sambanova.ai',
    browserDirectStatus: 'unsupported-cors',
    safeAlternativeTransport: 'local-companion-planned'
  }),
  fireworks: freezeContract({
    provider: 'Fireworks AI',
    kind: 'openai-compatible',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    modelsUrl: 'https://api.fireworks.ai/v1/accounts/fireworks/models?filter=supports_serverless%3Dtrue&pageSize=200',
    chatPath: '/chat/completions',
    officialDocs: 'https://docs.fireworks.ai'
  }),
  huggingface: freezeContract({
    provider: 'Hugging Face Inference Providers',
    kind: 'openai-compatible',
    baseUrl: 'https://router.huggingface.co/v1',
    modelsUrl: 'https://router.huggingface.co/v1/models',
    chatPath: '/chat/completions',
    officialDocs: 'https://huggingface.co/docs/inference-providers',
    routing: Object.freeze({
      defaultProviderPolicy: 'fastest-with-automatic-failover',
      eonExecutionPolicy: 'pin-one-live-upstream-provider-from-current-model-catalogue',
      note: 'Hugging Face provider=auto may switch upstream providers. EONAPP pins the selected model to one explicit live upstream suffix for the current verified catalogue so provider failover is not hidden.'
    })
  }),
  openai: freezeContract({
    provider: 'OpenAI',
    kind: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    modelsUrl: 'https://api.openai.com/v1/models',
    chatPath: '/chat/completions',
    officialDocs: 'https://platform.openai.com/docs/api-reference',
    migration: Object.freeze({
      imageAdapter: 'not-active',
      imageModelReviewDate: '2026-12-01',
      outputTokenField: 'max_completion_tokens',
      modernInstructionRole: 'developer-for-o1-and-newer',
      store: false,
      modelAdmission: 'chat-capable-models-only-with-current-family-tiebreak',
      note: 'Text chat uses dynamic model discovery, rejects legacy base/specialized IDs, maps current reasoning/GPT-5-family instructions to developer role, uses max_completion_tokens and sends store:false. No image model is active in this registry.'
    })
  }),
  openrouter: freezeContract({
    provider: 'OpenRouter',
    kind: 'openai-compatible',
    baseUrl: 'https://openrouter.ai/api/v1',
    modelsUrl: 'https://openrouter.ai/api/v1/models',
    chatPath: '/chat/completions',
    officialDocs: 'https://openrouter.ai/docs'
  }),
  xai: freezeContract({
    provider: 'xAI',
    kind: 'openai-compatible',
    baseUrl: 'https://api.x.ai/v1',
    modelsUrl: 'https://api.x.ai/v1/language-models',
    chatPath: '/chat/completions',
    officialDocs: 'https://docs.x.ai',
    migration: Object.freeze({
      chatCompletions: 'legacy-supported',
      newCapabilities: 'Responses API review required',
      note: 'The current EONBOT adapter remains on Chat Completions; do not introduce tool or agent features through xAI until a dedicated Responses-adapter wave is approved.'
    })
  }),
  qwen: freezeContract({
    provider: 'Qwen Cloud',
    kind: 'openai-compatible',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    modelsUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models',
    chatPath: '/chat/completions',
    officialDocs: 'https://www.alibabacloud.com/help/en/model-studio',
    migration: Object.freeze({
      globalEndpoint: 'currently-functional',
      workspaceSpecificRegionalEndpoint: 'supported-after-user-selection',
      arbitraryHttpsEndpoint: 'forbidden',
      reviewedRegionalEndpointRequired: true,
      verificationBindsModelListToSelectedEndpoint: true,
      note: 'The default Singapore endpoint remains supported. Advanced endpoint selection is limited to reviewed Alibaba Model Studio regional/workspace hosts and the selected endpoint is verified with the user-owned key before use.'
    })
  })
});

/**
 * RT92 server-managed routes are deliberately separate from the browser BYOK
 * registry above. Browser keys, local AI, and hosted BYOK traffic must never
 * be forwarded through this publisher-funded route.
 */
export const SERVER_MANAGED_AI_PROVIDER_CONTRACTS = Object.freeze({
  vexrail: Object.freeze({
    provider: 'Vexrail',
    kind: 'openai-compatible-server-proxy',
    browserRoute: '/api/ai/vexrail',
    upstreamUrl: 'https://api.vexrail.com/v1/chat/completions',
    officialDocs: 'publisher-dashboard-provided-contract',
    readinessProof: 'same-origin-server-status-plus-authenticated-account-billing-geo-network-and-human-gates',
    executionPolicy: 'server-held-publisher-credential-signed-in-free-or-explicit-paid-sponsored-opt-in-only',
    credentialCustody: 'cloudflare-server-environment-only',
    monetization: Object.freeze({
      sponsoredContentPossible: true,
      paidSubscriptionAdFree: true,
      localAiRerouted: false,
      byokCredentialForwarding: false
    })
  })
});

export const SERVER_MANAGED_AI_PROVIDER_IDS = Object.freeze(Object.keys(SERVER_MANAGED_AI_PROVIDER_CONTRACTS));

export const REVIEWED_HOSTED_PROVIDER_IDS = Object.freeze(Object.keys(AI_PROVIDER_CONTRACTS));
export const ACTIVE_HOSTED_PROVIDER_IDS = Object.freeze(REVIEWED_HOSTED_PROVIDER_IDS.filter((id) => AI_PROVIDER_CONTRACTS[id]?.browserDirectStatus !== 'unsupported-cors'));


/**
 * W260-R3 A1 — documentation-review status, not live-account status.
 * Every entry stays `static-contract-reviewed` until the user initiates a
 * model-list verification with their own key. This prevents a documentation
 * check from being misrepresented as access, quota, billing or inference proof.
 */
export const AI_PROVIDER_REVIEW_BOARD = Object.freeze(Object.fromEntries(
  REVIEWED_HOSTED_PROVIDER_IDS.map((id) => [id, Object.freeze({
    provider: AI_PROVIDER_CONTRACTS[id].provider,
    status: 'static-contract-reviewed',
    reviewedAt: AI_API_CONTRACT_AS_OF,
    nextCheck: AI_API_CONTRACT_REVIEW_CADENCE,
    liveAccountProof: 'required-on-user-action'
  })])
));

/**
 * Detect the NVIDIA paths retired on 2026-09-30. The pattern deliberately
 * targets NGC product-management paths and does not mistake normal URLs or
 * legitimate NGC team metadata for this API migration.
 */
export const NVIDIA_RETIRED_TEAM_SCOPED_PATH = /\/v(?:1|2|3)\/(?:(?:ngc\/)?(?:(?:nvcf|nvct|fnds|skyway|sis|si|pym|gdn|gdncs|infinity-manager)\/)?)?(?:orgs|org)\/[^\s/'"`?#]+\/(?:teams|team)\/[^\s/'"`?#]+(?:\/|$|[?#])/i;

export function isRetiredNvidiaTeamScopedPath(value = '') {
  return NVIDIA_RETIRED_TEAM_SCOPED_PATH.test(String(value || ''));
}

/**
 * W476-A5.1 — Model-ID compatibility policy.
 *
 * The provider registry never supplies a default model. These rules reject IDs
 * that are retired, imminently retired, or structurally invalid for a provider
 * before they can be selected from a stale setting or cached list. They do not
 * claim that any remaining ID is available to a particular account.
 */
export const AI_MODEL_COMPATIBILITY_POLICY_SCHEMA = 'eonapp.w476.ai-model-compatibility-policy.v1';
export const AI_MODEL_COMPATIBILITY_POLICY_AS_OF = '2026-08-15';

export const AI_MODEL_COMPATIBILITY_POLICIES = Object.freeze({
  deepseek: Object.freeze({
    blockListedModelIds: Object.freeze(['deepseek-chat', 'deepseek-reasoner']),
    replacements: Object.freeze({
      'deepseek-chat': 'deepseek-v4-flash (non-thinking mode)',
      'deepseek-reasoner': 'deepseek-v4-flash (thinking mode)'
    }),
    reason: 'DeepSeek legacy aliases are scheduled to discontinue on 2026-07-24T15:59:00Z. EONAPP blocks new selection now so stale settings cannot preserve the aliases.',
    requestFieldPolicy: Object.freeze({ maxTokens: 'supported-by-current-adapter', legacyFunctions: 'not-sent' })
  }),
  anthropic: Object.freeze({
    blockListedModelIds: Object.freeze([
      'claude-opus-4-1-20250805',
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-haiku-20241022',
      'claude-3-haiku-20240307'
    ]),
    replacements: Object.freeze({
      'claude-opus-4-1-20250805': 'claude-opus-4-8',
      'claude-opus-4-20250514': 'claude-opus-4-8',
      'claude-sonnet-4-20250514': 'claude-sonnet-4-6',
      'claude-3-7-sonnet-20250219': 'claude-sonnet-4-6',
      'claude-3-5-haiku-20241022': 'claude-haiku-4-5-20251001',
      'claude-3-haiku-20240307': 'claude-haiku-4-5-20251001'
    }),
    reason: 'Retired and deprecated Claude IDs are blocked before an optional Anthropic adapter can be enabled.',
    requestFieldPolicy: Object.freeze({ temperature: 'omit-for-current-Claude-models', topP: 'omit-for-current-Claude-models', topK: 'omit-for-current-Claude-models' })
  }),
  perplexity: Object.freeze({
    requiredModelIdPattern: /^sonar(?:-pro|-deep-research|-reasoning-pro)?$/i,
    patternFailureReason: 'provider-requires-sonar-model-id',
    reason: 'The active EONAPP Perplexity transport is /v1/sonar. Agent-API catalogue IDs and third-party models are rejected rather than being sent to the Sonar endpoint.',
    requestFieldPolicy: Object.freeze({ endpoint: '/v1/sonar', agentApiModels: 'not-sent-to-sonar' })
  }),
  together: Object.freeze({
    requiredModelIdPattern: /^[a-z0-9][a-z0-9._-]*\/[A-Za-z0-9._:/-]+$/i,
    reason: 'Together model IDs must be provider-namespaced. Unqualified OpenAI model IDs are rejected rather than sent to Together.',
    requestFieldPolicy: Object.freeze({ chatCompletions: 'supported', legacyFunctions: 'not-sent', toolField: 'only-after-dedicated-tooling-review' })
  }),
  groq: Object.freeze({
    automaticSelectionAvoidModelIds: Object.freeze(['llama-3.1-8b-instant', 'llama-3.3-70b-versatile']),
    replacements: Object.freeze({
      'llama-3.1-8b-instant': 'openai/gpt-oss-20b',
      'llama-3.3-70b-versatile': 'openai/gpt-oss-120b or qwen/qwen3.6-27b'
    }),
    reason: 'Groq scheduled llama-3.1-8b-instant and llama-3.3-70b-versatile for shutdown on 2026-08-16 for free/developer tiers, but committed-spend Enterprise customers are not affected. EONAPP therefore avoids these IDs for automatic selection while still allowing an authenticated Enterprise account to use one if Groq continues to return it. Chat requests use max_completion_tokens and never send legacy functions/function_call fields.',
    requestFieldPolicy: Object.freeze({ maxOutputField: 'max_completion_tokens', legacyFunctions: 'not-sent', legacyFunctionCall: 'not-sent' })
  }),
  openai: Object.freeze({
    imageModelReviewOnly: Object.freeze(['gpt-image-1-mini', 'gpt-image-1.5', 'chatgpt-image-latest']),
    imageModelReviewDate: '2026-12-01',
    reason: 'EONAPP has no active OpenAI image adapter. Text-chat selection continues to reject image-only IDs.'
  })
});

function normalizeCompatibilityProviderId(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function normalizeCompatibilityModelId(value = '') {
  return String(value || '').trim().slice(0, 160);
}

export function evaluateAiProviderModelCompatibility(providerId = '', modelId = '') {
  const provider = normalizeCompatibilityProviderId(providerId);
  const model = normalizeCompatibilityModelId(modelId);
  const policy = AI_MODEL_COMPATIBILITY_POLICIES[provider] || null;
  if (!model) return Object.freeze({ allowed: false, provider, model, reason: 'missing-model-id', replacement: '' });
  const lower = model.toLowerCase();
  const blocked = Array.isArray(policy?.blockListedModelIds)
    ? policy.blockListedModelIds.find((candidate) => candidate.toLowerCase() === lower)
    : '';
  if (blocked) {
    return Object.freeze({
      allowed: false,
      provider,
      model,
      reason: 'retired-or-deprecated-model-id',
      replacement: String(policy?.replacements?.[blocked] || ''),
      policyNote: String(policy?.reason || '')
    });
  }
  if (policy?.requiredModelIdPattern && !policy.requiredModelIdPattern.test(model)) {
    return Object.freeze({ allowed: false, provider, model, reason: String(policy.patternFailureReason || 'provider-requires-namespaced-model-id'), replacement: '', policyNote: String(policy.reason || '') });
  }
  return Object.freeze({ allowed: true, provider, model, reason: '', replacement: '', policyNote: String(policy?.reason || '') });
}

export function isAiProviderModelIdAllowed(providerId = '', modelId = '') {
  return evaluateAiProviderModelCompatibility(providerId, modelId).allowed;
}
