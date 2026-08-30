/** W391D — create a direct, opaque tracking invite only after the relay pilot is explicitly enabled. */
import {
  makeRelayInviteCode,
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
  const source = normalizeRelaySource(body?.source);
  const inviteId = crypto.randomUUID();
  const code = makeRelayInviteCode();
  const codeHash = await relayInviteCodeHash(required.config, code);
  const now = Date.now();
  try {
    await required.config.database.batch([
      required.config.database.prepare('INSERT INTO eon_relay_invites (invite_id, inviter_account_ref, created_at, status) VALUES (?, ?, ?, ?)')
        .bind(inviteId, required.session.accountId, now, 'created'),
      required.config.database.prepare('INSERT INTO eon_relay_invite_tokens (invite_id, invite_code_hmac, created_at, source) VALUES (?, ?, ?, ?)')
        .bind(inviteId, codeHash, now, source)
    ]);
  } catch {
    return jsonResponse({ ok: false, error: 'relay_invite_unavailable' }, 503);
  }
  const origin = new URL(context.request.url).origin;
  const inviteUrl = new URL('/', origin);
  inviteUrl.searchParams.set('relay', code);
  return jsonResponse({
    ok: true,
    trackingEnabled: true,
    grantsEnabled: false,
    inviteUrl: inviteUrl.toString(),
    inviteExpiresAutomatically: false,
    note: 'This direct invite records no click, IP address, device fingerprint, reward, payout, credit, subscription time or entitlement. It can be revoked by a future approved Relay control.'
  }, 201);
}
