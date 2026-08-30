export const W105_PERFORMANCE_SCHEMA = 'eon.w105.all-route-performance.v1';

export const W105_ROUTE_TIERS = Object.freeze({
  critical: Object.freeze({
    tier: 'critical',
    maxHtmlBytes: 115_000,
    maxHtmlGzipBytes: 24_000,
    maxModulePreloads: 18,
    maxStylesheets: 8,
    maxInitialTransferGzipBytes: 760_000,
    minNamedSafeguards: 5
  }),
  standard: Object.freeze({
    tier: 'standard',
    maxHtmlBytes: 90_000,
    maxHtmlGzipBytes: 22_000,
    maxModulePreloads: 16,
    maxStylesheets: 8,
    maxInitialTransferGzipBytes: 620_000,
    minNamedSafeguards: 5
  }),
  content: Object.freeze({
    tier: 'content',
    maxHtmlBytes: 70_000,
    maxHtmlGzipBytes: 18_000,
    maxModulePreloads: 12,
    maxStylesheets: 6,
    maxInitialTransferGzipBytes: 420_000,
    minNamedSafeguards: 4
  }),
  heavy: Object.freeze({
    tier: 'heavy',
    maxHtmlBytes: 130_000,
    maxHtmlGzipBytes: 28_000,
    maxModulePreloads: 22,
    maxStylesheets: 10,
    maxInitialTransferGzipBytes: 920_000,
    minNamedSafeguards: 6
  })
});

const HEAVY_ROUTE_RE = /(?:creator-studio|workbench|eon-browser|realm|realmworld|automation-studio)/i;
const CRITICAL_ROUTE_RE = /^(?:\/|\/chat|\/trade|\/vault|\/market|\/marketplace|\/subscription|\/onboarding)$/i;
const CONTENT_ROUTE_RE = /^\/(?:blog|tools|games|campaigns)\//i;

export function normalizeW105Route(route) {
  const raw = String(route || '/').trim() || '/';
  const withoutHash = raw.split('#')[0].split('?')[0] || '/';
  const prefixed = withoutHash.startsWith('/') ? withoutHash : `/${withoutHash}`;
  return prefixed.replace(/\/index\.html$/i, '/') || '/';
}

export function classifyW105Route(route) {
  const normalized = normalizeW105Route(route);
  if (HEAVY_ROUTE_RE.test(normalized)) return 'heavy';
  if (CONTENT_ROUTE_RE.test(normalized)) return 'content';
  if (CRITICAL_ROUTE_RE.test(normalized)) return 'critical';
  return 'standard';
}

export function resolveW105Budget(route) {
  return W105_ROUTE_TIERS[classifyW105Route(route)] || W105_ROUTE_TIERS.standard;
}

export function buildW105RouteSummary(route, metrics = {}) {
  const normalized = normalizeW105Route(route);
  const budget = resolveW105Budget(normalized);
  const initialTransferGzipBytes = Number(metrics.initialTransferGzipBytes || 0);
  const modulePreloads = Number(metrics.modulePreloads || 0);
  const stylesheets = Number(metrics.stylesheets || 0);
  const scripts = Number(metrics.scripts || 0);
  const htmlBytes = Number(metrics.htmlBytes || 0);
  const htmlGzipBytes = Number(metrics.htmlGzipBytes || 0);
  const safeguards = Array.isArray(metrics.safeguards) ? metrics.safeguards.filter(Boolean) : [];

  const failures = [];
  const warnings = [];
  const check = (name, actual, limit) => {
    if (actual > limit) failures.push({ name, actual, limit });
  };

  check('htmlBytes', htmlBytes, budget.maxHtmlBytes);
  check('htmlGzipBytes', htmlGzipBytes, budget.maxHtmlGzipBytes);
  check('modulePreloads', modulePreloads, budget.maxModulePreloads);
  check('stylesheets', stylesheets, budget.maxStylesheets);
  check('initialTransferGzipBytes', initialTransferGzipBytes, budget.maxInitialTransferGzipBytes);
  if (safeguards.length < budget.minNamedSafeguards) {
    failures.push({ name: 'namedSafeguards', actual: safeguards.length, limit: budget.minNamedSafeguards });
  }

  if (scripts > 4) warnings.push({ name: 'scriptCount', actual: scripts, note: 'Multiple scripts are allowed, but should remain route-specific.' });
  if (initialTransferGzipBytes > budget.maxInitialTransferGzipBytes * 0.85) {
    warnings.push({ name: 'nearTransferBudget', actual: initialTransferGzipBytes, limit: budget.maxInitialTransferGzipBytes });
  }

  return {
    schema: W105_PERFORMANCE_SCHEMA,
    route: normalized,
    tier: budget.tier,
    budget,
    metrics: {
      htmlBytes,
      htmlGzipBytes,
      modulePreloads,
      stylesheets,
      scripts,
      initialTransferGzipBytes,
      safeguards
    },
    warnings,
    failures,
    ok: failures.length === 0
  };
}

export function buildW105PerformanceDebt(routes = []) {
  return [...routes]
    .map((route) => ({
      route: route.route,
      tier: route.tier,
      transferGzipBytes: route.metrics?.initialTransferGzipBytes || 0,
      modulePreloads: route.metrics?.modulePreloads || 0,
      htmlGzipBytes: route.metrics?.htmlGzipBytes || 0,
      failures: route.failures || [],
      warnings: route.warnings || []
    }))
    .sort((a, b) => b.transferGzipBytes - a.transferGzipBytes);
}
