import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { EON_SHARING_CENTER_EXCLUSIONS, EON_SHARING_CENTER_FAMILIES, createEonSharingCenterController, validateEonSharingManifest } from '../../assets/js/share/eon-sharing-center.js';
import { validateW624jSharingCenterContract } from '../../config/w624j-sharing-center-contract.mjs';
const read = (file) => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
const now = 1_770_200_000_000;
const signer = async () => ({ canonicalLink: 'https://eonapp.ch/r/#eon2.unit.signature' });

test('W624J exposes six distinct ordinary share families and fixed exclusions', () => {
  assert.equal(EON_SHARING_CENTER_FAMILIES.length, 6);
  assert.equal(new Set(EON_SHARING_CENTER_FAMILIES.map((entry) => entry.id)).size, 6);
  assert.equal(EON_SHARING_CENTER_EXCLUSIONS.length, 6);
  assert.ok(EON_SHARING_CENTER_EXCLUSIONS.some((entry) => /Vault/.test(entry)));
});

test('W624J rejects private fields and unsafe destinations before a manifest exists', () => {
  const controller = createEonSharingCenterController({ now: () => now, signer });
  assert.equal(controller.prepare({ family: 'project-milestone', title: 'Safe', summary: 'Safe', providerKey: 'sk-private' }, { explicitUserAction: true }).reason, 'private-or-sensitive-fields-rejected');
  assert.equal(controller.prepare({ family: 'signed-invite', destination: 'https://evil.example/path' }, { explicitUserAction: true }).reason, 'unsafe-destination');
});

test('W624J requires prepare, review and final action as separate user steps', async () => {
  const controller = createEonSharingCenterController({ now: () => now, signer });
  assert.equal(controller.prepare({ family: 'city-postcard' }).reason, 'explicit-user-action-required');
  const prepared = controller.prepare({ family: 'city-postcard', title: 'City postcard', summary: 'Public milestone.' }, { explicitUserAction: true });
  assert.equal(prepared.ok, true);
  assert.equal(validateEonSharingManifest(prepared.manifest).ok, true);
  assert.equal((await controller.finalize(prepared.manifest.manifestId, 'copy', { explicitUserAction: true })).reason, 'manifest-review-required');
  assert.equal(controller.review(prepared.manifest.manifestId).reason, 'explicit-review-required');
  assert.equal(controller.review(prepared.manifest.manifestId, { explicitUserAction: true }).ok, true);
  const finalized = await controller.finalize(prepared.manifest.manifestId, 'copy', { explicitUserAction: true });
  assert.equal(finalized.ok, true);
  assert.equal(finalized.trackingCreated, false);
  assert.equal(finalized.manifest.rewardMutation, false);
});

test('W624J creates a signed link only after review and keeps collaboration unavailable honestly', async () => {
  const controller = createEonSharingCenterController({ now: () => now, signer });
  const signed = controller.prepare({ family: 'signed-invite', title: 'Invite', summary: 'Explore City.' }, { explicitUserAction: true });
  controller.review(signed.manifest.manifestId, { explicitUserAction: true });
  const result = await controller.finalize(signed.manifest.manifestId, 'native-share', { explicitUserAction: true });
  assert.equal(result.ok, true);
  assert.equal(result.signedLinkCreated, true);
  assert.match(result.payload.url, /eon2\.unit/);
  const collab = controller.prepare({ family: 'collaboration-invite', title: 'Collaborate', summary: 'Review access.' }, { explicitUserAction: true });
  assert.equal(collab.manifest.authorityAvailable, false);
  assert.equal(collab.manifest.authorityReason, 'collaboration-delivery-not-released');
});

test('W624J platform execution is isolated to the City UI and core creates no tracking', () => {
  const core = read('assets/js/share/eon-sharing-center.js');
  const city = read('assets/js/city/eon-city-sharing-center.js');
  assert.doesNotMatch(core, /navigator(?:\?\.)?\.share\s*\(|clipboard(?:\?\.)?\.writeText\s*\(/);
  assert.match(city, /executePlatformAction/);
  assert.match(city, /Never included/);
  assert.match(city, /ACTIVE_BINDINGS = new WeakMap/);
  assert.match(city, /root\.addEventListener\('click', onRootClick\)/);
  assert.match(city, /dataset\.eonCitySharingCenter/);
  assert.doesNotMatch(city, /const buttons = \[\.\.\.root\.querySelectorAll/);
  assert.doesNotMatch(core, /analytics|impression/i);
});

test('W624J source gate preserves W624B-I and lifecycle-owned integration', async () => {
  const result = await validateW624jSharingCenterContract();
  assert.equal(result.ok, true, result.checks.filter((entry) => !entry.pass).map((entry) => entry.id).join(', '));
  assert.ok(result.total >= 25);
  const station = read('assets/js/eon-city-play-station.js');
  assert.match(station, /bindEonCitySharingCenter/);
  assert.match(station, /w624j-sharing-center/);
  assert.match(station, /bindGenuineAgentTheatre/);
});
