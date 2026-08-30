#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EONAPP_W721_PRODUCT_RESET_CONTRACT, validateW721ProductResetContract } from '../config/w721-product-reset-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const authorityPath = path.join(root, 'config', 'w720-source-authority.json');
const authority = JSON.parse(fs.readFileSync(authorityPath, 'utf8'));
const errors = [];
const add = (condition, message) => { if (!condition) errors.push(message); };
add(authority.sourceArchive?.sha256 === '5aa0554ca6edd0b9ac8a64d51f25bf47a20b1458ecaa08e420dca2ee3f9655b0', 'source archive SHA-256 mismatch');
add(authority.sourceArchive?.reportedLiveCommit === 'cc3e698a8468ec447bf8eab7dc85875318fa34cd', 'live commit authority mismatch');
add(authority.sourceArchive?.reportedGitTree === '1331baf4149f3f42a2b70d5bef1618897fbcde7b', 'tree authority mismatch');
add(authority.sourceArchive?.trackedEntryCount === 5163, 'tracked entry count mismatch');
add(authority.deploymentBoundary?.deploymentAllowedBeforeW736 === false, 'pre-W736 deployment must be blocked');
add(validateW721ProductResetContract(EONAPP_W721_PRODUCT_RESET_CONTRACT).ok, 'W721 product reset contract invalid');
if (errors.length) {
  console.error(`[w720-authority] FAIL (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('[w720-authority] PASS — W719.21 is the sole source authority and Option 2 is the current product contract.');
