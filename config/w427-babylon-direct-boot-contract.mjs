/** W427 — canonical Babylon direct-boot and same-route recovery contract. */
export const W427_BABYLON_DIRECT_BOOT_CONTRACT = Object.freeze({
  wave: 'W427',
  schema: 'eonapp.w427.babylon-direct-boot.v1',
  route: '/eoncity',
  renderer: 'Babylon WebGL',
  publicFallbackRoute: null,
  firstFrameTimeoutMs: 6500,
  defaultProfile: 'balanced',
  safeProfile: 'lite',
  diagnostics: Object.freeze({
    localOnly: true,
    remoteTransport: false,
    rawErrorMessages: false,
    markers: Object.freeze([
      'CITY_BOOT_STARTED', 'CITY_WEBGL_UNAVAILABLE', 'CITY_IMPORT_FAILED',
      'CITY_ENGINE_CREATE_FAILED', 'CITY_ASSET_LOAD_FAILED', 'CITY_CANVAS_MOUNT_FAILED',
      'CITY_FIRST_FRAME_TIMEOUT', 'CITY_FIRST_FRAME_READY', 'CITY_CONTEXT_LOST'
    ])
  }),
  recovery: Object.freeze({ tryAgain: true, safeMode: true, supportDetails: true, returnToChat: true })
});

export function validateW427BabylonDirectBootContract(contract = W427_BABYLON_DIRECT_BOOT_CONTRACT) {
  const errors = [];
  if (contract.route !== '/eoncity' || contract.renderer !== 'Babylon WebGL') errors.push('W427 must keep /eoncity as the sole direct Babylon route.');
  if (contract.publicFallbackRoute !== null) errors.push('W427 recovery cannot move to a second public City route.');
  if (!Number.isFinite(contract.firstFrameTimeoutMs) || contract.firstFrameTimeoutMs < 2500 || contract.firstFrameTimeoutMs > 15000) errors.push('W427 requires a bounded first-frame timeout.');
  if (contract.defaultProfile !== 'balanced' || contract.safeProfile !== 'lite') errors.push('W427 must define balanced default and lite safe profiles.');
  if (contract.diagnostics?.localOnly !== true || contract.diagnostics?.remoteTransport || contract.diagnostics?.rawErrorMessages) errors.push('W427 diagnostics must remain local, non-transporting and redacted.');
  if (!Array.isArray(contract.diagnostics?.markers) || contract.diagnostics.markers.length < 9) errors.push('W427 diagnostics must cover the complete safe marker set.');
  if (!Object.values(contract.recovery || {}).every(Boolean)) errors.push('W427 recovery controls must be explicit user choices.');
  return errors;
}
