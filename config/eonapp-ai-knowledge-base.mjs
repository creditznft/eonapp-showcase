/**
 * Institutional EONAPP product grounding.
 *
 * Source-controlled public product truth only. This is runtime grounding, not
 * model training. Cards intentionally exclude Vault values, private projects,
 * private chat history, credentials, raw media and private receipts.
 */
export const EONAPP_AI_KNOWLEDGE_BASE_VERSION = 'institutional-grounding-v2.0.0';
export const EONAPP_AI_KNOWLEDGE_SCHEMA = 'eonapp.ai.knowledge-card.v2';

const clean = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();
const freezeStrings = (values = []) => Object.freeze((Array.isArray(values) ? values : []).map((value) => clean(value)).filter(Boolean));

const freezeCard = (row) => Object.freeze({
  schema: EONAPP_AI_KNOWLEDGE_SCHEMA,
  id: clean(row.id),
  title: clean(row.title),
  domains: freezeStrings(row.domains || ['core']).map((value) => value.toLowerCase()),
  tags: freezeStrings(row.tags).map((value) => value.toLowerCase()),
  priority: Math.max(0, Math.min(100, Number(row.priority || 0))),
  authority: clean(row.authority || 'source-controlled-product-truth'),
  status: clean(row.status || 'active'),
  effectiveDate: clean(row.effectiveDate || '2026-08-09'),
  supersedes: freezeStrings(row.supersedes),
  facts: freezeStrings(row.facts),
  actionBoundary: clean(row.actionBoundary || '')
});

export const EONAPP_AI_KNOWLEDGE_CARDS = Object.freeze([
  freezeCard({
    id: 'identity-and-secrets', title: 'Identity, Vault and secret safety', priority: 100,
    domains: ['core', 'privacy', 'security'], tags: ['vault', 'secret', 'api key', 'password', 'identity', 'google login', 'backup', 'recovery'],
    facts: [
      'EONAPP.ch uses Chat and EONBOT as the primary assistant surface; Projects and Library hold user-managed work and reusable outputs.',
      'Google Login is identity-only unless a separately consented storage product is proved.',
      'Vault is the private settings boundary for approved provider credentials, backup and recovery information.',
      'EONBOT must never request, repeat, expose or place API keys, passwords, seed phrases, private keys or recovery secrets into ordinary chat context.'
    ],
    actionBoundary: 'Route sensitive setup to Vault. Never accept credentials in chat or copy them into model grounding.'
  }),
  freezeCard({
    id: 'ai-modes', title: 'AI execution modes and verification', priority: 99,
    domains: ['core', 'models', 'providers'], tags: ['eonbot', 'guide', 'local ai', 'ollama', 'lm studio', 'jan', 'provider', 'api', 'model', 'byok'],
    facts: [
      'Guide Mode is deterministic help and does not mean a live model is connected.',
      'Local text can use EON Local Lite in a compatible browser after explicit first-download approval, or a supported installed Ollama, LM Studio or Jan runtime after a successful local self-test.',
      'On certified desktop platforms EON Local Companion is the protected transport for approved local runtimes; an unsigned or uncertified developer build must never be presented as a consumer installer.',
      'Connected providers require user-approved Vault-managed credentials and current model-list compatibility proof; Local mode never silently falls back to a hosted provider.',
      'A saved key, provider label, historical model name or detected runtime is not proof that the provider or model is currently usable, and Image/Video readiness is verified separately from text.'
    ],
    actionBoundary: 'Do not silently switch providers, install runtimes, download model weights or spend provider credits.'
  }),
  freezeCard({
    id: 'grounding-not-training', title: 'Grounding is not model training', priority: 98,
    domains: ['core', 'knowledge', 'memory'], tags: ['training', 'knowledge', 'memory', 'rag', 'smart', 'context', 'learn', 'first prompt', 'first turn'],
    facts: [
      'EONAPP improves first-turn reliability with versioned runtime grounding, task context and user-approved memory rather than hidden fine-tuning on user conversations.',
      'The permanent intelligence layer is EONAPP context, memory, tools, routing and evidence; individual models are replaceable execution engines.',
      'Private chat history, Vault values and raw media are not silently converted into model-training data.'
    ],
    actionBoundary: 'Explain clearly whether information came from source-controlled truth, user-approved memory, a tool result, user-supplied evidence or model inference.'
  }),
  freezeCard({
    id: 'memory-policy', title: 'Consent-led adaptive memory', priority: 97,
    domains: ['memory', 'privacy'], tags: ['remember', 'memory', 'preference', 'project memory', 'forget', 'learn me', 'personalize', 'continuity'],
    facts: [
      'Durable memory is consent-led, secret-filtered and local to the browser unless a separate synchronized memory product is explicitly proved.',
      'Memory should distinguish global preferences, project context, workflow preferences and short-lived context; expired or contradicted memory must not outrank newer evidence.',
      'Memory can improve continuity without changing model weights.'
    ],
    actionBoundary: 'Never write durable memory merely because a model guessed it. Provide user-visible edit, forget and clear controls for persisted memory.'
  }),
  freezeCard({
    id: 'web-research', title: 'Current information and research truth', priority: 96,
    domains: ['research', 'tools'], tags: ['internet', 'web', 'browse', 'search', 'research', 'latest', 'news', 'current', 'citation', 'source'],
    facts: [
      'A local model does not gain internet access simply because EONAPP runs in a browser.',
      'The current source-controlled research path is client-only: explicitly queued public extracts may be supplied as cited evidence for one turn.',
      'Client-captured sources must preserve source identity and capture time and must not be described as hidden model training or live browsing.',
      'Uncited, stale or guessed current facts must not be presented as verified research.'
    ],
    actionBoundary: 'When no verified source/tool evidence exists, say that current verification is unavailable in that EONAPP turn.'
  }),
  freezeCard({
    id: 'model-routing', title: 'Institutional model selection policy', priority: 95,
    domains: ['models', 'routing', 'local-ai'], tags: ['auto model', 'best model', 'fast model', 'private model', 'economy', 'router', 'model selection', 'device model'],
    facts: [
      'EONAPP may rank currently verified or locally self-tested models by task fit, capability, device fit, reliability, latency, privacy and cost only inside a user-selected policy envelope.',
      'Explicitly pinned providers and models remain authoritative until the user changes them or a verification proves them unavailable.',
      'Automatic catalogue refresh may discover newer models, but downloading large local model weights remains an explicit user action.'
    ],
    actionBoundary: 'Never cross a privacy or cost boundary silently. Explain a degraded route when no candidate satisfies the selected policy.'
  }),
  freezeCard({
    id: 'local-model-device-fit', title: 'Local model and device fit', priority: 94,
    domains: ['local-ai', 'models', 'performance'], tags: ['local model', 'device', 'ram', 'vram', 'gpu', 'cpu', 'phi', 'gemma', 'qwen', 'ollama model'],
    facts: [
      'Browser hardware signals are estimates and do not reveal reliable free storage, thermal headroom, battery health or all competing memory pressure.',
      'EONAPP should prefer a conservative installed model that passes the local self-test over a larger unverified model name.',
      'Model recommendations should be capability- and benchmark-driven; static catalogue priority must not contradict the user-facing recommended label.'
    ],
    actionBoundary: 'Offer better installed candidates automatically only inside the selected policy. Ask before downloading new model weights.'
  }),
  freezeCard({
    id: 'provider-cost-privacy', title: 'Connected provider cost and privacy boundary', priority: 93,
    domains: ['providers', 'privacy', 'cost'], tags: ['provider', 'api', 'cost', 'credits', 'paid', 'privacy', 'byok', 'fallback'],
    facts: [
      'Provider credentials are user-owned BYOK credentials and remain a separate custody boundary from ordinary model context.',
      'A fallback that could incur provider cost or send content to a different cloud service requires a policy that the user explicitly selected.',
      'Provider model discovery and health evidence must be refreshed periodically because model catalogues and compatibility change.'
    ],
    actionBoundary: 'No silent billable fallback, provider hopping or credential disclosure.'
  }),
  freezeCard({
    id: 'referrals-eonkeys', title: 'Signed invites, referrals and EONKEY truth', priority: 93,
    domains: ['growth', 'sharing', 'referrals'], tags: ['share', 'invite', 'referral', 'eonkey', 'eonkeys', 'reward', 'viral', 'signed link', 'refer'],
    facts: [
      'Signed public invite links and ordinary sharing can work independently of referral rewards.',
      'Current referral/EONKEY programme state is server-authoritative and rollout-controlled through the referral status endpoint; static browser copy must not infer active or inactive when that status has not been checked.',
      'Clicks, link opens, copies, impressions, posts and shares alone do not qualify a referral or create an EONKEY.',
      'When active, EONKEY eligibility is based on the server referral ledger, verified account association and approved qualifying milestones; EONKEYS are non-cash, non-transferable feature unlocks and never become a payout, discount, wallet, token or provider credit.'
    ],
    actionBoundary: 'Check current server referral status before describing the programme as active or inactive. Never infer reward qualification from a share action.'
  }),
  freezeCard({
    id: 'creator-overview', title: 'Creator is Image, Video and Music first', priority: 92,
    domains: ['creator'], tags: ['creator', 'create', 'image', 'video', 'music', 'audio', 'studio', 'maker'],
    facts: [
      'The institutional Creator direction treats Image, Video and Music as equal first-class creation modes with a simple beginner surface and optional advanced controls.',
      'Generation claims require a concrete runtime/provider result and output receipt; planning, prompts and deterministic browser tools must be labelled honestly.',
      'Website/Forge, Projects/Documents, Automation and Guide remain creation/productivity routes but are not substitutes for media generation.'
    ],
    actionBoundary: 'Do not describe a plan, storyboard, sequencer pattern or provider setup screen as a completed media generation.'
  }),
  freezeCard({
    id: 'creator-image', title: 'Creator image runtime truth', priority: 91,
    domains: ['creator', 'image', 'local-ai'], tags: ['image', 'comfyui', 'checkpoint', 'poster', 'thumbnail', 'image edit', 'generate image'],
    facts: [
      'A proof-gated ComfyUI image adapter is source-integrated for desktop loopback use.',
      'Canonical Create also has reviewed Direct BYOK hosted Image rails for fal FLUX Schnell and Replicate FLUX Schnell through the paired local Creator Companion; provider credentials stay in the OS vault and provider media is pulled into bounded Companion memory instead of an EONAPP cloud media store.',
      'Hosted Image source integration is not live-provider certification: the user must explicitly pair, move the provider key to the OS vault, approve one job, receive a real output and explicitly save it before a verified Creator receipt can exist.',
      'Local image remains runtime-, workflow-, checkpoint- and device-dependent and should stay locked until scan, workflow validation and a real saved-output test succeed.',
      'Only user-owned or authorized media may be imported or edited.'
    ],
    actionBoundary: 'Never claim an image render or edit occurred without a completed output and receipt.'
  }),
  freezeCard({
    id: 'creator-video', title: 'Creator video runtime truth', priority: 91,
    domains: ['creator', 'video', 'local-ai'], tags: ['video', 'comfyui video', 'image to video', 'text to video', 'ltx', 'wan', 'micro video'],
    supersedes: ['w605 creator-media statement that local video is disabled'],
    facts: [
      'Local video source tooling, workflow registries, capability checks, efficiency governance and proof contracts exist in the maintained source; that is not the same as universal runtime certification.',
      'Canonical Create also has reviewed prompt-first Direct BYOK hosted Video rails for fal Seedance and Replicate Seedance through the paired local Creator Companion; provider credentials stay in the OS vault and finished media is pulled into bounded Companion memory rather than exposed as a provider CDN URL.',
      'Hosted Video source integration is proof-pending until real owner-key browser output, playback/save and recovery behavior are certified; reference-media upload is not authorized by this reviewed rail.',
      'Video enablement must distinguish source integration, runtime detection, device admission, completed output, saved playback proof and owner quality acceptance.',
      'Weak or low-VRAM devices must remain fail-closed when the selected workflow is outside the supported device envelope.'
    ],
    actionBoundary: 'Never say local video is universally disabled, and never say it is certified merely because source code exists.'
  }),
  freezeCard({
    id: 'creator-music', title: 'Creator music generation direction', priority: 91,
    domains: ['creator', 'music', 'audio'], tags: ['music', 'song', 'beat', 'track', 'lyrics', 'music generation', 'soundtrack', 'audio generation'],
    facts: [
      'Music is a first-class Creator direction alongside Image and Video and the maintained EONCITY Creator surface reuses the same Music workspace.',
      'A deterministic browser sequencer or pattern generator is useful for arrangement and fallback but must not be labelled as model-generated music.',
      'A source-integrated ACE-Step 1.5 local adapter can explicitly scan a user-started loopback API, list already-loaded models, submit bounded text-to-music jobs and fetch returned generated audio.',
      'EONAPP does not start ACE-Step, initialize or download its models, train adapters, upload reference/source audio, or silently fall back to cloud; real launch-device/runtime certification remains pending.',
      'Generative music uses a capability adapter so local and hosted music engines can be replaced without changing EONBOT or Creator UX.',
      'A generated track must return playable audio, and a verified Creator mission receipt is written only after the user explicitly saves and reopens the saved audio with a byte-for-byte digest match.'
    ],
    actionBoundary: 'Keep model generation, deterministic sequencing and user-imported audio clearly distinguished. Treat source-integrated ACE-Step support as proof-pending until a real device/runtime browser test saves and replays an output.'
  }),
  freezeCard({
    id: 'creator-auto-dj-radio', title: 'Auto DJ and personal EON Radio', priority: 90,
    domains: ['creator', 'music', 'audio'], tags: ['auto dj', 'dj', 'mix', 'radio', 'spotify', 'station', 'playlist', 'transition'],
    facts: [
      'Auto DJ currently uses user-supplied BPM/energy metadata to sequence user-authorized or EON-generated audio and runs a browser-local crossfade preview; it does not perform beat-grid analysis, beat matching, tempo stretch, stem separation or rendered mix export.',
      'EON Radio stores private station profiles locally and plays a session-only queue built from user-owned/imported audio and EON-generated tracks; finite genre/vocal/energy preference learning occurs only under the selected memory policy, while station free text and audio are excluded from Safe Auto memory.',
      'EON Radio is not a claim of access to a commercial streaming catalogue.'
    ],
    actionBoundary: 'Do not import, download, redistribute or mix copyrighted third-party music unless the user has the necessary rights and supplies it through an authorized path.'
  }),
  freezeCard({
    id: 'local-media-hardware', title: 'Local creator hardware fit', priority: 89,
    domains: ['creator', 'local-ai', 'performance'], tags: ['rtx 3050', '4gb', 'vram', 'video model', 'image to video', 'low vram', 'creator device'],
    facts: [
      'System RAM and GPU VRAM are different limits; low-VRAM creator devices require conservative image/video/music workflows and explicit device admission.',
      'A small image baseline can be a realistic local test on 4 GB-class VRAM, while heavier video or music diffusion workflows require separately proven profiles.',
      'Runtime pressure must account for simultaneous LLM and media jobs rather than assuming all installed models can stay loaded together.'
    ],
    actionBoundary: 'Prefer smaller validated workflows and queue heavy local workloads instead of risking device instability.'
  }),
  freezeCard({
    id: 'voice-multilingual', title: 'Voice and multilingual truth', priority: 88,
    domains: ['voice', 'language'], tags: ['voice', 'speech', 'microphone', 'stt', 'tts', 'language', 'translate', 'multilingual'],
    facts: [
      'Voice remains capability- and permission-dependent and typed input must remain a complete fallback.',
      'Language preference should be part of the turn context without consuming an excessive share of small-model context windows.',
      'Browser/OS speech capability is not equivalent to a proven EONAPP local speech model.'
    ],
    actionBoundary: 'Never claim microphone, transcription or spoken output succeeded without runtime evidence.'
  }),
  freezeCard({
    id: 'city-status', title: 'EON City AI integration truth', priority: 88,
    domains: ['city', 'eonbot'], tags: ['eon city', 'city', 'game', 'babylon', 'eonbot companion', 'command core', 'mission'],
    facts: [
      'EON City uses Babylon for the public 3D City path and should consume the same EONBOT knowledge, memory and selected-model authority as ordinary Chat.',
      'City state may add task and spatial context but must not override product truth, privacy rules or action approval boundaries.',
      'A City interaction is not certified merely because code or a visual control exists; authenticated browser interaction evidence is required.'
    ],
    actionBoundary: 'Game state must never authorize an external, financial, publishing or credential action by itself.'
  }),
  freezeCard({
    id: 'actions-and-approvals', title: 'Actions, automation and publication', priority: 87,
    domains: ['actions', 'automation', 'security'], tags: ['automation', 'publish', 'post', 'payment', 'trade', 'wallet', 'action', 'approval'],
    facts: [
      'Automations and action proposals are approval-first before any external effect.',
      'EONAPP does not place trades, transfer funds, publish content, connect accounts or make purchases merely because a model suggested it.',
      'Tool results, memory and research evidence are context; they are not permission tokens.'
    ],
    actionBoundary: 'Prepare a reviewable plan and require explicit approval before irreversible, external, financial or publishing actions.'
  })
]);

const STOP_WORDS = new Set(['the', 'and', 'for', 'that', 'with', 'this', 'from', 'have', 'want', 'make', 'what', 'how', 'can', 'could', 'would', 'should', 'into', 'about', 'your', 'you']);
function normalize(value = '') { return String(value || '').toLowerCase().replace(/[-_]+/g, ' ').replace(/[^a-z0-9+#./ ]/g, ' ').replace(/\s+/g, ' ').trim(); }
function tokenize(value = '') { return [...new Set(normalize(value).split(' ').filter((token) => token.length >= 2 && !STOP_WORDS.has(token)))]; }

function inferDomains(input = '') {
  const text = normalize(input);
  const domains = new Set(['core']);
  const rules = [
    ['memory', /\b(memory|remember|forget|preference|project context|learn me)\b/],
    ['research', /\b(web|browse|search|research|latest|current|citation|news)\b/],
    ['models', /\b(model|ollama|lm studio|jan|provider|router|api|byok|gemma|phi|qwen)\b/],
    ['creator', /\b(create|creator|image|video|music|audio|song|dj|radio|track|poster|thumbnail)\b/],
    ['music', /\b(music|song|beat|track|lyrics|dj|radio|playlist|mix)\b/],
    ['video', /\b(video|image to video|text to video|ltx|wan)\b/],
    ['image', /\b(image|poster|thumbnail|comfyui|image edit)\b/],
    ['city', /\b(eon city|city|babylon|mission|companion)\b/],
    ['voice', /\b(voice|speech|microphone|stt|tts)\b/],
    ['growth', /\b(share|invite|referral|eonkey|reward|viral|remix)\b/],
    ['sharing', /\b(share|invite|remix|post|caption)\b/],
    ['referrals', /\b(referral|refer|eonkey|reward|signed invite)\b/],
    ['security', /\b(secret|credential|password|key|privacy|security)\b/]
  ];
  for (const [domain, pattern] of rules) if (pattern.test(text)) domains.add(domain);
  return domains;
}

function relevance(card, input = '') {
  const text = normalize(input);
  const tokens = tokenize(input);
  const domains = inferDomains(input);
  const title = normalize(card.title);
  const tags = card.tags.map(normalize);
  const facts = normalize(card.facts.join(' '));
  const haystack = `${title} ${tags.join(' ')} ${facts}`;
  let score = card.priority;
  for (const domain of card.domains) if (domains.has(domain)) score += domain === 'core' ? 2 : 28;
  for (const tag of tags) {
    if (tag.length >= 3 && text.includes(tag)) score += 34 + Math.min(tag.length, 18);
  }
  for (const token of tokens) {
    const exactTag = tags.some((tag) => tag.split(' ').includes(token));
    if (exactTag) score += 13;
    else if (title.split(' ').includes(token)) score += 10;
    else if (haystack.includes(token)) score += 5;
  }
  return score;
}

export function selectEonappKnowledgeCards(input = '', options = {}) {
  const limit = Math.max(1, Math.min(Number(options.limit || 6), 12));
  const alwaysIds = Array.isArray(options.alwaysIds) ? options.alwaysIds : ['identity-and-secrets', 'ai-modes'];
  const always = EONAPP_AI_KNOWLEDGE_CARDS.filter((card) => alwaysIds.includes(card.id));
  const selected = EONAPP_AI_KNOWLEDGE_CARDS
    .filter((card) => card.status === 'active')
    .map((card) => ({ card, score: relevance(card, input) }))
    .sort((a, b) => b.score - a.score || b.card.priority - a.card.priority || a.card.id.localeCompare(b.card.id))
    .map((row) => row.card);
  const ordered = [...always, ...selected].filter((card, index, list) => list.findIndex((item) => item.id === card.id) === index);
  return Object.freeze(ordered.slice(0, limit));
}

function formatCard(card, maxFacts) {
  return [
    `[${card.id}] ${card.title} · status=${card.status} · authority=${card.authority} · effective=${card.effectiveDate}`,
    ...card.facts.slice(0, maxFacts).map((fact) => `- ${fact}`),
    card.actionBoundary ? `- Action boundary: ${card.actionBoundary}` : ''
  ].filter(Boolean);
}

export function buildEonappKnowledgeContext(input = '', options = {}) {
  const cards = selectEonappKnowledgeCards(input, options);
  const maxFacts = Math.max(1, Math.min(Number(options.maxFactsPerCard || 3), 4));
  const maxChars = Math.max(1200, Math.min(Number(options.maxChars || 5200), 12000));
  const header = `EONAPP source-controlled grounding (${EONAPP_AI_KNOWLEDGE_BASE_VERSION}; ${EONAPP_AI_KNOWLEDGE_SCHEMA}):`;
  const lines = [header];
  const included = [];
  for (const card of cards) {
    const next = formatCard(card, maxFacts);
    const candidate = [...lines, ...next].join('\n');
    if (candidate.length > maxChars && included.length >= 2) continue;
    lines.push(...next);
    included.push(card.id);
  }
  return Object.freeze({
    version: EONAPP_AI_KNOWLEDGE_BASE_VERSION,
    schema: EONAPP_AI_KNOWLEDGE_SCHEMA,
    cardIds: Object.freeze(included),
    maxChars,
    prompt: lines.join('\n').slice(0, maxChars)
  });
}

export function getEonappKnowledgeTruth() {
  return Object.freeze({
    version: EONAPP_AI_KNOWLEDGE_BASE_VERSION,
    schema: EONAPP_AI_KNOWLEDGE_SCHEMA,
    cardCount: EONAPP_AI_KNOWLEDGE_CARDS.length,
    sourceControlled: true,
    privateUserDataIncluded: false,
    automaticFineTuning: false,
    hybridRetrieval: true,
    authorityMetadata: true,
    staleTruthSupersession: true
  });
}
