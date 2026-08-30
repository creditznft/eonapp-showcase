import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonCityR07OpenWorldAvailability } from '../../assets/js/city/r07/eon-city-r07-open-world-availability.js';

const digest = 'a'.repeat(64);
const certifiedActivation = {
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

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('Storm public access is gated by its maintained release activation, never Signal completion', () => {
  const pending = deriveEonCityR07OpenWorldAvailability({ stormActivation: null, signalCampaignComplete: true });
  assert.equal(pending.stormSector.available, false);
  assert.equal(pending.stormSector.reason, 'certified-activation-required');

  const ready = deriveEonCityR07OpenWorldAvailability({ stormActivation: certifiedActivation, signalCampaignComplete: false });
  assert.equal(ready.stormSector.available, true);
  assert.equal(ready.stormSector.requiresSignalCampaignCompletion, false);
  assert.equal(ready.stormSector.signalCampaignComplete, false);
  assert.equal(ready.releaseCertificationBypassed, false);
});

test('runtime exposes uncertified Storm only as explicit read-only direct review without Signal progression', () => {
  assert.match(runtime, /Direct review grants no certification, XP or progression/);
  assert.match(runtime, /signalCampaignCompletionRequired: false/);
  assert.match(runtime, /expanseWorldMode\.review\(\{ explicitUserAction: true \}\)/);
  assert.match(runtime, /reason: ownerReview \? 'owner-review-read-only' : 'direct-review-read-only'/);
  assert.match(runtime, /mutatesMissionState: false, persistsProgression: false/);
});

test('a real certified Storm activation outranks the transient RT90 review projection', () => {
  assert.match(runtime, /if \(publicAvailability\?\.stormSector\?\.available === true\) return publicAvailability/);
  assert.match(runtime, /return projectEonCityL95OwnerReviewAvailability\(publicAvailability, stormReviewActivation\)/);
});
