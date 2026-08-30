export const W482_PRODUCT_POLISH_CODEX_HANDOFF_CONTRACT = Object.freeze({
  schema: 'eon.product.polish-codex-handoff.w482.v1',
  wave: 'W482',
  phase: 'final-product-polish-and-codex-handoff',
  polishSurfaces: Object.freeze([
    'guest-first-home',
    'eoncity-command-deck',
    'eonbot-chat',
    'creator-ready-to-post',
    'local-ai-setup',
    'vault-persistence',
    'market-trade-research',
    'support-trust-legal',
    'mobile-navigation-accessibility',
    'service-worker-update-recovery'
  ]),
  finalLocalCommands: Object.freeze([
    'npm run verify:w4795-codex-ready-source'
  ]),
  codexMustDo: Object.freeze([
    'fetch-current-main-and-record-sha',
    'apply-this-patch-without-overwriting-main',
    'run-npm-ci-and-final-local-commands',
    'deploy-after-green-source-validation-only',
    'capture-live-eonapp-ch-browser-evidence',
    'capture-physical-android-iphone-tablet-evidence',
    'return-evidence-zip-and-pass-fixrequired-status',
    'wait-for-owner-go-before-activation'
  ]),
  codexMustNotDo: Object.freeze([
    'change-product-decisions',
    'weaken-tests-or-thresholds',
    'suppress-console-or-webgl-warnings',
    'activate-dodo-checkout',
    'activate-direct-social-oauth',
    'activate-local-image-video-generation',
    'enable-automatic-posting',
    'commit-secrets-node_modules-dist-or-caches'
  ]),
  truth: Object.freeze({
    handoffReadyWhenLocalVerifyGreen: true,
    sourceBundleIsDeployment: false,
    sourceBundleIsProductionCertification: false,
    sourceBundleIsOwnerGo: false,
    remainingWorkBelongsToCodexEvidence: true
  })
});

export function validateW482ProductPolishCodexHandoffContract(contract = W482_PRODUCT_POLISH_CODEX_HANDOFF_CONTRACT) {
  const errors = [];
  const ensure = (value, message) => { if (!value) errors.push(message); };
  ensure(contract.schema === 'eon.product.polish-codex-handoff.w482.v1', 'schema must stay W482 handoff v1');
  ensure(contract.polishSurfaces.includes('guest-first-home') && contract.polishSurfaces.includes('eoncity-command-deck') && contract.polishSurfaces.includes('mobile-navigation-accessibility'), 'core product polish surfaces must remain listed');
  ensure(contract.polishSurfaces.includes('creator-ready-to-post') && contract.polishSurfaces.includes('local-ai-setup'), 'creator/social/local setup surfaces must remain listed');
  ensure(contract.finalLocalCommands.includes('npm run verify:w4795-codex-ready-source'), 'final local verify command must remain canonical');
  ensure(contract.codexMustDo.includes('fetch-current-main-and-record-sha') && contract.codexMustDo.includes('capture-physical-android-iphone-tablet-evidence'), 'Codex current-main and physical device duties must remain explicit');
  ensure(contract.codexMustNotDo.includes('activate-dodo-checkout') && contract.codexMustNotDo.includes('activate-direct-social-oauth') && contract.codexMustNotDo.includes('activate-local-image-video-generation'), 'activation prohibitions must remain explicit');
  ensure(contract.truth.handoffReadyWhenLocalVerifyGreen === true, 'handoff readiness depends on local verify green');
  ensure(contract.truth.sourceBundleIsDeployment === false && contract.truth.sourceBundleIsProductionCertification === false && contract.truth.sourceBundleIsOwnerGo === false, 'source bundle must not be deployment/certification/owner GO');
  return errors;
}
