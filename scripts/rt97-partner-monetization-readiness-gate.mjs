import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_BIDVERTISER, EON_INFOLINKS, EON_SMARTLINK_PARTNERS, EON_ZYNTENT, getPartnerMonetizationRuntimeConfig } from '../config/rt97-partner-monetization-contract.mjs';
import { buildZyntentSponsoredDiscoveryPayload } from '../functions/_shared/eon-zyntent-sponsored-discovery.js';
import { EON_GUIDE_ROUTES } from '../config/eon-guide-catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

check(read('index.html').includes(EON_BIDVERTISER.websiteVerificationMarker), 'BidVertiser ownership marker missing from root homepage.');
check(EON_BIDVERTISER.publisherAdsEnabledByDefault === false, 'BidVertiser ads must remain disabled by default.');
for (const format of ['popunder','push','injection']) check(EON_BIDVERTISER.forbiddenLaunchFormats.includes(format), `BidVertiser aggressive format not blocked: ${format}`);

for (const guide of EON_GUIDE_ROUTES) {
  const html = read(guide.file);
  check(html.includes('var infolinks_pid = 3447426'), `${guide.file}: Infolinks PID missing.`);
  check(html.includes('//resources.infolinks.com/js/infolinks_main.js'), `${guide.file}: Infolinks script missing.`);
  check(html.includes('<!--INFOLINKS_OFF-->'), `${guide.file}: Infolinks exclusion marker missing.`);
}
for (const privateFile of ['index.html','chat.html','local-ai.html','vault.html','billing.html','workspace.html','profile.html']) {
  check(!read(privateFile).includes('infolinks_main.js'), `${privateFile}: Infolinks must not load on private/app surface.`);
}
for (const headersFile of ['_headers','public/_headers']) {
  const headers = read(headersFile);
  check(headers.includes('/guides/*') && headers.includes('https://resources.infolinks.com'), `${headersFile}: guide-only Infolinks CSP missing.`);
}
check(EON_ZYNTENT.apiBase === 'https://api.zyntent.ai' && EON_ZYNTENT.adsSearchPath === '/public_api/v1/ads/search/', 'Zyntent live test-bench endpoint authority changed.');
const zyntentOff = getPartnerMonetizationRuntimeConfig({});
check(zyntentOff.zyntent.ready === false, 'Zyntent must fail closed without server credentials.');
const zyntentReady = getPartnerMonetizationRuntimeConfig({ EON_ZYNTENT_ENABLED:'true', EON_ZYNTENT_API_KEY:'a'.repeat(64), EON_ZYNTENT_SOURCE_ID:'11111111-2222-4333-8444-555555555555' });
check(zyntentReady.zyntent.ready === true, 'Zyntent readiness contract should accept configured server credentials.');
const zyntentPayload = buildZyntentSponsoredDiscoveryPayload({ query:'laptop for local AI', maxResults:4 }, { cf:{ country:'IN' }, headers:new Headers({ 'accept-language':'en-IN' }) });
check(zyntentPayload.query.text === 'laptop for local AI' && zyntentPayload.countries[0] === 'IN' && zyntentPayload.ads_limit === 4, 'Zyntent server adapter must build the bounded reviewed-intent request.');
check(!JSON.stringify(zyntentPayload).match(/messages|history|memory|apiKey|providerKey|localAnswer|byokAnswer/i), 'Zyntent server adapter must not include private inference context.');
for (const partner of Object.values(EON_SMARTLINK_PARTNERS)) {
  check(partner.enabledByDefault === false && partner.explicitSponsoredClickOnly === true && partner.automaticKeywordRelinking === false, 'SmartLinks must remain explicit, disabled-by-default, and never auto-keyword-linked.');
}

if (failures.length) {
  console.error(JSON.stringify({ ok:false, schema:'eonapp.partner-monetization.gate.rt97-1.v1', failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok:true, schema:'eonapp.partner-monetization.gate.rt97-1.v1', guidesWithInfolinks:EON_GUIDE_ROUTES.length, bidvertiser:'verification-only', zyntent:'server-adapter-ready-credentials-live-validation-required', smartlinks:'disabled-explicit-click-only' }, null, 2));
