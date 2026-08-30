/** W409 — bounded living-systems City contract. */
export const W409_LIVING_CITY_SYSTEMS_CONTRACT = Object.freeze({
  id: 'W409',
  title: 'EON City Living Systems and Quality Governor',
  scope: Object.freeze([
    'local NPC idle, bounded patrol and landmark orientation cues',
    'visual-only midnight-to-dawn lighting cycle and bounded weather atmosphere',
    'non-rewarding physical mission-board wayfinding',
    'ambient light-pod motion governed by the existing performance protection path'
  ]),
  nonGoals: Object.freeze([
    'simulating people, user work, activity or social presence',
    'automatic route opening, action execution, publishing or deployment',
    'reading project, chat, account, media, provider, Vault or Sync data',
    'binary art shipment, remote assets, telemetry, rewards, commerce or final visual certification'
  ]),
  releaseRules: Object.freeze({
    canonicalPublicEngine: 'babylon-eoncity',
    canonicalPublicRoute: '/eoncity',
    sourceOnly: true,
    binaryAssets: false,
    requiresW406BArtIntake: true,
    prohibitAutoOpenRoute: true,
    prohibitAutomaticExecution: true,
    prohibitRemoteNetwork: true,
    prohibitUserData: true,
    requirePerformanceGovernorFallback: true,
    requireNonRewardingMissionBoard: true
  }),
  nextWave: 'W410 — desktop, midrange and mobile City visual/control certification after real-device evidence.'
});

export function validateW409LivingCitySystemsContract(contract = W409_LIVING_CITY_SYSTEMS_CONTRACT) {
  const errors = [];
  if (contract?.id !== 'W409') errors.push('W409 identifier is invalid.');
  for (const [key, expected] of Object.entries({ canonicalPublicEngine: 'babylon-eoncity', canonicalPublicRoute: '/eoncity', sourceOnly: true, binaryAssets: false, requiresW406BArtIntake: true, prohibitAutoOpenRoute: true, prohibitAutomaticExecution: true, prohibitRemoteNetwork: true, prohibitUserData: true, requirePerformanceGovernorFallback: true, requireNonRewardingMissionBoard: true })) {
    if (contract?.releaseRules?.[key] !== expected) errors.push(`W409 rule ${key} is invalid.`);
  }
  return Object.freeze(errors);
}
