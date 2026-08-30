/** W443 contract: every commercial or provider activation remains a separate hold. */
export const W443_COMMERCIAL_DECISION_CONTRACT = Object.freeze({
  wave: 'W443', schema: 'eon.commercial.decision-gate.w443.v1', decisionRegistry: true,
  automaticCommercialActivation: false, rewardsLive: false, telegramLive: false, adsLive: false,
  paymentsLive: false, referralsLive: false, marketplaceLive: false, productionProof: false
});
export function validateW443CommercialDecisionContract() {
  const issues = []; const contract = W443_COMMERCIAL_DECISION_CONTRACT;
  if (contract.wave !== 'W443') issues.push('wave-mismatch');
  if (contract.decisionRegistry !== true) issues.push('decisionRegistry-required');
  for (const id of ['automaticCommercialActivation', 'rewardsLive', 'telegramLive', 'adsLive', 'paymentsLive', 'referralsLive', 'marketplaceLive', 'productionProof']) if (contract[id] !== false) issues.push(`${id}-must-remain-false`);
  return Object.freeze(issues);
}
