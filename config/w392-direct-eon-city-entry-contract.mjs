/**
 * W392, renewed by W423 and W554 — one canonical EON City route.
 *
 * /eoncity is the only public City URL. It first mounts a lightweight EONAPP
 * identity access station. The heavy Babylon world starts only after a signed-
 * in, foreground session decision. Legacy map/tour/play routes are redirects.
 * A low-detail recovery mode stays inside the same City runtime and is offered
 * only after an actual renderer failure. Fullscreen, audio, haptics and
 * permissions stay explicit.
 */
export const W392_DIRECT_EON_CITY_ENTRY_CONTRACT = Object.freeze({
  wave: 'W423-W554',
  title: 'One identity-gated EON City',
  status: 'source-implementation-complete-pending-edge-and-device-proof',
  routes: Object.freeze({
    city: Object.freeze({ route: '/eoncity', source: 'eoncity.html', mode: 'identity-gated-babylon-entry' }),
    retiredAliases: Object.freeze(['/eoncity/lite', '/eoncity/tour', '/eoncity/3d', '/eoncity/play', '/eoncity-3d', '/eoncity-play'])
  }),
  directEntry: Object.freeze({
    publicPortal: false,
    publicAccessStation: true,
    identityGateBeforeRenderer: true,
    heavyRendererAfterAuthorizedForegroundAccess: true,
    autoFullscreen: false,
    autoOrientationLock: false,
    autoAudio: false,
    autoHaptics: false,
    autoProviderRequest: false,
    backgroundWork: false,
    walletOrRewardActivation: false,
    sameRouteRecovery: true,
    publicSecondCityMap: false
  }),
  proof: Object.freeze({
    staticGate: 'npm run qa:w392-direct-eoncity-entry',
    edgeAssetProtectionProofRequired: true,
    deviceProofRequired: true,
    mobileAndDesktopHumanReviewRequired: true
  })
});

export function validateW392DirectEonCityEntryContract(contract = W392_DIRECT_EON_CITY_ENTRY_CONTRACT) {
  const errors = [];
  if (contract.routes?.city?.route !== '/eoncity' || contract.routes?.city?.source !== 'eoncity.html') errors.push('Canonical City route must remain /eoncity -> eoncity.html.');
  if (!Array.isArray(contract.routes?.retiredAliases) || contract.routes.retiredAliases.length < 4) errors.push('Legacy City aliases must remain explicit redirects.');
  if (contract.directEntry?.publicPortal) errors.push('The old City Portal cannot remain the public first screen.');
  if (!contract.directEntry?.publicAccessStation) errors.push('Canonical City must mount a lightweight access station.');
  if (!contract.directEntry?.identityGateBeforeRenderer) errors.push('Heavy City rendering must wait for the identity decision.');
  if (!contract.directEntry?.heavyRendererAfterAuthorizedForegroundAccess) errors.push('Heavy City rendering must remain a foreground signed-in action.');
  for (const key of ['autoFullscreen', 'autoOrientationLock', 'autoAudio', 'autoHaptics', 'autoProviderRequest', 'backgroundWork', 'walletOrRewardActivation', 'publicSecondCityMap']) {
    if (contract.directEntry?.[key]) errors.push(`Canonical City cannot enable ${key}.`);
  }
  if (!contract.directEntry?.sameRouteRecovery) errors.push('Canonical City must retain a same-route low-detail recovery path.');
  if (!contract.proof?.edgeAssetProtectionProofRequired) errors.push('Heavy art assets require a separate edge protection proof.');
  return errors;
}
