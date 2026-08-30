/** W626H — Direct BYOK privacy and real-output certification board. */
const freeze = Object.freeze;
const REQUIRED = Object.freeze(['desktopImageFal', 'desktopImageReplicate', 'desktopVideoFal', 'desktopVideoReplicate', 'desktopMusicElevenLabs', 'hostedMusicOsVaultCustody', 'hostedMusicBinaryMemoryExpiry', 'supportedMobilePath', 'cancelRecovery', 'rateLimitRecovery', 'outageRecovery', 'expiredResultRecovery', 'moderationTruth', 'localHistoryDeleteExport', 'networkBoundaryProof']);

export function buildDirectByokCertificationBoard(evidence = {}) {
  const rows = Object.fromEntries(REQUIRED.map((id) => [id, evidence[id] === 'pass' ? 'pass' : evidence[id] === 'fail' ? 'fail' : 'pending']));
  return freeze({ schema: 'eon.direct-byok.certification-board.w626h.v1', rows: freeze(rows), requiredCount: REQUIRED.length, passedCount: Object.values(rows).filter((value) => value === 'pass').length, failedCount: Object.values(rows).filter((value) => value === 'fail').length, realProviderOutputsRequired: true });
}

export function evaluateDirectByokCertification(evidence = {}) {
  const board = buildDirectByokCertificationBoard(evidence);
  const companion = evidence.companionRelease || {};
  const companionReady = companion.signed === true && companion.secureCredentialStore === true && companion.loopbackOriginAuth === true;
  const allRowsPass = board.passedCount === board.requiredCount;
  const pass = companionReady && allRowsPass && evidence.eonappServerProxyObserved === false && evidence.eonappServerMediaStorageObserved === false;
  const blockers = [];
  if (!companion.signed) blockers.push('signed-companion-release-pending');
  if (!companion.secureCredentialStore) blockers.push('os-secure-credential-store-proof-pending');
  if (!companion.loopbackOriginAuth) blockers.push('loopback-origin-auth-proof-pending');
  for (const [id, state] of Object.entries(board.rows)) if (state !== 'pass') blockers.push(`${id}-pending`);
  if (evidence.eonappServerProxyObserved !== false) blockers.push('no-eonapp-proxy-network-proof-pending');
  if (evidence.eonappServerMediaStorageObserved !== false) blockers.push('no-eonapp-media-storage-proof-pending');
  return freeze({ pass, verdict: pass ? 'certified-direct-user-owned-providers' : 'no-go-real-provider-evidence-pending', blockers: freeze(blockers), board, publicAvailabilityClaimAllowed: pass, directDeviceToProviderRequired: true });
}

export function getDirectByokPrivacyTruth() {
  return freeze({ providerDisclosureBeforeSubmit: true, promptsAndMediaDirectFromUserDevice: true, eonappServerLogsAllowed: false, eonappServerMediaStorageAllowed: false, localHistoryDeleteSupported: true, redactedHistoryExportSupported: true, desktopAndSupportedMobileRealOutputsRequired: true, sourceIntegrationAloneCanPass: false, currentlyCertified: false });
}
