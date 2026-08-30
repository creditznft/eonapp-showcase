/** W404 — City Creator Atrium and Forge Bay launch-surface contract. */
export const W404_CITY_CREATOR_ATRIUM_CONTRACT = Object.freeze({
  wave: 'W404',
  canonicalCityEngine: 'Babylon',
  surface: Object.freeze({
    inWorld: true,
    launchBoardOnly: true,
    creatorWorkspace: '/workspace#creator-engine',
    forge: '/forge',
    localMedia: '/local-ai#creator-media',
    sourceReceipts: '/workspace#eon-asset-provenance-title'
  }),
  boundaries: Object.freeze({
    foregroundUserGestureOnly: true,
    readsPrivateWork: false,
    remoteTransport: false,
    providerCalls: false,
    credentials: false,
    mediaBodies: false,
    codeEditor: false,
    mediaEditor: false,
    separatePublicRenderer: false,
    automaticNavigation: false
  })
});

export function validateW404CityCreatorAtriumContract(contract = W404_CITY_CREATOR_ATRIUM_CONTRACT) {
  const errors = [];
  if (contract?.wave !== 'W404' || contract?.canonicalCityEngine !== 'Babylon') errors.push('W404 engine scope is invalid.');
  const surface = contract?.surface || {};
  if (surface.inWorld !== true || surface.launchBoardOnly !== true || surface.creatorWorkspace !== '/workspace#creator-engine' || surface.forge !== '/forge' || surface.localMedia !== '/local-ai#creator-media' || surface.sourceReceipts !== '/workspace#eon-asset-provenance-title') errors.push('W404 City destinations are invalid.');
  const boundaries = contract?.boundaries || {};
  const exactFalse = ['readsPrivateWork', 'remoteTransport', 'providerCalls', 'credentials', 'mediaBodies', 'codeEditor', 'mediaEditor', 'separatePublicRenderer', 'automaticNavigation'];
  if (boundaries.foregroundUserGestureOnly !== true || exactFalse.some((key) => boundaries[key] !== false)) errors.push('W404 safety boundaries are invalid.');
  return Object.freeze(errors);
}
