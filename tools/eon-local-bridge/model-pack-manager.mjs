import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { getEonLocalAiReviewedModelPack, publicEonLocalAiModelPack } from '../../config/local-ai-reviewed-model-packs.mjs';

const jobs = new Map();
const activeChildren = new Map();
const JOB_TTL_MS = 30 * 60 * 1000;
const PREFLIGHT_OUTPUT_LIMIT = 8192;

function clean(value = '', max = 180) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function prune() {
  const now = Date.now();
  for (const [id, job] of jobs) if (job.finishedAt && now - job.finishedAt > JOB_TTL_MS) jobs.delete(id);
}

function publicJob(job) {
  if (!job) return null;
  return Object.freeze({
    ok: job.status !== 'failed',
    jobId: job.id,
    pack: publicEonLocalAiModelPack(job.pack),
    status: job.status,
    startedAt: new Date(job.startedAt).toISOString(),
    finishedAt: job.finishedAt ? new Date(job.finishedAt).toISOString() : '',
    error: job.error || ''
  });
}

function failJob(job, error = 'model-pack-start-failed') {
  job.status = 'failed';
  job.finishedAt = Date.now();
  job.error = clean(error, 100) || 'model-pack-start-failed';
  activeChildren.delete(job.id);
}

function spawnReviewed(job, executable, args, spawnImpl, { captureOutput = false } = {}) {
  return spawnImpl(executable, [...args], {
    windowsHide: true,
    shell: false,
    stdio: captureOutput ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'ignore', 'ignore'],
    env: process.env
  });
}

function beginDownload(job, spawnImpl) {
  let child;
  try {
    child = spawnReviewed(job, job.pack.command.executable, job.pack.command.args, spawnImpl);
  } catch (error) {
    failJob(job, error?.code === 'ENOENT' ? 'runtime-command-not-found' : 'model-pack-start-failed');
    return;
  }
  activeChildren.set(job.id, child);
  job.status = 'downloading';
  child.once('error', (error) => {
    failJob(job, error?.code === 'ENOENT' ? 'runtime-command-not-found' : 'model-pack-process-error');
  });
  child.once('exit', (code) => {
    job.status = Number(code) === 0 ? 'completed' : 'failed';
    job.finishedAt = Date.now();
    job.error = Number(code) === 0 ? '' : 'model-pack-download-failed';
    activeChildren.delete(job.id);
  });
}

function beginPreflight(job, spawnImpl) {
  const preflight = job.pack.preflight;
  let child;
  try {
    child = spawnReviewed(job, preflight.executable, preflight.args, spawnImpl, { captureOutput: true });
  } catch (error) {
    failJob(job, error?.code === 'ENOENT' ? 'runtime-command-not-found' : 'model-pack-preflight-failed');
    return;
  }
  activeChildren.set(job.id, child);
  job.status = 'checking-runtime';
  let output = '';
  const collect = (chunk) => {
    if (output.length >= PREFLIGHT_OUTPUT_LIMIT) return;
    output += String(chunk || '').slice(0, PREFLIGHT_OUTPUT_LIMIT - output.length);
  };
  child.stdout?.on?.('data', collect);
  child.stderr?.on?.('data', collect);
  child.once('error', (error) => {
    failJob(job, error?.code === 'ENOENT' ? 'runtime-command-not-found' : 'model-pack-preflight-failed');
  });
  child.once('exit', (code) => {
    activeChildren.delete(job.id);
    if (job.status === 'failed') return;
    if (Number(code) !== 0 || !clean(output, PREFLIGHT_OUTPUT_LIMIT)) {
      failJob(job, 'comfyui-workspace-unresolved');
      return;
    }
    beginDownload(job, spawnImpl);
  });
}

export function startEonLocalAiReviewedModelPack(packId = '', { spawnImpl = spawn } = {}) {
  prune();
  const pack = getEonLocalAiReviewedModelPack(clean(packId, 100));
  if (!pack) return Object.freeze({ ok: false, error: 'model-pack-not-allowlisted' });
  const existing = [...jobs.values()].find((row) => row.pack.id === pack.id && ['starting', 'checking-runtime', 'downloading'].includes(row.status));
  if (existing) return publicJob(existing);

  const id = randomBytes(18).toString('base64url');
  const job = { id, pack, status: 'starting', startedAt: Date.now(), finishedAt: 0, error: '' };
  jobs.set(id, job);
  if (pack.preflight?.executable && pack.preflight?.args?.length) beginPreflight(job, spawnImpl);
  else beginDownload(job, spawnImpl);
  return publicJob(job);
}

export function readEonLocalAiReviewedModelPackJob(jobId = '') {
  prune();
  const job = jobs.get(clean(jobId, 120));
  return job ? publicJob(job) : Object.freeze({ ok: false, error: 'model-pack-job-not-found' });
}

export function stopEonLocalAiModelPackJobs() {
  for (const child of activeChildren.values()) {
    try { child.kill(); } catch {}
  }
  activeChildren.clear();
}

export function validateEonLocalAiModelPackManager() {
  const errors = [];
  for (const id of ['ollama-gemma3-270m', 'ollama-gemma3-1b', 'lmstudio-qwen2.5-0.5b-q4', 'comfyui-sd15-fp16-starter']) {
    const pack = getEonLocalAiReviewedModelPack(id);
    if (!pack) errors.push(`missing:${id}`);
    if (!pack?.command?.executable || !pack?.command?.args?.length) errors.push(`invalid-command:${id}`);
    if (pack?.preflight && (!pack.preflight.executable || !pack.preflight.args?.length)) errors.push(`invalid-preflight:${id}`);
  }
  return Object.freeze(errors);
}
