import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const REPORT_DIR = path.join(ROOT, 'reports');
const MANIFEST_URL = pathToFileURL(path.join(ROOT, 'assets/js/utils/w108-route-certification.js')).href;
const { W108_CORE_ROUTES, W108_PERFORMANCE_BUDGETS, W108_USER_JOURNEYS } = await import(MANIFEST_URL);

const BLOCKED_HOME_FIRST_PAINT = [
  'telegram-growth-widget.js',
  'telegram-growth.css',
  'social-missions.css'
];

const GLOBAL_FORBIDDEN_STATIC_COPY = [
  'No items match your search',
  'âš¡',
  'Â©'
];

function readFile(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    return { ok: false, text: '', error: `Missing file: ${relativePath}` };
  }
  return { ok: true, text: fs.readFileSync(fullPath, 'utf8'), error: null };
}

function countNeedle(text, needle) {
  if (!needle) return 0;
  return (text.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
}

function checkRequiredSignals(route, html) {
  const findings = [];
  for (const signal of route.requiredSignals || []) {
    if (!html.toLowerCase().includes(String(signal).toLowerCase())) {
      findings.push({ level: 'error', kind: 'missing-required-signal', route: route.route, file: route.file, signal });
    }
  }
  return findings;
}

function checkHtmlBasics(route, html) {
  const findings = [];
  const basics = [
    ['title', /<title>[^<]{8,}<\/title>/i],
    ['meta-description', /<meta\b(?=[^>]*\bname=["']description["'])(?=[^>]*\bcontent=["'][^"']{40,}["'])[^>]*>/i],
    ['viewport', /<meta\b(?=[^>]*\bname=["']viewport["'])[^>]*>/i],
    ['main-landmark', /<main\b/i],
    ['h1', /<h1[\s>]/i]
  ];
  for (const [kind, regex] of basics) {
    if (!regex.test(html)) findings.push({ level: 'error', kind: `missing-${kind}`, route: route.route, file: route.file });
  }
  if (!/Content-Security-Policy/i.test(html)) {
    findings.push({ level: 'warn', kind: 'missing-inline-csp', route: route.route, file: route.file });
  }
  return findings;
}

function checkRouteSpecifics(route, html) {
  const findings = [];
  if (route.file === 'index.html') {
    for (const blocked of BLOCKED_HOME_FIRST_PAINT) {
      if (html.includes(blocked)) findings.push({ level: 'error', kind: 'home-first-paint-heavy-growth-module', route: route.route, file: route.file, blocked });
    }
    const duplicatePhraseCount = countNeedle(html, 'Talk instead of typing');
    if (duplicatePhraseCount > 1) findings.push({ level: 'error', kind: 'duplicate-home-marquee-copy', route: route.route, file: route.file, count: duplicatePhraseCount });
  }

  if (route.file === 'market.html') {
    if (!html.includes('starter drop')) findings.push({ level: 'error', kind: 'market-missing-starter-drop-copy', route: route.route, file: route.file });
    if (!/mk-items-grid--loading/.test(html)) findings.push({ level: 'warn', kind: 'market-missing-sized-loading-grid', route: route.route, file: route.file });
  }

  if (route.file === 'realm.html') {
    if (!html.includes('realm-flagship-shell.js')) findings.push({ level: 'error', kind: 'realm-missing-flagship-shell', route: route.route, file: route.file });
    if (!html.includes('eon-city-app.js')) findings.push({ level: 'error', kind: 'realm-missing-intent-loader', route: route.route, file: route.file });
  }

  if (route.file === 'trust.html') {
    if (!html.includes('Commercial actions stay labeled')) findings.push({ level: 'error', kind: 'trust-missing-commercial-truth', route: route.route, file: route.file });
    if (!html.includes('W108 certification')) findings.push({ level: 'error', kind: 'trust-missing-certification-panel', route: route.route, file: route.file });
  }

  return findings;
}

function checkGlobalForbiddenCopy(route, html) {
  const findings = [];
  for (const forbidden of GLOBAL_FORBIDDEN_STATIC_COPY) {
    if (html.includes(forbidden)) findings.push({ level: 'error', kind: 'forbidden-static-copy', route: route.route, file: route.file, forbidden });
  }
  return findings;
}

const findings = [];
const routes = [];
for (const route of W108_CORE_ROUTES) {
  const result = readFile(route.file);
  if (!result.ok) {
    findings.push({ level: 'error', kind: 'missing-route-file', route: route.route, file: route.file, message: result.error });
    continue;
  }
  const html = result.text;
  const routeFindings = [
    ...checkHtmlBasics(route, html),
    ...checkRequiredSignals(route, html),
    ...checkRouteSpecifics(route, html),
    ...checkGlobalForbiddenCopy(route, html)
  ];
  findings.push(...routeFindings);
  routes.push({
    route: route.route,
    file: route.file,
    label: route.label,
    priority: route.priority,
    status: routeFindings.some((item) => item.level === 'error') ? 'fail' : routeFindings.some((item) => item.level === 'warn') ? 'warn' : 'pass',
    firstImpression: route.firstImpression,
    performancePolicy: route.performancePolicy
  });
}

const errors = findings.filter((item) => item.level === 'error');
const warnings = findings.filter((item) => item.level === 'warn');
const report = {
  schema: 'eon.w108.final-certification-report.v1',
  generatedAt: new Date().toISOString(),
  root: ROOT,
  budgets: W108_PERFORMANCE_BUDGETS,
  journeys: W108_USER_JOURNEYS.map(([persona, start, finish, goal]) => ({ persona, start, finish, goal })),
  routeCount: W108_CORE_ROUTES.length,
  passedRoutes: routes.filter((route) => route.status === 'pass').length,
  warningRoutes: routes.filter((route) => route.status === 'warn').length,
  failedRoutes: routes.filter((route) => route.status === 'fail').length,
  errorCount: errors.length,
  warningCount: warnings.length,
  routes,
  findings
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(path.join(REPORT_DIR, 'W108E_ROUTE_CERTIFICATION.json'), `${JSON.stringify(report, null, 2)}\n`);

const markdown = [
  '# W108E Route Certification Report',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  `Routes checked: ${report.routeCount}`,
  `Passed routes: ${report.passedRoutes}`,
  `Routes with warnings: ${report.warningRoutes}`,
  `Failed routes: ${report.failedRoutes}`,
  `Errors: ${report.errorCount}`,
  `Warnings: ${report.warningCount}`,
  '',
  '## Performance budgets',
  '',
  `- Simple desktop target: ${W108_PERFORMANCE_BUDGETS.simplePageDesktopScore}`,
  `- Simple mobile target: ${W108_PERFORMANCE_BUDGETS.simplePageMobileScore}`,
  `- Heavy mobile minimum: ${W108_PERFORMANCE_BUDGETS.heavyPageMobileMinimum}`,
  `- CLS maximum: ${W108_PERFORMANCE_BUDGETS.cumulativeLayoutShiftMaximum}`,
  `- Console error budget: ${W108_PERFORMANCE_BUDGETS.consoleErrorBudget}`,
  '',
  '## Routes',
  '',
  ...routes.map((route) => `- ${route.status.toUpperCase()}: ${route.route} — ${route.label}`),
  '',
  '## User journeys',
  '',
  ...report.journeys.map((journey) => `- ${journey.persona}: ${journey.start} → ${journey.finish} — ${journey.goal}`),
  '',
  '## Findings',
  '',
  ...(findings.length ? findings.map((finding) => `- ${finding.level.toUpperCase()} [${finding.kind}] ${finding.route || ''} ${finding.file || ''} ${finding.signal || finding.blocked || finding.forbidden || finding.message || ''}`.trim()) : ['- No blocking findings.']),
  ''
].join('\n');
fs.writeFileSync(path.join(REPORT_DIR, 'W108E_ROUTE_CERTIFICATION.md'), markdown);

if (errors.length > 0) {
  console.error(`W108E certification failed with ${errors.length} error(s).`);
  for (const error of errors) console.error(`- [${error.kind}] ${error.route || ''} ${error.file || ''} ${error.signal || error.blocked || error.forbidden || error.message || ''}`.trim());
  process.exit(1);
}

console.log(`W108E certification passed: ${report.passedRoutes}/${report.routeCount} routes passed, ${warnings.length} warning(s).`);
