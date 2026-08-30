import test from 'node:test'; import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W646_CRITICAL_ROUTES,W646_LIVE_SMOKE_RECEIPT_SCHEMA,W646_PRODUCTION_DEPLOYMENT_RECEIPT_SCHEMA,validateW646FinalFreezeDeploymentContract } from '../../config/w646-final-freeze-deployment-contract.mjs';
import { validateW646DeploymentReceipt,validateW646LiveSmokeReceipt } from '../../scripts/lib/w646-final-certification.mjs';
import { W624D_CODEX_PREDEPLOY_STEPS } from '../../scripts/run-w624d-codex-predeploy.mjs';
const H='a'.repeat(64),C='b'.repeat(40); const candidate={candidateDigest:H,commitSha:C}; const deployment={schema:W646_PRODUCTION_DEPLOYMENT_RECEIPT_SCHEMA,wave:'W646',deploymentId:'prod-123',deploymentUrl:'https://prod.pages.dev',candidateDigest:H,rollbackDeploymentId:'prod-122',deployedAt:'2026-07-11T12:00:00.000Z',liveIdentityVerified:true,criticalRoutesVerified:true};
const smoke={schema:W646_LIVE_SMOKE_RECEIPT_SCHEMA,wave:'W646',status:'pass',occurredAt:'2026-07-11T12:10:00.000Z',origin:'https://eonapp.ch',candidateDigest:H,deploymentId:'prod-123',routes:W646_CRITICAL_ROUTES.map(route=>({route,status:200,candidateIdentityMatched:true})),releaseIdentityMatched:true,securityHeadersReviewed:true,serviceWorkerReviewed:true,billingStatusReviewed:true,referralGateReviewed:true,guestCityGateReviewed:true,pageErrors:0,consoleErrors:0,firstPartyHttpErrors:0,unexplainedRequestFailures:0,ownerReviewed:true,redactionReviewed:true,secretsIncluded:false,directIdentifiersIncluded:false};
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
test('W646 contract keeps public state NO-GO until live owner proof',()=>assert.equal(validateW646FinalFreezeDeploymentContract().ok,true));
test('W646 accepts the current runner when it retains every required freeze stage above the 82-stage baseline',()=>{
  assert.ok(W624D_CODEX_PREDEPLOY_STEPS.length >= 82);
  for (const script of ['qa:w641-release-governance','qa:w642-product-truth-retention','qa:w643-creator-device-closure','qa:w644-city-owner-certification','qa:w645-production-evidence','qa:w646-final-freeze-deployment']) {
    assert.ok(W624D_CODEX_PREDEPLOY_STEPS.some((step)=>step.script === script));
  }
});
test('production deployment receipt is bound to exact candidate and rollback target',()=>{assert.equal(validateW646DeploymentReceipt(deployment,candidate).ok,true);assert.equal(validateW646DeploymentReceipt({...deployment,candidateDigest:'c'.repeat(64)},candidate).ok,false);});
test('live smoke requires every critical route and clean diagnostics',()=>{assert.equal(validateW646LiveSmokeReceipt(smoke,{candidate,deployment}).ok,true);assert.equal(validateW646LiveSmokeReceipt({...smoke,consoleErrors:1},{candidate,deployment}).ok,false);});
test('missing one critical route is NO-GO',()=>assert.equal(validateW646LiveSmokeReceipt({...smoke,routes:smoke.routes.slice(1)},{candidate,deployment}).ok,false));
test('production workflow enforces semantic API parity without Actions artifact storage',()=>{
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8');
  assert.match(workflow, /environment:\s*\n\s+name:\s*production/);
  assert.match(workflow, /Build and verify (?:exactly )?one immutable(?: production)? candidate/);
  assert.match(workflow, /Deploy (?:same-run candidate|identical staged bytes) to production gate Preview/);
  assert.match(workflow, /Promote (?:exact same candidate|identical staged) bytes to production/);
  assert.ok((workflow.match(/DEPLOY_ROOT:\s*\$\{\{\s*steps\.stage\.outputs\.root\s*\}\}/g) || []).length >= 2);
  assert.match(workflow, /Verify (?:live )?production Pages Functions API parity/);
  assert.match(workflow, /Require real Command Hub from eonapp\.ch/);
  assert.match(workflow, /for attempt in \$\(seq 1 12\)/);
  assert.match(workflow, /stage4-production-domain-proof\/attempt-\$attempt/);
  assert.match(workflow, /A persistent failure reaches the rollback step below/);
  assert.match(workflow, /eonapp\.a15\.stage4\.production-deployment\.v2/);
  assert.match(workflow, /\/api\/auth\/session/);
  assert.match(workflow, /eonapp\.identity-only\.v1/);
  assert.match(workflow, /\/api\/city\/access/);
  assert.match(workflow, /eon\.city\.access\.w649b\.v1/);
  assert.match(workflow, /\/api\/billing\/status/);
  assert.match(workflow, /eonapp\.billing\.dodo-lifecycle\.w628\.v1/);
  assert.match(workflow, /\/api\/referrals/);
  assert.match(workflow, /eonapp\.referrals\.scalable-minimal-ledger\.w623i\.v2/);
  assert.match(workflow, /response\.status !== 200/);
  assert.match(workflow, /body\?\.schema !== schema/);
  assert.doesNotMatch(workflow, /actions\/(?:upload|download)-artifact|gh run download/);
});
test('W646 gate accepts the protected production workflow regardless of checkout line endings',()=>{
  const output = execFileSync(process.execPath, ['scripts/w646-final-freeze-deployment-gate.mjs'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.match(output, /PASS exact-production-promotion/);
  assert.match(output, /12\/12/);
});
