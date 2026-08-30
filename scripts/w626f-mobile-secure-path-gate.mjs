#!/usr/bin/env node
import assert from 'node:assert/strict';
import { getDirectMobileSecurityTruth, resolveDirectMobilePath } from '../assets/js/direct-byok/mobile-secure-path.js';
const truth = getDirectMobileSecurityTruth();
assert.equal(truth.ordinaryMobileLocalStorageCredentialsAllowed, false);
assert.equal(truth.oauthPreferred, true);
assert.equal(truth.shortLivedCredentialsPreferred, true);
assert.equal(truth.signedNativeWrapperAcceptedWhenProven, true);
assert.equal(truth.unsafeProviderFallback, 'guide-or-desktop-companion');
assert.equal(truth.supportedMobileProviderProofComplete, false);
assert.equal(resolveDirectMobilePath({ platform: 'mobile-browser', provider: {} }).allowed, false);
assert.equal(resolveDirectMobilePath({ platform: 'ios', provider: { mobileOAuth: true }, oauthSession: { shortLived: true, expiresAt: Date.now() + 1000 } }).allowed, true);
console.log('[W626F] PASS 8/8 mobile secure-path invariants');
