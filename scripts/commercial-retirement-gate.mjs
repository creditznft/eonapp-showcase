#!/usr/bin/env node
/** Source-only check for the locked no-ads/no-rewards/no-trading launch boundary. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EONAPP_PRODUCT_SCOPE, getPublicProductScopeSummary } from '../assets/js/product/eonapp-product-scope.js';
import { getMonetizationPublicStatus } from '../assets/js/utils/monetization-decision-gate.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectCommercialRetirement({ writeArtifact = true } = {}) {
  const telegram = read('telegram.html');
  const telegramPage = read('assets/js/telegram-page.js');
  const rewards = read('assets/js/access/rewards-status-page.js');
  const market = read('assets/js/market/eon-market-page.js');
  const trade = read('trade.html');
  const decision = getMonetizationPublicStatus();
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };

  check('scope-locked', EONAPP_PRODUCT_SCOPE.releaseModel === 'local-first-ai-workspace-with-eon-city' && EONAPP_PRODUCT_SCOPE.retiredCapabilities.includes('rewarded-ads') && EONAPP_PRODUCT_SCOPE.retiredCapabilities.includes('trading-execution'), 'launch scope names ads/rewards/trading as retired');
  check('monetization-retired', decision.mode === 'retired' && decision.active === false && decision.rewardedAds === false && decision.callbackAcceptance === false, 'browser monetization stays retired and cannot accept a provider callback');
  check('telegram-no-provider-sdk', !/monetag|libtl\.com|reward-access|postback/i.test(telegram) && !/monetag|reward-access|postback/i.test(telegramPage), 'Telegram entry does not mention or load a reward/provider path');
  check('telegram-optional-use-only', /onboarding, help, updates and (?:explicit|deliberate) deep links/i.test(telegram) && /EonAppsBot/.test(telegram) && /EonApps/.test(telegram), 'Telegram remains optional onboarding/help/updates with explicit external clicks');
  check('legacy-reward-route-transparent', /Ads and reward mechanics are retired/.test(rewards) && !/future reviewed program|offer clearly expiring/i.test(rewards), 'old campaign route explains retirement without proposing a reward roadmap');
  check('preview-studio-nonfinancial', /not minted .*not a purchase .*no financial value/i.test(market) && /User seller marketplace: disabled/i.test(market), 'Preview Studio does not activate an NFT marketplace or commerce');
  check('research-not-trading', /not personal investment advice/i.test(trade) && /No orders/i.test(trade) && /not a prediction market/i.test(trade), 'research route remains non-financial and blocks trading/prediction execution');

  const report = Object.freeze({
    schema: 'eonapp.commercial-retirement-gate.v1',
    status: 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    scope: getPublicProductScopeSummary(),
    limitations: Object.freeze([
      'This source gate cannot revoke an already-configured external provider account or remove secrets from a hosting dashboard.',
      'This source gate does not prove real Telegram clicks, bot delivery, billing approval or a production deployment.',
      'Payment onboarding remains external preparation only; hosted checkout is not enabled by this gate.'
    ])
  });
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'commercial-retirement-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectCommercialRetirement();
  process.stdout.write(`Commercial retirement gate passed (${report.checkCount}/${report.checkCount}).\n`);
}
