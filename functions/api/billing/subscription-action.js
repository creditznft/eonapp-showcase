import { enforceSameOriginMutation, getIdentityConfig, jsonResponse, readSession } from '../../_shared/eon-auth.js';
import { EON_REQUEST_LIMITS, readBoundedJson } from '../../_shared/eon-request-security.js';
import { readAccountEntitlement, recordBillingActionAudit } from '../../../assets/js/billing/eon-dodo-live-runtime.js';
import { prepareBillingCommand, updateBillingCommand } from '../../../assets/js/billing/eon-billing-command-ledger.js';
import { executeDodoSubscriptionAction, previewDodoSubscriptionChange } from '../../../assets/js/billing/eon-dodo-customer-actions.js';

export async function onRequestPost(context) {
  const config = getIdentityConfig(context.request, context.env);
  if (!enforceSameOriginMutation(context.request, config)) return jsonResponse({ ok: false, error: 'same_origin_required' }, 403);
  const session = await readSession(config, context.request);
  if (!session?.accountId) return jsonResponse({ ok: false, error: 'login_required', loginUrl: '/api/auth/google/start?returnTo=/billing' }, 401);
  const parsed = await readBoundedJson(context.request, { maxBytes: EON_REQUEST_LIMITS.billingMutation });
  if (!parsed.ok) return jsonResponse({ ok: false, error: parsed.error }, parsed.status);
  const input = parsed.value;
  const database = context.env.EON_BILLING_DB;
  const entitlement = await readAccountEntitlement(database, session.accountId);
  if (input.action === 'preview-change-plan') {
    const preview = await previewDodoSubscriptionChange({ env: context.env, input, entitlement });
    return jsonResponse(preview, preview.ok ? 200 : (preview.status === 'invalid_request' ? 400 : 503), { 'cache-control': 'no-store, max-age=0' });
  }
  let prepared;
  try {
    prepared = await prepareBillingCommand(database, {
      accountId: session.accountId,
      operation: input.action,
      requestedTierId: input.tier || input.tierId,
      idempotencyKey: input.idempotencyKey,
      statePrecondition: String(entitlement?.status || 'free')
    });
  } catch {
    return jsonResponse({ ok: false, status: 'billing_command_ledger_unavailable', retryable: true }, 503, { 'cache-control': 'no-store, max-age=0' });
  }
  if (!prepared.ok) {
    const code = prepared.status === 'idempotency_conflict' ? 409 : 400;
    return jsonResponse({ ok: false, status: prepared.status, duplicate: prepared.duplicate === true, command: prepared.command, errors: prepared.errors }, code, { 'cache-control': 'no-store, max-age=0' });
  }
  if (prepared.duplicate) {
    const accepted = ['provider_accepted', 'verified'].includes(prepared.command?.status);
    const pending = ['prepared', 'provider_pending'].includes(prepared.command?.status);
    return jsonResponse({
      ok: accepted || pending,
      status: accepted ? 'provider_action_accepted_webhook_pending' : pending ? 'billing_action_pending' : prepared.command?.resultStatus || 'duplicate_command',
      duplicate: true,
      command: prepared.command,
      directEntitlementChange: false,
      webhookReconciliationRequired: true
    }, accepted || pending ? 202 : 409, { 'cache-control': 'no-store, max-age=0' });
  }
  await updateBillingCommand(database, prepared.command.commandId, { status: 'provider_pending', resultStatus: 'provider_request_pending' });
  const providerInput = { ...input, idempotencyKey: input.idempotencyKey };
  const result = await executeDodoSubscriptionAction({ env: context.env, input: providerInput, entitlement });
  await updateBillingCommand(database, prepared.command.commandId, {
    status: result.ok ? 'provider_accepted' : 'failed',
    providerObjectRef: entitlement?.provider_subscription_ref,
    providerHttpStatus: result.httpStatus,
    resultStatus: result.status,
    errorCode: result.ok ? '' : (result.error || result.status)
  });
  try {
    await recordBillingActionAudit(database, {
      actionId: prepared.command.commandId,
      accountId: session.accountId,
      actionType: input.action,
      requestedTierId: input.tier || input.tierId,
      providerSubscriptionRef: entitlement?.provider_subscription_ref,
      resultStatus: result.status,
      providerHttpStatus: result.httpStatus
    });
  } catch {
    return jsonResponse({ ok: false, status: 'action_audit_write_failed', retryable: true, providerActionMayHaveBeenAccepted: result.ok === true, commandId: prepared.command.commandId }, 503, { 'cache-control': 'no-store, max-age=0' });
  }
  return jsonResponse({ ...result, commandId: prepared.command.commandId, duplicate: false }, result.ok ? 202 : (result.status === 'invalid_request' ? 400 : (result.status === 'rate_limited' ? 429 : 503)), { 'cache-control': 'no-store, max-age=0' });
}
