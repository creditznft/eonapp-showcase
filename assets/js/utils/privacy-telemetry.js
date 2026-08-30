/**
 * W214 local-first telemetry hygiene.
 * Telemetry is intentionally browser-local. These helpers strip URL queries,
 * fragments and credential-like values before a caller persists diagnostics.
 */
const SENSITIVE_KEY_PATTERN = /(api(?:[-_:]|\s)?key|secret|token|password|mnemonic|seed|private[-_:]?key|authorization|bearer|cookie|session|wallet|exchange|prompt|reply|content|body|headers?|query|stack|attachment|filedata)/i;
const SENSITIVE_ASSIGNMENT_PATTERN = /\b(api(?:[-_:]|\s)?key|secret|token|password|mnemonic|seed|private[-_:]?key|cookie|session|wallet|exchange)\b\s*(?:[:=]|\s)\s*[^,\s]+/ig;
const AUTHORIZATION_PATTERN = /\b(?:authorization|bearer)\b\s*(?:[:=]|\s)\s*(?:bearer\s+)?[^,\s]+(?:\s+[^,\s]+)?/ig;

export function redactTelemetryText(value = '', max = 180) {
  return String(value ?? '')
    // A full URL is always collapsed before assignment scanning so query/fragment
    // content cannot leave a trailing credential-like fragment in diagnostics.
    .replace(/https?:\/\/[^\s?#]+(?:\?[^\s#]*)?(?:#[^\s]*)?/ig, '[url]')
    .replace(AUTHORIZATION_PATTERN, 'authorization [redacted]')
    .replace(SENSITIVE_ASSIGNMENT_PATTERN, '$1 [redacted]')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, Math.max(0, Number(max) || 0));
}

export function redactTelemetryPath(value = '', fallback = '/') {
  try {
    const url = new URL(String(value || ''), globalThis.location?.origin || 'https://eonapp.ch');
    // Keep the diagnostic route useful while avoiding an unnecessary origin,
    // query string, or fragment in browser-local evidence.
    return (url.pathname || fallback).slice(0, 180);
  } catch {
    const raw = String(value || fallback).split(/[?#]/)[0].replace(SENSITIVE_KEY_PATTERN, '[redacted]');
    return raw.slice(0, 180) || fallback;
  }
}

export function compactTelemetryPayload(payload = {}, maxEntries = 16) {
  const safe = {};
  Object.entries(payload || {}).slice(0, Math.max(0, Number(maxEntries) || 0)).forEach(([key, value]) => {
    const cleanedKey = String(key || '').replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 40);
    if (!cleanedKey || SENSITIVE_KEY_PATTERN.test(cleanedKey)) return;
    if (typeof value === 'number') { safe[cleanedKey] = Number.isFinite(value) ? value : 0; return; }
    if (typeof value === 'boolean') { safe[cleanedKey] = value; return; }
    safe[cleanedKey] = redactTelemetryText(value, 160);
  });
  return safe;
}

export const TELEMETRY_PRIVACY_CONTRACT = Object.freeze({
  storage: 'browser-local-only',
  externalTransport: false,
  maxTextLength: 180,
  stripsQueryAndFragment: true,
  stripsCredentialLikeValues: true,
});
