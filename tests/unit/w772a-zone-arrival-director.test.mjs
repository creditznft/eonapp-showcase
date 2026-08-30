import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW772AZoneArrivalDirector } from '../../assets/js/city/w772/eon-expanse-w772a-zone-arrival-director.js';

test('W772A shows one truthful identity card on first active entry', () => {
  const director = createEonExpanseW772AZoneArrivalDirector({ now: () => 5000 });
  const result = director.enter('beacon-fields', { expanseActive: true, progress: { beaconOneStage: 1 } });
  assert.equal(result.ok, true);
  assert.equal(result.card.title, 'BEACON FIELDS');
  assert.equal(result.card.artStage, 'restoring');
  assert.equal(result.card.blocksControl, false);
});

test('W772A does not repeat a zone or spam rapid transitions', () => {
  const director = createEonExpanseW772AZoneArrivalDirector({ minimumIntervalMs: 2500 });
  assert.equal(director.enter('archive-ruins', { expanseActive: true, at: 5000 }).ok, true);
  assert.equal(director.enter('archive-ruins', { expanseActive: true, at: 9000 }).reason, 'zone-already-announced');
  assert.equal(director.enter('transit-scar', { expanseActive: true, at: 6000 }).reason, 'zone-arrival-cooldown');
  assert.equal(director.enter('transit-scar', { expanseActive: true, at: 8000 }).ok, true);
});

test('W772A reports restored transformation labels only from campaign progress', () => {
  const director = createEonExpanseW772AZoneArrivalDirector();
  const result = director.enter('horizon-vault', { expanseActive: true, at: 10000, progress: { campaignComplete: true } });
  assert.equal(result.card.artStage, 'restored');
  assert.equal(result.card.restorationPercent, 100);
  assert.match(result.card.detail, /illuminated-infinite-frontier/);
});

test('W772A owns no progression, control lock or private persistence', () => {
  const director = createEonExpanseW772AZoneArrivalDirector();
  assert.equal(director.enter('beacon-fields', { expanseActive: false }).reason, 'expanse-not-active');
  const state = director.getState();
  assert.equal(state.blocksControl, false);
  assert.equal(state.storesPrivateContent, false);
  assert.equal('xp' in state, false);
});
