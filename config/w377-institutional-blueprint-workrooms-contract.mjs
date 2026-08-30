/** W377 contract: institutional Blueprint packs and explicit local workroom handoff. */

export const W377_INSTITUTIONAL_BLUEPRINT_WORKROOMS_CONTRACT = Object.freeze({
  wave: 'W377',
  title: 'Institutional Blueprint collection and local workroom handoffs',
  appRoute: '/apps',
  automationRoute: '/automations',
  blueprintCount: 32,
  historicalW376BlueprintCount: 20,
  officialLocalWorkflowCount: 16,
  historicalW376WorkflowCount: 10,
  blueprintPackVersions: Object.freeze(['1.0.0', '1.1.0']),
  requiredWorkroomRecords: Object.freeze(['Project', 'Library template', 'approval-first workflow']),
  boundaries: Object.freeze({
    localFirst: true,
    providerCallActive: false,
    externalExecutionActive: false,
    checkoutActive: false,
    entitlementActive: false,
    backgroundWorkActive: false
  }),
  requiredBehavior: Object.freeze([
    'All official Blueprints carry versioned inputs, deliverables, review checkpoints, privacy boundary and change notes.',
    'A workroom is created only after an explicit foreground user action from a selected Blueprint.',
    'A workroom writes ordinary local Project, Library and Automation draft records using the existing stores.',
    'The created workflow uses only a registered local-runner template with an approval checkpoint.',
    'No account connection, provider request, publishing, checkout, subscription, entitlement or background run follows the handoff.'
  ])
});

export function validateW377InstitutionalBlueprintWorkroomsContract() {
  const errors = [];
  const c = W377_INSTITUTIONAL_BLUEPRINT_WORKROOMS_CONTRACT;
  if (c.blueprintCount !== 32 || c.historicalW376BlueprintCount !== 20) errors.push('W377 Blueprint count contract drifted.');
  if (c.officialLocalWorkflowCount !== 16 || c.historicalW376WorkflowCount !== 10) errors.push('W377 workflow count contract drifted.');
  if (JSON.stringify(c.blueprintPackVersions) !== JSON.stringify(['1.0.0', '1.1.0'])) errors.push('W377 pack version contract drifted.');
  for (const [key, value] of Object.entries(c.boundaries)) if (value !== (key === 'localFirst')) errors.push(`W377 boundary ${key} is invalid.`);
  return Object.freeze(errors);
}
