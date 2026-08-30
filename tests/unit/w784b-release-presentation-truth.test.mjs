import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { auditEonExpanseW781AOpenWorldArt } from '../../assets/js/city/w781/eon-expanse-w781a-open-world-art-audit.js';

const overlay = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');

test('W784B distinguishes hidden unresolved proxies from proxies still visible to users', () => {
  const audit = auditEonExpanseW781AOpenWorldArt({
    developmentBuildingProxyCount: 12,
    ambientDevelopmentProxyCount: 4,
    visibleDevelopmentProxyCount: 0,
    releasePresentationHidesDevelopmentProxies: true,
    futureRegionReleaseArtReady: false
  });
  assert.equal(audit.blockingProxyCount, 16);
  assert.equal(audit.visibleDevelopmentProxyCount, 0);
  assert.equal(audit.releasePresentationSafe, true);
  assert.equal(audit.releaseReady, false);
});

test('W784B fails release-presentation safety if even one development proxy is visible', () => {
  const audit = auditEonExpanseW781AOpenWorldArt({ visibleDevelopmentProxyCount: 1, releasePresentationHidesDevelopmentProxies: true });
  assert.equal(audit.releasePresentationSafe, false);
});

test('W784B tells the mission board both unresolved and visible development counts', () => {
  assert.match(overlay, /deterministic development proxies still require authored replacement/);
  assert.match(overlay, /visibleDevelopmentProxyCount/);
  assert.match(overlay, /remain visible in release presentation/);
});
