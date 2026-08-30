const freeze = (value) => Object.freeze(value);

export const EON_EXPANSE_W766G_AUDIO_SCHEMA = 'eon.city.expanse.audio-director.w766g.v1';

const ZONE_TONES = freeze({
  'gateway-overlook': freeze({ low: 82.41, high: 164.81, filter: 720, noise: 0.018 }),
  'beacon-fields': freeze({ low: 98, high: 196, filter: 980, noise: 0.026 }),
  'archive-ruins': freeze({ low: 73.42, high: 146.83, filter: 560, noise: 0.014 }),
  'transit-scar': freeze({ low: 110, high: 220, filter: 1180, noise: 0.032 }),
  'horizon-vault': freeze({ low: 65.41, high: 261.63, filter: 820, noise: 0.02 })
});

const DEFAULT_WORLD_STATE = freeze({
  zoneId: 'gateway-overlook',
  artStage: 'damaged',
  restorationPercent: 0,
  clarityMultiplier: 0.72,
  intensityMultiplier: 0.82,
  noiseMultiplier: 1.15,
  filterMultiplier: 0.78,
  eventInfluence: 0,
  dynamicEventActive: false,
  reducedSensory: false
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

function normalizeWorldState(state = {}, fallbackZone = 'gateway-overlook') {
  const zoneId = ZONE_TONES[String(state?.zoneId || '')] ? String(state.zoneId) : String(fallbackZone || 'gateway-overlook');
  const artStage = ['damaged', 'restoring', 'restored'].includes(String(state?.artStage || '')) ? String(state.artStage) : 'damaged';
  return freeze({
    zoneId,
    artStage,
    restorationPercent: clamp(state?.restorationPercent, 0, 100),
    clarityMultiplier: clamp(state?.clarityMultiplier || DEFAULT_WORLD_STATE.clarityMultiplier, 0.65, 1.22),
    intensityMultiplier: clamp(state?.intensityMultiplier || DEFAULT_WORLD_STATE.intensityMultiplier, 0.72, 1.12),
    noiseMultiplier: clamp(state?.noiseMultiplier || DEFAULT_WORLD_STATE.noiseMultiplier, 0.48, 1.2),
    filterMultiplier: clamp(state?.filterMultiplier || DEFAULT_WORLD_STATE.filterMultiplier, 0.7, 1.2),
    eventInfluence: clamp(state?.eventInfluence, 0, 0.1),
    dynamicEventActive: state?.dynamicEventActive === true,
    reducedSensory: state?.reducedSensory === true
  });
}

function defaultFactory() {
  const Constructor = globalThis.AudioContext || globalThis.webkitAudioContext;
  return Constructor ? new Constructor() : null;
}

function safeStop(node, at = 0) {
  try { node?.stop?.(at); } catch {}
  try { node?.disconnect?.(); } catch {}
}

function createNoiseSource(context, seconds = 2) {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  // Stable pseudo-random sequence avoids hidden network/media dependencies.
  let seed = 0x766f2026;
  for (let index = 0; index < frameCount; index += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    data[index] = ((seed / 0xffffffff) * 2 - 1) * 0.48;
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function applyVoiceWorldState(voice, intensity, worldState, context, { immediate = false } = {}) {
  if (!voice || !context) return;
  const state = normalizeWorldState(worldState, voice.zoneId);
  const plan = voice.plan || ZONE_TONES[voice.zoneId] || ZONE_TONES['gateway-overlook'];
  const now = context.currentTime;
  const targetBus = clamp(0.16 * intensity * state.intensityMultiplier, 0.025, 0.24);
  const targetFilter = clamp(plan.filter * state.filterMultiplier, 320, 1800);
  const targetLow = clamp(0.12 * intensity * state.intensityMultiplier, 0.012, 0.16);
  const targetHigh = clamp(0.032 * intensity * state.clarityMultiplier, 0.004, 0.06);
  const targetNoise = clamp(plan.noise * intensity * state.noiseMultiplier, 0.002, 0.045);
  const set = (param, value, timeConstant = 0.18) => {
    if (!param) return;
    try {
      if (immediate) param.setValueAtTime(value, now);
      else param.setTargetAtTime(value, now, timeConstant);
    } catch { param.value = value; }
  };
  set(voice.filter?.frequency, targetFilter, 0.24);
  set(voice.lowGain?.gain, targetLow);
  set(voice.highGain?.gain, targetHigh);
  set(voice.noiseGain?.gain, targetNoise, 0.28);
  set(voice.bus?.gain, targetBus, 0.24);
}

function createVoice(context, destination, zoneId, intensity = 0.45, worldState = DEFAULT_WORLD_STATE) {
  const plan = ZONE_TONES[zoneId] || ZONE_TONES['gateway-overlook'];
  const bus = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = plan.filter;
  filter.Q.value = 0.65;
  bus.gain.value = 0;
  bus.connect(filter);
  filter.connect(destination);

  const low = context.createOscillator();
  low.type = 'sine';
  low.frequency.value = plan.low;
  const lowGain = context.createGain();
  lowGain.gain.value = 0.12 * intensity;
  low.connect(lowGain); lowGain.connect(bus);

  const high = context.createOscillator();
  high.type = zoneId === 'transit-scar' ? 'triangle' : 'sine';
  high.frequency.value = plan.high;
  high.detune.value = zoneId === 'archive-ruins' ? -7 : 5;
  const highGain = context.createGain();
  highGain.gain.value = 0.032 * intensity;
  high.connect(highGain); highGain.connect(bus);

  const noise = createNoiseSource(context);
  const noiseGain = context.createGain();
  noiseGain.gain.value = plan.noise * intensity;
  noise.connect(noiseGain); noiseGain.connect(bus);

  const lfo = context.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = zoneId === 'horizon-vault' ? 0.08 : 0.12;
  const lfoGain = context.createGain();
  lfoGain.gain.value = zoneId === 'beacon-fields' ? 9 : 4;
  lfo.connect(lfoGain); lfoGain.connect(high.detune);

  const now = context.currentTime;
  low.start(now); high.start(now); noise.start(now); lfo.start(now);
  const created = freeze({ zoneId, plan, bus, filter, lowGain, highGain, noiseGain, nodes: freeze([low, high, noise, lfo]), createdAt: now });
  applyVoiceWorldState(created, intensity, worldState, context, { immediate: true });
  return created;
}

export function createEonExpanseW766GAudioDirector({
  audioContextFactory = defaultFactory,
  masterVolume = 0.16,
  enabled = true
} = {}) {
  let context = null;
  let master = null;
  let voice = null;
  let desiredZone = 'gateway-overlook';
  let desiredIntensity = 0.45;
  let desiredWorldState = normalizeWorldState(DEFAULT_WORLD_STATE, desiredZone);
  let muted = false;
  let started = false;
  let disposed = false;
  let lastError = '';
  let activeCueCount = 0;
  let lastCueKey = '';

  const ensureContext = () => {
    if (disposed || !enabled) return null;
    if (context) return context;
    try {
      context = audioContextFactory?.() || null;
      if (!context) return null;
      master = context.createGain();
      master.gain.value = muted ? 0 : masterVolume;
      master.connect(context.destination);
      return context;
    } catch (error) {
      lastError = String(error?.message || error || 'audio-context-failed').slice(0, 180);
      context = null; master = null;
      return null;
    }
  };

  const replaceVoice = (zoneId, intensity) => {
    const ctx = ensureContext();
    if (!ctx || !master) return freeze({ ok: false, reason: 'web-audio-unavailable' });
    if (voice?.zoneId === zoneId) {
      applyVoiceWorldState(voice, intensity, desiredWorldState, ctx);
      return freeze({ ok: true, unchanged: true, zoneId, artStage: desiredWorldState.artStage });
    }
    const previous = voice;
    voice = createVoice(ctx, master, zoneId, intensity, desiredWorldState);
    if (previous) {
      const now = ctx.currentTime;
      try {
        previous.bus.gain.cancelScheduledValues(now);
        previous.bus.gain.setValueAtTime(previous.bus.gain.value, now);
        previous.bus.gain.linearRampToValueAtTime(0, now + 0.9);
      } catch {}
      globalThis.setTimeout?.(() => {
        for (const node of previous.nodes || []) safeStop(node);
        try { previous.bus.disconnect?.(); } catch {}
      }, 1100);
    }
    return freeze({ ok: true, zoneId, artStage: desiredWorldState.artStage, proceduralFallback: true });
  };

  return freeze({
    schema: EON_EXPANSE_W766G_AUDIO_SCHEMA,
    start({ explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (disposed) return freeze({ ok: false, reason: 'audio-director-disposed' });
      const ctx = ensureContext();
      if (!ctx) return freeze({ ok: false, reason: 'web-audio-unavailable', lastError });
      try { ctx.resume?.(); } catch {}
      started = true;
      return replaceVoice(desiredZone, desiredIntensity);
    },
    applyPresentation(presentation = {}) {
      desiredZone = ZONE_TONES[String(presentation.currentZone || '')] ? String(presentation.currentZone) : desiredZone;
      desiredIntensity = Math.max(0.1, Math.min(1, Number(presentation.audio?.intensity || desiredIntensity || 0.45)));
      desiredWorldState = normalizeWorldState({ ...desiredWorldState, zoneId: desiredZone }, desiredZone);
      if (!started || !context) return freeze({ ok: true, pendingUserStart: true, zoneId: desiredZone });
      return replaceVoice(desiredZone, desiredIntensity);
    },
    applyWorldState(state = {}) {
      desiredWorldState = normalizeWorldState(state, desiredZone);
      if (desiredWorldState.zoneId !== desiredZone) desiredWorldState = normalizeWorldState({ ...desiredWorldState, zoneId: desiredZone }, desiredZone);
      if (!started || !context || !voice) return freeze({ ok: true, pendingUserStart: true, zoneId: desiredZone, artStage: desiredWorldState.artStage });
      applyVoiceWorldState(voice, desiredIntensity, desiredWorldState, context);
      return freeze({ ok: true, zoneId: desiredZone, artStage: desiredWorldState.artStage, dynamicEventActive: desiredWorldState.dynamicEventActive });
    },
    playRestorationCue(cue = {}) {
      const cueType = String(cue?.cueType || '');
      const cueKey = String(cue?.cueKey || '').replace(/[^a-z0-9:_-]+/gi, '').slice(0, 160);
      if (!['restoration-progress', 'zone-restored'].includes(cueType) || !cueKey) return freeze({ ok: false, reason: 'valid-restoration-cue-required' });
      if (!started || !context || !master) return freeze({ ok: false, reason: 'audio-not-started', startsAudioAutomatically: false });
      if (cueKey === lastCueKey) return freeze({ ok: true, unchanged: true, cueKey });
      const plan = ZONE_TONES[desiredZone] || ZONE_TONES['gateway-overlook'];
      const durationMs = clamp(cue?.durationMs, 180, 600);
      const gainValue = clamp(cue?.gain, 0.015, 0.06);
      const oscillator = context.createOscillator();
      const cueGain = context.createGain();
      oscillator.type = cueType === 'zone-restored' ? 'sine' : 'triangle';
      oscillator.frequency.value = clamp(plan.high * (cueType === 'zone-restored' ? 1.5 : 1.08), 96, 620);
      cueGain.gain.value = 0;
      oscillator.connect(cueGain); cueGain.connect(master);
      const now = context.currentTime;
      try {
        cueGain.gain.setValueAtTime(0, now);
        cueGain.gain.linearRampToValueAtTime(gainValue, now + 0.04);
        cueGain.gain.linearRampToValueAtTime(0, now + durationMs / 1000);
        oscillator.start(now);
        oscillator.stop(now + durationMs / 1000 + 0.04);
      } catch (error) {
        safeStop(oscillator);
        try { cueGain.disconnect?.(); } catch {}
        return freeze({ ok: false, reason: 'restoration-cue-failed', error: String(error?.message || error || '').slice(0, 120) });
      }
      activeCueCount += 1;
      lastCueKey = cueKey;
      globalThis.setTimeout?.(() => {
        safeStop(oscillator);
        try { cueGain.disconnect?.(); } catch {}
        activeCueCount = Math.max(0, activeCueCount - 1);
      }, durationMs + 120);
      return freeze({ ok: true, cueKey, cueType, durationMs, startedExistingAudioOnly: true, awardsXp: false });
    },
    setMuted(next, { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      muted = Boolean(next);
      if (master && context) {
        const now = context.currentTime;
        try { master.gain.setTargetAtTime(muted ? 0 : masterVolume, now, 0.08); } catch { master.gain.value = muted ? 0 : masterVolume; }
      }
      return freeze({ ok: true, muted });
    },
    suspend(reason = 'world-inactive') {
      if (voice && context) {
        const now = context.currentTime;
        try { voice.bus.gain.setTargetAtTime(0, now, 0.12); } catch { voice.bus.gain.value = 0; }
      }
      started = false;
      try { context?.suspend?.(); } catch {}
      return freeze({ ok: true, reason: String(reason) });
    },
    dispose() {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      disposed = true;
      for (const node of voice?.nodes || []) safeStop(node);
      try { voice?.bus?.disconnect?.(); } catch {}
      try { master?.disconnect?.(); } catch {}
      try { context?.close?.(); } catch {}
      voice = null; master = null; context = null; started = false;
      return freeze({ ok: true });
    },
    getSummary() {
      return freeze({
        schema: EON_EXPANSE_W766G_AUDIO_SCHEMA,
        enabled: Boolean(enabled),
        started,
        muted,
        zoneId: desiredZone,
        intensity: desiredIntensity,
        artStage: desiredWorldState.artStage,
        restorationPercent: desiredWorldState.restorationPercent,
        clarityMultiplier: desiredWorldState.clarityMultiplier,
        intensityMultiplier: desiredWorldState.intensityMultiplier,
        noiseMultiplier: desiredWorldState.noiseMultiplier,
        filterMultiplier: desiredWorldState.filterMultiplier,
        dynamicEventActive: desiredWorldState.dynamicEventActive,
        reducedSensory: desiredWorldState.reducedSensory,
        activeCueCount,
        lastCueKey,
        webAudioAvailable: Boolean(context || globalThis.AudioContext || globalThis.webkitAudioContext),
        mediaAssetsRequired: false,
        approvedAudioAssetsPresent: false,
        proceduralFallbackTruthful: true,
        explicitStartRequired: true,
        lastError,
        disposed
      });
    }
  });
}
