#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateEonServiceWorker } from './generate-service-worker.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const TEXT_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.svg', '.txt', '.webmanifest', '.xml']);

const FILES = [
  ['favicon.svg', 'favicon.svg'],
  ['favicon.ico', 'favicon.ico'],
  ['manifest.webmanifest', 'manifest.webmanifest'],
  ['robots.txt', 'robots.txt'],
  ['sitemap.xml', 'sitemap.xml'],
  ['_headers', '_headers'],
  ['_redirects', '_redirects'],
  ['assets/js/eon-theme-bootstrap.js', 'assets/js/eon-theme-bootstrap.js'],
  ['assets/img/icons/icon-192.png', 'assets/img/icons/icon-192.png'],
  ['assets/img/icons/icon-512.png', 'assets/img/icons/icon-512.png'],
  ['assets/img/og/default.svg', 'assets/img/og/default.svg'],
  ['assets/css/eon-city-auto-loader.css', 'assets/css/eon-city-auto-loader.css'],
  // The authenticated /eoncity route owns its full-screen overlays in this
  // stylesheet. Keep it in public/ so Vite carries the route reference into
  // the immutable Pages artifact rather than silently falling back to static
  // document flow for Menu, Transit and Expanse surfaces.
  ['assets/css/eon-city-play.css', 'assets/css/eon-city-play.css'],
  // A unique pathname prevents an already-installed legacy cache from
  // answering the City overlay request with its old response.
  ['assets/css/eon-city-play.css', 'assets/css/eon-city-play-live-3a245e6.css'],
  ['assets/css/eon-command-surface.css', 'assets/css/eon-command-surface.css'],
  ['assets/css/eon-work-surface.css', 'assets/css/eon-work-surface.css'],
  ['assets/css/eon-city-product-layer.css', 'assets/css/eon-city-product-layer.css'],
  ['assets/css/eon-continue.css', 'assets/css/eon-continue.css'],
  ['assets/css/eon-nexus-pulse.css', 'assets/css/eon-nexus-pulse.css'],
  ['assets/css/eon-nexus-live.css', 'assets/css/eon-nexus-live.css'],
  ['assets/css/eon-nexus-living-core.css', 'assets/css/eon-nexus-living-core.css'],
];

function copyFile(relSrc, relDest) {
  const src = path.join(ROOT, relSrc);
  const dest = path.join(PUBLIC, relDest);
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  normalizeTextFile(dest);
  return true;
}

function normalizeTextFile(file) {
  if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) return;
  const source = fs.readFileSync(file, 'utf8');
  const normalized = source.replace(/\r\n/g, '\n');
  if (normalized !== source) fs.writeFileSync(file, normalized, 'utf8');
}

function normalizeTextTree(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) normalizeTextTree(target);
    else if (entry.isFile()) normalizeTextFile(target);
  }
}

function copyDirectory(relSrc, relDest) {
  const source = path.join(ROOT, relSrc);
  const destination = path.join(PUBLIC, relDest);
  if (!fs.existsSync(source)) return 0;
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true, force: true });
  normalizeTextTree(destination);
  return 1;
}

const DIRECTORIES = [
  ['assets/city/art', 'assets/city/art'],
  ['assets/city/models', 'assets/city/models'],
  // W649: immutable same-origin GLBs and the source-controlled Meshopt decoder
  // must be emitted by the production build. These are static Pages assets;
  // no Worker/Function relay is introduced.
  ['assets/city/w649', 'assets/city/w649'],
  ['assets/city/w659f', 'assets/city/w659f'],
  // W792: Storm Sector authored models and local audio are a maintained City
  // package. Emit them before the content-addressing pass rewrites their URLs.
  ['assets/city/future-regions', 'assets/city/future-regions'],
  ['assets/vendor/babylon', 'assets/vendor/babylon'],
  // W661D: route metadata references these exact same-origin PNG cards.
  // Keep the source-controlled card family in every production candidate.
  ['assets/media/social', 'assets/media/social'],
  // RT92 Sponsor Terminal references this same-origin tail asset by a stable
  // runtime URL. It is not an ESM import, so Vite will emit it only when the
  // production public-asset sync includes the directory explicitly.
  ['assets/media/sponsor-terminal', 'assets/media/sponsor-terminal']
];

const RETIRED_PUBLIC_FILES = [
  'scripts/ipfsLootGatewayClient.js',
  'loot/launch-tokens.json',
  'assets/css/telegram-growth.css',
  'assets/css/social-missions.css'
];

function removeRetiredPublicFiles() {
  for (const relative of RETIRED_PUBLIC_FILES) {
    fs.rmSync(path.join(PUBLIC, relative), { force: true });
  }
}

function main() {
  const serviceWorker = generateEonServiceWorker({ root: ROOT });
  removeRetiredPublicFiles();
  let copied = 0;
  let copiedDirectories = 0;
  for (const [src, dest] of FILES) {
    if (copyFile(src, dest)) copied += 1;
  }
  for (const [src, dest] of DIRECTORIES) copiedDirectories += copyDirectory(src, dest);
  if (copied !== FILES.length) {
    throw new Error(`[sync-public-assets] required static asset copy incomplete: copied ${copied}/${FILES.length}`);
  }
  console.log(`[sync-public-assets] generated service worker ${serviceWorker.sha256.slice(0, 12)} and copied ${copied}/${FILES.length} files plus ${copiedDirectories}/${DIRECTORIES.length} directories into public/`);
}

main();
