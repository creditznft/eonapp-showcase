/** W353–W356 local beta, referral, and release governance contract. */
export const W353_W356_LOCAL_BETA_RELEASE_GOVERNANCE_SCHEMA = 'eon.w353-w356-local-beta-release-governance.v1';
export const W353_W356_REQUIRED_SOURCES = Object.freeze([
  'assets/js/local-first/eon-beta-readiness-records.js',
  'assets/js/local-first/eon-release-governance-board.js',
  'assets/js/realm-relic/eon-referral-reentry-firewall.js',
  'assets/js/local-first/eon-local-beta-readiness.js',
  'assets/js/local-first/eon-device-evidence-records.js',
  'assets/js/eon-workspace-pages.js',
  'assets/js/capabilities/capability-truth-registry.js',
  'config/w353-w356-local-beta-release-governance-contract.mjs',
  'scripts/w353-w356-local-beta-release-governance-gate.mjs',
  'tests/unit/w353-w356-local-beta-release-governance.test.mjs'
]);
export const W353_W356_FORBIDDEN_RUNTIME_TOKENS = Object.freeze([
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  'WebSocket',
  'Razorpay(',
  'Cashfree(',
  'DodoPayments(',
  'NOWPayments(',
  'checkout.js',
  'automaticEnrollment: true',
  'releaseApproved: true',
  'referralActive: true',
  'payoutCreated: true'
]);
