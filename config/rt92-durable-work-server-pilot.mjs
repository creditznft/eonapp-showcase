/** RT92 server durable-work proposal pilot. Deployment remains disabled. */
export const RT92_DURABLE_WORK_SERVER_PILOT = Object.freeze({
  schema: 'eonapp.rt92.durable-work-server-pilot.v1',
  rollout: 'disabled-until-dedicated-binding',
  productionAllowed: false,
  testingOnly: true,
  requiredBinding: 'EON_WORK_DB',
  requiredMigrations: Object.freeze([
    'durable-work/migrations/0001_eon_durable_work_proposals.sql',
    'durable-work/migrations/0002_eon_work_capacity_leases.sql'
  ]),
  storesRawPrompt: false,
  storesRawOutput: false,
  storesCredential: false,
  storesProviderToken: false,
  createsBackgroundJob: false,
  executesProvider: false,
  schedulesWork: false,
  externalEffect: false,
  browserCapacityAuthority: false,
  requiresSignedInAccount: true,
  requiresSameOriginMutation: true,
  requiredFutureRuntimeProofs: Object.freeze([
    'dedicated-eon-work-db-deployment-proof',
    'server-capacity-envelope-provisioning-proof',
    'server-capacity-admission-proof',
    'scheduler-or-workflow-runtime-proof',
    'concurrency-race-proof',
    'retry-idempotency-replay-proof',
    'cancellation-recovery-proof',
    'redacted-execution-receipt-proof',
    'cost-abuse-budget-proof',
    'production-release-signoff'
  ])
});

export function validateRt92DurableWorkServerPilot() {
  const c = RT92_DURABLE_WORK_SERVER_PILOT;
  const errors = [];
  if (c.productionAllowed || !c.testingOnly) errors.push('Durable work server pilot must remain testing-only.');
  if (c.requiredBinding !== 'EON_WORK_DB') errors.push('Dedicated EON_WORK_DB binding is required.');
  if (c.storesRawPrompt || c.storesRawOutput || c.storesCredential || c.storesProviderToken) errors.push('Raw/sensitive work data is forbidden in the proposal ledger.');
  if (c.createsBackgroundJob || c.executesProvider || c.schedulesWork || c.externalEffect) errors.push('Proposal pilot cannot claim runtime execution.');
  if (c.browserCapacityAuthority) errors.push('Browser must not grant hosted capacity.');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: c.schema });
}
