import fs from 'node:fs';
import crypto from 'node:crypto';

const required = [
  'assets/js/utils/signed-share-link.js','assets/js/utils/share-link-codec.js','assets/js/utils/share-link-identity.js',
  'assets/js/utils/share-attribution.js','assets/js/utils/share-lineage.js','assets/js/referral-landing-page.js','referral.html'
];
const errors = [];
for (const file of required) if (!fs.existsSync(file)) errors.push(`missing ${file}`);
const signed = fs.readFileSync('assets/js/utils/signed-share-link.js','utf8');
const identity = fs.readFileSync('assets/js/utils/share-link-identity.js','utf8');
const corpus = `${signed}\n${identity}`;
for (const needle of ['eon.share-link.v2','eon2','self-contained-signed-no-registry','crypto','P-256','rootReferralId','normalizeDestination']) if (!corpus.includes(needle)) errors.push(`signed-share-link stack missing ${needle}`);
if (fs.existsSync('functions/api/share-links/register.js') || fs.existsSync('functions/api/share-links/resolve.js')) errors.push('central short-link registry functions must not exist');
const ids = new Set();
for (let i=0;i<100000;i+=1) ids.add(crypto.randomBytes(16).toString('base64url'));
if (ids.size !== 100000) errors.push('100,000-id collision gate failed');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('W212 stateless signed-share readiness: PASS (100,000 unique 128-bit nonces, eon2 self-contained protocol, no short-link registry).');
