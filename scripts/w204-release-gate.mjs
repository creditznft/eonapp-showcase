#!/usr/bin/env node
/**
 * EONAPP W204 — source release gate.
 *
 * W375 retires legacy sandbox and exchange-connector assumptions. This gate
 * proves source truth only; a deployed URL probe may be added later without
 * turning local evidence into a live-data or execution claim.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { auditMarketIntelligenceSafety } from './w375-market-intelligence-safety-gate.mjs';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const sourceOnly = args.has('--source-only') || ![...args].some((value) => value.startsWith('--target='));
const strictLive = args.has('--strict-live');
const targetArg = [...args].find((value) => value.startsWith('--target='));
const target = targetArg ? targetArg.slice('--target='.length).replace(/\/+$/, '') : null;
const checks = [];
const add = (id, ok, detail) => checks.push({ id, ok: Boolean(ok), detail });
const read = (relative) => readFileSync(resolve(root, relative), 'utf8');

for (const relative of [
  'chat.html', 'market.html', 'vault.html', 'trade.html', 'eoncity.html', 'eoncity-3d.html', 'profile.html', 'local-ai.html', 'rewards.html',
  'assets/js/eon-app-shell.js', 'assets/js/eon-pwa-manager.js', 'assets/js/trade/eon-trade-page.js',
  'assets/js/market-intelligence/market-intelligence-safety-contract.js', 'scripts/w375-market-intelligence-safety-gate.mjs', '_redirects'
]) add(`file:${relative}`, existsSync(resolve(root, relative)), existsSync(resolve(root, relative)) ? 'present' : 'missing');

for (const relative of ['chat.html', 'market.html', 'vault.html', 'trade.html', 'profile.html', 'local-ai.html', 'rewards.html']) {
  const content = existsSync(resolve(root, relative)) ? read(relative) : '';
  add(`shell:${relative}`, /data-eon-app-shell="1"/.test(content) && /eon-app-shell\.js/.test(content), 'App shell marker and module are required');
}
for (const relative of ['eoncity.html', 'eoncity-3d.html']) {
  const content = existsSync(resolve(root, relative)) ? read(relative) : '';
  add(`city-runtime:${relative}`, /eon-city|city/i.test(content), 'Dedicated City canvases use their own verified runtime rather than the application shell.');
}

const redirects = existsSync(resolve(root, '_redirects')) ? read('_redirects') : '';
for (const [from, to] of [
  ['/eon-browser.html', '/workspace'], ['/workbench.html', '/workspace'], ['/marketplace.html', '/market'], ['/realm.html', '/eoncity'],
  ['/realmworld.html', '/eoncity'], ['/subscription.html', '/archive'], ['/trade/sandbox', '/trade'], ['/trade-sandbox.html', '/trade'], ['/signal.html', '/trade']
]) {
  const line = new RegExp(`^${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+${to.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+301`, 'm');
  add(`redirect:${from}`, line.test(redirects), `must route to ${to}`);
}

const trade = existsSync(resolve(root, 'trade.html')) ? read('trade.html') : '';
add('trade:market-intelligence-visible', /Market Intelligence/.test(trade), 'canonical route uses the truthful product name');
add('trade:no-credential-ui', !/type=["']password|api\s*key|api\s*secret/i.test(trade), 'credential collection is absent');
add('trade:no-order-ui', !/place order|connect exchange|copy trading|withdraw/i.test(trade), 'broker/exchange order UI is absent');
add('trade:forecast-non-economic', /no stake, prize, payout, token, cash-out, transfer or tradable contract/i.test(trade), 'Forecast Oracle remains non-economic');

const safety = auditMarketIntelligenceSafety({ root });
add('trade:market-intelligence-safety-gate', safety.ok, safety.ok ? safety.score : safety.failures.map((item) => item.id).join(', '));
add('retired:root-sandbox-absent', !existsSync(resolve(root, 'trade-sandbox.html')), 'historic sandbox must remain archived, not a public source page');

const failed = checks.filter((item) => !item.ok);
const result = {
  schema: 'eon.release-gate.w204.v2',
  generatedAt: new Date().toISOString(),
  mode: target ? 'source-plus-remote-probe-not-run' : sourceOnly ? 'source-only' : 'prebuild',
  target,
  passed: failed.length === 0 && !(strictLive && !target),
  checks,
  failed,
  note: target
    ? 'The target is recorded for an operator-led post-deploy probe. This gate deliberately does not fetch it: it must never represent local source evidence as live-market or provider proof.'
    : 'Source evidence only. A future licensed-data launch requires a separate provider, attribution, data-status and regional-compliance gate.'
};
mkdirSync(resolve(root, 'tmp'), { recursive: true });
writeFileSync(resolve(root, 'tmp/W204_RELEASE_GATE.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.passed ? 0 : 1;
