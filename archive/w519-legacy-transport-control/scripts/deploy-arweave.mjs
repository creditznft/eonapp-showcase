#!/usr/bin/env node
/**
 * deploy-arweave.mjs
 * ====================
 * Uploads EONAPP.CH static site to Arweave via Irys SDK (formerly Bundlr).
 *
 * What this script does:
 * 1. Scans the site root for all deployable files
 * 2. Uploads each file with correct Content-Type headers via Irys
 * 3. Creates an Arweave Path Manifest for URL routing
 * 4. Saves the manifest TX ID to arweave-manifest.json
 * 5. Outputs the permanent arweave.net and gateway.irys.xyz access URLs
 *
 * Architecture:
 * - One-time upload cost in AR tokens (~$5–20 for full site depending on size)
 * - After upload, the site is permanent and free forever (no hosting costs)
 * - Access: https://arweave.net/{manifestTxId}/index.html
 * - With ArNS: https://eonapp.ar.io (update pointer to new TX after each version)
 * - Cloudflare Pages remains the primary live host for fast CDN + Worker support
 * - Arweave is the permanent immutable snapshot archive
 *
 * Prerequisites:
 *   npm install @irys/sdk mime
 *
 * Usage:
 *   node scripts/deploy-arweave.mjs --keyfile ./arweave-key.json
 *   node scripts/deploy-arweave.mjs --keyfile ./arweave-key.json --dry-run
 *   node scripts/deploy-arweave.mjs --keyfile ./arweave-key.json --check-balance
 *
 * Arweave keyfile:
 *   Generate at https://arweave.app or via arweave-mnemonic-keys
 *   NEVER commit arweave-key.json to git (it is in .gitignore)
 *
 * @module scripts/deploy-arweave
 */

import fs   from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

// ─── Configuration ─────────────────────────────────────────────────────────────

const SITE_ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const OUT_FILE  = path.join(SITE_ROOT, 'arweave-manifest.json');

// Files/directories excluded from Arweave deployment
const EXCLUDED_PATHS = new Set([
  'platform-backend',
  'Smart Contracts',
  'node_modules',
  '.git',
  '.github',
  '.vscode',
  'scripts',
  'arweave-key.json',
  'arweave-manifest.json',
  '.env',
  '.env.local',
  'DEPLOY-WORKFLOW.yml.txt',
  'claw.bat',
  'openclaw',
  'site'       // build artifacts
]);

// Only deploy these file extensions
const DEPLOYABLE_EXTENSIONS = new Set([
  '.html', '.css', '.js', '.mjs', '.json',
  '.svg', '.ico', '.png', '.jpg', '.jpeg', '.webp', '.gif',
  '.woff', '.woff2', '.ttf', '.otf',
  '.txt', '.xml', '.webmanifest',
  '.md' // docs / blueprints (optional — immutable on Arweave is fine)
]);

// Content-type map (mime fallback)
const MIME_MAP = {
  '.html':        'text/html; charset=utf-8',
  '.css':         'text/css; charset=utf-8',
  '.js':          'application/javascript; charset=utf-8',
  '.mjs':         'application/javascript; charset=utf-8',
  '.json':        'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg':         'image/svg+xml',
  '.ico':         'image/x-icon',
  '.png':         'image/png',
  '.jpg':         'image/jpeg',
  '.jpeg':        'image/jpeg',
  '.webp':        'image/webp',
  '.gif':         'image/gif',
  '.woff':        'font/woff',
  '.woff2':       'font/woff2',
  '.ttf':         'font/ttf',
  '.otf':         'font/otf',
  '.txt':         'text/plain; charset=utf-8',
  '.xml':         'application/xml',
  '.md':          'text/markdown; charset=utf-8'
};

// ─── Argument parser ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const keyfilePath  = args[args.indexOf('--keyfile') + 1] || process.env.ARWEAVE_KEYFILE;
const isDryRun     = args.includes('--dry-run');
const checkBalance = args.includes('--check-balance');

if (!keyfilePath) {
  console.error('❌  Missing --keyfile argument.');
  console.error('   Usage: node scripts/deploy-arweave.mjs --keyfile ./arweave-key.json');
  console.error('   Get a keyfile at: https://arweave.app');
  process.exit(1);
}

// ─── File scanner ───────────────────────────────────────────────────────────────

function shouldExclude(relPath) {
  const parts = relPath.split(/[\\/]/);
  return parts.some((p) => EXCLUDED_PATHS.has(p));
}

function collectFiles(dir, base = dir) {
  const collected = [];
  const entries   = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath  = path.relative(base, fullPath).replace(/\\/g, '/');

    if (shouldExclude(relPath) || entry.name.startsWith('.')) continue;

    if (entry.isDirectory()) {
      collected.push(...collectFiles(fullPath, base));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (DEPLOYABLE_EXTENSIONS.has(ext)) {
        collected.push({
          fullPath,
          relPath,
          ext,
          size: fs.statSync(fullPath).size
        });
      }
    }
  }

  return collected;
}

// ─── Size formatter ────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1048576)     return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

// ─── Main deployment ────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('🌐  EONAPP.CH → Arweave Permanent Deployment');
  console.log('─'.repeat(50));

  // Load keyfile
  let jwk;
  try {
    jwk = JSON.parse(fs.readFileSync(keyfilePath, 'utf8'));
    console.log(`🔑  Keyfile loaded: ${path.basename(keyfilePath)}`);
  } catch (err) {
    console.error(`❌  Failed to load keyfile: ${err.message}`);
    process.exit(1);
  }

  // Load Irys SDK
  let Irys;
  try {
    ({ default: Irys } = await import('@irys/sdk'));
  } catch {
    console.error('❌  @irys/sdk not installed. Run: npm install @irys/sdk');
    process.exit(1);
  }

  // Initialize Irys client
  const irys = new Irys({
    url:   'https://node1.irys.xyz',
    token: 'arweave',
    key:   jwk
  });

  await irys.ready();
  console.log(`💳  Irys address: ${irys.address}`);

  // Check balance
  const balance = await irys.getLoadedBalance();
  console.log(`💰  Irys balance: ${balance.toString()} winston (${(balance / 1e12).toFixed(6)} AR)`);

  if (checkBalance) {
    console.log('\n✅  Balance check complete.');
    return;
  }

  // Scan files
  const files    = collectFiles(SITE_ROOT);
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  console.log(`\n📁  Found ${files.length} deployable files (${formatBytes(totalSize)} total)`);

  if (isDryRun) {
    console.log('\n🔍  DRY RUN — files that would be uploaded:');
    files.forEach((f) => console.log(`  ${f.relPath}  (${formatBytes(f.size)})`));
    console.log('\n✅  Dry run complete. No files uploaded.');
    return;
  }

  // Estimate cost
  let costEstimate;
  try {
    costEstimate = await irys.getPrice(totalSize);
    console.log(`💸  Estimated upload cost: ${(costEstimate / 1e12).toFixed(6)} AR`);
  } catch {
    console.warn('⚠️   Could not fetch price estimate — proceeding anyway.');
    costEstimate = 0;
  }

  // Fund if needed
  if (costEstimate > 0 && balance < costEstimate) {
    const deficit = costEstimate - balance;
    console.log(`\n⚠️   Balance too low. Funding ${(deficit / 1e12).toFixed(6)} AR...`);
    try {
      await irys.fund(deficit);
      console.log(`✅  Funded successfully.`);
    } catch (err) {
      console.error(`❌  Funding failed: ${err.message}`);
      console.error('    Top up your wallet at https://arweave.app and retry.');
      process.exit(1);
    }
  }

  // Upload files and build manifest paths
  console.log('\n📤  Uploading files...');
  const paths     = {};
  let uploaded    = 0;
  let failed      = 0;
  const failedPaths = [];

  for (const file of files) {
    const contentType = MIME_MAP[file.ext] || 'application/octet-stream';
    const tags = [
      { name: 'Content-Type',       value: contentType },
      { name: 'App-Name',           value: 'EONAPP.CH' },
      { name: 'App-Version',        value: '1.0' },
      { name: 'Deploy-Path',        value: file.relPath },
      { name: 'Deploy-Timestamp',   value: new Date().toISOString() }
    ];

    try {
      const data     = fs.readFileSync(file.fullPath);
      const receipt  = await irys.upload(data, { tags });
      paths[file.relPath] = { id: receipt.id };
      uploaded++;
      process.stdout.write(`  ✓ ${file.relPath}\n`);
    } catch (err) {
      failed++;
      failedPaths.push(file.relPath);
      console.warn(`  ✗ FAILED: ${file.relPath} — ${err.message}`);
    }
  }

  console.log(`\n📊  Upload complete: ${uploaded} succeeded, ${failed} failed`);

  if (failed > 0) {
    console.warn('\n⚠️   Failed files:');
    failedPaths.forEach((p) => console.warn(`  - ${p}`));
  }

  // Create Arweave Path Manifest
  // Spec: https://github.com/ArweaveTeam/arweave/blob/master/doc/path-manifest-schema.md
  const manifest = {
    manifest: 'arweave/paths',
    version:  '0.1.0',
    index:    { path: 'index.html' },
    paths
  };

  console.log('\n📋  Uploading Path Manifest...');
  let manifestTxId;
  try {
    const manifestData    = Buffer.from(JSON.stringify(manifest));
    const manifestReceipt = await irys.upload(manifestData, {
      tags: [
        { name: 'Content-Type', value: 'application/x.arweave-manifest+json' },
        { name: 'App-Name',     value: 'EONAPP.CH' },
        { name: 'Manifest-For', value: 'EONAPP.CH static site' },
        { name: 'Deploy-Date',  value: new Date().toISOString().slice(0, 10) }
      ]
    });
    manifestTxId = manifestReceipt.id;
    console.log(`✅  Manifest TX ID: ${manifestTxId}`);
  } catch (err) {
    console.error(`❌  Manifest upload failed: ${err.message}`);
    process.exit(1);
  }

  // Save manifest record
  const record = {
    manifestTxId,
    deployedAt:    new Date().toISOString(),
    fileCount:     uploaded,
    totalBytes:    totalSize,
    arweaveUrl:    `https://arweave.net/${manifestTxId}`,
    irysUrl:       `https://gateway.irys.xyz/${manifestTxId}`,
    arnsDomain:    'eonapp.ar.io (update ArNS pointer to this TX ID)',
    failedFiles:   failedPaths
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(record, null, 2));
  console.log(`\n💾  Manifest record saved to: arweave-manifest.json`);

  console.log('\n');
  console.log('═'.repeat(50));
  console.log('🎉  DEPLOYMENT COMPLETE');
  console.log('═'.repeat(50));
  console.log(`\n🌐  Access your site:`);
  console.log(`   Arweave:  ${record.arweaveUrl}/index.html`);
  console.log(`   Irys GW:  ${record.irysUrl}/index.html`);
  console.log('');
  console.log(`📌  To update your ArNS domain (eonapp.ar.io):`);
  console.log(`   1. Go to https://ar.io/arns`);
  console.log(`   2. Find your domain → Update → Paste TX ID: ${manifestTxId}`);
  console.log(`   3. Submit transaction (small AR fee)`);
  console.log('');
  console.log(`💡  Note: Arweave mining confirmation takes ~15–30 minutes.`);
  console.log(`    Site will be permanently accessible at the above URLs after confirmation.`);
  console.log('');
}

main().catch((err) => {
  console.error('\n❌  Fatal error:', err.message);
  process.exit(1);
});
