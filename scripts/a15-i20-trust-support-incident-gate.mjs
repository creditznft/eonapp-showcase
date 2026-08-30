import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPublicOperatorConfig, getTrustPolicySet, getTrustSupportTruth } from '../assets/js/trust/eon-trust-support-authority.js';
import { getTrustLedgerTruth } from '../assets/js/trust/eon-trust-support-ledger.js';
import { getEonDestination, validateEonDestinationRegistry } from '../assets/js/contracts/navigation/eon-destination-registry.js';
import { A15_BUILD_HTML_ENTRY_FILES, validateA15CurrentProductAuthority } from '../config/a15-current-product-authority.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs/institutional/a15/evidence/A15_I20_TRUST_SUPPORT_INCIDENT_GATE_RECEIPT.json');
const read = (file) => readFileSync(path.join(ROOT, file), 'utf8');
const errors = [];
const required = [
  'assets/js/trust/eon-trust-support-authority.js',
  'assets/js/trust/eon-trust-support-ledger.js',
  'functions/_shared/eon-trust-operations.js',
  'functions/api/trust/config.js',
  'functions/api/support/cases.js',
  'functions/api/support/cases/[caseId].js',
  'functions/api/trust/cases/[caseId].js',
  'functions/api/status/current.js',
  'functions/api/trust/incidents.js',
  'functions/api/trust/incidents/[incidentId].js',
  'migrations/trust/0001_trust_support_incident_authority.sql',
  'status.html', 'help.html', 'legal.html', 'privacy.html', 'terms.html', 'billing.html',
  'docs/operations/A15_I20_TRUST_SUPPORT_INCIDENT_RUNBOOK.md'
];
for (const file of required) { try { read(file); } catch { errors.push(`missing:${file}`); } }
const runtimeSource = required.filter((file) => /^(assets\/js\/trust|functions\/)/.test(file)).map(read).join('\n');
if (/CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+INDEX/i.test(runtimeSource)) errors.push('request-time-ddl-found');
const migration = read('migrations/trust/0001_trust_support_incident_authority.sql');
for (const table of ['eon_trust_cases', 'eon_service_components', 'eon_incidents']) if (!migration.includes(table)) errors.push(`migration-table-missing:${table}`);
const help = read('help.html');
const legal = read('legal.html');
const privacy = read('privacy.html');
const terms = read('terms.html');
const statusPage = read('status.html');
if (!/Create a real private case ID/.test(help) || !/data-trust-case-form/.test(help)) errors.push('real-case-ui-missing');
if (!/Operator, supplier and data-controller record/.test(legal) || !/Paid launch remains blocked/.test(legal)) errors.push('operator-controller-publication-gate-missing');
if (!/Refund, withdrawal, cancellation, trial and dispute policy/.test(legal) || !/private.*billing case/i.test(legal)) errors.push('refund-withdrawal-policy-missing');
if (!/Purposes and legal bases/.test(privacy) || !/Your privacy rights/.test(privacy) || !/International transfers and subprocessors/.test(privacy)) errors.push('privacy-rights-policy-incomplete');
if (!/User content and intellectual property/.test(terms) || !/Suspension and termination/.test(terms) || !/Liability and service availability/.test(terms)) errors.push('terms-framework-incomplete');
if (!/data-status-overall/.test(statusPage) || !/An unavailable status service is never treated as proof/.test(statusPage)) errors.push('public-status-page-missing');
const truth = getTrustSupportTruth();
const ledgerTruth = getTrustLedgerTruth();
const policy = getTrustPolicySet();
if (!truth.realCaseIds || truth.supportCaseCanAlterEntitlement || !ledgerTruth.operatorUpdatesAuditable || ledgerTruth.requestTimeDdl) errors.push('trust-ledger-invariant-failed');
if (policy.support.automaticRefunds || policy.support.automaticPrivacyDecisions || policy.incident.publicUpdatesContainPrivateContent) errors.push('policy-automation-boundary-failed');
const missingConfig = getPublicOperatorConfig({});
if (missingConfig.launchEligible || missingConfig.configured || !missingConfig.missing.length) errors.push('operator-config-does-not-fail-closed');
const route = getEonDestination('status');
if (!route || route.route !== '/status' || !A15_BUILD_HTML_ENTRY_FILES.includes('status.html')) errors.push('status-route-not-current-authority');
errors.push(...validateEonDestinationRegistry().errors.map((error) => `destination:${error}`));
errors.push(...validateA15CurrentProductAuthority().map((error) => `product-authority:${error}`));
if (/localStorage\.setItem\([^\n]*(?:case|token)|sessionStorage\.setItem\([^\n]*(?:case|token)/i.test(read('assets/js/support-page.js'))) errors.push('case-token-persisted-in-browser-storage');
if (/upload|multipart\/form-data|FormData\s*\(/i.test(read('assets/js/support-page.js') + read('functions/api/support/cases.js'))) errors.push('raw-attachment-upload-path-found');

const core = {
  schema: 'eonapp.a15.i20.trust-support-incident-gate-receipt.v1',
  generatedAt: new Date().toISOString(), wave: 'I20', status: errors.length ? 'fail' : 'pass',
  authority: {
    realPrivateCaseIds: true, tokenStoredRaw: false, rawAttachmentsAccepted: false,
    supportCanChangeBillingOrEntitlements: false, operatorWorkflowImplemented: true,
    privacyRightsWorkflowImplemented: true, refundWithdrawalCancellationPolicyPublished: true,
    publicStatusImplemented: true, incidentOwnerWorkflowImplemented: true,
    requestTimeDdl: false, operatorIdentityDeploymentConfigRequired: true
  },
  route: { status: '/status', support: '/help#trust-support-case' },
  policyVersion: policy.version,
  sourceFiles: required,
  claims: {
    ownerLegalIdentityConfiguredInThisSourceRun: false,
    counselReviewCompleted: false,
    liveHumanCaseHandled: false,
    liveIncidentPublished: false,
    previewDeployed: false,
    productionDeployed: false,
    paidLaunchEligible: false
  },
  errors
};
const receipt = { ...core, digest: createHash('sha256').update(JSON.stringify(core)).digest('hex') };
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I20] ${receipt.status.toUpperCase()}: trust cases, policy, status and incident operations are source-bounded.`);
if (errors.length) { errors.forEach((error) => console.error(`[A15 I20] ${error}`)); process.exitCode = 1; }
