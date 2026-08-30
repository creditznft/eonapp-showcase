#!/usr/bin/env node
/** Validate a downloaded candidate and protected owner-authorization artifact. */
import fs from 'node:fs';
import path from 'node:path';
import { validateProductionPromotionPackage } from './lib/w641-release-governance.mjs';

const candidateRoot = path.resolve(process.argv[2] || 'candidate');
const authorizationRoot = path.resolve(process.argv[3] || 'authorization');
const read = (root, name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const context = {
  candidate: read(candidateRoot, 'candidate-provenance.json'),
  preview: read(authorizationRoot, 'preview-receipt.json'),
  environment: read(authorizationRoot, 'environment-protection.json'),
  evidenceIndex: read(authorizationRoot, 'w638-evidence-index.json'),
  rehearsal: read(authorizationRoot, 'w639-rehearsal-board.json'),
  owner: read(authorizationRoot, 'owner-go-receipt.json')
};
const result = validateProductionPromotionPackage(context);
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
