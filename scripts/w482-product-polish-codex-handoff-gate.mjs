#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W482_PRODUCT_POLISH_CODEX_HANDOFF_CONTRACT, validateW482ProductPolishCodexHandoffContract } from '../config/w482-product-polish-codex-handoff-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exists = (file) => existsSync(path.join(root, file));
const read = (file) => readFileSync(path.join(root, file), 'utf8');

export function buildW482CodexHandoffPrompt() {
  const c = W482_PRODUCT_POLISH_CODEX_HANDOFF_CONTRACT;
  return `# Codex handoff — W479-R through W482 source patch\n\nUse this package as a targeted source patch only. Do not overwrite current main.\n\n## Required local command\n\n\`${c.finalLocalCommands[0]}\`\n\n## Codex must do\n\n${c.codexMustDo.map((item) => `- ${item}`).join('\n')}\n\n## Codex must not do\n\n${c.codexMustNotDo.map((item) => `- ${item}`).join('\n')}\n\n## Product polish surfaces to verify\n\n${c.polishSurfaces.map((item) => `- ${item}`).join('\n')}\n\nReturn a single evidence ZIP plus PASS / FIX REQUIRED / ENVIRONMENT BLOCKED. Production certification and owner GO are not granted by this source bundle.`;
}

export function inspectW482ProductPolishCodexHandoff({ writeArtifact = false } = {}) {
  const checks = [];
  const check = (id, value, detail) => {
    checks.push({ id, pass: Boolean(value), detail });
    assert.equal(Boolean(value), true, `${id}: ${detail}`);
  };
  const pkg = JSON.parse(read('package.json'));
  const roadmap = read('NEXT_CHAT_CURRENT/MASTER_EXECUTION_ROADMAP_W479_R_TO_W482.md');
  const changed = read('CHANGED_FILES_W4795_W479M0_CODEX_READY_2026-07-02.md');
  const prompt = buildW482CodexHandoffPrompt();

  check('required-files', [
    'config/w482-product-polish-codex-handoff-contract.mjs',
    'scripts/w482-product-polish-codex-handoff-gate.mjs',
    'tests/unit/w482-product-polish-codex-handoff.test.mjs',
    'CHANGED_FILES_W4795_W479M0_CODEX_READY_2026-07-02.md'
  ].every(exists), 'W482 contract, gate, tests and change log exist');
  check('contract-valid', validateW482ProductPolishCodexHandoffContract().length === 0, 'W482 contract validates');
  check('script-wired', pkg.scripts['qa:w482-product-polish-codex-handoff'] === 'node scripts/w482-product-polish-codex-handoff-gate.mjs && node --test tests/unit/w482-product-polish-codex-handoff.test.mjs', 'package.json exposes W482 gate');
  check('verify-chain-final', /qa:w482-product-polish-codex-handoff/.test(pkg.scripts['verify:w4795-codex-ready-source'] || ''), 'final verify chain includes W482 handoff gate');
  check('prompt-current-main-safe', /Do not overwrite current main/.test(prompt) && /targeted source patch/i.test(prompt), 'handoff prompt protects current main');
  check('prompt-blocks-activation', /activate-dodo-checkout/.test(prompt) && /activate-direct-social-oauth/.test(prompt) && /activate-local-image-video-generation/.test(prompt), 'handoff prompt blocks unproved activation');
  check('roadmap-product-polish', /W482 — Broad product redesign and polish/.test(roadmap) && /mobile-first navigation/.test(roadmap), 'roadmap retains broad product polish intent');
  check('change-log-covers-new-waves', /W479\.5/.test(changed) && /W479-M0/.test(changed) && /W481/.test(changed), 'change log covers W479.5, W479-M0 and W481 work');
  check('truth-source-only', W482_PRODUCT_POLISH_CODEX_HANDOFF_CONTRACT.truth.sourceBundleIsDeployment === false && W482_PRODUCT_POLISH_CODEX_HANDOFF_CONTRACT.truth.sourceBundleIsProductionCertification === false, 'W482 truth remains source-only');

  const result = Object.freeze({
    schema: 'eon.product.polish-codex-handoff-gate.w482.v1',
    wave: 'W482',
    status: 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    prompt,
    limitations: Object.freeze(['W482 packages source polish and Codex instructions only. It does not deploy, certify production, prove physical devices, activate payments, activate local media generation, or approve direct social publishing.'])
  });
  if (writeArtifact) {
    const dir = path.join(root, 'artifacts', 'w482-product-polish-codex-handoff');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'CODEX_HANDOFF_PROMPT.md'), `${prompt}\n`);
    writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = inspectW482ProductPolishCodexHandoff({ writeArtifact: true });
  process.stdout.write(`W482 product polish Codex handoff gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
