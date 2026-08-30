/** W438 contract: private deterministic districts require deliberate City-safe approval. */
export const W438_PROJECT_DISTRICT_CONTRACT = Object.freeze({
  wave: 'W438', schema: 'eon.city.project-district-manifest.w438.v1',
  explicitUserActionRequired: true, citySafeLabelApprovalRequired: true,
  deterministicPrivateRendering: true, remoteGeneration: false, publicRouteCreated: false,
  promptOrFileRead: false, secretRead: false, deviceVisualProof: false, productionProof: false
});
export function validateW438ProjectDistrictContract() {
  const issues = []; const contract = W438_PROJECT_DISTRICT_CONTRACT;
  if (contract.wave !== 'W438') issues.push('wave-mismatch');
  for (const id of ['explicitUserActionRequired', 'citySafeLabelApprovalRequired', 'deterministicPrivateRendering']) if (contract[id] !== true) issues.push(`${id}-required`);
  for (const id of ['remoteGeneration', 'publicRouteCreated', 'promptOrFileRead', 'secretRead', 'deviceVisualProof', 'productionProof']) if (contract[id] !== false) issues.push(`${id}-must-remain-false`);
  return Object.freeze(issues);
}
