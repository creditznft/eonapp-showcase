#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateW624gProductiveRpgContract } from '../config/w624g-productive-rpg-loop-contract.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = validateW624gProductiveRpgContract();
const directory = path.join(root, 'artifacts', 'w624g-productive-rpg-loop');
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, 'receipt.json'), `${JSON.stringify(result, null, 2)}\n`);
for (const check of result.checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W624G] ${result.ok ? 'PASS' : 'FAIL'} ${result.passed}/${result.total}`);
if (!result.ok) process.exitCode = 1;
