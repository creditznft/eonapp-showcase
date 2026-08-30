/** W391D — explicit, signed-in direct-invite attribution. No click tracking and no reward grant. */
import {
  normalizeRelayInviteCode,
  normalizeRelaySource,
  readBoundedJson,
  relayInviteCodeHash,
  relayJsonError,
  requireRelayTracking
} from '../../../_shared/eon-relay.js';
import { jsonResponse } from '../../../_shared/eon-auth.js';

export async function onRequestPost(context) {
  const required = await requireRelayTracking(context);
  if (!required.ok) return required.response;
  let body = {};
  try { body = await readBoundedJson(context.request); } catch (error) { return relayJsonError(error?.message); }
  const code = normalizeRelayInviteCode(body?.code);
  if (!code) return jsonResponse({ ok: false, error: 'relay_invite_code_invalid' }, 400);
  const source = normalizeRelaySource(body?.source);
  const codeHash = await relayInviteCodeHash(required.config, code);
  try {
    const token = await required.config.database.prepare(`
      SELECT token.invite_id, invite.inviter_account_ref
      FROM eon_relay_invite_tokens AS token
      JOIN eon_relay_invites AS invite ON invite.invite_id = token.invite_id
      WHERE token.invite_code_hmac = ?
        AND invite.status = 'created'
        AND invite.revoked_at IS NULL
      LIMIT 1
    `).bind(codeHash).first();
    if (!token?.invite_id || !token?.inviter_account_ref) return jsonResponse({ ok: false, error: 'relay_invite_not_available' }, 404);
    if (String(token.inviter_account_ref) === required.session.accountId) return jsonResponse({ ok: false, error: 'relay_self_invite_not_allowed' }, 409);
    const existing = await required.config.database.prepare('SELECT attribution_id FROM eon_relay_attributions WHERE invitee_account_ref = ? LIMIT 1').bind(required.session.accountId).first();
    if (existing?.attribution_id) return jsonResponse({ ok: false, error: 'relay_direct_attribution_already_set' }, 409);
    const now = Date.now();
    await required.config.database.prepare(`
      INSERT INTO eon_relay_attributions (
        attribution_id, invite_id, invitee_account_ref, source, captured_at, status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), String(token.invite_id), required.session.accountId, source, now, 'captured').run();
    return jsonResponse({
      ok: true,
      captured: true,
      trackingEnabled: true,
      grantsEnabled: false,
      status: 'captured',
      note: 'Attribution was recorded only after an explicit signed-in action. No reward, financial value, credit, subscription time, entitlement or public activity was created.'
    }, 201);
  } catch {
    return jsonResponse({ ok: false, error: 'relay_attribution_unavailable' }, 503);
  }
}
