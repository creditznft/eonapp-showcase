import { enforceSameOriginMutation, getIdentityConfig, jsonResponse, readSession } from '../../../_shared/eon-auth.js';
import { disconnectEonForgeGitHub, getEonForgeGitHubConnectionConfig } from '../../../_shared/eon-forge-github-connection.js';
export async function onRequestPost({request,env}) {
  const identity=getIdentityConfig(request,env); if(!identity.configured) return jsonResponse({ok:false,error:'identity-unavailable'},503); if(!enforceSameOriginMutation(request,identity)) return jsonResponse({ok:false,error:'same-origin-required'},403); const session=await readSession(identity,request); if(!session?.accountId) return jsonResponse({ok:false,error:'login-required'},401);
  const config=getEonForgeGitHubConnectionConfig(request,env); if(!config.configured) return jsonResponse({ok:false,error:'github-forge-not-configured'},503); const result=await disconnectEonForgeGitHub(config,session.accountId); return jsonResponse({ok:true,...result},200);
}
