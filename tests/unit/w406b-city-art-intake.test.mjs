import assert from 'node:assert/strict';
import test from 'node:test';
import { getCityAssetById, isCityAssetLoadable } from '../../assets/js/city/eon-city-asset-catalog.js';
import {
  EON_CITY_ART_INTAKE,
  EON_CITY_ART_INTAKE_SCHEMA,
  EON_CITY_ART_PIPELINE_POLICY,
  EON_CITY_CANONICAL_PUBLIC_ENGINE,
  getCityArtIntakeFirstFramePlan,
  getCityArtIntakeSummary,
  validateCityArtIntake
} from '../../assets/js/city/eon-city-art-intake.js';
import { inspectW406BCityArtIntake } from '../../scripts/w406b-city-art-intake-gate.mjs';

test('W406B maps current first-frame art to local engineering candidates or planned local fallbacks', () => {
  const result = validateCityArtIntake();
  assert.equal(result.ok, true, result.errors.join(' | '));
  assert.equal(result.schema, EON_CITY_ART_INTAKE_SCHEMA);
  assert.equal(EON_CITY_ART_PIPELINE_POLICY.publicEngine, EON_CITY_CANONICAL_PUBLIC_ENGINE);
  assert.equal(EON_CITY_ART_PIPELINE_POLICY.localEngineeringCandidatesAllowed, true);
  assert.equal(EON_CITY_ART_PIPELINE_POLICY.finalVisualReleaseApproved, false);

  const candidateEntries = EON_CITY_ART_INTAKE.filter((entry) => entry.intake.loadable);
  const plannedEntries = EON_CITY_ART_INTAKE.filter((entry) => !entry.intake.loadable);
  assert.equal(candidateEntries.length, 5);
  assert.equal(plannedEntries.length, 3);
  assert.ok(candidateEntries.every((entry) => {
    const asset = getCityAssetById(entry.assetId);
    return asset && asset.status === 'shipped' && isCityAssetLoadable(asset) && entry.intake.status === 'engineering-candidate' && entry.intake.ownerVisualApproval === 'pending';
  }));
  assert.ok(plannedEntries.every((entry) => {
    const asset = getCityAssetById(entry.assetId);
    return asset && asset.status === 'planned' && !isCityAssetLoadable(asset) && entry.intake.status === 'planned' && entry.intake.loadable === false;
  }));
});

test('W406B keeps a bounded Babylon first-frame plan with Lite fallback and candidate load selection', () => {
  const lite = getCityArtIntakeFirstFramePlan({ quality: 'lite' });
  const balanced = getCityArtIntakeFirstFramePlan({ quality: 'balanced' });
  const cinematic = getCityArtIntakeFirstFramePlan({ quality: 'cinematic' });
  assert.equal(lite.publicEngine, 'babylon-eoncity');
  assert.equal(lite.entries.length, 3);
  assert.equal(balanced.entries.length, 5);
  assert.equal(cinematic.entries.length, 6);
  assert.ok(lite.entries.every((entry) => entry.loadable === true && entry.sourcePath?.startsWith('/assets/city/')));
  assert.deepEqual(balanced.entries.map((entry) => entry.assetId), ['command-horizon-arrival-gate', 'command-horizon-command-deck', 'command-horizon-wayfinding', 'eonbot-companion', 'operator-hero']);
  assert.equal(cinematic.entries.at(-1).assetId, 'creator-atrium-exterior');
  assert.equal(cinematic.entries.at(-1).loadable, false);
  assert.equal(cinematic.entries.at(-1).fallback.mode, 'procedural-source-controlled');
});

test('W406B summary remains a local engineering-candidate record, never final visual release approval', () => {
  const summary = getCityArtIntakeSummary({ quality: 'balanced' });
  assert.equal(summary.valid, true);
  assert.ok(summary.shippedBinaryCount >= 8);
  assert.equal(summary.loadableCount, 5);
  assert.equal(summary.engineeringCandidateCount, 5);
  assert.equal(summary.plannedCount, 3);
  assert.equal(summary.releaseReady, false);
  assert.equal(summary.humanArtProofCaptured, false);
  assert.equal(summary.visualCertificationCaptured, false);
  assert.equal(summary.ownerVisualApprovalCaptured, false);
  assert.equal(summary.remoteNetwork, false);
});

test('W406B rejects unknown, remotely described or duplicate-priority intake entries', () => {
  const invalid = JSON.parse(JSON.stringify(EON_CITY_ART_INTAKE));
  invalid[0].assetId = 'unknown-city-binary';
  invalid[0].texture.remoteUrl = 'https://example.invalid/texture.ktx2';
  invalid[1].firstFramePriority = invalid[0].firstFramePriority;
  const result = validateCityArtIntake(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((message) => /absent from the City asset catalog|forbidden network value|Duplicate first-frame priority/i.test(message)));
});

test('W406B source gate stays provenance-first and source-only', () => {
  const report = inspectW406BCityArtIntake({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.ok(report.checkCount >= 12);
});
