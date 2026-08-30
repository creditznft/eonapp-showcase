export const W407_ARRIVAL_DISTRICT_CONTRACT = Object.freeze({
  id: 'W407',
  title: 'EON City Arrival District',
  scope: Object.freeze([
    'Arrival Gate first-frame vertical slice',
    'wet-street path and Command Deck orientation',
    'visible EONBOT companion and non-rewarding first mission',
    'original procedural Babylon enhancement under W406B intake boundaries'
  ]),
  nonGoals: Object.freeze([
    'shipping binary art or claiming visual certification',
    'opening a route automatically or storing user work',
    'reward, commerce, wallet, token, social or Sync activation',
    'creating a second public City engine or route'
  ]),
  releaseRules: Object.freeze({
    canonicalPublicEngine: 'babylon-eoncity',
    canonicalPublicRoute: '/eoncity',
    sourceOnly: true,
    binaryAssets: false,
    requiresW406BArtIntake: true,
    requireVisibleFirstMission: true,
    prohibitAutoOpenRoute: true,
    prohibitRemoteNetwork: true,
    prohibitUserData: true
  }),
  nextWave: 'W408 — Creator Atrium and Forge Bay authored procedural districts after W407 visual and control proof.'
});

export function validateW407ArrivalDistrictContract(contract = W407_ARRIVAL_DISTRICT_CONTRACT) {
  const errors = [];
  if (contract?.id !== 'W407') errors.push('W407 identifier is invalid.');
  for (const [key, expected] of Object.entries({ canonicalPublicEngine: 'babylon-eoncity', canonicalPublicRoute: '/eoncity', sourceOnly: true, binaryAssets: false, requiresW406BArtIntake: true, requireVisibleFirstMission: true, prohibitAutoOpenRoute: true, prohibitRemoteNetwork: true, prohibitUserData: true })) {
    if (contract?.releaseRules?.[key] !== expected) errors.push(`W407 rule ${key} is invalid.`);
  }
  return Object.freeze(errors);
}
