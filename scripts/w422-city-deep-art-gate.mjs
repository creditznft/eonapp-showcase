#!/usr/bin/env node
/** W422 source gate: deep original art is present, integrated, bounded and auditable. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_CITY_VECTOR_ART_CATALOG, EON_CITY_VECTOR_ART_DEEP_EXTENSION_IDS, EON_CITY_VECTOR_ART_FOUNDATION_IDS, getCityVectorArtCategoryCounts, getCityVectorArtPlan, getCityVectorArtSummary, validateCityVectorArtCatalog } from '../assets/js/city/eon-city-vector-art-kit.js';
import { EON_CITY_DEEP_ART_CHAPTERS, EON_CITY_DEEP_ART_PLACEMENTS, getCityDeepArtDirectionSummary, getCityDeepArtPlacementPlan, validateCityDeepArtDirection } from '../assets/js/city/eon-city-deep-art-direction.js';
import { getCityArtReviewSummary, getCityCinematicShots, validateCityArtReview } from '../assets/js/city/eon-city-art-review.js';
import { W422_CITY_DEEP_ART_CONTRACT, validateW422CityDeepArtContract } from '../config/w422-city-deep-art-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const sha256 = (relative) => createHash('sha256').update(readFileSync(path.join(root, relative))).digest('hex');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW422CityDeepArt() {
  const contract = W422_CITY_DEEP_ART_CONTRACT;
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  const station = read('assets/js/eon-city-play-station.js');
  const css = read('assets/css/eon-city-play.css');
  const readme = read('assets/city/art/README.md');
  const docs = read('docs/W422_CITY_DEEP_ORIGINAL_ART_2026-06-28.md');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const catalogSummary = getCityVectorArtSummary({ quality: 'cinematic' });
  const counts = getCityVectorArtCategoryCounts();
  const deepDirection = getCityDeepArtDirectionSummary({ quality: 'cinematic' });
  const artReview = getCityArtReviewSummary({ quality: 'cinematic' });

  check('contract-valid', validateW422CityDeepArtContract().length === 0, 'W422 contract has no internal mismatch');
  check('required-files-exist', contract.requiredFiles.every((relative) => existsSync(path.join(root, relative))), 'generator, source art, runtime/UI, gate, tests and handover docs exist');
  check('catalog-is-complete', validateCityVectorArtCatalog().ok && EON_CITY_VECTOR_ART_CATALOG.length === contract.catalog.total && EON_CITY_VECTOR_ART_FOUNDATION_IDS.length === contract.catalog.foundation && EON_CITY_VECTOR_ART_DEEP_EXTENSION_IDS.length === contract.catalog.extension, '58 original source artworks include the 18-piece foundation and 40-piece extension');
  check('category-budgets-match', JSON.stringify(counts) === JSON.stringify(contract.catalog.categories) && catalogSummary.categoryCounts.material === 12 && catalogSummary.categoryCounts.prop === 8, 'materials, backdrops, decals and props match the approved art taxonomy');
  check('all-source-hashes-and-svg-boundaries-pass', EON_CITY_VECTOR_ART_CATALOG.every((entry) => {
    const relative = path.join('assets/city/art', entry.file);
    const svg = read(relative);
    return sha256(relative) === entry.sha256
      && /^<svg\b/i.test(svg.trim())
      && !/<image\b/i.test(svg)
      && !/\b(?:href|xlink:href)=["'](?:data:|https?:|\/)/i.test(svg)
      && !/url\(\s*(?:https?:|\/)/i.test(svg)
      && !/@import\s/i.test(svg);
  }), 'every art file has a matching hash and no remote/data/image import');
  check('quality-tiers-remain-bounded', getCityVectorArtPlan({ quality: 'lite' }).entries.length < getCityVectorArtPlan({ quality: 'balanced' }).entries.length && getCityVectorArtPlan({ quality: 'balanced' }).entries.length < getCityVectorArtPlan({ quality: 'cinematic' }).entries.length && getCityVectorArtPlan({ quality: 'cinematic' }).entries.length === contract.catalog.total, 'Lite, Balanced and Cinematic select progressively richer local art without loading remote media');
  check('authored-direction-is-complete', validateCityDeepArtDirection().ok && EON_CITY_DEEP_ART_CHAPTERS.map((entry) => entry.id).join(',') === contract.requiredChapterIds.join(',') && EON_CITY_DEEP_ART_PLACEMENTS.length === contract.requiredPlacementCount && deepDirection.placementCount === contract.requiredPlacementCount, 'five authored chapters and thirty-three bounded local placements are defined');
  check('renderer-applies-deep-art-layers', /addDeepArtDressing/.test(renderer) && /getCityDeepArtPlacementPlan/.test(renderer) && /getDeepSurfaceTexture/.test(renderer) && /deepArtDressing/.test(renderer) && /createDeepArtPlacement/.test(renderer), 'Babylon uses deep surfaces, backdrop layers, floor decals and props');
  check('art-review-is-usable-at-expanded-scale', validateCityArtReview().ok && getCityCinematicShots().map((entry) => entry.id).join(',') === contract.requiredShotIds.join(',') && artReview.vectorArt.catalogCount === contract.catalog.total && artReview.deepArt.placementCount === contract.requiredPlacementCount && /data-eon-play-art-filter/.test(station) && /eon-play-art-chapter-grid/.test(css), 'Art Review exposes filters, chapters and ten local views for the full asset inventory');
  check('final-art-boundary-is-explicit', /not an approved GLB\/KTX2 final-art release/i.test(readme) && /not final binary art/i.test(docs) && /real-device visual proof/i.test(docs) && catalogSummary.finalInstitutionalArtClaim === false && artReview.finalInstitutionalArtClaim === false, 'source art remains distinct from reviewed final binary art and human/device proof');
  return Object.freeze({ schema: 'eonapp.w422.city-deep-art-gate.v1', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), artCatalog: contract.catalog, finalArtClaim: false, externalEvidenceRequired: Object.freeze(['human art/rights review', 'reviewed GLB/KTX2/LOD intake through W417', 'desktop/Android/iOS visual and performance proof', 'production deployment evidence']) });
}

export function runW422CityDeepArtGate({ writeArtifact = true } = {}) {
  const report = inspectW422CityDeepArt();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w422-city-deep-art-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runW422CityDeepArtGate();
  process.stdout.write(`W422 City deep-art gate passed (${report.checkCount}/${report.checkCount}).\n`);
}
