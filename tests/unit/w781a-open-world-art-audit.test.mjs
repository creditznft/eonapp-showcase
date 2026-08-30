import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { auditEonExpanseW781AOpenWorldArt } from '../../assets/js/city/w781/eon-expanse-w781a-open-world-art-audit.js';

const renderer = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766i-open-world-renderer.js', import.meta.url), 'utf8');

test('W781A marks procedural interactive buildings and ambient bodies as development proxies', () => {
  assert.match(renderer, /presentationTruth: 'development-proxy'/);
  assert.match(renderer, /presentationTruth: 'ambient-development-proxy'/);
  assert.match(renderer, /releaseReady: false, finishedHeroArt: false/);
  assert.match(renderer, /releaseReady: false, finishedCharacterArt: false/);
});

test('W781A preserves primitive interaction targets and distant silhouettes as bounded exceptions', () => {
  assert.match(renderer, /presentationTruth: 'interaction-target-only'/);
  assert.match(renderer, /presentationTruth: 'distant-silhouette'/);
  const audit = auditEonExpanseW781AOpenWorldArt({ interactionPrimitiveCount: 4, distantSilhouetteCount: 9, futureRegionReleaseArtReady: true });
  assert.equal(audit.releaseReady, true);
  assert.equal(audit.allowedPrimitiveCount, 13);
});

test('W781A blocks release certification while development proxies remain', () => {
  const audit = auditEonExpanseW781AOpenWorldArt({ developmentBuildingProxyCount: 12, ambientDevelopmentProxyCount: 4, interactionPrimitiveCount: 3, distantSilhouetteCount: 8, futureRegionReleaseArtReady: false });
  assert.equal(audit.releaseReady, false);
  assert.equal(audit.blockingProxyCount, 16);
  assert.equal(audit.blockers.length, 2);
  assert.equal(audit.certificationStatus, 'development-proxy-replacement-required');
});

test('W781A audit is diagnostic only and never certifies automatically', () => {
  const audit = auditEonExpanseW781AOpenWorldArt({});
  assert.equal(audit.automaticCertification, false);
  assert.equal(audit.mutatesRenderer, false);
  assert.equal(audit.grantsXp, false);
  assert.equal(audit.privateContentStored, false);
});
