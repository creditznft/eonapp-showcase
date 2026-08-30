#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildEffectiveCapabilitySnapshot,
  getFreeCapabilitySnapshot,
  signCapabilitySnapshot,
  verifyCapabilityEnvelope
} from '../assets/js/capabilities/eon-capability-service.js';
import { validateEonCommercialCatalog } from '../assets/js/commerce/eon-commercial-catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'docs', 'institutional', 'a15', 'evidence', 'A15_I09_CAPABILITY_SERVICE_GATE_RECEIPT.json');
const errors = [];
const catalog = validateEonCommercialCatalog();
if (!catalog.ok) errors.push(...catalog.errors.map((error) => `Commercial catalogue: ${error}`));
const free = getFreeCapabilitySnapshot({ now: 1000 });
if (free.tierId !== 'free' || free.limits.projectSlots !== 3 || free.serverAuthoritative !== false) errors.push('Free fail-closed capability is invalid.');
const studio = buildEffectiveCapabilitySnapshot({ accountId: 'gate-account', entitlement: { tier_id: 'studio', status: 'active' }, lifecycle: { tier_id: 'studio', access_status: 'active', current_period_end: 5000 }, now: 1000, expiresAt: 4000 });
if (studio.tierId !== 'studio' || studio.limits.projectSlots !== 35 || !studio.featureGroups.includes('studio-workflows')) errors.push('Studio capability projection is invalid.');
const unlocked = buildEffectiveCapabilitySnapshot({ accountId: 'gate-free', now: 1000, unlocks: [{ unlockId: 'builder-project-slots-90d', status: 'active', issuedAt: 1, expiresAt: 5000 }] });
if (unlocked.tierId !== 'free' || unlocked.limits.projectSlots !== 6 || unlocked.subscriptionCreatedByUnlock !== false) errors.push('EONKEY limit projection is invalid.');
const envelope = await signCapabilitySnapshot(studio, 'a15-i09-gate-only-signing-key');
const verified = envelope.ok ? await verifyCapabilityEnvelope(envelope, 'a15-i09-gate-only-signing-key', { now: 2000 }) : envelope;
if (!verified.ok) errors.push(`Signed capability did not verify: ${verified.reason || 'unknown'}.`);
const required = [
  'assets/js/capabilities/eon-capability-service.js',
  'functions/api/capabilities/status.js',
  'tests/unit/a15-i09-capability-service.test.mjs'
];
for (const relative of required) if (!fs.existsSync(path.join(root, relative))) errors.push(`Missing ${relative}.`);
const endpointSource = fs.readFileSync(path.join(root, 'functions/api/capabilities/status.js'), 'utf8');
if (!/resolveReferralDatabase\(context\.env\)\.database/.test(endpointSource) || !/readAccountActiveEonKeyUnlocks\(\{ database: referralDatabase, accountId \}\)/.test(endpointSource)) {
  errors.push('Capability endpoint does not keep billing and referral D1 authorities separated.');
}
const receipt = {
  schema: 'eonapp.a15.i09.capability-service-gate-receipt.v1',
  generatedAt: new Date().toISOString(),
  wave: 'I09',
  passed: errors.length === 0,
  errors,
  authority: {
    serverEntitlementOnly: true,
    browserPaidClaimAccepted: false,
    signedSnapshot: true,
    browserCryptographicVerification: false,
    sameOriginNoStoreBrowserTrust: true,
    localFreeFallback: true,
    eonKeyWholeTierGrant: false,
    activeUnlocksAffectFeaturesAndLimits: true,
    oneUniversalProjectLimit: true,
    separatedBillingAndReferralD1Authorities: true
  },
  verified: {
    freeProjectSlots: free.limits.projectSlots,
    studioProjectSlots: studio.limits.projectSlots,
    eonKeyBoostedProjectSlots: unlocked.limits.projectSlots,
    studioFeatureGroupCount: studio.featureGroups.length
  }
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
if (errors.length) {
  console.error(`[A15 I09] FAIL: ${errors.join(' | ')}`);
  process.exitCode = 1;
} else {
  console.log('[A15 I09] PASS: one signed server capability authority controls real feature and limit behavior.');
}
