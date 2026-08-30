import { jsonResponse } from '../../../../_shared/eon-auth.js';
import { prepareEonForgeGitHubRollback } from '../../../../_shared/eon-forge-github-publish.js';
import { forgePublishError, readBoundedJson, requireForgeGitHubMutation } from './_http.js';
export async function onRequestPost({request,env}) { const gate=await requireForgeGitHubMutation(request,env); if(gate.response) return gate.response; try { const input=await readBoundedJson(request); const result=await prepareEonForgeGitHubRollback(gate.config,gate.session.accountId,input); return jsonResponse(result,200); } catch(error){ return forgePublishError(error); } }
