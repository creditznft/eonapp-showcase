import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

import { validateEonAppW700FinalPolishedCandidate, getEonAppW700FinalPolishedCandidateTruth } from '../../assets/js/city/w700/eonapp-w700-final-polished-candidate.js';

const readJson = (relative) => JSON.parse(fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8'));

test('W700 final polished candidate validates without claiming browser or production proof', () => {
  const candidate = readJson('config/w700-final-polished-local-candidate.json');
  const source = readJson('config/w700-source-reconciliation-manifest.json');
  const maintained = readJson('config/w624d-current-unit-test-manifest.json');
  const owner = readJson('config/w700-owner-recording-matrix.json');
  const result = validateEonAppW700FinalPolishedCandidate(candidate, source, maintained, owner);
  assert.equal(result.ok, true, result.errors.join(' | '));
  assert.ok(result.sourceFileCount > 4600);
  assert.equal(result.maintainedTestCount, maintained.testFiles.length);
  assert.ok(result.ownerRecordingCount >= 20);
  assert.equal(result.browserProof, 'pending');
  assert.equal(candidate.releaseBoundaries.productionReleaseAllowed, false);
});

test('W700 source reconciliation hashes every current candidate file exactly', () => {
  const manifest = readJson('config/w700-source-reconciliation-manifest.json');
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

test('W700 manifest includes all final-polish authorities, W694 archive and social cards', () => {
  const manifest = readJson('config/w700-source-reconciliation-manifest.json');
  const paths = new Set(manifest.files.map((entry) => entry.path));
  const required = [
    'assets/js/city/w695/eon-city-w695-character-motion-truth.js',
    'assets/js/city/w696/eon-city-w696-interaction-boundary-hud.js',
    'assets/js/city/w697/eon-city-w697-district-visual-identity.js',
    'assets/js/city/w698/eon-city-w698-expanse-open-world-presentation.js',
    'assets/js/nexus/w699/eon-nexus-w699-command-clarity.js',
    'assets/js/nexus/w700/eonapp-w700-signature-flow.js',
    'assets/js/city/w700/eonapp-w700-final-polished-candidate.js',
    'config/w700-owner-recording-matrix.json',
    'archive/w700-superseded-w694-exact-candidate/tests/unit/w694-final-local-candidate.archived.mjs'
  ];
  for (const relative of required) assert.equal(paths.has(relative), true, relative);
  const social = [...paths].filter((entry) => /^assets\/media\/social\/eonapp-.*-social-v1\.png$/.test(entry));
  assert.equal(social.length, 12);
});

test('W700 owner matrix retains browser evidence as the release authority', () => {
  const matrix = readJson('config/w700-owner-recording-matrix.json');
  assert.ok(matrix.recordings.length >= 20);
  assert.ok(matrix.recordings.every((entry) => entry.status === 'pending'));
  for (const id of ['desktop-character-axis', 'desktop-hud', 'desktop-district-belts', 'desktop-expanse-diversity', 'desktop-signature-flow']) {
    assert.equal(matrix.recordings.some((entry) => entry.id === id), true, id);
  }
  assert.equal(matrix.rules.noVisualScoreWithoutRecordings, true);
  assert.equal(matrix.rules.exactFrozenCandidateOnly, true);
});

test('W700 truth preserves the no-upload, no-deploy and no-score boundary', () => {
  const truth = getEonAppW700FinalPolishedCandidateTruth();
  assert.equal(truth.w694BaselinePreserved, true);
  assert.equal(truth.exactW700SourceManifestRequired, true);
  assert.equal(truth.headedBrowserStillRequired, true);
  assert.equal(truth.ownerDeviceStillRequired, true);
  assert.equal(truth.ninePointFiveScoreNotClaimed, true);
  assert.equal(truth.githubUploadPerformed, false);
  assert.equal(truth.deploymentPerformed, false);
  assert.equal(truth.productionReleaseAllowed, false);
});
