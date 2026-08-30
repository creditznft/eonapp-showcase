import test from 'node:test';
import assert from 'node:assert/strict';
import { EON_BIDVERTISER, EON_INFOLINKS, EON_SMARTLINK_PARTNERS, EON_ZYNTENT, getPartnerMonetizationRuntimeConfig } from '../../config/rt97-partner-monetization-contract.mjs';

test('Infolinks is confined to reviewed public guides by contract', () => {
  assert.equal(EON_INFOLINKS.publisherId, 3447426);
  assert.equal(EON_INFOLINKS.scope, 'reviewed-public-guides-only');
  assert.equal(EON_INFOLINKS.privateChatAllowed, false);
  assert.equal(EON_INFOLINKS.localAiWorkSurfaceAllowed, false);
});

test('BidVertiser is verification-only and aggressive formats stay blocked', () => {
  assert.equal(EON_BIDVERTISER.websiteVerificationMarker, '<!-- Bidvertiser2106784 -->');
  assert.equal(EON_BIDVERTISER.publisherAdsEnabledByDefault, false);
  assert.ok(EON_BIDVERTISER.forbiddenLaunchFormats.includes('popunder'));
  assert.ok(EON_BIDVERTISER.forbiddenLaunchFormats.includes('injection'));
});

test('Zyntent fails closed until explicit server configuration exists', () => {
  assert.equal(EON_ZYNTENT.apiBase, 'https://api.zyntent.ai');
  assert.equal(getPartnerMonetizationRuntimeConfig({}).zyntent.ready, false);
  assert.equal(getPartnerMonetizationRuntimeConfig({ EON_ZYNTENT_ENABLED:'true', EON_ZYNTENT_API_KEY:'a'.repeat(64), EON_ZYNTENT_SOURCE_ID:'11111111-2222-4333-8444-555555555555' }).zyntent.ready, true);
});

test('SmartLinks are never automatic keyword links', () => {
  for (const partner of Object.values(EON_SMARTLINK_PARTNERS)) {
    assert.equal(partner.enabledByDefault, false);
    assert.equal(partner.explicitSponsoredClickOnly, true);
    assert.equal(partner.automaticKeywordRelinking, false);
  }
});
