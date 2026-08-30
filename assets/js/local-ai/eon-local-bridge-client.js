/** Browser client for EON Local Companion (transport-compatible with the legacy Bridge contract). */
import {
  EON_LOCAL_BRIDGE_ENDPOINT,
  EON_LOCAL_BRIDGE_SCHEMA,
  EON_LOCAL_BRIDGE_SESSION_MAX_AGE_MS,
  classifyEonLocalBridgeTarget
} from '../../../config/eon-local-bridge-contract.mjs';
import { getEonLocalAiReviewedModelPack, publicEonLocalAiModelPack } from '../../../config/local-ai-reviewed-model-packs.mjs';
import { clearEonLocalCompanionTrustCredential, eonLocalCompanionTrustRegistration, readEonLocalCompanionTrustCredential, signEonLocalCompanionChallenge } from './local-companion-trusted-browser.js';

export const EON_LOCAL_BRIDGE_SESSION_KEY = 'eon:local-ai:bridge-session:v1';

function sessionStorageSafe() {
  try { return globalThis.sessionStorage || null; } catch { return null; }
}

function cleanText(value = '', max = 260) {
  return [...String(value || '')]
    .filter((char) => { const code = char.charCodeAt(0); return code >= 32 && code !== 127; })
    .join('').trim().slice(0, max);
}

function withTimeout(promise, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('bridge-timeout')), Math.max(1000, Number(timeoutMs) || 5000));
    Promise.resolve(promise).then((value) => { clearTimeout(timer); resolve(value); }, (error) => { clearTimeout(timer); reject(error); });
  });
}

function normalizeSession(value = {}) {
  const token = cleanText(value.token || '', 180);
  const expiresAt = cleanText(value.expiresAt || '', 80);
  const expiry = Date.parse(expiresAt || '');
  if (!token || !Number.isFinite(expiry) || expiry <= Date.now()) return null;
  return Object.freeze({ schema: EON_LOCAL_BRIDGE_SCHEMA, token, expiresAt });
}

export function readEonLocalBridgeSession() {
  try {
    const raw = sessionStorageSafe()?.getItem(EON_LOCAL_BRIDGE_SESSION_KEY);
    const session = normalizeSession(raw ? JSON.parse(raw) : {});
    if (!session && raw) sessionStorageSafe()?.removeItem(EON_LOCAL_BRIDGE_SESSION_KEY);
    return session;
  } catch {
    return null;
  }
}

export function clearEonLocalBridgeSession() {
  try { sessionStorageSafe()?.removeItem(EON_LOCAL_BRIDGE_SESSION_KEY); return true; } catch { return false; }
}

export async function resumeEonLocalCompanionTrustedSession({ timeoutMs = 5000 } = {}) {
  const existing = readEonLocalBridgeSession();
  if (existing) return Object.freeze({ ok: true, session: existing, resumed: false });
  const credential = await readEonLocalCompanionTrustCredential();
  if (!credential) return Object.freeze({ ok: false, error: 'trusted-browser-unavailable' });
  try {
    const challengeResponse = await withTimeout(fetch(`${EON_LOCAL_BRIDGE_ENDPOINT}/v1/trust/challenge`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ keyId: credential.keyId }),
      cache: 'no-store'
    }), timeoutMs);
    const challenge = await challengeResponse.json().catch(() => ({}));
    if (!challengeResponse.ok || challenge?.ok !== true || !challenge?.challengeId || !challenge?.nonce) {
      return Object.freeze({ ok: false, error: cleanText(challenge?.error || `companion-http-${challengeResponse.status}`, 100) });
    }
    const signed = await signEonLocalCompanionChallenge({ challengeId: challenge.challengeId, nonce: challenge.nonce });
    if (!signed?.signature || signed.keyId !== credential.keyId) return Object.freeze({ ok: false, error: 'trusted-browser-sign-failed' });
    const verifyResponse = await withTimeout(fetch(`${EON_LOCAL_BRIDGE_ENDPOINT}/v1/trust/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ keyId: credential.keyId, challengeId: challenge.challengeId, signature: signed.signature }),
      cache: 'no-store'
    }), timeoutMs);
    const verified = await verifyResponse.json().catch(() => ({}));
    if (!verifyResponse.ok || verified?.ok !== true || !verified?.token) return Object.freeze({ ok: false, error: cleanText(verified?.error || `companion-http-${verifyResponse.status}`, 100) });
    const session = normalizeSession({ token: verified.token, expiresAt: verified.expiresAt });
    if (!session) return Object.freeze({ ok: false, error: 'invalid-bridge-session' });
    sessionStorageSafe()?.setItem(EON_LOCAL_BRIDGE_SESSION_KEY, JSON.stringify(session));
    return Object.freeze({ ok: true, session, resumed: true, message: 'EON Local Companion reconnected automatically for this trusted browser.' });
  } catch {
    return Object.freeze({ ok: false, error: 'companion-unreachable' });
  }
}

export async function ensureEonLocalCompanionSession(options = {}) {
  const current = readEonLocalBridgeSession();
  if (current) return Object.freeze({ ok: true, session: current, resumed: false });
  return resumeEonLocalCompanionTrustedSession(options);
}

export async function detectEonLocalBridge({ timeoutMs = 3500 } = {}) {
  try {
    const response = await withTimeout(fetch(`${EON_LOCAL_BRIDGE_ENDPOINT}/v1/health`, { headers: { accept: 'application/json' }, cache: 'no-store' }), timeoutMs);
    if (!response.ok) throw new Error(`bridge-http-${response.status}`);
    const payload = await response.json();
    const resumed = readEonLocalBridgeSession() ? { ok: true } : await resumeEonLocalCompanionTrustedSession({ timeoutMs });
    const paired = Boolean(readEonLocalBridgeSession());
    return Object.freeze({ ok: payload?.ok === true, paired, trustedReconnect: resumed?.resumed === true, version: cleanText(payload?.version || '', 80), message: paired ? 'EON Local Companion is connected on this computer.' : 'EON Local Companion is running. Connect it once to use protected local AI automatically.' });
  } catch {
    return Object.freeze({ ok: false, paired: false, version: '', message: 'EON Local Companion is not running. EON can still try an approved direct local connection.' });
  }
}


export async function requestEonLocalCompanionPairing({ timeoutMs = 6000 } = {}) {
  try {
    const trustedBrowser = await eonLocalCompanionTrustRegistration();
    const response = await withTimeout(fetch(`${EON_LOCAL_BRIDGE_ENDPOINT}/v1/pair/request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(trustedBrowser ? { trustedBrowser } : {}),
      cache: 'no-store'
    }), timeoutMs);
    const payload = await response.json().catch(() => ({}));
    const requestId = cleanText(payload?.requestId || '', 120);
    const approvalUrl = cleanText(payload?.approvalUrl || '', 360);
    const expiresAt = cleanText(payload?.expiresAt || '', 80);
    if (!response.ok || payload?.ok !== true || !requestId || !approvalUrl || !approvalUrl.startsWith(`${EON_LOCAL_BRIDGE_ENDPOINT}/pair/approve?`)) {
      return Object.freeze({ ok: false, error: cleanText(payload?.error || `bridge-http-${response.status}`, 80), message: cleanText(payload?.message || 'Local Companion approval could not start.', 220) });
    }
    return Object.freeze({ ok: true, requestId, approvalUrl, expiresAt, message: 'Approve EONAPP in the Local Companion window.' });
  } catch {
    return Object.freeze({ ok: false, error: 'bridge-unreachable', message: 'EON Local Companion could not be reached. Open it, then try again.' });
  }
}

export async function awaitEonLocalCompanionPairing(requestId = '', { timeoutMs = 90_000, pollMs = 650 } = {}) {
  const id = cleanText(requestId, 120);
  if (!id) return Object.freeze({ ok: false, error: 'pair-request-required', message: 'The Local Companion approval request was missing.' });
  const startedAt = Date.now();
  while (Date.now() - startedAt < Math.max(3000, Number(timeoutMs) || 90_000)) {
    try {
      const response = await withTimeout(fetch(`${EON_LOCAL_BRIDGE_ENDPOINT}/v1/pair/status?request=${encodeURIComponent(id)}`, {
        headers: { accept: 'application/json' },
        cache: 'no-store'
      }), Math.min(6000, Math.max(1500, Number(pollMs) * 3 || 2500)));
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return Object.freeze({ ok: false, error: cleanText(payload?.error || `bridge-http-${response.status}`, 80), message: 'Local Companion approval expired. Try Connect again.' });
      if (payload?.approved === true && payload?.token) {
        const maxExpiry = new Date(Date.now() + EON_LOCAL_BRIDGE_SESSION_MAX_AGE_MS).toISOString();
        const session = normalizeSession({ token: payload.token, expiresAt: payload.expiresAt || maxExpiry });
        if (!session) return Object.freeze({ ok: false, error: 'invalid-bridge-session', message: 'The Local Companion returned an invalid session. Restart it and try again.' });
        sessionStorageSafe()?.setItem(EON_LOCAL_BRIDGE_SESSION_KEY, JSON.stringify(session));
        return Object.freeze({ ok: true, session, message: 'EON Local Companion connected for this browser session.' });
      }
    } catch {
      // A transient loopback miss while the approval window opens is retryable
      // within the short foreground approval window.
    }
    await new Promise((resolve) => setTimeout(resolve, Math.max(250, Math.min(1500, Number(pollMs) || 650))));
  }
  return Object.freeze({ ok: false, error: 'pairing-approval-timeout', message: 'Approval was not completed. Click Connect Local Companion to try again.' });
}

export async function pairEonLocalCompanionWithApproval({ approvalWindow = null, timeoutMs = 90_000 } = {}) {
  const requested = await requestEonLocalCompanionPairing({ timeoutMs: 6000 });
  if (!requested.ok) {
    try { approvalWindow?.close?.(); } catch {}
    return requested;
  }
  if (approvalWindow && !approvalWindow.closed) {
    try { approvalWindow.location.replace(requested.approvalUrl); } catch { try { approvalWindow.location.href = requested.approvalUrl; } catch {} }
  } else {
    return Object.freeze({ ok: false, error: 'approval-window-required', approvalUrl: requested.approvalUrl, requestId: requested.requestId, message: 'Open the Local Companion approval window to continue.' });
  }
  const paired = await awaitEonLocalCompanionPairing(requested.requestId, { timeoutMs });
  if (paired.ok) {
    try { approvalWindow?.close?.(); } catch {}
  }
  return paired;
}

export async function forgetEonLocalCompanionTrustedBrowser({ timeoutMs = 5000 } = {}) {
  const credential = await readEonLocalCompanionTrustCredential();
  const sessionResult = await ensureEonLocalCompanionSession({ timeoutMs });
  if (credential && sessionResult?.session) {
    try {
      await withTimeout(fetch(`${EON_LOCAL_BRIDGE_ENDPOINT}/v1/trust/revoke`, {
        method: 'POST',
        headers: { authorization: `Bearer ${sessionResult.session.token}`, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ keyId: credential.keyId }),
        cache: 'no-store'
      }), timeoutMs);
    } catch {}
  }
  clearEonLocalBridgeSession();
  await clearEonLocalCompanionTrustCredential();
  return Object.freeze({ ok: true, message: 'This browser will ask for Local Companion approval next time.' });
}

// Numeric-code pairing is retained only for Advanced recovery.
export async function pairEonLocalBridge(code = '', { timeoutMs = 6000 } = {}) {
  const pairingCode = cleanText(code, 12).replace(/\D/g, '').slice(0, 8);
  if (pairingCode.length < 6) return Object.freeze({ ok: false, error: 'pairing-code-required', message: 'Enter the pairing code shown by EON Local Companion.' });
  try {
    const response = await withTimeout(fetch(`${EON_LOCAL_BRIDGE_ENDPOINT}/v1/pair`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ code: pairingCode }),
      cache: 'no-store'
    }), timeoutMs);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok !== true) return Object.freeze({ ok: false, error: cleanText(payload?.error || `bridge-http-${response.status}`, 80), message: cleanText(payload?.message || 'Pairing did not complete.', 220) });
    const maxExpiry = new Date(Date.now() + EON_LOCAL_BRIDGE_SESSION_MAX_AGE_MS).toISOString();
    const session = normalizeSession({ token: payload.token, expiresAt: payload.expiresAt || maxExpiry });
    if (!session) return Object.freeze({ ok: false, error: 'invalid-bridge-session', message: 'The Local Companion returned an invalid session. Restart it and try again.' });
    sessionStorageSafe()?.setItem(EON_LOCAL_BRIDGE_SESSION_KEY, JSON.stringify(session));
    return Object.freeze({ ok: true, session, message: 'EON Local Companion connected for this browser session.' });
  } catch {
    return Object.freeze({ ok: false, error: 'bridge-unreachable', message: 'EON Local Companion could not be reached. Open it, then try again.' });
  }
}

export async function startEonLocalCompanionRuntime(runtimeId = '', { timeoutMs = 6000 } = {}) {
  const id = cleanText(runtimeId, 32).toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!['lmstudio', 'ollama', 'comfyui'].includes(id)) {
    return Object.freeze({ ok: false, error: 'runtime-not-allowlisted', message: 'That runtime cannot be started by EON Local Companion.' });
  }
  const session = (await ensureEonLocalCompanionSession({ timeoutMs }))?.session || null;
  if (!session) return Object.freeze({ ok: false, error: 'companion-session-required', message: 'Connect EON Local Companion once, then EON can reconnect this trusted browser automatically.' });
  try {
    const response = await withTimeout(fetch(`${EON_LOCAL_BRIDGE_ENDPOINT}/v1/runtime/start`, {
      method: 'POST',
      headers: { authorization: `Bearer ${session.token}`, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ runtimeId: id }),
      cache: 'no-store'
    }), timeoutMs);
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) clearEonLocalBridgeSession();
    if (!response.ok || payload?.ok !== true) {
      const reason = cleanText(payload?.error || `companion-http-${response.status}`, 80);
      return Object.freeze({ ok: false, error: reason, message: reason === 'runtime-command-not-found' ? `${id} is not available to the Local Companion on this computer.` : 'The installed runtime could not be started automatically.' });
    }
    return Object.freeze({ ok: true, runtimeId: id, accepted: true, message: `${cleanText(payload?.label || id, 80)} start requested safely on this computer.` });
  } catch {
    return Object.freeze({ ok: false, error: 'companion-unreachable', message: 'EON Local Companion could not start that runtime.' });
  }
}


export async function installEonLocalAiReviewedModelPack(packId = '', { timeoutMs = 6000 } = {}) {
  const pack = getEonLocalAiReviewedModelPack(cleanText(packId, 100));
  if (!pack) return Object.freeze({ ok: false, error: 'model-pack-not-allowlisted', message: 'That Local AI starter pack is not approved by this EONAPP release.' });
  const session = (await ensureEonLocalCompanionSession({ timeoutMs }))?.session || null;
  if (!session) return Object.freeze({ ok: false, error: 'companion-session-required', message: 'Connect EON Local Companion once, then EON can reconnect this trusted browser automatically.' });
  try {
    const response = await withTimeout(fetch(`${EON_LOCAL_BRIDGE_ENDPOINT}/v1/model-pack/install`, {
      method: 'POST',
      headers: { authorization: `Bearer ${session.token}`, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ packId: pack.id, confirm: 'install-reviewed-model-pack' }),
      cache: 'no-store'
    }), timeoutMs);
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) clearEonLocalBridgeSession();
    if (!response.ok || payload?.ok !== true || !payload?.jobId) return Object.freeze({ ok: false, error: cleanText(payload?.error || `companion-http-${response.status}`, 100), message: cleanText(payload?.message || 'The reviewed model download could not start.', 220), pack: publicEonLocalAiModelPack(pack) });
    return Object.freeze({ ok: true, jobId: cleanText(payload.jobId, 120), status: cleanText(payload.status || 'downloading', 40), pack: publicEonLocalAiModelPack(pack), message: `Downloading ${pack.label} on this computer…` });
  } catch {
    return Object.freeze({ ok: false, error: 'companion-unreachable', message: 'EON Local Companion could not start the model download.', pack: publicEonLocalAiModelPack(pack) });
  }
}

export async function awaitEonLocalAiReviewedModelPack(jobId = '', { timeoutMs = 30 * 60_000, pollMs = 1500, onProgress = null } = {}) {
  const id = cleanText(jobId, 120);
  if (!id) return Object.freeze({ ok: false, error: 'model-pack-job-required', message: 'The model download job was missing.' });
  const session = (await ensureEonLocalCompanionSession({ timeoutMs: 5000 }))?.session || null;
  if (!session) return Object.freeze({ ok: false, error: 'companion-session-required', message: 'Connect EON Local Companion once, then EON can reconnect this trusted browser automatically.' });
  const startedAt = Date.now();
  while (Date.now() - startedAt < Math.max(5000, Number(timeoutMs) || 30 * 60_000)) {
    try {
      const response = await withTimeout(fetch(`${EON_LOCAL_BRIDGE_ENDPOINT}/v1/model-pack/status?job=${encodeURIComponent(id)}`, {
        headers: { authorization: `Bearer ${session.token}`, accept: 'application/json' },
        cache: 'no-store'
      }), 6000);
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) clearEonLocalBridgeSession();
      if (!response.ok || payload?.ok !== true) return Object.freeze({ ok: false, error: cleanText(payload?.error || `companion-http-${response.status}`, 100), message: 'The Local AI starter download could not be verified.' });
      try { onProgress?.(Object.freeze({ status: cleanText(payload.status || '', 40), pack: payload.pack || null })); } catch {}
      if (payload.status === 'completed') return Object.freeze({ ok: true, status: 'completed', pack: payload.pack || null, message: 'Local AI starter model downloaded.' });
      if (payload.status === 'failed') return Object.freeze({ ok: false, error: cleanText(payload.error || 'model-pack-download-failed', 100), pack: payload.pack || null, message: 'The Local AI starter model download failed. Your existing setup was not changed.' });
    } catch {
      // transient loopback misses are retried while the explicit foreground job is active
    }
    await new Promise((resolve) => setTimeout(resolve, Math.max(500, Math.min(5000, Number(pollMs) || 1500))));
  }
  return Object.freeze({ ok: false, error: 'model-pack-download-timeout', message: 'The model download is still not verified. Recheck Local AI; EON will reuse it if the runtime completed the download.' });
}


function sanitizedHeaders(headers = {}, target = null) {
  const source = headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers || {};
  const result = {};
  const allowRuntimeAuthorization = ['ollama', 'lmstudio', 'jan', 'acestep'].includes(String(target?.runtimeId || ''));
  for (const [key, value] of Object.entries(source)) {
    const lower = String(key).toLowerCase();
    if (['accept', 'content-type'].includes(lower)) result[lower] = cleanText(value, 120);
    else if (allowRuntimeAuthorization && lower === 'authorization') result.authorization = cleanText(value, 560);
  }
  return result;
}

export async function fetchViaEonLocalBridge(url, options = {}, { timeoutMs = 180000 } = {}) {
  const target = classifyEonLocalBridgeTarget(url, options.method || 'GET');
  if (!target) throw new Error('bridge-target-not-allowed');
  const session = (await ensureEonLocalCompanionSession({ timeoutMs: Math.min(5000, timeoutMs) }))?.session || null;
  if (!session) throw new Error('bridge-not-paired');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (isFormData) {
    if (target.runtimeId !== 'comfyui' || target.pathname !== '/upload/image' || target.method !== 'POST') throw new Error('bridge-multipart-target-not-allowed');
    const response = await withTimeout(fetch(`${EON_LOCAL_BRIDGE_ENDPOINT}/v1/upload?url=${encodeURIComponent(target.url)}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${session.token}`, accept: 'application/json' },
      body: options.body,
      signal: options.signal,
      cache: 'no-store'
    }), timeoutMs);
    if (response.status === 401) clearEonLocalBridgeSession();
    return response;
  }
  const requestBody = options.body == null ? '' : typeof options.body === 'string' ? options.body : String(options.body);
  if (requestBody.length > 2_000_000) throw new Error('bridge-request-too-large');
  const response = await withTimeout(fetch(`${EON_LOCAL_BRIDGE_ENDPOINT}/v1/proxy`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${session.token}`,
      'content-type': 'application/json',
      accept: '*/*'
    },
    body: JSON.stringify({ url: target.url, method: target.method, headers: sanitizedHeaders(options.headers, target), body: requestBody }),
    signal: options.signal,
    cache: 'no-store'
  }), timeoutMs);
  if (response.status === 401) clearEonLocalBridgeSession();
  return response;
}

export async function fetchLocalAiWithBridgeFallback(url, options = {}, bridgeOptions = {}) {
  const target = classifyEonLocalBridgeTarget(url, options.method || 'GET');
  const session = (await ensureEonLocalCompanionSession({ timeoutMs: Math.min(5000, Number(bridgeOptions?.timeoutMs) || 5000) }))?.session || null;

  // ComfyUI is intentionally Companion-first once the user has paired it.
  // This removes browser CORS/PNA configuration from the normal Creator path
  // while keeping the target restricted to the same fixed loopback contract.
  if (target?.runtimeId === 'comfyui' && session) {
    try {
      return await fetchViaEonLocalBridge(url, options, bridgeOptions);
    } catch (bridgeError) {
      // Only a transport exception falls back to direct loopback. HTTP responses
      // (including 4xx/5xx) are returned as-is and are never hidden by retries.
      try {
        return await fetch(url, options);
      } catch (directError) {
        directError.cause = bridgeError;
        throw directError;
      }
    }
  }

  try {
    return await fetch(url, options);
  } catch (directError) {
    if (!session) throw directError;
    try {
      return await fetchViaEonLocalBridge(url, options, bridgeOptions);
    } catch (bridgeError) {
      bridgeError.cause = directError;
      throw bridgeError;
    }
  }
}
