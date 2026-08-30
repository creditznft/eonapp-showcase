#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateW624fCommandDistrictNpcContract } from '../config/w624f-command-district-npc-system-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = validateW624fCommandDistrictNpcContract();
const directory = path.join(root, 'artifacts', 'w624f-command-district-npc-system');
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, 'receipt.json'), `${JSON.stringify(result, null, 2)}\n`);
for (const check of result.checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W624F] ${result.ok ? 'PASS' : 'FAIL'} ${result.passed}/${result.total}`);
if (!result.ok) process.exitCode = 1;
