import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

import { validateEonCityW694FinalCandidate, getEonCityW694Truth } from '../../assets/js/city/w694/eon-city-w694-final-candidate.js';

const readJson = (relative) => JSON.parse(fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8'));

test('W694 final local candidate validates without claiming browser or production proof', () => {
  const candidate = readJson('config/w694-final-local-candidate.json');
  const source = readJson('config/w694-source-reconciliation-manifest.json');
  const maintained = readJson('config/w624d-current-unit-test-manifest.json');
  const result = validateEonCityW694FinalCandidate(candidate, source, maintained);
  assert.equal(result.ok, true, result.errors.join(' | '));
  assert.ok(result.sourceFileCount > 4000);
  assert.equal(result.maintainedTestCount, maintained.testFiles.length);
  assert.equal(result.browserProof, 'pending');
  assert.equal(candidate.releaseBoundaries.productionReleaseAllowed, false);
});

test('W694 source reconciliation manifest hashes every listed file exactly', () => {
  const manifest = readJson('config/w694-source-reconciliation-manifest.json');
  assert.equal(manifest.sourceFileCount, manifest.files.length);
  assert.equal(manifest.gitDirectoryIncluded, false);
  assert.equal(manifest.nodeModulesIncluded, false);
  assert.equal(manifest.generatedBuildIncluded, false);
  const aggregate = crypto.createHash('sha256');
  for (const entry of manifest.files) {
    const body = fs.readFileSync(new URL(`../../${entry.path}`, import.meta.url));
    assert.equal(body.length, entry.bytes, entry.path);
    assert.equal(crypto.createHash('sha256').update(body).digest('hex'), entry.sha256, entry.path);
    aggregate.update(`${entry.path}\0${entry.bytes}\0${entry.sha256}\n`);
  }
  assert.equal(aggregate.digest('hex'), manifest.aggregateSha256);
});

test('W694 includes all final authorities and restored social preview assets', () => {
  const manifest = readJson('config/w694-source-reconciliation-manifest.json');
  const paths = new Set(manifest.files.map((entry) => entry.path));
  const required = [
    'assets/js/city/w671/eon-city-w671-owner-repair.js',
    'assets/js/city/w690/eon-city-w690-complete-core-identity.js',
    'assets/js/city/w691/eon-city-w691-realms-my-realm-integration.js',
    'assets/js/city/w692/eon-city-w692-experience-quality.js',
    'assets/js/city/w693/eon-city-w693-local-certification.js',
    'assets/js/city/w694/eon-city-w694-final-candidate.js',
    'config/w693-owner-recording-matrix.json',
    'assets/data/social-preview-manifest.json'
  ];
  for (const relative of required) assert.equal(paths.has(relative), true, relative);
  const social = [...paths].filter((entry) => /^assets\/media\/social\/eonapp-.*-social-v1\.png$/.test(entry));
  assert.equal(social.length, 12);
});

test('W694 truth keeps upload, deployment and visual score unclaimed', () => {
  const truth = getEonCityW694Truth();
  assert.equal(truth.exactSourceManifestRequired, true);
  assert.equal(truth.maintainedSuiteAlignmentRequired, true);
  assert.equal(truth.ownerRecordingMatrixRequired, true);
  assert.equal(truth.browserProofPendingBlocksProduction, true);
  assert.equal(truth.visualScoreNotClaimed, true);
  assert.equal(truth.githubUploadPerformed, false);
  assert.equal(truth.deploymentPerformed, false);
});
