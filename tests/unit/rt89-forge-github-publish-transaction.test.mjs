import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cancelEonForgeGitHubPublish,
  cancelEonForgeGitHubRollback,
  getEonForgeGitHubPublishStatus,
  prepareEonForgeGitHubPublish,
  prepareEonForgeGitHubRollback,
  publishEonForgeGitHubAction,
  refreshEonForgeGitHubPublishApproval,
  refreshEonForgeGitHubRollbackApproval,
  publishEonForgeGitHubRollback,
  stageEonForgeGitHubPublish
} from '../../functions/_shared/eon-forge-github-publish.js';

const SHA=(c)=>c.repeat(40);
const USER_TOKEN = ['ghu','abcdefghijklmnopqrstuvwxyz123456'].join('_');
class MemoryActionsDb {
  constructor(){ this.rows=new Map(); }
  prepare(sql){ return new MemoryStmt(this,sql); }
}
class MemoryStmt {
  constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
  bind(...args){this.args=args;return this;}
  async first(){
    if(this.sql.includes('WHERE action_id=? AND account_ref=?')) { const [id,account]=this.args; const row=this.db.rows.get(id); return row&&row.account_ref===account?structuredClone(row):null; }
    if(this.sql.includes('WHERE account_ref=? AND idempotency_key=?')) { const [account,key]=this.args; return structuredClone([...this.db.rows.values()].find((r)=>r.account_ref===account&&r.idempotency_key===key)||null); }
    throw new Error('unhandled first SQL: '+this.sql);
  }
  async run(){
    const q=this.sql.replace(/\s+/g,' ').trim(); const a=this.args;
    if(q.startsWith('INSERT INTO eon_forge_github_publish_actions')){
      const [action_id,account_ref,idempotency_key,project_title,project_slug,payload_digest,file_count,total_bytes,target_mode,target_owner,target_repo,target_private,branch_name,stage_nonce_hash,created_at,updated_at,expires_at]=a;
      this.db.rows.set(action_id,{action_id,account_ref,idempotency_key,project_title,project_slug,payload_digest,file_count,total_bytes,target_mode,target_owner,target_repo,target_private,repo_created:0,default_branch:'',branch_name,status:'prepared',stage_nonce_hash,publish_nonce_hash:'',before_sha:'',staged_sha:'',tree_sha:'',pull_number:null,pr_url:'',review_ci_run_id:null,review_ci_url:'',merged_sha:'',deploy_run_id:null,deploy_run_url:'',pages_url:'',last_error:'',created_at,updated_at,expires_at,staged_at:null,merged_at:null,published_at:null,cancelled_at:null,rollback_status:'',rollback_branch_name:'',rollback_sha:'',rollback_restore_tree_sha:'',rollback_pull_number:null,rollback_pr_url:'',rollback_ci_run_id:null,rollback_ci_url:'',rollback_nonce_hash:'',rollback_merged_sha:'',rollback_deploy_run_id:null,rollback_deploy_run_url:'',rollback_started_at:null,rollback_completed_at:null}); return {success:true};
    }
    const guardedStatus=q.includes('AND status=?'); const id=a.at(guardedStatus?-3:-2), account=a.at(guardedStatus?-2:-1); const row=this.db.rows.get(id); if(!row||row.account_ref!==account) throw new Error('row missing for update: '+q);
    if(q.includes('SET stage_nonce_hash=?')) [row.stage_nonce_hash,row.updated_at]=a;
    else if(q.includes("SET status='staging'")) { row.status='staging'; row.last_error=''; row.updated_at=a[0]; }
    else if(q.includes('SET repo_created=1')) [row.repo_created,row.target_owner,row.default_branch,row.updated_at]=[1,a[0],a[1],a[2]];
    else if(q.includes("SET status='staged'")) { [row.target_owner,row.default_branch,row.before_sha,row.staged_sha,row.tree_sha,row.pull_number,row.pr_url,row.updated_at,row.expires_at,row.staged_at]=a.slice(0,10); row.publish_nonce_hash=''; row.status='staged'; row.last_error=''; }
    else if(q.includes("SET status='publishing'")) { row.status='publishing'; row.last_error=''; row.updated_at=a[0]; }
    else if(q.startsWith('UPDATE eon_forge_github_publish_actions SET status=?,last_error=?')) [row.status,row.last_error,row.updated_at]=a.slice(0,3);
    else if(q.includes("SET status='deploying'")) { [row.review_ci_run_id,row.review_ci_url,row.merged_sha,row.updated_at,row.merged_at]=a.slice(0,5); row.status='deploying'; row.last_error=''; }
    else if(q.includes('SET review_ci_run_id=?')) [row.review_ci_run_id,row.review_ci_url,row.last_error,row.updated_at]=a.slice(0,4);
    else if(q.includes('SET status=?,deploy_run_id=?')) [row.status,row.deploy_run_id,row.deploy_run_url,row.pages_url,row.last_error,row.updated_at,row.published_at]=a.slice(0,7);
    else if(q.includes("SET status='cancelled'")) { row.status='cancelled'; row.last_error=''; row.updated_at=a[0]; row.cancelled_at=a[1]; }
    else if(q.includes('SET publish_nonce_hash=?,review_ci_run_id=?')) [row.publish_nonce_hash,row.review_ci_run_id,row.review_ci_url,row.last_error,row.updated_at]=a.slice(0,5);
    else if(q.includes('SET publish_nonce_hash=?')) [row.publish_nonce_hash,row.updated_at]=a.slice(0,2);
    else if(q.includes("SET rollback_status='staged'")) { [row.rollback_branch_name,row.rollback_sha,row.rollback_restore_tree_sha,row.rollback_pull_number,row.rollback_pr_url,row.updated_at,row.rollback_started_at]=a.slice(0,7); row.rollback_nonce_hash=''; row.rollback_status='staged'; row.rollback_ci_run_id=null; row.rollback_ci_url=''; row.last_error=''; }
    else if(q.includes("SET rollback_nonce_hash=?,last_error=''")) [row.rollback_nonce_hash,row.updated_at]=a.slice(0,2);
    else if(q.includes("SET rollback_status='completed'")) { [row.rollback_merged_sha,row.updated_at,row.rollback_completed_at]=a.slice(0,3); row.rollback_nonce_hash=''; row.rollback_status='completed'; row.last_error=''; }
    else if(q.includes("SET rollback_status=''")) { row.rollback_status=''; row.rollback_branch_name=''; row.rollback_sha=''; row.rollback_restore_tree_sha=''; row.rollback_pull_number=null; row.rollback_pr_url=''; row.rollback_nonce_hash=''; row.rollback_merged_sha=''; row.rollback_started_at=null; row.rollback_completed_at=null; row.last_error=''; row.updated_at=a[0]; }
    else if(q.includes('SET rollback_ci_run_id=?')) [row.rollback_ci_run_id,row.rollback_ci_url,row.last_error,row.updated_at]=a.slice(0,4);
    else if(q.includes("SET rollback_status='deploying'")) { [row.rollback_ci_run_id,row.rollback_ci_url,row.rollback_merged_sha,row.updated_at]=a.slice(0,4); row.rollback_status='deploying'; row.last_error=''; }
    else if(q.includes('SET rollback_status=?,rollback_deploy_run_id=?')) [row.rollback_status,row.rollback_deploy_run_id,row.rollback_deploy_run_url,row.pages_url,row.last_error,row.updated_at,row.rollback_completed_at]=a.slice(0,7);
    else throw new Error('unhandled run SQL: '+q);
    return {success:true};
  }
}

function harness(){
  const actionsDb=new MemoryActionsDb(); let merged=false; let rollbackMerged=false; let reviewCi='success'; let remoteWrites=0; let cleanupWrites=0;
  const config={configured:true,actionsDb};
  const common={
    now:1_786_573_800_000,
    readConnection:async()=>({providerLogin:'acme'}),
    getAccessToken:async()=>({accessToken:USER_TOKEN}),
    githubApi:{
      getInstallations:async()=>({count:1,readyCount:1,installations:[{id:41,account:'acme',repositorySelection:'all',ready:true,missingPermissions:[]}]}),
      createRepository:async({name,description,privateRepo})=>{remoteWrites++;return {id:501,owner:'acme',repo:name,defaultBranch:'main',private:privateRepo===true,description};},
      getRepository:async()=>({id:500,owner:'acme',repo:'site',defaultBranch:'main',private:false}),
      getManagedManifest:async()=>({exists:false,projectSlug:'',generatedPaths:[]}),
      stageBundle:async({files,branchName})=>{ remoteWrites++; assert.ok(files['.github/workflows/eonapp-ci-pages.yml']); assert.ok(files['.eonapp/validate-static.mjs']); return {owner:'acme',repo:'site',defaultBranch:'main',branchName,beforeSha:SHA('a'),stagedSha:SHA('b'),treeSha:SHA('c'),fileCount:Object.keys(files).length}; },
      stageTreeRestore:async({branchName,expectedCurrentSha,restoreFromSha,protectedPaths})=>{remoteWrites++;assert.equal(expectedCurrentSha,SHA('d'));assert.equal(restoreFromSha,SHA('a'));assert.deepEqual(protectedPaths,[]);return {owner:'acme',repo:'site',defaultBranch:'main',branchName,currentSha:SHA('d'),restoreFromSha:SHA('a'),rollbackSha:SHA('e'),restoreTreeSha:SHA('c'),exactTreeRestore:true};},
      ensurePullRequest:async({expectedHeadSha})=>{remoteWrites++; return {number:expectedHeadSha===SHA('e')?17:7,htmlUrl:`https://github.com/acme/site/pull/${expectedHeadSha===SHA('e')?17:7}`,state:'open',headSha:expectedHeadSha,recoveredExisting:false};},
      closePullRequest:async()=>{cleanupWrites++;return {number:7,state:'closed'};},
      deleteBranch:async()=>{cleanupWrites++;return {deleted:true};},
      getBranchSha:async({branchName})=> {
        if(branchName==='main') return {exists:true,sha:rollbackMerged?SHA('f'):merged?SHA('d'):SHA('a')};
        if(branchName.startsWith('eonapp/rollback-')) return {exists:true,sha:SHA('e')};
        return {exists:true,sha:SHA('b')};
      },
      getCommitTree:async({commitSha})=>({commitSha,treeSha:SHA('c')}),
      getCommitProof:async({commitSha})=>commitSha===SHA('f')?{commitSha,treeSha:SHA('c'),parentShas:[SHA('d')]}:{commitSha,treeSha:SHA('9'),parentShas:[SHA('a')]},
      getPullRequest:async({pullNumber})=>pullNumber===17
        ? {number:17,state:rollbackMerged?'closed':'open',merged:rollbackMerged,headSha:SHA('e'),baseBranch:'main',mergeCommitSha:rollbackMerged?SHA('f'):''}
        : {number:7,state:merged?'closed':'open',merged,headSha:SHA('b'),baseBranch:'main',mergeCommitSha:merged?SHA('d'):''},
      getCiStatus:async({headSha})=>({status:headSha===SHA('b')?reviewCi:'success',conclusion:'success',runId:headSha===SHA('b')?88:headSha===SHA('e')?188:99,htmlUrl:'https://github.com/acme/site/actions/runs/'+(headSha===SHA('b')?88:headSha===SHA('e')?188:99),headSha}),
      ensurePages:async()=>{remoteWrites++;return {configured:true,changed:true,htmlUrl:'https://acme.github.io/site/'};},
      ensureMerge:async({expectedHeadSha})=>{remoteWrites++;if(expectedHeadSha===SHA('b')){merged=true;return {merged:true,mergedSha:SHA('d'),message:'merged',recoveredExisting:false};}assert.equal(expectedHeadSha,SHA('e'));rollbackMerged=true;return {merged:true,mergedSha:SHA('f'),message:'rollback merged',recoveredExisting:false};},
      getPagesStatus:async()=>({configured:true,status:'built',htmlUrl:'https://acme.github.io/site/',buildType:'workflow'})
    }
  };
  return {config,common,actionsDb,get remoteWrites(){return remoteWrites;},get cleanupWrites(){return cleanupWrites;},set reviewCi(v){reviewCi=v;},set merged(v){merged=Boolean(v);},set rollbackMerged(v){rollbackMerged=Boolean(v);}};
}

const project={title:'Demo',files:{'index.html':'<h1>Demo</h1>','style.css':'body{}'},sourceCheckPassed:true,target:{mode:'existing',owner:'acme',repo:'site'},idempotencyKey:'publish-demo-0001'};

test('RT89 durable publish transaction performs no remote write before stage approval and publishes only after exact-SHA CI proof', async()=>{
  const h=harness(); const prepared=await prepareEonForgeGitHubPublish(h.config,'acct-1',project,h.common); assert.equal(prepared.receipt.status,'prepared'); assert.equal(h.remoteWrites,0); assert.ok(prepared.stageApprovalNonce.length>20);
  const staged=await stageEonForgeGitHubPublish(h.config,'acct-1',{...project,actionId:prepared.receipt.actionId,approvalNonce:prepared.stageApprovalNonce,confirm:'stage-reviewed-bundle'},h.common); assert.equal(staged.receipt.status,'staged'); assert.equal(staged.receipt.beforeSha,SHA('a')); assert.equal(staged.receipt.stagedSha,SHA('b')); assert.equal(staged.publishApprovalNonce,''); assert.equal(h.remoteWrites,2);
  const review=await getEonForgeGitHubPublishStatus(h.config,'acct-1',prepared.receipt.actionId,h.common); assert.equal(review.liveCi.status,'success'); assert.equal(review.receipt.reviewCi.runId,88);
  const approved=await refreshEonForgeGitHubPublishApproval(h.config,'acct-1',{actionId:prepared.receipt.actionId,confirm:'refresh-publish-approval'},h.common); assert.ok(approved.publishApprovalNonce.length>20);
  const publishing=await publishEonForgeGitHubAction(h.config,'acct-1',{actionId:prepared.receipt.actionId,approvalNonce:approved.publishApprovalNonce,confirm:'publish-reviewed-sha'},h.common); assert.equal(publishing.receipt.status,'deploying'); assert.equal(publishing.receipt.mergedSha,SHA('d')); assert.equal(h.remoteWrites,4);
  const final=await getEonForgeGitHubPublishStatus(h.config,'acct-1',prepared.receipt.actionId,h.common); assert.equal(final.receipt.status,'published'); assert.equal(final.receipt.pagesUrl,'https://acme.github.io/site/'); assert.equal(final.receipt.rollback.available,true); assert.equal(final.receipt.rollback.beforeSha,SHA('a')); assert.equal(final.receipt.rollback.mode,'reviewed-exact-pre-forge-tree'); assert.equal(final.receipt.rollback.verification,'immutable-git-tree'); assert.equal(final.receipt.credentialsExposed,false); assert.equal(final.receipt.forcePushUsed,false);
});

test('RT89 publish fails closed on CI pending/default-branch drift and preserves the staged review instead of merging', async()=>{
  const h=harness(); const prepared=await prepareEonForgeGitHubPublish(h.config,'acct-1',project,h.common); const staged=await stageEonForgeGitHubPublish(h.config,'acct-1',{...project,actionId:prepared.receipt.actionId,approvalNonce:prepared.stageApprovalNonce,confirm:'stage-reviewed-bundle'},h.common);
  assert.equal(staged.publishApprovalNonce,''); h.reviewCi='pending'; await assert.rejects(()=>refreshEonForgeGitHubPublishApproval(h.config,'acct-1',{actionId:prepared.receipt.actionId,confirm:'refresh-publish-approval'},h.common),/github-review-ci-not-successful/); const row=h.actionsDb.rows.get(prepared.receipt.actionId); assert.equal(row.status,'staged'); assert.equal(h.remoteWrites,2);
});

test('RT89 prepare idempotency is bundle/target bound and stage rejects changed source', async()=>{
  const h=harness(); const first=await prepareEonForgeGitHubPublish(h.config,'acct-1',project,h.common); const again=await prepareEonForgeGitHubPublish(h.config,'acct-1',project,h.common); assert.equal(again.idempotent,true); assert.equal(again.receipt.actionId,first.receipt.actionId); assert.equal(h.remoteWrites,0);
  await assert.rejects(()=>prepareEonForgeGitHubPublish(h.config,'acct-1',{...project,files:{'index.html':'changed'}},h.common),/idempotency-conflict/);
  await assert.rejects(()=>stageEonForgeGitHubPublish(h.config,'acct-1',{...project,files:{...project.files,'app.js':'changed'},actionId:first.receipt.actionId,approvalNonce:again.stageApprovalNonce,confirm:'stage-reviewed-bundle'},h.common),/bundle-digest-mismatch/); assert.equal(h.remoteWrites,0);
});



test('RT89 can refresh a lost in-memory publish approval only after exact branch and successful CI revalidation', async()=>{
  const h=harness(); const prepared=await prepareEonForgeGitHubPublish(h.config,'acct-1',project,h.common); await stageEonForgeGitHubPublish(h.config,'acct-1',{...project,actionId:prepared.receipt.actionId,approvalNonce:prepared.stageApprovalNonce,confirm:'stage-reviewed-bundle'},h.common);
  const refreshed=await refreshEonForgeGitHubPublishApproval(h.config,'acct-1',{actionId:prepared.receipt.actionId,confirm:'refresh-publish-approval'},h.common);
  assert.equal(refreshed.liveCi.status,'success'); assert.ok(refreshed.publishApprovalNonce.length>20);
  const published=await publishEonForgeGitHubAction(h.config,'acct-1',{actionId:prepared.receipt.actionId,approvalNonce:refreshed.publishApprovalNonce,confirm:'publish-reviewed-sha'},h.common);
  assert.equal(published.receipt.status,'deploying');
});

test('RT89 staged cancellation closes the review PR and deletes the review branch before recording cancelled', async()=>{
  const h=harness(); const prepared=await prepareEonForgeGitHubPublish(h.config,'acct-1',project,h.common); await stageEonForgeGitHubPublish(h.config,'acct-1',{...project,actionId:prepared.receipt.actionId,approvalNonce:prepared.stageApprovalNonce,confirm:'stage-reviewed-bundle'},h.common);
  const cancelled=await cancelEonForgeGitHubPublish(h.config,'acct-1',prepared.receipt.actionId,h.common);
  assert.equal(cancelled.receipt.status,'cancelled'); assert.equal(cancelled.remoteCleanupPerformed,true); assert.equal(h.cleanupWrites,2);
});

test('RT89 rollback cancellation closes its PR and deletes its EONAPP branch without changing the published default branch', async()=>{
  const h=harness(); const prepared=await prepareEonForgeGitHubPublish(h.config,'acct-1',project,h.common); await stageEonForgeGitHubPublish(h.config,'acct-1',{...project,actionId:prepared.receipt.actionId,approvalNonce:prepared.stageApprovalNonce,confirm:'stage-reviewed-bundle'},h.common);
  const approval=await refreshEonForgeGitHubPublishApproval(h.config,'acct-1',{actionId:prepared.receipt.actionId,confirm:'refresh-publish-approval'},h.common); await publishEonForgeGitHubAction(h.config,'acct-1',{actionId:prepared.receipt.actionId,approvalNonce:approval.publishApprovalNonce,confirm:'publish-reviewed-sha'},h.common); await getEonForgeGitHubPublishStatus(h.config,'acct-1',prepared.receipt.actionId,h.common);
  await prepareEonForgeGitHubRollback(h.config,'acct-1',{actionId:prepared.receipt.actionId,confirm:'prepare-reviewed-rollback'},h.common); const cancelled=await cancelEonForgeGitHubRollback(h.config,'acct-1',prepared.receipt.actionId,h.common);
  assert.equal(cancelled.receipt.status,'published'); assert.equal(cancelled.receipt.rollback.status,''); assert.equal(cancelled.remoteCleanupPerformed,true); assert.equal(h.cleanupWrites,2);
});

test('RT89 reviewed rollback restores the exact recorded pre-Forge Git tree after fresh tree-bound approval', async()=>{
  const h=harness(); const prepared=await prepareEonForgeGitHubPublish(h.config,'acct-1',project,h.common); const staged=await stageEonForgeGitHubPublish(h.config,'acct-1',{...project,actionId:prepared.receipt.actionId,approvalNonce:prepared.stageApprovalNonce,confirm:'stage-reviewed-bundle'},h.common);
  const forwardApproval=await refreshEonForgeGitHubPublishApproval(h.config,'acct-1',{actionId:prepared.receipt.actionId,confirm:'refresh-publish-approval'},h.common);
  await publishEonForgeGitHubAction(h.config,'acct-1',{actionId:prepared.receipt.actionId,approvalNonce:forwardApproval.publishApprovalNonce,confirm:'publish-reviewed-sha'},h.common); await getEonForgeGitHubPublishStatus(h.config,'acct-1',prepared.receipt.actionId,h.common);
  const rollback=await prepareEonForgeGitHubRollback(h.config,'acct-1',{actionId:prepared.receipt.actionId,confirm:'prepare-reviewed-rollback'},h.common); assert.equal(rollback.receipt.rollback.status,'staged'); assert.equal(rollback.receipt.rollback.stagedSha,SHA('e')); assert.equal(rollback.receipt.rollback.restoreTreeSha,SHA('c')); assert.equal(rollback.rollbackApprovalNonce,'');
  const checked=await getEonForgeGitHubPublishStatus(h.config,'acct-1',prepared.receipt.actionId,h.common); assert.equal(checked.liveCheckKind,'rollback-tree'); assert.equal(checked.liveTreeProof.treeExact,true);
  const approved=await refreshEonForgeGitHubRollbackApproval(h.config,'acct-1',{actionId:prepared.receipt.actionId,confirm:'refresh-rollback-approval'},h.common); assert.equal(approved.liveTreeProof.exact,true); assert.ok(approved.rollbackApprovalNonce.length>20);
  const completed=await publishEonForgeGitHubRollback(h.config,'acct-1',{actionId:prepared.receipt.actionId,approvalNonce:approved.rollbackApprovalNonce,confirm:'publish-reviewed-rollback'},h.common); assert.equal(completed.receipt.rollback.status,'completed'); assert.equal(completed.receipt.rollback.mergedSha,SHA('f')); assert.ok(completed.receipt.rollback.completedAt>0); assert.equal(completed.treeProof.exact,true);
});


test('RT89 new-repository publish fails before any GitHub write when the App lacks a ready all-repositories personal installation', async()=>{
  const h=harness();
  const next={...project,target:{mode:'new',repo:'newsite',private:false},idempotencyKey:'publish-newsite-0001'};
  const prepared=await prepareEonForgeGitHubPublish(h.config,'acct-1',next,h.common);
  const blockedCommon={...h.common,githubApi:{...h.common.githubApi,getInstallations:async()=>({count:1,readyCount:0,installations:[{id:41,account:'acme',repositorySelection:'selected',ready:true,missingPermissions:[]}]})}};
  await assert.rejects(
    ()=>stageEonForgeGitHubPublish(h.config,'acct-1',{...next,actionId:prepared.receipt.actionId,approvalNonce:prepared.stageApprovalNonce,confirm:'stage-reviewed-bundle'},blockedCommon),
    /github-new-repository-all-repositories-installation-required/
  );
  assert.equal(h.remoteWrites,0);
  assert.equal(h.actionsDb.rows.get(prepared.receipt.actionId).status,'prepared');
});

test('RT89 new-repository publish creates the repo only after ready all-repositories installation proof, then stages the reviewed PR', async()=>{
  const h=harness();
  const next={...project,target:{mode:'new',repo:'newsite',private:true},idempotencyKey:'publish-newsite-0002'};
  const prepared=await prepareEonForgeGitHubPublish(h.config,'acct-1',next,h.common);
  const staged=await stageEonForgeGitHubPublish(h.config,'acct-1',{...next,actionId:prepared.receipt.actionId,approvalNonce:prepared.stageApprovalNonce,confirm:'stage-reviewed-bundle'},h.common);
  assert.equal(staged.receipt.status,'staged');
  assert.equal(staged.receipt.target.owner,'acme');
  assert.equal(staged.receipt.target.repo,'newsite');
  assert.equal(staged.receipt.target.private,true);
  assert.equal(h.actionsDb.rows.get(prepared.receipt.actionId).repo_created,1);
  assert.equal(h.remoteWrites,3);
});


test('RT89 stage resumes safely from a durable staging state after process interruption', async()=>{
  const h=harness(); const prepared=await prepareEonForgeGitHubPublish(h.config,'acct-1',project,h.common);
  h.actionsDb.rows.get(prepared.receipt.actionId).status='staging';
  const staged=await stageEonForgeGitHubPublish(h.config,'acct-1',{...project,actionId:prepared.receipt.actionId,approvalNonce:prepared.stageApprovalNonce,confirm:'stage-reviewed-bundle'},h.common);
  assert.equal(staged.receipt.status,'staged'); assert.equal(staged.receipt.stagedSha,SHA('b')); assert.equal(h.remoteWrites,2);
});

test('RT89 final publish approval expires after five minutes and cannot merge with a stale capability', async()=>{
  const h=harness(); const prepared=await prepareEonForgeGitHubPublish(h.config,'acct-1',project,h.common);
  await stageEonForgeGitHubPublish(h.config,'acct-1',{...project,actionId:prepared.receipt.actionId,approvalNonce:prepared.stageApprovalNonce,confirm:'stage-reviewed-bundle'},h.common);
  const approved=await refreshEonForgeGitHubPublishApproval(h.config,'acct-1',{actionId:prepared.receipt.actionId,confirm:'refresh-publish-approval'},h.common);
  const later={...h.common,now:h.common.now+(5*60*1000)+1};
  await assert.rejects(()=>publishEonForgeGitHubAction(h.config,'acct-1',{actionId:prepared.receipt.actionId,approvalNonce:approved.publishApprovalNonce,confirm:'publish-reviewed-sha'},later),/github-action-approval-nonce-expired/);
  assert.equal(h.actionsDb.rows.get(prepared.receipt.actionId).status,'staged');
});

test('RT89 forward publish recovers a remotely completed exact squash merge after local acknowledgement loss', async()=>{
  const h=harness(); const prepared=await prepareEonForgeGitHubPublish(h.config,'acct-1',project,h.common);
  await stageEonForgeGitHubPublish(h.config,'acct-1',{...project,actionId:prepared.receipt.actionId,approvalNonce:prepared.stageApprovalNonce,confirm:'stage-reviewed-bundle'},h.common);
  const approved=await refreshEonForgeGitHubPublishApproval(h.config,'acct-1',{actionId:prepared.receipt.actionId,confirm:'refresh-publish-approval'},h.common);
  const row=h.actionsDb.rows.get(prepared.receipt.actionId); row.status='publishing'; h.merged=true;
  const recovered=await publishEonForgeGitHubAction(h.config,'acct-1',{actionId:prepared.receipt.actionId,approvalNonce:approved.publishApprovalNonce,confirm:'publish-reviewed-sha'},h.common);
  assert.equal(recovered.receipt.status,'deploying'); assert.equal(recovered.receipt.mergedSha,SHA('d')); assert.equal(recovered.recoveredMerge,true);
});

test('RT89 rollback recovers a remotely completed exact tree restore after local acknowledgement loss', async()=>{
  const h=harness(); const prepared=await prepareEonForgeGitHubPublish(h.config,'acct-1',project,h.common);
  await stageEonForgeGitHubPublish(h.config,'acct-1',{...project,actionId:prepared.receipt.actionId,approvalNonce:prepared.stageApprovalNonce,confirm:'stage-reviewed-bundle'},h.common);
  const forward=await refreshEonForgeGitHubPublishApproval(h.config,'acct-1',{actionId:prepared.receipt.actionId,confirm:'refresh-publish-approval'},h.common);
  await publishEonForgeGitHubAction(h.config,'acct-1',{actionId:prepared.receipt.actionId,approvalNonce:forward.publishApprovalNonce,confirm:'publish-reviewed-sha'},h.common); await getEonForgeGitHubPublishStatus(h.config,'acct-1',prepared.receipt.actionId,h.common);
  await prepareEonForgeGitHubRollback(h.config,'acct-1',{actionId:prepared.receipt.actionId,confirm:'prepare-reviewed-rollback'},h.common);
  const approved=await refreshEonForgeGitHubRollbackApproval(h.config,'acct-1',{actionId:prepared.receipt.actionId,confirm:'refresh-rollback-approval'},h.common);
  h.rollbackMerged=true;
  const recovered=await publishEonForgeGitHubRollback(h.config,'acct-1',{actionId:prepared.receipt.actionId,approvalNonce:approved.rollbackApprovalNonce,confirm:'publish-reviewed-rollback'},h.common);
  assert.equal(recovered.receipt.rollback.status,'completed'); assert.equal(recovered.receipt.rollback.mergedSha,SHA('f')); assert.equal(recovered.recoveredMerge,true); assert.equal(recovered.treeProof.exact,true);
});
