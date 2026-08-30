import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const access = fs.readFileSync(new URL('../../assets/js/city/eon-city-access-station.js', import.meta.url), 'utf8');

test('City loading UI checks saved art first and distinguishes browser reuse from new transfer', () => {
  assert.match(access, /Checking saved City art · preparing Command Hub/);
  assert.match(access, /Restoring essential content-hashed City art from saved browser storage/);
  assert.match(access, /Receiving new or uncached content-hashed City art directly from EONAPP/);
  assert.match(access, /saved art · .*saved runtime files · restoring local City state/);
  assert.match(access, /First visit · preparing critical City runtime and 3D art/);
});

test('cache inspection remains non-blocking and does not invent a download when cache state is unknown', () => {
  assert.match(access, /inspectAuthorizedCityCache\(\{ timeoutMs = 900/);
  assert.match(access, /Cache check skipped · direct loading available/);
  assert.doesNotMatch(access, /Downloading all City assets/);
});

test('RT92 warm cached entry is explicitly presented as a restore, not a full preparation/download', () => {
  assert.match(access, /warmCachedCity/);
  assert.match(access, /Restoring your EON City Command Hub/);
  assert.match(access, /warm-cache-restore/);
});
