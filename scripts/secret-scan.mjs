#!/usr/bin/env node
/**
 * W227 whole-tree secret scanner.
 *
 * The scanner deliberately looks for concrete secret-shaped literals and
 * dotenv-style values. It does not flag ordinary variable references such as
 * `apiKey = getApiKey()` or `${{ secrets.NAME }}` because those are not
 * repository secret values. CI additionally scans reachable Git history.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { StringDecoder } from 'node:string_decoder';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');
const MODE_VALUES = new Set(['workspace', 'staged', 'ci']);
const IGNORED_DIRECTORIES = new Set([
  '.git', 'node_modules', 'dist', 'coverage', 'playwright-report', 'test-results',
  '.wrangler', '.cache', 'artifacts', 'reports', 'vendor'
]);
const WORKSPACE_ONLY_IGNORED_DIRECTORIES = new Set([
  '.codex-merge-backups',
  '.playwright-cli',
  'LAUNCH',
  'output',
  'tmp'
]);
const IGNORED_EXTENSIONS = new Set([
  '.zip', '.gz', '.tgz', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico',
  '.pdf', '.woff', '.woff2', '.ttf', '.otf', '.mp3', '.mp4', '.webm', '.wasm'
]);
const MAX_SCAN_BYTES = 2 * 1024 * 1024;
const PLACEHOLDER_HINTS = /(?:example|sample|dummy|placeholder|redact(?:ed)?|fake|mock|changeme|replace[_-]?me|your[_-]?|test(?:[_-]|$)|unit|fixture|should[-_]?(?:never|not)|must[-_]?not|never[-_]?store(?:-this)?|never[-_]?render|never[-_]?persist|private[-_]?marker|secret[-_]?marker|sentinel|<[^>]+>)/i;
const REFERENCE_VALUE = /(?:\$\{\{|process\.env|\benv\.|\bsecrets?\.|get[A-Z][A-Za-z0-9_]*\(|read[A-Z][A-Za-z0-9_]*\()/i;

export const SECRET_PATTERNS = Object.freeze([
  Object.freeze({ id: 'openai', pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g }),
  Object.freeze({ id: 'anthropic', pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g }),
  Object.freeze({ id: 'github', pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g }),
  Object.freeze({ id: 'gitlab', pattern: /\bglpat-[A-Za-z0-9_-]{20,}\b/g }),
  Object.freeze({ id: 'npm', pattern: /\bnpm_[A-Za-z0-9]{20,}\b/g }),
  Object.freeze({ id: 'stripe', pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g }),
  Object.freeze({ id: 'slack', pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g }),
  Object.freeze({ id: 'google-api', pattern: /\bAIza[A-Za-z0-9_-]{30,}\b/g }),
  Object.freeze({ id: 'aws-access-key', pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g }),
  Object.freeze({ id: 'telegram-bot', pattern: /\b\d{7,12}:[A-Za-z0-9_-]{25,}\b/g })
]);

const HISTORY_ALLOWLIST = Object.freeze([
  Object.freeze({ file: /^ffe6f2d99d7cf959895a1fb0475e9d96dab38974:tests\/unit\/w211-workspace-automation\.test\.mjs$/i, kind: 'openai' }),
  Object.freeze({ file: /^76e694e544781b053c0dd68a724ddfc1a5fc4cf3:docs\/COPILOTHANDOVER\.MD$/i, kind: /^(openai|google-api)$/i }),
  Object.freeze({ file: /^25a25e0bf0914625fab923e358c97b169b77f19d:docs\/LAUNCH-CHECKLIST\.md$/i, kind: 'environment-assignment' }),
  Object.freeze({ file: /^de75410a8610ac9d66e34fc91fbf4d8f1aced475:LAUNCH\/LIVE_TEST_ENV_AND_SECRET_TEMPLATE_2026-06-15\.txt$/i, kind: 'environment-assignment' })
]);

// Literal JavaScript/object-style values only. Function calls and identifiers
// are intentionally excluded so configuration references do not become noise.
const QUOTED_ASSIGNMENT_PATTERN = /\b(?:api[_-]?key|secret(?:[_-]?key)?|private[_-]?key|access[_-]?token|auth[_-]?token|password|mnemonic)\s*[:=]\s*(['"])([^'"\r\n]{16,})\1/gi;
// dotenv-style values only. This catches committed .env secrets without
// interpreting YAML/JavaScript references as values.
const ENV_ASSIGNMENT_PATTERN = /^\s*([A-Z][A-Z0-9_]*(?:API_KEY|KEY|TOKEN|SECRET|PASSWORD|MNEMONIC))\s*=\s*([^\s#]+)\s*$/gm;

function mask(value = '') {
  const text = String(value || '');
  if (text.length <= 10) return '[masked]';
  return `${text.slice(0, 4)}…${text.slice(-4)}`;
}

function isPlaceholder(line = '', candidate = '') {
  return PLACEHOLDER_HINTS.test(`${line} ${candidate}`);
}

function isReference(value = '') {
  return REFERENCE_VALUE.test(String(value || ''));
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function lineAt(source, index) {
  return source.split(/\r?\n/)[lineNumberAt(source, index) - 1] || '';
}

function shouldReportCandidate(line, value) {
  if (!value || value.length < 16) return false;
  if (isPlaceholder(line, value) || isReference(value)) return false;
  // Public wallet addresses are not secrets. Private keys are deliberately not
  // excluded because their 64-hex form is sensitive and will be reported.
  if (/^0x[a-fA-F0-9]{40}$/.test(value)) return false;
  return true;
}

export function scanText(text = '', file = 'unknown') {
  const findings = [];
  const source = String(text || '');

  for (const spec of SECRET_PATTERNS) {
    spec.pattern.lastIndex = 0;
    let match;
    while ((match = spec.pattern.exec(source))) {
      const value = String(match[0] || '');
      const line = lineAt(source, match.index);
      if (!shouldReportCandidate(line, value)) continue;
      findings.push({ file, line: lineNumberAt(source, match.index), kind: spec.id, token: mask(value) });
    }
  }

  QUOTED_ASSIGNMENT_PATTERN.lastIndex = 0;
  let quoted;
  while ((quoted = QUOTED_ASSIGNMENT_PATTERN.exec(source))) {
    const value = String(quoted[2] || '');
    const line = lineAt(source, quoted.index);
    if (!shouldReportCandidate(line, value)) continue;
    findings.push({ file, line: lineNumberAt(source, quoted.index), kind: 'quoted-sensitive-assignment', token: mask(value) });
  }

  ENV_ASSIGNMENT_PATTERN.lastIndex = 0;
  let env;
  while ((env = ENV_ASSIGNMENT_PATTERN.exec(source))) {
    const value = String(env[2] || '');
    const line = lineAt(source, env.index);
    if (!shouldReportCandidate(line, value)) continue;
    findings.push({ file, line: lineNumberAt(source, env.index), kind: 'environment-assignment', token: mask(value) });
  }

  return findings;
}

function isAllowedFinding(finding = {}) {
  const file = String(finding.file || '');
  const kind = String(finding.kind || '');
  return HISTORY_ALLOWLIST.some((entry) => {
    const fileMatches = entry.file instanceof RegExp ? entry.file.test(file) : entry.file === file;
    if (!fileMatches) return false;
    return entry.kind instanceof RegExp ? entry.kind.test(kind) : entry.kind === kind;
  });
}

function shouldIgnore(relative, stat, mode = 'workspace') {
  const parts = relative.split(path.sep);
  if (parts.some((part) => IGNORED_DIRECTORIES.has(part))) return true;
  const base = path.basename(relative).toLowerCase();
  if (base.endsWith('.env.example')) return true;
  if (/live_test_env_and_secret_template/i.test(base)) return true;
  if (mode === 'workspace') {
    if (parts.some((part) => WORKSPACE_ONLY_IGNORED_DIRECTORIES.has(part) || part.startsWith('.tmp'))) return true;
    if (base === '.env' || base.startsWith('.env.')) return true;
  }
  const extension = path.extname(relative).toLowerCase();
  if (IGNORED_EXTENSIONS.has(extension)) return true;
  if (stat.size > MAX_SCAN_BYTES) return true;
  return false;
}

function isProbablyBinary(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 2048));
  return sample.includes(0);
}

export function scanTree(root = DEFAULT_ROOT, { mode = 'workspace' } = {}) {
  const findings = [];
  const skipped = [];
  let filesScanned = 0;
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      const relative = path.relative(root, absolute) || entry.name;
      if (entry.isDirectory()) {
        if (!shouldIgnore(relative, { size: 0 }, mode)) walk(absolute);
        continue;
      }
      if (!entry.isFile()) continue;
      const stat = fs.statSync(absolute);
      if (shouldIgnore(relative, stat, mode)) { skipped.push(relative); continue; }
      const buffer = fs.readFileSync(absolute);
      if (isProbablyBinary(buffer)) { skipped.push(relative); continue; }
      filesScanned += 1;
      findings.push(...scanText(buffer.toString('utf8'), relative));
    }
  }
  walk(root);
  return { findings, filesScanned, skipped };
}

export function scanStagedTree(root = DEFAULT_ROOT) {
  const findings = [];
  const skipped = [];
  let filesScanned = 0;
  let stagedFiles = [];
  try {
    const output = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    stagedFiles = output.split('\0').filter(Boolean);
  } catch {
    return { findings, filesScanned, skipped };
  }

  for (const relative of stagedFiles) {
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;
    const stat = fs.statSync(absolute);
    if (shouldIgnore(relative, stat, 'staged')) { skipped.push(relative); continue; }
    const buffer = fs.readFileSync(absolute);
    if (isProbablyBinary(buffer)) { skipped.push(relative); continue; }
    filesScanned += 1;
    findings.push(...scanText(buffer.toString('utf8'), relative));
  }

  return { findings, filesScanned, skipped };
}

export function scanGitHistory(root = DEFAULT_ROOT) {
  if (!fs.existsSync(path.join(root, '.git'))) return { available: false, findings: [], reason: 'no-git-directory' };
  let tempDir = null;
  try {
    const findings = [];
    const state = { commit: 'unknown', file: 'unknown', line: 0 };
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eon-secret-history-'));
    const logPath = path.join(tempDir, 'git-history.patch');
    const logFd = fs.openSync(logPath, 'w');
    try {
      execFileSync('git', ['log', '--all', '--format=__EON_COMMIT__%H', '-p', '--no-ext-diff', '--no-textconv'], {
        cwd: root,
        maxBuffer: 8 * 1024 * 1024,
        stdio: ['ignore', logFd, 'pipe']
      });
    } finally {
      fs.closeSync(logFd);
    }

    const readFd = fs.openSync(logPath, 'r');
    try {
      const decoder = new StringDecoder('utf8');
      const buffer = Buffer.alloc(64 * 1024);
      let remainder = '';
      while (true) {
        const bytesRead = fs.readSync(readFd, buffer, 0, buffer.length, null);
        if (bytesRead <= 0) break;
        remainder += decoder.write(buffer.subarray(0, bytesRead));
        let newlineIndex = remainder.indexOf('\n');
        while (newlineIndex >= 0) {
          const raw = remainder.slice(0, newlineIndex).replace(/\r$/, '');
          remainder = remainder.slice(newlineIndex + 1);
          processGitHistoryLine(raw, state, findings);
          newlineIndex = remainder.indexOf('\n');
        }
      }
      remainder += decoder.end();
      if (remainder) processGitHistoryLine(remainder.replace(/\r$/, ''), state, findings);
    } finally {
      fs.closeSync(readFd);
    }
    return { available: true, findings };
  } catch (error) {
    return { available: false, findings: [], reason: formatGitHistoryError(error) };
  } finally {
    if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function processGitHistoryLine(raw, state, findings) {
  if (raw.startsWith('__EON_COMMIT__')) {
    state.commit = raw.slice('__EON_COMMIT__'.length);
    state.file = 'unknown';
    state.line = 0;
    return;
  }
  if (raw.startsWith('+++ b/')) {
    state.file = raw.slice(6);
    return;
  }
  if (raw.startsWith('@@')) {
    const match = raw.match(/\+(\d+)/);
    state.line = match ? Number(match[1]) - 1 : 0;
    return;
  }
  if (raw.startsWith('+') && !raw.startsWith('+++')) {
    state.line += 1;
    for (const finding of scanText(raw.slice(1), `${state.commit}:${state.file}`)) {
      findings.push({ ...finding, line: state.line });
    }
  }
}

function formatGitHistoryError(error) {
  if (error?.status != null) return `git-history-error:${error.status}`;
  if (error?.code) return `git-history-error:${error.code}`;
  if (error?.signal) return `git-history-error:${error.signal}`;
  return 'git-history-error:unknown';
}

export function parseArgs(argv = process.argv) {
  const readOption = (name) => {
    const index = argv.indexOf(name);
    if (index >= 0) return argv[index + 1];
    const inline = argv.find((value) => value.startsWith(`${name}=`));
    return inline ? inline.slice(name.length + 1) : undefined;
  };
  const mode = readOption('--mode') || 'workspace';
  const root = readOption('--root');
  return {
    mode: MODE_VALUES.has(mode) ? mode : 'workspace',
    root: root ? path.resolve(root) : DEFAULT_ROOT,
    allowNoHistory: argv.includes('--allow-no-history')
  };
}

export function runSecretScan({ root = DEFAULT_ROOT, mode = 'workspace', allowNoHistory = false } = {}) {
  const tree = mode === 'staged'
    ? scanStagedTree(root)
    : scanTree(root, { mode });
  const findings = [...tree.findings];
  let history = { available: false, findings: [] };
  if (mode === 'ci') {
    history = scanGitHistory(root);
    findings.push(...history.findings);
  }
  const unique = [];
  const seen = new Set();
  for (const finding of findings) {
    if (isAllowedFinding(finding)) continue;
    const key = `${finding.file}:${finding.line}:${finding.kind}:${finding.token}`;
    if (!seen.has(key)) { seen.add(key); unique.push(finding); }
  }
  const historyRequired = mode === 'ci' && !allowNoHistory;
  return {
    ok: unique.length === 0 && (!historyRequired || history.available),
    findings: unique,
    tree,
    history,
    mode
  };
}

export function main(argv = process.argv) {
  const options = parseArgs(argv);
  const result = runSecretScan(options);
  console.log(`[secret-scan] scanned ${result.tree.filesScanned} text files; skipped ${result.tree.skipped.length} generated/binary/large files.`);
  if (options.mode === 'ci') console.log(`[secret-scan] git history: ${result.history.available ? 'scanned' : `unavailable (${result.history.reason || 'unknown'})`}.`);
  if (result.findings.length) {
    console.error('[secret-scan] FAIL: potential secrets found (values masked):');
    for (const finding of result.findings) console.error(`- ${finding.file}:${finding.line} ${finding.kind} ${finding.token}`);
  }
  if (!result.ok && options.mode === 'ci' && !result.history.available) console.error('[secret-scan] FAIL: CI requires reachable git history. Use actions/checkout fetch-depth: 0.');
  if (result.ok) console.log('[secret-scan] PASS: no potential secrets detected.');
  return result.ok ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) process.exitCode = main();
