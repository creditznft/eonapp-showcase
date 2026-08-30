import { buildRewardedSponsorVastWrapper } from '../../../_shared/eon-rewarded-sponsor-runtime.js';

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const result = await buildRewardedSponsorVastWrapper({ env: context.env, sessionId: url.searchParams.get('session') || '', token: url.searchParams.get('token') || '', origin: url.origin });
  if (!result.ok) return new Response('', { status: result.status === 'reward_token_invalid' ? 403 : 404, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
  return new Response(result.xml, { status: 200, headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'no-store, max-age=0', 'x-content-type-options': 'nosniff', 'cross-origin-resource-policy': 'same-origin' } });
}
