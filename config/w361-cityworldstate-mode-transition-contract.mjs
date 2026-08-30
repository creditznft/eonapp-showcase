/** W361 — one local navigation truth across City modes and native surfaces. */
export const W361_CITYWORLDSTATE_MODE_TRANSITION_CONTRACT = Object.freeze({
  wave: 'W361',
  schema: 'eonapp.w361.cityworldstate-mode-transition.v1',
  architecture: Object.freeze({
    stateOwner: 'CityWorldState',
    transport: 'ordinary user navigation plus local transition receipt',
    canonicalModes: Object.freeze([
      'portal', 'overview', 'command-space', 'immersive-work', 'chat', 'workspace',
      'automations', 'apps', 'local-ai', 'realm-studio', 'projects', 'library'
    ]),
    privacy: Object.freeze({
      localOnly: true,
      allowed: Object.freeze(['finite mode identifier', 'safe landmark identifier', 'timestamp', 'local navigation receipt']),
      forbidden: Object.freeze(['prompts', 'AI output', 'credentials', 'private files', 'payment data', 'wallet data', 'background execution state'])
    }),
    execution: Object.freeze({
      startsProvider: false,
      startsAutomation: false,
      startsFullscreen: false,
      startsBackgroundWork: false
    })
  }),
  productionTruth: Object.freeze({
    sourceGateIsNotProductionProof: true,
    requiredProbeRoutes: Object.freeze([
      '/chat', '/workspace', '/projects', '/library', '/automations', '/apps', '/local-ai', '/realm-studio',
      '/eoncity', '/eoncity/lite', '/eoncity/tour', '/eoncity/3d', '/eoncity/play'
    ])
  })
});

export function validateW361CityWorldStateModeTransitionContract() {
  const errors = [];
  const modes = W361_CITYWORLDSTATE_MODE_TRANSITION_CONTRACT.architecture.canonicalModes;
  if (new Set(modes).size !== modes.length) errors.push('Canonical City mode identifiers must be unique.');
  if (!modes.includes('portal') || !modes.includes('automations') || !modes.includes('apps') || !modes.includes('workspace')) errors.push('Portal, Apps, Automations and Workspace must be in the shared City mode contract.');
  if (!W361_CITYWORLDSTATE_MODE_TRANSITION_CONTRACT.architecture.privacy.localOnly) errors.push('W361 navigation state must stay local-only.');
  if (W361_CITYWORLDSTATE_MODE_TRANSITION_CONTRACT.architecture.execution.startsProvider || W361_CITYWORLDSTATE_MODE_TRANSITION_CONTRACT.architecture.execution.startsAutomation) errors.push('Mode transition must not execute provider or automation work.');
  return errors;
}
