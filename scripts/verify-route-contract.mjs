#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_ROUTE_ROWS, ROUTE_CONTRACT_VERSION, renderCloudflareRedirects, validateRouteContract } from '../config/route-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const errors = [...validateRouteContract()];
const expected = renderCloudflareRedirects();

for (const relative of ['_redirects', 'public/_redirects']) {
  const absolute = path.join(ROOT, relative);
  if (!fs.existsSync(absolute)) {
    errors.push(`Missing ${relative}`);
    continue;
  }
  const actual = fs.readFileSync(absolute, 'utf8');
  if (actual.includes('\r')) errors.push(`${relative} must use LF line endings. Run npm run routes:sync after normalizing checkout attributes.`);
  if (actual !== expected) errors.push(`${relative} is out of sync. Run npm run routes:sync.`);

  const origins = new Set();
  for (const line of actual.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [origin] = trimmed.split(/\s+/);
    if (origins.has(origin)) errors.push(`${relative} declares ${origin} more than once.`);
    origins.add(origin);
  }
}

for (const row of ALL_ROUTE_ROWS) {
  if (row.from.includes('*')) continue;
  if (![200, 301, 404].includes(Number(row.status))) errors.push(`Unexpected status in route row: ${row.from}`);
}

const result = {
  schema: 'eonapp.w217.route-contract-verification.v1',
  version: ROUTE_CONTRACT_VERSION,
  ok: errors.length === 0,
  routeCount: ALL_ROUTE_ROWS.length,
  errors
};
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exit(1);
