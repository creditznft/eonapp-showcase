/** RT89 — durable, user-approved Forge -> GitHub -> CI -> Pages transaction. */
import { buildEonForgeGitHubPublishBundle, EON_FORGE_GITHUB_CONTROL_PATHS } from '../../assets/js/forge/forge-github-launch-v1.js';
import {
  createEonForgeGitHubPullRequest,
  ensureEonForgeGitHubPullRequest,
  ensureEonForgeGitHubPullRequestMerged,
  createEonForgeGitHubRepository,
  closeEonForgeGitHubPullRequest,
  deleteEonForgeGitHubBranch,
  ensureEonForgeGitHubPagesWorkflow,
  getEonForgeGitHubBranchSha,
  getEonForgeGitHubCommitTreeSha,
  getEonForgeGitHubCommitProof,
  getEonForgeGitHubManagedManifest,
  getEonForgeGitHubPullRequest,
  getEonForgeGitHubInstallations,
  getEonForgeGitHubCiStatus,
  getEonForgeGitHubPagesStatus,
  getEonForgeGitHubRepository,
  mergeEonForgeGitHubPullRequest,
  stageEonForgeGitHubBundle,
  stageEonForgeGitHubTreeRestore
} from './eon-forge-github-api.js';
import { getEonForgeGitHubAccessToken, readEonForgeGitHubConnection } from './eon-forge-github-connection.js';

export const EON_FORGE_GITHUB_PUBLISH_SCHEMA = 'eonapp.forge.github-publish.rt89.v1';
export const EON_FORGE_GITHUB_PREPARE_TTL_MS = 30 * 60 * 1000;
export const EON_FORGE_GITHUB_PUBLISH_TTL_MS = 2 * 60 * 60 * 1000;
export const EON_FORGE_GITHUB_FINAL_APPROVAL_TTL_MS = 5 * 60 * 1000;
const encoder = new TextEncoder();
const freeze = Object.freeze;

function clean(value = '', max = 180) { return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max); }
function repoPart(value = '') { const out=clean(value,100); return /^[A-Za-z0-9_.-]{1,100}$/.test(out) ? out : ''; }
function actionId(value = '') { const out=clean(value,100); return /^fgh_[A-Za-z0-9_-]{16,96}$/.test(out) ? out : ''; }
function idempotency(value = '') { const out=clean(value,120); return /^[A-Za-z0-9._:-]{12,120}$/.test(out) ? out : ''; }
function sha40(value=''){ const out=clean(value,64); return /^[a-f0-9]{40}$/i.test(out)?out:''; }
function nowMs(options={}) { return Number(options.now || Date.now()); }
function randomUrl(bytes=24){ const out=new Uint8Array(bytes); crypto.getRandomValues(out); let binary=''; for(const b of out) binary+=String.fromCharCode(b); return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,''); }
function hex(bytes){ return [...new Uint8Array(bytes)].map((b)=>b.toString(16).padStart(2,'0')).join(''); }
async function digestText(value=''){ return hex(await crypto.subtle.digest('SHA-256',encoder.encode(String(value)))); }
async function nonceHash(action,nonce){ return digestText(`${EON_FORGE_GITHUB_PUBLISH_SCHEMA}:${action}:${nonce}`); }
function normalizedFiles(files={}) { return Object.fromEntries(Object.entries(files||{}).sort(([a],[b])=>String(a).localeCompare(String(b))).map(([path,body])=>[String(path),String(body??'')])); }
async function bundleDigest(bundle, target){ return digestText(JSON.stringify({schema:EON_FORGE_GITHUB_PUBLISH_SCHEMA,title:bundle.inspection.title,files:normalizedFiles(bundle.files),target})); }
function boundedError(error){ return clean(error?.code || error?.message || 'forge-github-action-failed',160).replace(/gh[pousr]_[A-Za-z0-9_]{12,}/g,'[redacted-token]'); }
function publicReceipt(row={}) {
  return freeze({
    schema:EON_FORGE_GITHUB_PUBLISH_SCHEMA,
    actionId:clean(row.action_id,100), status:clean(row.status,32),
    projectTitle:clean(row.project_title,120), projectSlug:clean(row.project_slug,80),
    target:{mode:clean(row.target_mode,20),owner:clean(row.target_owner,100),repo:clean(row.target_repo,100),private:Number(row.target_private||0)===1},
    branchName:clean(row.branch_name,160), defaultBranch:clean(row.default_branch,160),
    beforeSha:sha40(row.before_sha), stagedSha:sha40(row.staged_sha), mergedSha:sha40(row.merged_sha),
    pullRequest:Number(row.pull_number||0)?{number:Number(row.pull_number),url:clean(row.pr_url,300)}:null,
    reviewCi:Number(row.review_ci_run_id||0)?{runId:Number(row.review_ci_run_id),url:clean(row.review_ci_url,300)}:null,
    deployRun:Number(row.deploy_run_id||0)?{runId:Number(row.deploy_run_id),url:clean(row.deploy_run_url,300)}:null,
    pagesUrl:clean(row.pages_url,300), fileCount:Number(row.file_count||0), totalBytes:Number(row.total_bytes||0),
    expiresAt:Number(row.expires_at||0), updatedAt:Number(row.updated_at||0),
    rollback:sha40(row.before_sha)?{
      available:true,beforeSha:sha40(row.before_sha),mode:'reviewed-exact-pre-forge-tree',verification:'immutable-git-tree',status:clean(row.rollback_status,32),
      branchName:clean(row.rollback_branch_name,160),stagedSha:sha40(row.rollback_sha),restoreTreeSha:sha40(row.rollback_restore_tree_sha),mergedSha:sha40(row.rollback_merged_sha),
      pullRequest:Number(row.rollback_pull_number||0)?{number:Number(row.rollback_pull_number),url:clean(row.rollback_pr_url,300)}:null,
      ci:Number(row.rollback_ci_run_id||0)?{runId:Number(row.rollback_ci_run_id),url:clean(row.rollback_ci_url,300)}:null,
      deployRun:Number(row.rollback_deploy_run_id||0)?{runId:Number(row.rollback_deploy_run_id),url:clean(row.rollback_deploy_run_url,300)}:null,
      startedAt:Number(row.rollback_started_at||0),completedAt:Number(row.rollback_completed_at||0)
    }:{available:false,beforeSha:'',mode:'not-yet-available',verification:'',status:'',branchName:'',stagedSha:'',restoreTreeSha:'',mergedSha:'',pullRequest:null,ci:null,deployRun:null,startedAt:0,completedAt:0},
    lastError:clean(row.last_error,160), credentialsExposed:false, forcePushUsed:false
  });
}
async function readAction(db, account, id){ return db.prepare('SELECT * FROM eon_forge_github_publish_actions WHERE action_id=? AND account_ref=? LIMIT 1').bind(id,account).first(); }
async function readIdempotent(db, account, key){ return db.prepare('SELECT * FROM eon_forge_github_publish_actions WHERE account_ref=? AND idempotency_key=? LIMIT 1').bind(account,key).first(); }
async function setFailure(db,row,error,status='failed',now=Date.now()){
  const code=boundedError(error); await db.prepare('UPDATE eon_forge_github_publish_actions SET status=?,last_error=?,updated_at=? WHERE action_id=? AND account_ref=?').bind(status,code,now,row.action_id,row.account_ref).run(); return code;
}
function assertConfigured(config, account){ if(!config?.configured || !config.actionsDb) throw new Error('github-forge-publish-not-configured'); const safe=clean(account,100); if(!safe) throw new Error('github-forge-account-required'); return safe; }
function targetShape(input={},connection=null){
  const mode=String(input?.mode||'existing').toLowerCase(); if(!['existing','new'].includes(mode)) throw new Error('github-target-mode-invalid');
  const repo=repoPart(input?.repo); if(!repo) throw new Error('github-target-repository-invalid');
  const owner=mode==='new' ? repoPart(connection?.providerLogin) : repoPart(input?.owner);
  if(!owner) throw new Error('github-target-owner-invalid');
  return freeze({mode,owner,repo,private:input?.private===true});
}
function requireNonce(row, raw, field){ const nonce=String(raw||''); if(nonce.length<20) throw new Error('github-action-approval-nonce-required'); return nonceHash(row.action_id,nonce).then((hash)=>{if(hash!==String(row[field]||'')) throw new Error('github-action-approval-nonce-invalid');}); }
async function expiringNonceEnvelope(action,nonce,now){ return `${now+EON_FORGE_GITHUB_FINAL_APPROVAL_TTL_MS}:${await nonceHash(action,nonce)}`; }
async function requireExpiringNonce(row,raw,field,action,now){
  const nonce=String(raw||''); if(nonce.length<20) throw new Error('github-action-approval-nonce-required');
  const [expiresRaw,expected,...rest]=String(row[field]||'').split(':'); const expires=Number(expiresRaw||0);
  if(rest.length || !Number.isFinite(expires) || expires<=0 || !expected) throw new Error('github-action-approval-nonce-invalid');
  if(expires<now) throw new Error('github-action-approval-nonce-expired');
  if(await nonceHash(action,nonce)!==expected) throw new Error('github-action-approval-nonce-invalid');
}
function assertLive(row,now){ if(Number(row?.expires_at||0)<now) throw new Error('github-action-expired'); }
function transitionChanged(result){ return Number(result?.meta?.changes ?? result?.changes ?? 1) === 1; }
async function transitionAction(db, sql, args, conflict='github-action-concurrent-transition'){ const result=await db.prepare(sql).bind(...args).run(); if(!transitionChanged(result)) throw new Error(conflict); return result; }

export async function prepareEonForgeGitHubPublish(config, accountId, input={}, options={}) {
  const account=assertConfigured(config,accountId); const connection=await (options.readConnection || readEonForgeGitHubConnection)(config,account); if(!connection) throw new Error('github-not-connected');
  const key=idempotency(input.idempotencyKey); if(!key) throw new Error('github-action-idempotency-key-required');
  const target=targetShape(input.target,connection); const branchNonce=randomUrl(8); const bundle=buildEonForgeGitHubPublishBundle({title:input.title,files:input.files,sourceCheckPassed:input.sourceCheckPassed===true,nonce:branchNonce});
  if(!bundle.ok) { const error=new Error(bundle.reason || bundle.inspection?.blockers?.[0] || 'github-forge-project-not-publishable'); error.details=bundle.inspection?.blockers||[]; throw error; }
  const digest=await bundleDigest(bundle,target); const now=nowMs(options); const existing=await readIdempotent(config.actionsDb,account,key);
  if(existing){
    if(String(existing.payload_digest)!==digest || String(existing.target_mode)!==target.mode || String(existing.target_owner)!==target.owner || String(existing.target_repo)!==target.repo) throw new Error('github-action-idempotency-conflict');
    if(String(existing.status)!=='prepared') return freeze({ok:true,idempotent:true,receipt:publicReceipt(existing),stageApprovalNonce:''});
    assertLive(existing,now); const nonce=randomUrl(24); const hash=await nonceHash(existing.action_id,nonce); await config.actionsDb.prepare('UPDATE eon_forge_github_publish_actions SET stage_nonce_hash=?,updated_at=? WHERE action_id=? AND account_ref=?').bind(hash,now,existing.action_id,account).run(); const refreshed=await readAction(config.actionsDb,account,existing.action_id); return freeze({ok:true,idempotent:true,receipt:publicReceipt(refreshed),stageApprovalNonce:nonce});
  }
  const id=`fgh_${crypto.randomUUID().replace(/-/g,'')}`; const nonce=randomUrl(24); const stageHash=await nonceHash(id,nonce); const expires=now+EON_FORGE_GITHUB_PREPARE_TTL_MS;
  await config.actionsDb.prepare(`INSERT INTO eon_forge_github_publish_actions (action_id,account_ref,idempotency_key,project_title,project_slug,payload_digest,file_count,total_bytes,target_mode,target_owner,target_repo,target_private,repo_created,default_branch,branch_name,status,stage_nonce_hash,publish_nonce_hash,created_at,updated_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,'',?,'prepared',?,'',?,?,?)`).bind(id,account,key,bundle.inspection.title,bundle.inspection.projectSlug,digest,bundle.fileCount,bundle.inspection.totalBytes,target.mode,target.owner,target.repo,target.private?1:0,bundle.branchName,stageHash,now,now,expires).run();
  const row=await readAction(config.actionsDb,account,id); return freeze({ok:true,idempotent:false,receipt:publicReceipt(row),stageApprovalNonce:nonce});
}

export async function stageEonForgeGitHubPublish(config, accountId, input={}, options={}) {
  const account=assertConfigured(config,accountId); const id=actionId(input.actionId); if(!id) throw new Error('github-action-id-required'); const row=await readAction(config.actionsDb,account,id); if(!row) throw new Error('github-action-not-found'); const now=nowMs(options); assertLive(row,now);
  if(row.status==='staged') return freeze({ok:true,idempotent:true,receipt:publicReceipt(row),publishApprovalNonce:''});
  if(!['prepared','staging'].includes(row.status)) throw new Error(`github-action-stage-invalid-status:${clean(row.status,32)}`);
  if(input.confirm!=='stage-reviewed-bundle') throw new Error('github-action-stage-confirmation-required'); await requireNonce(row,input.approvalNonce,'stage_nonce_hash');
  const target=freeze({mode:row.target_mode,owner:row.target_owner,repo:row.target_repo,private:Number(row.target_private||0)===1}); const bundle=buildEonForgeGitHubPublishBundle({title:input.title,files:input.files,sourceCheckPassed:input.sourceCheckPassed===true,nonce:row.branch_name.split('-').at(-1)});
  if(!bundle.ok) throw new Error(bundle.reason || bundle.inspection?.blockers?.[0] || 'github-forge-project-not-publishable'); const digest=await bundleDigest(bundle,target); if(digest!==String(row.payload_digest)) throw new Error('github-action-bundle-digest-mismatch');
  if(row.status==='prepared') await transitionAction(config.actionsDb, "UPDATE eon_forge_github_publish_actions SET status='staging',last_error='',updated_at=? WHERE action_id=? AND account_ref=? AND status='prepared'", [now,id,account]);
  try {
    const credential=await (options.getAccessToken || getEonForgeGitHubAccessToken)(config,account,options); const api=options.githubApi||{}; let repository;
    if(row.target_mode==='new' && Number(row.repo_created||0)!==1){
      const installations=await (api.getInstallations || getEonForgeGitHubInstallations)({token:credential.accessToken,fetchImpl:options.fetchImpl});
      const personalInstall=(installations.installations||[]).find((item)=>String(item.account||'').toLowerCase()===String(row.target_owner||'').toLowerCase() && item.ready===true && item.repositorySelection==='all');
      if(!personalInstall) throw new Error('github-new-repository-all-repositories-installation-required');
      const marker=`EONAPP Forge action ${id}`;
      try {
        repository=await (api.createRepository || createEonForgeGitHubRepository)({token:credential.accessToken,name:row.target_repo,description:`${marker} · ${row.project_title}`,privateRepo:Number(row.target_private||0)===1,fetchImpl:options.fetchImpl});
      } catch(error) {
        if(Number(error?.status||0)!==422) throw error;
        const existing=await (api.getRepository || getEonForgeGitHubRepository)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,fetchImpl:options.fetchImpl});
        if(!String(existing?.description||'').includes(marker)) throw new Error('github-new-repository-already-exists');
        repository=existing;
      }
      await config.actionsDb.prepare('UPDATE eon_forge_github_publish_actions SET repo_created=1,target_owner=?,default_branch=?,updated_at=? WHERE action_id=? AND account_ref=?').bind(repository.owner,repository.defaultBranch,now,id,account).run();
    } else repository=await (api.getRepository || getEonForgeGitHubRepository)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,fetchImpl:options.fetchImpl});
    const latest=await readAction(config.actionsDb,account,id);
    const priorManifest=await (api.getManagedManifest || getEonForgeGitHubManagedManifest)({token:credential.accessToken,owner:repository.owner,repo:repository.repo,branchName:repository.defaultBranch,fetchImpl:options.fetchImpl});
    if(priorManifest.exists && priorManifest.projectSlug!==latest.project_slug) throw new Error('github-repository-managed-by-different-forge-project');
    const currentManaged=new Set(bundle.managedPaths||[]);
    const deletePaths=priorManifest.exists ? priorManifest.generatedPaths.filter((path)=>!currentManaged.has(path)) : [];
    const protectedPaths=priorManifest.exists ? [] : EON_FORGE_GITHUB_CONTROL_PATHS;
    const staged=await (api.stageBundle || stageEonForgeGitHubBundle)({token:credential.accessToken,owner:repository.owner,repo:repository.repo,defaultBranch:repository.defaultBranch,branchName:latest.branch_name,files:bundle.files,deletePaths,protectedPaths,commitMessage:`EONAPP Forge review · ${latest.project_title} · ${id}`,fetchImpl:options.fetchImpl});
    const pr=await (api.ensurePullRequest || ensureEonForgeGitHubPullRequest)({token:credential.accessToken,owner:repository.owner,repo:repository.repo,branchName:latest.branch_name,defaultBranch:repository.defaultBranch,expectedHeadSha:staged.stagedSha,title:`EONAPP Forge review · ${latest.project_title}`,body:`Review the exact Forge-generated static bundle before publishing. Action ${id}.`,fetchImpl:options.fetchImpl});
    if(sha40(pr.headSha) && pr.headSha!==staged.stagedSha) throw new Error('github-pr-head-sha-mismatch');
    const expires=now+EON_FORGE_GITHUB_PUBLISH_TTL_MS;
    await config.actionsDb.prepare(`UPDATE eon_forge_github_publish_actions SET status='staged',target_owner=?,default_branch=?,before_sha=?,staged_sha=?,tree_sha=?,pull_number=?,pr_url=?,publish_nonce_hash='',last_error='',updated_at=?,expires_at=?,staged_at=? WHERE action_id=? AND account_ref=?`).bind(repository.owner,repository.defaultBranch,staged.beforeSha,staged.stagedSha,staged.treeSha,pr.number,pr.htmlUrl,now,expires,now,id,account).run(); const current=await readAction(config.actionsDb,account,id); return freeze({ok:true,idempotent:false,recoveredRemoteStage:staged.recoveredExactRemoteStage===true,recoveredExistingPullRequest:pr.recoveredExisting===true,receipt:publicReceipt(current),publishApprovalNonce:''});
  } catch(error){ const current=await readAction(config.actionsDb,account,id); await setFailure(config.actionsDb,current,error,current?.status==='staging'?'prepared':String(current?.status||'prepared'),now); throw error; }
}


export async function refreshEonForgeGitHubPublishApproval(config, accountId, input={}, options={}) {
  const account=assertConfigured(config,accountId); const id=actionId(input.actionId); if(!id) throw new Error('github-action-id-required');
  const row=await readAction(config.actionsDb,account,id); if(!row) throw new Error('github-action-not-found'); const now=nowMs(options); assertLive(row,now);
  if(row.status!=='staged') throw new Error(`github-action-approval-invalid-status:${clean(row.status,32)}`);
  if(input.confirm!=='refresh-publish-approval') throw new Error('github-action-approval-confirmation-required');
  const credential=await (options.getAccessToken || getEonForgeGitHubAccessToken)(config,account,options); const api=options.githubApi||{};
  const repository=await (api.getRepository || getEonForgeGitHubRepository)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,fetchImpl:options.fetchImpl});
  if(repository.defaultBranch!==row.default_branch) throw new Error('github-default-branch-name-drift');
  const base=await (api.getBranchSha || getEonForgeGitHubBranchSha)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,branchName:row.default_branch,fetchImpl:options.fetchImpl});
  if(!base.exists || base.sha!==row.before_sha) throw new Error('github-default-branch-sha-drift');
  const review=await (api.getBranchSha || getEonForgeGitHubBranchSha)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,branchName:row.branch_name,fetchImpl:options.fetchImpl});
  if(!review.exists || review.sha!==row.staged_sha) throw new Error('github-review-branch-sha-drift');
  const ci=await (api.getCiStatus || getEonForgeGitHubCiStatus)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,headSha:row.staged_sha,fetchImpl:options.fetchImpl});
  if(ci.status!=='success') throw new Error(ci.status==='failed'?'github-review-ci-failed':'github-review-ci-not-successful');
  const nonce=randomUrl(24); const envelope=await expiringNonceEnvelope(id,nonce,now);
  await config.actionsDb.prepare('UPDATE eon_forge_github_publish_actions SET publish_nonce_hash=?,review_ci_run_id=?,review_ci_url=?,last_error=?,updated_at=? WHERE action_id=? AND account_ref=?').bind(envelope,ci.runId,ci.htmlUrl,'',now,id,account).run();
  return freeze({ok:true,receipt:publicReceipt(await readAction(config.actionsDb,account,id)),liveCi:ci,publishApprovalNonce:nonce});
}

export async function publishEonForgeGitHubAction(config, accountId, input={}, options={}) {
  const account=assertConfigured(config,accountId); const id=actionId(input.actionId); if(!id) throw new Error('github-action-id-required'); const row=await readAction(config.actionsDb,account,id); if(!row) throw new Error('github-action-not-found'); const now=nowMs(options); assertLive(row,now);
  if(['deploying','published'].includes(row.status)) return freeze({ok:true,idempotent:true,receipt:publicReceipt(row)});
  if(!['staged','publishing'].includes(row.status)) throw new Error(`github-action-publish-invalid-status:${clean(row.status,32)}`);
  if(input.confirm!=='publish-reviewed-sha') throw new Error('github-action-publish-confirmation-required');
  await requireExpiringNonce(row,input.approvalNonce,'publish_nonce_hash',id,now);
  const recovering=row.status==='publishing';
  if(row.status==='staged') await transitionAction(config.actionsDb, "UPDATE eon_forge_github_publish_actions SET status='publishing',last_error='',updated_at=? WHERE action_id=? AND account_ref=? AND status='staged'", [now,id,account]);
  let mergeAttempted=recovering;
  try {
    const credential=await (options.getAccessToken || getEonForgeGitHubAccessToken)(config,account,options); const api=options.githubApi||{};
    const repository=await (api.getRepository || getEonForgeGitHubRepository)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,fetchImpl:options.fetchImpl});
    if(repository.defaultBranch!==row.default_branch) throw new Error('github-default-branch-name-drift');
    const ci=await (api.getCiStatus || getEonForgeGitHubCiStatus)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,headSha:row.staged_sha,fetchImpl:options.fetchImpl});
    if(ci.status!=='success') throw new Error(ci.status==='failed'?'github-review-ci-failed':'github-review-ci-not-successful');
    const pr=await (api.getPullRequest || getEonForgeGitHubPullRequest)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,pullNumber:row.pull_number,fetchImpl:options.fetchImpl});
    if(pr.headSha!==row.staged_sha) throw new Error('github-pr-head-sha-drift');
    if(pr.baseBranch!==row.default_branch) throw new Error('github-pr-base-branch-drift');
    let merged;
    if(pr.merged){
      merged=freeze({merged:true,mergedSha:pr.mergeCommitSha,message:'recovered-previous-merge',recoveredExisting:true});
    } else {
      const base=await (api.getBranchSha || getEonForgeGitHubBranchSha)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,branchName:row.default_branch,fetchImpl:options.fetchImpl});
      if(!base.exists || base.sha!==row.before_sha) throw new Error('github-default-branch-sha-drift');
      const review=await (api.getBranchSha || getEonForgeGitHubBranchSha)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,branchName:row.branch_name,fetchImpl:options.fetchImpl});
      if(!review.exists || review.sha!==row.staged_sha) throw new Error('github-review-branch-sha-drift');
    }
    await (api.ensurePages || ensureEonForgeGitHubPagesWorkflow)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,fetchImpl:options.fetchImpl});
    if(!pr.merged){
      mergeAttempted=true;
      merged=await (api.ensureMerge || ensureEonForgeGitHubPullRequestMerged)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,pullNumber:row.pull_number,expectedHeadSha:row.staged_sha,defaultBranch:row.default_branch,title:`Publish ${row.project_title} from EONAPP Forge`,fetchImpl:options.fetchImpl});
    }
    const mergedBase=await (api.getBranchSha || getEonForgeGitHubBranchSha)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,branchName:row.default_branch,fetchImpl:options.fetchImpl});
    if(!mergedBase.exists || mergedBase.sha!==merged.mergedSha) throw new Error('github-post-merge-sha-mismatch');
    const mergedProof=await (api.getCommitProof || getEonForgeGitHubCommitProof)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,commitSha:merged.mergedSha,fetchImpl:options.fetchImpl});
    if(mergedProof.parentShas.length!==1 || mergedProof.parentShas[0]!==row.before_sha) throw new Error('github-post-merge-parent-mismatch');
    await config.actionsDb.prepare(`UPDATE eon_forge_github_publish_actions SET status='deploying',review_ci_run_id=?,review_ci_url=?,merged_sha=?,publish_nonce_hash='',last_error='',updated_at=?,merged_at=? WHERE action_id=? AND account_ref=?`).bind(ci.runId,ci.htmlUrl,merged.mergedSha,now,now,id,account).run();
    const current=await readAction(config.actionsDb,account,id); return freeze({ok:true,idempotent:recovering||merged.recoveredExisting===true,recoveredMerge:merged.recoveredExisting===true,receipt:publicReceipt(current)});
  } catch(error){
    const current=await readAction(config.actionsDb,account,id); const fallback=mergeAttempted?'publishing':'staged'; await setFailure(config.actionsDb,current,error,fallback,now); throw error;
  }
}

export async function getEonForgeGitHubPublishStatus(config, accountId, idValue, options={}) {
  const account=assertConfigured(config,accountId); const id=actionId(idValue); if(!id) throw new Error('github-action-id-required'); let row=await readAction(config.actionsDb,account,id); if(!row) throw new Error('github-action-not-found');
  const rollbackState=clean(row.rollback_status,32);
  if(rollbackState==='staged') {
    const credential=await (options.getAccessToken || getEonForgeGitHubAccessToken)(config,account,options); const api=options.githubApi||{};
    const base=await (api.getBranchSha || getEonForgeGitHubBranchSha)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,branchName:row.default_branch,fetchImpl:options.fetchImpl});
    const review=await (api.getBranchSha || getEonForgeGitHubBranchSha)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,branchName:row.rollback_branch_name,fetchImpl:options.fetchImpl});
    const tree=review.exists ? await (api.getCommitTree || getEonForgeGitHubCommitTreeSha)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,commitSha:review.sha,fetchImpl:options.fetchImpl}) : null;
    const proof=freeze({baseUnchanged:base.exists&&base.sha===row.merged_sha,reviewUnchanged:review.exists&&review.sha===row.rollback_sha,treeExact:Boolean(tree&&tree.treeSha===row.rollback_restore_tree_sha),restoreTreeSha:sha40(row.rollback_restore_tree_sha)});
    return freeze({ok:true,receipt:publicReceipt(row),liveCheckPerformed:true,liveTreeProof:proof,liveCheckKind:'rollback-tree'});
  }
  if(!['staged','deploying'].includes(row.status)) return freeze({ok:true,receipt:publicReceipt(row),liveCheckPerformed:false});
  const credential=await (options.getAccessToken || getEonForgeGitHubAccessToken)(config,account,options); const api=options.githubApi||{}; const sha=row.status==='staged'?row.staged_sha:row.merged_sha; const ci=await (api.getCiStatus || getEonForgeGitHubCiStatus)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,headSha:sha,fetchImpl:options.fetchImpl}); const now=nowMs(options);
  if(row.status==='staged') { await config.actionsDb.prepare('UPDATE eon_forge_github_publish_actions SET review_ci_run_id=?,review_ci_url=?,last_error=?,updated_at=? WHERE action_id=? AND account_ref=?').bind(ci.runId,ci.htmlUrl,ci.status==='failed'?'github-review-ci-failed':'',now,id,account).run(); }
  else {
    const pages=await (api.getPagesStatus || getEonForgeGitHubPagesStatus)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,fetchImpl:options.fetchImpl}); const published=ci.status==='success' && pages.configured && Boolean(pages.htmlUrl); await config.actionsDb.prepare('UPDATE eon_forge_github_publish_actions SET status=?,deploy_run_id=?,deploy_run_url=?,pages_url=?,last_error=?,updated_at=?,published_at=? WHERE action_id=? AND account_ref=?').bind(published?'published':'deploying',ci.runId,ci.htmlUrl,pages.htmlUrl,ci.status==='failed'?'github-pages-deploy-failed':'',now,published?now:null,id,account).run();
  }
  row=await readAction(config.actionsDb,account,id); return freeze({ok:true,receipt:publicReceipt(row),liveCheckPerformed:true,liveCi:ci,liveCheckKind:'publish'});
}

export async function cancelEonForgeGitHubPublish(config, accountId, idValue, options={}) {
  const account=assertConfigured(config,accountId); const id=actionId(idValue); if(!id) throw new Error('github-action-id-required'); const row=await readAction(config.actionsDb,account,id); if(!row) throw new Error('github-action-not-found'); if(!['prepared','staged'].includes(String(row.status||''))) throw new Error('github-action-cancel-too-late'); const now=nowMs(options);
  let remoteCleanupPerformed=false;
  if(row.status==='staged') {
    try {
      const credential=await (options.getAccessToken || getEonForgeGitHubAccessToken)(config,account,options); const api=options.githubApi||{};
      if(Number(row.pull_number||0)>0) await (api.closePullRequest || closeEonForgeGitHubPullRequest)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,pullNumber:row.pull_number,fetchImpl:options.fetchImpl});
      await (api.deleteBranch || deleteEonForgeGitHubBranch)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,branchName:row.branch_name,fetchImpl:options.fetchImpl});
      remoteCleanupPerformed=true;
    } catch(error) { await setFailure(config.actionsDb,row,error,'staged',now); throw error; }
  }
  await transitionAction(config.actionsDb, "UPDATE eon_forge_github_publish_actions SET status='cancelled',last_error='',updated_at=?,cancelled_at=? WHERE action_id=? AND account_ref=? AND status=?", [now,now,id,account,row.status]);
  return freeze({ok:true,receipt:publicReceipt(await readAction(config.actionsDb,account,id)),remoteCleanupPerformed,repositoryRetained:Number(row.repo_created||0)===1});
}

export async function prepareEonForgeGitHubRollback(config, accountId, input={}, options={}) {
  const account=assertConfigured(config,accountId); const id=actionId(input.actionId); if(!id) throw new Error('github-action-id-required'); const row=await readAction(config.actionsDb,account,id); if(!row) throw new Error('github-action-not-found');
  if(row.status!=='published') throw new Error('github-rollback-publish-not-complete'); if(!sha40(row.before_sha)||!sha40(row.merged_sha)) throw new Error('github-rollback-receipt-incomplete');
  if(input.confirm!=='prepare-reviewed-rollback') throw new Error('github-rollback-prepare-confirmation-required');
  if(['staged','deploying','completed'].includes(clean(row.rollback_status,32))) return freeze({ok:true,idempotent:true,receipt:publicReceipt(row),rollbackApprovalNonce:''});
  const now=nowMs(options); const credential=await (options.getAccessToken || getEonForgeGitHubAccessToken)(config,account,options); const api=options.githubApi||{};
  const repository=await (api.getRepository || getEonForgeGitHubRepository)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,fetchImpl:options.fetchImpl}); if(repository.defaultBranch!==row.default_branch) throw new Error('github-default-branch-name-drift');
  const base=await (api.getBranchSha || getEonForgeGitHubBranchSha)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,branchName:row.default_branch,fetchImpl:options.fetchImpl}); if(!base.exists || base.sha!==row.merged_sha) throw new Error('github-rollback-default-branch-drift');
  const rollbackBranch=`eonapp/rollback-${clean(row.project_slug,50) || 'forge'}-${id.slice(-8)}`;
  const staged=await (api.stageTreeRestore || stageEonForgeGitHubTreeRestore)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,defaultBranch:row.default_branch,branchName:rollbackBranch,expectedCurrentSha:row.merged_sha,restoreFromSha:row.before_sha,protectedPaths:[],commitMessage:`EONAPP Forge rollback review · ${row.project_title} · ${id}`,fetchImpl:options.fetchImpl});
  const pr=await (api.ensurePullRequest || ensureEonForgeGitHubPullRequest)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,branchName:rollbackBranch,defaultBranch:row.default_branch,expectedHeadSha:staged.rollbackSha,title:`EONAPP Forge rollback review · ${row.project_title}`,body:`Restore the repository to the exact Git tree recorded before Forge action ${id}. The rollback branch is cryptographically checked against that immutable tree before merge; no Forge CI or Pages claim is required for a tree that may predate Forge.`,fetchImpl:options.fetchImpl});
  await config.actionsDb.prepare("UPDATE eon_forge_github_publish_actions SET rollback_status='staged',rollback_branch_name=?,rollback_sha=?,rollback_restore_tree_sha=?,rollback_pull_number=?,rollback_pr_url=?,rollback_nonce_hash='',rollback_ci_run_id=NULL,rollback_ci_url='',last_error='',updated_at=?,rollback_started_at=? WHERE action_id=? AND account_ref=?").bind(rollbackBranch,staged.rollbackSha,staged.restoreTreeSha,pr.number,pr.htmlUrl,now,now,id,account).run();
  return freeze({ok:true,idempotent:false,receipt:publicReceipt(await readAction(config.actionsDb,account,id)),rollbackApprovalNonce:''});
}

export async function cancelEonForgeGitHubRollback(config, accountId, idValue, options={}) {
  const account=assertConfigured(config,accountId); const id=actionId(idValue); if(!id) throw new Error('github-action-id-required'); const row=await readAction(config.actionsDb,account,id); if(!row) throw new Error('github-action-not-found');
  if(row.status!=='published'||row.rollback_status!=='staged') throw new Error('github-rollback-cancel-invalid-status');
  const credential=await (options.getAccessToken || getEonForgeGitHubAccessToken)(config,account,options); const api=options.githubApi||{}; const now=nowMs(options);
  try {
    if(Number(row.rollback_pull_number||0)>0) await (api.closePullRequest || closeEonForgeGitHubPullRequest)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,pullNumber:row.rollback_pull_number,fetchImpl:options.fetchImpl});
    await (api.deleteBranch || deleteEonForgeGitHubBranch)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,branchName:row.rollback_branch_name,fetchImpl:options.fetchImpl});
  } catch(error) { await setFailure(config.actionsDb,row,error,'published',now); throw error; }
  await config.actionsDb.prepare("UPDATE eon_forge_github_publish_actions SET rollback_status='',rollback_branch_name='',rollback_sha='',rollback_restore_tree_sha='',rollback_pull_number=NULL,rollback_pr_url='',rollback_ci_run_id=NULL,rollback_ci_url='',rollback_nonce_hash='',rollback_merged_sha='',rollback_deploy_run_id=NULL,rollback_deploy_run_url='',rollback_started_at=NULL,rollback_completed_at=NULL,last_error='',updated_at=? WHERE action_id=? AND account_ref=?").bind(now,id,account).run();
  return freeze({ok:true,receipt:publicReceipt(await readAction(config.actionsDb,account,id)),remoteCleanupPerformed:true});
}

export async function refreshEonForgeGitHubRollbackApproval(config, accountId, input={}, options={}) {
  const account=assertConfigured(config,accountId); const id=actionId(input.actionId); if(!id) throw new Error('github-action-id-required'); const row=await readAction(config.actionsDb,account,id); if(!row) throw new Error('github-action-not-found');
  if(row.status!=='published'||row.rollback_status!=='staged') throw new Error('github-rollback-approval-invalid-status'); if(input.confirm!=='refresh-rollback-approval') throw new Error('github-rollback-approval-confirmation-required');
  if(!sha40(row.rollback_restore_tree_sha)) throw new Error('github-rollback-restore-tree-missing');
  const credential=await (options.getAccessToken || getEonForgeGitHubAccessToken)(config,account,options); const api=options.githubApi||{}; const now=nowMs(options);
  const base=await (api.getBranchSha || getEonForgeGitHubBranchSha)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,branchName:row.default_branch,fetchImpl:options.fetchImpl}); if(!base.exists||base.sha!==row.merged_sha) throw new Error('github-rollback-default-branch-drift');
  const review=await (api.getBranchSha || getEonForgeGitHubBranchSha)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,branchName:row.rollback_branch_name,fetchImpl:options.fetchImpl}); if(!review.exists||review.sha!==row.rollback_sha) throw new Error('github-rollback-branch-sha-drift');
  const tree=await (api.getCommitTree || getEonForgeGitHubCommitTreeSha)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,commitSha:row.rollback_sha,fetchImpl:options.fetchImpl}); if(tree.treeSha!==row.rollback_restore_tree_sha) throw new Error('github-rollback-tree-drift');
  const nonce=randomUrl(24); const envelope=await expiringNonceEnvelope(`${id}:rollback`,nonce,now);
  await config.actionsDb.prepare("UPDATE eon_forge_github_publish_actions SET rollback_nonce_hash=?,last_error='',updated_at=? WHERE action_id=? AND account_ref=?").bind(envelope,now,id,account).run();
  return freeze({ok:true,receipt:publicReceipt(await readAction(config.actionsDb,account,id)),liveTreeProof:freeze({baseSha:base.sha,reviewSha:review.sha,restoreTreeSha:tree.treeSha,exact:true}),rollbackApprovalNonce:nonce});
}


export async function publishEonForgeGitHubRollback(config, accountId, input={}, options={}) {
  const account=assertConfigured(config,accountId); const id=actionId(input.actionId); if(!id) throw new Error('github-action-id-required'); const row=await readAction(config.actionsDb,account,id); if(!row) throw new Error('github-action-not-found');
  if(row.rollback_status==='completed') return freeze({ok:true,idempotent:true,receipt:publicReceipt(row)});
  if(row.status!=='published'||row.rollback_status!=='staged') throw new Error('github-rollback-invalid-status'); if(input.confirm!=='publish-reviewed-rollback') throw new Error('github-rollback-publish-confirmation-required');
  const now=nowMs(options); await requireExpiringNonce(row,input.approvalNonce,'rollback_nonce_hash',`${id}:rollback`,now);
  if(!sha40(row.rollback_restore_tree_sha)) throw new Error('github-rollback-restore-tree-missing');
  const credential=await (options.getAccessToken || getEonForgeGitHubAccessToken)(config,account,options); const api=options.githubApi||{};
  const pr=await (api.getPullRequest || getEonForgeGitHubPullRequest)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,pullNumber:row.rollback_pull_number,fetchImpl:options.fetchImpl});
  if(pr.headSha!==row.rollback_sha) throw new Error('github-pr-head-sha-drift'); if(pr.baseBranch!==row.default_branch) throw new Error('github-pr-base-branch-drift');
  let merged;
  if(pr.merged){
    merged=freeze({merged:true,mergedSha:pr.mergeCommitSha,message:'recovered-previous-rollback-merge',recoveredExisting:true});
  } else {
    const base=await (api.getBranchSha || getEonForgeGitHubBranchSha)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,branchName:row.default_branch,fetchImpl:options.fetchImpl}); if(!base.exists||base.sha!==row.merged_sha) throw new Error('github-rollback-default-branch-drift');
    const review=await (api.getBranchSha || getEonForgeGitHubBranchSha)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,branchName:row.rollback_branch_name,fetchImpl:options.fetchImpl}); if(!review.exists||review.sha!==row.rollback_sha) throw new Error('github-rollback-branch-sha-drift');
    const reviewTree=await (api.getCommitTree || getEonForgeGitHubCommitTreeSha)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,commitSha:row.rollback_sha,fetchImpl:options.fetchImpl}); if(reviewTree.treeSha!==row.rollback_restore_tree_sha) throw new Error('github-rollback-tree-drift');
    merged=await (api.ensureMerge || ensureEonForgeGitHubPullRequestMerged)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,pullNumber:row.rollback_pull_number,expectedHeadSha:row.rollback_sha,defaultBranch:row.default_branch,title:`Restore ${row.project_title} to pre-Forge tree`,fetchImpl:options.fetchImpl});
  }
  const mergedBase=await (api.getBranchSha || getEonForgeGitHubBranchSha)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,branchName:row.default_branch,fetchImpl:options.fetchImpl}); if(!mergedBase.exists||mergedBase.sha!==merged.mergedSha) throw new Error('github-rollback-post-merge-sha-mismatch');
  const mergedProof=await (api.getCommitProof || getEonForgeGitHubCommitProof)({token:credential.accessToken,owner:row.target_owner,repo:row.target_repo,commitSha:merged.mergedSha,fetchImpl:options.fetchImpl});
  if(mergedProof.treeSha!==row.rollback_restore_tree_sha) throw new Error('github-rollback-post-merge-tree-mismatch');
  if(mergedProof.parentShas.length!==1 || mergedProof.parentShas[0]!==row.merged_sha) throw new Error('github-rollback-post-merge-parent-mismatch');
  await config.actionsDb.prepare("UPDATE eon_forge_github_publish_actions SET rollback_status='completed',rollback_merged_sha=?,rollback_nonce_hash='',last_error='',updated_at=?,rollback_completed_at=? WHERE action_id=? AND account_ref=?").bind(merged.mergedSha,now,now,id,account).run();
  return freeze({ok:true,idempotent:merged.recoveredExisting===true,recoveredMerge:merged.recoveredExisting===true,receipt:publicReceipt(await readAction(config.actionsDb,account,id)),treeProof:freeze({restoreTreeSha:mergedProof.treeSha,exact:true})});
}


export default freeze({EON_FORGE_GITHUB_PUBLISH_SCHEMA,prepareEonForgeGitHubPublish,stageEonForgeGitHubPublish,refreshEonForgeGitHubPublishApproval,publishEonForgeGitHubAction,getEonForgeGitHubPublishStatus,cancelEonForgeGitHubPublish,prepareEonForgeGitHubRollback,cancelEonForgeGitHubRollback,refreshEonForgeGitHubRollbackApproval,publishEonForgeGitHubRollback});
