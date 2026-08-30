import { validateW624jSharingCenterContract } from '../config/w624j-sharing-center-contract.mjs';
const result = await validateW624jSharingCenterContract();
for (const check of result.checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.id}${check.detail ? ` — ${check.detail}` : ''}`);
console.log(`\nW624J Sharing Center: ${result.passed}/${result.total}`);
if (!result.ok) process.exitCode = 1;
