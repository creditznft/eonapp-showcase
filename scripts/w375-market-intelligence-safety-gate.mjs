#!/usr/bin/env node
/** W375 — source gate for the local-only Research Lab surface. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = Object.freeze([
  'trade.html',
  'assets/css/eon-trade-v2.css',
  'assets/js/trade/eon-trade-page.js',
  'assets/js/market-intelligence/market-intelligence-store.js',
  'assets/js/market-intelligence/market-intelligence-csv.js',
  'assets/js/market-intelligence/market-intelligence-analytics.js',
  'assets/js/market-intelligence/market-intelligence-forecast.js',
  'assets/js/market-intelligence/market-intelligence-chart.js',
  'assets/js/market-intelligence/market-intelligence-receipt.js',
  'assets/js/market-intelligence/market-intelligence-safety-contract.js',
  'tests/unit/w375-market-intelligence.test.mjs'
]);
const retiredActivePaths = Object.freeze([
  'signal.html',
  'assets/js/signal-page.js',
  'assets/js/enhanced-signal-page.js',
  'assets/js/trading-lab-page.js',
  'assets/js/trade/eon-trade-sandbox.js',
  'assets/js/trade/eon-trade-connector-readiness.js',
  'assets/js/utils/ai-trading-model-selector.js',
  'assets/js/utils/exchange-readonly-connectors.js',
  'assets/js/utils/live-trading-dashboard.js',
  'assets/js/utils/paper-trading-engine-w104.js',
  'assets/js/utils/secure-trade-relay.js',
  'assets/js/utils/trading-connectors.js',
  'assets/js/utils/trading-lab-engine.js',
  'assets/js/utils/trading-lab-store.js'
]);
const sourceFiles = Object.freeze([
  'assets/js/trade/eon-trade-page.js',
  'assets/js/market-intelligence/market-intelligence-store.js',
  'assets/js/market-intelligence/market-intelligence-csv.js',
  'assets/js/market-intelligence/market-intelligence-analytics.js',
  'assets/js/market-intelligence/market-intelligence-forecast.js',
  'assets/js/market-intelligence/market-intelligence-chart.js',
  'assets/js/market-intelligence/market-intelligence-receipt.js'
]);
const read = (relative, root = ROOT) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative, root = ROOT) => fs.existsSync(path.join(root, relative));

export function auditMarketIntelligenceSafety({ root = ROOT } = {}) {
  const checks = [];
  const add = (id, ok, detail) => checks.push({ id, ok: Boolean(ok), detail });
  for (const file of required) add(`required:${file}`, exists(file, root), exists(file, root) ? 'present' : 'missing');
  for (const file of retiredActivePaths) add(`retired-not-active:${file}`, !exists(file, root), !exists(file, root) ? 'archived or absent' : 'still active');

  const html = exists('trade.html', root) ? read('trade.html', root) : '';
  const routeContract = exists('config/route-contract.mjs', root) ? read('config/route-contract.mjs', root) : '';
  const page = exists('assets/js/trade/eon-trade-page.js', root) ? read('assets/js/trade/eon-trade-page.js', root) : '';
  const allSource = sourceFiles.filter((file) => exists(file, root)).map((file) => read(file, root)).join('\n');

  add('visible-product-name', /<h1[^>]*>Research Lab<\/h1>/.test(html) && /<title>Research Lab/.test(html), 'route visibly presents Research Lab');
  add('route-compatible', /from: '\/insights'.*expected: \['Research Lab'\]/.test(routeContract) && /from: '\/trade', to: '\/insights'/.test(routeContract), 'canonical Research Lab route and legacy trade redirect are present');
  add('manual-csv-only', /manual reference/i.test(html) && /Import your CSV/.test(html) && /user-imported CSV/i.test(allSource), 'only local user-provided data inputs');
  add('forecast-oracle-non-economic', /Scenario Studio/.test(html) && /no monetary stake, prize, payout, token, redemption, transfer or tradable contract/i.test(html), 'forecast surface is explicitly non-monetary and non-tradable');
  add('no-credential-field', !/type=["']password/i.test(html) && !/api\s*key|api\s*secret/i.test(html), 'no credential collection UI');
  add('no-network-client', !/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource/.test(allSource), 'no external network client in Research Lab');
  add('no-execution-path', !/placeOrder|createOrder|submitOrder|executeLive|exchangeSdk|brokerConnection:\s*true|orderTransmission:\s*true/.test(allSource), 'no broker or exchange order path');
  add('no-personal-advice-copy', /not personal investment advice/i.test(html) && /avoid personalised investment advice/i.test(page), 'research assistant copy forbids personal advice');
  add('local-export', /Export safety receipt/.test(html) && /Export local workspace/.test(html) && /downloadJson/.test(page), 'portable local receipt and workspace export');
  add('lean-handover-retirement-boundary', retiredActivePaths.every((file) => !exists(file, root)), 'retired trade routes/modules remain absent even though historic archive files are not packaged');
  const failures = checks.filter((check) => !check.ok);
  return {
    schema: 'eonapp.w375.research-lab-safety-gate.v1',
    generatedAt: new Date().toISOString(),
    ok: failures.length === 0,
    score: `${checks.length - failures.length}/${checks.length}`,
    boundary: { externalNetwork: false, liveExecution: false, economicIncentives: false, licensedDataRequiredBeforeActivation: true },
    checks,
    failures
  };
}

function main() {
  const report = auditMarketIntelligenceSafety();
  const outDir = path.join(ROOT, 'tmp');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'W375_MARKET_INTELLIGENCE_SAFETY_GATE.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ ok: report.ok, score: report.score, schema: report.schema, failures: report.failures.map((item) => item.id) }, null, 2));
  process.exitCode = report.ok ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
