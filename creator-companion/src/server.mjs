#!/usr/bin/env node
/** W626B — dependency-free loopback-only EON Creator Companion. */
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOsCredentialStore, getCredentialStoreTruth } from './credential-store.mjs';
import { CompanionPairingAuthority, getPairingTruth } from './pairing.mjs';
import { DirectProviderGateway } from './provider-gateway.mjs';
import { buildDirectJobRequest, isAllowedEonAppOrigin } from '../../assets/js/direct-byok/direct-job-contract.js';

const HOST = '127.0.0.1';
const PORT = 47826;
const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const store = createOsCredentialStore();
const pairing = new CompanionPairingAuthority({ credentialStore: store });
const gateway = new DirectProviderGateway({ rootDirectory, credentialStore: store });
const MAX_BODY = 320 * 1024;

function origin(req) { return String(req.headers.origin || ''); }
function json(res, status, payload, requestOrigin = '') {
  const body = JSON.stringify(payload);
  const cors = isAllowedEonAppOrigin(requestOrigin) ? { 'Access-Control-Allow-Origin': requestOrigin, Vary: 'Origin' } : {};
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...cors });
  res.end(body);
}
function binary(res, status, payload, requestOrigin = '') {
  const cors = isAllowedEonAppOrigin(requestOrigin) ? { 'Access-Control-Allow-Origin': requestOrigin, Vary: 'Origin' } : {};
  res.writeHead(status, { 'Content-Type': payload.contentType, 'Content-Length': payload.byteLength, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...cors });
  res.end(payload.buffer);
}
function optionsResponse(res, requestOrigin = '', req = null) {
  if (!isAllowedEonAppOrigin(requestOrigin)) return json(res, 403, { error: 'origin-rejected' }, '');
  const allowPrivateNetwork = String(req?.headers?.['access-control-request-private-network'] || '').toLowerCase() === 'true';
  res.writeHead(204, {
    'Access-Control-Allow-Origin': requestOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-EON-Companion-Session',
    'Access-Control-Max-Age': '600',
    ...(allowPrivateNetwork ? { 'Access-Control-Allow-Private-Network': 'true' } : {}),
    Vary: 'Origin, Access-Control-Request-Private-Network',
    'Cache-Control': 'no-store'
  });
  res.end();
}
async function body(req) {
  const chunks = [];
  let length = 0;
  for await (const chunk of req) { length += chunk.length; if (length > MAX_BODY) throw new Error('request body too large'); chunks.push(chunk); }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}
function principal(req) { return pairing.authorize(origin(req), req.headers['x-eon-companion-session']); }

const server = http.createServer(async (req, res) => {
  const requestOrigin = origin(req);
  try {
    if (req.method === 'OPTIONS') return optionsResponse(res, requestOrigin, req);
    if (!isAllowedEonAppOrigin(requestOrigin)) return json(res, 403, { error: 'origin-rejected' }, '');
    if (req.url === '/health' && req.method === 'GET') return json(res, 200, { schema: 'eon.creator-companion.health.w626b.v1', ok: true, host: HOST, port: PORT, signedRelease: false, secureCredentialStore: getCredentialStoreTruth(), pairing: getPairingTruth(), providerProof: 'pending' }, requestOrigin);
    if (req.url === '/v1/pair/start' && req.method === 'POST') return json(res, 200, pairing.start(requestOrigin), requestOrigin);
    if (req.url === '/v1/pair/confirm' && req.method === 'POST') { const input = await body(req); return json(res, 200, pairing.confirm(requestOrigin, input.challengeId, input.code), requestOrigin); }
    const session = principal(req);
    if (!session) return json(res, 401, { error: 'pairing-required' }, requestOrigin);
    if (req.url === '/v1/providers' && req.method === 'GET') return json(res, 200, gateway.publicProviders(), requestOrigin);
    const credentialMatch = req.url?.match(/^\/v1\/providers\/([a-z0-9._-]+)\/credential$/i);
    if (credentialMatch && req.method === 'PUT') {
      const input = await body(req);
      return json(res, 200, gateway.setCredential(credentialMatch[1], input.credential), requestOrigin);
    }
    if (credentialMatch && req.method === 'DELETE') return json(res, 200, gateway.deleteCredential(credentialMatch[1]), requestOrigin);
    if (req.url === '/v1/jobs' && req.method === 'POST') {
      const input = await body(req);
      const verdict = buildDirectJobRequest(input, { explicitUserAction: true, explicitUserApproval: input.explicitUserApproval === true, budgetConfirmed: input.budgetConfirmed === true });
      if (!verdict.ok) return json(res, 400, { error: verdict.reason }, requestOrigin);
      return json(res, 202, await gateway.submit(verdict.job, { ownerId: session.sessionId }), requestOrigin);
    }
    const cancelMatch = req.url?.match(/^\/v1\/jobs\/([A-Za-z0-9._:-]+)\/cancel$/);
    if (cancelMatch && req.method === 'POST') return json(res, 200, await gateway.cancel(cancelMatch[1], { ownerId: session.sessionId }), requestOrigin);
    const outputMatch = req.url?.match(/^\/v1\/jobs\/([A-Za-z0-9._:-]+)\/output$/);
    if (outputMatch && req.method === 'GET') return binary(res, 200, gateway.output(outputMatch[1], { ownerId: session.sessionId }), requestOrigin);
    const readMatch = req.url?.match(/^\/v1\/jobs\/([A-Za-z0-9._:-]+)$/);
    if (readMatch && req.method === 'GET') return json(res, 200, await gateway.read(readMatch[1], { ownerId: session.sessionId }), requestOrigin);
    return json(res, 404, { error: 'not-found' }, requestOrigin);
  } catch (error) { return json(res, 400, { error: String(error?.message || error).slice(0, 240) }, requestOrigin); }
});

server.listen(PORT, HOST, () => console.log(`[EON Creator Companion] listening on http://${HOST}:${PORT}`));
