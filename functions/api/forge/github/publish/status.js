import { jsonResponse } from '../../../../_shared/eon-auth.js';
import { getEonForgeGitHubPublishStatus } from '../../../../_shared/eon-forge-github-publish.js';
import { forgePublishError, requireForgeGitHubRead } from './_http.js';
export async function onRequestGet({request,env}) { const gate=await requireForgeGitHubRead(request,env); if(gate.response) return gate.response; try { const id=new URL(request.url).searchParams.get('actionId')||''; const result=await getEonForgeGitHubPublishStatus(gate.config,gate.session.accountId,id); return jsonResponse(result,200); } catch(error){ return forgePublishError(error); } }
