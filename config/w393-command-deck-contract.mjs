/** W393 foundation, renewed by W429 — Babylon Command Deck contract. */
export const W393_COMMAND_DECK_CONTRACT = Object.freeze({
  wave: 'W429',
  title: 'Functional Babylon Command Deck',
  status: 'source-implementation-complete-pending-device-proof',
  route: Object.freeze({ city: '/eoncity', renderer: 'Babylon WebGL', publicThreeJsTour: false }),
  deck: Object.freeze({
    inWorld: true,
    foregroundUserGestureOnly: true,
    compactStationCount: 7,
    nativeDestinations: Object.freeze(['/forge', '/projects', '/library', '/vault']),
    localPanels: Object.freeze(['eonbot', 'missions', 'settings']),
    secondClickForNativeNavigation: true,
    programmaticNavigation: false,
    readsPrivateWork: false,
    remoteTelemetry: false,
    remoteAssets: false,
    commerce: false,
    rewards: false,
    socialConnectors: false,
    separatePublicRenderer: false
  }),
  proof: Object.freeze({
    staticGate: 'npm run qa:w429-functional-command-deck',
    deviceProofRequired: true,
    desktopAndMobileHumanReviewRequired: true
  })
});

export function validateW393CommandDeckContract(contract = W393_COMMAND_DECK_CONTRACT) {
  const errors = [];
  if (contract.route?.city !== '/eoncity' || contract.route?.renderer !== 'Babylon WebGL' || contract.route?.publicThreeJsTour !== false) errors.push('Command Deck must live inside the sole public Babylon /eoncity route.');
  if (!contract.deck?.inWorld || contract.deck?.separatePublicRenderer) errors.push('Command Deck cannot become a separate public renderer.');
  if (!contract.deck?.foregroundUserGestureOnly || contract.deck?.programmaticNavigation || !contract.deck?.secondClickForNativeNavigation) errors.push('Command Deck choices must remain visible and native navigation must need confirmation.');
  if (!Array.isArray(contract.deck?.nativeDestinations) || contract.deck.nativeDestinations.length !== 4) errors.push('Command Deck must retain its bounded native destination set.');
  if (!Array.isArray(contract.deck?.localPanels) || contract.deck.localPanels.length !== 3) errors.push('Command Deck must provide EONBOT, Mission Board and City Settings in-world.');
  if (contract.deck?.compactStationCount < 5 || contract.deck?.compactStationCount > 7) errors.push('Command Deck must expose a compact five-to-seven station set.');
  for (const key of ['readsPrivateWork', 'remoteTelemetry', 'remoteAssets', 'commerce', 'rewards', 'socialConnectors']) if (contract.deck?.[key]) errors.push(`Command Deck cannot enable ${key}.`);
  return errors;
}
