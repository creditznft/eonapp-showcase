#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateW644CityOwnerCertificationContract } from '../config/w644-city-owner-certification-contract.mjs';
import { evaluateW644CityOwnerCertification } from './lib/w644-city-owner-certification.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const board = JSON.parse(read('config/w644-city-owner-certification-board.json'));
const city = read('eoncity.html');
const badge = read('assets/js/release/eon-release-identity.js');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['contract', validateW644CityOwnerCertificationContract().ok],
  ['files', [
    'config/w644-city-owner-certification-contract.mjs',
    'config/w644-city-owner-certification-board.json',
    'scripts/lib/w644-city-owner-certification.mjs',
    'scripts/w644-prepare-city-owner-proof.mjs',
    'tests/unit/w644-city-owner-certification.test.mjs',
    'EVIDENCE/w644/README.md'
  ].every(exists)],
  ['honest-board', board.productionVerdict === 'not-run' && !evaluateW644CityOwnerCertification(board).pass],
  ['visible-release-identity', city.includes('assets/js/release/eon-release-identity.js') && city.includes('data-eon-release-identity')],
  ['identity-no-sensitive-data', badge.includes('candidateDigest') && badge.includes('commitSha') && !badge.includes('localStorage') && !badge.includes('document.cookie')],
  ['manual-google-boundary', read('scripts/w599-run-authenticated-eoncity.mjs').includes('It never opens Google') && read('scripts/w644-prepare-city-owner-proof.mjs').includes('EON_CITY_CDP_ENDPOINT')],
  ['quality-thresholds', read('config/w644-city-owner-certification-contract.mjs').includes('overallMinimum: 9.5') && read('config/w644-city-owner-certification-contract.mjs').includes('categoryMinimum: 9.0')],
  ['command', pkg.scripts?.['qa:w644-city-owner-certification']?.includes('w644-city-owner-certification-gate.mjs')]
];
for (const [id, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${id}`);
const ok = checks.every(([, pass]) => pass);
console.log(`\nW644 City owner certification source gate: ${checks.filter(([, pass]) => pass).length}/${checks.length}; authenticated owner evidence NOT-RUN`);
if (!ok) process.exitCode = 1;
