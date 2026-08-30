import test from 'node:test';
import assert from 'node:assert/strict';
import { getDirectMobileSecurityTruth, resolveDirectMobilePath } from '../../assets/js/direct-byok/mobile-secure-path.js';

test('W626F blocks permanent mobile browser credentials and prefers short-lived OAuth', () => {
  assert.equal(resolveDirectMobilePath({ platform: 'mobile-browser', provider: {} }).allowed, false);
  const oauth = resolveDirectMobilePath({ platform: 'ios', provider: { mobileOAuth: true }, oauthSession: { shortLived: true, expiresAt: Date.now() + 60000 } });
  assert.equal(oauth.allowed, true);
  assert.equal(oauth.path, 'provider-oauth-short-lived');
  assert.equal(resolveDirectMobilePath({ platform: 'android', nativeWrapper: { signed: true, secureCredentialStore: true, shortLivedSession: true } }).allowed, true);
  assert.equal(getDirectMobileSecurityTruth().ordinaryMobileLocalStorageCredentialsAllowed, false);
});
