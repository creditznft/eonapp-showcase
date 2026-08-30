import assert from 'node:assert/strict';
import test from 'node:test';
import {
  scanFinancialClaims,
  classifyRouteSensitivity,
  scanSensitivePageAds,
  scanCreatorCommerceText,
  scanServiceWorkerSafety,
  buildRouteOwnershipMap,
  validateRouteOwnershipMap
} from '../../assets/js/utils/app-surface-quality-gates.js';


test('financial copy scanner rejects overclaiming', () => {
  assert.ok(scanFinancialClaims('Guaranteed profit and passive income for everyone').length >= 1);
  assert.equal(scanFinancialClaims('Utility collectibles for entertainment and workflow access.').length, 0);
});

test('sensitive page ad scanner blocks ads on current billing and policy pages', () => {
  assert.equal(classifyRouteSensitivity('billing.html'), 'sensitive');
  assert.ok(scanSensitivePageAds('billing.html', '<div class="sponsor-slot"></div>').length >= 1);
  assert.equal(scanSensitivePageAds('about.html', '<div class="sponsor-slot"></div>').length, 0);
});

test('creator commerce text allows Admin 1-only launch routing or explicit fair split rules', () => {
  const admin1Only = 'Launch mode routes 100% of all sales and income to Admin 1 / EON Team. User-owned splits are disabled until proof.';
  const oldPreview = 'User-owned land routes to the seller wallet with 0.5% launch platform fee to Admin 1, capped at 1%.';
  assert.equal(scanCreatorCommerceText(admin1Only).length, 0);
  assert.equal(scanCreatorCommerceText(oldPreview).length, 0);
});

test('service worker safety scanner expects network-only sensitive route tokens', () => {
  const sw = 'const CACHE_VERSION="eonapp-v1"; const NETWORK_ONLY=["admin","api/","nowpayments","subscription","billing"];';
  assert.equal(scanServiceWorkerSafety(sw).length, 0);
});

test('route ownership keeps RealmWorld as flagship game', () => {
  const validation = validateRouteOwnershipMap(buildRouteOwnershipMap());
  assert.equal(validation.ok, true, validation.issues.join('; '));
});
