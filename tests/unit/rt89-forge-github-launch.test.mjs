import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_FORGE_GITHUB_CI_WORKFLOW_PATH,
  EON_FORGE_GITHUB_VALIDATOR_PATH,
  EON_FORGE_GITHUB_PUBLISHER_PATH,
  EON_FORGE_GITHUB_MANIFEST_PATH,
  EON_FORGE_GITHUB_MANIFEST_SCHEMA,
  buildEonForgeGitHubBranchName,
  buildEonForgeGitHubCiPagesWorkflow,
  buildEonForgeGitHubPublishBundle,
  buildEonForgeGitHubPagesPublisher,
  getEonForgeGitHubLaunchTruth,
  inspectEonForgeGitHubProject,
  isEonForgeGitHubSafePath
} from '../../assets/js/forge/forge-github-launch-v1.js';

test('RT89 Forge GitHub v1 accepts bounded static source and generates branch/CI/Pages infrastructure', () => {
  const bundle = buildEonForgeGitHubPublishBundle({
    title: 'Coffee Atlas', nonce: 'A1B2C3D4', sourceCheckPassed: true,
    files: { 'index.html': '<main>Coffee Atlas</main>', 'style.css': 'body{}', 'script.js': 'console.log("ready")' }
  });
  assert.equal(bundle.ok, true);
  assert.match(bundle.branchName, /^eonapp\/coffee-atlas-a1b2c3d4$/);
  assert.equal(bundle.publicationMode, 'branch-pr-ci-merge-pages');
  assert.equal(bundle.defaultBranchWriteBeforeApproval, false);
  assert.equal(bundle.forcePushAllowed, false);
  assert.ok(bundle.files[EON_FORGE_GITHUB_VALIDATOR_PATH]);
  assert.ok(bundle.files[EON_FORGE_GITHUB_PUBLISHER_PATH]);
  assert.ok(bundle.files[EON_FORGE_GITHUB_MANIFEST_PATH]);
  assert.deepEqual(JSON.parse(bundle.files[EON_FORGE_GITHUB_MANIFEST_PATH]), {schema:EON_FORGE_GITHUB_MANIFEST_SCHEMA,projectSlug:'coffee-atlas',generatedPaths:['index.html','script.js','style.css']});
  assert.ok(bundle.files[EON_FORGE_GITHUB_CI_WORKFLOW_PATH]);
  assert.match(bundle.files[EON_FORGE_GITHUB_CI_WORKFLOW_PATH], /actions\/checkout@v6/);
  assert.match(bundle.files[EON_FORGE_GITHUB_CI_WORKFLOW_PATH], /actions\/configure-pages@v5/);
  assert.match(bundle.files[EON_FORGE_GITHUB_CI_WORKFLOW_PATH], /actions\/upload-pages-artifact@v4/);
  assert.match(bundle.files[EON_FORGE_GITHUB_CI_WORKFLOW_PATH], /actions\/deploy-pages@v4/);
  assert.match(bundle.files[EON_FORGE_GITHUB_CI_WORKFLOW_PATH], /path: '_site'/);
  assert.doesNotMatch(bundle.files[EON_FORGE_GITHUB_CI_WORKFLOW_PATH], /path: '\.'/);
  assert.match(bundle.files[EON_FORGE_GITHUB_CI_WORKFLOW_PATH], /pages: write/);
  assert.match(bundle.files[EON_FORGE_GITHUB_CI_WORKFLOW_PATH], /id-token: write/);
});

test('RT89 Forge GitHub v1 blocks traversal, reserved workflow replacement, secrets and backend projects', () => {
  for (const path of ['../escape.js','/root.js','.env','node_modules/x.js','.git/config','a\\b.js']) assert.equal(isEonForgeGitHubSafePath(path), false, path);
  const reserved = inspectEonForgeGitHubProject({ title:'X', sourceCheckPassed:true, files:{ 'index.html':'ok', [EON_FORGE_GITHUB_CI_WORKFLOW_PATH]:'evil' } });
  assert.equal(reserved.ok, false);
  assert.ok(reserved.blockers.some((x)=>x.startsWith('reserved-path:')));
  const secret = inspectEonForgeGitHubProject({ title:'X', sourceCheckPassed:true, files:{ 'index.html':['github','pat','abcdefghijklmnopqrstuvwxyz123456'].join('_') } });
  assert.equal(secret.ok, false);
  assert.ok(secret.blockers.some((x)=>x.startsWith('secret-like-content:')));
  const backend = buildEonForgeGitHubPublishBundle({ title:'API', nonce:'123456', sourceCheckPassed:true, files:{'index.html':'ok','functions/api.js':'export default 1'} });
  assert.equal(backend.ok, false);
  assert.equal(backend.reason, 'static-pages-v1-only');
});

test('RT89 Forge CI deploys Pages only after validation and only from the repository default branch', () => {
  const workflow = buildEonForgeGitHubCiPagesWorkflow();
  assert.match(workflow, /needs: validate/);
  assert.match(workflow, /github\.event\.repository\.default_branch/);
  assert.doesNotMatch(workflow, /force-push|--force/);
  const truth = getEonForgeGitHubLaunchTruth();
  assert.equal(truth.reviewBeforeRemoteWrite, true);
  assert.equal(truth.ciBeforePublish, true);
  assert.equal(truth.patPasteDefault, false);
  assert.equal(buildEonForgeGitHubBranchName({title:'A B',nonce:'ABCDEF'}),'eonapp/a-b-abcdef');
});


test('RT89 Pages builder publishes only site files and excludes Forge/GitHub control surfaces', () => {
  const publisher = buildEonForgeGitHubPagesPublisher();
  assert.match(publisher, /managed publish manifest is missing/);
  assert.match(publisher, /manifest\.generatedPaths/);
  assert.match(publisher, /managed path is not a regular file/);
  assert.match(publisher, /index\.html missing from managed publish set/);
  assert.match(publisher, /\.nojekyll/);
  assert.doesNotMatch(publisher, /readdirSync\(root/);
  const reservedPublisher = inspectEonForgeGitHubProject({ title:'X', sourceCheckPassed:true, files:{ 'index.html':'ok', [EON_FORGE_GITHUB_PUBLISHER_PATH]:'evil' } });
  assert.equal(reservedPublisher.ok,false);
  assert.ok(reservedPublisher.blockers.includes(`reserved-path:${EON_FORGE_GITHUB_PUBLISHER_PATH}`));
  const workflow = buildEonForgeGitHubCiPagesWorkflow();
  assert.doesNotMatch(workflow, /branches:\s*\[?main/);
  assert.match(workflow, /github\.event\.repository\.default_branch/);
});
