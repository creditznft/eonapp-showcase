import { validateW624iGenuineAgentTheatreContract } from '../config/w624i-genuine-agent-theatre-contract.mjs';

const result = await validateW624iGenuineAgentTheatreContract();
for (const check of result.checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.id}${check.detail ? ` — ${check.detail}` : ''}`);
console.log(`\nW624I Genuine Agent Theatre: ${result.passed}/${result.total}`);
if (!result.ok) process.exitCode = 1;
