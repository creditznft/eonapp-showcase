/**
 * app-surface-quality-gates.js
 * Source-level quality gate helpers for final pre-Codex audit waves.
 */

export const APP_SURFACE_QUALITY_SCHEMA = 'eon.app-surface-quality-gates.v3';

export const SENSITIVE_PAGE_PATTERNS = Object.freeze([
  /admin/i,
  /subscription/i,
  /billing/i,
  /refund/i,
  /nowpayments/i,
  /vault/i,
  /privacy/i,
  /terms/i,
  /legal/i,
  /support/i
]);

export const BANNED_FINANCIAL_CLAIMS = Object.freeze([
  /guaranteed\s+(profit|income|return|yield)/i,
  /passive\s+income/i,
  /risk[-\s]?free/i,
  /moon\s?shot/i,
  /resale\s+value\s+(guaranteed|promise|promised)/i,
  /get\s+rich/i,
  /investment\s+guarantee/i
]);

export const CORE_ROUTE_OWNERSHIP = Object.freeze({
  publicEntry: 'index.html',
  aiEntry: 'chat.html',
  projects: 'projects.html',
  library: 'library.html',
  workspace: 'workspace.html',
  privateVault: 'vault.html',
  market: 'market.html',
  cityEntry: 'eoncity.html',
  cityOverview: 'eoncity-lite.html',
  optionalVisual3d: 'eoncity-3d.html',
  realmStudio: 'realm-studio.html',
  tradeSafety: 'trade.html',
  campaignStatus: 'rewards.html',
  support: 'support.html',
  productBoundary: 'legal.html'
});

export function scanFinancialClaims(text = '') {
  const issues = [];
  for (const pattern of BANNED_FINANCIAL_CLAIMS) {
    if (pattern.test(text)) issues.push(`Banned financial claim matched: ${pattern}`);
  }
  return issues;
}

export function classifyRouteSensitivity(path = '') {
  return SENSITIVE_PAGE_PATTERNS.some((pattern) => pattern.test(path)) ? 'sensitive' : 'standard';
}

export function scanSensitivePageAds(path = '', html = '') {
  if (classifyRouteSensitivity(path) !== 'sensitive') return [];
  const adLike = /(adsbygoogle|monetag|adsterra|sponsor-slot|native-ad|data-ad-|eon-ad-slot)/i;
  return adLike.test(html) ? [`Sensitive page ${path} appears to contain an ad/sponsor slot.`] : [];
}

export function scanHtmlBasics(path = '', html = '') {
  const issues = [];
  if (!/<title>[^<]{8,}<\/title>/i.test(html)) issues.push(`${path} needs a meaningful title.`);
  if (!/<meta\s+name=["']description["']/i.test(html)) issues.push(`${path} needs a meta description.`);
  if (!/<h1[\s>]/i.test(html)) issues.push(`${path} needs an H1.`);
  if (!/rel=["']manifest["']/i.test(html)) issues.push(`${path} should link the PWA manifest.`);
  return issues;
}

export function scanServiceWorkerSafety(swText = '') {
  const issues = [];
  const requiredNetworkOnly = ['admin', 'api/', 'subscription', 'billing', 'reward-access', 'telegram'];
  for (const token of requiredNetworkOnly) {
    const re = new RegExp(token.replace('/', '\\/'), 'i');
    if (!re.test(swText)) issues.push(`Service worker safety policy should mention network-only route token: ${token}`);
  }
  if (!/CACHE_VERSION|APP_SHELL_CACHE|eonapp/i.test(swText)) issues.push('Service worker should use an explicit versioned cache.');
  return issues;
}

export function scanCreatorCommerceText(text = '') {
  const issues = [];
  const source = String(text || '');
  const admin1OnlyLaunch = /Admin\s*1/i.test(source)
    && /(100%|all\s+(sales|income|launch\s+income)|routes?\s+to\s+(the\s+)?Admin\s*1|Admin\s*1\s+\/\s+EON\s+Team)/i.test(source)
    && /(owner[-\s]?split|creator[-\s]?split|seller[-\s]?split|user[-\s]?owner[-\s]?split|user[-\s]?owned\s+split)s?\s+(are\s+|stay\s+|remain\s+)?(disabled|off|not\s+enabled|paused|preview-only)/i.test(source);
  if (admin1OnlyLaunch) return issues;
  if (!/0\.5%|0\.5\s*percent|50\s*bps/i.test(source)) issues.push('Creator commerce text should state 0.5% launch platform fee, unless Admin 1-only launch routing is explicitly stated.');
  if (!/capped\s+at\s+1%|1%\s+cap|100\s*bps/i.test(source)) issues.push('Creator commerce text should state hard cap at 1%, unless Admin 1-only launch routing is explicitly stated.');
  if (!/owner\s+wallet|land\s+owner|seller\s+wallet/i.test(source)) issues.push('Creator commerce text should state owner/seller wallet routing, unless user-owned splits are disabled for launch.');
  if (!/Admin\s*1/i.test(source)) issues.push('Creator commerce text should identify Admin 1 receiver for launch.');
  return issues;
}

export function buildRouteOwnershipMap(overrides = {}) {
  return { schema: APP_SURFACE_QUALITY_SCHEMA, routes: { ...CORE_ROUTE_OWNERSHIP, ...overrides } };
}

export function validateRouteOwnershipMap(map = buildRouteOwnershipMap()) {
  const issues = [];
  const routes = /** @type {any} */ (map.routes || {});
  if (routes.cityEntry !== 'eoncity.html') issues.push('EON City direct entry must remain the first City route.');
  if (routes.cityOverview !== 'eoncity-lite.html') issues.push('City Overview must remain the resilient all-device fallback.');
  if (routes.optionalVisual3d !== 'eoncity-3d.html') issues.push('Spatial Command Space must remain isolated behind its device gate.');
  if (routes.realmStudio !== 'realm-studio.html') issues.push('Realm Studio must remain the explicit local Realm generator.');
  if (routes.campaignStatus !== 'rewards.html') issues.push('Campaign status must remain the public commercial boundary.');
  if (routes.productBoundary !== 'legal.html') issues.push('Legal must remain the current product-boundary route.');
  if (!routes.support) issues.push('Support route must remain explicit.');
  return { ok: issues.length === 0, issues };
}
