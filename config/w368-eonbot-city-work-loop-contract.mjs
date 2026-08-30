/** W368 — EONBOT City Work Loop contract. */
export const W368_EONBOT_CITY_WORK_LOOP_CONTRACT = Object.freeze({
  wave: 'W368',
  schema: 'eonapp.w368.eonbot-city-work-loop-contract.v1',
  surfaces: Object.freeze(['/eoncity/play', '/eoncity/tour', '/chat', '/workspace', '/projects', '/automations']),
  truthRules: Object.freeze({
    localOnly: true,
    foregroundOnly: true,
    providerRequestFromCity: false,
    externalExecution: false,
    automaticNavigation: false,
    automaticApproval: false,
    typedCityTextStored: false,
    typedCityTextForwarded: false,
    privateDataInRenderer: false,
    reviewBeforeNativeHandoff: true
  }),
  returnReceipt: Object.freeze({ localOnly: true, storesResult: false, storesPrompt: false, storesOutput: false })
});

export function validateW368EonbotCityWorkLoopContract() {
  const errors = [];
  const rules = W368_EONBOT_CITY_WORK_LOOP_CONTRACT.truthRules;
  if (!rules.localOnly || !rules.foregroundOnly || rules.providerRequestFromCity || rules.externalExecution) errors.push('City work loop must not call providers or execute work.');
  if (rules.automaticNavigation || rules.automaticApproval || !rules.reviewBeforeNativeHandoff) errors.push('City work loop must remain visibly review-first.');
  if (rules.typedCityTextStored || rules.typedCityTextForwarded || rules.privateDataInRenderer) errors.push('City work loop must keep typed/private text out of persistence and renderers.');
  return errors;
}
