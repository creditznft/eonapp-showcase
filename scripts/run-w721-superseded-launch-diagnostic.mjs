#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'config', 'archive', 'w721-superseded-launch-tests.json'), 'utf8'));
console.log('[w721-superseded-launch-diagnostic] NOT CERTIFYING');
console.log(manifest.reason);
for (const file of manifest.testFiles) console.log(`- ${file}`);
console.log('Run individual files only for archaeology. Their assertions cannot certify the W720+ launch product.');
