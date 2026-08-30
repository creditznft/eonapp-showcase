import {
  EON_SPONSORED_DISCOVERY_SCHEMA,
  getSponsoredDiscoveryRuntimeConfig,
  sanitizeSponsoredDiscoveryIntent
} from '../../config/rt97-sponsored-discovery-contract.mjs';
import { getIdentityConfig, readSession } from './eon-auth.js';
import { consumeTrustRateLimit, trustRateLimitSubject } from './eon-trust-rate-limit.js';
import { recordGrowthOperationalEvent } from './eon-growth-attribution.js';
import { executeVexrailRequest } from '../api/ai/vexrail.js';

const freeze = (value) => Object.freeze(value);

async function readRequiredAccountId(request, env = {}) {
  try {
    const identity = getIdentityConfig(request, env);
    if (!identity?.configured) return '';
    const session = await readSession(identity, request);
    return String(session?.accountId || '').slice(0, 80);
  } catch {
    return '';
  }
}

async function consumeDiscoveryCaps({ env, request, accountId = '', config = {}, now = Date.now() }) {
  const networkSubject = trustRateLimitSubject(request, '');
  if (!networkSubject) return freeze({ ok: false, status: 503, reason: 'discovery_rate_limit_unavailable' });
  const db = env.EON_TRUST_DB;
  const networkHour = await consumeTrustRateLimit(db, env, 'sponsored_discovery_network_hour', networkSubject, now, { limit: Number(config.hourlyNetworkCap) || 12, windowMs: 60 * 60 * 1000 });
  if (!networkHour.ok) return freeze({ ok: false, status: networkHour.error === 'trust_rate_limit_exceeded' ? 429 : 503, reason: networkHour.error === 'trust_rate_limit_exceeded' ? 'discovery_rate_limited' : 'discovery_rate_limit_unavailable' });
  const networkDay = await consumeTrustRateLimit(db, env, 'sponsored_discovery_network_day', networkSubject, now, { limit: Number(config.dailyNetworkCap) || 40, windowMs: 24 * 60 * 60 * 1000 });
  if (!networkDay.ok) return freeze({ ok: false, status: networkDay.error === 'trust_rate_limit_exceeded' ? 429 : 503, reason: networkDay.error === 'trust_rate_limit_exceeded' ? 'discovery_rate_limited' : 'discovery_rate_limit_unavailable' });
  const accountHour = await consumeTrustRateLimit(db, env, 'sponsored_discovery_account_hour', accountId, now, { limit: Number(config.hourlyAccountCap) || 8, windowMs: 60 * 60 * 1000 });
  if (!accountHour.ok) return freeze({ ok: false, status: accountHour.error === 'trust_rate_limit_exceeded' ? 429 : 503, reason: accountHour.error === 'trust_rate_limit_exceeded' ? 'discovery_rate_limited' : 'discovery_rate_limit_unavailable' });
  return freeze({ ok: true, status: 200 });
}

function discoveryMessages(intent = {}) {
  const maxResults = Math.min(5, Math.max(1, Number(intent.maxResults) || 4));
  const category = String(intent.category || 'general').slice(0, 24);
  return Object.freeze([
    Object.freeze({
      role: 'system',
      content: `You are EONAPP Sponsored Discovery. Answer only the user's reviewed commercial discovery intent. Recommend up to ${maxResults} relevant options when useful, keep the response concise, and include direct HTTPS links when available. Do not ask for or infer private data.`
    }),
    Object.freeze({ role: 'user', content: `Category: ${category}\nIntent: ${String(intent.query || '').slice(0, 180)}` })
  ]);
}

export function buildVexrailSponsoredDiscoveryInput(sanitized = {}, turnstileToken = '') {
  const intent = sanitized?.intent || {};
  const token = String(turnstileToken || '').trim().slice(0, 2048);
  return freeze({
    messages: discoveryMessages(intent),
    temperature: 0.25,
    max_tokens: 512,
    stream: false,
    sponsoredOptIn: true,
    guestOneShot: false,
    ...(token ? { turnstileToken: token } : {})
  });
}

function readVexrailAnswer(payload = {}) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim().slice(0, 12000);
  if (Array.isArray(content)) {
    return content.map((part) => typeof part === 'string' ? part : (part?.type === 'text' ? part.text : '')).filter(Boolean).join('\n').trim().slice(0, 12000);
  }
  return '';
}

export async function runSponsoredDiscovery({ env = {}, request = null, input = {}, now = Date.now(), vexrailExecutor = executeVexrailRequest } = {}) {
  const config = getSponsoredDiscoveryRuntimeConfig(env);
  const sanitized = sanitizeSponsoredDiscoveryIntent(input);
  if (!sanitized.ok) return freeze({ ok: false, status: 400, reason: sanitized.reason });

  const accountId = await readRequiredAccountId(request, env);
  if (!accountId) return freeze({ ok: false, status: 401, reason: 'sponsored_discovery_sign_in_required' });

  const capped = await consumeDiscoveryCaps({ env, request, accountId, config, now });
  if (!capped.ok) return capped;
  try { await recordGrowthOperationalEvent(env.EON_TRUST_DB, 'sponsored_discovery_requested', request, env, now); } catch {}

  const vexrailInput = buildVexrailSponsoredDiscoveryInput(sanitized, input?.turnstileToken || '');

  let vexrailResponse;
  try {
    vexrailResponse = await vexrailExecutor({ env, request }, vexrailInput, {
      requireSignedIn: true,
      profitabilityCohort: 'local_byok_discovery'
    });
  } catch {
    try { await recordGrowthOperationalEvent(env.EON_TRUST_DB, 'sponsored_discovery_provider_error', request, env, now); } catch {}
    return freeze({ ok: false, status: 502, reason: 'sponsored_discovery_provider_unavailable' });
  }

  const payload = await vexrailResponse.json().catch(() => ({}));
  if (!vexrailResponse.ok) {
    const providerReason = String(payload?.error || 'sponsored_discovery_provider_error').slice(0, 120);
    try { await recordGrowthOperationalEvent(env.EON_TRUST_DB, 'sponsored_discovery_provider_error', request, env, now); } catch {}
    return freeze({ ok: false, status: vexrailResponse.status || 502, reason: providerReason });
  }
  const answer = readVexrailAnswer(payload);
  if (!answer) {
    try { await recordGrowthOperationalEvent(env.EON_TRUST_DB, 'sponsored_discovery_no_result', request, env, now); } catch {}
    return freeze({ ok: false, status: 502, reason: 'sponsored_discovery_empty_response' });
  }
  try { await recordGrowthOperationalEvent(env.EON_TRUST_DB, 'sponsored_discovery_result_present', request, env, now); } catch {}
  return freeze({
    ok: true,
    status: 200,
    schema: EON_SPONSORED_DISCOVERY_SCHEMA,
    sponsored: true,
    disclosure: 'Sponsored Discovery · separate one-turn Vexrail request',
    answer,
    provider: 'vexrail',
    model: String(vexrailResponse.headers.get('x-eon-vexrail-model') || '').slice(0, 160),
    routing: String(vexrailResponse.headers.get('x-eon-vexrail-routing') || '').slice(0, 80),
    economicsState: String(vexrailResponse.headers.get('x-eon-economics-state') || '').slice(0, 16),
    outbound: freeze({
      fields: sanitized.outboundFields,
      fullConversationForwarded: false,
      localAnswerForwarded: false,
      privateMemoryForwarded: false,
      providerKeysForwarded: false,
      guestOneShotUsed: false,
      turnstileTokenForwardedToVexrail: false
    })
  });
}

export default freeze({ runSponsoredDiscovery });
