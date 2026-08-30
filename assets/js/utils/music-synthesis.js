/**
 * music-synthesis.js
 * Style-aware local music helpers for Creator Studio and Music Lab.
 */

const appWin = /** @type {any} */ (typeof window !== 'undefined' ? window : globalThis);

const STYLE_PROFILES = {
  cinematic: {
    name: 'cinematic',
    bpm: 78,
    rootFreq: 49,
    scale: [0, 2, 3, 5, 7, 8, 10],
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    bass: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    lead: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    pad: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    fx: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
  },
  ambient: {
    name: 'ambient',
    bpm: 66,
    rootFreq: 43,
    scale: [0, 2, 5, 7, 9],
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    hat: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    bass: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    lead: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    pad: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    fx: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0]
  },
  lofi: {
    name: 'lofi',
    bpm: 82,
    rootFreq: 55,
    scale: [0, 2, 3, 5, 7, 10],
    kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0],
    bass: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    lead: [0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
    pad: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    fx: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
  },
  techno: {
    name: 'techno',
    bpm: 132,
    rootFreq: 52,
    scale: [0, 2, 3, 5, 7, 8, 10],
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    hat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    bass: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    lead: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    pad: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    fx: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1]
  },
  hiphop: {
    name: 'hiphop',
    bpm: 92,
    rootFreq: 50,
    scale: [0, 2, 3, 5, 7, 10],
    kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
    bass: [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
    lead: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    pad: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    fx: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
  },
  dj: {
    name: 'dj',
    bpm: 126,
    rootFreq: 58,
    scale: [0, 2, 4, 5, 7, 9, 11],
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    bass: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    lead: [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    pad: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    fx: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1]
  },
  pop: {
    name: 'pop',
    bpm: 108,
    rootFreq: 55,
    scale: [0, 2, 4, 5, 7, 9, 11],
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    bass: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0],
    lead: [0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0],
    pad: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    fx: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0]
  }
};

function hashString(value = '') {
  let hash = 0;
  const text = String(value || '').trim().toLowerCase();
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(31, hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * @param {any[]} pattern
 * @param {number} offset
 * @returns {any[]}
 */
function rotatePattern(pattern = [], offset = 0) {
  if (!Array.isArray(pattern) || !pattern.length) return [];
  const len = pattern.length;
  const shift = ((offset % len) + len) % len;
  return pattern.map((_, idx) => pattern[(idx + shift) % len]);
}

/**
 * @param {any} value
 * @param {number} fallback
 * @returns {number}
 */
function quantizeBpm(value, fallback) {
  const bpm = Number(value);
  if (Number.isFinite(bpm) && bpm > 30) return Math.max(48, Math.min(160, Math.round(bpm)));
  return fallback;
}

export function inferMusicStyle(/** @type {any} */ text = '') {
  const raw = String(text || '').toLowerCase();
  if (/(techno|club|rave|house|edm|dance)/.test(raw)) return 'techno';
  if (/(hip[- ]?hop|rap|trap|boom bap|drill)/.test(raw)) return 'hiphop';
  if (/(lo[- ]?fi|lofi|chill|study|vinyl|jazzy)/.test(raw)) return 'lofi';
  if (/(ambient|meditation|pad|atmospheric|drone|space)/.test(raw)) return 'ambient';
  if (/(cinematic|orchestral|documentary|trailer|score)/.test(raw)) return 'cinematic';
  if (/(dj|club mix|mixdown|dancefloor|festival|clubnight)/.test(raw)) return 'dj';
  if (/(pop|radio|anthem|hook|chorus)/.test(raw)) return 'pop';
  return 'pop';
}

export function getMusicStyleProfile(/** @type {any} */ text = '') {
  const key = inferMusicStyle(text);
  return STYLE_PROFILES[key] || STYLE_PROFILES.pop;
}

export function buildStyleAwareMusicPattern(/** @type {any} */ options = {}) {
  const description = String(options.description || options.brief || options.prompt || '').trim();
  const styleText = String(options.style || options.vibe || '').trim();
  const profile = getMusicStyleProfile(`${styleText} ${description}`);
  const seed = hashString(`${description}|${styleText}`);
  const bpm = quantizeBpm(options.bpm, profile.bpm);
  const rotate = seed % 16;
  const trackMasks = [
    rotatePattern(profile.kick, rotate),
    rotatePattern(profile.snare, rotate + 1),
    rotatePattern(profile.hat, rotate + 2),
    rotatePattern(profile.fx, rotate + 3),
    rotatePattern(profile.bass, rotate + 4),
    rotatePattern(profile.lead, rotate + 5),
    rotatePattern(profile.pad, rotate + 6),
    rotatePattern(profile.fx, rotate + 7)
  ];

  return {
    style: profile.name,
    bpm,
    description,
    tracks: {
      0: trackMasks[0],
      1: trackMasks[1],
      2: trackMasks[2],
      3: trackMasks[3],
      4: trackMasks[4],
      5: trackMasks[5],
      6: trackMasks[6],
      7: trackMasks[7]
    },
    profile
  };
}

/**
 * @param {number} freq
 * @param {number} time
 * @param {number} [phase=0]
 * @returns {number}
 */
function sine(freq, time, phase = 0) {
  return Math.sin((2 * Math.PI * freq * time) + phase);
}

/**
 * @param {number} freq
 * @param {number} time
 * @returns {number}
 */
function saw(freq, time) {
  const p = (freq * time) % 1;
  return 2 * p - 1;
}

/**
 * @param {number} freq
 * @param {number} time
 * @returns {number}
 */
function triangle(freq, time) {
  return 2 * Math.abs(saw(freq, time)) - 1;
}

/**
 * @param {number} seed
 * @returns {number}
 */
function noise(seed) {
  const x = Math.sin(seed * 12345.6789) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/**
 * @param {number} rootFreq
 * @param {number} interval
 * @returns {number}
 */
function scaleFreq(rootFreq, interval) {
  return rootFreq * Math.pow(2, interval / 12);
}

export function createStyleAwareMusicBuffer(/** @type {any} */ durationSec = 18, /** @type {any} */ sampleRate = 44100, /** @type {any} */ options = {}) {
  const AudioBufferCtor = appWin.AudioBuffer;
  if (typeof AudioBufferCtor !== 'function') {
    throw new Error('AudioBuffer is not supported in this browser');
  }

  const profile = getMusicStyleProfile(`${options.style || ''} ${options.vibe || ''} ${options.description || ''}`);
  const bpm = quantizeBpm(options.bpm, profile.bpm);
  const length = Math.max(1, Math.floor(durationSec * sampleRate));
  const audioBuffer = new AudioBufferCtor({ length, sampleRate, numberOfChannels: 2 });
  const pattern = buildStyleAwareMusicPattern(options);
  const stepDuration = 60 / bpm / 4;
  const beatDuration = 60 / bpm;
  const root = Number(options.rootFreq || profile.rootFreq || 55);
  const chordFreqs = profile.scale.map((interval) => scaleFreq(root, interval));
  const barCycle = Math.max(4, Math.min(8, Number(options.barCycle || 4)));

  for (let ch = 0; ch < 2; ch += 1) {
    const data = audioBuffer.getChannelData(ch);
    for (let i = 0; i < length; i += 1) {
      const t = i / sampleRate;
      const stepIndex = Math.floor(t / stepDuration) % 16;
      const stepTime = t % stepDuration;
      const beatIndex = Math.floor(t / beatDuration);
      const barIndex = Math.floor(beatIndex / 4) % barCycle;
      const stepSeed = hashString(`${options.description || ''}|${t.toFixed(4)}|${ch}`);
      const swing = profile.name === 'lofi' ? 0.07 : profile.name === 'dj' ? 0.015 : 0.03;
      const swingTime = (stepIndex % 2 ? swing : 0) * stepDuration;
      const localStepTime = Math.max(0, stepTime - swingTime);

      const kickHit = pattern.tracks[0][stepIndex] ? Math.exp(-localStepTime * 16) : 0;
      const snareHit = pattern.tracks[1][stepIndex] ? Math.exp(-localStepTime * 20) : 0;
      const hatHit = pattern.tracks[2][stepIndex] ? Math.exp(-localStepTime * 28) : 0;
      const bassHit = pattern.tracks[4][stepIndex] ? Math.exp(-localStepTime * 6) : 0;
      const leadHit = pattern.tracks[5][stepIndex] ? Math.exp(-localStepTime * 4) : 0;
      const padHit = pattern.tracks[6][stepIndex] ? 1 : 0;
      const fxHit = pattern.tracks[7][stepIndex] ? Math.exp(-localStepTime * 10) : 0;

      const chordIndex = (barIndex + (stepSeed % chordFreqs.length)) % chordFreqs.length;
      const chordRoot = chordFreqs[chordIndex];
      const chordThird = chordFreqs[(chordIndex + 2) % chordFreqs.length] * 0.5;
      const chordFifth = chordFreqs[(chordIndex + 4) % chordFreqs.length] * 0.5;

      const kick = 0.42 * sine(52 + (profile.name === 'techno' ? 4 : 0), t, 1.8) * kickHit;
      const snare = 0.18 * noise(stepSeed + 11) * snareHit + 0.06 * noise(stepSeed + 17) * snareHit;
      const hat = 0.08 * noise(stepSeed + 23) * hatHit + 0.03 * saw(440, t) * hatHit;
      const bass = 0.22 * triangle(chordRoot * 0.5, t) * bassHit;
      const lead = 0.12 * saw(chordThird * 2, t) * leadHit;
      const pad = 0.15 * (sine(chordRoot * 0.5, t) + sine(chordThird * 0.5, t) + sine(chordFifth * 0.5, t)) / 3 * padHit;
      const fx = 0.04 * noise(stepSeed + 31) * fxHit;
      const texture = 0.015 * noise(stepSeed + (ch * 101));

      const stereoSpread = ch === 0 ? 1 : 0.92;
      const mix = (kick + snare + hat + bass + lead + pad + fx + texture) * stereoSpread;
      data[i] = Math.max(-1, Math.min(1, mix));
    }
  }

  return audioBuffer;
}
