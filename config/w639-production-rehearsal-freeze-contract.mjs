/** W639 — whole-app production rehearsal and launch-candidate freeze contract. */
const freeze = (value) => Object.freeze(value);
const domain = (id, title, externalEvidence) => freeze({ id, title, externalEvidence: freeze([...externalEvidence]) });

export const W639_REHEARSAL_SCHEMA = 'eonapp.whole-app-production-rehearsal.w639.v1';
export const W639_FREEZE_MANIFEST_SCHEMA = 'eonapp.launch-candidate-freeze-manifest.w639.v1';

export const W639_REHEARSAL_DOMAINS = freeze([
  domain('routes', 'Canonical routes and navigation', ['Cloudflare edge redirects', 'fresh desktop/mobile route walkthrough']),
  domain('account', 'Account identity and Vault separation', ['real Google identity lifecycle', 'owner deletion/revocation review']),
  domain('projects', 'Projects and continuation', ['real browser create/save/reopen/continue walkthrough']),
  domain('forge', 'Review-first Forge handoff', ['real owner-reviewed handoff and return']),
  domain('automations', 'Automation truth and execution state', ['real scheduled execution and failure recovery']),
  domain('city', 'EON City flagship', ['authenticated production desktop/Android/iOS gameplay evidence']),
  domain('creator', 'Local Creator, Direct BYOK and companion', ['W638 local-creator PASS', 'W638 direct-provider PASS', 'W638 companion PASS']),
  domain('billing', 'Dodo billing lifecycle', ['W638 billing PASS']),
  domain('referral', 'Referral, EONKEY and Vault Reveal lifecycle', ['W638 referral PASS']),
  domain('backup-recovery', 'Persistence, Capsule and Drive recovery', ['real update/rollback/corruption/Drive/cross-device recovery evidence']),
  domain('incidents-rollback', 'Kill switches, incidents and deployment rollback', ['Cloudflare incident drill', 'feature kill-switch drill', 'deployment and migration rollback drill'])
]);

export const W639_FREEZE_CATEGORIES = freeze([
  freeze({ id: 'dependencies', required: freeze(['package.json', 'package-lock.json']) }),
  freeze({ id: 'workflows', required: freeze(['.github/workflows/ci.yml', '.github/workflows/deploy.yml', '.github/workflows/preview.yml']) }),
  freeze({ id: 'routes', required: freeze(['_redirects', 'public/_redirects', 'config/route-contract.mjs', 'config/w633-every-route-audit-contract.mjs', 'vite.config.mjs']) }),
  freeze({ id: 'service-worker', required: freeze(['sw.js', 'assets/js/utils/eon-service-worker-registration.js', 'config/w635-performance-cache-update-safety-contract.json']) }),
  freeze({ id: 'provider-adapters', required: freeze(['config/ai-api-contracts.mjs', 'config/w626-reviewed-provider-models.json', 'assets/js/direct-byok/provider-registry.js', 'assets/js/direct-byok/provider-adapters/fal.js', 'assets/js/direct-byok/provider-adapters/replicate.js', 'creator-companion/src/provider-gateway.mjs']) }),
  freeze({ id: 'billing-catalogue', required: freeze(['config/w620-dodo-dashboard-setup-contract.mjs', 'config/w628-billing-certification-board.json', 'assets/js/billing/eon-dodo-live-runtime.js', 'functions/api/billing/checkout.js', 'functions/api/billing/webhooks/dodo.js']) }),
  freeze({ id: 'referral-ledger', required: freeze(['config/w629-referral-certification-board.json', 'assets/js/referrals/eon-referral-program-w629.js', 'functions/api/referrals.js', 'migrations/0002_minimal_referral_eonkeys.sql']) }),
  freeze({ id: 'persistence', required: freeze(['config/w637-persistence-migration-recovery-contract.mjs', 'assets/js/local-first/eon-portable-backup.js', 'assets/js/local-first/eon-workspace-capsule.js', 'assets/js/local-first/eon-google-drive-snapshot-connector.js']) }),
  freeze({ id: 'legal-support', required: freeze(['privacy.html', 'terms.html', 'support.html', 'billing.html', 'help.html']) }),
  freeze({ id: 'evidence', required: freeze(['config/w638-evidence-convergence-contract.mjs', 'config/w638-evidence-convergence-board.json', 'scripts/lib/w638-evidence-index.mjs', 'scripts/w638-evidence-convergence-gate.mjs', 'scripts/launch-evidence-audit.mjs', 'config/w639-production-rehearsal-freeze-contract.mjs', 'config/w639-production-rehearsal-board.json', 'scripts/lib/w639-release-freeze.mjs', 'scripts/w639-production-rehearsal-freeze-gate.mjs']) })
]);

export const W639_PRODUCTION_REHEARSAL_FREEZE_CONTRACT = freeze({
  schema: W639_REHEARSAL_SCHEMA,
  wave: 'W639',
  sourceCertified: true,
  productionRehearsalPassed: false,
  launchCandidateFrozen: false,
  rehearsalDomains: W639_REHEARSAL_DOMAINS,
  freezeCategories: W639_FREEZE_CATEGORIES,
  sourceGateRules: freeze({
    deterministicManifest: true,
    everyRequiredFileExists: true,
    everyRequiredFileHasSha256: true,
    buildRoutesMatchContract: true,
    serviceWorkerReleaseIdentityRequired: true,
    evidenceVerdictsDerived: true,
    emptyOrSyntheticEvidenceCannotPass: true
  }),
  incidentRules: freeze({
    destructiveActionsRequireOwnerReview: true,
    customerActionsNeverAutomatedByRehearsal: true,
    killSwitchesMustFailClosed: true,
    rollbackMustPreserveEvidence: true,
    migrationRollbackMustNeverDeleteUserDataByDefault: true
  }),
  externalEvidenceRequired: freeze([
    'fresh production route/account/project/Forge/automation/City walkthrough',
    'W638 billing/referral/local Creator/provider/companion lane PASS evidence',
    'Cloudflare feature kill-switch and incident drill evidence',
    'deployment rollback plus migration rollback evidence',
    'fresh screenshots and one owner-reviewed machine-readable evidence index'
  ]),
  permanentCommand: freeze(['npm ci', 'npm run verify:codex-predeploy'])
});

export function validateW639ProductionRehearsalFreezeContract(value = W639_PRODUCTION_REHEARSAL_FREEZE_CONTRACT) {
  const domains = Array.isArray(value?.rehearsalDomains) ? value.rehearsalDomains : [];
  const categories = Array.isArray(value?.freezeCategories) ? value.freezeCategories : [];
  const checks = freeze({
    identity: value?.schema === W639_REHEARSAL_SCHEMA && value?.wave === 'W639',
    sourceFence: value?.sourceCertified === true && value?.productionRehearsalPassed === false && value?.launchCandidateFrozen === false,
    domains: domains.length === 11 && new Set(domains.map((item) => item.id)).size === domains.length && domains.every((item) => item.externalEvidence.length > 0),
    categories: categories.length === 10 && new Set(categories.map((item) => item.id)).size === categories.length && categories.every((item) => item.required.length > 0),
    manifest: value?.sourceGateRules?.deterministicManifest === true && value?.sourceGateRules?.everyRequiredFileHasSha256 === true,
    evidenceFence: value?.sourceGateRules?.evidenceVerdictsDerived === true && value?.sourceGateRules?.emptyOrSyntheticEvidenceCannotPass === true,
    incidentFence: value?.incidentRules?.destructiveActionsRequireOwnerReview === true && value?.incidentRules?.customerActionsNeverAutomatedByRehearsal === true && value?.incidentRules?.migrationRollbackMustNeverDeleteUserDataByDefault === true,
    externalEvidence: Array.isArray(value?.externalEvidenceRequired) && value.externalEvidenceRequired.length === 5,
    command: value?.permanentCommand?.join('|') === 'npm ci|npm run verify:codex-predeploy'
  });
  return freeze({ ok: Object.values(checks).every(Boolean), checks });
}
