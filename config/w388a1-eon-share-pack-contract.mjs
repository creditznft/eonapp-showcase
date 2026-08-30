/** W388A.1 — creator Share Pack is local drafting, export and native share only. */
export const W388A1_EON_SHARE_PACK_CONTRACT = Object.freeze({
  wave: 'W388A.1',
  canonicalSurface: 'Workspace',
  formats: Object.freeze(['vertical-video', 'square-post', 'wide-video', 'story-card']),
  execution: 'draft-export-native-share-only',
  boundaries: Object.freeze({
    pageSessionOnly: true,
    mediaBodies: false,
    providerCalls: false,
    directPublishing: false,
    oauthConnections: false,
    storedPlatformTokens: false,
    automatedScheduling: false,
    referralReward: false,
    tracking: false,
    externalPostingProof: false
  })
});

export function validateW388A1EonSharePackContract(contract = W388A1_EON_SHARE_PACK_CONTRACT) {
  const errors = [];
  if (contract?.wave !== 'W388A.1' || contract?.canonicalSurface !== 'Workspace' || contract?.execution !== 'draft-export-native-share-only') errors.push('W388A.1 canonical scope is invalid.');
  if (JSON.stringify(contract?.formats) !== JSON.stringify(['vertical-video', 'square-post', 'wide-video', 'story-card'])) errors.push('W388A.1 Share Pack formats are invalid.');
  const b = contract?.boundaries || {};
  const exactTrue = ['pageSessionOnly'];
  const exactFalse = ['mediaBodies', 'providerCalls', 'directPublishing', 'oauthConnections', 'storedPlatformTokens', 'automatedScheduling', 'referralReward', 'tracking', 'externalPostingProof'];
  if (exactTrue.some((key) => b[key] !== true) || exactFalse.some((key) => b[key] !== false)) errors.push('W388A.1 boundaries are invalid.');
  return Object.freeze(errors);
}
