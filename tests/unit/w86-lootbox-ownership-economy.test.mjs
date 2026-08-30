import test from 'node:test';
import assert from 'node:assert/strict';

import { DIRECT_EVM_RECIPIENT } from '../../assets/js/utils/direct-evm-config.js';
import {
  LOOTBOX_MARKET_POLICY,
  buildLootboxNftEnvelope,
  createUnopenedLootboxListing,
  openLootboxNft,
  revealLootboxLuckScore,
  buildLuckAdjustedOdds,
  buildDuplicateMergeOffer,
  scoreLootboxMarketSystem
} from '../../assets/js/utils/lootbox-marketplace.js';
import { buildLootboxVisualBundle } from '../../assets/js/utils/lootbox-nft-visuals.js';
import { buildAiUpgradeMarketCatalog, scoreAiUpgradeMarketCatalog } from '../../assets/js/utils/ai-upgrade-market-catalog.js';
import {
  NFT_UTILITY_OWNERSHIP_POLICY,
  buildUtilityNftRecord,
  resolveUtilityAccessFromNft,
  scoreNftUtilityOwnershipPolicy
} from '../../assets/js/utils/nft-ownership-utility.js';

test('W86 lootboxes are unique internal sealed items and cannot be minted to mainnet', () => {
  const a = buildLootboxNftEnvelope({ tier: 'genesis', owner: 'alice', seed: 'box-a' });
  const b = buildLootboxNftEnvelope({ tier: 'genesis', owner: 'alice', seed: 'box-b' });
  assert.notEqual(a.id, b.id);
  assert.notEqual(a.designDna.uniquenessKey, b.designDna.uniquenessKey);
  assert.equal(a.internalOnly, true);
  assert.equal(a.canMintLootboxToMainnet, false);
  assert.equal(LOOTBOX_MARKET_POLICY.lootboxesCanMintToMainnet, false);
  const visual = buildLootboxVisualBundle(a);
  assert.ok(visual.svg.includes('Unopened NFT'));
  assert.ok(visual.svg.includes('internal'));
});

test('W86 unopened lootboxes can list internally and sales route to Admin 1 launch wallet', () => {
  const lootbox = buildLootboxNftEnvelope({ tier: 'neon', owner: 'seller', seed: 'listing' });
  const listing = createUnopenedLootboxListing({ lootbox, sellerId: 'seller', priceUsd: 39 });
  assert.equal(listing.ok, true);
  assert.equal(listing.status, 'listed-unopened');
  assert.equal(listing.internalTransferOnly, true);
  assert.equal(listing.canMintLootboxToMainnet, false);
  assert.equal(listing.paymentReceiverWallet, DIRECT_EVM_RECIPIENT);
  assert.equal(listing.cashSplitsEnabled, false);
});

test('W86 opening consumes the lootbox, reveals hidden luck score, and creates rewards only', () => {
  const lootbox = buildLootboxNftEnvelope({ tier: 'architect', seed: 'open-consume' });
  assert.equal(Object.hasOwn(lootbox, 'hiddenLuckyScore'), false);
  const luck = revealLootboxLuckScore(lootbox, { openSeed: 'user-open' });
  assert.ok(luck.hiddenLuckyScore >= 1 && luck.hiddenLuckyScore <= 100);
  const odds = buildLuckAdjustedOdds(lootbox, luck);
  assert.equal(odds.disclosedBaseOddsRemainVisible, true);
  const result = openLootboxNft(lootbox, { userConfirmed: true, openSeed: 'user-open' });
  assert.equal(result.ok, true);
  assert.equal(result.lootbox.status, 'consumed');
  assert.equal(result.lootbox.removedFromMarketInventory, true);
  assert.equal(result.lootbox.canSellUnopened, false);
  assert.ok(result.rewards.length >= 1);
  assert.equal(result.revealShow.stages.some((stage) => stage.id === 'lucky-score-reveal'), true);
});

test('W86 lootbox rewards avoid already-owned utility where possible', () => {
  const lootbox = buildLootboxNftEnvelope({ tier: 'genesis', seed: 'avoid-owned' });
  const ownedFeatureIds = ['ai_robot_core', 'private_workstation', 'realm_builder_pro', 'creator_exports'];
  const result = openLootboxNft(lootbox, { userConfirmed: true, openSeed: 'avoid-owned-open', userInventory: { ownedFeatureIds } });
  assert.equal(result.ok, true);
  assert.ok(result.rewards.some((reward) => !ownedFeatureIds.includes(reward.featureId)));
  assert.ok(result.rewards.every((reward) => reward.duplicateProtected === true || reward.duplicateConvertedToMergeShard === true));
});

test('W86 duplicate rewards merge into a guaranteed missing utility NFT instead of wasting user money', () => {
  const duplicates = [
    { featureId: 'ai_robot_core', mergeShardValue: 3 },
    { featureId: 'ai_robot_core', mergeShardValue: 3 },
    { featureId: 'ai_robot_core', mergeShardValue: 3 }
  ];
  const offer = buildDuplicateMergeOffer({ duplicateRewards: duplicates, ownedFeatureIds: ['ai_robot_core'] });
  assert.equal(offer.canMergeNow, true);
  assert.ok(offer.guaranteedOutcome);
  assert.notEqual(offer.guaranteedOutcome.featureId, 'ai_robot_core');
});

test('W86 on-chain minted utility follows current holder and seller loses access on transfer', () => {
  const nft = buildUtilityNftRecord({
    nftId: 'nft-utility-1',
    featureId: 'vault_pro',
    ownerWallet: '0x1111111111111111111111111111111111111111',
    onchain: { contract: '0xa9AFf03fBF4aa240188104B31D7641D3b5829ce3', tokenId: '77', currentOwner: '0x2222222222222222222222222222222222222222', authoritative: true }
  });
  const oldOwner = resolveUtilityAccessFromNft({ nft, accountWallet: '0x1111111111111111111111111111111111111111', ownershipSnapshot: { currentOwner: '0x2222222222222222222222222222222222222222' } });
  const newOwner = resolveUtilityAccessFromNft({ nft, accountWallet: '0x2222222222222222222222222222222222222222', ownershipSnapshot: { currentOwner: '0x2222222222222222222222222222222222222222' } });
  assert.equal(oldOwner.active, false);
  assert.equal(newOwner.active, true);
  assert.equal(NFT_UTILITY_OWNERSHIP_POLICY.sellerLosesUtilityOnTransfer, true);
  assert.ok(scoreNftUtilityOwnershipPolicy().total >= 95);
});

test('W86 unified market applies Admin 1 receiver and internal-only lootbox policy', () => {
  const catalog = buildAiUpgradeMarketCatalog();
  assert.ok(catalog.products.filter((product) => product.kind === 'lootbox-nft').every((product) => product.internalOnly && product.canMintLootboxToMainnet === false));
  assert.ok(catalog.products.every((product) => product.paymentReceiverWallet === DIRECT_EVM_RECIPIENT));
  assert.ok(scoreAiUpgradeMarketCatalog(catalog).total >= 90);
  assert.ok(scoreLootboxMarketSystem({ lootbox: buildLootboxNftEnvelope({ tier: 'genesis', seed: 'score' }) }).total >= 90);
});
