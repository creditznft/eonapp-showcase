/** Share intents for all supported platforms. */

function enc(value) { return encodeURIComponent(String(value || '')); }

export const SOCIAL_PLATFORMS = Object.freeze([
  'x', 'telegram', 'whatsapp', 'reddit', 'linkedin', 'facebook', 'discord', 'email', 'qr', 'generic'
]);

export function buildMissionShareText(options = {}) {
  const { title = 'Explore EON Apps', link = '', missionCode = '', message = '' } = /** @type {any} */ (options);
  const hashtags = Array.isArray((/** @type {any} */ (options)).hashtags) ? (/** @type {any} */ (options)).hashtags : ['EONApps', 'EONCity'];
  const base = String(message || `${title} — private AI tools, EON City, and local-first workspace.`).trim();
  const codeLine = missionCode ? `Mission: ${missionCode}` : '';
  const tags = hashtags.length ? hashtags.map((tag) => `#${String(tag).replace(/^#/, '')}`).join(' ') : '';
  return [base, link, codeLine, tags].filter(Boolean).join('\n\n');
}

export function buildPlatformShareTargets(options = {}) {
  const { link = '', missionCode = '', title = 'EON Apps', message = '' } = /** @type {any} */ (options);
  const hashtags = (/** @type {any} */ (options)).hashtags;
  const text = buildMissionShareText({ title, link, missionCode, message, hashtags });
  const compact = [message || title, missionCode ? `Mission: ${missionCode}` : ''].filter(Boolean).join(' — ');
  return {
    x: `https://x.com/intent/post?text=${enc(text)}`,
    telegram: `https://t.me/share/url?url=${enc(link)}&text=${enc([message || title, missionCode ? `Mission: ${missionCode}` : ''].filter(Boolean).join('\n'))}`,
    whatsapp: `https://wa.me/?text=${enc(text)}`,
    reddit: `https://www.reddit.com/submit?url=${enc(link)}&title=${enc(compact)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(link)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(link)}`,
    email: `mailto:?subject=${enc(title)}&body=${enc(text)}`,
    generic: link,
    discord: link,
    qr: link
  };
}

export function normalizePublicPostUrl(platform, input) {
  const url = new URL(String(input || '').trim());
  if (url.protocol !== 'https:') throw new Error('Public proof URL must use HTTPS');
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const allowed = {
    x: ['x.com', 'twitter.com'],
    reddit: ['reddit.com', 'old.reddit.com'],
    linkedin: ['linkedin.com'],
    facebook: ['facebook.com', 'm.facebook.com'],
    telegram: ['t.me', 'telegram.me']
  };
  const hosts = allowed[platform] || [];
  if (hosts.length && !hosts.some((entry) => host === entry || host.endsWith(`.${entry}`))) throw new Error('Host is not allowed for this platform');
  url.hash = '';
  return url.toString();
}
