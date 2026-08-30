#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import {
  W142_BLOCKED_COPY_PATTERNS,
  W142_CREATOR_SAFETY_COPY_SCHEMA,
  W142_CREATOR_SAFETY_RECEIPT_KEY,
  W142_REQUIRED_CREATOR_GUARDRAILS,
  assertW142CreatorStudioAudit,
  buildW142CreatorStudioAudit,
  getW142RemainingPhaseSummary,
  recordW142CreatorSafetyReceipt
} from '../assets/js/utils/creator-studio-safety-copy.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

class MemoryStorage {
  constructor(seed = {}) { this.store = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)])); }
  get length() { return this.store.size; }
  key(index) { return Array.from(this.store.keys())[index] || null; }
  getItem(key) { return this.store.has(String(key)) ? this.store.get(String(key)) : null; }
  setItem(key, value) { this.store.set(String(key), String(value)); }
  toObject() { return Object.fromEntries(this.store.entries()); }
}

const html = read('creator-studio.html');
const pageJs = read('assets/js/creator-studio-page.js');
const utility = read('assets/js/utils/creator-studio-safety-copy.js');
const css = read('assets/css/creator-studio.css');
const pkg = JSON.parse(read('package.json'));
const audit = buildW142CreatorStudioAudit({ html, pageJs });
const storage = new MemoryStorage();
const receipt = recordW142CreatorSafetyReceipt(storage, { audit });
const remaining = getW142RemainingPhaseSummary();

try { assertW142CreatorStudioAudit(audit); } catch (error) { failures.push(error.message); }

assert(W142_BLOCKED_COPY_PATTERNS.length >= 7, 'W142 blocked copy pattern registry is incomplete');
assert(W142_REQUIRED_CREATOR_GUARDRAILS.length >= 6, 'W142 guardrail registry is incomplete');
assert(/data-w142-creator-safety-proof="true"/.test(html), 'Creator Studio missing W142 safety proof card');
assert(/Creator safety/.test(html), 'Creator Studio missing creator safety heading');
assert(/Review-first Pipeline/.test(html) && /Review-first Pipeline/.test(pageJs), 'pipeline is not review-first in HTML and JS');
assert(/Review & Post/.test(html) && /Review & Post/.test(pageJs), 'Post Now copy not replaced with Review & Post');
assert(/AI-assisted/.test(html), 'AI powered badge not changed to AI-assisted');
assert(/Draft 5 Ideas/.test(html) && /Draft Script/.test(html) && /Draft Image/.test(html), 'draft-first creator button copy is incomplete');
assert(/Public Landscape Notes/.test(html), 'private competitor-intel copy not replaced by public landscape notes');
assert(/Queue only until manual review/.test(html), 'auto-publish option not replaced by manual-review queue option');
assert(/recordW142CreatorSafetyReceipt\(localStorage/.test(pageJs), 'Creator Studio page does not record W142 receipt');
assert(/buildW142CreatorStudioAudit/.test(pageJs), 'Creator Studio page does not build W142 audit');
assert(/cs-safety-proof/.test(css), 'Creator Studio CSS missing W142 proof styling');
assert(receipt.schema === W142_CREATOR_SAFETY_COPY_SCHEMA && receipt.key === W142_CREATOR_SAFETY_RECEIPT_KEY && receipt.ok === true, 'W142 receipt was not recorded as passing');
assert(String(storage.getItem(W142_CREATOR_SAFETY_RECEIPT_KEY) || '').includes('secretValuesIncluded'), 'W142 receipt was not written to storage');
assert(remaining.creatorSafetyDone === true && remaining.dataSurvivalDone === true, 'W142 remaining phase summary must mark safety and data survival done');
assert(!remaining.phases.some((phase) => phase.id === 'W142'), 'W142 must not remain in unfinished phases after W142 completion');
for (const id of ['W143', 'W144', 'W146', 'W147', 'W148']) assert(remaining.phases.some((phase) => phase.id === id), `remaining phases missing ${id}`);
assert(Boolean(pkg.scripts?.['qa:w142-creator-studio-safety-copy']), 'package.json missing W142 QA script');
assert(Boolean(pkg.scripts?.['qa:w121-w142-visual-overhaul']), 'package.json missing W142 cumulative QA script');

const stats = {
  schema: W142_CREATOR_SAFETY_COPY_SCHEMA,
  ok: failures.length === 0,
  score: failures.length ? 0 : 100,
  generatedAt: new Date().toISOString(),
  blockedPatternCount: W142_BLOCKED_COPY_PATTERNS.length,
  guardrailCount: W142_REQUIRED_CREATOR_GUARDRAILS.length,
  audit,
  receipt,
  remainingPhases: remaining.phases,
  failures
};
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w142-creator-studio-safety-copy-stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts', 'W142_CREATOR_STUDIO_SAFETY_COPY_STATS_2026-06-13.json'), `${JSON.stringify(stats, null, 2)}\n`);

if (failures.length) {
  console.error('[W142] Creator Studio safety/copy cleanup failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`[W142] Creator Studio safety/copy cleanup passed (${stats.score}/100): ${stats.guardrailCount} guardrails, ${stats.blockedPatternCount} blocked patterns, review-first proof recorded.`);
