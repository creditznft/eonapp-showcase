#!/usr/bin/env node
/** W567/W611 source gate — future package contract remains fail-closed beside current local candidates. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_BINARY_PIPELINE_MANIFESTS,
  getEonCityBinaryPipelineTruth,
  validateEonCityBinaryPipelineRegister
} from '../assets/js/city/eon-city-binary-pipeline.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const required = Object.freeze([
  'assets/js/city/eon-city-binary-pipeline.js',
  'assets/js/city/eon-city-art-source-register.js',
  'assets/js/city/eon-city-asset-catalog.js',
  'assets/js/city/eon-city-asset-release-preflight.js',
  'tests/unit/w567-city-binary-pipeline.test.mjs',
  'scripts/run-current-unit-suite.mjs'
]);

export function inspectW567CityBinaryPipeline({ writeArtifact = true } = {}) {
  const checks = [];
  const check = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const source = read('assets/js/city/eon-city-binary-pipeline.js');
  const provenance = read('assets/js/city/eon-city-art-source-register.js');
  const preflight = read('assets/js/city/eon-city-asset-release-preflight.js');
  const runner = read('scripts/run-current-unit-suite.mjs');
  const register = validateEonCityBinaryPipelineRegister();
  const truth = getEonCityBinaryPipelineTruth();
  check('required-files-exist', required.every((relative) => existsSync(path.join(root, relative))), 'pipeline, provenance, preflight, test and current-suite files exist');
  check('static-register-empty', register.ok === true && EON_CITY_BINARY_PIPELINE_MANIFESTS.length === 0, 'no binary package is registered in W567');
  check('truth-stays-unreleased', truth.binaryPackagePresent === false && truth.engineeringCandidateAssetsPresent === true && truth.binaryLoadEnabled === true && truth.finalBinaryArtClaim === false && truth.edgePathPolicyProven === false, 'current local candidates do not create a W567 package delivery or final-art claim');
  check('future-manifest-schema-present', /EON_CITY_BINARY_PIPELINE_MANIFEST_SCHEMA/.test(source) && /package-spec-pending-binary-evidence/.test(source), 'future package format remains explicitly pending');
  check('requires-w566-provenance', /inspectCityArtSourceCandidate/.test(source) && /manifest-provenance-intake-must-be-eligible-and-match-asset/.test(source), 'pipeline requires a matching W566 intake packet');
  check('requires-three-lods', /lod0/.test(source) && /lod1/.test(source) && /lod2/.test(source) && /lod-triangles-must-descend/.test(source), 'LOD declaration and descending triangle budget are required');
  check('requires-static-safe-collision', /simplified-static-mesh/.test(source) && /primitive-proxies/.test(source) && /collision-must-be-static-and-private-data-free/.test(source), 'collision is simplified, static and private-data-free');
  check('limits-animation', /MAX_CLIPS/.test(source) && /animation-must-not-autoplay-embed-audio-or-carry-user-data/.test(source), 'animation is bounded and cannot embed audio or user data');
  check('requires-ktx2-texture-inventory', /KTX2\/Basis Universal/.test(source) && /texture-path-must-be-local-ktx2/.test(source) && /texture-mips-required/.test(source), 'textures use local KTX2/Basis inventory with mips');
  check('requires-procedural-lite-fallback', /procedural-source-controlled/.test(source) && /binaryLoadBeforeProof/.test(source), 'Lite fallback remains procedural until proof');
  check('rejects-proxy-and-network-delivery', /pagesFunctionProxy/.test(source) && /sameOriginStaticOnly/.test(source) && /delivery-must-remain-static-local-and-unproven/.test(source), 'Pages Function proxy and remote delivery are rejected');
  check('no-loader-storage-or-network-api', !/(?:\bfetch\s*\(|SceneLoader|ImportMesh|AssetsManager|XMLHttpRequest|WebSocket|EventSource|localStorage|sessionStorage|indexedDB)\b/.test(source), 'pipeline validator has no loader, storage or network side effect');
  check('w566-register-is-still-empty', /EON_CITY_BINARY_ART_INTAKE_REGISTER = freeze\(\[\]\)/.test(provenance), 'provenance layer has no accepted binary candidate');
  check('w417-preflight-remains-required', /humanArtReview/.test(preflight) && /licenceReview/.test(preflight) && /SHA-256/.test(preflight), 'W417 remains the release preflight authority');
  check('current-suite-registers-test', /w567-city-binary-pipeline\.test\.mjs/.test(runner), 'W567 test is in current certification');
  const failed = checks.filter((entry) => !entry.pass);
  const report = Object.freeze({
    schema: 'eonapp.w567.city-binary-pipeline-gate.v1',
    wave: 'W567',
    status: failed.length ? 'fail' : 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    failures: Object.freeze(failed.map((entry) => entry.id)),
    limitations: Object.freeze([
      'W567 does not register a new final binary package; current W602–W604 GLBs remain local engineering candidates only.',
      'No package has legal, provenance, hash, LOD, collision, animation, visual, performance or edge-policy proof.',
      'The procedural/vector fallback remains available while W567 validates the future KTX2/manifest package shape.'
    ])
  });
  if (writeArtifact) {
    const directory = path.join(root, 'tmp');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'w567-city-binary-pipeline-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW567CityBinaryPipeline();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status !== 'pass') process.exitCode = 1;
}
