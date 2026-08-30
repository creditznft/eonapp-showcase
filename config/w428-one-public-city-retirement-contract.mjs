/** W428 — one canonical public City and quarantine for alternate legacy paths. */
export const W428_ONE_PUBLIC_CITY_RETIREMENT_CONTRACT = Object.freeze({
  wave: 'W428',
  schema: 'eonapp.w428.one-public-city-retirement.v1',
  canonicalRoute: '/eoncity',
  serviceWorkerVersion: 'v54',
  aliases: Object.freeze(['/realm', '/realm.html', '/realmworld', '/realmworld.html', '/team-realm', '/team-realm.html', '/world', '/game', '/games.html', '/eoncity.html', '/eoncity/lite', '/eoncity/tour', '/eoncity/3d', '/eoncity/play', '/eoncity-lite.html', '/eoncity-3d', '/eoncity-play']),
  publicRenderers: Object.freeze(['Babylon WebGL']),
  publicAlternateRenderer: false,
  recoveryMap: 'settings-only-not-public-navigation'
});
export function validateW428OnePublicCityRetirementContract(contract = W428_ONE_PUBLIC_CITY_RETIREMENT_CONTRACT) {
  const errors = [];
  if (contract.canonicalRoute !== '/eoncity') errors.push('W428 canonical City route must be /eoncity.');
  if (contract.serviceWorkerVersion !== 'v54') errors.push('W428 requires the City cache boundary version.');
  if (contract.publicAlternateRenderer || contract.publicRenderers.length !== 1 || contract.publicRenderers[0] !== 'Babylon WebGL') errors.push('W428 must retain one public Babylon renderer.');
  if (!Array.isArray(contract.aliases) || contract.aliases.length < 17) errors.push('W428 must quarantine every known legacy City alias.');
  if (contract.recoveryMap !== 'settings-only-not-public-navigation') errors.push('W428 cannot expose Recovery Map as public navigation.');
  return errors;
}
