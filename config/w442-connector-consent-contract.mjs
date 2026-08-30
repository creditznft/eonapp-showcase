/** W442 contract: connector consent is local, expiring and revocable—not OAuth. */
export const W442_CONNECTOR_CONSENT_CONTRACT = Object.freeze({
  wave: 'W442', schema: 'eon.connectors.consent.w442.v1', localConsentDraft: true,
  expiryAndRevocation: true, explicitPurposeApprovalRequired: true,
  oauthStarted: false, tokenStored: false, remoteAccessGranted: false, externalPublishCreated: false, productionProof: false
});
export function validateW442ConnectorConsentContract() {
  const issues = []; const contract = W442_CONNECTOR_CONSENT_CONTRACT;
  if (contract.wave !== 'W442') issues.push('wave-mismatch');
  for (const id of ['localConsentDraft', 'expiryAndRevocation', 'explicitPurposeApprovalRequired']) if (contract[id] !== true) issues.push(`${id}-required`);
  for (const id of ['oauthStarted', 'tokenStored', 'remoteAccessGranted', 'externalPublishCreated', 'productionProof']) if (contract[id] !== false) issues.push(`${id}-must-remain-false`);
  return Object.freeze(issues);
}
