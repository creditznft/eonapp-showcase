import { recordRewardedSponsorTrackingEvent } from '../../../_shared/eon-rewarded-sponsor-runtime.js';
import { recordGrowthOperationalEvent } from '../../../_shared/eon-growth-attribution.js';

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const event = url.searchParams.get('event') || '';
  const result = await recordRewardedSponsorTrackingEvent({ env: context.env, sessionId: url.searchParams.get('session') || '', event, token: url.searchParams.get('token') || '' });
  if (event === 'start' && result.ok && result.status === 'reward_event_recorded') {
    await recordGrowthOperationalEvent(context.env.EON_TRUST_DB, 'rewarded_fill_observed', context.request, context.env);
  }
  if (event === 'complete' && result.ok && result.status === 'sponsor_key_granted') {
    await recordGrowthOperationalEvent(context.env.EON_TRUST_DB, 'rewarded_completion_verified', context.request, context.env);
    await recordGrowthOperationalEvent(context.env.EON_TRUST_DB, 'rewarded_reward_granted', context.request, context.env);
  }
  const status = result.ok ? 204 : (result.status === 'reward_token_invalid' ? 403 : result.status === 'reward_event_too_early' || result.status === 'reward_event_out_of_order' ? 409 : 400);
  return new Response(null, { status, headers: { 'cache-control': 'no-store, max-age=0', 'x-content-type-options': 'nosniff', 'cross-origin-resource-policy': 'same-origin' } });
}
