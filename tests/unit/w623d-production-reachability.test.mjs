import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  W623D_ARCHITECTURE_RULES,
  W623D_REQUIRED_REACHABLE_PATHS,
  isW623DQuarantinedPath,
  validateW623DReachability
} from '../../config/w623d-production-reachability-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const reportPath = path.join(ROOT, 'reports/w623d-production-reachability/graph.json');
const generated = spawnSync(process.execPath, ['scripts/w623d-production-reachability-gate.mjs'], { cwd: ROOT, encoding: 'utf8' });
assert.equal(generated.status, 0, `${generated.stdout || ''}
${generated.stderr || ''}`);
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

test('W623D reachability report is green and canonical rails are reachable', () => {
  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
  const result = validateW623DReachability({ reachable: report.reachable });
  assert.equal(result.ok, true, result.errors.join('\n'));
  for (const required of W623D_REQUIRED_REACHABLE_PATHS) assert.ok(report.reachable.includes(required), required);
});

test('W623D quarantined value-system modules cannot enter the production graph', () => {
  assert.equal(report.quarantine.reachable.length, 0);
  assert.equal(report.reachable.some(isW623DQuarantinedPath), false);
  assert.ok(report.quarantine.sourcePresentButUnreachable.includes('assets/js/utils/nft-visuals.js'));
  assert.ok(report.quarantine.sourcePresentButUnreachable.includes('assets/js/commerce/official-commerce-foundation.js'));
});

test('Market uses neutral Vault Reveal visuals and canonical subscription truth', () => {
  const page = read('assets/js/market/eon-market-page.js');
  const drop = read('assets/js/market/market-private-drop.js');
  assert.match(page, /eon-commercial-catalog\.js/);
  assert.doesNotMatch(page, /official-commerce-foundation/);
  assert.match(drop, /eon-vault-reveal-visuals\.js/);
  assert.doesNotMatch(drop, /utils\/nft-visuals|market-starter-nfts/);
  assert.match(drop, /eon:vault-reveals:generated:v1/);
});

test('Browser referrals cannot grant value and server-ledger EONKEYS remain canonical', () => {
  const referral = read('assets/js/utils/referral-par.js');
  const workspace = read('assets/js/eon-workspace-pages.js');
  const referralRuntime = read('assets/js/referrals/eon-referral-server-runtime.js');
  const keyCatalog = read('assets/js/referrals/eon-keys-catalog.js');
  assert.match(referral, /server referral ledger/i);
  assert.match(referral, /server_ledger_required_for_eonkeys/);
  assert.match(workspace, /Referral milestones remain server-ledger controlled/);
  assert.match(referralRuntime, /The browser cannot grant, consume, revoke, or forge EONKEYS/);
  assert.match(referralRuntime, /rewardedSponsorKeysOutsideReferral: true/);
  assert.match(keyCatalog, /EON_KEYS_REFERRAL_POLICY/);
  assert.doesNotMatch(workspace, /eon-referral-reentry-firewall/);
  assert.equal(W623D_ARCHITECTURE_RULES.referralRewardRail, 'server-ledger-eonkeys-only');
  assert.equal(W623D_ARCHITECTURE_RULES.eonKeysMayCreateSubscription, false);
});

test('Production builds enforce W623D before Vite emits files', () => {
  const build = read('scripts/build-production.mjs');
  const pkg = JSON.parse(read('package.json'));
  assert.match(build, /w623d-production-reachability-gate\.mjs/);
  assert.match(pkg.scripts['qa:w623d-production-reachability'], /w623d-production-reachability-gate/);
});

test('W623D keeps protocol-relative approved provider scripts external to the repository graph', () => {
  assert.equal(report.missing.includes('resources.infolinks.com/js/infolinks_main.js'), false);
});
