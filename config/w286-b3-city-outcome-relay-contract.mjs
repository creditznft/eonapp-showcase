/** W286-B3 CEO contract: City may relay status-only outcomes, never work content. */
export const W286_B3_CITY_OUTCOME_RELAY_SCHEMA = 'eonapp.w286-b3.city-outcome-relay-contract.v1';

export const W286_B3_CITY_OUTCOME_RELAY_CONTRACT = Object.freeze({
  schema: W286_B3_CITY_OUTCOME_RELAY_SCHEMA,
  status: 'SOURCE_READY_EXTERNAL_EVIDENCE_PENDING',
  decision: 'EON City may show a finite local result-ready, review-needed, or attention-needed beacon; actual work results remain only in Chat or the originating native work surface.',
  renderers: Object.freeze(['city-lite', 'visual-tour-threejs', 'city-play-babylon']),
  outcome: Object.freeze({
    modes: Object.freeze(['review', 'result-ready', 'attention']),
    statusOnly: true,
    rawOutput: false,
    prompt: false,
    transcript: false,
    providerOrModelIdentity: false,
    workReference: false,
    genericNativeReviewRoute: '/chat?new=1'
  }),
  commandLoop: Object.freeze({
    nativeChatControl: true,
    userTapNavigationOnly: true,
    automaticRouteOpening: false,
    cityTaskInitiation: false,
    cityApproval: false,
    cityResultStorage: false
  }),
  hardBoundaries: Object.freeze({
    noFakeResult: true,
    noPromptOrResponse: true,
    noCredentialsOrModelNames: true,
    noRemoteTransport: true,
    noNewToolOrProviderCall: true,
    noWalletChainValueRewardReferral: true,
    noTelemetry: true,
    externalEffect: false
  }),
  evidenceStillRequired: Object.freeze([
    'real completed, failed and review-needed lifecycle walkthrough with redacted native-result evidence',
    'desktop/mobile readability review of the outcome beacon and Review in Chat action',
    'keyboard, touch, reduced-motion and screen-reader review',
    'frame-time and memory observations with an outcome beacon present',
    'independent privacy and security review before public flagship claims'
  ])
});

export function validateW286B3CityOutcomeRelayContract(candidate = W286_B3_CITY_OUTCOME_RELAY_CONTRACT) {
  const errors = [];
  if (candidate?.schema !== W286_B3_CITY_OUTCOME_RELAY_SCHEMA) errors.push('W286-B3 contract schema drifted.');
  if (candidate?.status !== 'SOURCE_READY_EXTERNAL_EVIDENCE_PENDING') errors.push('W286-B3 must remain source-ready only.');
  const modes = candidate?.outcome?.modes || [];
  if (!['review', 'result-ready', 'attention'].every((mode) => modes.includes(mode))) errors.push('W286-B3 outcome vocabulary must remain finite.');
  for (const key of ['statusOnly']) if (candidate?.outcome?.[key] !== true) errors.push(`W286-B3 outcome ${key} must remain true.`);
  for (const key of ['rawOutput', 'prompt', 'transcript', 'providerOrModelIdentity', 'workReference']) if (candidate?.outcome?.[key] !== false) errors.push(`W286-B3 outcome ${key} must remain false.`);
  if (candidate?.outcome?.genericNativeReviewRoute !== '/chat?new=1') errors.push('W286-B3 review route must remain generic native Chat, not a leaked work reference.');
  if (!candidate?.commandLoop?.nativeChatControl || !candidate?.commandLoop?.userTapNavigationOnly || candidate?.commandLoop?.automaticRouteOpening || candidate?.commandLoop?.cityTaskInitiation || candidate?.commandLoop?.cityApproval || candidate?.commandLoop?.cityResultStorage) errors.push('W286-B3 must keep native user-tap control and prohibit City initiation, approval, storage, and auto navigation.');
  for (const [key, expected] of Object.entries(candidate?.hardBoundaries || {})) {
    if (key === 'externalEffect') { if (expected !== false) errors.push('W286-B3 externalEffect must remain false.'); }
    else if (expected !== true) errors.push(`W286-B3 boundary ${key} must remain true.`);
  }
  return Object.freeze({ ok: errors.length === 0, errors });
}
