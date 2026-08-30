function hashString(/** @type {any} */ value = '') {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizeAccent(/** @type {any} */ accent = '⚡') {
  const safe = Array.from(
    String(accent || '')
      .replace(/[<>&"'`]/g, '')
      .trim()
  ).slice(0, 2).join('');
  return safe || '⚡';
}

function escapeAttribute(/** @type {any} */ value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function normalizeAvatarSeed(/** @type {any} */ seed = '', /** @type {any} */ fallback = 'eon-avatar') {
  const safe = String(seed || '').trim().replace(/[^\w-]/g, '').slice(0, 64);
  return safe || fallback;
}

export function generateAvatarSeed(/** @type {any} */ input = '') {
  const random = crypto.getRandomValues(new Uint32Array(2));
  return normalizeAvatarSeed(`${input || 'eon'}-${random[0].toString(36)}-${random[1].toString(36)}`);
}

function paletteFromSeed(/** @type {any} */ seed) {
  const hash = hashString(seed);
  const hueA = hash % 360;
  const hueB = (hueA + 56 + (hash % 80)) % 360;
  const hueC = (hueA + 180) % 360;
  return {
    primary: `hsl(${hueA} 78% 58%)`,
    secondary: `hsl(${hueB} 82% 62%)`,
    accent: `hsl(${hueC} 72% 70%)`,
    bg: `hsl(${(hueA + 300) % 360} 28% 10%)`
  };
}

function avatarSvg(/** @type {any} */ seed, /** @type {any} */ accent = '⚡', /** @type {any} */ size = 96) {
  const safeSeed = normalizeAvatarSeed(seed);
  const colors = paletteFromSeed(safeSeed);
  const hash = hashString(safeSeed);
  const orbit = 20 + (hash % 14);
  const inner = 12 + (hash % 10);
  const rotation = hash % 360;
  const bars = Array.from({ length: 4 }, (/** @type {any} */ _, /** @type {any} */ index) => {
    const width = 10 + ((hash >> (index * 4)) % 12);
    const x = 12 + (index * 18);
    const y = 40 - ((hash >> (index * 5)) % 8);
    const height = 18 + ((hash >> (index * 6)) % 18);
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="${index % 2 ? colors.secondary : colors.accent}" opacity=".82" transform="rotate(${rotation / (index + 2)} 48 48)" />`;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 96 96" role="img" aria-label="EON avatar">
      <defs>
        <linearGradient id="grad-${safeSeed}" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${colors.primary}" />
          <stop offset="100%" stop-color="${colors.secondary}" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="28" fill="${colors.bg}" />
      <circle cx="48" cy="48" r="${orbit}" fill="none" stroke="${colors.primary}" stroke-width="3" opacity=".8" />
      <circle cx="48" cy="48" r="${inner}" fill="url(#grad-${safeSeed})" />
      ${bars}
      <text x="48" y="56" text-anchor="middle" font-size="22" fill="white" opacity=".95">${normalizeAccent(accent)}</text>
    </svg>
  `;
}

export function buildAvatarDataUrl(/** @type {any} */ seed, /** @type {any} */ accent = '⚡', /** @type {any} */ size = 96) {
  const svg = avatarSvg(seed, accent, size);
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export function getAvatarModel(/** @type {any} */ profile = {}) {
  const seed = normalizeAvatarSeed(profile.avatarSeed || profile.uid || profile.alias || 'eon-avatar');
  const accent = normalizeAccent(profile.avatar || '⚡');
  return {
    seed,
    accent,
    url: buildAvatarDataUrl(seed, accent)
  };
}

export function renderAvatarMarkup(/** @type {any} */ profile = {}, /** @type {any} */ options = {}) {
  const model = getAvatarModel(profile);
  const size = Number(options.size || 56);
  const alt = String(options.alt || `${profile.alias || 'Explorer'} avatar`);
  return `<img src="${model.url}" alt="${escapeAttribute(alt)}" width="${size}" height="${size}" loading="lazy" style="width:${size}px;height:${size}px;border-radius:18px;display:block;box-shadow:0 14px 40px rgba(15,23,42,.24)" />`;
}
