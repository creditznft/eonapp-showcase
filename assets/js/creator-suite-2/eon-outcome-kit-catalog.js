/**
 * W352-A — local Outcome Kit previews.
 *
 * These are useful, device-local starting briefs inside Creator Suite 2. They
 * are intentionally not a checkout, price list, licence, subscription,
 * provider call, generated deliverable, Marketplace listing, NFT, wallet,
 * referral incentive, or entitlement. A user chooses a kit, edits the brief,
 * and explicitly prepares an ordinary local draft.
 */

import { normalizeCreatorSuiteBrief } from './creator-suite-2-engine.js';

export const EON_OUTCOME_KIT_CATALOG_SCHEMA = 'eon.outcome-kit-catalog.v1';
export const EON_OUTCOME_KIT_CATALOG_VERSION = 1;

export const EON_OUTCOME_KIT_FEATURE_FLAGS = Object.freeze({
  checkoutActive: false,
  priceShown: false,
  subscriptionRequired: false,
  personalLicenceRequired: false,
  providerCallActive: false,
  generatedMediaClaimed: false,
  externalDeliveryActive: false,
  tokenOrNftFeatureKeyActive: false,
  walletRequired: false,
  referralValueActive: false,
  marketplaceActive: false,
  payoutActive: false
});

const KITS = Object.freeze([
  Object.freeze({
    id: 'campaign-launch',
    label: 'Campaign Launch Kit',
    category: 'Content outcome',
    summary: 'Frame one clear launch message, a simple content sequence, and a review-ready call to action.',
    deliverables: Object.freeze(['campaign brief', 'message hierarchy', 'caption direction', 'review checklist']),
    prefill: Object.freeze({
      module: 'content',
      title: 'Campaign launch local brief',
      audience: 'People who may discover the campaign for the first time',
      goal: 'Prepare a clear campaign launch brief with the promise, audience need, message hierarchy, content sequence, and a truthful call to action. Keep claims supportable and leave external publishing to the user.',
      style: 'clear, energetic, practical',
      callToAction: 'Choose the next step'
    })
  }),
  Object.freeze({
    id: 'brand-system',
    label: 'Brand System Kit',
    category: 'Brand outcome',
    summary: 'Define a consistent point of view, audience language, visual direction, and practical voice rules.',
    deliverables: Object.freeze(['brand brief', 'voice rules', 'visual direction', 'message guardrails']),
    prefill: Object.freeze({
      module: 'content',
      title: 'Brand system local brief',
      audience: 'The people the brand wants to serve and speak with clearly',
      goal: 'Prepare a brand system brief with positioning, audience language, tone, visual direction, and message guardrails. Keep it specific enough to guide future drafts without making unsupported promises.',
      style: 'confident, warm, consistent',
      callToAction: 'Use the brand system in the next draft'
    })
  }),
  Object.freeze({
    id: 'build-brief',
    label: 'Build Brief Kit',
    category: 'Build outcome',
    summary: 'Turn an idea into a user-focused requirement outline and a developer handoff.',
    deliverables: Object.freeze(['requirements summary', 'page outline', 'component checklist', 'manual developer handoff']),
    prefill: Object.freeze({
      module: 'build',
      title: 'Build brief local draft',
      audience: 'The people who will use the product and the people who will build it',
      goal: 'Prepare a product build brief covering the outcome, users, essential flows, page structure, important states, accessibility, privacy boundaries, and a manual developer handoff. Do not claim deployment or production readiness.',
      style: 'structured, calm, implementation-ready',
      callToAction: 'Review the build scope'
    })
  }),
  Object.freeze({
    id: 'creator-export',
    label: 'Creator Export Kit',
    category: 'Creator outcome',
    summary: 'Shape a storyboard and export package before choosing a provider or using a manual delivery flow.',
    deliverables: Object.freeze(['storyboard brief', 'shot list', 'caption direction', 'export checklist']),
    prefill: Object.freeze({
      module: 'video',
      title: 'Creator export local brief',
      audience: 'The intended viewer and the creator preparing the final asset',
      goal: 'Prepare a creator export brief with a short story arc, visual beats, shot list, caption direction, rights checklist, and final export checklist. This prepares a plan only; it does not generate media or publish it.',
      style: 'visual, direct, audience-aware',
      callToAction: 'Prepare the export package'
    })
  }),
  Object.freeze({
    id: 'realm-style',
    label: 'Realm Style Kit',
    category: 'Realm outcome',
    summary: 'Create a private visual direction for a Realm, Local Relics, and City presentation without a storefront.',
    deliverables: Object.freeze(['Realm style brief', 'palette direction', 'motif ideas', 'local gallery checklist']),
    prefill: Object.freeze({
      module: 'image',
      title: 'Realm style local brief',
      audience: 'You and the people you choose to show your private Realm identity to',
      goal: 'Prepare a private Realm style brief with a theme, palette, motifs, Local Relic visual direction, and a local showcase checklist. It must not imply a public sale, NFT, wallet asset, royalty, referral value, or financial reward.',
      style: 'distinctive, calm, futuristic',
      callToAction: 'Apply the style to a local Realm draft'
    })
  })
]);

function safeId(value = '') {
  return String(value || '').trim().replace(/[^a-z0-9-]/gi, '').slice(0, 80);
}

function cloneKit(kit) {
  if (!kit) return null;
  return Object.freeze({
    id: kit.id,
    label: kit.label,
    category: kit.category,
    summary: kit.summary,
    deliverables: Object.freeze([...kit.deliverables]),
    localOnly: true,
    requiresPayment: false,
    transferable: false,
    tokenOrNft: false,
    entitlement: false,
    lifecycle: 'active-local-preview'
  });
}

export function listEonOutcomeKitPreviews() {
  return Object.freeze(KITS.map(cloneKit));
}

export function getEonOutcomeKitPreview(id = '') {
  return cloneKit(KITS.find((kit) => kit.id === safeId(id)) || null);
}

/**
 * Returns an editable Creator Suite 2 brief. The caller still has to put it in
 * the form and explicitly submit that form before a local draft exists.
 */
export function prepareEonOutcomeKitBrief(id = '') {
  const source = KITS.find((kit) => kit.id === safeId(id));
  if (!source) return Object.freeze({ ok: false, status: 'unknown-local-kit', kit: null, brief: null });
  const brief = normalizeCreatorSuiteBrief(source.prefill);
  return Object.freeze({
    ok: true,
    status: 'local-preview-ready',
    kit: cloneKit(source),
    brief,
    localOnly: true,
    draftCreated: false,
    providerCall: false,
    externalEffect: false,
    paymentRequired: false,
    licenceRequired: false,
    note: 'This only pre-fills an editable local brief. Prepare and export the draft yourself; no purchase, provider call, generation, delivery, licence, or external action occurs.'
  });
}

export function getEonOutcomeKitTruth() {
  return Object.freeze({
    schema: EON_OUTCOME_KIT_CATALOG_SCHEMA,
    version: EON_OUTCOME_KIT_CATALOG_VERSION,
    lifecycle: 'active-local-preview',
    flags: EON_OUTCOME_KIT_FEATURE_FLAGS,
    storage: 'current-page-memory-after-explicit-draft-submit',
    purchase: 'not-active',
    delivery: 'user-triggered-local-export-only',
    note: 'Outcome Kit previews are free local starting briefs, not commercial products or entitlements.'
  });
}

export function validateEonOutcomeKitCatalog() {
  const errors = [];
  if (Object.values(EON_OUTCOME_KIT_FEATURE_FLAGS).some(Boolean)) errors.push('A local Outcome Kit preview cannot enable commerce, entitlement, provider, wallet, or referral behavior.');
  if (KITS.length !== 5) errors.push('Exactly five local Outcome Kit previews must remain available in this phase.');
  if (KITS.some((kit) => !kit.id || !kit.label || !kit.summary || !kit.prefill?.goal)) errors.push('Each Outcome Kit needs a bounded local brief.');
  for (const kit of KITS) {
    try { normalizeCreatorSuiteBrief(kit.prefill); } catch { errors.push(`Outcome Kit ${kit.id} cannot prepare a safe Creator Suite brief.`); }
  }
  return Object.freeze({ ok: errors.length === 0, errors, schema: EON_OUTCOME_KIT_CATALOG_SCHEMA });
}

export default Object.freeze({
  EON_OUTCOME_KIT_CATALOG_SCHEMA,
  EON_OUTCOME_KIT_CATALOG_VERSION,
  EON_OUTCOME_KIT_FEATURE_FLAGS,
  listEonOutcomeKitPreviews,
  getEonOutcomeKitPreview,
  prepareEonOutcomeKitBrief,
  getEonOutcomeKitTruth,
  validateEonOutcomeKitCatalog
});
