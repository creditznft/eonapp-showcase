/**
 * RT92 Premium professional capability registry.
 *
 * IMPORTANT COMMERCIAL BOUNDARY:
 * - Pro and Ultra are owner-approved LIVE Dodo subscription tiers.
 * - Ultimate is an owner-approved LIVE perpetual SOFTWARE CAPABILITY licence.
 * - This registry never creates checkout or grants entitlement; Billing + signed
 *   provider lifecycle authority do that server-side.
 * - Ultimate never implies unlimited EONAPP-funded hosted AI, storage, scheduling
 *   or compute.
 *
 * Architectural rule: one capability = one canonical home. Records below point
 * at existing EONAPP surfaces wherever possible instead of creating duplicate
 * dashboards, task stores, project engines or AI-control products.
 */

export const EON_PREMIUM_CAPABILITY_REGISTRY_SCHEMA = 'eonapp.premium-capability-registry.rt92.v1';
export const EON_PREMIUM_COMMERCIAL_STATUS = 'production-live';

const freeze = (value) => Object.freeze(value);
const frozenArray = (value = []) => freeze([...value]);

export const EON_PREMIUM_SOFTWARE_TIERS = freeze([
  freeze({
    id: 'pro',
    label: 'Pro',
    kind: 'subscription',
    targetMonthlyUsd: 99,
    commercialStatus: EON_PREMIUM_COMMERCIAL_STATUS,
    dodoProductCreated: true,
    checkoutActive: true,
    purpose: 'Professional automation, orchestration, intelligence and operating capability.'
  }),
  freeze({
    id: 'ultra',
    label: 'Ultra',
    kind: 'subscription',
    targetMonthlyUsd: 199,
    commercialStatus: EON_PREMIUM_COMMERCIAL_STATUS,
    dodoProductCreated: true,
    checkoutActive: true,
    purpose: 'Scaled concurrency, multi-client operation, batch work and high-volume professional workflows.'
  }),
  freeze({
    id: 'ultimate',
    label: 'Ultimate',
    kind: 'perpetual-software-capability',
    targetOneTimeUsd: 1299,
    commercialStatus: EON_PREMIUM_COMMERCIAL_STATUS,
    dodoProductCreated: true,
    checkoutActive: true,
    purpose: 'Permanent access to eligible premium software capability while cloud and hosted capacity remain separately governed.'
  })
]);

const TIER_BY_ID = new Map(EON_PREMIUM_SOFTWARE_TIERS.map((tier) => [tier.id, tier]));

function capability(record = {}) {
  return freeze({
    universal: false,
    minimumSubscriptionTier: '',
    ultimateEligible: true,
    previewBeforePurchase: true,
    tryOnceEligible: false,
    requiresDurableRuntime: false,
    requiresExternalConnection: false,
    ongoingHostedCostRisk: 'none',
    implementationStatus: 'design',
    ...record,
    canonicalRoutes: frozenArray(record.canonicalRoutes),
    dependencies: frozenArray(record.dependencies),
    capacityResources: frozenArray(record.capacityResources)
  });
}

/**
 * These are product capabilities, not plan entitlements. A capability may be
 * permanently unlocked by Ultimate while its volume/concurrency is still
 * governed by a current subscription capacity tier, Local AI/BYOK, quotas or
 * future metered allowance.
 */
export const EON_PREMIUM_CAPABILITIES = freeze([
  capability({
    id: 'work-queue-overview',
    label: 'EONBOT Work Queue overview',
    canonicalSurface: 'Workspace / Command Center',
    canonicalRoutes: ['/workspace'],
    universal: true,
    ultimateEligible: false,
    implementationStatus: 'foundation-coded',
    ongoingHostedCostRisk: 'none',
    dependencies: ['eonbot-job-fabric', 'automation-os'],
    capacityResources: []
  }),
  capability({
    id: 'recurring-professional-workflows',
    label: 'Recurring professional workflows',
    canonicalSurface: 'Automations + Workspace Work Queue',
    canonicalRoutes: ['/automations', '/workspace'],
    minimumSubscriptionTier: 'pro',
    tryOnceEligible: true,
    requiresDurableRuntime: true,
    implementationStatus: 'requires-durable-runtime',
    ongoingHostedCostRisk: 'high-if-platform-hosted',
    dependencies: ['automation-os', 'future-durable-runtime', 'approval-gateway'],
    capacityResources: ['scheduled-workflows', 'monthly-runs']
  }),
  capability({
    id: 'business-intelligence-briefs',
    label: 'Recurring business intelligence and executive briefs',
    canonicalSurface: 'Projects / Workspace',
    canonicalRoutes: ['/projects', '/workspace'],
    minimumSubscriptionTier: 'pro',
    tryOnceEligible: true,
    requiresDurableRuntime: true,
    implementationStatus: 'extend-existing-local-business-brief; recurring-mode-requires-durable-runtime',
    ongoingHostedCostRisk: 'medium-to-high',
    dependencies: ['projects', 'local-business-brief', 'local-competitor-review', 'local-memory', 'automation-os', 'ai-routing'],
    capacityResources: ['brief-runs', 'research-workload']
  }),
  capability({
    id: 'opportunity-monitor',
    label: 'Opportunity monitor',
    canonicalSurface: 'Projects / Workspace',
    canonicalRoutes: ['/projects', '/workspace'],
    minimumSubscriptionTier: 'pro',
    tryOnceEligible: false,
    requiresDurableRuntime: true,
    requiresExternalConnection: true,
    implementationStatus: 'requires-reviewed-source-connectors',
    ongoingHostedCostRisk: 'high',
    dependencies: ['automation-os', 'future-durable-runtime', 'reviewed-research-sources'],
    capacityResources: ['monitor-count', 'monitor-runs', 'research-workload']
  }),
  capability({
    id: 'professional-project-orchestration',
    label: 'Professional project orchestration',
    canonicalSurface: 'Projects + Workspace',
    canonicalRoutes: ['/projects', '/workspace'],
    minimumSubscriptionTier: 'pro',
    tryOnceEligible: true,
    implementationStatus: 'extend-existing-project-system',
    ongoingHostedCostRisk: 'low-unless-hosted-ai-used',
    dependencies: ['projects', 'project-registry', 'work-queue-overview'],
    capacityResources: ['active-projects', 'project-automations']
  }),
  capability({
    id: 'client-workspaces',
    label: 'Client workspaces and context separation',
    canonicalSurface: 'Projects',
    canonicalRoutes: ['/projects'],
    minimumSubscriptionTier: 'ultra',
    tryOnceEligible: true,
    implementationStatus: 'genuinely-new-metadata-layer',
    ongoingHostedCostRisk: 'low',
    dependencies: ['projects', 'project-registry', 'memory-scope'],
    capacityResources: ['client-count', 'client-projects']
  }),
  capability({
    id: 'multi-client-work-queue',
    label: 'Multi-client work queue',
    canonicalSurface: 'Workspace / Command Center',
    canonicalRoutes: ['/workspace'],
    minimumSubscriptionTier: 'ultra',
    requiresDurableRuntime: true,
    implementationStatus: 'depends-on-client-workspaces-and-runtime',
    ongoingHostedCostRisk: 'medium-to-high',
    dependencies: ['client-workspaces', 'work-queue-overview', 'future-durable-runtime'],
    capacityResources: ['concurrent-jobs', 'client-count']
  }),
  capability({
    id: 'parallel-eonbot-work',
    label: 'Parallel EONBOT work',
    canonicalSurface: 'Workspace / Command Center',
    canonicalRoutes: ['/workspace'],
    minimumSubscriptionTier: 'ultra',
    requiresDurableRuntime: true,
    implementationStatus: 'requires-durable-runtime',
    ongoingHostedCostRisk: 'very-high-if-platform-hosted',
    dependencies: ['work-queue-overview', 'future-durable-runtime', 'ai-routing'],
    capacityResources: ['concurrent-jobs', 'monthly-job-budget']
  }),
  capability({
    id: 'local-ai-autopilot',
    label: 'Local AI Autopilot',
    canonicalSurface: 'Local AI',
    canonicalRoutes: ['/local-ai'],
    minimumSubscriptionTier: 'pro',
    tryOnceEligible: true,
    implementationStatus: 'extend-existing-model-lifecycle-and-routing',
    ongoingHostedCostRisk: 'none-when-local',
    dependencies: ['local-ai-runtime', 'device-detection', 'model-health', 'ai-routing'],
    capacityResources: ['profile-count']
  }),
  capability({
    id: 'project-ai-profiles',
    label: 'Project-specific AI profiles',
    canonicalSurface: 'Local AI + Projects',
    canonicalRoutes: ['/local-ai', '/projects'],
    minimumSubscriptionTier: 'pro',
    tryOnceEligible: true,
    implementationStatus: 'extend-existing-routing-and-project-context',
    ongoingHostedCostRisk: 'none-for-local-byok',
    dependencies: ['local-ai-runtime', 'ai-routing', 'projects'],
    capacityResources: ['ai-profile-count']
  }),
  capability({
    id: 'multi-model-orchestration',
    label: 'Multi-model orchestration',
    canonicalSurface: 'Local AI / AI routing',
    canonicalRoutes: ['/local-ai'],
    minimumSubscriptionTier: 'pro',
    tryOnceEligible: true,
    implementationStatus: 'extend-existing-provider-orchestration',
    ongoingHostedCostRisk: 'high-if-eon-funded-providers-used',
    dependencies: ['ai-provider-registry', 'provider-orchestrator', 'local-ai-runtime'],
    capacityResources: ['model-routes', 'hosted-budget']
  }),
  capability({
    id: 'batch-ai-operations',
    label: 'Batch AI operations',
    canonicalSurface: 'Local AI + Workspace',
    canonicalRoutes: ['/local-ai', '/workspace'],
    minimumSubscriptionTier: 'ultra',
    implementationStatus: 'new-operation-layer-on-existing-ai',
    ongoingHostedCostRisk: 'very-high-if-eon-funded-providers-used',
    dependencies: ['ai-routing', 'work-queue-overview'],
    capacityResources: ['batch-size', 'concurrent-jobs', 'hosted-budget']
  }),
  capability({
    id: 'forge-repository-intelligence',
    label: 'Forge repository intelligence',
    canonicalSurface: 'Forge',
    canonicalRoutes: ['/forge'],
    minimumSubscriptionTier: 'pro',
    tryOnceEligible: true,
    implementationStatus: 'extend-existing-forge',
    ongoingHostedCostRisk: 'low-to-medium',
    dependencies: ['forge', 'github-connection', 'ai-routing'],
    capacityResources: ['repository-count', 'analysis-runs']
  }),
  capability({
    id: 'forge-test-release-orchestration',
    label: 'Forge test and release orchestration',
    canonicalSurface: 'Forge',
    canonicalRoutes: ['/forge'],
    minimumSubscriptionTier: 'pro',
    requiresExternalConnection: true,
    implementationStatus: 'extend-existing-github-publish-workflow',
    ongoingHostedCostRisk: 'low-to-medium',
    dependencies: ['forge', 'github-publish', 'review-gates'],
    capacityResources: ['repository-count', 'release-runs']
  }),
  capability({
    id: 'forge-parallel-development',
    label: 'Parallel Forge development work',
    canonicalSurface: 'Forge + Workspace Work Queue',
    canonicalRoutes: ['/forge', '/workspace'],
    minimumSubscriptionTier: 'ultra',
    requiresDurableRuntime: true,
    implementationStatus: 'requires-durable-runtime',
    ongoingHostedCostRisk: 'very-high-if-platform-hosted',
    dependencies: ['forge', 'work-queue-overview', 'future-durable-runtime'],
    capacityResources: ['concurrent-development-jobs', 'repository-count']
  })
]);

const CAPABILITY_BY_ID = new Map(EON_PREMIUM_CAPABILITIES.map((entry) => [entry.id, entry]));

export function getEonPremiumSoftwareTier(tierId = '') {
  return TIER_BY_ID.get(String(tierId || '').trim().toLowerCase()) || null;
}

export function getEonPremiumCapability(capabilityId = '') {
  return CAPABILITY_BY_ID.get(String(capabilityId || '').trim()) || null;
}

export function listEonPremiumCapabilities({ surface = '', minimumSubscriptionTier = '' } = {}) {
  const wantedSurface = String(surface || '').trim().toLowerCase();
  const wantedTier = String(minimumSubscriptionTier || '').trim().toLowerCase();
  return freeze(EON_PREMIUM_CAPABILITIES.filter((entry) => {
    const surfaceMatch = !wantedSurface || entry.canonicalSurface.toLowerCase().includes(wantedSurface) || entry.canonicalRoutes.some((route) => route.includes(wantedSurface));
    const tierMatch = !wantedTier || entry.minimumSubscriptionTier === wantedTier;
    return surfaceMatch && tierMatch;
  }));
}

export function validateEonPremiumCapabilityRegistry() {
  const errors = [];
  const ids = new Set();
  for (const tier of EON_PREMIUM_SOFTWARE_TIERS) {
    if (tier.commercialStatus !== EON_PREMIUM_COMMERCIAL_STATUS || tier.dodoProductCreated !== true || tier.checkoutActive !== true) errors.push(`${tier.id} must be live only through the certified server checkout authority.`);
  }
  for (const entry of EON_PREMIUM_CAPABILITIES) {
    if (!entry.id || ids.has(entry.id)) errors.push(`Duplicate or missing capability id: ${entry.id || '(blank)'}.`);
    ids.add(entry.id);
    if (!entry.canonicalSurface || !entry.canonicalRoutes.length) errors.push(`${entry.id} needs a canonical existing surface and route.`);
    if (entry.universal && entry.minimumSubscriptionTier) errors.push(`${entry.id} cannot be universal and tier-gated.`);
    if (entry.minimumSubscriptionTier && !['pro', 'ultra'].includes(entry.minimumSubscriptionTier)) errors.push(`${entry.id} uses unsupported future subscription tier ${entry.minimumSubscriptionTier}.`);
    if (entry.ongoingHostedCostRisk === 'very-high-if-platform-hosted' && !entry.capacityResources.length) errors.push(`${entry.id} needs explicit capacity controls.`);
  }
  const workQueue = getEonPremiumCapability('work-queue-overview');
  if (!workQueue?.universal) errors.push('Basic Work Queue visibility must remain universal; premium value comes from automation and scale.');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_PREMIUM_CAPABILITY_REGISTRY_SCHEMA, capabilityCount: EON_PREMIUM_CAPABILITIES.length });
}

export default freeze({
  EON_PREMIUM_CAPABILITY_REGISTRY_SCHEMA,
  EON_PREMIUM_COMMERCIAL_STATUS,
  EON_PREMIUM_SOFTWARE_TIERS,
  EON_PREMIUM_CAPABILITIES,
  getEonPremiumSoftwareTier,
  getEonPremiumCapability,
  listEonPremiumCapabilities,
  validateEonPremiumCapabilityRegistry
});
