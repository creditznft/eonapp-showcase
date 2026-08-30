/** W455.1 source contract — original EON Noir world-composition bridge. */
export const W455A_NOIR_WORLD_COMPOSITION_SCHEMA = 'eonapp.w455.1.noir-world-composition.v1';

export const W455A_NOIR_WORLD_COMPOSITION_STATUS = Object.freeze({
  sourceComplete: true,
  originalProcedural: true,
  remoteAssets: false,
  privateDataRead: false,
  taskStatusFabricated: false,
  passengerData: false,
  routeData: false,
  stationStatus: false,
  simulatedTraffic: false,
  finalBinaryArt: false,
  deviceVisualProof: false,
  finalVisualCertification: false,
  sourceOnly: true
});

export function validateW455ANoirWorldCompositionContract(summary = {}, plan = {}) {
  const errors = [];
  for (const key of [
    'remoteAssets', 'privateDataRead', 'taskStatusFabricated', 'passengerData',
    'routeData', 'stationStatus', 'simulatedTraffic', 'finalBinaryArt',
    'deviceVisualProof', 'finalVisualCertification'
  ]) {
    if (W455A_NOIR_WORLD_COMPOSITION_STATUS[key] !== false) errors.push(`${key} must remain false in the source-only world-composition pass.`);
  }
  if (W455A_NOIR_WORLD_COMPOSITION_STATUS.sourceComplete !== true || W455A_NOIR_WORLD_COMPOSITION_STATUS.originalProcedural !== true) {
    errors.push('W455.1 must remain original procedural source work.');
  }
  if (summary && Object.keys(summary).length && (summary.remoteAssets !== false || summary.finalBinaryArt !== false || summary.finalVisualCertification !== false)) {
    errors.push('Architecture summary must not claim remote or final certified art.');
  }
  if (plan && Object.keys(plan).length) {
    if (!Array.isArray(plan.foreground) || !Array.isArray(plan.midground) || !Array.isArray(plan.background)) errors.push('World composition must retain foreground, mid-ground and background layers.');
    if (plan?.ambientTransit?.decorativeOnly !== true || plan?.ambientTransit?.passengerData !== false || plan?.ambientTransit?.routeData !== false || plan?.ambientTransit?.stationStatus !== false || plan?.ambientTransit?.simulatedTraffic !== false) {
      errors.push('Ambient transit must remain decorative only, with no passenger, route, station or simulation claim.');
    }
  }
  return Object.freeze(errors);
}
