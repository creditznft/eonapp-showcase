/** W479 — City/Realm playable vertical-slice source contract. */
export const W479_CITY_REALM_PLAYABLE_SCHEMA = 'eonapp.w479.city-realm-playable.v1';

const freeze = (value) => Object.freeze(value);

export const W479_CITY_REQUIRED_SURFACES = freeze([
  freeze({ id: 'direct-city', route: '/eoncity', source: 'eoncity.html', marker: 'data-eon-city-direct-entry' }),
  freeze({ id: 'city-station', route: '/eoncity', source: 'assets/js/eon-city-play-station.js', marker: 'startPlay' }),
  freeze({ id: 'first-run', route: '/eoncity', source: 'assets/js/city/eon-city-first-run.js', marker: 'EON_CITY_FIRST_RUN_PATHS' }),
  freeze({ id: 'work-loop', route: '/eoncity', source: 'assets/js/city/eon-city-work-loop.js', marker: 'createCityWorkLoopProposal' }),
  freeze({ id: 'creator-atrium', route: '/eoncity', source: 'assets/js/city/eon-city-creator-atrium.js', marker: 'EON_CITY_CREATOR_ATRIUM_CARDS' }),
  freeze({ id: 'realm-profile', route: '/realm-studio', source: 'assets/js/realm-studio-page.js', marker: 'realm' })
]);

export const W479_CITY_TRUTH = freeze({
  firstRunLocalOnly: true,
  nativeWorkSurfaceRequired: true,
  autoNavigation: false,
  externalAction: false,
  socialPublishing: false,
  mediaGeneration: false,
  walletOrMarketplace: false,
  unmeasuredAaaClaim: false,
  deviceEvidenceRequired: true,
  humanReviewRequired: true
});

export function validateW479CityRealmPlayableContract() {
  const errors = [];
  if (W479_CITY_REQUIRED_SURFACES.length < 6) errors.push('W479 must keep the City, work-loop, creator and Realm surfaces explicit.');
  if (new Set(W479_CITY_REQUIRED_SURFACES.map((surface) => surface.id)).size !== W479_CITY_REQUIRED_SURFACES.length) errors.push('W479 surface ids must be unique.');
  if (!W479_CITY_REQUIRED_SURFACES.some((surface) => surface.route === '/eoncity' && surface.id === 'direct-city')) errors.push('W479 must retain the direct canonical EON City route.');
  if (!W479_CITY_TRUTH.firstRunLocalOnly || !W479_CITY_TRUTH.nativeWorkSurfaceRequired || W479_CITY_TRUTH.autoNavigation || W479_CITY_TRUTH.externalAction) errors.push('W479 City orientation/work path must remain explicit, local and user-confirmed.');
  if (W479_CITY_TRUTH.socialPublishing || W479_CITY_TRUTH.mediaGeneration || W479_CITY_TRUTH.walletOrMarketplace || W479_CITY_TRUTH.unmeasuredAaaClaim) errors.push('W479 must not claim publishing, media generation, commerce or unmeasured AAA performance.');
  return freeze(errors);
}
