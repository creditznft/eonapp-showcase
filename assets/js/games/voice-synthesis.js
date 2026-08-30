/**
 * Code-Based Voice Synthesis for Storytelling
 * 
 * Features:
 * - Procedural voice synthesis using Web Audio API
 * - Text-to-speech using formant synthesis
 * - Multiple voice types (male, female, robotic, monster)
 * - Emotion and tone modulation
 * - Speech rate and pitch control
 * - Sound effects integration
 * - Dialogue system
 * - Story narration
 */

export class VoiceSynthesis {
  constructor() {
    /** @type {any} */
    this.audioContext = null;
    /** @type {any} */
    this.masterGain = null;
    this.isSpeaking = false;
    this.currentVoice = 'default';
    
    // Voice types
    this.voices = {
      default: {
        pitch: 1.0,
        rate: 1.0,
        formants: [800, 1150, 2900],
        bandwidth: [80, 90, 120],
        aspiration: 0.1
      },
      male: {
        pitch: 0.9,
        rate: 1.0,
        formants: [750, 1100, 2800],
        bandwidth: [90, 100, 130],
        aspiration: 0.15
      },
      female: {
        pitch: 1.2,
        rate: 1.1,
        formants: [850, 1220, 3000],
        bandwidth: [70, 80, 110],
        aspiration: 0.08
      },
      robotic: {
        pitch: 0.8,
        rate: 0.9,
        formants: [700, 1050, 2700],
        bandwidth: [100, 110, 140],
        aspiration: 0.3
      },
      monster: {
        pitch: 0.5,
        rate: 0.7,
        formants: [600, 1000, 2500],
        bandwidth: [150, 160, 180],
        aspiration: 0.5
      },
      child: {
        pitch: 1.5,
        rate: 1.2,
        formants: [900, 1300, 3200],
        bandwidth: [60, 70, 100],
        aspiration: 0.05
      },
      elderly: {
        pitch: 0.7,
        rate: 0.8,
        formants: [700, 1050, 2700],
        bandwidth: [120, 130, 150],
        aspiration: 0.2
      },
      narrator: {
        pitch: 1.0,
        rate: 0.9,
        formants: [800, 1150, 2900],
        bandwidth: [80, 90, 120],
        aspiration: 0.1
      }
    };
    
    // Emotions
    this.emotions = {
      neutral: { pitchMod: 1.0, rateMod: 1.0, vibrato: 0 },
      happy: { pitchMod: 1.1, rateMod: 1.1, vibrato: 0.05 },
      sad: { pitchMod: 0.9, rateMod: 0.9, vibrato: 0.02 },
      angry: { pitchMod: 1.2, rateMod: 1.3, vibrato: 0.08 },
      fearful: { pitchMod: 1.3, rateMod: 1.4, vibrato: 0.1 },
      excited: { pitchMod: 1.15, rateMod: 1.2, vibrato: 0.07 },
      calm: { pitchMod: 0.95, rateMod: 0.85, vibrato: 0.01 },
      mysterious: { pitchMod: 0.85, rateMod: 0.8, vibrato: 0.03 }
    };
    
    // Phoneme data
    this.phonemes = this.initializePhonemes();
  }
  
  // === INITIALIZATION ===
  
  async init() {
    try {
      const appWin = /** @type {any} */ (window);
      this.audioContext = new (appWin.AudioContext || appWin.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.audioContext.destination);
      return true;
    } catch (/** @type {any} */
e) {
      console.warn('Audio context not supported:', e);
      return false;
    }
  }
  
  initializePhonemes() {
    return {
      // Vowels
      'a': { type: 'vowel', f1: 750, f2: 1150, f3: 2900, duration: 80 },
      'e': { type: 'vowel', f1: 500, f2: 1800, f3: 2500, duration: 70 },
      'i': { type: 'vowel', f1: 300, f2: 2200, f3: 3100, duration: 60 },
      'o': { type: 'vowel', f1: 500, f2: 900, f3: 2500, duration: 80 },
      'u': { type: 'vowel', f1: 300, f2: 850, f3: 2250, duration: 80 },
      
      // Consonants
      'b': { type: 'plosive', f1: 200, f2: 1200, f3: 2500, duration: 50, voiced: true },
      'p': { type: 'plosive', f1: 200, f2: 1200, f3: 2500, duration: 50, voiced: false },
      'd': { type: 'plosive', f1: 300, f2: 1700, f3: 2500, duration: 40, voiced: true },
      't': { type: 'plosive', f1: 300, f2: 1700, f3: 2500, duration: 40, voiced: false },
      'g': { type: 'plosive', f1: 200, f2: 1000, f3: 2400, duration: 50, voiced: true },
      'k': { type: 'plosive', f1: 200, f2: 1000, f3: 2400, duration: 50, voiced: false },
      
      'f': { type: 'fricative', f1: 500, f2: 1500, f3: 2500, duration: 60, voiced: false },
      'v': { type: 'fricative', f1: 500, f2: 1500, f3: 2500, duration: 60, voiced: true },
      's': { type: 'fricative', f1: 400, f2: 2000, f3: 3500, duration: 70, voiced: false },
      'z': { type: 'fricative', f1: 400, f2: 2000, f3: 3500, duration: 70, voiced: true },
      'sh': { type: 'fricative', f1: 500, f2: 1800, f3: 3000, duration: 80, voiced: false },
      
      'm': { type: 'nasal', f1: 250, f2: 1000, f3: 2200, duration: 60, voiced: true },
      'n': { type: 'nasal', f1: 300, f2: 1300, f3: 2500, duration: 60, voiced: true },
      'l': { type: 'liquid', f1: 400, f2: 1000, f3: 2500, duration: 70, voiced: true },
      'r': { type: 'liquid', f1: 350, f2: 1200, f3: 2500, duration: 60, voiced: true }
    };
  }
  
  // === SPEECH SYNTHESIS ===
  
  speak(/** @type {any} */ text, /** @type {any} */ options = {}) {
    if (!this.audioContext) return null;
    
    const voice = options.voice || this.currentVoice;
    const emotion = options.emotion || 'neutral';
    const rate = options.rate || 1.0;
    const pitch = options.pitch || 1.0;
    const volume = options.volume || 0.5;
    
    const voiceConfig = (/** @type {any} */ (this.voices))[voice] || this.voices.default;
    const emotionConfig = (/** @type {any} */ (this.emotions))[emotion] || this.emotions.neutral;
    
    // Apply modifiers
    const finalPitch = voiceConfig.pitch * emotionConfig.pitchMod * pitch;
    const finalRate = voiceConfig.rate * emotionConfig.rateMod * rate;
    const vibrato = emotionConfig.vibrato;
    
    // Convert text to phonemes
    const phonemes = this.textToPhonemes(text);
    
    // Schedule phonemes
    let startTime = this.audioContext.currentTime;
    const phonemeDuration = 80 / finalRate;
    
    for (const /** @type {any} */
phoneme of phonemes) {
      this.synthesizePhoneme(phoneme, startTime, voiceConfig, finalPitch, vibrato, volume);
      startTime += phonemeDuration * (phoneme.duration || 1);
    }
    
    this.isSpeaking = true;
    
    // Mark as done after speech completes
    setTimeout(() => {
      this.isSpeaking = false;
    }, (startTime - this.audioContext.currentTime) * 1000);
    
    return { success: true, duration: (startTime - this.audioContext.currentTime) * 1000 };
  }
  
  textToPhonemes(/** @type {any} */ text) {
    // Simple phoneme conversion (in production, use a proper phoneme dictionary)
    const /** @type {any} */
phonemes = [];
    const words = text.toLowerCase().split(/\s+/);
    
    for (const /** @type {any} */
word of words) {
      const wordPhonemes = this.wordToPhonemes(word);
      phonemes.push(...wordPhonemes);
      phonemes.push({ type: 'pause', duration: 0.2 }); // Word boundary
    }
    
    return phonemes;
  }
  
  wordToPhonemes(/** @type {any} */ word) {
    // Simplified phoneme mapping
    const /** @type {any} */
phonemeMap = {
      'a': ['a'], 'e': ['e'], 'i': ['i'], 'o': ['o'], 'u': ['u'],
      'b': ['b'], 'c': ['k'], 'd': ['d'], 'f': ['f'], 'g': ['g'],
      'h': ['h'], 'j': ['j'], 'k': ['k'], 'l': ['l'], 'm': ['m'],
      'n': ['n'], 'p': ['p'], 'q': ['k'], 'r': ['r'], 's': ['s'],
      't': ['t'], 'v': ['v'], 'w': ['w'], 'x': ['k'], 'y': ['i'],
      'z': ['z']
    };
    
    const /** @type {any} */
phonemes = [];
    
    for (const /** @type {any} */
char of word) {
      if ((/** @type {any} */ (phonemeMap))[char]) {
        phonemes.push(...(/** @type {any} */ (phonemeMap))[char]);
      }
    }
    
    return phonemes;
  }
  
  synthesizePhoneme(/** @type {any} */ phoneme, /** @type {any} */ time, /** @type {any} */ voiceConfig, /** @type {any} */ pitch, /** @type {any} */ vibrato, /** @type {any} */ volume) {
    if (phoneme.type === 'pause') {
      return;
    }
    
    const phonemeData = (/** @type {any} */ (this.phonemes))[phoneme] || this.phonemes['a'];
    const duration = (phonemeData.duration || 80) / 1000;
    
    // Create formant filters
    const /** @type {any} */
filters = [];
    for (let i = 0; i < 3; i++) {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = voiceConfig.formants[i] * pitch;
      filter.Q.value = voiceConfig.bandwidth[i] / voiceConfig.formants[i];
      filters.push(filter);
    }
    
    // Create source
    const source = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    // Configure source
    source.type = 'sawtooth';
    source.frequency.value = 100 * pitch;
    
    // Add vibrato
    if (vibrato > 0) {
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();
      lfo.frequency.value = 5;
      lfoGain.gain.value = vibrato * 20;
      lfo.connect(lfoGain);
      lfoGain.connect(source.frequency);
      lfo.start(time);
      lfo.stop(time + duration);
    }
    
    // Connect filters in series
    source.connect(filters[0]);
    filters[0].connect(filters[1]);
    filters[1].connect(filters[2]);
    filters[2].connect(gain);
    gain.connect(this.masterGain);
    
    // ADSR envelope
    const attack = 0.01;
    const decay = 0.05;
    const sustain = 0.5;
    const release = 0.05;
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + attack);
    gain.gain.exponentialRampToValueAtTime(volume * sustain, time + attack + decay);
    gain.gain.setValueAtTime(volume * sustain, time + duration - release);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    // Add aspiration for consonants
    if (phonemeData.type !== 'vowel') {
      const noise = this.audioContext.createOscillator();
      const noiseGain = this.audioContext.createGain();
      noise.type = 'square';
      noise.frequency.value = 1000;
      noiseGain.gain.value = voiceConfig.aspiration * volume * 0.3;
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      noise.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(time);
      noise.stop(time + duration);
    }
    
    source.start(time);
    source.stop(time + duration);
  }
  
  // === PRESET VOICES ===
  
  setVoice(/** @type {any} */ voiceType) {
    if ((/** @type {any} */ (this.voices))[voiceType]) {
      this.currentVoice = voiceType;
      return { success: true, voice: voiceType };
    }
    return { success: false, reason: 'Voice not found' };
  }
  
  speakAs(/** @type {any} */ text, /** @type {any} */ voiceType, /** @type {any} */ emotion = 'neutral') {
    return this.speak(text, { voice: voiceType, emotion });
  }
  
  // === STORYTELLING ===
  
  narrateStory(/** @type {any} */ story, /** @type {any} */ options = {}) {
    const voice = options.voice || 'narrator';
    const emotion = options.emotion || 'neutral';
    const pauseBetween = options.pauseBetween || 500;
    
    const sentences = story.split(/[.!?]+/).filter((/** @type {any} */ s) => s.trim().length > 0);
    let delay = 0;
    
    for (const /** @type {any} */
sentence of sentences) {
      setTimeout(() => {
        this.speak(sentence.trim(), { voice, emotion });
      }, delay);
      
      const sentenceDuration = this.estimateDuration(sentence);
      delay += sentenceDuration + pauseBetween;
    }
    
    return { success: true, totalDuration: delay };
  }
  
  estimateDuration(/** @type {any} */ text) {
    // Rough estimate: 100ms per character
    return text.length * 100;
  }
  
  // === DIALOGUE SYSTEM ===
  
  speakDialogue(/** @type {any} */ dialogue, /** @type {any} */ _options = {}) {
    const speaker = dialogue.speaker || 'default';
    const text = dialogue.text;
    const emotion = dialogue.emotion || 'neutral';
    
    return this.speak(text, { voice: speaker, emotion });
  }
  
  speakConversation(/** @type {any} */ conversation, /** @type {any} */ _options = {}) {
    const pauseBetween = _options.pauseBetween || 1000;
    let delay = 0;
    
    for (const /** @type {any} */
line of conversation) {
      setTimeout(() => {
        this.speakDialogue(line);
      }, delay);
      
      const lineDuration = this.estimateDuration(line.text);
      delay += lineDuration + pauseBetween;
    }
    
    return { success: true, totalDuration: delay };
  }
  
  // === SOUND EFFECTS ===
  
  playSoundEffect(/** @type {any} */ effectType) {
    if (!this.audioContext) return null;
    
    switch (effectType) {
      case 'intro':
        return this.playIntroSound();
      case 'outro':
        return this.playOutroSound();
      case 'emphasis':
        return this.playEmphasisSound();
      case 'question':
        return this.playQuestionSound();
      case 'exclamation':
        return this.playExclamationSound();
      default:
        return null;
    }
  }
  
  playIntroSound() {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.2);
  }
  
  playOutroSound() {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(200, this.audioContext.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.3);
  }
  
  playEmphasisSound() {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.02);
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.1);
  }
  
  playQuestionSound() {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(400, this.audioContext.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.02);
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.2);
  }
  
  playExclamationSound() {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(300, this.audioContext.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.15);
  }
  
  // === UTILITIES ===
  
  isCurrentlySpeaking() {
    return this.isSpeaking;
  }
  
  stopSpeaking() {
    this.isSpeaking = false;
  }
  
  setVolume(/** @type {any} */ volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }
  }
  
  getAvailableVoices() {
    return Object.keys(this.voices);
  }
  
  getAvailableEmotions() {
    return Object.keys(this.emotions);
  }
  
  // === CLEANUP ===
  
  destroy() {
    this.stopSpeaking();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export default VoiceSynthesis;
