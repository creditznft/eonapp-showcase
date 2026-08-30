#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const EON_CITY_CONTENT_ADDRESS_SCHEMA = 'eon.city.content-addressed-binaries.w766ir2-f.v1';
export const EON_CITY_IMMUTABLE_MANIFEST_SCHEMA = 'eon.city.immutable-asset-manifest.r09.v1';
export const EON_CITY_IMMUTABLE_MANIFEST_PATH = 'assets/city/immutable/manifest.json';
export const EON_CITY_IMMUTABLE_PREFIX = '/assets/city/immutable/';
export const EON_CITY_BINARY_EXTENSIONS = Object.freeze(new Set(['.glb', '.gltf', '.bin', '.webp', '.ktx2']));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_DIST = path.join(ROOT, 'dist');
const TEXT_EXTENSIONS = new Set(['.html', '.js', '.mjs', '.css', '.json', '.gltf', '.webmanifest', '.svg', '.txt', '.xml']);
const HASHED_BINARY_BASENAME = /\.[a-f0-9]{12}\.(?:glb|gltf|bin|webp|ktx2)$/i;
const UNHASHED_CITY_BINARY_REFERENCE = /(?:^|["'`(=:\s])((?:\/|\.\.\/|\.\/)?assets\/city\/(?!immutable\/)[^"'`\s?#)]+\.(?:glb|gltf|bin|webp|ktx2))(?:["'`),?\s]|$)/gi;

const toPosix = (value = '') => String(value || '').split(path.sep).join('/');
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

function listFiles(directory, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) listFiles(absolute, output);
    else if (entry.isFile()) output.push(absolute);
  }
  return output;
}

function isCityBinary(file) {
  return EON_CITY_BINARY_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function isAlreadyContentAddressed(relative = '') {
  return HASHED_BINARY_BASENAME.test(path.basename(relative));
}

function embeddedHash(relative = '') {
  return path.basename(relative).match(/\.([a-f0-9]{12})\.(?:glb|gltf|bin|webp|ktx2)$/i)?.[1]?.toLowerCase() || '';
}

function immutableRelativeFor(relative, digest) {
  const normalized = toPosix(relative).replace(/^assets\/city\//, '');
  const extension = path.extname(normalized);
  const stem = normalized.slice(0, -extension.length);
  return `assets/city/immutable/${stem}.${digest.slice(0, 12)}${extension}`;
}

function splitUriSuffix(value = '') {
  const match = String(value || '').match(/^([^?#]*)([?#].*)?$/);
  return { pathname: match?.[1] || '', suffix: match?.[2] || '' };
}

function projectGltfRelativeUris({ sourceFile, sourceRelative, mappingBySource }) {
  let document = null;
  try { document = JSON.parse(fs.readFileSync(sourceFile, 'utf8')); }
  catch (error) { throw new Error(`Invalid emitted glTF JSON: ${sourceRelative}: ${String(error?.message || error)}`); }
  let rewritten = 0;
  const sourceDir = path.posix.dirname(toPosix(sourceRelative));
  const immutableDir = path.posix.join('assets/city/immutable', sourceDir.replace(/^assets\/city\/?/, ''));
  const rewriteCollection = (items = []) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      const uri = String(item?.uri || '');
      if (!uri || /^(?:data:|blob:|https?:|\/\/)/i.test(uri)) continue;
      const { pathname: uriPath, suffix } = splitUriSuffix(uri);
      const resolved = path.posix.normalize(path.posix.join(sourceDir, uriPath));
      const target = mappingBySource.get(resolved);
      if (!target) continue;
      const relativeTarget = path.posix.relative(immutableDir, target.immutableRelative) || path.posix.basename(target.immutableRelative);
      item.uri = `${relativeTarget}${suffix}`;
      rewritten += 1;
    }
  };
  rewriteCollection(document.buffers);
  rewriteCollection(document.images);
  return Object.freeze({ bytes: Buffer.from(`${JSON.stringify(document)}\n`), rewritten });
}

function inspectGltfLocalUris({ absoluteDist, file, relative }) {
  const issues = [];
  let document = null;
  try { document = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return [{ file: relative, reference: 'invalid-gltf-json' }]; }
  const baseDir = path.posix.dirname(relative);
  const inspectCollection = (items = []) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      const uri = String(item?.uri || '');
      if (!uri || /^(?:data:|blob:|https?:|\/\/)/i.test(uri)) continue;
      const { pathname: uriPath } = splitUriSuffix(uri);
      const resolved = path.posix.normalize(path.posix.join(baseDir, uriPath));
      const absolute = path.join(absoluteDist, resolved);
      if (!fs.existsSync(absolute)) issues.push({ file: relative, reference: `${uri}:missing` });
      else if (isCityBinary(absolute) && !isAlreadyContentAddressed(resolved)) issues.push({ file: relative, reference: `${uri}:mutable-city-binary` });
    }
  };
  inspectCollection(document.buffers);
  inspectCollection(document.images);
  return issues;
}

function replaceReferences(source, replacements) {
  let output = source;
  let replacementsMade = 0;
  for (const [from, to] of replacements) {
    const candidates = [
      [`/${from}`, `/${to}`],
      [from, to]
    ];
    for (const [needle, replacement] of candidates) {
      if (!output.includes(needle)) continue;
      const count = output.split(needle).length - 1;
      output = output.split(needle).join(replacement);
      replacementsMade += count;
    }
  }
  return { output, replacementsMade };
}

export function writeEonCityImmutableAssetManifest({ distDir = DEFAULT_DIST, mappings = [] } = {}) {
  const absoluteDist = path.resolve(distDir);
  const entries = [...mappings]
    .map((entry) => Object.freeze({
      sourcePath: `/${toPosix(entry.sourceRelative)}`,
      url: `/${toPosix(entry.immutableRelative)}`,
      sha256: String(entry.sha256 || '').toLowerCase(),
      bytes: Math.max(0, Number(entry.bytes || 0)),
      group: toPosix(entry.sourceRelative).replace(/^assets\/city\//, '').split('/')[0] || 'city'
    }))
    .sort((left, right) => left.url.localeCompare(right.url));
  const authority = { schema: EON_CITY_IMMUTABLE_MANIFEST_SCHEMA, entries };
  const digest = sha256(Buffer.from(JSON.stringify(authority)));
  const manifest = Object.freeze({ ...authority, digest });
  const destination = path.join(absoluteDist, EON_CITY_IMMUTABLE_MANIFEST_PATH);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(manifest, null, 2)}
`);
  return Object.freeze({ destination, manifest });
}

export function auditEonCityContentAddressedDist({ distDir = DEFAULT_DIST } = {}) {
  const absoluteDist = path.resolve(distDir);
  const cityRoot = path.join(absoluteDist, 'assets', 'city');
  const binaryFiles = listFiles(cityRoot).filter(isCityBinary);
  const unhashedFiles = binaryFiles
    .map((file) => toPosix(path.relative(absoluteDist, file)))
    .filter((relative) => !isAlreadyContentAddressed(relative));
  const unaddressedReferences = [];
  for (const file of listFiles(absoluteDist)) {
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
    const relativeTextFile = toPosix(path.relative(absoluteDist, file));
    // The R09 manifest intentionally records pre-build source identities for
    // audit/recovery; those sourcePath values are metadata, never runtime URLs.
    if (relativeTextFile === EON_CITY_IMMUTABLE_MANIFEST_PATH) continue;
    let source = '';
    try { source = fs.readFileSync(file, 'utf8'); } catch { continue; }
    for (const match of source.matchAll(UNHASHED_CITY_BINARY_REFERENCE)) {
      const value = String(match[1] || '').replace(/^\.\.\//, '').replace(/^\.\//, '').replace(/^\//, '');
      if (!value || HASHED_BINARY_BASENAME.test(value)) continue;
      unaddressedReferences.push(Object.freeze({ file: toPosix(path.relative(absoluteDist, file)), reference: value }));
    }
  }
  const hashMismatches = binaryFiles
    .map((file) => ({ file, relative: toPosix(path.relative(absoluteDist, file)) }))
    .filter(({ relative }) => isAlreadyContentAddressed(relative))
    .map(({ file, relative }) => ({ file: relative, embedded: embeddedHash(relative), actual: sha256(fs.readFileSync(file)).slice(0, 12) }))
    .filter((entry) => entry.embedded !== entry.actual);
  const gltfReferenceIssues = binaryFiles
    .filter((file) => path.extname(file).toLowerCase() === '.gltf')
    .flatMap((file) => inspectGltfLocalUris({ absoluteDist, file, relative: toPosix(path.relative(absoluteDist, file)) }));
  return Object.freeze({
    schema: EON_CITY_CONTENT_ADDRESS_SCHEMA,
    ok: unhashedFiles.length === 0 && hashMismatches.length === 0 && unaddressedReferences.length === 0 && gltfReferenceIssues.length === 0,
    binaryFiles: binaryFiles.length,
    unhashedFiles: Object.freeze(unhashedFiles),
    hashMismatches: Object.freeze(hashMismatches),
    unaddressedReferences: Object.freeze(unaddressedReferences),
    gltfReferenceIssues: Object.freeze(gltfReferenceIssues)
  });
}

export function contentAddressEonCityBinaries({ distDir = DEFAULT_DIST, removeOriginals = true } = {}) {
  const absoluteDist = path.resolve(distDir);
  const cityRoot = path.join(absoluteDist, 'assets', 'city');
  if (!fs.existsSync(cityRoot)) throw new Error(`City asset directory is missing: ${cityRoot}`);

  const candidates = listFiles(cityRoot)
    .filter(isCityBinary)
    .map((file) => ({ file, relative: toPosix(path.relative(absoluteDist, file)) }))
    .filter(({ relative }) => !isAlreadyContentAddressed(relative));
  const mappings = [];
  const mappingBySource = new Map();
  let bytesAddressed = 0;
  let rewrittenGltfUris = 0;

  const writeMapping = (candidate, bytes) => {
    const digest = sha256(bytes);
    const immutableRelative = immutableRelativeFor(candidate.relative, digest);
    const immutableFile = path.join(absoluteDist, immutableRelative);
    fs.mkdirSync(path.dirname(immutableFile), { recursive: true });
    if (fs.existsSync(immutableFile)) {
      const existing = fs.readFileSync(immutableFile);
      if (sha256(existing) !== digest) throw new Error(`Immutable City asset collision: ${immutableRelative}`);
    } else {
      fs.writeFileSync(immutableFile, bytes);
    }
    const mapping = Object.freeze({
      sourceRelative: candidate.relative,
      immutableRelative,
      sha256: digest,
      bytes: bytes.byteLength
    });
    mappings.push(mapping);
    mappingBySource.set(candidate.relative, mapping);
    bytesAddressed += bytes.byteLength;
    return mapping;
  };

  for (const candidate of candidates.filter(({ relative }) => path.extname(relative).toLowerCase() !== '.gltf')) {
    writeMapping(candidate, fs.readFileSync(candidate.file));
  }
  for (const candidate of candidates.filter(({ relative }) => path.extname(relative).toLowerCase() === '.gltf')) {
    const projected = projectGltfRelativeUris({
      sourceFile: candidate.file,
      sourceRelative: candidate.relative,
      mappingBySource
    });
    rewrittenGltfUris += projected.rewritten;
    writeMapping(candidate, projected.bytes);
  }

  const replacements = mappings.map((mapping) => [mapping.sourceRelative, mapping.immutableRelative]);
  let rewrittenFiles = 0;
  let rewrittenReferences = 0;
  for (const file of listFiles(absoluteDist)) {
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
    let source = '';
    try { source = fs.readFileSync(file, 'utf8'); } catch { continue; }
    const replaced = replaceReferences(source, replacements);
    if (replaced.output === source) continue;
    fs.writeFileSync(file, replaced.output);
    rewrittenFiles += 1;
    rewrittenReferences += replaced.replacementsMade;
  }

  if (removeOriginals) {
    for (const mapping of mappings) fs.rmSync(path.join(absoluteDist, mapping.sourceRelative), { force: true });
  }

  const immutableManifest = writeEonCityImmutableAssetManifest({ distDir: absoluteDist, mappings });
  const audit = auditEonCityContentAddressedDist({ distDir: absoluteDist });
  if (!audit.ok) {
    throw new Error(`City content-address audit failed: unhashedFiles=${audit.unhashedFiles.join(',') || 'none'} hashMismatches=${audit.hashMismatches.map((item) => `${item.file}:${item.embedded}->${item.actual}`).join(',') || 'none'} references=${audit.unaddressedReferences.map((item) => `${item.file}:${item.reference}`).join(',') || 'none'} gltf=${audit.gltfReferenceIssues.map((item) => `${item.file}:${item.reference}`).join(',') || 'none'}`);
  }

  return Object.freeze({
    schema: EON_CITY_CONTENT_ADDRESS_SCHEMA,
    ok: true,
    assetsAddressed: mappings.length,
    bytesAddressed,
    rewrittenFiles,
    rewrittenReferences,
    rewrittenGltfUris,
    removedOriginals: removeOriginals ? mappings.length : 0,
    mappings: Object.freeze(mappings),
    immutableManifest: Object.freeze({
      path: toPosix(path.relative(absoluteDist, immutableManifest.destination)),
      schema: immutableManifest.manifest.schema,
      digest: immutableManifest.manifest.digest,
      entries: immutableManifest.manifest.entries.length
    }),
    audit
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const result = contentAddressEonCityBinaries({
    distDir: process.env.EONAPP_DIST_DIR || DEFAULT_DIST,
    removeOriginals: process.env.EONAPP_KEEP_UNHASHED_CITY_BINARIES !== '1'
  });
  console.log(JSON.stringify(result, null, 2));
}
