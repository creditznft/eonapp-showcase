import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const blockers = [];
const warnings = [];

const CHECKS = [
  {
    file: 'games/reaction-sprint.js',
    blockerPatterns: [
      { pattern: /localStorage\.getItem\(['"]eon-alias['"]\)/i, message: 'Reads freeform alias from localStorage in challenge flow.' },
      { pattern: /payload\.a\s*\|\|\s*['"]/i, message: 'Reads legacy raw alias field from duel payload.' }
    ],
    warningPatterns: []
  },
  {
    file: 'games/word-blitz.js',
    blockerPatterns: [
      { pattern: /localStorage\.getItem\(['"]eon-alias['"]\)/i, message: 'Reads freeform alias from localStorage in live duel flow.' }
    ],
    warningPatterns: []
  },
  {
    file: 'games/neural-override/ui.js',
    blockerPatterns: [
      { pattern: /localStorage\.getItem\(['"]eon-alias['"]\)/i, message: 'Reads freeform alias from localStorage in challenge share flow.' },
      { pattern: /challengePayload\.alias/i, message: 'Uses alias field from challenge payload instead of generated UID alias.' }
    ],
    warningPatterns: []
  },
  {
    file: 'games/neural-override/data.js',
    blockerPatterns: [
      { pattern: /alias\s*:\s*alias/i, message: 'Serializes alias text into challenge payload.' }
    ],
    warningPatterns: []
  },
  {
    file: 'games',
    blockerPatterns: [
      { pattern: /<input[^>]+type=["']file["']/i, message: 'Found upload input in games surface.' },
      { pattern: /(upload avatar|profile upload|custom username|dm user|direct message)/i, message: 'Found unsafe social/profile wording in games surface.' }
    ],
    warningPatterns: [
      { pattern: /(marketplace|seller|listing|list your item|public profile)/i, message: 'Marketplace-style wording found in games surface; verify artifact-boundary intent.' }
    ],
    recursive: true
  }
];

function addBlocker(file, message) {
  blockers.push(`[${file}] ${message}`);
}

function addWarning(file, message) {
  warnings.push(`[${file}] ${message}`);
}

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function walkFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(absolute));
      continue;
    }
    if (/\.(js|mjs|html|css)$/i.test(entry.name)) {
      files.push(absolute);
    }
  }
  return files;
}

for (const check of CHECKS) {
  const absolute = path.join(ROOT, check.file);

  if (!fs.existsSync(absolute)) {
    continue;
  }

  const targets = check.recursive
    ? walkFiles(absolute)
    : [absolute];

  for (const target of targets) {
    const rel = path.relative(ROOT, target).replace(/\\/g, '/');
    const source = fs.readFileSync(target, 'utf8');

    for (const rule of check.blockerPatterns) {
      if (rule.pattern.test(source)) {
        addBlocker(rel, rule.message);
      }
    }

    for (const rule of check.warningPatterns) {
      if (rule.pattern.test(source)) {
        addWarning(rel, rule.message);
      }
    }
  }
}

console.log('EONAPP.CH Games Identity Gate');
console.log('============================');
console.log(`Blockers: ${blockers.length}`);
console.log(`Warnings: ${warnings.length}`);

if (blockers.length > 0) {
  console.log('\nBlockers:');
  for (const blocker of blockers) {
    console.log(`- ${blocker}`);
  }
}

if (warnings.length > 0) {
  console.log('\nWarnings:');
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

if (blockers.length > 0) {
  process.exit(1);
}
