import { enforceSameOriginMutation, getIdentityConfig, jsonResponse, readSession } from '../../../../_shared/eon-auth.js';
import { getEonForgeGitHubConnectionConfig } from '../../../../_shared/eon-forge-github-connection.js';

const MAX_BODY_BYTES = 5 * 1024 * 1024;
export async function requireForgeGitHubMutation(request, env) {
  const identity=getIdentityConfig(request,env);
  if(!identity.configured) return {response:jsonResponse({ok:false,error:'identity-unavailable'},503)};
  if(!enforceSameOriginMutation(request,identity)) return {response:jsonResponse({ok:false,error:'same-origin-required'},403)};
  const session=await readSession(identity,request); if(!session?.accountId) return {response:jsonResponse({ok:false,error:'login-required'},401)};
  const config=getEonForgeGitHubConnectionConfig(request,env); if(!config.configured) return {response:jsonResponse({ok:false,error:'github-forge-not-configured'},503)};
  return {identity,session,config};
}
export async function requireForgeGitHubRead(request, env) {
  const identity=getIdentityConfig(request,env); if(!identity.configured) return {response:jsonResponse({ok:false,error:'identity-unavailable'},503)};
  const session=await readSession(identity,request); if(!session?.accountId) return {response:jsonResponse({ok:false,error:'login-required'},401)};
  const config=getEonForgeGitHubConnectionConfig(request,env); if(!config.configured) return {response:jsonResponse({ok:false,error:'github-forge-not-configured'},503)};
  return {identity,session,config};
}
export async function readBoundedJson(request) {
  const length=Number(request.headers.get('content-length')||0); if(length>MAX_BODY_BYTES) throw new Error('forge-publish-request-too-large');
  const text=await request.text(); if(new TextEncoder().encode(text).byteLength>MAX_BODY_BYTES) throw new Error('forge-publish-request-too-large');
  try { const parsed=JSON.parse(text||'{}'); if(!parsed || typeof parsed!=='object' || Array.isArray(parsed)) throw new Error(); return parsed; } catch(error) { if(error?.message==='forge-publish-request-too-large') throw error; throw new Error('forge-publish-json-invalid'); }
}
export function forgePublishError(error) {
  const code=String(error?.message||'forge-github-action-failed').replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,160);
  const status=code.includes('not-found')?404:code.includes('login-required')?401:code.includes('same-origin')?403:code.includes('conflict')||code.includes('drift')||code.includes('invalid-status')||code.includes('not-successful')||code.includes('ci-failed')?409:code.includes('required')||code.includes('invalid')||code.includes('mismatch')||code.includes('expired')?400:503;
  return jsonResponse({ok:false,error:code},status);
}
