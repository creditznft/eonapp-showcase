#!/usr/bin/env node
/** W260-R3 A1 — hosted AI API contract gate. Static proof only; never calls a provider or reads a key. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACTIVE_HOSTED_PROVIDER_IDS,
  AI_API_CONTRACT_SCHEMA,
  AI_PROVIDER_CONTRACTS,
  AI_PROVIDER_REVIEW_BOARD,
  REVIEWED_HOSTED_PROVIDER_IDS,
  isRetiredNvidiaTeamScopedPath
} from '../config/ai-api-contracts.mjs';
import {
  R3A1_AI_API_CHANGE_CONTROL_SCHEMA,
  buildR3A1ApiChangeControlBoard,
  validateR3A1ApiChangeControlBoard
} from '../assets/js/utils/r3a1-ai-api-change-control.js';
import { PROVIDERS } from '../assets/js/chat/ai-provider-catalog.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRITE_EVIDENCE = process.env.EONAPP_GATE_WRITE_EVIDENCE !== '0';
const BOARD_RELATIVE_PATH = 'release-evidence/R3A1_AI_API_CHANGE_CONTROL_2026-06-25/AI_API_CONTRACT_BOARD.json';
const ACTIVE_ROOTS = ['assets', 'functions', 'scripts', 'config', 'platform-backend', 'telegram'];
const IGNORED_SEGMENTS = new Set(['archive', 'evidence', 'EVIDENCE', 'HANDOFF', 'AUDIT', 'release-evidence', 'CodexAuditPack', 'CodexDocs', 'node_modules', 'dist', '.git']);
const TEXT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.json', '.html', '.md']);
const DORMANT_HOSTED_PROVIDER_IDS = Object.freeze(['cohere', 'anthropic', 'nvidia', 'sambanova']);
const VOLATILE_PROVIDER_MARKETING = /\b(?:free tier|free credit|credits?\/month|fastest free|most capable|400m tokens|1000 free credits|100\+ models|200\+ models|1000s of models|very affordable)\b/i;

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

function walkFiles(rootRelative) {
  const root = path.join(ROOT, rootRelative);
  const rows = [];
  if (!fs.existsSync(root)) return rows;
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (IGNORED_SEGMENTS.has(entry.name)) continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) rows.push(absolute);
    }
  };
  visit(root);
  return rows;
}

function activeSourceFiles() {
  return ACTIVE_ROOTS.flatMap(walkFiles);
}

function verifyRuntimeProviderEntries(errors) {
  for (const id of ACTIVE_HOSTED_PROVIDER_IDS) {
    const contract = AI_PROVIDER_CONTRACTS[id];
    const provider = PROVIDERS[id];
    if (!provider || provider.enabled === false) {
      errors.push(`active hosted provider missing or disabled in runtime catalog: ${id}.`);
      continue;
    }
    if (provider.defaultEndpoint !== contract.baseUrl) {
      errors.push(`runtime base URL drift: ${id}.`);
    }
    if (provider.modelsUrl !== contract.modelsUrl) {
      errors.push(`runtime model-list URL drift: ${id}.`);
    }
    if (provider.requiresApiKey !== true) {
      errors.push(`hosted provider must remain explicit BYOK: ${id}.`);
    }
  }
  const runtimeEnabledHosted = Object.values(PROVIDERS)
    .filter((provider) => provider?.enabled !== false && provider?.requiresApiKey === true && Boolean(provider?.modelsUrl))
    .map((provider) => provider.id)
    .sort();
  const governedActiveHosted = [...ACTIVE_HOSTED_PROVIDER_IDS].sort();
  if (JSON.stringify(runtimeEnabledHosted) !== JSON.stringify(governedActiveHosted)) {
    errors.push(`runtime active hosted-provider set drift: runtime=${runtimeEnabledHosted.join(',')} governed=${governedActiveHosted.join(',')}.`);
  }
  for (const id of DORMANT_HOSTED_PROVIDER_IDS) {
    if (PROVIDERS[id]?.enabled !== false) errors.push(`dormant hosted provider must stay disabled until separately re-reviewed: ${id}.`);
  }
}

function findRetiredNvidiaPaths() {
  const rows = [];
  for (const absolute of activeSourceFiles()) {
    const text = fs.readFileSync(absolute, 'utf8');
    const relative = path.relative(ROOT, absolute).replace(/\\/g, '/');
    const lineRows = text.split(/\r?\n/);
    lineRows.forEach((line, index) => {
      if (isRetiredNvidiaTeamScopedPath(line)) rows.push(`${relative}:${index + 1}`);
    });
  }
  return rows;
}

function main() {
  const errors = [];
  const runtimeSource = read('assets/js/chat/ai-runtime.js');
  const freeAiSource = read('assets/js/free-ai-power-page.js');
  const onboardingSource = read('assets/js/onboarding-page.js');
  const modelDiscoverySource = read('assets/js/utils/ai-model-discovery.js');
  const boardPath = path.join(ROOT, BOARD_RELATIVE_PATH);
  let board = null;
  try { board = JSON.parse(fs.readFileSync(boardPath, 'utf8')); } catch { errors.push('W260-R3 A1 AI API contract board is missing or invalid JSON.'); }

  verifyRuntimeProviderEntries(errors);
  if (PROVIDERS.nvidia?.defaultEndpoint !== 'https://integrate.api.nvidia.com/v1') errors.push('NVIDIA API Catalog/NIM runtime base URL is missing.');
  if (PROVIDERS.nvidia?.modelsUrl !== 'https://integrate.api.nvidia.com/v1/models') errors.push('NVIDIA API Catalog/NIM model-discovery URL is missing.');
  if (!freeAiSource.includes('verifyProviderReadiness')) errors.push('Free AI setup must use live model-list verification instead of fixed model probes.');
  if (!freeAiSource.includes('PROVIDER_GUIDES.filter') || !freeAiSource.includes('VERIFIED_HOSTED_PROVIDER_IDS.has')) errors.push('Free AI setup must derive rendered hosted providers from the maintained active provider set.');
  if (/testModel\s*:/.test(freeAiSource)) errors.push('Free AI setup must not keep hard-coded provider test models.');
  if (VOLATILE_PROVIDER_MARKETING.test(freeAiSource)) errors.push('Free AI setup must not hard-code volatile provider quota, credit, speed or pricing marketing claims.');
  if (!onboardingSource.includes('verifyProviderReadiness')) errors.push('Onboarding provider checks must use authenticated model-list verification.');
  if (/testUrl\s*:|testBody\s*:/.test(onboardingSource)) errors.push('Onboarding must not retain fixed provider probe URLs or fixed test models.');
  if (VOLATILE_PROVIDER_MARKETING.test(onboardingSource)) errors.push('Onboarding must not hard-code volatile provider quota, credit, speed or pricing marketing claims.');
  if (!onboardingSource.includes('runtimeProvider?.enabled === false') && !onboardingSource.includes('runtimeProvider.enabled === false')) errors.push('Onboarding must hide or reject runtime-disabled hosted providers.');
  if (!freeAiSource.includes('LEGACY_DISABLED_PROVIDER_KEY_IDS')) errors.push('Free AI Clear All must include legacy disabled provider-key IDs.');
  if (/https:\/\/api\.deepseek\.com\/v1/.test(runtimeSource) || /https:\/\/api\.deepseek\.com\/v1/.test(modelDiscoverySource)) {
    errors.push('DeepSeek current runtime/discovery must use the documented non-/v1 base URL.');
  }
  if (AI_PROVIDER_CONTRACTS.deepseek.baseUrl !== 'https://api.deepseek.com' || AI_PROVIDER_CONTRACTS.deepseek.modelsUrl !== 'https://api.deepseek.com/models') {
    errors.push('DeepSeek API contract must use the current documented base and model-list paths.');
  }
  for (const id of REVIEWED_HOSTED_PROVIDER_IDS) {
    const review = AI_PROVIDER_REVIEW_BOARD[id];
    if (!review || review.status !== 'static-contract-reviewed' || review.liveAccountProof !== 'required-on-user-action') {
      errors.push(`AI provider review-board drift: ${id}.`);
    }
  }
  const retiredPaths = findRetiredNvidiaPaths();
  if (retiredPaths.length) errors.push(`Deprecated NVIDIA NGC team-scoped API path(s) found: ${retiredPaths.join(', ')}`);
  const boardValidation = validateR3A1ApiChangeControlBoard(board || {});
  errors.push(...boardValidation.errors);

  const report = {
    schema: 'eonapp.r3a1.ai-api-contract-gate-report.v1',
    ok: errors.length === 0,
    contractSchema: AI_API_CONTRACT_SCHEMA,
    changeControlSchema: R3A1_AI_API_CHANGE_CONTROL_SCHEMA,
    activeHostedProviderCount: ACTIVE_HOSTED_PROVIDER_IDS.length,
    reviewBoardProviderCount: Object.keys(AI_PROVIDER_REVIEW_BOARD).length,
    reviewedHostedProviderCount: REVIEWED_HOSTED_PROVIDER_IDS.length,
    dormantHostedProviderIds: DORMANT_HOSTED_PROVIDER_IDS,
    deepseekContract: { baseUrl: AI_PROVIDER_CONTRACTS.deepseek.baseUrl, modelsUrl: AI_PROVIDER_CONTRACTS.deepseek.modelsUrl },
    nvidiaRuntimeBaseUrl: AI_PROVIDER_CONTRACTS.nvidia.baseUrl,
    deprecatedNvidiaTeamScopedPaths: retiredPaths,
    providerNetworkCallsMade: false,
    proofLimit: 'Static source/contract validation only. User-owned keys must be verified in Vault on a user action; no account, quota, billing, CORS or inference claim is made.',
    errors
  };
  if (WRITE_EVIDENCE) {
    fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'artifacts', 'R3A1_AI_API_CONTRACT_GATE_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  if (!report.ok) {
    console.error(JSON.stringify(report, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`W260-R3 A1 AI API contract gate: PASS (${report.activeHostedProviderCount} active browser BYOK providers / ${report.reviewedHostedProviderCount} reviewed contracts; NVIDIA team-scoped NGC paths absent).`);
  }
}

main();
