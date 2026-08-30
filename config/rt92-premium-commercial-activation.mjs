import { getEonSubscriptionPlans, validateEonCommercialCatalog } from '../assets/js/commerce/eon-commercial-catalog.js';
import { EON_PREMIUM_COMMERCIAL_STATUS, validateEonPremiumCapabilityRegistry } from '../assets/js/capabilities/eon-premium-capability-registry.js';
import { validateEonPremiumWorkloadBudget } from '../assets/js/capabilities/eon-premium-workload-budget.js';
import { getEonDurableWorkContractTruth } from '../assets/js/automation/eon-durable-work-contract.js';
import { validateRt92PremiumBillingDesign, RT92_FUTURE_DODO_PRODUCTS } from './rt92-premium-billing-design.mjs';
import { evaluateRt92PremiumCommercialActivation, evaluateRt92UltimateSoftwareEconomics } from './rt92-premium-economics.mjs';
import { evaluateRt92PremiumCommercialEvidence } from './rt92-premium-commercial-evidence.mjs';

/**
 * RT92 fail-closed commercial activation audit.
 *
 * Production checkout is configured separately by the certified Cloudflare/Dodo
 * runtime. This module never creates products, checkout sessions or entitlements;
 * it only reports whether the live premium commercial boundary and supporting
 * economics/evidence proofs are internally consistent.
 */
export const RT92_PREMIUM_COMMERCIAL_ACTIVATION_SCHEMA = 'eonapp.rt92.premium-commercial-activation.v1';
const freeze = Object.freeze;
const LIVE_PLAN_IDS = freeze(['free', 'plus', 'studio', 'power', 'max', 'pro', 'ultra', 'ultimate']);

export function evaluateRt92PremiumReleaseReadiness({
  economicsScenarios = [],
  ultimateEconomics = {},
  commercialEvidence = {},
  proofs = {}
} = {}) {
  const liveCatalog = validateEonCommercialCatalog();
  const livePlanIds = getEonSubscriptionPlans().map((plan) => plan.id);
  const liveCatalogPreserved = LIVE_PLAN_IDS.length === livePlanIds.length && LIVE_PLAN_IDS.every((id, index) => livePlanIds[index] === id);
  const registry = validateEonPremiumCapabilityRegistry();
  const workloadBudget = validateEonPremiumWorkloadBudget();
  const billingDesign = validateRt92PremiumBillingDesign();
  const durable = getEonDurableWorkContractTruth();
  const economics = evaluateRt92PremiumCommercialActivation({ scenarios: economicsScenarios });
  const ultimateEconomicsResult = evaluateRt92UltimateSoftwareEconomics(ultimateEconomics);
  const evidence = evaluateRt92PremiumCommercialEvidence(commercialEvidence);

  const requiredProofs = freeze([
    'premiumCapabilityAuditApproved',
    'durableRuntimeCertified',
    'serverSoftwareGrantLedgerCertified',
    'refundDisputeRevocationCertified',
    'purchaseRestorationCertified',
    'workloadConcurrencyCertified',
    'fullBillingRegressionGreen',
    'previewBrowserProofGreen',
    'ownerCommercialReleaseApproved'
  ]);
  const missingProofs = requiredProofs.filter((key) => proofs?.[key] !== true);
  const futureCatalogueRecordsCreated = RT92_FUTURE_DODO_PRODUCTS.every((product) => product.catalogueCreated === true && /^pdt_[A-Za-z0-9]+$/.test(product.productId || ''));
  const premiumCheckoutConfigured = RT92_FUTURE_DODO_PRODUCTS.every((product) => product.checkoutActive === true && product.entitlementActive === true);
  const commercialBoundaryPreserved = EON_PREMIUM_COMMERCIAL_STATUS === 'production-live'
    && futureCatalogueRecordsCreated
    && premiumCheckoutConfigured;
  const futureCheckoutStillDisabled = !premiumCheckoutConfigured;
  const designBoundaryPreserved = commercialBoundaryPreserved;

  const foundationsGreen = Boolean(
    liveCatalog.ok
    && liveCatalogPreserved
    && registry.ok
    && workloadBudget.ok
    && billingDesign.ok
    && commercialBoundaryPreserved
  );

  const readyForCommercialOperation = foundationsGreen
    && economics.readyForCommercialActivation === true
    && ultimateEconomicsResult.ok === true
    && ultimateEconomicsResult.readyForSale === true
    && evidence.ready === true
    && missingProofs.length === 0;

  return freeze({
    schema: RT92_PREMIUM_COMMERCIAL_ACTIVATION_SCHEMA,
    foundationsGreen,
    liveCatalogPreserved,
    livePlanIds: freeze(livePlanIds),
    futureCatalogueRecordsCreated,
    premiumCheckoutConfigured,
    futureCheckoutStillDisabled,
    commercialBoundaryPreserved,
    designBoundaryPreserved,
    economicsReady: economics.readyForCommercialActivation === true,
    ultimateEconomicsReady: ultimateEconomicsResult.ok === true && ultimateEconomicsResult.readyForSale === true,
    commercialEvidenceReady: evidence.ready === true,
    missingCommercialEvidence: evidence.missing,
    missingProofs: freeze(missingProofs),
    readyForCommercialOperation,
    // Backward-compatible alias retained for older evidence readers.
    readyForFutureCheckoutActivation: readyForCommercialOperation,
    dodoProductCreationAuthorizedByThisModule: false,
    checkoutActivationAuthorizedByThisModule: false,
    entitlementGrantAuthorizedByThisModule: false,
    durableRuntimeActive: durable.runtimeActive,
    details: freeze({ liveCatalog, registry, workloadBudget, billingDesign, economics, ultimateEconomics: ultimateEconomicsResult, commercialEvidence: evidence })
  });
}

export function getRt92PremiumCommercialActivationTruth() {
  return freeze({
    schema: RT92_PREMIUM_COMMERCIAL_ACTIVATION_SCHEMA,
    currentLivePlans: LIVE_PLAN_IDS,
    commercialTierStatus: 'production-live',
    // Backward-compatible field name for older evidence readers.
    futureTierStatus: 'production-live',
    checkoutConfiguredInProduction: true,
    canCreateDodoProduct: false,
    canEnableCheckout: false,
    canGrantEntitlement: false,
    requiresOwnerCommercialReleaseApproval: true
  });
}
