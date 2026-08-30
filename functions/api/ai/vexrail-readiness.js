import { getIdentityConfig, jsonResponse, readSession } from '../../_shared/eon-auth.js';
import { consumeTrustRateLimit } from '../../_shared/eon-trust-rate-limit.js';
import { evaluateVexrailGeoPolicy, getVexrailConfig } from './vexrail.js';
import { discoverVexrailModelIds, EON_VEXRAIL_REQUEST_CLASSES, isVexrailModelQualifiedForClass, parseVerifiedVexrailEconomics, VEXRAIL_MODELS_UPSTREAM } from '../../_shared/eon-vexrail-model-router.js';

export const EON_VEXRAIL_READINESS_SCHEMA = 'eonapp.ai.vexrail-readiness.rt97.v3';
export { VEXRAIL_MODELS_UPSTREAM };
const READINESS_LIMIT_PER_HOUR = 12;

function response(body, status = 200) {
  return jsonResponse(body, status, { 'cache-control': 'no-store, max-age=0', vary: 'cookie' });
}

export async function probeVexrailModelAvailability(config = {}, fetchImpl = fetch, options = {}) {
  if (!config?.configured || !config?.publishableKey || !config?.secretKey) {
    return Object.freeze({ ok: false, configured: false, dynamicEconomicsVerified: false, dynamicCoverageReady: false, dynamicRoutingAvailable: false, dynamicCandidateCount: 0, dynamicCoverage: Object.freeze({}), upstreamReachable: false, upstreamStatus: 0, modelCount: 0, reason: 'vexrail_not_configured', secretsExposed: false });
  }
  const economics = parseVerifiedVexrailEconomics(options.economicsRaw || '');
  if (!economics.verified) {
    return Object.freeze({ ok: false, configured: true, dynamicEconomicsVerified: false, dynamicCoverageReady: false, dynamicRoutingAvailable: false, dynamicCandidateCount: 0, dynamicCoverage: Object.freeze({}), upstreamReachable: false, upstreamStatus: 0, modelCount: 0, reason: 'vexrail_economics_unavailable', secretsExposed: false });
  }
  const discovery = await discoverVexrailModelIds(config, fetchImpl, options.now || Date.now());
  if (!discovery.ok) {
    return Object.freeze({ ok: false, configured: true, dynamicEconomicsVerified: true, dynamicCoverageReady: false, dynamicRoutingAvailable: false, dynamicCandidateCount: 0, dynamicCoverage: Object.freeze({}), upstreamReachable: discovery.upstreamStatus > 0, upstreamStatus: discovery.upstreamStatus, modelCount: 0, reason: discovery.reason || 'vexrail_models_unreachable', secretsExposed: false });
  }
  const available = new Set(discovery.ids || []);
  const dynamicCoverage = {};
  const dynamicIds = new Set();
  for (const requestClass of EON_VEXRAIL_REQUEST_CLASSES) {
    let count = 0;
    for (const [id, entry] of Object.entries(economics.models)) {
      if (!available.has(id) || !isVexrailModelQualifiedForClass(entry, requestClass, { stream: true })) continue;
      count += 1;
      dynamicIds.add(id);
    }
    dynamicCoverage[requestClass] = count;
  }
  const dynamicCoverageReady = EON_VEXRAIL_REQUEST_CLASSES.every((requestClass) => dynamicCoverage[requestClass] > 0);
  return Object.freeze({
    ok: dynamicCoverageReady,
    configured: true,
    dynamicEconomicsVerified: true,
    dynamicCoverageReady,
    dynamicRoutingAvailable: dynamicCoverageReady,
    dynamicCandidateCount: dynamicIds.size,
    dynamicCoverage: Object.freeze(dynamicCoverage),
    upstreamReachable: true,
    upstreamStatus: Number(discovery.upstreamStatus || 200),
    modelCount: available.size,
    reason: dynamicCoverageReady ? 'ready_dynamic' : 'vexrail_dynamic_coverage_incomplete',
    secretsExposed: false
  });
}

export async function onRequestGet(context) {
  const identity = getIdentityConfig(context.request, context.env);
  if (!identity?.configured) return response({ ok: false, schema: EON_VEXRAIL_READINESS_SCHEMA, error: 'identity_unavailable' }, 503);
  let session = null;
  try { session = await readSession(identity, context.request); } catch {}
  if (!session?.accountId) return response({ ok: false, schema: EON_VEXRAIL_READINESS_SCHEMA, error: 'sign_in_required' }, 401);
  const allowance = await consumeTrustRateLimit(context.env.EON_TRUST_DB, context.env, 'vexrail_model_readiness', session.accountId, Date.now(), { limit: READINESS_LIMIT_PER_HOUR });
  if (!allowance.ok) {
    const limited = allowance.error === 'trust_rate_limit_exceeded';
    return response({ ok: false, schema: EON_VEXRAIL_READINESS_SCHEMA, error: limited ? 'readiness_rate_limited' : 'readiness_rate_limit_unavailable' }, limited ? 429 : 503);
  }
  const config = getVexrailConfig(context.env);
  const geo = evaluateVexrailGeoPolicy(config, context.request, context.env);
  const result = await probeVexrailModelAvailability(config, fetch, { economicsRaw: context.env.EON_VEXRAIL_MODEL_ECONOMICS_JSON || '' });
  return response({
    schema: EON_VEXRAIL_READINESS_SCHEMA,
    ...result,
    geoMode: config.geoMode,
    observedCountry: geo.country || '',
    geoEligible: geo.allowed === true,
    geoReason: geo.reason || 'vexrail_geo_unavailable',
    secretsExposed: false
  }, result.ok ? 200 : 503);
}
