#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const marketHtml = read('market.html');
const marketPage = read('assets/js/market/eon-market-page.js');
const marketDrop = read('assets/js/market/market-private-drop.js');
const marketCss = read('assets/css/eon-market-v2.css');

const prehydratedCards = (marketHtml.match(/data-w131-prehydrated-starter=/g) || []).length;
const oldMarketBootstrap = /market-page-bootstrap\.js|assets\/js\/market-page\.js/.test(marketHtml);
const checks = [
  ['Market opens from a true empty state', /Create 4 original local previews/.test(marketPage) && /Start empty/.test(marketPage)],
  ['No prehydrated starter cards remain in public Market HTML', prehydratedCards === 0],
  ['Generation is explicit and user-triggered', /function generateCollection/.test(marketPage) && /getPrivateMarketDrop\(\{ regenerate: true, count: 4/.test(marketPage) && /userTriggered: true/.test(marketDrop)],
  ['Progressive reveal and reduced-motion completion exist', /function runProgressiveReveal/.test(marketPage) && /function prefersReducedMotion/.test(marketPage) && /prefers-reduced-motion/.test(marketCss)],
  ['Current Market does not boot legacy starter scripts', !oldMarketBootstrap && !/ensureMarketStarterDrop/.test(marketPage)],
  ['Private collections are local-only and non-financial', /localOnly: true/.test(marketDrop) && /notFinancialProduct: true/.test(marketDrop) && /publicListingAvailable: false/.test(marketDrop)],
  ['Legacy collection resume is explicit and non-destructive', /activatePrivateMarketResumeCandidate/.test(marketPage) && /explicitUserResume: true/.test(marketDrop) && /preservedLegacySource: true/.test(marketDrop)],
  ['Official commerce is visibly disabled', /Official commerce is not active/.test(marketPage) && /no user marketplace, purchase path, commission, payout, token, or trading surface/.test(marketPage)],
  ['No raw href="#" remains in public Market HTML', !/href=["']#["']/i.test(marketHtml)]
];

const failed = checks.filter(([, ok]) => !ok);
const stats = {
  schema: 'eonapp.w131.market-trust-proof.v2',
  supersededBy: 'W220 explicit local generation vertical slice',
  score: failed.length ? Math.max(0, Math.round(((checks.length - failed.length) / checks.length) * 100)) : 100,
  ok: failed.length === 0,
  prehydratedCards,
  checks: Object.fromEntries(checks)
};

fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w131-market-trust-proof-stats.json'), `${JSON.stringify(stats, null, 2)}\n`);

if (failed.length) {
  console.error('[W131] Current Market trust proof failed:');
  for (const [name] of failed) console.error(` - ${name}`);
  process.exit(1);
}
console.log(`[W131] Current Market trust proof passed (${stats.score}/100).`);
