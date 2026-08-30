import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderForgeGitHubPublishWorkspace } from '../../assets/js/forge/forge-github-publish-workspace.js';
const source=fs.readFileSync(new URL('../../assets/js/forge/forge-github-publish-workspace.js',import.meta.url),'utf8');

test('RT89 Forge GitHub workspace exposes the explicit review, CI, publish and rollback controls',()=>{
  assert.match(renderForgeGitHubPublishWorkspace(),/Review branch → CI → Pages/);
  for(const route of ['/api/forge/github/publish/prepare','/api/forge/github/publish/stage','/api/forge/github/publish/approve','/api/forge/github/publish/commit','/api/forge/github/publish/rollback-prepare','/api/forge/github/publish/rollback-approve','/api/forge/github/publish/rollback-commit','/api/forge/github/publish/rollback-cancel']) assert.match(source,new RegExp(route.replaceAll('/','\\/')));
  assert.match(source,/exact managed Forge file set/);
  assert.match(source,/New personal repositories need the GitHub App installed for All repositories/);
  assert.match(source,/data-new-ready/);
  assert.match(source,/exact pre-Forge Git tree/i);
  assert.match(source,/no Pages redeployment is promised/i);
  assert.match(source,/(?:Verify|Check) rollback tree/);
  assert.doesNotMatch(source,/Check rollback CI|redeploys Pages|Restored Pages deployment/);
});

test('RT89 Forge GitHub workspace keeps one-time approval capabilities out of web storage',()=>{
  assert.match(source,/const approvalMemory=new Map\(\)/);
  assert.match(source,/delete safe\.stageNonce;delete safe\.publishNonce;delete safe\.rollbackNonce/);
  assert.doesNotMatch(source,/sessionStorage\.setItem\([^\n]*(?:stageApprovalNonce|publishApprovalNonce|rollbackApprovalNonce)/);
  assert.doesNotMatch(source,/localStorage/);
  assert.doesNotMatch(source,/writeApprovals\([^\n]*(?:publishApprovalNonce|rollbackApprovalNonce)/);
  assert.match(source,/publish\/approve[\s\S]*publish\/commit/);
  assert.match(source,/rollback-approve[\s\S]*rollback-commit/);
});
