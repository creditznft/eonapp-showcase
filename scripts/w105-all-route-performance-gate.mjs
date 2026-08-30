import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {
  W105_PERFORMANCE_SCHEMA,
  buildW105PerformanceDebt,
  buildW105RouteSummary
} from '../assets/js/utils/w105-performance-budget.js';

const cwd = process.cwd();
const distDir = path.join(cwd, 'dist');
const auditDir = path.join(cwd, 'CodexAuditPack', 'W105_PERFORMANCE');
const outputJson = path.join(auditDir, 'W105_ALL_ROUTE_PERFORMANCE_GATE.json');
const outputRoutesJson = path.join(auditDir, 'W105_ROUTE_BUDGETS.json');
const outputFinalJson = path.join(auditDir, 'W105_FINAL_VERIFICATION.json');

const ROUTE_ALIASES = new Map([
  ['/', 'index.html'],
  ['/index', 'index.html'],
  ['/index.html', 'index.html'],
  ['/chat', 'chat.html'],
  ['/vault', 'vault.html'],
  ['/market', 'market.html'],
  ['/marketplace', 'marketplace.html'],
  ['/realm', 'realm.html'],
  ['/realmworld', 'realmworld.html'],
  ['/trade', 'trade.html'],
  ['/signal', 'trade.html'],
  ['/subscription', 'subscription.html'],
  ['/onboarding', 'onboarding.html'],
  ['/creator-studio', 'creator-studio.html'],
  ['/workbench', 'workbench.html'],
  ['/tools', 'tools.html'],
  ['/eon-browser', 'eon-browser.html'],
  ['/browser', 'eon-browser.html'],
  ['/reward-access', 'reward-access.html'],
  ['/automate', 'automation-studio.html'],
  ['/automation', 'automation-studio.html'],
  ['/build', 'workbench.html'],
  ['/builder', 'code-maker.html'],
  ['/create', 'creator-studio.html']
]);

function read(file) {
  return fs.readFileSync(path.join(cwd, file), 'utf8');
}

function gzipSize(buffer) {
  return zlib.gzipSync(buffer).length;
}

function safeRunCollectRoutes() {
  execFileSync(process.execPath, ['scripts/collect-lighthouse-routes.mjs'], {
    cwd,
    stdio: 'pipe',
    env: {
      ...process.env,
      EON_FORCE_NO_GIT: '1'
    }
  });
  return JSON.parse(read('CodexAuditPack/lighthouse-routes.json'));
}

function getAttr(tag, attr) {
  const match = tag.match(new RegExp(`\\b${attr}=["']([^"']+)["']`, 'i'));
  return match ? match[1] : '';
}

function normalizeAssetRef(value) {
  if (!value || /^(?:https?:|data:|mailto:|tel:|#)/i.test(value)) return null;
  const stripped = value.split('#')[0].split('?')[0];
  if (!stripped) return null;
  return stripped.replace(/^\/+/, '');
}

function routeToDistFile(row) {
  const route = String(row?.route || '/').split('#')[0].split('?')[0] || '/';
  const alias = ROUTE_ALIASES.get(route.replace(/\/$/, '') || '/');
  if (alias && fs.existsSync(path.join(distDir, alias))) return alias;

  const source = String(row?.source || '').replace(/^dist\//, '');
  if (source && source !== 'explicit-alias' && source.toLowerCase().endsWith('.html') && fs.existsSync(path.join(distDir, source))) {
    return source;
  }

  const clean = route.replace(/^\/+/, '').replace(/\/$/, '');
  const candidates = clean
    ? [`${clean}.html`, `${clean}/index.html`]
    : ['index.html'];
  return candidates.find((candidate) => fs.existsSync(path.join(distDir, candidate))) || null;
}

function parseRouteAssets(html) {
  const modulePreloads = [];
  const stylesheets = [];
  const scripts = [];
  const linkTags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of linkTags) {
    const rel = getAttr(tag, 'rel').toLowerCase();
    const href = normalizeAssetRef(getAttr(tag, 'href'));
    if (!href) continue;
    if (rel.includes('modulepreload')) modulePreloads.push(href);
    if (rel.includes('stylesheet')) stylesheets.push(href);
  }
  const scriptTags = html.match(/<script\b[^>]*\bsrc=[^>]*>/gi) || [];
  for (const tag of scriptTags) {
    const src = normalizeAssetRef(getAttr(tag, 'src'));
    if (src) scripts.push(src);
  }
  return { modulePreloads, stylesheets, scripts };
}

function assetTransferGzip(assetRefs) {
  const unique = new Set(assetRefs.filter(Boolean));
  let total = 0;
  const missing = [];
  const details = [];
  for (const ref of unique) {
    const file = path.join(distDir, ref);
    if (!fs.existsSync(file)) {
      missing.push(ref);
      continue;
    }
    const raw = fs.readFileSync(file);
    const gz = gzipSize(raw);
    total += gz;
    details.push({ ref, bytes: raw.length, gzipBytes: gz });
  }
  details.sort((a, b) => b.gzipBytes - a.gzipBytes);
  return { total, missing, details };
}

function analyzeRoute(row) {
  const file = routeToDistFile(row);
  if (!file) {
    return {
      schema: W105_PERFORMANCE_SCHEMA,
      route: row.route,
      source: row.source,
      ok: false,
      failures: [{ name: 'missingDistRoute', actual: row.route, limit: 'resolvable dist HTML route' }],
      warnings: [],
      metrics: { htmlBytes: 0, htmlGzipBytes: 0, modulePreloads: 0, stylesheets: 0, scripts: 0, initialTransferGzipBytes: 0, safeguards: [] }
    };
  }
  const htmlPath = path.join(distDir, file);
  const raw = fs.readFileSync(htmlPath);
  const html = raw.toString('utf8');
  const assets = parseRouteAssets(html);
  const transfer = assetTransferGzip([...assets.modulePreloads, ...assets.stylesheets, ...assets.scripts]);
  const summary = buildW105RouteSummary(row.route, {
    htmlBytes: raw.length,
    htmlGzipBytes: gzipSize(raw),
    modulePreloads: assets.modulePreloads.length,
    stylesheets: assets.stylesheets.length,
    scripts: assets.scripts.length,
    initialTransferGzipBytes: gzipSize(raw) + transfer.total,
    safeguards: [
      'all-route-inventory',
      'desktop-lhci-route-config',
      'mobile-lhci-route-config',
      'static-html-transfer-budget',
      'modulepreload-filter',
      'cls-hard-cap',
      'w105-debt-ledger',
      'no-live-secret-assets'
    ]
  });
  return {
    ...summary,
    source: row.source,
    distFile: file,
    assets: {
      modulePreloads: assets.modulePreloads,
      stylesheets: assets.stylesheets,
      scripts: assets.scripts,
      missing: transfer.missing,
      largest: transfer.details.slice(0, 8)
    },
    failures: [...summary.failures, ...transfer.missing.map((ref) => ({ name: 'missingAsset', actual: ref, limit: 'asset exists in dist' }))],
    ok: summary.failures.length === 0 && transfer.missing.length === 0
  };
}

function assertSourceChecks(routesPayload, routeReports) {
  const lighthouseDesktop = read('.lighthouserc.full.cjs');
  const lighthouseMobile = read('.lighthouserc.full.mobile.cjs');
  const routeCollector = read('scripts/collect-lighthouse-routes.mjs');
  const viteConfig = read('vite.config.mjs');
  const packageJson = JSON.parse(read('package.json'));
  const checks = {
    routeCollectorWorksWithoutGit: routesPayload.schema === 'eon.lighthouse.routes.v2' && routesPayload.branch === 'no-git-archive',
    allRouteInventoryLargeEnough: routesPayload.routeCount >= 60,
    desktopLighthouseUsesDynamicRoutes: lighthouseDesktop.includes('lighthouse-routes.json') && lighthouseDesktop.includes('startServerCommand'),
    mobileLighthouseUsesDynamicRoutes: lighthouseMobile.includes('lighthouse-routes.json') && lighthouseMobile.includes("preset: 'mobile'"),
    desktopClsHardCapPresent: lighthouseDesktop.includes('cumulative-layout-shift') && lighthouseDesktop.includes('0.15'),
    mobileClsHardCapPresent: lighthouseMobile.includes('cumulative-layout-shift') && lighthouseMobile.includes('0.15'),
    routeCollectorNoGitFallbackPresent: routeCollector.includes('safeGit') && routeCollector.includes('no-git-archive'),
    viteModulePreloadFilterPresent: viteConfig.includes('modulePreload') && viteConfig.includes('resolveDependencies') && viteConfig.includes('W105'),
    w105BudgetRuntimePresent: fs.existsSync(path.join(cwd, 'assets/js/utils/w105-performance-budget.js')),
    w105UnitTestPresent: fs.existsSync(path.join(cwd, 'tests/unit/w105-performance-budget.test.mjs')),
    w105PackageScriptPresent: String(packageJson.scripts?.['qa:w105-performance'] || '').includes('w105-all-route-performance-gate'),
    noRouteBudgetFailures: routeReports.every((route) => route.ok),
    noMissingAssets: routeReports.every((route) => (route.assets?.missing || []).length === 0),
    routeBudgetsCoverEveryRoute: routeReports.length === routesPayload.routeCount,
    noLegacyArchiveReintroduced: !fs.existsSync(path.join(cwd, 'legacy-archive')),
    noPlaintextTradingSecretsInDist: !/exchangeSecret|apiSecret|privateKey/i.test(read('dist/trade.html'))
  };
  return checks;
}

fs.mkdirSync(auditDir, { recursive: true });
const routesPayload = safeRunCollectRoutes();
const routeReports = routesPayload.routes.map(analyzeRoute);
const checks = assertSourceChecks(routesPayload, routeReports);
const debt = buildW105PerformanceDebt(routeReports);
const failures = [
  ...Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => ({ kind: 'source-check', name })),
  ...routeReports.flatMap((route) => route.ok ? [] : route.failures.map((failure) => ({ kind: 'route-budget', route: route.route, ...failure })))
];
const report = {
  schema: W105_PERFORMANCE_SCHEMA,
  ok: failures.length === 0,
  generatedAt: new Date().toISOString(),
  status: 'static all-route performance gate; Lighthouse browser certification remains W105 final proof',
  routeCount: routesPayload.routeCount,
  sourceChecks: checks,
  failures,
  warnings: routeReports.flatMap((route) => (route.warnings || []).map((warning) => ({ route: route.route, ...warning }))),
  debtTop10: debt.slice(0, 10),
  maxModulePreloads: Math.max(...routeReports.map((route) => route.metrics.modulePreloads)),
  maxInitialTransferGzipBytes: Math.max(...routeReports.map((route) => route.metrics.initialTransferGzipBytes)),
  routeBudgetOutput: path.relative(cwd, outputRoutesJson)
};
fs.writeFileSync(outputRoutesJson, `${JSON.stringify({ schema: `${W105_PERFORMANCE_SCHEMA}.routes`, generatedAt: report.generatedAt, routes: routeReports, debt }, null, 2)}\n`);
fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`);
const smartContractsDir = path.join(cwd, 'Smart Contracts');
let smartContractFileCount = 0;
if (fs.existsSync(smartContractsDir)) {
  const stack = [smartContractsDir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) smartContractFileCount += 1;
    }
  }
}
fs.writeFileSync(outputFinalJson, `${JSON.stringify({
  schema: `${W105_PERFORMANCE_SCHEMA}.final`,
  generatedAt: report.generatedAt,
  ok: report.ok,
  scores: { w105PerformanceGate: report.ok ? 'passed' : 'failed' },
  routeCount: report.routeCount,
  smartContracts: { files: smartContractFileCount },
  evidenceFiles: {
    allRoutePerformanceGate: path.relative(cwd, outputJson),
    routeBudgets: path.relative(cwd, outputRoutesJson)
  },
  warnings: report.warnings.length
}, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
