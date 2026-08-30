/** W388A.3 — EONBOT may prepare an explicit short-lived handoff to local EON Share tools. */
export const W388A3_EONBOT_SHAREABLE_CONTRACT = Object.freeze({
  wave: 'W388A.3',
  canonicalRoute: '/workspace#eon-share',
  execution: 'user-tap-to-browser-session-draft-only',
  boundaries: Object.freeze({
    messageTextSideEffect: false,
    explicitCtaRequired: true,
    sessionStorageOnly: true,
    attachmentTransfer: false,
    privateChatTransfer: false,
    providerCredentials: false,
    accountData: false,
    directPublishing: false,
    socialConnection: false,
    tracking: false,
    referralReward: false,
    externalPostingProof: false
  })
});

export function validateW388A3EonbotShareableContract(contract = W388A3_EONBOT_SHAREABLE_CONTRACT) {
  const errors = [];
  if (contract?.wave !== 'W388A.3' || contract?.canonicalRoute !== '/workspace#eon-share' || contract?.execution !== 'user-tap-to-browser-session-draft-only') errors.push('W388A.3 canonical scope is invalid.');
  const b = contract?.boundaries || {};
  const exactTrue = ['explicitCtaRequired', 'sessionStorageOnly'];
  const exactFalse = ['messageTextSideEffect', 'attachmentTransfer', 'privateChatTransfer', 'providerCredentials', 'accountData', 'directPublishing', 'socialConnection', 'tracking', 'referralReward', 'externalPostingProof'];
  if (exactTrue.some((key) => b[key] !== true) || exactFalse.some((key) => b[key] !== false)) errors.push('W388A.3 boundaries are invalid.');
  return Object.freeze(errors);
}
