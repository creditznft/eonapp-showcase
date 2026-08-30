#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  COMPATIBILITY_ROUTES,
  HOME_REDIRECT,
  ROUTE_CONTRACT_VERSION,
  PRIMARY_APP_ROUTES
} from '../config/route-contract.mjs';

const root = process.cwd();
const blockers = [];
const warnings = [];
const requiredFiles = [
  'package.json', '404.html', 'offline.html',
  '_headers', '_redirects', 'robots.txt', 'sitemap.xml', 'manifest.webmanifest', 'sw.js',
  '.github/workflows/deploy.yml', 'config/route-contract.mjs'
];
const criticalPages = [
  'chat.html', 'projects.html', 'library.html', 'workspace.html', 'eoncity.html', 'eoncity-lite.html', 'eoncity-3d.html', 'eoncity-play.html',
  'market.html', 'trade.html', 'automations.html', 'profile.html', 'vault.html', 'local-ai.html', 'realm-studio.html'
];
const shareProtocolFiles = [
  'referral.html', 'assets/js/utils/signed-share-link.js', 'assets/js/utils/share-attribution.js',
  'assets/js/utils/share-performance.js', 'assets/js/utils/user-approved-social-scheduler.js'
];
const prohibitedCommercialFunctions = [
  'functions/api/social',
  'functions/api/referrals',
  'functions/api/payments',
  'functions/api/nowpayments',
  'functions/api/token',
  'functions/api/monetag'
];
const requiredChatCompatibilityRedirects = COMPATIBILITY_ROUTES.filter((route) => route.id === 'chat-legacy' || route.id === 'chat-html-legacy');

const exists = (rel) => fs.existsSync(path.join(root, rel));
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const verifyChatCompatibilityRedirects = (redirects, label) => {
  for (const route of requiredChatCompatibilityRedirects) {
    const declaration = `${route.from} ${route.to} ${route.status}`;
    if (!redirects.includes(declaration)) blockers.push(`${label} chat compatibility redirect missing: ${declaration}`);
  }
};

for (const rel of requiredFiles) if (!exists(rel)) blockers.push(`required launch file missing: ${rel}`);
if (!['vite.config.js', 'vite.config.mjs', 'vite.config.ts'].some(exists)) blockers.push('Vite config missing');
for (const rel of criticalPages) if (!exists(rel)) blockers.push(`critical app surface missing: ${rel}`);
for (const rel of shareProtocolFiles) if (!exists(rel)) blockers.push(`signed-invite launch component missing: ${rel}`);

if (exists('package.json')) {
  const pkg = JSON.parse(read('package.json'));
  for (const script of ['build', 'test:unit', 'lint', 'smoke:build', 'qa:w228-ceo-red-team']) {
    if (!pkg.scripts?.[script]) blockers.push(`package script missing: ${script}`);
  }
}
if (exists('_headers')) {
  const headers = read('_headers');
  if (!/Content-Security-Policy/i.test(headers)) blockers.push('Content-Security-Policy missing from _headers');
  if (!/X-Content-Type-Options/i.test(headers)) warnings.push('X-Content-Type-Options missing from _headers');
}
if (exists('_redirects')) {
  const redirects = read('_redirects');
  if (!/\/r\/\*/.test(redirects) && !/\/r\s/.test(redirects)) blockers.push('signed invite route /r is missing from _redirects');
  verifyChatCompatibilityRedirects(redirects, 'source');
  if (Number(HOME_REDIRECT.status) >= 300 && !redirects.includes(`${HOME_REDIRECT.from} ${HOME_REDIRECT.to} ${HOME_REDIRECT.status}`)) {
    blockers.push(`home route contract missing from _redirects: ${HOME_REDIRECT.from} -> ${HOME_REDIRECT.to}`);
  }
}
if (exists('assets/js/utils/signed-share-link.js')) {
  const source = read('assets/js/utils/signed-share-link.js');
  for (const marker of ['eon.share-link.v1', 'normalizeDestination', 'deriveMissionCode', 'signSharePayload']) {
    if (!source.includes(marker)) blockers.push(`signed-invite protocol marker missing: ${marker}`);
  }
}
for (const rel of prohibitedCommercialFunctions) {
  if (exists(rel)) blockers.push(`inactive commercial handler must not be deploy-discovered: ${rel}`);
}
for (const rel of ['functions/api/rewards/index.js', 'functions/api/rewards/launch.js', 'functions/api/rewards/postback.js']) {
  if (!exists(rel)) blockers.push(`RT98 MyLead Reward Center authority missing: ${rel}`);
}
if (exists('dist')) {
  // chat.html is retained as a source compatibility document but is intentionally
  // not emitted. The canonical root owns chat and the edge redirects above keep
  // /chat and /chat.html inbound-compatible without shipping duplicate UI.
  const requiredDist = ['_redirects', '_headers', 'sw.js', 'manifest.webmanifest'];
  for (const rel of requiredDist) if (!exists(path.join('dist', rel))) blockers.push(`dist/${rel} missing after build`);
  if (exists(path.join('dist', '_redirects'))) {
    const redirects = read(path.join('dist', '_redirects'));
    verifyChatCompatibilityRedirects(redirects, 'dist');
    if (Number(HOME_REDIRECT.status) >= 300 && !redirects.includes(`${HOME_REDIRECT.from} ${HOME_REDIRECT.to} ${HOME_REDIRECT.status}`)) {
      blockers.push(`dist home redirect missing: ${HOME_REDIRECT.from} -> ${HOME_REDIRECT.to}`);
    }
  }
  if (Number(HOME_REDIRECT.status) < 300 && !exists(path.join('dist', 'index.html'))) {
    blockers.push('dist/index.html missing for canonical root EONBOT home');
  }
} else {
  warnings.push('dist/ not present; run npm run build before deploy');
}

const result = {
  schema: 'eon.launch-readiness.v3',
  routeContract: ROUTE_CONTRACT_VERSION,
  canonicalHome: HOME_REDIRECT,
  primaryRouteCount: PRIMARY_APP_ROUTES.length,
  commercialStatus: exists('assets/js/billing/eon-dodo-live-runtime.js') ? 'dodo-live-server-handlers-ready-rollout-env-controlled' : 'disabled-no-active-server-handlers',
  signedInviteStatus: 'local-signed-context-no-tracking-no-reward-no-auto-posting',
  checkedAt: new Date().toISOString(),
  blockers,
  warnings,
  status: blockers.length ? 'FAIL' : 'PASS'
};
console.log(JSON.stringify(result, null, 2));
if (blockers.length) process.exit(1);
