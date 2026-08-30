#!/usr/bin/env node
/** W281-A0 — source-only hosted-provider lifecycle/compatibility gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W281_AI_PROVIDER_LIFECYCLE_SCHEMA,
  buildW281ProviderLifecycleSnapshot,
  validateW281AiProviderLifecycleBoard
} from '../config/w281-ai-provider-lifecycle-contract.mjs';
import {
  ACTIVE_HOSTED_PROVIDER_IDS,
  AI_PROVIDER_CONTRACTS,
  AI_PROVIDER_REVIEW_BOARD
} from '../config/ai-api-contracts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOARD_PATH = 'release-evidence/W281_AI_PROVIDER_LIFECYCLE_SOURCE_READINESS_2026-06-25/W281_BOARD.json';

function read(root, relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }

export function runW281AiProviderLifecycleGate(root = ROOT) {
  const errors = [];
  const board = JSON.parse(read(root, BOARD_PATH));
  errors.push(...validateW281AiProviderLifecycleBoard(board).errors);
  const snapshot = buildW281ProviderLifecycleSnapshot();
  const runtime = read(root, 'assets/js/chat/ai-runtime.js');
  const freeAiSetup = read(root, 'assets/js/free-ai-power-page.js');
  const onboarding = read(root, 'assets/js/onboarding-page.js');
  const plan = read(root, 'docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md');
  const packageJson = JSON.parse(read(root, 'package.json'));

  if (snapshot.schema !== W281_AI_PROVIDER_LIFECYCLE_SCHEMA || snapshot.scope !== 'source-only') errors.push('W281 lifecycle snapshot schema/scope drifted.');
  if (snapshot.remoteCallsMade !== false || snapshot.userActionRequired !== true) errors.push('W281 lifecycle snapshot must remain source-only and user-action-gated.');
  if (snapshot.activeProviders.length !== ACTIVE_HOSTED_PROVIDER_IDS.length) errors.push('W281 lifecycle snapshot does not enumerate the active provider registry exactly.');
  for (const row of snapshot.activeProviders) {
    const contract = AI_PROVIDER_CONTRACTS[row.id];
    const review = AI_PROVIDER_REVIEW_BOARD[row.id];
    if (!contract || !review) errors.push(`W281 provider lifecycle is missing contract/review data for ${row.id}.`);
    if (row.transport !== 'https' || row.executionPolicy !== 'byok-only' || row.readinessProof !== contract?.readinessProof) errors.push(`W281 provider lifecycle safety contract drifted for ${row.id}.`);
    if (row.reviewStatus !== 'static-contract-reviewed' || row.liveAccountProof !== 'required-on-user-action') errors.push(`W281 provider lifecycle review boundary drifted for ${row.id}.`);
    if (!/^https:\/\//.test(String(contract?.baseUrl || '')) || !/^https:\/\//.test(String(contract?.modelsUrl || '')) || !/^https:\/\//.test(String(contract?.officialDocs || ''))) errors.push(`W281 provider URLs must remain explicit HTTPS contracts for ${row.id}.`);
  }
  if (!/verifyProviderReadiness/.test(runtime) || !/verifyProviderReadiness/.test(freeAiSetup) || !/verifyProviderReadiness/.test(onboarding)) errors.push('W281 runtime and provider setup surfaces must retain user-initiated provider readiness verification.');
  if (!/W281 \| AI provider lifecycle and compatibility operations \| \*\*W281-A0 source baseline complete/.test(plan)) errors.push('Canonical plan must retain the W281-A0 source baseline and pending-evidence boundary.');
  if (!packageJson.scripts?.['qa:w281-ai-provider-lifecycle']) errors.push('package.json is missing the W281 QA script.');

  const report = {
    schema: 'eonapp.w281.ai-provider-lifecycle-source-gate-report.v1',
    wave: 'W281-A0',
    ok: errors.length === 0,
    activeHostedProviderCount: snapshot.activeProviders.length,
    interpretation: 'PASS proves static registry/review/lifecycle consistency only. It is not a provider-account, API, billing, quota, model, CORS, inference, latency, monitoring or launch result.',
    errors
  };
  // Release aggregators use this gate as a read-only authority.  Keep the
  // standalone QA receipt, but never let that invocation mutate its caller's
  // worktree and invalidate the enclosing clean-tree check.
  if (process.env.EONAPP_GATE_WRITE_EVIDENCE !== '0') {
    const artifactDir = path.join(root, 'artifacts', 'w281-ai-provider-lifecycle-gate');
    fs.mkdirSync(artifactDir, { recursive: true });
    fs.writeFileSync(path.join(artifactDir, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

function main() {
  const report = runW281AiProviderLifecycleGate();
  if (!report.ok) { console.error(JSON.stringify(report, null, 2)); return 1; }
  console.log(`W281 AI provider lifecycle source gate passed: ${report.activeHostedProviderCount} finite BYOK provider contracts remain review-first.`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
