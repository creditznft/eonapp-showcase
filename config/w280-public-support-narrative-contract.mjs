export const W280_PUBLIC_SUPPORT_NARRATIVE_CONTRACT = Object.freeze({
  wave: 'W280-A0',
  scope: 'source-only',
  requiredSupportTopicIds: Object.freeze([
    'signed-sharing',
    'local-ai',
    'vault-recovery',
    'market-previews',
    'city-realm',
    'bug-security'
  ]),
  requiredRecoveryLinks: Object.freeze([
    '/capsule',
    '/profile',
    '/local-ai',
    '/privacy'
  ]),
  requiredBoundaryTerms: Object.freeze([
    'Self-service guidance plus private case workflow',
    'subscriptions are available only through the hosted Dodo checkout opened from Billing',
    'No wallet or chain payment, token, payout, marketplace sale or provider-credit reward is active.',
    'There is no premium support queue, manual plan activation, manual EONKEY grant or guaranteed response time.',
    'Never include passwords, recovery phrases, private keys, wallet backup files, or full API keys.'
  ]),
  bannedStalePhrases: Object.freeze([
    'payment proof',
    'public transaction hash',
    'invoice/quote',
    'refund exceptions',
    'unsupported crypto transfers',
    'starter drop',
    'lootbox opening',
    'suspicious payment behavior'
  ]),
  claimFence: 'Source copy and route wiring do not prove a staffed support operation, response SLA, legal readiness, or public launch.'
});
