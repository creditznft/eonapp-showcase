#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEonCityW660CompletionMatrix } from '../assets/js/city/w660/eon-city-w660-completion-matrix.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'assets/js/city/w660/eon-city-w660-completion-matrix.js',
  'assets/js/city/w660/eon-city-w660-nexus-stations.js',
  'assets/js/city/w660/eon-city-w660-nexus-hologram.js',
  'assets/js/city/w659n/eon-city-w659n-product-layer.js',
  'tests/unit/w660-city-completion-matrix.test.mjs',
  'docs/W660_CITY_COMPLETION_MATRIX_SOURCE_RECEIPT_2026-07-19.md'
];
const checks = [];
const add = (id, pass, detail = '') => checks.push({ id, pass: Boolean(pass), detail });
for (const relative of required) add(`required:${relative}`, fs.existsSync(path.join(root, relative)));
const validation = validateEonCityW660CompletionMatrix();
const matrix = validation.matrix;
add('matrix-valid', validation.ok, validation.errors.join(','));
add('effective-assets-34', matrix.effectiveAssetCount === 34);
add('five-superseded-excluded', matrix.supersededAssetCount === 5);
add('six-functional-replacements', matrix.functionalReplacementCount === 6);
add('characters-14-of-14', matrix.effectiveCharacterCount === 14 && matrix.productBoundCharacterCount === 14 && matrix.missingCharacterRoleAssetIds.length === 0);
add('districts-nine', matrix.playableDistrictCount === 9 && matrix.missingStreamedDistrictIds.length === 0);
add('nexus-nine', matrix.nexusStationCount === 9);
add('productive-systems', Object.values(matrix.systems).every(Boolean));
add('proof-boundary-honest', matrix.browserProof.sourceComplete && matrix.browserProof.localHeadedPending && matrix.browserProof.rtx3050PhysicalPending && matrix.browserProof.previewPending && matrix.browserProof.productionPending);
const failed = checks.filter((entry) => !entry.pass);
const report = { wave: 'W660-CITY', scope: 'completion-matrix', ok: failed.length === 0, passed: checks.length - failed.length, total: checks.length, checks, matrix };
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
