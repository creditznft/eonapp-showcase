import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonExpanseW768TResidentStations, validateEonExpanseW768TResidentStations } from '../../assets/js/city/w768/eon-expanse-w768t-my-frontier-resident-stations.js';

test('W768T defines six fixed resident stations and bounded route envelopes', () => {
  const view = deriveEonExpanseW768TResidentStations({ myFrontierState: { unlocked: true, residents: {} } });
  assert.equal(view.slotCount, 6);
  assert.equal(new Set(view.slots.map((entry) => entry.residentId)).size, 6);
  assert.ok(view.slots.every((entry) => entry.routeRadius === 3.25 && entry.stationVisible));
  assert.equal(validateEonExpanseW768TResidentStations(view).ok, true);
});

test('W768T shows only a truthful invited signal until authored character presentation exists', () => {
  const view = deriveEonExpanseW768TResidentStations({ myFrontierState: { unlocked: true, residents: { 'resident-navigator': 'navigator' } } });
  const navigator = view.slots.find((entry) => entry.slotId === 'resident-navigator');
  assert.equal(navigator.invited, true);
  assert.equal(navigator.invitedSignalVisible, true);
  assert.equal(navigator.residentBodyVisible, false);
  assert.equal(view.residentBodyCount, 0);
});

test('W768T keeps all resident presentation hidden while My Frontier is locked', () => {
  const view = deriveEonExpanseW768TResidentStations({ myFrontierState: { unlocked: false, residents: { 'resident-navigator': 'navigator' } } });
  assert.ok(view.slots.every((entry) => !entry.stationVisible && !entry.invited));
});

test('W768T stores no private content and owns no runtime or invitation authority', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768t-my-frontier-resident-stations.js', import.meta.url), 'utf8');
  const view = deriveEonExpanseW768TResidentStations({ myFrontierState: { unlocked: true } });
  assert.equal(view.automaticInvitation, false);
  assert.equal(view.rawCoordinatePlacementAllowed, false);
  assert.equal(view.privateContentStored, false);
  assert.doesNotMatch(source, /fetch\s*\(|localStorage|inviteResident\s*\(|runRenderLoop|new\s+(?:BABYLON\.)?(?:Engine|Scene)/);
});

test('W768T is mounted by the canonical My Frontier renderer without procedural resident bodies', () => {
  const renderer = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');
  assert.match(renderer, /deriveEonExpanseW768TResidentStations/);
  assert.match(renderer, /resident-route-envelope/);
  assert.match(renderer, /truthfulPlaceholderOnly:\s*true/);
  assert.match(renderer, /residentBodyCount:\s*residentAssets\?\.residentBodyCount \|\| 0/);
  assert.match(renderer, /mountEonExpanseW768YResidentPresenter/);
  assert.doesNotMatch(renderer, /w768t-[^`]*resident-body|proceduralResidentBody\s*:\s*true/);
});
