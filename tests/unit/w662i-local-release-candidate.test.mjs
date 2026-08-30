import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const candidate = JSON.parse(fs.readFileSync(new URL('../../config/w662i-local-release-candidate.json', import.meta.url), 'utf8'));
const packageJson = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

test('W662I records every programme wave without fabricating release acceptance', () => {
  assert.deepEqual(Object.keys(candidate.programme), ['W662A','W662B','W662C','W662D','W662E','W662F','W662G','W662H','W662I']);
  assert.equal(candidate.authorization.localSourceCandidateReady, true);
  assert.equal(candidate.authorization.dependencyRestoredBuildRequired, false);
  assert.equal(candidate.authorization.immutablePreviewRequired, true);
  assert.equal(candidate.authorization.authenticatedBrowserMatrixRequired, true);
  assert.equal(candidate.authorization.ownerAcceptanceRequired, true);
  assert.equal(candidate.authorization.mergeAuthorized, false);
  assert.equal(candidate.authorization.previewAuthorized, false);
  assert.equal(candidate.authorization.productionAuthorized, false);
  assert.equal(candidate.authorization.ninePointFiveClaimAuthorized, false);
  assert.equal(candidate.verification.fullDependencySuite, 'pass-334-of-334-maintained-files');
  assert.ok(['pending-after-full-source-pass', 'pass-permanent-predeploy-smoke-site-audit'].includes(candidate.verification.productionBuild));
});

test('W662I keeps generated source-suite evidence under the post-suite gate instead of self-reading stale receipts', () => {
  assert.equal(candidate.verification.maintainedSourceSuite.maintainedFiles, 334);
  assert.equal(candidate.verification.maintainedSourceSuite.passedFiles, 334);
  assert.equal(candidate.verification.maintainedSourceSuite.dependencyBlockedFiles, 0);
  assert.equal(candidate.verification.maintainedSourceSuite.genuineFailedFiles, 0);
});

test('W662I gives the next operator one canonical local verification command', () => {
  assert.equal(packageJson.scripts['qa:w662-local-candidate'], 'npm run qa:w662-ledger && npm run qa:w662-controls && npm run qa:w662c-h-reconciliation && npm run qa:w662i-local-source-suite');
  assert.match(packageJson.scripts['qa:w662c-h-reconciliation'], /w662h-whole-app-reconciliation-gate/);
});
