#!/usr/bin/env node
/** W566/W611 source gate — provenance register plus bounded local candidate-art truth. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_ART_SOURCE_REGISTER,
  EON_CITY_BINARY_ART_INTAKE_REGISTER,
  getEonCityArtSourceRegisterTruth,
  validateEonCityArtSourceRegister
} from '../assets/js/city/eon-city-art-source-register.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const required = Object.freeze([
  'assets/js/city/eon-city-art-source-register.js',
  'assets/js/city/eon-city-asset-catalog.js',
  'assets/js/city/eon-city-art-intake.js',
  'assets/js/city/eon-city-asset-release-preflight.js',
  'assets/js/city/eon-city-play-art-direction.js',
  'tests/unit/w566-city-art-source-register.test.mjs',
  'scripts/run-current-unit-suite.mjs'
]);

export function inspectW566CityArtSourceRegister({ writeArtifact = true } = {}) {
  const checks = [];
  const check = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const source = read('assets/js/city/eon-city-art-source-register.js');
  const intake = read('assets/js/city/eon-city-art-intake.js');
  const preflight = read('assets/js/city/eon-city-asset-release-preflight.js');
  const runner = read('scripts/run-current-unit-suite.mjs');
  const validation = validateEonCityArtSourceRegister();
  const truth = getEonCityArtSourceRegisterTruth();
  check('required-files-exist', required.every((relative) => existsSync(path.join(root, relative))), 'register, source contracts, tests and current-suite registration files exist');
  check('source-register-valid', validation.ok === true && validation.currentProceduralSourceCount === 4 && validation.binaryIntakeCount === 0 && validation.engineeringCandidateAssetCount >= 8, 'fallback ledger remains valid and current local candidates are catalogued separately');
  check('register-entries-stay-local', EON_CITY_ART_SOURCE_REGISTER.every((entry) => entry.binary === false && entry.loadable === false && entry.remoteNetwork === false && entry.containsUserData === false), 'procedural fallback sources stay source-only and local');
  check('binary-intake-queue-empty', Array.isArray(EON_CITY_BINARY_ART_INTAKE_REGISTER) && EON_CITY_BINARY_ART_INTAKE_REGISTER.length === 0, 'no unreviewed binary asset is accepted through the future-intake queue');
  check('truth-is-candidate-not-final', truth.sourceOnly === true && truth.candidateBinaryArtPresent === true && truth.binaryLoadEnabled === true && truth.finalBinaryArtClaim === false && truth.edgePathPolicyProven === false && truth.deviceVisualProofCaptured === false, 'current candidate binaries remain unapproved for final art release');
  check('candidate-is-intake-only', /intakeEligible/.test(source) && /approved:\s*false/.test(source) && /loadable:\s*false/.test(source) && /shipped:\s*false/.test(source) && /stored:\s*false/.test(source), 'future candidate inspection cannot create approval, loading, shipping or persistence');
  check('candidate-rejects-sensitive-fields', /candidate-has-unknown-or-sensitive-fields/.test(source) && /candidate-must-not-contain-user-data/.test(source) && /candidate-must-not-use-network-source/.test(source), 'candidate boundary rejects private data and unknown input');
  check('candidate-requires-local-evidence', /SAFE_LOCAL_EVIDENCE/.test(source) && /candidate-evidence-must-be-local-doc-path/.test(source), 'future evidence must be a local reviewed record rather than a remote URL');
  check('provenance-classes-explicit', /eonapp-original/.test(source) && /commissioned-original/.test(source) && /reviewed-commercial-licence/.test(source), 'future origin classes are explicit');
  check('commercial-licence-is-not-auto-releasable', /currentW417OriginalWorkPolicyCompatible/.test(source) && /reviewed-commercial-licence/.test(source), 'commercial licence intake cannot silently bypass current original-work preflight policy');
  check('current-art-intake-is-visually-pending', /engineering-candidate/.test(intake) && /ownerVisualApproval/.test(intake) && /KTX2\/Basis Universal pending final package/.test(intake), 'W406B candidate intake retains visual and packaging holdbacks');
  check('existing-preflight-remains-required', /humanArtReview/.test(preflight) && /licenceReview/.test(preflight) && /SHA-256/.test(preflight) && /KTX2\/Basis Universal/.test(preflight), 'W417 final release preflight remains responsible for review evidence');
  check('no-runtime-or-storage-api', !/(?:\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|Notification\.requestPermission|PushManager)\b/.test(source), 'register has no delivery, storage or browser permission side effect');
  check('current-suite-registers-test', /w566-city-art-source-register\.test\.mjs/.test(runner), 'W566 test is in the current certification suite');
  const failed = checks.filter((entry) => !entry.pass);
  const report = Object.freeze({
    schema: 'eonapp.w566.city-art-source-register-gate.v2',
    wave: 'W566',
    status: failed.length ? 'fail' : 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    failures: Object.freeze(failed.map((entry) => entry.id)),
    limitations: Object.freeze([
      'Current GLBs are local engineering candidates; no final visual certification, licence clearance, owner approval or device-performance proof is claimed.',
      'No legal clearance, final art review, Cloudflare edge policy, authenticated City proof or real device visual evidence is created by this source gate.',
      'The procedural/vector fallback remains available for Lite or asset-load failure.'
    ])
  });
  if (writeArtifact) {
    const directory = path.join(root, 'tmp');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'w566-city-art-source-register-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW566CityArtSourceRegister();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status !== 'pass') process.exitCode = 1;
}
