import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_ACCOUNT_ACTIVATION_FLAGS,
  EON_MINIMAL_ACCOUNT_RECORD,
  EON_NEVER_CLOUD_ACCOUNT_DATA,
  createAccountConnectionDesign,
  getAccountDataCustodySummary,
  getAccountFoundationPublicSummary,
  getAccountFoundationStatus
} from '../../assets/js/account/eon-account-foundation.js';
import { EON_LOCAL_FIRST_BOUNDARY, getLocalFirstBoundaryNotice, isLocalFirstBoundarySatisfied } from '../../assets/js/local-first/local-first-boundary.js';
import { getCapabilityTruth } from '../../assets/js/capabilities/capability-truth-registry.js';
import { runW364AGoogleDataCustodyGate } from '../../scripts/w364a-google-data-custody-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('W364A keeps Google identity optional, pre-auth, and distinct from a cloud backup', () => {
  const boundary = EON_LOCAL_FIRST_BOUNDARY;
  assert.equal(isLocalFirstBoundarySatisfied(boundary), true);
  assert.equal(boundary.identity.googleLogin, 'planned-optional');
  assert.equal(boundary.identity.oneTap, 'retired');
  assert.equal(boundary.identity.compulsoryAccount, false);
  assert.equal(boundary.identity.googleIdentityIsDataBackup, false);
  assert.equal(boundary.data.userWorkspaceCloudStore, false);
  assert.equal(boundary.data.automaticCrossDeviceSync, false);
  assert.equal(boundary.data.rawWorkspaceDataOnCloudflare, false);
  assert.match(getLocalFirstBoundaryNotice('googleDataCustody'), /encrypted backup/i);
  assert.match(getLocalFirstBoundaryNotice('googleIdentity'), /does not back up/i);
});

test('W364A exposes only minimal planned account metadata and never serializes sensitive local work', () => {
  const custody = getAccountDataCustodySummary();
  assert.equal(custody.guestUseAvailable, true);
  assert.equal(custody.googleIdentityRequired, false);
  assert.equal(custody.googleIdentityConfigured, false);
  assert.equal(custody.automaticCloudBackup, false);
  assert.equal(custody.automaticCrossDeviceSync, false);
  assert.equal(custody.localDataBackupRequired, true);
  assert.deepEqual(custody.cloudflareMayStoreOnlyWhenActivated, EON_MINIMAL_ACCOUNT_RECORD);
  assert.deepEqual(custody.cloudflareNeverStores, EON_NEVER_CLOUD_ACCOUNT_DATA);
  assert.match(custody.cloudflareNeverStores.join('\n'), /Chat text/i);
  assert.match(custody.cloudflareNeverStores.join('\n'), /Vault contents/i);
  assert.match(custody.cloudflareNeverStores.join('\n'), /raw card details/i);

  const status = getAccountFoundationStatus({ alias: 'Maya', email: 'private@example.test', apiKey: 'hidden-key', cityProgress: { secret: true } });
  assert.equal(status.mode, 'guest-first-optional-google-identity');
  assert.equal(status.serverAccount.connected, false);
  assert.equal(status.optionalGoogleIdentity.configured, false);
  assert.equal(EON_ACCOUNT_ACTIVATION_FLAGS.optionalGoogleIdentityPlanned, true);
  assert.equal(EON_ACCOUNT_ACTIVATION_FLAGS.googleIdentityConfigured, false);
  assert.doesNotMatch(JSON.stringify(status), /private@example|hidden-key/i);
  const summary = getAccountFoundationPublicSummary({ alias: 'Maya', email: 'private@example.test' });
  assert.equal(summary.optionalGoogleIdentityPlanned, true);
  assert.equal(summary.googleIdentityConfigured, false);
  assert.equal(summary.localDataBackupRequired, true);
  assert.doesNotMatch(JSON.stringify(summary), /private@example/i);
});

test('W364A keeps the browser module design-only and the disclosure close to the backup action', () => {
  const account = read('assets/js/account/eon-account-foundation.js');
  const profile = read('profile.html');
  const profilePage = read('assets/js/profile-page.js');
  for (const source of [account]) {
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|window\.google\.accounts|GOOGLE_OAUTH_CLIENT_SECRET|localStorage\s*\.|sessionStorage\s*\./i);
  }
  assert.match(profile, /Guest-first\. Your work stays on this device\./i);
  assert.match(profile, /Google Login/i);
  assert.match(profile, /Signing in does not copy local work/i);
  assert.match(profile, /href="#sync"/i);
  assert.match(profile, /href="\/vault\/backup"/i);
  assert.match(profilePage, /Google Login does not copy local Chat/i);

  const design = createAccountConnectionDesign({ apiKey: 'not-accepted' });
  assert.equal(design.active, false);
  assert.equal(design.networkRequestCreated, false);
  assert.equal(design.storageWriteCreated, false);
  assert.equal(design.suppliedSensitiveValue, true);
  assert.doesNotMatch(JSON.stringify(design), /not-accepted/i);
});

test('W364A truth registry and source gate remain fail-closed before OAuth configuration', () => {
  const capability = getCapabilityTruth('google-identity-sign-in');
  assert.equal(capability?.lifecycle, 'planned');
  assert.deepEqual(capability?.routes, ['/profile']);
  assert.match(capability?.truthfulUserFacingNote || '', /not back up/i);
  assert.equal(runW364AGoogleDataCustodyGate().ok, true);
});
