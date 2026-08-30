#!/usr/bin/env node
import { validateW624dWayfinderCameraContract } from '../config/w624d-wayfinder-camera-contract.mjs';
const result = validateW624dWayfinderCameraContract();
for (const check of result.checks) console.log(`[W624D] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W624D] ${result.ok ? 'PASS' : 'FAIL'} ${result.passed}/${result.total}`);
if (!result.ok) process.exitCode = 1;
