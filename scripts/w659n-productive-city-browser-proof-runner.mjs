#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const host = String(process.env.W659N_PROOF_HOST || '127.0.0.1');
const port = Number(process.env.W659N_PROOF_PORT || 4178);
const baseURL = `http://${host}:${port}`;
const viteBin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
const proofScript = path.join(root, 'scripts', 'w659n-productive-city-browser-proof.mjs');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function ready() { try { const r = await fetch(`${baseURL}/eoncity`, { redirect: 'manual' }); return r.status >= 200 && r.status < 500; } catch { return false; } }
let server;
try {
  if (!(await ready())) {
    server = spawn(viteBin, ['preview', '--host', host, '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
    server.stdout?.on('data', (chunk) => process.stdout.write(chunk));
    server.stderr?.on('data', (chunk) => process.stderr.write(chunk));
    const limit = Date.now() + 30_000;
    while (!(await ready()) && Date.now() < limit) await sleep(250);
    if (!(await ready())) throw new Error(`W659N preview did not become ready at ${baseURL}`);
  }
  const proof = spawn(process.execPath, [proofScript], { cwd: root, stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_BASE_URL: baseURL } });
  const code = await new Promise((resolve) => proof.on('exit', (value) => resolve(Number(value ?? 1))));
  process.exitCode = code;
} finally {
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
    await Promise.race([new Promise((resolve) => server.once('exit', resolve)), sleep(1500)]);
  }
}
