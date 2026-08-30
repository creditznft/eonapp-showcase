/**
 * W476-B — controlled production/browser evidence contract.
 *
 * This contract defines what the opt-in proof runner may observe and what
 * still requires a human/device review. It cannot deploy, approve a release,
 * enable payment, or make a local media adapter live.
 */
export const W476_B_PRODUCTION_PROOF_SCHEMA = 'eonapp.w476.b.production-browser-proof.v1';

const freeze = (value) => Object.freeze(value);
const route = (value) => freeze(value);

export const W476_B_DOCUMENT_ROUTES = freeze([
  route({ path: '/', marker: 'EONBOT', requiresCspReporting: true }),
  route({ path: '/chat', marker: 'EONBOT', requiresCspReporting: true }),
  route({ path: '/profile', marker: 'Profile & preferences', requiresCspReporting: true }),
  route({ path: '/local-ai', marker: 'Local AI setup', requiresCspReporting: true, localLoopbackException: true }),
  route({ path: '/eoncity', marker: 'EON City', requiresCspReporting: true }),
  route({ path: '/insights', marker: 'Research', requiresCspReporting: true })
]);

export const W476_B_MANUAL_EVIDENCE = freeze([
  freeze({ id: 'local-ai-ollama', category: 'local-runtime', required: 'User-triggered Ollama scan, model discovery, self-test, one harmless local EONBOT response, failure/no-cloud-fallback proof.' }),
  freeze({ id: 'local-ai-lm-studio', category: 'local-runtime', required: 'User-triggered LM Studio scan, model discovery, self-test, one harmless local EONBOT response, failure/no-cloud-fallback proof.' }),
  freeze({ id: 'local-ai-jan', category: 'local-runtime', required: 'User-triggered Jan scan, model discovery, self-test, one harmless local EONBOT response, failure/no-cloud-fallback proof.' }),
  freeze({ id: 'csp-browser-delivery-and-redaction', category: 'csp', required: 'A same-origin synthetic browser CSP violation reaches the deployed collector; an authorised operator verifies redacted-only logs without retaining raw payloads.' }),
  freeze({ id: 'api-conditional-negative-matrix', category: 'api', required: 'Preview-only review of OAuth and conditional mutation routes against the full contract with no account deletion, provider action, payment activation or legacy transport path.' }),
  freeze({ id: 'ga-safe-bridge', category: 'privacy', required: 'Confirm the default-off analytics bridge makes no remote request without explicit user consent and preserves the local-only path.' }),
  freeze({ id: 'update-rollback-data-survival', category: 'pwa-data', required: 'Real install/update/rollback drill proves local data, encrypted portable recovery and Service Worker behavior on a controlled device.' }),
  freeze({ id: 'desktop-android-ios-browser-matrix', category: 'device', required: 'Desktop, Android and iOS evidence covers navigation, safe areas, touch, rotate, accessibility, locale/RTL, typed fallback and consented microphone behavior.' }),
  freeze({ id: 'owner-evidence-review', category: 'release', required: 'A human owner reviews redacted evidence, unresolved origins and all NOT PASS results before later non-payment certification.' })
]);

export const W476_B_PRODUCTION_PROOF_CONTRACT = freeze({
  schema: W476_B_PRODUCTION_PROOF_SCHEMA,
  wave: 'W476-B',
  networkOptInOnly: true,
  sourceCanApproveProduction: false,
  sourceCanEnablePayment: false,
  sourceCanEnableDodo: false,
  sourceCanEnableLocalImageVideo: false,
  documents: W476_B_DOCUMENT_ROUTES,
  manualEvidence: W476_B_MANUAL_EVIDENCE,
  redaction: freeze({
    persistCookies: false,
    persistStorage: false,
    persistRequestBodies: false,
    persistResponseBodies: false,
    persistQueryStrings: false,
    persistFragments: false,
    persistConsoleMessages: false,
    persistOauthOrProviderData: false,
    persistLocalModelNames: false,
    persistPersonalContent: false
  }),
  boundaries: freeze({
    productionReleaseApproved: false,
    paymentActivationApproved: false,
    dodoActivationApproved: false,
    localImageVideoAdapterClaimed: false,
    browserProofGeneratedBySource: false,
    deploymentPerformedBySource: false
  })
});

export function validateW476BProductionProofContract(contract = W476_B_PRODUCTION_PROOF_CONTRACT) {
  const issues = [];
  if (contract?.schema !== W476_B_PRODUCTION_PROOF_SCHEMA) issues.push('schema-invalid');
  if (contract?.wave !== 'W476-B') issues.push('wave-invalid');
  if (contract?.networkOptInOnly !== true) issues.push('network-opt-in-boundary-invalid');
  if (!Array.isArray(contract?.documents) || contract.documents.length < 6) issues.push('document-matrix-incomplete');
  if (!Array.isArray(contract?.manualEvidence) || contract.manualEvidence.length < 9) issues.push('manual-evidence-matrix-incomplete');
  const uniquePaths = new Set(contract?.documents?.map((entry) => entry.path));
  if (uniquePaths.size !== contract?.documents?.length) issues.push('document-route-duplicate');
  for (const item of contract?.documents || []) {
    if (!String(item?.path || '').startsWith('/')) issues.push(`document-route-invalid:${item?.path || 'unknown'}`);
    if (!String(item?.marker || '').trim()) issues.push(`document-marker-missing:${item?.path || 'unknown'}`);
  }
  for (const [key, expected] of Object.entries(W476_B_PRODUCTION_PROOF_CONTRACT.boundaries)) {
    if (contract?.boundaries?.[key] !== expected) issues.push(`boundary-invalid:${key}`);
  }
  for (const [key, expected] of Object.entries(W476_B_PRODUCTION_PROOF_CONTRACT.redaction)) {
    if (contract?.redaction?.[key] !== expected) issues.push(`redaction-boundary-invalid:${key}`);
  }
  return freeze(issues);
}
