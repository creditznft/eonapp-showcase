/** RT89 — bounded GitHub REST adapter for reviewed Forge publishing. */
export const EON_FORGE_GITHUB_API_SCHEMA = 'eonapp.forge.github-api.rt89.v1';
export const EON_FORGE_GITHUB_API_VERSION = '2026-03-10';
export const EON_FORGE_GITHUB_REQUIRED_INSTALLATION_PERMISSIONS = Object.freeze({ administration:'write', contents:'write', workflows:'write', pull_requests:'write', actions:'read', pages:'write' });
const freeze = Object.freeze;

function clean(value = '', max = 180) { return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max); }
function repoPart(value = '') { const out = clean(value, 100); return /^[A-Za-z0-9_.-]{1,100}$/.test(out) ? out : ''; }
function branch(value = '') { const out = clean(value, 160); return /^(?!\/)(?!.*\.\.)(?!.*[~^:?*\[\\])(?!.+\/$)[A-Za-z0-9._\/-]{1,160}$/.test(out) ? out : ''; }
function redactCredential(value = '') { return String(value ?? '').replace(/(?:gh[pousr]_[A-Za-z0-9_]{12,}|github_pat_[A-Za-z0-9_]{20,})/g, '[redacted-token]'); }
function boundedError(payload, status) {
  const message = redactCredential(clean(payload?.message || payload?.error || `github-http-${status}`, 160));
  const error = new Error(message || `github-http-${status}`);
  error.code = `github-http-${status}`;
  error.status = status;
  return error;
}

export async function eonForgeGitHubRequest(path, { token = '', method = 'GET', body = null, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('github-fetch-required');
  const credential = String(token || '');
  if (!/^gh[urs]_[A-Za-z0-9_]{16,}$/.test(credential) && !/^github_pat_[A-Za-z0-9_]{20,}$/.test(credential)) throw new Error('github-user-token-required');
  const target = String(path || '');
  const verb = String(method || 'GET').toUpperCase();
  if (!target.startsWith('/') || target.startsWith('//') || /[\r\n]/.test(target)) throw new Error('github-api-path-invalid');
  if (!['GET','POST','PUT','PATCH','DELETE'].includes(verb)) throw new Error('github-api-method-invalid');
  const response = await fetchImpl(`https://api.github.com${target}`, {
    method: verb,
    redirect: 'error',
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${credential}`,
      'x-github-api-version': EON_FORGE_GITHUB_API_VERSION,
      'user-agent': 'EONAPP-Forge'
    },
    body: body == null ? undefined : JSON.stringify(body)
  });
  let payload = null;
  if (response.status !== 204) {
    try { payload = await response.json(); } catch { payload = null; }
  }
  if (!response.ok) throw boundedError(payload, response.status);
  return freeze({ status: response.status, payload });
}

export async function getEonForgeGitHubUser({ token, fetchImpl } = {}) {
  const { payload } = await eonForgeGitHubRequest('/user', { token, fetchImpl });
  const login = repoPart(payload?.login);
  const id = Number(payload?.id || 0);
  if (!login || !Number.isSafeInteger(id) || id <= 0) throw new Error('github-user-shape-invalid');
  return freeze({ login, id });
}

function permissionLevel(value=''){ const normalized=clean(value,16).toLowerCase(); return normalized==='admin'?3:normalized==='write'?2:normalized==='read'?1:0; }
function installationPermissionProof(permissions={}){
  const missing=[];
  for(const [name,level] of Object.entries(EON_FORGE_GITHUB_REQUIRED_INSTALLATION_PERMISSIONS)) if(permissionLevel(permissions?.[name])<permissionLevel(level)) missing.push(name);
  return freeze({ready:missing.length===0,missingPermissions:freeze(missing)});
}
export async function getEonForgeGitHubInstallations({token,fetchImpl}={}){
  const {payload}=await eonForgeGitHubRequest('/user/installations?per_page=100',{token,fetchImpl});
  const raw=Array.isArray(payload?.installations)?payload.installations:[];
  const installations=raw.slice(0,100).map((item)=>{
    const id=Number(item?.id||0); const account=repoPart(item?.account?.login||''); const selection=clean(item?.repository_selection,24).toLowerCase(); const proof=installationPermissionProof(item?.permissions||{});
    if(!Number.isSafeInteger(id)||id<=0||!account) return null;
    return freeze({id,account,repositorySelection:['all','selected'].includes(selection)?selection:'unknown',ready:proof.ready,missingPermissions:proof.missingPermissions});
  }).filter(Boolean);
  return freeze({count:installations.length,readyCount:installations.filter((item)=>item.ready).length,installations:freeze(installations)});
}
export async function getEonForgeGitHubRepository({ token, owner, repo, fetchImpl } = {}) {
  const safeOwner = repoPart(owner); const safeRepo = repoPart(repo);
  if (!safeOwner || !safeRepo) throw new Error('github-repository-required');
  const { payload } = await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}`, { token, fetchImpl });
  const defaultBranch = branch(payload?.default_branch || '');
  if (!defaultBranch) throw new Error('github-default-branch-missing');
  const id=Number(payload?.id||0); return freeze({ id:Number.isSafeInteger(id)&&id>0?id:null, owner: repoPart(payload?.owner?.login) || safeOwner, repo: repoPart(payload?.name) || safeRepo, defaultBranch, private: payload?.private === true, htmlUrl: clean(payload?.html_url, 300), description: clean(payload?.description, 240) });
}

export async function createEonForgeGitHubRepository({ token, name, description = '', privateRepo = false, fetchImpl } = {}) {
  const repo = repoPart(name);
  if (!repo) throw new Error('github-repository-name-invalid');
  const { payload } = await eonForgeGitHubRequest('/user/repos', {
    token, method: 'POST', fetchImpl,
    body: { name: repo, description: clean(description, 200), private: privateRepo === true, auto_init: true }
  });
  const owner = repoPart(payload?.owner?.login);
  const defaultBranch = branch(payload?.default_branch || 'main');
  if (!owner || !defaultBranch) throw new Error('github-created-repository-shape-invalid');
  const id=Number(payload?.id||0); if(!Number.isSafeInteger(id)||id<=0) throw new Error('github-created-repository-id-invalid'); return freeze({ id, owner, repo: repoPart(payload?.name) || repo, defaultBranch, private: payload?.private === true, htmlUrl: clean(payload?.html_url, 300), description: clean(payload?.description, 240) });
}

export async function getEonForgeGitHubManagedManifest({ token, owner, repo, branchName, fetchImpl } = {}) {
  const safeOwner=repoPart(owner); const safeRepo=repoPart(repo); const safeBranch=branch(branchName);
  if(!safeOwner||!safeRepo||!safeBranch) throw new Error('github-managed-manifest-target-invalid');
  const path='/repos/'+safeOwner+'/'+safeRepo+'/contents/.eonapp/publish-manifest.json?ref='+encodeURIComponent(safeBranch);
  try {
    const {payload}=await eonForgeGitHubRequest(path,{token,fetchImpl});
    if(String(payload?.encoding||'').toLowerCase()!=='base64' || typeof payload?.content!=='string') throw new Error('github-managed-manifest-invalid');
    let parsed=null;
    try { parsed=JSON.parse(atob(payload.content.replace(/\s+/g,''))); } catch { throw new Error('github-managed-manifest-invalid'); }
    if(parsed?.schema!=='eonapp.forge.github-manifest.rt89.v1' || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(String(parsed?.projectSlug||'')) || !Array.isArray(parsed?.generatedPaths) || !parsed.generatedPaths.length || parsed.generatedPaths.length>96) throw new Error('github-managed-manifest-invalid');
    const paths=[];
    for(const value of parsed.generatedPaths){ const candidate=String(value||''); if(!candidate || candidate.length>180 || candidate.startsWith('/') || candidate.includes('\\') || candidate.split('/').some((part)=>!part||part==='.'||part==='..') || !/^[A-Za-z0-9._/-]+$/.test(candidate) || candidate.startsWith('.eonapp/') || candidate.startsWith('.github/') || candidate.startsWith('.git/')) throw new Error('github-managed-manifest-invalid'); paths.push(candidate); }
    if(!paths.includes('index.html') || new Set(paths).size!==paths.length) throw new Error('github-managed-manifest-invalid');
    return freeze({exists:true,projectSlug:String(parsed.projectSlug),generatedPaths:freeze(paths)});
  } catch(error){ if(Number(error?.status||0)===404) return freeze({exists:false,projectSlug:'',generatedPaths:freeze([])}); throw error; }
}

function githubBlobPayload(path = '', content = '') {
  const body=String(content ?? '');
  const asset=/^assets\/[A-Za-z0-9._-]{1,96}$/.test(String(path||''));
  const data=asset ? body.match(/^data:image\/(?:png|jpeg|webp|gif|svg\+xml);base64,([A-Za-z0-9+/=\r\n]+)$/i) : null;
  return data ? { content:data[1].replace(/\s+/g,''), encoding:'base64' } : { content:body, encoding:'utf-8' };
}
async function createBlob({ token, owner, repo, path = '', content, fetchImpl }) {
  const { payload } = await eonForgeGitHubRequest(`/repos/${owner}/${repo}/git/blobs`, { token, method: 'POST', fetchImpl, body: githubBlobPayload(path,content) });
  const sha = clean(payload?.sha, 64); if (!/^[a-f0-9]{40}$/i.test(sha)) throw new Error('github-blob-sha-invalid');
  return sha;
}

export async function getEonForgeGitHubBranchSha({ token, owner, repo, branchName, fetchImpl } = {}) {
  const safeOwner = repoPart(owner); const safeRepo = repoPart(repo); const safeBranch = branch(branchName);
  if (!safeOwner || !safeRepo || !safeBranch) throw new Error('github-branch-target-invalid');
  try {
    const { payload } = await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/ref/heads/${encodeURIComponent(safeBranch)}`, { token, fetchImpl });
    const sha = clean(payload?.object?.sha, 64);
    if (!/^[a-f0-9]{40}$/i.test(sha)) throw new Error('github-branch-sha-invalid');
    return freeze({ exists: true, sha });
  } catch (error) {
    if (Number(error?.status || 0) === 404) return freeze({ exists: false, sha: '' });
    throw error;
  }
}


export async function getEonForgeGitHubCommitTreeSha({ token, owner, repo, commitSha, fetchImpl } = {}) {
  const safeOwner=repoPart(owner); const safeRepo=repoPart(repo); const sha=clean(commitSha,64);
  if(!safeOwner||!safeRepo||!/^[a-f0-9]{40}$/i.test(sha)) throw new Error('github-commit-tree-target-invalid');
  const { payload }=await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/commits/${sha}`,{token,fetchImpl});
  const treeSha=clean(payload?.tree?.sha,64); if(!/^[a-f0-9]{40}$/i.test(treeSha)) throw new Error('github-commit-tree-sha-invalid');
  return freeze({commitSha:sha,treeSha});
}

export async function getEonForgeGitHubCommitProof({ token, owner, repo, commitSha, fetchImpl } = {}) {
  const safeOwner=repoPart(owner); const safeRepo=repoPart(repo); const sha=clean(commitSha,64);
  if(!safeOwner||!safeRepo||!/^[a-f0-9]{40}$/i.test(sha)) throw new Error('github-commit-target-invalid');
  const { payload }=await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/commits/${sha}`,{token,fetchImpl});
  const treeSha=clean(payload?.tree?.sha,64); if(!/^[a-f0-9]{40}$/i.test(treeSha)) throw new Error('github-commit-tree-sha-invalid');
  const parentShas=(Array.isArray(payload?.parents)?payload.parents:[]).map((entry)=>clean(entry?.sha,64));
  if(parentShas.some((value)=>!/^[a-f0-9]{40}$/i.test(value))) throw new Error('github-commit-parent-sha-invalid');
  return freeze({commitSha:sha,treeSha,parentShas:freeze(parentShas)});
}

export async function stageEonForgeGitHubBundle({ token, owner, repo, defaultBranch, branchName, files = {}, deletePaths = [], protectedPaths = [], commitMessage = 'Publish reviewed EONAPP Forge project', fetchImpl } = {}) {
  const safeOwner = repoPart(owner); const safeRepo = repoPart(repo); const baseBranch = branch(defaultBranch); const nextBranch = branch(branchName);
  if (!safeOwner || !safeRepo || !baseBranch || !nextBranch || !nextBranch.startsWith('eonapp/')) throw new Error('github-stage-target-invalid');
  const entries = Object.entries(files || {});
  if (!entries.length || entries.length > 100) throw new Error('github-stage-files-invalid');
  const removals=[...new Set((Array.isArray(deletePaths)?deletePaths:[]).map((value)=>String(value||'')))];
  const protectedSet=new Set((Array.isArray(protectedPaths)?protectedPaths:[]).map((value)=>String(value||'')));
  if(removals.length>96 || protectedSet.size>16) throw new Error('github-stage-managed-paths-invalid');
  for(const safePath of [...removals,...protectedSet]) if(!safePath || safePath.startsWith('/') || safePath.includes('..') || safePath.includes('\\')) throw new Error('github-stage-managed-paths-invalid');

  const base = await getEonForgeGitHubBranchSha({ token, owner: safeOwner, repo: safeRepo, branchName: baseBranch, fetchImpl });
  if (!base.exists) throw new Error('github-default-branch-missing');
  const beforeSha = base.sha;
  const existingReview = await getEonForgeGitHubBranchSha({ token, owner: safeOwner, repo: safeRepo, branchName: nextBranch, fetchImpl });

  const baseCommit = await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/commits/${beforeSha}`, { token, fetchImpl });
  const baseTree = clean(baseCommit.payload?.tree?.sha, 64);
  if (!/^[a-f0-9]{40}$/i.test(baseTree)) throw new Error('github-base-tree-invalid');
  const tree = [];
  for (const [path, content] of entries) {
    const safePath = String(path || '');
    if (!safePath || safePath.startsWith('/') || safePath.includes('..') || safePath.includes('\\')) throw new Error('github-stage-file-path-invalid');
    const sha = await createBlob({ token, owner: safeOwner, repo: safeRepo, path: safePath, content, fetchImpl });
    tree.push({ path: safePath, mode: '100644', type: 'blob', sha });
  }
  for(const safePath of removals){ if(Object.hasOwn(files,safePath)) continue; tree.push({path:safePath,mode:'100644',type:'blob',sha:null}); }
  if(protectedSet.size){
    const baseListing=await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/trees/${baseTree}?recursive=1`,{token,fetchImpl});
    const baseEntries=Array.isArray(baseListing.payload?.tree)?baseListing.payload.tree:[];
    const byPath=new Map(baseEntries.map((entry)=>[String(entry?.path||''),clean(entry?.sha,64)]));
    const proposed=new Map(tree.filter((entry)=>entry.sha).map((entry)=>[entry.path,entry.sha]));
    for(const safePath of protectedSet){ const existingSha=byPath.get(safePath)||''; if(existingSha && existingSha!==proposed.get(safePath)) throw new Error(`github-control-path-conflict:${safePath}`); }
  }
  const createdTree = await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/trees`, { token, method: 'POST', fetchImpl, body: { base_tree: baseTree, tree } });
  const treeSha = clean(createdTree.payload?.sha, 64);
  if (!/^[a-f0-9]{40}$/i.test(treeSha)) throw new Error('github-tree-sha-invalid');

  // A network or database failure can happen after the review commit reached
  // GitHub but before EONAPP recorded it. Re-adopt only the exact tree, parent
  // and commit message we just recomputed; anything else is a hard conflict.
  if (existingReview.exists && existingReview.sha !== beforeSha) {
    const prior = await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/commits/${existingReview.sha}`, { token, fetchImpl });
    const priorTree = clean(prior.payload?.tree?.sha, 64);
    const priorParent = clean(prior.payload?.parents?.[0]?.sha, 64);
    const priorMessage = clean(prior.payload?.message, 180);
    if (priorTree !== treeSha || priorParent !== beforeSha || priorMessage !== clean(commitMessage, 180)) throw new Error('github-review-branch-conflict');
    return freeze({ owner: safeOwner, repo: safeRepo, defaultBranch: baseBranch, branchName: nextBranch, beforeSha, stagedSha: existingReview.sha, treeSha, fileCount: entries.length, reviewBranchCreated: false, recoveredExactRemoteStage: true });
  }
  if (!existingReview.exists) {
    await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/refs`, { token, method: 'POST', fetchImpl, body: { ref: `refs/heads/${nextBranch}`, sha: beforeSha } });
  }
  const createdCommit = await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/commits`, { token, method: 'POST', fetchImpl, body: { message: clean(commitMessage, 180), tree: treeSha, parents: [beforeSha] } });
  const stagedSha = clean(createdCommit.payload?.sha, 64);
  if (!/^[a-f0-9]{40}$/i.test(stagedSha)) throw new Error('github-commit-sha-invalid');
  await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/refs/heads/${encodeURIComponent(nextBranch)}`, { token, method: 'PATCH', fetchImpl, body: { sha: stagedSha, force: false } });
  return freeze({ owner: safeOwner, repo: safeRepo, defaultBranch: baseBranch, branchName: nextBranch, beforeSha, stagedSha, treeSha, fileCount: entries.length, reviewBranchCreated: !existingReview.exists, recoveredExactRemoteStage: false });
}


export async function stageEonForgeGitHubRollback({ token, owner, repo, defaultBranch, expectedCurrentSha, restoreSha, branchName, protectedPaths = [], commitMessage = 'Restore pre-EONAPP Forge source through review', fetchImpl } = {}) {
  const safeOwner=repoPart(owner); const safeRepo=repoPart(repo); const baseBranch=branch(defaultBranch); const rollbackBranch=branch(branchName);
  const expected=clean(expectedCurrentSha,64); const restore=clean(restoreSha,64); const protectedSet=new Set((Array.isArray(protectedPaths)?protectedPaths:[]).map((value)=>String(value||'')));
  if(!safeOwner||!safeRepo||!baseBranch||!rollbackBranch.startsWith('eonapp/rollback-')||!/^[a-f0-9]{40}$/i.test(expected)||!/^[a-f0-9]{40}$/i.test(restore)||protectedSet.size>16) throw new Error('github-rollback-target-invalid');
  const current=await getEonForgeGitHubBranchSha({token,owner:safeOwner,repo:safeRepo,branchName:baseBranch,fetchImpl});
  if(!current.exists||current.sha!==expected) throw new Error('github-rollback-default-branch-drift');
  const existing=await getEonForgeGitHubBranchSha({token,owner:safeOwner,repo:safeRepo,branchName:rollbackBranch,fetchImpl});
  const currentCommit=await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/commits/${expected}`,{token,fetchImpl});
  const restoreCommit=await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/commits/${restore}`,{token,fetchImpl});
  const currentTree=clean(currentCommit.payload?.tree?.sha,64); const restoreTree=clean(restoreCommit.payload?.tree?.sha,64);
  if(!/^[a-f0-9]{40}$/i.test(currentTree)||!/^[a-f0-9]{40}$/i.test(restoreTree)) throw new Error('github-rollback-tree-invalid');
  const [currentListing,restoreListing]=await Promise.all([
    eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/trees/${currentTree}?recursive=1`,{token,fetchImpl}),
    eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/trees/${restoreTree}?recursive=1`,{token,fetchImpl})
  ]);
  const leaves=(payload)=>new Map((Array.isArray(payload?.tree)?payload.tree:[]).filter((entry)=>entry?.type!=='tree'&&entry?.path).map((entry)=>[String(entry.path),{path:String(entry.path),mode:clean(entry.mode,12),type:clean(entry.type,12),sha:clean(entry.sha,64)}]));
  const currentLeaves=leaves(currentListing.payload); const restoreLeaves=leaves(restoreListing.payload); const tree=[];
  for(const [path,entry] of restoreLeaves){ if(protectedSet.has(path)) continue; if(!/^(?:100644|100755|120000|160000)$/.test(entry.mode)||!['blob','commit'].includes(entry.type)||!/^[a-f0-9]{40}$/i.test(entry.sha)) throw new Error('github-rollback-tree-entry-invalid'); const currentEntry=currentLeaves.get(path); if(!currentEntry||currentEntry.sha!==entry.sha||currentEntry.mode!==entry.mode||currentEntry.type!==entry.type) tree.push(entry); }
  for(const [path,entry] of currentLeaves){ if(protectedSet.has(path)||restoreLeaves.has(path)) continue; tree.push({path,mode:entry.mode||'100644',type:entry.type||'blob',sha:null}); }
  if(!tree.length) throw new Error('github-rollback-no-source-diff');
  const createdTree=await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/trees`,{token,method:'POST',fetchImpl,body:{base_tree:currentTree,tree}});
  const treeSha=clean(createdTree.payload?.sha,64); if(!/^[a-f0-9]{40}$/i.test(treeSha)) throw new Error('github-rollback-tree-sha-invalid');
  const exactTreeRestore=protectedSet.size===0;
  if(exactTreeRestore && treeSha!==restoreTree) throw new Error('github-rollback-exact-tree-mismatch');
  const message=clean(commitMessage,180);
  if(existing.exists&&existing.sha!==expected){ const prior=await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/commits/${existing.sha}`,{token,fetchImpl}); const priorTree=clean(prior.payload?.tree?.sha,64); const priorParent=clean(prior.payload?.parents?.[0]?.sha,64); const priorMessage=clean(prior.payload?.message,180); if(priorTree!==treeSha||priorParent!==expected||priorMessage!==message) throw new Error('github-rollback-branch-conflict'); return freeze({owner:safeOwner,repo:safeRepo,defaultBranch:baseBranch,branchName:rollbackBranch,fromSha:expected,restoreSha:restore,rollbackSha:existing.sha,treeSha,restoreTreeSha:restoreTree,exactTreeRestore,recoveredExactRemoteRollback:true}); }
  if(!existing.exists) await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/refs`,{token,method:'POST',fetchImpl,body:{ref:`refs/heads/${rollbackBranch}`,sha:expected}});
  const createdCommit=await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/commits`,{token,method:'POST',fetchImpl,body:{message,tree:treeSha,parents:[expected]}}); const rollbackSha=clean(createdCommit.payload?.sha,64); if(!/^[a-f0-9]{40}$/i.test(rollbackSha)) throw new Error('github-rollback-commit-sha-invalid');
  await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/refs/heads/${encodeURIComponent(rollbackBranch)}`,{token,method:'PATCH',fetchImpl,body:{sha:rollbackSha,force:false}});
  return freeze({owner:safeOwner,repo:safeRepo,defaultBranch:baseBranch,branchName:rollbackBranch,fromSha:expected,restoreSha:restore,rollbackSha,treeSha,restoreTreeSha:restoreTree,exactTreeRestore,recoveredExactRemoteRollback:false});
}

export async function createEonForgeGitHubPullRequest({ token, owner, repo, branchName, defaultBranch, title, body = '', fetchImpl } = {}) {
  const safeOwner = repoPart(owner); const safeRepo = repoPart(repo); const head = branch(branchName); const base = branch(defaultBranch);
  if (!safeOwner || !safeRepo || !head || !base) throw new Error('github-pr-target-invalid');
  const response = await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/pulls`, { token, method: 'POST', fetchImpl, body: { title: clean(title, 180) || 'EONAPP Forge publish review', head, base, body: clean(body, 1200) } });
  const number = Number(response.payload?.number || 0);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error('github-pr-number-invalid');
  return freeze({ number, htmlUrl: clean(response.payload?.html_url, 300), state: clean(response.payload?.state, 20) || 'open', headSha: clean(response.payload?.head?.sha, 64) });
}

export async function ensureEonForgeGitHubPullRequest({ token, owner, repo, branchName, defaultBranch, expectedHeadSha = '', title, body = '', fetchImpl } = {}) {
  const safeOwner = repoPart(owner); const safeRepo = repoPart(repo); const head = branch(branchName); const base = branch(defaultBranch); const sha = clean(expectedHeadSha, 64);
  if (!safeOwner || !safeRepo || !head || !base || !/^[a-f0-9]{40}$/i.test(sha)) throw new Error('github-pr-target-invalid');
  const query = `/repos/${safeOwner}/${safeRepo}/pulls?state=open&head=${encodeURIComponent(`${safeOwner}:${head}`)}&base=${encodeURIComponent(base)}&per_page=20`;
  const { payload } = await eonForgeGitHubRequest(query, { token, fetchImpl });
  const existing = (Array.isArray(payload) ? payload : []).find((candidate) => clean(candidate?.head?.sha, 64) === sha && branch(candidate?.base?.ref || '') === base) || null;
  if (existing) {
    const number = Number(existing?.number || 0);
    if (!Number.isSafeInteger(number) || number <= 0) throw new Error('github-pr-number-invalid');
    return freeze({ number, htmlUrl: clean(existing?.html_url, 300), state: clean(existing?.state, 20) || 'open', headSha: sha, recoveredExisting: true });
  }
  const created = await createEonForgeGitHubPullRequest({ token, owner: safeOwner, repo: safeRepo, branchName: head, defaultBranch: base, title, body, fetchImpl });
  if (clean(created.headSha, 64) && clean(created.headSha, 64) !== sha) throw new Error('github-pr-head-sha-mismatch');
  return freeze({ ...created, recoveredExisting: false });
}

export async function getEonForgeGitHubCiStatus({ token, owner, repo, headSha, fetchImpl } = {}) {
  const safeOwner = repoPart(owner); const safeRepo = repoPart(repo); const sha = clean(headSha, 64);
  if (!safeOwner || !safeRepo || !/^[a-f0-9]{40}$/i.test(sha)) throw new Error('github-ci-target-invalid');
  const { payload } = await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/actions/runs?head_sha=${encodeURIComponent(sha)}&per_page=30`, { token, fetchImpl });
  const runs = Array.isArray(payload?.workflow_runs) ? payload.workflow_runs : [];
  const run = runs.find((candidate) => String(candidate?.path || '').endsWith('/eonapp-ci-pages.yml') || String(candidate?.name || '') === 'EONAPP Forge CI and Pages') || null;
  if (!run) return freeze({ status: 'pending', conclusion: '', runId: null, htmlUrl: '', headSha: sha });
  const status = clean(run.status, 32);
  const conclusion = clean(run.conclusion, 32);
  return freeze({ status: status === 'completed' ? (conclusion === 'success' ? 'success' : 'failed') : 'pending', conclusion, runId: Number(run.id || 0) || null, htmlUrl: clean(run.html_url, 300), headSha: sha });
}

export async function ensureEonForgeGitHubPagesWorkflow({ token, owner, repo, fetchImpl } = {}) {
  const safeOwner = repoPart(owner); const safeRepo = repoPart(repo);
  if (!safeOwner || !safeRepo) throw new Error('github-pages-target-invalid');
  try {
    const current = await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/pages`, { token, fetchImpl });
    if (String(current.payload?.build_type || '') === 'workflow') return freeze({ configured: true, changed: false, htmlUrl: clean(current.payload?.html_url, 300) });
    await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/pages`, { token, method: 'PUT', fetchImpl, body: { build_type: 'workflow' } });
    return freeze({ configured: true, changed: true, htmlUrl: clean(current.payload?.html_url, 300) });
  } catch (error) {
    if (Number(error?.status || 0) !== 404) throw error;
    const created = await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/pages`, { token, method: 'POST', fetchImpl, body: { build_type: 'workflow' } });
    return freeze({ configured: true, changed: true, htmlUrl: clean(created.payload?.html_url, 300) });
  }
}

export async function getEonForgeGitHubPullRequest({ token, owner, repo, pullNumber, fetchImpl } = {}) {
  const safeOwner = repoPart(owner); const safeRepo = repoPart(repo); const number = Number(pullNumber || 0);
  if (!safeOwner || !safeRepo || !Number.isSafeInteger(number) || number <= 0) throw new Error('github-pr-target-invalid');
  const { payload } = await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/pulls/${number}`, { token, fetchImpl });
  const headSha = clean(payload?.head?.sha, 64); const baseBranch = branch(payload?.base?.ref || '');
  const merged = payload?.merged === true; const mergeCommitSha = clean(payload?.merge_commit_sha, 64);
  if (!/^[a-f0-9]{40}$/i.test(headSha) || !baseBranch) throw new Error('github-pr-shape-invalid');
  if (merged && !/^[a-f0-9]{40}$/i.test(mergeCommitSha)) throw new Error('github-pr-merged-sha-invalid');
  return freeze({ number, state: clean(payload?.state, 20), merged, headSha, baseBranch, mergeCommitSha: merged ? mergeCommitSha : '' });
}

export async function ensureEonForgeGitHubPullRequestMerged({ token, owner, repo, pullNumber, expectedHeadSha, defaultBranch, title = '', fetchImpl } = {}) {
  const safeOwner = repoPart(owner); const safeRepo = repoPart(repo); const number = Number(pullNumber || 0); const sha = clean(expectedHeadSha, 64); const base = branch(defaultBranch);
  if (!safeOwner || !safeRepo || !Number.isSafeInteger(number) || number <= 0 || !/^[a-f0-9]{40}$/i.test(sha) || !base) throw new Error('github-merge-target-invalid');
  const assertProof = (proof) => {
    if (proof.headSha !== sha) throw new Error('github-pr-head-sha-drift');
    if (proof.baseBranch !== base) throw new Error('github-pr-base-branch-drift');
    return proof;
  };
  let proof = assertProof(await getEonForgeGitHubPullRequest({ token, owner: safeOwner, repo: safeRepo, pullNumber: number, fetchImpl }));
  if (proof.merged) return freeze({ merged: true, mergedSha: proof.mergeCommitSha, message: 'recovered-previous-merge', recoveredExisting: true });
  try {
    const merged = await mergeEonForgeGitHubPullRequest({ token, owner: safeOwner, repo: safeRepo, pullNumber: number, expectedHeadSha: sha, title, fetchImpl });
    return freeze({ ...merged, recoveredExisting: false });
  } catch (error) {
    // Recover only if GitHub now proves that this exact reviewed head was merged into the expected base.
    proof = assertProof(await getEonForgeGitHubPullRequest({ token, owner: safeOwner, repo: safeRepo, pullNumber: number, fetchImpl }));
    if (proof.merged) return freeze({ merged: true, mergedSha: proof.mergeCommitSha, message: 'recovered-after-merge-response-loss', recoveredExisting: true });
    throw error;
  }
}

export async function mergeEonForgeGitHubPullRequest({ token, owner, repo, pullNumber, expectedHeadSha, title = '', fetchImpl } = {}) {
  const safeOwner = repoPart(owner); const safeRepo = repoPart(repo); const number = Number(pullNumber || 0); const sha = clean(expectedHeadSha, 64);
  if (!safeOwner || !safeRepo || !Number.isSafeInteger(number) || number <= 0 || !/^[a-f0-9]{40}$/i.test(sha)) throw new Error('github-merge-target-invalid');
  const response = await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/pulls/${number}/merge`, { token, method: 'PUT', fetchImpl, body: { sha, merge_method: 'squash', commit_title: clean(title, 180) || 'Publish reviewed EONAPP Forge project' } });
  if (response.payload?.merged !== true) throw new Error(clean(response.payload?.message, 160) || 'github-pr-not-merged');
  const mergedSha = clean(response.payload?.sha, 64);
  if (!/^[a-f0-9]{40}$/i.test(mergedSha)) throw new Error('github-merge-sha-invalid');
  return freeze({ merged: true, mergedSha, message: clean(response.payload?.message, 160) });
}

export async function getEonForgeGitHubPagesStatus({ token, owner, repo, fetchImpl } = {}) {
  const safeOwner = repoPart(owner); const safeRepo = repoPart(repo);
  if (!safeOwner || !safeRepo) throw new Error('github-pages-target-invalid');
  try {
    const { payload } = await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/pages`, { token, fetchImpl });
    return freeze({ configured: true, status: clean(payload?.status, 32), htmlUrl: clean(payload?.html_url, 300), buildType: clean(payload?.build_type, 32) });
  } catch (error) {
    if (Number(error?.status || 0) === 404) return freeze({ configured: false, status: 'not-configured', htmlUrl: '', buildType: '' });
    throw error;
  }
}


export async function closeEonForgeGitHubPullRequest({ token, owner, repo, pullNumber, fetchImpl } = {}) {
  const safeOwner = repoPart(owner); const safeRepo = repoPart(repo); const number = Number(pullNumber || 0);
  if (!safeOwner || !safeRepo || !Number.isSafeInteger(number) || number <= 0) throw new Error('github-pr-target-invalid');
  const { payload } = await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/pulls/${number}`, { token, method: 'PATCH', fetchImpl, body: { state: 'closed' } });
  return freeze({ number, state: clean(payload?.state, 20) || 'closed', htmlUrl: clean(payload?.html_url, 300) });
}

export async function deleteEonForgeGitHubBranch({ token, owner, repo, branchName, fetchImpl } = {}) {
  const safeOwner = repoPart(owner); const safeRepo = repoPart(repo); const safeBranch = branch(branchName);
  if (!safeOwner || !safeRepo || !safeBranch || !safeBranch.startsWith('eonapp/')) throw new Error('github-delete-branch-target-invalid');
  try {
    await eonForgeGitHubRequest(`/repos/${safeOwner}/${safeRepo}/git/refs/heads/${encodeURIComponent(safeBranch)}`, { token, method: 'DELETE', fetchImpl });
    return freeze({ deleted: true, alreadyMissing: false, branchName: safeBranch });
  } catch (error) {
    if (Number(error?.status || 0) === 404) return freeze({ deleted: true, alreadyMissing: true, branchName: safeBranch });
    throw error;
  }
}

export async function stageEonForgeGitHubTreeRestore({ token, owner, repo, defaultBranch, branchName, expectedCurrentSha, restoreFromSha, protectedPaths = [], commitMessage = 'Restore reviewed EONAPP Forge source', fetchImpl } = {}) {
  const restored=await stageEonForgeGitHubRollback({token,owner,repo,defaultBranch,expectedCurrentSha,restoreSha:restoreFromSha,branchName,protectedPaths,commitMessage,fetchImpl});
  return freeze({owner:restored.owner,repo:restored.repo,defaultBranch:restored.defaultBranch,branchName:restored.branchName,currentSha:restored.fromSha,restoreFromSha:restored.restoreSha,rollbackSha:restored.rollbackSha,restoreTreeSha:restored.restoreTreeSha,exactTreeRestore:restored.exactTreeRestore,recoveredExactRemoteStage:restored.recoveredExactRemoteRollback});
}

export default freeze({ EON_FORGE_GITHUB_API_SCHEMA, EON_FORGE_GITHUB_API_VERSION, EON_FORGE_GITHUB_REQUIRED_INSTALLATION_PERMISSIONS, eonForgeGitHubRequest, getEonForgeGitHubUser, getEonForgeGitHubInstallations, getEonForgeGitHubRepository, createEonForgeGitHubRepository, getEonForgeGitHubManagedManifest, getEonForgeGitHubBranchSha, getEonForgeGitHubCommitTreeSha, getEonForgeGitHubCommitProof, stageEonForgeGitHubBundle, stageEonForgeGitHubRollback, createEonForgeGitHubPullRequest, ensureEonForgeGitHubPullRequest, getEonForgeGitHubPullRequest, ensureEonForgeGitHubPullRequestMerged, getEonForgeGitHubCiStatus, ensureEonForgeGitHubPagesWorkflow, mergeEonForgeGitHubPullRequest, getEonForgeGitHubPagesStatus, closeEonForgeGitHubPullRequest, deleteEonForgeGitHubBranch, stageEonForgeGitHubTreeRestore });
