/** W373–W374 — immediate deletion of the minimal server account record after an explicit same-origin confirmation. */
import {
  clearSessionCookie,
  deleteAuthenticatedAccount,
  enforceSameOriginMutation,
  getIdentityConfig,
  jsonResponse,
  readSession
} from '../../_shared/eon-auth.js';
import { EON_REQUEST_LIMITS, readBoundedJson } from '../../_shared/eon-request-security.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const config = getIdentityConfig(request, env);
  if (!config.configured) return jsonResponse({ ok: false, error: 'identity_unavailable' }, 503, { 'set-cookie': clearSessionCookie() });
  if (!enforceSameOriginMutation(request, config)) return jsonResponse({ ok: false, error: 'origin_check_failed' }, 403);
  const parsed = await readBoundedJson(request, { maxBytes: EON_REQUEST_LIMITS.accountMutation });
  if (!parsed.ok) return jsonResponse({ ok: false, error: parsed.error }, parsed.status);
  const body = parsed.value;
  if (String(body?.confirm || '') !== 'DELETE_EON_ACCOUNT') return jsonResponse({ ok: false, error: 'explicit_confirmation_required' }, 400);
  const session = await readSession(config, request);
  if (!session) return jsonResponse({ ok: false, error: 'sign_in_required' }, 401, { 'set-cookie': clearSessionCookie() });
  try {
    await deleteAuthenticatedAccount(config, session);
    return jsonResponse({
      ok: true,
      deleted: 'minimal_cloud_account_metadata_and_active_sessions',
      remainsOnThisDevice: 'Local Chat, Vault, projects, files, Realm setup, City progress, settings and backups were never uploaded and remain under this browser profile until you manage them locally.'
    }, 200, { 'set-cookie': clearSessionCookie() });
  } catch {
    return jsonResponse({ ok: false, error: 'account_delete_unavailable' }, 503, { 'set-cookie': clearSessionCookie() });
  }
}
