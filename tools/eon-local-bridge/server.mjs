#!/usr/bin/env node
/**
 * EON Local Bridge — optional user-started loopback transport.
 *
 * Security boundaries:
 * - binds only to 127.0.0.1
 * - exact origin allowlist
 * - short-lived pairing session
 * - fixed runtime ports and paths
 * - no arbitrary URL, filesystem, shell, install or model download
 * - fixed reviewed starts of already-installed runtimes only after pairing
 * - one fixed, explicit OpenAI Realtime WebRTC handshake is allowed; no generic cloud relay
 */
import http from 'node:http';
import { randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { Readable } from 'node:stream';
import { listEonLocalCompanionStartableRuntimes, startEonLocalCompanionRuntime } from './runtime-manager.mjs';
import { createEonLocalCompanionPairingManager, isEonLocalApprovalPostAllowed } from './pairing-manager.mjs';
import { createEonLocalCompanionTrustedBrowserManager } from './trusted-browser-manager.mjs';
import { readEonLocalAiReviewedModelPackJob, startEonLocalAiReviewedModelPack, stopEonLocalAiModelPackJobs } from './model-pack-manager.mjs';
import {
  EON_LOCAL_BRIDGE_DEFAULT_ORIGINS,
  EON_LOCAL_BRIDGE_ENDPOINT,
  EON_LOCAL_BRIDGE_HOST,
  EON_LOCAL_BRIDGE_PORT,
  EON_LOCAL_BRIDGE_SCHEMA,
  EON_LOCAL_BRIDGE_SESSION_MAX_AGE_MS,
  classifyEonLocalBridgeTarget
} from '../../config/eon-local-bridge-contract.mjs';

const VERSION = 'w659g.1';
const MAX_JSON_BYTES = 2_100_000;
const MAX_UPLOAD_BYTES = 32 * 1024 * 1024;
const SESSION_LIMIT = 8;
const origins = new Set(
  String(process.env.EON_BRIDGE_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .concat(EON_LOCAL_BRIDGE_DEFAULT_ORIGINS)
);
const sessions = new Map();
const attempts = new Map();
const pairingRequests = createEonLocalCompanionPairingManager();
const trustedBrowsers = createEonLocalCompanionTrustedBrowserManager();
let pairingCode = String(randomInt(100000, 1000000));

function cleanText(value = '', max = 260) {
  return [...String(value || '')]
    .filter((char) => { const code = char.charCodeAt(0); return code >= 32 && code !== 127; })
    .join('').trim().slice(0, max);
}

function originAllowed(req) {
  const origin = cleanText(req.headers.origin || '', 240);
  return Boolean(origin && origins.has(origin));
}

function cors(req, res) {
  const origin = cleanText(req.headers.origin || '', 240);
  if (origin && origins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type, accept');
    res.setHeader('Access-Control-Max-Age', '600');
    if (String(req.headers['access-control-request-private-network'] || '').toLowerCase() === 'true') {
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

function json(req, res, status, body) {
  cors(req, res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function html(req, res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Pair approval is a local same-origin form POST. Preserve its loopback
  // Referer so the approval guard can reject cross-origin submissions even in
  // browsers that omit Origin for HTML form posts. Nothing is sent off-device:
  // `same-origin` strips this value on every external navigation.
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
  res.end(String(body || ''));
}

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function localApprovalHostAllowed(req) {
  const host = cleanText(req.headers.host || '', 120).toLowerCase();
  return host === `${EON_LOCAL_BRIDGE_HOST}:${EON_LOCAL_BRIDGE_PORT}` || host === `localhost:${EON_LOCAL_BRIDGE_PORT}`;
}

function localApprovalPostAllowed(req) {
  return isEonLocalApprovalPostAllowed({
    host: req.headers.host,
    origin: req.headers.origin,
    referer: req.headers.referer,
    port: EON_LOCAL_BRIDGE_PORT
  });
}

function pairingApprovalPage(entry = {}, { approved = false, error = '' } = {}) {
  const requestId = escapeHtml(entry.requestId || '');
  const origin = escapeHtml(entry.origin || 'EONAPP');
  const message = approved
    ? '<h1>EON Local Companion connected</h1><p>Approval is complete. Return to EONAPP; this window can be closed.</p>'
    : error
      ? `<h1>Pairing request unavailable</h1><p>${escapeHtml(error)}</p>`
      : `<h1>Connect EON Local Companion?</h1><p>EONAPP at <strong>${origin}</strong> asked to use approved AI tools on this computer. This does not grant filesystem, shell, LAN or silent cloud access.</p><form method="post" action="/pair/approve"><input type="hidden" name="request" value="${requestId}"><button type="submit">Approve EONAPP</button></form><p class="muted">Approve only if you just clicked Connect Local Companion in EONAPP.</p>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EON Local Companion</title><style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:10vh auto;padding:28px;color:#f4f7fb;background:#11151b}h1{font-size:1.55rem}p{line-height:1.55;color:#cbd5e1}button{font:inherit;font-weight:700;padding:12px 18px;border:0;border-radius:10px;cursor:pointer;background:#eef4ff;color:#111827}.muted{font-size:.9rem;color:#8fa0b6}</style></head><body>${message}</body></html>`;
}

async function readJson(req) {
  let total = 0;
  const chunks = [];
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_JSON_BYTES) throw new Error('request-too-large');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function readBodyBuffer(req, maxBytes = MAX_UPLOAD_BYTES) {
  let total = 0;
  const chunks = [];
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw new Error('request-too-large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function equalSecret(a = '', b = '') {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

function pruneSessions() {
  const now = Date.now();
  for (const [token, expiry] of sessions) if (expiry <= now) sessions.delete(token);
  while (sessions.size > SESSION_LIMIT) sessions.delete(sessions.keys().next().value);
}

function bearer(req) {
  const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  return cleanText(match?.[1] || '', 180);
}

function authorized(req) {
  pruneSessions();
  const token = bearer(req);
  const expiry = sessions.get(token) || 0;
  return Boolean(token && expiry > Date.now());
}

function pairingRateAllowed(req) {
  const key = req.socket.remoteAddress || 'local';
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((value) => value > now - 60_000);
  recent.push(now);
  attempts.set(key, recent);
  return recent.length <= 8;
}

function sanitizeProxyHeaders(headers = {}) {
  const result = {};
  for (const [key, value] of Object.entries(headers && typeof headers === 'object' ? headers : {})) {
    const lower = String(key).toLowerCase();
    if (['accept', 'content-type'].includes(lower)) result[lower] = cleanText(value, 120);
  }
  return result;
}

function validProxyBody(target, body = '') {
  if (!body) return true;
  if (body.length > 2_000_000) return false;
  if (target.method !== 'POST') return false;
  try {
    const parsed = JSON.parse(body);
    if (target.runtimeId === 'comfyui' && target.pathname === '/prompt') {
      const prompt = parsed?.prompt;
      return prompt && typeof prompt === 'object' && Object.keys(prompt).length <= 180;
    }
    return parsed && typeof parsed === 'object';
  } catch {
    return false;
  }
}

async function proxyComfyUiUpload(req, res, targetUrl = '') {
  const target = classifyEonLocalBridgeTarget(targetUrl, 'POST');
  if (!target || target.runtimeId !== 'comfyui' || target.pathname !== '/upload/image') {
    return json(req, res, 400, { ok: false, error: 'upload-target-not-allowed', message: 'Only the fixed ComfyUI image-upload operation is available.' });
  }
  const contentType = cleanText(req.headers['content-type'] || '', 220);
  if (!/^multipart\/form-data;\s*boundary=/i.test(contentType)) {
    return json(req, res, 400, { ok: false, error: 'multipart-required', message: 'ComfyUI upload requires a reviewed browser-selected image.' });
  }
  let body;
  try { body = await readBodyBuffer(req); }
  catch { return json(req, res, 413, { ok: false, error: 'upload-too-large', message: 'The selected image exceeds the 32 MB local bridge limit.' }); }
  if (!body.length) return json(req, res, 400, { ok: false, error: 'empty-upload' });
  let upstream;
  try {
    upstream = await fetch(target.url, {
      method: 'POST',
      headers: { 'content-type': contentType, accept: 'application/json' },
      body,
      redirect: 'error',
      signal: AbortSignal.timeout(180_000)
    });
  } catch (error) {
    return json(req, res, 502, { ok: false, error: 'upstream-unreachable', message: cleanText(error?.cause?.code || error?.message || 'ComfyUI was not reachable.', 180) });
  }
  cors(req, res);
  res.statusCode = upstream.status;
  res.setHeader('Content-Type', cleanText(upstream.headers.get('content-type') || 'application/json', 120));
  res.setHeader('X-EON-Bridge-Runtime', 'comfyui');
  res.setHeader('X-EON-Bridge-Upstream-Status', String(upstream.status));
  if (!upstream.body) return res.end();
  Readable.fromWeb(upstream.body).pipe(res);
}


function sanitizeRealtimeSession(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const model = cleanText(source.model || 'gpt-realtime', 80);
  if (!/^gpt-realtime(?:[a-z0-9._-]*)$/i.test(model)) throw new Error('realtime-model-not-allowed');
  const instructions = cleanText(source.instructions || '', 6000);
  const locale = cleanText(source?.audio?.input?.transcription?.language || '', 20);
  return {
    type: 'realtime',
    model,
    ...(instructions ? { instructions } : {}),
    output_modalities: ['audio'],
    audio: {
      input: {
        transcription: {
          model: 'gpt-4o-mini-transcribe',
          ...(locale ? { language: locale } : {})
        }
      },
      output: { voice: 'marin' }
    }
  };
}

async function createOpenAiRealtimeCall(req, res, payload = {}) {
  const apiKey = cleanText(payload?.apiKey || '', 512);
  const sdp = String(payload?.sdp || '').trim();
  if (!apiKey || apiKey.length < 20) return json(req, res, 400, { ok: false, error: 'openai-key-required', message: 'A current user-owned OpenAI key is required for this one call.' });
  if (!sdp || sdp.length > 180_000 || !/^v=0/m.test(sdp)) return json(req, res, 400, { ok: false, error: 'invalid-sdp-offer' });
  let session;
  try { session = sanitizeRealtimeSession(payload?.session || {}); }
  catch (error) { return json(req, res, 400, { ok: false, error: cleanText(error?.message || 'invalid-realtime-session', 120) }); }
  const form = new FormData();
  form.set('sdp', new Blob([sdp], { type: 'application/sdp' }), 'offer.sdp');
  form.set('session', new Blob([JSON.stringify(session)], { type: 'application/json' }), 'session.json');
  let upstream;
  try {
    upstream = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}` },
      body: form,
      redirect: 'error',
      signal: AbortSignal.timeout(30_000)
    });
  } catch (error) {
    return json(req, res, 502, { ok: false, error: 'realtime-provider-unreachable', message: cleanText(error?.message || 'The Realtime provider was not reachable.', 180) });
  }
  const answer = await upstream.text();
  if (!upstream.ok) {
    return json(req, res, upstream.status, { ok: false, error: 'realtime-provider-rejected', message: cleanText(answer || `OpenAI returned ${upstream.status}.`, 500) });
  }
  if (!answer || answer.length > 180_000 || !/^v=0/m.test(answer)) return json(req, res, 502, { ok: false, error: 'invalid-realtime-answer' });
  return json(req, res, 201, {
    ok: true,
    sdp: answer,
    callId: cleanText(upstream.headers.get('location') || '', 180),
    model: session.model
  });
}

async function proxy(req, res, payload) {
  const target = classifyEonLocalBridgeTarget(payload?.url || '', payload?.method || 'GET');
  if (!target) return json(req, res, 400, { ok: false, error: 'target-not-allowed', message: 'Only fixed approved local AI operations are available.' });
  const body = typeof payload?.body === 'string' ? payload.body : '';
  if (!validProxyBody(target, body)) return json(req, res, 400, { ok: false, error: 'invalid-proxy-body', message: 'The local request body was rejected by the bridge policy.' });
  let upstream;
  try {
    upstream = await fetch(target.url, {
      method: target.method,
      headers: sanitizeProxyHeaders(payload?.headers),
      body: target.method === 'POST' ? body : undefined,
      redirect: 'error',
      signal: AbortSignal.timeout(180_000)
    });
  } catch (error) {
    return json(req, res, 502, { ok: false, error: 'upstream-unreachable', message: cleanText(error?.cause?.code || error?.message || 'The local AI app was not reachable.', 180) });
  }
  cors(req, res);
  res.statusCode = upstream.status;
  const contentType = cleanText(upstream.headers.get('content-type') || 'application/octet-stream', 120);
  res.setHeader('Content-Type', contentType);
  const contentLength = Number(upstream.headers.get('content-length') || 0);
  if (contentLength > 0 && contentLength <= 100_000_000) res.setHeader('Content-Length', String(contentLength));
  res.setHeader('X-EON-Bridge-Runtime', target.runtimeId);
  res.setHeader('X-EON-Bridge-Upstream-Status', String(upstream.status));
  if (!upstream.body) return res.end();
  Readable.fromWeb(upstream.body).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', EON_LOCAL_BRIDGE_ENDPOINT);

  // Code-free pairing approval is a local top-level page. It is intentionally
  // handled before the EONAPP Origin gate: top-level GET navigation has no
  // Origin header, while the approval POST must originate from this loopback page.
  if (url.pathname === '/pair/approve') {
    if (!localApprovalHostAllowed(req)) return html(req, res, 403, pairingApprovalPage({}, { error: 'This pairing page is available only on this computer.' }));
    if (req.method === 'GET') {
      const entry = pairingRequests.inspect(url.searchParams.get('request') || '');
      return html(req, res, entry.ok ? 200 : 404, pairingApprovalPage(entry.ok ? entry : {}, entry.ok ? {} : { error: 'This pairing request expired or was not found.' }));
    }
    if (req.method === 'POST') {
      if (!localApprovalPostAllowed(req)) return html(req, res, 403, pairingApprovalPage({}, { error: 'Approval must come from the EON Local Companion page itself.' }));
      let body;
      try { body = (await readBodyBuffer(req, 4096)).toString('utf8'); } catch { return html(req, res, 400, pairingApprovalPage({}, { error: 'The approval request was invalid.' })); }
      const params = new URLSearchParams(body);
      const result = pairingRequests.approve(params.get('request') || '');
      if (result.ok && result.trustedBrowser?.keyId && result.trustedBrowser?.publicKeyJwk) {
        trustedBrowsers.register(result.origin, result.trustedBrowser.keyId, result.trustedBrowser.publicKeyJwk);
      }
      return html(req, res, result.ok ? 200 : 404, pairingApprovalPage(result.ok ? result : {}, result.ok ? { approved: true } : { error: 'This pairing request expired or was not found.' }));
    }
    return html(req, res, 405, pairingApprovalPage({}, { error: 'That pairing action is not supported.' }));
  }

  cors(req, res);
  if (req.method === 'OPTIONS') {
    if (!originAllowed(req)) return json(req, res, 403, { ok: false, error: 'origin-not-allowed' });
    res.statusCode = 204;
    return res.end();
  }
  if (!originAllowed(req)) return json(req, res, 403, { ok: false, error: 'origin-not-allowed', message: 'This browser origin is not allowed to use EON Local Companion.' });
  if (req.method === 'GET' && url.pathname === '/v1/health') {
    return json(req, res, 200, { ok: true, schema: EON_LOCAL_BRIDGE_SCHEMA, version: VERSION, pairingRequired: true, operations: ['companion-pair-approval', 'trusted-browser-resume', 'runtime-model-scan', 'runtime-self-test', 'runtime-chat', 'runtime-start-reviewed', 'reviewed-model-pack-install', 'comfyui-scan', 'comfyui-job', 'comfyui-output', 'openai-realtime-call'], startableRuntimes: listEonLocalCompanionStartableRuntimes() });
  }
  if (req.method === 'POST' && url.pathname === '/v1/pair/request') {
    if (!pairingRateAllowed(req)) return json(req, res, 429, { ok: false, error: 'pairing-rate-limited', message: 'Too many pairing attempts. Wait one minute.' });
    const origin = cleanText(req.headers.origin || '', 240);
    let payload = {};
    try { payload = await readJson(req); } catch { return json(req, res, 400, { ok: false, error: 'invalid-json' }); }
    const result = pairingRequests.create(origin, payload?.trustedBrowser || null);
    if (!result.ok) return json(req, res, 400, result);
    return json(req, res, 201, {
      ...result,
      approvalUrl: `${EON_LOCAL_BRIDGE_ENDPOINT}/pair/approve?request=${encodeURIComponent(result.requestId)}`,
      message: 'Approve this connection in the EON Local Companion window.'
    });
  }
  if (req.method === 'POST' && url.pathname === '/v1/trust/challenge') {
    if (!pairingRateAllowed(req)) return json(req, res, 429, { ok: false, error: 'pairing-rate-limited', message: 'Too many Local Companion reconnect attempts. Wait one minute.' });
    let payload;
    try { payload = await readJson(req); } catch { return json(req, res, 400, { ok: false, error: 'invalid-json' }); }
    const origin = cleanText(req.headers.origin || '', 240);
    const result = trustedBrowsers.createChallenge(origin, cleanText(payload?.keyId || '', 120));
    return json(req, res, result.ok ? 201 : 404, result);
  }
  if (req.method === 'POST' && url.pathname === '/v1/trust/verify') {
    let payload;
    try { payload = await readJson(req); } catch { return json(req, res, 400, { ok: false, error: 'invalid-json' }); }
    const origin = cleanText(req.headers.origin || '', 240);
    const result = await trustedBrowsers.verifyChallenge(origin, cleanText(payload?.keyId || '', 120), cleanText(payload?.challengeId || '', 120), cleanText(payload?.signature || '', 512));
    if (!result.ok) return json(req, res, 401, result);
    const token = randomBytes(32).toString('base64url');
    const expiry = Date.now() + EON_LOCAL_BRIDGE_SESSION_MAX_AGE_MS;
    sessions.set(token, expiry);
    return json(req, res, 200, { ok: true, trusted: true, token, expiresAt: new Date(expiry).toISOString() });
  }
  if (req.method === 'POST' && url.pathname === '/v1/trust/revoke') {
    if (!authorized(req)) return json(req, res, 401, { ok: false, error: 'bridge-session-required' });
    let payload;
    try { payload = await readJson(req); } catch { return json(req, res, 400, { ok: false, error: 'invalid-json' }); }
    const origin = cleanText(req.headers.origin || '', 240);
    const result = trustedBrowsers.revoke(origin, cleanText(payload?.keyId || '', 120));
    return json(req, res, 200, result);
  }
  if (req.method === 'GET' && url.pathname === '/v1/pair/status') {
    const origin = cleanText(req.headers.origin || '', 240);
    const result = pairingRequests.consume(url.searchParams.get('request') || '', origin);
    if (!result.ok) return json(req, res, result.error === 'pair-origin-mismatch' ? 403 : 404, result);
    if (result.pending) return json(req, res, 200, result);
    const expiry = Date.now() + EON_LOCAL_BRIDGE_SESSION_MAX_AGE_MS;
    sessions.set(result.token, expiry);
    return json(req, res, 200, { ok: true, approved: true, token: result.token, expiresAt: new Date(expiry).toISOString() });
  }
  // Numeric code pairing remains an Advanced recovery path.
  if (req.method === 'POST' && url.pathname === '/v1/pair') {
    if (!pairingRateAllowed(req)) return json(req, res, 429, { ok: false, error: 'pairing-rate-limited', message: 'Too many pairing attempts. Wait one minute.' });
    let payload;
    try { payload = await readJson(req); } catch { return json(req, res, 400, { ok: false, error: 'invalid-json' }); }
    if (!equalSecret(cleanText(payload?.code || '', 12), pairingCode)) return json(req, res, 401, { ok: false, error: 'pairing-code-invalid', message: 'The pairing code did not match.' });
    const token = randomBytes(32).toString('base64url');
    const expiry = Date.now() + EON_LOCAL_BRIDGE_SESSION_MAX_AGE_MS;
    sessions.set(token, expiry);
    pairingCode = String(randomInt(100000, 1000000));
    console.log(`[EON Local Bridge] Paired. New pairing code for another browser: ${pairingCode}`);
    return json(req, res, 200, { ok: true, token, expiresAt: new Date(expiry).toISOString() });
  }
  if (req.method === 'POST' && url.pathname === '/v1/runtime/start') {
    if (!authorized(req)) return json(req, res, 401, { ok: false, error: 'bridge-session-required', message: 'Connect this browser with EON Local Companion first.' });
    let payload;
    try { payload = await readJson(req); } catch { return json(req, res, 400, { ok: false, error: 'invalid-json' }); }
    const result = await startEonLocalCompanionRuntime(cleanText(payload?.runtimeId || '', 32));
    return json(req, res, result.ok ? 202 : result.error === 'runtime-not-allowlisted' ? 400 : 409, result);
  }
  if (req.method === 'POST' && url.pathname === '/v1/model-pack/install') {
    if (!authorized(req)) return json(req, res, 401, { ok: false, error: 'bridge-session-required', message: 'Connect this browser with EON Local Companion first.' });
    let payload;
    try { payload = await readJson(req); } catch { return json(req, res, 400, { ok: false, error: 'invalid-json' }); }
    if (cleanText(payload?.confirm || '', 80) !== 'install-reviewed-model-pack') {
      return json(req, res, 400, { ok: false, error: 'model-pack-approval-required', message: 'A reviewed model pack download requires an explicit user approval.' });
    }
    const result = startEonLocalAiReviewedModelPack(cleanText(payload?.packId || '', 100));
    return json(req, res, result.ok ? 202 : 400, result);
  }
  if (req.method === 'GET' && url.pathname === '/v1/model-pack/status') {
    if (!authorized(req)) return json(req, res, 401, { ok: false, error: 'bridge-session-required', message: 'Connect this browser with EON Local Companion first.' });
    const result = readEonLocalAiReviewedModelPackJob(url.searchParams.get('job') || '');
    return json(req, res, result.ok ? 200 : 404, result);
  }
  if (req.method === 'POST' && url.pathname === '/v1/realtime/openai/call') {
    if (!authorized(req)) return json(req, res, 401, { ok: false, error: 'bridge-session-required', message: 'Pair this browser with EON Local Bridge first.' });
    let payload;
    try { payload = await readJson(req); } catch { return json(req, res, 400, { ok: false, error: 'invalid-json' }); }
    return createOpenAiRealtimeCall(req, res, payload);
  }
  if (req.method === 'POST' && url.pathname === '/v1/upload') {
    if (!authorized(req)) return json(req, res, 401, { ok: false, error: 'bridge-session-required', message: 'Pair this browser with EON Local Bridge first.' });
    return proxyComfyUiUpload(req, res, url.searchParams.get('url') || '');
  }
  if (req.method === 'POST' && url.pathname === '/v1/proxy') {
    if (!authorized(req)) return json(req, res, 401, { ok: false, error: 'bridge-session-required', message: 'Pair this browser with EON Local Bridge first.' });
    let payload;
    try { payload = await readJson(req); } catch { return json(req, res, 400, { ok: false, error: 'invalid-json' }); }
    return proxy(req, res, payload);
  }
  return json(req, res, 404, { ok: false, error: 'not-found' });
});

server.listen(EON_LOCAL_BRIDGE_PORT, EON_LOCAL_BRIDGE_HOST, () => {
  console.log('');
  console.log('EON Local Bridge is running locally.');
  console.log(`Address: ${EON_LOCAL_BRIDGE_ENDPOINT}`);
  console.log(`Pairing code: ${pairingCode}`);
  console.log('Keep this window open while using local AI. Press Ctrl+C to stop.');
  console.log('');
});

function shutdown() {
  sessions.clear();
  pairingRequests.clear();
  stopEonLocalAiModelPackJobs();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
