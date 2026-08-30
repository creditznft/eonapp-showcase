/** Browser-safe RT98 reward policy. No provider secrets or dashboard URLs live here. */
const freeze = (value) => Object.freeze(value);

export const EON_REWARD_PRIMARY_PROVIDER = 'mylead';
export const EON_REWARD_RULES = freeze({
  creditName: 'EONKEYS',
  creditCashValue: false,
  creditTransferable: false,
  browserCanMint: false,
  iframeCloseCanMint: false,
  redirectCanMint: false,
  providerPostbackRequired: true,
  forbiddenRedemptions: freeze(['cash', 'gift cards', 'subscription discounts', 'renewal credits', 'provider credits', 'trading capital', 'unlimited hosted AI'])
});

export const EON_REWARD_UNLOCKS = freeze([
  freeze({ id: 'plus-template-library', label: 'Plus Template Library', featureGroup: 'plus-template-library', eonkeys: 5, durationMinutes: 15, route: '/projects' }),
  freeze({ id: 'plus-workflow-packs', label: 'Workflow Packs', featureGroup: 'plus-workflow-packs', eonkeys: 10, durationMinutes: 30, route: '/workspace' }),
  freeze({ id: 'local-ai-guided-workflows', label: 'Guided Local/BYOK AI workflows', featureGroup: 'local-ai-guided-workflows', eonkeys: 20, durationMinutes: 60, route: '/local-ai' }),
  freeze({ id: 'studio-dashboard', label: 'Studio Dashboard', featureGroup: 'studio-dashboard', eonkeys: 30, durationMinutes: 90, route: '/workspace' }),
  freeze({ id: 'creator-preset-packs', label: 'Creator Presets', featureGroup: 'creator-preset-packs', eonkeys: 30, durationMinutes: 90, route: '/create' }),
  freeze({ id: 'power-automation-packs', label: 'Power Automation Pack', featureGroup: 'power-automation-packs', eonkeys: 50, durationMinutes: 180, route: '/automations' })
]);

export default freeze({ EON_REWARD_PRIMARY_PROVIDER, EON_REWARD_RULES, EON_REWARD_UNLOCKS });
