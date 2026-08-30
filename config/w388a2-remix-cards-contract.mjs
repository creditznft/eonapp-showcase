/** W388A.2 — local Remix Cards make a safe starter package, not a public collaboration service. */
export const W388A2_REMIX_CARDS_CONTRACT = Object.freeze({
  wave: 'W388A.2',
  canonicalSurface: 'Workspace',
  execution: 'local-draft-export-native-share-only',
  cardKinds: Object.freeze(['campaign-brief', 'content-series', 'image-concept', 'forge-starter', 'video-storyboard', 'music-track', 'dj-set', 'radio-station', 'city-postcard']),
  boundaries: Object.freeze({
    pageSessionOnly: true,
    browserSessionPrefillOnly: true,
    publicHosting: false,
    accounts: false,
    privateProjectTransfer: false,
    fileTransfer: false,
    mediaBodies: false,
    providerCalls: false,
    directPublishing: false,
    oauthConnections: false,
    storedPlatformTokens: false,
    tracking: false,
    referralReward: false,
    collaborationPresence: false,
    legalLicenseClaim: false,
    externalRemixProof: false
  })
});

export function validateW388A2RemixCardsContract(contract = W388A2_REMIX_CARDS_CONTRACT) {
  const errors = [];
  if (contract?.wave !== 'W388A.2' || contract?.canonicalSurface !== 'Workspace' || contract?.execution !== 'local-draft-export-native-share-only') errors.push('W388A.2 canonical scope is invalid.');
  if (JSON.stringify(contract?.cardKinds) !== JSON.stringify(['campaign-brief', 'content-series', 'image-concept', 'forge-starter', 'video-storyboard', 'music-track', 'dj-set', 'radio-station', 'city-postcard'])) errors.push('W388A.2 Remix Card kinds are invalid.');
  const b = contract?.boundaries || {};
  const exactTrue = ['pageSessionOnly', 'browserSessionPrefillOnly'];
  const exactFalse = ['publicHosting', 'accounts', 'privateProjectTransfer', 'fileTransfer', 'mediaBodies', 'providerCalls', 'directPublishing', 'oauthConnections', 'storedPlatformTokens', 'tracking', 'referralReward', 'collaborationPresence', 'legalLicenseClaim', 'externalRemixProof'];
  if (exactTrue.some((key) => b[key] !== true) || exactFalse.some((key) => b[key] !== false)) errors.push('W388A.2 boundaries are invalid.');
  return Object.freeze(errors);
}
