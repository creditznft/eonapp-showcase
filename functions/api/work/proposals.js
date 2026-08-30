import { enforceSameOriginMutation, getIdentityConfig, jsonResponse, readSession } from '../../_shared/eon-auth.js';
import { createEonDurableWorkProposal, getEonDurableWorkLedgerConfig, getEonDurableWorkProposalLedgerTruth, listEonDurableWorkProposals } from '../../_shared/eon-durable-work-proposal-ledger.js';

async function authority(context, { mutation = false } = {}) {
  const identity = getIdentityConfig(context.request, context.env);
  if (!identity.configured) return { response: jsonResponse({ ok: false, error: 'identity-unavailable' }, 503) };
  if (mutation && !enforceSameOriginMutation(context.request, identity)) return { response: jsonResponse({ ok: false, error: 'same-origin-required' }, 403) };
  const session = await readSession(identity, context.request);
  if (!session?.accountId) return { response: jsonResponse({ ok: false, error: 'login-required' }, 401) };
  const work = getEonDurableWorkLedgerConfig(context.env);
  if (!work.configured) return { response: jsonResponse({ ok: false, error: 'durable-work-pilot-disabled', ...getEonDurableWorkProposalLedgerTruth() }, 503) };
  return { session, work };
}

export async function onRequestGet(context) {
  const access = await authority(context);
  if (access.response) return access.response;
  const result = await listEonDurableWorkProposals(access.work.db, access.session.accountId);
  return jsonResponse(result, result.ok ? 200 : 503);
}

export async function onRequestPost(context) {
  const access = await authority(context, { mutation: true });
  if (access.response) return access.response;
  let body = null;
  try { body = await context.request.json(); } catch { return jsonResponse({ ok: false, error: 'invalid-json' }, 400); }
  const result = await createEonDurableWorkProposal(access.work.db, access.session.accountId, body);
  return jsonResponse(result, result.ok ? 200 : 400);
}
