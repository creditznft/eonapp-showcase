import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

const wrangler = read('wrangler.jsonc');
const readiness = read('functions/api/ai/vexrail-readiness.js');
const vexrail = read('functions/api/ai/vexrail.js');

assert(/"EON_ENVIRONMENT"\s*:\s*"production"/.test(wrangler), 'Production environment marker is missing.');
assert(/"EON_VEXRAIL_ROLLOUT"\s*:\s*"production"/.test(wrangler), 'Vexrail production rollout is not enabled in production source.');
assert(/"EON_VEXRAIL_GEO_MODE"\s*:\s*"selected_countries"/.test(wrangler), 'Vexrail must stay selected-country gated.');
const countries = wrangler.match(/"EON_VEXRAIL_COUNTRIES"\s*:\s*"([^"]+)"/)?.[1]?.split(',').map((v) => v.trim().toUpperCase()).filter(Boolean) || [];
assert(countries.includes('IN'), 'India (IN) is missing from the production Vexrail country allowlist.');
assert(!/"EON_VEXRAIL_GEO_MODE"\s*:\s*"all"/.test(wrangler), 'Vexrail production geo mode must not be all.');
assert(/"EON_VEXRAIL_REQUIRE_CF_METADATA"\s*:\s*"true"/.test(wrangler), 'Production must require trusted Cloudflare request metadata.');
assert(/"EON_VEXRAIL_TURNSTILE_MODE"\s*:\s*"required"/.test(wrangler), 'Production Vexrail must keep Turnstile required.');
assert(/evaluateVexrailGeoPolicy\(config, context\.request, context\.env\)/.test(readiness), 'Readiness route must evaluate the live request geo policy.');
for (const field of ['observedCountry', 'geoEligible', 'geoReason', 'geoMode']) {
  assert(new RegExp(`\\b${field}\\b`).test(readiness), `Readiness route is missing safe live geo proof field: ${field}`);
}
assert(/function evaluateVexrailGeoPolicy|export function evaluateVexrailGeoPolicy/.test(vexrail), 'Canonical Vexrail geo evaluator is missing.');
assert(/geoEligible:\s*eligibility\.geo\?\.allowed\s*===\s*true/.test(vexrail), 'Public Vexrail status must expose safe live geo eligibility for browser proof.');
assert(/geoReason:\s*eligibility\.geo\?\.reason/.test(vexrail), 'Public Vexrail status must expose safe live geo reason for browser proof.');
assert(!/publishableKey\s*:\s*config\.publishableKey/.test(readiness), 'Readiness response must not expose the Vexrail publishable key.');
assert(!/secretKey\s*:\s*config\.secretKey/.test(readiness), 'Readiness response must not expose the Vexrail secret key.');

const receipt = {
  schema: 'eonapp.vexrail.india-release-gate.rt97.v1',
  status: errors.length ? 'fail' : 'code-pass-live-india-proof-pending',
  codeReady: errors.length === 0,
  productionGeoMode: 'selected_countries',
  productionCountries: countries,
  indiaConfigured: countries.includes('IN'),
  liveProofRequired: {
    requestOrigin: 'https://eonapp.ch',
    expectedObservedCountry: 'IN',
    expectedGeoEligible: true,
    expectedGeoReason: 'selected_country',
    requiredExecution: 'real Chrome session from an Indian network after protected production deployment'
  },
  errors
};
console.log(JSON.stringify(receipt, null, 2));
if (errors.length) process.exitCode = 1;
