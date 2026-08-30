import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workflow = fs.readFileSync(new URL('../../.github/workflows/rt97-production-release.yml', import.meta.url), 'utf8');
const ci = fs.readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
const request = JSON.parse(fs.readFileSync(new URL('../../.github/rt97-production-request.json', import.meta.url), 'utf8'));

test('RT97 has an exact-source protected release lane separate from historical RT92', () => {
  assert.match(workflow, /name: RT97 Exact Production Release/);
  assert.match(workflow, /branches: \[release\/rt97-production\]/);
  assert.match(workflow, /SOURCE_BRANCH: codex\/rt97-release-candidate-2026-08-30/);
  assert.match(workflow, /REQUEST=\.github\/rt97-production-request\.json/);
  assert.match(workflow, /npm run verify:codex-predeploy/);
  assert.match(workflow, /npm run verify:rt97-release/);
  assert.match(workflow, /Promote identical staged bytes to Production/);
  assert.match(workflow, /Roll back Production after failed post-deploy proof/);
  assert.equal(request.schema, 'eonapp.rt97.production-request.v1');
});

test('RT97 protected workflow blocks unless Cloudflare Production really includes India and hard geo controls', () => {
  assert.match(workflow, /prod_value EON_VEXRAIL_GEO_MODE/);
  assert.match(workflow, /COUNTRIES="\$\(prod_value EON_VEXRAIL_COUNTRIES\)"/);
  assert.match(workflow, /grep -Eq ',IN,'/);
  assert.match(workflow, /prod_value EON_VEXRAIL_REQUIRE_CF_METADATA/);
  assert.match(workflow, /prod_value EON_VEXRAIL_TURNSTILE_MODE/);
});

test('RT97 production proof matches current monetization/trust/AdSense authority', () => {
  assert.match(workflow, /schema_version.*4.*trust-schema\.json/s);
  assert.match(workflow, /ordinaryAdsAllowed.*= false/);
  assert.match(workflow, /display\.provider.*= none/);
  assert.match(workflow, /rewarded\.rewardClass.*bounded-sponsor-unlock/);
  assert.match(workflow, /rewarded\.permanentValueAllowed.*= false/);
  assert.match(workflow, /google\.com, pub-6759380023085970, DIRECT, f08c47fec0942fa0/);
  assert.match(workflow, /data-adsense-exclusion-area/);
});

test('CI runs the RT97 gate on the intended candidate branch', () => {
  assert.match(ci, /codex\/rt97-release-candidate-2026-08-30/);
  assert.match(ci, /rt97-release-policy:/);
  assert.match(ci, /npm run verify:rt97-release/);
  assert.match(ci, /needs: \[rt92-monetization-policy, rt97-release-policy, permanent-predeploy, legacy-boundary\]/);
});
