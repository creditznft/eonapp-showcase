#!/usr/bin/env node
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { validateW645ProductionEvidenceContract } from '../config/w645-production-evidence-contract.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'); const read=(f)=>fs.readFileSync(path.join(root,f),'utf8'); const exists=(f)=>fs.existsSync(path.join(root,f));
const board=JSON.parse(read('config/w645-production-evidence-board.json')); const workflow=read('.github/workflows/production-evidence.yml'); const pkg=JSON.parse(read('package.json'));
const checks=[
 ['contract',validateW645ProductionEvidenceContract().ok],
 ['files',['config/w645-production-evidence-contract.mjs','config/w645-production-evidence-board.json','scripts/lib/w645-production-evidence.mjs','scripts/w645-build-production-evidence-package.mjs','tests/unit/w645-production-evidence.test.mjs','EVIDENCE/w645/README.md','.github/workflows/production-evidence.yml'].every(exists)],
 ['honest-board',board.productionVerdict==='not-run'&&board.ownerReviewed===false],
 ['exact-artifact-workflow',workflow.includes('candidate_run_id')&&workflow.includes('preview_run_id')&&workflow.includes('candidate_digest')&&workflow.includes('evidence_ref')],
 ['separate-evidence-ref',workflow.includes('path: evidence-source')&&workflow.includes('ref: ${{ inputs.evidence_ref }}')],
 ['no-production-deploy',!workflow.includes('pages deploy')&&!workflow.includes('--branch=main')],
 ['protected-evidence-environment',workflow.includes('name: production-evidence')],
 ['commands',pkg.scripts?.['qa:w645-production-evidence']?.includes('w645-production-evidence-gate.mjs')&&pkg.scripts?.['evidence:w645-build']?.includes('w645-build-production-evidence-package.mjs')]
];
for(const [id,pass] of checks)console.log(`${pass?'PASS':'FAIL'} ${id}`); const ok=checks.every(([,p])=>p); console.log(`\nW645 production evidence source gate: ${checks.filter(([,p])=>p).length}/${checks.length}; genuine production evidence NOT-RUN`); if(!ok)process.exitCode=1;
