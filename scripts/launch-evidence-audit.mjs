#!/usr/bin/env node
/**
 * Current launch evidence audit.
 *
 * W638 retires the historical "file exists + typed Status: PASS" trust model.
 * This audit is read-only: it validates the redacted W638 evidence board,
 * verifies artifact digests and emits a derived evidence index.
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildW638EvidenceIndex, loadW638EvidenceBoard } from './lib/w638-evidence-index.mjs';

const root = process.cwd();
const board = loadW638EvidenceBoard(root);
const index = buildW638EvidenceIndex(board, { root });
const outDirectory = path.join(root, 'artifacts', 'w638-evidence-convergence');
const outPath = path.join(outDirectory, 'launch-evidence-audit.json');
fs.mkdirSync(outDirectory, { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');

console.log(`Launch evidence audit: ${index.productionVerdict.toUpperCase()}`);
console.log(`Lanes: ${index.lanes.filter((lane) => lane.status === 'pass').length}/${index.lanes.length} PASS`);
console.log(`Records: ${index.recordCount} | Invalid: ${index.invalidRecordCount} | Artifacts: ${index.artifacts.length}`);
console.log(`Index SHA-256: ${index.indexDigest}`);
console.log(`Report: ${path.relative(root, outPath)}`);

if (!index.sourceGateOk || index.productionVerdict !== 'pass') process.exitCode = 1;
