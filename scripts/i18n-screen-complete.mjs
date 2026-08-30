#!/usr/bin/env node
/**
 * W47 screen-complete i18n gate.
 *
 * Static key coverage alone is not enough. This gate checks launch-critical
 * visible screen copy that may be unkeyed in HTML/JS and must still localize
 * through offline fallback packs when no live translation provider is present.
 */
import { getOfflineScreenTranslation, OFFLINE_SCREEN_TRANSLATIONS } from '../assets/js/utils/offline-screen-translations.js';
import { GENERATED_SCREEN_TRANSLATIONS } from '../assets/js/utils/offline-screen-translations.generated.js';
import { W47_SCREEN_TRANSLATIONS } from '../assets/js/utils/offline-screen-translations.w47.js';
import { W48_SCREEN_TRANSLATIONS } from '../assets/js/utils/offline-screen-translations.w48.js';
import { W56_SCREEN_TRANSLATIONS } from '../assets/js/utils/offline-screen-translations.w56.js';
import { W57_SCREEN_TRANSLATIONS } from '../assets/js/utils/offline-screen-translations.w57.js';
import { W59_SCREEN_TRANSLATIONS } from '../assets/js/utils/offline-screen-translations.w59.js';
import { W62_SCREEN_TRANSLATIONS } from '../assets/js/utils/offline-screen-translations.w62.js';

const SUPPORTED_LANGS = Object.freeze(['es', 'de', 'fr', 'pt', 'ru', 'ar', 'hi', 'zh', 'ja', 'ko']);

const CRITICAL_SCREEN_COPY = Object.freeze([
  // Chat
  { page: 'chat.html', text: 'EONBOT AI Operator', allowBrandSame: true },
  { page: 'chat.html', text: 'Ask, plan, and route work into the cockpit.' },
  { page: 'chat.html', text: 'EONBOT starts in safe guide mode, then connects to your own AI keys or local runtime when you are ready. Try a starter mission, then move serious work into the cockpit.' },
  { page: 'chat.html', text: 'Ask, plan, code, translate, analyze images, and route work across providers. Your keys stay local unless you connect a server runtime.' },
  { page: 'chat.html', text: 'Ask EONBOT' },
  { page: 'chat.html', text: 'Start free setup' },
  { page: 'chat.html', text: 'Setup AI provider' },
  { page: 'chat.html', text: 'Open AI Cockpit →' },
  { page: 'chat.html', text: 'Help me launch a simple website' },
  { page: 'chat.html', text: 'Set up my AI keys safely' },
  { page: 'chat.html', text: 'Explain Vault backup' },
  { page: 'chat.html', text: 'Make a 7-day content plan' },

  // Home
  { page: 'index.html', text: 'Your AI' },
  { page: 'index.html', text: 'business cockpit.' },
  { page: 'index.html', text: 'Start free with EONBOT, then run AI chat, browser tasks, creator workflows, research, Vault recovery, and launch missions from one local-first cockpit. Upgrade only when you need more power.' },
  { page: 'index.html', text: 'Start free' },
  { page: 'index.html', text: 'Open AI Cockpit' },
  { page: 'index.html', text: 'See plans' },
  { page: 'index.html', text: 'One place to command the work, keep the thread, and launch without losing context.' },
  { page: 'index.html', text: 'Start free, prove value, then upgrade.' },
  { page: 'index.html', text: 'Try the cockpit' },
  { page: 'index.html', text: 'Upgrade for serious use' },
  { page: 'index.html', text: 'Keep control' },
  { page: 'index.html', text: 'Ask EONBOT AI' },

  // Vault
  { page: 'vault.html', text: 'EON Vault', allowBrandSame: true },
  { page: 'vault.html', text: 'Your local-first control center: profile, referral earnings, balances, AI keys, NFTs, and backups in one place.' },
  { page: 'vault.html', text: 'Vault command center' },
  { page: 'vault.html', text: 'API Keys & Providers' },
  { page: 'vault.html', text: 'Language & Voice' },
  { page: 'vault.html', text: 'Save language' },
  { page: 'vault.html', text: 'Copy Referral Link' },

  // Marketplace
  { page: 'marketplace.html', text: 'NFT Exchange', allowBrandSame: true },
  { page: 'marketplace.html', text: 'Trade land parcels, AI NFTs, skill packs, datasets, agent profiles, and workflow assets. Use the same engine for EON Team drops and user-made product-backed collectibles.' },
  { page: 'marketplace.html', text: 'Active listings' },
  { page: 'marketplace.html', text: 'Land parcels' },
  { page: 'marketplace.html', text: 'Creator NFTs' },
  { page: 'marketplace.html', text: 'EON Team Genesis', allowBrandSame: true },
  { page: 'marketplace.html', text: 'List a product-backed NFT or AI asset' },
  { page: 'marketplace.html', text: 'Max price (USDT)' },

  // Realm / RealmWorld
  { page: 'realm.html', text: 'Enter EON City' },
  { page: 'realm.html', text: 'EON City 3D', allowBrandSame: true },
  { page: 'realm.html', text: 'Open private workspace' },
  { page: 'realm.html', text: 'Generate My Realm' },
  { page: 'realm.html', text: 'Private workspace' },
  { page: 'realm.html', text: 'My Realm 3D', allowBrandSame: true },
  { page: 'realm.html', text: 'Real 3D roadmap' },
  { page: 'realm.html', text: 'Realm Hub · EON City first' },
  { page: 'realm.html', text: 'EON City World Shell' },
  { page: 'realmworld.html', text: 'EON City + RealmWorld', allowBrandSame: true },
  { page: 'realmworld.html', text: 'EON City · Workstation Realm', allowBrandSame: true },
  { page: 'realmworld.html', text: 'The built-in EON Team city, private AI workstation, Genesis showroom, NPC meeting place, and default world for every user.' },
  { page: 'realmworld.html', text: 'Admin 1 launch commerce' },
  { page: 'realmworld.html', text: 'All launch income to Admin 1' },
  { page: 'realmworld.html', text: 'User-owner splits are disabled until live proof.' },

  // Ad/reward gateway and plans
  { page: 'reward-access.html', text: 'Access Checkpoint' },
  { page: 'reward-access.html', text: 'Unlock access' },
  { page: 'reward-access.html', text: 'Complete this quick sponsor step to continue while supporting free users on EONAPP.' },
  { page: 'reward-access.html', text: 'Ad gateway credits' },
  { page: 'reward-access.html', text: 'Hourly + daily limits' },
  { page: 'reward-access.html', text: 'Ad gateway, not sitewide ads' },
  { page: 'reward-access.html', text: 'Ads only appear on this access page for eligible reward actions. Sensitive pages, Vault, billing, privacy, legal and support stay ad-free.' },
  { page: 'reward-access.html', text: 'Free users supported' },
  { page: 'reward-access.html', text: 'Why this exists' },
  { page: 'subscription.html', text: 'Plans & Pricing' },
  { page: 'subscription.html', text: 'Choose your EONAPP plan' },
  { page: 'subscription.html', text: 'Ad-free experience' },
  { page: 'subscription.html', text: 'Temporary upgrade' },
  { page: 'subscription.html', text: 'Free subscription credits' },

  { page: 'reward-access.html', text: 'Ad access credits' },
  { page: 'reward-access.html', text: 'Real paid subscription upgrades remain proof-gated until server ad completion/postback verification is live.' },
  { page: 'reward-access.html', text: 'Adwixo responsive sponsor' },
  { page: 'reward-access.html', text: 'Adwixo 300×250 sponsor' },
  { page: 'reward-access.html', text: 'Adwixo mobile sponsor' },
  { page: 'reward-access.html', text: 'Adwixo side sponsor' },
  { page: 'reward-access.html', text: 'Ad-free subscribers skip sponsor waits automatically.' },
  { page: 'reward-access.html', text: 'Sponsor inventory is loading on this gateway page. Continue after the short wait.' },
  { page: 'subscription.html', text: '24h Supporter preview' },
  { page: 'subscription.html', text: '7-day Supporter pass' },
  { page: 'reward-access.html', text: 'Adwixo is primary. Monetag is fallback.' },
  { page: 'reward-access.html', text: 'Sponsor access ready. You can continue now.' },

  { page: 'reward-access.html', text: 'Ad-sponsored subscription pass' },
  { page: 'reward-access.html', text: '24h Supporter preview target reached.' },
  { page: 'reward-access.html', text: '7-day Supporter pass target reached.' },
  { page: 'reward-access.html', text: 'These ad-sponsored passes are local, capped and time-limited. Paid/server features still require verified payment or future ad postback proof.' },
  { page: 'reward-access.html', text: 'Ad-sponsored supporter pass activated.' },
  { page: 'subscription.html', text: 'Monthly ad-sponsored Supporter target' },
  { page: 'subscription.html', text: 'Local ad-sponsored access' },
  { page: 'subscription.html', text: 'Server proof required for account-wide subscription upgrades.' },
  { page: 'reward-access.html', text: 'Ad access pass active' },
  { page: 'reward-access.html', text: 'Proof-gated monthly unlock' },

  { page: 'reward-access.html', text: 'Verified rewarded ads' },
  { page: 'reward-access.html', text: 'Website ad gateway' },
  { page: 'reward-access.html', text: 'Monetag rewarded SDK not configured yet.' },
  { page: 'reward-access.html', text: 'Cloudflare postback verification' },
  { page: 'reward-access.html', text: 'Only valued postbacks can unlock account-wide subscription rewards.' },
  { page: 'reward-access.html', text: 'Gateway visit credits remain local and capped.' },

  // Telegram Mini App home
  { page: 'telegram.html', text: 'EON Apps · Telegram Mini App', allowBrandSame: true },
  { page: 'telegram.html', text: 'One EON home inside Telegram.' },
  { page: 'telegram.html', text: 'Use EON Apps from Telegram: claim rewarded Supporter credits, open EON City, ask EONBOT, launch the Vault, and return to the full website anytime.' },
  { page: 'telegram.html', text: 'Checking Telegram session…' },
  { page: 'telegram.html', text: 'Earn free Supporter' },
  { page: 'telegram.html', text: 'Reward Center' },
  { page: 'telegram.html', text: 'Watch verified rewarded ads in Telegram and earn capped credits toward temporary Supporter access.' },
  { page: 'telegram.html', text: 'Join EonApps channel' },
  { page: 'telegram.html', text: 'Official channel' },
  { page: 'telegram.html', text: 'Join EonApps for launch updates, reward events, EON City drops, and support notices.' },
  { page: 'telegram.html', text: 'How rewards stay fair' },
  { page: 'telegram.html', text: 'Cloudflare verifies valued postbacks before account-wide subscription credits are issued.' },
  { page: 'telegram.html', text: 'Open full EONAPP' },

  // W62 Telegram growth, onboarding, profile, and channel-member incentives
  { page: 'telegram.html', text: 'Community rewards' },
  { page: 'telegram.html', text: 'Stay in EonApps, earn better perks.' },
  { page: 'telegram.html', text: 'Channel members unlock rewarded ads, daily pool-point checks, streak bonuses, launch drops, and sponsored Supporter passes. The app stays open, but reward pools belong to the official community.' },
  { page: 'telegram.html', text: 'Join official channel' },
  { page: 'telegram.html', text: 'Earn ad credits' },
  { page: 'onboarding.html', text: 'Connect EON Apps on Telegram' },
  { page: 'onboarding.html', text: 'Join the official channel during setup so rewards, Supporter credits, and EON City drops can find you again.' },
  { page: 'vault.html', text: 'Telegram reward + recovery helper' },
  { page: 'vault.html', text: 'Use Telegram for reward notices and a safe reminder link. Never send raw recovery phrases or unencrypted vault backups to any bot or chat.' },
  { page: 'subscription.html', text: 'Earn ad-sponsored Supporter time' },
  { page: 'subscription.html', text: 'Users who join @EonApps can watch verified rewarded ads in the Mini App and build credits toward temporary Supporter passes.' },
  { page: 'reward-access.html', text: 'Channel members earn more' },
  { page: 'reward-access.html', text: 'Rewards require @EonApps membership so pool drops, ad credits, and Supporter passes go to the official community.' },
]);

const missing = [];
for (const item of CRITICAL_SCREEN_COPY) {
  for (const lang of SUPPORTED_LANGS) {
    const translated = getOfflineScreenTranslation(item.text, lang);
    if (!translated || (!item.allowBrandSame && translated === item.text)) missing.push(`${item.page} :: ${lang} :: ${item.text}`);
  }
}

const report = {
  schema: 'eon.i18n-screen-complete.v2',
  manualEntries: Object.keys(OFFLINE_SCREEN_TRANSLATIONS).length,
  generatedEntries: Object.keys(GENERATED_SCREEN_TRANSLATIONS).length,
  w47Entries: Object.keys(W47_SCREEN_TRANSLATIONS).length,
  w48Entries: Object.keys(W48_SCREEN_TRANSLATIONS).length,
  w56Entries: Object.keys(W56_SCREEN_TRANSLATIONS).length,
  w57Entries: Object.keys(W57_SCREEN_TRANSLATIONS).length,
  w59Entries: Object.keys(W59_SCREEN_TRANSLATIONS).length,
  w62Entries: Object.keys(W62_SCREEN_TRANSLATIONS).length,
  criticalStrings: CRITICAL_SCREEN_COPY.length,
  checkedPairs: CRITICAL_SCREEN_COPY.length * SUPPORTED_LANGS.length,
  languages: SUPPORTED_LANGS,
  missing
};

if (missing.length) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ...report, status: 'PASS' }, null, 2));
