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
    file: 'vault.html',
    blockerPatterns: [
      { pattern: /<input(?![^>]+id=["']vault-import-file["'])[^>]+type=["']file["']/i, message: 'Found file upload input on vault/profile surface.' },
      { pattern: /<textarea[^>]+id=["'][^"']*(bio|profile-bio|username)[^"']*["']/i, message: 'Found freeform public profile text surface.' },
      { pattern: /<input[^>]+id=["'][^"']*(username|alias-input|profile-name)[^"']*["']/i, message: 'Found freeform public identity input.' }
    ],
    warningPatterns: []
  },
  {
    file: 'assets/js/vault/eon-vault-page.js',
    blockerPatterns: [
      { pattern: /type:\s*['"]file['"]/i, message: 'Found file upload logic on active Vault page.' },
      { pattern: /(custom username|upload avatar|profile upload|seller bio|direct message|dm user)/i, message: 'Found unsafe identity or social-surface copy in active Vault page.' }
    ],
    warningPatterns: [
      { pattern: /(marketplace|seller|listing|list your item|public profile)/i, message: 'Marketplace-style language found in active Vault surface; verify the current local-only boundary.' }
    ]
  },
  {
    file: 'assets/js/utils/profile.js',
    blockerPatterns: [
      { pattern: /searchParams\.set\('alias'/i, message: 'Share URLs still serialize raw alias text.' },
      { pattern: /(uploaded avatar|custom username|freeform bio)/i, message: 'Unsafe public identity copy found in profile utility.' }
    ],
    warningPatterns: []
  },
  {
    file: 'assets/js/utils/launch-discovery-boundary.js',
    blockerPatterns: [
      { pattern: /(direct message|dm seller|seller bio|profile page|external link)/i, message: 'Discovery layer references unsafe marketplace/social features.' }
    ],
    warningPatterns: [
      { pattern: /(marketplace|listing)/i, message: 'Marketplace-style language found in discovery layer; prefer artifact-exchange wording.' }
    ]
  },
];

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function addBlocker(file, message) {
  blockers.push(`[${file}] ${message}`);
}

function addWarning(file, message) {
  warnings.push(`[${file}] ${message}`);
}

for (const check of CHECKS) {
  const abs = path.join(ROOT, check.file);
  if (!fs.existsSync(abs)) {
    addBlocker(check.file, 'File missing for identity-surface gate.');
    continue;
  }

  const source = read(check.file);
  const archivedCompatibility = /W215_ARCHIVED_COMPATIBILITY_MODULE/.test(source);

  for (const rule of check.blockerPatterns) {
    if (rule.pattern.test(source)) {
      addBlocker(check.file, rule.message);
    }
  }

  for (const rule of check.warningPatterns) {
    if (!archivedCompatibility && rule.pattern.test(source)) {
      addWarning(check.file, rule.message);
    }
  }
}

console.log('EONAPP.CH Identity Surface Gate');
console.log('===============================');
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
