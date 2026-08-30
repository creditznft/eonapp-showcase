/**
 * W360 — legacy EON City Portal retirement record.
 *
 * W392 supersedes the former multi-choice public portal. The old lightweight
 * portal source is retained for source-history compatibility only; public
 * /eoncity now enters Babylon directly and leaves fullscreen/audio choices
 * inside the running City.
 */
export const W360_EON_CITY_PORTAL_ROUTE_CONTRACT = Object.freeze({
  wave: 'W360',
  title: 'Legacy EON City Portal retirement record',
  status: 'superseded-by-w392-direct-city-entry',
  architecture: Object.freeze({
    directCity: Object.freeze({ route: '/eoncity', source: 'eoncity.html', publicName: 'EON City', entry: 'direct-babylon' }),
    portal: Object.freeze({ source: 'assets/js/eon-city-portal.js', status: 'retired-compatibility-source', primaryCta: 'ENTER EON CITY' }),
    overview: Object.freeze({ route: '/eoncity/lite', source: 'eoncity-lite.html', publicName: 'City Map fallback' }),
    commandSpace: Object.freeze({ route: '/eoncity/tour', source: 'eoncity-3d.html', publicName: 'Spatial Command Space', status: 'isolated-legacy-preview' }),
    compatibility3d: Object.freeze({ route: '/eoncity/3d', source: 'eoncity-3d.html', canonicalRoute: '/eoncity/tour', status: 'temporary-200-compatibility' }),
    immersiveWork: Object.freeze({ route: '/eoncity/play', source: 'eoncity-play.html', publicName: 'Immersive Work Mode compatibility' }),
    realmStudio: Object.freeze({ route: '/realm-studio', publicName: 'My Realm Studio' })
  }),
  cityRules: Object.freeze({
    portalIsPublicEntry: false,
    directCityHasNoAppShell: true,
    cityOverviewIsFallback: true,
    foregroundNavigationStartsLocalRenderer: true,
    autoFullscreenForbidden: true,
    autoProviderRequestForbidden: true,
    backgroundWorkForbidden: true,
    rawPromptVisible: false,
    rawProviderOutputVisible: false,
    credentialVisible: false,
    walletOrRewardActivation: false
  }),
  proof: Object.freeze({
    legacyStaticGate: 'npm run qa:w360-eon-city-portal-route',
    directEntryStaticGate: 'npm run qa:w392-direct-eoncity-entry',
    previewRequiredBeforeProduction: true,
    productionRequiredBeforeCompletion: true
  })
});

export function validateW360EonCityPortalRouteContract(contract = W360_EON_CITY_PORTAL_ROUTE_CONTRACT) {
  const errors = [];
  const requiredRoutes = ['/eoncity', '/eoncity/lite', '/eoncity/tour', '/eoncity/3d', '/eoncity/play', '/realm-studio'];
  const actualRoutes = [
    contract.architecture?.directCity?.route,
    contract.architecture?.overview?.route,
    contract.architecture?.commandSpace?.route,
    contract.architecture?.compatibility3d?.route,
    contract.architecture?.immersiveWork?.route,
    contract.architecture?.realmStudio?.route
  ];
  for (const route of requiredRoutes) if (!actualRoutes.includes(route)) errors.push(`Missing City route: ${route}`);
  if (contract.architecture?.compatibility3d?.canonicalRoute !== '/eoncity/tour') errors.push('Legacy 3D compatibility must canonically point to /eoncity/tour.');
  if (contract.architecture?.portal?.status !== 'retired-compatibility-source') errors.push('Historical portal source must remain explicitly retired.');
  if (contract.cityRules?.portalIsPublicEntry !== false) errors.push('Portal cannot remain the public first screen.');
  if (!contract.cityRules?.foregroundNavigationStartsLocalRenderer) errors.push('Direct City must start the local renderer after foreground navigation.');
  if (contract.cityRules?.autoFullscreenForbidden !== true) errors.push('Direct City cannot auto-request fullscreen.');
  if (contract.cityRules?.autoProviderRequestForbidden !== true || contract.cityRules?.backgroundWorkForbidden !== true) errors.push('City cannot start provider or background work.');
  if (contract.cityRules?.rawPromptVisible || contract.cityRules?.rawProviderOutputVisible || contract.cityRules?.credentialVisible) errors.push('City cannot render private AI data or credentials.');
  if (contract.cityRules?.walletOrRewardActivation) errors.push('City architecture cannot activate wallet or reward systems.');
  return errors;
}
