#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createEonOperationalEvent,
  createEonRollbackDrillReceipt,
  evaluateEonReleaseHealth,
  getEonObservabilityTruth
} from '../assets/js/observability/eon-observability-authority.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(path.join(ROOT, file), 'utf8');
const json = (file) => JSON.parse(read(file));
const sha = (value) => createHash('sha256').update(value).digest('hex');
const errors = [];
const authority = read('assets/js/observability/eon-observability-authority.js');
const telemetry = read('assets/js/utils/telemetry.js');
const privacy = read('assets/js/utils/privacy-telemetry.js');
const functionsBridge = read('functions/_shared/eon-observability.js');
const wrangler = read('wrangler.jsonc');
const pages = json('config/cloudflare/eon-pages-source-authority.json');
const edge = json('config/cloudflare/eon-edge-security-policy.json');
const slo = json('config/observability/a15-i23-slo-policy.json');

if (!authority.includes('rawUserContentAllowed: false') || !authority.includes('credentialsAllowed: false')) errors.push('observability-private-content-boundary-missing');
if (!telemetry.includes('compactTelemetryPayload') || /events\.push\(\{[\s\S]*\.\.\.data/.test(telemetry)) errors.push('pipeline-telemetry-not-compacted');
if (!privacy.includes('prompt|reply|content|body')) errors.push('privacy-sensitive-field-pattern-incomplete');
if (!functionsBridge.includes('eon-observability-authority.js')) errors.push('pages-functions-not-sharing-observability-authority');
if (/"observability"\s*:/.test(wrangler) || !/"upload_source_maps": true/.test(wrangler)) errors.push('pages-wrangler-observability-boundary-invalid');
if (pages?.dashboardConfigMayOverrideSource !== false || pages?.edgeSecurityApplied !== false) errors.push('cloudflare-source-authority-not-fail-closed');
if (edge?.phases?.rateLimiting !== 'http_ratelimit' || edge?.rateLimitingRules?.length < 3) errors.push('edge-rate-limit-policy-incomplete');
if (edge?.apply?.applied !== false || edge?.zoneIdCommitted !== false || edge?.rulesetIdsCommitted !== false) errors.push('edge-policy-falsely-claims-application');
if (slo?.privacy?.prompts !== false || slo?.privacy?.credentials !== false || slo?.automaticRollback !== false) errors.push('slo-privacy-or-rollback-boundary-invalid');

const redacted = createEonOperationalEvent({ route: 'https://eonapp.ch/api/chat?token=secret', dimensions: { prompt: 'private', provider: 'local' } }, { now: 0 });
if (redacted.route !== '/api/chat' || 'prompt' in redacted.dimensions || JSON.stringify(redacted).includes('secret')) errors.push('operational-event-redaction-failed');
const drillHealth = evaluateEonReleaseHealth({ environment: 'production', releaseId: 'drill', apiAvailability: 0.9, api5xxRate: 0.2 }, { now: 0 });
if (!drillHealth.rollbackRecommended || drillHealth.automaticRollback !== false) errors.push('alert-drill-did-not-fire-safely');
const rollback = createEonRollbackDrillReceipt({ currentDeploymentId: 'prod-a', targetDeploymentId: 'prod-b', targetIsSuccessfulProduction: true, explicitOwnerAuthorization: true, health: { apiAvailability: 0.9 } }, { now: 0 });
if (!rollback.rollbackReady || rollback.externalActionPerformed !== false || rollback.previewTargetAllowed !== false) errors.push('rollback-drill-boundary-invalid');
const truth = getEonObservabilityTruth();
if (truth.customPayloadsContainPrompts || truth.customPayloadsContainCredentials || truth.automaticRollback) errors.push('observability-truth-invalid');

const core = {
  schema: 'eonapp.a15.i23.observability-security-health-gate-receipt.v1',
  generatedAt: new Date().toISOString(), wave: 'I23', status: errors.length ? 'fail' : 'pass',
  authoritySha256: sha(authority), workerObservabilityEnabled: true, workerHeadSamplingRate: 0.1,
  sourceMapsConfigured: true, browserDiagnosticsDefaultOn: false,
  customPayloadsContainPrompts: false, customPayloadsContainCredentials: false,
  alertDrillFired: drillHealth.alerts.length > 0, automaticRollback: false,
  rollbackDrillReady: rollback.rollbackReady, rollbackExternalActionPerformed: false,
  edgeSecurityRules: edge.rateLimitingRules.length + edge.customRules.length,
  edgeSecurityApplied: false, cloudflareDashboardReconciled: false,
  productionHealthCertified: false, productionRollbackProven: false,
  errors
};
const receipt = { ...core, digest: sha(JSON.stringify(core)) };
const output = path.join(ROOT, 'docs/institutional/a15/evidence/A15_I23_OBSERVABILITY_SECURITY_HEALTH_GATE_RECEIPT.json');
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I23] ${receipt.status.toUpperCase()}: redacted observability, ${core.edgeSecurityRules} edge rules and rollback drill authority.`);
if (errors.length) { errors.forEach((error) => console.error(`[A15 I23] ${error}`)); process.exitCode = 1; }
