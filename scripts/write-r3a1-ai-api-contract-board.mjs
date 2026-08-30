#!/usr/bin/env node
/** Writes the static R3A1 provider-contract board from the current reviewed source. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildR3A1ApiChangeControlBoard, validateR3A1ApiChangeControlBoard } from '../assets/js/utils/r3a1-ai-api-change-control.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RELATIVE = 'release-evidence/R3A1_AI_API_CHANGE_CONTROL_2026-06-25/AI_API_CONTRACT_BOARD.json';
const board = buildR3A1ApiChangeControlBoard();
const validation = validateR3A1ApiChangeControlBoard(board);
if (!validation.ok) {
  console.error(JSON.stringify({ ok: false, errors: validation.errors }, null, 2));
  process.exit(1);
}
const target = path.join(ROOT, RELATIVE);
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `${JSON.stringify(board, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, file: RELATIVE, contractSchema: board.contractSchema, providerCount: board.activeHostedProviderIds.length }, null, 2));
