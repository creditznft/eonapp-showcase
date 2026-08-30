import assert from 'node:assert/strict';
import test from 'node:test';
import { createDevRouteRewrites, getRouteRow } from '../../config/route-contract.mjs';
import { W360_EON_CITY_PORTAL_ROUTE_CONTRACT, validateW360EonCityPortalRouteContract } from '../../config/w360-eon-city-portal-route-contract.mjs';
import { inspectW360EonCityPortalRoute } from '../../scripts/w360-eon-city-portal-route-gate.mjs';

test('W360 records retirement of the City Portal while preserving route compatibility', () => {
  assert.deepEqual(validateW360EonCityPortalRouteContract(), []);
  assert.equal(W360_EON_CITY_PORTAL_ROUTE_CONTRACT.status, 'superseded-by-w392-direct-city-entry');
  assert.equal(W360_EON_CITY_PORTAL_ROUTE_CONTRACT.architecture.portal.status, 'retired-compatibility-source');
  assert.equal(W360_EON_CITY_PORTAL_ROUTE_CONTRACT.architecture.compatibility3d.canonicalRoute, '/eoncity/tour');
  const rewrites = createDevRouteRewrites();
  for (const [route, file] of [['/eoncity', 'eoncity.html'], ['/eoncity/lite', 'eoncity-lite.html'], ['/eoncity/tour', 'eoncity-3d.html'], ['/eoncity/3d', 'eoncity-3d.html'], ['/eoncity/play', 'eoncity-play.html']]) {
    assert.equal(getRouteRow(route)?.file, file);
    assert.equal(rewrites.get(route), `/${file}`);
  }
});

test('W360 retired portal source gate is green without treating a source gate as production proof', () => {
  const report = inspectW360EonCityPortalRoute();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 16);
  assert.match(report.limitations.join(' '), /static source verification only/i);
  assert.match(report.limitations.join(' '), /No live Cloudflare request/i);
});
