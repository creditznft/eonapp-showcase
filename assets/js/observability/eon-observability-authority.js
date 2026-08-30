/**
 * A15 I23 — one privacy, SLO, alert and rollback-health authority.
 *
 * Events contain bounded operational metadata only. Prompts, replies, file
 * contents, credentials, request bodies, cookies, query strings and full URLs
 * are never accepted into the receipt shape.
 */
import { compactTelemetryPayload, redactTelemetryPath, redactTelemetryText } from '../utils/privacy-telemetry.js';

export const EON_OBSERVABILITY_SCHEMA = 'eonapp.observability-authority.a15.i23.v1';
export const EON_ALERT_RECEIPT_SCHEMA = 'eonapp.alert-receipt.a15.i23.v1';
export const EON_ROLLBACK_HEALTH_SCHEMA = 'eonapp.rollback-health.a15.i23.v1';

export const EON_OBSERVABILITY_POLICY = Object.freeze({
  transport: Object.freeze({ browserDiagnostics: 'browser-local-opt-in', workerOperationalLogs: 'cloudflare-account-only' }),
  prohibitedFields: Object.freeze(['prompt', 'reply', 'content', 'body', 'authorization', 'cookie', 'apiKey', 'secret', 'token', 'password', 'headers', 'query', 'stack']),
  allowedDimensions: Object.freeze(['environment', 'releaseId', 'route', 'operation', 'result', 'provider', 'model', 'statusClass', 'attemptCount']),
  workerSamplingRate: 0.1,
  browserMeasurementDefaultEnabled: false,
  rawUserContentAllowed: false,
  credentialsAllowed: false,
  fullUrlsAllowed: false,
  stackTracesInCustomPayloadsAllowed: false
});

export const EON_RELEASE_SLOS = Object.freeze({
  apiAvailability: Object.freeze({ target: 0.999, alertBelow: 0.995 }),
  functionP95Ms: Object.freeze({ target: 750, alertAbove: 1200 }),
  api5xxRate: Object.freeze({ target: 0.005, alertAbove: 0.01 }),
  authFailureRate: Object.freeze({ target: 0.02, alertAbove: 0.05 }),
  billingCommandFailureRate: Object.freeze({ target: 0.01, alertAbove: 0.03 }),
  webhookDeliveryFailureRate: Object.freeze({ target: 0.005, alertAbove: 0.02 }),
  supportCaseFailureRate: Object.freeze({ target: 0.02, alertAbove: 0.05 }),
  rollbackRecoveryMinutes: Object.freeze({ target: 10, alertAbove: 20 })
});

const freeze = Object.freeze;
const cleanName = (value = '', fallback = 'unknown', limit = 64) => redactTelemetryText(value || fallback, limit).replace(/[^a-zA-Z0-9:._/-]/g, '-').slice(0, limit) || fallback;
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export function createEonOperationalEvent(input = {}, options = {}) {
  const now = Number(options.now || Date.now());
  const event = {
    schema: EON_OBSERVABILITY_SCHEMA,
    at: new Date(now).toISOString(),
    minuteBucket: Math.floor(now / 60000),
    event: cleanName(input.event, 'operational-event', 72),
    environment: cleanName(input.environment, 'unknown', 24),
    releaseId: cleanName(input.releaseId, 'unknown', 72),
    route: redactTelemetryPath(input.route || '/', '/'),
    operation: cleanName(input.operation, 'unknown', 64),
    result: cleanName(input.result, 'unknown', 32),
    durationMs: Math.max(0, Math.round(finite(input.durationMs))),
    statusClass: cleanName(input.statusClass, 'unknown', 16),
    dimensions: freeze(compactTelemetryPayload(input.dimensions || {}, 8)),
    containsUserContent: false,
    containsCredentials: false,
    containsRequestBody: false,
    containsQueryOrFragment: false
  };
  return freeze(event);
}

export function evaluateEonReleaseHealth(snapshot = {}, options = {}) {
  const metrics = freeze({
    apiAvailability: finite(snapshot.apiAvailability, 1),
    functionP95Ms: Math.max(0, finite(snapshot.functionP95Ms)),
    api5xxRate: Math.max(0, finite(snapshot.api5xxRate)),
    authFailureRate: Math.max(0, finite(snapshot.authFailureRate)),
    billingCommandFailureRate: Math.max(0, finite(snapshot.billingCommandFailureRate)),
    webhookDeliveryFailureRate: Math.max(0, finite(snapshot.webhookDeliveryFailureRate)),
    supportCaseFailureRate: Math.max(0, finite(snapshot.supportCaseFailureRate)),
    rollbackRecoveryMinutes: Math.max(0, finite(snapshot.rollbackRecoveryMinutes))
  });
  const alerts = [];
  if (metrics.apiAvailability < EON_RELEASE_SLOS.apiAvailability.alertBelow) alerts.push('api-availability-below-threshold');
  if (metrics.functionP95Ms > EON_RELEASE_SLOS.functionP95Ms.alertAbove) alerts.push('function-p95-above-threshold');
  if (metrics.api5xxRate > EON_RELEASE_SLOS.api5xxRate.alertAbove) alerts.push('api-5xx-rate-above-threshold');
  if (metrics.authFailureRate > EON_RELEASE_SLOS.authFailureRate.alertAbove) alerts.push('auth-failure-rate-above-threshold');
  if (metrics.billingCommandFailureRate > EON_RELEASE_SLOS.billingCommandFailureRate.alertAbove) alerts.push('billing-command-failure-rate-above-threshold');
  if (metrics.webhookDeliveryFailureRate > EON_RELEASE_SLOS.webhookDeliveryFailureRate.alertAbove) alerts.push('webhook-delivery-failure-rate-above-threshold');
  if (metrics.supportCaseFailureRate > EON_RELEASE_SLOS.supportCaseFailureRate.alertAbove) alerts.push('support-case-failure-rate-above-threshold');
  if (metrics.rollbackRecoveryMinutes > EON_RELEASE_SLOS.rollbackRecoveryMinutes.alertAbove) alerts.push('rollback-recovery-time-above-threshold');
  if (snapshot.securityIncidentOpen === true) alerts.push('security-incident-open');
  if (snapshot.schemaMismatch === true) alerts.push('schema-version-mismatch');
  const evaluatedAt = new Date(Number(options.now || Date.now())).toISOString();
  return freeze({
    schema: EON_ALERT_RECEIPT_SCHEMA,
    evaluatedAt,
    environment: cleanName(snapshot.environment, 'unknown', 24),
    releaseId: cleanName(snapshot.releaseId, 'unknown', 72),
    metrics,
    alerts: freeze(alerts),
    healthy: alerts.length === 0,
    rollbackRecommended: alerts.some((alert) => /security|schema|api-5xx|availability|billing/.test(alert)),
    automaticRollback: false,
    containsUserContent: false
  });
}

export function createEonRollbackDrillReceipt(input = {}, options = {}) {
  const currentDeploymentId = cleanName(input.currentDeploymentId, '', 96);
  const targetDeploymentId = cleanName(input.targetDeploymentId, '', 96);
  const targetIsSuccessfulProduction = input.targetIsSuccessfulProduction === true;
  const explicitOwnerAuthorization = input.explicitOwnerAuthorization === true;
  const differentTarget = Boolean(currentDeploymentId && targetDeploymentId && currentDeploymentId !== targetDeploymentId);
  const health = evaluateEonReleaseHealth(input.health || {}, options);
  const rollbackReady = differentTarget && targetIsSuccessfulProduction && explicitOwnerAuthorization;
  return freeze({
    schema: EON_ROLLBACK_HEALTH_SCHEMA,
    createdAt: new Date(Number(options.now || Date.now())).toISOString(),
    currentDeploymentId,
    targetDeploymentId,
    targetIsSuccessfulProduction,
    explicitOwnerAuthorization,
    rollbackReady,
    rollbackRecommended: health.rollbackRecommended,
    health,
    action: rollbackReady ? 'pages-production-rollback-ready' : 'rollback-blocked',
    externalActionPerformed: false,
    previewTargetAllowed: false,
    containsCredentials: false
  });
}

export function getEonObservabilityTruth() {
  return freeze({
    schema: EON_OBSERVABILITY_SCHEMA,
    customPayloadsContainPrompts: false,
    customPayloadsContainCredentials: false,
    browserMeasurementDefaultEnabled: false,
    workerLogsAreAccountScoped: true,
    sourceMapsConfigured: true,
    alertDrillsSupported: true,
    automaticRollback: false,
    rollbackRequiresSuccessfulProductionTarget: true,
    rollbackRequiresExplicitOwnerAuthorization: true
  });
}
