#!/usr/bin/env node
/** Run the staged Pages project locally and prove representative Functions routes return JSON. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { collectPagesFunctionSupportFiles } from './lib/w660l-pages-deploy-bundle.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8787;
const MAX_RUNTIME_MS = 90_000;
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'eonapp-w655-pages-'));
const copyTree = (from, to) => {
  fs.cpSync(from, to, { recursive: true });
};
copyTree(path.join(root, 'dist'), path.join(stage, 'dist'));
const deployRoot = path.join(stage, 'dist');
copyTree(path.join(root, 'functions'), path.join(deployRoot, 'functions'));
for (const relative of collectPagesFunctionSupportFiles(root)) {
  const target = path.join(deployRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, relative), target);
}

const command = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler');
const child = spawn(command, ['pages', 'dev', '.', '--port', String(port), '--ip', '127.0.0.1', '--compatibility-date', '2026-07-07'], {
  cwd: deployRoot,
  env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: '', CLOUDFLARE_API_TOKEN: '' },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
  shell: process.platform === 'win32',
  detached: process.platform !== 'win32'
});
let output = '';
let closed = false;
let runtimeExpired = false;
const startedAt = Date.now();
child.stdout.on('data', (chunk) => { output = `${output}${chunk}`.slice(-4000); });
child.stderr.on('data', (chunk) => { output = `${output}${chunk}`.slice(-4000); });
child.once('close', () => { closed = true; });
const stop = () => {
  if (process.platform === 'win32' && child.pid) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  if (process.platform !== 'win32' && child.pid) {
    try { process.kill(-child.pid, 'SIGTERM'); } catch {}
  }
  if (!child.killed) child.kill('SIGTERM');
};
const runtimeTimer = setTimeout(() => { runtimeExpired = true; stop(); }, MAX_RUNTIME_MS);
try {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/auth/session`, { signal: AbortSignal.timeout(5000) });
      if (response.status > 0) { ready = true; break; }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (runtimeExpired) throw new Error(`Pages routing smoke exceeded ${MAX_RUNTIME_MS}ms.\n${output}`);
  if (!ready) throw new Error(`Wrangler Pages dev server did not become ready.\n${output}`);
  const routes = ['/api/auth/session', '/api/city/access', '/api/billing/status', '/api/referrals'];
  const results = [];
  for (const route of routes) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
    const text = await response.text();
    const contentType = response.headers.get('content-type') || '';
    let body = null;
    try { body = JSON.parse(text); } catch {}
    results.push({ route, status: response.status, contentType, json: Boolean(body && typeof body === 'object') });
    if (response.status !== 200 || !contentType.includes('application/json') || !body || typeof body !== 'object') {
      throw new Error(`Local Pages Function smoke failed for ${route}: ${response.status} ${contentType}`);
    }
  }
  if (runtimeExpired || Date.now() - startedAt > MAX_RUNTIME_MS) throw new Error(`Pages routing smoke exceeded ${MAX_RUNTIME_MS}ms.`);
  console.log(JSON.stringify({ ok: true, schema: 'eonapp.w655-pages-routing-smoke.v1', results }, null, 2));
} finally {
  clearTimeout(runtimeTimer);
  stop();
  await new Promise((resolve) => {
    if (closed) return resolve();
    const timer = setTimeout(resolve, 1500);
    child.once('close', () => { clearTimeout(timer); resolve(); });
  });
  if (!closed && process.platform !== 'win32' && child.pid) {
    try { process.kill(-child.pid, 'SIGKILL'); } catch {}
  }
  child.stdin?.destroy();
  child.stdout?.destroy();
  child.stderr?.destroy();
  if (process.env.W655_SMOKE_DIAGNOSTIC === '1') console.error(`active handles after cleanup: ${process._getActiveHandles().map((handle) => handle.constructor?.name || 'unknown').join(',')}`);
  try { fs.rmSync(stage, { recursive: true, force: true }); } catch {}
}
