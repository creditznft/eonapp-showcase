/**
 * W479-P0 universal manual-post contract.
 *
 * This is the launch baseline for creator distribution. A post kit can prepare
 * approved creative text and optionally pass one user-selected local media file
 * to the browser/device share sheet on an explicit click. It never becomes a
 * hosted-media, referral, OAuth or direct-publishing system.
 */
export const W479P_UNIVERSAL_MANUAL_POST_SCHEMA = 'eonapp.w479p.universal-manual-post.v1';

const freeze = (value) => Object.freeze(value);

export const W479P_REQUIRED_DESTINATIONS = freeze([
  'any-app', 'instagram', 'facebook-pages', 'tiktok', 'youtube', 'x', 'linkedin',
  'pinterest', 'threads', 'telegram', 'discord', 'reddit', 'whatsapp', 'snapchat'
]);

export const W479P_BLOCKED_PACK_FIELDS = freeze([
  'file', 'blob', 'dataUrl', 'base64', 'bytes', 'binary', 'buffer', 'mediaBody',
  'accessToken', 'refreshToken', 'token', 'apiKey', 'secret', 'password',
  'remotePostId', 'connectorJobId', 'scheduleAt', 'trackingPixel', 'referralCode'
]);

export const W479P_TRUTH = freeze({
  schema: W479P_UNIVERSAL_MANUAL_POST_SCHEMA,
  universalManualFirst: true,
  directPublishingLive: false,
  oauthConnectionsLive: false,
  tokenCustodyLive: false,
  hostedMediaLive: false,
  mediaProxyLive: false,
  referralTransportLive: false,
  automaticPublicLinkLive: false,
  persistentSelectedFileLive: false,
  explicitUserGestureRequired: true,
  nativeShareOptional: true,
  copyAndDownloadFallback: true,
  postingReceiptLive: false
});

export function validateW479PUniversalManualPostContract() {
  const errors = [];
  if (W479P_REQUIRED_DESTINATIONS.length < 14) errors.push('Universal manual post must keep the reviewed destination catalogue.');
  if (new Set(W479P_REQUIRED_DESTINATIONS).size !== W479P_REQUIRED_DESTINATIONS.length) errors.push('Universal manual post destination ids must be unique.');
  if (!W479P_REQUIRED_DESTINATIONS.includes('any-app')) errors.push('Universal manual post requires an app-agnostic route.');
  if (!W479P_BLOCKED_PACK_FIELDS.includes('file') || !W479P_BLOCKED_PACK_FIELDS.includes('token')) errors.push('Universal manual post must forbid media bodies and credentials in the saved pack.');
  if (W479P_TRUTH.directPublishingLive || W479P_TRUTH.oauthConnectionsLive || W479P_TRUTH.hostedMediaLive || W479P_TRUTH.mediaProxyLive) errors.push('Universal manual post cannot claim publishing, account links or hosted/proxied media.');
  if (!W479P_TRUTH.explicitUserGestureRequired || !W479P_TRUTH.copyAndDownloadFallback) errors.push('Universal manual post requires explicit action and non-native fallback.');
  return freeze(errors);
}
