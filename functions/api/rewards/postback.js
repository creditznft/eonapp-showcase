import { jsonResponse } from '../../_shared/eon-auth.js';
import { applyMyLeadPostback } from './_ledger.js';
import { getMyLeadConfig, parseMyLeadPostback, validateMyLeadPostbackSecret, validateMyLeadPostbackSource } from './_providers.js';

async function receive(context) {
  const config = getMyLeadConfig(context.env);
  if (!config.configured) return jsonResponse({ ok: false, error: 'mylead_not_configured' }, 503);
  const source = validateMyLeadPostbackSource(config, context.request);
  if (!source.ok) return jsonResponse({ ok: false, error: source.error }, source.status);
  const parsed = parseMyLeadPostback(context.request);
  if (!parsed.ok) return jsonResponse({ ok: false, error: parsed.error }, parsed.status);
  const secret = validateMyLeadPostbackSecret(config, parsed.secret);
  if (!secret.ok) return jsonResponse({ ok: false, error: secret.error }, secret.status);
  const result = await applyMyLeadPostback({ env: context.env, parsed });
  if (!result.ok) {
    const conflict = new Set([
      'mylead_player_not_found',
      'mylead_launch_correlation_not_found',
      'mylead_launch_expired',
      'mylead_player_id_tracking_token_mismatch',
      'mylead_source_surface_mismatch',
      'mylead_transaction_attribution_conflict',
      'mylead_virtual_amount_conflict',
      'mylead_transaction_lifecycle_conflict'
    ]);
    return jsonResponse({ ok: false, error: result.status }, conflict.has(result.status) ? 409 : 503);
  }
  // Provider-facing response intentionally excludes account id, balance, payout,
  // email, OAuth data and other private account state.
  return jsonResponse({
    ok: true,
    provider: 'mylead',
    transactionId: result.transaction?.transactionId || parsed.transactionId,
    state: result.transaction?.state || parsed.state,
    duplicate: result.duplicate === true
  });
}

export const onRequestGet = receive;
export const onRequestPost = receive;
