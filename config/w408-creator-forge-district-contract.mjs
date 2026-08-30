/** W408 — authored Creator Atrium and Forge Bay City district contract. */
export const W408_CREATOR_FORGE_DISTRICT_CONTRACT = Object.freeze({
  id: 'W408',
  title: 'EON City Creator Atrium and Forge Bay',
  scope: Object.freeze([
    'authored-procedural Creator Atrium exterior',
    'authored-procedural Forge Bay exterior',
    'static City wayfinding connected to the existing W404 launch board',
    'foreground native-route choices only'
  ]),
  nonGoals: Object.freeze([
    'shipping binary art or claiming visual certification',
    'duplicating Creator or Forge editors inside City',
    'opening a route, provider task, publish flow or deployment automatically',
    'reading private work, account state, media, credentials or Vault content',
    'reward, commerce, wallet, social or Sync activation'
  ]),
  releaseRules: Object.freeze({
    canonicalPublicEngine: 'babylon-eoncity',
    canonicalPublicRoute: '/eoncity',
    sourceOnly: true,
    binaryAssets: false,
    requiresW404LaunchBoard: true,
    requiresW406BArtIntake: true,
    prohibitAutoOpenRoute: true,
    prohibitAutomaticExecution: true,
    prohibitRemoteNetwork: true,
    prohibitUserData: true
  }),
  nextWave: 'W409 — NPC behavior, weather/day-night, mission board and quality governor after Creator/Forge device visual proof.'
});

export function validateW408CreatorForgeDistrictContract(contract = W408_CREATOR_FORGE_DISTRICT_CONTRACT) {
  const errors = [];
  if (contract?.id !== 'W408') errors.push('W408 identifier is invalid.');
  for (const [key, expected] of Object.entries({ canonicalPublicEngine: 'babylon-eoncity', canonicalPublicRoute: '/eoncity', sourceOnly: true, binaryAssets: false, requiresW404LaunchBoard: true, requiresW406BArtIntake: true, prohibitAutoOpenRoute: true, prohibitAutomaticExecution: true, prohibitRemoteNetwork: true, prohibitUserData: true })) {
    if (contract?.releaseRules?.[key] !== expected) errors.push(`W408 rule ${key} is invalid.`);
  }
  return Object.freeze(errors);
}
