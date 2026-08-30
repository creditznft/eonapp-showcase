/** RT89 — GitHub App user-token OAuth and encrypted server custody for Forge. */
import { hmacBase64Url } from './eon-auth.js';
import { EON_FORGE_GITHUB_API_VERSION, getEonForgeGitHubUser } from './eon-forge-github-api.js';

export const EON_FORGE_GITHUB_CONNECTION_SCHEMA = 'eonapp.forge.github-connection.rt89.v1';
export const EON_FORGE_GITHUB_FLOW_SECONDS = 10 * 60;
const FLOW_COOKIE = '__Host-eon_forge_github_flow';
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const freeze = Object.freeze;

function clean(value = '', max = 240) { return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max); }
function exactHttpsOrigin(value = '') { try { const url=new URL(String(value||'')); return url.protocol==='https:' && url.pathname==='/' && !url.search && !url.hash && !url.username && !url.password ? url.origin : ''; } catch { return ''; } }
function toBase64Url(bytes) { let binary=''; for(const byte of bytes instanceof Uint8Array?bytes:new Uint8Array(bytes||[])) binary+=String.fromCharCode(byte); return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,''); }
function fromBase64Url(value='') { const raw=String(value||''); if(!/^[A-Za-z0-9_-]+$/.test(raw)) throw new Error('base64url-invalid'); const padded=raw.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-(raw.length%4))%4); const binary=atob(padded); return Uint8Array.from(binary,(c)=>c.charCodeAt(0)); }
function randomToken(bytes=32){ const out=new Uint8Array(bytes); crypto.getRandomValues(out); return toBase64Url(out); }
function equalText(a='',b=''){ const left=String(a),right=String(b); let mismatch=left.length^right.length; const length=Math.max(left.length,right.length); for(let i=0;i<length;i++) mismatch|=(left.charCodeAt(i)||0)^(right.charCodeAt(i)||0); return mismatch===0; }
function readCookie(request,name){ const header=String(request?.headers?.get?.('cookie')||''); for(const part of header.split(';')){ const at=part.indexOf('='); if(at<1) continue; if(part.slice(0,at).trim()===name) return part.slice(at+1).trim(); } return ''; }
function flowCookie(value='',maxAge=EON_FORGE_GITHUB_FLOW_SECONDS){ return `${FLOW_COOKIE}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0,Math.floor(maxAge))}`; }
export function clearEonForgeGitHubFlowCookie(){ return flowCookie('',0); }

export function getEonForgeGitHubConnectionConfig(request, env={}) {
  const requestOrigin=(()=>{try{return new URL(request.url).origin;}catch{return '';}})();
  const appOrigin=exactHttpsOrigin(env.APP_ORIGIN);
  const rollout=clean(env.EON_FORGE_GITHUB_ROLLOUT,20).toLowerCase();
  const clientId=clean(env.GITHUB_APP_CLIENT_ID,180);
  const appSlug=/^[A-Za-z0-9-]{1,100}$/.test(clean(env.GITHUB_APP_SLUG,100))?clean(env.GITHUB_APP_SLUG,100):'';
  const clientSecret=String(env.GITHUB_APP_CLIENT_SECRET||'');
  const flowKey=String(env.EON_GITHUB_FLOW_SIGNING_KEY||'');
  const encryptionKey=String(env.EON_GITHUB_TOKEN_ENCRYPTION_KEY||'');
  const redirectUri=appOrigin ? `${appOrigin}/api/forge/github/callback` : '';
  const connectorsDb=env.EON_CONNECTORS_DB||null;
  const actionsDb=env.EON_ACTIONS_DB||null;
  const configured=Boolean(requestOrigin===appOrigin && ['testing','production'].includes(rollout) && clientId && clientSecret.length>=20 && flowKey.length>=32 && encryptionKey.length>=32 && connectorsDb && actionsDb);
  return freeze({ configured, rollout: configured?rollout:'disabled', appOrigin, redirectUri, appSlug, clientId:configured?clientId:'', clientSecret:configured?clientSecret:'', flowKey:configured?flowKey:'', encryptionKey:configured?encryptionKey:'', connectorsDb:configured?connectorsDb:null, actionsDb:configured?actionsDb:null });
}

export function getEonForgeGitHubConnectionTruth(config={}) {
  return freeze({ schema:EON_FORGE_GITHUB_CONNECTION_SCHEMA, available:config.configured===true, rollout:config.configured?config.rollout:'disabled', githubAppUserToken:true, patPasteRequired:false, serverEncryptedCustody:true, browserTokenExposure:false, sameOriginMutationRequired:true, dedicatedConnectorDb:true, dedicatedActionDb:true });
}

export async function createEonForgeGitHubFlow(config, accountId='') {
  const account=clean(accountId,100); if(!config?.configured||!account) throw new Error('github-flow-config-invalid');
  const flow=freeze({ version:1, accountId:account, state:randomToken(32), issuedAt:Date.now(), expiresAt:Date.now()+EON_FORGE_GITHUB_FLOW_SECONDS*1000 });
  const payload=toBase64Url(encoder.encode(JSON.stringify(flow))); const signature=await hmacBase64Url(payload,config.flowKey);
  return freeze({ flow, sealed:`${payload}.${signature}`, cookie:flowCookie(`${payload}.${signature}`) });
}
export async function readEonForgeGitHubFlow(config, request, expectedState='') {
  const serialized=readCookie(request,FLOW_COOKIE); const [payload,signature,...rest]=serialized.split('.');
  if(!payload||!signature||rest.length) throw new Error('github-flow-cookie-invalid');
  const expected=await hmacBase64Url(payload,config.flowKey); if(!equalText(signature,expected)) throw new Error('github-flow-signature-invalid');
  const flow=JSON.parse(decoder.decode(fromBase64Url(payload))); if(flow?.version!==1||!clean(flow.accountId,100)||!clean(flow.state,160)) throw new Error('github-flow-shape-invalid');
  if(Number(flow.expiresAt||0)<Date.now()) throw new Error('github-flow-expired');
  if(!equalText(clean(expectedState,160),clean(flow.state,160))) throw new Error('github-flow-state-invalid');
  return freeze({ accountId:clean(flow.accountId,100), state:clean(flow.state,160), issuedAt:Number(flow.issuedAt||0), expiresAt:Number(flow.expiresAt||0) });
}
export function buildEonForgeGitHubAuthorizeUrl(config, state='') {
  if(!config?.configured) throw new Error('github-connection-not-configured');
  const url=new URL('https://github.com/login/oauth/authorize'); url.searchParams.set('client_id',config.clientId); url.searchParams.set('redirect_uri',config.redirectUri); url.searchParams.set('state',clean(state,160)); return url.toString();
}

async function tokenCryptoKey(config){ const digest=await crypto.subtle.digest('SHA-256',encoder.encode(config.encryptionKey)); return crypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['encrypt','decrypt']); }
async function encryptTokenEnvelope(config, accountId, token){ const key=await tokenCryptoKey(config); const iv=new Uint8Array(12); crypto.getRandomValues(iv); const aad=encoder.encode(`${EON_FORGE_GITHUB_CONNECTION_SCHEMA}:${accountId}`); const plaintext=encoder.encode(JSON.stringify(token)); const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},key,plaintext)); return JSON.stringify({v:1,alg:'AES-GCM-256',iv:toBase64Url(iv),ciphertext:toBase64Url(ciphertext)}); }
async function decryptTokenEnvelope(config, accountId, envelope){ const parsed=JSON.parse(String(envelope||'')); if(parsed?.v!==1||parsed?.alg!=='AES-GCM-256') throw new Error('github-token-envelope-invalid'); const key=await tokenCryptoKey(config); const aad=encoder.encode(`${EON_FORGE_GITHUB_CONNECTION_SCHEMA}:${accountId}`); const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromBase64Url(parsed.iv),additionalData:aad},key,fromBase64Url(parsed.ciphertext)); return JSON.parse(decoder.decode(plaintext)); }

export async function exchangeEonForgeGitHubCode(config, code='', {fetchImpl=globalThis.fetch, now=Date.now()}={}) {
  const body=new URLSearchParams({client_id:config.clientId,client_secret:config.clientSecret,code:clean(code,2048),redirect_uri:config.redirectUri});
  const response=await fetchImpl('https://github.com/login/oauth/access_token',{method:'POST',headers:{accept:'application/json','content-type':'application/x-www-form-urlencoded'},body:body.toString()});
  const payload=await response.json().catch(()=>({})); if(!response.ok||payload?.error) throw new Error('github-code-exchange-failed');
  const accessToken=String(payload?.access_token||''); if(!/^ghu_[A-Za-z0-9_]{16,}$/.test(accessToken)) throw new Error('github-user-token-invalid');
  const expiresIn=Math.max(0,Number(payload?.expires_in||0)); const refreshToken=String(payload?.refresh_token||''); const refreshExpiresIn=Math.max(0,Number(payload?.refresh_token_expires_in||0));
  return freeze({accessToken,refreshToken:/^ghr_[A-Za-z0-9_]{16,}$/.test(refreshToken)?refreshToken:'',expiresAt:expiresIn?now+expiresIn*1000:null,refreshExpiresAt:refreshExpiresIn?now+refreshExpiresIn*1000:null});
}

async function persistConnection(config, accountId, user, token, now=Date.now()) {
  const envelope=await encryptTokenEnvelope(config,accountId,token); const connectionId=`github-${crypto.randomUUID()}`;
  await config.connectorsDb.prepare(`INSERT INTO eon_github_forge_connections (connection_id,account_ref,provider_account_id,provider_login,credential_envelope,token_expires_at,refresh_expires_at,status,created_at,updated_at,revoked_at) VALUES (?,?,?,?,?,?,?,?,?,?,NULL) ON CONFLICT(account_ref) DO UPDATE SET provider_account_id=excluded.provider_account_id,provider_login=excluded.provider_login,credential_envelope=excluded.credential_envelope,token_expires_at=excluded.token_expires_at,refresh_expires_at=excluded.refresh_expires_at,status='connected',updated_at=excluded.updated_at,revoked_at=NULL`).bind(connectionId,accountId,String(user.id),user.login,envelope,token.expiresAt,token.refreshExpiresAt,'connected',now,now).run();
  return freeze({connected:true,providerLogin:user.login,providerAccountId:String(user.id),tokenExpiresAt:token.expiresAt||null,refreshExpiresAt:token.refreshExpiresAt||null});
}
export async function connectEonForgeGitHubAccount(config, accountId, code, options={}) {
  const token=await exchangeEonForgeGitHubCode(config,code,options); const user=await getEonForgeGitHubUser({token:token.accessToken,fetchImpl:options.fetchImpl}); return persistConnection(config,clean(accountId,100),user,token,options.now||Date.now());
}
export async function readEonForgeGitHubConnection(config, accountId='') {
  const account=clean(accountId,100); if(!config?.configured||!account) return null;
  const row=await config.connectorsDb.prepare(`SELECT connection_id,provider_account_id,provider_login,credential_envelope,token_expires_at,refresh_expires_at,status,updated_at FROM eon_github_forge_connections WHERE account_ref=? AND status='connected' LIMIT 1`).bind(account).first();
  if(!row) return null;
  return freeze({connectionId:clean(row.connection_id,120),providerAccountId:clean(row.provider_account_id,80),providerLogin:clean(row.provider_login,100),credentialEnvelope:String(row.credential_envelope||''),tokenExpiresAt:Number(row.token_expires_at||0)||null,refreshExpiresAt:Number(row.refresh_expires_at||0)||null,updatedAt:Number(row.updated_at||0)});
}
async function refreshUserToken(config, accountId, token, {fetchImpl=globalThis.fetch,now=Date.now()}={}) {
  if(!token.refreshToken||Number(token.refreshExpiresAt||0)<=now) throw new Error('github-refresh-token-unavailable');
  const body=new URLSearchParams({client_id:config.clientId,client_secret:config.clientSecret,grant_type:'refresh_token',refresh_token:token.refreshToken});
  const response=await fetchImpl('https://github.com/login/oauth/access_token',{method:'POST',headers:{accept:'application/json','content-type':'application/x-www-form-urlencoded'},body:body.toString()}); const payload=await response.json().catch(()=>({})); if(!response.ok||payload?.error) throw new Error('github-token-refresh-failed');
  const updated={accessToken:String(payload.access_token||''),refreshToken:String(payload.refresh_token||''),expiresAt:now+Math.max(0,Number(payload.expires_in||0))*1000,refreshExpiresAt:now+Math.max(0,Number(payload.refresh_token_expires_in||0))*1000};
  if(!/^ghu_[A-Za-z0-9_]{16,}$/.test(updated.accessToken)||!/^ghr_[A-Za-z0-9_]{16,}$/.test(updated.refreshToken)) throw new Error('github-refreshed-token-invalid');
  const envelope=await encryptTokenEnvelope(config,accountId,updated); await config.connectorsDb.prepare(`UPDATE eon_github_forge_connections SET credential_envelope=?,token_expires_at=?,refresh_expires_at=?,updated_at=? WHERE account_ref=? AND status='connected'`).bind(envelope,updated.expiresAt,updated.refreshExpiresAt,now,accountId).run(); return freeze(updated);
}
export async function getEonForgeGitHubAccessToken(config, accountId, options={}) {
  const connection=await readEonForgeGitHubConnection(config,accountId); if(!connection) throw new Error('github-not-connected'); let token=await decryptTokenEnvelope(config,accountId,connection.credentialEnvelope); const now=options.now||Date.now(); if(Number(token.expiresAt||0)&&Number(token.expiresAt)<=now+60_000) token=await refreshUserToken(config,accountId,token,{...options,now}); if(!/^ghu_[A-Za-z0-9_]{16,}$/.test(String(token.accessToken||''))) throw new Error('github-user-token-invalid'); return freeze({accessToken:token.accessToken,providerLogin:connection.providerLogin,providerAccountId:connection.providerAccountId,tokenExpiresAt:Number(token.expiresAt||0)||null});
}
export async function disconnectEonForgeGitHub(config, accountId, {fetchImpl=globalThis.fetch}={}) {
  const connection=await readEonForgeGitHubConnection(config,accountId); if(!connection) return freeze({connected:false,localCredentialDeleted:false,remoteTokenRevoked:false}); let remoteTokenRevoked=false;
  try { const token=await decryptTokenEnvelope(config,accountId,connection.credentialEnvelope); const basic=btoa(`${config.clientId}:${config.clientSecret}`); const response=await fetchImpl(`https://api.github.com/applications/${encodeURIComponent(config.clientId)}/token`,{method:'DELETE',headers:{accept:'application/vnd.github+json',authorization:`Basic ${basic}`,'x-github-api-version':EON_FORGE_GITHUB_API_VERSION,'user-agent':'EONAPP-Forge'},body:JSON.stringify({access_token:token.accessToken})}); remoteTokenRevoked=response.status===204; } catch {}
  const now=Date.now(); await config.connectorsDb.prepare(`UPDATE eon_github_forge_connections SET status='revoked',credential_envelope='',revoked_at=?,updated_at=? WHERE account_ref=?`).bind(now,now,accountId).run(); return freeze({connected:false,localCredentialDeleted:true,remoteTokenRevoked});
}
