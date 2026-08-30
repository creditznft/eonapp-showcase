/** W643 — real owner-device image proof and honest video capability closure. */
const freeze = (value) => Object.freeze(value);
export const W643_IMAGE_RECEIPT_SCHEMA = 'eonapp.creator-image-device-receipt.w643.v1';
export const W643_FALLBACK_RECEIPT_SCHEMA = 'eonapp.creator-four-gb-fallback-receipt.w643.v1';
export const W643_VIDEO_RECEIPT_SCHEMA = 'eonapp.creator-reference-video-receipt.w643.v1';
export const W643_CREATOR_DEVICE_CLOSURE_CONTRACT = freeze({
  schema: 'eonapp.creator-device-closure.w643.v1', wave: 'W643',
  ownerDevice: freeze({ class: 'rtx-3050-class-4gb', imageBaseline: 'sd15-class-512-batch1', localImageMustBeProven: true, localVideoSubmissionAllowed: false, videoFallbackMustBeProven: true }),
  referenceVideoDevice: freeze({ minimumUsableVramGb: 8, minimumSystemRamGb: 16, minimumFreeStorageGb: 35, realOutputMustBeProvenBeforePublicEnablement: true }),
  launchScope: freeze({ imageRequired: true, ownerFourGbFallbackRequired: true, referenceVideoMayRemainGated: true, truthfulClosedGateRequired: true, allDevicePromise: false }),
  evidence: freeze({ outputSha256Required: true, saveReopenRequired: true, projectContinuationRequired: true, cancellationRecoveryRequiredForEnabledVideo: true, secretsForbidden: true, absolutePathsForbidden: true, ownerReviewRequired: true })
});
export function validateW643CreatorDeviceClosureContract(value = W643_CREATOR_DEVICE_CLOSURE_CONTRACT) {
  const checks = freeze({ identity: value?.schema === 'eonapp.creator-device-closure.w643.v1' && value?.wave === 'W643', ownerImage: value?.ownerDevice?.localImageMustBeProven === true, ownerVideoBlocked: value?.ownerDevice?.localVideoSubmissionAllowed === false && value?.ownerDevice?.videoFallbackMustBeProven === true, reference: value?.referenceVideoDevice?.minimumUsableVramGb >= 8 && value?.referenceVideoDevice?.realOutputMustBeProvenBeforePublicEnablement === true, launchGate: value?.launchScope?.referenceVideoMayRemainGated === true && value?.launchScope?.truthfulClosedGateRequired === true && value?.launchScope?.allDevicePromise === false, evidence: value?.evidence?.outputSha256Required === true && value?.evidence?.saveReopenRequired === true && value?.evidence?.ownerReviewRequired === true });
  return freeze({ ok: Object.values(checks).every(Boolean), checks });
}
