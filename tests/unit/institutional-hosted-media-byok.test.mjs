import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { buildDirectJobRequest } from '../../assets/js/direct-byok/direct-job-contract.js';
import { buildFalResultRequest, buildFalStatusRequest, buildFalSubmitRequest, parseFalResult, parseFalSubmit, getFalAdapterTruth } from '../../assets/js/direct-byok/provider-adapters/fal.js';
import { buildReplicateStatusRequest, parseReplicatePrediction, parseReplicateResult } from '../../assets/js/direct-byok/provider-adapters/replicate.js';
import { buildProviderMediaFetchRequest, DirectProviderGateway } from '../../creator-companion/src/provider-gateway.mjs';
import { buildHostedMediaInput, getDirectMediaStudioTruth, isDirectMediaCancellationAccepted, normalizeDirectMediaProgress } from '../../assets/js/direct-byok/eon-direct-media-studio.js';
import { canRecordHostedMediaOutcome, sha256MediaBlob, verifyHostedMediaReopen } from '../../assets/js/direct-byok/eon-direct-media-proof.js';
import { recordEonCoreOutcome, listEonCoreOutcomes } from '../../assets/js/contracts/outcomes/eon-core-outcome-authority.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OWNER_A = 'session:11111111-1111-4111-8111-111111111111';
const OWNER_B = 'session:22222222-2222-4222-8222-222222222222';

function memoryCredentialStore() { const values = new Map(); return { set(k,v){values.set(k,String(v));}, get(k){return values.get(k)||'';}, delete(k){values.delete(k);}, dump(){return values;} }; }
function memoryStorage() { const values = new Map(); return { getItem:k=>values.has(k)?values.get(k):null, setItem:(k,v)=>values.set(k,String(v)), removeItem:k=>values.delete(k) }; }
function job(providerId, mediaKind, modelId, id) {
  const built = buildDirectJobRequest({ providerId, mediaKind, modelId, jobId:id, prompt:`institutional ${mediaKind} test`, input:{}, sourceSurface:`create-${mediaKind}`, safeLabel:`Hosted ${mediaKind}`, userBudget:{currency:'USD'} }, { explicitUserAction:true, explicitUserApproval:true, budgetConfirmed:true, now:()=>1000 });
  assert.equal(built.ok,true); return built.job;
}

const registry = JSON.parse(fs.readFileSync(path.join(ROOT,'config/w626-reviewed-provider-models.json'),'utf8'));

test('reviewed hosted Image/Video registry enables current prompt-first rails while real proof remains pending', () => {
  const rows = Object.fromEntries(registry.models.map((row)=>[row.id,row]));
  assert.equal(rows['fal-image-proof'].remoteId,'fal-ai/flux/schnell');
  assert.equal(rows['fal-image-proof'].enabled,true);
  assert.equal(rows['fal-video-proof'].remoteId,'bytedance/seedance-2.0/text-to-video');
  assert.deepEqual(rows['fal-video-proof'].inputModes,['text']);
  assert.equal(rows['replicate-image-proof'].remoteId,'black-forest-labs/flux-schnell');
  assert.equal(rows['replicate-video-proof'].remoteId,'bytedance/seedance-2.0');
  for (const id of ['fal-image-proof','fal-video-proof','replicate-image-proof','replicate-video-proof']) {
    assert.equal(rows[id].enabled,true);
    assert.equal(rows[id].reviewedAt, id === 'replicate-video-proof' ? '2026-08-15' : '2026-08-09');
    assert.match(rows[id].registryDigest,/proof-pending/);
    assert.equal(rows[id].costEstimate.available,false);
  }
});

test('fal request disables documented provider retries/fallback and minimizes provider retention', () => {
  const request=buildFalSubmitRequest({input:{prompt:'x'}},{remoteId:'fal-ai/flux/schnell'},'fal-key-12345678');
  assert.equal(request.headers['X-Fal-No-Retry'], '1');
  assert.equal(request.headers['X-Fal-Store-IO'], '0');
  assert.equal(request.headers['X-Fal-Request-Timeout'], '900');
  assert.equal(request.headers['x-app-fal-disable-fallback'], '1');
  assert.deepEqual(JSON.parse(request.headers['X-Fal-Object-Lifecycle-Preference']), {expiration_duration_seconds:3600});
  const truth=getFalAdapterTruth();
  assert.equal(truth.automaticPaidRetry,false); assert.equal(truth.providerAutomaticModelFallbackDisabled,true); assert.equal(truth.providerJsonRetentionControl,'disabled-per-request'); assert.equal(truth.providerMediaRetentionControl,'one-hour-lifecycle-preference');
});

test('hosted media quality controls map only reviewed bounded provider inputs', () => {
  assert.deepEqual(buildHostedMediaInput({providerId:'fal',modelId:'fal-image-proof',mediaKind:'image',aspect:'landscape_16_9',format:'png'}), {image_size:'landscape_16_9',output_format:'png',num_images:1,num_inference_steps:4,enable_safety_checker:true,acceleration:'none'});
  assert.deepEqual(buildHostedMediaInput({providerId:'replicate',modelId:'replicate-image-proof',mediaKind:'image',aspect:'9:16',format:'png'}), {aspect_ratio:'9:16',output_format:'png',num_outputs:1,num_inference_steps:4,disable_safety_checker:false,go_fast:true,megapixels:'1'});
  assert.deepEqual(buildHostedMediaInput({providerId:'fal',modelId:'fal-video-proof',mediaKind:'video',aspect:'21:9',resolution:'1080p',duration:'15',bitrateMode:'high',generateAudio:false}), {resolution:'1080p',duration:'15',aspect_ratio:'21:9',generate_audio:false,bitrate_mode:'high'});
  assert.deepEqual(buildHostedMediaInput({providerId:'replicate',modelId:'replicate-video-proof',mediaKind:'video',aspect:'9:16',resolution:'1080p',duration:'10',generateAudio:false}), {resolution:'1080p',duration:10,aspect_ratio:'9:16',generate_audio:false});
  assert.equal(buildHostedMediaInput({providerId:'replicate',modelId:'replicate-video-proof',mediaKind:'video',resolution:'4k'}).resolution,'4k');
  const bad=buildHostedMediaInput({providerId:'fal',modelId:'fal-video-proof',mediaKind:'video',aspect:'evil',resolution:'8k',duration:'999'});
  assert.equal(bad.aspect_ratio,'16:9'); assert.equal(bad.resolution,'720p'); assert.equal(bad.duration,'5');
});

test('provider operation URLs and media URLs are separate trust classes before credentials are attached', () => {
  const falModel={remoteId:'fal-ai/flux/schnell'};
  assert.throws(()=>buildFalStatusRequest({},falModel,'fal-secret','req-1','https://v3.fal.media/files/status.json'),/API endpoint rejected/);
  assert.throws(()=>parseFalSubmit({request_id:'req-1',status_url:'https://v3.fal.media/files/status.json'}),/API endpoint rejected/);
  assert.throws(()=>parseFalResult({images:[{url:'https://queue.fal.run/fal-ai/flux/schnell/requests/req-1'}]},'image'),/media endpoint rejected/);

  const repModel={remoteId:'bytedance/seedance-2.0'};
  assert.throws(()=>buildReplicateStatusRequest({},repModel,'r8-secret','pred-1','https://pbxt.replicate.delivery/status.json'),/API endpoint rejected/);
  assert.throws(()=>parseReplicatePrediction({id:'pred-1',status:'starting',urls:{get:'https://pbxt.replicate.delivery/pred-1'}}),/API endpoint rejected/);
  assert.throws(()=>parseReplicateResult({output:'https://api.replicate.com/v1/predictions/pred-1'},'video'),/media endpoint rejected/);
});

test('provider media fetch is allowlisted, kind-bound and never leaks fal credential to fal media CDN', () => {
  const fal=buildProviderMediaFetchRequest('fal','https://v3.fal.media/files/a.png','fal-super-secret','image');
  assert.equal(fal.headers.Authorization,undefined); assert.equal(fal.headers.Accept,'image/*'); assert.equal(fal.redirect,'manual');
  const rep=buildProviderMediaFetchRequest('replicate','https://pbxt.replicate.delivery/a.mp4','r8_super_secret','video');
  assert.equal(rep.headers.Authorization,'Bearer r8_super_secret'); assert.equal(rep.headers.Accept,'video/*');
  assert.throws(()=>buildProviderMediaFetchRequest('fal','https://queue.fal.run/fal-ai/flux/schnell','x','image'),/media endpoint rejected|reviewed media host/);
  assert.throws(()=>buildProviderMediaFetchRequest('replicate','https://evil.example/a.png','x','image'),/endpoint rejected/);
  assert.doesNotThrow(()=>buildProviderMediaFetchRequest('fal','https://storage.googleapis.com/falserverless/example_outputs/a.mp4','x','video'));
  assert.throws(()=>buildProviderMediaFetchRequest('fal','https://storage.googleapis.com/other-bucket/a.mp4','x','video'),/storage output path rejected/);
});

test('fal completed image is captured into session-owned Companion memory and provider URL is not returned', async () => {
  const store=memoryCredentialStore(); store.set('provider_fal','fal_secret_12345678');
  const calls=[];
  const gateway=new DirectProviderGateway({rootDirectory:ROOT,credentialStore:store,fetchImpl:async(url,init)=>{
    calls.push({url,init});
    if (url.startsWith('https://queue.fal.run/fal-ai/flux/schnell') && init.method==='POST') return Response.json({request_id:'req-img-1'});
    if (url.includes('/status')) return Response.json({status:'COMPLETED'});
    if (url==='https://queue.fal.run/fal-ai/flux/schnell/requests/req-img-1') return Response.json({images:[{url:'https://v3.fal.media/files/out.png',content_type:'image/png'}],seed:1});
    if (url==='https://v3.fal.media/files/out.png') return new Response(new Uint8Array([1,2,3,4]),{status:200,headers:{'content-type':'image/png','content-length':'4'}});
    throw new Error(`unexpected ${init.method} ${url}`);
  }});
  const j=job('fal','image','fal-image-proof','fal-image-owned');
  assert.equal((await gateway.submit({...j,input:{prompt:'institutional image test'}},{ownerId:OWNER_A})).state,'queued');
  const done=await gateway.read(j.jobId,{ownerId:OWNER_A});
  assert.equal(done.state,'completed'); assert.equal(done.result.outputAvailable,true); assert.equal(done.result.contentType,'image/png');
  assert.equal(JSON.stringify(done).includes('fal.media'),false); assert.equal(JSON.stringify(done).includes('institutional image test'),false);
  assert.equal(gateway.output(j.jobId,{ownerId:OWNER_A}).byteLength,4);
  assert.throws(()=>gateway.output(j.jobId,{ownerId:OWNER_B}),/unavailable or expired/);
  const mediaCall=calls.find((row)=>row.url.includes('fal.media'));
  assert.equal(mediaCall.init.headers.Authorization,undefined);
});

test('Replicate completed video uses protected media fetch but browser-facing result stays URL-free', async () => {
  const store=memoryCredentialStore(); store.set('provider_replicate','r8_secret_12345678');
  const calls=[];
  const gateway=new DirectProviderGateway({rootDirectory:ROOT,credentialStore:store,fetchImpl:async(url,init)=>{
    calls.push({url,init});
    if (url.includes('/models/bytedance/seedance-2.0/predictions') && init.method==='POST') return Response.json({id:'pred-v1',status:'starting',urls:{get:'https://api.replicate.com/v1/predictions/pred-v1',cancel:'https://api.replicate.com/v1/predictions/pred-v1/cancel'}});
    if (url==='https://api.replicate.com/v1/predictions/pred-v1') return Response.json({id:'pred-v1',status:'succeeded',output:'https://pbxt.replicate.delivery/out.mp4'});
    if (url==='https://pbxt.replicate.delivery/out.mp4') return new Response(new Uint8Array([9,8,7]),{status:200,headers:{'content-type':'video/mp4','content-length':'3'}});
    throw new Error(`unexpected ${init.method} ${url}`);
  }});
  const j=job('replicate','video','replicate-video-proof','rep-video-owned');
  assert.equal((await gateway.submit({...j,input:{prompt:'institutional video test'}},{ownerId:OWNER_A})).state,'queued');
  const done=await gateway.read(j.jobId,{ownerId:OWNER_A});
  assert.equal(done.state,'completed'); assert.equal(done.result.outputAvailable,true); assert.equal(done.result.contentType,'video/mp4');
  assert.equal(JSON.stringify(done).includes('replicate.delivery'),false);
  const mediaCall=calls.find((row)=>row.url.includes('replicate.delivery'));
  assert.equal(mediaCall.init.headers.Authorization,'Bearer r8_secret_12345678');
});

test('hosted media capture fails closed on redirects, wrong kind and oversized declared output', async () => {
  for (const [name,response] of [
    ['redirect',new Response(null,{status:302,headers:{location:'https://evil.example/x'}})],
    ['wrong-kind',new Response(new Uint8Array([1]),{status:200,headers:{'content-type':'video/mp4','content-length':'1'}})],
    ['oversized',new Response(new Uint8Array([1]),{status:200,headers:{'content-type':'image/png','content-length':String(161*1024*1024)}})]
  ]) {
    const store=memoryCredentialStore(); store.set('provider_fal','fal_secret_12345678');
    const gateway=new DirectProviderGateway({rootDirectory:ROOT,credentialStore:store,fetchImpl:async(url,init)=>{
      if (init.method==='POST') return Response.json({request_id:`req-${name}`});
      if (url.includes('/status')) return Response.json({status:'COMPLETED'});
      if (url.includes('/requests/')) return Response.json({images:[{url:'https://v3.fal.media/files/out.png'}]});
      return response;
    }});
    const j=job('fal','image','fal-image-proof',`fal-${name}-owned`);
    await gateway.submit({...j,input:{prompt:'x'}},{ownerId:OWNER_A});
    const result=await gateway.read(j.jobId,{ownerId:OWNER_A});
    assert.equal(result.state,'failed',name);
    assert.throws(()=>gateway.output(j.jobId,{ownerId:OWNER_A}),/unavailable or expired/,name);
  }
});

test('hosted Image/Video save receipts have source-specific native authorities and contain no private content', () => {
  for (const [kind,source] of [['creator-image-verified','eon-direct-byok-fal'],['creator-image-verified','eon-direct-byok-replicate'],['creator-video-verified','eon-direct-byok-fal'],['creator-video-verified','eon-direct-byok-replicate']]) {
    const storage=memoryStorage();
    const result=recordEonCoreOutcome({kind,route:'/create',source,receiptId:`${source}:proof`,verified:true},{storage,now:()=>12345});
    assert.equal(result.ok,true,`${kind}:${source}`);
    const row=listEonCoreOutcomes({storage})[0];
    assert.equal(row.containsPrivateContent,false); assert.equal(row.cityMaySubscribe,true); assert.match(row.nativeAuthority,/direct-byok/);
  }
});

test('canonical hosted media UI is explicit-review, cancel/save/reopen/share/remix and has no reference upload or auto-generation path', () => {
  const source=fs.readFileSync(path.join(ROOT,'assets/js/direct-byok/eon-direct-media-studio.js'),'utf8');
  assert.match(source,/data-direct-media-budget/); assert.match(source,/data-direct-media-cancel/); assert.match(source,/data-direct-media-save/); assert.match(source,/data-direct-media-reopen/); assert.match(source,/data-direct-media-reopen-file/); assert.match(source,/data-direct-media-share/); assert.match(source,/data-direct-media-remix/);
  assert.match(source,/readDirectJobOutput\(verdict\.job\.jobId, \{ expectedMediaKind: mediaKind \}\)/);
  assert.doesNotMatch(source,/data-direct-media-reference|reference:/);
  assert.match(source,/No automatic paid retry/); assert.match(source,/autoGenerate: false/); assert.match(source,/referenceUploadEnabled: false/);
  const truth=getDirectMediaStudioTruth();
  assert.equal(truth.coreReceiptOnlyAfterSaveReopenDigestMatch,true);
  assert.equal(truth.hostedVideoCoreReceiptAlsoRequiresReopenedPlaybackCompletion,true);
  assert.equal(truth.artifactProviderProvenancePinnedAtGeneration,true);
  assert.equal(truth.cancellationRequiresProviderAcknowledgement,true);
});

test('hosted media proof requires byte-identical explicit reopen and video playback before progression', async () => {
  const bytes=new Uint8Array([1,2,3,4,5,6]);
  const original=new Blob([bytes],{type:'image/png'});
  const digest=await sha256MediaBlob(original);
  assert.match(digest,/^[a-f0-9]{64}$/);
  const reopened=new Blob([bytes],{type:'image/png'});
  const ok=await verifyHostedMediaReopen(reopened,{mediaKind:'image',expectedSha256:digest,expectedBytes:bytes.byteLength});
  assert.equal(ok.verifiedReopen,true);
  const mismatch=await verifyHostedMediaReopen(new Blob([new Uint8Array([9,9,9])],{type:'image/png'}),{mediaKind:'image',expectedSha256:digest});
  assert.equal(mismatch.verifiedReopen,false);
  assert.equal(canRecordHostedMediaOutcome({mediaKind:'image',artifact:{saved:true,digestMatched:true,sha256:digest}}),true);
  assert.equal(canRecordHostedMediaOutcome({mediaKind:'video',artifact:{saved:true,digestMatched:true,sha256:digest,playbackCompleted:false}}),false);
  assert.equal(canRecordHostedMediaOutcome({mediaKind:'video',artifact:{saved:true,digestMatched:true,sha256:digest,playbackCompleted:true}}),true);
});


test('hosted media progress and cancellation are provider-authoritative rather than optimistic UI claims', () => {
  assert.deepEqual(normalizeDirectMediaProgress({ state:'running', progress:42.4, authoritativeProgress:true }), { state:'running', progress:42, authoritativeProgress:true });
  assert.deepEqual(normalizeDirectMediaProgress({ state:'queued', progress:null, authoritativeProgress:false }), { state:'queued', progress:null, authoritativeProgress:false });
  assert.equal(isDirectMediaCancellationAccepted({ state:'cancelled', code:'cancellation-requested' }), true);
  assert.equal(isDirectMediaCancellationAccepted({ state:'running', code:'provider-cancel-not-supported' }), false);
  assert.equal(isDirectMediaCancellationAccepted({ state:'failed', code:'provider-http-500' }), false);
});

test('Creator Companion bounds outstanding paid jobs per paired session and provider cancellation is terminal', async () => {
  const store=memoryCredentialStore(); store.set('provider_fal','fal_secret_12345678');
  let submitCount=0;
  const gateway=new DirectProviderGateway({rootDirectory:ROOT,credentialStore:store,now:()=>50_000,fetchImpl:async(url,init)=>{
    if (init.method==='POST' && !url.endsWith('/cancel')) { submitCount += 1; return Response.json({request_id:`req-limit-${submitCount}`}); }
    if (url.endsWith('/cancel')) return Response.json({ok:true});
    throw new Error(`unexpected ${init.method} ${url}`);
  }});
  const jobs=['limit-a','limit-b','limit-c','limit-d'].map((id)=>job('fal','image','fal-image-proof',id));
  for (let index=0; index<3; index += 1) assert.equal((await gateway.submit({...jobs[index],input:{prompt:`p${index}`}},{ownerId:OWNER_A})).state,'queued');
  await assert.rejects(()=>gateway.submit({...jobs[3],input:{prompt:'p3'}},{ownerId:OWNER_A}),/active job limit reached/);
  const cancelled=await gateway.cancel(jobs[0].jobId,{ownerId:OWNER_A});
  assert.equal(cancelled.state,'cancelled');
  assert.equal((await gateway.read(jobs[0].jobId,{ownerId:OWNER_A})).state,'cancelled');
  assert.equal((await gateway.submit({...jobs[3],input:{prompt:'p3'}},{ownerId:OWNER_A})).state,'queued');
  assert.equal(gateway.truth().maxActiveJobsPerSession,3);
  assert.equal(gateway.truth().providerCancelBecomesTerminalState,true);
});

test('Creator Companion stream-bounds provider JSON before parsing and returns only sanitized failure truth', async () => {
  const store=memoryCredentialStore(); store.set('provider_fal','fal_secret_12345678');
  const oversized='x'.repeat(2*1024*1024+32);
  const gateway=new DirectProviderGateway({rootDirectory:ROOT,credentialStore:store,fetchImpl:async()=>new Response(oversized,{status:200,headers:{'content-type':'application/json'}})});
  const j=job('fal','image','fal-image-proof','fal-json-overflow');
  const result=await gateway.submit({...j,input:{prompt:'private prompt should not echo'}},{ownerId:OWNER_A});
  assert.equal(result.state,'failed');
  assert.equal(result.rawProviderMessageIncluded,false);
  assert.doesNotMatch(JSON.stringify(result),/private prompt should not echo/);
  assert.equal(gateway.truth().maxProviderJsonBytes,2*1024*1024);
  assert.equal(gateway.truth().providerResponsesStreamBounded,true);
});
