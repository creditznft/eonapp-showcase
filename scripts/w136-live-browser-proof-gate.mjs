import fs from 'node:fs';
import path from 'node:path';
import {
  W136_BUTTON_AUDIT_GROUPS,
  W136_EONCITY_SCENARIO,
  W136_LIVE_PROOF_SCHEMA,
  W136_MAKEOVER_PRIORITIES,
  W136_PRODUCTION_ROUTES,
  W136_RUNTIME_ERROR_DENYLIST,
  W136_VIEWPORTS,
  normalizeAuditPath
} from '../assets/js/utils/w136-live-proof-contract.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const textFiles = ['index.html', 'chat.html', 'eon-browser.html', 'workbench.html', 'market.html', 'realm.html', 'support.html', 'telegram.html', 'creator-studio.html', 'trade.html', 'subscription.html', 'tools.html', 'trust.html', 'hustle.html'];

function htmlForRoute(routePath) {
  const route = normalizeAuditPath(routePath);
  if (route === '/') return 'index.html';
  if (route === '/vault') return 'vault.html';
  if (route === '/market') return 'market.html';
  if (route === '/realm') return 'realm.html';
  if (route === '/trade') return 'trade.html';
  if (route === '/subscription') return 'subscription.html';
  if (route === '/telegram') return 'telegram/index.html';
  return route.replace(/^\//, '').replace(/$/, '').endsWith('.html') ? route.replace(/^\//, '') : `${route.replace(/^\//, '')}.html`;
}

function extractLinks(file, html) {
  const rows = [];
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = match[1];
    const label = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
    rows.push({ file, href, label });
  }
  return rows;
}

const links = textFiles.filter(exists).flatMap((file) => extractLinks(file, read(file)));
const internalLinks = links.filter((link) => link.href.startsWith('/') && !link.href.startsWith('//'));
const missingInternalTargets = internalLinks.map((link) => {
  const clean = normalizeAuditPath(link.href);
  if (clean.startsWith('/u/')) return null;
  if (clean === '/build' || clean === '/create' || clean === '/setup' || clean === '/start') return null;
  const target = htmlForRoute(clean);
  if (exists(target) || exists(target.replace(/\.html$/, '/index.html'))) return null;
  return { ...link, normalized: clean, expected: target };
}).filter(Boolean);

const publicText = textFiles.filter(exists).map(read).join('\n');
const gateChecks = {
  schema: W136_LIVE_PROOF_SCHEMA,
  routeCount: W136_PRODUCTION_ROUTES.length,
  viewportCount: W136_VIEWPORTS.length,
  buttonGroupCount: W136_BUTTON_AUDIT_GROUPS.length,
  denylistCount: W136_RUNTIME_ERROR_DENYLIST.length,
  makeoverPriorityCount: W136_MAKEOVER_PRIORITIES.length,
  hasPlaywrightRunner: exists('scripts/w136-live-browser-proof.mjs') && /chromium\.launch/.test(read('scripts/w136-live-browser-proof.mjs')),
  hasProductionScript: /qa:w136-live-browser:production/.test(read('package.json')),
  hasLocalScript: /qa:w136-live-browser:local/.test(read('package.json')),
  routeFilesExist: W136_PRODUCTION_ROUTES.every((route) => exists(htmlForRoute(route.path)) || exists(htmlForRoute(route.path).replace(/\.html$/, '/index.html'))),
  telegramBothCovered: W136_PRODUCTION_ROUTES.some((route) => route.path === '/telegram') && W136_PRODUCTION_ROUTES.some((route) => route.path === '/telegram.html'),
  eonCityScenarioDefined: W136_EONCITY_SCENARIO.steps.includes('capture-console-material-warnings') && W136_EONCITY_SCENARIO.steps.includes('verify-hud-is-minimizable-or-compact'),
  missingInternalTargets: missingInternalTargets.length,
  publicInternalWaveLeakKnownPages: /W127 compatibility|W133|Support \/ Tools \/ Footer cleanup/.test(publicText),
  refundPolicyLinkKnownPages: />\s*Refund Policy\s*</i.test(publicText),
  minRouteMatrix: W136_PRODUCTION_ROUTES.length >= 16 && W136_VIEWPORTS.length === 3 && W136_BUTTON_AUDIT_GROUPS.length >= 6
};

const ok = gateChecks.hasPlaywrightRunner && gateChecks.hasProductionScript && gateChecks.hasLocalScript && gateChecks.routeFilesExist && gateChecks.telegramBothCovered && gateChecks.eonCityScenarioDefined && gateChecks.missingInternalTargets === 0 && !gateChecks.publicInternalWaveLeakKnownPages && !gateChecks.refundPolicyLinkKnownPages && gateChecks.minRouteMatrix;
const stats = {
  schema: W136_LIVE_PROOF_SCHEMA,
  ok,
  gateChecks,
  routeMatrix: W136_PRODUCTION_ROUTES.map((route) => ({ ...route, file: htmlForRoute(route.path), exists: exists(htmlForRoute(route.path)) || exists(htmlForRoute(route.path).replace(/\.html$/, '/index.html')) })),
  linkMatrix: { scannedFiles: textFiles.filter(exists), totalLinks: links.length, internalLinks: internalLinks.length, missingInternalTargets },
  nextWaveBoundaries: W136_MAKEOVER_PRIORITIES
};
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w136-route-button-matrix.json'), `${JSON.stringify(stats, null, 2)}\n`);
if (!ok) {
  console.error(JSON.stringify(stats, null, 2));
  process.exit(1);
}
console.log(`W136 live browser proof gate passed: ${W136_PRODUCTION_ROUTES.length} routes, ${links.length} links scanned`);
