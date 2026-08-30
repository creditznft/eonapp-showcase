/**
 * W636 — bounded request parsing and narrow external-link validation.
 *
 * These helpers are Cloudflare/WHATWG runtime compatible. They do not log raw
 * bodies, credentials, cookies, URLs with query strings, or rejected payloads.
 */

export const EON_REQUEST_SECURITY_SCHEMA = 'eonapp.request-security.w636.v1';
export const EON_REQUEST_LIMITS = Object.freeze({
  accountMutation: 2 * 1024,
  billingMutation: 8 * 1024,
  referralMutation: 12 * 1024,
  cspReport: 12 * 1024,
  providerWebhook: 256 * 1024,
  supportCase: 20 * 1024
});

function byteLength(value = '') {
  try { return new TextEncoder().encode(String(value || '')).byteLength; }
  catch { return String(value || '').length; }
}

export function isJsonContentType(value = '') {
  const mediaType = String(value || '').split(';', 1)[0].trim().toLowerCase();
  return mediaType === 'application/json' || mediaType.endsWith('+json');
}

export async function readBoundedText(request, { maxBytes = 64 * 1024, allowEmpty = true } = {}) {
  const limit = Math.max(1, Math.floor(Number(maxBytes) || 0));
  const declaredHeader = String(request?.headers?.get?.('content-length') || '').trim();
  if (declaredHeader && !/^\d+$/.test(declaredHeader)) {
    return Object.freeze({ ok: false, status: 400, error: 'invalid_content_length', bytes: 0, text: '' });
  }
  const declared = declaredHeader ? Number(declaredHeader) : 0;
  if (Number.isFinite(declared) && declared > limit) {
    return Object.freeze({ ok: false, status: 413, error: 'request_too_large', bytes: declared, text: '' });
  }

  const body = request?.body;
  if (!body) {
    return allowEmpty
      ? Object.freeze({ ok: true, status: 200, error: '', bytes: 0, text: '' })
      : Object.freeze({ ok: false, status: 400, error: 'request_body_required', bytes: 0, text: '' });
  }

  if (typeof body.getReader !== 'function') {
    let text = '';
    try { text = await request.text(); }
    catch { return Object.freeze({ ok: false, status: 400, error: 'request_read_failed', bytes: 0, text: '' }); }
    const bytes = byteLength(text);
    if (bytes > limit) return Object.freeze({ ok: false, status: 413, error: 'request_too_large', bytes, text: '' });
    if (!allowEmpty && bytes === 0) return Object.freeze({ ok: false, status: 400, error: 'request_body_required', bytes: 0, text: '' });
    return Object.freeze({ ok: true, status: 200, error: '', bytes, text });
  }

  const reader = body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = value instanceof Uint8Array ? value : new Uint8Array(value || []);
      total += chunk.byteLength;
      if (total > limit) {
        try { await reader.cancel('request_too_large'); } catch {}
        return Object.freeze({ ok: false, status: 413, error: 'request_too_large', bytes: total, text: '' });
      }
      chunks.push(chunk);
    }
  } catch {
    return Object.freeze({ ok: false, status: 400, error: 'request_read_failed', bytes: total, text: '' });
  }
  if (!allowEmpty && total === 0) return Object.freeze({ ok: false, status: 400, error: 'request_body_required', bytes: 0, text: '' });
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let text = '';
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { return Object.freeze({ ok: false, status: 400, error: 'invalid_utf8', bytes: total, text: '' }); }
  return Object.freeze({ ok: true, status: 200, error: '', bytes: total, text });
}

export async function readBoundedJson(request, { maxBytes = 16 * 1024, allowEmpty = false, requireObject = true } = {}) {
  if (!isJsonContentType(request?.headers?.get?.('content-type') || '')) {
    return Object.freeze({ ok: false, status: 415, error: 'unsupported_media_type', bytes: 0, value: null });
  }
  const raw = await readBoundedText(request, { maxBytes, allowEmpty });
  if (!raw.ok) return Object.freeze({ ok: false, status: raw.status, error: raw.error, bytes: raw.bytes, value: null });
  try {
    const value = JSON.parse(raw.text || '{}');
    if (requireObject && (!value || typeof value !== 'object' || Array.isArray(value))) {
      return Object.freeze({ ok: false, status: 400, error: 'json_object_required', bytes: raw.bytes, value: null });
    }
    return Object.freeze({ ok: true, status: 200, error: '', bytes: raw.bytes, value });
  } catch {
    return Object.freeze({ ok: false, status: 400, error: 'invalid_json', bytes: raw.bytes, value: null });
  }
}

export function safeHttpsUrl(value = '', { allowedHosts = [], allowSubdomains = false, maxLength = 2048 } = {}) {
  const raw = String(value || '').trim();
  if (!raw || raw.length > maxLength) return '';
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    const host = url.hostname.toLowerCase();
    const hosts = allowedHosts.map((entry) => String(entry || '').trim().toLowerCase()).filter(Boolean);
    const allowed = hosts.some((candidate) => host === candidate || (allowSubdomains && host.endsWith(`.${candidate}`)));
    if (!allowed) return '';
    return url.href;
  } catch { return ''; }
}

export function safeDodoUrl(value = '') {
  // Checkout links are expected only from Dodo's dedicated checkout host.
  // Do not trust arbitrary current or future product subdomains.
  return safeHttpsUrl(value, { allowedHosts: ['checkout.dodopayments.com'] });
}

