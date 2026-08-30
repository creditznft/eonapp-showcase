#!/usr/bin/env node
/** W378 — source-only release/Cloudflare/Codex handover verification. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W378_CLOUDFLARE_CODEX_READINESS_CONTRACT,
  W378_CLOUDFLARE_CODEX_READINESS_SCHEMA
} from '../config/w378-cloudflare-codex-readiness-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function exists(root, relative) {
  return fs.existsSync(path.join(root, relative));
}

function includesEvery(text, values) {
  return values.filter((value) => !text.includes(value));
}

function hasLikelySecretAssignment(text) {
  const patterns = [
    /GOOGLE_OAUTH_CLIENT_SECRET\s*[=:]\s*['"`][A-Za-z0-9_\-]{20,}/,
    /EON_(?:AUTH_SUBJECT_PEPPER|SESSION_SIGNING_KEY|OAUTH_FLOW_SIGNING_KEY)\s*[=:]\s*['"`][A-Za-z0-9_\-]{20,}/,
    /client_secret\s*[=:]\s*['"`][A-Za-z0-9_\-]{20,}/i
  ];
  return patterns.some((pattern) => pattern.test(text));
}

export function inspectW378CloudflareCodexReadiness(root = ROOT) {
  const contract = W378_CLOUDFLARE_CODEX_READINESS_CONTRACT;
  const errors = [];
  for (const relative of contract.requiredFiles) {
    if (!exists(root, relative)) errors.push(`W378 missing required file: ${relative}`);
  }
  if (errors.length) return Object.freeze({ ok: false, errors, sourceOnly: true });

  const packageJson = JSON.parse(read(root, 'package.json'));
  for (const scriptName of contract.requiredPackageScripts) {
    if (!packageJson?.scripts?.[scriptName]) errors.push(`W378 missing package script: ${scriptName}`);
  }
  const currentProgram = String(packageJson?.scripts?.['qa:r4-current-program'] || '');
  for (const required of ['qa:w374-google-oauth-pages-functions', 'qa:w374b-google-identity-onboarding-surfaces', 'qa:r4-apps-foundation', 'qa:r4-comm02-global-commerce', 'qa:w377-institutional-blueprints', 'qa:w378-cloudflare-codex-readiness']) {
    if (!currentProgram.includes(required)) errors.push(`W378 current-program gate must include ${required}.`);
  }

  const ci = read(root, '.github/workflows/ci.yml');
  const preview = read(root, '.github/workflows/preview.yml');
  const deploy = read(root, '.github/workflows/deploy.yml');
  if (!ci.includes('npm run qa:r4-current-program')) errors.push('W378 CI workflow can bypass current program checks.');
  for (const [name, content] of [['Preview', preview], ['Production deploy', deploy]]) {
    for (const missing of includesEvery(content, contract.requiredDeploymentWorkflowMarkers)) errors.push(`W378 ${name} workflow missing marker: ${missing}`);
  }
  for (const [name, content] of [['Preview', preview], ['Production deploy', deploy]]) {
    if (!content.includes('npm run qa:r4-current-program')) errors.push(`W378 ${name} workflow can bypass current program checks.`);
  }
  if (ci.indexOf('npm run qa:r4-current-program') > ci.indexOf('npm run test:unit')) errors.push('W378 CI must run current program checks before the broad unit suite.');
  if (preview.indexOf('npm run qa:r4-current-program') > preview.indexOf('npm run test:unit')) errors.push('W378 Preview must run current program checks before the broad unit suite.');
  if (deploy.indexOf('npm run qa:r4-current-program') > deploy.indexOf('npm run build')) errors.push('W378 Production deploy must run current program checks before build/deploy.');

  const operatorDocs = [
    'docs/W378_CLOUDFLARE_GOOGLE_AUTH_AND_CODEX_HANDOFF_2026-06-26.md',
    'docs/CLOUDFLARE_AI_W378_GOOGLE_AUTH_SETUP_PROMPT_2026-06-26.md',
    'docs/CODEX_W378_MERGE_PREVIEW_PRODUCTION_HANDOFF_2026-06-26.md',
    'CURRENT_HANDOFF_2026-06-26/R4_W378_START_HERE.md',
    'CURRENT_HANDOFF_2026-06-26/R4_W378_CONTINUATION_PROMPT.md',
    'CURRENT_HANDOFF_2026-06-26/R4_W378_FULL_SOURCE_HANDOVER_STATUS.md'
  ];
  const operatorText = operatorDocs.map((relative) => read(root, relative)).join('\n');
  for (const missing of includesEvery(operatorText, contract.requiredRuntimeNames)) errors.push(`W378 operator handover missing runtime name: ${missing}`);
  for (const missing of includesEvery(operatorText, contract.requiredPublicMarkers)) errors.push(`W378 operator handover missing truth marker: ${missing}`);
  if (!/Settings > Bindings > Add > D1 database bindings/.test(operatorText)) errors.push('W378 handover must name the Cloudflare D1 binding dashboard path.');
  if (!/Settings > Variables and Secrets > Add/.test(operatorText)) errors.push('W378 handover must name the Cloudflare variables/secrets dashboard path.');
  if (!/do not paste.*secret|never paste.*secret/i.test(operatorText)) errors.push('W378 handover must forbid secret sharing in prompts/chat/source.');
  if (!/Preview.*disabled|disabled.*Preview/i.test(operatorText)) errors.push('W378 handover must keep Preview OAuth disabled without a separate exact Preview client.');
  if (!/source-only|source only/i.test(operatorText)) errors.push('W378 handover must retain source-only truth.');
  if (!/W276/i.test(operatorText) || !/update-and-rollback/i.test(operatorText)) errors.push('W378 handover must retain the W276 update-and-rollback blocker.');
  if (!/Razorpay|Cashfree|Dodo|Lemon/i.test(operatorText)) errors.push('W378 handover must preserve payment-provider non-selection context.');
  if (!/EON Invite/i.test(operatorText) || !/not active/i.test(operatorText)) errors.push('W378 handover must preserve EON Invite inactive state.');

  const allNewText = `${operatorText}\n${read(root, 'docs/GOOGLE_IDENTITY_ENVIRONMENT_TEMPLATE_2026-06-26.txt')}`;
  if (hasLikelySecretAssignment(allNewText)) errors.push('W378 operator source appears to contain a credential value.');
  for (const forbidden of contract.forbiddenActivationMarkers) {
    if (operatorText.toLowerCase().includes(forbidden.toLowerCase())) errors.push(`W378 handover contains forbidden activation marker: ${forbidden}`);
  }

  const auth = read(root, 'functions/_shared/eon-auth.js');
  if (!auth.includes("new Set(['testing', 'public'])")) errors.push('W378 must preserve explicit testing/public rollout allowlist and fail closed otherwise.');
  if (!auth.includes('automaticCloudBackup: false') || !auth.includes('automaticCrossDeviceSync: false')) errors.push('W378 must preserve no-backup/no-auto-sync identity truth.');

  return Object.freeze({
    schema: W378_CLOUDFLARE_CODEX_READINESS_SCHEMA,
    ok: errors.length === 0,
    sourceOnly: true,
    cloudflareConfigurationApplied: false,
    googleOAuthLiveProven: false,
    paymentsActivated: false,
    errors
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW378CloudflareCodexReadiness();
  fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'artifacts', 'W378_CLOUDFLARE_CODEX_READINESS_REPORT_2026-06-26.json'), `${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) {
    report.errors.forEach((error) => console.error(`[W378] ${error}`));
    process.exitCode = 1;
  } else {
    console.log('W378 Cloudflare/Codex readiness gate: PASS (source handover only; no cloud configuration or activation claimed).');
  }
}
