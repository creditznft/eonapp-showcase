// Secure Random Number Generator
// Seeded PRNG for verifiable game outcomes

export class SecureRandom {
  constructor(/** @type {any} */ seed) {
    this.originalSeed = seed;
    this.seed = seed;
    this.state = seed;
    this.callCount = 0;
    
    // Initialize using mulberry32
    this.state = this._initState(seed);
  }
  
  _initState(/** @type {any} */ seed) {
    // Hash seed to initial state
    let h = seed;
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0);
  }
  
  // Mulberry32 PRNG - fast, good distribution, deterministic
  _next() {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    this.callCount++;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  
  // Get random float [0, 1)
  next() {
    return this._next();
  }
  
  // Get random integer [min, max] inclusive
  nextInt(/** @type {any} */ min, /** @type {any} */ max) {
    return Math.floor(this._next() * (max - min + 1)) + min;
  }
  
  // Get random float [min, max)
  nextFloat(/** @type {any} */ min, /** @type {any} */ max) {
    return this._next() * (max - min) + min;
  }
  
  // Get random boolean with probability
  nextBool(/** @type {any} */ probability = 0.5) {
    return this._next() < probability;
  }
  
  // Get random element from array
  nextElement(/** @type {any} */ array) {
    if (!array || array.length === 0) return undefined;
    return array[this.nextInt(0, array.length - 1)];
  }
  
  // Shuffle array (Fisher-Yates)
  shuffle(/** @type {any} */ array) {
    const /** @type {any} */
result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  // Weighted random selection
  weightedSelect(/** @type {any} */ items, /** @type {any} */ weights) {
    const total = weights.reduce((/** @type {any} */ sum, /** @type {any} */ w) => sum + w, 0);
    let random = this._next() * total;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) return items[i];
    }
    
    return items[items.length - 1];
  }
  
  // Gaussian distribution (Box-Muller)
  nextGaussian(/** @type {any} */ mean = 0, /** @type {any} */ stdDev = 1) {
    const u1 = this._next();
    const u2 = this._next();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }
  
  // Get state for verification
  getState() {
    return {
      seed: this.originalSeed,
      state: this.state,
      callCount: this.callCount
    };
  }
  
  // Restore state for replay
  setState(/** @type {any} */ state) {
    this.originalSeed = state.seed;
    this.state = state.state;
    this.callCount = state.callCount;
  }
  
  // Reset to initial seed
  reset() {
    this.state = this._initState(this.originalSeed);
    this.callCount = 0;
  }
  
  // Fork for deterministic sub-sequences
  fork() {
    return new SecureRandom(this.nextInt(0, 0xFFFFFFFF));
  }
  
  // Generate verification hash
  async verificationHash() {
    const data = JSON.stringify(this.getState());
    const buffer = new TextEncoder().encode(data);
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hash))
      .map(/** @type {any} */ b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

// CV3 (S4-11): Removed createFromServer() — no server RNG seed endpoint.
// Always use crypto.getRandomValues for seed generation.
// For verifiable fairness, use on-chain blockhash as seed source (future P1-7).
export function createFromServer(/** @type {any} */ _gameId, /** @type {any} */ _sessionId) {
  // Kept for API compatibility but now synchronous + always uses CSPRNG
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return Promise.resolve(new SecureRandom(array[0]));
}

// Quick access for games
/** @type {SecureRandom | null} */
let currentRng = null;

export function initRng(/** @type {any} */ seed) {
  currentRng = new SecureRandom(seed);
  return currentRng;
}

export function getRng() {
  if (!currentRng) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    currentRng = new SecureRandom(array[0]);
  }
  return currentRng;
}

export function random() {
  return getRng().next();
}

export function randomInt(/** @type {any} */ min, /** @type {any} */ max) {
  return getRng().nextInt(min, max);
}

export function randomElement(/** @type {any} */ array) {
  return getRng().nextElement(array);
}

export function randomBool(/** @type {any} */ probability = 0.5) {
  return getRng().nextBool(probability);
}

export function shuffle(/** @type {any} */ array) {
  return getRng().shuffle(array);
}

export default SecureRandom;
