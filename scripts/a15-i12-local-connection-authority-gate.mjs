import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  determineLocalRuntimeLocality,
  getLocalConnectionAuthorityTruth,
  requestLocalRuntimeJson,
  saveLocalRuntimeSessionCredential
} from '../assets/js/local-ai/eon-local-connection-authority.js';
import { EON_LOCAL_BRIDGE_SESSION_KEY } from '../assets/js/local-ai/eon-local-bridge-client.js';
import {
  EON_CREATOR_COMPANION_ENDPOINT,
  EON_CREATOR_COMPANION_ROUTE_PATHS,
  getCreatorAiActionCspSources
} from '../config/eon-creator-companion-browser-contract.mjs';
import { LOCAL_AI_RUNTIME_ROUTE_PATHS, getLocalAiCspLoopbackSources } from '../config/local-ai-browser-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EVIDENCE_DIR = path.join(ROOT, 'docs/institutional/a15/evidence');
const OUTPUT = path.join(EVIDENCE_DIR, 'A15_I12_LOCAL_CONNECTION_GATE_RECEIPT.json');
const read = (relative) => readFileSync(path.join(ROOT, relative), 'utf8');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const errors = [];

class MemoryStorage {
  constructor(entries = {}) { this.map = new Map(Object.entries(entries)); }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
}

const runtimeSource = read('assets/js/chat/ai-runtime.js');
const statusSource = read('assets/js/local-ai/local-runtime-status.js');
const pageSource = read('assets/js/local-ai/local-ai-page.js');
const authoritySource = read('assets/js/local-ai/eon-local-connection-authority.js');
const bridgeSource = read('assets/js/local-ai/eon-local-bridge-client.js');
const companionSource = read('assets/js/direct-byok/companion-client.js');
const headers = read('_headers');
const publicHeaders = read('public/_headers');

if (headers !== publicHeaders) errors.push('Root and public header authorities differ.');
const localSources = getLocalAiCspLoopbackSources();
for (const source of ['http://127.0.0.1:17565', 'http://localhost:17565']) {
  if (!localSources.includes(source) || !headers.includes(source)) errors.push(`Local AI CSP is missing Bridge source ${source}.`);
}
for (const source of ['http://127.0.0.1:8001', 'http://localhost:8001']) {
  if (!localSources.includes(source) || !headers.includes(source)) errors.push(`Local AI CSP is missing ACE-Step source ${source}.`);
}
const creatorBlock = headers.match(/# A15_I12_CREATOR_COMPANION_CSP_START([\s\S]*?)# A15_I12_CREATOR_COMPANION_CSP_END/)?.[1] || '';
for (const route of EON_CREATOR_COMPANION_ROUTE_PATHS) {
  if (!creatorBlock.includes(`\n${route}\n`)) errors.push(`Creator Companion CSP is missing ${route}.`);
}
const actionSources = getCreatorAiActionCspSources();
if (!actionSources.includes(EON_CREATOR_COMPANION_ENDPOINT) || !creatorBlock.includes(EON_CREATOR_COMPANION_ENDPOINT)) errors.push('Creator Companion endpoint and AI action CSP contract differ.');
for (const source of localSources) if (!actionSources.includes(source) || !creatorBlock.includes(source)) errors.push(`Creator/City AI action CSP is missing approved Local AI source ${source}.`);
if (!creatorBlock.includes('\n/eoncity\n') || !creatorBlock.includes('\n/eoncity.html\n')) errors.push('EONCITY is missing the shared local AI/Creator action CSP.');
if (/192\.168\.|10\.0\.|172\.(?:1[6-9]|2\d|3[01])\./.test(creatorBlock)) errors.push('Creator/City AI action CSP permits an RFC1918 LAN address.');

if (!/requestLocalRuntimeJson/.test(runtimeSource) || !/requestLocalRuntimeJson/.test(statusSource)) errors.push('Active Chat or Local AI status bypasses the Local Connection Authority.');
if (/\bfetch\s*\(/.test(statusSource)) errors.push('Local runtime status still performs direct unmanaged fetches.');
const batchOnlyBlock = runtimeSource.match(/const BATCH_ONLY_PROVIDERS = new Set\(\[([^\]]+)\]\)/)?.[1] || '';
for (const providerId of ['guide', 'browserlocal', 'ollama', 'lmstudio', 'jan']) {
  if (!new RegExp(`['\"]${providerId}['\"]`).test(batchOnlyBlock)) errors.push(`Local/batch-only provider ${providerId} can still enter the generic streaming transport.`);
}
if (!/localConnectionReceipt: execution\.localConnectionReceipt/.test(runtimeSource)) errors.push('Chat does not preserve the redacted local connection receipt.');
if (!/matching-self-test-required/.test(statusSource)) errors.push('Chat selection can occur without an exact matching local self-test.');
if (!/Prove while offline/.test(pageSource) || !/Disconnect & clear/.test(pageSource)) errors.push('Local AI UI lacks explicit offline proof or disconnect/reset controls.');
if (!/allowRuntimeAuthorization/.test(bridgeSource) || !/\['ollama', 'lmstudio', 'jan', 'acestep'\]/.test(bridgeSource)) errors.push('Bridge runtime Authorization forwarding is not bounded to approved authenticated runtimes.');
if (!/eon-creator-companion-browser-contract/.test(companionSource)) errors.push('Creator Companion client does not consume the canonical browser contract.');
if (/cloudFallback:\s*true|lanAllowed:\s*true|globalThis\.localStorage|localStorage\.(?:getItem|setItem|removeItem)/i.test(authoritySource)) errors.push('Local Connection Authority weakens locality or credential custody.');

const credentialStore = new MemoryStorage();
const saved = saveLocalRuntimeSessionCredential({ runtimeId: 'lmstudio', credential: 'gate-local-credential' }, { store: credentialStore, now: () => 1000 });
let directCalls = 0;
const direct = await requestLocalRuntimeJson({
  runtimeId: 'lmstudio',
  url: 'http://127.0.0.1:1234/v1/models',
  store: credentialStore,
  fetchImpl: async (_url, options) => {
    directCalls += 1;
    if (options.headers.authorization !== 'Bearer gate-local-credential') errors.push('Direct authenticated Local AI request did not receive the session credential.');
    return new Response(JSON.stringify({ data: [{ id: 'gate-model' }] }), { status: 200 });
  },
  allowBridge: false
});
if (!saved.ok || directCalls !== 1 || direct.receipt.transport !== 'direct-browser' || !direct.receipt.authenticated) errors.push('Direct authenticated Local AI simulation failed.');
if (/gate-local-credential/.test(JSON.stringify({ saved, receipt: direct.receipt }))) errors.push('A Local AI receipt contains credential material.');

const previousSessionStorage = globalThis.sessionStorage;
const bridgeStore = new MemoryStorage();
bridgeStore.setItem(EON_LOCAL_BRIDGE_SESSION_KEY, JSON.stringify({ token: 'gate-bridge-session', expiresAt: new Date(Date.now() + 60_000).toISOString() }));
globalThis.sessionStorage = bridgeStore;
let blockedDirectCalls = 0;
let bridgeCalls = 0;
let bridgeReceipt = null;
try {
  const bridged = await requestLocalRuntimeJson({
    runtimeId: 'ollama',
    url: 'http://127.0.0.1:11434/api/tags',
    fetchImpl: async () => { blockedDirectCalls += 1; throw new TypeError('direct browser should not run while Companion succeeds'); },
    bridgeFetchImpl: async () => { bridgeCalls += 1; return new Response(JSON.stringify({ models: [] }), { status: 200 }); }
  });
  bridgeReceipt = bridged.receipt;
} finally {
  if (previousSessionStorage === undefined) delete globalThis.sessionStorage;
  else globalThis.sessionStorage = previousSessionStorage;
}
if (blockedDirectCalls !== 0 || bridgeCalls !== 1 || bridgeReceipt?.transport !== 'paired-local-companion') errors.push('Paired Companion preferred-transport simulation failed.');

let authorizationDirectCalls = 0;
let authorizationBridgeCalls = 0;
const previousSessionStorage2 = globalThis.sessionStorage;
const authorizationStore = new MemoryStorage();
authorizationStore.setItem(EON_LOCAL_BRIDGE_SESSION_KEY, JSON.stringify({ token: 'gate-bridge-session-2', expiresAt: new Date(Date.now() + 60_000).toISOString() }));
globalThis.sessionStorage = authorizationStore;
try {
  await requestLocalRuntimeJson({
    runtimeId: 'jan',
    url: 'http://127.0.0.1:1337/v1/models',
    fetchImpl: async () => { authorizationDirectCalls += 1; return new Response('{}', { status: 200 }); },
    bridgeFetchImpl: async () => { authorizationBridgeCalls += 1; return new Response('{}', { status: 401 }); }
  }).catch(() => {});
} finally {
  if (previousSessionStorage2 === undefined) delete globalThis.sessionStorage;
  else globalThis.sessionStorage = previousSessionStorage2;
}
if (authorizationDirectCalls !== 0 || authorizationBridgeCalls !== 1) errors.push('Companion HTTP authorization failure caused a hidden direct retry.');

const locality = {
  online: determineLocalRuntimeLocality({ model: 'gate-model', requestSucceeded: true, offlineProofRequested: true, networkOnline: true }),
  offline: determineLocalRuntimeLocality({ model: 'gate-model', requestSucceeded: true, offlineProofRequested: true, networkOnline: false }),
  cloudTagged: determineLocalRuntimeLocality({ model: 'gate-cloud-model', requestSucceeded: true, offlineProofRequested: true, networkOnline: false })
};
if (locality.online === 'offline-proven' || locality.offline !== 'offline-proven' || locality.cloudTagged !== 'cloud-backed-tag-blocked') errors.push('Locality truth can be overstated.');

const truth = getLocalConnectionAuthorityTruth();
if (truth.credentialStorage !== 'sessionStorage-only' || truth.cloudFallback || truth.lanAllowed || !truth.offlineLocalityClaimRequiresSuccessfulOfflineSelfTest) errors.push('Local Connection Authority truth is weaker than I12.');

const core = {
  schema: 'eonapp.a15.i12.local-connection-gate-receipt.v1',
  generatedAt: new Date().toISOString(),
  wave: 'I12',
  status: errors.length ? 'fail' : 'pass',
  authority: truth,
  routes: {
    localAiCount: LOCAL_AI_RUNTIME_ROUTE_PATHS.length,
    creatorCompanion: EON_CREATOR_COMPANION_ROUTE_PATHS,
    creatorCompanionEndpoint: EON_CREATOR_COMPANION_ENDPOINT,
    rootAndPublicHeadersMatch: headers === publicHeaders
  },
  simulations: {
    direct: direct.receipt,
    bridge: bridgeReceipt,
    httpFailure: { directCalls: authorizationDirectCalls, bridgeCalls: authorizationBridgeCalls },
    locality
  },
  sourceFiles: [
    'assets/js/local-ai/eon-local-connection-authority.js',
    'assets/js/local-ai/eon-local-bridge-client.js',
    'assets/js/local-ai/local-runtime-status.js',
    'assets/js/local-ai/local-ai-page.js',
    'assets/js/chat/ai-runtime.js',
    'assets/js/chat-page.js',
    'assets/js/direct-byok/companion-client.js',
    'config/local-ai-browser-contract.mjs',
    'config/eon-creator-companion-browser-contract.mjs',
    '_headers',
    'public/_headers'
  ],
  errors
};
const receipt = { ...core, digest: digest(JSON.stringify(core)) };
mkdirSync(EVIDENCE_DIR, { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I12] ${receipt.status.toUpperCase()}: direct, authenticated, Bridge-recovery, locality and least-privilege CSP authority verified.`);
if (errors.length) {
  for (const error of errors) console.error(`[A15 I12] ${error}`);
  process.exitCode = 1;
}
