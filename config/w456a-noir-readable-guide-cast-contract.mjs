/** W456.1 source contract — original readable procedural City guide cast. */
export const W456A_NOIR_GUIDE_CAST_SCHEMA = 'eonapp.w456.1.noir-readable-guide-cast.v1';
export const W456A_NOIR_GUIDE_CAST_STATUS = Object.freeze({
  sourceComplete: true,
  originalProcedural: true,
  riggedBinaryCharacters: false,
  finalNpcArtCertified: false,
  remoteAssets: false,
  remoteTelemetry: false,
  privateDataRead: false,
  taskStatusFabricated: false,
  sourceOnly: true
});
export function validateW456ANoirGuideCastContract(summary = {}) {
  const errors = [];
  for (const key of ['riggedBinaryCharacters', 'finalNpcArtCertified', 'remoteAssets', 'remoteTelemetry', 'privateDataRead', 'taskStatusFabricated']) {
    if (W456A_NOIR_GUIDE_CAST_STATUS[key] !== false) errors.push(`${key} must remain false in the source-only guide-cast pass.`);
  }
  if (W456A_NOIR_GUIDE_CAST_STATUS.sourceComplete !== true || W456A_NOIR_GUIDE_CAST_STATUS.originalProcedural !== true) errors.push('W456.1 must remain an original procedural source implementation.');
  if (summary && Object.keys(summary).length && (summary.riggedAssets !== false || summary.finalNpcCertification !== false)) errors.push('NPC summary must not claim final rigged/certified art.');
  return Object.freeze(errors);
}
