/**
 * Institutional AI transport resilience.
 *
 * Browser-direct AI providers are untrusted network peers. This module bounds
 * batch JSON text and SSE streams before they can grow without limit in memory.
 * It contains no endpoint, prompt, provider credential, response persistence or
 * retry/fallback authority.
 */
export const EON_AI_TRANSPORT_RESILIENCE_SCHEMA = 'eonapp.ai-transport-resilience.v1';
export const EON_AI_MAX_PROVIDER_JSON_BYTES = 4 * 1024 * 1024;
export const EON_AI_MAX_PROVIDER_STREAM_BYTES = 8 * 1024 * 1024;
export const EON_AI_MAX_SSE_BUFFER_CHARS = 512 * 1024;
export const EON_AI_MIN_STREAM_OUTPUT_CHARS = 16 * 1024;
export const EON_AI_MAX_STREAM_OUTPUT_CHARS = 192 * 1024;
export const EON_AI_MAX_BATCH_OUTPUT_CHARS = 192 * 1024;
export const EON_AI_MAX_PROVIDER_ERROR_CHARS = 600;

const freeze = (value) => Object.freeze(value);

function positiveInt(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : fallback;
}

function declaredContentLength(response) {
  const value = Number(response?.headers?.get?.('content-length') || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function getEonAiStreamOutputCharLimit(maxOutputTokens = 0) {
  const tokens = Math.max(1, positiveInt(maxOutputTokens, 512));
  return Math.min(EON_AI_MAX_STREAM_OUTPUT_CHARS, Math.max(EON_AI_MIN_STREAM_OUTPUT_CHARS, tokens * 24));
}



export function sanitizeEonAiProviderErrorText(value = '', options = {}) {
  const maxChars = Math.max(64, positiveInt(options.maxChars, EON_AI_MAX_PROVIDER_ERROR_CHARS));
  return String(value || '')
    // Sanitization deliberately strips C0 controls from untrusted provider errors.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/(authorization\s*:\s*bearer\s+)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/(api[_ -]?key\s*[:=]\s*)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/\b(?:sk|gsk|xai|hf|AIza)[-_A-Za-z0-9]{12,}\b/g, '[REDACTED-CREDENTIAL]')
    .trim()
    .slice(0, maxChars);
}

export function boundEonAiBatchOutputText(text = '', options = {}) {
  const maxChars = Math.max(1, positiveInt(options.maxChars, EON_AI_MAX_BATCH_OUTPUT_CHARS));
  const normalized = String(text || '').trim();
  if (normalized.length > maxChars) throw new Error('Provider output exceeded EONAPP output limit.');
  return normalized;
}

export function appendEonAiStreamText(current = '', delta = '', options = {}) {
  const maxChars = Math.max(1, positiveInt(options.maxChars, EON_AI_MAX_STREAM_OUTPUT_CHARS));
  const next = `${String(current || '')}${String(delta || '')}`;
  if (next.length > maxChars) throw new Error('Provider stream exceeded EONAPP output limit.');
  return next;
}

export async function readEonResponseTextAtMost(response, options = {}) {
  const maxBytes = Math.max(1024, positiveInt(options.maxBytes, EON_AI_MAX_PROVIDER_JSON_BYTES));
  const label = String(options.label || 'provider response').slice(0, 80);
  const declared = declaredContentLength(response);
  if (declared > maxBytes) throw new Error(`${label} exceeded EONAPP response limit.`);

  const reader = response?.body?.getReader?.();
  if (!reader) {
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.byteLength > maxBytes) throw new Error(`${label} exceeded EONAPP response limit.`);
    return new TextDecoder().decode(buffer);
  }

  const decoder = new TextDecoder();
  let total = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = value instanceof Uint8Array ? value : new Uint8Array(value || []);
      total += chunk.byteLength;
      if (total > maxBytes) {
        try { await reader.cancel('eonapp-provider-response-limit'); } catch {}
        throw new Error(`${label} exceeded EONAPP response limit.`);
      }
      text += decoder.decode(chunk, { stream: true });
    }
    text += decoder.decode();
    return text;
  } finally {
    try { reader.releaseLock?.(); } catch {}
  }
}

/**
 * Consume an SSE body with byte and unterminated-buffer bounds. `onData` gets
 * only the data payload (without `data:`). Return false to stop after [DONE].
 */
export async function consumeEonSseAtMost(response, onData, options = {}) {
  if (typeof onData !== 'function') throw new Error('SSE consumer callback required.');
  const maxBytes = Math.max(1024, positiveInt(options.maxBytes, EON_AI_MAX_PROVIDER_STREAM_BYTES));
  const maxBufferChars = Math.max(1024, positiveInt(options.maxBufferChars, EON_AI_MAX_SSE_BUFFER_CHARS));
  const declared = declaredContentLength(response);
  if (declared > maxBytes) throw new Error('Provider stream exceeded EONAPP response limit.');
  const reader = response?.body?.getReader?.();
  if (!reader) throw new Error('Provider returned an unreadable stream body.');

  const decoder = new TextDecoder();
  let total = 0;
  let buffer = '';
  let linesRead = 0;
  let stoppedEarly = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = value instanceof Uint8Array ? value : new Uint8Array(value || []);
      total += chunk.byteLength;
      if (total > maxBytes) {
        try { await reader.cancel('eonapp-provider-stream-limit'); } catch {}
        throw new Error('Provider stream exceeded EONAPP response limit.');
      }
      buffer += decoder.decode(chunk, { stream: true });
      if (buffer.length > maxBufferChars) {
        try { await reader.cancel('eonapp-provider-sse-buffer-limit'); } catch {}
        throw new Error('Provider stream framing exceeded EONAPP buffer limit.');
      }
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const rawLine of lines) {
        const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
        if (!line.startsWith('data:')) continue;
        linesRead += 1;
        const data = line.slice(5).trimStart().trim();
        if ((await onData(data)) === false) {
          stoppedEarly = true;
          try { await reader.cancel('eonapp-sse-complete'); } catch {}
          return freeze({ bytesRead: total, linesRead, stoppedEarly });
        }
      }
    }
    buffer += decoder.decode();
    if (buffer.length > maxBufferChars) throw new Error('Provider stream framing exceeded EONAPP buffer limit.');
    if (buffer) {
      const line = buffer.endsWith('\r') ? buffer.slice(0, -1) : buffer;
      if (line.startsWith('data:')) {
        linesRead += 1;
        const data = line.slice(5).trimStart().trim();
        if ((await onData(data)) === false) stoppedEarly = true;
      }
    }
    return freeze({ bytesRead: total, linesRead, stoppedEarly });
  } finally {
    try { reader.releaseLock?.(); } catch {}
  }
}

export function getEonAiTransportResilienceTruth() {
  return freeze({
    schema: EON_AI_TRANSPORT_RESILIENCE_SCHEMA,
    batchProviderResponseByteBound: EON_AI_MAX_PROVIDER_JSON_BYTES,
    streamProviderResponseByteBound: EON_AI_MAX_PROVIDER_STREAM_BYTES,
    sseUnterminatedBufferCharBound: EON_AI_MAX_SSE_BUFFER_CHARS,
    streamOutputCharBound: EON_AI_MAX_STREAM_OUTPUT_CHARS,
    batchOutputCharBound: EON_AI_MAX_BATCH_OUTPUT_CHARS,
    providerErrorCharBound: EON_AI_MAX_PROVIDER_ERROR_CHARS,
    providerResponsePersisted: false,
    promptPersisted: false,
    credentialPersisted: false,
    hiddenRetryAllowed: false,
    providerFallbackAllowed: false
  });
}

export default freeze({
  EON_AI_TRANSPORT_RESILIENCE_SCHEMA,
  readEonResponseTextAtMost,
  boundEonAiBatchOutputText,
  sanitizeEonAiProviderErrorText,
  consumeEonSseAtMost,
  appendEonAiStreamText,
  getEonAiStreamOutputCharLimit,
  getEonAiTransportResilienceTruth
});
