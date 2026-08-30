import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  EON_REALM_RELIC_CAPABILITIES,
  assertRealmRelicBoundary,
  buildLocalRelicBoundary,
  getEonRealmRelicPublicSummary,
  validateLocalRealmRelicDescriptor
} from '../../assets/js/realm-relic/eon-realm-relic-boundary.js';
import {
  EON_PRODUCT_LICENSE_FEATURE_FLAGS,
  createDisabledPersonalLicenceIntent,
  getEonProductLicenseFoundation
} from '../../assets/js/commerce/eon-product-license-foundation.js';
import { getCapabilityTruth } from '../../assets/js/capabilities/capability-truth-registry.js';
import { runW346RealmRelicCommerceBoundaryGate } from '../../scripts/w346-realm-relic-commerce-boundary-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('W346 keeps Realm and Relic as local non-financial product surfaces', () => {
  const relic = buildLocalRelicBoundary({ id: 'relic_one', title: 'Quiet Archive' });
  assert.equal(relic.classification, 'local-nontransferable-creative-record');
  assert.equal(relic.transferAllowed, false);
  assert.equal(relic.saleAllowed, false);
  assert.equal(relic.resaleAllowed, false);
  assert.equal(relic.financialValueAssigned, false);
  assert.equal(assertRealmRelicBoundary().ok, true);
  assert.equal(EON_REALM_RELIC_CAPABILITIES.localRealmStudioActive, true);
  assert.equal(EON_REALM_RELIC_CAPABILITIES.relicMintActive, false);
  assert.equal(EON_REALM_RELIC_CAPABILITIES.chainRuntimeActive, false);
});

test('W346 rejects wallet and commercial fields from local Relic descriptors', () => {
  assert.equal(validateLocalRealmRelicDescriptor({ title: 'safe relic' }).ok, true);
  const unsafe = validateLocalRealmRelicDescriptor({ title: 'unsafe relic', wallet: '0xnot-allowed', saleAllowed: true });
  assert.equal(unsafe.ok, false);
  assert.match(unsafe.errors.join(' '), /Commercial|wallet|transferable|sellable/i);
});

test('W346 places permanent official unlocks behind a future personal licence, not a token or NFT', () => {
  const foundation = getEonProductLicenseFoundation();
  assert.equal(foundation.active, false);
  assert.equal(foundation.productModel.personalUseLicence, true);
  assert.equal(foundation.productModel.transferable, false);
  assert.equal(foundation.productModel.tokenRequired, false);
  assert.equal(foundation.productModel.nftRequired, false);
  assert.equal(Object.values(EON_PRODUCT_LICENSE_FEATURE_FLAGS).every((value) => value === false), true);
  const intent = createDisabledPersonalLicenceIntent('realm_skin/01');
  assert.equal(intent.productId, 'realm_skin01');
  assert.equal(intent.networkRequestCreated, false);
  assert.equal(intent.entitlementActivated, false);
});

test('W346 truth registry and source gate distinguish active local art from blocked chain economics', () => {
  const summary = getEonRealmRelicPublicSummary();
  assert.equal(summary.relic.lifecycle, 'active-local');
  assert.equal(summary.productLicense.lifecycle, 'planned');
  assert.equal(summary.chain.lifecycle, 'blocked');
  assert.equal(getCapabilityTruth('realm-local-studio')?.lifecycle, 'active-local');
  assert.equal(getCapabilityTruth('local-relic-previews')?.lifecycle, 'active-local');
  assert.equal(getCapabilityTruth('official-personal-licenses')?.lifecycle, 'planned');
  assert.equal(getCapabilityTruth('legacy-eonlite-polygon-stack')?.lifecycle, 'blocked');
  const result = runW346RealmRelicCommerceBoundaryGate(root);
  assert.equal(result.ok, true, result.errors.join('\n'));
});
