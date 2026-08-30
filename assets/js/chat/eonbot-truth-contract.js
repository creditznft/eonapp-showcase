/**
 * W208 — EONBOT truth contract.
 *
 * This module is deliberately deterministic. It gives both the built-in guide
 * assistant and model adapters a single source of truth for routes, capability
 * states, permission prompts and safe fallbacks. It contains no user secrets,
 * user records, balances, provider credentials or private Vault material.
 */

import { buildEonbotRoutePlan, EON_CAPABILITY_MANIFEST, EON_ROUTE_MANIFEST } from './eonbot-context-registry.js';
import { buildNativeVoiceCapabilityPlan } from './native-voice-strategy.js';

export const EONBOT_TRUTH_CONTRACT_VERSION = 'w208-eonbot-truth-contract-v1';

export const EONBOT_AVAILABILITY = Object.freeze({
  AVAILABLE: 'available-now',
  DEVICE_DEPENDENT: 'device-dependent',
  SIMULATE_FIRST: 'simulate-first',
  PREVIEW_ONLY: 'preview-only',
  SENSITIVE: 'sensitive-navigation-only',
  RESEARCH_ONLY: 'research-and-paper-only',
  UNAVAILABLE: 'not-available-yet'
});

export const EONBOT_PERMISSION = Object.freeze({
  NONE: 'none',
  MICROPHONE: 'microphone-permission',
  EXTERNAL_EFFECTS: 'external-effects-confirmation',
  PURCHASE_OR_MINT: 'purchase-or-mint-confirmation',
  SENSITIVE_ACTION: 'sensitive-action-confirmation',
  PUBLISHING: 'publishing-confirmation',
  NOT_AVAILABLE: 'not-available'
});

const SECRET_PATTERNS = Object.freeze([
  /\b(seed\s*phrase|recovery\s*phrase|mnemonic|private\s*key|wallet\s*key)\b/i,
  /\b(api\s*key|access\s*token|secret\s*key|exchange\s*secret|password)\b/i,
  /\bshow\s+(?:me|my)\s+(?:key|keys|secret|password|seed|mnemonic)\b/i
]);

const FINANCIAL_EXECUTION_PATTERNS = Object.freeze([
  /\b(place|submit|execute|send|buy|sell|close)\b.{0,48}\b(order|trade|position|btc|eth|crypto)\b/i,
  /\b(withdraw|transfer)\b.{0,48}\b(cash|money|funds|crypto|wallet)\b/i,
  /\b(cash\s*out|withdraw)\b.{0,48}\b(reward|credit|points?)\b/i
]);

const CLAIM_PATTERNS = Object.freeze([
  /\b(confirm|prove|show)\b.{0,42}\b(offerwall|reward|payment|mint|transaction|order|provider|referral|conversion)\b/i,
  /\b(is|are)\b.{0,42}\b(rewards?|offerwall|payment|mint|trade)\b.{0,42}\b(live|active|complete|confirmed)\b/i
]);

const CAPABILITY_POLICY = Object.freeze({
  'local-ai': Object.freeze({
    availability: EONBOT_AVAILABILITY.DEVICE_DEPENDENT,
    permission: EONBOT_PERMISSION.NONE,
    fallback: 'Use typed Cloud/guide assistance until the device check and local runtime self-test succeed.',
    truth: 'Local AI needs a compatible device, free storage and a successful runtime self-test. Offline local AI cannot browse the web, send messages, publish, place trades or call cloud tools.'
  }),
  workspace: Object.freeze({
    availability: EONBOT_AVAILABILITY.AVAILABLE,
    permission: EONBOT_PERMISSION.NONE,
    fallback: 'Start in Chat and save the result to Projects when you are ready.',
    truth: 'Workspace helps prepare work. External services remain unavailable until a user connects and approves them.'
  }),
  automations: Object.freeze({
    availability: EONBOT_AVAILABILITY.SIMULATE_FIRST,
    permission: EONBOT_PERMISSION.EXTERNAL_EFFECTS,
    fallback: 'Create a simulation or manual export instead of performing an external action.',
    truth: 'Automations can be drafted and simulated. Any external effect requires a visible review and user approval.'
  }),
  market: Object.freeze({
    availability: EONBOT_AVAILABILITY.PREVIEW_ONLY,
    permission: EONBOT_PERMISSION.PURCHASE_OR_MINT,
    fallback: 'Generate a private preview or review Official items without claiming ownership.',
    truth: 'Generated art is a preview. It is not a minted NFT, purchased item or transferable asset until a verified receipt and, where relevant, chain proof exist.'
  }),
  vault: Object.freeze({
    availability: EONBOT_AVAILABILITY.SENSITIVE,
    permission: EONBOT_PERMISSION.SENSITIVE_ACTION,
    fallback: 'Use backup guidance or an encrypted portable export. Never place secrets in chat.',
    truth: 'Vault is private. EONBOT never asks for, displays or transmits a seed phrase, password, API key, exchange secret or recovery material.'
  }),
  trade: Object.freeze({
    availability: EONBOT_AVAILABILITY.RESEARCH_ONLY,
    permission: EONBOT_PERMISSION.NOT_AVAILABLE,
    fallback: 'Use Research Lab for local evidence, historical review and scenario notes. It has no broker or order path.',
    truth: 'Research Lab is local-only analysis. No broker connection, order, balance transfer, withdrawal, exchange execution or paper-trading path is available.'
  }),
  eoncity: Object.freeze({
    availability: EONBOT_AVAILABILITY.AVAILABLE,
    permission: EONBOT_PERMISSION.NONE,
    fallback: 'Use the 2D Operator Map when 3D is not suitable for the device.',
    truth: 'The 2D Operator Map is the default. 3D is optional, device-gated and must never block work.'
  }),
  rewards: Object.freeze({
    availability: EONBOT_AVAILABILITY.UNAVAILABLE,
    permission: EONBOT_PERMISSION.NOT_AVAILABLE,
    fallback: 'Open Profile for current limits and Invite & Share Center. No reward program is active in this release.',
    truth: 'No reward, benefit, credit, cash-out, campaign, provider offer or share incentive is active. Clicks, impressions, time on page and raw sharing do not earn credits.'
  }),
  share: Object.freeze({
    availability: EONBOT_AVAILABILITY.AVAILABLE,
    permission: EONBOT_PERMISSION.PUBLISHING,
    fallback: 'Prepare a copyable share draft or QR code; do not post on the user’s behalf.',
    truth: 'EONBOT can prepare sharing material but never mass-posts, stores social passwords or rewards raw share attempts.'
  }),
  voice: Object.freeze({
    availability: EONBOT_AVAILABILITY.DEVICE_DEPENDENT,
    permission: EONBOT_PERMISSION.MICROPHONE,
    fallback: 'Keep typed input fully available when microphone or browser speech support is unavailable.',
    truth: 'Voice uses browser capabilities where available. It is not universal and always needs a typed fallback.'
  })
});

const GENERIC_POLICY = Object.freeze({
  availability: EONBOT_AVAILABILITY.AVAILABLE,
  permission: EONBOT_PERMISSION.NONE,
  fallback: 'Ask one short clarifying question or continue in Chat.',
  truth: 'EONBOT must state what is available, device-dependent, simulated, preview-only, approval-required or unavailable instead of inventing a capability.'
});


// These recognisers are intentionally broader than the basic route manifest.
// They cover plain-language questions used in the acceptance bench while still
// routing only to known public capabilities.
const TRUTH_INTENT_OVERRIDES = Object.freeze([
  Object.freeze({ id: 'local-ai', pattern: /\b(local\s*ai|offline\s*(?:ai|model)|ollama|phi|(?:model\s*(?:install|download|remove)|(?:install|download|remove)\s+(?:a\s+)?(?:local\s+)?model)|device\s*(?:check|compatibility)|storage\s*(?:for|need).*(?:ai|model))\b/i }),
  Object.freeze({ id: 'automations', pattern: /\b(automate|automation|workflow|schedule|repeat\s+this|external\s+action|send\s+.*\bteam\b|approve\s+external)\b/i }),
  Object.freeze({ id: 'trade', pattern: /\b(trade|trading|paper\s*(?:trade|simulation)|chart|watchlist|btc\s+market|trade\s+risk|order)\b/i }),
  Object.freeze({ id: 'market', pattern: /\b(market|nft|drop|mint|generated\s+art|official\s+item|utility\s+pass|market\s+(?:price|catalog|receipt))\b/i }),
  Object.freeze({ id: 'vault', pattern: /\b(vault|backup|restore|receipt|api\s*key|exchange\s*secret|secure\s+profile|clear\s+(?:sensitive\s+)?(?:local\s+)?data)\b/i }),
  Object.freeze({ id: 'rewards', pattern: /\b(reward|rewards|offerwall|earn|credits?|cash\s*out)\b/i }),
  Object.freeze({ id: 'share', pattern: /\b(share|referral|invite|qr|social\s+network|post\s+to)\b/i }),
  Object.freeze({ id: 'voice', pattern: /\b(voice|microphone|speech\s*recognition|dictate|speech)\b/i }),
  Object.freeze({ id: 'eoncity', pattern: /\b(eon\s*city|operator\s*map|realm|3d\s*city|weak\s*phone)\b/i }),
  Object.freeze({ id: 'workspace', pattern: /\b(workspace|build|create|project|landing\s*page|organise\s+my\s+day)\b/i })
]);

function normalize(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function containsAny(input = '', expressions = []) {
  const value = String(input || '');
  return expressions.some((expression) => expression.test(value));
}

function capabilityPolicy(capabilityId = '') {
  return CAPABILITY_POLICY[String(capabilityId || '')] || GENERIC_POLICY;
}

function routeById(id = '') {
  return EON_ROUTE_MANIFEST.find((entry) => entry.id === id) || null;
}

function publicCapabilityById(id = '') {
  return EON_CAPABILITY_MANIFEST.find((entry) => entry.id === id) || null;
}


function buildTruthRoutePlan(input = '') {
  const source = String(input || '');
  const override = TRUTH_INTENT_OVERRIDES.find((entry) => entry.pattern.test(source));
  if (override) {
    const capability = publicCapabilityById(override.id);
    const route = routeById(capability?.routeId || override.id);
    if (capability && route) {
      return {
        capabilityId: capability.id,
        route: route.route,
        label: route.label,
        availability: capability.availability,
        confirmation: capability.confirmation,
        purpose: route.purpose
      };
    }
  }
  return buildEonbotRoutePlan(source);
}

export function containsSensitiveCredentialRequest(input = '') {
  return containsAny(input, SECRET_PATTERNS);
}

export function containsDisallowedFinancialExecutionRequest(input = '') {
  return containsAny(input, FINANCIAL_EXECUTION_PATTERNS);
}

export function containsUnverifiedClaimRequest(input = '') {
  return containsAny(input, CLAIM_PATTERNS);
}

export function listEonbotTruthCapabilities() {
  return EON_CAPABILITY_MANIFEST.map((capability) => {
    const route = routeById(capability.routeId);
    const policy = capabilityPolicy(capability.id);
    return Object.freeze({
      id: capability.id,
      route: route?.route || null,
      availability: policy.availability,
      permission: policy.permission,
      fallback: policy.fallback
    });
  });
}

export function buildEonbotTruthPlan(input = '', options = {}) {
  const source = normalize(input);
  const voice = buildNativeVoiceCapabilityPlan(options.voiceOptions || {});

  if (containsSensitiveCredentialRequest(source)) {
    return {
      version: EONBOT_TRUTH_CONTRACT_VERSION,
      matched: true,
      blocked: true,
      category: 'secret-protection',
      route: '/vault',
      availability: EONBOT_AVAILABILITY.SENSITIVE,
      permission: EONBOT_PERMISSION.SENSITIVE_ACTION,
      text: 'For your security, do not share a seed phrase, password, API key, exchange secret or recovery material in chat. Open Vault for safe backup and account guidance.',
      truthNote: 'EONBOT never asks for, echoes, stores or exposes secrets.',
      fallback: 'Use the Vault backup guidance or remove the sensitive value before continuing.',
      toolCTA: { label: 'Open Vault', url: '/vault' },
      actionCTA: { label: 'Keep secrets private', action: 'secretProtected' },
      quickReplies: ['Open Vault', 'Create encrypted backup', 'Explain safe API-key storage']
    };
  }

  const localAiQuestion = /\b(can|could|does|will|is)\b/i.test(source) && /\b(local\s*ai|offline\s*ai|ollama|phi|model)\b/i.test(source);
  if (containsDisallowedFinancialExecutionRequest(source) && !localAiQuestion) {
    return {
      version: EONBOT_TRUTH_CONTRACT_VERSION,
      matched: true,
      blocked: true,
      category: 'live-financial-execution',
      route: '/insights',
      availability: EONBOT_AVAILABILITY.RESEARCH_ONLY,
      permission: EONBOT_PERMISSION.NOT_AVAILABLE,
      text: 'EONAPP does not place orders, transfer funds, withdraw money or convert credits to cash. Research Lab is local analysis only.',
      truthNote: 'No live financial execution is available.',
      fallback: 'Open Research Lab for local evidence, historical review or a scenario log.',
      toolCTA: { label: 'Open Research Lab', url: '/insights' },
      actionCTA: null,
      quickReplies: ['Open Research Lab', 'Start a scenario log', 'Explain research limits']
    };
  }

  const routePlan = buildTruthRoutePlan(source);
  const capabilityId = routePlan?.capabilityId || '';
  const policy = capabilityPolicy(capabilityId);
  const capability = publicCapabilityById(capabilityId);
  const route = routePlan?.route || '/';
  const label = routePlan?.label || 'Chat';
  const unverifiedClaim = containsUnverifiedClaimRequest(source);
  const voiceFallback = capabilityId === 'voice' && voice.recommendedMode !== 'native-live-dictation'
    ? 'Browser voice is unavailable here. Keep typing, or use a supported full browser and try again.'
    : policy.fallback;

  const text = routePlan
    ? `${policy.truth} ${unverifiedClaim ? 'I can verify only through a real receipt or configured provider state; I will not guess.' : ''}`.trim()
    : GENERIC_POLICY.truth;

  return {
    version: EONBOT_TRUTH_CONTRACT_VERSION,
    matched: Boolean(routePlan),
    blocked: false,
    category: capabilityId || 'general-guidance',
    capabilityId: capabilityId || null,
    route,
    label,
    availability: policy.availability,
    permission: policy.permission,
    text,
    truthNote: policy.truth,
    fallback: voiceFallback,
    providerOrReceiptRequired: unverifiedClaim,
    toolCTA: { label: routePlan ? `Open ${label}` : 'Open Chat', url: route },
    actionCTA: policy.permission !== EONBOT_PERMISSION.NONE && policy.permission !== EONBOT_PERMISSION.NOT_AVAILABLE
      ? { label: 'Review before continuing', action: 'approvalRequired' }
      : null,
    quickReplies: capabilityId === 'voice'
      ? ['Use typed input', 'Open voice settings', 'Check voice support']
      : ['Open Create', 'Continue a project', 'Make Local AI ready', 'Open EON City'],
    voice: {
      recommendedMode: voice.recommendedMode,
      typedFallback: 'Typed input stays available on every supported route.',
      warnings: voice.warnings
    },
    contract: {
      routePurpose: routePlan?.purpose || 'General Chat guidance.',
      capabilityStatus: capability?.availability || 'available',
      mustNotClaim: [
        'provider connectivity without configured evidence',
        'completed offer or reward without a server receipt',
        'payment, mint, transfer, referral conversion or trade order without verified evidence',
        'offline web access, publishing or live trading',
        'access to private Vault values or secrets'
      ]
    }
  };
}

export function applyEonbotTruthOverlay(response = {}, truthPlan = {}) {
  const base = response && typeof response === 'object' ? response : {};
  const truth = truthPlan && typeof truthPlan === 'object' ? truthPlan : {};
  if (truth.blocked) return truth;

  const existingText = normalize(base.text);
  const truthText = normalize(truth.text);
  const shouldAppend = Boolean(truthText) && truth.matched && !existingText.toLowerCase().includes(truthText.toLowerCase());
  return {
    ...base,
    route: base.route || truth.route || '/',
    availability: truth.availability || base.availability || EONBOT_AVAILABILITY.AVAILABLE,
    permission: truth.permission || base.permission || EONBOT_PERMISSION.NONE,
    truthNote: truth.truthNote || base.truthNote || '',
    fallback: truth.fallback || base.fallback || '',
    providerOrReceiptRequired: Boolean(truth.providerOrReceiptRequired || base.providerOrReceiptRequired),
    text: shouldAppend ? `${existingText} ${truthText}`.trim() : (existingText || truthText),
    toolCTA: base.toolCTA || truth.toolCTA || null,
    actionCTA: base.actionCTA || truth.actionCTA || null,
    quickReplies: Array.isArray(base.quickReplies) && base.quickReplies.length ? base.quickReplies : (truth.quickReplies || [])
  };
}

export function buildEonbotTruthSystemPrompt() {
  return [
    `EONBOT truth contract ${EONBOT_TRUTH_CONTRACT_VERSION}:`,
    '- State the route, availability, permission requirement and fallback for any capability request.',
    '- Never claim a provider connection, reward, payment, receipt, mint, referral conversion, trade order, transfer or live capability without verified evidence.',
    '- Never request, repeat, store or expose seed phrases, passwords, API keys, exchange secrets or recovery material.',
    '- Local offline AI cannot browse, post, send messages, call cloud tools or place trades.',
    '- Automations are simulate-first and need approval before external effects.',
    '- Research Lab is local analysis only, with no broker, exchange, order or paper-trading path. Referral/EONKEY programme state is server-authoritative; never infer active/inactive from static copy, and never treat clicks, shares or posts alone as reward qualification.',
    '- Voice is browser-dependent and typed input must remain a complete fallback.'
  ].join('\n');
}

export default {
  EONBOT_TRUTH_CONTRACT_VERSION,
  EONBOT_AVAILABILITY,
  EONBOT_PERMISSION,
  buildEonbotTruthPlan,
  applyEonbotTruthOverlay,
  buildEonbotTruthSystemPrompt,
  containsSensitiveCredentialRequest,
  containsDisallowedFinancialExecutionRequest,
  containsUnverifiedClaimRequest,
  listEonbotTruthCapabilities
};
