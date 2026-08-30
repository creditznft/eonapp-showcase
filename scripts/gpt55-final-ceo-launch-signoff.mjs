#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const requiredFiles = [
  'docs/SESSION10_FINAL_CEO_AUDIT_REPORT.md',
  'docs/SESSION10_CODEX_ULTIMATE_MERGE_DEPLOY_HANDOFF.md',
  'docs/SESSION10_REMAINING_FINDINGS_NOT_DONE.md',
  'docs/SESSION10_LIVE_PROOF_CAPTURE_PROTOCOL.md',
  'docs/SESSION1_10_CUMULATIVE_GATE_SUMMARY.md',
  'CodexDocs/GPT55_SESSION1_10_ULTIMATE_CODEX_PROMPT.md',
  'scripts/gpt55-final-ceo-launch-signoff.mjs',
  'scripts/gpt55-eoncity-gameplay-certification-gate.mjs',
  'scripts/gpt55-payment-reward-server-truth-gate.mjs',
  'scripts/gpt55-vault-account-survival-gate.mjs',
  'scripts/gpt55-market-nft-lootbox-visual-gate.mjs',
  'scripts/gpt55-code-os-gate.mjs',
  'scripts/gpt55-eonbot-emotion-voice-gate.mjs',
  'scripts/gpt55-route-truth-device-audit.mjs',
  'assets/js/utils/eoncity-gameplay-certification.js',
  'assets/js/utils/payment-reward-proof.js',
  'assets/js/utils/market-starter-nfts.js',
  'assets/js/utils/vault.js',
  'chat.html',
  'code-maker.html',
  'market.html',
  'realmworld.html',
  'reward-access.html',
  'telegram.html',
  'vault.html',
  'capsule.html',
  'vault-payments.html',
  'subscription.html'
];

const requiredScripts = [
  'gpt55:final-ceo-launch-signoff',
  'gpt55:eoncity-gameplay-certification-gate',
  'gpt55:payment-reward-server-truth-gate',
  'gpt55:vault-account-survival-gate',
  'gpt55:market-nft-lootbox-visual-gate',
  'gpt55:code-os-gate',
  'gpt55:eonbot-emotion-voice-gate',
  'gpt55:route-truth-device-audit',
  'gpt55:static-launch-audit',
  'launch:page-gate',
  'launch:readiness',
  'qa:w132-telegram-monetag-proof',
  'qa:w138-market-nft-generation-proof',
  'qa:w145-update-safe-user-data-survival'
];

const requiredPhrases = [
  ['reward-access.html', 'Server-truth status'],
  ['telegram.html', 'Server-truth status'],
  ['subscription.html', 'verified payment proof'],
  ['vault-payments.html', 'Payment and reward server-truth'],
  ['capsule.html', 'Portable Workspace Capsule'],
  ['market.html', 'NFT Visual QA'],
  ['code-maker.html', 'EON Code OS'],
  ['chat.html', 'eonbot-emotion'],
  ['realmworld.html', 'rw-gameplay-certification']
];

const paidAdsBlockers = [
  'Real Telegram Mini App session inside @EonAppsBot',
  'Real Monetag valued postback in Cloudflare KV/status endpoint',
  'Low-value NOWPayments finished payment proof',
  'Funded low-value EVM receipt proof if direct wallet fallback is enabled',
  'Post-deploy browser/device proof',
  'Browser export/import Vault restore drill'
];

const checks = [];
const add = (name, pass, detail = '') => checks.push({ name, pass, detail });

for (const file of requiredFiles) {
  add(`required file: ${file}`, fs.existsSync(path.join(root, file)), file);
}

let pkg = null;
try {
  pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  add('package.json parses', true, 'ok');
} catch (error) {
  add('package.json parses', false, error.message);
}

if (pkg) {
  for (const script of requiredScripts) {
    add(`package script: ${script}`, Boolean(pkg.scripts?.[script]), pkg.scripts?.[script] || 'missing');
  }
}

for (const [file, phrase] of requiredPhrases) {
  const full = path.join(root, file);
  const text = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
  add(`phrase '${phrase}' in ${file}`, text.includes(phrase), phrase);
}

const finalReport = fs.readFileSync(path.join(root, 'docs/SESSION10_FINAL_CEO_AUDIT_REPORT.md'), 'utf8');
for (const blocker of paidAdsBlockers) {
  add(`paid ads blocker documented: ${blocker}`, finalReport.includes(blocker) || fs.readFileSync(path.join(root, 'docs/SESSION10_REMAINING_FINDINGS_NOT_DONE.md'), 'utf8').includes(blocker), blocker);
}

const publicFiles = ['index.html', 'chat.html', 'code-maker.html', 'market.html', 'vault.html', 'realmworld.html', 'telegram.html', 'reward-access.html', 'subscription.html'];
for (const file of publicFiles) {
  const text = fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file), 'utf8') : '';
  add(`no visible paid-ads GO claim in ${file}`, !/paid ads\s*:\s*go|ads\s+go\b/i.test(text), file);
}

const passed = checks.filter((check) => check.pass).length;
const failed = checks.filter((check) => !check.pass);
const score = Math.round((passed / checks.length) * 100);
const status = failed.length === 0 ? 'SOURCE_SIGNOFF_GREEN__PAID_ADS_HOLD_FOR_LIVE_PROOF' : 'BLOCKED';

const report = {
  generatedAt: new Date().toISOString(),
  session: 10,
  cumulativeSessions: '1-10',
  sourceConfidenceScore: failed.length === 0 ? 98 : Math.min(score, 90),
  gateScore: score,
  status,
  paidAdsDecision: 'HOLD_UNTIL_LIVE_EXTERNAL_PROOF',
  checks,
  failed,
  liveProofStillRequired: paidAdsBlockers
};

const outDir = path.join(root, 'reports/session10');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'SESSION10_FINAL_CEO_SIGNOFF_GATE.json'), JSON.stringify(report, null, 2));
const md = [
  '# Session 10 Final CEO Signoff Gate',
  '',
  `Status: **${status}**`,
  `Gate score: **${score}/100**`,
  `Source confidence: **${report.sourceConfidenceScore}/100**`,
  `Paid ads decision: **${report.paidAdsDecision}**`,
  '',
  '## Live proof still required',
  ...paidAdsBlockers.map((item) => `- ${item}`),
  '',
  '## Failed checks',
  ...(failed.length ? failed.map((check) => `- ${check.name}: ${check.detail}`) : ['- None'])
].join('\n');
fs.writeFileSync(path.join(outDir, 'SESSION10_FINAL_CEO_SIGNOFF_GATE.md'), md + '\n');

const digest = crypto.createHash('sha256').update(JSON.stringify(report)).digest('hex');
console.log(`Session 10 Final CEO Signoff Gate: ${status}`);
console.log(`Score: ${score}/100`);
console.log(`Source confidence: ${report.sourceConfidenceScore}/100`);
console.log(`Paid ads: HOLD until live external proof is green`);
console.log(`Report digest: ${digest}`);

if (failed.length) {
  for (const failure of failed) console.error(`FAIL ${failure.name}: ${failure.detail}`);
  process.exit(1);
}
