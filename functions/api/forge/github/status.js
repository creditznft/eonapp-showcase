import { getIdentityConfig, jsonResponse, readSession } from '../../../_shared/eon-auth.js';
import { getEonForgeGitHubInstallations } from '../../../_shared/eon-forge-github-api.js';
import { getEonForgeGitHubAccessToken, getEonForgeGitHubConnectionConfig, getEonForgeGitHubConnectionTruth, readEonForgeGitHubConnection } from '../../../_shared/eon-forge-github-connection.js';
export async function onRequestGet({request,env}) {
  const identity=getIdentityConfig(request,env); const session=identity.configured?await readSession(identity,request):null; const config=getEonForgeGitHubConnectionConfig(request,env); const truth=getEonForgeGitHubConnectionTruth(config);
  if(!session?.accountId) return jsonResponse({...truth,ok:true,signedIn:false,connected:false},200);
  if(!config.configured) return jsonResponse({...truth,ok:true,signedIn:true,connected:false,reason:'github-forge-not-configured'},200);
  const connection=await readEonForgeGitHubConnection(config,session.accountId);
  if(!connection) return jsonResponse({...truth,ok:true,signedIn:true,connected:false},200);
  let installation={checked:false,readyCount:0,newRepositoryReady:false,personal:null,reason:'github-installation-status-unavailable'};
  try {
    const credential=await getEonForgeGitHubAccessToken(config,session.accountId);
    const proof=await getEonForgeGitHubInstallations({token:credential.accessToken});
    const personal=(proof.installations||[]).find((item)=>String(item.account||'').toLowerCase()===String(connection.providerLogin||'').toLowerCase())||null;
    installation={checked:true,readyCount:Number(proof.readyCount||0),newRepositoryReady:Boolean(personal?.ready&&personal?.repositorySelection==='all'),personal:personal?{repositorySelection:personal.repositorySelection,ready:personal.ready===true,missingPermissions:personal.missingPermissions||[]}:null,reason:''};
  } catch {}
  const installUrl=config.appSlug?`https://github.com/apps/${config.appSlug}/installations/new`:'';
  return jsonResponse({...truth,ok:true,signedIn:true,connected:true,account:{login:connection.providerLogin,id:connection.providerAccountId,tokenExpiresAt:connection.tokenExpiresAt},installation,installUrl},200);
}
