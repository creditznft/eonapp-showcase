/** W441 contract: review/approval records are local and never execute. */
export const W441_ACTION_GATEWAY_REVIEW_CONTRACT = Object.freeze({
  wave: 'W441', schema: 'eon.action-gateway.review-pilot.w441.v1', localReviewProposal: true,
  explicitScopeApprovalRequired: true, explicitFinalApprovalRequired: true, localApprovalReceipt: true,
  externalExecution: false, credentialRead: false, networkRequestCreated: false, backgroundJobCreated: false, productionProof: false
});
export function validateW441ActionGatewayReviewContract() {
  const issues = []; const contract = W441_ACTION_GATEWAY_REVIEW_CONTRACT;
  if (contract.wave !== 'W441') issues.push('wave-mismatch');
  for (const id of ['localReviewProposal', 'explicitScopeApprovalRequired', 'explicitFinalApprovalRequired', 'localApprovalReceipt']) if (contract[id] !== true) issues.push(`${id}-required`);
  for (const id of ['externalExecution', 'credentialRead', 'networkRequestCreated', 'backgroundJobCreated', 'productionProof']) if (contract[id] !== false) issues.push(`${id}-must-remain-false`);
  return Object.freeze(issues);
}
