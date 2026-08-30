/**
 * W479-M6 bridge contract.
 *
 * A future proven local image/video adapter may hand a finished asset to the
 * Creator distribution flow, but this bridge is export-first by design. It
 * does not connect accounts, upload media, create a remote post or schedule.
 */
export const W479M_CREATOR_DISTRIBUTION_SCHEMA = 'eonapp.w479m.creator-distribution-handoff.v1';

const freeze = (value) => Object.freeze(value);

export const W479M_SUPPORTED_ASSET_KINDS = freeze(['image', 'video']);
export const W479M_BLOCKED_MEDIA_BODY_FIELDS = freeze(['file', 'blob', 'dataUrl', 'base64', 'bytes', 'binary', 'buffer', 'mediaBody', 'token', 'accessToken', 'refreshToken', 'apiKey', 'secret']);

export const W479M_PLATFORM_HANDOFFS = freeze([
  freeze({ id: 'instagram', label: 'Instagram professional', now: 'export-or-native-share', later: 'official-professional-publishing-review' }),
  freeze({ id: 'facebook-pages', label: 'Facebook Pages', now: 'export-or-native-share', later: 'official-page-publishing-review' }),
  freeze({ id: 'tiktok', label: 'TikTok', now: 'export-or-native-share', later: 'official-content-posting-review' }),
  freeze({ id: 'youtube', label: 'YouTube', now: 'export-or-native-share', later: 'official-upload-oauth-review' }),
  freeze({ id: 'linkedin', label: 'LinkedIn', now: 'export-or-native-share', later: 'official-member-or-organization-publishing-review' }),
  freeze({ id: 'pinterest', label: 'Pinterest', now: 'export-or-native-share', later: 'official-pin-creation-review' }),
  freeze({ id: 'x', label: 'X', now: 'export-or-native-share', later: 'official-post-api-plan-and-approval-review' }),
  freeze({ id: 'telegram', label: 'Telegram channel or group', now: 'export-or-native-share', later: 'bot-admin-consent-posting-proof' }),
  freeze({ id: 'discord', label: 'Discord', now: 'export-or-native-share', later: 'official-webhook-or-bot-consent-review' }),
  freeze({ id: 'reddit', label: 'Reddit', now: 'export-or-native-share', later: 'official-oauth-and-community-rule-review' }),
  freeze({ id: 'whatsapp', label: 'WhatsApp', now: 'native-share', later: 'business-api-review-only' }),
  freeze({ id: 'threads', label: 'Threads', now: 'native-share', later: 'official-capability-review' }),
  freeze({ id: 'snapchat', label: 'Snapchat', now: 'native-share', later: 'official-capability-review' })
]);

export const W479M_REQUIRED_ADAPTER_PROOFS = freeze([
  'explicit-local-connection-passed',
  'capability-discovery-passed',
  'generation-passed',
  'cancellation-error-path-passed',
  'local-output-user-controlled',
  'no-silent-cloud-fallback'
]);

export function findW479MPlatformHandoff(id = '') {
  return W479M_PLATFORM_HANDOFFS.find((item) => item.id === String(id || '').trim().toLowerCase()) || null;
}

export function validateW479MCreatorDistributionContract() {
  const errors = [];
  if (W479M_PLATFORM_HANDOFFS.length < 10) errors.push('Creator distribution bridge must keep the reviewed global platform list.');
  if (new Set(W479M_PLATFORM_HANDOFFS.map((entry) => entry.id)).size !== W479M_PLATFORM_HANDOFFS.length) errors.push('Creator distribution platform ids must be unique.');
  if (!W479M_SUPPORTED_ASSET_KINDS.includes('image') || !W479M_SUPPORTED_ASSET_KINDS.includes('video')) errors.push('Creator distribution bridge must preserve image and video handoff support.');
  if (!W479M_REQUIRED_ADAPTER_PROOFS.includes('no-silent-cloud-fallback')) errors.push('Creator distribution bridge must prohibit silent cloud fallback.');
  return freeze(errors);
}

export function getW479MCreatorDistributionTruth() {
  return freeze({
    schema: W479M_CREATOR_DISTRIBUTION_SCHEMA,
    localAdapterRequiredBeforeHandoff: true,
    mediaGenerationLive: false,
    accountConnectionLive: false,
    tokenCustodyLive: false,
    directPublishingLive: false,
    backgroundUploadLive: false,
    schedulingLive: false,
    perPostReviewRequired: true,
    manualExportRequired: true
  });
}
