import { normalizePublicPostUrl } from './social-platform-adapters.js';

export function parseXStatusUrl(input) {
  try {
    const normalized = normalizePublicPostUrl('x', input);
    const url = new URL(normalized);
    const match = url.pathname.match(/^\/([^/]+)\/status\/(\d+)/i);
    if (!match) return { ok: false, reason: 'not-status-url' };
    return { ok: true, url: normalized, username: match[1], postId: match[2] };
  } catch (error) {
    return { ok: false, reason: String(error?.message || 'invalid-url') };
  }
}

export function assessXEmbedProof(options = {}) {
  const { proofUrl, embedHtml = '', missionCode = '', trackingLink = '', tokenHash = '' } = /** @type {any} */ (options);
  const parsed = parseXStatusUrl(proofUrl);
  if (!parsed.ok) return { status: 'rejected', platform: 'x', reason: parsed.reason };
  const content = String(embedHtml || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&');
  const codePresent = Boolean(missionCode && content.includes(missionCode));
  const linkPresent = Boolean(trackingLink && (content.includes(trackingLink) || content.includes('eonapp.ch/r/')));
  const hashPresent = Boolean(tokenHash && content.includes(tokenHash));
  if (!embedHtml) return { status: 'pending', platform: 'x', reason: 'embed-unavailable', ...parsed };
  if (!codePresent) return { status: 'rejected', platform: 'x', reason: 'mission-code-missing', ...parsed };
  if (!linkPresent && !hashPresent) return { status: 'pending', platform: 'x', reason: 'tracking-link-not-visible-in-embed', ...parsed, codePresent };
  return { status: 'accepted', platform: 'x', reason: 'public-embed-matched', ...parsed, codePresent, linkPresent: linkPresent || hashPresent };
}

export async function verifyXPublicProof(options = {}) {
  const { proofUrl, signedToken, missionCode, trackingLink } = /** @type {any} */ (options);
  const response = await fetch('/api/social/verify-public-post', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ platform: 'x', proofUrl, signedToken, missionCode, trackingLink })
  });
  const data = await response.json().catch(() => ({}));
  return { httpOk: response.ok, ...data };
}
