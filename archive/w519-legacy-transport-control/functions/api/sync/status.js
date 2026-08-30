/** W412 — explicit status only; no sync occurs on status read. */
import { getEonSyncBasicConfig, publicEonSyncBasicStatus } from '../../_shared/eon-sync-basic.js';
import { jsonResponse, readSession } from '../../_shared/eon-auth.js';

export async function onRequestGet(context) {
  const config = getEonSyncBasicConfig(context.request, context.env);
  const session = config.configured ? await readSession(config.identity, context.request) : null;
  return jsonResponse({ ok: true, ...publicEonSyncBasicStatus(config, session) }, 200);
}
