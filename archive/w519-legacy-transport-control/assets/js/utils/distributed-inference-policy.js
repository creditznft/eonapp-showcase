export const DISTRIBUTED_SUPPLY_CLASSES = Object.freeze({
  LOCAL_HARDWARE: 'local-hardware',
  SELF_HOSTED_ORG: 'self-hosted-org',
  OPEN_MODEL_GATEWAY: 'open-model-gateway',
  TENANT_OWNED_PROVIDER: 'tenant-owned-provider',
  CLUSTER_HIVE: 'cluster-hive',
  API_KEY_RESALE: 'api-key-resale',
  SUBSCRIPTION_RESALE: 'subscription-resale',
  FREE_CREDIT_RESALE: 'free-credit-resale'
});

export function assessInferenceSupplyPolicy(input = {}) {
  const supplyClass = String(input.supplyClass || DISTRIBUTED_SUPPLY_CLASSES.LOCAL_HARDWARE).trim().toLowerCase();
  const blockedClasses = /** @type {readonly string[]} */ ([
    DISTRIBUTED_SUPPLY_CLASSES.API_KEY_RESALE,
    DISTRIBUTED_SUPPLY_CLASSES.SUBSCRIPTION_RESALE,
    DISTRIBUTED_SUPPLY_CLASSES.FREE_CREDIT_RESALE
  ]);
  if (blockedClasses.includes(supplyClass)) {
    return {
      allowed: false,
      supplyClass,
      label: 'Blocked',
      reason: 'Do not treat personal subscriptions, free credits, or shared API keys as sellable compute. Those paths are high-risk for credential abuse, billing abuse, and provider terms conflicts.'
    };
  }
  if (supplyClass === DISTRIBUTED_SUPPLY_CLASSES.TENANT_OWNED_PROVIDER) {
    return {
      allowed: true,
      supplyClass,
      label: 'Allowed with pass-through controls',
      reason: 'Allow only if the end customer owns the provider account, billing relationship, and consented pass-through routing. Do not pool or resell consumer/API access.'
    };
  }
  if (supplyClass === DISTRIBUTED_SUPPLY_CLASSES.OPEN_MODEL_GATEWAY) {
    return {
      allowed: true,
      supplyClass,
      label: 'Allowed with disclosure',
      reason: 'Allow only if the operator controls the endpoint, pricing, logging, and legal terms for that open-model gateway.'
    };
  }
  if (supplyClass === DISTRIBUTED_SUPPLY_CLASSES.SELF_HOSTED_ORG) {
    return {
      allowed: true,
      supplyClass,
      label: 'Allowed with org controls',
      reason: 'Allow if the organization explicitly owns the endpoint and can enforce policy, billing, and audit logging.'
    };
  }
  if (supplyClass === DISTRIBUTED_SUPPLY_CLASSES.CLUSTER_HIVE) {
    return {
      allowed: true,
      supplyClass,
      label: 'Allowed with scheduler controls',
      reason: 'Allow if the hive only shares operator-controlled open models or user-owned nodes, and routes load through auditable scheduling with health checks.'
    };
  }
  return {
    allowed: true,
    supplyClass: DISTRIBUTED_SUPPLY_CLASSES.LOCAL_HARDWARE,
    label: 'Allowed',
    reason: 'User-owned local hardware is the cleanest distributed inference supply rail.'
  };
}

export function buildDistributedInferenceTruth() {
  return {
    coreRule: 'Monetize user-owned hardware and operator-controlled open-model endpoints first. Do not build the marketplace around shared consumer subscriptions or leaked/shared API keys.',
    safeRails: [
      'Local runtimes users control on their own device or server',
      'Self-hosted organization endpoints with explicit operator ownership',
      'Open-model gateways where pricing and policy are under operator control',
      'Tenant-owned provider passthrough where the customer owns the billing account',
      'Cluster/hive routing across user-owned nodes for the same open model'
    ],
    blockedRails: [
      'Reselling leftover consumer subscription access',
      'Pooling free API credits from personal accounts',
      'Sharing personal API keys or consumer login access'
    ],
    productCopy: 'Sell compute you control. Do not sell access you do not control.',
    marketplaceDecision: 'Distributed inference makes sense for local/open-model compute and tenant-owned passthrough. Consumer API-credit resale should remain blocked by policy.'
  };
}
