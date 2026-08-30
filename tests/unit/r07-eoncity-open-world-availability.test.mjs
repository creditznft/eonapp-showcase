import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonCityR07OpenWorldAvailability } from '../../assets/js/city/r07/eon-city-r07-open-world-availability.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const digest = 'a'.repeat(64);
const activation = {
  schema: 'eon.expanse.future-region-activation.w793a.v1',
  activationId: 'future-region-activation:production:storm-sector',
  regionId: 'storm-sector',
  gatewayId: 'future-gateway-storm-sector',
  packageDigest: digest,
  buildDigest: 'b'.repeat(64),
  deploymentChannel: 'production',
  activatedAt: 10,
  gatewayActivated: true,
  regionRendered: false,
  explicitOwnerAction: true,
  automaticActivation: false,
  privateContentStored: false
};

test('R07 keeps uncertified Storm locked regardless of Signal completion', () => {
  const availability = deriveEonCityR07OpenWorldAvailability({ stormActivation: null, signalCampaignComplete: true });
  assert.equal(availability.stormSector.available, false);
  assert.equal(availability.stormSector.reason, 'certified-activation-required');
  assert.equal(availability.releaseCertificationBypassed, false);
});

test('R07 certified Storm is directly available even when Signal campaign is incomplete', () => {
  const availability = deriveEonCityR07OpenWorldAvailability({ stormActivation: activation, signalCampaignComplete: false });
  assert.equal(availability.stormSector.available, true);
  assert.equal(availability.stormSector.directEntryAllowed, true);
  assert.equal(availability.stormSector.requiresSignalCampaignCompletion, false);
  assert.equal(availability.stormSector.signalCampaignComplete, false);
});

test('R07 My Frontier is available from starter access while restoration progression remains meaningful', () => {
  const starter = deriveEonCityR07OpenWorldAvailability({ beaconOneStage: 0, signalCampaignComplete: false }).myFrontier;
  assert.equal(starter.available, true);
  assert.equal(starter.reason, 'available-starter-access');
  assert.equal(starter.starterAccess, true);
  assert.equal(starter.requiresBeaconOneForEntry, false);
  assert.equal(starter.progressionStillGatesAdvancedReceipts, true);

  const restored = deriveEonCityR07OpenWorldAvailability({ beaconOneStage: 3, signalCampaignComplete: false }).myFrontier;
  assert.equal(restored.available, true);
  assert.equal(restored.reason, 'available-restoration-progress-detected');
  assert.equal(restored.unlockMilestone, 'beacon-one-repaired');
  assert.equal(restored.requiresFullSignalCampaignCompletion, false);
});

test('R07 runtime exposes Storm through Explore only from exact maintained activation', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /deriveEonCityR07OpenWorldAvailability/);
  assert.match(runtime, /enterStormSector/);
  assert.match(runtime, /data-eon-city-menu-open-storm/);
});
