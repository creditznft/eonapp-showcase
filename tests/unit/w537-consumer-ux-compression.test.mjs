import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { W537_CONSUMER_UX_COMPRESSION_CONTRACT } from '../../config/w537-consumer-ux-compression-contract.mjs';
import { inspectW537ConsumerUxCompression } from '../../scripts/w537-consumer-ux-compression-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

test('W537 turns Profile into a selected-panel settings surface with mobile accordion controls', () => {
  const profile = read('profile.html');
  const profileJs = read('assets/js/profile-page.js');
  assert.equal(W537_CONSUMER_UX_COMPRESSION_CONTRACT.profile.selectedPanelDesktop, true);
  assert.equal(W537_CONSUMER_UX_COMPRESSION_CONTRACT.profile.mobileAccordion, true);
  for (const section of W537_CONSUMER_UX_COMPRESSION_CONTRACT.profile.sections) {
    assert.match(profile, new RegExp(`data-preference-section="${section}"`));
  }
  assert.match(profile, /Learn why backup stays separate/);
  assert.match(profileJs, /function setActivePreferencePanel/);
  assert.match(profileJs, /window\.matchMedia\('\(min-width: 961px\)'\)\.matches/);
});

test('W537 keeps Capsule defaulted to primary recovery actions while collapsing Drive and advanced detail', () => {
  const capsule = read('capsule.html');
  const capsuleCss = read('assets/css/eon-vault-v2.css');
  assert.match(capsule, /Create one encrypted Capsule/);
  assert.match(capsule, /Restore a Capsule/);
  assert.match(capsule, /Google Drive backup/);
  assert.match(capsule, /Optional, separate consent, and collapsed by default\./);
  assert.match(capsule, /Advanced recovery/);
  assert.match(capsule, /Inspect-first restore rules/);
  assert.match(capsuleCss, /\.eon-capsule-primary-grid/);
  assert.match(capsuleCss, /\.eon-capsule-disclosure/);
});

test('W537 source gate passes and keeps the wave source-only', () => {
  const result = inspectW537ConsumerUxCompression({ root: ROOT });
  assert.equal(result.ok, true);
  assert.equal(result.sourceOnly, true);
  assert.equal(result.browserEvidence, 'not-proven');
});
