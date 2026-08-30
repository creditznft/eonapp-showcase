/** W517 ephemeral evidence writer: verification may emit receipts, never tracked source drift. */
import fs from 'node:fs';
import path from 'node:path';
import { W517_EPHEMERAL_EVIDENCE_ROOT } from '../config/w517-source-convergence-contract.mjs';

const toPosix = (value) => String(value || '').replaceAll('\\', '/');

export function resolveW517EvidencePath(relativePath, {
  root = process.cwd(),
  evidenceRoot = process.env.EONAPP_EVIDENCE_OUTPUT_DIR || W517_EPHEMERAL_EVIDENCE_ROOT
} = {}) {
  const normalizedRelative = toPosix(relativePath).replace(/^\/+/, '');
  if (!normalizedRelative || normalizedRelative.split('/').some((segment) => segment === '..' || !segment)) {
    throw new Error('W517 evidence path must be a non-empty relative path without traversal.');
  }
  const base = path.resolve(root, evidenceRoot);
  const target = path.resolve(base, normalizedRelative);
  if (!target.startsWith(`${base}${path.sep}`)) throw new Error('W517 evidence path escaped the configured evidence root.');
  return target;
}

export function writeW517EphemeralJson(relativePath, value, options = {}) {
  const target = resolveW517EvidencePath(relativePath, options);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
  return toPosix(path.relative(options.root || process.cwd(), target));
}
