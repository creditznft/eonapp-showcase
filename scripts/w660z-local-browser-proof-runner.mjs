#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const host = String(process.env.W660Z_PROOF_HOST || '127.0.0.1');
const port = Number(process.env.W660Z_PROOF_PORT || 4182);
const baseURL = `http://${host}:${port}`;
const viteBin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
const proofScript = path.join(root, 'scripts', 'w660z-local-browser-proof.mjs');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function ready() { try { const response = await fetch(`${baseURL}/eoncity`, { redirect: 'manual' }); return response.status >= 200 && response.status < 500; } catch { return false; } }
if (!fs.existsSync(path.join(root, 'dist', 'eoncity.html'))) throw new Error('W660Z browser proof requires a current production build. Run npm run build first.');
let server;
try {
  if (!(await ready())) {
    server = spawn(viteBin, ['preview', '--host', host, '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
    server.stdout?.on('data', (chunk) => process.stdout.write(chunk));
    server.stderr?.on('data', (chunk) => process.stderr.write(chunk));
    const deadline = Date.now() + 30_000;
    while (!(await ready()) && Date.now() < deadline) await sleep(250);
    if (!(await ready())) throw new Error(`W660Z preview did not become ready at ${baseURL}`);
  }
  const proof = spawn(process.execPath, [proofScript], { cwd: root, stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_BASE_URL: baseURL, CHROMIUM_PATH: process.env.CHROMIUM_PATH || '/usr/bin/chromium' } });
  process.exitCode = await new Promise((resolve) => proof.on('exit', (code) => resolve(Number(code ?? 1))));
} finally {
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
    await Promise.race([new Promise((resolve) => server.once('exit', resolve)), sleep(1500)]);
  }
}
