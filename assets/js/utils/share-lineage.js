import { createDerivedShareLink, extractSignedToken, verifySignedShareToken } from './signed-share-link.js';

export async function inspectShareLineage(input) {
  const verified = await verifySignedShareToken(input, { allowExpired: true });
  if (!verified.ok) return { ok: false, reason: verified.reason, rootReferralId: '', shareId: '', parentShareId: '' };
  const { rootReferralId = '', shareId = '', parentShareId = '' } = verified.payload;
  return {
    ok: true,
    token: verified.token,
    missionCode: verified.missionCode,
    rootReferralId,
    shareId,
    parentShareId,
    isRootShare: !parentShareId,
    exactLinkAttribution: shareId
  };
}

export async function buildReshareOptions(input, options = {}) {
  const token = extractSignedToken(input);
  const parent = await verifySignedShareToken(token);
  if (!parent.ok) throw new Error(`Cannot reshare invalid link: ${parent.reason}`);
  const child = await createDerivedShareLink(token, options);
  return {
    exact: {
      mode: 'exact',
      link: String(input),
      token,
      attributedShareId: parent.payload.shareId,
      rootReferralId: parent.payload.rootReferralId
    },
    derived: {
      mode: 'derived',
      ...child,
      attributedShareId: child.payload.shareId,
      parentShareId: parent.payload.shareId,
      rootReferralId: parent.payload.rootReferralId
    }
  };
}
