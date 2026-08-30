import { shouldProbeLocalRuntimes } from './local-runtime-policy.js';
/**
 * Distributed AI Inference Service — EONAPP.CH Edition
 * =====================================================
 * Adapted from eonpackage/src/platforms/DistributedInferenceService_V5.ts
 * for vanilla JS, localStorage-first persistence, and EONAPP Pool Points.
 *
 * ARCHITECTURE: Zero hardcoded model lists. Users run ANY model locally
 * (Ollama / LM Studio / vLLM / llama.cpp) and advertise to the EON P2P
 * network. Other users discover and purchase inference from those nodes.
 *
 * FLOW:
 *   1. User installs Ollama (or any local runtime) and pulls a model
 *   2. User announces their node via announceNode() -> stored in P2P network
 *   3. Other users discover available models via getNetworkModels()
 *   4. Requestor submits inference -> routed to best available node
 *   5. Node proxies request to local runtime -> streams response back
 *   6. Both parties earn pool points; node earns CU (compute units)
 *
 * @module utils/distributed-inference
 */

import * as nostrP2P from './p2p-nostr.js';
import { ContentSigning } from './content-signing.js';
import { assessInferenceSupplyPolicy } from './distributed-inference-policy.js';

const publishComputeProvider = nostrP2P.publishComputeProvider;
const fetchRecentEonEvents =
  typeof nostrP2P.fetchRecentEonEvents === 'function'
    ? nostrP2P.fetchRecentEonEvents
    : async () => [];
const appWin = /** @type {any} */ (window);

// -- Storage keys --
const NODES_KEY = 'eon:dis:nodes:v1';
const REQUESTS_KEY = 'eon:dis:requests:v1';
const CU_LOG_KEY = 'eon:dis:cu-log:v1';
// Network index key reserved for P2P sync expansion

// -- Capability taxonomy --
// Each model is tagged with capabilities inferred from its name/family.
// This lets the marketplace and chat route requests by what the model can actually do.
export const /** @type {any} */
CAPABILITY_TAGS = {
  TEXT:         'text',         // General text generation
  CODE:         'code',         // Code generation and completion
  IMAGE:        'image',        // Image generation (diffusion models)
  VISION:       'vision',       // Image/video understanding (multimodal input)
  MULTILINGUAL: 'multilingual', // Strong non-English language support
  EMBEDDING:    'embedding',    // Vector embedding generation
  TOOLS:        'tools',        // Function calling / tool use
  REASONING:    'reasoning',    // Chain-of-thought, math, logic
  AUDIO:        'audio'         // Speech-to-text or audio understanding
};

// Infer capabilities from model ID string using known family heuristics.
// No network call — pure string matching. Falls back to ['text'] for unknowns.
export function inferModelCapabilities(/** @type {any} */ modelId) {
  const id = String(modelId || '').toLowerCase();
  /** @type {string[]} */
  const caps = [CAPABILITY_TAGS.TEXT]; // all models do text

  // Code capability
  if (/code|coder|codex|starcoder|deepseek.coder|wizard.*coder|codellama|phi.*code|qwen.*coder/.test(id)) {
    caps.push(CAPABILITY_TAGS.CODE);
  }
  // Reasoning/math capability
  if (/reason|math|qwq|r1|deepseek.r|o1|phi.4|mistral.large|llama.3.*70b|qwen.*72b|wizardmath|gemma.3|gemini.*think/.test(id)) {
    caps.push(CAPABILITY_TAGS.REASONING);
  }
  // Vision / multimodal
  if (/vision|visual|llava|bakllava|qwen.*vl|intern.*vl|minicpm.*v|phi.*vision|cogvlm|pixtral|gemini|claude.*sonnet|gpt-4o|llama.*vision/.test(id)) {
    caps.push(CAPABILITY_TAGS.VISION);
  }
  // Image generation
  if (/diffusion|sdxl|flux|dalle|dall-e|imagen|kandinsky|openjourney|midjourney|stable.*diffusion|sd-/.test(id)) {
    caps.push(CAPABILITY_TAGS.IMAGE);
  }
  // Embedding
  if (/embed|bge|gte|e5|nomic.*embed|sfr.*embed|text-embedding|sentence-.*bert|mxbai|multilingual.*e5/.test(id)) {
    caps.push(CAPABILITY_TAGS.EMBEDDING);
  }
  // Tool use / function calling
  if (/tool|function|hermes|firefunction|xtuner|gorilla|nexus|mistral.*instruct|llama.*instruct|qwen.*instruct|command-r/.test(id)) {
    caps.push(CAPABILITY_TAGS.TOOLS);
  }
  // Multilingual
  if (/multilingual|multi.lang|bloom|mistral|qwen|deepseek|command.r|aya|gemma|euro|fr-|de-|es-|zh-|ja-|ko-|ar-/.test(id)) {
    caps.push(CAPABILITY_TAGS.MULTILINGUAL);
  }
  // Audio
  if (/whisper|audio|speech|stt|asr|wav2vec|seamless/.test(id)) {
    caps.push(CAPABILITY_TAGS.AUDIO);
  }

  // Deduplicate
  return [...new Set(caps)];
}

// Match: given a list of required capabilities, return a score 0-1 for how well
// a model's capability list satisfies the request.
export function scoreCapabilityMatch(/** @type {any} */ required, /** @type {any} */ available) {
  if (!Array.isArray(required) || required.length === 0) return 1;
  if (!Array.isArray(available) || available.length === 0) return 0;
  const availSet = new Set(available);
  const matched = required.filter((/** @type {any} */ c) => availSet.has(c)).length;
  return matched / required.length;
}

// -- Tier configs --
export const /** @type {any} */
TIER_CONFIGS = [
  {
    tier: 0,
    name: 'CPU Free',
    stakeRequired: 0,
    cuMultiplier: 0.5,
    minVramGB: 0,
    description: 'Any device -- run small models (<=7B) via CPU inference',
    benefits: ['Zero staking requirement', 'CPU inference (Phi-2, Gemma-2B, TinyLlama)', 'Earn 0.5x CU rewards', 'Build reputation before upgrading', 'Perfect starting tier']
  },
  {
    tier: 1,
    name: 'Consumer GPU',
    stakeRequired: 10000,
    cuMultiplier: 2.0,
    minVramGB: 8,
    description: 'RTX 3060 / RX 6700 XT -- run 7B-13B models',
    benefits: ['8GB+ VRAM (RTX 3060, RX 6700XT)', 'Earn 2x CU rewards', '7B-13B models (Llama 3, Mistral 7B)', '10,000 EON stake', 'Higher routing priority']
  },
  {
    tier: 2,
    name: 'Mid GPU',
    stakeRequired: 50000,
    cuMultiplier: 5.0,
    minVramGB: 16,
    description: 'RTX 3090 / RTX 4070 Ti -- run 30B models',
    benefits: ['16GB+ VRAM (RTX 3090, RTX 4070 Ti)', 'Earn 5x CU rewards', 'Up to 30B models (Mixtral 8x7B)', '50,000 EON stake', 'VIP routing priority']
  },
  {
    tier: 3,
    name: 'High-End GPU',
    stakeRequired: 250000,
    cuMultiplier: 15.0,
    minVramGB: 48,
    description: 'RTX 4090 / Radeon Pro W7900 -- run 70B models',
    benefits: ['48GB+ VRAM (RTX 4090 24GBx2, A6000)', 'Earn 15x CU rewards', '70B+ models (Llama 3 70B, Qwen 72B)', '250,000 EON stake', 'Premium routing priority']
  },
  {
    tier: 4,
    name: 'Data Center',
    stakeRequired: 1000000,
    cuMultiplier: 60.0,
    minVramGB: 80,
    description: 'H100 / A100 -- any model, fastest inference',
    benefits: ['80GB+ VRAM (H100 SXM, A100)', 'Earn 60x CU rewards', 'Any model at maximum speed', '1,000,000 EON stake', 'Highest routing priority always']
  }
];

// -- Runtime types --
export const /** @type {any} */
RUNTIME_TYPES = ['ollama', 'lm-studio', 'vllm', 'llamacpp', 'koboldcpp', 'tabbyml', 'custom'];

// -- Helpers --
function cryptoId() {
  const bytes = new Uint8Array(12);
  if (!window.crypto?.getRandomValues) throw new Error('crypto.getRandomValues required');
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, /** @type {any} */ b => b.toString(16).padStart(2, '0')).join('');
}

function loadJson(/** @type {any} */ key, /** @type {any} */ fallback) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null; // Annotated for TypeScript
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch { return fallback; }
}

function saveJson(/** @type {any} */ key, /** @type {any} */ value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function inferModelDisplayName(/** @type {any} */ modelId) {
  const parts = modelId.split('/');
  const base = parts[parts.length - 1]
    .replace(/[-_:]/g, ' ') // Annotated for TypeScript
    .replace(/\binst\b/gi, 'Instruct')
    .replace(/\bq\d+_k\w*/gi, (/** @type {any} */ m) => m.toUpperCase());
  return base.replace(/\b\w/g, (/** @type {any} */ c) => c.toUpperCase()).trim();
}

function estimateCostFromModelId(/** @type {any} */ _modelId) {
  // fail-closed: no USD per-token oracle; return 0 until connected
  return 0; // Annotated for TypeScript
}

// -- Service class --
class DistributedInferenceService {
  constructor() {
    this.nodes = new Map();
    /** @type {any[]} */
    this.discoveredProviders = [];
    this.requests = new Map();
    /** @type {any[]} */
    this.cuLog = [];
    /** @type {any[]} */
    this.networkModelCache = [];
    this.networkCacheTs = 0;
    this.NETWORK_CACHE_TTL = 5 * 60 * 1000;
    this._hydrateFromStorage();
    this.syncProvidersFromNostr().catch(() => {});
  }

  // -- Tier helpers --
  getAllTierConfigs() { return TIER_CONFIGS; }
  getTierConfig(/** @type {any} */ tier) { return TIER_CONFIGS.find((/** @type {any} */ t) => t.tier === tier); }

  // -- Node registration --
  async announceNode(/** @type {any} */ params) {
    if (!params.userId) return { success: false, error: 'Wallet address required' };
    const supplyPolicy = assessInferenceSupplyPolicy({ supplyClass: params.supplyClass || 'local-hardware' });
    if (!supplyPolicy.allowed) return { success: false, error: supplyPolicy.reason, policy: supplyPolicy };
    if (!params.supportedModels || !params.supportedModels.length) return { success: false, error: 'At least one model required' };

    const tierCfg = TIER_CONFIGS.find((/** @type {any} */ t) => t.tier === params.tier);
    if (!tierCfg) return { success: false, error: 'Invalid tier' };

    const stake = params.stakeEON || 0;
    if (stake < tierCfg.stakeRequired) {
      return { success: false, error: `Tier ${params.tier} (${tierCfg.name}) requires ${tierCfg.stakeRequired.toLocaleString()} EON staked` };
    }

    // P2: VRAM attestation gate — verify claimed VRAM meets tier minimum.
    // Self-reported vramGB is validated against tierCfg.minVramGB.
    // Nodes that lie about VRAM will be demoted by reputation after first failed request.
    const claimedVram = Number(params.vramGB) || 0;
    if (tierCfg.minVramGB > 0 && claimedVram < tierCfg.minVramGB) {
      return {
        success: false,
        error: `Tier ${params.tier} (${tierCfg.name}) requires ${tierCfg.minVramGB}GB+ VRAM. Claimed: ${claimedVram}GB. Upgrade your tier or report accurate hardware.`
      };
    }
    // Issue an attestation challenge token stored on the node record.
    // When the node serves its first request, completeInference() verifies response
    // latency is consistent with claimed hardware. Nodes with latency >5x expected are penalised.
    const attestationChallenge = `att-${cryptoId().slice(0, 16)}`;
    const expectedMaxLatencyMs = tierCfg.minVramGB === 0 ? 8000 : tierCfg.minVramGB >= 80 ? 500 : tierCfg.minVramGB >= 48 ? 1000 : 2500;

    const nodeId = `dis-node-${cryptoId().slice(0, 12)}`;
    const now = Date.now();

    const /** @type {any} */
node = {
      id: nodeId,
      userId: params.userId,
      displayName: params.displayName || `Node ${nodeId.slice(-6)}`,
      runtimeType: params.runtimeType,
      supportedModels: params.supportedModels,
      tier: params.tier,
      stakeEON: stake,
      gpu: params.gpu || 'Unknown',
      vramGB: claimedVram,
      maxContextTokens: params.maxContextTokens || 4096,
      computeUnitsEarned: 0,
      earningsUSD: 0,
      uptimePct: 100,
      avgLatencyMs: 500,
      reputation: params.tier === 0 ? 50 : 70,
      requestsServed: 0,
      lastHeartbeat: now,
      announcedAt: now,
      online: true,
      // P2: Attestation fields
      attestationChallenge,
      attestationVerified: false,
      expectedMaxLatencyMs
    };

    this.nodes.set(nodeId, node);
    this.networkCacheTs = 0;
    this._persist();

    // PQC-M2: Sign node announcement with ML-DSA-65 + ECDSA P-256 hybrid.
    // The signature proves the node operator's identity and the announced params
    // haven't been tampered with. Routers prefer PQ-verified nodes.
    try {
      const announcement = await ContentSigning.signNodeAnnouncement(params.userId, {
        nodeId,
        tier: node.tier,
        vramGB: node.vramGB,
        supportedModels: node.supportedModels,
        runtimeType: node.runtimeType
      });
      node.pqSignature       = announcement.signature;
      node.pqSigningPublicKey = announcement.publicKey;
      node.announcedAt        = announcement.announcedAt;
      node.pqSignatureVerified = true; // Self-signed; we trust our own node record
      this._persist();
    } catch (/** @type {any} */
e) {
      console.warn('[DistributedInference] PQ signing skipped:', e?.message);
      node.pqSignatureVerified = false;
    }

    // Broadcast node availability on Nostr (kind:62002)
    publishComputeProvider({
      tier: String(params.tier),
      endpoint: params.runtimeType ? `${params.runtimeType}:${nodeId}` : nodeId,
      pricing: tierCfg.stakeRequired > 0 ? `stake:${tierCfg.stakeRequired}` : 'free'
    }).catch(() => {});

    // Award pool points for node registration
    if (appWin.EonPoolPoints?.awardPoints) {
      appWin.EonPoolPoints.awardPoints('inference-node-register', `Registered inference node (${tierCfg.name}) -- hosting ${params.supportedModels.length} model(s)`);
    }

    return { success: true, nodeId };
  }

  // -- Heartbeat --
  heartbeat(/** @type {any} */ nodeId, /** @type {any} */ userId) {
    const node = this.nodes.get(nodeId);
    if (!node || node.userId !== userId) return;
    node.lastHeartbeat = Date.now();
    node.online = true;
    this._persist();
  }

  // -- Deregister --
  deregisterNode(/** @type {any} */ nodeId, /** @type {any} */ userId) {
    const node = this.nodes.get(nodeId);
    if (!node || node.userId !== userId) return;
    node.online = false;
    this._persist();
    this.networkCacheTs = 0;
  }

  // -- Auto-discovery model catalog --
  getNetworkModels() {
    const now = Date.now();
    if (this.networkModelCache.length && now - this.networkCacheTs < this.NETWORK_CACHE_TTL) {
      return this.networkModelCache;
    }

    // Build model -> nodes index (online nodes only, heartbeat within 5 min)
    const /** @type {any} */
modelNodeMap = new Map();
    const HB_TIMEOUT = 5 * 60 * 1000;

    for (const /** @type {any} */
node of this.nodes.values()) {
      if (!node.online || now - node.lastHeartbeat > HB_TIMEOUT) continue;
      for (const /** @type {any} */
modelId of node.supportedModels) {
        const arr = modelNodeMap.get(modelId) || [];
        arr.push(node);
        modelNodeMap.set(modelId, arr);
      }
    }

    const /** @type {any} */
networkModels = [];
    for (const [modelId, nodes] of modelNodeMap.entries()) {
      const avgLatency = nodes.reduce((/** @type {any} */ s, /** @type {any} */ n) => s + n.avgLatencyMs, 0) / nodes.length;
      const avgRep = nodes.reduce((/** @type {any} */ s, /** @type {any} */ n) => s + n.reputation, 0) / nodes.length;
      const bestTier = Math.max(...nodes.map((/** @type {any} */ n) => n.tier));
      const firstAnnounced = Math.min(...nodes.map((/** @type {any} */ n) => n.announcedAt));

      networkModels.push({
        modelId,
        displayName: inferModelDisplayName(modelId),
        nodeCount: nodes.length,
        avgLatencyMs: Math.round(avgLatency),
        avgReputationScore: Math.round(avgRep),
        estimatedCostUsdPer1kTokens: estimateCostFromModelId(modelId),
        capabilities: inferModelCapabilities(modelId),
        isAutoDiscovered: false,
        isNew: (now - firstAnnounced) < 30 * 24 * 60 * 60 * 1000,
        bestTier,
        nodeIds: nodes.map((/** @type {any} */ n) => n.id)
      });
    }

    // Sort: highest tier > most nodes > best reputation
    networkModels.sort((/** @type {any} */ a, /** @type {any} */ b) =>
      b.bestTier !== a.bestTier ? b.bestTier - a.bestTier
        : b.nodeCount !== a.nodeCount ? b.nodeCount - a.nodeCount
        : b.avgReputationScore - a.avgReputationScore
    );

    this.networkModelCache = networkModels;
    this.networkCacheTs = now;
    return networkModels;
  }

  // -- Inference submission --
  submitInference(/** @type {any} */ userId, /** @type {any} */ modelId, /** @type {any} */ prompt, /** @type {any} */ maxTokens) {
    maxTokens = maxTokens || 1000;
    if (!userId) return { success: false, error: 'Wallet address required' };
    if (!modelId) return { success: false, error: 'Model ID required' };
    if (!prompt || !prompt.trim()) return { success: false, error: 'Prompt cannot be empty' };

    const requestId = `dis-req-${cryptoId().slice(0, 12)}`;
    const costUSD = estimateCostFromModelId(modelId) * (maxTokens / 1000);

    const /** @type {any} */
request = {
      id: requestId,
      modelId,
      prompt,
      maxTokens,
      userId,
      timestamp: Date.now(),
      status: 'pending',
      assignedNodeId: null,
      costUSD,
      tokensUsed: 0,
      latencyMs: 0
    };

    const bestNode = this._routeRequest(modelId);
    if (!bestNode) {
      return { success: false, error: `No online nodes for model: ${modelId}` };
    }

    request.assignedNodeId = bestNode.id;
    request.status = 'routing';
    this.requests.set(requestId, request);
    this._persist();

    // Pool points for requester
    if (appWin.EonPoolPoints?.awardPoints) {
      appWin.EonPoolPoints.awardPoints('inference-submit', `Used P2P inference: ${inferModelDisplayName(modelId)}`);
    }

    return { success: true, requestId, costUSD, nodeId: bestNode.id, nodeName: bestNode.displayName };
  }

  // -- Complete inference --
  completeInference(/** @type {any} */ requestId, /** @type {any} */ tokensUsed, /** @type {any} */ latencyMs) {
    const request = this.requests.get(requestId);
    if (!request) return { success: false, error: 'Request not found' };
    if (request.status === 'completed') return { success: true, cuEarned: 0 };

    request.status = 'completed';
    request.tokensUsed = tokensUsed;
    request.latencyMs = latencyMs;

    const node = request.assignedNodeId ? this.nodes.get(request.assignedNodeId) : undefined;

    if (node) {
      const tierCfg = TIER_CONFIGS.find((/** @type {any} */ t) => t.tier === node.tier) || TIER_CONFIGS[0];
      const baseCU = tokensUsed / 100; // 1 CU per 100 tokens served
      const cuEarned = baseCU * tierCfg.cuMultiplier;

      // P2: Attestation latency check — penalise nodes whose actual latency far exceeds
      // what their claimed VRAM tier should support. Penalty: −5 reputation per violation.
      if (!node.attestationVerified && node.expectedMaxLatencyMs) {
        if (latencyMs <= node.expectedMaxLatencyMs * 5) {
          // Passed first latency challenge — mark as verified
          node.attestationVerified = true;
        } else {
          // Latency >5x expected — likely false VRAM claim, deduct reputation
          node.reputation = Math.max(0, node.reputation - 5);
          console.warn(`[DistInference] Node ${node.id} failed attestation: latency ${latencyMs}ms vs expected max ${node.expectedMaxLatencyMs}ms. Reputation penalised.`);
        }
      }

      node.computeUnitsEarned += cuEarned;
      node.earningsUSD += request.costUSD;
      node.reputation = Math.min(100, node.reputation + 0.2);
      node.requestsServed += 1;
      node.lastHeartbeat = Date.now();

      const /** @type {any} */
cuEntry = {
        nodeId: node.id,
        requestId,
        cuEarned,
        tokensServed: tokensUsed,
        modelId: request.modelId,
        timestamp: Date.now(),
        latencyMs
      };
      this.cuLog.push(cuEntry);

      // Pool points for the serving node
      const ptsToAward = Math.max(1, Math.ceil(cuEarned));
      if (appWin.EonPoolPoints?.awardPoints) {
        appWin.EonPoolPoints.awardPoints('inference-serve', `Served P2P inference for ${inferModelDisplayName(request.modelId)} (${tokensUsed} tokens, ${latencyMs}ms) +${ptsToAward} pts`);
      }

      this._persist();
      return { success: true, cuEarned };
    }

    this._persist();
    return { success: true, cuEarned: 0 };
  }

  // -- Query methods --
  getJobStatus(/** @type {any} */ requestId) {
    const local = this.requests.get(/** @type {any} */ requestId);
    if (local) return { status: local.status, tokensUsed: local.tokensUsed, latencyMs: local.latencyMs, modelId: local.modelId };
    return { status: 'not_found', error: 'Request not found' };
  }

  getNodeStats(/** @type {any} */ nodeId) { return this.nodes.get(nodeId); }
  getUserNodes(/** @type {any} */ userId) { return Array.from(this.nodes.values()).filter(/** @type {any} */ n => n.userId === userId); }

  getUserEarnings(/** @type {any} */ userId) {
    const userNodes = this.getUserNodes(userId);
    return {
      totalEarningsUSD: userNodes.reduce((/** @type {any} */ s, /** @type {any} */ n) => s + n.earningsUSD, 0),
      totalCU: userNodes.reduce((/** @type {any} */ s, /** @type {any} */ n) => s + n.computeUnitsEarned, 0),
      activeNodes: userNodes.filter(/** @type {any} */ n => n.online).length,
      highestTier: userNodes.length ? Math.max(...userNodes.map((/** @type {any} */ n) => n.tier)) : 0,
      totalRequestsServed: userNodes.reduce((/** @type {any} */ s, /** @type {any} */ n) => s + n.requestsServed, 0)
    };
  }

  getNetworkStats() {
    const all = Array.from(this.nodes.values());
    const online = all.filter(/** @type {any} */ n => n.online && Date.now() - n.lastHeartbeat < 5 * 60 * 1000);
    const nodesByTier = all.reduce((/** @type {any} */ acc, /** @type {any} */ n) => { acc[n.tier] = (acc[n.tier] || 0) + 1; return acc; }, {});
    const uniqueModels = new Set(all.flatMap(/** @type {any} */ n => n.supportedModels)).size;
    return {
      onlineNodes: online.length,
      totalNodes: all.length,
      uniqueModels,
      totalRequestsServed: all.reduce((/** @type {any} */ s, /** @type {any} */ n) => s + n.requestsServed, 0),
      nodesByTier,
      avgLatencyMs: online.length ? Math.round(online.reduce((/** @type {any} */ s, /** @type {any} */ n) => s + n.avgLatencyMs, 0) / online.length) : 0
    };
  }

  // -- Local provider detection --
  async detectLocalProviders(/** @type {{ force?: boolean } | boolean } */ options = {}) {
    if (!shouldProbeLocalRuntimes(options)) {
      return {
        ollama: { available: false, models: [] },
        lmstudio: { available: false, models: [] },
        jan: { available: false, models: [] }
      };
    }
    const /** @type {any} */
results = {};
    const probes = {
      ollama: ['http://127.0.0.1:11434/api/tags', 'http://localhost:11434/api/tags', 'http://127.0.0.1:11434/v1/models'],
      lmstudio: ['http://127.0.0.1:1234/v1/models', 'http://localhost:1234/v1/models'],
      jan: ['http://127.0.0.1:1337/v1/models', 'http://localhost:1337/v1/models']
    };
    const fetchJson = async (/** @type {string} */ url) => {
      const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
      if (!res.ok) return null;
      return await res.json();
    };

    for (const [provider, urls] of Object.entries(probes)) {
      results[provider] = { available: false, models: [] };
      for (const url of urls) {
        try {
          const data = await fetchJson(url);
          if (!data) continue;
          const models = provider === 'ollama'
            ? (data.models || data.data || []).map((/** @type {any} */ m) => m.name || m.id).filter(Boolean)
            : (data.data || data.models || []).map((/** @type {any} */ m) => m.id || m.name).filter(Boolean);
          if (models.length) {
            results[provider] = { available: true, models: models.slice(0, 10), endpoint: url };
            break;
          }
        } catch {}
      }
    }

    return results;
  }

  // -- Nostr discovery (kind:62002) --
  async syncProvidersFromNostr() {
    const events = await fetchRecentEonEvents(62002, 'compute-provider', 100);
    const discovered = events.map((/** @type {any} */ event) => {
      let parsed = /** @type {any} */ ({});
      try { parsed = JSON.parse(event.content || '{}'); } catch {}
      const tags = Array.isArray(event.tags) ? event.tags : [];
      const tierTag = tags.find((/** @type {any} */ t) => Array.isArray(t) && t[0] === 'tier');
      const tier = Number(tierTag?.[1] ?? 0);
      return {
        eventId: event.id,
        pubkey: event.pubkey,
        tier: Number.isFinite(tier) ? tier : 0,
        endpoint: String(parsed.endpoint || ''),
        pricing: String(parsed.pricing || ''),
        createdAt: Number(event.created_at || 0) * 1000
      };
    });
    this.discoveredProviders = discovered;
    return discovered;
  }

  getDiscoveredProviders() {
    return this.discoveredProviders.slice();
  }

  // -- Capability-aware discovery --

  /**
   * Find all online nodes that support at least one of the requested capabilities.
   * Returns nodes sorted by capability match score descending.
   * @param {string[]} requiredCapabilities
   * @returns {any[]}
   */
  findNodesByCapability(/** @type {any} */ requiredCapabilities) {
    const now = Date.now();
    const HB_TIMEOUT = 5 * 60 * 1000;
    const caps = Array.isArray(requiredCapabilities) ? requiredCapabilities : [CAPABILITY_TAGS.TEXT];

    return Array.from(this.nodes.values())
      .filter((/** @type {any} */ n) => n.online && now - n.lastHeartbeat < HB_TIMEOUT)
      .map((/** @type {any} */ n) => {
        const nodeCaps = n.supportedModels.flatMap((/** @type {any} */ m) => inferModelCapabilities(m));
        const capScore = scoreCapabilityMatch(caps, nodeCaps);
        return { node: n, capScore, nodeCaps: [...new Set(nodeCaps)] };
      })
      .filter((/** @type {any} */ x) => x.capScore > 0)
      .sort((/** @type {any} */ a, /** @type {any} */ b) => b.capScore !== a.capScore
        ? b.capScore - a.capScore
        : b.node.tier - a.node.tier);
  }

  /**
   * Given a set of required capabilities, return the best matching network models
   * ranked by capability score, then tier, then reputation.
   * @param {string[]} requiredCapabilities
   * @returns {{ model: any, capScore: number }[]}
   */
  matchCapabilityToProviders(/** @type {any} */ requiredCapabilities) {
    const allModels = this.getNetworkModels();
    const caps = Array.isArray(requiredCapabilities) ? requiredCapabilities : [CAPABILITY_TAGS.TEXT];

    return allModels
      .map((/** @type {any} */ m) => ({
        model: m,
        capScore: scoreCapabilityMatch(caps, m.capabilities)
      }))
      .filter((/** @type {any} */ x) => x.capScore > 0)
      .sort((/** @type {any} */ a, /** @type {any} */ b) => b.capScore !== a.capScore
        ? b.capScore - a.capScore
        : b.model.bestTier - a.model.bestTier);
  }

  /**
   * Summarise available capabilities across the whole network.
   * Useful for the marketplace status card.
   * @returns {{ capability: string, modelCount: number, nodeCount: number }[]}
   */
  getNetworkCapabilitySummary() {
    const allModels = this.getNetworkModels();
    /** @type {Map<string, { modelCount: number, nodeCount: number }>} */
    const capMap = new Map();

    for (const m of allModels) {
      for (const cap of (m.capabilities || [])) {
        const entry = capMap.get(cap) || { modelCount: 0, nodeCount: 0 };
        entry.modelCount += 1;
        entry.nodeCount += m.nodeCount;
        capMap.set(cap, entry);
      }
    }

    return [...capMap.entries()]
      .map((/** @type {any} */ [capability, stats]) => ({ capability, ...stats }))
      .sort((/** @type {any} */ a, /** @type {any} */ b) => b.nodeCount - a.nodeCount);
  }

  // -- Private helpers --
  _routeRequest(/** @type {any} */ modelId) {
    const now = Date.now();
    const HB_TIMEOUT = 5 * 60 * 1000;

    const candidates = Array.from(this.nodes.values())
      .filter((/** @type {any} */ n) => n.online && now - n.lastHeartbeat < HB_TIMEOUT && n.supportedModels.includes(modelId))
      .sort((/** @type {any} */ a, /** @type {any} */ b) => {
        if (b.tier !== a.tier) return b.tier - a.tier;
        // PQC: PQ-signature-verified nodes are preferred over unverified ones
        const pqDiff = (b.pqSignatureVerified ? 1 : 0) - (a.pqSignatureVerified ? 1 : 0);
        if (pqDiff !== 0) return pqDiff;
        if (b.reputation !== a.reputation) return b.reputation - a.reputation;
        return a.avgLatencyMs - b.avgLatencyMs;
      });

    return candidates[0] || null;
  }

  _hydrateFromStorage() {
    const nodeMap = loadJson(NODES_KEY, {});
    for (const [id, node] of Object.entries(nodeMap)) {
      if (node && typeof node === 'object') this.nodes.set(id, node);
    }
    const reqMap = loadJson(REQUESTS_KEY, {});
    for (const [id, req] of Object.entries(reqMap)) {
      if (req && typeof req === 'object') this.requests.set(id, req);
    }
    this.cuLog = loadJson(CU_LOG_KEY, []);
  }

  _persist() {
    const /** @type {any} */
nodeObj = {};
    for (const [id, node] of this.nodes.entries()) (/** @type {any} */ (nodeObj))[id] = node;
    saveJson(NODES_KEY, nodeObj);

    const /** @type {any} */
reqObj = {};
    for (const [id, req] of this.requests.entries()) (/** @type {any} */ (reqObj))[id] = req;
    saveJson(REQUESTS_KEY, reqObj);

    saveJson(CU_LOG_KEY, this.cuLog.slice(-500)); // Keep last 500 CU entries
  }
}

// -- Singleton --
const distributedInferenceService = new DistributedInferenceService();
export default distributedInferenceService;
export { DistributedInferenceService };
