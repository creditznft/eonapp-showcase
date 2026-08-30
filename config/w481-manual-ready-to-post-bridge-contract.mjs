export const W481_MANUAL_READY_TO_POST_BRIDGE_CONTRACT = Object.freeze({
  schema: 'eon.social.manual-ready-to-post-bridge.w481.v1',
  wave: 'W481',
  phase: 'manual-first-social-publication-baseline',
  requiredDestinationIds: Object.freeze([
    'any-app', 'instagram', 'facebook-pages', 'tiktok', 'youtube', 'x', 'linkedin',
    'pinterest', 'threads', 'telegram', 'discord', 'reddit', 'whatsapp', 'snapchat'
  ]),
  requiredPackSections: Object.freeze([
    'caption',
    'visual-brief',
    'video-beat-or-static-guidance',
    'alt-text',
    'first-comment',
    'format-notes',
    'platform-variant',
    'disclosure-reminder',
    'manual-upload-boundary'
  ]),
  blockedFields: Object.freeze([
    'file', 'blob', 'dataUrl', 'base64', 'bytes', 'binary', 'buffer', 'mediaBody',
    'accessToken', 'refreshToken', 'token', 'apiKey', 'secret', 'password',
    'remotePostId', 'connectorJobId', 'scheduleAt', 'trackingPixel', 'referralCode'
  ]),
  truth: Object.freeze({
    manualFirst: true,
    directPublishingLive: false,
    oauthConnectionsLive: false,
    serverMediaRelayLive: false,
    hiddenUploadLive: false,
    automaticPostingLive: false,
    postingReceiptLive: false,
    persistentMediaBodyLive: false,
    copyDownloadNativeShareFallback: true,
    explicitUserGestureRequired: true
  })
});

export function validateW481ManualReadyToPostBridgeContract(contract = W481_MANUAL_READY_TO_POST_BRIDGE_CONTRACT) {
  const errors = [];
  const ensure = (value, message) => { if (!value) errors.push(message); };
  ensure(contract.schema === 'eon.social.manual-ready-to-post-bridge.w481.v1', 'schema must stay W481 manual Ready-to-Post bridge v1');
  ensure(contract.requiredDestinationIds.length >= 14 && new Set(contract.requiredDestinationIds).size === contract.requiredDestinationIds.length, 'destination catalogue must remain complete and unique');
  ensure(contract.requiredDestinationIds.includes('any-app') && contract.requiredDestinationIds.includes('tiktok') && contract.requiredDestinationIds.includes('youtube') && contract.requiredDestinationIds.includes('instagram'), 'major destinations plus any-app must remain present');
  ensure(contract.requiredPackSections.includes('alt-text') && contract.requiredPackSections.includes('first-comment') && contract.requiredPackSections.includes('platform-variant'), 'accessibility, first comment and platform variants must remain present');
  ensure(contract.blockedFields.includes('mediaBody') && contract.blockedFields.includes('accessToken') && contract.blockedFields.includes('remotePostId'), 'media bodies, tokens and remote receipts must stay blocked');
  ensure(contract.truth.manualFirst === true, 'W481 must remain manual-first');
  ensure(contract.truth.directPublishingLive === false && contract.truth.oauthConnectionsLive === false, 'direct publishing and OAuth must remain inactive');
  ensure(contract.truth.serverMediaRelayLive === false && contract.truth.hiddenUploadLive === false, 'server relay and hidden upload must remain inactive');
  ensure(contract.truth.automaticPostingLive === false && contract.truth.postingReceiptLive === false, 'autopost and posting receipts must remain inactive');
  ensure(contract.truth.copyDownloadNativeShareFallback === true && contract.truth.explicitUserGestureRequired === true, 'fallback and user gesture must stay required');
  return errors;
}
