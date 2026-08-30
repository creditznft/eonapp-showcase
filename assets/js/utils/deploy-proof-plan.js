/**
 * W617B deploy proof plan.
 * Active launch proof now uses Dodo-first billing language and Cloudflare
 * Pages deployment receipts. This helper is source-only and never performs a
 * deploy, checkout, webhook call or secret read.
 */

import { EON_CLOUDFLARE_DEPLOY_CONTRACT } from '../launch/eon-launch-master-plan.js';

export const DEPLOY_PROOF_PLAN_SCHEMA = 'eonapp.deploy-proof-plan.v2';

export function buildCloudflareDeployRunbook(options = {}) {
  const projectName = options.projectName || EON_CLOUDFLARE_DEPLOY_CONTRACT.projectName;
  const branch = options.branch || EON_CLOUDFLARE_DEPLOY_CONTRACT.productionBranch;
  return Object.freeze({
    schema: DEPLOY_PROOF_PLAN_SCHEMA,
    projectName,
    branch,
    buildCommand: EON_CLOUDFLARE_DEPLOY_CONTRACT.buildCommand,
    outputDirectory: EON_CLOUDFLARE_DEPLOY_CONTRACT.outputDirectory,
    nodeVersion: EON_CLOUDFLARE_DEPLOY_CONTRACT.nodeVersion,
    requiredCloudflareSettings: EON_CLOUDFLARE_DEPLOY_CONTRACT.requiredDashboardSettings,
    preDeployLocalCommands: Object.freeze([
      'npm ci',
      'npm run qa:w616b-eon-keys-referral',
      'npm run qa:w616c-locked-feature-resolver',
      'npm run qa:w616d-locked-feature-surfaces',
      'npm run qa:w617a-shell-launch-readiness',
      'npm run qa:w617b-launch-master-plan',
      'npm run lint -- --max-warnings=0',
      'npm run build',
      'npm run smoke:build',
      'npm run security:secret-scan'
    ]),
    postDeploySmokeChecks: Object.freeze([
      'Open https://eonapp.ch/ and verify the EONBOT home loads.',
      'Open /projects, /workspace, /local-ai, /automations, /vault and /eon-keys and verify locked-feature copy appears where expected.',
      'Open /eoncity and verify guest preview/auth gate truth, then run authenticated City proof separately.',
      'Verify _headers security policy and _redirects route aliases are deployed.',
      'Verify service worker update/caching does not strand stale billing or City assets.'
    ]),
    rollbackPlan: Object.freeze([
      'Keep the last known-good Pages deployment id before promotion.',
      'Promote only after route smoke and cache proof pass.',
      'Rollback by re-promoting the previous Pages deployment if production smoke fails.',
      'Keep Dodo checkout/trial/key redemption flags off during rollback.'
    ])
  });
}

export function buildLivePaymentProofPlan(options = {}) {
  return Object.freeze({
    schema: 'eonapp.dodo-proof-plan.v1',
    generatedAt: options.now || new Date().toISOString(),
    dodoProof: Object.freeze({
      activeNow: false,
      provider: 'Dodo Payments',
      steps: Object.freeze([
        'Verify Dodo merchant/account status and product ids outside frontend source.',
        'Configure Dodo secrets only in Cloudflare server/runtime secrets, never as Vite public variables.',
        'Create a sandbox or controlled low-value checkout proof only after W617C server adapter exists.',
        'Capture signed webhook receipt for trial_started/payment_succeeded/cancelled/refunded events.',
        'Verify server entitlement ledger idempotency and duplicate webhook handling before enabling paid CTAs.'
      ])
    }),
    referralProof: Object.freeze({
      activeNow: false,
      steps: Object.freeze([
        'Record invite attribution server-side, not only in localStorage.',
        'Grant EON Keys only from idempotent verified events.',
        'Apply abuse caps and the 14-day retained-paid-referral rule before paid milestone grants.',
        'Verify no cash, wallet, crypto, free-month or renewal-discount reward is granted by source code.'
      ])
    }),
    evidenceRequired: Object.freeze([
      'Cloudflare deployment id and build hash',
      'Dodo product id checklist with secrets redacted',
      'Dodo signed webhook proof with sensitive payload redacted',
      'Entitlement ledger idempotency proof',
      'Referral/EON Key ledger proof',
      'CEO paid-activation on/off decision note'
    ])
  });
}

export function validateDeployProofPlan(plan = buildCloudflareDeployRunbook()) {
  const errors = [];
  if (plan.buildCommand !== 'npm run build') errors.push('Cloudflare build command must be npm run build.');
  if (plan.outputDirectory !== 'dist') errors.push('Cloudflare output directory must be dist.');
  if (!String(plan.nodeVersion).startsWith('22')) errors.push('Node version must be pinned to 22.');
  const combined = JSON.stringify(plan);
  const retiredPattern = new RegExp(['NOW' + 'Payments', 'direct-' + 'EVM', 'direct ' + 'EVM'].join('|'), 'i');
  if (retiredPattern.test(combined)) errors.push('Deploy proof plan contains retired payment wording.');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: DEPLOY_PROOF_PLAN_SCHEMA });
}
