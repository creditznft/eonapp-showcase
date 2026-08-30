import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  W719_PREVIEW_VERIFICATION_ROUTES,
  W719_RELEASE_STAGES,
  W719_STABILISATION_RULES,
  getW719FrozenReleaseTruth,
  validateW719OwnerGo
} from '../../config/w719-frozen-release-contract.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=(relative)=>fs.readFileSync(path.join(root,relative),'utf8');
const json=(relative)=>JSON.parse(read(relative));

test('W719 models exact freeze, Preview, identical production, rollback and two observation windows',()=>{
 assert.equal(W719_RELEASE_STAGES.length,13);
 assert.ok(W719_RELEASE_STAGES.indexOf('preview-deploy')<W719_RELEASE_STAGES.indexOf('identical-production-promotion'));
 assert.deepEqual([...W719_STABILISATION_RULES.observationHours],[24,168]);
 assert.equal(W719_STABILISATION_RULES.rollbackRebuildAllowed,false);
 assert.ok(W719_PREVIEW_VERIFICATION_ROUTES.includes('/eoncity'));
 assert.ok(W719_PREVIEW_VERIFICATION_ROUTES.includes('/api/billing/status'));
});

test('W719 owner GO fails closed until score, Preview, digest and rollback identities are complete',()=>{
 const pending=json('config/w719-owner-go.json');
 assert.equal(validateW719OwnerGo(pending).ok,false);
 const complete={...pending,ownerAccepted:true,previewCertified:true,productionGo:true,overallScore:9.5,minimumPillarScore:9,p0Open:0,p1Open:0,sourceCommit:'a'.repeat(40),candidateDigest:'b'.repeat(64),pagesRootDigest:'c'.repeat(64),previewUrl:'https://preview.example',previewDeploymentId:'preview-1',rollbackDeploymentId:'rollback-1'};
 assert.equal(validateW719OwnerGo(complete).ok,true);
 complete.pagesRootDigest='bad';
 assert.equal(validateW719OwnerGo(complete).ok,false);
});

test('W719 freeze and release-plan sources require W718 acceptance and default to no deployment',()=>{
 const freeze=read('scripts/w719-freeze-release-candidate.mjs'); const plan=read('scripts/w719-pages-release-plan.mjs');
 assert.match(freeze,/w718-exact-certification-receipt/);
 assert.match(freeze,/evaluateW718OwnerScorecard/);
 assert.match(freeze,/w641-build-release-candidate/);
 assert.match(freeze,/w660l-stage-pages-deploy-root/);
 assert.match(plan,/const execute = has\('--execute'\)/);
 assert.match(plan,/if \(!execute\) process\.exit\(0\)/);
 assert.match(plan,/ownerGo\.pagesRootDigest !== pages\.digest/);
});

test('W719 package scripts generate dry-run plans without GitHub Actions or automatic Cloudflare mutation',()=>{
 const pkg=json('package.json');
 assert.match(pkg.scripts['release:w719-preview-plan'],/--mode=preview/);
 assert.match(pkg.scripts['release:w719-production-plan'],/--mode=production/);
 assert.doesNotMatch(pkg.scripts['release:w719-preview-plan'],/--execute/);
 assert.doesNotMatch(pkg.scripts['release:w719-production-plan'],/--execute/);
});

test('W719 truth accurately reports source readiness without claiming a frozen or live release',()=>{
 const truth=getW719FrozenReleaseTruth();
 assert.equal(truth.sourceReleaseMachineryReady,true);
 assert.equal(truth.candidateFrozen,false);
 assert.equal(truth.previewDeployed,false);
 assert.equal(truth.productionDeployed,false);
 assert.equal(truth.liveProductionCertified,false);
 assert.equal(truth.githubActionsRequired,false);
 assert.equal(truth.automaticDeployment,false);
});
