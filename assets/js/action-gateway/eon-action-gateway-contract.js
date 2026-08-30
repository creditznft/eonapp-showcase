/**
 * W406/W407 — server action gateway contract.
 *
 * The browser may explain a proposal, but a durable external effect requires a
 * future server-issued, user-approved action record. This source foundation is
 * deliberately disabled until the action database, audit policy and connector
 * proof are approved.
 */
export const EON_ACTION_GATEWAY_SCHEMA = 'eonapp.action-gateway.v1';
export const EON_ACTION_GATEWAY_ROLLOUT = 'disabled';

const freeze = (value) => Object.freeze(value);

export const EON_ACTION_GATEWAY_TYPES = freeze([
  freeze({ id: 'connector-post', label: 'Publish approved creator post', requiresOfficialConnector: true }),
  freeze({ id: 'github-repository-create', label: 'Create a user-approved GitHub repository', requiresOfficialConnector: true }),
  freeze({ id: 'cloudflare-project-deploy', label: 'Deploy a user-approved Forge project', requiresOfficialConnector: true })
]);

export function getEonActionGatewayTruth() {
  return freeze({
    schema: EON_ACTION_GATEWAY_SCHEMA,
    rollout: EON_ACTION_GATEWAY_ROLLOUT,
    enabled: false,
    browserCanExecuteExternalAction: false,
    serverActionCreated: false,
    durableReceiptCreated: false,
    externalEffectCreated: false,
    storesProviderTokens: false,
    needsDedicatedActionDatabase: true,
    requiredBinding: 'EON_ACTIONS_DB',
    userApprovalRequired: true,
    nonceRequired: true,
    expiryRequired: true,
    idempotencyRequired: true,
    cancellationRequired: true,
    auditReceiptRequired: true,
    activationPrerequisites: freeze([
      'identity-session-proof',
      'action-database-migration-proof',
      'provider-specific-oauth-proof',
      'per-action-confirmation-proof',
      'redacted-durable-receipt-proof',
      'human-release-signoff'
    ])
  });
}

export function findEonActionGatewayType(actionType = '') {
  const id = String(actionType || '').trim().toLowerCase();
  const found = EON_ACTION_GATEWAY_TYPES.find((candidate) => candidate.id === id);
  return found ? freeze({ ...found }) : null;
}

export function prepareDisabledActionGatewayProposal(actionType = '') {
  const action = findEonActionGatewayType(actionType);
  return freeze({
    ok: false,
    action,
    status: 'disabled',
    reason: action ? 'action-gateway-disabled-until-server-proof' : 'unknown-action-type',
    proposalCreated: false,
    receiptCreated: false,
    externalEffect: false
  });
}

export default freeze({ EON_ACTION_GATEWAY_SCHEMA, EON_ACTION_GATEWAY_ROLLOUT, EON_ACTION_GATEWAY_TYPES, getEonActionGatewayTruth, findEonActionGatewayType, prepareDisabledActionGatewayProposal });
