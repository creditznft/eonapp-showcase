#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateW642ProductTruthRetentionContract } from '../config/w642-product-truth-retention-contract.mjs';
import { PRIMARY_APP_ROUTES, INFORMATIONAL_ROUTES, COMPATIBILITY_ROUTES } from '../config/route-contract.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const pages = ['about.html','privacy.html','legal.html','terms.html','support.html'];
const resolver = read('assets/js/retention/eon-continue-resolver.js');
const surface = read('assets/js/retention/eon-continue-surface.js');
const telemetry = read('assets/js/retention/eon-retention-telemetry.js');
const shell = read('assets/js/eon-app-shell.js');
const rewards = read('assets/js/access/rewards-status-page.js');
const rewardsHtml = read('rewards.html');
const market = read('market.html');
const checks = [
  ['contract', validateW642ProductTruthRetentionContract().ok],
  ['files', ['config/w642-product-truth-retention-contract.mjs','assets/js/retention/eon-continue-resolver.js','assets/js/retention/eon-continue-surface.js','assets/js/retention/eon-retention-telemetry.js','assets/css/eon-continue.css','tests/unit/w642-product-truth-retention.test.mjs'].every(exists)],
  ['preview-canonical', PRIMARY_APP_ROUTES.some((row) => row.from === '/preview-studio' && row.file === 'market.html') && COMPATIBILITY_ROUTES.some((row) => row.from === '/market' && row.lifecycle === 'compatibility-hidden') && /canonical" href="https:\/\/eonapp\.ch\/preview-studio/.test(market)],
  ['reward-live-safety', INFORMATIONAL_ROUTES.some((row) => row.from === '/rewards' && row.lifecycle === 'live-sensitive') && /Rewarded Sponsor Terminal/.test(rewards) && /qualifying server-validated completion adds exactly 1 Sponsor Key/.test(rewards) && /Reward issuance is server-authoritative and duplicate\/replay protected/.test(rewards) && /data-monetization="enabled"/.test(rewardsHtml) && /MyLead Sponsored Missions/i.test(rewardsHtml) && /Rewards are server-authoritative and never created by clicks, redirects, iframe closes or ordinary ad playback/i.test(rewardsHtml)],
  ['public-vocabulary', pages.every((page) => !/href="\/market">Market<\/a>|href="\/rewards">Campaign status<\/a>/.test(read(page)))],
  ['one-local-candidate', /resolveEonContinueCandidate/.test(resolver) && /\[0\] \|\| null/.test(resolver) && /localOnly: true/.test(resolver)],
  ['no-dark-retention', !/(Notification\.requestPermission|PushManager|sendBeacon|fetch\(|WebSocket|EventSource)/.test(resolver + surface + telemetry) && /Not now/.test(surface)],
  ['bounded-content-free-telemetry', /slice\(-30\)/.test(telemetry) && /containsUserContent: false/.test(telemetry) && /remoteUpload: false/.test(telemetry)],
  ['shell-installed', /installEonContinueSurface/.test(shell)],
  ['commands', JSON.parse(read('package.json')).scripts?.['qa:w642-product-truth-retention']?.includes('w642-product-truth-retention-gate.mjs')]
];
for (const [id, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${id}`);
const result = { schema: 'eonapp.gate.product-truth-retention.w642.v1', wave: 'W642', ok: checks.every(([, pass]) => pass), passed: checks.filter(([, pass]) => pass).length, total: checks.length, productionEvidence: 'not-run' };
console.log(`\nW642 product truth and retention source gate: ${result.passed}/${result.total}; production evidence NOT-RUN`);
if (!result.ok) process.exitCode = 1;
