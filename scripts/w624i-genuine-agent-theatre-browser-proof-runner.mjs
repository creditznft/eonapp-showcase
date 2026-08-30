#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const host = String(process.env.W624I_PROOF_HOST || '127.0.0.1');
const port = Number(process.env.W624I_PROOF_PORT || 4173);
const baseURL = `http://${host}:${port}`;
const viteBin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
const proofScript = path.join(root, 'scripts', 'w624i-genuine-agent-theatre-browser-proof.mjs');
const run = (command, args, options = {}) => spawn(command, args, { cwd: root, stdio: options.stdio || 'inherit', env: { ...process.env, ...options.env } });
const isReady = async (url) => { try { const response = await fetch(url, { redirect: 'manual' }); return response.status >= 200 && response.status < 500; } catch { return false; } };
const waitForServer = async (url, timeoutMs = 30_000) => { const started = Date.now(); while (Date.now() - started < timeoutMs) { if (await isReady(url)) return; await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error(`W624I proof server did not become ready at ${url}.`); };

let server = null;
let exitCode = 1;
try {
  if (!(await isReady(`${baseURL}/eoncity`))) {
    server = run(viteBin, ['serve', '--host', host, '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
    server.stdout?.on('data', (chunk) => process.stdout.write(chunk));
    server.stderr?.on('data', (chunk) => process.stderr.write(chunk));
    await waitForServer(`${baseURL}/eoncity`);
  } else console.log(`[W624I proof] Reusing server at ${baseURL}.`);
  const proof = run(process.execPath, [proofScript], { env: { PLAYWRIGHT_BASE_URL: baseURL } });
  exitCode = await new Promise((resolve) => proof.on('exit', (code) => resolve(Number(code ?? 1))));
} finally {
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
    await new Promise((resolve) => { const timer = setTimeout(resolve, 1500); server.once('exit', () => { clearTimeout(timer); resolve(); }); });
  }
}
process.exit(exitCode);
