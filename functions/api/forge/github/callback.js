import { getIdentityConfig, readSession } from '../../../_shared/eon-auth.js';
import { clearEonForgeGitHubFlowCookie, connectEonForgeGitHubAccount, getEonForgeGitHubConnectionConfig, readEonForgeGitHubFlow } from '../../../_shared/eon-forge-github-connection.js';
function back(origin,status){return new Response(null,{status:302,headers:{location:`${origin}/forge?github=${status}`,'set-cookie':clearEonForgeGitHubFlowCookie(),'cache-control':'no-store','referrer-policy':'no-referrer'}});}
export async function onRequestGet({request,env}) {
  const origin=new URL(request.url).origin; const identity=getIdentityConfig(request,env); const session=identity.configured?await readSession(identity,request):null; if(!session?.accountId) return back(origin,'login-required');
  const config=getEonForgeGitHubConnectionConfig(request,env); if(!config.configured) return back(origin,'not-configured');
  const url=new URL(request.url); const code=String(url.searchParams.get('code')||''); const state=String(url.searchParams.get('state')||''); if(!code||!state) return back(origin,'cancelled');
  try { const flow=await readEonForgeGitHubFlow(config,request,state); if(flow.accountId!==session.accountId) return back(origin,'session-changed'); await connectEonForgeGitHubAccount(config,session.accountId,code); return back(origin,'connected'); } catch { return back(origin,'connection-failed'); }
}
