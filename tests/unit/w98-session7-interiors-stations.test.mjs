import test from 'node:test';
import assert from 'node:assert/strict';
import { DISTRICTS } from '../../assets/js/realm3d/engine/BlockPalette.js';
import {
  SESSION7_INTERIOR_SCHEMA,
  SESSION7_STATION_SCHEMA,
  buildSession7InteriorCatalog,
  buildSession7InteriorEntryPortals,
  buildSession7InteriorTelemetry,
  validateSession7InteriorCatalog
} from '../../assets/js/realm3d/engine/EonCitySession7InteriorRuntime.js';

const catalog = buildSession7InteriorCatalog(DISTRICTS);

test('Session 7 catalog creates ten authored enterable landmark interiors', () => {
  assert.equal(catalog.length, 10);
  assert.equal(new Set(catalog.map((item) => item.id)).size, 10);
  assert.ok(catalog.every((item) => item.schema === SESSION7_INTERIOR_SCHEMA));
  assert.ok(catalog.every((item) => item.circulation.reliableExit));
  assert.ok(catalog.every((item) => item.exitPortal.kind === 'interior-exit'));
  assert.ok(catalog.every((item) => item.threshold.length === 2 && item.returnPoint.length === 2));
});

test('Session 7 exposes all required safe native station types', () => {
  const stations = catalog.flatMap((item) => item.stations);
  const types = new Set(stations.map((station) => station.type));
  for (const type of ['chat', 'code-maker', 'provider-health', 'rewards', 'marketplace-preview', 'vault-summary', 'realm-templates', 'trade-terminal', 'code-showcase', 'build-os', 'device-lab']) {
    assert.ok(types.has(type), `missing ${type}`);
  }
  assert.ok(stations.every((station) => station.schema === SESSION7_STATION_SCHEMA));
  assert.ok(stations.every((station) => station.route.startsWith('/')));
  assert.ok(stations.every((station) => station.iframe === false && station.externalEmbed === false));
});

test('Session 7 station policies redact secrets and owner-private context', () => {
  const stations = catalog.flatMap((item) => item.stations);
  assert.ok(stations.every((station) => station.audience === 'public-safe'));
  assert.ok(stations.every((station) => station.ownerPrivateContext === false));
  assert.ok(stations.every((station) => station.safety.noApiKeys));
  assert.ok(stations.every((station) => station.safety.noSeedPhrases));
  assert.ok(stations.every((station) => station.safety.noPrivateKeys));
  assert.ok(stations.every((station) => station.safety.noPaymentCredentials));
  assert.ok(stations.every((station) => station.safety.fullRouteOnlyAfterExplicitUserChoice));
});

test('Session 7 entry portals and telemetry preserve focus and privacy contracts', () => {
  const entries = buildSession7InteriorEntryPortals(catalog);
  const telemetry = buildSession7InteriorTelemetry({ catalog, cityEntries: entries.length });
  assert.equal(entries.length, 10);
  assert.ok(entries.every((entry) => entry.kind === 'interior-entry' && entry.secretSafe));
  assert.equal(telemetry.interiorCount, 10);
  assert.equal(telemetry.enterableCount, 10);
  assert.equal(telemetry.entryPortalCount, 10);
  assert.equal(telemetry.externalIframeCount, 0);
  assert.equal(telemetry.ownerPrivateCount, 0);
  assert.equal(telemetry.secretPatternDetected, false);
  assert.ok(Object.values(telemetry.focusPolicy).every(Boolean));
});

test('Session 7 catalog validator passes the complete contract', () => {
  const validation = validateSession7InteriorCatalog(catalog);
  assert.equal(validation.ok, true, validation.failures.join(', '));
  assert.ok(Object.values(validation.checks).every(Boolean));
});
