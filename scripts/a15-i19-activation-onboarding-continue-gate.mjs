import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonActivationTruth } from '../assets/js/activation/eon-activation-service.js';
import { getIdentityOnboardingCopy } from '../assets/js/account/eon-identity-onboarding.js';
import { getEonRetentionConsentTruth } from '../assets/js/notifications/eon-retention-consent.js';
import { W642_PRODUCT_TRUTH_RETENTION_CONTRACT } from '../config/w642-product-truth-retention-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs/institutional/a15/evidence/A15_I19_ACTIVATION_ONBOARDING_CONTINUE_GATE_RECEIPT.json');
const read = (relative) => readFileSync(path.join(ROOT, relative), 'utf8');
const errors = [];

const activationTruth = getEonActivationTruth({ storage: null, localStorage: null, sessionStorage: null });
const identityCopy = getIdentityOnboardingCopy('chat');
const consentTruth = getEonRetentionConsentTruth();

if (!activationTruth.guestFirst || activationTruth.signInRequiredForFirstResult) errors.push('First useful result is not guest-first.');
if (activationTruth.identityCreatesMarketingConsent || consentTruth.googleLoginIsMarketingConsent) errors.push('Identity can still imply marketing consent.');
if (activationTruth.automaticNavigation || activationTruth.automaticOutboundDelivery || consentTruth.automaticOutboundDelivery) errors.push('Activation or retention can navigate or deliver outward automatically.');
if (activationTruth.contentBodiesStored || activationTruth.remoteUpload) errors.push('Activation authority can retain content bodies or upload remotely.');
if (!/without an account/i.test(identityCopy.description)) errors.push('Guest-first identity disclosure is missing.');
if (!W642_PRODUCT_TRUTH_RETENTION_CONTRACT.candidatePriority.includes('setup')) errors.push('Setup resume is missing from Continue priority authority.');

const sources = {
  activation: read('assets/js/activation/eon-activation-service.js'),
  continueResolver: read('assets/js/retention/eon-continue-resolver.js'),
  onboarding: read('assets/js/onboarding-page.js'),
  shell: read('assets/js/eon-app-shell.js'),
  identity: read('assets/js/account/eon-identity-onboarding.js'),
  retention: read('assets/js/notifications/eon-retention-consent.js')
};

if (!/listProjectRegistryRecords/.test(sources.activation) || !/listLibraryIndexRecords/.test(sources.activation) || !/listChatThreads/.test(sources.activation)) errors.push('First-useful-result authority does not cover Project, Library and Chat truth.');
if (!/contentBodiesStored:\s*false/.test(sources.activation) || !/remoteUpload:\s*false/.test(sources.activation)) errors.push('Activation privacy boundaries are not source-enforced.');
if (!/projectCandidates/.test(sources.continueResolver) || !/listEonSetupResumeCandidates/.test(sources.continueResolver)) errors.push('Continue does not resolve canonical Projects and setup resumes.');
if (!/buildEonDestinationHref/.test(sources.continueResolver) || !/localOnly:\s*true/.test(sources.continueResolver)) errors.push('Continue destinations are not canonical and local-only.');
if (/window\.location\.href\s*=\s*['"]\/build/.test(sources.onboarding)) errors.push('Stale /build onboarding fallback remains active.');
if (!/buildEonDestinationHref/.test(sources.onboarding) || !/recordEonSetupProgress/.test(sources.onboarding)) errors.push('Onboarding is not connected to canonical navigation and setup progress.');
if (!/installEonActivationService/.test(sources.shell)) errors.push('The app shell does not install the activation authority.');
if (!/Use .* without an account/i.test(sources.identity)) errors.push('Identity onboarding no longer states guest-first access.');
if (!/Google\/EONAPP sign-in never enrols you/i.test(sources.retention)) errors.push('Retention notice does not separate sign-in from outbound consent.');
if (/Notification\.requestPermission|PushManager\.subscribe|sendEmail|sendNewsletter|publishToSocial/i.test(sources.activation + sources.continueResolver + sources.onboarding)) errors.push('Activation/Continue includes an outbound delivery or browser-push path.');

const core = {
  schema: 'eonapp.a15.i19.activation-onboarding-continue-gate-receipt.v1',
  generatedAt: new Date().toISOString(),
  wave: 'I19',
  status: errors.length ? 'fail' : 'pass',
  authority: {
    guestFirst: true,
    signInRequiredForFirstUsefulResult: false,
    firstUsefulResultSources: ['project', 'library', 'chat'],
    setupResumeSources: ['onboarding', 'local-ai', 'creator-media', 'data-survival', 'provider'],
    canonicalContinueDestinations: true,
    automaticNavigation: false,
    marketingConsentFromIdentity: false,
    automaticOutboundDelivery: false,
    contentBodiesStoredInActivationState: false,
    remoteUpload: false
  },
  sourceFiles: [
    'assets/js/activation/eon-activation-service.js',
    'assets/js/retention/eon-continue-resolver.js',
    'assets/js/onboarding-page.js',
    'assets/js/eon-app-shell.js',
    'assets/js/account/eon-identity-onboarding.js',
    'assets/js/notifications/eon-retention-consent.js',
    'config/w642-product-truth-retention-contract.mjs'
  ],
  claims: {
    realAccountActivationExercised: false,
    emailOrPushDelivered: false,
    marketingConsentCollected: false,
    authenticatedBrowserCertified: false,
    previewDeployed: false,
    productionDeployed: false
  },
  errors
};
const receipt = { ...core, digest: createHash('sha256').update(JSON.stringify(core)).digest('hex') };
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I19] ${receipt.status.toUpperCase()}: guest-first activation, setup resume and canonical Continue are bounded.`);
if (errors.length) {
  errors.forEach((error) => console.error(`[A15 I19] ${error}`));
  process.exitCode = 1;
}
