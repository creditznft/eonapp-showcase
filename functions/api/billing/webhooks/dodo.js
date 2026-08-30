import { jsonResponse } from '../../../_shared/eon-auth.js';
import { processDodoWebhook } from '../../../../assets/js/billing/eon-dodo-live-runtime.js';

export async function onRequestPost(context) {
  const result = await processDodoWebhook({ request: context.request, env: context.env });
  return jsonResponse(result, result.httpStatus || (result.ok ? 200 : 400), { 'cache-control': 'no-store, max-age=0' });
}

export async function onRequestGet() {
  return jsonResponse({ ok: true, status: 'dodo-webhook-route-live', accepts: 'POST', signedRequestsOnly: true }, 200, { 'cache-control': 'no-store, max-age=0' });
}
