import { normalizePublicPostUrl } from './social-platform-adapters.js';

export async function verifyGenericPublicProof({ platform = 'generic', proofUrl = '', signedToken = '', missionCode = '', trackingLink = '' } = {}) {
  let normalized;
  try { normalized = normalizePublicPostUrl(platform, proofUrl); }
  catch (error) { return { status: 'rejected', reason: String(error?.message || 'invalid-url') }; }
  try {
    const response = await fetch('/api/social/verify-public-post', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ platform, proofUrl: normalized, signedToken, missionCode, trackingLink })
    });
    const data = await response.json().catch(() => ({}));
    return { httpOk: response.ok, ...data };
  } catch {
    return { status: 'pending_manual', reason: 'verifier-unavailable', proofUrl: normalized };
  }
}
