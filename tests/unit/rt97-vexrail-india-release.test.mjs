import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { evaluateVexrailGeoPolicy, getVexrailConfig } from '../../functions/api/ai/vexrail.js';

const rootEnv = {
  EON_ENVIRONMENT: 'production',
  EON_VEXRAIL_ROLLOUT: 'production',
  EON_VEXRAIL_GEO_MODE: 'selected_countries',
  EON_VEXRAIL_COUNTRIES: 'US,CA,GB,DE,IN',
  EON_VEXRAIL_REQUIRE_CF_METADATA: 'true',
  EON_VEXRAIL_TURNSTILE_MODE: 'required',
  EON_VEXRAIL_TURNSTILE_SITE_KEY: 'site-key-test',
  EON_VEXRAIL_TURNSTILE_SECRET: 'secret-test',
  EON_VEXRAIL_TURNSTILE_HOSTNAMES: 'eonapp.ch',
  VEXRAIL_PUBLISHABLE_KEY: 'pk_test',
  VEXRAIL_SECRET_KEY: 'sk_test'
};

test('RT97 production Vexrail geo policy explicitly admits Cloudflare-observed India', () => {
  const config = getVexrailConfig(rootEnv);
  assert.equal(config.geoMode, 'selected_countries');
  assert.ok(config.countries.includes('IN'));
  const request = { cf: { country: 'IN' } };
  const geo = evaluateVexrailGeoPolicy(config, request, rootEnv);
  assert.deepEqual({ allowed: geo.allowed, country: geo.country, reason: geo.reason }, {
    allowed: true,
    country: 'IN',
    reason: 'selected_country'
  });
});

test('RT97 public and signed-in Vexrail status expose safe country eligibility proof and no credential values', () => {
  const publicSource = fs.readFileSync(new URL('../../functions/api/ai/vexrail.js', import.meta.url), 'utf8');
  const source = fs.readFileSync(new URL('../../functions/api/ai/vexrail-readiness.js', import.meta.url), 'utf8');
  assert.match(publicSource, /geoEligible:\s*eligibility\.geo\?\.allowed\s*===\s*true/);
  assert.match(publicSource, /geoReason:\s*eligibility\.geo\?\.reason/);
  assert.match(source, /evaluateVexrailGeoPolicy\(config, context\.request, context\.env\)/);
  assert.match(source, /observedCountry:\s*geo\.country/);
  assert.match(source, /geoEligible:\s*geo\.allowed\s*===\s*true/);
  assert.match(source, /geoReason:\s*geo\.reason/);
  assert.match(source, /geoMode:\s*config\.geoMode/);
  assert.doesNotMatch(source, /secretKey:\s*config\.secretKey/);
  assert.doesNotMatch(source, /publishableKey:\s*config\.publishableKey/);
});
