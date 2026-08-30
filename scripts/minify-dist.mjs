#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

async function listFiles(dir, output = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    const normalized = absolute.split(path.sep).join('/');
    // Source-controlled third-party decoders are immutable deploy assets. Keep
    // their reviewed bytes and licences intact instead of transforming them a
    // second time during distribution minification.
    if (/\/assets\/vendor(?:\/|$)/.test(normalized)) continue;
    if (entry.isDirectory()) await listFiles(absolute, output);
    else if (entry.isFile() && /\.(?:js|css)$/i.test(entry.name)) output.push(absolute);
  }
  return output;
}

async function minifyFile(file) {
  const extension = path.extname(file).toLowerCase();
  const source = await fs.readFile(file, 'utf8');
  const before = Buffer.byteLength(source);
  const result = await transform(source, {
    loader: extension === '.css' ? 'css' : 'js',
    minify: true,
    legalComments: 'none',
    charset: 'utf8',
    target: extension === '.css' ? undefined : 'esnext'
  });
  const temp = `${file}.eon-minify-tmp`;
  await fs.writeFile(temp, result.code, 'utf8');
  await fs.rename(temp, file);
  return { before, after: Buffer.byteLength(result.code) };
}

export async function minifyDist({ distDir = path.join(ROOT, 'dist'), concurrency = 4 } = {}) {
  const files = await listFiles(distDir);
  let cursor = 0;
  let beforeBytes = 0;
  let afterBytes = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, files.length || 1)) }, async () => {
    while (cursor < files.length) {
      const index = cursor++;
      const result = await minifyFile(files[index]);
      beforeBytes += result.before;
      afterBytes += result.after;
    }
  });
  await Promise.all(workers);
  return {
    schema: 'eon.build.serial-minifier.v1',
    files: files.length,
    beforeBytes,
    afterBytes,
    savedBytes: beforeBytes - afterBytes,
    savedPercent: beforeBytes ? Math.round((1 - afterBytes / beforeBytes) * 10000) / 100 : 0
  };
}

if (path.resolve(process.argv[1] || '') === __filename) {
  const report = await minifyDist({ distDir: process.argv[2] ? path.resolve(process.argv[2]) : undefined });
  console.log(JSON.stringify(report, null, 2));
}
