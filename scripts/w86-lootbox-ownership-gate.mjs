#!/usr/bin/env node
import assert from 'node:assert/strict';
import { DIRECT_EVM_RECIPIENT } from '../assets/js/utils/direct-evm-config.js';
import { buildLootboxNftEnvelope, createUnopenedLootboxListing, openLootboxNft, scoreLootboxMarketSystem } from '../assets/js/utils/lootbox-marketplace.js';
import { scoreNftUtilityOwnershipPolicy } from '../assets/js/utils/nft-ownership-utility.js';
import { buildAiUpgradeMarketCatalog, scoreAiUpgradeMarketCatalog } from '../assets/js/utils/ai-upgrade-market-catalog.js';

const lootbox = buildLootboxNftEnvelope({ tier: 'genesis', seed: 'w86-gate' });
const listing = createUnopenedLootboxListing({ lootbox, sellerId: 'gate' });
const opened = openLootboxNft(lootbox, { userConfirmed: true, openSeed: 'gate-open' });
const lootboxScore = scoreLootboxMarketSystem({ lootbox });
const ownershipScore = scoreNftUtilityOwnershipPolicy();
const marketScore = scoreAiUpgradeMarketCatalog(buildAiUpgradeMarketCatalog());

assert.equal(lootbox.internalOnly, true, 'lootbox must be app-internal');
assert.equal(lootbox.canMintLootboxToMainnet, false, 'unopened lootbox cannot mint to mainnet');
assert.equal(listing.paymentReceiverWallet, DIRECT_EVM_RECIPIENT, 'sales must route to Admin 1 wallet');
assert.equal(opened.lootbox.status, 'consumed', 'opened lootbox must be consumed');
assert.ok(opened.luck.hiddenLuckyScore >= 1 && opened.luck.hiddenLuckyScore <= 100, 'luck score must reveal on open');
assert.ok(lootboxScore.total >= 90, `lootbox score too low: ${lootboxScore.total}`);
assert.ok(ownershipScore.total >= 95, `ownership score too low: ${ownershipScore.total}`);
assert.ok(marketScore.total >= 90, `market score too low: ${marketScore.total}`);

console.log(JSON.stringify({ ok: true, gate: 'w86-lootbox-ownership', lootboxScore, ownershipScore, marketScore, admin1Receiver: DIRECT_EVM_RECIPIENT }, null, 2));
