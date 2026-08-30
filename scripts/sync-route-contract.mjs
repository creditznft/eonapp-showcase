#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCloudflareRedirects, validateRouteContract } from '../config/route-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const errors = validateRouteContract();
if (errors.length) throw new Error(`Invalid route contract:\n${errors.map((error) => `- ${error}`).join('\n')}`);

const rendered = renderCloudflareRedirects();
for (const relative of ['_redirects', 'public/_redirects']) {
  fs.writeFileSync(path.join(ROOT, relative), rendered);
}
console.log(JSON.stringify({ ok: true, generated: ['_redirects', 'public/_redirects'], bytes: Buffer.byteLength(rendered) }, null, 2));
