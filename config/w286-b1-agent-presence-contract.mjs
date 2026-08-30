/** W286-B1 CEO contract: truthful, bounded City visualization of actual local work lifecycle. */
export const W286_B1_AGENT_PRESENCE_SCHEMA = 'eonapp.w286-b1.city-agent-presence-contract.v1';

export const W286_B1_AGENT_PRESENCE_CONTRACT = Object.freeze({
  schema: W286_B1_AGENT_PRESENCE_SCHEMA,
  status: 'SOURCE_READY_EXTERNAL_EVIDENCE_PENDING',
  decision: 'EON City is an optional visual workspace layer. Chat and native app routes remain the fastest control surface.',
  sourcesOfTruth: Object.freeze(['mission-engine', 'agent-executor', 'operator-activity']),
  renderers: Object.freeze(['city-lite', 'visual-tour-threejs', 'city-play-babylon']),
  visibility: Object.freeze({ maxVisibleAgents: 4, defaultEnabled: true, defaultDetail: 'summary', providerDetail: 'category-only' }),
  hardBoundaries: Object.freeze({
    noFakeWork: true,
    noPromptOrResponse: true,
    noCredentialsOrModelNames: true,
    noRemoteTransport: true,
    noNewToolOrProviderCall: true,
    noAutomaticRouteOpening: true,
    noWalletChainValueRewardReferral: true,
    noTelemetry: true,
    explicitUserPreference: true,
    externalEffect: false
  }),
  cityPlay: Object.freeze({ purpose: 'showcase and understandable route-review workspace', combat: false, economy: false, multiplayer: false, autonomousAgentRuntime: false }),
  evidenceStillRequired: Object.freeze([
    'desktop and mobile visual walkthrough using genuine task lifecycle events',
    'keyboard, touch, reduced-motion and screen-reader checks',
    'frame-time and memory evidence on low, medium and high device tiers',
    'provider/local-runtime task provenance review with redacted evidence',
    'independent privacy and security review before beta claims'
  ])
});

export function validateW286B1AgentPresenceContract(candidate = W286_B1_AGENT_PRESENCE_CONTRACT) {
  const errors = [];
  if (candidate?.schema !== W286_B1_AGENT_PRESENCE_SCHEMA) errors.push('Agent Presence contract schema drifted.');
  if (candidate?.status !== 'SOURCE_READY_EXTERNAL_EVIDENCE_PENDING') errors.push('Agent Presence must remain source-ready only until external evidence exists.');
  if (candidate?.visibility?.maxVisibleAgents !== 4) errors.push('Agent Presence must cap visible actors at four.');
  if (candidate?.visibility?.defaultDetail !== 'summary' || candidate?.visibility?.providerDetail !== 'category-only') errors.push('Agent Presence details must remain summary/category-only.');
  for (const [key, expected] of Object.entries(candidate?.hardBoundaries || {})) {
    if (key === 'externalEffect') { if (expected !== false) errors.push('Agent Presence externalEffect must remain false.'); }
    else if (expected !== true) errors.push(`Agent Presence boundary ${key} must remain true.`);
  }
  if (candidate?.cityPlay?.combat || candidate?.cityPlay?.economy || candidate?.cityPlay?.multiplayer || candidate?.cityPlay?.autonomousAgentRuntime) errors.push('City Play must not become a combat/economy/multiplayer/autonomous-agent runtime in W286-B1.');
  return Object.freeze({ ok: errors.length === 0, errors });
}
