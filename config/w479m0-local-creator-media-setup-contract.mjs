export const W479M0_LOCAL_CREATOR_MEDIA_SETUP_CONTRACT = Object.freeze({
  schema: 'eon.creator.local-media-setup.w479m0.v1',
  wave: 'W479-M0',
  phase: 'device-guided-local-creator-media-setup',
  allowedStates: Object.freeze(['guide-only', 'candidate-local-runtime', 'advanced-local-runtime', 'cloud-or-provider-preferred']),
  supportedWorkloads: Object.freeze(['image', 'image-edit', 'image-to-video', 'full-video']),
  firstRuntimeFamilies: Object.freeze(['ComfyUI', 'LM Studio', 'Ollama']),
  truthBoundary: Object.freeze({
    browserInstallsRuntime: false,
    browserDownloadsModels: false,
    silentLanDiscovery: false,
    providerFallbackHidden: false,
    adapterConnectionActive: false,
    generationActive: false,
    rawMediaUploadActive: false,
    readyToPostOnlyAfterSavedOutput: true
  }),
  requiredSetupSteps: Object.freeze([
    'device-fit-estimate',
    'official-runtime-link',
    'storage-and-heat-warning',
    'user-installed-runtime-confirmation',
    'local-self-test-required',
    'adapter-proof-before-generation',
    'save-output-before-ready-to-post'
  ]),
  bannedClaims: Object.freeze([
    'one-click browser install',
    'all devices can run local video',
    'local image/video ready',
    'connected runtime without scan proof',
    'automatic upload or post'
  ])
});

export function validateW479M0LocalCreatorMediaSetupContract(contract = W479M0_LOCAL_CREATOR_MEDIA_SETUP_CONTRACT) {
  const errors = [];
  const ensure = (value, message) => { if (!value) errors.push(message); };
  ensure(contract.schema === 'eon.creator.local-media-setup.w479m0.v1', 'schema must stay W479-M0 v1');
  ensure(contract.supportedWorkloads.includes('image') && contract.supportedWorkloads.includes('image-to-video') && contract.supportedWorkloads.includes('full-video'), 'image, image-to-video and full-video workloads must stay represented');
  ensure(contract.firstRuntimeFamilies.includes('ComfyUI'), 'ComfyUI-style creator runtime family must stay represented for image/video guidance');
  ensure(contract.truthBoundary.browserInstallsRuntime === false, 'browser must not install runtimes');
  ensure(contract.truthBoundary.browserDownloadsModels === false, 'browser must not download models');
  ensure(contract.truthBoundary.silentLanDiscovery === false, 'silent LAN discovery must remain blocked');
  ensure(contract.truthBoundary.adapterConnectionActive === false, 'M0 cannot claim an active adapter connection');
  ensure(contract.truthBoundary.generationActive === false, 'M0 cannot claim generation is active');
  ensure(contract.truthBoundary.rawMediaUploadActive === false, 'M0 cannot upload raw media');
  ensure(contract.truthBoundary.readyToPostOnlyAfterSavedOutput === true, 'Ready-to-Post bridge must require a saved output first');
  ensure(contract.requiredSetupSteps.includes('local-self-test-required'), 'local self-test must be required');
  ensure(contract.bannedClaims.some((claim) => /all devices/i.test(claim)), 'all-device local video claim must be banned');
  return errors;
}
