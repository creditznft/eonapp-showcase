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

const restored = { zoneId: 'archive-ruins', artStage: 'restored', restorationPercent: 100, clarityMultiplier: 1.12, intensityMultiplier: 1.06, noiseMultiplier: 0.55, filterMultiplier: 1.14, dynamicEventActive: true, eventInfluence: 0.08 };

test('W776B stores restoration audio truth before explicit user start', () => {
  const director = createEonExpanseW766GAudioDirector({ audioContextFactory: () => new FakeContext() });
  director.applyPresentation({ currentZone: 'archive-ruins', audio: { intensity: 0.5 } });
  const result = director.applyWorldState(restored);
  const summary = director.getSummary();
  assert.equal(result.pendingUserStart, true);
  assert.equal(summary.artStage, 'restored');
  assert.equal(summary.restorationPercent, 100);
  assert.equal(summary.dynamicEventActive, true);
  assert.equal(summary.started, false);
});

test('W776B applies bounded world state after explicit start without a second media runtime', () => {
  const context = new FakeContext();
  const director = createEonExpanseW766GAudioDirector({ audioContextFactory: () => context });
  director.applyPresentation({ currentZone: 'archive-ruins', audio: { intensity: 0.5 } });
  assert.equal(director.start({ explicitUserAction: true }).ok, true);
  const result = director.applyWorldState(restored);
  const summary = director.getSummary();
  assert.equal(result.ok, true);
  assert.equal(result.artStage, 'restored');
  assert.equal(summary.mediaAssetsRequired, false);
  assert.equal(summary.proceduralFallbackTruthful, true);
  assert.equal(summary.intensityMultiplier, 1.06);
  assert.equal(summary.noiseMultiplier, 0.55);
});

test('W776B clamps unsafe multipliers and keeps explicit start authority', () => {
  const director = createEonExpanseW766GAudioDirector({ audioContextFactory: () => new FakeContext() });
  director.applyWorldState({ zoneId: 'transit-scar', artStage: 'restored', intensityMultiplier: 99, noiseMultiplier: -4, filterMultiplier: 99, clarityMultiplier: 99 });
  const summary = director.getSummary();
  assert.equal(summary.intensityMultiplier, 1.12);
  assert.equal(summary.noiseMultiplier, 0.48);
  assert.equal(summary.filterMultiplier, 1.2);
  assert.equal(summary.clarityMultiplier, 1.22);
  assert.equal(director.start().reason, 'explicit-user-action-required');
});
