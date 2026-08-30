import test from 'node:test';
import assert from 'node:assert/strict';
import { projectEonExpanseW801AExternalCertification } from '../../assets/js/city/w801/eon-expanse-w801a-external-certification-gates.js';

test('W801A keeps unavailable external evidence blocked without fabricating certification', () => {
  const state = projectEonExpanseW801AExternalCertification({
    sourceProgrammeComplete: true,
    dependencyInstall: { passed: false, reason: 'ws@7.5.11 unavailable' },
    productionBuild: { passed: false, reason: 'esbuild unavailable' },
    builtArtifact: { passed: false, reason: 'postcss unavailable' },
    authenticatedBrowsers: { passed: false, reason: 'no authenticated owner session' }
  });
  assert.equal(state.sourceProgrammeComplete, true);
  assert.equal(state.complete, false);
  assert.equal(state.passedCount, 0);
  assert.equal(state.status, 'external-certification-blocked');
  assert.equal(state.automaticCertification, false);
  assert.equal(state.automaticDeployment, false);
  assert.equal(state.productionActivated, false);
});

test('W801A enforces build, browser, owner and deployment ordering', () => {
  const state = projectEonExpanseW801AExternalCertification({
    dependencyInstall: { passed: true },
    productionBuild: { passed: true },
    builtArtifact: { passed: true },
    authenticatedBrowsers: { passed: false },
    foregroundPerformance: { passed: true },
    ownerCertification: { passed: true },
    previewDeployment: { passed: true },
    productionDeployment: { passed: true }
  });
  assert.equal(state.gates.find((entry) => entry.id === 'foreground-performance-and-soak').passed, false);
  assert.equal(state.gates.find((entry) => entry.id === 'owner-playthrough-and-region-certification').passed, false);
  assert.equal(state.gates.find((entry) => entry.id === 'preview-deployment-and-rollback').passed, false);
  assert.equal(state.gates.find((entry) => entry.id === 'production-deployment-and-rollback-proof').passed, false);
});

test('W801A reports complete evidence without activating Production automatically', () => {
  const passed = { passed: true };
  const state = projectEonExpanseW801AExternalCertification({
    sourceProgrammeComplete: true,
    dependencyInstall: passed,
    productionBuild: passed,
    builtArtifact: passed,
    authenticatedBrowsers: passed,
    foregroundPerformance: passed,
    ownerCertification: passed,
    previewDeployment: passed,
    productionDeployment: passed,
    privatePrompt: 'must be stripped'
  });
  assert.equal(state.complete, true);
  assert.equal(state.passedCount, 8);
  assert.equal(state.productionActivated, false);
  assert.equal(state.privatePrompt, undefined);
  assert.equal(state.privateContentStored, false);
});
