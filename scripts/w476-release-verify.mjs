#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const gates = [
  ['storage-gateway', ['node', '--test', 'tests/unit/w476-storage-gateway.test.mjs']],
  ['portable-state-contract', ['node', '--test', 'tests/unit/w476-portable-state-contract.test.mjs']],
  ['service-worker-contract', ['node', '--test', 'tests/unit/w476-service-worker-contract.test.mjs']],
  ['local-ai-preference', ['node', '--test', 'tests/unit/w476-local-ai-preference.test.mjs']],
  ['local-ai-provider-compatibility', ['node', 'scripts/w476-local-ai-provider-compatibility-gate.mjs']],
  ['local-ai-provider-contract-tests', ['node', '--test', 'tests/unit/w476-ai-api-and-local-browser-contract.test.mjs']],
  ['ai-api-contract-board', ['node', 'scripts/write-r3a1-ai-api-contract-board.mjs']],
  ['ai-api-contract-gate', ['node', 'scripts/r3a1-ai-api-contract-gate.mjs']],
  ['analytics-bridge', ['node', '--test', 'tests/unit/w476-analytics-bridge.test.mjs']],
  ['api-surface-contract', ['node', 'scripts/w476-api-surface-contract-gate.mjs']],
  ['api-surface-contract-tests', ['node', '--test', 'tests/unit/w476-api-surface-contract.test.mjs']],
  ['csp-reporting-tests', ['node', '--test', 'tests/unit/w476-csp-reporting.test.mjs']],
  ['release-evidence-contract', ['node', 'scripts/w476-a6-release-evidence-gate.mjs']],
  ['release-evidence-tests', ['node', '--test', 'tests/unit/w476-a6-release-evidence.test.mjs']],
  ['production-browser-proof-source-gate', ['node', 'scripts/w476-b-production-proof-gate.mjs']],
  ['production-browser-proof-source-tests', ['node', '--test', 'tests/unit/w476-b-production-proof.test.mjs']],
  ['syntax-api-surface-contract', ['node', '--check', 'config/w476-api-surface-contract.mjs']],
  ['syntax-release-evidence-contract', ['node', '--check', 'config/w476-a6-release-evidence-contract.mjs']],
  ['syntax-api-surface-gate', ['node', '--check', 'scripts/w476-api-surface-contract-gate.mjs']],
  ['syntax-release-evidence-gate', ['node', '--check', 'scripts/w476-a6-release-evidence-gate.mjs']],
  ['syntax-supplychain-audit', ['node', '--check', 'scripts/w476-a6-supplychain-audit.mjs']],
  ['syntax-w476b-proof-contract', ['node', '--check', 'config/w476-b-production-proof-contract.mjs']],
  ['syntax-w476b-proof-runner', ['node', '--check', 'scripts/w476-b-production-proof.mjs']],
  ['syntax-w476b-proof-gate', ['node', '--check', 'scripts/w476-b-production-proof-gate.mjs']],
  ['syntax-csp-report', ['node', '--check', 'functions/csp-report.js']],
  ['syntax-storage-gateway', ['node', '--check', 'assets/js/utils/storage-gateway.js']],
  ['syntax-storage-compat-loader', ['node', '--check', 'assets/js/localStorage-shim.js']],
  ['syntax-storage-preferences', ['node', '--check', 'assets/js/utils/storage.js']],
  ['syntax-portable-state-contract', ['node', '--check', 'config/w476-portable-state-contract.mjs']],
  ['syntax-vault-lifecycle', ['node', '--check', 'assets/js/vault/eon-vault-lifecycle.js']],
  ['syntax-root-service-worker', ['node', '--check', 'sw.js']],
  ['syntax-public-service-worker', ['node', '--check', 'public/sw.js']],
  ['syntax-local-runtime-status', ['node', '--check', 'assets/js/local-ai/local-runtime-status.js']],
  ['syntax-local-ai-browser-contract', ['node', '--check', 'config/local-ai-browser-contract.mjs']],
  ['syntax-ai-api-contracts', ['node', '--check', 'config/ai-api-contracts.mjs']],
  ['syntax-ai-runtime', ['node', '--check', 'assets/js/chat/ai-runtime.js']],
  ['syntax-local-ai-page', ['node', '--check', 'assets/js/local-ai/local-ai-page.js']],
  ['syntax-local-ai-csp-sync', ['node', '--check', 'scripts/sync-local-ai-csp.mjs']],
  ['syntax-ai-api-contract-board-writer', ['node', '--check', 'scripts/write-r3a1-ai-api-contract-board.mjs']],
  ['syntax-analytics-bridge', ['node', '--check', 'assets/js/utils/analytics-bridge.js']],
  ['syntax-google-analytics-compat', ['node', '--check', 'assets/js/utils/google-analytics.js']],
  ['syntax-profile-page', ['node', '--check', 'assets/js/profile-page.js']]
];

const results = [];
for (const [name, command] of gates) {
  const startedAt = new Date().toISOString();
  const run = spawnSync(command[0], command.slice(1), { stdio: 'inherit', shell: false });
  const exitCode = typeof run.status === 'number' ? run.status : 1;
  results.push({ name, command: command.join(' '), startedAt, finishedAt: new Date().toISOString(), exitCode });
  if (exitCode !== 0) {
    console.error(`[release:verify] ${name} failed with exit code ${exitCode}`);
    console.error(JSON.stringify({ results }, null, 2));
    process.exit(exitCode);
  }
}
console.log('[release:verify] Current W476-A1 through W476-B source verification gates passed. This is not a production/browser/device certification.');
console.log(JSON.stringify({ results }, null, 2));
