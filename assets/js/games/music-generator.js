/**
 * Code-Based Music Generator for EON Games
 * 
 * Features:
 * - Procedural music generation using Web Audio API
 * - Multiple musical scales and modes
 * - Melody generation algorithms
 * - Harmony and chord progression
 * - Rhythm and beat patterns
 * - Dynamic tempo and volume
 * - Song structure (intro, verse, chorus, bridge, outro)
 * - Mood-based composition
 * - Random seed for reproducibility
 */

export class MusicGenerator {
  constructor() {
    /** @type {any} */
    this.audioContext = null;
    /** @type {any} */
    this.masterGain = null;
    this.isPlaying = false;
    /** @type {any} */
    this.currentSong = null;
    this.currentNote = 0;
    this.nextNoteTime = 0;
    this.tempo = 120;
    this.scale = 'major';
    this.key = 'C';
    this.octave = 4;
    
    // Musical scales
    this.scales = {
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10],
      harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
      melodicMinor: [0, 2, 3, 5, 7, 9, 11],
      dorian: [0, 2, 3, 5, 7, 9, 10],
      phrygian: [0, 1, 3, 5, 7, 8, 10],
      lydian: [0, 2, 4, 6, 7, 9, 11],
      mixolydian: [0, 2, 4, 5, 7, 9, 10],
      locrian: [0, 1, 3, 5, 6, 8, 10],
      pentatonicMajor: [0, 2, 4, 7, 9],
      pentatonicMinor: [0, 3, 5, 7, 10],
      blues: [0, 3, 5, 6, 7, 10],
      chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    };
    
    // Chord progressions
    this.chordProgressions = {
      pop: [0, 5, 3, 4], // I-V-vi-IV
      rock: [0, 4, 5, 3], // I-IV-V-vi
      jazz: [0, 5, 1, 4], // I-vi-ii-V
      classical: [0, 5, 6, 3], // I-vi-ii-V (with secondary dominants)
      epic: [0, 5, 3, 7], // I-vi-iii-VII
      mysterious: [0, 3, 6, 2], // I-iv-VII-ii
      tense: [0, 5, 0, 6], // I-V-I-VII
      peaceful: [0, 3, 4, 5], // I-iv-V-V
      battle: [0, 5, 0, 4], // I-V-I-IV
      victory: [0, 4, 5, 0], // I-IV-V-I
      dungeon: [0, 6, 3, 7], // I-vi-iii-VII (minor)
      forest: [0, 3, 4, 5], // I-iv-V-V (lydian)
      volcanic: [0, 5, 3, 7], // I-V-iii-VII (phrygian dominant)
      frozen: [0, 5, 1, 4], // I-vi-ii-V (dorian)
      crypt: [0, 3, 6, 2], // I-iv-VII-ii (locrian)
      tavern: [0, 5, 1, 4], // I-vi-ii-V (folk)
      boss: [0, 6, 2, 7], // i-iv-VII-III (harmonic minor)
      menu: [0, 5, 3, 4], // I-V-vi-IV
      gameover: [0, 5, 1, 4] // I-vi-ii-V
    };
    
    // Note durations
    this.durations = {
      whole: 4,
      half: 2,
      quarter: 1,
      eighth: 0.5,
      sixteenth: 0.25,
      dottedHalf: 3,
      dottedQuarter: 1.5,
      dottedEighth: 0.75
    };
    
    // Instrument types
    this.instruments = {
      sine: { type: 'sine', attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.1 },
      triangle: { type: 'triangle', attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.1 },
      square: { type: 'square', attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.1 },
      sawtooth: { type: 'sawtooth', attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.1 },
      piano: { type: 'custom', attack: 0.005, decay: 0.3, sustain: 0.4, release: 0.5 },
      organ: { type: 'custom', attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3 },
      strings: { type: 'custom', attack: 0.1, decay: 0.2, sustain: 0.6, release: 0.4 },
      brass: { type: 'custom', attack: 0.05, decay: 0.1, sustain: 0.4, release: 0.3 },
      flute: { type: 'custom', attack: 0.05, decay: 0.1, sustain: 0.3, release: 0.2 },
      percussion: { type: 'custom', attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.1 }
    };
    
    // Song templates
    this.songTemplates = {
      dungeon: {
        mood: 'tense',
        tempo: 80,
        scale: 'minor',
        progression: 'dungeon',
        structure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
        instruments: ['piano', 'strings'],
        layers: 2
      },
      battle: {
        mood: 'intense',
        tempo: 140,
        scale: 'minor',
        progression: 'battle',
        structure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
        instruments: ['brass', 'percussion', 'strings'],
        layers: 3
      },
      boss: {
        mood: 'epic',
        tempo: 160,
        scale: 'harmonicMinor',
        progression: 'boss',
        structure: ['intro', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
        instruments: ['brass', 'organ', 'percussion'],
        layers: 3
      },
      victory: {
        mood: 'triumphant',
        tempo: 100,
        scale: 'major',
        progression: 'victory',
        structure: ['intro', 'chorus', 'bridge', 'chorus', 'outro'],
        instruments: ['brass', 'strings', 'organ'],
        layers: 3
      },
      menu: {
        mood: 'mysterious',
        tempo: 70,
        scale: 'dorian',
        progression: 'menu',
        structure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'outro'],
        instruments: ['piano', 'strings'],
        layers: 2
      },
      town: {
        mood: 'peaceful',
        tempo: 90,
        scale: 'major',
        progression: 'peaceful',
        structure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'outro'],
        instruments: ['piano', 'organ', 'strings'],
        layers: 2
      },
      forest: {
        mood: 'peaceful',
        tempo: 85,
        scale: 'lydian',
        progression: 'forest',
        structure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'outro'],
        instruments: ['flute', 'strings'],
        layers: 2
      },
      volcanic: {
        mood: 'intense',
        tempo: 120,
        scale: 'mixolydian',
        progression: 'volcanic',
        structure: ['intro', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
        instruments: ['brass', 'percussion'],
        layers: 2
      },
      frozen: {
        mood: 'eerie',
        tempo: 60,
        scale: 'dorian',
        progression: 'frozen',
        structure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'outro'],
        instruments: ['strings', 'flute'],
        layers: 2
      },
      crypt: {
        mood: 'eerie',
        tempo: 50,
        scale: 'locrian',
        progression: 'crypt',
        structure: ['intro', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
        instruments: ['organ', 'strings'],
        layers: 2
      }
    };
  }
  
  // === INITIALIZATION ===
  
  async init() {
    try {
      this.audioContext = new (window.AudioContext || /** @type {any} */ (window).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
      return true;
    } catch (/** @type {any} */
e) {
      console.warn('Audio context not supported:', e);
      return false;
    }
  }
  
  // === MUSIC GENERATION ===
  
  generateSong(/** @type {any} */ template, /** @type {any} */ seed = Date.now()) {
    const songTemplate = (/** @type {any} */ (this.songTemplates))[template] || this.songTemplates.menu;
    
    this.currentSong = {
      template: template,
      seed: seed,
      tempo: songTemplate.tempo,
      scale: songTemplate.scale,
      progression: songTemplate.progression,
      structure: songTemplate.structure,
      instruments: songTemplate.instruments,
      layers: songTemplate.layers,
      notes: [],
      chords: [],
      melody: [],
      bass: [],
      harmony: [],
      rhythm: []
    };
    
    // Set tempo
    this.tempo = songTemplate.tempo;
    this.scale = songTemplate.scale;
    
    // Generate song structure
    this.generateSongStructure(seed);
    
    return this.currentSong;
  }
  
  generateSongStructure(/** @type {any} */ seed) {
    const rng = this.seededRandom(seed);
    const template = /** @type {any} */ (this.currentSong);
    if (!template || !Array.isArray(template.structure)) return;
    
    let currentTime = 0;
    const beatDuration = 60 / this.tempo;
    
    for (const /** @type {any} */
section of template.structure) {
      const sectionLength = this.getSectionLength(section, rng);
      
      for (let i = 0; i < sectionLength; i++) {
        // Generate melody note
        const melodyNote = this.generateMelodyNote(currentTime, rng, section);
        template.melody.push(melodyNote);
        
        // Generate bass note
        const bassNote = this.generateBassNote(currentTime, rng, section);
        template.bass.push(bassNote);
        
        // Generate harmony note
        const harmonyNote = this.generateHarmonyNote(currentTime, rng, section);
        template.harmony.push(harmonyNote);
        
        // Generate rhythm
        const rhythm = this.generateRhythm(rng, section);
        template.rhythm.push(rhythm);
        
        currentTime += beatDuration * rhythm.duration;
      }
    }
  }
  
  getSectionLength(/** @type {any} */ section, /** @type {any} */ _rng) {
    const /** @type {any} */
lengths = {
      intro: 8,
      verse: 16,
      chorus: 16,
      bridge: 8,
      outro: 8
    };
    return (/** @type {any} */ (lengths))[section] || 16;
  }
  
  generateMelodyNote(/** @type {any} */ time, /** @type {any} */ rng, /** @type {any} */ section) {
    const song = /** @type {any} */ (this.currentSong || {});
    const scale = (/** @type {any} */ (this.scales))[this.scale];
    const scaleIndex = Math.floor(rng() * scale.length);
    const octaveOffset = Math.floor(rng() * 2) - 1;
    
    const /** @type {any} */
note = {
      time: time,
      pitch: scale[scaleIndex],
      octave: this.octave + octaveOffset,
      duration: this.selectDuration(rng, section),
      velocity: 0.7 + rng() * 0.3,
      instrument: song.instruments?.[0]
    };
    
    return note;
  }
  
  generateBassNote(/** @type {any} */ time, /** @type {any} */ rng, /** @type {any} */ section) {
    const song = /** @type {any} */ (this.currentSong || {});
    const progression = (/** @type {any} */ (this.chordProgressions))[song.progression];
    const chordIndex = Math.floor(time / (60 / this.tempo * 4)) % progression.length;
    const root = progression[chordIndex];
    
    const /** @type {any} */
note = {
      time: time,
      pitch: root,
      octave: this.octave - 1,
      duration: this.selectDuration(rng, section),
      velocity: 0.8,
      instrument: song.instruments?.[song.instruments.length - 1]
    };
    
    return note;
  }
  
  generateHarmonyNote(/** @type {any} */ time, /** @type {any} */ rng, /** @type {any} */ section) {
    const song = /** @type {any} */ (this.currentSong || {});
    const progression = (/** @type {any} */ (this.chordProgressions))[song.progression];
    const chordIndex = Math.floor(time / (60 / this.tempo * 4)) % progression.length;
    const root = progression[chordIndex];
    
    // Add third or fifth
    const interval = rng() < 0.5 ? 3 : 5;
    
    const /** @type {any} */
note = {
      time: time,
      pitch: (root + interval) % 12,
      octave: this.octave,
      duration: this.selectDuration(rng, section),
      velocity: 0.5,
      instrument: song.instruments?.[1] || song.instruments?.[0]
    };
    
    return note;
  }
  
  generateRhythm(/** @type {any} */ rng, /** @type {any} */ section) {
    const /** @type {any} */
rhythmPatterns = {
      intro: [0.5, 0.5, 0.5, 0.5],
      verse: [1, 0.5, 0.5, 1, 0.5, 0.5, 1, 1],
      chorus: [1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5],
      bridge: [0.5, 1, 1, 0.5],
      outro: [1, 1, 1, 1]
    };
    
    const pattern = (/** @type {any} */ (rhythmPatterns))[section] || rhythmPatterns.verse;
    const duration = pattern[Math.floor(rng() * pattern.length)];
    
    return { duration };
  }
  
  selectDuration(/** @type {any} */ _rng, /** @type {any} */ section) {
    const /** @type {any} */
durations = [0.5, 1, 1.5, 2];
    const /** @type {any} */
weights = {
      intro: [0.4, 0.3, 0.2, 0.1],
      verse: [0.3, 0.4, 0.2, 0.1],
      chorus: [0.3, 0.4, 0.2, 0.1],
      bridge: [0.4, 0.3, 0.2, 0.1],
      outro: [0.2, 0.4, 0.3, 0.1]
    };
    
    const sectionWeights = (/** @type {any} */ (weights))[section] || weights.verse;
    const roll = _rng();
    
    let cumulative = 0;
    for (let i = 0; i < durations.length; i++) {
      cumulative += sectionWeights[i];
      if (roll < cumulative) {
        return durations[i];
      }
    }
    
    return 1;
  }
  
  // === PLAYBACK ===
  
  playSong(/** @type {any} */ template, /** @type {any} */ volume = 0.3) {
    if (this.isPlaying) {
      this.stopSong();
    }
    
    this.generateSong(template);
    
    if (!this.masterGain || !this.audioContext) return;
    this.masterGain.gain.value = volume;
    this.isPlaying = true;
    this.currentNote = 0;
    this.nextNoteTime = this.audioContext.currentTime;
    
    this.scheduleSong();
  }
  
  scheduleSong() {
    if (!this.isPlaying || !this.currentSong) return;
    
    const song = /** @type {any} */ (this.currentSong);
    const ctx = /** @type {any} */ (this.audioContext);
    if (!ctx) return;
    const scheduleAheadTime = 0.1;
    const currentTime = ctx.currentTime;
    
    while (this.nextNoteTime < currentTime + scheduleAheadTime) {
      if (this.currentNote >= song.melody.length) {
        // Loop song
        this.currentNote = 0;
        this.nextNoteTime = currentTime;
      }
      
      const melodyNote = /** @type {any} */ (song.melody[this.currentNote]);
      const bassNote = /** @type {any} */ (song.bass[this.currentNote]);
      const harmonyNote = /** @type {any} */ (song.harmony[this.currentNote]);
      
      // Schedule melody
      this.scheduleNote(melodyNote, this.nextNoteTime);
      
      // Schedule bass
      this.scheduleNote(bassNote, this.nextNoteTime);
      
      // Schedule harmony
      this.scheduleNote(harmonyNote, this.nextNoteTime);
      
      this.nextNoteTime += (60 / this.tempo) * melodyNote.duration;
      this.currentNote++;
    }
    
    // Schedule next batch
    setTimeout(() => this.scheduleSong(), (scheduleAheadTime - 0.05) * 1000);
  }
  
  scheduleNote(/** @type {any} */ note, /** @type {any} */ time) {
    const ctx = /** @type {any} */ (this.audioContext);
    const master = /** @type {any} */ (this.masterGain);
    if (!ctx || !master) return;

    const frequency = this.frequencyFromNote(note.pitch, note.octave);
    const instrument = (/** @type {any} */ (this.instruments))[note.instrument] || this.instruments.piano;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = /** @type {any} */ (instrument.type);
    oscillator.frequency.value = frequency;
    
    // ADSR envelope
    const attack = instrument.attack || 0.01;
    const decay = instrument.decay || 0.1;
    const sustain = instrument.sustain || 0.3;
    const release = instrument.release || 0.1;
    const duration = (60 / this.tempo) * note.duration;
    
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(note.velocity * 0.5, time + attack);
    gainNode.gain.exponentialRampToValueAtTime(note.velocity * sustain, time + attack + decay);
    gainNode.gain.setValueAtTime(note.velocity * sustain, time + duration - release);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(master);
    
    oscillator.start(time);
    oscillator.stop(time + duration);
  }
  
  frequencyFromNote(/** @type {any} */ semitone, /** @type {any} */ octave) {
    // A4 = 440 Hz, semitone 0
    const A4 = 440;
    const semitoneOffset = semitone + (octave - 4) * 12;
    return A4 * Math.pow(2, semitoneOffset / 12);
  }
  
  stopSong() {
    this.isPlaying = false;
    this.currentNote = 0;
  }
  
  // === UTILITIES ===
  
  seededRandom(/** @type {any} */ seed) {
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }
  
  setTempo(/** @type {any} */ tempo) {
    this.tempo = tempo;
  }
  
  setScale(/** @type {any} */ scale) {
    this.scale = scale;
  }
  
  setKey(/** @type {any} */ key, /** @type {any} */ octave) {
    this.key = key;
    this.octave = octave;
  }
  
  setVolume(/** @type {any} */ volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }
  }
  
  // === PRESET SONGS ===
  
  playDungeonMusic() {
    this.playSong('dungeon', 0.25);
  }
  
  playBattleMusic() {
    this.playSong('battle', 0.35);
  }
  
  playBossMusic() {
    this.playSong('boss', 0.4);
  }
  
  playVictoryMusic() {
    this.playSong('victory', 0.35);
  }
  
  playMenuMusic() {
    this.playSong('menu', 0.3);
  }
  
  playTownMusic() {
    this.playSong('town', 0.25);
  }
  
  playForestMusic() {
    this.playSong('forest', 0.25);
  }
  
  playCryptMusic() {
    this.playSong('crypt', 0.2);
  }
  
  // === CLEANUP ===
  
  destroy() {
    this.stopSong();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export default MusicGenerator;
