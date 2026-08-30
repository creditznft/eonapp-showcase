#!/usr/bin/env node
/**
 * package-bundles.mjs
 * =====================
 * Creates self-contained downloadable bundles for Arweave archiving and offline use.
 *
 * Three bundle types:
 *  1. full-app       — the entire EONAPP.CH static site as a zip
 *  2. games-bundle   — only the games + shared assets
 *  3. tools-bundle   — only the tools + shared assets
 *
 * Each bundle is placed in dist/bundles/ and is suitable for:
 *  - Arweave upload as an offline app archive (permanent snapshot)
 *  - Direct download link on the site ("Download offline version")
 *  - Service worker pre-cache seeding
 *  - Epoch archive packages (epoch number baked into filename)
 *
 * Usage:
 *   node scripts/package-bundles.mjs [--epoch 42] [--type full|games|tools|all]
 *
 * Prerequisites:
 *   npm install archiver   (pure-js zip, no native binaries needed)
 *
 * @module scripts/package-bundles
 */

import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..');
const DIST       = path.join(ROOT, 'dist', 'bundles');

// ─── CLI args ──────────────────────────────────────────────────────────────────

const args  = process.argv.slice(2);
const epoch = (() => {
  const idx = args.indexOf('--epoch');
  return idx >= 0 && args[idx + 1] ? Number(args[idx + 1]) : null;
})();
const bundleType = (() => {
  const idx = args.indexOf('--type');
  const val = idx >= 0 ? args[idx + 1] : 'all';
  return ['full', 'games', 'tools', 'all'].includes(val) ? val : 'all';
})();

// ─── Paths always included in every bundle ─────────────────────────────────────

const SHARED_PATHS = [
  'assets/css',
  'assets/js/utils',
  'assets/js/app-data.js',
  'assets/js/hub.js',
  'assets/img',
  'assets/fonts',
  'favicon.ico',
  'favicon.svg',
  'manifest.webmanifest',
  'sw.js',
  '_headers',
  '_redirects',
  'privacy.html',
  'about.html',
  '404.html',
];

// ─── Bundle definitions ────────────────────────────────────────────────────────

const BUNDLES = {
  'full': {
    label:   'Full App Bundle',
    include: [
      'index.html',
      'vault.html',
      'chat.html',
      'archive.html',
      'tools',
      'games',
      'blog',
      'archive',
      'assets',
      'campaigns',
    ],
    exclude: [
      'platform-backend',
      'Smart Contracts',
      'node_modules',
      '.git',
      '.github',
      '.vscode',
      'scripts',
      'dist',
      'arweave-key.json',
      '.env',
      '.env.local',
      'claw.bat',
      'openclaw',
      '*.txt',
    ]
  },
  'games': {
    label:   'Games Bundle',
    include: [
      'index.html',
      'games',
      ...SHARED_PATHS,
      'assets/js/chat',      // chatbot widget used on game pages
      'assets/js/ads',
    ],
    exclude: ['tools', 'archive', 'blog', 'platform-backend', 'Smart Contracts', 'node_modules', '.git', 'scripts', 'dist']
  },
  'tools': {
    label:   'Tools Bundle',
    include: [
      'index.html',
      'tools',
      ...SHARED_PATHS,
      'assets/js/tools',
      'assets/js/tool-page.js',
      'assets/js/chat',
      'assets/js/ads',
    ],
    exclude: ['games', 'archive', 'blog', 'platform-backend', 'Smart Contracts', 'node_modules', '.git', 'scripts', 'dist']
  }
};

// ─── File walker ───────────────────────────────────────────────────────────────

function walkDir(dirPath, exclude = new Set()) {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (exclude.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, exclude));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

function collectFiles(bundleDef) {
  const excludeSet = new Set(bundleDef.exclude || []);
  const files = new Map(); // relativePath → absolutePath

  for (const include of bundleDef.include) {
    // Skip glob patterns in exclude
    if (excludeSet.has(include)) continue;
    const fullPath = path.join(ROOT, include);
    if (!fs.existsSync(fullPath)) continue;

    const stat = fs.statSync(fullPath);
    if (stat.isFile()) {
      const rel = path.relative(ROOT, fullPath).replace(/\\/g, '/');
      files.set(rel, fullPath);
    } else if (stat.isDirectory()) {
      for (const filePath of walkDir(fullPath, excludeSet)) {
        const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
        files.set(rel, filePath);
      }
    }
  }

  return files;
}

// ─── Bundle writer (without archiver dependency — plain directory copy) ────────
// We produce a manifest JSON + a directory with all files.
// For zipping, run: `cd dist/bundles/<name> && zip -r ../<name>.zip .`
// Or use `tar -czf <name>.tar.gz -C dist/bundles <name>/`
// This avoids npm archiver dependency at the cost of needing a manual zip step.

async function createBundle(name, bundleDef) {
  const suffix    = epoch != null ? `-epoch${epoch}` : `-${new Date().toISOString().slice(0, 10)}`;
  const dirName   = `${name}${suffix}`;
  const bundleDir = path.join(DIST, dirName);

  console.log(`\n📦 Building: ${bundleDef.label}`);
  console.log(`   Output:  dist/bundles/${dirName}/`);

  fs.mkdirSync(bundleDir, { recursive: true });

  const files = collectFiles(bundleDef);
  let count = 0;
  let totalBytes = 0;

  for (const [rel, abs] of files) {
    const dest = path.join(bundleDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(abs, dest);
    totalBytes += fs.statSync(abs).size;
    count++;
  }

  // Write bundle manifest
  const manifest = {
    bundle:      name,
    label:       bundleDef.label,
    epoch:       epoch,
    createdAt:   new Date().toISOString(),
    fileCount:   count,
    totalBytes,
    files:       [...files.keys()].sort()
  };
  fs.writeFileSync(path.join(bundleDir, 'bundle-manifest.json'), JSON.stringify(manifest, null, 2));

  // Write offline service worker override
  const swContent = generateOfflineSW(manifest.files);
  fs.writeFileSync(path.join(bundleDir, 'sw-offline.js'), swContent);

  const kb = Math.round(totalBytes / 1024);
  const mb = (totalBytes / (1024 * 1024)).toFixed(2);
  console.log(`   ✅ ${count} files, ${mb} MB (${kb} KB)`);
  console.log(`   📋 Bundle manifest written: bundle-manifest.json`);
  console.log(`   🔧 Offline SW written: sw-offline.js`);
  console.log(`\n   To create zip:`);
  console.log(`   cd "${DIST}" && tar -czf "${dirName}.tar.gz" "${dirName}"`);
  console.log(`   Or: cd "${DIST}" && zip -r "${dirName}.zip" "${dirName}"`);

  return { dirName, bundleDir, count, totalBytes };
}

// ─── Offline SW generator ─────────────────────────────────────────────────────

function generateOfflineSW(filePaths) {
  const ts = Date.now();
  const fileListJs = filePaths
    .filter((f) => !f.startsWith('node_modules') && !f.startsWith('.git'))
    .map((f) => `  '/${f}'`)
    .join(',\n');

  return `// Auto-generated offline service worker for bundle
// Generated: ${new Date().toISOString()}
// Caches all bundle files for full offline access.

const CACHE_NAME = 'eonapp-bundle-${ts}';
const CACHED_FILES = [
${fileListJs}
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHED_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() =>
        caches.match('/index.html')
      );
    })
  );
});
`;
}

// ─── Summary report ──────────────────────────────────────────────────────────

function printSummary(results) {
  console.log('\n' + '═'.repeat(60));
  console.log('BUNDLE SUMMARY');
  console.log('═'.repeat(60));

  let grandTotal = 0;
  for (const [name, result] of Object.entries(results)) {
    const mb = (result.totalBytes / (1024 * 1024)).toFixed(2);
    grandTotal += result.totalBytes;
    console.log(`  ${name.padEnd(12)} ${result.count} files  ${mb} MB`);
  }

  const grandMb = (grandTotal / (1024 * 1024)).toFixed(2);
  console.log('─'.repeat(60));
  console.log(`  Total:       ${grandMb} MB across all bundles`);
  console.log(`  Output dir:  dist/bundles/`);

  if (epoch != null) {
    console.log(`  Epoch tag:   ${epoch}`);
    console.log(`\n  Arweave upload tip:`);
    console.log(`    node scripts/deploy-arweave.mjs --keyfile ./arweave-key.json --bundle dist/bundles/`);
  }

  console.log('\n  📌 Arweave usage: upload the .tar.gz as an immutable epoch snapshot.');
  console.log('     The permanent TX ID is your version anchor in D1 (epoch_archives table).');
  console.log('═'.repeat(60));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🏗  EONAPP.CH Bundle Packager');
  console.log(`   Bundle type: ${bundleType}`);
  console.log(`   Epoch:       ${epoch ?? 'none (date-tagged)'}`);
  console.log(`   Output:      dist/bundles/`);

  fs.mkdirSync(DIST, { recursive: true });

  const toBuild = bundleType === 'all' ? Object.keys(BUNDLES) : [bundleType];
  const results = {};

  for (const name of toBuild) {
    if (!BUNDLES[name]) {
      console.error(`Unknown bundle type: ${name}`);
      process.exit(1);
    }
    results[name] = await createBundle(name, BUNDLES[name]);
  }

  printSummary(results);
}

main().catch((err) => {
  console.error('Bundle packaging failed:', err);
  process.exit(1);
});
