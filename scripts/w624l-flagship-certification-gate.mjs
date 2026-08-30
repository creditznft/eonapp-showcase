import { validateW624lFlagshipCertificationContract } from '../config/w624l-flagship-certification-contract.mjs';
const result = await validateW624lFlagshipCertificationContract();
for (const check of result.checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.id}${check.detail ? ` — ${check.detail}` : ''}`);
console.log(`\nW624L Flagship Certification: ${result.passed}/${result.total}`);
if (!result.ok) process.exitCode = 1;
