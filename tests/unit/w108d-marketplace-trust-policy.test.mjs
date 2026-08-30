import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  MARKETPLACE_TRUST_RAILS,
  SELLER_POLICY_CHECKLIST,
  BUYER_SAFETY_CHECKLIST,
  buildMarketplaceListingTrust,
  buildMarketplaceEmptyState,
  summarizeSellerPolicy,
  validateSellerListingDraft
} from '../../assets/js/utils/marketplace-trust-policy.js';

const read = (file) => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
const TEAM_WALLET = '0x1111111111111111111111111111111111111111';

test('W108D policy copy separates preview NFTs, approvals and no-profit truth', () => {
  assert.match(MARKETPLACE_TRUST_RAILS.previewMeansLocal, /not on-chain mints/i);
  assert.match(MARKETPLACE_TRUST_RAILS.userApprovalRequired, /explicit user approval/i);
  assert.match(MARKETPLACE_TRUST_RAILS.noProfitPromise, /do not promise profit/i);
  assert.ok(SELLER_POLICY_CHECKLIST.length >= 5);
  assert.ok(BUYER_SAFETY_CHECKLIST.length >= 5);
});

test('W108D listing trust distinguishes official and user seller delivery boundaries', () => {
  const official = buildMarketplaceListingTrust({
    sellerWallet: TEAM_WALLET,
    settlementMode: 'offchain',
    metadata: { qualityTier: 'official' }
  }, { officialWallet: TEAM_WALLET });
  assert.equal(official.official, true);
  assert.equal(official.riskLevel, 'low');
  assert.match(official.deliveryLabel, /unique Vault utility NFT/i);

  const userMade = buildMarketplaceListingTrust({
    sellerWallet: '0x2222222222222222222222222222222222222222',
    settlementMode: 'offchain',
    metadata: { sellerReputation: { tier: 'watch' } }
  }, { officialWallet: TEAM_WALLET });
  assert.equal(userMade.official, false);
  assert.equal(userMade.riskLevel, 'watch');
  assert.match(userMade.deliveryLabel, /Seller delivery required/i);
});

test('W108D empty states are not broken and explain local catalog generation', () => {
  const filtered = buildMarketplaceEmptyState({ tab: 'ai', hasFilters: true });
  assert.match(filtered.title, /No matching listings/i);
  assert.match(filtered.body, /Clear filters/i);

  const mine = buildMarketplaceEmptyState({ tab: 'my', hasFilters: false });
  assert.match(mine.title, /seller shelf/i);
  assert.match(mine.body, /seller wallet/i);
});

test('W108D seller draft validation blocks weak utility and profit promises', () => {
  const bad = validateSellerListingDraft({
    title: 'Moon profit pack',
    description: 'Guaranteed resale profit for everyone.',
    priceEon: 99,
    settlementMode: 'offchain'
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.problems.some((item) => /profit|guaranteed/i.test(item)));

  const good = validateSellerListingDraft({
    title: 'Creator Workflow Bundle',
    description: 'Includes reusable scripts, thumbnail prompts, delivery checklist, and a Vault receipt manifest for a client content workflow.',
    priceEon: 49,
    settlementMode: 'offchain'
  });
  assert.equal(good.ok, true);
});

test('W108D marketplace UI ships commercial truth, seller checklist and buyer safety labels', () => {
  const html = read('marketplace.html');
  const controller = read('assets/js/marketplace-page.js');
  const css = read('assets/css/marketplace.css');
  const trust = read('trust.html');

  assert.match(html, /Commercial truth/);
  assert.match(html, /Beta marketplace, real utility, no hidden payment actions/);
  assert.match(html, /Seller policy beta/);
  assert.match(controller, /buildMarketplaceListingTrust/);
  assert.match(controller, /Purchase safety checklist/);
  assert.match(controller, /Seller policy check/);
  assert.match(controller, /First-visit catalogs are generated locally/);
  assert.match(css, /mp-commerce-truth/);
  assert.match(css, /mp-card-truth-row/);
  assert.match(trust, /Market, payments, and seller policy/);
  assert.match(trust, /manual-pay beta until escrow and dispute tooling are certified/i);
});


test('W108D seller policy summary is reusable for future seller onboarding', () => {
  const summary = summarizeSellerPolicy();
  assert.match(summary.headline, /Seller policy/i);
  assert.ok(summary.checklist.includes(SELLER_POLICY_CHECKLIST[0]));
});
