import assert from 'node:assert/strict';
import test from 'node:test';
import { getIdentityAccountHref, getIdentityReturnTo } from '../../assets/js/account/eon-identity-onboarding.js';
import { runW374BGoogleIdentityOnboardingSurfacesGate } from '../../scripts/w374b-google-identity-onboarding-surfaces-gate.mjs';

test('W374B only creates Profile links for allowlisted return paths', () => {
  assert.equal(getIdentityReturnTo('/chat'), '/chat');
  assert.equal(getIdentityReturnTo('/eoncity/play'), '/eoncity/play');
  assert.equal(getIdentityReturnTo('https://evil.example'), '/profile');
  assert.equal(getIdentityReturnTo('//evil.example'), '/profile');
  assert.equal(getIdentityAccountHref('/apps'), '/profile?returnTo=%2Fapps#eon-profile-account-foundation');
});

test('W374B onboarding-surface gate preserves guest-first and no-cloud-backup truth', () => {
  const report = runW374BGoogleIdentityOnboardingSurfacesGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.guestModeAvailable, true);
  assert.equal(report.automaticCloudBackup, false);
});
