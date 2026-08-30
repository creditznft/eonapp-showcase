import { getIdentityConfig, readSession, redirectResponse } from '../../../_shared/eon-auth.js';
import { buildEonForgeGitHubAuthorizeUrl, createEonForgeGitHubFlow, getEonForgeGitHubConnectionConfig } from '../../../_shared/eon-forge-github-connection.js';
export async function onRequestGet({request,env}) {
  const identity=getIdentityConfig(request,env); const session=identity.configured?await readSession(identity,request):null;
  if(!session?.accountId) return redirectResponse(new URL(request.url).origin,'/api/auth/google/start?returnTo=/forge');
  const config=getEonForgeGitHubConnectionConfig(request,env); if(!config.configured) return new Response(null,{status:302,headers:{location:`${new URL(request.url).origin}/forge?github=not-configured`,'cache-control':'no-store'}});
  const created=await createEonForgeGitHubFlow(config,session.accountId);
  return new Response(null,{status:302,headers:{location:buildEonForgeGitHubAuthorizeUrl(config,created.flow.state),'set-cookie':created.cookie,'cache-control':'no-store','referrer-policy':'no-referrer'}});
}
