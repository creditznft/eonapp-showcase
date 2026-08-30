#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORT = path.join(ROOT, 'release-evidence', 'INSTITUTIONAL_AI_FINAL_LOCAL_CERTIFICATION.json');
const BASE_COMMIT = '016e306fe9050a93b17f020a0e9792071dd2ce72';
const BASE_TREE = '958fa8e6df22621495bc8e62cd47d146f895c72f';

const nodeTest = (...files) => [process.execPath, ['--test', ...files]];
const nodeScript = (file, ...args) => [process.execPath, [file, ...args]];

export const FINAL_CERTIFICATION_TIERS = Object.freeze({
  authority: Object.freeze([
    Object.freeze({ id: 'institutional-source-authority', command: nodeScript('scripts/institutional-ai-v2-gate.mjs') }),
    Object.freeze({ id: 'first-prompt-grounding-authority', command: nodeScript('scripts/w605-ai-grounding-and-output-gate.mjs') }),
    Object.freeze({ id: 'local-connection-authority', command: nodeScript('scripts/a15-i12-local-connection-authority-gate.mjs') }),
    Object.freeze({ id: 'a15-boundary-enforcement', command: nodeScript('scripts/a15-boundary-gate.mjs', '--enforce') })
  ]),
  core: Object.freeze([
    Object.freeze({ id: 'institutional-core-tests', command: nodeTest(
      'tests/unit/institutional-ai-v2.test.mjs',
      'tests/unit/institutional-ai-red-team.test.mjs',
      'tests/unit/institutional-ai-city-viral-retention.test.mjs',
      'tests/unit/institutional-hosted-music-byok.test.mjs',
      'tests/unit/institutional-hosted-media-byok.test.mjs',
      'tests/unit/institutional-creator-iteration.test.mjs',
      'tests/unit/institutional-eonbot-recent-outcomes.test.mjs'
    ) })
  ]),
  media: Object.freeze([
    Object.freeze({ id: 'comfyui-image-authority', command: nodeScript('scripts/w623a-comfyui-local-image-gate.mjs') }),
    Object.freeze({ id: 'real-local-image-authority', command: nodeScript('scripts/w625a-real-local-image-tooling-gate.mjs') }),
    Object.freeze({ id: 'local-video-capability-authority', command: nodeScript('scripts/w625d-local-video-capability-gate.mjs') }),
    Object.freeze({ id: 'real-local-video-contract', command: nodeScript('scripts/w625e-real-local-video-contract-gate.mjs') }),
    Object.freeze({ id: 'local-video-product-workflow', command: nodeScript('scripts/w625f-local-video-product-workflow-gate.mjs') }),
    Object.freeze({ id: 'local-video-efficiency-governor', command: nodeScript('scripts/w625g-local-video-efficiency-governor-gate.mjs') }),
    Object.freeze({ id: 'local-creator-certification-source', command: nodeScript('scripts/w625h-local-creator-certification-gate.mjs') }),
    Object.freeze({ id: 'image-video-local-regression', command: nodeTest(
      'tests/unit/w623a-comfyui-local-image.test.mjs',
      'tests/unit/w625a-real-local-image-tooling.test.mjs',
      'tests/unit/w625b-local-image-workflow-registry.test.mjs',
      'tests/unit/w625c-image-creation-foundation.test.mjs',
      'tests/unit/w625d-local-video-capability.test.mjs',
      'tests/unit/w625e-real-local-video-contract.test.mjs',
      'tests/unit/w625f-local-video-product-workflow.test.mjs',
      'tests/unit/w625g-local-video-efficiency-governor.test.mjs',
      'tests/unit/w625h-local-creator-certification.test.mjs',
      'tests/unit/w626b-creator-companion.test.mjs'
    ) })
  ]),
  retention: Object.freeze([
    Object.freeze({ id: 'activity-center-authority', command: nodeScript('scripts/w434-notification-center-gate.mjs') }),
    Object.freeze({ id: 'city-fairness-authority', command: nodeScript('scripts/w565-city-fairness-safety-gate.mjs') }),
    Object.freeze({ id: 'share-pack-authority', command: nodeScript('scripts/w388a1-eon-share-pack-gate.mjs') }),
    Object.freeze({ id: 'remix-card-authority', command: nodeScript('scripts/w388a2-remix-cards-gate.mjs') }),
    Object.freeze({ id: 'eonbot-shareable-authority', command: nodeScript('scripts/w388a3-eonbot-shareable-gate.mjs') }),
    Object.freeze({ id: 'pwa-asset-policy-authority', command: nodeScript('scripts/w275-pwa-asset-policy-gate.mjs') }),
    Object.freeze({ id: 'retention-viral-pwa-regression', command: nodeTest(
      'tests/unit/w434-notification-center.test.mjs',
      'tests/unit/w565-city-fairness-safety.test.mjs',
      'tests/unit/w388a1-eon-share-pack.test.mjs',
      'tests/unit/w388a2-remix-cards.test.mjs',
      'tests/unit/w388a3-eonbot-shareable.test.mjs',
      'tests/unit/w275-pwa-asset-policy.test.mjs'
    ) })
  ]),
  security: Object.freeze([
    Object.freeze({ id: 'w267-red-team', command: nodeScript('scripts/w267-red-team-source-audit-gate.mjs') }),
    Object.freeze({ id: 'w484-user-facing-red-team', command: nodeScript('scripts/w484-user-facing-red-team-gate.mjs') }),
    Object.freeze({ id: 'direct-job-threat-model', command: nodeScript('scripts/w626a-direct-job-threat-model-gate.mjs') }),
    Object.freeze({ id: 'direct-spending-safety', command: nodeTest('tests/unit/w626g-direct-spending-safety.test.mjs') }),
    Object.freeze({ id: 'security-trust', command: nodeScript('scripts/w214-security-trust-gate.mjs') }),
    Object.freeze({ id: 'security-trust-tests', command: nodeTest('tests/unit/w214-security-trust.test.mjs') }),
    Object.freeze({ id: 'institutional-release-block', command: nodeScript('scripts/w444-institutional-certification-gate.mjs') }),
    Object.freeze({ id: 'institutional-release-block-tests', command: nodeTest('tests/unit/w444-institutional-certification.test.mjs') }),
    Object.freeze({ id: 'historical-code-closure', command: nodeScript('scripts/w487-institutional-code-closure-gate.mjs') }),
    Object.freeze({ id: 'historical-code-closure-tests', command: nodeTest('tests/unit/w487-institutional-code-closure.test.mjs') }),
    Object.freeze({ id: 'hostile-city-machine-score', command: nodeScript('scripts/w758-hostile-red-team-machine-score-gate.mjs') })
  ]),
  hygiene: Object.freeze([
    Object.freeze({ id: 'diff-whitespace', command: ['git', ['diff', '--check']] }),
    Object.freeze({ id: 'final-runner-syntax', command: nodeScript('--check', 'scripts/institutional-ai-final-local-certification.mjs') })
  ])
});

function normalizeTier(value = 'all') {
  const tier = String(value || 'all').trim().toLowerCase();
  if (tier === 'all') return Object.keys(FINAL_CERTIFICATION_TIERS);
  if (!FINAL_CERTIFICATION_TIERS[tier]) throw new Error(`Unknown tier: ${tier}`);
  return [tier];
}

function formatCommand([binary, args]) {
  return [binary, ...(args || [])].map((part) => /\s/.test(part) ? JSON.stringify(part) : part).join(' ');
}

export function getFinalCertificationManifest() {
  return Object.freeze({
    schema: 'eonapp.institutional-ai-final-local-certification.v1',
    baseCommit: BASE_COMMIT,
    baseTree: BASE_TREE,
    tiers: Object.fromEntries(Object.entries(FINAL_CERTIFICATION_TIERS).map(([tier, steps]) => [tier, steps.map((step) => Object.freeze({ id: step.id, command: formatCommand(step.command) }))])),
    externalProofRequired: true,
    productionAuthorizedBySource: false
  });
}

function main() {
  const rawTier = process.argv.find((arg) => arg.startsWith('--tier='))?.slice('--tier='.length) || 'all';
  const selectedTiers = normalizeTier(rawTier);
  const startedAt = Date.now();
  const results = [];

  for (const tier of selectedTiers) {
    console.log(`\n=== Institutional AI final certification: ${tier} ===`);
    for (const step of FINAL_CERTIFICATION_TIERS[tier]) {
      const [binary, args] = step.command;
      const command = formatCommand(step.command);
      console.log(`\n[${tier}] ${step.id}\n$ ${command}`);
      const stepStartedAt = Date.now();
      const run = spawnSync(binary, args, { cwd: ROOT, stdio: 'inherit', env: process.env });
      const status = Number.isInteger(run.status) ? run.status : 1;
      results.push({ tier, id: step.id, command, status, durationMs: Date.now() - stepStartedAt });
      if (status !== 0) console.error(`[${tier}] FAIL ${step.id} (exit ${status})`);
    }
  }

  const failed = results.filter((row) => row.status !== 0);
  const report = {
    ...getFinalCertificationManifest(),
    generatedAt: new Date().toISOString(),
    selectedTiers,
    durationMs: Date.now() - startedAt,
    pass: failed.length === 0,
    externalProofRequired: true,
    productionAuthorizedBySource: false,
    results
  };
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nFinal local certification: ${report.pass ? 'PASS' : 'FAIL'} (${results.length - failed.length}/${results.length} steps).`);
  console.log(`Receipt: ${path.relative(ROOT, REPORT)}`);
  if (failed.length) process.exitCode = 1;
}

const direct = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direct) main();
