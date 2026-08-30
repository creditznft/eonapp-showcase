import fs from 'node:fs';
const required = ['assets/js/utils/share-receipts.js','assets/js/utils/share-performance.js','assets/js/utils/decentralized-receipt-ledger.js','assets/js/utils/share-event-schema.js','assets/js/utils/share-visitor-identity.js','assets/js/utils/share-reward-policy.js','assets/js/social/share-performance-dashboard.js','assets/js/social/social-mission-admin.js'];
const errors=[];
for (const file of required) if (!fs.existsSync(file)) errors.push(`missing ${file}`);
const corpus=required.filter(fs.existsSync).map((f)=>fs.readFileSync(f,'utf8')).join('\n');
for (const needle of ['eon.share-receipt.v1','visitorPseudonym','rewardKey','social-proof-cannot-unlock-subscription','publishShareReceiptWithQueue']) if (!corpus.includes(needle)) errors.push(`final attribution gate missing ${needle}`);
if (/\b(rawIp|ipAddress|latitude|longitude|userAgent)\s*:/i.test(corpus)) errors.push('forbidden raw tracking field found');
const redirects=fs.readFileSync('_redirects','utf8');
if (!redirects.includes('/r/* /referral.html 200')) errors.push('missing decentralized /r route');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('W64-W67 share attribution final gate: PASS.');
