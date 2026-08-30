/**
 * mnemonic.js
 * BIP39-compatible 12-word recovery phrase generator.
 * - Uses crypto.getRandomValues() for cryptographic entropy
 * - generateMnemonic() → string[] (12 words, shown ONCE, never persisted)
 * - hashMnemonic()     → SHA-256 hex (stored as recoveryKeyHash)
 */

import WORDLIST from './bip39-english.js';

/**
 * Generate a cryptographically secure BIP39-style mnemonic.
 * @param {number} wordCount - 12 (default) or 24
 * @returns {string[]} Array of words
 */
export function generateMnemonic(wordCount = 12) {
  const indices = new Uint16Array(wordCount);
  crypto.getRandomValues(indices);
  return Array.from(indices).map(n => WORDLIST[n % WORDLIST.length]);
}

/**
 * Hash a mnemonic to SHA-256 hex. Only this hash is ever stored.
 * @param {string[]} words
 * @returns {Promise<string>} hex string
 */
export async function hashMnemonic(words) {
  const phrase = words.join(' ');
  const encoder = new TextEncoder();
  const data = encoder.encode(phrase);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify that a provided phrase matches a stored hash.
 * @param {string[]} words
 * @param {string} storedHash
 * @returns {Promise<boolean>}
 */
export async function verifyMnemonic(words, storedHash) {
  const hash = await hashMnemonic(words);
  return hash === storedHash;
}
