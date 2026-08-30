/** W439 contract: City signals map only to bounded W435 local receipts. */
export const W439_AGENT_SIGNAL_CONTRACT = Object.freeze({
  wave: 'W439', schema: 'eon.city.agent-signal.w439.v1', receiptBackedOnly: true,
  localOnly: true, promptVisible: false, outputVisible: false, credentialVisible: false,
  providerExecutionStarted: false, externalActionStarted: false, npcAutonomyClaimed: false, productionProof: false
});
export function validateW439AgentSignalContract() {
  const issues = []; const contract = W439_AGENT_SIGNAL_CONTRACT;
  if (contract.wave !== 'W439') issues.push('wave-mismatch');
  for (const id of ['receiptBackedOnly', 'localOnly']) if (contract[id] !== true) issues.push(`${id}-required`);
  for (const id of ['promptVisible', 'outputVisible', 'credentialVisible', 'providerExecutionStarted', 'externalActionStarted', 'npcAutonomyClaimed', 'productionProof']) if (contract[id] !== false) issues.push(`${id}-must-remain-false`);
  return Object.freeze(issues);
}
