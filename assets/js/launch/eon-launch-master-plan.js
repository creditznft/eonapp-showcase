/**
 * W617B — Launch master plan and Codex deploy contract.
 *
 * This is a deterministic source contract for the post-W616D launch stage.
 * It aligns the active launch plan with the current business truth:
 * Dodo first, EON Keys for referral capability unlocks, no platform-paid
 * generation credits, no browser-only entitlement unlocks and no live checkout
 * until Cloudflare/server proof exists.
 */

import {
  EON_AI_COST_BOUNDARY,
  EON_REFERRAL_REWARD_MATRIX,
  EON_SUBSCRIPTION_TIERS,
  validateEonKeysCatalog
} from '../referrals/eon-keys-catalog.js';
import { validateLockedFeatureSurfaces } from '../referrals/eon-locked-feature-surface.js';

export const EON_LAUNCH_MASTER_PLAN_SCHEMA = 'eonapp.launch.master-plan.v1';
export const EON_LAUNCH_MASTER_PLAN_VERSION = 1;

const freezeItem = (item) => Object.freeze({ ...item });
const freezeItems = (items) => Object.freeze(items.map((item) => freezeItem(item)));

export const EON_LAUNCH_COMMERCIAL_BOUNDARY = Object.freeze({
  dodoCheckoutActive: false,
  dodoTrialActivationActive: false,
  liveEonKeyRedemptionActive: false,
  referralGrantLedgerActive: false,
  browserOnlyEntitlementAllowed: false,
  platformPaidHostedAiGeneration: false,
  rewardsHaveCashValue: false,
  rewardsTransferable: false,
  renewalDiscountRewardActive: false,
  firstMonthCouponActive: false,
  statement: 'W617B is a launch-readiness contract only. It does not activate Dodo checkout, trials, paid entitlements, referral grants, EON Key redemption or platform-funded AI/image/video generation.'
});

export const EON_LAUNCH_COMPLETED_WAVES = freezeItems([
  { id: 'w616b', label: 'EON Keys referral unlock catalogue', status: 'coded', proof: 'qa:w616b-eon-keys-referral' },
  { id: 'w616c', label: 'Locked feature resolver', status: 'coded', proof: 'qa:w616c-locked-feature-resolver' },
  { id: 'w616d', label: 'Locked feature cards on real surfaces', status: 'coded', proof: 'qa:w616d-locked-feature-surfaces' },
  { id: 'w617a', label: 'Shell/sidebar/menu launch readiness', status: 'coded', proof: 'qa:w617a-shell-launch-readiness' },
  { id: 'w617b', label: 'Launch master plan and Codex/Cloudflare deploy contract', status: 'coded-this-wave', proof: 'qa:w617b-launch-master-plan' }
]);

export const EON_LAUNCH_NEXT_CODING_WAVES = freezeItems([
  {
    id: 'w617c',
    label: 'Dodo and entitlement server contracts',
    owner: 'ChatGPT then Codex/local',
    stage: 'next-code',
    deliverable: 'Cloudflare-safe disabled adapters for Dodo product ids, webhook verification shape, entitlement events and referral attribution inputs.',
    hardBoundary: 'No checkout session creation and no live entitlement grant until Dodo sandbox/live webhook proof and a server ledger are verified.'
  },
  {
    id: 'w617d',
    label: 'Referral/EON Key ledger contract',
    owner: 'ChatGPT then Codex/local',
    stage: 'next-code',
    deliverable: 'Server-side ledger schema, idempotency keys, abuse caps, 14-day retention checks and UI read model; disabled in production until Cloudflare binding proof exists.',
    hardBoundary: 'No key balance may be trusted from localStorage or query parameters.'
  },
  {
    id: 'w617e',
    label: 'Whole-app browser and mobile visual proof',
    owner: 'Codex/local',
    stage: 'external-proof',
    deliverable: 'Screenshots/video receipts for chat, projects, workspace, local AI, automations, vault, eon-keys, billing and EON City on desktop and mobile.',
    hardBoundary: 'ChatGPT container browser proof is not enough if Chromium is policy-blocked or not authenticated.'
  },
  {
    id: 'w617f',
    label: 'Cloudflare deploy, canary and rollback proof',
    owner: 'Codex/local + user Cloudflare dashboard',
    stage: 'deploy-proof',
    deliverable: 'Production build hash, Pages deployment id, route smoke proof, cache purge proof and rollback checkpoint.',
    hardBoundary: 'Do not enable paid CTAs, trials or redemption until deploy proof and server proof are both captured.'
  }
]);

export const EON_CLOUDFLARE_DEPLOY_CONTRACT = Object.freeze({
  projectName: 'eonapp-ch',
  productionBranch: 'main',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  nodeVersion: '22',
  deployType: 'Cloudflare Pages static build first; Workers/Functions only for future server entitlement and Dodo webhooks.',
  requiredDashboardSettings: Object.freeze([
    'Cloudflare Pages project points to the correct GitHub repository and production branch.',
    'Build command is npm run build and output directory is dist.',
    'Node version is pinned to 22 in Pages environment variables or build settings.',
    'Preview deployments remain enabled for Codex/browser proof before production promotion.',
    'Custom domain eonapp.ch is attached with HTTPS active.',
    'Compatibility flags or Pages Functions bindings are added only when W617C/W617D server code exists.',
    'Do not paste API secrets into frontend Vite variables.'
  ]),
  safePublicEnv: Object.freeze([
    'NODE_VERSION=22',
    'EONAPP_PUBLIC_ORIGIN=https://eonapp.ch'
  ]),
  secretsRequiredBeforeBillingEnable: Object.freeze([
    'DODO_API_KEY',
    'DODO_WEBHOOK_SECRET',
    'DODO_PLUS_PRODUCT_ID',
    'DODO_STUDIO_PRODUCT_ID',
    'DODO_POWER_PRODUCT_ID',
    'DODO_MAX_PRODUCT_ID',
    'EON_ENTITLEMENT_LEDGER_D1 binding or equivalent server ledger binding',
    'EON_REFERRAL_LEDGER_D1 binding or equivalent server ledger binding'
  ]),
  mustNeverExposeToBrowser: Object.freeze([
    'DODO_API_KEY',
    'DODO_WEBHOOK_SECRET',
    'raw webhook payload secrets',
    'server-side entitlement override keys',
    'referral grant signing secrets'
  ])
});

export const EON_CODEX_HANDOFF_COMMANDS = Object.freeze([
  'npm ci',
  'npm run qa:w616b-eon-keys-referral',
  'npm run qa:w616c-locked-feature-resolver',
  'npm run qa:w616d-locked-feature-surfaces',
  'npm run qa:w617a-shell-launch-readiness',
  'npm run qa:w617b-launch-master-plan',
  'npm run lint -- --max-warnings=0',
  'npm run build',
  'npm run smoke:build',
  'npm run launch:readiness',
  'npm run launch:page-gate',
  'npm run launch:identity-gate',
  'npm run launch:quality-gate',
  'npm run security:secret-scan',
  'npm run test:unit',
  'npm run test:e2e:current'
]);

export const EON_LAUNCH_CERTIFICATION_STAGES = freezeItems([
  { id: 'source', label: 'Source certification', required: ['npm ci', 'focused W616/W617 QA', 'lint', 'build', 'smoke:build', 'secret scan'] },
  { id: 'route-ui', label: 'Route and UI certification', required: ['sidebar/menu audit', 'primary route smoke', 'locked feature cards visible on real surfaces', 'mobile drawer proof'] },
  { id: 'city', label: 'EON City certification', required: ['guest preview proof', 'authenticated Babylon renderer proof', 'controls and Start Here hit-area proof', 'mobile landscape proof'] },
  { id: 'local-ai', label: 'Local/own-key AI certification', required: ['Ollama/LM Studio/Jan guidance proof', 'private-network limitation copy', 'no platform-paid AI credit copy'] },
  { id: 'billing', label: 'Dodo billing certification', required: ['Dodo account verified', 'product ids configured', 'checkout sandbox/live proof', 'signed webhook proof', 'entitlement ledger proof'], status: 'blocked-until-w617c-w617d' },
  { id: 'referrals', label: 'Referral and EON Keys certification', required: ['server attribution proof', 'idempotent grant ledger', 'abuse caps', '14-day retention checks', 'no cash/crypto/discount reward copy'], status: 'blocked-until-w617d' },
  { id: 'cloudflare', label: 'Cloudflare production certification', required: ['Pages deployment id', 'build hash', 'custom domain HTTPS', 'headers/redirects proof', 'cache purge/rollback proof'] },
  { id: 'ceo', label: 'CEO launch decision', required: ['go/soft-launch/no-go note', 'known caveats accepted', 'paid activation explicitly on/off'] }
]);

function paidTiers() {
  return EON_SUBSCRIPTION_TIERS.filter((tier) => tier.id !== 'free');
}

function referralTriggers() {
  return EON_REFERRAL_REWARD_MATRIX.map((row) => Object.freeze({
    id: row.id,
    trigger: row.trigger,
    countsAs: row.countsAs,
    activeNow: false,
    grantRequiresServerLedger: row.id !== 'invite-click'
  }));
}

export function buildEonLaunchMasterPlan(options = {}) {
  const date = options.date || '2026-07-10';
  return Object.freeze({
    schema: EON_LAUNCH_MASTER_PLAN_SCHEMA,
    version: EON_LAUNCH_MASTER_PLAN_VERSION,
    date,
    launchStage: 'code-complete-local-candidate-not-deployed',
    broadLaunchDecision: 'no-go-until-codex-cloudflare-browser-and-server-proof',
    softLaunchPath: 'allowed only after source QA, browser/mobile proof, Cloudflare deploy proof and an explicit CEO note; paid activation may still remain off.',
    commercialBoundary: EON_LAUNCH_COMMERCIAL_BOUNDARY,
    aiCostBoundary: EON_AI_COST_BOUNDARY,
    subscriptionTiers: Object.freeze(EON_SUBSCRIPTION_TIERS.map((tier) => Object.freeze({
      id: tier.id,
      label: tier.label,
      monthlyUsd: tier.monthlyUsd,
      monthlyInr: tier.monthlyInr,
      dodoProductRequired: tier.dodoProductRequired,
      trialPublic: Boolean(tier.trialPublic),
      trialContextual: Boolean(tier.trialContextual),
      inviteOnlyAtLaunch: Boolean(tier.inviteOnlyAtLaunch),
      checkoutActive: false
    }))),
    paidTierCount: paidTiers().length,
    referralDecision: Object.freeze({
      activeNow: false,
      launchRewardRail: 'EON Keys and non-transferable app capability/cosmetics only',
      noCashOrPayout: true,
      noWalletOrCrypto: true,
      noTokenOrNft: true,
      noRenewalDiscountReward: true,
      noFreeMonthReward: true,
      firstMonthCoupon: 'future Dodo coupon/config decision only; not granted by this source wave',
      serverLedgerRequired: true,
      triggers: Object.freeze(referralTriggers())
    }),
    completedWaves: EON_LAUNCH_COMPLETED_WAVES,
    nextCodingWaves: EON_LAUNCH_NEXT_CODING_WAVES,
    certificationStages: EON_LAUNCH_CERTIFICATION_STAGES,
    cloudflare: EON_CLOUDFLARE_DEPLOY_CONTRACT,
    codexCommands: EON_CODEX_HANDOFF_COMMANDS
  });
}

export function decideEonLaunchHandoffStage(evidence = {}) {
  const blockers = [];
  const warnings = [];
  const hasSource = Boolean(evidence.sourceQaPassed && evidence.lintPassed && evidence.buildPassed && evidence.secretScanPassed);
  if (!evidence.sourceQaPassed) blockers.push('Source QA proof missing.');
  if (!evidence.lintPassed) blockers.push('Lint proof missing.');
  if (!evidence.buildPassed) blockers.push('Build proof missing.');
  if (!evidence.secretScanPassed) blockers.push('Secret scan proof missing.');
  if (!evidence.browserQaPassed) warnings.push('Browser/visual QA proof missing.');
  if (!evidence.mobileQaPassed) warnings.push('Mobile QA proof missing.');
  if (!evidence.cloudflareDeployProof) warnings.push('Cloudflare deployment proof missing.');

  if (evidence.enablePaidActivation) {
    if (!evidence.dodoCheckoutProof) blockers.push('Paid activation requested but Dodo checkout proof is missing.');
    if (!evidence.dodoWebhookProof) blockers.push('Paid activation requested but Dodo webhook proof is missing.');
    if (!evidence.entitlementLedgerProof) blockers.push('Paid activation requested but server entitlement ledger proof is missing.');
  }
  if (evidence.enableReferralGrants && !evidence.referralLedgerProof) blockers.push('Referral grants requested but server referral/EON Key ledger proof is missing.');

  let decision = 'handoff-to-codex-for-proof';
  if (blockers.length) decision = 'keep-coding-or-fix-before-codex';
  if (hasSource && !blockers.length && !warnings.length) decision = 'soft-launch-candidate-after-ceo-review';
  return Object.freeze({
    schema: 'eonapp.launch.handoff-decision.v1',
    decision,
    blockers: Object.freeze(blockers),
    warnings: Object.freeze(warnings),
    paidActivationAllowed: Boolean(evidence.enablePaidActivation && evidence.dodoCheckoutProof && evidence.dodoWebhookProof && evidence.entitlementLedgerProof),
    referralGrantsAllowed: Boolean(evidence.enableReferralGrants && evidence.referralLedgerProof),
    note: decision === 'soft-launch-candidate-after-ceo-review'
      ? 'Source and external proof are complete; CEO can decide soft launch or production launch.'
      : 'Continue coding/verification or hand off to Codex for the proof items listed above.'
  });
}

export function validateEonLaunchMasterPlan(plan = buildEonLaunchMasterPlan()) {
  const errors = [];
  const catalog = validateEonKeysCatalog();
  const surfaces = validateLockedFeatureSurfaces();
  if (!catalog.ok) errors.push(...catalog.errors.map((error) => `Catalog: ${error}`));
  if (!surfaces.ok) errors.push(...surfaces.errors.map((error) => `Surfaces: ${error}`));
  if (plan.schema !== EON_LAUNCH_MASTER_PLAN_SCHEMA) errors.push('Unexpected launch master plan schema.');
  if (plan.commercialBoundary.dodoCheckoutActive !== false) errors.push('Dodo checkout must remain inactive in W617B.');
  if (plan.commercialBoundary.liveEonKeyRedemptionActive !== false) errors.push('Live EON Key redemption must remain inactive in W617B.');
  if (plan.commercialBoundary.browserOnlyEntitlementAllowed !== false) errors.push('Browser-only entitlement unlocks must remain blocked.');
  if (plan.aiCostBoundary.platformPaidHostedGeneration !== false) errors.push('Platform-paid hosted generation must remain false.');
  if (plan.paidTierCount < 6) errors.push('Launch plan must account for all six recurring paid tiers: Plus, Studio, Power, Max, Pro and Ultra.');
  for (const tierId of ['free', 'plus', 'studio', 'power', 'max', 'pro', 'ultra']) {
    if (!plan.subscriptionTiers.some((tier) => tier.id === tierId)) errors.push(`Missing subscription tier ${tierId}.`);
  }
  for (const waveId of ['w617c', 'w617d', 'w617e', 'w617f']) {
    if (!plan.nextCodingWaves.some((wave) => wave.id === waveId)) errors.push(`Missing next wave ${waveId}.`);
  }
  for (const command of ['npm run qa:w617b-launch-master-plan', 'npm run build', 'npm run security:secret-scan']) {
    if (!plan.codexCommands.includes(command)) errors.push(`Missing Codex command: ${command}`);
  }
  if (!plan.cloudflare.requiredDashboardSettings.some((item) => /output directory is dist/i.test(item))) errors.push('Cloudflare output directory requirement missing.');
  if (!plan.cloudflare.secretsRequiredBeforeBillingEnable.some((item) => /DODO_WEBHOOK_SECRET/.test(item))) errors.push('Dodo webhook secret requirement missing.');
  const combined = JSON.stringify(plan);
  const retiredPattern = new RegExp([
    'NOW' + 'Payments',
    'direct-' + 'EVM',
    'direct ' + 'EVM',
    'Mone' + 'tag',
    'Pool ' + 'Points',
    'cash' + 'back',
    'wallet bal' + 'ance',
    'crypto pay' + 'out',
    'free mo' + 'nth',
    'renewal disc' + 'ount'
  ].join('|'), 'i');
  if (retiredPattern.test(combined)) {
    errors.push('Launch plan contains retired payment/reward vocabulary.');
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: EON_LAUNCH_MASTER_PLAN_SCHEMA, version: EON_LAUNCH_MASTER_PLAN_VERSION });
}

export default Object.freeze({
  EON_LAUNCH_MASTER_PLAN_SCHEMA,
  EON_LAUNCH_MASTER_PLAN_VERSION,
  EON_LAUNCH_COMMERCIAL_BOUNDARY,
  EON_LAUNCH_COMPLETED_WAVES,
  EON_LAUNCH_NEXT_CODING_WAVES,
  EON_CLOUDFLARE_DEPLOY_CONTRACT,
  EON_CODEX_HANDOFF_COMMANDS,
  EON_LAUNCH_CERTIFICATION_STAGES,
  buildEonLaunchMasterPlan,
  decideEonLaunchHandoffStage,
  validateEonLaunchMasterPlan
});
