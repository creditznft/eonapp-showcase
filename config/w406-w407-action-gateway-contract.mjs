/** W406/W407 source foundation contract. */
export const W406_W407_ACTION_GATEWAY_CONTRACT = Object.freeze({
  waves: Object.freeze(['W406', 'W407']),
  enabled: false,
  browserExternalExecution: false,
  durableReceiptCreated: false,
  requiredBinding: 'EON_ACTIONS_DB',
  requiredMigration: 'action-gateway/migrations/0001_eon_action_gateway.sql',
  userApprovalRequired: true,
  perActionConfirmationRequired: true,
  cancellationRequired: true,
  idempotencyRequired: true
});

export function validateW406W407ActionGatewayContract(contract = W406_W407_ACTION_GATEWAY_CONTRACT) {
  const errors = [];
  for (const [key, expected] of Object.entries({ enabled: false, browserExternalExecution: false, durableReceiptCreated: false, userApprovalRequired: true, perActionConfirmationRequired: true, cancellationRequired: true, idempotencyRequired: true })) if (contract?.[key] !== expected) errors.push(`Action Gateway boundary mismatch: ${key}.`);
  if (contract?.requiredBinding !== 'EON_ACTIONS_DB' || contract?.requiredMigration !== 'action-gateway/migrations/0001_eon_action_gateway.sql') errors.push('Action Gateway persistence contract is invalid.');
  return Object.freeze(errors);
}
