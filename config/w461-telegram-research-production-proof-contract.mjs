/** W461.1 contract: opt-in public-edge evidence for Telegram onboarding and Research Lab only. */
export const W461_TELEGRAM_RESEARCH_PRODUCTION_PROOF_CONTRACT = Object.freeze({
  wave: 'W461.1',
  schema: 'eonapp.telegram-research-production-proof.w461.1',
  originHttpsOnly: true,
  defaultMode: 'dry-run',
  requestCookieIncluded: false,
  botActionCreated: false,
  telegramSessionValidated: false,
  telegramMessageSent: false,
  rewardMechanicEnabled: false,
  brokerOrOrderPathEnabled: false,
  responseBodyStored: false,
  humanVisualReviewRequired: true,
  liveProductionProof: false,
  probes: Object.freeze([
    Object.freeze({ id: 'telegram', path: '/telegram', type: 'document', expectedStatus: 200, markers: Object.freeze(['Telegram helps you return to EONAPP', 'No ads, rewards or provider SDKs']) }),
    Object.freeze({ id: 'insights', path: '/insights', type: 'document', expectedStatus: 200, markers: Object.freeze(['Research Lab', 'No live price feed', 'No orders']) }),
    Object.freeze({ id: 'trade-alias', path: '/trade', type: 'redirect', expectedStatus: 301, expectedLocation: '/insights' }),
    Object.freeze({ id: 'telegram-index-alias', path: '/telegram/index.html', type: 'redirect', expectedStatus: 301, expectedLocation: '/telegram' })
  ]),
  requiredFiles: Object.freeze([
    'scripts/w461-telegram-research-production-proof.mjs',
    'scripts/w461-telegram-research-production-proof-gate.mjs',
    'config/w461-telegram-research-production-proof-contract.mjs',
    'tests/unit/w461-telegram-research-production-proof.test.mjs',
    'telegram.html',
    'trade.html',
    'config/route-contract.mjs'
  ])
});

export function validateW461TelegramResearchProductionProofContract(contract = W461_TELEGRAM_RESEARCH_PRODUCTION_PROOF_CONTRACT) {
  const errors = [];
  if (contract.wave !== 'W461.1') errors.push('wave-mismatch');
  if (contract.schema !== 'eonapp.telegram-research-production-proof.w461.1') errors.push('schema-mismatch');
  const expected = {
    originHttpsOnly: true,
    defaultMode: 'dry-run',
    requestCookieIncluded: false,
    botActionCreated: false,
    telegramSessionValidated: false,
    telegramMessageSent: false,
    rewardMechanicEnabled: false,
    brokerOrOrderPathEnabled: false,
    responseBodyStored: false,
    humanVisualReviewRequired: true,
    liveProductionProof: false
  };
  for (const [key, value] of Object.entries(expected)) if (contract[key] !== value) errors.push(`boundary-${key}-mismatch`);
  if (!Array.isArray(contract.probes) || contract.probes.length !== 4) errors.push('probe-contract-mismatch');
  if (!Array.isArray(contract.requiredFiles) || contract.requiredFiles.length < 7) errors.push('required-files-missing');
  return Object.freeze(errors);
}
