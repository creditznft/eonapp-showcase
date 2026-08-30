import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CITY_ART_BINARY_REQUIREMENTS,
  EON_CITY_ART_SOURCE_CANDIDATE_SCHEMA,
  EON_CITY_ART_SOURCE_REGISTER,
  EON_CITY_ART_SOURCE_REGISTER_SCHEMA,
  EON_CITY_BINARY_ART_INTAKE_REGISTER,
  getEonCityArtSourceRegisterTruth,
  inspectCityArtSourceCandidate,
  validateEonCityArtSourceRegister
} from '../../assets/js/city/eon-city-art-source-register.js';
import { inspectW566CityArtSourceRegister } from '../../scripts/w566-city-art-source-register-gate.mjs';

const safeOriginalCandidate = Object.freeze({
  schema: EON_CITY_ART_SOURCE_CANDIDATE_SCHEMA,
  sourceId: 'arrival-gate-original-intake',
  assetId: 'arrival-gate-exterior',
  sourceClass: 'eonapp-original',
  stage: 'intake-pending-human-rights-review',
  evidencePath: 'docs/city-art/arrival/arrival-gate-original-intake.md',
  rights: Object.freeze({
    rightsHolder: 'EONAPP Studio',
    licenceLabel: 'EONAPP controlled original work',
    attributionRequired: false,
    attributionText: '',
    commercialUseAllowed: true,
    derivativeOfThirdParty: false
  }),
  content: Object.freeze({
    kind: 'glb',
    generatedOriginDisclosed: true,
    containsUserData: false,
    networkSource: false,
    runtimePath: null,
    sha256: null
  })
});

test('W566 keeps fallback provenance while recording current local engineering candidates separately from final art approval', () => {
  const validation = validateEonCityArtSourceRegister();
  const truth = getEonCityArtSourceRegisterTruth();
  assert.equal(validation.ok, true, validation.errors.join(' | '));
  assert.equal(validation.schema, EON_CITY_ART_SOURCE_REGISTER_SCHEMA);
  assert.equal(EON_CITY_ART_SOURCE_REGISTER.length, 4);
  assert.equal(EON_CITY_BINARY_ART_INTAKE_REGISTER.length, 0);
  assert.ok(EON_CITY_ART_SOURCE_REGISTER.every((entry) => entry.binary === false && entry.loadable === false && entry.remoteNetwork === false && entry.containsUserData === false));
  assert.ok(validation.engineeringCandidateAssetCount >= 8);
  assert.equal(truth.proceduralFallbackRetained, true);
  assert.equal(truth.candidateBinaryArtPresent, true);
  assert.equal(truth.binaryLoadEnabled, true);
  assert.equal(truth.finalBinaryArtClaim, false);
  assert.equal(truth.edgePathPolicyProven, false);
  assert.ok(EON_CITY_ART_BINARY_REQUIREMENTS.some((entry) => /edge path policy/i.test(entry)));
});

test('W566 can inspect a bounded original intake packet without approving, storing, loading, or shipping it', () => {
  const inspection = inspectCityArtSourceCandidate(safeOriginalCandidate);
  assert.equal(inspection.intakeEligible, true, inspection.errors.join(' | '));
  assert.equal(inspection.approved, false);
  assert.equal(inspection.loadable, false);
  assert.equal(inspection.shipped, false);
  assert.equal(inspection.stored, false);
  assert.equal(inspection.networkRequestCreated, false);
  assert.equal(inspection.requiresW417Preflight, true);
  assert.equal(inspection.requiresDeviceProof, true);
});

test('W566 rejects remote evidence, sensitive fields, user data, runtime paths, hashes, non-planned assets, and pre-marked release state', () => {
  const unsafe = JSON.parse(JSON.stringify(safeOriginalCandidate));
  unsafe.evidencePath = 'https://art.example.invalid/intake.md';
  unsafe.assetId = 'missing-art';
  unsafe.prompt = 'private prompt must never enter art intake';
  unsafe.content.containsUserData = true;
  unsafe.content.networkSource = true;
  unsafe.content.runtimePath = '/assets/city/arrival.glb';
  unsafe.content.sha256 = 'a'.repeat(64);
  const inspection = inspectCityArtSourceCandidate(unsafe);
  assert.equal(inspection.intakeEligible, false);
  assert.ok(inspection.errors.includes('candidate-has-unknown-or-sensitive-fields'));
  assert.ok(inspection.errors.includes('candidate-evidence-must-be-local-doc-path'));
  assert.ok(inspection.errors.includes('candidate-asset-must-be-planned-catalog-entry'));
  assert.ok(inspection.errors.includes('candidate-must-not-contain-user-data'));
  assert.ok(inspection.errors.includes('candidate-must-not-use-network-source'));
  assert.ok(inspection.errors.includes('candidate-must-not-declare-runtime-path-or-hash-before-w417'));
});

test('W566 source gate stays fail-closed about provenance, licences, private data, and final art-release claims', () => {
  const report = inspectW566CityArtSourceRegister({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.ok(report.checkCount >= 14);
});
