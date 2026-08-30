#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonCityAccessDistributionTruth } from '../assets/js/contracts/city/eon-city-access-distribution-projection.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const checks = [];
const check = (id, pass, detail = '') => checks.push({ id, pass: Boolean(pass), detail: String(detail) });
const truth = getEonCityAccessDistributionTruth();
const projection = read('assets/js/contracts/city/eon-city-access-distribution-projection.js');
const membership = read('assets/js/contracts/city/w659g/eon-city-w659g-membership-console.js');
const plans = read('assets/js/work-surface/adapters/eon-plans-panel.js');
const capture = read('assets/js/contracts/city/w659g/eon-city-w659g-creator-capture.js');
const share = read('assets/js/city/eon-city-sharing-center.js');

check('canonical-capability-only', truth.consumesCanonicalCapabilityServiceOnly && /fetchEonCapabilitySnapshot/.test(projection), 'same-origin capability service');
check('local-claim-rejected', truth.localStorageEntitlementAccepted === false && !/localStorage.*tier|tier.*localStorage/i.test(projection), 'no browser tier authority');
check('base-city-not-paywalled', truth.baseCityPaywalled === false && truth.signalFrontierPaywalled === false, 'base world remains available');
check('capture-not-paywalled', truth.creatorCapturePaywalled === false && /captureRequiresPaidTier: false/.test(projection), 'local capture');
check('sharing-not-paywalled', truth.sharingPaywalled === false, 'reviewed sharing');
check('whole-tier-grant-forbidden', truth.eonKeyWholeTierGrantAllowed === false && /eonKeysGrantWholeTier: false/.test(projection), 'bounded unlocks');
check('subscription-grant-forbidden', truth.eonKeySubscriptionGrantAllowed === false, 'server billing only');
check('provider-credit-forbidden', truth.eonKeyProviderCreditAllowed === false, 'BYOK/local remains separate');
check('membership-joins-capability', /fetchEonCityAccessProjection/.test(membership), 'billing plus capability');
check('plans-show-unlocks', /Active EONKEY unlocks/.test(plans), 'bounded unlock summary');
check('safe-revocation-copy', /Downgrade\/revocation safety/.test(plans), 'Free fallback without deletion');
check('checkout-requires-verified-access', /accessVerified/.test(plans) && /checkoutActive = verified && accessVerified/.test(plans), 'fail closed');
check('capture-core-owned', /createEonCreatorCaptureController/.test(capture) && /projectEonCityDistribution/.test(capture), 'City adapter only');
check('share-receipt-bounded', /recordEonShareW753ReviewedHandoffReceipt/.test(share), 'reviewed receipt');
check('share-no-reward', /does not track or confirm publication, issue an EONKEY or award a referral\/XP reward/.test(share), 'no duplicate reward');
check('no-auto-distribution', truth.automaticUpload === false && truth.automaticPublishing === false, 'explicit platform action');
check('private-content-excluded', truth.privateContentStored === false && /accountIdStored: false/.test(projection) && /sourceRecordIdStored: false/.test(projection), 'bounded projection');

const receipt = { schema: 'eonapp.a15.c07.city-access-distribution-gate.v1', wave: 'C07', generatedAt: new Date().toISOString(), ok: checks.every(c => c.pass), passed: checks.filter(c => c.pass).length, total: checks.length, checks, limitations: ['Source-only certification.', 'Live Dodo checkout, downgrade and webhook reversal require external test-mode evidence.', 'No public posting success is claimed.'] };
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.id} — ${c.detail}`);
console.log(`\nA15 C07 City Access & Distribution: ${receipt.passed}/${receipt.total}`);
fs.mkdirSync(path.join(ROOT, 'artifacts/a15'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts/a15/A15_C07_CITY_ACCESS_DISTRIBUTION_GATE.json'), JSON.stringify(receipt, null, 2) + '\n');
if (!receipt.ok) process.exitCode = 1;
