/**
 * W623D — deterministic, browser-local Vault Reveal visual generator.
 *
 * This module creates decorative SVG previews only. It has no minting,
 * ownership, wallet, token, marketplace, payment, or transfer behaviour.
 */

export const EON_VAULT_REVEAL_VISUAL_SCHEMA = 'eonapp.vault-reveal.visuals.w623d.v1';

export function hashSeed(value = '') {
  let hash = 2166136261;
  for (const character of String(value || 'eon')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[character]));
}

function hue(seed, offset = 0) {
  return (hashSeed(`${seed}|${offset}`) % 360 + 360) % 360;
}

function dataUri(svg = '') {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function polygonPoints(seed, width, height, count = 7) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.27;
  return Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const variation = 0.72 + (hashSeed(`${seed}|point|${index}`) % 29) / 100;
    return `${(cx + Math.cos(angle) * radius * variation).toFixed(1)},${(cy + Math.sin(angle) * radius * variation).toFixed(1)}`;
  }).join(' ');
}

export function buildVaultRevealVisualBundle(descriptor = {}, options = {}) {
  const width = Math.max(320, Math.min(1200, Number(options.width || 900)));
  const height = Math.max(320, Math.min(1200, Number(options.height || 900)));
  const seed = String(descriptor.seedKey || descriptor.id || descriptor.title || 'vault-reveal');
  const context = String(options.context || descriptor.visualContext || 'vault');
  const title = String(descriptor.title || 'Vault Reveal').slice(0, 84);
  const rarity = String(descriptor.rarity || 'Common').slice(0, 24);
  const primary = hue(seed, 0);
  const secondary = hue(seed, 137);
  const accent = hue(seed, 251);
  const rings = 4 + (hashSeed(`${seed}|rings`) % 4);
  const spokes = 8 + (hashSeed(`${seed}|spokes`) % 7);
  const glyph = ['◇', '✦', '⬡', '✧', '◈'][hashSeed(`${seed}|glyph`) % 5];
  const points = polygonPoints(seed, width, height, 6 + (hashSeed(`${seed}|sides`) % 4));
  const ringMarkup = Array.from({ length: rings }, (_, index) => {
    const radius = Math.min(width, height) * (0.12 + index * 0.055);
    const opacity = (0.42 - index * 0.055).toFixed(2);
    return `<circle cx="${width / 2}" cy="${height / 2}" r="${radius.toFixed(1)}" fill="none" stroke="hsla(${secondary},90%,72%,${opacity})" stroke-width="${Math.max(1.5, 4 - index * 0.45).toFixed(1)}"/>`;
  }).join('');
  const spokeMarkup = Array.from({ length: spokes }, (_, index) => {
    const angle = (Math.PI * 2 * index) / spokes;
    const inner = Math.min(width, height) * 0.08;
    const outer = Math.min(width, height) * (0.29 + (hashSeed(`${seed}|spoke|${index}`) % 8) / 100);
    const x1 = width / 2 + Math.cos(angle) * inner;
    const y1 = height / 2 + Math.sin(angle) * inner;
    const x2 = width / 2 + Math.cos(angle) * outer;
    const y2 = height / 2 + Math.sin(angle) * outer;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="hsla(${accent},95%,75%,0.34)" stroke-width="2"/>`;
  }).join('');
  const fingerprint = `${EON_VAULT_REVEAL_VISUAL_SCHEMA}:${hashSeed(`${seed}|${context}|${width}|${height}`).toString(36)}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)}</title><desc id="desc">A deterministic local Vault Reveal preview with no financial or ownership meaning.</desc>
  <defs>
    <radialGradient id="bg"><stop offset="0" stop-color="hsl(${secondary} 46% 18%)"/><stop offset="0.58" stop-color="hsl(${primary} 42% 10%)"/><stop offset="1" stop-color="#05070d"/></radialGradient>
    <linearGradient id="core" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${primary} 94% 68%)"/><stop offset="1" stop-color="hsl(${accent} 88% 54%)"/></linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="12" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="${width}" height="${height}" rx="${Math.round(width * 0.045)}" fill="url(#bg)"/>
  <g opacity="0.34">${spokeMarkup}</g>
  <g filter="url(#glow)">${ringMarkup}<polygon points="${points}" fill="hsla(${primary},88%,58%,0.12)" stroke="url(#core)" stroke-width="7"/></g>
  <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) * 0.085}" fill="url(#core)" opacity="0.9"/>
  <text x="${width / 2}" y="${height / 2 + Math.min(width, height) * 0.035}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${Math.min(width, height) * 0.11}" fill="#fff">${glyph}</text>
  <text x="${width * 0.07}" y="${height * 0.09}" font-family="system-ui,sans-serif" font-size="${height * 0.026}" letter-spacing="${height * 0.004}" fill="hsla(${secondary},90%,88%,0.8)">${esc(context.toUpperCase())}</text>
  <text x="${width * 0.07}" y="${height * 0.86}" font-family="system-ui,sans-serif" font-size="${height * 0.043}" font-weight="700" fill="#fff">${esc(title)}</text>
  <text x="${width * 0.07}" y="${height * 0.91}" font-family="system-ui,sans-serif" font-size="${height * 0.026}" fill="hsla(${accent},95%,84%,0.9)">${esc(rarity)} · LOCAL VAULT REVEAL</text>
  <text x="${width * 0.93}" y="${height * 0.95}" text-anchor="end" font-family="ui-monospace,monospace" font-size="${height * 0.018}" fill="rgba(255,255,255,0.45)">${esc(fingerprint.slice(-12))}</text>
</svg>`;
  return Object.freeze({
    schema: EON_VAULT_REVEAL_VISUAL_SCHEMA,
    svg,
    staticUri: dataUri(svg),
    fingerprint,
    qualityScore: 92,
    traits: Object.freeze([`Context: ${context}`, `Rarity: ${rarity}`, `Palette: ${primary}/${secondary}/${accent}`, 'Local-only visual'])
  });
}

export default Object.freeze({ EON_VAULT_REVEAL_VISUAL_SCHEMA, hashSeed, buildVaultRevealVisualBundle });
