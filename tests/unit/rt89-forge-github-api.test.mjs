import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_FORGE_GITHUB_API_VERSION,
  closeEonForgeGitHubPullRequest,
  createEonForgeGitHubPullRequest,
  createEonForgeGitHubRepository,
  eonForgeGitHubRequest,
  deleteEonForgeGitHubBranch,
  ensureEonForgeGitHubPullRequest,
  ensureEonForgeGitHubPagesWorkflow,
  getEonForgeGitHubManagedManifest,
  getEonForgeGitHubInstallations,
  getEonForgeGitHubCommitTreeSha,
  getEonForgeGitHubCommitProof,
  getEonForgeGitHubPullRequest,
  ensureEonForgeGitHubPullRequestMerged,
  getEonForgeGitHubCiStatus,
  mergeEonForgeGitHubPullRequest,
  stageEonForgeGitHubBundle,
  stageEonForgeGitHubRollback,
  stageEonForgeGitHubTreeRestore
} from '../../functions/_shared/eon-forge-github-api.js';

const SHA = (ch) => ch.repeat(40);
const USER_TOKEN = ['ghu','abcdefghijklmnopqrstuvwxyz123456'].join('_');
const FINE_TOKEN = ['github','pat','abcdefghijklmnopqrstuvwxyz1234567890'].join('_');
function fake(routes) {
  const calls=[];
  const fetchImpl=async (url, options={})=>{
    const u=new URL(url); const key=`${options.method||'GET'} ${u.pathname}${u.search}`; calls.push({key,options});
    const hit=routes.shift(); assert.equal(key,hit.key);
    return new Response(hit.body === undefined ? null : JSON.stringify(hit.body), {status:hit.status||200, headers:{'content-type':'application/json'}});
  };
  return {fetchImpl,calls,routes};
}


test('RT89 GitHub adapter initializes new repositories and confines authenticated requests to the GitHub API origin', async () => {
  const mock=fake([
    {key:'POST /user/repos',status:201,body:{id:44,name:'demo',owner:{login:'acme'},default_branch:'main',private:true,html_url:'https://github.com/acme/demo',description:'EONAPP Forge'}}
  ]);
  const repo=await createEonForgeGitHubRepository({token:USER_TOKEN,name:'demo',description:'EONAPP Forge',privateRepo:true,fetchImpl:mock.fetchImpl});
  assert.equal(repo.defaultBranch,'main');
  const body=JSON.parse(mock.calls[0].options.body);
  assert.equal(body.auto_init,true);
  assert.equal(mock.calls[0].options.redirect,'error');
  await assert.rejects(eonForgeGitHubRequest('//evil.example/path',{token:USER_TOKEN,fetchImpl:mock.fetchImpl}),/github-api-path-invalid/);
  await assert.rejects(eonForgeGitHubRequest('/user',{token:USER_TOKEN,method:'TRACE',fetchImpl:mock.fetchImpl}),/github-api-method-invalid/);
});

test('RT89 GitHub adapter redacts both GitHub App and fine-grained token forms from bounded API errors', async () => {
  for (const leaked of [USER_TOKEN,FINE_TOKEN]) {
    const fetchImpl=async ()=>new Response(JSON.stringify({message:`Denied ${leaked}`}),{status:403,headers:{'content-type':'application/json'}});
    await assert.rejects(
      eonForgeGitHubRequest('/user',{token:USER_TOKEN,fetchImpl}),
      (error)=>{ assert.doesNotMatch(String(error?.message||''),/ghu_|github_pat_/); assert.match(String(error?.message||''),/\[redacted-token\]/); return true; }
    );
  }
});

test('RT89 GitHub adapter proves GitHub App installation readiness from the bounded user-installations endpoint', async () => {
  const mock=fake([{
    key:'GET /user/installations?per_page=100',
    body:{installations:[
      {id:11,account:{login:'acme'},repository_selection:'all',permissions:{administration:'write',contents:'write',workflows:'write',pull_requests:'write',actions:'read',pages:'write'}},
      {id:12,account:{login:'other'},repository_selection:'selected',permissions:{administration:'read',contents:'write',pull_requests:'write',actions:'read',pages:'write'}}
    ]}
  }]);
  const proof=await getEonForgeGitHubInstallations({token:USER_TOKEN,fetchImpl:mock.fetchImpl});
  assert.equal(proof.count,2);
  assert.equal(proof.readyCount,1);
  assert.deepEqual(proof.installations[0],{id:11,account:'acme',repositorySelection:'all',ready:true,missingPermissions:[]});
  assert.equal(proof.installations[1].ready,false);
  assert.deepEqual([...proof.installations[1].missingPermissions].sort(),['administration','workflows']);
  assert.equal(mock.calls[0].key,'GET /user/installations?per_page=100');
  assert.doesNotMatch(JSON.stringify(proof),/ghu_/);
});

test('RT89 GitHub adapter stages one atomic multi-file commit on a new review branch without force update', async () => {
  const routes=[
    {key:'GET /repos/acme/site/git/ref/heads/main',body:{object:{sha:SHA('a')}}},
    {key:'GET /repos/acme/site/git/ref/heads/eonapp%2Fdemo-abcdef',status:404,body:{message:'Not Found'}},
    {key:`GET /repos/acme/site/git/commits/${SHA('a')}`,body:{tree:{sha:SHA('b')}}},
    {key:'POST /repos/acme/site/git/blobs',status:201,body:{sha:SHA('c')}},
    {key:'POST /repos/acme/site/git/blobs',status:201,body:{sha:SHA('d')}},
    {key:'POST /repos/acme/site/git/trees',status:201,body:{sha:SHA('e')}},
    {key:'POST /repos/acme/site/git/refs',status:201,body:{ref:'refs/heads/eonapp/demo-abcdef'}},
    {key:'POST /repos/acme/site/git/commits',status:201,body:{sha:SHA('f')}},
    {key:'PATCH /repos/acme/site/git/refs/heads/eonapp%2Fdemo-abcdef',body:{ref:'refs/heads/eonapp/demo-abcdef',object:{sha:SHA('f')}}}
  ];
  const mock=fake(routes);
  const result=await stageEonForgeGitHubBundle({token:USER_TOKEN,owner:'acme',repo:'site',defaultBranch:'main',branchName:'eonapp/demo-abcdef',files:{'index.html':'ok','style.css':'x'},fetchImpl:mock.fetchImpl});
  assert.equal(result.beforeSha,SHA('a')); assert.equal(result.stagedSha,SHA('f')); assert.equal(result.fileCount,2);
  assert.equal(mock.routes.length,0);
  assert.equal(mock.calls.at(-1).options.method,'PATCH');
  assert.deepEqual(JSON.parse(mock.calls.at(-1).options.body), { sha: SHA('f'), force: false });
  assert.doesNotMatch(JSON.stringify(mock.calls),/\"force\":true/i);
  assert.equal(mock.calls[0].options.headers['x-github-api-version'],EON_FORGE_GITHUB_API_VERSION);
});


test('RT89 GitHub adapter decodes Forge data-URL image assets into base64 Git blobs', async () => {
  const routes=[
    {key:'GET /repos/acme/site/git/ref/heads/main',body:{object:{sha:SHA('a')}}},
    {key:'GET /repos/acme/site/git/ref/heads/eonapp%2Fasset-review',status:404,body:{message:'Not Found'}},
    {key:`GET /repos/acme/site/git/commits/${SHA('a')}`,body:{tree:{sha:SHA('b')}}},
    {key:'POST /repos/acme/site/git/blobs',status:201,body:{sha:SHA('c')}},
    {key:'POST /repos/acme/site/git/trees',status:201,body:{sha:SHA('e')}},
    {key:'POST /repos/acme/site/git/refs',status:201,body:{}},
    {key:'POST /repos/acme/site/git/commits',status:201,body:{sha:SHA('f')}},
    {key:'PATCH /repos/acme/site/git/refs/heads/eonapp%2Fasset-review',body:{}}
  ];
  const mock=fake(routes); const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
  await stageEonForgeGitHubBundle({token:USER_TOKEN,owner:'acme',repo:'site',defaultBranch:'main',branchName:'eonapp/asset-review',files:{'assets/logo.png':`data:image/png;base64,${png}`},fetchImpl:mock.fetchImpl});
  const blobBody=JSON.parse(mock.calls.find((call)=>call.key==='POST /repos/acme/site/git/blobs').options.body); assert.equal(blobBody.encoding,'base64'); assert.equal(blobBody.content,png);
});


test('RT89 GitHub adapter re-adopts only an exact previously staged remote commit after an interrupted acknowledgement', async () => {
  const message='Publish reviewed EONAPP Forge project';
  const mock=fake([
    {key:'GET /repos/acme/site/git/ref/heads/main',body:{object:{sha:SHA('a')}}},
    {key:'GET /repos/acme/site/git/ref/heads/eonapp%2Fretry-safe',body:{object:{sha:SHA('f')}}},
    {key:`GET /repos/acme/site/git/commits/${SHA('a')}`,body:{tree:{sha:SHA('b')}}},
    {key:'POST /repos/acme/site/git/blobs',status:201,body:{sha:SHA('c')}},
    {key:'POST /repos/acme/site/git/trees',status:201,body:{sha:SHA('e')}},
    {key:`GET /repos/acme/site/git/commits/${SHA('f')}`,body:{tree:{sha:SHA('e')},parents:[{sha:SHA('a')}],message}}
  ]);
  const result=await stageEonForgeGitHubBundle({token:USER_TOKEN,owner:'acme',repo:'site',defaultBranch:'main',branchName:'eonapp/retry-safe',files:{'index.html':'ok'},commitMessage:message,fetchImpl:mock.fetchImpl});
  assert.equal(result.recoveredExactRemoteStage,true);
  assert.equal(result.stagedSha,SHA('f'));
  assert.equal(mock.calls.some((call)=>call.key==='POST /repos/acme/site/git/commits'),false);
  assert.equal(mock.calls.some((call)=>call.key.startsWith('PATCH /repos/acme/site/git/refs/heads/')),false);
  assert.equal(mock.routes.length,0);
});

test('RT89 GitHub adapter rejects a conflicting pre-existing review branch instead of overwriting it', async () => {
  const mock=fake([
    {key:'GET /repos/acme/site/git/ref/heads/main',body:{object:{sha:SHA('a')}}},
    {key:'GET /repos/acme/site/git/ref/heads/eonapp%2Fconflict',body:{object:{sha:SHA('f')}}},
    {key:`GET /repos/acme/site/git/commits/${SHA('a')}`,body:{tree:{sha:SHA('b')}}},
    {key:'POST /repos/acme/site/git/blobs',status:201,body:{sha:SHA('c')}},
    {key:'POST /repos/acme/site/git/trees',status:201,body:{sha:SHA('e')}},
    {key:`GET /repos/acme/site/git/commits/${SHA('f')}`,body:{tree:{sha:SHA('9')},parents:[{sha:SHA('a')}],message:'Somebody else changed it'}}
  ]);
  await assert.rejects(
    stageEonForgeGitHubBundle({token:USER_TOKEN,owner:'acme',repo:'site',defaultBranch:'main',branchName:'eonapp/conflict',files:{'index.html':'ok'},fetchImpl:mock.fetchImpl}),
    /github-review-branch-conflict/
  );
  assert.equal(mock.calls.some((call)=>call.key.startsWith('PATCH /repos/acme/site/git/refs/heads/')),false);
});

test('RT89 GitHub adapter reuses the exact open review PR and never creates a duplicate', async () => {
  const mock=fake([
    {key:'GET /repos/acme/site/pulls?state=open&head=acme%3Aeonapp%2Fdemo-abcdef&base=main&per_page=20',body:[{number:7,html_url:'https://github.com/acme/site/pull/7',state:'open',head:{sha:SHA('f')},base:{ref:'main'}}]}
  ]);
  const pr=await ensureEonForgeGitHubPullRequest({token:USER_TOKEN,owner:'acme',repo:'site',branchName:'eonapp/demo-abcdef',defaultBranch:'main',expectedHeadSha:SHA('f'),title:'Review Demo',fetchImpl:mock.fetchImpl});
  assert.equal(pr.number,7);
  assert.equal(pr.recoveredExisting,true);
  assert.equal(mock.calls.some((call)=>call.key==='POST /repos/acme/site/pulls'),false);
});


test('RT89 GitHub adapter accepts only a valid EONAPP managed manifest from the selected default branch', async () => {
  const manifest={schema:'eonapp.forge.github-manifest.rt89.v1',projectSlug:'demo',generatedPaths:['index.html','style.css']};
  const content=Buffer.from(JSON.stringify(manifest)).toString('base64');
  const mock=fake([{key:'GET /repos/acme/site/contents/.eonapp/publish-manifest.json?ref=main',body:{encoding:'base64',content}}]);
  const result=await getEonForgeGitHubManagedManifest({token:USER_TOKEN,owner:'acme',repo:'site',branchName:'main',fetchImpl:mock.fetchImpl});
  assert.equal(result.exists,true); assert.equal(result.projectSlug,'demo'); assert.deepEqual(result.generatedPaths,['index.html','style.css']);
});

test('RT89 GitHub adapter stages deletions for prior managed files but blocks first-adoption control-file collisions', async () => {
  const mock=fake([
    {key:'GET /repos/acme/site/git/ref/heads/main',body:{object:{sha:SHA('a')}}},
    {key:'GET /repos/acme/site/git/ref/heads/eonapp%2Fmanaged-update',status:404,body:{message:'Not Found'}},
    {key:`GET /repos/acme/site/git/commits/${SHA('a')}`,body:{tree:{sha:SHA('b')}}},
    {key:'POST /repos/acme/site/git/blobs',status:201,body:{sha:SHA('c')}},
    {key:'POST /repos/acme/site/git/trees',status:201,body:{sha:SHA('e')}},
    {key:'POST /repos/acme/site/git/refs',status:201,body:{}},
    {key:'POST /repos/acme/site/git/commits',status:201,body:{sha:SHA('f')}},
    {key:'PATCH /repos/acme/site/git/refs/heads/eonapp%2Fmanaged-update',body:{}}
  ]);
  await stageEonForgeGitHubBundle({token:USER_TOKEN,owner:'acme',repo:'site',defaultBranch:'main',branchName:'eonapp/managed-update',files:{'index.html':'new'},deletePaths:['old.css'],fetchImpl:mock.fetchImpl});
  const treeBody=JSON.parse(mock.calls.find((call)=>call.key==='POST /repos/acme/site/git/trees').options.body);
  assert.ok(treeBody.tree.some((entry)=>entry.path==='old.css'&&entry.sha===null));

  const collision=fake([
    {key:'GET /repos/acme/site/git/ref/heads/main',body:{object:{sha:SHA('a')}}},
    {key:'GET /repos/acme/site/git/ref/heads/eonapp%2Fcontrol-check',status:404,body:{message:'Not Found'}},
    {key:`GET /repos/acme/site/git/commits/${SHA('a')}`,body:{tree:{sha:SHA('b')}}},
    {key:'POST /repos/acme/site/git/blobs',status:201,body:{sha:SHA('c')}},
    {key:`GET /repos/acme/site/git/trees/${SHA('b')}?recursive=1`,body:{tree:[{path:'.github/workflows/eonapp-ci-pages.yml',sha:SHA('9'),type:'blob'}]}}
  ]);
  await assert.rejects(stageEonForgeGitHubBundle({token:USER_TOKEN,owner:'acme',repo:'site',defaultBranch:'main',branchName:'eonapp/control-check',files:{'.github/workflows/eonapp-ci-pages.yml':'ours'},protectedPaths:['.github/workflows/eonapp-ci-pages.yml'],fetchImpl:collision.fetchImpl}),/github-control-path-conflict/);
  assert.equal(collision.calls.some((call)=>call.key==='POST /repos/acme/site/git/trees'),false);
});


test('RT89 GitHub adapter recovers an exact squash merge after an interrupted merge acknowledgement', async () => {
  const mock=fake([
    {key:'GET /repos/acme/site/pulls/7',body:{number:7,state:'open',merged:false,merge_commit_sha:SHA('0'),head:{sha:SHA('b')},base:{ref:'main'}}},
    {key:'PUT /repos/acme/site/pulls/7/merge',status:502,body:{message:'gateway lost response'}},
    {key:'GET /repos/acme/site/pulls/7',body:{number:7,state:'closed',merged:true,merge_commit_sha:SHA('d'),head:{sha:SHA('b')},base:{ref:'main'}}}
  ]);
  const recovered=await ensureEonForgeGitHubPullRequestMerged({token:USER_TOKEN,owner:'acme',repo:'site',pullNumber:7,expectedHeadSha:SHA('b'),defaultBranch:'main',fetchImpl:mock.fetchImpl});
  assert.equal(recovered.merged,true); assert.equal(recovered.mergedSha,SHA('d')); assert.equal(recovered.recoveredExisting,true);
  assert.equal(mock.routes.length,0);
});

test('RT89 GitHub adapter refuses merge recovery when the PR head or base no longer matches the reviewed target', async () => {
  const drift=fake([{key:'GET /repos/acme/site/pulls/7',body:{number:7,state:'closed',merged:true,merge_commit_sha:SHA('d'),head:{sha:SHA('9')},base:{ref:'main'}}}]);
  await assert.rejects(ensureEonForgeGitHubPullRequestMerged({token:USER_TOKEN,owner:'acme',repo:'site',pullNumber:7,expectedHeadSha:SHA('b'),defaultBranch:'main',fetchImpl:drift.fetchImpl}),/github-pr-head-sha-drift/);
});

test('RT89 GitHub adapter observes CI success before merge and pins merge to reviewed head SHA', async () => {
  const mock=fake([
    {key:`GET /repos/acme/site/actions/runs?head_sha=${SHA('f')}&per_page=30`,body:{workflow_runs:[{id:88,name:'EONAPP Forge CI and Pages',path:'.github/workflows/eonapp-ci-pages.yml',status:'completed',conclusion:'success',html_url:'https://github.com/acme/site/actions/runs/88'}]}},
    {key:'PUT /repos/acme/site/pulls/7/merge',body:{merged:true,sha:SHA('9'),message:'merged'}}
  ]);
  const ci=await getEonForgeGitHubCiStatus({token:USER_TOKEN,owner:'acme',repo:'site',headSha:SHA('f'),fetchImpl:mock.fetchImpl});
  assert.equal(ci.status,'success');
  const merged=await mergeEonForgeGitHubPullRequest({token:USER_TOKEN,owner:'acme',repo:'site',pullNumber:7,expectedHeadSha:SHA('f'),fetchImpl:mock.fetchImpl});
  assert.equal(merged.mergedSha,SHA('9'));
  const mergeBody=JSON.parse(mock.calls[1].options.body); assert.equal(mergeBody.sha,SHA('f')); assert.equal(mergeBody.merge_method,'squash');
});

test('RT89 GitHub adapter creates review PR and configures Pages workflow without exposing token in output', async () => {
  const mock=fake([
    {key:'POST /repos/acme/site/pulls',status:201,body:{number:7,html_url:'https://github.com/acme/site/pull/7',state:'open',head:{sha:SHA('f')}}},
    {key:'GET /repos/acme/site/pages',status:404,body:{message:'Not Found'}},
    {key:'POST /repos/acme/site/pages',status:201,body:{html_url:'https://acme.github.io/site/'}}
  ]);
  const pr=await createEonForgeGitHubPullRequest({token:USER_TOKEN,owner:'acme',repo:'site',branchName:'eonapp/demo-abcdef',defaultBranch:'main',title:'Review Demo',fetchImpl:mock.fetchImpl});
  assert.equal(pr.number,7);
  const pages=await ensureEonForgeGitHubPagesWorkflow({token:USER_TOKEN,owner:'acme',repo:'site',fetchImpl:mock.fetchImpl});
  assert.equal(pages.configured,true); assert.equal(pages.changed,true);
  assert.doesNotMatch(JSON.stringify({pr,pages}),/ghu_/);
});


test('RT89 GitHub rollback restores prior source while retaining the current EONAPP Pages control plane', async () => {
  const currentTree=SHA('c'); const restoreTree=SHA('r'.replace('r','b')); // valid hex tree SHA
  const mock=fake([
    {key:'GET /repos/acme/site/git/ref/heads/main',body:{object:{sha:SHA('a')}}},
    {key:'GET /repos/acme/site/git/ref/heads/eonapp%2Frollback-demo-1234',status:404,body:{message:'Not Found'}},
    {key:`GET /repos/acme/site/git/commits/${SHA('a')}`,body:{tree:{sha:currentTree}}},
    {key:`GET /repos/acme/site/git/commits/${SHA('9')}`,body:{tree:{sha:restoreTree}}},
    {key:`GET /repos/acme/site/git/trees/${currentTree}?recursive=1`,body:{tree:[
      {path:'index.html',mode:'100644',type:'blob',sha:SHA('1')},
      {path:'style.css',mode:'100644',type:'blob',sha:SHA('2')},
      {path:'.github/workflows/eonapp-ci-pages.yml',mode:'100644',type:'blob',sha:SHA('3')},
      {path:'.eonapp/publish-manifest.json',mode:'100644',type:'blob',sha:SHA('4')}
    ]}},
    {key:`GET /repos/acme/site/git/trees/${restoreTree}?recursive=1`,body:{tree:[
      {path:'index.html',mode:'100644',type:'blob',sha:SHA('5')},
      {path:'README.md',mode:'100644',type:'blob',sha:SHA('6')}
    ]}},
    {key:'POST /repos/acme/site/git/trees',status:201,body:{sha:SHA('7')}},
    {key:'POST /repos/acme/site/git/refs',status:201,body:{}},
    {key:'POST /repos/acme/site/git/commits',status:201,body:{sha:SHA('8')}},
    {key:'PATCH /repos/acme/site/git/refs/heads/eonapp%2Frollback-demo-1234',body:{}}
  ]);
  const result=await stageEonForgeGitHubRollback({
    token:USER_TOKEN,owner:'acme',repo:'site',defaultBranch:'main',
    expectedCurrentSha:SHA('a'),restoreSha:SHA('9'),branchName:'eonapp/rollback-demo-1234',
    protectedPaths:['.github/workflows/eonapp-ci-pages.yml','.eonapp/publish-manifest.json'],fetchImpl:mock.fetchImpl
  });
  const treeBody=JSON.parse(mock.calls.find((call)=>call.key==='POST /repos/acme/site/git/trees').options.body);
  assert.ok(treeBody.tree.some((entry)=>entry.path==='index.html'&&entry.sha===SHA('5')));
  assert.ok(treeBody.tree.some((entry)=>entry.path==='README.md'&&entry.sha===SHA('6')));
  assert.ok(treeBody.tree.some((entry)=>entry.path==='style.css'&&entry.sha===null));
  assert.equal(treeBody.tree.some((entry)=>entry.path.startsWith('.github/')||entry.path.startsWith('.eonapp/')),false);
  assert.equal(result.exactTreeRestore,false);
  assert.equal(result.rollbackSha,SHA('8'));
  assert.equal(mock.routes.length,0);
});


test('RT89 GitHub adapter closes review PRs and deletes only EONAPP review branches', async () => {
  const mock=fake([
    {key:'PATCH /repos/acme/site/pulls/7',body:{state:'closed',html_url:'https://github.com/acme/site/pull/7'}},
    {key:'DELETE /repos/acme/site/git/refs/heads/eonapp%2Fdemo-review',status:204}
  ]);
  const closed=await closeEonForgeGitHubPullRequest({token:USER_TOKEN,owner:'acme',repo:'site',pullNumber:7,fetchImpl:mock.fetchImpl});
  const deleted=await deleteEonForgeGitHubBranch({token:USER_TOKEN,owner:'acme',repo:'site',branchName:'eonapp/demo-review',fetchImpl:mock.fetchImpl});
  assert.equal(closed.state,'closed'); assert.equal(deleted.deleted,true);
  await assert.rejects(deleteEonForgeGitHubBranch({token:USER_TOKEN,owner:'acme',repo:'site',branchName:'main',fetchImpl:mock.fetchImpl}),/github-delete-branch-target-invalid/);
});

test('RT89 exact rollback helper produces the immutable pre-Forge tree with no protected-path exception', async () => {
  const currentTree=SHA('c'); const restoreTree=SHA('b');
  const mock=fake([
    {key:'GET /repos/acme/site/git/ref/heads/main',body:{object:{sha:SHA('d')}}},
    {key:'GET /repos/acme/site/git/ref/heads/eonapp%2Frollback-exact',status:404,body:{message:'Not Found'}},
    {key:`GET /repos/acme/site/git/commits/${SHA('d')}`,body:{tree:{sha:currentTree}}},
    {key:`GET /repos/acme/site/git/commits/${SHA('a')}`,body:{tree:{sha:restoreTree}}},
    {key:`GET /repos/acme/site/git/trees/${currentTree}?recursive=1`,body:{tree:[
      {path:'index.html',mode:'100644',type:'blob',sha:SHA('1')},
      {path:'.github/workflows/eonapp-ci-pages.yml',mode:'100644',type:'blob',sha:SHA('2')}
    ]}},
    {key:`GET /repos/acme/site/git/trees/${restoreTree}?recursive=1`,body:{tree:[
      {path:'README.md',mode:'100644',type:'blob',sha:SHA('3')}
    ]}},
    {key:'POST /repos/acme/site/git/trees',status:201,body:{sha:restoreTree}},
    {key:'POST /repos/acme/site/git/refs',status:201,body:{}},
    {key:'POST /repos/acme/site/git/commits',status:201,body:{sha:SHA('e')}},
    {key:'PATCH /repos/acme/site/git/refs/heads/eonapp%2Frollback-exact',body:{}}
  ]);
  const result=await stageEonForgeGitHubTreeRestore({token:USER_TOKEN,owner:'acme',repo:'site',defaultBranch:'main',branchName:'eonapp/rollback-exact',expectedCurrentSha:SHA('d'),restoreFromSha:SHA('a'),protectedPaths:[],fetchImpl:mock.fetchImpl});
  assert.equal(result.exactTreeRestore,true); assert.equal(result.restoreTreeSha,restoreTree); assert.equal(result.rollbackSha,SHA('e'));
  const body=JSON.parse(mock.calls.find((call)=>call.key==='POST /repos/acme/site/git/trees').options.body);
  assert.ok(body.tree.some((entry)=>entry.path==='README.md'&&entry.sha===SHA('3')));
  assert.ok(body.tree.some((entry)=>entry.path==='index.html'&&entry.sha===null));
  assert.ok(body.tree.some((entry)=>entry.path==='.github/workflows/eonapp-ci-pages.yml'&&entry.sha===null));
});

test('RT89 commit-tree proof reads only the immutable Git tree SHA for the reviewed commit', async () => {
  const mock=fake([{key:`GET /repos/acme/site/git/commits/${SHA('e')}`,body:{tree:{sha:SHA('b')}}}]);
  const proof=await getEonForgeGitHubCommitTreeSha({token:USER_TOKEN,owner:'acme',repo:'site',commitSha:SHA('e'),fetchImpl:mock.fetchImpl});
  assert.deepEqual(proof,{commitSha:SHA('e'),treeSha:SHA('b')});
});


test('RT89 commit proof exposes immutable tree and parent SHAs for interrupted-merge recovery', async () => {
  const mock=fake([{key:`GET /repos/acme/site/git/commits/${SHA('d')}`,body:{tree:{sha:SHA('c')},parents:[{sha:SHA('a')}]}}]);
  const proof=await getEonForgeGitHubCommitProof({token:USER_TOKEN,owner:'acme',repo:'site',commitSha:SHA('d'),fetchImpl:mock.fetchImpl});
  assert.deepEqual(proof,{commitSha:SHA('d'),treeSha:SHA('c'),parentShas:[SHA('a')]});
});
