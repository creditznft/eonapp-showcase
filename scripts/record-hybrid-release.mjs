#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SITE_ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const RECORDS_DIR = path.join(SITE_ROOT, 'docs', 'release-records');
const ARWEAVE_MANIFEST = path.join(SITE_ROOT, 'arweave-manifest.json');
const IPNS_STATE = path.join(SITE_ROOT, '.ipns-config', 'deployment-state.json');

const args = process.argv.slice(2);
const track = readArg('--track') || 'hybrid';
const label = readArg('--label') || 'release';
const notes = readArg('--notes') || '';

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getGitCommit() {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: SITE_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  if (result.error || result.status !== 0) {
    return null;
  }

  return (result.stdout || '').trim() || null;
}

function makeStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function buildMarkdown(record) {
  const lines = [
    '# Hybrid Release Record',
    '',
    `- Created: ${record.createdAt}`,
    `- Track: ${record.track}`,
    `- Label: ${record.label}`,
    `- Git commit: ${record.gitCommit || 'unavailable'}`,
    `- Notes: ${record.notes || 'none'}`,
    '',
    '## Artifact State',
    '',
    `- Arweave manifest present: ${record.artifacts.arweave.present}`,
    `- IPFS/IPNS state present: ${record.artifacts.ipfsIpns.present}`,
    ''
  ];

  if (record.artifacts.arweave.present) {
    lines.push('## Arweave');
    lines.push('');
    lines.push(`- Manifest TX ID: ${record.artifacts.arweave.manifestTxId || 'n/a'}`);
    lines.push(`- URL: ${record.artifacts.arweave.arweaveUrl || 'n/a'}`);
    lines.push('');
  }

  if (record.artifacts.ipfsIpns.present) {
    lines.push('## IPFS/IPNS');
    lines.push('');
    lines.push(`- IPFS hash: ${record.artifacts.ipfsIpns.ipfsHash || 'n/a'}`);
    lines.push(`- IPNS key: ${record.artifacts.ipfsIpns.ipnsKeyName || 'n/a'}`);
    for (const url of record.artifacts.ipfsIpns.gatewayUrls || []) {
      lines.push(`- Gateway: ${url}`);
    }
    lines.push('');
  }

  lines.push('## Expected Verification');
  lines.push('');
  lines.push('- launch:readiness passed');
  lines.push('- launch:check passed');
  lines.push('- launch:page-gate passed');
  lines.push('- launch:lootbox-gate passed');
  lines.push('- chosen deployment track verified');
  lines.push('');

  return `${lines.join('\n')}\n`;
}

function main() {
  const now = new Date();
  const stamp = makeStamp(now);
  const arweave = readJsonIfExists(ARWEAVE_MANIFEST);
  const ipfsIpns = readJsonIfExists(IPNS_STATE);

  const record = {
    createdAt: now.toISOString(),
    track,
    label,
    notes,
    gitCommit: getGitCommit(),
    artifacts: {
      arweave: {
        present: !!arweave,
        ...(arweave || {})
      },
      ipfsIpns: {
        present: !!ipfsIpns,
        ...(ipfsIpns || {})
      }
    }
  };

  fs.mkdirSync(RECORDS_DIR, { recursive: true });
  const baseName = `${stamp}-${track}-${label}`.replace(/[^a-zA-Z0-9._-]/g, '-');
  const jsonPath = path.join(RECORDS_DIR, `${baseName}.json`);
  const mdPath = path.join(RECORDS_DIR, `${baseName}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(record, null, 2));
  fs.writeFileSync(mdPath, buildMarkdown(record));

  console.log(`Hybrid release record written:`);
  console.log(`- ${path.relative(SITE_ROOT, jsonPath)}`);
  console.log(`- ${path.relative(SITE_ROOT, mdPath)}`);
}

main();