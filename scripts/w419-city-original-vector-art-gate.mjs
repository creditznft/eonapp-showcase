#!/usr/bin/env node
/** W419 source gate: verify original local vector art and Babylon integration. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_CITY_VECTOR_ART_CATALOG, getCityVectorArtSummary, validateCityVectorArtCatalog } from '../assets/js/city/eon-city-vector-art-kit.js';
import { W419_CITY_ORIGINAL_VECTOR_ART_CONTRACT, validateW419CityOriginalVectorArtContract } from '../config/w419-city-original-vector-art-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const sha256 = (relative) => createHash('sha256').update(readFileSync(path.join(root, relative))).digest('hex');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW419CityOriginalVectorArt() {
  const contract = W419_CITY_ORIGINAL_VECTOR_ART_CONTRACT;
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  const noirArchitecture = read('assets/js/city/eon-city-noir-architecture.js');
  const artCompositionSource = `${renderer}\n${noirArchitecture}`;
  const runtime = read('assets/js/city/eon-city-vector-art-runtime.js');
  const syncPublicAssets = read('scripts/sync-public-assets.mjs');
  const readme = read('assets/city/art/README.md');
  const summary = getCityVectorArtSummary({ quality: 'cinematic' });
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  check('contract-valid', validateW419CityOriginalVectorArtContract().length === 0, 'W419 contract has no internal mismatch');
  check('required-files-exist', contract.requiredFiles.every((relative) => existsSync(path.join(root, relative))), 'art source, runtime, integration, scripts, test and docs exist');
  check('complete-original-vector-catalog', validateCityVectorArtCatalog().ok && contract.requiredArtIds.every((id) => EON_CITY_VECTOR_ART_CATALOG.some((entry) => entry.id === id)), 'the W419 18-piece foundation remains catalogued inside the verified W422 extension');
  check('hashes-match-source-bytes', EON_CITY_VECTOR_ART_CATALOG.every((entry) => sha256(path.join('assets/city/art', entry.file)) === entry.sha256), 'catalog hashes match the shipped SVG source bytes');
  check('self-contained-svg-art', EON_CITY_VECTOR_ART_CATALOG.every((entry) => {
    const svg = read(path.join('assets/city/art', entry.file));
    return /^<svg\b/i.test(svg.trim())
      && !/<image\b/i.test(svg)
      && !/\b(?:href|xlink:href)=["'](?:data:|https?:|\/)/i.test(svg)
      && !/url\(\s*(?:https?:|\/)/i.test(svg)
      && !/@import\s/i.test(svg);
  }), 'each art SVG is self-contained and has no remote, data-URI or absolute asset reference');
  check('same-origin-runtime-only', ((/new Texture\(getCityVectorArtPath\(id\)/.test(runtime) || (/createSafeCityTexture/.test(runtime) && /getCityVectorArtPath\(id\)/.test(runtime))) && /remoteNetwork: false/.test(runtime) && !/https?:\/\//i.test(runtime)), 'runtime loads only same-origin catalog paths through the safe texture factory');
  check('public-build-copies-art-directory', /assets\/city\/art/.test(syncPublicAssets) && /copyDirectory/.test(syncPublicAssets), 'build staging copies the vector art directory into public assets');
  check('renderer-applies-material-and-district-art', contract.requiredRuntimeUses.every((id) => artCompositionSource.includes(`'${id}'`)) && /createCityVectorArtRuntime/.test(renderer) && /addVectorArtSkyline/.test(renderer) && /createVectorArtDecal/.test(renderer) && /createEonNoirLandmark/.test(renderer) && /vectorArt/.test(noirArchitecture), 'renderer forwards the local vector kit into landmark materials, backdrop, emblems and wayfinding');
  check('shipped-art-boundary-is-honest', summary.originalVectorArtShipped === true && summary.binaryArtShipped === false && summary.finalVisualCertification === false && /not an approved GLB\/KTX2 final-art release/i.test(readme), 'vector art is real shipped source art but not final binary 3D certification');
  return Object.freeze({ schema: 'eonapp.w419.city-original-vector-art-gate.v1', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), originalVectorArt: true, finalBinaryArt: false, externalEvidenceRequired: Object.freeze(['real-device City screenshots/video', 'licensed or commissioned GLB/KTX2 intake', 'human art review', 'performance proof on target devices']) });
}

export function runW419CityOriginalVectorArtGate({ writeArtifact = true } = {}) {
  const report = inspectW419CityOriginalVectorArt();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w419-city-original-vector-art-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runW419CityOriginalVectorArtGate();
  process.stdout.write(`W419 original vector art gate passed (${report.checkCount}/${report.checkCount}).\n`);
}
