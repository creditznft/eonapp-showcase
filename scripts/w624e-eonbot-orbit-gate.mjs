#!/usr/bin/env node
import { validateW624eEonbotOrbitContract } from '../config/w624e-eonbot-orbit-contract.mjs';
const result = validateW624eEonbotOrbitContract();
for (const check of result.checks) console.log(`[W624E] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W624E] ${result.ok ? 'PASS' : 'FAIL'} ${result.passed}/${result.total}`);
if (!result.ok) process.exitCode = 1;
