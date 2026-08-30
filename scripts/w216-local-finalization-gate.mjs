import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { RETIRED_REDIRECTS, renderCloudflareRedirects } from '../config/route-contract.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

for (const file of [
  'realm-studio.html', 'assets/js/realm-studio-page.js', 'assets/js/realm/realm-state.js',
  'assets/js/eon-city-3d-station.js', 'assets/js/city/eon-city-3d-model.js',
  'assets/js/city/eon-city-3d-renderer.js', 'assets/js/access/rewards-status-page.js',
  'config/sponsored-discovery-policy.mjs', 'tests/unit/w216-local-finalization.test.mjs'
]) assert.equal(exists(file), true, `missing ${file}`);

const cityEntry = read('eoncity.html');
const city3d = read('eoncity-3d.html');
const station = read('assets/js/eon-city-3d-station.js');
const cityEngine = read('assets/js/city/eon-city-2d-engine.js');
const cityRegistry = read('assets/js/contracts/city/city-landmark-registry.js');
const studio = read('assets/js/realm-studio-page.js');
const realmState = read('assets/js/realm/realm-state.js');
const referral = read('assets/js/utils/referral-par.js');
const landing = read('assets/js/referral-landing-page.js');
const redirects = read('public/_redirects');
const rewards = read('rewards.html');
const rewardsStatus = read('assets/js/access/rewards-status-page.js');
const sponsoredPolicy = read('config/sponsored-discovery-policy.mjs');

assert.match(cityEntry, /data-eon-city-direct-entry/);
assert.match(cityEntry, /eon-city-access-station\.js/);
assert.match(cityEntry, /data-eon-app-shell="1"/);
assert.match(cityEntry, /eon-app-shell\.js/);
assert.doesNotMatch(cityEntry, /<script[^>]+eon-city-play-station\.js|eon-operator-map\.js|eon-city-portal\.js/);
assert.match(city3d, /eon-city-3d-station\.js/);
assert.match(city3d, /Spatial Command Space/i);
assert.match(city3d, /City Overview remains available/i);
assert.match(station, /getEonCity3dCapability/);
assert.match(station, /renderWebglStation/);
assert.match(station, /automaticFallbackTo2d/);
assert.match(cityEngine, /CITY_LANDMARKS\.map\(toCityDistrict\)/);
assert.match(cityEngine, /CITY_FIRST_CIRCUIT/);
assert.match(cityRegistry, /name: 'Realm Relay'/);
assert.match(cityRegistry, /route: '\/realm-studio'/);
assert.match(studio, /createRealmShareLink/);
assert.match(realmState, /publicPublishingActive: false/);
assert.match(realmState, /affiliateActive: false/);
assert.match(realmState, /payoutActive: false/);
assert.match(referral, /REFERRAL_REWARDS_ENABLED = false/);
assert.match(landing, /does not create a reward, click record, central database record, or referral conversion/i);
assert.doesNotMatch(landing, /recordAttributedLinkOpen|\/api\/referrals|fetch\s*\(/);
assert.equal(redirects, renderCloudflareRedirects());
for (const [legacy, canonical] of [
  ['/realm.html', '/eoncity'], ['/realmworld.html', '/eoncity'], ['/team-realm.html', '/eoncity'],
  ['/marketplace.html', '/market'], ['/subscription.html', '/archive'], ['/trade/sandbox', '/insights']
]) assert.equal(RETIRED_REDIRECTS.some((row) => row.from === legacy && row.to === canonical && row.status === 301), true, `${legacy} must remain retired`);
assert.match(rewards, /monetization="disabled"/);
assert.match(rewardsStatus, /No reward or offer campaign is active/);
assert.match(rewardsStatus, /Access Milestones are not active/);
assert.doesNotMatch(rewardsStatus, /fetch\s*\(|XMLHttpRequest|window\.open\(/);
assert.match(sponsoredPolicy, /SPONSORED_DISCOVERY_ACTIVE = false/);
console.log('W216 local finalization gate: PASS (current source only; no commercial or legacy runtime dependency)');
