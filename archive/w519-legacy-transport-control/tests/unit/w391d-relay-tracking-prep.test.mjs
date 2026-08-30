import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { inspectW391DRelayTrackingPrep } from '../../scripts/w391d-relay-tracking-prep-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

test('W391D keeps Relay tracking separate from legacy referral bindings and grants', () => {
  const helper = read('functions/_shared/eon-relay.js');
  const claim = read('functions/api/relay/claim.js');
  assert.match(helper, /EON_RELAY_DB/);
  assert.doesNotMatch(helper, /EONAPP_REFERRALS_DB|REFERRALS_DB/);
  assert.match(claim, /grantCreated:\s*false/);
});

test('W391D source gate passes with no live relay activation', () => {
  const report = inspectW391DRelayTrackingPrep({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.match(report.limitations.join(' '), /No invite link/i);
});
