import { enforceSameOriginMutation, getIdentityConfig, jsonResponse, readSession } from '../../_shared/eon-auth.js';
import { cancelEonDurableWorkProposal, getEonDurableWorkLedgerConfig, getEonDurableWorkProposalLedgerTruth } from '../../_shared/eon-durable-work-proposal-ledger.js';

export async function onRequestPost(context) {
  const identity = getIdentityConfig(context.request, context.env);
  if (!identity.configured) return jsonResponse({ ok: false, error: 'identity-unavailable' }, 503);
  if (!enforceSameOriginMutation(context.request, identity)) return jsonResponse({ ok: false, error: 'same-origin-required' }, 403);
  const session = await readSession(identity, context.request);
  if (!session?.accountId) return jsonResponse({ ok: false, error: 'login-required' }, 401);
  const work = getEonDurableWorkLedgerConfig(context.env);
  if (!work.configured) return jsonResponse({ ok: false, error: 'durable-work-pilot-disabled', ...getEonDurableWorkProposalLedgerTruth() }, 503);
  let body = null;
  try { body = await context.request.json(); } catch { return jsonResponse({ ok: false, error: 'invalid-json' }, 400); }
  const result = await cancelEonDurableWorkProposal(work.db, session.accountId, body?.proposalId);
  const status = result.ok ? 200 : result.reason === 'proposal-not-found' ? 404 : 400;
  return jsonResponse(result, status);
}
