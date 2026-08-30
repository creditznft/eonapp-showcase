/**
 * REQUEST ORCHESTRATOR BRIDGE
 * Unified decision point combining Agent-Orchestrator (policy) + Provider-Orchestrator (routing)
 * 
 * Purpose:
 * - Single entry point for all AI requests
 * - Combines policy enforcement + provider selection
 * - Returns complete execution plan (action, provider, model, retry policy, fallback chain)
 * - Enables better observability and debugging
 * - Simplifies client-side integration
 * 
 * Location: assets/js/utils/request-orchestrator-bridge.js
 * Used by: Creator Studio, Chat, EON Browser, all AI request surfaces
 * 
 * E1.3: New unified orchestrator bridge
 */

import { getAgentOrchestrator } from './agent-orchestrator.js';
import { ProviderOrchestrator } from './provider-orchestrator.js';
import { classifyActionTrust } from './action-trust-model.js';
import { buildAutoRoutePlan } from './eon-auto-router.js';
import { PROVIDERS, discoverProviderModels, filterChatCapableModels, isChatCapableModelId, selectBestChatModel } from '../chat/ai-runtime.js';

const EXECUTION_PLAN_KEY = 'eon:request-orchestrator:execution-plans:v1';
const PROVIDER_ID_ALIASES = Object.freeze({
  'lm-studio': 'lmstudio'
});

function normalizeProviderId(/** @type {any} */ providerId) {
  const raw = String(providerId || '').trim().toLowerCase();
  return PROVIDER_ID_ALIASES[raw] || raw;
}

function sanitizeModelId(/** @type {any} */ modelId) {
  const value = String(modelId || '').trim();
  return value.toLowerCase() === 'auto' ? '' : value;
}

export class RequestOrchestratorBridge {
  constructor() {
    this.agentOrch = getAgentOrchestrator();
    this.providerOrch = null; // Lazy-loaded
    this.executionPlans = this.loadExecutionPlans();
    this.maxPlans = 100;
  }

  async initialize() {
    if (!this.providerOrch) {
      this.providerOrch = new ProviderOrchestrator();
      await this.providerOrch.initialize();
    }
  }

  loadExecutionPlans() {
    try {
      const stored = JSON.parse(localStorage.getItem(EXECUTION_PLAN_KEY) || '{}');
      return stored.plans || [];
    } catch {
      return [];
    }
  }

  saveExecutionPlans() {
    try {
      localStorage.setItem(
        EXECUTION_PLAN_KEY,
        JSON.stringify({ plans: this.executionPlans.slice(-this.maxPlans) })
      );
    } catch {}
  }

  /**
   * Generate unique execution plan ID
   */
  generatePlanId() {
    return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * Main entry point: Orchestrate a user request end-to-end
   * 
   * Input: User intent (natural language request)
   * Output: Complete execution plan or rejection reason
   */
  async orchestrateRequest(/** @type {any} */ {
    intentText = '',
    origin = 'local-ui',
    metadata = {},
    taskType = 'chat',
    requiresApproval = false,
    adminOverride = null,
    settings = {}
  }) {
    await this.initialize();

    const planId = this.generatePlanId();
    const startTime = Date.now();

    try {
      // STEP 1: Policy Evaluation (Agent-Orchestrator)
      const trust = classifyActionTrust({ intentText, stage: taskType });
      const policyDecision = await this.evaluatePolicy({
        intentText,
        origin,
        requiresApproval: requiresApproval || trust.requiresApproval,
        adminOverride,
        trust
      });

      if (!policyDecision.allowed) {
        return this.recordExecutionPlan({
          planId,
          status: 'rejected',
          stage: 'policy',
          policyDecision,
          latency: Date.now() - startTime
        });
      }

      // STEP 2: Provider Selection (Provider-Orchestrator)
      const providerSelection = await this.selectProvider({
        taskType,
        intentText,
        plannedSteps: policyDecision.plannedSteps,
        settings
      });

      // STEP 3: Build Execution Plan
      const executionPlan = {
        planId,
        status: 'ready',
        stage: 'ready-to-execute',
        policyDecision,
        providerSelection,
        action: policyDecision.action,
        provider: providerSelection.provider,
        model: providerSelection.model,
        retryPolicy: providerSelection.retryPolicy,
        fallbackChain: providerSelection.fallbackChain,
        metadata,
        createdAt: Date.now(),
        latency: Date.now() - startTime
      };

      return this.recordExecutionPlan(executionPlan);
    } catch (/** @type {any} */ err) {
      return this.recordExecutionPlan({
        planId,
        status: 'error',
        stage: 'orchestration',
        error: String(err),
        latency: Date.now() - startTime
      });
    }
  }

  /**
   * STEP 1: Policy Evaluation
   */
  async evaluatePolicy(/** @type {any} */ { intentText, origin, requiresApproval, adminOverride, trust = null }) {
    // Create pipeline job
    const job = this.agentOrch.createPipelineJob({
      origin,
      intentText,
      metadata: { requiresApproval, adminOverride }
    });

    // Handle rate-limited jobs
    if (job.status === 'rate_limited') {
      return {
        allowed: false,
        blocked: true,
        reason: job.errorMsg,
        errorCode: job.errorCode
      };
    }

    // Handle blocked jobs
    if (job.status === 'blocked') {
      if (adminOverride) {
        // Attempt admin override
        const override = await this.agentOrch.overrideJobBlocked({
          jobId: job.id,
          adminNonce: adminOverride.nonce,
          adminTimestamp: adminOverride.timestamp,
          adminSignature: adminOverride.signature,
          adminKey: adminOverride.adminKey,
          reason: adminOverride.reason
        });

        if (!override.ok) {
          return {
            allowed: false,
            blocked: true,
            reason: override.reason,
            errorCode: 'ADMIN_OVERRIDE_FAILED'
          };
        }
      } else {
        return {
          allowed: false,
          blocked: true,
          reason: job.notes,
          errorCode: 'POLICY_BLOCKED',
          jobId: job.id
        };
      }
    }

    // Handle jobs needing approval
    if (job.status === 'awaiting_approval' && !requiresApproval) {
      return {
        allowed: false,
        blocked: false,
        requiresApproval: true,
        pendingApprovals: job.pendingApprovals,
        reason: `This action requires approval for: ${job.pendingApprovals.join(', ')}`,
        errorCode: 'APPROVAL_REQUIRED',
        jobId: job.id
      };
    }

    if (job.status === 'awaiting_approval' && requiresApproval) {
      this.agentOrch.approveJob(job.id, 'user');
    }

    return {
      allowed: true,
      action: job.steps[0] || 'plan',
      plannedSteps: job.steps,
      jobId: job.id,
      policy: this.agentOrch.getPolicySummary(),
      trust
    };
  }

  /**
   * STEP 2: Provider Selection
   */
  async selectProvider(/** @type {any} */ { taskType, intentText, plannedSteps, settings = {} }) {
    if (!this.providerOrch) {
      return { provider: { id: 'guide', label: 'Guide Mode' }, model: 'guide', retryPolicy: {}, fallbackChain: [] };
    }

    const stepHints = Array.isArray(plannedSteps) ? plannedSteps.join(' ') : '';
    const detectedType = taskType || this.providerOrch.detectTaskType([intentText, stepHints].filter(Boolean).join(' '));
    const rankings = this.providerOrch.getProviderRankings();
    const localProviders = (this.providerOrch.availableProviders?.local || []).map((row) => {
      const id = normalizeProviderId(row.id || row.provider);
      return { ...row, id, provider: id, available: true };
    });
    const providerMap = Object.fromEntries(rankings.map((row) => {
      const id = normalizeProviderId(row.id);
      return [id, {
        ...(PROVIDERS[id] || {}),
        ...row,
        id,
        label: row.label || PROVIDERS[id]?.label || id
      }];
    }));
    providerMap.guide = {
      ...(PROVIDERS.guide || {}),
      ...(providerMap.guide || {}),
      id: 'guide',
      label: providerMap.guide?.label || 'Guide Mode',
      free: true
    };

    const routePlan = buildAutoRoutePlan({
      input: [intentText, stepHints].filter(Boolean).join(' '),
      settings: { ...(settings || {}), taskType: detectedType },
      providers: providerMap,
      getApiKey: (providerId) => this.providerOrch?.cloudProviderSecrets?.get(normalizeProviderId(providerId)) || '',
      localProviders
    });

    const selectedProviderId = normalizeProviderId(routePlan.provider);
    const selectedProvider = providerMap[selectedProviderId] || providerMap[normalizeProviderId(rankings[0]?.id)] || { id: 'guide', label: 'Guide Mode' };
    const retryPolicy = this.agentOrch.getRetryPolicy('transient');
    const fallbackChain = (routePlan.fallbackChain || []).map((id) => {
      const normalizedId = normalizeProviderId(id);
      const row = providerMap[normalizedId] || { id: normalizedId, label: normalizedId };
      return {
        id: row.id,
        label: row.label,
        score: row.score,
        load: this.providerOrch?.getCurrentLoad(row.id) ?? 0
      };
    });
    const modelSelection = await this.resolveModelForProvider(selectedProvider, settings);

    return {
      provider: selectedProvider,
      taskType: detectedType,
      retryPolicy,
      fallbackChain,
      model: modelSelection.model,
      modelSource: modelSelection.source,
      routePlan
    };
  }

  async resolveModelForProvider(/** @type {any} */ provider = {}, /** @type {any} */ settings = {}) {
    const providerId = normalizeProviderId(provider.id);
    if (!providerId || providerId === 'guide') {
      return { model: 'guide', source: 'guide' };
    }

    const requestedProviderId = normalizeProviderId(settings.provider);
    const requestedModel = sanitizeModelId(settings.model);
    if (requestedProviderId === providerId && requestedModel && isChatCapableModelId(requestedModel)) {
      return { model: requestedModel, source: 'settings' };
    }

    const apiKey = this.providerOrch?.cloudProviderSecrets?.get(providerId) || '';
    const discovered = filterChatCapableModels(await discoverProviderModels(providerId, apiKey, false));
    const discoveredModel = selectBestChatModel(discovered, providerId);
    if (discoveredModel) {
      return { model: discoveredModel, source: 'discovery' };
    }

    const defaultModel = sanitizeModelId(provider.defaultModel || PROVIDERS[providerId]?.defaultModel || '');
    if (defaultModel && isChatCapableModelId(defaultModel)) {
      return { model: defaultModel, source: 'provider-default' };
    }

    return { model: '', source: 'runtime-auto' };
  }

  /**
   * Record execution plan for audit trail
   */
  recordExecutionPlan(/** @type {any} */ plan) {
    this.executionPlans.push(plan);
    this.saveExecutionPlans();
    return plan;
  }

  /**
   * Get execution plan history
   */
  getExecutionHistory(/** @type {any} */ limit = 25) {
    return this.executionPlans.slice(-Math.max(1, Math.min(100, limit))).reverse();
  }

  /**
   * Get execution plan by ID
   */
  getPlan(/** @type {any} */ planId) {
    return this.executionPlans.find((/** @type {any} */ p) => p.planId === planId);
  }

  /**
   * Execute a plan (callback interface for client)
   */
  async executePlan(/** @type {any} */ planId, /** @type {any} */ executionFn) {
    const plan = this.getPlan(planId);
    if (!plan) return { ok: false, reason: 'Plan not found' };

    try {
      const result = await (this.providerOrch?.retryWithBackoff || (async (fn) => fn()))(
        () => executionFn(plan),
        plan.retryPolicy.maxRetries || 3
      );

      this.agentOrch.recordJobSuccess({
        jobId: plan.policyDecision.jobId,
        result: String(result).slice(0, 500)
      });

      return { ok: true, result, plan };
    } catch (/** @type {any} */ err) {
      const errorCategory = this.categorizeError(String(err));
      this.agentOrch.recordJobFailure({
        jobId: plan.policyDecision.jobId,
        reason: String(err).slice(0, 300),
        errorLog: String(err)
      });

      return {
        ok: false,
        error: String(err),
        errorCategory,
        plan,
        shouldRetry: errorCategory === 'transient'
      };
    }
  }

  categorizeError(/** @type {any} */ error) {
    const msg = String(error || '').toLowerCase();
    if (msg.includes('network') || msg.includes('timeout')) return 'transient';
    if (msg.includes('policy') || msg.includes('permission')) return 'policy';
    return 'permanent';
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      agentOrchestrator: {
        policySummary: this.agentOrch.getPolicySummary(),
        recentJobs: this.agentOrch.listJobs(5),
        auditLog: this.agentOrch.getAuditLog(10)
      },
      providerOrchestrator: {
        activeProvider: this.providerOrch?.activeProvider,
        providerRankings: this.providerOrch?.getProviderRankings(),
        metrics: this.providerOrch?.metrics
      },
      bridge: {
        executionPlans: this.executionPlans.length,
        recentPlans: this.getExecutionHistory(5)
      }
    };
  }
}

// Singleton instance
/** @type {RequestOrchestratorBridge | null} */
let _bridge = null;

export function getRequestOrchestratorBridge() {
  if (!_bridge) {
    _bridge = new RequestOrchestratorBridge();
  }
  return _bridge;
}
