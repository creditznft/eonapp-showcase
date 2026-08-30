#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=') || '1'];
}));

const session = String(args.get('session') || '00-baseline');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const root = path.join('reports', 'gpt55-launch', `${session}-${stamp}`);
fs.mkdirSync(root, { recursive: true });

const target = String(args.get('target') || process.env.EONAPP_PUBLIC_URL || 'https://eonapp.ch');
const localTarget = String(args.get('local-target') || process.env.EONAPP_BASE_URL || 'http://127.0.0.1:4173');
const cdp = String(args.get('cdp') || process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222');

const commandsBySession = {
  '00-baseline': [
    ['node', ['-v']],
    ['npm', ['-v']],
    ['npm', ['run', 'build']],
    ['npm', ['run', 'audit:site']],
    ['npm', ['run', 'launch:readiness']],
    ['node', ['scripts/gpt55-static-launch-audit.mjs']]
  ],
  '01-quality': [
    ['npm', ['run', 'lint', '--', '--max-warnings=50']],
    ['npm', ['run', 'test:unit']],
    ['npm', ['audit', '--omit=dev', '--audit-level=high']],
    ['npm', ['run', 'security:secret-scan', '--', '--mode=workspace']],
    ['npm', ['run', 'qa:w134-dependency-security']]
  ],
  '02-static': [
    ['npm', ['run', 'qa:w149-ceo-launch-verification']],
    ['npm', ['run', 'qa:w150-telegram-reward-hardening']],
    ['npm', ['run', 'qa:w138-market-nft-generation-proof']],
    ['npm', ['run', 'qa:w145-update-safe-user-data-survival']],
    ['npm', ['run', 'qa:w165-final-gamer-power-user-certification']],
    ['node', ['scripts/gpt55-static-launch-audit.mjs']]
  ],
  '03-local-browser': [
    ['node', ['scripts/gpt55-live-http-proof.mjs', `--target=${localTarget}`, `--out=${root}/local-http-proof.json`]],
    ['node', ['scripts/w136-live-browser-proof.mjs', `--target=${localTarget}`, `--out=${root}/local-browser`, '--strict=1']]
  ],
  '04-production-browser': [
    ['node', ['scripts/gpt55-live-http-proof.mjs', `--target=${target}`, `--out=${root}/production-http-proof.json`]],
    ['node', ['scripts/w136-live-browser-proof.mjs', `--target=${target}`, `--out=${root}/production-browser`, '--strict=1']]
  ],
  '05-telegram': [
    ['npm', ['run', 'qa:telegram-miniapp-readiness']],
    ['npm', ['run', 'qa:w150-telegram-reward-hardening']],
    ['node', ['scripts/gpt55-live-http-proof.mjs', `--target=${target}`, '--telegram-only', `--out=${root}/telegram-http-proof.json`]],
    ['node', ['scripts/gpt55-telegram-webview-cdp-proof.mjs', `--cdp=${cdp}`, '--duration-ms=90000', `--out=${root}/telegram-cdp`]]
  ],
  '06-rewards-ai': [
    ['npm', ['run', 'qa:ad-final-gateway']],
    ['npm', ['run', 'qa:final-telegram-rewards']],
    ['npm', ['run', 'smoke:providers']],
    ['npm', ['run', 'qa:ai-live-super']],
    ['npm', ['run', 'qa:ai-live-super:strict']],
    ['npm', ['run', 'qa:ai-live-super:browser']]
  ],
  '07-payments-wallet': [
    ['node', ['--test', 'tests/unit/nowpayments-ipn.test.mjs', 'tests/unit/subscription.test.mjs', 'tests/unit/wallet-connector.test.js', 'tests/unit/wallet.test.js', 'tests/unit/w56-ad-sponsored-subscription.test.mjs']]
  ],
  '08-market-vault-eoncity': [
    ['npm', ['run', 'qa:w138-market-nft-generation-proof']],
    ['npm', ['run', 'qa:w139-vault-persistence-backup-proof']],
    ['npm', ['run', 'qa:w145-update-safe-user-data-survival']],
    ['npm', ['run', 'qa:w100-vault-rebuild']],
    ['npm', ['run', 'qa:w101-marketplace']],
    ['npm', ['run', 'qa:w161-lighting-weather-audio-polish']],
    ['npm', ['run', 'qa:w162-gameplay-clarity-onboarding']],
    ['npm', ['run', 'qa:w163-generated-realms-ultra-parity']],
    ['npm', ['run', 'qa:w164-sustained-performance-lab']],
    ['npm', ['run', 'qa:w165-final-gamer-power-user-certification']]
  ],
  '09-evidence': [
    ['npm', ['run', 'launch:evidence-audit']]
  ],
  '10-final': [
    ['npm', ['run', 'build']],
    ['npm', ['run', 'audit:site']],
    ['npm', ['run', 'launch:readiness']],
    ['node', ['scripts/gpt55-static-launch-audit.mjs']],
    ['npm', ['run', 'launch:evidence-audit']]
  ]
};

const commands = commandsBySession[session];
if (!commands) {
  console.error(`Unknown session ${session}. Known: ${Object.keys(commandsBySession).join(', ')}`);
  process.exit(2);
}

const secretPatterns = [
  /\b\d{6,}:[A-Za-z0-9_-]{20,}\b/g,
  /0x[a-fA-F0-9]{64}\b/g,
  /sk-[A-Za-z0-9_-]{20,}/g,
  /(api[_-]?key|token|secret|private[_-]?key)=([^\s]+)/gi,
  /([?&](?:hash|auth|token|tgWebAppData|initData)=)[^&#\s]+/gi
];
function redact(text) {
  let out = String(text || '');
  for (const pattern of secretPatterns) {
    out = out.replace(pattern, (...parts) => {
      if (parts.length >= 3 && /=$/.test(parts[1] || '')) return `${parts[1]}<redacted>`;
      if (parts[1] && /api|token|secret|private/i.test(parts[1])) return `${parts[1]}=<redacted>`;
      return '<redacted>';
    });
  }
  return out;
}

function run(cmd, cmdArgs, index) {
  return new Promise((resolve) => {
    const name = `${String(index + 1).padStart(2, '0')}-${cmd}-${cmdArgs.join('_').replace(/[^a-z0-9_.-]+/gi, '-').slice(0, 120)}.log`;
    const logPath = path.join(root, name);
    const child = spawn(cmd, cmdArgs, { shell: process.platform === 'win32', env: process.env });
    let text = `$ ${cmd} ${cmdArgs.join(' ')}\n\n`;
    child.stdout.on('data', (buf) => { const t = redact(buf); process.stdout.write(t); text += t; });
    child.stderr.on('data', (buf) => { const t = redact(buf); process.stderr.write(t); text += t; });
    child.on('close', (code, signal) => {
      text += `\n[exit] code=${code} signal=${signal || ''}\n`;
      fs.writeFileSync(logPath, text);
      resolve({ cmd, args: cmdArgs, code, signal, logPath });
    });
  });
}

const results = [];
for (let i = 0; i < commands.length; i += 1) {
  const [cmd, cmdArgs] = commands[i];
  const result = await run(cmd, cmdArgs, i);
  results.push(result);
  if (result.code !== 0) break;
}

const summary = {
  schema: 'eonapp.gpt55.launch-proof-runner.v2',
  session,
  root,
  target,
  localTarget,
  ok: results.length === commands.length && results.every((r) => r.code === 0),
  results,
  generatedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(root, 'SUMMARY.json'), `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(path.join(root, 'COMMANDS_RUN.md'), [`# Commands run for ${session}`, '', ...results.map((r) => `- \`${r.cmd} ${r.args.join(' ')}\` → exit ${r.code}; log: \`${r.logPath}\``)].join('\n'));
console.log(`\nEvidence written to ${root}`);
if (!summary.ok) process.exit(1);
