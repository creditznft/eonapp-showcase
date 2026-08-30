/**
 * Music Production Lab — EONAPP.CH Creator Studio
 * ==================================================
 * Real Web Audio API sequencer with optional model-assisted pattern generation and local WAV export.
 * Adapted from eonpackage music platform concepts for vanilla JS.
 *
 * Features:
 * - Web Audio API synthesizer with multiple oscillators
 * - Beat sequencer (16-step, 8-track)
 * - Optional EONBOT-assisted pattern generation (not full text-to-audio generation)
 * - Audio effects (reverb, delay, distortion, filter)
 * - Recording and export (WAV download)
 * - Mixing console with per-track volume/pan
 * - Preset library (ambient, electronic, lo-fi, cinematic)
 * - Pool Points for creation and publishing
 *
 * @module utils/music-lab
 */

import { runMissionEngine } from './mission-engine.js';
import { buildStyleAwareMusicPattern, inferMusicStyle } from './music-synthesis.js';
import { EON_WORKLOAD_KINDS, getEonWorkloadGovernor } from '../runtime/eon-workload-governor.js';

const appWin = /** @type {any} */ (typeof window !== 'undefined' ? window : globalThis);

// -- Storage keys --
const PROJECTS_KEY = 'eon:music:projects:v1';
// Presets key reserved for future user-created preset sharing

// -- Default BPM and time signature --
const DEFAULT_BPM = 120;
const STEPS = 16;
const TRACKS = 8;

// -- Track types --
export const /** @type {any} */
TRACK_TYPES = {
  KICK: { label: 'Kick', freq: 60, type: 'sine', decay: 0.15 },
  SNARE: { label: 'Snare', freq: 200, type: 'triangle', decay: 0.1 },
  HIHAT: { label: 'Hi-Hat', freq: 800, type: 'square', decay: 0.05 },
  CLAP: { label: 'Clap', freq: 300, type: 'sawtooth', decay: 0.08 },
  BASS: { label: 'Bass', freq: 80, type: 'sine', decay: 0.3 },
  LEAD: { label: 'Lead', freq: 440, type: 'sawtooth', decay: 0.2 },
  PAD: { label: 'Pad', freq: 220, type: 'sine', decay: 0.8 },
  FX: { label: 'FX', freq: 600, type: 'triangle', decay: 0.4 }
};

// -- Preset patterns --
export const /** @type {any} */
PRESET_PATTERNS = {
  'four-on-floor': {
    name: 'Four on the Floor',
    bpm: 128,
    tracks: {
      0: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], // Kick
      1: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], // Snare
      2: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], // HiHat
    }
  },
  'hip-hop': {
    name: 'Hip Hop',
    bpm: 90,
    tracks: {
      0: [1,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0], // Kick
      1: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], // Snare
      2: [1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1], // HiHat
    }
  },
  'ambient': {
    name: 'Ambient',
    bpm: 70,
    tracks: {
      5: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], // Lead
      6: [1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0], // Pad
    }
  },
  'techno': {
    name: 'Techno',
    bpm: 135,
    tracks: {
      0: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], // Kick
      2: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], // HiHat
      4: [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1], // Bass
    }
  },
  'lo-fi': {
    name: 'Lo-Fi',
    bpm: 80,
    tracks: {
      0: [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0], // Kick
      1: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1], // Snare
      2: [1,0,1,1,0,1,1,0,1,1,0,1,0,1,1,0], // HiHat (swing)
      6: [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Pad
    }
  },
  'cinematic': {
    name: 'Cinematic',
    bpm: 60,
    tracks: {
      4: [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Bass
      6: [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Pad
      7: [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], // FX
    }
  }
};

// -- Helpers --
function cryptoId() {
  if (!window.crypto?.getRandomValues) throw new Error('crypto.getRandomValues required');
  const bytes = new Uint8Array(8);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, /** @type {any} */ b => b.toString(16).padStart(2, '0')).join('');
}

function loadJson(/** @type {any} */ key, /** @type {any} */ fallback) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch { return fallback; }
}

function saveJson(/** @type {any} */ key, /** @type {any} */ value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// -- Service class --
class MusicLabService {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.currentStep = 0;
    this.bpm = DEFAULT_BPM;
    this.tracks = [];
    this.masterGain = null;
    this.effects = /** @type {any} */ ({});
    this.recorder = null;
    this.recordedChunks = [];
    this.schedulerTimer = null;
    this.projects = /** @type {any[]} */ ([]);
    this.nextNoteTime = 0;
    this._playbackWorkloadLease = null;
    this._exportWorkloadLease = null;

    // Initialize 8 tracks with empty patterns
    const trackTypes = Object.values(TRACK_TYPES);
    for (let i = 0; i < TRACKS; i++) {
      this.tracks.push({
        id: i,
        type: trackTypes[i].label.toLowerCase(),
        label: trackTypes[i].label,
        pattern: new Array(STEPS).fill(0),
        volume: 0.8,
        pan: 0,
        muted: false,
        freq: trackTypes[i].freq,
        oscType: trackTypes[i].type,
        decay: trackTypes[i].decay
      });
    }

    this._hydrate();
  }

  _releaseWorkloadLease(property, reason = 'workload-finished') {
    try { this[property]?.release?.(reason); } catch {}
    this[property] = null;
  }

  // -- Audio context initialization --
  initAudio() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || appWin.webkitAudioContext)();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.audioCtx.destination);

    // Initialize effects chain
    this._initEffects();
  }

  _initEffects() {
    const ctx = /** @type {any} */ (this.audioCtx);
    if (!ctx) return;

    // Reverb (convolver with generated impulse response)
    const reverb = ctx.createConvolver();
    if (!reverb) return;
    const reverbLen = ctx.sampleRate * 2;
    const impulse = ctx.createBuffer(2, reverbLen, ctx.sampleRate);
    if (!impulse) return;
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < reverbLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 2);
      }
    }
    reverb.buffer = impulse;
    this.effects.reverb = reverb;

    // Delay
    const delay = ctx.createDelay(1.0);
    if (!delay) return;
    delay.delayTime.value = 0.3;
    const delayFeedback = ctx.createGain();
    if (!delayFeedback) return;
    delayFeedback.gain.value = 0.3;
    delay.connect(delayFeedback);
    delayFeedback.connect(delay);
    this.effects.delay = delay;
    this.effects.delayFeedback = delayFeedback;

    // Filter
    const filter = ctx.createBiquadFilter();
    if (!filter) return;
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;
    this.effects.filter = filter;

    // Distortion
    const distortion = ctx.createWaveShaper();
    if (!distortion) return;
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 50) * x / (Math.PI + 50 * Math.abs(x));
    }
    distortion.curve = curve;
    this.effects.distortion = distortion;
  }

  // -- Sequencer --
  play(/** @type {any} */ options = {}) {
    if (this.isPlaying) return { success: true, alreadyPlaying: true };
    const workloadAdmission = getEonWorkloadGovernor().acquire(EON_WORKLOAD_KINDS.AUDIO_PLAYBACK, {
      id: `music-playback:${Date.now()}`,
      source: 'music-lab',
      label: 'Web Audio music playback',
      userInitiated: true,
      confirmPreemptCity: Boolean(options.confirmPreemptCity)
    });
    if (!workloadAdmission.ok) {
      return {
        success: false,
        error: 'Music playback is waiting for this device to have more room.',
        workload: workloadAdmission.decision
      };
    }
    this._releaseWorkloadLease('_playbackWorkloadLease', 'superseded-music-playback');
    this._playbackWorkloadLease = workloadAdmission.lease;
    try {
      this.initAudio();
      const ctx = /** @type {any} */ (this.audioCtx);
      if (!ctx) throw new Error('Audio context unavailable');
      if (ctx.state === 'suspended') ctx.resume();
      this.isPlaying = true;
      this.currentStep = 0;
      this.nextNoteTime = ctx.currentTime;
      this._scheduler();
      return { success: true, workload: workloadAdmission.decision };
    } catch (error) {
      this._releaseWorkloadLease('_playbackWorkloadLease', 'music-playback-start-failed');
      return { success: false, error: (/** @type {Error} */ (error)).message || 'Music playback could not start.' };
    }
  }

  stop() {
    this.isPlaying = false;
    this.currentStep = 0;
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this._releaseWorkloadLease('_playbackWorkloadLease', 'music-stopped');
  }

  pause() {
    this.isPlaying = false;
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this._releaseWorkloadLease('_playbackWorkloadLease', 'music-paused');
  }

  _scheduler() {
    if (!this.isPlaying) return;
    const ctx = /** @type {any} */ (this.audioCtx);
    if (!ctx) return;

    const secondsPerStep = 60.0 / this.bpm / 4; // 16th notes
    while (this.nextNoteTime < ctx.currentTime + 0.1) {
      this._playStep(this.currentStep, this.nextNoteTime);
      this.nextNoteTime += secondsPerStep;
      this.currentStep = (this.currentStep + 1) % STEPS;
    }

    this.schedulerTimer = setTimeout(() => this._scheduler(), 25);
  }

  _playStep(/** @type {any} */ step, /** @type {any} */ time) {
    const ctx = /** @type {any} */ (this.audioCtx);
    const master = /** @type {any} */ (this.masterGain);
    if (!ctx || !master) return;

    for (const /** @type {any} */
track of this.tracks) {
      if (track.muted || !track.pattern[step]) continue;

      const osc = ctx.createOscillator();
      if (!osc) continue;
      const gain = ctx.createGain();
      if (!gain) continue;
      const panner = ctx.createStereoPanner();
      if (!panner) continue;

      osc.type = /** @type {any} */ (track.oscType);
      osc.frequency.value = track.freq;

      // Envelope
      gain.gain.setValueAtTime(track.volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + track.decay);

      panner.pan.value = track.pan;

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(master);

      osc.start(time);
      osc.stop(time + track.decay + 0.01);
    }
  }

  // -- Track manipulation --
  toggleStep(/** @type {any} */ trackIdx, /** @type {any} */ step) {
    if (trackIdx < 0 || trackIdx >= this.tracks.length) return;
    this.tracks[trackIdx].pattern[step] = this.tracks[trackIdx].pattern[step] ? 0 : 1;
  }

  setTrackVolume(/** @type {any} */ trackIdx, /** @type {any} */ vol) {
    if (trackIdx >= 0 && trackIdx < this.tracks.length) this.tracks[trackIdx].volume = Math.max(0, Math.min(1, vol));
  }

  setTrackPan(/** @type {any} */ trackIdx, /** @type {any} */ pan) {
    if (trackIdx >= 0 && trackIdx < this.tracks.length) this.tracks[trackIdx].pan = Math.max(-1, Math.min(1, pan));
  }

  toggleMute(/** @type {any} */ trackIdx) {
    if (trackIdx >= 0 && trackIdx < this.tracks.length) this.tracks[trackIdx].muted = !this.tracks[trackIdx].muted;
    return this.tracks[trackIdx].muted;
  }

  setBPM(/** @type {any} */ bpm) {
    this.bpm = Math.max(40, Math.min(300, bpm));
  }

  // -- Preset loading --
  loadPreset(/** @type {any} */ presetId) {
    const preset = (/** @type {any} */ (PRESET_PATTERNS))[presetId];
    if (!preset) return false;

    // Clear all tracks
    for (const /** @type {any} */
track of this.tracks) {
      track.pattern = new Array(STEPS).fill(0);
    }

    // Load preset patterns
    for (const [trackIdx, pattern] of Object.entries(preset.tracks)) {
      const idx = parseInt(trackIdx);
      if (idx >= 0 && idx < this.tracks.length) {
        this.tracks[idx].pattern = [...pattern];
      }
    }

    this.bpm = preset.bpm || this.bpm;
    return true;
  }

  // -- Export --
  async exportWAV(/** @type {any} */ durationSec, /** @type {any} */ options = {}) {
    const workloadAdmission = getEonWorkloadGovernor().acquire(EON_WORKLOAD_KINDS.MEDIA_EXPORT, {
      id: `music-export:${Date.now()}`,
      source: 'music-lab',
      label: 'Offline WAV export',
      userInitiated: true,
      confirmPreemptCity: Boolean(options.confirmPreemptCity)
    });
    if (!workloadAdmission.ok) {
      return {
        success: false,
        error: workloadAdmission.decision?.userChoiceRequired
          ? 'WAV export needs a visible choice before it competes with active EON City graphics.'
          : 'WAV export is waiting for this device to have more room.',
        workload: workloadAdmission.decision
      };
    }
    this._releaseWorkloadLease('_exportWorkloadLease', 'superseded-music-export');
    this._exportWorkloadLease = workloadAdmission.lease;
    try {
      this.initAudio();
      const ctx = /** @type {any} */ (this.audioCtx);
      if (!ctx) throw new Error('Audio context unavailable');
      durationSec = durationSec || 8;

      const sampleRate = ctx.sampleRate;
    const numSamples = sampleRate * durationSec;

    // Render offline
    const OfflineAC = window.OfflineAudioContext || appWin.webkitOfflineAudioContext;
    const offlineCtx = new OfflineAC(2, numSamples, sampleRate);
    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(offlineCtx.destination);

    const secondsPerStep = 60.0 / this.bpm / 4;
    let time = 0;

    for (let step = 0; step < STEPS * Math.ceil(durationSec / (secondsPerStep * STEPS)); step++) {
      const currentStep = step % STEPS;
      for (const /** @type {any} */
track of this.tracks) {
        if (track.muted || !track.pattern[currentStep]) continue;

        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();

        osc.type = /** @type {any} */ (track.oscType);
        osc.frequency.value = track.freq;
        gain.gain.setValueAtTime(track.volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + track.decay);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(time);
        osc.stop(time + track.decay + 0.01);
      }
      time += secondsPerStep;
      if (time >= durationSec) break;
    }

    const rendered = await offlineCtx.startRendering();

    // Convert to WAV blob
    const wavBlob = this._audioBufferToWav(rendered);

    // Award pool points
      if (appWin.EonPoolPoints?.awardPoints) {
        appWin.EonPoolPoints.awardPoints('creator-post', `Exported music track (${durationSec}s)`);
      }

      return { success: true, blob: wavBlob, workload: workloadAdmission.decision };
    } catch (error) {
      return { success: false, error: (/** @type {Error} */ (error)).message || 'WAV export failed.' };
    } finally {
      this._releaseWorkloadLease('_exportWorkloadLease', 'music-export-finished');
    }
  }

  _audioBufferToWav(/** @type {any} */ buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataLength = buffer.length * blockAlign;
    const headerLength = 44;
    const totalLength = headerLength + dataLength;

    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (/** @type {any} */ offset, /** @type {any} */ str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
    writeString(0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    // Write interleaved samples
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = buffer.getChannelData(ch)[i];
        const clamped = Math.max(-1, Math.min(1, sample));
        const intSample = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += bytesPerSample;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  // -- Project management --
  saveProject(/** @type {any} */ name) {
    const /** @type {any} */
project = {
      id: `proj-${cryptoId()}`,
      name: name || 'Untitled Project',
      bpm: this.bpm,
      tracks: this.tracks.map(/** @type {any} */ t => ({
        type: t.type,
        pattern: [...t.pattern],
        volume: t.volume,
        pan: t.pan,
        muted: t.muted,
        freq: t.freq,
        oscType: t.oscType,
        decay: t.decay
      })),
      savedAt: Date.now()
    };

    this.projects.push(project);
    this._persist();
    return project;
  }

  loadProject(/** @type {any} */ projectId) {
    const project = this.projects.find(/** @type {any} */ p => p.id === projectId);
    if (!project) return false;

    this.bpm = project.bpm;
    for (let i = 0; i < Math.min(project.tracks.length, this.tracks.length); i++) {
      Object.assign(this.tracks[i], project.tracks[i]);
    }
    return true;
  }

  getProjects() {
    return this.projects;
  }

  // -- AI music generation --
  async generateWithAI(/** @type {any} */ description, /** @type {any} */ aiRuntime) {
    const normalizedDescription = String(description || '').trim() || 'creator groove';
    const systemPrompt = `You are EONBOT Music AI. Generate a beat pattern for a 16-step sequencer with 8 tracks.
Tracks: Kick, Snare, Hi-Hat, Clap, Bass, Lead, Pad, FX.
Return JSON ONLY: { "bpm": number, "tracks": { "0": [0/1 x 16], "1": [0/1 x 16], ... } }
Style: ${normalizedDescription}`;

    const applyPattern = (/** @type {any} */ pattern, /** @type {any} */ source = 'ai') => {
      if (!pattern || typeof pattern !== 'object' || !pattern.tracks) return { success: false, error: 'AI did not return valid pattern JSON' };

      if (pattern.bpm) this.bpm = Math.max(40, Math.min(300, pattern.bpm));
      for (const [trackIdx, steps] of Object.entries(pattern.tracks || {})) {
        const idx = parseInt(trackIdx);
        if (idx >= 0 && idx < this.tracks.length && Array.isArray(steps)) {
          for (let s = 0; s < Math.min(steps.length, STEPS); s++) {
            this.tracks[idx].pattern[s] = steps[s] ? 1 : 0;
          }
        }
      }

      if (appWin.EonPoolPoints?.awardPoints) {
        appWin.EonPoolPoints.awardPoints('creator-hook', `${source === 'local' ? 'Local pattern' : 'Model-assisted pattern'}: ${normalizedDescription}`);
      }

      return { success: true, bpm: this.bpm, pattern: { ...pattern, source } };
    };

    const synthesizeLocalPattern = () => {
      const fallback = buildStyleAwareMusicPattern({
        description: normalizedDescription,
        style: inferMusicStyle(normalizedDescription),
        bpm: this.bpm
      });
      return {
        bpm: fallback.bpm,
        tracks: fallback.tracks
      };
    };

    try {
      const adapter = aiRuntime?.musicAdapter || aiRuntime?.musicModelAdapter || null;
      if (adapter) {
        if (typeof adapter.generatePattern === 'function') {
          const adapted = await adapter.generatePattern({
            description: normalizedDescription,
            systemPrompt,
            trackCount: this.tracks.length,
            stepCount: STEPS,
            bpm: this.bpm
          });
          const result = applyPattern(adapted, 'adapter');
          if (result.success) return result;
        } else if (typeof adapter === 'function') {
          const adapted = await adapter({
            description: normalizedDescription,
            systemPrompt,
            trackCount: this.tracks.length,
            stepCount: STEPS,
            bpm: this.bpm
          });
          const result = applyPattern(adapted, 'adapter');
          if (result.success) return result;
        }
      }

      if (aiRuntime) {
        const runtimeSettings = typeof aiRuntime.loadAISettings === 'function' ? aiRuntime.loadAISettings() : {};
        const reply = await runMissionEngine({
          mode: 'music',
          prompt: `Generate a ${normalizedDescription} beat pattern`,
          history: [],
          systemPrompt,
          settings: runtimeSettings,
          taskType: 'music',
          origin: 'music-lab',
          metadata: {
            surface: 'music-lab',
            description: normalizedDescription
          }
        });
        const result = String(reply?.text || '');
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const pattern = JSON.parse(jsonMatch[0]);
            const applied = applyPattern(pattern, 'ai');
            if (applied.success) return applied;
          } catch {}
        }
      }

      const localPattern = synthesizeLocalPattern();
      return applyPattern(localPattern, 'local');
    } catch (/** @type {any} */
err) {
      try {
        const localPattern = synthesizeLocalPattern();
        const applied = applyPattern(localPattern, 'local');
        if (applied.success) return applied;
      } catch {}
      return { success: false, error: (/** @type {Error} */ (err)).message || 'AI generation failed' };
    }
  }

  // -- Private --
  _hydrate() {
    this.projects = loadJson(PROJECTS_KEY, []);
  }

  _persist() {
    saveJson(PROJECTS_KEY, this.projects.slice(-50));
  }
}

// -- Singleton --
const musicLabService = new MusicLabService();
export default musicLabService;
export { MusicLabService };
