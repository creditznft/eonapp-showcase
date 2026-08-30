#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W719_PREVIEW_VERIFICATION_ROUTES,
  W719_RELEASE_STAGES,
  W719_STABILISATION_RULES,
  getW719FrozenReleaseTruth,
  validateW719OwnerGo
} from '../config/w719-frozen-release-contract.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(relative)=>fs.readFileSync(path.join(root,relative),'utf8');
const json=(relative)=>JSON.parse(read(relative));
const exists=(relative)=>fs.existsSync(path.join(root,relative));
const pkg=json('package.json'); const ownerGo=json('config/w719-owner-go.json'); const truth=getW719FrozenReleaseTruth();
const freezeSource=read('scripts/w719-freeze-release-candidate.mjs'); const planSource=read('scripts/w719-pages-release-plan.mjs');
const required=[
 'config/w719-frozen-release-contract.mjs','config/w719-owner-go.json','scripts/w719-freeze-release-candidate.mjs','scripts/w719-pages-release-plan.mjs',
 'scripts/w719-frozen-release-gate.mjs','tests/unit/w719-frozen-release.test.mjs','docs/institutional/W719_IMMUTABLE_CLOUDFLARE_RELEASE_AND_STABILISATION_RUNBOOK_2026-07-25.md',
 'scripts/w641-build-release-candidate.mjs','scripts/w660l-stage-pages-deploy-root.mjs','scripts/w655-codex-pages-deploy.mjs'
];
const checks=[
 ['complete-stage-model',W719_RELEASE_STAGES.length===13&&W719_PREVIEW_VERIFICATION_ROUTES.length>=14],
 ['required-machinery',required.every(exists)],
 ['w718-and-owner-guards',/w718-exact-certification-receipt/.test(freezeSource)&&/evaluateW718OwnerScorecard/.test(freezeSource)&&/if \(!score\.ok\)/.test(freezeSource)],
 ['proven-candidate-authorities',/w641-build-release-candidate/.test(freezeSource)&&/w660l-stage-pages-deploy-root/.test(freezeSource)],
 ['dry-run-default',/const execute = has\('--execute'\)/.test(planSource)&&/if \(!execute\) process\.exit\(0\)/.test(planSource)],
 ['identical-root-production',/ownerGo\.pagesRootDigest !== pages\.digest/.test(planSource)&&/rebuildPerformed: false/.test(planSource)],
 ['pending-owner-go-honest',validateW719OwnerGo(ownerGo).ok===false&&ownerGo.productionGo===false&&ownerGo.previewCertified===false],
 ['stabilisation-boundary',W719_STABILISATION_RULES.observationHours.join(',')==='24,168'&&W719_STABILISATION_RULES.p0p1OnlyFixWindow&&W719_STABILISATION_RULES.rollbackRebuildAllowed===false],
 ['package-plans-safe',String(pkg.scripts?.['release:w719-preview-plan']||'').includes('--mode=preview')&&String(pkg.scripts?.['release:w719-production-plan']||'').includes('--mode=production')&&!String(pkg.scripts?.['release:w719-preview-plan']||'').includes('--execute')&&!String(pkg.scripts?.['release:w719-production-plan']||'').includes('--execute')],
 ['truth-fence',truth.sourceReleaseMachineryReady&&!truth.candidateFrozen&&!truth.previewDeployed&&!truth.productionDeployed&&!truth.liveProductionCertified&&truth.ownerGoRequired&&truth.identicalRootRequired&&!truth.automaticDeployment&&!truth.githubActionsRequired]
];
for(const [id,pass] of checks)console.log(`[W719] ${pass?'PASS':'FAIL'} ${id}`);
const ok=checks.every(([,pass])=>pass); console.log(`[W719] ${ok?'PASS':'FAIL'} SOURCE RELEASE READINESS ${checks.filter(([,p])=>p).length}/${checks.length}; candidate NOT FROZEN; no deployment run`); if(!ok)process.exitCode=1;
