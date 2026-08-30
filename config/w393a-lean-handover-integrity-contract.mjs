/**
 * W393A — Lean continuation handover integrity contract.
 *
 * The W380–W393 continuation archive intentionally excludes large historic
 * evidence and retired-source bundles. This contract does not pretend those
 * records are present or hash-verified. It defines what a lean handover must
 * prove instead: deployable public assets, an inactive value/referral surface,
 * and a current-source import boundary that does not reintroduce the retired
 * commercial/runtime families.
 */
export const W393A_LEAN_HANDOVER_SCHEMA = 'eonapp.w393a.lean-handover-integrity.v1';

export const W393A_REQUIRED_ROOT_ASSETS = Object.freeze([
  '_headers',
  '_redirects',
  'robots.txt',
  'sitemap.xml',
  'manifest.webmanifest',
  'favicon.svg',
  'favicon.ico',
  'sw.js'
]);

export const W393A_EXCLUDED_HISTORIC_EVIDENCE = Object.freeze([
  Object.freeze({
    path: 'archive/retired-value-systems',
    purpose: 'R3-F1 hash-verified retired transaction/value-system archive',
    status: 'not-packaged-in-lean-continuation'
  }),
  Object.freeze({
    path: 'archive/w238-retired-value-systems',
    purpose: 'W238 legacy consolidation archive and manifest',
    status: 'not-packaged-in-lean-continuation'
  })
]);


/**
 * These test files are preserved for forensic/historical verification, but the
 * lean W380–W393 continuation archive intentionally excludes the signed
 * handoff, release-board and independent-evidence directories they require.
 * They are never counted as current runnable-product certification.
 */
export const W393A_HISTORICAL_EVIDENCE_DIAGNOSTIC_TESTS = Object.freeze([
  Object.freeze({ test: 'tests/unit/w217-r1-cumulative-handoff.test.mjs', evidence: 'HANDOFF historical cumulative package', reason: 'requires omitted cumulative handoff manifests' }),
  Object.freeze({ test: 'tests/unit/w260-release-board-gate.test.mjs', evidence: 'release-evidence/W260_RELEASE_BOARD_2026-06-25', reason: 'requires omitted release board' }),
  Object.freeze({ test: 'tests/unit/w263-eonbot-capability-execution.test.mjs', evidence: 'release-evidence/W263_EONBOT_CAPABILITY_EXECUTION_SOURCE_READINESS_2026-06-25', reason: 'requires omitted source-readiness board' }),
  Object.freeze({ test: 'tests/unit/w264-creator-build-handoff.test.mjs', evidence: 'release-evidence/W264_CREATOR_BUILD_HANDOFF_SOURCE_READINESS_2026-06-25', reason: 'requires omitted source-readiness board' }),
  Object.freeze({ test: 'tests/unit/w267-red-team-source-audit.test.mjs', evidence: 'release-evidence/W267_RED_TEAM_AUDIT_2026-06-25', reason: 'requires omitted independent-audit board' }),
  Object.freeze({ test: 'tests/unit/w268-operations-readiness.test.mjs', evidence: 'release-evidence/W268_OPERATIONS_READINESS_2026-06-25', reason: 'requires omitted operations board' }),
  Object.freeze({ test: 'tests/unit/w271-accessibility-i18n-source-gate.test.mjs', evidence: 'release-evidence/W271_ACCESSIBILITY_I18N_SOURCE_READINESS_2026-06-25', reason: 'requires omitted source-readiness board' }),
  Object.freeze({ test: 'tests/unit/w272-security-supplychain-source-gate.test.mjs', evidence: 'release-evidence/W272_SECURITY_SUPPLYCHAIN_SOURCE_READINESS_2026-06-25', reason: 'requires omitted source-readiness board' }),
  Object.freeze({ test: 'tests/unit/w281-ai-provider-lifecycle.test.mjs', evidence: 'release-evidence/W281_AI_PROVIDER_LIFECYCLE_SOURCE_READINESS_2026-06-25', reason: 'requires omitted source-readiness board' }),
  Object.freeze({ test: 'tests/unit/w285-local-ai-device-support.test.mjs', evidence: 'release-evidence/W285_LOCAL_AI_DEVICE_SUPPORT_SOURCE_READINESS_2026-06-25', reason: 'requires omitted source-readiness board' }),
  Object.freeze({ test: 'tests/unit/w287-eonbot-language-voice.test.mjs', evidence: 'release-evidence/W287_EONBOT_LANGUAGE_VOICE_SOURCE_READINESS_2026-06-25', reason: 'requires omitted source-readiness board' }),
  Object.freeze({ test: 'tests/unit/w288-creator-handoff-integrity.test.mjs', evidence: 'release-evidence/W288_CREATOR_HANDOFF_INTEGRITY_SOURCE_READINESS_2026-06-25', reason: 'requires omitted source-readiness board' })
]);

export const W393A_REQUIRED_ABSENT_ACTIVE_PATHS = Object.freeze([
  'functions/api/referrals',
  'assets/js/utils/referral-cloud-storage.js',
  'assets/js/utils/admin-wallets.js',
  'assets/js/utils/nowpayments-config.js',
  'assets/js/ads',
  'assets/js/rewards',
  'assets/js/realm3d',
  'assets/js/reward-access-page.js',
  'assets/js/subscription-page.js',
  'assets/js/nowpayments-status-page.js',
  'assets/js/telegram-growth-widget.js',
  'assets/js/creator-studio-page.js'
]);

export function getW393ALeanHandoverStatus() {
  return Object.freeze({
    schema: W393A_LEAN_HANDOVER_SCHEMA,
    historicArchiveEvidence: 'not-packaged-in-lean-continuation',
    historicArchiveVerification: 'not-certified-by-this-handover',
    currentSourceBoundary: 'required',
    deployAssetMirrors: 'required'
  });
}
