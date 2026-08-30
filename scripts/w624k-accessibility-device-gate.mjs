import { validateW624kAccessibilityDeviceContract } from '../config/w624k-accessibility-device-contract.mjs';
const result = await validateW624kAccessibilityDeviceContract();
for (const check of result.checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.id}${check.detail ? ` — ${check.detail}` : ''}`);
console.log(`\nW624K Accessibility & Device: ${result.passed}/${result.total}`);
if (!result.ok) process.exitCode = 1;
