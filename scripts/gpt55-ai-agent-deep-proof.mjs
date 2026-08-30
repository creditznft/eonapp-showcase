#!/usr/bin/env node
/**
 * GPT-5.5 AI agent deep proof — local operator runner.
 *
 * Reads an operator-owned .env.local only on the machine that launches it.
 * It never prints key prefixes/suffixes, never writes secret samples, and
 * redacts known configured key values from command logs before persistence.
 * This is a test orchestrator, not an EONAPP runtime feature or a deployment
 * approval. Provider calls happen only inside the child commands that already
 * require their own explicit live-test opt-in.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const noBrowser = has('--no-browser');
const noStrict = has('--no-strict');
const strictExit = has('--strict-exit');
const repoRoot = process.cwd();
const tag = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join(repoRoot, 'reports', 'gpt55-launch', `ai-agent-deep-${tag}`);
mkdirSync(outDir, { recursive: true });

const AI_KEYS = Object.freeze([
  'EON_OPENAI_API_KEY', 'EON_OPENROUTER_API_KEY', 'EON_GEMINI_API_KEY',
  'EON_GROQ_API_KEY', 'EON_CEREBRAS_API_KEY', 'EON_MISTRAL_API_KEY',
  'EON_DEEPSEEK_API_KEY', 'EON_CLOUDFLARE_API_KEY', 'EON_HUGGINGFACE_API_KEY',
  'EON_TOGETHER_API_KEY', 'EON_COHERE_API_KEY', 'EON_NVIDIA_API_KEY',
  'EON_SAMBANOVA_API_KEY', 'EON_FIREWORKS_API_KEY', 'EON_FREEINFERENCE_API_KEY',
  'EON_ANTHROPIC_API_KEY', 'EON_XAI_API_KEY', 'EON_QWEN_API_KEY',
  'EON_PERPLEXITY_API_KEY', 'EON_ELEVENLABS_API_KEY'
]);
const envFile = path.join(repoRoot, '.env.local');

function unquoteEnv(value) {
  const trimmed = String(value || '').trim();
  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote) && trimmed.length >= 2) return trimmed.slice(1, -1);
  return trimmed;
}

if (existsSync(envFile)) {
  const envText = readFileSync(envFile, 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = unquoteEnv(match[2]);
  }
}

function present(key) {
  const value = String(process.env[key] || '').trim();
  return Boolean(value) && !/replace_me|your_|0x_low_funds|optional/i.test(value);
}

const envSummary = AI_KEYS.map((key) => Object.freeze({ key, present: present(key) }));
const knownSecretValues = Object.freeze(
  AI_KEYS.map((key) => String(process.env[key] || '').trim())
    .filter((value) => value && !/replace_me|your_|0x_low_funds|optional/i.test(value))
    .sort((a, b) => b.length - a.length)
);

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function redactPersistentText(value) {
  let output = String(value || '');
  for (const secret of knownSecretValues) output = output.replace(new RegExp(escapeRegex(secret), 'g'), '[REDACTED_SECRET]');
  // Conservative generic patterns cover accidental keys embedded in URLs or child-process output.
  return output
    .replace(/(Authorization\s*:\s*(?:Bearer|Basic)\s+)[^\s'"`]+/gi, '$1[REDACTED_SECRET]')
    .replace(/([?&](?:api[_-]?key|key|token|access[_-]?token|authorization)=)[^&#\s'"`]+/gi, '$1[REDACTED_SECRET]')
    .replace(/\b(sk-[A-Za-z0-9_-]{12,}|gsk_[A-Za-z0-9_-]{12,}|AIza[\w-]{12,}|0x[a-fA-F0-9]{64})\b/g, '[REDACTED_SECRET]');
}

function writeText(name, text) {
  writeFileSync(path.join(outDir, name), redactPersistentText(text));
}

writeFileSync(path.join(outDir, 'ENV_REDACTED_AI_SUMMARY.json'), JSON.stringify({
  schema: 'eonapp.ai-proof.env-presence.w592.v1',
  envLocalExists: existsSync(envFile),
  aiKeys: envSummary,
  keySamplesPersisted: false,
  rawSecretValuesPersisted: false
}, null, 2));
writeText('ENV_REDACTED_AI_SUMMARY.md', [
  '# GPT-5.5 AI Agent Deep Proof — Secret-safe Environment Presence',
  '',
  `- .env.local exists: ${existsSync(envFile) ? 'yes' : 'no'}`,
  `- AI provider keys present: ${envSummary.filter((entry) => entry.present).length}/${envSummary.length}`,
  '- Key prefixes, suffixes, lengths, hashes and samples are intentionally not written.',
  '',
  '| Key | Present |',
  '| --- | --- |',
  ...envSummary.map((entry) => `| ${entry.key} | ${entry.present ? 'yes' : 'no'} |`),
  '',
  'No raw secret value, redacted sample, key fragment or credential-derived hash is written by this script.'
].join('\n'));

const commands = [
  ['node', ['-v'], 'node-version'],
  ['npm', ['-v'], 'npm-version'],
  ['npm', ['run', 'qa:ai-live-super', '--', '--no-browser', '--no-local'], 'remote-provider-direct-api'],
  ['npm', ['run', 'smoke:providers'], 'provider-smoke-matrix']
];
if (!noBrowser) {
  commands.push(['npm', ['run', 'qa:live-ai-e2e'], 'live-ai-e2e-matrix']);
  commands.push(['npm', ['run', 'qa:ai-live-super:browser'], 'browser-ui-ai-surface']);
}
if (!noStrict) commands.push(['npm', ['run', 'qa:ai-live-super:strict'], 'strict-full-ai-supertest']);

const results = [];
function run(command, commandArgs, label) {
  return new Promise((resolve) => {
    const startedAt = new Date().toISOString();
    const logName = `${String(results.length + 1).padStart(2, '0')}-${label}.log`;
    const logPath = path.join(outDir, logName);
    const proc = spawn(command, commandArgs, { cwd: repoRoot, env: process.env, shell: process.platform === 'win32' });
    let output = '';
    const append = (chunk) => { output += String(chunk || ''); };
    proc.stdout.on('data', append);
    proc.stderr.on('data', append);
    proc.on('close', (code, signal) => {
      const endedAt = new Date().toISOString();
      writeText(logName, output);
      const result = Object.freeze({ label, command: [command, ...commandArgs].join(' '), code, signal, startedAt, endedAt, logFile: logName });
      results.push(result);
      console.log(`${code === 0 ? 'PASS' : 'FAIL'} ${label} -> ${logPath}`);
      resolve(result);
    });
  });
}

for (const [command, commandArgs, label] of commands) await run(command, commandArgs, label);

const summary = Object.freeze({
  schema: 'eonapp.gpt55.ai-agent-deep-proof.w592.v2',
  generatedAt: new Date().toISOString(),
  outDir,
  envLocalExists: existsSync(envFile),
  aiKeysPresent: envSummary.filter((entry) => entry.present).length,
  rawSecretValuesPersisted: false,
  keySamplesPersisted: false,
  commands: results,
  failed: results.filter((entry) => entry.code !== 0).map((entry) => entry.label)
});
writeFileSync(path.join(outDir, 'SUMMARY.json'), JSON.stringify(summary, null, 2));
writeText('SUMMARY.md', [
  '# GPT-5.5 AI Agent Deep Proof Summary',
  '',
  `- Generated: ${summary.generatedAt}`,
  `- AI keys present: ${summary.aiKeysPresent}/${AI_KEYS.length}`,
  `- Failed command count: ${summary.failed.length}`,
  '- Secret-safe persistence: raw values, fragments and samples are not stored.',
  '',
  '| Status | Label | Command |',
  '| --- | --- | --- |',
  ...results.map((entry) => `| ${entry.code === 0 ? 'PASS' : 'FAIL'} | ${entry.label} | \`${entry.command.replace(/\|/g, '\\|')}\` |`),
  '',
  'A PASS means the command exited cleanly. Provider-level WARN or SKIP results still require review. This result is not deployment, browser, device, security, commercial or launch approval.'
].join('\n'));
console.log(`\nAI deep proof evidence written to ${outDir}`);
if (strictExit && summary.failed.length) process.exit(1);
