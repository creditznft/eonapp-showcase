/** W533 cross-origin continuity helper. It only explains an explicit user-held Capsule move. */
import {
  W533_CANONICAL_APP_ORIGIN,
  W533_DOMAIN_CONTINUITY_CONTRACT,
  W533_TRUST_HUB_ORIGIN
} from '../../../config/w533-domain-continuity-contract.mjs';

const HTTPS = 'https:';

function normalizeOrigin(value, fallback = W533_CANONICAL_APP_ORIGIN) {
  try {
    const parsed = new URL(String(value || fallback), fallback);
    if (parsed.protocol !== HTTPS) return '';
    return parsed.origin;
  } catch {
    return '';
  }
}

function targetVerdict(origin) {
  if (!origin) return Object.freeze({ status: 'invalid-target', message: 'Choose a reviewed HTTPS EONAPP address before moving a Capsule.' });
  if (origin === W533_TRUST_HUB_ORIGIN) return Object.freeze({ status: 'blocked-trust-hub', message: 'EON.HUB is public guidance only. It cannot receive, inspect, store, or restore a Capsule.' });
  if (origin === W533_CANONICAL_APP_ORIGIN) return Object.freeze({ status: 'canonical-app', message: 'Use the canonical EONAPP origin on the destination device, then import the file yourself.' });
  return Object.freeze({ status: 'review-required', message: 'A future EONAPP origin needs owner approval before you import. It still cannot read this browser automatically.' });
}

export function getDomainContinuityTruth() {
  return Object.freeze({
    schema: W533_DOMAIN_CONTINUITY_CONTRACT.schema,
    canonicalOrigin: W533_CANONICAL_APP_ORIGIN,
    transferMode: W533_DOMAIN_CONTINUITY_CONTRACT.transferMode,
    trustHubCanReadBrowserData: false,
    automaticSyncActive: false,
    automaticRestoreActive: false
  });
}

export function createDomainContinuityMovePlan({ sourceOrigin = W533_CANONICAL_APP_ORIGIN, targetOrigin = W533_CANONICAL_APP_ORIGIN } = {}) {
  const source = normalizeOrigin(sourceOrigin);
  const target = normalizeOrigin(targetOrigin);
  const verdict = targetVerdict(target);
  const allowed = Boolean(source) && ['canonical-app', 'review-required'].includes(verdict.status);
  return Object.freeze({
    schema: W533_DOMAIN_CONTINUITY_CONTRACT.schema,
    allowed,
    sourceOrigin: source || 'invalid-source',
    targetOrigin: target || 'invalid-target',
    targetStatus: verdict.status,
    headline: verdict.message,
    transferMode: W533_DOMAIN_CONTINUITY_CONTRACT.transferMode,
    automaticTransfer: false,
    steps: Object.freeze([
      'Create one encrypted Capsule in the source browser.',
      'Carry the downloaded file and its passphrase separately to the destination.',
      'Open a reviewed EONAPP origin on the destination device.',
      'Inspect the no-values restore plan before anything changes.',
      'Choose records and type the explicit confirmation phrase to restore.'
    ]),
    blocked: Object.freeze([
      'No origin can read localStorage or IndexedDB from another origin.',
      'No Capsule is uploaded, shared, or restored automatically.',
      'Google sign-in and Trust Hub discovery do not transfer browser-local workspace data.'
    ])
  });
}
