import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CITY_BINARY_PIPELINE_MANIFEST_SCHEMA,
  EON_CITY_BINARY_PIPELINE_MANIFESTS,
  EON_CITY_BINARY_PIPELINE_REQUIREMENTS,
  getEonCityBinaryPipelineTruth,
  validateEonCityBinaryPipelineManifest,
  validateEonCityBinaryPipelineRegister
} from '../../assets/js/city/eon-city-binary-pipeline.js';
import { EON_CITY_ART_SOURCE_CANDIDATE_SCHEMA } from '../../assets/js/city/eon-city-art-source-register.js';
import { inspectW567CityBinaryPipeline } from '../../scripts/w567-city-binary-pipeline-gate.mjs';

const candidate = Object.freeze({
  schema: EON_CITY_ART_SOURCE_CANDIDATE_SCHEMA,
  sourceId: 'arrival-gate-package-spec',
  assetId: 'arrival-gate-exterior',
  sourceClass: 'eonapp-original',
  stage: 'intake-pending-human-rights-review',
  evidencePath: 'docs/city-art/arrival/arrival-gate-package-spec.md',
  rights: Object.freeze({ rightsHolder: 'EONAPP Studio', licenceLabel: 'EONAPP controlled original work', attributionRequired: false, attributionText: '', commercialUseAllowed: true, derivativeOfThirdParty: false }),
  content: Object.freeze({ kind: 'glb', generatedOriginDisclosed: true, containsUserData: false, networkSource: false, runtimePath: null, sha256: null })
});

const safeManifest = Object.freeze({
  schema: EON_CITY_BINARY_PIPELINE_MANIFEST_SCHEMA,
  packageId: 'arrival-gate-package-spec',
  assetId: 'arrival-gate-exterior',
  stage: 'package-spec-pending-binary-evidence',
  binaryPresent: false,
  runtimeLoadEnabled: false,
  provenance: candidate,
  lod: Object.freeze({
    lod0: Object.freeze({ path: '/assets/city/arrival/arrival-gate-lod0.glb', compressedBytes: 4_000_000, triangles: 38_000, materials: 5, drawCalls: 48 }),
    lod1: Object.freeze({ path: '/assets/city/arrival/arrival-gate-lod1.glb', compressedBytes: 2_500_000, triangles: 20_000, materials: 3, drawCalls: 28 }),
    lod2: Object.freeze({ path: '/assets/city/arrival/arrival-gate-lod2.glb', compressedBytes: 1_200_000, triangles: 6_000, materials: 2, drawCalls: 12 })
  }),
  collision: Object.freeze({ mode: 'simplified-static-mesh', triangleCount: 2_000, containsUserData: false, dynamic: false }),
  animation: Object.freeze({ mode: 'none', clipCount: 0, autoplay: false, embeddedAudio: false, containsUserData: false }),
  textures: Object.freeze([
    Object.freeze({ id: 'arrival-gate-base', path: '/assets/city/arrival/arrival-gate-base.ktx2', format: 'KTX2/Basis Universal', width: 1024, height: 1024, compressedBytes: 2_000_000, mips: true })
  ]),
  fallback: Object.freeze({ mode: 'procedural-source-controlled', forceOnLite: true, binaryLoadBeforeProof: false }),
  delivery: Object.freeze({ sameOriginStaticOnly: true, remoteNetwork: false, pagesFunctionProxy: false, edgePathPolicyProven: false, privateBinaryDeclared: false })
});

test('W567 keeps the future package register empty while current local candidates remain unapproved for final release', () => {
  const report = validateEonCityBinaryPipelineRegister();
  const truth = getEonCityBinaryPipelineTruth();
  assert.equal(report.ok, true, report.errors.join(' | '));
  assert.equal(EON_CITY_BINARY_PIPELINE_MANIFESTS.length, 0);
  assert.equal(truth.binaryPackagePresent, false);
  assert.equal(truth.engineeringCandidateAssetsPresent, true);
  assert.equal(truth.binaryLoadEnabled, true);
  assert.equal(truth.finalBinaryArtClaim, false);
  assert.equal(truth.edgePathPolicyProven, false);
  assert.ok(EON_CITY_BINARY_PIPELINE_REQUIREMENTS.some((entry) => /three local GLB LOD/i.test(entry)));
});

test('W567 accepts a bounded prospective package specification without approving, loading, storing, or shipping it', () => {
  const result = validateEonCityBinaryPipelineManifest(safeManifest);
  assert.equal(result.specValid, true, result.errors.join(' | '));
  assert.equal(result.releaseEligible, false);
  assert.equal(result.binaryLoadEnabled, false);
  assert.equal(result.approved, false);
  assert.equal(result.shipped, false);
  assert.equal(result.stored, false);
  assert.equal(result.networkRequestCreated, false);
});

test('W567 rejects missing LODs, non-descending budgets, unsafe collision/animation, remote texture delivery, unsupported fields, and runtime claims', () => {
  const unsafe = JSON.parse(JSON.stringify(safeManifest));
  delete unsafe.lod.lod2;
  unsafe.lod.lod1.triangles = unsafe.lod.lod0.triangles;
  unsafe.collision.dynamic = true;
  unsafe.animation.embeddedAudio = true;
  unsafe.textures[0].path = 'https://art.example.invalid/arrival.ktx2';
  unsafe.runtimeAsset = 'private data';
  unsafe.binaryPresent = true;
  const result = validateEonCityBinaryPipelineManifest(unsafe);
  assert.equal(result.specValid, false);
  assert.ok(result.errors.includes('manifest-has-unknown-or-sensitive-fields'));
  assert.ok(result.errors.includes('manifest-cannot-claim-binary-or-runtime-load'));
  assert.ok(result.errors.includes('manifest-must-declare-exactly-three-lods'));
  assert.ok(result.errors.includes('lod-triangles-must-descend'));
  assert.ok(result.errors.includes('collision-must-be-static-and-private-data-free'));
  assert.ok(result.errors.includes('animation-must-not-autoplay-embed-audio-or-carry-user-data'));
  assert.ok(result.errors.includes('texture-path-must-be-local-ktx2'));
});

test('W567 source gate stays fail-closed about loaders, proxies, remote assets, private data, and final-art claims', () => {
  const report = inspectW567CityBinaryPipeline({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.ok(report.checkCount >= 15);
});
