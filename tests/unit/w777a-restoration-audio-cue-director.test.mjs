import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW777ARestorationAudioCueDirector } from '../../assets/js/city/w777/eon-expanse-w777a-restoration-audio-cue-director.js';

const board = (gateway = 'damaged', beacon = 'damaged') => ({ rows: [
  { zoneId: 'gateway-overlook', artStage: gateway },
  { zoneId: 'beacon-fields', artStage: beacon }
] });

test('W777A seeds saves and inactive worlds without replaying restoration cues', () => {
  const director = createEonExpanseW777ARestorationAudioCueDirector();
  assert.equal(director.update(board('restored'), { expanseActive: true, currentZoneId: 'gateway-overlook' }).cue, null);
  assert.equal(director.update(board('restored', 'restoring'), { expanseActive: false, currentZoneId: 'beacon-fields' }).cue, null);
  assert.equal(director.update(board('restored', 'restoring'), { expanseActive: true, currentZoneId: 'beacon-fields' }).cue, null);
});

test('W777A emits one restrained cue only for forward canonical restoration changes', () => {
  const director = createEonExpanseW777ARestorationAudioCueDirector();
  director.update(board(), { expanseActive: true, currentZoneId: 'gateway-overlook' });
  const progress = director.update(board('restoring'), { expanseActive: true, currentZoneId: 'gateway-overlook' });
  assert.equal(progress.cue.cueType, 'restoration-progress');
  assert.equal(progress.cue.gain, 0.035);
  assert.equal(director.update(board('restoring'), { expanseActive: true, currentZoneId: 'gateway-overlook' }).cue, null);
  const restored = director.update(board('restored'), { expanseActive: true, currentZoneId: 'gateway-overlook' });
  assert.equal(restored.cue.cueType, 'zone-restored');
  assert.ok(restored.cue.durationMs <= 520);
});

test('W777A ignores regression and stores no private or progression state', () => {
  const director = createEonExpanseW777ARestorationAudioCueDirector();
  director.update(board('restored'), { expanseActive: true });
  const result = director.update(board('damaged'), { expanseActive: true });
  assert.equal(result.cue, null);
  assert.equal(director.getSummary().mutatesProgression, false);
});
