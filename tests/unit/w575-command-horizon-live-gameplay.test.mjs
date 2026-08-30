import test from 'node:test';
import assert from 'node:assert/strict';
import {
  W575_COMMAND_HORIZON_LIVE_GAMEPLAY_CONTRACT,
  validateW575CommandHorizonLiveGameplayContract
} from '../../config/w575-command-horizon-live-gameplay-contract.mjs';
import {
  EON_CITY_COMMAND_HORIZON_PROOF_REGIONS,
  getEonCityCommandHorizonProofManifest,
  getEonCityCommandHorizonProofTruth,
  validateEonCityCommandHorizonProofManifest
} from '../../assets/js/city/eon-city-command-horizon-proof-manifest.js';

test('W575 freezes the exact four-region Command Horizon review route', () => {
  const manifest = getEonCityCommandHorizonProofManifest({ quality: 'cinematic', accessLane: 'authenticated-preview' });
  assert.deepEqual(manifest.verticalSlice.regionIds, ['arrival-gate', 'command-district', 'creator-atrium', 'forge-bay']);
  assert.deepEqual(EON_CITY_COMMAND_HORIZON_PROOF_REGIONS.map((entry) => entry.id), manifest.verticalSlice.regionIds);
  assert.equal(manifest.verticalSlice.originalVectorArtOnly, true);
  assert.equal(manifest.verticalSlice.finalBinaryArt, false);
  assert.equal(manifest.verticalSlice.regions.every((region) => region.privateDataAllowed === false && region.routeConfirmationAllowed === false), true);
});

test('W575 requires a human-originated Google session for the authenticated preview lane and retains a truthful guest lane', () => {
  const guest = getEonCityCommandHorizonProofManifest({ accessLane: 'public-entry' });
  const authenticated = getEonCityCommandHorizonProofManifest({ accessLane: 'authenticated-preview' });
  assert.equal(guest.accessLane.requiresGoogleSession, false);
  assert.equal(guest.accessLane.heavyCityExpected, false);
  assert.equal(authenticated.accessLane.requiresGoogleSession, true);
  assert.equal(authenticated.accessLane.humanGoogleSignInRequired, true);
  assert.equal(authenticated.accessLane.identityBypassAllowed, false);
  assert.equal(authenticated.accessLane.heavyCityExpected, true);
});

test('W575 classifies every City review control without allowing automatic confirmation', () => {
  const manifest = getEonCityCommandHorizonProofManifest();
  assert.deepEqual(manifest.controlGroups.map((entry) => entry.id), W575_COMMAND_HORIZON_LIVE_GAMEPLAY_CONTRACT.requiredControlGroupIds);
  assert.equal(manifest.controlGroups.every((entry) => ['safe-in-place', 'review-then-cancel', 'human-only'].includes(entry.actionClass)), true);
  assert.equal(manifest.controlGroups.flatMap((entry) => [...entry.automationSelectors, ...entry.manualSelectors]).every((selector) => /^\[data-eon-[a-z0-9-]+\]$/.test(selector)), true);
  assert.equal(manifest.automatedConfirmationAllowed, false);
  assert.equal(manifest.automaticCertification, false);
  assert.equal(manifest.automaticLaunchApproval, false);
});

test('W575 rejects a malformed or broadened evidence manifest', () => {
  const manifest = getEonCityCommandHorizonProofManifest();
  const broken = { ...manifest, remoteTestBypass: true };
  assert.equal(validateEonCityCommandHorizonProofManifest(broken).some((entry) => entry.includes('remoteTestBypass')), true);
  assert.deepEqual(validateW575CommandHorizonLiveGameplayContract(), []);
});

test('W575 truth remains source-only and creates no credentials, deployment, device proof, or automatic approval', () => {
  const truth = getEonCityCommandHorizonProofTruth();
  assert.deepEqual(truth, {
    schema: 'eon.city.command-horizon.live-gameplay.w575.v1',
    sourceControlledReviewInventory: true,
    publicGuestEntryLane: true,
    authenticatedPreviewLane: true,
    googleIdentityBypass: false,
    captchaAutomation: false,
    credentialsInSource: false,
    remoteTestBypass: false,
    automaticCertification: false,
    automaticLaunchApproval: false,
    liveGameplayProven: false,
    deviceProofProven: false,
    deploymentProven: false
  });
});
