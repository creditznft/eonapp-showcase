import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildCuratedMarketplacePreview,
  buildContractTrustModel,
  buildLootboxDisclosureModel,
  formatLootboxOdds,
  getW101NftDiversityDescriptors,
  isLikelyEvmAddress
} from '../../assets/js/utils/marketplace-w101-polish.js';
import {
  LOOTBOX_TIERS,
  LOOTBOX_REWARD_POOL,
  buildLootboxNftEnvelope
} from '../../assets/js/utils/lootbox-marketplace.js';
import { EON_CONTRACTS, EON_NETWORK } from '../../assets/js/utils/contracts-config.js';

const ROOT = path.resolve(process.cwd());
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

test('W101 curated preview is deterministic and visually varied', () => {
  const descriptors = getW101NftDiversityDescriptors();
  const previews = descriptors.map((descriptor) => buildCuratedMarketplacePreview({
    listingId: descriptor.id,
    title: descriptor.title,
    collectionType: descriptor.collectionType,
    rarityTier: descriptor.rarityTier,
    metadata: descriptor.collectionType === 'lootbox' ? { productKind: 'lootbox-nft' } : {}
  }));
  assert.equal(descriptors.length, 12);
  assert.deepEqual(previews[0], buildCuratedMarketplacePreview({
    listingId: descriptors[0].id,
    title: descriptors[0].title,
    collectionType: descriptors[0].collectionType,
    rarityTier: descriptors[0].rarityTier
  }));
  assert.ok(new Set(previews.map((preview) => `${preview.key}:${preview.pattern}:${preview.icon}`)).size >= 8);
  assert.ok(new Set(descriptors.map((descriptor) => descriptor.composition)).size >= 10);
  assert.ok(new Set(descriptors.map((descriptor) => descriptor.palette)).size >= 10);
  assert.ok(new Set(descriptors.map((descriptor) => descriptor.motion)).size >= 10);
  assert.ok(new Set(descriptors.map((descriptor) => descriptor.utilityCategory)).size >= 8);
});

test('W101 lootbox odds are human-readable and total 100 percent', () => {
  for (const [tier, config] of Object.entries(LOOTBOX_TIERS)) {
    const rows = formatLootboxOdds(config.odds);
    const total = Number(rows.reduce((sum, row) => sum + row.percentage, 0).toFixed(2));
    assert.equal(total, 100, `${tier} odds must total 100%`);
    assert.ok(rows.every((row) => row.percentageLabel.endsWith('%')));
    assert.ok(rows.every((row) => row.percentage >= 0));
  }
});

test('W101 lootbox disclosure shows utility pool, consumption, fairness and no-profit truth', () => {
  const lootbox = buildLootboxNftEnvelope({ tier: 'genesis', owner: 'test-owner', seed: 'w101-disclosure' });
  const disclosure = buildLootboxDisclosureModel(lootbox, LOOTBOX_REWARD_POOL);
  assert.equal(disclosure.rolls, 3);
  assert.equal(disclosure.oddsTotal, 100);
  assert.equal(disclosure.rewardPool.length, LOOTBOX_REWARD_POOL.length);
  assert.match(disclosure.openRule, /consumes the sealed box/i);
  assert.match(disclosure.fairnessRule, /duplicate protection/i);
  assert.match(disclosure.safetyCopy, /no cash prize/i);
  assert.match(disclosure.safetyCopy, /no guaranteed resale value/i);
  assert.match(disclosure.safetyCopy, /no .*profit promise/i);
});

test('W101 contract trust model distinguishes configured, correct and wrong networks', () => {
  const configured = buildContractTrustModel({ network: EON_NETWORK, contracts: EON_CONTRACTS });
  assert.equal(configured.network.status, 'wallet-not-connected');
  assert.equal(configured.contracts.length, 3);
  assert.ok(configured.contracts.every((contract) => contract.status === 'source-verified'));
  assert.ok(configured.contracts.every((contract) => contract.explorerUrl.startsWith('https://polygonscan.com/address/')));
  assert.ok(Object.values(EON_CONTRACTS).every((address) => isLikelyEvmAddress(address)));

  const correct = buildContractTrustModel({ network: EON_NETWORK, contracts: EON_CONTRACTS, currentChainId: '0x89' });
  assert.equal(correct.network.status, 'verified-network');
  assert.equal(correct.network.match, true);

  const wrong = buildContractTrustModel({ network: EON_NETWORK, contracts: EON_CONTRACTS, currentChainId: '0x1' });
  assert.equal(wrong.network.status, 'wrong-network');
  assert.equal(wrong.network.match, false);
  assert.match(wrong.network.statusLabel, /switch to Polygon Mainnet/i);

  const unavailable = buildContractTrustModel({ network: EON_NETWORK, contracts: { NFT_MARKETPLACE: '', REALM_LAND: 'bad', RELIC_NFT: null } });
  assert.ok(unavailable.contracts.every((contract) => contract.status === 'unavailable'));
});

test('W101 marketplace HTML ships useful skeletons, hidden create form and no raw loading copy', () => {
  const html = read('marketplace.html');
  assert.equal((html.match(/mp-skeleton-card/g) || []).length, 6);
  assert.match(html, /id="mp-create-panel"[^>]*mp-create-hidden|class="mp-panel mp-create-hidden" id="mp-create-panel"/);
  assert.match(html, /id="mp-contract-trust-center"/);
  assert.match(html, /Choose the route before you buy/);
  assert.doesNotMatch(html, />\s*Loading(?:\.{3}|…)?\s*</i);
  assert.doesNotMatch(html, /loading\.\.\./i);
});

test('W101 marketplace controller uses curated previews, trust states and readable lootbox disclosure', () => {
  const controller = read('assets/js/marketplace-page.js');
  assert.match(controller, /buildCuratedMarketplacePreview/);
  assert.match(controller, /buildContractTrustModel/);
  assert.match(controller, /buildLootboxDisclosureModel/);
  assert.match(controller, /Odds visible before opening/);
  assert.match(controller, /mp-empty-state/);
  assert.match(controller, /<strong class="mp-lootbox-pool-label">Possible utility reward pool<\/strong>/);
  assert.match(controller, /<section class="mp-empty-state"[\s\S]*?`, 'ui'\)/);
  assert.doesNotMatch(controller, /Loading preview|Preview on interaction|Loading shared AI readiness/i);
});

test('W101 lootbox opening modal no longer exposes raw JSON odds', () => {
  const source = read('assets/js/utils/lootbox-opening-ui.js');
  assert.match(source, /eon-lootbox-odds-table/);
  assert.match(source, /Possible utility reward pool/);
  assert.match(source, /buildLootboxDisclosureModel/);
  assert.doesNotMatch(source, /JSON\.stringify\(lootbox\.odds/);
});


test('W101 reward page allows the official Telegram WebApp bootstrap in CSP', () => {
  const html = read('reward-access.html');
  assert.match(html, /script-src[^"]*https:\/\/telegram\.org/);
  assert.match(html, /<script src="https:\/\/telegram\.org\/js\/telegram-web-app\.js" defer><\/script>/);
});

test('W101 CSS contains responsive trust, preview, skeleton and disclosure systems', () => {
  const css = read('assets/css/marketplace.css');
  for (const selector of [
    '.mp-settlement-center',
    '.mp-contract-grid',
    '.mp-curated-preview',
    '.mp-skeleton-card',
    '.mp-lootbox-card-disclosure',
    '.mp-lootbox-disclosure',
    '.mp-empty-state'
  ]) assert.ok(css.includes(selector), `missing ${selector}`);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.mp-contract-routing \{ display: block; \}/);
  assert.match(css, /prefers-reduced-motion/);
});
