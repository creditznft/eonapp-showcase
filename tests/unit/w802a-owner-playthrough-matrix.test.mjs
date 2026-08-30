import test from 'node:test';
import assert from 'node:assert/strict';
import { getEonExpanseW802AOwnerPlaythroughCases, projectEonExpanseW802AOwnerPlaythrough } from '../../assets/js/city/w802/eon-expanse-w802a-owner-playthrough-matrix.js';

const digest = 'a'.repeat(64);

test('W802A defines an exact cross-product owner playthrough matrix', () => {
  const cases = getEonExpanseW802AOwnerPlaythroughCases();
  assert.equal(cases.length, 35);
  assert.equal(new Set(cases.map((entry) => entry.id)).size, cases.length);
  for (const group of ['Signal Frontier', 'Productive missions', 'My Frontier', 'Storm Sector', 'Creator Capture', 'Share', 'Living frontier', 'Browser matrix', 'Performance']) {
    assert.equal(cases.some((entry) => entry.group === group), true);
  }
});

test('W802A owner proof uses starter-entry wording for My Frontier', () => {
  const entry = getEonExpanseW802AOwnerPlaythroughCases().find((row) => row.id === 'frontier-unlock-plan');
  assert.match(entry.label, /Enter My Frontier from starter access/);
  assert.doesNotMatch(entry.label, /Unlock My Frontier/);
});

test('W802A rejects shaped, private or wrong-build evidence', () => {
  const state = projectEonExpanseW802AOwnerPlaythrough([
    { caseId: 'storm-gateway-entry', passed: true, proofId: 'proof-storm-gateway', buildDigest: 'b'.repeat(64), measuredAt: 1000, screenshotPath: '/private/path.png' },
    { caseId: 'unknown', passed: true, proofId: 'proof-unknown-case', buildDigest: digest, measuredAt: 1000 },
    { caseId: 'chrome-desktop', passed: true, proofId: '', buildDigest: digest, measuredAt: 1000 }
  ], { expectedBuildDigest: digest });
  assert.equal(state.passedCount, 0);
  assert.equal(state.complete, false);
  assert.equal(state.privateContentStored, false);
  assert.equal(state.rows.some((entry) => entry.screenshotPath), false);
});

test('W802A requires every exact case and never certifies or deploys automatically', () => {
  const evidence = getEonExpanseW802AOwnerPlaythroughCases().map((entry, index) => ({
    caseId: entry.id,
    passed: true,
    proofId: `owner-proof-${String(index).padStart(3, '0')}`,
    buildDigest: digest,
    measuredAt: 1000 + index
  }));
  const state = projectEonExpanseW802AOwnerPlaythrough(evidence, { expectedBuildDigest: digest });
  assert.equal(state.complete, true);
  assert.equal(state.passedCount, 35);
  assert.equal(state.automaticCertification, false);
  assert.equal(state.automaticDeployment, false);
});
