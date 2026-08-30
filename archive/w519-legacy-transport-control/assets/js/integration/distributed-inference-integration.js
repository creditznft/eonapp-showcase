/**
 * distributed-inference-integration.js
 * 
 * Centralized integration point for distributed inference system
 * This file initializes and configures all DI components for EONAPP.CH
 * 
 * Include in pages as:
 * <script src="assets/js/integration/distributed-inference-integration.js"></script>
 */

class DistributedInferenceIntegration {
  static async initialize() {
    console.log('🚀 Initializing Distributed Inference System...');

    // Load dependencies
    this._ensureDependencies();

    // Initialize core service
    const service = window.getDistributedInferenceService();

    // Initialize local runtime detector
    const detector = window.getLocalRuntimeDetector();
    const cached = detector.loadProfile();
    const canProbeLocal = typeof window.shouldProbeLocalRuntimes === 'function'
      ? window.shouldProbeLocalRuntimes()
      : false;
    if (!cached && canProbeLocal) {
      await detector.scan({ force: true });
      detector.saveProfile();
    }

    // Log detection results
    console.log('📊 Detected runtimes:', detector.detectedRuntimes);

    // Initialize UI components if containers exist
    this._initializeUIComponents();

    // Setup auto-refresh
    if (canProbeLocal) {
      this._setupAutoRefresh();
    }

    console.log('✅ Distributed Inference System initialized');

    return {
      service,
      detector,
    };
  }

  static _ensureDependencies() {
    const /** @type {any} */
required = [
      'DistributedInferenceService',
      'DistributedInferenceHelpers',
      'LocalRuntimeDetector',
    ];

    for (const /** @type {any} */
dep of required) {
      if (!window[dep]) {
        console.warn(`⚠️ Missing dependency: ${dep}`);
      }
    }
  }

  static _initializeUIComponents() {
    // Initialize provider status badge if element exists
    const /** @type {any} */
badgeContainers = document.querySelectorAll('[id$="-provider-badge"]');
    badgeContainers.forEach((/** @type {any} */ container) => {
      if (!window.ProviderStatusBadge) {
        console.warn('ProviderStatusBadge not loaded');
        return;
      }
      const badge = new window.ProviderStatusBadge(container.id);
      badge.update();
    });

    // Initialize marketplace panel if container exists
    const /** @type {any} */
marketplaceContainer = document.getElementById('model-marketplace-panel');
    if (marketplaceContainer && window.ModelMarketplacePanel) {
      new window.ModelMarketplacePanel('model-marketplace-panel');
    }

    // Initialize earnings dashboard if container exists
    const /** @type {any} */
earningsContainer = document.getElementById('provider-earnings-dashboard');
    if (earningsContainer && window.ProviderEarningsDashboard) {
      new window.ProviderEarningsDashboard('provider-earnings-dashboard');
    }

    // Initialize local runtime status if container exists
    const /** @type {any} */
runtimeStatusContainer = document.getElementById('local-runtime-status');
    if (runtimeStatusContainer && window.LocalRuntimeDetector) {
      const detector = window.getLocalRuntimeDetector();
      runtimeStatusContainer.innerHTML = detector.renderStatusHTML();
    }
  }

  static _setupAutoRefresh() {
    const canProbeLocal = typeof window.shouldProbeLocalRuntimes === 'function'
      ? window.shouldProbeLocalRuntimes()
      : false;
    if (!canProbeLocal) return;
    // Periodically check for new local runtimes (every 5 minutes)
    setInterval(async () => {
      const detector = window.getLocalRuntimeDetector();
      await detector.scan({ force: true });
      detector.saveProfile();

      // Update runtime status if visible
      const /** @type {any} */
statusContainer = document.getElementById('local-runtime-status');
      if (statusContainer) {
        statusContainer.innerHTML = detector.renderStatusHTML();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * SUBMIT INFERENCE - Public API for pages to submit inference requests
   * 
   * Usage:
   *   DistributedInferenceIntegration.submitInference({
   *     modelId: 'mistral:7b',
   *     prompt: 'What is the capital of France?',
   *     maxTokens: 1000,
   *     onResult: (result) => console.log(result)
   *   });
   */
  static async submitInference(/** @type {any} */ options) {
    const {
      modelId,
      prompt,
      maxTokens = 1000,
      onResult = null,
      onError = null,
    } = options;

    if (!modelId || !prompt) {
      console.error('Missing modelId or prompt');
      if (onError) onError(new Error('Missing modelId or prompt'));
      return;
    }

    const service = window.getDistributedInferenceService();
    const userId = await service._getCurrentUserId();

    try {
      // Submit inference request
      const result = await service.submitInference(userId, modelId, prompt, maxTokens);

      if (!result.success) {
        console.error('Inference submission failed:', result.error);
        if (onError) onError(new Error(result.error));
        return;
      }

      console.log(`✅ Inference request submitted: ${result.requestId}`);

      // Mock completion for demo (in production, would wait for actual completion from provider)
      setTimeout(async () => {
        const completeResult = await service.completeInference(
          result.requestId,
          500, // tokens used
          1200 // latency
        );

        const mockResponse = `This is a mock response for demonstration. In production, this would be the actual AI model output.\n\nRequest ID: ${result.requestId}\nTokens Used: 500\nLatency: ${completeResult.cuEarned.toFixed(2)} CU earned by provider`;

        if (onResult) {
          onResult({
            success: true,
            requestId: result.requestId,
            response: mockResponse,
            costUSD: result.costUSD,
          });
        }
      }, 2000);

      return result;
    } catch (/** @type {any} */
_err) {
      console.error('Inference error:', _err);
      if (onError) onError(_err);
    }
  }

  /**
   * GET AVAILABLE MODELS - Public API for model selection
   */
  static async getAvailableModels() {
    const service = window.getDistributedInferenceService();
    return await service.getNetworkModels();
  }

  /**
   * GET MODEL REGISTRY - Searchable marketplace-ready model registry.
   */
  static getModelRegistry(/** @type {any} */ query = '', /** @type {any} */ options = {}) {
    const service = window.getDistributedInferenceService();
    return service.getModelRegistry(query, options);
  }

  /**
   * GET MARKETPLACE QUOTE - Cost/routing quote before submission.
   */
  static getMarketplaceQuote(/** @type {any} */ modelId, /** @type {any} */ options = {}) {
    const service = window.getDistributedInferenceService();
    return service.getMarketplaceQuote(modelId, options);
  }

  /**
   * GET MARKETPLACE ACTIVITY - Rental submissions/completions.
   */
  static getMarketplaceActivity(/** @type {any} */ userId = null) {
    const service = window.getDistributedInferenceService();
    return service.getMarketplaceActivity(userId || undefined);
  }

  /**
   * ANNOUNCE NODE - Public API for providers to announce their node
   */
  static async announceNode(/** @type {any} */ options) {
    const service = window.getDistributedInferenceService();
    return await service.announceNode(options);
  }

  /**
   * ANNOUNCE API PROVIDER - Contribute hosted inference capacity via API key.
   * Raw keys should stay in page/runtime key vault and never be persisted in DI state.
   */
  static async announceApiProvider(/** @type {any} */ options) {
    const service = window.getDistributedInferenceService();
    if (typeof service.announceApiProvider !== 'function') {
      return { success: false, error: 'API provider contribution not supported in this runtime' };
    }
    return await service.announceApiProvider(options);
  }

  /**
   * GET PROVIDER STATS - Public API for earnings dashboard
   */
  static getProviderStats(/** @type {any} */ userId) {
    const service = window.getDistributedInferenceService();
    return service.getProviderStats(userId);
  }

  /**
   * GET SETTLEMENT SUMMARY - Provider payout queue and totals.
   */
  static getSettlementSummary(/** @type {any} */ userId) {
    const service = window.getDistributedInferenceService();
    return service.getSettlementSummary(userId);
  }

  /**
   * MARK SETTLEMENT PAID - Operator action for payout workflow.
   */
  static markSettlementPaid(/** @type {any} */ settlementId) {
    const service = window.getDistributedInferenceService();
    return service.markSettlementPaid(settlementId);
  }

  /**
   * DETECT LOCAL RUNTIMES - Public API for runtime detection
   */
  static async detectLocalRuntimes() {
    const detector = window.getLocalRuntimeDetector();
    const canProbeLocal = typeof window.shouldProbeLocalRuntimes === 'function'
      ? window.shouldProbeLocalRuntimes()
      : false;
    if (!canProbeLocal) return [];
    await detector.scan({ force: true });
    return detector.detectedRuntimes;
  }

  /**
   * GET TIER GUIDANCE - Public API for tier recommendations
   */
  static getTierGuidance(/** @type {any} */ modelId) {
    const service = window.DistributedInferenceService;

    // Simple heuristic based on model name
    let tier = 0;
    if (modelId.includes('70b') || modelId.includes('large')) {
      tier = 3;
    } else if (modelId.includes('30b') || modelId.includes('medium')) {
      tier = 2;
    } else if (modelId.includes('13b')) {
      tier = 1;
    }

    const tierCfg = service.TIER_CONFIGS[tier];
    return {
      tier,
      tierName: tierCfg.name,
      tierDescription: tierCfg.description,
      benefits: tierCfg.benefits,
      cuMultiplier: tierCfg.cuMultiplier,
      stakeRequired: tierCfg.stakeRequired,
    };
  }
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  DistributedInferenceIntegration.initialize();
});

// Export globally
window.DistributedInferenceIntegration = DistributedInferenceIntegration;
