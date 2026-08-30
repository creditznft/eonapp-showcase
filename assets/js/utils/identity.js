const CURRENT_ID_RE = /^g_[0-9a-f]{48}$/i;
const LEGACY_ID_RE = /^eon_[0-9a-f]{12}$/i;
const /** @type {any} */
SAFE_ALIAS_ADJECTIVES = ['Solar', 'Neon', 'Quantum', 'Silent', 'Nova', 'Cipher', 'Orbit', 'Signal', 'Crystal', 'Vector', 'Axiom', 'Comet'];
const /** @type {any} */
SAFE_ALIAS_NOUNS = ['Runner', 'Forge', 'Pilot', 'Scout', 'Echo', 'Circuit', 'Harbor', 'Beacon', 'Atlas', 'Drift', 'Kernel', 'Bloom'];
const /** @type {any} */
SAFE_ACCENTS = ['⚡', '✦', '✧', '⬢', '⬡', '◈', '◆', '⬣', '✺', '✹', '✶', '✷'];

function toHex(/** @type {any} */ bytes) {
  return Array.from(bytes, (/** @type {any} */ byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomHex(/** @type {any} */ bytesLength) {
  const bytes = new Uint8Array(bytesLength);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    return toHex(bytes);
  }
  // Never silently degrade to weak randomness — identity security requires CSPRNG
  throw new Error('[identity] Secure randomness (crypto.getRandomValues) is unavailable in this environment.');
}

function hashString(/** @type {any} */ value = '') {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function generateIdentityId() {
  const uuid = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID().replaceAll('-', '')
    : randomHex(16);
  const extraEntropy = randomHex(8);
  return `g_${uuid}${extraEntropy}`;
}

export function isValidIdentityId(/** @type {any} */ value = '') {
  const normalized = String(value).trim().toLowerCase();
  return CURRENT_ID_RE.test(normalized) || LEGACY_ID_RE.test(normalized);
}

export function normalizeIdentityId(/** @type {any} */ value = '') {
  const normalized = String(value).trim().toLowerCase();
  return isValidIdentityId(normalized) ? normalized : null;
}

export function shortIdentityId(/** @type {any} */ value = '') {
  const normalized = normalizeIdentityId(value);
  return normalized ? normalized.slice(-6).toUpperCase() : '??????';
}

export function normalizeAliasSeed(/** @type {any} */ value = '', /** @type {any} */ fallback = 'eon-alias') {
  const safe = String(value || '').trim().replace(/[^\w-]/g, '').slice(0, 64);
  return safe || fallback;
}

export function generateAliasSeed(/** @type {any} */ input = '') {
  const uuid = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID().replaceAll('-', '')
    : randomHex(16);
  return normalizeAliasSeed(`${input || 'alias'}-${uuid}`);
}

export function buildPublicAlias(/** @type {any} */ uid = '', /** @type {any} */ aliasSeed = '') {
  const safeUid = normalizeIdentityId(uid) || 'g_000000000000';
  const seed = normalizeAliasSeed(aliasSeed, safeUid);
  const hash = hashString(`${safeUid}:${seed}`);
  const adjective = SAFE_ALIAS_ADJECTIVES[hash % SAFE_ALIAS_ADJECTIVES.length];
  const noun = SAFE_ALIAS_NOUNS[(hash >>> 4) % SAFE_ALIAS_NOUNS.length];
  const suffix = shortIdentityId(safeUid).slice(-3);
  return `${adjective}${noun}-${suffix}`;
}

export function pickGeneratedAccent(/** @type {any} */ uid = '', /** @type {any} */ aliasSeed = '') {
  const safeUid = normalizeIdentityId(uid) || 'g_000000000000';
  const seed = normalizeAliasSeed(aliasSeed, safeUid);
  const hash = hashString(`${seed}:${safeUid}:accent`);
  return SAFE_ACCENTS[hash % SAFE_ACCENTS.length];
}
