import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveEonExpanseW776AZoneAudioState } from '../../assets/js/city/w776/eon-expanse-w776a-zone-audio-state.js';

const board = { rows: [
  { zoneId: 'gateway-overlook', artStage: 'damaged', restorationPercent: 0 },
  { zoneId: 'archive-ruins', artStage: 'restoring', restorationPercent: 50 },
  { zoneId: 'horizon-vault', artStage: 'restored', restorationPercent: 100 }
] };

test('W776A derives bounded damaged, restoring and restored audio profiles', () => {
  const damaged = deriveEonExpanseW776AZoneAudioState({ zoneId: 'gateway-overlook', zoneRestorationBoard: board });
  const restoring = deriveEonExpanseW776AZoneAudioState({ zoneId: 'archive-ruins', zoneRestorationBoard: board });
  const restored = deriveEonExpanseW776AZoneAudioState({ zoneId: 'horizon-vault', zoneRestorationBoard: board });
  assert.equal(damaged.artStage, 'damaged');
  assert.equal(restoring.artStage, 'restoring');
  assert.equal(restored.artStage, 'restored');
  assert.ok(damaged.noiseMultiplier > restored.noiseMultiplier);
  assert.ok(restored.clarityMultiplier > damaged.clarityMultiplier);
  assert.ok(restored.intensityMultiplier <= 1.12);
});

test('W776A applies only a subtle event influence in the active event zone', () => {
  const inactive = deriveEonExpanseW776AZoneAudioState({ zoneId: 'archive-ruins', zoneRestorationBoard: board });
  const active = deriveEonExpanseW776AZoneAudioState({ zoneId: 'archive-ruins', zoneRestorationBoard: board, dynamicEvent: { active: true, visible: true, zoneId: 'archive-ruins' } });
  const otherZone = deriveEonExpanseW776AZoneAudioState({ zoneId: 'archive-ruins', zoneRestorationBoard: board, dynamicEvent: { active: true, visible: true, zoneId: 'transit-scar' } });
  assert.equal(active.dynamicEventActive, true);
  assert.ok(active.intensityMultiplier > inactive.intensityMultiplier);
  assert.equal(otherZone.eventInfluence, 0);
});

test('W776A reduces event influence for reduced-sensory users and never starts audio', () => {
  const normal = deriveEonExpanseW776AZoneAudioState({ zoneId: 'archive-ruins', zoneRestorationBoard: board, dynamicEvent: { active: true, visible: true, zoneId: 'archive-ruins' } });
  const reduced = deriveEonExpanseW776AZoneAudioState({ zoneId: 'archive-ruins', zoneRestorationBoard: board, dynamicEvent: { active: true, visible: true, zoneId: 'archive-ruins' }, reducedMotion: true });
  assert.ok(reduced.eventInfluence < normal.eventInfluence);
  assert.equal(reduced.startsAudioAutomatically, false);
  assert.equal(reduced.explicitUserStartRequired, true);
  assert.equal(reduced.createsUrgency, false);
  assert.equal(reduced.mutatesProgression, false);
});

test('W776A fails closed to Gateway damaged state without private or invalid data', () => {
  const state = deriveEonExpanseW776AZoneAudioState({ zoneId: '../../secret', zoneRestorationBoard: { rows: [{ zoneId: '../../secret', artStage: 'restored', restorationPercent: 100 }] } });
  assert.equal(state.zoneId, 'gateway-overlook');
  assert.equal(state.artStage, 'damaged');
  assert.equal(state.storesPrivateContent, false);
  assert.equal(state.awardsXp, false);
});
