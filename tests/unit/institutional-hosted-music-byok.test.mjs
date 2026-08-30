import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildDirectJobRequest } from '../../assets/js/direct-byok/direct-job-contract.js';
import { buildElevenLabsMusicComposeRequest, getElevenLabsMusicAdapterTruth, validateElevenLabsMusicInput } from '../../assets/js/direct-byok/provider-adapters/elevenlabs-music.js';
import { getDirectProvider, getDirectProviderRegistryTruth } from '../../assets/js/direct-byok/provider-registry.js';
import { DirectProviderGateway } from '../../creator-companion/src/provider-gateway.mjs';
import { CompanionPairingAuthority, getPairingTruth } from '../../creator-companion/src/pairing.mjs';

const OWNER_A = 'session:11111111-1111-4111-8111-111111111111';
const OWNER_B = 'session:22222222-2222-4222-8222-222222222222';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function memoryCredentialStore() {
  const values = new Map();
  return {
    set(name, value) { values.set(name, String(value)); },
    get(name) { return values.get(name) || ''; },
    delete(name) { values.delete(name); },
    dump() { return values; }
  };
}

function buildMusicJob(overrides = {}) {
  const built = buildDirectJobRequest({
    providerId: 'elevenlabs',
    mediaKind: 'music',
    modelId: 'elevenlabs-music-v2',
    prompt: 'Cinematic melodic electronic instrumental with warm synths',
    input: { durationMs: 30_000, instrumental: true },
    userBudget: { currency: 'USD', warningAmount: 1, hardStopAmount: 2 },
    ...overrides
  }, { explicitUserAction: true, explicitUserApproval: true, budgetConfirmed: true, now: () => 1000 });
  assert.equal(built.ok, true);
  return built.job;
}

test('Institutional hosted Music adapter is reviewed, prompt-bounded and excludes upload/inpainting rails', () => {
  const provider = getDirectProvider('elevenlabs');
  assert.ok(provider);
  assert.deepEqual(provider.capabilities, ['music']);
  assert.equal(provider.supportsCancel, false);
  assert.equal(getDirectProviderRegistryTruth().hostedMusicAdapterPresent, true);

  const job = buildMusicJob();
  const request = buildElevenLabsMusicComposeRequest(job, { remoteId: 'music_v2' }, 'sk_test_1234567890');
  assert.equal(request.method, 'POST');
  assert.equal(request.url, 'https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192');
  assert.equal(request.headers['xi-api-key'], 'sk_test_1234567890');
  const body = JSON.parse(request.body);
  assert.equal(body.model_id, 'music_v2');
  assert.equal(body.music_length_ms, 30_000);
  assert.equal(body.force_instrumental, true);
  assert.equal(body.store_for_inpainting, false);
  assert.equal(body.sign_with_c2pa, true);
  assert.equal('composition_plan' in body, false);
  assert.equal(getElevenLabsMusicAdapterTruth().realProviderProofComplete, false);

  assert.equal(validateElevenLabsMusicInput({ ...job, reference: { sizeBytes: 100, contentType: 'audio/mpeg' } }).ok, false);
  assert.equal(validateElevenLabsMusicInput({ ...job, input: { ...job.input, durationMs: 181_000 } }).ok, false);
  assert.equal(validateElevenLabsMusicInput({ ...job, input: { ...job.input, prompt: 'x'.repeat(4101) } }).ok, false);
});

test('Institutional Creator Companion keeps hosted Music key in OS vault and output in bounded memory only', async () => {
  const store = memoryCredentialStore();
  let seenRequest = null;
  let now = 10_000;
  const gateway = new DirectProviderGateway({
    rootDirectory: ROOT,
    credentialStore: store,
    now: () => now,
    fetchImpl: async (url, init) => {
      seenRequest = { url, init };
      return new Response(new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x00]), {
        status: 200,
        headers: { 'content-type': 'audio/mpeg', 'content-length': '6' }
      });
    }
  });

  const credentialResult = gateway.setCredential('elevenlabs', 'sk_test_1234567890');
  assert.deepEqual(credentialResult, { ok: true, providerId: 'elevenlabs', configured: true, credentialEchoed: false });
  assert.equal(store.dump().get('provider_elevenlabs'), 'sk_test_1234567890');
  const publicProviders = gateway.publicProviders();
  assert.equal(publicProviders.providers.find((row) => row.id === 'elevenlabs')?.credentialConfigured, true);
  assert.equal(JSON.stringify(publicProviders).includes('sk_test_1234567890'), false);

  const job = buildMusicJob();
  const result = await gateway.submit(job, { ownerId: OWNER_A });
  assert.equal(result.state, 'completed');
  assert.equal(result.result.outputAvailable, true);
  assert.equal(result.result.contentType, 'audio/mpeg');
  assert.equal(result.result.byteLength, 6);
  assert.match(seenRequest.url, /^https:\/\/api\.elevenlabs\.io\/v1\/music\?/);
  assert.equal(seenRequest.init.headers['xi-api-key'], 'sk_test_1234567890');
  assert.equal(JSON.stringify(result).includes(job.input.prompt), false);
  assert.equal(JSON.stringify(result).includes('sk_test_1234567890'), false);

  const output = gateway.output(job.jobId, { ownerId: OWNER_A });
  assert.equal(output.byteLength, 6);
  assert.equal(output.contentType, 'audio/mpeg');
  assert.deepEqual([...output.buffer], [0x49, 0x44, 0x33, 0x04, 0x00, 0x00]);
  assert.equal((await gateway.cancel(job.jobId, { ownerId: OWNER_A })).code, 'provider-cancel-not-supported');

  now += 15 * 60 * 1000 + 1;
  assert.throws(() => gateway.output(job.jobId, { ownerId: OWNER_A }), /unavailable or expired/);
  const deleted = gateway.deleteCredential('elevenlabs');
  assert.equal(deleted.configured, false);
  assert.equal(store.dump().has('provider_elevenlabs'), false);
  assert.equal(gateway.truth().hostedMusicRealProviderProofComplete, false);
});

test('Creator Companion pairing is origin-bound, replay-resistant and yields session-specific ownership ids', () => {
  const store = memoryCredentialStore();
  let now = 50_000;
  let announced = '';
  const pairing = new CompanionPairingAuthority({ credentialStore: store, now: () => now, announce: (line) => { announced = line; } });
  const started = pairing.start('https://eonapp.ch');
  const code = announced.match(/: ([0-9]{6})$/)?.[1];
  assert.match(code || '', /^[0-9]{6}$/);
  assert.throws(() => pairing.confirm('http://localhost:4173', started.challengeId, code), /expired or rejected/);
  const confirmed = pairing.confirm('https://eonapp.ch', started.challengeId, code);
  const principal = pairing.authorize('https://eonapp.ch', confirmed.sessionToken);
  assert.match(principal.sessionId, /^session:[0-9a-f-]{36}$/i);
  assert.equal(pairing.authorize('http://localhost:4173', confirmed.sessionToken), null);
  assert.throws(() => pairing.confirm('https://eonapp.ch', started.challengeId, code), /expired or rejected/);
  now = confirmed.expiresAt + 1;
  assert.equal(pairing.authorize('https://eonapp.ch', confirmed.sessionToken), null);
});

test('Creator Companion jobs and temporary audio are session-owned and raw prompts are not retained in the job map', async () => {
  const store = memoryCredentialStore();
  store.set('provider_elevenlabs', 'sk_test_1234567890');
  const gateway = new DirectProviderGateway({
    rootDirectory: ROOT,
    credentialStore: store,
    fetchImpl: async () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'audio/mpeg', 'content-length': '3' } })
  });
  const job = buildMusicJob({ jobId: 'music-owned-session-test' });
  const result = await gateway.submit(job, { ownerId: OWNER_A });
  assert.equal(result.state, 'completed');
  assert.equal(JSON.stringify(gateway.jobs.get(job.jobId)).includes(job.input.prompt), false);
  assert.equal(gateway.truth().rawPromptStoredInJobMap, false);
  assert.throws(() => gateway.output(job.jobId, { ownerId: OWNER_B }), /unavailable or expired/);
  await assert.rejects(() => gateway.read(job.jobId, { ownerId: OWNER_B }), /companion job not found/);
  await assert.rejects(() => gateway.cancel(job.jobId, { ownerId: OWNER_B }), /companion job not found/);
  assert.equal(gateway.output(job.jobId, { ownerId: OWNER_A }).byteLength, 3);
  await assert.rejects(() => gateway.submit(job, { ownerId: OWNER_B }), /job id already exists/);
});

test('Institutional hosted Music fails closed on non-audio binary and never enables reference audio', async () => {
  const store = memoryCredentialStore();
  store.set('provider_elevenlabs', 'sk_test_1234567890');
  const gateway = new DirectProviderGateway({
    rootDirectory: ROOT,
    credentialStore: store,
    fetchImpl: async () => new Response('<html>unexpected</html>', { status: 200, headers: { 'content-type': 'text/html' } })
  });
  const result = await gateway.submit(buildMusicJob(), { ownerId: OWNER_A });
  assert.equal(result.state, 'failed');
  assert.equal(gateway.truth().binaryOutputMemoryOnly, true);

  const rejected = buildDirectJobRequest({
    providerId: 'elevenlabs', mediaKind: 'music', modelId: 'elevenlabs-music-v2', prompt: 'test', input: {},
    reference: { sizeBytes: 10, contentType: 'image/png', name: 'cover.png' }
  }, { explicitUserAction: true, explicitUserApproval: true, budgetConfirmed: true });
  assert.equal(rejected.reason, 'music-reference-input-not-enabled');
});

test('Institutional hosted Music rejects unknown credential targets and oversized binary before buffering', async () => {
  const store = memoryCredentialStore();
  const gateway = new DirectProviderGateway({
    rootDirectory: ROOT,
    credentialStore: store,
    fetchImpl: async () => new Response(new Uint8Array([1]), { status: 200, headers: { 'content-type': 'audio/mpeg', 'content-length': String(161 * 1024 * 1024) } })
  });
  assert.throws(() => gateway.setCredential('evil-provider', 'secret_123456789'), /provider-not-allowlisted/);
  gateway.setCredential('elevenlabs', 'sk_test_1234567890');
  const result = await gateway.submit(buildMusicJob(), { ownerId: OWNER_A });
  assert.equal(result.state, 'failed');
  assert.throws(() => gateway.output(buildMusicJob().jobId, { ownerId: OWNER_A }), /unavailable or expired/);
});

test('Creator Companion rate-limits pairing-code creation per approved origin', () => {
  const store=memoryCredentialStore();
  const pairing=new CompanionPairingAuthority({credentialStore:store,now:()=>70_000,announce:()=>{}});
  pairing.start('https://eonapp.ch'); pairing.start('https://eonapp.ch'); pairing.start('https://eonapp.ch');
  assert.throws(()=>pairing.start('https://eonapp.ch'),/pairing start rate limited/);
  const truth=getPairingTruth();
  assert.equal(truth.maxPairStartsPerOriginWindow,3);
  assert.equal(truth.maxActiveChallengesPerOrigin,3);
});

test('Creator Companion rate-limits repeated completed provider submissions without storing prompt content', async () => {
  const store=memoryCredentialStore(); store.set('provider_elevenlabs','sk_test_1234567890');
  const gateway=new DirectProviderGateway({rootDirectory:ROOT,credentialStore:store,now:()=>80_000,fetchImpl:async()=>new Response(new Uint8Array([1,2,3]),{status:200,headers:{'content-type':'audio/mpeg','content-length':'3'}})});
  for (let index=0; index<6; index += 1) {
    const result=await gateway.submit(buildMusicJob({jobId:`music-rate-${index}`}),{ownerId:OWNER_A});
    assert.equal(result.state,'completed');
  }
  await assert.rejects(()=>gateway.submit(buildMusicJob({jobId:'music-rate-6'}),{ownerId:OWNER_A}),/submission rate limited/);
  assert.equal(gateway.truth().maxSubmissionsPerSessionWindow,6);
  assert.equal(JSON.stringify([...gateway.jobs.values()]).includes('Cinematic melodic electronic'),false);
});
