/**
 * Seeded Random Number Generator for NFT Engine
 * Deterministic: same seed = same sequence
 */

export class SeededRNG {
    constructor(/** @type {any} */ seed) {
        this.seed = this.hashString(seed.toString());
    }

    // Simple string hash
    hashString(/** @type {any} */ str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    // Linear congruential generator
    next() {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }

    // Random float between 0 and 1
    random() {
        return this.next();
    }

    // Random integer between min and max (inclusive)
    range(/** @type {any} */ min, /** @type {any} */ max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    // Random item from array
    choice(/** @type {any} */ arr) {
        return arr[Math.floor(this.random() * arr.length)];
    }

    // Weighted random choice
    weightedChoice(/** @type {any} */ items, /** @type {any} */ weights) {
        const total = weights.reduce((/** @type {any} */ a, /** @type {any} */ b) => a + b, 0);
        let random = this.random() * total;
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) return items[i];
        }
        return items[items.length - 1];
    }

    // Shuffle array
    shuffle(/** @type {any} */ arr) {
        const /** @type {any} */
result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    // Boolean with probability
    bool(/** @type {any} */ probability = 0.5) {
        return this.random() < probability;
    }
}

export default SeededRNG;
