#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { migrateLegacyVaultRevealRecords, validateW629VaultRevealContract } from '../assets/js/referrals/eon-vault-reveal-integration-w629.js';
const page = fs.readFileSync(new URL('../assets/js/referrals/eon-keys-page.js', import.meta.url), 'utf8');
assert.equal(validateW629VaultRevealContract().ok, true);
const migrated = migrateLegacyVaultRevealRecords({ legacyCity: { reviewedCosmeticIds: ['a', 'b'] } });
assert.equal(migrated.dataLossDetected, false);
assert.equal(migrated.preservedLegacyVisualCount, 2);
assert.equal(migrated.walletOrTokenCreated, false);
assert.equal(migrated.marketListingCreated, false);
assert.ok(migrated.receipts.every((row) => row.nonFinancial && row.transferable === false));
assert.match(page, /installW629VaultRevealMigration/);
assert.doesNotMatch(JSON.stringify(migrated), /prompt|providerKey|customerEmail/);
console.log('[W629G] PASS 8/8 non-financial Vault Reveal invariants');
