import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW766GAudioDirector } from '../../assets/js/city/w766/eon-expanse-w766g-audio-director.js';

class Param { constructor(value = 0) { this.value = value; } setValueAtTime(value) { this.value = value; } linearRampToValueAtTime(value) { this.value = value; } setTargetAtTime(value) { this.value = value; } cancelScheduledValues() {} }
class Node { connect() { return this; } disconnect() {} start() {} stop() {} }
class Gain extends Node { constructor() { super(); this.gain = new Param(1); } }
class Oscillator extends Node { constructor() { super(); this.frequency = new Param(); this.detune = new Param(); this.type = 'sine'; } }
class Filter extends Node { constructor() { super(); this.frequency = new Param(); this.Q = new Param(); this.type = 'lowpass'; } }
class BufferSource extends Node { constructor() { super(); this.buffer = null; this.loop = false; } }
class FakeContext {
  constructor() { this.sampleRate = 100; this.currentTime = 0; this.destination = new Node(); this.state = 'suspended'; }
  createGain() { return new Gain(); }
  createOscillator() { return new Oscillator(); }
  createBiquadFilter() { return new Filter(); }
  createBufferSource() { return new BufferSource(); }
  createBuffer(channels, length) { const data = new Float32Array(length); return { getChannelData: () => data }; }
  resume() { this.state = 'running'; }
  suspend() { this.state = 'suspended'; }
  close() { this.state = 'closed'; }
}

test('audio director is explicit-user-action gated and changes zone without media files', () => {
  const context = new FakeContext();
  const director = createEonExpanseW766GAudioDirector({ audioContextFactory: () => context });
  assert.equal(director.start().reason, 'explicit-user-action-required');
  assert.equal(director.applyPresentation({ currentZone: 'archive-ruins', audio: { intensity: 0.42 } }).pendingUserStart, true);
  const started = director.start({ explicitUserAction: true });
  assert.equal(started.ok, true);
  assert.equal(director.getSummary().zoneId, 'archive-ruins');
  assert.equal(director.getSummary().mediaAssetsRequired, false);
  assert.equal(director.getSummary().proceduralFallbackTruthful, true);
  assert.equal(director.setMuted(true).reason, 'explicit-user-action-required');
  assert.equal(director.setMuted(true, { explicitUserAction: true }).muted, true);
  assert.equal(director.suspend('hub-return').ok, true);
  assert.equal(director.dispose().ok, true);
});

test('audio director fails closed when Web Audio is unavailable', () => {
  const director = createEonExpanseW766GAudioDirector({ audioContextFactory: () => null });
  const result = director.start({ explicitUserAction: true });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'web-audio-unavailable');
});
