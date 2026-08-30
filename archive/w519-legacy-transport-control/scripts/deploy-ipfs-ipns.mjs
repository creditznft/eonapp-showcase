#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SITE_ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const CONFIG_DIR = path.join(SITE_ROOT, '.ipns-config');
const DEFAULT_CONFIG = path.join(CONFIG_DIR, 'eonapp-ch-ipns-config.example.json');
const STATE_FILE = path.join(CONFIG_DIR, 'deployment-state.json');
const STAGING_PREFIX = 'eonapp-ipfs-stage-';
const DEPLOY_ROOT_FILES = [
  '_headers',
  '_redirects',
  '404.html',
  'about.html',
  'archive.html',
  'chat.html',
  'favicon.ico',
  'favicon.svg',
  'index.html',
  'manifest.webmanifest',
  'offline.html',
  'privacy.html',
  'robots.txt',
  'sitemap.xml',
  'sw.js',
  'vault.html'
];
const DEPLOY_ROOT_DIRS = [
  'archive',
  'assets',
  'blog',
  'campaigns',
  'games',
  'loot',
  'scripts',
  'tools'
];

const args = process.argv.slice(2);
const configPath = readArg('--config') || process.env.EONAPP_IPNS_CONFIG || DEFAULT_CONFIG;
const keyNameArg = readArg('--key-name');
const dryRun = args.includes('--dry-run');
const checkOnly = args.includes('--check');
const verifyOnly = args.includes('--verify');
const help = args.includes('--help') || args.includes('-h');
const allowOffline = args.includes('--allow-offline');
const allowDelegated = args.includes('--allow-delegated');
const ipfsBinary = resolveIpfsBinary();

if (help) {
  printHelp();
  process.exit(0);
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function printHelp() {
  console.log(`
EONAPP.CH IPFS/IPNS deployment

Usage:
  node scripts/deploy-ipfs-ipns.mjs --check
  node scripts/deploy-ipfs-ipns.mjs --dry-run --key-name eonapp-ch-site-key
  node scripts/deploy-ipfs-ipns.mjs --key-name eonapp-ch-site-key
  node scripts/deploy-ipfs-ipns.mjs --verify

Options:
  --config <path>      Path to IPNS config JSON
  --key-name <name>    Override IPNS key name from config
  --ipfs-bin <path>    Override IPFS binary path (or set IPFS_BIN)
  --allow-offline      Publish IPNS record to local datastore when network publication is slow/unavailable
  --allow-delegated    Publish IPNS record via delegated publishers without requiring DHT publication
  --dry-run            Validate environment and show intended commands only
  --check              Check IPFS CLI, config, and key availability only
  --verify             Print latest saved deployment-state URLs only
  --help               Show this message
`);
}

function resolveIpfsBinary() {
  const argPath = readArg('--ipfs-bin');
  const candidates = [
    argPath,
    process.env.IPFS_BIN,
    process.platform === 'win32'
      ? path.join(process.env.LOCALAPPDATA || '', 'Programs', 'IPFS Desktop', 'resources', 'app.asar.unpacked', 'node_modules', 'kubo', 'kubo', 'ipfs.exe')
      : null,
    'ipfs'
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate === 'ipfs') {
      return candidate;
    }
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return argPath || process.env.IPFS_BIN || 'ipfs';
}

function runIpfs(commandArgs) {
  const result = spawnSync(ipfsBinary, commandArgs, {
    cwd: SITE_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  if (result.error) {
    throw new Error(`Failed to run ${ipfsBinary} ${commandArgs.join(' ')}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    throw new Error(`${ipfsBinary} ${commandArgs.join(' ')} failed${stderr ? `: ${stderr}` : ''}`);
  }

  return {
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
    status: result.status ?? 1
  };
}

function loadConfig(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveState(state) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(`No deployment state found at ${STATE_FILE}`);
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

function buildGatewayUrls(config, keyId) {
  return (config.gatewayUrls || []).map((url) =>
    url.includes('/ipns/') || url.includes('.ipns.') ? url : `${url.replace(/\/$/, '')}/ipns/${keyId}`
  );
}

function ensureStaticFilesExist() {
  const required = ['index.html', 'vault.html', 'workbench.html', 'market.html'];
  const missing = required.filter((file) => !fs.existsSync(path.join(SITE_ROOT, file)));
  if (missing.length > 0) {
    throw new Error(`Missing required static files: ${missing.join(', ')}`);
  }
}

function copyEntry(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
}

function createPublishStagingDir() {
  const stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), STAGING_PREFIX));

  for (const file of DEPLOY_ROOT_FILES) {
    const source = path.join(SITE_ROOT, file);
    if (!fs.existsSync(source)) {
      continue;
    }
    copyEntry(source, path.join(stagingDir, file));
  }

  for (const dir of DEPLOY_ROOT_DIRS) {
    const source = path.join(SITE_ROOT, dir);
    if (!fs.existsSync(source)) {
      continue;
    }
    copyEntry(source, path.join(stagingDir, dir));
  }

  return stagingDir;
}

async function main() {
  ensureStaticFilesExist();

  if (verifyOnly) {
    const state = loadState();
    console.log('Latest deployment state:');
    console.log(JSON.stringify(state, null, 2));
    console.log('\nVerify these URLs manually:');
    state.gatewayUrls.forEach((url) => console.log(`- ${url}`));
    return;
  }

  const config = loadConfig(configPath);
  const keyName = keyNameArg || config.ipnsKey?.name;
  const keyId = config.ipnsKey?.id || '<unknown-ipns-id>';

  if (!keyName) {
    throw new Error('Missing IPNS key name. Set it in config or via --key-name.');
  }

  console.log('');
  console.log('EONAPP.CH -> IPFS/IPNS deployment');
  console.log('--------------------------------');
  console.log(`Config: ${path.relative(SITE_ROOT, configPath)}`);
  console.log(`Key: ${keyName}`);
  console.log(`IPFS binary: ${ipfsBinary}`);

  const version = runIpfs(['version']);
  console.log(`IPFS CLI: ${version.stdout.split('\n')[0]}`);

  const keyList = runIpfs(['key', 'list', '-l']);
  const matchingKey = keyList.stdout.split('\n').find((line) => line.includes(` ${keyName}`) || line.endsWith(`\t${keyName}`));
  if (!matchingKey) {
    throw new Error(`IPNS key '${keyName}' not found. Create it first with: ipfs key gen --type=rsa --size=2048 ${keyName}`);
  }

  console.log(`IPNS key found: ${matchingKey}`);

  if (checkOnly || dryRun) {
    const stagingDir = createPublishStagingDir();
    console.log('');
    console.log(checkOnly ? 'Check complete.' : 'Dry run complete. Planned commands:');
    console.log(`Publish root: ${stagingDir}`);
    if (dryRun) {
      console.log(`- ipfs add -r -Q "${stagingDir}"`);
      console.log(`- ipfs name publish --key=${keyName}${allowOffline ? ' --allow-offline' : ''}${allowDelegated ? ' --allow-delegated' : ''} <IPFS_HASH>`);
      (config.gatewayUrls || []).forEach((url) => console.log(`- verify ${url}`));
    }
    return;
  }

  const publishRoot = createPublishStagingDir();
  console.log('\nUploading site root to IPFS...');
  console.log(`Publish root: ${publishRoot}`);
  const addResult = runIpfs(['add', '-r', '-Q', publishRoot]);
  const ipfsHash = addResult.stdout.split('\n').filter(Boolean).at(-1);
  if (!ipfsHash) {
    throw new Error('Failed to derive IPFS hash from ipfs add output.');
  }

  console.log(`IPFS hash: ${ipfsHash}`);
  console.log('Publishing IPNS pointer...');
  const publishArgs = [];
  if (allowOffline) {
    // Force CLI offline mode so publish does not block on daemon/DHT state.
    publishArgs.push('--offline');
  }
  publishArgs.push('name', 'publish', `--key=${keyName}`);
  if (allowOffline) {
    publishArgs.push('--allow-offline');
  }
  if (allowDelegated) {
    publishArgs.push('--allow-delegated');
  }
  publishArgs.push(`/ipfs/${ipfsHash}`);
  const gatewayUrls = buildGatewayUrls(config, keyId);
  let publishResult;
  try {
    publishResult = runIpfs(publishArgs);
  } catch (error) {
    saveState({
      deployedAt: new Date().toISOString(),
      siteRoot: SITE_ROOT,
      publishRoot,
      configPath: path.relative(SITE_ROOT, configPath),
      ipnsKeyName: keyName,
      ipnsKeyId: keyId,
      ipfsHash,
      publishError: error.message,
      publishMode: {
        allowOffline,
        allowDelegated
      },
      gatewayUrls,
      status: 'ipfs-added-ipns-failed'
    });
    throw error;
  }
  console.log(publishResult.stdout || 'IPNS publish completed.');

  saveState({
    deployedAt: new Date().toISOString(),
    siteRoot: SITE_ROOT,
    publishRoot,
    configPath: path.relative(SITE_ROOT, configPath),
    ipnsKeyName: keyName,
    ipnsKeyId: keyId,
    ipfsHash,
    publishOutput: publishResult.stdout,
    gatewayUrls,
    status: 'published'
  });

  console.log('\nDeployment state saved: .ipns-config/deployment-state.json');
  console.log('Verify these URLs after propagation:');
  gatewayUrls.forEach((url) => console.log(`- ${url}`));
}

main().catch((error) => {
  console.error(`\nERROR: ${error.message}`);
  process.exit(1);
});