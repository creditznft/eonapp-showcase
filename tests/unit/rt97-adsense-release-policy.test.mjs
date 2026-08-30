import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { EON_ADSENSE_ACCOUNT_ACTIVATION_POLICY, EON_ADSENSE_SOURCE_POLICY } from '../../config/rt97-adsense-live-policy.mjs';
import { EON_GUIDE_ROUTES } from '../../config/eon-guide-catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

test('RT97 restricts ordinary AdSense display serving to reviewed guide surfaces', () => {
  assert.equal(EON_ADSENSE_SOURCE_POLICY.ordinaryDisplayScope, 'reviewed-public-guides-only');
  assert.equal(EON_ADSENSE_SOURCE_POLICY.appWorkSurfacesAllowed, false);
  assert.equal(EON_ADSENSE_SOURCE_POLICY.cityGameplayAllowed, false);
  assert.equal(EON_ADSENSE_SOURCE_POLICY.localAiWorkSurfaceAllowed, false);
  assert.equal(EON_ADSENSE_SOURCE_POLICY.byokWorkSurfaceAllowed, false);
  for (const row of EON_GUIDE_ROUTES) assert.match(read(row.file), /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-6759380023085970/);
  for (const file of ['index.html','local-ai.html','eoncity.html','workspace.html','forge.html','billing.html']) assert.doesNotMatch(read(file), /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/);
});

test('RT97 gives AdSense live activation a conservative low-interruption initial policy', () => {
  const auto = EON_ADSENSE_ACCOUNT_ACTIVATION_POLICY.recommendedInitialAutoAds;
  assert.equal(auto.autoAds, true);
  assert.equal(auto.inPageAds, true);
  assert.equal(auto.adIntents, false);
  assert.equal(auto.anchorAds, false);
  assert.equal(auto.vignetteAds, false);
  assert.equal(auto.sideRailAds, false);
  assert.ok(EON_ADSENSE_ACCOUNT_ACTIVATION_POLICY.requiredPageExclusions.includes('/eoncity'));
  assert.ok(EON_ADSENSE_ACCOUNT_ACTIVATION_POLICY.requiredPageExclusions.includes('/local-ai'));
  assert.ok(EON_ADSENSE_ACCOUNT_ACTIVATION_POLICY.requiredExcludedAreaSelectors.includes('.eon-guide-tool'));
  assert.ok(EON_ADSENSE_ACCOUNT_ACTIVATION_POLICY.requiredExcludedAreaSelectors.includes('.eon-guide-actions'));
});

test('RT97 guide interaction surfaces expose stable exclusion markers for AdSense preview configuration', () => {
  for (const row of EON_GUIDE_ROUTES.filter((row) => row.file !== 'guides/index.html')) {
    assert.match(read(row.file), /data-adsense-exclusion-area="eonbot-cta"/);
  }
  for (const row of EON_GUIDE_ROUTES.filter((row) => row.lifecycle.includes('utility'))) {
    assert.match(read(row.file), /data-adsense-exclusion-area="interactive-tool"/);
  }
});
