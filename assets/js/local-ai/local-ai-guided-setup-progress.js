/**
 * RT90 Local AI guided setup progress.
 *
 * This legacy per-runtime progress projection remains available under Advanced
 * diagnostics. The consumer setup action may now perform bounded approved
 * runtime checks/self-tests and select the first passing local model. It still
 * never performs a silent install/download or cloud fallback.
 */
export const LOCAL_AI_GUIDED_SETUP_SCHEMA = 'eon.local-ai.guided-setup.rt90.v1';

const clean = (value = '') => String(value || '').trim();

function sameRuntime(value = '', runtimeId = '') {
  return clean(value).toLowerCase() === clean(runtimeId).toLowerCase();
}

function matchingChatSelection(chatSettings = {}, runtimeId = '', proof = null) {
  if (!proof?.ok || !runtimeId) return false;
  return sameRuntime(chatSettings?.provider, runtimeId)
    && clean(chatSettings?.model) === clean(proof.model)
    && clean(chatSettings?.endpoint).replace(/\/v1$/i, '') === clean(proof.endpoint).replace(/\/v1$/i, '');
}

const baseFlags = Object.freeze({
  automaticProbe: false,
  automaticInstall: false,
  automaticDownload: false,
  automaticProviderSwitch: false
});

export function buildLocalAiGuidedSetupProgress(input = {}) {
  const guide = input.guide && typeof input.guide === 'object' ? input.guide : {};
  if (guide.mobile === true) {
    return Object.freeze({
      schema: LOCAL_AI_GUIDED_SETUP_SCHEMA,
      phase: 'browser-lite',
      runtimeId: 'browserlocal',
      title: 'Local Lite can run directly in this browser',
      detail: 'Use the main Local AI setup button. EON will ask before the one-time model download, then keep inference on this device.',
      action: 'consumer-setup',
      actionLabel: 'Set up Local Lite',
      complete: false,
      ...baseFlags
    });
  }

  const runtimeId = clean(input.runtimeId || guide.primaryRuntime?.eonRuntimeId || guide.primaryRuntime?.id);
  const runtimeLabel = clean(input.runtimeLabel || guide.primaryRuntime?.label || runtimeId || 'local runtime');
  const discovery = input.discovery && typeof input.discovery === 'object' ? input.discovery : null;
  const selectedModel = clean(input.selectedModel);
  const proof = input.proof && typeof input.proof === 'object' && sameRuntime(input.proof.runtimeId || input.proof.runtime, runtimeId) ? input.proof : null;
  const chatActive = matchingChatSelection(input.chatSettings || {}, runtimeId, proof);

  if (chatActive) {
    return Object.freeze({ schema: LOCAL_AI_GUIDED_SETUP_SCHEMA, phase: 'complete', runtimeId, title: `${runtimeLabel} is ready for EONBOT`, detail: `${proof.model} passed the device-local self-test and is the selected local Chat model.`, action: 'open-chat', actionLabel: 'Use EONBOT', complete: true, ...baseFlags });
  }
  if (proof?.ok) {
    return Object.freeze({ schema: LOCAL_AI_GUIDED_SETUP_SCHEMA, phase: 'select-chat', runtimeId, title: `${proof.model} passed the local self-test`, detail: 'You can select this proven local model for EONBOT. No provider fallback is added.', action: 'select-chat', actionLabel: 'Use this local model', complete: false, ...baseFlags });
  }
  if (selectedModel) {
    return Object.freeze({ schema: LOCAL_AI_GUIDED_SETUP_SCHEMA, phase: 'self-test', runtimeId, title: `Test ${selectedModel} on this device`, detail: 'The self-test sends only a neutral sentinel to this local runtime and records a browser-local proof.', action: 'self-test', actionLabel: 'Run local self-test', complete: false, ...baseFlags });
  }
  if (discovery?.ok && Array.isArray(discovery.models) && discovery.models.length) {
    return Object.freeze({ schema: LOCAL_AI_GUIDED_SETUP_SCHEMA, phase: 'choose-model', runtimeId, title: `${runtimeLabel} is reachable`, detail: 'Choose one installed local-only text model, or use the main one-click setup to let EON test a conservative fit automatically.', action: 'choose-model', actionLabel: 'Choose installed model', complete: false, ...baseFlags });
  }
  if (discovery?.ok && Array.isArray(discovery.models) && !discovery.models.length) {
    return Object.freeze({ schema: LOCAL_AI_GUIDED_SETUP_SCHEMA, phase: 'install-model', runtimeId, title: `${runtimeLabel} is running but no local text model is installed`, detail: 'Review the official model guide. EON does not silently download model weights.', action: 'open-model-guide', actionLabel: 'Open official model guide', complete: false, ...baseFlags });
  }
  if (discovery && discovery.ok === false) {
    const bridgeHelpful = input.bridgeChecked === true && input.bridgeAvailable === true && input.bridgePaired !== true;
    return Object.freeze({
      schema: LOCAL_AI_GUIDED_SETUP_SCHEMA,
      phase: bridgeHelpful ? 'pair-bridge' : 'start-runtime',
      runtimeId,
      title: bridgeHelpful ? 'EON Local Companion can recover this local connection' : `${runtimeLabel} is not ready yet`,
      detail: bridgeHelpful
        ? 'Connect the Companion once for this browser. It stays loopback-only and cannot silently route to cloud AI.'
        : `Open ${runtimeLabel} and make sure its local service is enabled. The main setup action will check it again without asking you for ports.`,
      action: bridgeHelpful ? 'focus-bridge' : 'check-runtime',
      actionLabel: bridgeHelpful ? 'Connect EON Local Companion' : 'Check again',
      complete: false,
      ...baseFlags
    });
  }
  return Object.freeze({ schema: LOCAL_AI_GUIDED_SETUP_SCHEMA, phase: 'check-runtime', runtimeId, title: `EON can check ${runtimeLabel} for you`, detail: 'Use the main setup action for automatic approved detection, or check this runtime manually from Advanced diagnostics.', action: 'check-runtime', actionLabel: 'Check this runtime', complete: false, ...baseFlags });
}

export function getLocalAiGuidedSetupTruth() {
  return Object.freeze({
    schema: LOCAL_AI_GUIDED_SETUP_SCHEMA,
    explicitConsumerSetupIntentRequired: true,
    boundedApprovedProbeAfterConsumerSetupIntent: true,
    boundedSelfTestAfterConsumerSetupIntent: true,
    automaticProviderSelectionAfterPassingSelfTest: true,
    automaticInstall: false,
    automaticDownload: false,
    automaticBridgePairing: false,
    cloudFallback: false,
    advancedManualControlsRemainExplicit: true
  });
}
