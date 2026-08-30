import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW766GAudioDirector } from '../../assets/js/city/w766/eon-expanse-w766g-audio-director.js';

class Param { constructor(value = 0) { this.value = value; } setValueAtTime(value) { this.value = value; } linearRampToValueAtTime(value) { this.value = value; } setTargetAtTime(value) { this.value = value; } cancelScheduledValues() {} }
class Node { connect() { return this; } disconnect() {} start() { this.started = true; } stop() { this.stopped = true; } }
class Gain extends Node { constructor() { super(); this.gain = new Param(1); } }
class Oscillator extends Node { constructor() { super(); this.frequency = new Param(); this.detune = new Param(); this.type = 'sine'; } }
class Filter extends Node { constructor() { super(); this.frequency = new Param(); this.Q = new Param(); this.type = 'lowpass'; } }
class BufferSource extends Node { constructor() { super(); this.buffer = null; this.loop = false; } }
class FakeContext {
  constructor() { this.sampleRate = 100; this.currentTime = 0; this.destination = new Node(); this.oscillators = []; }
  createGain() { return new Gain(); }
  createOscillator() { const value = new Oscillator(); this.oscillators.push(value); return value; }
  createBiquadFilter() { return new Filter(); }
  createBufferSource() { return new BufferSource(); }
  createBuffer(channels, length) { const data = new Float32Array(length); return { getChannelData: () => data }; }
  resume() {}
  suspend() {}
  close() {}
}

const cue = { cueKey: 'beacon-fields:restored', cueType: 'zone-restored', durationMs: 520, gain: 0.055 };

test('W777B refuses to start audio merely because a restoration cue exists', () => {
  const director = createEonExpanseW766GAudioDirector({ audioContextFactory: () => new FakeContext() });
  const result = director.playRestorationCue(cue);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'audio-not-started');
  assert.equal(result.startsAudioAutomatically, false);
  assert.equal(director.getSummary().started, false);
});

test('W777B plays one bounded procedural cue only through an already-started context', () => {
  const context = new FakeContext();
  const director = createEonExpanseW766GAudioDirector({ audioContextFactory: () => context });
  director.applyPresentation({ currentZone: 'beacon-fields', audio: { intensity: 0.5 } });
  director.start({ explicitUserAction: true });
  const before = context.oscillators.length;
  const result = director.playRestorationCue(cue);
  assert.equal(result.ok, true);
  assert.equal(result.startedExistingAudioOnly, true);
  assert.ok(context.oscillators.length > before);
  assert.equal(result.durationMs, 520);
  assert.equal(result.awardsXp, false);
});

test('W777B rejects malformed and duplicate cue identities', () => {
  const director = createEonExpanseW766GAudioDirector({ audioContextFactory: () => new FakeContext() });
  director.start({ explicitUserAction: true });
  assert.equal(director.playRestorationCue({}).reason, 'valid-restoration-cue-required');
  assert.equal(director.playRestorationCue(cue).ok, true);
  assert.equal(director.playRestorationCue(cue).unchanged, true);
});
