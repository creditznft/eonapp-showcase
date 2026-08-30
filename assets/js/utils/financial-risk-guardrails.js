/**
 * financial-risk-guardrails.js
 * Launch-safe policy helpers for EONAPP billing, referrals, disabled commerce,
 * research, rewards, token-era archive copy, and payment surfaces.
 *
 * This module is intentionally deterministic and browser-safe. It does not
 * execute payments, read wallets, or make server calls. It gives the app and
 * Codex a reusable checklist for preventing investment/profit overclaiming.
 */

export const FINANCIAL_RISK_SCHEMA = 'eon.financial-risk-guardrails.v1';

export const FINANCIAL_SURFACES = Object.freeze([
  'trade',
  'wallet-risk',
  'reward-access',
  'realmworld-commerce',
  'lootbox',
  'nft-market',
  'token-dashboard',
  'subscription',
  'creator-realm'
]);

export const REQUIRED_FINANCIAL_COPY_POINTS = Object.freeze([
  'not-financial-advice',
  'user-confirmed-actions',
  'no-profit-guarantee',
  'no-resale-value-promise',
  'utility-entertainment-positioning',
  'payment-wallet-verification',
  'no-auto-repeat-purchases'
]);

const HIGH_RISK_PATTERNS = Object.freeze([
  { id: 'guaranteed-profit', pattern: /guaranteed\s+(profit|income|return|roi|yield|earnings)/i },
  { id: 'risk-free', pattern: /risk[-\s]?free\s+(profit|trade|investment|yield|return|income)/i },
  { id: 'passive-income-promise', pattern: /passive\s+income\s+(guaranteed|forever|without\s+risk|from\s+everyone)/i },
  { id: 'moonshot-promise', pattern: /(100x|1000x|moon\s+soon|guaranteed\s+moon|will\s+moon)/i },
  { id: 'resale-guarantee', pattern: /guaranteed\s+(resale|floor\s+price|market\s+value|liquidity)/i },
  { id: 'auto-trading-profit', pattern: /(autopilot|automatic)\s+(profit|trading\s+profit|guaranteed\s+trade)/i },
  { id: 'no-loss-claim', pattern: /(cannot\s+lose|never\s+lose|zero\s+risk)\s+(money|funds|crypto|trades)?/i }
]);

function clean(value = '', max = 160) {
  return String(value || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeSurface(surface = '') {
  const normalized = clean(surface, 64).toLowerCase().replace(/[\s_]+/g, '-');
  return FINANCIAL_SURFACES.includes(normalized) ? normalized : 'realmworld-commerce';
}

export function buildFinancialRiskPolicy(surface = 'realmworld-commerce', options = {}) {
  const normalizedSurface = normalizeSurface(surface);
  const noPaidLootboxLoop = options.noPaidLootboxLoop !== false;
  const userConfirmed = options.userConfirmed !== false;
  return {
    schema: FINANCIAL_RISK_SCHEMA,
    surface: normalizedSurface,
    mode: options.mode || 'launch-guardrail',
    requiredCopyPoints: [...REQUIRED_FINANCIAL_COPY_POINTS],
    mandatoryDisclaimers: [
      'Not financial advice.',
      'No profit, resale value, floor price, or income is promised.',
      'Collectibles, lootboxes, rewards, and NFTs are utility/entertainment features.',
      'All wallet actions and purchases must be user-confirmed before payment.',
      'Verify receiver wallet, amount, network, and fee split before checkout.'
    ],
    actionPolicy: {
      userConfirmedActions: userConfirmed,
      noAutoTradingWithoutConfirmation: true,
      noAutoRepeatPurchases: noPaidLootboxLoop,
      paidLootboxRequiresSeparateCheckoutConfirmation: true,
      noServerTrustedLocalEntitlement: true,
      noHiddenFees: true
    },
    tokenPolicy: {
      poolPointsAreUtilityOnly: true,
      eonLiteCopyMustAvoidInvestmentLanguage: true,
      dashboardIsInformationalOnly: true,
      noStakingYieldPromise: true
    },
    marketplacePolicy: {
      sellersMaySetUsdPrices: true,
      buyerMustSeeFeeSplit: true,
      creatorRevenueIsNotGuaranteed: true,
      noResaleValuePromise: true,
      noArbitraryUserHtml: true
    }
  };
}

export function validateFinancialCopy(copy = '', options = {}) {
  const text = String(copy || '');
  const problems = [];
  const matched = [];
  for (const rule of HIGH_RISK_PATTERNS) {
    if (rule.pattern.test(text)) {
      matched.push(rule.id);
      problems.push(`High-risk financial wording detected: ${rule.id}`);
    }
  }

  const requireDisclaimer = options.requireDisclaimer !== false;
  if (requireDisclaimer) {
    const lower = text.toLowerCase();
    if (!/(not\s+financial\s+advice|not\s+investment\s+advice)/i.test(lower)) {
      problems.push('Missing not-financial-advice or not-investment-advice wording.');
    }
    const hasNoGuaranteeWord = /(no|not|does not|without)/i.test(lower) && /(promised|guaranteed|promise|guarantee)/i.test(lower);
    const mentionsRiskTarget = /(profit|income|return|returns|resale value|floor price|market liquidity|market value)/i.test(lower);
    if (!hasNoGuaranteeWord || !mentionsRiskTarget) {
      problems.push('Missing explicit no-profit/no-resale guarantee wording.');
    }
  }

  return {
    ok: problems.length === 0,
    matched,
    problems
  };
}

export function buildWalletCheckoutRiskSummary(paymentPlan = {}, options = {}) {
  const surface = normalizeSurface(options.surface || paymentPlan.surface || 'realmworld-commerce');
  const grossUsd = Number(paymentPlan.grossUsd ?? paymentPlan.totalPriceUsd ?? 0) || 0;
  const sellerNetUsd = Number(paymentPlan.sellerNetUsd ?? 0) || 0;
  const platformFeeUsd = Number(paymentPlan.platformFeeUsd ?? 0) || 0;
  const sellerWallet = clean(paymentPlan.seller?.wallet || paymentPlan.receiver?.receiverWallet || '', 64);
  const feeWallet = clean(paymentPlan.platformFee?.wallet || '', 64);
  return {
    schema: 'eon.wallet-checkout-risk-summary.v1',
    surface,
    createdAt: options.now || new Date().toISOString(),
    grossUsd,
    sellerNetUsd,
    platformFeeUsd,
    sellerWallet,
    platformFeeWallet: feeWallet,
    buyerChecklist: [
      'Confirm the receiver wallet and network before paying.',
      'Confirm the USD price and any crypto estimate before signing.',
      'Confirm the EONAPP platform fee is visible and small.',
      'Understand this is utility/entertainment access, not an investment.',
      'Never sign a transaction you do not understand.'
    ],
    copy: 'Not financial advice. No profit, resale value, floor price, income, or market liquidity is promised. Verify wallet, network, amount, and fee split before checkout.',
    requiresManualWalletConfirmation: true,
    noAutoRepeatPurchases: true,
    noInvestmentPromise: true
  };
}

export function validateWalletCheckoutRiskSummary(summary = {}) {
  const problems = [];
  if (summary.requiresManualWalletConfirmation !== true) problems.push('Wallet checkout must require manual confirmation.');
  if (summary.noAutoRepeatPurchases !== true) problems.push('Checkout must block auto-repeat paid purchases.');
  if (summary.noInvestmentPromise !== true) problems.push('Checkout must explicitly avoid investment promises.');
  const copyCheck = validateFinancialCopy(summary.copy || '', { requireDisclaimer: true });
  problems.push(...copyCheck.problems);
  return { ok: problems.length === 0, problems };
}

export function buildFinancialWaveChecklist(options = {}) {
  const date = options.date || '2026-06-02';
  return {
    schema: 'eon.financial-wave-checklist.v1',
    date,
    wave: 'Financial, wallet, rewards, token, and creator-commerce risk',
    requiredFilesToInspect: [
      'trade.html',
      'wallet-risk.html',
      'reward-access.html',
      'billing.html',
      'eon-keys.html',
      'market.html',
      'assets/js/referrals/eon-keys-catalog.js',
      'assets/js/referrals/eon-feature-unlock-resolver.js',
      'assets/js/referrals/eon-locked-feature-surface.js'
    ],
    codingTasks: [
      'Keep all trading and token dashboards framed as research/education unless live execution is explicitly guarded.',
      'Keep token/NFT/lootbox/creator-commerce legacy copy retired or utility-only in archive surfaces.',
      'Keep Dodo checkout fail-closed whenever server-side product, webhook, entitlement or rollback authority is not ready.',
      'Keep referral rewards as non-transferable EON Keys/capability/cosmetics only until server ledger proof exists.',
      'Do not trust localStorage entitlement for server-side paid features.',
      'Do not advertise resale value, passive income, guaranteed profit, or investment upside.'
    ],
    launchBlockers: [
      'Historical checklist item: Dodo checkout/webhook/entitlement proof was not yet available when this wave was authored.',
      'Historical checklist item: server referral/EON Key grant-ledger proof was not yet available when this wave was authored.',
      'Historical checklist item: browser/mobile visual proof for W616D locked-feature surfaces was still pending when this wave was authored.'
    ],
    localOnly: true,
    noBuildRequired: true
  };
}
