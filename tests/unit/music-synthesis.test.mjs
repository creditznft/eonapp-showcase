import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStyleAwareMusicPattern, inferMusicStyle } from '../../assets/js/utils/music-synthesis.js';

test('music synthesis infers a style from prompt text', () => {
  assert.equal(inferMusicStyle('make a lo-fi study groove'), 'lofi');
  assert.equal(inferMusicStyle('dj mixdown anthem'), 'dj');
  assert.equal(inferMusicStyle('cinematic trailer score'), 'cinematic');
});

test('music synthesis builds different style-aware patterns', () => {
  const lofi = buildStyleAwareMusicPattern({ style: 'lofi', description: 'late night study beat' });
  const techno = buildStyleAwareMusicPattern({ style: 'techno', description: 'warehouse club groove' });

  assert.equal(lofi.tracks[0].length, 16);
  assert.equal(techno.tracks[0].length, 16);
  assert.notDeepEqual(lofi.tracks[0], techno.tracks[0]);
  assert.ok(lofi.bpm >= 48 && lofi.bpm <= 160);
  assert.ok(techno.bpm >= 48 && techno.bpm <= 160);
});
