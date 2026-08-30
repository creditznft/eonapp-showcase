#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_ROUTE_ROWS, targetToFile } from '../config/route-contract.mjs';

export const EON_OFFLINE_PACK_MANIFEST_SCHEMA = 'eonapp.offline-pack-manifest.w766ir2.v1';
export const EON_OFFLINE_PACK_MANIFEST_URL = '/offline/eonapp-offline-pack-manifest.json';
export const EON_OFFLINE_PACK_IDS = Object.freeze(['core', 'city']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_DIST = path.join(ROOT, 'dist');

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function toPosix(value = '') {
  return String(value || '').split(path.sep).join('/');
}

function listFiles(directory, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) listFiles(absolute, output);
    else if (entry.isFile()) output.push(absolute);
  }
  return output;
}

function contentTypeFor(file = '') {
  const extension = path.extname(file).toLowerCase();
  return ({
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.wasm': 'application/wasm',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.bin': 'application/octet-stream',
    '.ktx2': 'image/ktx2',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm'
  })[extension] || 'application/octet-stream';
}

function packForUrl(url = '') {
  const pathname = String(url || '').toLowerCase();
  return pathname.startsWith('/assets/city/')
    || pathname.startsWith('/city-private/')
    || pathname.startsWith('/assets/js/city/')
    || pathname.startsWith('/assets/js/eon-city-')
    || pathname.startsWith('/assets/css/eon-city-')
    ? 'city'
    : 'core';
}

function routeEntries(distDir) {
  const entries = [];
  const seen = new Set();
  for (const row of ALL_ROUTE_ROWS) {
    const route = String(row.from || '');
    if (Number(row.status) !== 200 || !route.startsWith('/') || route.includes('*') || seen.has(route)) continue;
    const sourceFile = targetToFile(row.to);
    if (!sourceFile) continue;
    const cleanRouteFile = route === '/' ? 'index.html' : path.join(route.replace(/^\/+/, ''), 'index.html');
    const sourcePath = fs.existsSync(path.join(distDir, cleanRouteFile)) ? cleanRouteFile : sourceFile;
    const absolute = path.join(distDir, sourcePath);
    if (!fs.existsSync(absolute)) continue;
    seen.add(route);
    entries.push({ url: route, sourcePath: toPosix(sourcePath), pack: route === '/eoncity' ? 'city' : 'core', navigation: true });
  }
  if (!seen.has('/') && fs.existsSync(path.join(distDir, 'index.html'))) entries.push({ url: '/', sourcePath: 'index.html', pack: 'core', navigation: true });
  return entries;
}

function staticEntries(distDir) {
  const ignoredRootNames = new Set(['sw.js', '_headers', '_redirects', '_routes.json', '.eon-build-report.json', 'build-provenance.json']);
  const output = [];
  for (const absolute of listFiles(distDir)) {
    const relative = toPosix(path.relative(distDir, absolute));
    if (!relative || relative.startsWith('offline/') || relative.endsWith('.map')) continue;
    if (!relative.includes('/') && ignoredRootNames.has(relative)) continue;
    if (relative.endsWith('.html')) continue; // canonical navigation entries are emitted separately.
    if (!relative.startsWith('assets/')
      && !relative.startsWith('release/')
      && !['manifest.webmanifest', 'favicon.svg', 'favicon.ico', 'robots.txt'].includes(relative)) continue;
    const url = `/${relative}`;
    output.push({ url, sourcePath: relative, pack: packForUrl(url), navigation: false });
  }
  for (const recoveryFile of ['offline.html', '404.html']) {
    const absolute = path.join(distDir, recoveryFile);
    if (fs.existsSync(absolute)) output.push({ url: `/${recoveryFile}`, sourcePath: recoveryFile, pack: 'core', navigation: true });
  }
  return output;
}

export function createEonOfflinePackManifest({ distDir = DEFAULT_DIST, releaseId = '', sourceRevision = '' } = {}) {
  const absoluteDist = path.resolve(distDir);
  if (!fs.existsSync(absoluteDist)) throw new Error(`Offline pack dist directory is missing: ${absoluteDist}`);
  const rows = [...routeEntries(absoluteDist), ...staticEntries(absoluteDist)];
  const byUrl = new Map();
  for (const row of rows) {
    if (byUrl.has(row.url)) continue;
    const absolute = path.join(absoluteDist, row.sourcePath);
    const bytes = fs.readFileSync(absolute);
    byUrl.set(row.url, Object.freeze({
      url: row.url,
      sourcePath: row.sourcePath,
      pack: row.pack,
      navigation: row.navigation === true,
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
      contentType: contentTypeFor(row.sourcePath)
    }));
  }
  const entries = [...byUrl.values()].sort((left, right) => left.url.localeCompare(right.url));
  const packSummary = Object.fromEntries(EON_OFFLINE_PACK_IDS.map((pack) => {
    const selected = entries.filter((entry) => entry.pack === pack);
    return [pack, Object.freeze({ entries: selected.length, bytes: selected.reduce((total, entry) => total + entry.bytes, 0) })];
  }));
  const unsigned = {
    schema: EON_OFFLINE_PACK_MANIFEST_SCHEMA,
    releaseId: String(releaseId || '').slice(0, 120),
    sourceRevision: String(sourceRevision || '').slice(0, 160),
    generatedAt: 'source-controlled-deterministic',
    packs: packSummary,
    entries
  };
  const digestInput = JSON.stringify({ schema: unsigned.schema, releaseId: unsigned.releaseId, sourceRevision: unsigned.sourceRevision, packs: unsigned.packs, entries: unsigned.entries });
  return Object.freeze({ ...unsigned, digest: sha256(Buffer.from(digestInput, 'utf8')) });
}

export function writeEonOfflinePackManifest({ distDir = DEFAULT_DIST, releaseId = '', sourceRevision = '' } = {}) {
  const manifest = createEonOfflinePackManifest({ distDir, releaseId, sourceRevision });
  const destination = path.join(path.resolve(distDir), EON_OFFLINE_PACK_MANIFEST_URL.replace(/^\//, ''));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(manifest, null, 2)}\n`);
  return Object.freeze({ destination, manifest });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const result = writeEonOfflinePackManifest({
    distDir: process.env.EONAPP_DIST_DIR || DEFAULT_DIST,
    releaseId: process.env.EONAPP_RELEASE_ID || '',
    sourceRevision: process.env.EONAPP_SOURCE_REVISION || ''
  });
  console.log(JSON.stringify({ ok: true, path: result.destination, digest: result.manifest.digest, packs: result.manifest.packs }, null, 2));
}
