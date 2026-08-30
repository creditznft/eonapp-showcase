/**
 * W214 + W476-A6 Cloudflare Pages Function: privacy-bounded CSP reporting.
 *
 * Receives browser CSP reports but deliberately stores/logs only directive,
 * document path and blocked origin. Query strings, fragments, raw referrers,
 * request bodies, cookies, credentials and signed share tokens are never
 * retained or forwarded. Reporting API payloads are accepted alongside the
 * legacy report-uri JSON shape.
 */
import { EON_REQUEST_LIMITS, readBoundedText } from './_shared/eon-request-security.js';

const CRITICAL_DIRECTIVES = ['script-src', 'script-src-attr', 'script-src-elem', 'object-src', 'base-uri'];
const MAX_REPORT_BYTES = 12 * 1024; // synchronized with EON_REQUEST_LIMITS.cspReport
const ACCEPTED_CONTENT_TYPES = Object.freeze(['application/json', 'application/csp-report', 'application/reports+json']);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

function redactUrl(value = '', fallback = '') {
  try {
    const url = new URL(String(value || ''), 'https://eonapp.ch');
    return `${url.origin}${url.pathname}`.slice(0, 240);
  } catch {
    return String(fallback || '').slice(0, 240);
  }
}

function redactOrigin(value = '') {
  try { return new URL(String(value || ''), 'https://eonapp.ch').origin.slice(0, 180); } catch { return 'unknown'; }
}

function isSecureWebhook(value = '') {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}

function contentTypeAllowed(value = '') {
  const mediaType = String(value || '').split(';', 1)[0].trim().toLowerCase();
  return ACCEPTED_CONTENT_TYPES.includes(mediaType);
}

function getReportField(report = {}, names = []) {
  for (const name of names) {
    const value = report?.[name];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  return '';
}

function extractCspViolation(payload) {
  if (payload?.['csp-report'] && typeof payload['csp-report'] === 'object') return payload['csp-report'];
  if (payload?.type === 'csp-violation' && payload?.body && typeof payload.body === 'object') return payload.body;
  if (Array.isArray(payload)) {
    const report = payload.find((entry) => entry?.type === 'csp-violation' && entry?.body && typeof entry.body === 'object');
    if (report) return report.body;
  }
  if (payload?.body && typeof payload.body === 'object') return payload.body;
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) return payload;
  return null;
}

function isReportedDocumentSameOrigin(value = '', expectedOrigin = '') {
  if (!value) return true;
  try {
    const reported = new URL(String(value));
    return reported.origin === expectedOrigin;
  } catch {
    return false;
  }
}

function normalizeCspViolation(violation = {}, expectedOrigin = '') {
  const documentUrl = getReportField(violation, ['document-uri', 'documentURL', 'documentUrl']);
  if (!isReportedDocumentSameOrigin(documentUrl, expectedOrigin)) return null;
  return Object.freeze({
    directive: getReportField(violation, ['effective-directive', 'effectiveDirective', 'violated-directive', 'violatedDirective']) || 'unknown',
    blockedUrl: getReportField(violation, ['blocked-uri', 'blockedURL', 'blockedUrl']),
    documentUrl
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const contentType = request.headers.get('content-type') || '';
  if (!contentTypeAllowed(contentType)) return json({ ok: false, error: 'unsupported_media_type' }, 415);

  const bounded = await readBoundedText(request, { maxBytes: MAX_REPORT_BYTES, allowEmpty: false });
  if (!bounded.ok) {
    const error = bounded.error === 'request_too_large' ? 'report_too_large' : 'report_read_failed';
    return json({ ok: false, error }, bounded.status);
  }
  const raw = bounded.text;

  let parsed;
  try { parsed = JSON.parse(raw || '{}'); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }
  const expectedOrigin = new URL(request.url).origin;
  const normalized = normalizeCspViolation(extractCspViolation(parsed), expectedOrigin);
  if (!normalized) return json({ ok: false, error: 'invalid_csp_document_origin' }, 400);

  const directive = normalized.directive.slice(0, 96);
  const event = {
    event: 'csp-violation',
    directive,
    blockedOrigin: redactOrigin(normalized.blockedUrl),
    documentPath: redactUrl(normalized.documentUrl, '/'),
    ts: new Date().toISOString(),
  };
  console.log(JSON.stringify(event));

  const webhookUrl = String(env?.ALERT_WEBHOOK_URL || '').trim();
  const isCritical = CRITICAL_DIRECTIVES.some((prefix) => directive.startsWith(prefix));
  if (isCritical && isSecureWebhook(webhookUrl)) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: `CSP violation: ${event.directive} on ${event.documentPath}; blocked origin: ${event.blockedOrigin}` })
      });
    } catch {
      // Telemetry delivery never changes the browser's CSP-report response.
    }
  }
  return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
}

export async function onRequestOptions(context) {
  // Echo only the endpoint's own origin, never a caller-controlled Origin header.
  // This keeps the collector narrow on eonapp.ch and also makes a reviewed
  // Cloudflare preview test its own same-origin collector correctly.
  let allowedOrigin = 'https://eonapp.ch';
  try { allowedOrigin = new URL(context?.request?.url || allowedOrigin).origin; } catch { /* stable production fallback */ }
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': allowedOrigin,
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
      'cache-control': 'no-store'
    }
  });
}

export const __test = Object.freeze({
  ACCEPTED_CONTENT_TYPES,
  MAX_REPORT_BYTES,
  contentTypeAllowed,
  extractCspViolation,
  isReportedDocumentSameOrigin,
  normalizeCspViolation,
  redactOrigin,
  redactUrl
});
