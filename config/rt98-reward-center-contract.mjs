/** RT98 — public-safe Sponsored Mission / EONKEY contract. */
const freeze = (value) => Object.freeze(value);

export const EON_REWARD_SCHEMA = 'eonapp.rt98.sponsored-missions.v1';
export const EON_REWARD_PRIMARY_PROVIDER = 'mylead';
export const EON_REWARD_ALLOWED_PROVIDERS = freeze(['mylead']);
export const EON_REWARD_LAUNCH_TTL_MS = 90 * 24 * 60 * 60 * 1000;
export const EON_REWARD_HISTORY_LIMIT = 50;

export const EON_REWARD_RULES = freeze({
  creditName: 'EONKEYS',
  creditCashValue: false,
  creditTransferable: false,
  browserCanMint: false,
  iframeCloseCanMint: false,
  redirectCanMint: false,
  vastPlaybackCanMint: false,
  providerPostbackRequired: true,
  paidUserOrdinaryAdsDefault: false,
  localByokPrivateDataForwarding: false,
  forbiddenRedemptions: freeze([
    'cash',
    'gift cards',
    'subscription discounts',
    'renewal credits',
    'provider credits',
    'trading capital',
    'unlimited hosted AI'
  ])
});

export const EON_REWARD_UNLOCKS = freeze([
  freeze({ id: 'plus-template-library', label: 'Plus Template Library', featureGroup: 'plus-template-library', eonkeys: 5, durationMinutes: 15, route: '/projects' }),
  freeze({ id: 'plus-workflow-packs', label: 'Workflow Packs', featureGroup: 'plus-workflow-packs', eonkeys: 10, durationMinutes: 30, route: '/workspace' }),
  freeze({ id: 'local-ai-guided-workflows', label: 'Guided Local/BYOK AI workflows', featureGroup: 'local-ai-guided-workflows', eonkeys: 20, durationMinutes: 60, route: '/local-ai' }),
  freeze({ id: 'studio-dashboard', label: 'Studio Dashboard', featureGroup: 'studio-dashboard', eonkeys: 30, durationMinutes: 90, route: '/workspace' }),
  freeze({ id: 'creator-preset-packs', label: 'Creator Presets', featureGroup: 'creator-preset-packs', eonkeys: 30, durationMinutes: 90, route: '/create' }),
  freeze({ id: 'power-automation-packs', label: 'Power Automation Pack', featureGroup: 'power-automation-packs', eonkeys: 50, durationMinutes: 180, route: '/automations' })
]);

export const EON_REWARD_SURFACES = freeze([
  'rewards',
  'eoncity',
  'city-command-hub',
  'city-world',
  'game',
  'workspace',
  'locked-feature',
  'other'
]);

export const EON_REWARD_PENDING_STATUSES = freeze(['pre-approved', 'preapproved', 'pending']);
export const EON_REWARD_APPROVED_STATUSES = freeze(['approved']);
export const EON_REWARD_REVERSED_STATUSES = freeze(['rejected', 'reversed', 'chargeback', 'cancelled', 'canceled', 'void']);

export function publicRewardUnlocks() {
  return freeze(EON_REWARD_UNLOCKS.map((entry) => freeze({ ...entry })));
}

export function normalizeRewardSurface(value = '') {
  const raw = String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
  return EON_REWARD_SURFACES.includes(raw) ? raw : 'other';
}

export function rewardUnlockById(value = '') {
  const id = String(value || '').trim().toLowerCase();
  return EON_REWARD_UNLOCKS.find((entry) => entry.id === id) || null;
}

export default freeze({
  EON_REWARD_SCHEMA,
  EON_REWARD_PRIMARY_PROVIDER,
  EON_REWARD_ALLOWED_PROVIDERS,
  EON_REWARD_RULES,
  EON_REWARD_UNLOCKS,
  EON_REWARD_SURFACES,
  EON_REWARD_PENDING_STATUSES,
  EON_REWARD_APPROVED_STATUSES,
  EON_REWARD_REVERSED_STATUSES,
  publicRewardUnlocks,
  normalizeRewardSurface,
  rewardUnlockById
});
