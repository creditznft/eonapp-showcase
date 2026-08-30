/**
 * DistributedInferenceService_V5.js
 * 
 * Core distributed inference service for EONAPP.CH
 * Adapted from eonpackage DistributedInferenceService_V5.ts
 * 
 * Features:
 * - No hardcoded model lists (fully dynamic)
 * - Auto-discovery of local models (Ollama, LM Studio, Jan)
 * - P2P network announcements with hardware/tier/pricing
 * - Job routing to best node (tier, latency, reputation)
 * - Compute unit tracking and EON rewards
 * - EIP-191 signature verification
 * - Live model catalog with node count, price, latency
 */

class ModelRegistryService {
  constructor(/** @type {any} */ service) {
    this.service = service;
    /** @type {any[]} */
    this.records = [];
    this.recordMap = new Map();
  }

  rebuildFromNodes() {
    const now = Date.now();
    const HB_TIMEOUT = 5 * 60 * 1000;
    const /** @type {any} */
byModel = new Map();
    const nodesList = /** @type {any[]} */ (Array.from(this.service.nodes.values()));

    for (const /** @type {any} */
node of nodesList) {
      if (!node.online || now - node.lastHeartbeat > HB_TIMEOUT) continue;
      for (const /** @type {any} */
modelId of node.supportedModels || []) {
        const arr = byModel.get(modelId) || [];
        arr.push(node);
        byModel.set(modelId, arr);
      }
    }

    const /** @type {any} */
records = [];
    for (const [modelId, nodes] of byModel.entries()) {
      const nodesAny = /** @type {any[]} */ (nodes);
      const avgLatency = nodesAny.reduce((/** @type {any} */ sum, /** @type {any} */ n) => sum + Number(n.avgLatencyMs || 0), 0) / nodesAny.length;
      const avgRep = nodesAny.reduce((/** @type {any} */ sum, /** @type {any} */ n) => sum + Number(n.reputation || 0), 0) / nodesAny.length;
      const bestTier = Math.max(...nodesAny.map((/** @type {any} */ n) => Number(n.tier || 0)));
      const firstAnnounced = Math.min(...nodesAny.map((/** @type {any} */ n) => Number(n.announcedAt || now)));
      const runtimeTypes = Array.from(new Set(nodesAny.map((/** @type {any} */ n) => String(n.runtimeType || 'unknown'))));

      records.push({
        modelId,
        displayName: this.service._inferModelDisplayName(modelId),
        nodeCount: nodes.length,
        avgLatencyMs: Math.round(avgLatency),
        avgReputationScore: Math.round(avgRep),
        estimatedCostUsdPer1kTokens: this.service._estimateCostFromModelId(modelId),
        capabilities: ['text'],
        isAutoDiscovered: true,
        isNew: now - firstAnnounced < 30 * 24 * 60 * 60 * 1000,
        bestTier,
        nodeIds: nodesAny.map((/** @type {any} */ n) => n.id),
        runtimeTypes,
        updatedAt: now,
      });
    }

    records.sort((/** @type {any} */ a, /** @type {any} */ b) =>
      b.bestTier !== a.bestTier ? b.bestTier - a.bestTier
        : b.nodeCount !== a.nodeCount ? b.nodeCount - a.nodeCount
        : b.avgReputationScore - a.avgReputationScore
    );

    this.records = records;
    this.recordMap = new Map((/** @type {any[]} */ (records)).map((/** @type {any} */ record) => [record.modelId, record]));
    return records;
  }

  search(/** @type {any} */ query = '', /** @type {any} */ options = {}) {
    const q = String(query || '').trim().toLowerCase();
    const minTier = Number.isFinite(options.minTier) ? Number(options.minTier) : null;
    const maxCost = Number.isFinite(options.maxCost) ? Number(options.maxCost) : null;
    const minNodes = Number.isFinite(options.minNodes) ? Number(options.minNodes) : null;

    return this.records.filter(/** @type {any} */ record => {
      if (q && !record.modelId.toLowerCase().includes(q) && !record.displayName.toLowerCase().includes(q)) return false;
      if (minTier !== null && Number(record.bestTier) < minTier) return false;
      if (maxCost !== null && Number(record.estimatedCostUsdPer1kTokens) > maxCost) return false;
      if (minNodes !== null && Number(record.nodeCount) < minNodes) return false;
      return true;
    });
  }

  getByModelId(/** @type {any} */ modelId) {
    return this.recordMap.get(modelId) || null;
  }

  exportState() {
    return this.records;
  }

  importState(/** @type {any} */ records) {
    const safeRecords = Array.isArray(records) ? records : [];
    this.records = safeRecords;
    this.recordMap = new Map(safeRecords.map(/** @type {any} */ record => [record.modelId, record]));
  }
}

class JobRoutingService {
  constructor(/** @type {any} */ service) {
    this.service = service;
  }

  selectNodeForModel(/** @type {any} */ modelId, /** @type {any} */ options = {}) {
    const now = Date.now();
    const HB_TIMEOUT = 5 * 60 * 1000;
    const requireRuntime = options.requireRuntime ? String(options.requireRuntime).toLowerCase() : null;
    const maxLatencyMs = Number.isFinite(options.maxLatencyMs) ? Number(options.maxLatencyMs) : null;

    const /** @type {any} */
candidates = [];
    for (const /** @type {any} */
node of this.service.nodes.values()) {
      if (!node.online || now - node.lastHeartbeat > HB_TIMEOUT) continue;
      if (!Array.isArray(node.supportedModels) || !node.supportedModels.includes(modelId)) continue;
      if (requireRuntime && String(node.runtimeType || '').toLowerCase() !== requireRuntime) continue;
      if (maxLatencyMs !== null && Number(node.avgLatencyMs || 0) > maxLatencyMs) continue;

      const pendingOnNode = Array.from(this.service.requests.values()).filter(/** @type {any} */ req => req.assignedNodeId === node.id && req.status !== 'completed').length;
      const loadPenalty = pendingOnNode * 1.5;
      const score = (Number(node.tier || 0) * 10) - (Number(node.avgLatencyMs || 0) * 0.01) + (Number(node.reputation || 0) * 0.1) - loadPenalty;
      candidates.push({ node, score, pendingOnNode });
    }

    candidates.sort((/** @type {any} */ a, /** @type {any} */ b) => b.score - a.score);
    return {
      best: candidates[0] || null,
      candidates: candidates.slice(0, 5),
    };
  }
}

class ModelMarketplaceService {
  constructor(/** @type {any} */ service) {
    this.service = service;
    /** @type {any[]} */
    this.activity = [];
  }

  quote(/** @type {any} */ modelId, /** @type {any} */ options = {}) {
    const maxTokens = Number(options.maxTokens || 1000);
    const selection = this.service.jobRouter.selectNodeForModel(modelId, options);
    const bestNode = selection.best ? selection.best.node : null;
    const tier = bestNode ? Number(bestNode.tier || 0) : Number(options.fallbackTier || 0);
    const tierCfg = /** @type {any} */ (DistributedInferenceService.TIER_CONFIGS).find((/** @type {any} */ t) => t.tier === tier) || DistributedInferenceService.TIER_CONFIGS[0];

    const basePer1k = this.service._estimateCostFromModelId(modelId);
    const tierMultiplier = Math.max(1, Number(tierCfg.cuMultiplier || 1) / 2);
    const estimatedCostUSD = Number((basePer1k * (maxTokens / 1000) * tierMultiplier).toFixed(6));
    const providerPayoutUSD = Number((estimatedCostUSD * 0.8).toFixed(6));
    const platformFeeUSD = Number((estimatedCostUSD * 0.2).toFixed(6));

    return {
      modelId,
      maxTokens,
      bestNodeId: bestNode ? bestNode.id : null,
      bestTier: tier,
      tierName: tierCfg.name,
      tierMultiplier,
      estimatedCostUSD,
      providerPayoutUSD,
      platformFeeUSD,
      routingScore: selection.best ? Number(selection.best.score.toFixed(3)) : null,
      alternatives: selection.candidates.map((/** @type {any} */ entry) => ({
        nodeId: entry.node.id,
        tier: entry.node.tier,
        latencyMs: entry.node.avgLatencyMs,
        reputation: entry.node.reputation,
        score: Number(entry.score.toFixed(3)),
      })),
      quotedAt: Date.now(),
    };
  }

  recordSubmission(/** @type {any} */ entry) {
    this.activity.push({
      id: entry.id,
      requestId: entry.requestId,
      modelId: entry.modelId,
      userId: entry.userId,
      nodeId: entry.nodeId,
      status: 'submitted',
      estimatedCostUSD: entry.estimatedCostUSD,
      maxTokens: entry.maxTokens,
      createdAt: Date.now(),
      completedAt: null,
    });
    this.activity = this.activity.slice(-500);
  }

  markCompleted(/** @type {any} */ requestId, /** @type {any} */ finalCostUSD) {
    const row = this.activity.find(/** @type {any} */ item => item.requestId === requestId);
    if (!row) return;
    row.status = 'completed';
    row.finalCostUSD = Number(finalCostUSD || row.estimatedCostUSD || 0);
    row.completedAt = Date.now();
  }

  getActivityForUser(/** @type {any} */ userId) {
    return this.activity.filter(/** @type {any} */ item => item.userId === userId);
  }

  exportState() {
    return this.activity;
  }

  importState(/** @type {any} */ activity) {
    this.activity = Array.isArray(activity) ? activity.slice(-500) : [];
  }
}

class SettlementService {
  constructor(/** @type {any} */ service) {
    this.service = service;
    /** @type {any[]} */
    this.records = [];
  }

  createRecord(/** @type {any} */ request, /** @type {any} */ node, /** @type {any} */ meta) {
    if (!request || !node) return null;
    const baseProof = window.DistributedInferenceHelpers?.generateSettlementProof
      ? window.DistributedInferenceHelpers.generateSettlementProof(
        request.id,
        node.id,
        request.costUSD,
        meta.tokensUsed,
        meta.cuEarned
      )
      : {
        requestId: request.id,
        nodeId: node.id,
        costUSD: request.costUSD,
        tokensServed: meta.tokensUsed,
        cuEarned: meta.cuEarned,
        timestamp: Date.now(),
        proofHash: this._hash(`${request.id}:${node.id}:${meta.tokensUsed}:${meta.cuEarned}`),
      };

    const /** @type {any} */
settlement = {
      settlementId: `set-${this.service._generateId().slice(0, 12)}`,
      requestId: request.id,
      nodeId: node.id,
      providerUserId: node.userId,
      requesterUserId: request.userId,
      status: 'pending',
      costUSD: Number(request.costUSD || 0),
      providerPayoutUSD: Number(((request.costUSD || 0) * 0.8).toFixed(6)),
      platformFeeUSD: Number(((request.costUSD || 0) * 0.2).toFixed(6)),
      tokensServed: Number(meta.tokensUsed || 0),
      latencyMs: Number(meta.latencyMs || 0),
      cuEarned: Number(meta.cuEarned || 0),
      proof: baseProof,
      createdAt: Date.now(),
      paidAt: null,
    };

    this.records.push(settlement);
    this.records = this.records.slice(-1000);
    return settlement;
  }

  markPaid(/** @type {any} */ settlementId) {
    const item = this.records.find(/** @type {any} */ record => record.settlementId === settlementId);
    if (!item) return { success: false, error: 'Settlement not found' };
    if (item.status === 'paid') return { success: true, settlement: item };
    item.status = 'paid';
    item.paidAt = Date.now();
    return { success: true, settlement: item };
  }

  summaryByProvider(/** @type {any} */ userId) {
    const rows = this.records.filter(/** @type {any} */ record => record.providerUserId === userId);
    return {
      total: rows.length,
      pending: rows.filter(/** @type {any} */ record => record.status === 'pending').length,
      paid: rows.filter(/** @type {any} */ record => record.status === 'paid').length,
      payoutUSD: Number((/** @type {any[]} */ (rows)).reduce((sum, record) => sum + Number(record.providerPayoutUSD || 0), 0).toFixed(6)),
      rows,
    };
  }

  exportState() {
    return this.records;
  }

  importState(/** @type {any} */ records) {
    this.records = Array.isArray(records) ? records.slice(-1000) : [];
  }

  _hash(/** @type {any} */ input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0;
    }
    return `0x${Math.abs(hash).toString(16)}`;
  }
}

class DistributedInferenceService {
  constructor() {
    this.nodes = new Map(); // nodeId -> InferenceNode
    this.requests = new Map(); // requestId -> InferenceRequest
    /** @type {any[]} */
    this.cuLog = []; // Compute unit log
    /** @type {any[]} */
    this.networkModelCache = [];
    this.networkCacheTs = 0;
    this.NETWORK_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    // Hard parts: registry + marketplace + routing + settlement stacks
    this.modelRegistry = new ModelRegistryService(this);
    this.jobRouter = new JobRoutingService(this);
    this.marketplace = new ModelMarketplaceService(this);
    this.settlement = new SettlementService(this);

    // Initialize from localStorage
    this._hydrateFromStorage();

    // Auto-detect local runtimes
    const canProbeLocal = typeof window.shouldProbeLocalRuntimes === 'function'
      ? window.shouldProbeLocalRuntimes()
      : false;
    if (canProbeLocal) {
      this._autoDetectLocalRuntimes();
    }
  }

  /**
   * TIER CONFIGS - Define compute tiers with staking requirements and multipliers
   */
  /** @type {any} */
static TIER_CONFIGS = [
    {
      tier: 0,
      name: 'CPU Free',
      stakeRequired: 0,
      cuMultiplier: 0.5,
      minVramGB: 0,
      description: 'Any device — run small models (≤7B) via CPU inference',
      benefits: ['🆓 Zero staking', '💻 CPU inference', '💰 Earn 0.5× CU', '📈 Build reputation'],
    },
    {
      tier: 1,
      name: 'Consumer GPU',
      stakeRequired: 10_000,
      cuMultiplier: 2.0,
      minVramGB: 8,
      description: 'RTX 3060 / RX 6700 XT — run 7B–13B models',
      benefits: ['🎮 8GB+ VRAM', '💰 Earn 2× CU', '⚡ 7B–13B models', '🔒 10k EON stake'],
    },
    {
      tier: 2,
      name: 'Mid GPU',
      stakeRequired: 50_000,
      cuMultiplier: 5.0,
      minVramGB: 16,
      description: 'RTX 3090 / RTX 4070 Ti — run 30B models',
      benefits: ['🎮 16GB+ VRAM', '💰 Earn 5× CU', '⚡ Up to 30B models', '🏆 VIP priority'],
    },
    {
      tier: 3,
      name: 'High-End GPU',
      stakeRequired: 250_000,
      cuMultiplier: 15.0,
      minVramGB: 48,
      description: 'RTX 4090 / A6000 — run 70B models',
      benefits: ['🚀 48GB+ VRAM', '💰 Earn 15× CU', '⚡ 70B+ models', '👑 Premium priority'],
    },
    {
      tier: 4,
      name: 'Data Center',
      stakeRequired: 1_000_000,
      cuMultiplier: 60.0,
      minVramGB: 80,
      description: 'H100 / A100 — any model, fastest inference',
      benefits: ['🏢 80GB+ VRAM', '💰 Earn 60× CU', '⚡ Any model', '👑👑 Highest priority'],
    },
  ];

  /**
   * AUTO-DETECT LOCAL RUNTIMES
   * Check for Ollama, LM Studio, Jan on standard ports
   */
  async _autoDetectLocalRuntimes() {
    const canProbeLocal = typeof window.shouldProbeLocalRuntimes === 'function'
      ? window.shouldProbeLocalRuntimes()
      : false;
    if (!canProbeLocal) return;
    const /** @type {any} */
runtimes = [
      { name: 'Ollama', port: 11434, endpoint: 'http://127.0.0.1:11434/api/tags' },
      { name: 'LM Studio', port: 1234, endpoint: 'http://127.0.0.1:1234/v1/models' },
    ];

    for (const /** @type {any} */
runtime of runtimes) {
      let timeoutId;
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(runtime.endpoint, { method: 'GET', signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${runtime.name} detected on port ${runtime.port}`);
          // Auto-announce models from this runtime
          await this._announceLocalModels(runtime.name, data);
        }
      } catch (/** @type {any} */
_err) {
        // Runtime not available, skip
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    }
  }

  /**
   * ANNOUNCE LOCAL MODELS
   * Parse local runtime model list and announce to P2P network
   */
  async _announceLocalModels(/** @type {any} */ runtimeName, /** @type {any} */ runtimeData) {
    let /** @type {any} */
models = [];

    if (runtimeName === 'Ollama' && runtimeData.models) {
      models = /** @type {any[]} */ (runtimeData.models).map((/** @type {any} */ m) => m.name);
    } else if (runtimeName === 'LM Studio' && runtimeData.data) {
      models = /** @type {any[]} */ (runtimeData.data).map((/** @type {any} */ m) => m.id);
    } else if (runtimeName === 'Jan' && runtimeData.data) {
      models = /** @type {any[]} */ (runtimeData.data).map((/** @type {any} */ m) => m.id);
    }

    // For each model, announce as a node
    for (const /** @type {any} */
modelId of models) {
      const nodeId = `dis-node-${this._generateId().slice(0, 12)}`;
      const /** @type {any} */
node = {
        id: nodeId,
        userId: await this._getCurrentUserId(),
        displayName: `${runtimeName} - ${modelId}`,
        runtimeType: runtimeName,
        supportedModels: [modelId],
        tier: 0, // Default tier
        stakeEON: 0,
        gpu: 'Unknown',
        vramGB: 0,
        maxContextTokens: 4096,
        computeUnitsEarned: 0,
        earningsUSD: 0,
        uptimePct: 100,
        avgLatencyMs: 500,
        reputation: 50,
        requestsServed: 0,
        lastHeartbeat: Date.now(),
        announcedAt: Date.now(),
        online: true,
      };

      this.nodes.set(nodeId, node);
      this._persistState();
    }

    this.networkCacheTs = 0; // Invalidate cache
  }

  /**
   * ANNOUNCE NODE - Public API for announcing a new inference node
   */
  async announceNode(/** @type {any} */ params) {
    if (!params.userId) return { success: false, error: 'Wallet address required' };
    if (!params.supportedModels || !params.supportedModels.length) {
      return { success: false, error: 'At least one model required' };
    }

    const tierCfg = /** @type {any} */ (DistributedInferenceService.TIER_CONFIGS).find((/** @type {any} */ t) => t.tier === params.tier);
    if (!tierCfg) return { success: false, error: 'Invalid tier' };

    const stake = params.stakeEON || 0;
    if (stake < tierCfg.stakeRequired) {
      return {
        success: false,
        error: `Tier ${params.tier} requires ${tierCfg.stakeRequired.toLocaleString()} EON staked`,
      };
    }

    const nodeId = `dis-node-${this._generateId().slice(0, 12)}`;
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
      vramGB: params.vramGB || 0,
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
    };

    this.nodes.set(nodeId, node);
    this._persistState();
    this.networkCacheTs = 0; // Invalidate model cache

    return { success: true, nodeId };
  }

  /**
   * ANNOUNCE API PROVIDER
   * Lets users contribute hosted provider capacity (via their own API key)
   * without storing raw keys in distributed inference state.
   */
  async announceApiProvider(/** @type {any} */ params) {
    const providerId = String(params?.providerId || '').trim().toLowerCase();
    const userId = String(params?.userId || '').trim();
    const supportedModels = Array.isArray(params?.supportedModels)
      ? params.supportedModels.map((/** @type {any} */ m) => String(m || '').trim()).filter(Boolean)
      : [];

    if (!userId) return { success: false, error: 'Wallet address required' };
    if (!providerId) return { success: false, error: 'Provider ID required' };
    if (!supportedModels.length) return { success: false, error: 'At least one model required' };

    const tier = Number.isFinite(params?.tier) ? Number(params.tier) : 0;
    const keyHint = String(params?.keyAlias || '') || (params?.apiKey ? this._fingerprintSecret(params.apiKey) : 'configured');

    const announced = await this.announceNode({
      userId,
      displayName: params?.displayName || `${providerId.toUpperCase()} Provider`,
      runtimeType: `api:${providerId}`,
      supportedModels,
      tier,
      stakeEON: Number(params?.stakeEON || 0),
      gpu: params?.gpu || 'Hosted API',
      vramGB: Number(params?.vramGB || 0),
      maxContextTokens: Number(params?.maxContextTokens || 8192),
    });

    if (!announced?.success || !announced?.nodeId) return announced;

    const node = this.nodes.get(announced.nodeId);
    if (node) {
      node.contributionMode = 'api-key';
      node.apiProviderId = providerId;
      node.keyHint = keyHint;
      node.endpointLabel = String(params?.endpointLabel || providerId).slice(0, 80);
      node.canProxyHostedInference = true;
      this._persistState();
      this.networkCacheTs = 0;
    }

    return {
      success: true,
      nodeId: announced.nodeId,
      contributionMode: 'api-key',
      providerId,
      keyHint,
    };
  }

  /**
   * GET NETWORK MODELS - Returns live catalog of all models on network
   * NO hardcoded lists — purely dynamic based on node announcements
   */
  async getNetworkModels() {
    const now = Date.now();
    if (this.networkModelCache.length && now - this.networkCacheTs < this.NETWORK_CACHE_TTL) {
      return this.networkModelCache;
    }

    const networkModels = this.modelRegistry.rebuildFromNodes();

    this.networkModelCache = networkModels;
    this.networkCacheTs = now;
    this._persistState();
    return networkModels;
  }

  getModelRegistry(/** @type {any} */ query = '', /** @type {any} */ options = {}) {
    if (!this.networkModelCache.length || Date.now() - this.networkCacheTs >= this.NETWORK_CACHE_TTL) {
      this.networkModelCache = this.modelRegistry.rebuildFromNodes();
      this.networkCacheTs = Date.now();
    }
    return query ? this.modelRegistry.search(query, options) : this.modelRegistry.records;
  }

  getMarketplaceQuote(/** @type {any} */ modelId, /** @type {any} */ options = {}) {
    return this.marketplace.quote(modelId, options);
  }

  getMarketplaceActivity(/** @type {any} */ userId) {
    if (userId) return this.marketplace.getActivityForUser(userId);
    return this.marketplace.activity.slice();
  }

  /**
   * SUBMIT INFERENCE REQUEST
   * Open-ended model ID (any string matching advertised models)
   */
  async submitInference(/** @type {any} */ userId, /** @type {any} */ modelId, /** @type {any} */ prompt, /** @type {any} */ maxTokens = 1000) {
    if (!userId) return { success: false, error: 'Wallet address required' };
    if (!modelId) return { success: false, error: 'Model ID required' };
    const promptText = String(prompt ?? '').trim();
    if (!promptText) return { success: false, error: 'Prompt cannot be empty' };

    const quote = this.getMarketplaceQuote(modelId, { maxTokens });
    if (!quote.bestNodeId) {
      return { success: false, error: `No online nodes for model: ${modelId}` };
    }

    const requestId = `dis-req-${this._generateId().slice(0, 12)}`;
    const costUSD = quote.estimatedCostUSD;

    const /** @type {any} */
request = {
      id: requestId,
      modelId,
      maxTokens,
      userId,
      timestamp: Date.now(),
      status: 'pending',
      assignedNodeId: null,
      costUSD,
      tokensUsed: 0,
      latencyMs: 0,
    };

    request.assignedNodeId = quote.bestNodeId;
    request.status = 'routing';
    this.requests.set(requestId, request);
    this.marketplace.recordSubmission({
      id: `mkt-${this._generateId().slice(0, 10)}`,
      requestId,
      modelId,
      userId,
      nodeId: quote.bestNodeId,
      estimatedCostUSD: costUSD,
      maxTokens,
    });
    this._persistState();

    return {
      success: true,
      requestId,
      costUSD,
      nodeId: quote.bestNodeId,
      quote,
    };
  }

  /**
   * COMPLETE INFERENCE - Mark job complete, award CU and EON rewards
   */
  async completeInference(/** @type {any} */ requestId, /** @type {any} */ tokensUsed, /** @type {any} */ latencyMs) {
    const request = this.requests.get(requestId);
    if (!request) return { success: false, error: 'Request not found' };
    if (request.status === 'completed') return { success: true, cuEarned: 0 }; // Idempotent

    const node = request.assignedNodeId ? this.nodes.get(request.assignedNodeId) : undefined;
    if (!node) {
      request.status = 'failed';
      request.tokensUsed = Number(tokensUsed || 0);
      request.latencyMs = Number(latencyMs || 0);
      this._persistState();
      return { success: false, error: 'Node not found' };
    }

    request.status = 'completed';
    request.tokensUsed = tokensUsed;
    request.latencyMs = latencyMs;

    const tierCfg = /** @type {any} */ (DistributedInferenceService.TIER_CONFIGS).find((/** @type {any} */ t) => t.tier === node.tier) || DistributedInferenceService.TIER_CONFIGS[0];
    const baseCU = tokensUsed / 100; // 1 CU per 100 tokens
    const cuEarned = baseCU * tierCfg.cuMultiplier;

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
        latencyMs,
      };
      this.cuLog.push(cuEntry);

      this.marketplace.markCompleted(requestId, request.costUSD);
      this.settlement.createRecord(request, node, { tokensUsed, latencyMs, cuEarned });
      this._persistCU(cuEntry);
      this._persistState();

    return { success: true, cuEarned, eonEquivalent: cuEarned * 0.1 }; // CU to EON conversion
  }

  /**
   * ROUTE REQUEST - Choose best node for a job
   */
  async _routeRequest(/** @type {any} */ modelId) {
    const picked = this.jobRouter.selectNodeForModel(modelId);
    return picked.best ? picked.best.node : null;
  }

  getSettlementSummary(/** @type {any} */ userId) {
    return this.settlement.summaryByProvider(userId);
  }

  markSettlementPaid(/** @type {any} */ settlementId) {
    const result = this.settlement.markPaid(settlementId);
    if (result.success) this._persistState();
    return result;
  }

  /**
   * GET PROVIDER STATS - Earnings, jobs served, reputation for a user/node
   */
  getProviderStats(/** @type {any} */ userId) {
    const userNodes = Array.from(this.nodes.values()).filter(/** @type {any} */ n => n.userId === userId);
    return {
      nodeCount: userNodes.length,
      totalCUEarned: userNodes.reduce((/** @type {any} */ s, /** @type {any} */ n) => s + n.computeUnitsEarned, 0),
      totalEarningsUSD: userNodes.reduce((/** @type {any} */ s, /** @type {any} */ n) => s + n.earningsUSD, 0),
      totalJobsServed: userNodes.reduce((/** @type {any} */ s, /** @type {any} */ n) => s + n.requestsServed, 0),
      avgReputation: userNodes.length > 0
        ? Math.round(userNodes.reduce((/** @type {any} */ s, /** @type {any} */ n) => s + n.reputation, 0) / userNodes.length)
        : 0,
      nodes: userNodes,
    };
  }

  /**
   * HELPER METHODS
   */

  _generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async _getCurrentUserId() {
    // Try to get from session or localStorage
    return localStorage.getItem('userId') || `user-${this._generateId().slice(0, 8)}`;
  }

  _estimateCostFromModelId(/** @type {any} */ modelId) {
    // Simple heuristic: 7B models ~$0.0001/1k, 70B models ~$0.001/1k
    if (modelId.includes('70b') || modelId.includes('7b-70b')) return 0.001;
    if (modelId.includes('30b') || modelId.includes('30')) return 0.0005;
    if (modelId.includes('13b') || modelId.includes('13')) return 0.0002;
    return 0.0001; // Default for 7B and smaller
  }

  _inferModelDisplayName(/** @type {any} */ modelId) {
    // Parse model ID to display name
    if (modelId.includes('mistral')) return 'Mistral 7B';
    if (modelId.includes('llama')) return modelId.replace(/-.*/, '').replace(/2/, '2 (Llama)');
    if (modelId.includes('neural-chat')) return 'Neural Chat 7B';
    if (modelId.includes('zephyr')) return 'Zephyr 7B';
    return modelId;
  }

  _fingerprintSecret(/** @type {any} */ secret) {
    const source = String(secret || '').trim();
    if (!source) return 'configured';
    let hash = 0;
    for (let i = 0; i < source.length; i++) {
      hash = ((hash << 5) - hash) + source.charCodeAt(i);
      hash |= 0;
    }
    const raw = Math.abs(hash).toString(16).padStart(8, '0').slice(0, 8);
    return `key-${raw}`;
  }

  _hydrateFromStorage() {
    try {
      const stored = localStorage.getItem('distributedInferenceState');
      if (!stored) return;
      const state = JSON.parse(stored);
      this.nodes = new Map(Array.isArray(state.nodes) ? state.nodes : []);
      this.requests = new Map(
        Array.isArray(state.requests)
          ? state.requests.map((/** @type {any} */ [requestId, request]) => [requestId, this._sanitizeRequestRecord(request)])
          : []
      );
      this.cuLog = Array.isArray(state.cuLog) ? state.cuLog : [];

      this.modelRegistry.importState(state.registryCache || []);
      this.marketplace.importState(state.marketplaceLedger || []);
      this.settlement.importState(state.settlements || []);
    } catch (/** @type {any} */
err) {
      console.error('Failed to hydrate from storage:', err);
    }
  }

  _persistState() {
    try {
      const sanitizedRequests = Array.from(this.requests.entries()).map((/** @type {any} */ [requestId, request]) => [requestId, this._sanitizeRequestRecord(request)]);
      localStorage.setItem('distributedInferenceState', JSON.stringify({
        version: 2,
        nodes: Array.from(this.nodes.entries()),
        requests: sanitizedRequests,
        cuLog: this.cuLog,
        registryCache: this.modelRegistry.exportState(),
        marketplaceLedger: this.marketplace.exportState(),
        settlements: this.settlement.exportState(),
      }));
    } catch (/** @type {any} */
_err) {
      console.error('Failed to persist distributed inference state:', _err);
    }
  }

  _persistNode(/** @type {any} */ _nodeId, /** @type {any} */ _node) {
    this._persistState();
  }

  _persistRequest(/** @type {any} */ _requestId, /** @type {any} */ _request) {
    this._persistState();
  }

  _sanitizeRequestRecord(/** @type {any} */ request) {
    if (!request || typeof request !== 'object') return request;
    const { prompt: _prompt, ...safeRequest } = request;
    return safeRequest;
  }

  _persistCU(/** @type {any} */ _cuEntry) {
    try {
      localStorage.setItem('cuLog', JSON.stringify(this.cuLog));
    } catch (/** @type {any} */
_err) {
      console.error('Failed to persist CU:', _err);
    }
  }

  /**
   * HEARTBEAT - Keep node alive
   */
  async heartbeat(/** @type {any} */ nodeId, /** @type {any} */ userId) {
    const node = this.nodes.get(nodeId);
    if (!node || node.userId !== userId) return;
    node.lastHeartbeat = Date.now();
    node.online = true;
    this._persistState();
  }

  /**
   * DEREGISTER NODE - Take offline gracefully
   */
  async deregisterNode(/** @type {any} */ nodeId, /** @type {any} */ userId) {
    const node = this.nodes.get(nodeId);
    if (!node || node.userId !== userId) return;
    node.online = false;
    this._persistState();
    this.networkCacheTs = 0;
  }
}

// Singleton instance
/** @type {any} */
let serviceInstance = null;

function getDistributedInferenceService() {
  if (!serviceInstance) {
    serviceInstance = new DistributedInferenceService();
  }
  return serviceInstance;
}

// Export for use
window.DistributedInferenceService = DistributedInferenceService;
window.getDistributedInferenceService = getDistributedInferenceService;
