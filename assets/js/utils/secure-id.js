/**
 * secure-id.js — Cryptographically secure ID generation
 *
 * Replaces all Math.random()-based ID generators in security-critical contexts.
 * Uses crypto.getRandomValues (CSPRNG) — never Math.random.
 *
 * S4-1 / CEO Cross-Audit 2026-05-07
 */

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Generate a cryptographically secure random string.
 * @param {string} [prefix=''] - Optional prefix (e.g. 'nft', 'tx', 'ev')
 * @param {number} [length=12] - Length of the random portion (default 12 chars)
 * @returns {string} e.g. 'nft_A7f3K9pQ2mX1'
 */
export function secureId(/** @type {any} */ prefix = '', /** @type {any} */ length = 12) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += BASE62[bytes[i] % 62];
  }
  return prefix ? `${prefix}_${result}` : result;
}

/**
 * Generate a short (8-char) cryptographically secure ID.
 * For use in display IDs, toast IDs, and low-collision contexts.
 * @param {string} [prefix=''] - Optional prefix
 * @returns {string}
 */
export function shortSecureId(/** @type {any} */ prefix = '') {
  return secureId(prefix, 8);
}

/**
 * Generate a long (24-char) cryptographically secure ID.
 * For use in token IDs, NFT UIDs, and high-uniqueness contexts.
 * @param {string} [prefix=''] - Optional prefix
 * @returns {string}
 */
export function longSecureId(/** @type {any} */ prefix = '') {
  return secureId(prefix, 24);
}

/**
 * Generate a secure random float in [0, 1) using crypto.getRandomValues.
 * Drop-in replacement for Math.random() in security-sensitive code.
 * @returns {number} Float in [0, 1)
 */
export function secureRandom() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  // Divide by 2^32 to get [0, 1)
  return buf[0] / 0x100000000;
}

/**
 * Roll a weighted random result from a table using crypto.getRandomValues.
 * @param {Array<{key: string, weight: number}>} table - Items with weights that sum to 100
 * @returns {string} The selected key
 */
export function secureWeightedRoll(/** @type {any} */ table) {
  const roll = secureRandom() * 100;
  let cumulative = 0;
  for (const /** @type {any} */
entry of table) {
    cumulative += entry.weight;
    if (roll < cumulative) return entry.key;
  }
  return table[table.length - 1].key;
}
