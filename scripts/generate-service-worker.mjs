#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const EON_SERVICE_WORKER_SOURCE = 'service-worker/eonapp-service-worker.js';
export const EON_SERVICE_WORKER_OUTPUTS = Object.freeze(['sw.js', 'public/sw.js']);

export function generateEonServiceWorker({ root = ROOT } = {}) {
  const sourcePath = path.join(root, EON_SERVICE_WORKER_SOURCE);
  const source = readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n');
  if (!source.includes('Canonical generated Service Worker source — A15 I22')) throw new Error('canonical-service-worker-marker-missing');
  const sha256 = createHash('sha256').update(source).digest('hex');
  for (const relative of EON_SERVICE_WORKER_OUTPUTS) {
    const output = path.join(root, relative);
    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, source, 'utf8');
  }
  return Object.freeze({ source: EON_SERVICE_WORKER_SOURCE, outputs: EON_SERVICE_WORKER_OUTPUTS, bytes: Buffer.byteLength(source), sha256 });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const receipt = generateEonServiceWorker();
  console.log(`[service-worker] generated ${receipt.outputs.length} identical outputs from ${receipt.source} (${receipt.sha256.slice(0, 12)}).`);
}
