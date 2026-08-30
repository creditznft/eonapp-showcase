import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createEonOperationalEvent,
  createEonRollbackDrillReceipt,
  evaluateEonReleaseHealth,
  getEonObservabilityTruth
} from '../../assets/js/observability/eon-observability-authority.js';
import { EON_PIPELINE_TELEMETRY_KEY, clearPipelineTelemetry, emit } from '../../assets/js/utils/telemetry.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const json = (path) => JSON.parse(read(path));
function memoryStorage(seed = {}) {
  const state = new Map(Object.entries(seed));
  return {
    getItem(key) { return state.has(key) ? state.get(key) : null; },
    setItem(key, value) { state.set(key, String(value)); },
    removeItem(key) { state.delete(key); },
    dump() { return Object.fromEntries(state); }
  };
}

test('A15 I23 operational events redact routes and reject private payload fields', () => {
  const event = createEonOperationalEvent({
    event: 'api request',
    environment: 'preview',
    releaseId: 'candidate-1',
    route: 'https://eonapp.ch/api/chat?token=secret#fragment',
    operation: 'chat',
    result: 'ok',
    durationMs: 42,
    dimensions: { provider: 'local', prompt: 'private prompt', apiKey: 'secret', attemptCount: 1 }
  }, { now: 0 });
  assert.equal(event.route, '/api/chat');
  assert.equal(event.dimensions.provider, 'local');
  assert.equal(event.dimensions.attemptCount, 1);
  assert.equal('prompt' in event.dimensions, false);
  assert.equal('apiKey' in event.dimensions, false);
  assert.equal(event.containsUserContent, false);
  assert.doesNotMatch(JSON.stringify(event), /private prompt|token=secret|fragment/);
});

test('A15 I23 local pipeline telemetry is opt-in, bounded and cannot persist prompt or credential fields', () => {
  const storage = memoryStorage();
  assert.equal(emit('tool:start', { tool: 'forge', prompt: 'private', token: 'secret' }, { storage, now: 0 }), null);
  storage.setItem('eon:privacy:local-measurement:v1', JSON.stringify({ enabled: true, decidedAt: 1 }));
  const event = emit('tool:start', { tool: 'forge', prompt: 'private', token: 'secret', route: 'https://eonapp.ch/create?token=x' }, { storage, now: 60000 });
  assert.equal(event?.data?.tool, 'forge');
  assert.equal('prompt' in event.data, false);
  assert.equal('token' in event.data, false);
  assert.equal(event.data.route, '[url]');
  const stored = storage.getItem(EON_PIPELINE_TELEMETRY_KEY);
  assert.ok(stored);
  assert.doesNotMatch(stored, /private|secret|token=x/);
  clearPipelineTelemetry({ storage });
  assert.equal(storage.getItem(EON_PIPELINE_TELEMETRY_KEY), null);
});

test('A15 I23 SLO evaluator fires bounded alerts and never performs automatic rollback', () => {
  const healthy = evaluateEonReleaseHealth({ environment: 'preview', releaseId: 'r1', apiAvailability: 1, functionP95Ms: 300 }, { now: 0 });
  assert.equal(healthy.healthy, true);
  assert.equal(healthy.rollbackRecommended, false);
  const unhealthy = evaluateEonReleaseHealth({
    environment: 'production', releaseId: 'r2', apiAvailability: 0.9, functionP95Ms: 1800,
    api5xxRate: 0.2, billingCommandFailureRate: 0.1, securityIncidentOpen: true
  }, { now: 0 });
  assert.equal(unhealthy.healthy, false);
  assert.equal(unhealthy.rollbackRecommended, true);
  assert.ok(unhealthy.alerts.includes('api-availability-below-threshold'));
  assert.ok(unhealthy.alerts.includes('security-incident-open'));
  assert.equal(unhealthy.automaticRollback, false);
});

test('A15 I23 rollback drill accepts only a different successful production target with explicit owner authority', () => {
  const blocked = createEonRollbackDrillReceipt({ currentDeploymentId: 'prod-a', targetDeploymentId: 'preview-b', targetIsSuccessfulProduction: false, explicitOwnerAuthorization: true }, { now: 0 });
  assert.equal(blocked.rollbackReady, false);
  assert.equal(blocked.externalActionPerformed, false);
  const ready = createEonRollbackDrillReceipt({
    currentDeploymentId: 'prod-a', targetDeploymentId: 'prod-b', targetIsSuccessfulProduction: true,
    explicitOwnerAuthorization: true, health: { apiAvailability: 0.8, api5xxRate: 0.2 }
  }, { now: 0 });
  assert.equal(ready.rollbackReady, true);
  assert.equal(ready.rollbackRecommended, true);
  assert.equal(ready.previewTargetAllowed, false);
  assert.equal(ready.externalActionPerformed, false);
});

test('A15 I23 Cloudflare observability and edge-security desired state are source-controlled and unapplied', () => {
  const wrangler = read('wrangler.jsonc');
  const pages = json('config/cloudflare/eon-pages-source-authority.json');
  const edge = json('config/cloudflare/eon-edge-security-policy.json');
  const slo = json('config/observability/a15-i23-slo-policy.json');
  assert.match(wrangler, /"upload_source_maps": true/);
  assert.doesNotMatch(wrangler, /"observability"\s*:/);
  assert.equal(pages.observability.enabled, true);
  assert.equal(pages.edgeSecurityApplied, false);
  assert.equal(edge.phases.rateLimiting, 'http_ratelimit');
  assert.ok(edge.rateLimitingRules.length >= 3);
  assert.ok(edge.rateLimitingRules.every((rule) => rule.ratelimit.requests_per_period >= 1));
  assert.equal(edge.apply.applied, false);
  assert.equal(slo.privacy.prompts, false);
  assert.equal(slo.automaticRollback, false);
});

test('A15 I23 one authority is shared with Pages Functions and declares no hidden content collection', () => {
  const bridge = read('functions/_shared/eon-observability.js');
  const telemetry = read('assets/js/utils/telemetry.js');
  const truth = getEonObservabilityTruth();
  assert.match(bridge, /observability\/eon-observability-authority\.js/);
  assert.match(telemetry, /compactTelemetryPayload/);
  assert.doesNotMatch(telemetry, /events\.push\(\{[\s\S]*\.\.\.data/);
  assert.equal(truth.customPayloadsContainPrompts, false);
  assert.equal(truth.customPayloadsContainCredentials, false);
  assert.equal(truth.automaticRollback, false);
  assert.equal(truth.rollbackRequiresExplicitOwnerAuthorization, true);
});
