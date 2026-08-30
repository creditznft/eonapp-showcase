import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  isEonOrdinaryAdsAllowed,
  isEonRewardedAdsAllowed
} from '../../functions/_shared/eon-monetization-eligibility.js';
import {
  EON_DISPLAY_AD_PROVIDERS,
  EON_ORDINARY_DISPLAY_PRODUCT_ENABLED,
  EON_STANDARD_AD_SLOTS_PER_VIEW,
  EON_EXOCLICK_DASHBOARD_SAFETY_PROFILE,
  EON_EXOCLICK_SFW_AGE_VERIFICATION,
  EON_EXOCLICK_SFW_BLOCK_AD_TYPES,
  EON_REWARDED_PROVIDER_IDS,
  EON_SPONSORED_SLOT_CATALOG,
  EON_REWARDED_SERVER_VERIFIER_IDS,
  getEonMonetizationRuntimeConfig,
  validateEonMonetizationPolicy
} from '../../assets/js/monetization/eon-monetization-policy.js';
import {
  EON_CREATOR_ORDINARY_DISPLAY_SCRIPT_SOURCES,
  getCreatorCompanionRouteContentSecurityPolicy
} from '../../config/eon-creator-companion-browser-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const EXOCLICK_SCRIPT_HOSTS = ['https://a.magsrv.com'];
const RETIRED_ADSTERRA_HOSTS = [
  'https://pl30881620.effectivecpmnetwork.com',
  'https://www.highperformanceformat.com'
];

function routeCsp(headers, route) {
  const marker = `\n${route}\n  ! Content-Security-Policy\n  Content-Security-Policy: `;
  const at = headers.indexOf(marker);
  if (at < 0) return '';
  const valueStart = at + marker.length;
  const valueEnd = headers.indexOf('\n', valueStart);
  return headers.slice(valueStart, valueEnd < 0 ? headers.length : valueEnd);
}

test('RT96 ordinary display stays product-disabled for an explicit guest', () => {
  const guest = { ok: true, signedIn: false, free: false, paid: false };
  assert.equal(isEonOrdinaryAdsAllowed(guest), false);
  assert.equal(isEonRewardedAdsAllowed(guest), false);
});

test('RT96 ordinary display stays product-disabled for signed-in FREE accounts while rewarded opt-in remains separate', () => {
  const free = { ok: true, signedIn: true, free: true, paid: false };
  assert.equal(isEonOrdinaryAdsAllowed(free), false);
  assert.equal(isEonRewardedAdsAllowed(free), true);
});

test('RT96 ordinary display stays product-disabled for paid accounts', () => {
  const paid = { ok: true, signedIn: true, free: false, paid: true };
  assert.equal(isEonOrdinaryAdsAllowed(paid), false);
  assert.equal(isEonRewardedAdsAllowed(paid), true);
});

test('RT96 ordinary display is always fail-closed for unavailable or ambiguous eligibility', () => {
  assert.equal(isEonOrdinaryAdsAllowed(null), false);
  assert.equal(isEonOrdinaryAdsAllowed({ ok: false, signedIn: false, free: false, paid: false }), false);
  assert.equal(isEonOrdinaryAdsAllowed({ ok: true, free: false, paid: false }), false);
});

test('RT92 rewarded Sponsor Keys require the registered ExoClick server sequence authority', () => {
  assert.deepEqual([...EON_REWARDED_SERVER_VERIFIER_IDS], ['exoclick']);
  const base = {
    EON_MONETIZATION_ROLLOUT: 'production',
    EON_MONETIZATION_ENABLED: 'true',
    EON_SPONSOR_VIDEO_ENABLED: 'true',
    EON_REWARDED_ADS_ENABLED: 'true',
    EON_REWARDED_PROVIDER: 'exoclick',
    EON_REWARDED_PROVIDER_VERIFIED: 'true'
  };
  const noSecret = getEonMonetizationRuntimeConfig({ ...base, EON_REFERRALS_DB: { prepare() {} } });
  assert.equal(noSecret.rewarded.providerVerified, true);
  assert.equal(noSecret.rewarded.serverVerifierReady, false);
  assert.equal(noSecret.rewarded.enabled, false);
  assert.equal(noSecret.rewarded.clientCanComplete, false);

  const noDatabase = getEonMonetizationRuntimeConfig({ ...base, EON_REWARDED_SIGNING_KEY: '0123456789abcdef0123456789abcdef' });
  assert.equal(noDatabase.rewarded.serverVerifierReady, false);
  assert.equal(noDatabase.rewarded.enabled, false);

  const ready = getEonMonetizationRuntimeConfig({
    ...base,
    EON_REWARDED_SIGNING_KEY: '0123456789abcdef0123456789abcdef',
    EON_REFERRALS_DB: { prepare() {} }
  });
  assert.equal(ready.rewarded.enabled, true);
  assert.equal(ready.rewarded.provider, 'exoclick');
  assert.equal(ready.rewarded.serverVerifierReady, true);
  assert.equal(ready.rewarded.verificationMode, 'server-validated-vast-wrapper-sequence');
  assert.equal(ready.rewarded.providerSignedCompletion, false);
  assert.equal(ready.rewarded.clientCanComplete, false);
  assert.equal(ready.rewarded.keysPerCompletion, 1);
});

test('RT92 ExoClick approved zone authority is exact and SFW defense-in-depth is mandatory', () => {
  const exo = EON_DISPLAY_AD_PROVIDERS.exoclick;
  assert.equal(exo.zones['300x250'].zoneId, '6003982');
  assert.equal(exo.zones.native.zoneId, '6004048');
  assert.equal(exo.zones.native.className, 'eas6a97888e20');
  assert.equal(exo.zones.native.desiredLayout, '1x1');
  assert.equal(exo.zones.multiformat.zoneId, '6003992');
  assert.equal(exo.zones.sponsorVast.zoneId, '6004002');
  assert.equal(exo.zones.outstream.zoneId, '6004042');
  assert.equal(exo.zones.native.launchDirectMount, true);
  assert.equal(exo.zones.multiformat.launchDirectMount, true);
  assert.equal(exo.zones.multiformat.rebuiltWithNativeZone, '6004048');
  assert.deepEqual([...exo.supersededZoneIds], ['6003988', '6004050']);
  assert.equal(exo.zones.outstream.launchDirectMount, true);
  assert.equal(exo.zones.sponsorVast.launchPlayback, true);
  assert.equal(exo.zones.sponsorVast.launchRewarded, true);
  assert.equal(EON_EXOCLICK_SFW_BLOCK_AD_TYPES, '101');
  assert.equal(EON_EXOCLICK_SFW_AGE_VERIFICATION, '2');
  assert.match(exo.zones.sponsorVast.vastTag, /ex_av=2/);
  assert.match(exo.zones.sponsorVast.vastTag, /block_ad_types=101/);
  assert.doesNotMatch(JSON.stringify(exo.zones.native), /6003988|6004050/);
  assert.equal(exo.sfw.dsaTransparencyRequired, true);
  assert.equal(EON_EXOCLICK_DASHBOARD_SAFETY_PROFILE.adTransparencyDsa, true);
  assert.equal(EON_EXOCLICK_DASHBOARD_SAFETY_PROFILE.clientHintsMetaTag, false);
  assert.equal(EON_EXOCLICK_DASHBOARD_SAFETY_PROFILE.nativeRefreshSeconds, 60);
  assert.ok(EON_EXOCLICK_DASHBOARD_SAFETY_PROFILE.blockSpecificProducts.includes('Adult: All'));
  assert.ok(EON_EXOCLICK_DASHBOARD_SAFETY_PROFILE.blockSpecificProducts.includes('Gambling: All'));

  assert.equal(EON_SPONSORED_SLOT_CATALOG['apps-native'].preferredFormat, 'multiformat');
  assert.equal(EON_SPONSORED_SLOT_CATALOG['create-native'].preferredFormat, 'multiformat');
  assert.equal(EON_SPONSORED_SLOT_CATALOG['projects-native'].preferredFormat, 'outstream');
  assert.deepEqual(validateEonMonetizationPolicy().errors, []);
});

test('RT96 ordinary-display CSP authority is removed from product surfaces while Sponsor Terminal remains isolated', () => {
  const headers = read('_headers');
  assert.deepEqual([...EON_CREATOR_ORDINARY_DISPLAY_SCRIPT_SOURCES], []);
  assert.equal(headers, read('public/_headers'), 'root and public header mirrors must stay identical');
  for (const route of ['/create', '/create/', '/create.html', '/projects', '/projects/', '/projects.html', '/apps', '/apps.html', '/', '/chat', '/chat/', '/chat.html', '/eoncity', '/eoncity.html']) {
    const csp = routeCsp(headers, route);
    if (!csp) continue;
    for (const host of EXOCLICK_SCRIPT_HOSTS) assert.doesNotMatch(csp, new RegExp(host.replaceAll('.', '\\.')), `${route}: ordinary ExoClick script authority must stay absent`);
    for (const host of RETIRED_ADSTERRA_HOSTS) assert.doesNotMatch(csp, new RegExp(host.replaceAll('.', '\\.')), `${route}: retired Adsterra authority must stay absent`);
  }
  assert.doesNotMatch(getCreatorCompanionRouteContentSecurityPolicy('/create'), /a\.magsrv\.com/);
  assert.doesNotMatch(getCreatorCompanionRouteContentSecurityPolicy('/eoncity'), /a\.magsrv\.com/);
});

test('RT96 legacy display component remains non-mounted archival code while product runtime hard-disables display', () => {
  const source = read('assets/js/monetization/eon-display-slot.js');
  assert.match(source, /dataset\.blockAdTypes = provider\.sfw\.blockAdTypes/);
  assert.doesNotMatch(source, /Adsterra|adsterra/);
  assert.equal(EON_ORDINARY_DISPLAY_PRODUCT_ENABLED, false);
  assert.equal(EON_STANDARD_AD_SLOTS_PER_VIEW, 0);
  const forced = getEonMonetizationRuntimeConfig({ EON_MONETIZATION_ROLLOUT: 'production', EON_MONETIZATION_ENABLED: 'true', EON_DISPLAY_ADS_ENABLED: 'true', EON_EXOCLICK_ENABLED: 'true', EON_EXOCLICK_NATIVE_ENABLED: 'true', EON_EXOCLICK_MULTIFORMAT_ENABLED: 'true', EON_EXOCLICK_OUTSTREAM_ENABLED: 'true' });
  assert.equal(forced.display.enabled, false);
  assert.equal(forced.display.provider, 'none');
});

test('RT92 rewards UI exposes a real server-authoritative Sponsor Key wallet and never client-mints', () => {
  const html = read('rewards.html');
  const page = read('assets/js/access/rewards-status-page.js');
  assert.match(html, /Ordinary display ads are disabled in EONAPP/);
  assert.match(html, /each qualifying server-validated completion grants exactly one consumable Sponsor Key/);
  assert.match(page, /One qualifying completed video adds exactly one consumable Sponsor Key/);
  assert.match(page, /One or several videos unlock short feature sessions/);
  assert.match(page, /Ordinary display advertising is disabled across EONAPP and EON City/);
  assert.match(page, /\/api\/monetization\/rewarded/);
  assert.doesNotMatch(page, /SAFE-OFF until a provider-specific server completion verifier exists/);
  const terminal = read('assets/js/monetization/eon-sponsor-terminal.js');
  assert.match(terminal, /cdn\.fluidplayer\.com/);
  assert.match(terminal, /clientCompletionCanReward: false/);
  assert.match(terminal, /server-authoritative/);
  assert.match(terminal, /sponsor_consent_required/);
  assert.doesNotMatch(terminal, /grantEonKey|awardSponsor|applyAdSponsoredEntitlement/);
});



test('RT92 capability grounding routes Rewards to the live server-authoritative Sponsor Key flow', async () => {
  const { getCapabilityTruthForRoute } = await import('../../assets/js/capabilities/capability-truth-registry.js');
  const rewards = getCapabilityTruthForRoute('/rewards');
  assert.equal(rewards?.id, 'rt92-rewarded-sponsor-keys');
  assert.equal(rewards?.lifecycle, 'active-connected');
  assert.match(rewards?.truthfulUserFacingNote || '', /exactly one consumable Sponsor Key/);
  assert.match(rewards?.truthfulUserFacingNote || '', /server validates the signed VAST event sequence/);
  assert.match(rewards?.truthfulUserFacingNote || '', /never grant a paid subscription/);
});

test('RT96 Production config disables ordinary ExoClick inventory while retaining voluntary rewarded Sponsor video', () => {
  const wrangler = JSON.parse(read('wrangler.jsonc'));
  const env = wrangler.env.production.vars;
  assert.equal(env.EON_DISPLAY_ADS_ENABLED, 'false');
  assert.equal(env.EON_EXOCLICK_ENABLED, 'false');
  assert.equal(env.EON_EXOCLICK_NATIVE_ENABLED, 'false');
  assert.equal(env.EON_EXOCLICK_MULTIFORMAT_ENABLED, 'false');
  assert.equal(env.EON_EXOCLICK_OUTSTREAM_ENABLED, 'false');
  assert.equal(env.EON_SPONSOR_VIDEO_ENABLED, 'true');
  assert.equal(env.EON_REWARDED_ADS_ENABLED, 'true');
  assert.equal(env.EON_REWARDED_PROVIDER, 'exoclick');
  assert.equal(env.EON_REWARDED_PROVIDER_VERIFIED, 'true');
  assert.equal(env.EON_REWARDED_DAILY_CAP, '6');
  assert.equal(env.EON_REWARDED_COOLDOWN_MINUTES, '10');
  assert.equal(Object.hasOwn(env, 'EON_REWARDED_SIGNING_KEY'), false, 'reward signing secret must not be stored in source vars');
});

test('RT92 EON City exposes Sponsor Terminal by explicit navigation only', () => {
  const plans = read('assets/js/work-surface/adapters/eon-plans-panel.js');
  assert.match(plans, /href="\/rewards" data-eon-city-sponsor-terminal/);
  assert.match(plans, /explicit-navigation-only/);
  const city = read('eoncity.html');
  assert.doesNotMatch(city, /data-eon-sponsored-slot|a\.magsrv\.com|cdn\.fluidplayer\.com/);
});

test('RT92 protected release certifies the bundled Sponsor Terminal runtime and emitted same-origin tail media', () => {
  const sync = read('scripts/sync-public-assets.mjs');
  const build = read('scripts/build-production.mjs');
  const workflow = read('.github/workflows/rt92-production-release.yml');
  const rewards = read('assets/js/access/rewards-status-page.js');
  assert.match(rewards, /from '\.\.\/monetization\/eon-sponsor-terminal\.js'/);
  assert.match(sync, /\['assets\/media\/sponsor-terminal', 'assets\/media\/sponsor-terminal'\]/);
  assert.match(build, /eonapp\.monetization\.sponsor-terminal\.rt92\.v2/);
  assert.match(build, /eonapp-sponsor-terminal-tail\.mp4/);
  assert.match(workflow, /rewards\/index\.html/);
  assert.match(workflow, /assets\/media\/sponsor-terminal\/eonapp-sponsor-terminal-tail\.mp4/);
  assert.match(workflow, /eonapp\.monetization\.sponsor-terminal\.rt92\.v2/);
  assert.doesNotMatch(workflow, /test -f .*assets\/js\/monetization\/eon-sponsor-terminal\.js/);
});
