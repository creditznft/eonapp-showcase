import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_ACCOUNT_ACTIVATION_FLAGS,
  createAccountConnectionDesign,
  getAccountFoundationPublicSummary,
  getAccountFoundationStatus
} from '../../assets/js/account/eon-account-foundation.js';
import {
  PUBLIC_REALM_MANIFEST_SCHEMA,
  buildPublicRealmManifestProposal,
  getPublicRealmPublicationStatus,
  validatePublicRealmManifestProposal
} from '../../assets/js/realm/public-realm-manifest.js';
import {
  OFFICIAL_COMMERCE_FEATURE_FLAGS,
  createDisabledCheckoutIntent,
  getOfficialCommerceFoundation,
  getOfficialCommercePublicSummary,
  validateOfficialCatalogDraft
} from '../../assets/js/commerce/official-commerce-foundation.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function allFalse(flags) {
  return Object.values(flags).every((value) => value === false);
}

test('W225 exposes only a display-safe browser-local profile and refuses credential-shaped connection input', () => {
  const status = getAccountFoundationStatus({
    alias: 'Maya',
    avatar: '9abcfed1',
    uid: 'should-not-appear',
    email: 'private@example.test',
    wallet: '0x123',
    apiKey: 'must-not-appear',
    privateChat: 'must-not-appear'
  });
  const serialized = JSON.stringify(status);
  assert.equal(status.mode, 'guest-first-optional-google-identity');
  assert.equal(status.localProfile.displayName, 'Maya');
  assert.equal(status.serverAccount.connected, false);
  assert.equal(EON_ACCOUNT_ACTIVATION_FLAGS.optionalGoogleIdentityPlanned, true);
  assert.equal(EON_ACCOUNT_ACTIVATION_FLAGS.googleIdentityConfigured, false);
  assert.equal(EON_ACCOUNT_ACTIVATION_FLAGS.serverAccountActive, false);
  assert.doesNotMatch(serialized, /should-not-appear|private@example|must-not-appear|0x123/i);

  const design = createAccountConnectionDesign({ apiKey: 'not-accepted', publicAlias: 'Maya' });
  assert.equal(design.active, false);
  assert.equal(design.networkRequestCreated, false);
  assert.equal(design.storageWriteCreated, false);
  assert.equal(design.accepted, false);
  assert.equal(design.suppliedSensitiveValue, true);
  assert.doesNotMatch(JSON.stringify(design), /not-accepted/i);

  const summary = getAccountFoundationPublicSummary({ alias: 'Maya', email: 'private@example.test' });
  assert.equal(summary.accountConnected, false);
  assert.equal(summary.officialCommerceActive, false);
  assert.doesNotMatch(JSON.stringify(summary), /private@example/i);
});

test('W225 limits a future public Realm manifest to safe identity metadata and keeps publication inactive', () => {
  const proposal = buildPublicRealmManifestProposal({
    id: 'eonrealm_w225safe',
    label: 'Maya’s Quiet Realm',
    handle: 'maya-safe',
    theme: 'aurora',
    entryDistrict: 'realm',
    showcaseRefs: ['private-v3-secret-preview'],
    privateCity: { chat: 'must-not-export' },
    wallet: '0xnever',
    affiliate: { payout: 'never' },
    apiKey: 'must-not-export'
  });
  assert.equal(proposal.schema, PUBLIC_REALM_MANIFEST_SCHEMA);
  assert.equal(proposal.active, false);
  assert.equal(proposal.lifecycle, 'design-only');
  assert.equal(proposal.publication.requested, false);
  assert.equal(proposal.publication.publicEndpoint, null);
  assert.equal(proposal.validation.serverAcceptanceRequired, true);
  assert.deepEqual(Object.keys(proposal.realm).sort(), ['entryDistrict', 'handle', 'id', 'label', 'theme']);
  assert.doesNotMatch(JSON.stringify(proposal.realm), /must-not-export|private-v3|0xnever|payout/i);
  assert.equal(validatePublicRealmManifestProposal(proposal).ok, true);

  const malicious = { ...proposal, realm: { ...proposal.realm, apiKey: 'nope' } };
  assert.equal(validatePublicRealmManifestProposal(malicious).ok, false);
  const publication = getPublicRealmPublicationStatus({ label: 'Maya’s Quiet Realm', handle: 'maya-safe' });
  assert.equal(publication.active, false);
  assert.match(publication.message, /not active/i);
});

test('W225 establishes only disabled official-commerce schemas; it creates no catalog, checkout, receipt, delivery, seller, payout, or token flow', () => {
  const foundation = getOfficialCommerceFoundation();
  assert.equal(foundation.lifecycle, 'design-only');
  assert.equal(allFalse(OFFICIAL_COMMERCE_FEATURE_FLAGS), true);
  assert.equal(foundation.catalog.active, false);
  assert.deepEqual(foundation.catalog.items, []);
  assert.equal(foundation.receipt.clientCallbackIsNotProof, true);
  assert.equal(foundation.catalog.userSellerMarketplaceActive, false);
  assert.equal(validateOfficialCatalogDraft({ title: 'Do not publish' }).ok, false);

  const intent = createDisabledCheckoutIntent('catalog unsafe id !!!');
  assert.equal(intent.status, 'disabled');
  assert.equal(intent.attempted, false);
  assert.equal(intent.networkRequestCreated, false);
  assert.equal(intent.clientPaymentAccepted, false);
  assert.equal(intent.receiptCreated, false);
  assert.equal(intent.deliveryCreated, false);
  assert.equal(intent.catalogItemId, 'catalogunsafeid');
  const summary = getOfficialCommercePublicSummary();
  assert.equal(summary.active, false);
  assert.match(summary.message, /not active/i);
});

test('W225 source and UI stay design-only: no fetch, no browser storage, no connect or checkout action', () => {
  const account = read('assets/js/account/eon-account-foundation.js');
  const realm = read('assets/js/realm/public-realm-manifest.js');
  const commerce = read('assets/js/commerce/official-commerce-foundation.js');
  const profile = read('profile.html');
  const profileJs = read('assets/js/profile-page.js');
  const realmHtml = read('realm-studio.html');
  const realmJs = read('assets/js/realm-studio-page.js');
  const market = read('assets/js/market/eon-market-page.js');
  const contract = JSON.parse(read('platform-backend/contracts/eon-account-commerce-foundations.v1.json'));

  for (const source of [account, realm, commerce]) {
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|\.post\s*\(/i);
    assert.doesNotMatch(source, /\blocalStorage\s*\.|sessionStorage\s*\./i);
  }
  assert.match(profile, /Guest-first\. Your work stays on this device\./i);
  assert.match(profileJs, /getAccountFoundationPublicSummary/);
  assert.match(realmHtml, /realm-studio-publication-status/);
  assert.match(realmJs, /buildPublicRealmManifestProposal/);
  assert.match(market, /getOfficialCommercePublicSummary/);
  assert.match(market, /No official catalog is active/i);
  assert.doesNotMatch(`${profile}\n${realmHtml}\n${market}`, /Buy now|Checkout now|Connect account|Create store|Cash out/i);
  assert.equal(contract.lifecycle, 'design-only');
  assert.equal(contract.featureFlags.publicRealmPublishingActive, false);
  assert.equal(contract.featureFlags.checkoutActive, false);
  assert.equal(contract.featureFlags.userSellerMarketplaceActive, false);
  assert.equal(contract.featureFlags.payoutActive, false);
  assert.equal(contract.featureFlags.tokenSettlementActive, false);
});
