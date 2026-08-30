/** W286-B2 CEO contract: City visualizes real local collaboration without becoming a second agent runtime. */
export const W286_B2_LIVE_WORK_COMMAND_SCHEMA = 'eonapp.w286-b2.live-work-command-contract.v1';

export const W286_B2_LIVE_WORK_COMMAND_CONTRACT = Object.freeze({
  schema: W286_B2_LIVE_WORK_COMMAND_SCHEMA,
  status: 'SOURCE_READY_EXTERNAL_EVIDENCE_PENDING',
  decision: 'City is a visual command layer: live local lifecycle status is playful and understandable; Chat and native app routes remain the control and results surfaces.',
  renderers: Object.freeze(['city-lite', 'visual-tour-threejs', 'city-play-babylon']),
  collaboration: Object.freeze({ maxVisibleAgents: 4, huddleDerivedOnly: true, transcript: false, outputPreview: false, directAgentConversation: false }),
  commandLoop: Object.freeze({ nativeChatControl: true, routeReviewFirst: true, automaticRouteOpening: false, cityTaskInitiation: false, cityApproval: false }),
  hardBoundaries: Object.freeze({
    noFakeWork: true,
    noPromptOrResponse: true,
    noCredentialsOrModelNames: true,
    noRemoteTransport: true,
    noNewToolOrProviderCall: true,
    noWalletChainValueRewardReferral: true,
    noTelemetry: true,
    externalEffect: false
  }),
  evidenceStillRequired: Object.freeze([
    'real mission and agent-executor lifecycle walkthrough with redacted receipts',
    'desktop and device visual review of huddle visibility and City/native-control loop',
    'keyboard, touch, reduced-motion and screen-reader review',
    'frame-time and memory observations across City Lite, Visual Tour and City Play',
    'independent privacy and security review before public flagship claims'
  ])
});

export function validateW286B2LiveWorkCommandContract(candidate = W286_B2_LIVE_WORK_COMMAND_CONTRACT) {
  const errors = [];
  if (candidate?.schema !== W286_B2_LIVE_WORK_COMMAND_SCHEMA) errors.push('W286-B2 contract schema drifted.');
  if (candidate?.status !== 'SOURCE_READY_EXTERNAL_EVIDENCE_PENDING') errors.push('W286-B2 must remain source-ready only.');
  if (candidate?.collaboration?.maxVisibleAgents !== 4 || candidate?.collaboration?.huddleDerivedOnly !== true) errors.push('W286-B2 huddle must stay derived-only and capped at four actors.');
  if (candidate?.collaboration?.transcript || candidate?.collaboration?.outputPreview || candidate?.collaboration?.directAgentConversation) errors.push('W286-B2 must not expose transcripts, outputs, or fabricated agent conversation.');
  if (!candidate?.commandLoop?.nativeChatControl || !candidate?.commandLoop?.routeReviewFirst || candidate?.commandLoop?.automaticRouteOpening || candidate?.commandLoop?.cityTaskInitiation || candidate?.commandLoop?.cityApproval) errors.push('W286-B2 command loop must retain native control, route review, and no City initiation/approval.');
  for (const [key, expected] of Object.entries(candidate?.hardBoundaries || {})) {
    if (key === 'externalEffect') { if (expected !== false) errors.push('W286-B2 externalEffect must remain false.'); }
    else if (expected !== true) errors.push(`W286-B2 boundary ${key} must remain true.`);
  }
  return Object.freeze({ ok: errors.length === 0, errors });
}
